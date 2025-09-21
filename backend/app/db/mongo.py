from typing import Any
from urllib.parse import urlparse

import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from ..core.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        uri = settings.MONGODB_URI
        client_kwargs: dict[str, Any] = {
            "serverSelectionTimeoutMS": 30000,
            "retryWrites": True,
            "w": "majority",
        }

        # Use system CA bundle for Atlas/ssl-enabled clusters
        if uri.startswith("mongodb+srv://") or "mongodb.net" in uri:
            client_kwargs["tlsCAFile"] = certifi.where()

        _client = AsyncIOMotorClient(uri, **client_kwargs)
    return _client


async def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        client = await get_client()
        _db_local = client[settings.DATABASE_NAME]
        # ensure unique index on users.email
        await _db_local["users"].create_index("email", unique=True)
        _db = _db_local
    return _db  # type: ignore[return-value]
