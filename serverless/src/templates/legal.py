"""Legal research template."""

from typing import List, Dict, Any

from .base import BaseTemplate


class LegalTemplate(BaseTemplate):
    """Template for legal research, regulatory analysis, and compliance."""

    template_id = "legal"
    template_name = "Legal Research"
    description = "Legal case research, regulatory analysis, and compliance assessment"

    # Expert perspectives for legal analysis
    default_perspectives = [
        "litigation_strategist",   # Case strength, discovery, outcomes
        "regulatory_expert",       # Compliance, enforcement, political factors
        "legal_liability",         # Liability exposure, evidence strength
        "forensic_financial",      # Financial crimes, fraud patterns
    ]

    default_max_searches = 10

    # Legal research is more factual - court citations are verifiable
    # Focus on source quality (primary legal sources) over bias detection
    verification_config = {
        "cross_reference": "light",         # Legal citations are specific
        "bias_detection": "light",          # Less bias in case law
        "expert_sanity_check": "light",     # Legal findings are factual
        "source_quality": "thorough",       # Primary sources (court filings) critical
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate legal research search queries."""
        prompt = f"""
You are a legal researcher planning comprehensive legal research for a law firm or legal department.

Research Topic: {query}

Depth Level: {granularity}

Generate search queries covering these legal research angles:

1. CASE LAW
   - Relevant federal and state court decisions
   - Appellate decisions and precedents
   - Recent rulings in this area
   - Landmark cases that shaped the law

2. STATUTES AND REGULATIONS
   - Applicable federal statutes (U.S. Code)
   - State statutes and laws
   - Federal regulations (CFR, Federal Register)
   - State and local regulations

3. REGULATORY GUIDANCE
   - Agency interpretive guidance
   - No-action letters, advisory opinions
   - Enforcement policy statements
   - FAQ and compliance bulletins

4. ENFORCEMENT ACTIONS
   - SEC, DOJ, FTC enforcement actions
   - State AG actions
   - Consent decrees and settlements
   - Criminal prosecutions

5. LITIGATION HISTORY
   - Active lawsuits and proceedings
   - Class action filings
   - Qui tam and whistleblower cases
   - Arbitration and alternative dispute resolution

6. LEGAL COMMENTARY
   - Law review articles and legal scholarship
   - Bar association publications
   - Legal blog analysis
   - Expert commentary

7. REGULATORY FILINGS
   - SEC filings (8-K, 10-K risk factors)
   - Lobbying disclosures
   - Comment letters on proposed rules
   - Patent and trademark filings

8. CONTRACTUAL ANALYSIS
   - Standard contract terms in this area
   - Key contractual provisions
   - Industry standard agreements
   - Licensing and IP arrangements

9. COMPLIANCE REQUIREMENTS
   - Regulatory compliance checklists
   - Industry standards and best practices
   - Self-regulatory organization rules
   - International compliance requirements

10. LEGAL TRENDS
    - Proposed legislation
    - Regulatory reform initiatives
    - Emerging legal theories
    - Judicial appointment impacts

For a "{granularity}" depth level:
- "quick": Focus on most relevant cases and current regulations
- "standard": Balanced coverage of cases, regulations, and enforcement
- "deep": Comprehensive legal research including commentary and trends

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["SEC v Company X securities fraud case 2024", "GDPR compliance requirements data breach", ...]
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
        """Extract legal research findings."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a legal research analyst extracting key findings for legal analysis.

Research Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

Extract findings in these legal research categories:

1. CASE LAW (finding_type: "evidence")
   - Court decisions and holdings
   - Include: case name, court, date, holding
   - Note precedential value and applicability
   - extracted_data: {{"case_name": "...", "court": "...", "date": "...", "citation": "...", "holding": "...", "precedential_value": "binding/persuasive"}}

2. STATUTES AND REGULATIONS (finding_type: "fact")
   - Applicable laws and regulations
   - Include: statute/regulation name, citation, key provisions
   - Note effective date and amendments
   - extracted_data: {{"name": "...", "citation": "...", "key_provisions": [...], "effective_date": "..."}}

3. ENFORCEMENT ACTIONS (finding_type: "event")
   - Regulatory enforcement and prosecutions
   - Include: agency, respondent, date, allegations, outcome
   - Note penalties, injunctions, and remedies
   - extracted_data: {{"agency": "...", "respondent": "...", "date": "...", "allegations": [...], "outcome": "...", "penalty": ...}}

4. LITIGATION (finding_type: "event")
   - Active and resolved lawsuits
   - Include: parties, court, claims, status
   - Note settlement amounts if disclosed
   - extracted_data: {{"case_name": "...", "court": "...", "filing_date": "...", "claims": [...], "status": "...", "settlement": ...}}

5. REGULATORY GUIDANCE (finding_type: "claim")
   - Agency interpretations and guidance
   - Include: agency, date, topic, key points
   - Note legal weight and binding nature
   - extracted_data: {{"agency": "...", "document_type": "...", "date": "...", "topic": "...", "key_points": [...]}}

6. LEGAL RISKS (finding_type: "pattern")
   - Identified legal exposure patterns
   - Include: risk type, likelihood, severity
   - Note mitigation strategies if mentioned
   - extracted_data: {{"risk_type": "...", "likelihood": "high/medium/low", "severity": "high/medium/low", "mitigation": [...]}}

7. COMPLIANCE REQUIREMENTS (finding_type: "fact")
   - Specific compliance obligations
   - Include: requirement, authority, deadline
   - Note penalties for non-compliance
   - extracted_data: {{"requirement": "...", "authority": "...", "deadline": "...", "penalty": "..."}}

8. LEGAL PRECEDENT (finding_type: "relationship")
   - How cases relate to each other
   - Include: cases involved, relationship type
   - Note whether overruled or distinguished
   - extracted_data: {{"citing_case": "...", "cited_case": "...", "relationship": "follows/distinguishes/overrules/questions"}}

9. LEGAL ANALYSIS (finding_type: "claim")
   - Expert legal opinions and commentary
   - Include: source, position, reasoning
   - Note author credentials
   - extracted_data: {{"source": "...", "author": "...", "position": "...", "reasoning": "..."}}

10. KNOWLEDGE GAPS (finding_type: "gap")
    - Missing legal research
    - What additional research is needed
    - Suggested follow-up sources

For each finding, return:
- finding_type: One of 'evidence', 'fact', 'event', 'claim', 'pattern', 'relationship', 'gap'
- content: Detailed finding with specific citations and facts
- summary: One sentence
- confidence_score: 0.0-1.0 (based on source authority and recency)
- temporal_context: 'past', 'present', 'ongoing', or 'prediction'
- extracted_data: JSON object with structured legal data as specified above

Return as JSON array. Prioritize accuracy and proper legal citations.
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
