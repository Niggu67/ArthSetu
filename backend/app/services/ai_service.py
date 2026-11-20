import re
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.scheme import GovernmentScheme
from app.schemas.ai import AIChatRequest, AIChatResponse, SuggestedAction
from app.services.ai_provider import (
    BaseAIProvider,
    get_ai_provider,
    MissingAPIKeyError,
    AIProviderError,
)


def find_relevant_schemes(
    query: str, db: Session, user: Optional[User] = None, limit: int = 3
) -> List[GovernmentScheme]:
    """
    Modular scheme retrieval service.
    Retrieves only the most relevant schemes for the user query and profile
    rather than unnecessarily sending the entire database on every turn.
    Designed for easy extension with vector or hybrid search in future phases.
    """
    all_schemes = db.query(GovernmentScheme).all()
    if not all_schemes:
        return []

    q_lower = query.lower()
    scored_schemes: List[Tuple[int, GovernmentScheme]] = []

    for s in all_schemes:
        score = 0
        name_lower = s.name.lower()
        category_lower = s.category.lower()
        desc_lower = s.description.lower()

        # Direct name/acronym match gets top weight
        if "mudra" in q_lower or "pmmy" in q_lower:
            if "mudra" in name_lower or "pmmy" in name_lower:
                score += 50
        if "pmegp" in q_lower:
            if "pmegp" in name_lower or "employment generation" in name_lower:
                score += 50
        if "stand-up" in q_lower or "standup" in q_lower:
            if "stand-up" in name_lower or "standup" in name_lower:
                score += 50
        if "pmfme" in q_lower or "food processing" in q_lower:
            if "pmfme" in name_lower or "food processing" in name_lower or "food processing" in category_lower:
                score += 50
        if "acabc" in q_lower or "agri-clinic" in q_lower or "agriclinic" in q_lower:
            if "acabc" in name_lower or "agri-clinics" in name_lower or "agriculture" in category_lower:
                score += 50

        # General keyword matching
        keywords = re.findall(r"\w+", q_lower)
        for kw in keywords:
            if len(kw) < 4:
                continue
            if kw in name_lower:
                score += 10
            if kw in category_lower:
                score += 8
            if kw in desc_lower:
                score += 4

        # User business profile affinity
        if user:
            if user.business_type and user.business_type.lower() in category_lower:
                score += 5
            if user.financial_goals and "loan" in user.financial_goals.lower() and "loan" in category_lower:
                score += 3
            if user.financial_goals and "subsidy" in user.financial_goals.lower() and "subsidy" in category_lower:
                score += 3

        scored_schemes.append((score, s))

    # Sort descending by relevance score
    scored_schemes.sort(key=lambda x: x[0], reverse=True)

    # If user asks broadly about schemes/help and top score is 0, return top 2 schemes
    if scored_schemes and scored_schemes[0][0] == 0:
        if any(term in q_lower for term in ["scheme", "loan", "subsidy", "help", "fund", "start", "business"]):
            return [s for _, s in scored_schemes[:2]]
        return []

    # Return top non-zero matches up to limit
    results = [s for score, s in scored_schemes if score > 0]
    return results[:limit]


