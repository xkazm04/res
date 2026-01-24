"""Generate test HTML reports for all business templates.

This script creates mock research data for each test scenario and generates
HTML reports to R2 for review before running real Apify actor tests.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import random
import hashlib

# Current date context for realistic mock data
CURRENT_YEAR = datetime.now().year
CURRENT_MONTH = datetime.now().strftime("%B")
NEXT_YEAR = CURRENT_YEAR + 1
CURRENT_QUARTER = f"Q{(datetime.now().month - 1) // 3 + 1}"

# Add actor to path and change directory for proper imports
actor_path = Path(__file__).parent.parent / "actor"
os.chdir(actor_path)
sys.path.insert(0, str(actor_path))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

# Import directly from the module files
from src.clients.r2 import R2Client
from src.services.report_interactive import generate_interactive_html

# Switch back to researcher root
os.chdir(Path(__file__).parent.parent)


# =============================================================================
# TEST SCENARIOS (28 total)
# =============================================================================

TEST_SCENARIOS = [
    # Tech Market (1-3)
    {"id": 1, "template": "tech_market", "query": "AI coding assistants market adoption and trends 2025", "purpose": "Single technology trend analysis"},
    {"id": 2, "template": "tech_market", "query": "Kubernetes vs Docker Swarm vs Nomad container orchestration 2025", "purpose": "Multi-technology comparison"},
    {"id": 3, "template": "tech_market", "query": "Rust programming language enterprise adoption 2025-2026 predictions", "purpose": "Language adoption forecast"},
    # Financial (4-6)
    {"id": 4, "template": "financial", "query": "NVIDIA Q4 2025 earnings outlook and AI chip market valuation", "purpose": "Single stock analysis"},
    {"id": 5, "template": "financial", "query": "Tesla vs Rivian vs Lucid EV market financial comparison 2025", "purpose": "Sector comparison"},
    {"id": 6, "template": "financial", "query": "Anthropic Series D valuation and competitive financial position", "purpose": "Private company analysis"},
    # Competitive (7-9)
    {"id": 7, "template": "competitive", "query": "Stripe vs Square vs Adyen payment processing market share 2025", "purpose": "Fintech comparison"},
    {"id": 8, "template": "competitive", "query": "AWS vs Azure vs GCP cloud infrastructure competitive analysis", "purpose": "Cloud providers"},
    {"id": 9, "template": "competitive", "query": "Figma vs Sketch vs Adobe XD design tool market positioning", "purpose": "Design tools"},
    # Investigative (10-11)
    {"id": 10, "template": "investigative", "query": "OpenAI leadership governance changes and controversies 2023-2025", "purpose": "Corporate governance"},
    {"id": 11, "template": "investigative", "query": "Binance regulatory issues and legal challenges investigation", "purpose": "Crypto exchange"},
    # Legal (12-14)
    {"id": 12, "template": "legal", "query": "AI copyright and training data lawsuits 2024-2025", "purpose": "IP/Copyright"},
    {"id": 13, "template": "legal", "query": "GDPR enforcement actions against tech companies 2024-2025", "purpose": "Privacy regulation"},
    {"id": 14, "template": "legal", "query": "SEC cryptocurrency and DeFi enforcement actions 2024-2025", "purpose": "Securities regulation"},
    # Contract (15-16)
    {"id": 15, "template": "contract", "query": "US Department of Defense cloud computing contracts JEDI JWCC analysis", "purpose": "Federal IT contract"},
    {"id": 16, "template": "contract", "query": "State of California IT modernization contracts 2024-2025 analysis", "purpose": "State government IT"},
    # Due Diligence (17-19)
    {"id": 17, "template": "due_diligence", "query": "WeWork company vetting and red flags analysis", "purpose": "Failed company case study"},
    {"id": 18, "template": "due_diligence", "query": "Palantir Technologies vendor vetting for enterprise partnership", "purpose": "Enterprise vendor check"},
    {"id": 19, "template": "due_diligence", "query": "Superhuman email client company vetting before enterprise purchase", "purpose": "SaaS vendor evaluation"},
    # Purchase Decision (20-22)
    {"id": 20, "template": "purchase_decision", "query": "MacBook Pro M3 Max vs Dell XPS 15 vs ThinkPad X1 Carbon for software development", "purpose": "Laptop comparison"},
    {"id": 21, "template": "purchase_decision", "query": "Slack vs Microsoft Teams vs Discord for startup team communication", "purpose": "Team software"},
    {"id": 22, "template": "purchase_decision", "query": "Tesla Model 3 vs BMW i4 vs Polestar 2 electric vehicle purchase 2025", "purpose": "EV purchase"},
    # Reputation (23-25)
    {"id": 23, "template": "reputation", "query": "Is Temu legitimate and safe to buy from scam check", "purpose": "E-commerce legitimacy"},
    {"id": 24, "template": "reputation", "query": "Upwork freelancer platform legitimacy and trustworthiness review", "purpose": "Platform reputation"},
    {"id": 25, "template": "reputation", "query": "Celsius Network cryptocurrency platform legitimacy check", "purpose": "Crypto platform (known fraud)"},
    # Understanding (26-28)
    {"id": 26, "template": "understanding", "query": "OpenAI Sam Altman firing and reinstatement November 2023 causes and analysis", "purpose": "Corporate crisis"},
    {"id": 27, "template": "understanding", "query": "Silicon Valley Bank collapse March 2023 causes and implications", "purpose": "Financial crisis"},
    {"id": 28, "template": "understanding", "query": "EU AI Act passage 2024 implications and industry response", "purpose": "Regulatory event"},
]


FINDING_TYPES_BY_TEMPLATE = {
    "tech_market": ["adoption_trend", "market_size", "prediction", "technology_comparison", "developer_sentiment", "funding_event"],
    "financial": ["revenue_metric", "valuation", "risk_factor", "market_position", "earnings_data", "analyst_rating"],
    "competitive": ["market_share", "pricing_strategy", "feature_comparison", "strategic_move", "weakness", "opportunity"],
    "investigative": ["relationship", "financial_flow", "red_flag", "timeline_event", "key_actor", "evidence"],
    "legal": ["case_ruling", "regulatory_action", "compliance_requirement", "precedent", "legal_risk", "settlement"],
    "contract": ["pricing_analysis", "red_flag", "contract_entity", "bid_process", "suspicious_element", "comparable_contract"],
    "due_diligence": ["company_profile", "financial_health", "legal_history", "red_flag", "reputation_signal", "key_person"],
    "purchase_decision": ["product_strength", "product_weakness", "real_user_experience", "hidden_cost", "alternative_option", "value_assessment"],
    "reputation": ["trust_signal", "warning_sign", "complaint_pattern", "verification_status", "sentiment_trend", "comparison_benchmark"],
    "understanding": ["event_chain", "media_narrative", "financial_motivation", "misinformation_pattern", "actor_interest", "historical_parallel"],
}

PERSPECTIVES_BY_TEMPLATE = {
    "tech_market": ["venture_capitalist", "startup_founder", "product_manager", "senior_engineer", "developer_advocate"],
    "financial": ["institutional_investor", "short_seller", "quantitative_risk", "macro_strategist"],
    "competitive": ["strategy_consultant", "industry_insider", "institutional_investor"],
    "investigative": ["forensic_financial", "power_network", "psychological_behavioral", "legal_liability"],
    "legal": ["litigation_strategist", "regulatory_expert", "legal_liability"],
    "contract": ["contract_auditor", "procurement_investigator", "forensic_accountant", "industry_benchmarker"],
    "due_diligence": ["due_diligence_analyst", "forensic_financial", "legal_liability"],
    "purchase_decision": ["consumer_advocate", "technical_expert", "value_analyst", "long_term_owner"],
    "reputation": ["consumer_protection", "reputation_analyst", "fact_checker"],
    "understanding": ["media_analyst", "fact_checker", "historian", "intelligence_analyst", "geopolitical_strategic"],
}


def generate_mock_finding(template: str, query: str, index: int) -> Dict[str, Any]:
    """Generate a realistic mock finding based on template type."""
    finding_types = FINDING_TYPES_BY_TEMPLATE.get(template, ["fact"])
    finding_type = finding_types[index % len(finding_types)]

    content_templates = {
        "tech_market": {
            "adoption_trend": f"Developer adoption of tools related to '{query[:30]}' has increased by {random.randint(20, 45)}% year-over-year, with enterprise usage growing particularly fast in financial services and healthcare sectors.",
            "market_size": f"The market for solutions addressing '{query[:30]}' is projected to reach ${random.randint(5, 50)} billion by 2026, growing at a CAGR of {random.randint(15, 35)}%.",
            "prediction": f"Based on current trends, by Q4 2025 we expect {random.randint(60, 80)}% of Fortune 500 companies to have adopted solutions in the '{query[:25]}' space.",
            "technology_comparison": f"Benchmarks show significant performance differences between leading solutions, with some achieving {random.randint(2, 5)}x faster execution times.",
            "developer_sentiment": f"Developer surveys indicate {random.randint(65, 85)}% satisfaction with current tooling, though {random.randint(30, 50)}% cite learning curve as a major challenge.",
            "funding_event": f"Recent funding rounds in this space totaled ${random.randint(100, 500)}M in Q4 2024, with valuations increasing {random.randint(20, 40)}% from previous rounds.",
        },
        "financial": {
            "revenue_metric": f"Revenue grew {random.randint(10, 35)}% year-over-year to ${random.randint(5, 50)}B, beating analyst expectations by {random.randint(2, 8)}%.",
            "valuation": f"Current P/E ratio of {random.randint(20, 80)} is {random.randint(10, 30)}% above sector average, reflecting growth premium.",
            "risk_factor": f"Key risk factors include regulatory uncertainty and {random.randint(30, 50)}% revenue concentration in top 5 customers.",
            "market_position": f"Market share of {random.randint(15, 45)}% positions the company as the {['leader', 'challenger', 'fast follower'][index % 3]} in the sector.",
            "earnings_data": f"EPS of ${random.uniform(1.5, 8.5):.2f} exceeded consensus by {random.randint(3, 12)}%, driven by margin expansion.",
            "analyst_rating": f"Analyst consensus has shifted to {['Strong Buy', 'Buy', 'Hold'][index % 3]} with average price target of ${random.randint(150, 500)}.",
        },
        "competitive": {
            "market_share": f"Market share analysis shows the leader commanding {random.randint(25, 45)}% of the market, with {random.randint(3, 5)} competitors splitting the remainder.",
            "pricing_strategy": f"Pricing tiers range from ${random.randint(10, 50)}/month for SMB to enterprise agreements averaging ${random.randint(50, 200)}K/year.",
            "feature_comparison": f"Feature analysis reveals {random.randint(3, 7)} key differentiators, with integration capabilities being the most significant.",
            "strategic_move": f"Recent strategic moves include expansion into {random.randint(3, 8)} new markets and {random.randint(2, 4)} strategic acquisitions.",
            "weakness": f"Primary competitive weakness identified: {['limited enterprise features', 'higher pricing', 'narrower integration ecosystem', 'slower innovation pace'][index % 4]}.",
            "opportunity": f"Untapped opportunity in {['mid-market segment', 'vertical-specific solutions', 'international expansion', 'adjacent product categories'][index % 4]}.",
        },
        "investigative": {
            "relationship": f"Analysis reveals undisclosed relationship between key actors, with {random.randint(3, 8)} overlapping board positions or investments.",
            "financial_flow": f"Financial flows of ${random.randint(10, 100)}M traced through {random.randint(3, 6)} intermediary entities across {random.randint(2, 4)} jurisdictions.",
            "red_flag": f"Critical red flag: {['Undisclosed related-party transactions', 'Missing board meeting minutes', 'Inconsistent financial reporting', 'Unusual executive departures'][index % 4]}.",
            "timeline_event": f"Key event on {['January', 'March', 'June', 'September'][index % 4]} {random.randint(2022, 2024)} significantly altered the trajectory of events.",
            "key_actor": f"Key actor identified with {random.randint(10, 25)} years of industry experience and connections to {random.randint(5, 15)} related entities.",
            "evidence": f"Documentary evidence from {['SEC filings', 'court documents', 'leaked communications', 'whistleblower testimony'][index % 4]} supports the finding.",
        },
        "legal": {
            "case_ruling": f"Court ruled in favor of {['plaintiff', 'defendant'][index % 2]}, establishing precedent for {['data privacy', 'IP rights', 'regulatory compliance'][index % 3]} cases.",
            "regulatory_action": f"Regulatory action resulted in ${random.randint(10, 500)}M penalty and {random.randint(12, 36)}-month compliance monitoring.",
            "compliance_requirement": f"New compliance requirements effective {['Q1', 'Q2', 'Q3', 'Q4'][index % 4]} 2025 will require significant operational changes.",
            "precedent": f"This case may establish precedent affecting {random.randint(100, 1000)}+ similar pending matters.",
            "legal_risk": f"Legal exposure estimated at ${random.randint(50, 500)}M based on similar case outcomes and current regulatory environment.",
            "settlement": f"Settlement of ${random.randint(25, 250)}M reached, representing {random.randint(30, 60)}% of initial claims.",
        },
        "contract": {
            "pricing_analysis": f"Contract pricing is {random.randint(15, 45)}% above market benchmarks for comparable scope and complexity.",
            "red_flag": f"Red flag identified: {['Sole-source justification appears manufactured', 'Pricing inconsistent with market rates', 'Change orders exceed 25% of original value'][index % 3]}.",
            "contract_entity": f"Primary contractor has {random.randint(5, 15)} years experience with ${random.randint(100, 500)}M in similar contracts.",
            "bid_process": f"Bid process involved {random.randint(2, 8)} bidders with award based on {['lowest price', 'best value', 'technical approach'][index % 3]}.",
            "suspicious_element": f"Unusual pattern: {random.randint(3, 7)} similar contracts awarded to related entities over {random.randint(2, 4)} years.",
            "comparable_contract": f"Comparable contracts in other jurisdictions averaged ${random.randint(20, 60)}M less for similar scope.",
        },
        "due_diligence": {
            "company_profile": f"Company founded in {random.randint(2010, 2020)} with {random.randint(50, 500)} employees and ${random.randint(10, 200)}M annual revenue.",
            "financial_health": f"Financial indicators show {['strong', 'moderate', 'concerning'][index % 3]} health with {random.randint(6, 24)} months runway.",
            "legal_history": f"Legal history includes {random.randint(0, 5)} significant matters, with {random.randint(0, 2)} currently pending.",
            "red_flag": f"Due diligence red flag: {['High executive turnover', 'Inconsistent revenue reporting', 'Undisclosed liabilities', 'Related-party concerns'][index % 4]}.",
            "reputation_signal": f"Industry reputation rated {random.randint(3, 5)}/5 based on {random.randint(50, 200)}+ verified reviews.",
            "key_person": f"Leadership team has average tenure of {random.randint(2, 8)} years with {['strong', 'mixed', 'limited'][index % 3]} track record.",
        },
        "purchase_decision": {
            "product_strength": f"Key strength: {['Build quality', 'Performance', 'Value for money', 'Customer support', 'Feature set'][index % 5]} rated highly by {random.randint(70, 95)}% of users.",
            "product_weakness": f"Common complaint: {['Battery life', 'Learning curve', 'Price', 'Limited customization', 'Reliability issues'][index % 5]} mentioned in {random.randint(15, 40)}% of reviews.",
            "real_user_experience": f"After {random.randint(6, 24)} months of use, {random.randint(60, 85)}% of owners report satisfaction with their purchase.",
            "hidden_cost": f"Hidden costs include {['required accessories', 'subscription fees', 'maintenance costs', 'upgrade requirements'][index % 4]} totaling ${random.randint(100, 500)}/year.",
            "alternative_option": f"Strong alternative: offers similar functionality at {random.randint(10, 30)}% {'higher' if index % 2 else 'lower'} price point.",
            "value_assessment": f"Overall value rating: {random.randint(3, 5)}/5 based on price-to-features ratio.",
        },
        "reputation": {
            "trust_signal": f"Trust signal: {['BBB accreditation', 'Industry certifications', 'Public company transparency', 'Long operating history'][index % 4]} verified.",
            "warning_sign": f"Warning sign: {['Recent lawsuit patterns', 'Negative review trends', 'Regulatory complaints', 'Payment processing issues'][index % 4]} detected.",
            "complaint_pattern": f"Recurring complaints about {['shipping delays', 'product quality', 'customer service', 'refund process'][index % 4]} in {random.randint(20, 40)}% of negative reviews.",
            "verification_status": f"Business registration and credentials {['fully verified', 'partially verified', 'unable to verify'][index % 3]}.",
            "sentiment_trend": f"Sentiment trajectory: {['improving', 'stable', 'declining'][index % 3]} over the past {random.randint(6, 18)} months.",
            "comparison_benchmark": f"Compared to {random.randint(5, 15)} competitors, ranks in the {['top', 'middle', 'bottom'][index % 3]} tier for trustworthiness.",
        },
        "understanding": {
            "event_chain": f"Key precipitating event occurred {random.randint(1, 6)} months before the main event, setting the stage for subsequent developments.",
            "media_narrative": f"Media coverage {['accurately reflected', 'partially distorted', 'significantly misrepresented'][index % 3]} the underlying facts.",
            "financial_motivation": f"Financial interests of ${random.randint(100, 500)}M identified as potential motivation for key actors.",
            "misinformation_pattern": f"Misinformation pattern detected: {['cherry-picked data', 'out-of-context quotes', 'misleading timeline', 'false attribution'][index % 4]}.",
            "actor_interest": f"Stated vs actual interests diverge significantly for {random.randint(2, 5)} key stakeholders.",
            "historical_parallel": f"Historical parallel to events of {random.randint(2000, 2020)} provides context for understanding current situation.",
        },
    }

    content = content_templates.get(template, {}).get(
        finding_type,
        f"Key finding related to '{query[:30]}' with {random.randint(60, 95)}% confidence based on {random.randint(3, 8)} sources."
    )

    # Use current/recent dates for realistic context
    recent_months = [CURRENT_MONTH, "December", "November", "October"]
    date_ref = f"{random.choice(recent_months)} {random.choice([CURRENT_YEAR, CURRENT_YEAR])}"
    quarter_ref = f"{random.choice([CURRENT_QUARTER, 'Q4', 'Q1'])} {random.choice([CURRENT_YEAR, NEXT_YEAR])}"

    return {
        "finding_id": f"f{index + 1}",
        "finding_type": finding_type,
        "content": content,
        "summary": content[:80] + "..." if len(content) > 80 else content,
        "confidence_score": round(random.uniform(0.6, 0.95), 2),
        "adjusted_confidence": round(random.uniform(0.55, 0.92), 2),
        "temporal_context": random.choice(["present", "recent", "prediction"]),
        "date_referenced": date_ref,
        "date_range": quarter_ref,
        "extracted_data": {
            "metric": f"{random.randint(10, 90)}%",
            "entity": query.split()[0] if query else "Entity",
            "amount": f"${random.randint(1, 100)}M" if random.random() > 0.5 else None,
        },
        "verification": {"bias_detected": random.random() > 0.7, "expert_validated": random.random() > 0.3, "cross_referenced": random.random() > 0.4},
        "supporting_sources": [{"url": f"https://source{i}.com/article", "title": f"Source {i} - {query[:20]}"} for i in range(random.randint(1, 3))],
    }


def generate_mock_perspective(template: str, perspective_type: str, query: str) -> Dict[str, Any]:
    """Generate a realistic mock perspective analysis."""
    return {
        "perspective_type": perspective_type,
        "analysis_text": f"From a {perspective_type.replace('_', ' ')} perspective, the research on '{query[:40]}' reveals several key patterns. Market dynamics suggest continued evolution with significant opportunities and risks. Based on {random.randint(5, 15)} key indicators, the overall outlook is {random.choice(['positive', 'cautiously optimistic', 'mixed', 'concerning'])}. This analysis draws on {random.randint(10, 25)} years of domain expertise.",
        "key_insights": [
            f"Key pattern identified in market behavior related to {query[:20]}",
            f"Significant shift in stakeholder dynamics observed over the past {random.randint(6, 18)} months",
            f"Emerging trend suggests {random.randint(20, 40)}% probability of major development",
            f"Critical dependency on {random.randint(2, 5)} external factors that require monitoring",
            f"Opportunity for strategic advantage in underserved segment",
        ][:random.randint(3, 5)],
        "recommendations": [
            "Consider diversifying approach to mitigate identified risks",
            "Monitor developments in related sectors for early warning signals",
            f"Establish contingency plans for {random.randint(2, 4)} key scenarios",
            "Engage with key stakeholders to validate assumptions",
        ][:random.randint(2, 4)],
        "predictions": [
            {"prediction": f"Market consolidation expected within {random.randint(12, 24)} months", "rationale": f"Based on historical patterns and current competitive dynamics. Analysis of {random.randint(15, 40)} similar market transitions suggests a consolidation phase typically begins {random.randint(6, 12)} months after reaching current saturation levels.", "confidence": random.choice(["high", "medium"]), "timeline": f"Q{random.randint(1, 4)} {NEXT_YEAR}", "supporting_sources": ["Industry analysis", "Expert interviews", "M&A transaction data"]},
            {"prediction": f"Regulatory changes likely to impact {random.randint(30, 60)}% of market participants", "rationale": f"Legislative momentum in {random.randint(3, 7)} major jurisdictions and {random.randint(10, 25)} recent enforcement actions indicate increased scrutiny. Companies without proactive compliance programs face elevated risk.", "confidence": random.choice(["high", "medium"]), "timeline": f"H2 {NEXT_YEAR}", "supporting_sources": ["Regulatory filings", "Policy analysis", "Enforcement actions database"]},
            {"prediction": f"New entrants expected to capture {random.randint(10, 25)}% market share", "rationale": f"Technology shifts are lowering barriers to entry. Analysis shows {random.randint(20, 50)} well-funded startups in stealth mode, with combined funding of ${random.randint(500, 2000)}M targeting this space.", "confidence": "medium", "timeline": f"Next {random.randint(12, 24)} months", "supporting_sources": ["Market research", "Venture funding data", "Patent filings"]},
        ][:random.randint(2, 3)],
        "warnings": [
            "Risk of overestimating market readiness for new solutions",
            "Potential for regulatory disruption in key markets",
            "Competitive response may be stronger than anticipated",
        ][:random.randint(1, 3)],
        "confidence": round(random.uniform(0.65, 0.90), 2),
    }


def generate_mock_source(index: int, query: str) -> Dict[str, Any]:
    """Generate a realistic mock source."""
    domains = [
        ("techcrunch.com", "TechCrunch", 0.85), ("reuters.com", "Reuters", 0.92), ("bloomberg.com", "Bloomberg", 0.90),
        ("wsj.com", "Wall Street Journal", 0.88), ("theverge.com", "The Verge", 0.78), ("arstechnica.com", "Ars Technica", 0.82),
        ("forbes.com", "Forbes", 0.75), ("wired.com", "WIRED", 0.80), ("ft.com", "Financial Times", 0.89),
        ("nytimes.com", "New York Times", 0.87), ("sec.gov", "SEC EDGAR", 0.95), ("github.com", "GitHub", 0.85),
    ]
    domain, name, base_cred = domains[index % len(domains)]
    return {
        "url": f"https://{domain}/article/{hashlib.md5(query.encode()).hexdigest()[:8]}",
        "title": f"{name}: Analysis of {query[:40]}",
        "domain": domain,
        "snippet": f"In-depth coverage of recent developments regarding {query[:50]}.",
        "credibility_score": round(base_cred + random.uniform(-0.1, 0.1), 2),
        "credibility_label": "high" if base_cred >= 0.8 else "medium",
        "source_type": random.choice(["news", "research", "official", "analysis"]),
    }


def generate_mock_research_result(scenario: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a complete mock research result for a scenario."""
    template = scenario["template"]
    query = scenario["query"]

    findings = [generate_mock_finding(template, query, i) for i in range(random.randint(12, 20))]
    if template in ["investigative", "contract", "due_diligence", "reputation"]:
        for i in range(random.randint(1, 3)):
            findings[i]["finding_type"] = "red_flag"

    perspective_types = PERSPECTIVES_BY_TEMPLATE.get(template, ["analyst"])
    perspectives = [generate_mock_perspective(template, pt, query) for pt in perspective_types[:random.randint(3, 5)]]
    sources = [generate_mock_source(i, query) for i in range(random.randint(15, 25))]
    search_queries = [f"{query}", f"{query} analysis 2025", f"{query} trends", f"{query} market research", f"{query} expert opinion"]

    contradictions = []
    if template in ["understanding", "investigative"] and len(findings) >= 4:
        contradictions = [{"finding_a_id": "f1", "finding_a_summary": findings[0]["summary"][:60], "finding_b_id": "f3", "finding_b_summary": findings[2]["summary"][:60], "description": "These findings present conflicting interpretations", "resolution_hint": "Further investigation needed"}]

    role_summaries = {}
    if template in ["tech_market", "financial", "competitive"]:
        role_summaries = {
            "cto": {"role_title": "Chief Technology Officer", "headline": f"Technical implications of {query[:30]}", "key_points": ["Technology stack considerations", "Integration complexity", "Technical risk factors"], "action_items": ["Conduct technical feasibility assessment", "Evaluate vendor capabilities"], "risks_to_watch": ["Technical debt accumulation", "Vendor lock-in"], "confidence_level": "medium"},
            "cfo": {"role_title": "Chief Financial Officer", "headline": f"Financial impact of {query[:30]}", "key_points": ["ROI projections", "Capital expenditure", "Operating cost implications"], "action_items": ["Model financial scenarios", "Assess budget allocation"], "risks_to_watch": ["Cost overrun potential", "Revenue impact timing"], "confidence_level": "high"},
        }

    return {
        "session_id": f"test_{scenario['id']:02d}_{template}",
        "query": query,
        "template": template,
        "status": "completed",
        "findings": findings,
        "perspectives": perspectives,
        "sources": sources,
        "search_queries_executed": search_queries,
        "cost_summary": {"total_cost_usd": round(random.uniform(0.08, 0.25), 4), "gemini_cost_usd": round(random.uniform(0.05, 0.15), 4), "gemini_tokens_used": random.randint(30000, 80000), "total_tokens": random.randint(35000, 90000), "searches_performed": len(search_queries)},
        "execution_time_seconds": round(random.uniform(120, 480), 1),
        "contradictions": contradictions,
        "role_summaries": role_summaries,
        "knowledge_gaps": [{"summary": "Limited data on long-term outcomes", "suggested_query": f"{query} long-term study"}] if random.random() > 0.5 else [],
    }


