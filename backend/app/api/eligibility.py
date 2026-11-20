from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.user import User
from app.models.scheme import GovernmentScheme
from app.schemas.eligibility import EligibilityCheckRequest, EligibilityCheckResponse
from app.services.eligibility_service import evaluate_eligibility

router = APIRouter(prefix="/eligibility", tags=["Eligibility Assessment"])


@router.post("", response_model=EligibilityCheckResponse)
def check_eligibility(
    payload: EligibilityCheckRequest,
    db: Session = Depends(get_db),
):
    """
    Evaluates enterprise profile parameters against available government schemes.
    Returns calculated eligibility score, matched schemes, specific reasons,
    missing prerequisites, and consolidated required documents with an explicit
    informational disclaimer.
    """
    # If user_id is provided, populate defaults from user's saved profile if omitted
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if user:
            if payload.business_type is None:
                payload.business_type = user.business_type
            if payload.annual_income is None:
                payload.annual_income = user.annual_income
            if payload.years_in_business is None:
                payload.years_in_business = user.years_in_business
            if payload.location is None:
                payload.location = user.location

    schemes = db.query(GovernmentScheme).all()
    if not schemes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No government schemes found in database to evaluate against",
        )

    if payload.scheme_id:
        target_scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == payload.scheme_id).first()
        if not target_scheme:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scheme with ID {payload.scheme_id} does not exist",
            )

    result = evaluate_eligibility(payload, schemes)
    return result
