"""Supabase client for research data persistence."""

import logging
import hashlib
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


# Map custom perspective types to schema-allowed values
# Extended schema allows: 'historical', 'political', 'economic', 'psychological', 'military', 'social', 'technological',
#                         'financial', 'journalist', 'conspirator', 'network'
PERSPECTIVE_TYPE_MAP: Dict[str, str] = {
    # Investigative perspectives
    "forensic_financial": "financial",
    "power_network": "network",
    "psychological_behavioral": "psychological",
    "geopolitical_strategic": "political",
    "legal_liability": "political",
    # Financial/Investment perspectives
    "institutional_investor": "financial",
    "short_seller": "financial",
    "quantitative_risk": "financial",
    "activist_investor": "financial",
    "macro_strategist": "economic",
    # Competitive analysis
    "strategy_consultant": "economic",
    "industry_insider": "economic",
    # Legal perspectives
    "regulatory_expert": "political",
    "litigation_strategist": "political",
    # Tech market perspectives
    "venture_capitalist": "financial",
    "startup_founder": "technological",
    "product_manager": "technological",
    "developer_advocate": "technological",
    "open_source_maintainer": "technological",
    "devrel_engineer": "technological",
    "senior_engineer": "technological",
    "platform_engineer": "technological",
    # Contract analysis
    "contract_auditor": "financial",
    "procurement_investigator": "political",
    "forensic_accountant": "financial",
    "regulatory_compliance": "political",
    "industry_benchmarker": "economic",
}


