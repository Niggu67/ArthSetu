from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.user import User
from app.models.progress import UserProgress
from app.schemas.progress import ProgressCreate, ProgressResponse

router = APIRouter(prefix="/progress", tags=["User Progress"])


@router.get("/{user_id}", response_model=List[ProgressResponse])
def get_user_progress(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve all learning module progress records for a specified entrepreneur."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    records = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    return records


@router.post("", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED)
def record_progress(
    payload: ProgressCreate,
    db: Session = Depends(get_db),
):
    """Record or update progress in a financial education or scheme guidance module."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {payload.user_id} not found",
        )

    # Check if a progress entry for this module already exists for user
    existing = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == payload.user_id, UserProgress.module_id == payload.module_id)
        .first()
    )

    completed_at = payload.completed_at
    if payload.completion_percentage >= 100.0 or payload.completion_status == "completed":
        payload.completion_status = "completed"
        if not completed_at:
            completed_at = datetime.now(timezone.utc)

    if existing:
        existing.completion_status = payload.completion_status
        existing.completion_percentage = payload.completion_percentage
        existing.completed_at = completed_at
        db.commit()
        db.refresh(existing)
        return existing

    new_record = UserProgress(
        user_id=payload.user_id,
        module_id=payload.module_id,
        completion_status=payload.completion_status,
        completion_percentage=payload.completion_percentage,
        completed_at=completed_at,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record
