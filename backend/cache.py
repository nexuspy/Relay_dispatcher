import redis.asyncio as redis
import json
from config import settings
from typing import Optional, Any

class CacheService:
    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self.enabled = settings.CACHE_ENABLED

    async def connect(self):
        if self.enabled:
            try:
                self._redis = redis.from_url(
                    settings.REDIS_URL or f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
                    password=settings.REDIS_PASSWORD,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self._redis.ping()
                print("Connected to Redis successfully.")
            except Exception as e:
                print(f"Failed to connect to Redis: {e}")
                self.enabled = False

    async def get(self, key: str) -> Optional[Any]:
        if not self.enabled or not self._redis:
            return None
        data = await self._redis.get(key)
        return json.loads(data) if data else None

    async def set(self, key: str, value: Any, expire: int = settings.CACHE_EXPIRE_SECONDS):
        if not self.enabled or not self._redis:
            return
        await self._redis.set(key, json.dumps(value), ex=expire)

    async def close(self):
        if self._redis:
            await self._redis.close()

cache = CacheService()
