from typing import List, Optional
from pydantic import BaseModel, Field


class EligibilityCheckRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="Optional ID of existing registered user")
    business_type: Optional[str] = Field(None, description="Type of business (e.g., Agriculture, Retail, Manufacturing, Handicrafts, Food Processing, Services)")
    annual_income: Optional[float] = Field(None, ge=0, description="Annual turnover or income in INR")
    years_in_business: Optional[int] = Field(None, ge=0, description="Operating years")
    location: Optional[str] = Field(None, description="State or rural/urban indicator")
    gender: Optional[str] = Field(None, description="Gender (female, male, other) - relevant for targeted schemes")
    social_category: Optional[str] = Field(None, description="Social category (General, SC, ST, OBC, Minority)")
    scheme_id: Optional[int] = Field(None, description="Optional specific scheme ID to assess")


class SchemeEligibilityDetail(BaseModel):
    scheme_id: int
    scheme_name: str
    category: str
    eligibility_score: float = Field(..., ge=0, le=100, description="Calculated match score (0 - 100)")
    is_eligible: bool
    reasons: List[str] = Field(default_factory=list, description="Specific factors contributing to eligibility")
    missing_requirements: List[str] = Field(default_factory=list, description="Criteria not yet met or needing verification")
    required_documents: List[str] = Field(default_factory=list, description="Checklist of documents needed")
    official_link: str


class EligibilityCheckResponse(BaseModel):
    overall_eligibility_score: float = Field(..., ge=0, le=100, description="Aggregated score across potential schemes")
    potentially_eligible_schemes: List[SchemeEligibilityDetail]
    reasons: List[str] = Field(default_factory=list, description="Key criteria met by the entrepreneur")
    missing_requirements: List[str] = Field(default_factory=list, description="Key gaps or unfulfilled criteria")
    required_documents: List[str] = Field(default_factory=list, description="Consolidated document checklist")
    disclaimer: str = (
        "IMPORTANT NOTICE: Eligibility results are informational estimates for guidance only and do not constitute "
        "official government approval, sanction, or guarantee. Formal approvals depend on statutory verification by "
        "the designated nodal agency, bank, or government department."
    )
