from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., min_length=1, description="Message text content")


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or statement")
    history: List[ChatMessage] = Field(default_factory=list, description="Recent message history in active session")
    language: Optional[str] = Field(None, description="Preferred language ('en', 'hi', 'mr')")


class SuggestedAction(BaseModel):
    type: str = Field(..., description="Action type: 'view_scheme', 'check_eligibility', 'start_learning'")
    label: str = Field(..., description="Human-readable button label")
    href: str = Field(..., description="Internal URL target")
    scheme_id: Optional[int] = Field(None, description="Associated database scheme ID if applicable")


class AIChatResponse(BaseModel):
    assistant_message: str = Field(..., description="AI assistant's response text")
    relevant_scheme_ids: List[int] = Field(default_factory=list, description="IDs of government schemes referenced in answer")
    suggested_actions: List[SuggestedAction] = Field(default_factory=list, description="Contextual quick action links")
    disclaimer: str = Field(
        default=(
            "ArthSetu AI provides general financial information and guidance. It does not guarantee eligibility, "
            "loan approval, investment returns, or government approval. Always verify important information with "
            "the official source before making financial decisions."
        ),
        description="Statutory non-intrusive informational advisory",
    )
