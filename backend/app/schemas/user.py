from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Full name of entrepreneur")
    email: Optional[EmailStr] = Field(None, description="Registered email address")
    phone: Optional[str] = Field(None, description="Primary mobile number")
    language_preference: str = Field("hi", description="Preferred regional language (e.g., hi, mr, ta, en)")
    business_name: Optional[str] = Field(None, description="Registered or trade name of enterprise")
    business_type: Optional[str] = Field(None, description="Category (e.g., Agriculture, Retail, Handicrafts, Food Processing)")
    location: Optional[str] = Field(None, description="District and State")
    annual_income: Optional[float] = Field(None, ge=0, description="Annual income in INR")
    years_in_business: Optional[int] = Field(None, ge=0, description="Number of years enterprise has operated")
    financial_goals: Optional[str] = Field(None, description="Expansion, working capital, machinery, etc.")


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Full name of entrepreneur")
    email: EmailStr = Field(..., description="Required email address for verified registration")
    phone: Optional[str] = Field(None, description="Optional mobile number")
    password: str = Field(..., min_length=6, max_length=100, description="Account password")
    language_preference: Optional[str] = Field("hi", description="Preferred regional language")
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    annual_income: Optional[float] = None
    years_in_business: Optional[int] = None
    financial_goals: Optional[str] = None


class UserLogin(BaseModel):
    identifier: Optional[str] = Field(None, description="Email address or registered mobile number")
    email_or_phone: Optional[str] = Field(None, description="Email address or registered mobile number")
    email: Optional[str] = Field(None, description="Registered email address")
    phone: Optional[str] = Field(None, description="Registered mobile number")
    password: str = Field(..., description="Account password")


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    language_preference: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    annual_income: Optional[float] = Field(None, ge=0)
    years_in_business: Optional[int] = Field(None, ge=0)
    financial_goals: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VerifyEmailRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address to verify")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class ResendVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address to resend verification code to")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address requesting password reset")


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit password reset code")
    new_password: str = Field(..., min_length=6, max_length=100, description="New account password")


class AuthMessageResponse(BaseModel):
    message: str
    email: Optional[str] = None
    pending_verification: bool = False


class RegistrationResponse(BaseModel):
    message: str
    email: str
    is_verified: bool = False
    requires_verification: bool = True
    user: UserResponse

