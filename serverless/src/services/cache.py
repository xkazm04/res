"""Cache service for Cloud Run - using in-memory or Redis.

This is a Cloud Run-compatible version that doesn't depend on Apify KV store.
For production, configure Redis using REDIS_URL environment variable.
"""

import os
import hashlib
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

# In-memory cache (for single-instance deployments)
_memory_cache: Dict[str, Dict[str, Any]] = {}


class CacheService:
    """
    Query-level research cache for Cloud Run.

    Uses in-memory caching by default. For multi-instance deployments,
    configure REDIS_URL environment variable for Redis-based caching.
    """

    def __init__(self, cache_prefix: str = "CACHE_"):
        """
        Initialize cache service.

        Args:
            cache_prefix: Prefix for cache keys
        """
        self.cache_prefix = cache_prefix
        self._redis = None
        self._redis_available = False

        # Try to connect to Redis if URL is provided
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            try:
                import redis
                self._redis = redis.from_url(redis_url)
                self._redis.ping()
                self._redis_available = True
                logger.info("Connected to Redis cache")
            except Exception as e:
                logger.warning(f"Redis connection failed, using in-memory cache: {e}")

    def get_cache_key(self, query: str, template: str, granularity: str) -> str:
        """
        Generate cache key from normalized query.

        Args:
            query: Research query
            template: Template type (e.g., "tech_market", "financial")
            granularity: Research depth ("quick", "standard", "deep")

        Returns:
            Cache key string
        """
        normalized = self._normalize_query(query)
        query_hash = hashlib.md5(normalized.encode()).hexdigest()[:16]
        return f"{self.cache_prefix}{template}_{granularity}_{query_hash}"

    def _normalize_query(self, query: str) -> str:
        """
        Normalize query for consistent matching.

        Args:
            query: Raw query string

        Returns:
            Normalized query string
        """
        return " ".join(query.lower().strip().split())

    async def get_cached(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached research result.

        Args:
            cache_key: Cache key from get_cache_key()

        Returns:
            Cached entry dict or None if not found
        """
        try:
            if self._redis_available:
                import json
                cached = self._redis.get(cache_key)
                if cached:
                    logger.info(f"Redis cache hit: {cache_key}")
                    return json.loads(cached)
            else:
                cached = _memory_cache.get(cache_key)
                if cached:
                    logger.info(f"Memory cache hit: {cache_key}")
                    return cached

            logger.info(f"Cache miss: {cache_key}")
            return None
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
            return None

    async def set_cached(
        self,
        cache_key: str,
        result: Dict[str, Any],
        findings_count: int,
        sources_count: int,
        ttl_seconds: int = 86400,  # 24 hours default
    ) -> bool:
        """
        Cache research result.

        Args:
            cache_key: Cache key from get_cache_key()
            result: Research result dict
            findings_count: Number of findings
            sources_count: Number of sources
            ttl_seconds: Time-to-live in seconds (Redis only)

        Returns:
            True if cached successfully
        """
        try:
            cache_entry = {
                "result": result,
                "cached_at": datetime.utcnow().isoformat(),
                "findings_count": findings_count,
                "sources_count": sources_count,
                "access_count": 1,
                "last_accessed": datetime.utcnow().isoformat(),
            }

            if self._redis_available:
                import json
                self._redis.setex(
                    cache_key,
                    ttl_seconds,
                    json.dumps(cache_entry)
                )
                logger.info(f"Cached to Redis: {cache_key}")
            else:
                _memory_cache[cache_key] = cache_entry
                logger.info(f"Cached to memory: {cache_key}")

            return True
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
            return False

    async def update_access(self, cache_key: str) -> bool:
        """
        Update access count and timestamp for cached entry.

        Args:
            cache_key: Cache key

        Returns:
            True if updated successfully
        """
        try:
            if self._redis_available:
                import json
                cached = self._redis.get(cache_key)
                if cached:
                    data = json.loads(cached)
                    data["access_count"] = data.get("access_count", 0) + 1
                    data["last_accessed"] = datetime.utcnow().isoformat()
                    ttl = self._redis.ttl(cache_key)
                    if ttl > 0:
                        self._redis.setex(cache_key, ttl, json.dumps(data))
                    return True
            else:
                if cache_key in _memory_cache:
                    _memory_cache[cache_key]["access_count"] = \
                        _memory_cache[cache_key].get("access_count", 0) + 1
                    _memory_cache[cache_key]["last_accessed"] = \
                        datetime.utcnow().isoformat()
                    return True
            return False
        except Exception as e:
            logger.warning(f"Cache update error: {e}")
            return False

    async def extend_cached(
        self,
        cache_key: str,
        new_findings: List[Dict[str, Any]],
        new_sources: List[Dict[str, Any]],
    ) -> bool:
        """
        Extend cached research with new findings (deduplicated).

        Args:
            cache_key: Cache key
            new_findings: New findings to add
            new_sources: New sources to add

        Returns:
            True if extended successfully
        """
        try:
            cached = await self.get_cached(cache_key)
            if not cached:
                return False

            result = cached.get("result", {})

            # Deduplicate findings by finding_id
            existing_finding_ids = {
                f.get("finding_id")
                for f in result.get("findings", [])
            }
            for finding in new_findings:
                if finding.get("finding_id") not in existing_finding_ids:
                    result.setdefault("findings", []).append(finding)

            # Deduplicate sources by URL
            existing_urls = {
                s.get("url")
                for s in result.get("sources", [])
            }
            for source in new_sources:
                if source.get("url") not in existing_urls:
                    result.setdefault("sources", []).append(source)

            # Update metadata
            cached["result"] = result
            cached["access_count"] = cached.get("access_count", 0) + 1
            cached["last_extended"] = datetime.utcnow().isoformat()
            cached["findings_count"] = len(result.get("findings", []))
            cached["sources_count"] = len(result.get("sources", []))

            # Re-cache
            if self._redis_available:
                import json
                ttl = self._redis.ttl(cache_key)
                if ttl > 0:
                    self._redis.setex(cache_key, ttl, json.dumps(cached))
            else:
                _memory_cache[cache_key] = cached

            logger.info(f"Extended cache: {cache_key}")
            return True
        except Exception as e:
            logger.warning(f"Cache extend error: {e}")
            return False

    def is_available(self) -> bool:
        """Check if caching is available."""
        return True  # Always available (in-memory fallback)

    def clear_memory_cache(self):
        """Clear in-memory cache (for testing)."""
        global _memory_cache
        _memory_cache = {}