class AIService:
    """Core AI Guidance orchestrator for ArthSetu."""

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        self.provider = provider or get_ai_provider()

    def build_system_prompt(
        self, user: User, relevant_schemes: List[GovernmentScheme], target_language: str
    ) -> str:
        lang_instruction = {
            "mr": "Respond in simple, polite, professional Marathi (मराठी) suitable for rural micro-entrepreneurs.",
            "hi": "Respond in simple, polite, professional Hindi (हिंदी) suitable for rural micro-entrepreneurs.",
            "en": "Respond in simple, clear, professional English suitable for rural micro-entrepreneurs.",
        }.get(target_language, "Respond in simple, clear language.")

        # Format user context
        user_context_parts = [
            f"- Entrepreneur Name: {user.name}",
            f"- Business Name: {user.business_name or 'Not specified'}",
            f"- Enterprise Sector: {user.business_type or 'General Micro-Enterprise'}",
            f"- Location: {user.location or 'Rural India'}",
            f"- Operating Vintage: {f'{user.years_in_business} years' if user.years_in_business is not None else 'Startup / Planning stage'}",
            f"- Annual Turnover: {f'₹{user.annual_income:,.2f}' if user.annual_income else 'Under ₹5 Lakhs'}",
            f"- Stated Financial Goals: {user.financial_goals or 'Business growth and capital'}",
        ]
        user_context_str = "\n".join(user_context_parts)

        # Format grounded scheme information
        if relevant_schemes:
            schemes_str_parts = []
            for s in relevant_schemes:
                schemes_str_parts.append(
                    f"### [SCHEME_ID: {s.id}] {s.name}\n"
                    f"- Category: {s.category}\n"
                    f"- Description: {s.description}\n"
                    f"- Key Benefits: {s.benefits}\n"
                    f"- Official Portal: {s.official_link}\n"
                    f"- Required Documents: {', '.join(s.required_documents) if isinstance(s.required_documents, list) else s.required_documents}\n"
                )
            schemes_context = "\n".join(schemes_str_parts)
        else:
            schemes_context = (
                "No specific government schemes were directly matched for this query in ArthSetu's verified database. "
                "Explicitly inform the user that ArthSetu only references verified Indian schemes and does not guess."
            )

        system_prompt = f"""You are ArthSetu AI, an accessible financial guidance assistant specifically designed for rural Indian micro-entrepreneurs.
You are part of the ArthSetu platform (अर्थसेतू).

LANGUAGE REQUIREMENT:
{lang_instruction}

AUTHENTICATED ENTREPRENEUR PROFILE:
{user_context_str}

VERIFIED ARTHSETU DATABASE SCHEMES CONTEXT:
{schemes_context}

CRITICAL OPERATING RULES & SAFETY:
1. Grounding in Database: When discussing government schemes, use ONLY the verified scheme information provided above. Never fabricate scheme names, eligibility rules, interest rates, deadlines, or benefits. If the database lacks details for what the user asks, explicitly state that ArthSetu does not currently have verified information on that program instead of speculating.
2. Scheme Citations: When you reference a scheme from the verified context above, ALWAYS include its exact tag like [SCHEME_ID: {relevant_schemes[0].id if relevant_schemes else 1}] in your explanation so the platform can render direct navigation buttons for the entrepreneur.
3. No False Guarantees: Never claim or guarantee loan sanctions, subsidies, or scheme approvals. Approvals are solely decided by the respective banks or government ministries.
4. Authority Impersonation: Never claim to be a government official, bank officer, or certified financial advisor. You provide guidance and education only.
5. No Application Submission: Never claim to submit applications or access official government application files. Explain that applications must be submitted on official portals or bank branches.
6. Educational Guidance on Investments & Credit: For questions about loans, credit scores, insurance, or investments, give simple, empowering educational explanations. For investments, emphasize safe basics (emergency savings, recurring deposits) and never provide speculative buy/sell advice.
7. Tone & Simplicity: Be encouraging, respectful, clear, and avoid heavy financial jargon. Use relatable rural micro-enterprise examples (e.g., flour mills, kirana stores, tailoring, dairy, pottery, agro-services).
"""
        return system_prompt

    async def chat(self, request: AIChatRequest, user: User, db: Session) -> AIChatResponse:
        """Process chat turn with authenticated user profile, relevant scheme retrieval, and provider abstraction."""
        # 1. Determine target language
        target_language = request.language or user.language_preference or "en"

        # 2. Retrieve only relevant schemes
        relevant_schemes = find_relevant_schemes(request.message, db, user=user)

        # 3. Build grounded system prompt
        system_prompt = self.build_system_prompt(user, relevant_schemes, target_language)

        # 4. Prepare message payload for provider
        provider_messages = []
        for h in request.history[-6:]:  # Keep recent turns in active session
            provider_messages.append({"role": h.role, "content": h.content})
        provider_messages.append({"role": "user", "content": request.message})

        # 5. Call provider with error handling
        try:
            assistant_reply = await self.provider.generate_response(
                messages=provider_messages, system_prompt=system_prompt
            )
        except MissingAPIKeyError as err:
            # Return clearly labeled development advisory message rather than crashing
            config_advisory = (
                f"[ArthSetu System Advisory: AI provider API key is not configured]\n\n"
                f"ArthSetu AI requires an API key to generate live guidance.\n\n"
                f"How to configure locally:\n"
                f"1. Open 'backend/.env'.\n"
                f"2. Set '{err.env_var}=your_key_here' (for Gemini, get a key at https://aistudio.google.com/).\n"
                f"3. Set 'AI_PROVIDER={err.provider.lower()}'.\n"
                f"4. Restart the backend service.\n\n"
                f"Note: This is an administrative configuration message and does not constitute AI financial guidance."
            )
            return AIChatResponse(
                assistant_message=config_advisory,
                relevant_scheme_ids=[],
                suggested_actions=[],
            )
        except AIProviderError as err:
            error_message = (
                f"ArthSetu AI temporarily encountered a provider issue: {str(err)}. "
                f"Please verify your network connectivity or API quota and try again."
            )
            return AIChatResponse(
                assistant_message=error_message,
                relevant_scheme_ids=[],
                suggested_actions=[],
            )

        # 6. Extract referenced scheme IDs from reply or retrieved schemes
        found_ids: List[int] = []
        # Pattern 1: [SCHEME_ID: X]
        id_matches = re.findall(r"\[SCHEME_ID:\s*(\d+)\]", assistant_reply)
        for m in id_matches:
            val = int(m)
            if val not in found_ids:
                found_ids.append(val)

        # Pattern 2: Check acronyms (PMMY, Mudra, PMEGP, PMFME, Stand-Up, ACABC) or names in reply
        for s in relevant_schemes:
            if s.id not in found_ids:
                acronyms = ["pmmy", "mudra", "pmegp", "pmfme", "stand-up", "acabc"]
                matched_acronym = any(acr in s.name.lower() and acr in assistant_reply.lower() for acr in acronyms)
                if matched_acronym or s.name.lower() in assistant_reply.lower():
                    found_ids.append(s.id)

        # Pattern 3: Fallback for regional script replies (Marathi/Hindi) where user inquired about schemes
        if not found_ids and relevant_schemes and any(term in request.message.lower() for term in ["scheme", "योजना", "लोन", "कर्ज", "अनुदान", "subsidy", "loan"]):
            for s in relevant_schemes[:2]:
                found_ids.append(s.id)

        # Clean tags from user-facing text
        clean_reply = re.sub(r"\[SCHEME_ID:\s*\d+\]", "", assistant_reply).strip()

        # 7. Generate contextual suggested actions
        suggested_actions: List[SuggestedAction] = []
        for sid in found_ids:
            scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == sid).first()
            if scheme:
                suggested_actions.append(
                    SuggestedAction(
                        type="view_scheme",
                        label=f"View {scheme.name[:24]}...",
                        href=f"/schemes/{scheme.id}",
                        scheme_id=scheme.id,
                    )
                )
                suggested_actions.append(
                    SuggestedAction(
                        type="check_eligibility",
                        label="Check Eligibility",
                        href=f"/eligibility?scheme_id={scheme.id}",
                        scheme_id=scheme.id,
                    )
                )

        # Check if financial learning is relevant
        lower_text = (request.message + " " + clean_reply).lower()
        if any(term in lower_text for term in ["learn", "credit score", "bookkeeping", "interest rate", "insurance", "digital banking", "cibil"]):
            suggested_actions.append(
                SuggestedAction(
                    type="start_learning",
                    label="Explore Financial Education",
                    href="/learn",
                )
            )

        return AIChatResponse(
            assistant_message=clean_reply,
            relevant_scheme_ids=found_ids,
            suggested_actions=suggested_actions,
        )
