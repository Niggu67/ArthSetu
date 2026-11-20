from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class NotificationCreate(BaseModel):
    user_id: int = Field(..., description="Recipient user ID")
    title: str = Field(..., min_length=1, max_length=255, description="Notification subject")
    message: str = Field(..., min_length=1, description="Notification text")


class NotificationUpdate(BaseModel):
    read_status: bool = Field(..., description="Mark as read (true) or unread (false)")


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    read_status: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
