from typing import List, Dict, Any, Optional
from app.models.scheme import GovernmentScheme
from app.schemas.eligibility import (
    EligibilityCheckRequest,
    SchemeEligibilityDetail,
    EligibilityCheckResponse,
)


def evaluate_single_scheme(
    scheme: GovernmentScheme,
    profile: Dict[str, Any],
) -> SchemeEligibilityDetail:
    """
    Evaluates a business profile against a specific government scheme's eligibility rules.
    Returns calculated score, eligibility flag, reasons, missing requirements, and document checklist.
    """
    criteria: Dict[str, Any] = scheme.eligibility_criteria or {}
    score = 0.0
    reasons: List[str] = []
    missing_requirements: List[str] = []

    business_type = (profile.get("business_type") or "").strip().lower()
    annual_income = profile.get("annual_income")
    years_in_business = profile.get("years_in_business")
    gender = (profile.get("gender") or "").strip().lower()
    social_category = (profile.get("social_category") or "").strip().lower()

    # 1. Business Type Compatibility (Weight: 35 points)
    allowed_types = [t.lower() for t in criteria.get("allowed_business_types", ["all"])]
    if "all" in allowed_types:
        score += 35.0
        reasons.append(f"Scheme is broadly accessible to all micro-enterprises, including your sector.")
    elif business_type and any(t in business_type or business_type in t for t in allowed_types):
        score += 35.0
        reasons.append(f"Your sector ('{profile.get('business_type')}') is an eligible business activity.")
    elif not business_type:
        score += 15.0
        missing_requirements.append("Business sector not specified; please verify if your specific activity is covered.")
    else:
        missing_requirements.append(
            f"Scheme prioritizes: {', '.join(criteria.get('allowed_business_types', []))}. Your business type '{profile.get('business_type')}' may require special approval."
        )

    # 2. Income / Turnover Threshold (Weight: 25 points)
    max_income = criteria.get("max_annual_income")
    min_income = criteria.get("min_annual_income")
    if annual_income is not None:
        if max_income and annual_income > max_income:
            missing_requirements.append(
                f"Annual income of ₹{annual_income:,.0f} exceeds the maximum scheme ceiling of ₹{max_income:,.0f}."
            )
        elif min_income and annual_income < min_income:
            missing_requirements.append(
                f"Annual income of ₹{annual_income:,.0f} is below the scheme minimum threshold of ₹{min_income:,.0f}."
            )
        else:
            score += 25.0
            reasons.append(f"Annual income of ₹{annual_income:,.0f} satisfies the financial eligibility brackets.")
    else:
        # If income not provided, award partial score
        score += 15.0
        missing_requirements.append("Annual income details not provided for exact financial band verification.")

    # 3. Business Vintage / Experience (Weight: 20 points)
    min_years = criteria.get("min_years_in_business", 0)
    max_years = criteria.get("max_years_in_business")
    if years_in_business is not None:
        if years_in_business < min_years:
            missing_requirements.append(
                f"Requires at least {min_years} year(s) in operation (current: {years_in_business} year(s))."
            )
        elif max_years and years_in_business > max_years:
            missing_requirements.append(
                f"Targeted at startups under {max_years} years (current: {years_in_business} year(s))."
            )
        else:
            score += 20.0
            if min_years == 0:
                reasons.append("New and existing rural enterprises are both eligible (no minimum operational history required).")
            else:
                reasons.append(f"Business operating track record of {years_in_business} year(s) satisfies the minimum requirement.")
    else:
        score += 15.0

    # 4. Demographic & Target Group Priority (Weight: 20 points)
    target_genders = [g.lower() for g in criteria.get("target_genders", ["all"])]
    target_categories = [c.lower() for c in criteria.get("target_social_categories", ["all"])]

    demographic_matched = False
    if "all" in target_genders and "all" in target_categories:
        score += 20.0
        reasons.append("Scheme is open to entrepreneurs of all backgrounds and demographics.")
        demographic_matched = True
    else:
        # Check target gender (e.g., Stand-Up India or Women-focused initiatives)
        gender_match = ("all" in target_genders) or (gender and gender in target_genders)
        cat_match = ("all" in target_categories) or (social_category and social_category in target_categories)

        if gender_match and cat_match:
            score += 20.0
            reasons.append("You qualify under the targeted priority entrepreneur category.")
            demographic_matched = True
        elif gender_match or cat_match:
            score += 12.0
            reasons.append("Partially matches the target beneficiary demographic guidelines.")
        else:
            missing_requirements.append(
                f"Scheme gives special preference to: {', '.join(criteria.get('target_genders', []))} / {', '.join(criteria.get('target_social_categories', []))}."
            )

    score = round(min(max(score, 0.0), 100.0), 1)
    is_eligible = score >= 55.0

    return SchemeEligibilityDetail(
        scheme_id=scheme.id,
        scheme_name=scheme.name,
        category=scheme.category,
        eligibility_score=score,
        is_eligible=is_eligible,
        reasons=reasons,
        missing_requirements=missing_requirements,
        required_documents=scheme.required_documents or [],
        official_link=scheme.official_link,
    )


def evaluate_eligibility(
    profile_data: EligibilityCheckRequest,
    schemes: List[GovernmentScheme],
) -> EligibilityCheckResponse:
    """
    Evaluates multiple schemes against a user's entrepreneurial profile.
    Returns overall score, evaluated schemes, reasons, missing requirements, and document checklist.
    """
    profile_dict = profile_data.model_dump()

    evaluated_schemes: List[SchemeEligibilityDetail] = []
    for scheme in schemes:
        if profile_data.scheme_id and scheme.id != profile_data.scheme_id:
            continue
        detail = evaluate_single_scheme(scheme, profile_dict)
        evaluated_schemes.append(detail)

    # Sort evaluated schemes by eligibility score descending
    evaluated_schemes.sort(key=lambda x: x.eligibility_score, reverse=True)

    # Calculate overall eligibility score: highest score among matching schemes or average of top 3
    if evaluated_schemes:
        top_scores = [s.eligibility_score for s in evaluated_schemes[:3]]
        overall_score = round(sum(top_scores) / len(top_scores), 1)
    else:
        overall_score = 0.0

    # Aggregate consolidated reasons, missing requirements, and documents
    all_reasons = []
    all_missing = []
    all_docs_set = set()

    for item in evaluated_schemes:
        if item.is_eligible:
            for r in item.reasons:
                if r not in all_reasons:
                    all_reasons.append(r)
        for m in item.missing_requirements:
            if m not in all_missing:
                all_missing.append(m)
        for doc in item.required_documents:
            all_docs_set.add(doc)

    return EligibilityCheckResponse(
        overall_eligibility_score=overall_score,
        potentially_eligible_schemes=evaluated_schemes,
        reasons=all_reasons[:5],  # top consolidated reasons
        missing_requirements=all_missing[:5],  # top consolidated missing points
        required_documents=sorted(list(all_docs_set)),
    )
