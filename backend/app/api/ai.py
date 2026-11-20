from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Guidance Assistant"])


@router.post(
    "/chat",
    response_model=AIChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Interactive AI financial guidance turn",
)
async def chat_with_assistant(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate contextual financial guidance and government scheme recommendations
    grounded in the authenticated user's profile and ArthSetu's verified scheme database.
    Requires Bearer JWT authentication.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="User message cannot be empty.",
        )

    service = AIService()
    response = await service.chat(request, current_user, db)
    return response
