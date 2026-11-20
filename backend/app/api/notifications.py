from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationCreate, NotificationUpdate

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/{user_id}", response_model=List[NotificationResponse])
def get_user_notifications(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve all notifications, scheme alerts, and updates for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return notifs


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
):
    """Create a new notification or system alert for a user."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {payload.user_id} not found",
        )

    notif = Notification(
        user_id=payload.user_id,
        title=payload.title,
        message=payload.message,
        read_status=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {id} not found",
        )

    notif.read_status = True
    db.commit()
    db.refresh(notif)
    return notif
