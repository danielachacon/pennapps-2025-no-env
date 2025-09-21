from fastapi import APIRouter

api_router = APIRouter()

@api_router.get("/ping", tags=["health"]) 
async def ping() -> dict:
    return {"message": "pong"}

# Auth routes
from .auth import router as auth_router
from .stream import router as stream_router

api_router.include_router(auth_router)
api_router.include_router(stream_router)