def generate_url_hash(url: str) -> str:
    """Generate a consistent hash for URL deduplication."""
    return hashlib.sha256(url.encode('utf-8')).hexdigest()[:32]


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
        findings_count: Optional[int] = None,
        sources_count: Optional[int] = None,
    ) -> None:
        """Mark session as completed and update stats."""
        # Get current parameters to merge with cost_summary
        current = self.client.table("research_sessions").select("parameters").eq("id", session_id).limit(1).execute()
        current_params = current.data[0].get("parameters", {}) if current.data and len(current.data) > 0 else {}

        # Merge cost_summary into parameters
        if cost_summary:
            current_params["cost_summary"] = cost_summary

        update_data = {
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "parameters": current_params,
        }

        # Update counts if provided
        if findings_count is not None:
            update_data["claim_count"] = findings_count
        if sources_count is not None:
            update_data["source_count"] = sources_count

        self.client.table("research_sessions").update(update_data).eq("id", session_id).execute()

    async def update_session_counts(
        self,
        session_id: str,
        findings_count: int,
        sources_count: int,
    ) -> None:
        """Update denormalized counts on session."""
        self.client.table("research_sessions").update({
            "claim_count": findings_count,
            "source_count": sources_count,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", session_id).execute()

    async def save_sources(
        self,
        session_id: str,
        sources: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Save sources to database.

        Schema requires:
        - url_hash: TEXT NOT NULL (for deduplication)
        - credibility_factors: JSONB (not credibility_label)
        - discovered_at: TIMESTAMPTZ (not created_at)
        - is_global: BOOLEAN DEFAULT FALSE
        - source_type: CHECK constraint for valid types
        """
        if not sources:
            return []

        # Valid source types per schema
        valid_source_types = {'news', 'academic', 'government', 'corporate', 'blog', 'social', 'wiki', 'unknown'}

        records = []
        for source in sources:
            url = source.get("url", "")
            source_type = source.get("source_type", "unknown")

            # Ensure source_type is valid
            if source_type not in valid_source_types:
                source_type = "unknown"

            # Build credibility_factors JSONB from available data
            credibility_factors = {}
            if source.get("credibility_label"):
                credibility_factors["label"] = source.get("credibility_label")
            if source.get("credibility_score"):
                credibility_factors["score"] = source.get("credibility_score")

            records.append({
                "id": str(uuid4()),
                "session_id": session_id,
                "url": url,
                "url_hash": generate_url_hash(url),  # Required by schema
                "title": source.get("title", ""),
                "domain": source.get("domain", ""),
                "snippet": source.get("snippet", ""),
                "source_type": source_type,
                "credibility_score": source.get("credibility_score"),
                "credibility_factors": credibility_factors if credibility_factors else None,
                "is_global": False,
                "discovered_at": datetime.utcnow().isoformat(),
            })

        result = self.client.table("research_sources").insert(records).execute()
        return result.data if result.data else records

    async def save_findings(
        self,
        session_id: str,
        findings: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Save findings to database.

        Schema:
        - finding_type: CHECK ('fact', 'claim', 'event', 'actor', 'relationship', 'pattern', 'gap', 'evidence')
        - temporal_context: CHECK ('past', 'present', 'ongoing', 'prediction')
        - supporting_sources: UUID[] (array of source IDs)
        - related_findings: UUID[]
        - contradicts: UUID[]
        - is_promoted: BOOLEAN DEFAULT FALSE
        """
        if not findings:
            return []

        # Valid finding types per schema
        valid_finding_types = {'fact', 'claim', 'event', 'actor', 'relationship', 'pattern', 'gap', 'evidence'}
        # Valid temporal contexts per schema
        valid_temporal = {'past', 'present', 'ongoing', 'prediction'}

        records = []
        for finding in findings:
            finding_type = finding.get("finding_type", "fact")
            if finding_type not in valid_finding_types:
                finding_type = "fact"

            temporal_context = finding.get("temporal_context", "present")
            if temporal_context not in valid_temporal:
                # Map common alternatives
                temporal_map = {
                    "historical": "past",
                    "current": "present",
                    "predicted": "prediction",
                }
                temporal_context = temporal_map.get(temporal_context, "present")

            records.append({
                "id": str(uuid4()),
                "session_id": session_id,
                "finding_type": finding_type,
                "content": finding.get("content", ""),
                "summary": finding.get("summary"),
                "confidence_score": finding.get("confidence_score", 0.5),
                "temporal_context": temporal_context,
                "extracted_data": finding.get("extracted_data"),
                "supporting_sources": [],  # Empty array - could be populated with source UUIDs
                "related_findings": [],
                "contradicts": [],
                "is_promoted": False,
                "created_at": datetime.utcnow().isoformat(),
            })

        result = self.client.table("research_findings").insert(records).execute()
        return result.data if result.data else records

    async def save_perspectives(
        self,
        session_id: str,
        perspectives: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Save perspective analyses to database.

        Extended schema allows perspective_type:
        'historical', 'political', 'economic', 'psychological', 'military', 'social', 'technological',
        'financial', 'journalist', 'conspirator', 'network'

        Custom perspective types are mapped to allowed values, with original stored in specialized_data.
        """
        if not perspectives:
            return []

        # Valid perspective types per extended schema
        valid_perspective_types = {
            'historical', 'political', 'economic', 'psychological', 'military', 'social', 'technological',
            'financial', 'journalist', 'conspirator', 'network'
        }

        records = []
        for perspective in perspectives:
            original_type = perspective.get("perspective_type", "economic")

            # Map to schema-allowed type
            if original_type in valid_perspective_types:
                mapped_type = original_type
            else:
                mapped_type = PERSPECTIVE_TYPE_MAP.get(original_type, "economic")

            # Store original type and extra data in specialized_data JSONB
            specialized_data = {
                "original_perspective_type": original_type,
            }
            # Add predictions if present
            if perspective.get("predictions"):
                specialized_data["predictions"] = perspective.get("predictions")
            # Add knowledge gaps if present
            if perspective.get("knowledge_gaps"):
                specialized_data["knowledge_gaps"] = perspective.get("knowledge_gaps")
            # Add contrarian view if present
            if perspective.get("contrarian_view"):
                specialized_data["contrarian_view"] = perspective.get("contrarian_view")

            records.append({
                "id": str(uuid4()),
                "session_id": session_id,
                "perspective_type": mapped_type,
                "analysis_text": perspective.get("analysis_text", ""),
                "key_insights": perspective.get("key_insights", []),
                "recommendations": perspective.get("recommendations", []),
                "warnings": perspective.get("warnings", []),
                "confidence": perspective.get("confidence", 0.5),
                "findings_analyzed": [],  # Could be populated with finding UUIDs
                "sources_cited": [],  # Could be populated with source UUIDs
                "specialized_data": specialized_data,
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

    # ==========================================
    # TOPIC MANAGEMENT
    # ==========================================

    async def find_or_create_topic(
        self,
        name: str,
        topic_type: str = "concept",
        description: Optional[str] = None,
        parent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Find existing topic by slug or create new one.

        Topic types: 'domain', 'event', 'entity', 'concept', 'region', 'timeperiod'
        """
        slug = self._slugify(name)

        # Try to find existing topic
        result = self.client.table("knowledge_topics").select("*").eq("slug", slug).limit(1).execute()

        if result.data and len(result.data) > 0:
            return result.data[0]

        # Create new topic
        valid_types = {'domain', 'event', 'entity', 'concept', 'region', 'timeperiod'}
        if topic_type not in valid_types:
            topic_type = "concept"

        topic_id = str(uuid4())
        data = {
            "id": topic_id,
            "name": name,
            "slug": slug,
            "description": description,
            "topic_type": topic_type,
            "parent_id": parent_id,
            "finding_count": 0,
            "entity_count": 0,
            "session_count": 0,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = self.client.table("knowledge_topics").insert(data).execute()
        return result.data[0] if result.data else data

    async def link_session_to_topic(
        self,
        session_id: str,
        topic_id: str,
        is_primary: bool = False,
    ) -> None:
        """Link a session to a topic."""
        update_data: Dict[str, Any] = {"updated_at": datetime.utcnow().isoformat()}

        if is_primary:
            update_data["primary_topic_id"] = topic_id

        # Get current topic_ids and add new one
        session = self.client.table("research_sessions").select("topic_ids").eq("id", session_id).limit(1).execute()
        current_topics = session.data[0].get("topic_ids", []) if session.data and len(session.data) > 0 else []

        if topic_id not in current_topics:
            current_topics.append(topic_id)
            update_data["topic_ids"] = current_topics

        self.client.table("research_sessions").update(update_data).eq("id", session_id).execute()

        # Increment session count on topic
        try:
            topic = self.client.table("knowledge_topics").select("session_count").eq("id", topic_id).limit(1).execute()
            current_count = topic.data[0].get("session_count", 0) if topic.data and len(topic.data) > 0 else 0
            self.client.table("knowledge_topics").update({
                "session_count": current_count + 1,
                "last_activity_at": datetime.utcnow().isoformat(),
            }).eq("id", topic_id).execute()
        except Exception as e:
            logger.debug(f"Failed to increment topic session count: {e}")

    def _slugify(self, text: str) -> str:
        """Convert text to URL-safe slug."""
        import re
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text[:100]  # Limit length

    # ==========================================
    # ENTITY MANAGEMENT
    # ==========================================

    async def find_or_create_entity(
        self,
        name: str,
        entity_type: str,
        description: Optional[str] = None,
        aliases: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Find existing entity or create new one.

        Entity types: 'person', 'organization', 'location', 'product', 'concept', 'event'
        """
        name_hash = hashlib.sha256(name.lower().strip().encode('utf-8')).hexdigest()[:32]

        # Try to find existing entity
        result = self.client.table("knowledge_entities").select("*").eq("name_hash", name_hash).eq("entity_type", entity_type).limit(1).execute()

        if result.data and len(result.data) > 0:
            existing = result.data[0]
            # Update mention count
            self.client.table("knowledge_entities").update({
                "mention_count": existing.get("mention_count", 0) + 1,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", existing["id"]).execute()
            return existing

        # Create new entity
        valid_types = {'person', 'organization', 'location', 'product', 'concept', 'event'}
        if entity_type not in valid_types:
            entity_type = "concept"

        entity_id = str(uuid4())
        data = {
            "id": entity_id,
            "canonical_name": name,
            "entity_type": entity_type,
            "name_hash": name_hash,
            "description": description,
            "aliases": aliases or [],
            "mention_count": 1,
            "claim_count": 0,
            "is_verified": False,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = self.client.table("knowledge_entities").insert(data).execute()
        return result.data[0] if result.data else data

    async def save_entities_batch(
        self,
        entities: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Save multiple entities, returning their IDs."""
        saved = []
        for entity in entities:
            result = await self.find_or_create_entity(
                name=entity.get("name", "Unknown"),
                entity_type=entity.get("type", "concept"),
                description=entity.get("description"),
                aliases=entity.get("aliases"),
            )
            saved.append(result)
        return saved

    # ==========================================
    # KNOWLEDGE CLAIMS
    # ==========================================

    async def create_knowledge_claim(
        self,
        content: str,
        claim_type: str,
        topic_id: Optional[str] = None,
        session_id: Optional[str] = None,
        confidence_score: float = 0.5,
        summary: Optional[str] = None,
        temporal_context: Optional[str] = None,
        tags: Optional[List[str]] = None,
        extracted_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a knowledge claim from a finding.

        Claim types: 'fact', 'event', 'relationship', 'pattern', 'prediction', 'actor', 'evidence', 'gap'
        """
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()[:32]

        # Check for duplicate
        existing = self.client.table("knowledge_claims").select("id, corroboration_count").eq("content_hash", content_hash).limit(1).execute()
        if existing.data and len(existing.data) > 0:
            existing_claim = existing.data[0]
            # Update corroboration count
            self.client.table("knowledge_claims").update({
                "corroboration_count": existing_claim.get("corroboration_count", 0) + 1,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", existing_claim["id"]).execute()
            return existing_claim

        valid_types = {'fact', 'event', 'relationship', 'pattern', 'prediction', 'actor', 'evidence', 'gap'}
        if claim_type not in valid_types:
            claim_type = "fact"

        valid_temporal = {'historical', 'current', 'ongoing', 'predicted'}
        if temporal_context and temporal_context not in valid_temporal:
            temporal_context = None

        claim_id = str(uuid4())
        data = {
            "id": claim_id,
            "content": content,
            "content_hash": content_hash,
            "claim_type": claim_type,
            "summary": summary,
            "topic_id": topic_id,
            "origin_session_id": session_id,
            "confidence_score": confidence_score,
            "verification_status": "unverified",
            "corroboration_count": 0,
            "temporal_context": temporal_context,
            "tags": tags or [],
            "extracted_data": extracted_data or {},
            "workspace_id": self.workspace_id,
            "visibility": "workspace",
            "is_current": True,
            "version": 1,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = self.client.table("knowledge_claims").insert(data).execute()
        return result.data[0] if result.data else data

    # ==========================================
    # CLAIM-ENTITY LINKING
    # ==========================================

    async def link_claim_to_entity(
        self,
        claim_id: str,
        entity_id: str,
        role: str = "mentioned",
        context_snippet: Optional[str] = None,
        sentiment: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Link a claim to an entity with a role.

        Roles: 'subject', 'object', 'actor', 'target', 'location', 'mentioned', 'source', 'beneficiary'
        """
        valid_roles = {'subject', 'object', 'actor', 'target', 'location', 'mentioned', 'source', 'beneficiary'}
        if role not in valid_roles:
            role = "mentioned"

        data = {
            "id": str(uuid4()),
            "claim_id": claim_id,
            "entity_id": entity_id,
            "role": role,
            "context_snippet": context_snippet,
            "sentiment": sentiment,
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            result = self.client.table("claim_entities").insert(data).execute()
            return result.data[0] if result.data else data
        except Exception as e:
            # Likely duplicate, ignore
            logger.debug(f"Claim-entity link may already exist: {e}")
            return data

    # ==========================================
    # CLAIM RELATIONSHIPS
    # ==========================================

    async def create_claim_relationship(
        self,
        source_claim_id: str,
        target_claim_id: str,
        relationship_type: str,
        strength: float = 0.5,
        description: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a relationship between two claims.

        Relationship types: 'causes', 'supports', 'contradicts', 'expands', 'supersedes',
                           'related_to', 'part_of', 'precedes', 'follows', 'enables', 'prevents'
        """
        valid_types = {
            'causes', 'supports', 'contradicts', 'expands', 'supersedes',
            'related_to', 'part_of', 'precedes', 'follows', 'enables', 'prevents'
        }
        if relationship_type not in valid_types:
            relationship_type = "related_to"

        data = {
            "id": str(uuid4()),
            "source_claim_id": source_claim_id,
            "target_claim_id": target_claim_id,
            "relationship_type": relationship_type,
            "strength": max(0.0, min(1.0, strength)),
            "description": description,
            "bidirectional": False,
            "created_by_session_id": session_id,
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            result = self.client.table("claim_relationships").insert(data).execute()
            return result.data[0] if result.data else data
        except Exception as e:
            # Likely duplicate, ignore
            logger.debug(f"Claim relationship may already exist: {e}")
            return data

    # ==========================================
    # ENHANCED FINDINGS WITH LINKING
    # ==========================================

    async def save_findings_with_sources(
        self,
        session_id: str,
        findings: List[Dict[str, Any]],
        source_id_map: Dict[str, str],  # url -> uuid mapping
    ) -> List[Dict[str, Any]]:
        """Save findings with proper source UUID linking.

        Args:
            session_id: Research session ID
            findings: List of findings with supporting_sources as URL references
            source_id_map: Mapping of source URLs to their UUIDs in the database
        """
        if not findings:
            return []

        valid_finding_types = {'fact', 'claim', 'event', 'actor', 'relationship', 'pattern', 'gap', 'evidence'}
        valid_temporal = {'past', 'present', 'ongoing', 'prediction'}

        records = []
        for finding in findings:
            finding_type = finding.get("finding_type", "fact")
            if finding_type not in valid_finding_types:
                finding_type = "fact"

            temporal_context = finding.get("temporal_context", "present")
            if temporal_context not in valid_temporal:
                temporal_map = {"historical": "past", "current": "present", "predicted": "prediction"}
                temporal_context = temporal_map.get(temporal_context, "present")

            # Convert URL-based supporting_sources to UUIDs
            supporting_source_uuids = []
            for source_ref in finding.get("supporting_sources", []):
                url = source_ref.get("url") if isinstance(source_ref, dict) else source_ref
                if url and url in source_id_map:
                    supporting_source_uuids.append(source_id_map[url])

            finding_id = str(uuid4())
            records.append({
                "id": finding_id,
                "session_id": session_id,
                "finding_type": finding_type,
                "content": finding.get("content", ""),
                "summary": finding.get("summary"),
                "confidence_score": finding.get("confidence_score", 0.5),
                "temporal_context": temporal_context,
                "extracted_data": finding.get("extracted_data"),
                "supporting_sources": supporting_source_uuids,
                "related_findings": [],
                "contradicts": [],
                "is_promoted": False,
                "created_at": datetime.utcnow().isoformat(),
            })

        result = self.client.table("research_findings").insert(records).execute()
        return result.data if result.data else records

    async def save_sources_and_get_mapping(
        self,
        session_id: str,
        sources: List[Dict[str, Any]],
    ) -> tuple[List[Dict[str, Any]], Dict[str, str]]:
        """Save sources and return both saved records and URL->UUID mapping."""
        saved = await self.save_sources(session_id, sources)

        # Build URL to UUID mapping
        url_to_uuid = {}
        for source in saved:
            url_to_uuid[source.get("url", "")] = source.get("id", "")

        return saved, url_to_uuid

    # ==========================================
    # CONTRADICTIONS & GAPS
    # ==========================================

    async def save_contradiction(
        self,
        session_id: str,
        finding_id_1: str,
        finding_id_2: str,
        description: str,
        severity: str = "medium",
    ) -> Dict[str, Any]:
        """Record a contradiction between findings."""
        data = {
            "id": str(uuid4()),
            "session_id": session_id,
            "finding_id_1": finding_id_1,
            "finding_id_2": finding_id_2,
            "description": description,
            "severity": severity,
            "resolution_status": "unresolved",
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            result = self.client.table("research_contradictions").insert(data).execute()
            return result.data[0] if result.data else data
        except Exception:
            return data

    async def save_gap(
        self,
        session_id: str,
        description: str,
        gap_type: str = "information",
        priority: int = 2,
        suggested_queries: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Record a research gap."""
        data = {
            "id": str(uuid4()),
            "session_id": session_id,
            "description": description,
            "gap_type": gap_type,
            "priority": priority,
            "suggested_queries": suggested_queries or [],
            "status": "open",
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            result = self.client.table("research_gaps").insert(data).execute()
            return result.data[0] if result.data else data
        except Exception:
            return data
