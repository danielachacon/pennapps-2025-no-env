from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.routes import api_router


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
    )

    # If using wildcard origin, CORS with credentials must be disabled per spec
    allow_credentials = True
    if "*" in settings.BACKEND_CORS_ORIGINS:
        allow_credentials = False

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix="/api")

    @application.get("/")
    async def root():
        return {
            "status": "ok",
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "env": settings.ENV,
        }

    @application.get("/health")
    async def health() -> dict:
        return {"status": "ok"}

    return application


app = create_application()