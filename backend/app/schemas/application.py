from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.scheme import SchemeResponse


class ApplicationCreate(BaseModel):
    user_id: int = Field(..., description="ID of applying user")
    scheme_id: int = Field(..., description="Target government scheme ID")
    status: str = Field("draft", description="Initial application status (draft, submitted, under_review, approved, rejected)")
    notes: Optional[str] = Field(None, description="Applicant notes or internal status logs")


class ApplicationUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Updated status (draft, submitted, under_review, approved, rejected)")
    notes: Optional[str] = Field(None, description="Additional notes or updates")


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    scheme_id: int
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    scheme: Optional[SchemeResponse] = None

    model_config = ConfigDict(from_attributes=True)