def main():
    """Generate all test reports and upload to R2."""
    print("=" * 60)
    print("TEST REPORT GENERATOR")
    print("=" * 60)

    r2_client = R2Client(
        account_id=os.getenv("R2_ACCOUNT_ID"),
        access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        bucket_name=os.getenv("R2_BUCKET_NAME"),
    )

    results = []
    failed = []
    print(f"\nGenerating {len(TEST_SCENARIOS)} test reports...\n")

    for scenario in TEST_SCENARIOS:
        try:
            print(f"[{scenario['id']:02d}/{len(TEST_SCENARIOS)}] {scenario['template']}: {scenario['query'][:50]}...")
            research_result = generate_mock_research_result(scenario)
            title = f"Test #{scenario['id']:02d} - {scenario['template'].replace('_', ' ').title()}"
            html_content = generate_interactive_html(research_result, title)
            job_id = f"test_{scenario['id']:02d}_{scenario['template']}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            url = r2_client.upload_report(job_id=job_id, html_content=html_content)
            results.append({"id": scenario["id"], "template": scenario["template"], "query": scenario["query"], "purpose": scenario["purpose"], "url": url, "job_id": job_id, "findings_count": len(research_result["findings"]), "perspectives_count": len(research_result["perspectives"]), "sources_count": len(research_result["sources"])})
            print(f"         Uploaded: {url}")
        except Exception as e:
            print(f"         ERROR: {e}")
            failed.append({"id": scenario["id"], "error": str(e)})

    print("\n" + "=" * 60)
    print(f"SUMMARY: {len(results)} successful, {len(failed)} failed")
    print("=" * 60)

    output_file = Path(__file__).parent.parent / "test_reports" / "manifest.json"
    output_file.parent.mkdir(exist_ok=True)
    with open(output_file, "w") as f:
        json.dump({"generated_at": datetime.utcnow().isoformat(), "total_scenarios": len(TEST_SCENARIOS), "successful": len(results), "failed": len(failed), "reports": results, "errors": failed}, f, indent=2)

    index_file = Path(__file__).parent.parent / "test_reports" / "INDEX.md"
    with open(index_file, "w") as f:
        f.write("# Test Report Index\n\n")
        f.write(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n")
        f.write("## Reports by Template\n\n")
        by_template = {}
        for r in results:
            by_template.setdefault(r["template"], []).append(r)
        for template, reports in sorted(by_template.items()):
            f.write(f"### {template.replace('_', ' ').title()}\n\n")
            f.write("| # | Query | Findings | View |\n|---|-------|----------|------|\n")
            for r in reports:
                f.write(f"| {r['id']} | {r['query'][:40]}... | {r['findings_count']} | [Open]({r['url']}) |\n")
            f.write("\n")

    print(f"\nResults saved to: {output_file}")
    print(f"Index saved to: {index_file}")
    return len(failed) == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
