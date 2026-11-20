from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{id}", response_model=UserResponse)
def get_user_by_id(
    id: int,
    db: Session = Depends(get_db),
):
    """Retrieve an entrepreneur's public/profile details by ID."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {id} not found",
        )
    return user


@router.patch("/{id}", response_model=UserResponse)
def update_user_profile(
    id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
):
    """Update profile information, enterprise details, or financial targets."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {id} not found",
        )

    update_data = user_update.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"]:
        existing = db.query(User).filter(User.email == update_data["email"], User.id != id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email address is already in use by another user",
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user
