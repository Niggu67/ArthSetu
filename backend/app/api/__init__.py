from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.schemes import router as schemes_router
from app.api.eligibility import router as eligibility_router
from app.api.progress import router as progress_router
from app.api.applications import router as applications_router
from app.api.notifications import router as notifications_router
from app.api.ai import router as ai_router
from app.api.whatsapp import router as whatsapp_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(schemes_router)
api_router.include_router(eligibility_router)
api_router.include_router(progress_router)
api_router.include_router(applications_router)
api_router.include_router(notifications_router)
api_router.include_router(ai_router)
api_router.include_router(whatsapp_router)
