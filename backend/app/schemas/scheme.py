from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class SchemeBase(BaseModel):
    name: str = Field(..., description="Official name of the scheme")
    description: str = Field(..., description="Summary of scheme objectives and scope")
    category: str = Field(..., description="Category (Credit/Loan, Subsidy, Agriculture, Women, etc.)")
    eligibility_criteria: Dict[str, Any] = Field(default_factory=dict, description="Structured criteria definition")
    benefits: str = Field(..., description="Financial benefits, subsidies or loan limits")
    required_documents: List[str] = Field(default_factory=list, description="Documents required for application")
    official_link: str = Field(..., description="Official government portal URL")


class SchemeCreate(SchemeBase):
    pass


class SchemeResponse(SchemeBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SchemeListResponse(BaseModel):
    total: int
    schemes: List[SchemeResponse]
    disclaimer: str = "Informational notice: Scheme information is provided for development and guidance purposes. Refer to official government portals for statutory rules."
