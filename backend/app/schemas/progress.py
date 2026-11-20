from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProgressCreate(BaseModel):
    user_id: int = Field(..., description="ID of the user")
    module_id: str = Field(..., min_length=1, max_length=100, description="Unique identifier of educational module")
    completion_status: str = Field("in_progress", description="Status (not_started, in_progress, completed)")
    completion_percentage: float = Field(0.0, ge=0.0, le=100.0, description="Percentage completed (0.0 - 100.0)")
    completed_at: Optional[datetime] = None


class ProgressResponse(BaseModel):
    id: int
    user_id: int
    module_id: str
    completion_status: str
    completion_percentage: float
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
