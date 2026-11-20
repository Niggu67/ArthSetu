from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db
from app.models.scheme import GovernmentScheme
from app.schemas.scheme import SchemeResponse, SchemeListResponse

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])

# Sentinel value used by the front-end category chip "Women / Special"
_WOMEN_FILTER_SENTINEL = "women"


def _scheme_is_women_special(scheme: GovernmentScheme) -> bool:
    """
    Return True when a scheme explicitly targets women or special social categories
    using structured eligibility_criteria fields.  Category keyword matching is used
    only as a secondary fallback so that existing schemes without structured fields
    are not silently excluded.
    """
    criteria = scheme.eligibility_criteria or {}

    # 1. Primary: check target_genders structured field
    target_genders = [g.lower() for g in criteria.get("target_genders", [])]
    if "female" in target_genders or "women" in target_genders:
        return True

    # 2. Primary: check target_social_categories structured field
    target_social = [s.lower() for s in criteria.get("target_social_categories", [])]
    women_social_values = {"women", "sc", "st", "obc", "minority", "specially abled"}
    if target_social and not {"all"}.issuperset(set(target_social)):
        if any(v in women_social_values for v in target_social):
            return True

    # 3. Fallback: category text contains "women"
    if "women" in (scheme.category or "").lower():
        return True

    return False


@router.get("", response_model=SchemeListResponse)
def list_schemes(
    category: Optional[str] = Query(None, description="Filter schemes by category"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    db: Session = Depends(get_db),
):
    """
    List all verified reference government schemes available to rural entrepreneurs.
    Supports filtering by category and search keyword.
    The special category value 'women' activates structured eligibility field matching
    (target_genders / target_social_categories) with category name as fallback.
    """
    query = db.query(GovernmentScheme)

    if category:
        cat_lower = category.strip().lower()
        if cat_lower == _WOMEN_FILTER_SENTINEL:
            # Pull all schemes and post-filter using structured fields
            all_schemes = query.all()
            schemes = [s for s in all_schemes if _scheme_is_women_special(s)]
            if search:
                term = search.strip().lower()
                schemes = [
                    s for s in schemes
                    if term in s.name.lower()
                    or term in s.description.lower()
                    or term in (s.benefits or "").lower()
                ]
            schemes.sort(key=lambda s: s.id)
            return SchemeListResponse(
                total=len(schemes),
                schemes=[SchemeResponse.model_validate(s) for s in schemes],
            )
        else:
            query = query.filter(GovernmentScheme.category.ilike(f"%{category.strip()}%"))

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                GovernmentScheme.name.ilike(term),
                GovernmentScheme.description.ilike(term),
                GovernmentScheme.benefits.ilike(term),
            )
        )

    schemes = query.order_by(GovernmentScheme.id.asc()).all()
    return SchemeListResponse(
        total=len(schemes),
        schemes=[SchemeResponse.model_validate(s) for s in schemes],
    )


@router.get("/{id}", response_model=SchemeResponse)
def get_scheme_by_id(
    id: int,
    db: Session = Depends(get_db),
):
    """Retrieve detailed information and eligibility criteria for a specific scheme."""
    scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Government scheme with ID {id} not found",
        )
    return scheme
