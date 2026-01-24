"""Supabase client for research data persistence."""

import logging
from typing import Optional, List, Dict, Any
from uuid import uuid4
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class SupabaseClient:
    """Simplified Supabase client for actor data persistence."""

    def __init__(
        self,
        url: str,
        key: str,
        workspace_id: str = "apify",
    ):
        if not SUPABASE_AVAILABLE:
            raise ImportError(
                "supabase package not installed. "
                "Install with: pip install supabase"
            )

        self.url = url
        self.key = key
        self.workspace_id = workspace_id
        self.client: Client = create_client(url, key)

    def is_available(self) -> bool:
        """Check if Supabase is configured."""
        return bool(self.url and self.key)

    async def create_session(
        self,
        title: str,
        query: str,
        template_type: str,
        parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create a new research session."""
        session_id = str(uuid4())

        data = {
            "id": session_id,
            "workspace_id": self.workspace_id,
            "title": title,
            "query": query,
            "template_type": template_type,
            "parameters": parameters,
            "status": "started",
            "created_at": datetime.utcnow().isoformat(),
        }

        result = self.client.table("research_sessions").insert(data).execute()

        if result.data:
            return result.data[0]
        return data

    async def update_session_status(
        self,
        session_id: str,
        status: str,
    ) -> None:
        """Update session status."""
        self.client.table("research_sessions").update({
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", session_id).execute()

    async def complete_session(
        self,
        session_id: str,
        cost_summary: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Mark session as completed."""
        update_data = {
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        if cost_summary:
            update_data["cost_summary"] = cost_summary

        self.client.table("research_sessions").update(update_data).eq("id", session_id).execute()

    async def save_sources(
        self,
        session_id: str,
        sources: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Save sources to database."""
        if not sources:
            return []

        records = []
        for source in sources:
            records.append({
                "id": str(uuid4()),
                "session_id": session_id,
                "url": source.get("url", ""),
                "title": source.get("title", ""),
                "domain": source.get("domain", ""),
                "snippet": source.get("snippet", ""),
                "source_type": source.get("source_type", "web"),
                "credibility_score": source.get("credibility_score"),
                "credibility_label": source.get("credibility_label"),
                "created_at": datetime.utcnow().isoformat(),
            })

        result = self.client.table("research_sources").insert(records).execute()
        return result.data if result.data else records

    async def save_findings(
        self,
        session_id: str,
        findings: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Save findings to database."""
        if not findings:
            return []

        records = []
        for finding in findings:
            records.append({
                "id": str(uuid4()),
                "session_id": session_id,
                "finding_type": finding.get("finding_type", "fact"),
                "content": finding.get("content", ""),
                "summary": finding.get("summary"),
                "confidence_score": finding.get("confidence_score", 0.5),
                "temporal_context": finding.get("temporal_context", "present"),
                "extracted_data": finding.get("extracted_data"),
                "created_at": datetime.utcnow().isoformat(),
            })

        result = self.client.table("research_findings").insert(records).execute()
        return result.data if result.data else records

    async def save_perspectives(
        self,
        session_id: str,
        perspectives: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Save perspective analyses to database."""
        if not perspectives:
            return []

        records = []
        for perspective in perspectives:
            records.append({
                "id": str(uuid4()),
                "session_id": session_id,
                "perspective_type": perspective.get("perspective_type", "unknown"),
                "analysis_text": perspective.get("analysis_text", ""),
                "key_insights": perspective.get("key_insights", []),
                "recommendations": perspective.get("recommendations", []),
                "warnings": perspective.get("warnings", []),
                "confidence": perspective.get("confidence", 0.5),
                "created_at": datetime.utcnow().isoformat(),
            })

        result = self.client.table("research_perspectives").insert(records).execute()
        return result.data if result.data else records

    async def save_query(
        self,
        session_id: str,
        query_text: str,
        query_purpose: str,
        query_round: int = 1,
        execution_time_ms: Optional[int] = None,
        result_count: Optional[int] = None,
        grounding_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Save a search query record."""
        data = {
            "id": str(uuid4()),
            "session_id": session_id,
            "query_text": query_text,
            "query_purpose": query_purpose,
            "query_round": query_round,
            "execution_time_ms": execution_time_ms,
            "result_count": result_count,
            "grounding_metadata": grounding_metadata,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = self.client.table("research_queries").insert(data).execute()
        return result.data[0] if result.data else data
