"""Cache service for intelligent query caching using Apify KV store."""

import hashlib
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class CacheService:
    """
    Query-level research cache using Apify Key-Value store.

    Provides exact-match caching for research queries to avoid
    duplicate API calls and reduce costs for repeated queries.

    Uses a named shared KV store ("research-cache") that persists
    across Actor runs, enabling true cross-run caching.
    """

    CACHE_STORE_NAME = "research-cache"

    def __init__(self, cache_prefix: str = "CACHE_"):
        """
        Initialize cache service.

        Args:
            cache_prefix: Prefix for cache keys in KV store
        """
        self.cache_prefix = cache_prefix
        self._actor_available = False
        self._kv_store = None

        try:
            from apify import Actor
            self._Actor = Actor
            self._actor_available = True
        except ImportError:
            self._Actor = None
            logger.debug("Apify SDK not available, caching disabled")

    async def _get_store(self):
        """Get or open the shared cache KV store."""
        if self._kv_store is None and self._actor_available:
            try:
                self._kv_store = await self._Actor.open_key_value_store(name=self.CACHE_STORE_NAME)
                logger.info(f"Opened shared cache store: {self.CACHE_STORE_NAME}")
            except Exception as e:
                logger.warning(f"Failed to open cache store: {e}")
        return self._kv_store

    def get_cache_key(self, query: str, template: str, granularity: str) -> str:
        """
        Generate cache key from normalized query.

        Args:
            query: Research query
            template: Template type (e.g., "tech_market", "financial")
            granularity: Research depth ("quick", "standard", "deep")

        Returns:
            Cache key string (uses only allowed chars: a-zA-Z0-9!-_.'())
        """
        normalized = self._normalize_query(query)
        query_hash = hashlib.md5(normalized.encode()).hexdigest()[:16]
        # Use underscores instead of colons (colons not allowed in KV keys)
        return f"{self.cache_prefix}{template}_{granularity}_{query_hash}"

    def _normalize_query(self, query: str) -> str:
        """
        Normalize query for consistent matching.

        Applies:
        - Lowercase conversion
        - Whitespace normalization
        - Strip leading/trailing whitespace

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
        if not self._actor_available:
            return None

        try:
            store = await self._get_store()
            if store:
                cached = await store.get_value(cache_key)
                if cached:
                    logger.info(f"Cache hit for key: {cache_key}")
                    return cached
                else:
                    logger.info(f"Cache miss for key: {cache_key}")
        except Exception as e:
            logger.warning(f"Cache read error: {e}")

        return None

    async def set_cached(
        self,
        cache_key: str,
        result: Dict[str, Any],
        findings_count: int,
        sources_count: int,
    ) -> bool:
        """
        Cache research result.

        Args:
            cache_key: Cache key from get_cache_key()
            result: Research result dict
            findings_count: Number of findings
            sources_count: Number of sources

        Returns:
            True if cached successfully
        """
        if not self._actor_available:
            return False

        try:
            store = await self._get_store()
            if store:
                cache_entry = {
                    "result": result,
                    "cached_at": datetime.utcnow().isoformat(),
                    "findings_count": findings_count,
                    "sources_count": sources_count,
                    "access_count": 1,
                    "last_accessed": datetime.utcnow().isoformat(),
                }
                await store.set_value(cache_key, cache_entry)
                logger.info(f"Cached result with key: {cache_key}")
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
        if not self._actor_available:
            return False

        try:
            store = await self._get_store()
            if store:
                cached = await store.get_value(cache_key)
                if cached:
                    cached["access_count"] = cached.get("access_count", 0) + 1
                    cached["last_accessed"] = datetime.utcnow().isoformat()
                    await store.set_value(cache_key, cached)
                    return True
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
        if not self._actor_available:
            return False

        try:
            store = await self._get_store()
            if not store:
                return False

            cached = await store.get_value(cache_key)
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

            await store.set_value(cache_key, cached)
            logger.info(f"Extended cache: {cache_key}")
            return True
        except Exception as e:
            logger.warning(f"Cache extend error: {e}")
            return False

    def is_available(self) -> bool:
        """Check if caching is available (Apify SDK loaded)."""
        return self._actor_available
