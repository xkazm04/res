"""Investigative journalism research template."""

from typing import List, Dict, Any

from .base import BaseTemplate


class InvestigativeTemplate(BaseTemplate):
    """Template for investigative journalism research."""

    template_id = "investigative"
    template_name = "Investigative Research"
    description = "Deep investigative journalism with actor and relationship analysis"

    # Expert perspectives for deep investigative analysis
    default_perspectives = [
        "forensic_financial",      # Follow the money, fraud detection
        "power_network",           # Map influence networks and institutional capture
        "psychological_behavioral", # Analyze motivations and credibility
        "legal_liability",          # Assess legal exposure and enforcement risk
        "geopolitical_strategic",   # Strategic interests and power dynamics
    ]

    default_max_searches = 8

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate investigative search queries."""
        prompt = f"""
You are an investigative journalist planning research queries for a deep investigation.

Investigation Topic: {query}

Depth Level: {granularity}

Generate search queries covering these investigative angles:
1. KEY ACTORS: Who are the main people/organizations involved?
2. TIMELINE: What events happened and when?
3. LOCATIONS: Where did key events occur? What jurisdictions are involved?
4. MOTIVATIONS: What are the underlying interests and relationships?
5. METHODS: How were things done? What mechanisms were used?
6. MONEY TRAIL: Financial connections and transactions
7. OFFICIAL RECORDS: Government filings, court documents, regulatory actions
8. MEDIA COVERAGE: News reports, interviews, public statements

For a "{granularity}" depth level:
- "quick": Focus on 1-3 most critical angles
- "standard": Cover 4-5 key angles with balanced depth
- "deep": Comprehensive coverage of all angles with follow-up queries

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["query about main actor", "query about key event", ...]
"""

        result = await self._call_gemini_json(prompt)

        if isinstance(result, list):
            return result[:max_searches]
        return []

    async def extract_findings(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        synthesized_content: str,
        granularity: str = "standard",
    ) -> List[Dict[str, Any]]:
        """Extract investigative findings."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are an investigative analyst extracting key findings for a deep investigation.

Investigation Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

Extract findings in these investigative categories:

1. ACTORS (finding_type: "actor")
   - People, organizations, entities involved
   - Include: name, role, affiliations, significance
   - Note any aliases or connections

2. EVENTS (finding_type: "event")
   - Key incidents, actions, decisions
   - Include: date (if known), location, participants, outcome
   - Note sequence and causation

3. RELATIONSHIPS (finding_type: "relationship")
   - Connections between actors
   - Types: personal, professional, political, criminal
   - Include strength of evidence

4. FINANCIAL TRANSACTIONS (finding_type: "financial")
   - ANY money movement: payments, gifts, loans, wire transfers, settlements
   - Property purchases, sales, or transfers
   - Investments, donations, or funding
   - Include in extracted_data:
     * "amount": dollar amount (number)
     * "currency": "USD", "GBP", etc.
     * "payer": who paid/gave the money
     * "payee": who received the money
     * "transaction_date": date if known (YYYY-MM-DD)
     * "transaction_type": payment/gift/loan/wire_transfer/property/settlement/investment
     * "purpose": reason or context for the transaction
   - This is CRITICAL - extract ALL financial amounts mentioned

5. EVIDENCE (finding_type: "evidence")
   - Documents, statements, data points
   - Include: type, source, significance
   - Note verification status

6. PATTERNS (finding_type: "pattern")
   - Recurring behaviors, methods, structures
   - Include: description, frequency, participants

7. GAPS (finding_type: "gap")
   - Missing information, unanswered questions
   - What we don't know and why it matters
   - Suggested follow-up

For each finding, return:
- finding_type: One of 'actor', 'event', 'relationship', 'financial', 'evidence', 'pattern', 'gap'
- content: Detailed finding with specific facts
- summary: One sentence
- confidence_score: 0.0-1.0 (based on source quality and corroboration)
- temporal_context: 'past', 'present', 'ongoing', or 'prediction'
- extracted_data: JSON object with structured data specific to the finding type
  - For 'financial': MUST include amount, payer, payee, transaction_type

Return as JSON array. Prioritize extracting ALL financial transactions with specific dollar amounts.
"""

        result = await self._call_gemini_json(prompt)

        findings = []
        if isinstance(result, list):
            for f in result:
                if isinstance(f, dict):
                    findings.append({
                        "finding_type": f.get("finding_type", "fact"),
                        "content": f.get("content", ""),
                        "summary": f.get("summary"),
                        "confidence_score": f.get("confidence_score", 0.5),
                        "temporal_context": f.get("temporal_context", "present"),
                        "extracted_data": f.get("extracted_data"),
                    })

        return findings
