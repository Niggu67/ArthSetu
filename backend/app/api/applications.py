from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.user import User
from app.models.scheme import GovernmentScheme
from app.models.application import Application
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse

router = APIRouter(prefix="/applications", tags=["Applications"])

VALID_STATUSES = {"draft", "submitted", "under_review", "approved", "rejected"}


@router.get("/{user_id}", response_model=List[ApplicationResponse])
def get_user_applications(
    user_id: int,
    db: Session = Depends(get_db),
):
    """List all scheme applications submitted or drafted by a specific entrepreneur."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    apps = db.query(Application).filter(Application.user_id == user_id).order_by(Application.created_at.desc()).all()
    return apps


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
):
    """Create or draft a new application for a government scheme."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {payload.user_id} not found",
        )

    scheme = db.query(GovernmentScheme).filter(GovernmentScheme.id == payload.scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Government scheme with ID {payload.scheme_id} not found",
        )

    if payload.status.lower() not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid application status. Allowed values: {', '.join(sorted(VALID_STATUSES))}",
        )

    app_instance = Application(
        user_id=payload.user_id,
        scheme_id=payload.scheme_id,
        status=payload.status.lower(),
        notes=payload.notes,
    )
    db.add(app_instance)
    db.commit()
    db.refresh(app_instance)
    return app_instance


@router.patch("/{id}", response_model=ApplicationResponse)
def update_application(
    id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
):
    """Update application status or append administrative notes."""
    app_instance = db.query(Application).filter(Application.id == id).first()
    if not app_instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {id} not found",
        )

    if payload.status is not None:
        norm_status = payload.status.lower()
        if norm_status not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid application status. Allowed values: {', '.join(sorted(VALID_STATUSES))}",
            )
        app_instance.status = norm_status

    if payload.notes is not None:
        app_instance.notes = payload.notes

    db.commit()
    db.refresh(app_instance)
    return app_instance
