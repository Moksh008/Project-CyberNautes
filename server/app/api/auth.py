from fastapi import APIRouter
from ..core.config import settings

router = APIRouter()

@router.get("/config")
async def get_firebase_config():
    return {
        "apiKey": settings.FIREBASE_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN,
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID,
        "measurementId": settings.FIREBASE_MEASUREMENT_ID
    }

@router.post("/login")
async def login():
    # Placeholder for Firebase token verification
    return {"message": "Login successful"}
