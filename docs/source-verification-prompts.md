# Source Verification & Critical Analysis Prompts

## Overview

This document outlines prompt engineering strategies to add a verification layer that cross-references findings, detects bias, and applies expert judgment to identify unreliable claims.

---

## The Problem with Raw Web Research

| Issue | Example | Risk |
|-------|---------|------|
| **Vendor Marketing** | "Our tool increases productivity by 300%" | Inflated metrics, cherry-picked data |
| **Analyst Conflicts** | Gartner report sponsored by vendor | Pay-to-play rankings |
| **Lazy Journalism** | Article cites another article, not primary source | Telephone game distortion |
| **Outdated Data** | "2023 survey shows..." cited in 2025 article | Stale conclusions |
| **Sample Bias** | Survey of 50 enterprise customers | Not representative |
| **Survivorship Bias** | "Companies using X grew 40%" | What about companies that failed? |

---

## Verification Prompt Architecture

### Phase 1: Cross-Reference Analysis

Run after initial finding extraction to compare claims across sources.

```python
CROSS_REFERENCE_PROMPT = """
You are a research verification analyst. Your job is to cross-reference findings
and identify discrepancies, agreements, and data quality issues.

FINDINGS TO VERIFY:
{findings_json}

SOURCES REFERENCED:
{sources_with_snippets}

For each quantitative claim (percentages, market sizes, adoption rates, growth figures):

1. CLAIM MAPPING
   - Extract the specific claim and its value
   - List ALL sources that mention this metric
   - Note the exact values from each source

2. DISCREPANCY ANALYSIS
   If sources disagree:
   - Calculate the variance (e.g., "Source A: 40%, Source B: 65%" = 25pp variance)
   - Rate discrepancy severity: minor (<10%), moderate (10-25%), major (>25%)
   - Hypothesize WHY they differ:
     * Different time periods?
     * Different definitions (e.g., "adoption" vs "awareness")?
     * Different sample populations?
     * One is primary research, other is citing secondary?

3. SOURCE AGREEMENT SCORE
   For each claim, calculate:
   - sources_supporting: How many sources confirm this value (±10%)
   - sources_contradicting: How many sources give significantly different values
   - agreement_ratio: sources_supporting / total_sources_mentioning

4. VERIFICATION STATUS
   Assign status based on:
   - "verified": 3+ independent sources agree (±10%), includes primary source
   - "likely_accurate": 2 sources agree, no contradictions
   - "disputed": Sources significantly disagree
   - "unverified": Only 1 source, or only secondary sources
   - "suspicious": Claim appears only in vendor/promotional content

Return as JSON:
{
  "claim_verifications": [
    {
      "claim": "GitHub Copilot has 1.8M paid subscribers",
      "claimed_value": "1.8M",
      "sources_mentioning": ["github.blog", "techcrunch.com", "theverge.com"],
      "source_values": {"github.blog": "1.8M", "techcrunch.com": "1.8M", "theverge.com": "nearly 2M"},
      "agreement_ratio": 0.95,
      "discrepancy_severity": "minor",
      "verification_status": "verified",
      "primary_source_identified": "github.blog (company announcement)",
      "notes": "All sources trace back to GitHub's official announcement"
    }
  ]
}
"""
```

---

### Phase 2: Bias & "Skin in the Game" Detection

```python
BIAS_DETECTION_PROMPT = """
You are an investigative analyst trained to identify bias, conflicts of interest,
and "skin in the game" that might distort information accuracy.

FINDING TO ANALYZE:
{finding}

SOURCE DETAILS:
- URL: {url}
- Domain: {domain}
- Title: {title}
- Full snippet: {snippet}

Perform BIAS ANALYSIS:

1. SOURCE TYPE CLASSIFICATION
   Classify the source:
   - vendor_content: Published by a company about their own product
   - sponsored_research: Research funded by interested party
   - analyst_report: Industry analyst (check for vendor relationships)
   - independent_journalism: News outlet with editorial standards
   - academic_research: Peer-reviewed or university research
   - community_content: Developer blogs, forums, Stack Overflow
   - government_official: Regulatory or government source
   - aggregator: Site that compiles others' data

2. SKIN IN THE GAME ANALYSIS
   Who benefits if this claim is believed?

   Check for:
   - VENDOR SELF-PROMOTION: Is the source selling what they're praising?
     * "Microsoft reports Copilot increases productivity" → Microsoft sells Copilot
   - ANALYST CONFLICTS: Do analysts have financial relationships?
     * Gartner Magic Quadrant often involves vendor payments
   - AFFILIATE/REFERRAL: Does the article contain affiliate links?
   - COMPETITIVE POSITIONING: Is source trashing a competitor?
   - INVESTMENT TALKING BOOK: Is source long/short the stock?

3. METHODOLOGY RED FLAGS
   Look for:
   - SAMPLE SIZE: Is it stated? Is it adequate? (n=50 enterprises ≠ representative)
   - SELECTION BIAS: How were participants chosen?
   - DEFINITION GAMES: "Adoption" can mean trial, purchase, or active use
   - TIME PERIOD: When was data collected? Is it still relevant?
   - GEOGRAPHIC BIAS: US-only survey presented as global trend?
   - SURVIVORSHIP BIAS: Only successful cases studied?

4. CITATION CHAIN
   - Is this PRIMARY data (original research/announcement)?
   - Is this SECONDARY (citing another article)?
   - Is this TERTIARY (citing an article that cited an article)?
   - Can you trace back to the original source?

5. LINGUISTIC RED FLAGS
   Watch for weasel words and marketing language:
   - "Up to X%" (cherry-picked best case)
   - "Studies show" (which studies?)
   - "Experts agree" (which experts?)
   - "Industry-leading" (by what measure?)
   - "Revolutionary/Game-changing" (marketing speak)
   - Lack of specific numbers (vague claims)

Return as JSON:
{
  "source_type": "vendor_content",
  "bias_score": 0.7,  // 0 = unbiased, 1 = heavily biased
  "bias_direction": "promotional",  // promotional, critical, neutral
  "skin_in_the_game": {
    "identified": true,
    "beneficiary": "Microsoft",
    "relationship": "Source is the vendor of the product being praised",
    "financial_interest": "Direct revenue from Copilot subscriptions"
  },
  "methodology_issues": [
    "Sample limited to 'select enterprise customers' - likely cherry-picked",
    "No control group mentioned",
    "Productivity measured by 'developer satisfaction' not output"
  ],
  "citation_depth": "primary",
  "linguistic_red_flags": ["up to 55% faster", "developers love"],
  "credibility_adjustment": -0.3,  // Suggested adjustment to confidence score
  "recommendation": "Cross-reference with independent studies before citing"
}
"""
```

---

### Phase 3: Expert Sanity Check

Use the LLM's training knowledge to flag implausible claims.

```python
EXPERT_SANITY_CHECK_PROMPT = """
You are a senior technology analyst with 20 years of experience tracking developer tools,
cloud infrastructure, and enterprise software markets. Use your expertise to evaluate
whether these findings pass the "smell test."

FINDINGS TO EVALUATE:
{findings_json}

For each finding, apply EXPERT JUDGMENT:

1. PLAUSIBILITY CHECK
   Based on your knowledge of this market:
   - Does this number seem reasonable?
   - Does it align with what you know about market sizes, growth rates, adoption patterns?
   - Are there historical precedents for claims of this magnitude?

   Examples of implausible claims:
   - "40% of developers use X" when X launched 6 months ago
   - "Market grew 500% YoY" in a mature market
   - "100% of enterprises adopted" anything
   - Productivity gains >100% (usually 10-30% is realistic)

2. HISTORICAL PATTERN MATCHING
   Compare to similar technologies:
   - How long did similar tools take to reach this adoption?
   - What were typical growth rates for comparable products?
   - Does this follow the technology adoption curve realistically?

   Reference points from your knowledge:
   - Docker: ~5 years from launch to mainstream enterprise adoption
   - Kubernetes: ~4 years to cross 50% enterprise adoption
   - Cloud (AWS): ~10 years to become dominant
   - React: ~3 years to become leading frontend framework

3. INTERNAL CONSISTENCY
   Do the findings contradict each other?
   - Finding A says "adoption is 40%", Finding B says "still early stage"
   - Market size claims that don't match adoption × price calculations
   - Growth rates that would imply impossible future market sizes

4. MISSING CONTEXT FLAGS
   What important context is missing?
   - Base rate not provided ("grew 200%" from what base?)
   - Comparison group not defined ("faster than traditional methods" - which methods?)
   - Success criteria not specified ("successful deployment" defined how?)

5. EXTRAORDINARY CLAIMS CHECK
   Flag claims that require extraordinary evidence:
   - Any claim of >50% productivity improvement
   - Any claim of >80% adoption rate
   - Any claim of >200% YoY growth in established markets
   - Any "first ever" or "only solution" claims

Return as JSON:
{
  "expert_evaluations": [
    {
      "finding_id": "f1",
      "claim": "AI coding assistants boost productivity by 55%",
      "plausibility": "questionable",
      "plausibility_score": 0.4,  // 0 = implausible, 1 = highly plausible
      "reasoning": "55% productivity gain is at the high end of any tooling improvement.
                    Most developer tool studies show 10-30% gains. The 55% figure likely
                    measures 'time to complete specific tasks' not overall productivity.",
      "historical_comparison": "IDE autocomplete showed ~15% productivity gains when introduced.
                                TDD adoption showed ~20% reduction in bugs but minimal speed gains.
                                55% would be unprecedented for a coding tool.",
      "adjusted_estimate": "Realistic productivity gain likely 15-30% for suitable tasks",
      "confidence_adjustment": -0.2,
      "red_flags": ["Measurement methodology unclear", "Vendor-sponsored study"],
      "what_would_change_my_mind": "Independent academic study with control group,
                                    measuring shipped features not task completion time"
    }
  ]
}
"""
```

---

### Phase 4: Quality Assessment of Sources

```python
SOURCE_QUALITY_PROMPT = """
You are a research librarian and fact-checker evaluating source quality for a
professional research report.

SOURCE TO EVALUATE:
- URL: {url}
- Domain: {domain}
- Title: {title}
- Publication Date: {date}
- Author: {author}
- Content Snippet: {snippet}

Evaluate on these dimensions:

1. PUBLICATION CREDIBILITY
   Rate the publication (not the specific article):
   - Tier 1 (High): Major newspapers (NYT, WSJ), top tech publications (Ars Technica),
                    academic journals, official company announcements, government sources
   - Tier 2 (Medium): Established tech blogs (TechCrunch), analyst firms (with caveats),
                      well-known industry publications
   - Tier 3 (Low): Personal blogs, content farms, unknown publications,
                   obvious marketing sites, aggregators

2. AUTHOR CREDIBILITY
   If author is identifiable:
   - What is their expertise/background?
   - Do they have a track record in this domain?
   - Any known biases or affiliations?
   - If author unknown: flag as credibility risk

3. FRESHNESS ASSESSMENT
   - Publication date vs. data date (article may be new but cite old data)
   - Is this information time-sensitive?
   - Freshness score: current (<3mo), recent (3-12mo), dated (1-2yr), stale (>2yr)

4. EVIDENCE QUALITY
   What type of evidence does the source provide?
   - Primary data: Original research, surveys, experiments
   - Secondary analysis: Analysis of others' data
   - Expert opinion: Informed but not data-backed
   - Anecdote: Individual case studies
   - Speculation: Forward-looking without data

5. CITATION PRACTICES
   Does the source:
   - Link to primary sources?
   - Provide methodology details?
   - Acknowledge limitations?
   - Present counter-arguments?

Return as JSON:
{
  "source_quality_assessment": {
    "url": "...",
    "publication_tier": 2,
    "publication_credibility": 0.7,
    "author_credibility": 0.6,
    "author_notes": "Staff writer, no specific expertise in AI tools",
    "freshness": "recent",
    "freshness_score": 0.8,
    "data_date": "2024-Q3",
    "evidence_type": "secondary_analysis",
    "evidence_quality": 0.5,
    "citation_quality": 0.4,
    "citation_notes": "Cites TechCrunch which cites GitHub blog - tertiary source",
    "overall_quality_score": 0.58,
    "recommended_use": "Background context only, verify key claims with primary source",
    "trust_but_verify": ["GitHub subscriber number", "productivity percentage"]
  }
}
"""
```

---

### Phase 5: Contradiction Resolution

When sources disagree, determine which is more likely correct.

```python
CONTRADICTION_RESOLUTION_PROMPT = """
You are an expert fact-checker resolving conflicting information from multiple sources.

CONTRADICTION IDENTIFIED:
Claim: "{claim_topic}"

SOURCE A:
- Publication: {source_a_domain}
- Claims: {source_a_value}
- Context: {source_a_snippet}
- Date: {source_a_date}

SOURCE B:
- Publication: {source_b_domain}
- Claims: {source_b_value}
- Context: {source_b_snippet}
- Date: {source_b_date}

RESOLVE THE CONTRADICTION:

1. IDENTIFY ROOT CAUSE
   Why might these sources disagree?

   Common causes:
   - TEMPORAL: Different time periods measured
   - DEFINITIONAL: Different definitions of the same term
     * "Adoption" can mean: awareness, trial, purchase, active use, at scale
     * "Developers" can mean: all, professional, enterprise, full-time
   - METHODOLOGICAL: Different survey methods, sample sizes
   - GEOGRAPHIC: Different regions measured
   - SEGMENT: Different market segments (enterprise vs SMB, US vs global)
   - ROUNDING/ESTIMATION: Different rounding or estimation approaches
   - ERROR: One source is simply wrong
   - SPIN: One source is presenting data misleadingly

2. EVIDENCE WEIGHING
   Which source is more likely correct?

   Consider:
   - Proximity to primary data (first-hand > second-hand > third-hand)
   - Methodology transparency (detailed > vague)
   - Sample size and representativeness
   - Publication credibility
   - Author expertise
   - Potential biases
   - Recency of data

3. RECONCILIATION ATTEMPT
   Can both be true under different interpretations?

   Example: "40% adoption" vs "15% adoption" could both be true if:
   - 40% = awareness or trial
   - 15% = active production use

4. RESOLUTION RECOMMENDATION

   Options:
   - ACCEPT_A: Source A is clearly more reliable
   - ACCEPT_B: Source B is clearly more reliable
   - AVERAGE: Both seem credible, use midpoint with wide confidence interval
   - CONDITIONAL: Both true under different conditions (specify)
   - REJECT_BOTH: Neither meets quality threshold
   - NEEDS_VERIFICATION: Cannot resolve, flag for manual review

Return as JSON:
{
  "contradiction_resolution": {
    "claim_topic": "AI coding assistant adoption rate",
    "source_a_value": "77% of developers",
    "source_b_value": "35% of developers",
    "variance": "42 percentage points",

    "root_cause_analysis": {
      "likely_cause": "definitional",
      "explanation": "Source A (GitHub) measures 'have tried or used' while Source B
                      (enterprise survey) measures 'using in production regularly'.
                      These are measuring different stages of adoption.",
      "confidence_in_diagnosis": 0.8
    },

    "evidence_comparison": {
      "source_a_strengths": ["Primary source (GitHub)", "Large sample", "Recent data"],
      "source_a_weaknesses": ["Broad definition of 'use'", "May include one-time trials"],
      "source_b_strengths": ["Specific definition", "Enterprise-focused", "Production use"],
      "source_b_weaknesses": ["Smaller sample", "Only Fortune 500"],
      "more_reliable": "depends_on_context"
    },

    "reconciliation": {
      "can_reconcile": true,
      "reconciled_interpretation": "~77% of developers have tried AI coding assistants,
                                     while ~35% use them regularly in production work",
      "both_valid_for": {
        "source_a": "Measuring awareness and trial",
        "source_b": "Measuring sustained production adoption"
      }
    },

    "resolution": "CONDITIONAL",
    "recommended_citation": "AI coding assistant usage varies by definition: 77% have
                            tried these tools (GitHub, 2024) while 35% report regular
                            production use (Enterprise Survey, 2024)",
    "confidence_in_resolution": 0.75
  }
}
"""
```

---

## Integration into Research Pipeline

### Modified Research Flow

```
┌─────────────────────┐
│ 1. Web Search       │
│    (Gemini)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Finding          │
│    Extraction       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│ 3. VERIFICATION LAYER (NEW)                     │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ Cross-Ref   │  │ Bias        │              │
│  │ Analysis    │  │ Detection   │              │
│  └──────┬──────┘  └──────┬──────┘              │
│         │                │                      │
│         ▼                ▼                      │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ Expert      │  │ Source      │              │
│  │ Sanity      │  │ Quality     │              │
│  └──────┬──────┘  └──────┬──────┘              │
│         │                │                      │
│         └───────┬────────┘                      │
│                 ▼                               │
│         ┌─────────────┐                         │
│         │Contradiction│                         │
│         │ Resolution  │                         │
│         └─────────────┘                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────┐
│ 4. Enriched         │
│    Findings         │
│    + Verification   │
│    Metadata         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Perspective      │
│    Analysis         │
└─────────────────────┘
```

### Enhanced Finding Schema

```python
class VerifiedFinding(BaseModel):
    # Original fields
    finding_id: str
    finding_type: str
    content: str
    summary: str
    confidence_score: float  # Original confidence

    # NEW: Verification metadata
    verification: VerificationMetadata

class VerificationMetadata(BaseModel):
    # Cross-reference results
    verification_status: str  # verified, likely_accurate, disputed, unverified, suspicious
    sources_agreeing: int
    sources_disagreeing: int
    agreement_ratio: float

    # Bias assessment
    bias_score: float  # 0-1, higher = more biased
    bias_type: Optional[str]  # vendor_marketing, analyst_conflict, etc.
    skin_in_the_game: Optional[str]  # Who benefits

    # Expert sanity check
    plausibility_score: float  # 0-1
    expert_notes: str
    adjusted_estimate: Optional[str]  # If original seems off

    # Source quality
    primary_source_identified: bool
    source_quality_avg: float
    citation_depth: str  # primary, secondary, tertiary

    # Contradictions
    has_contradictions: bool
    contradiction_notes: Optional[str]

    # Final adjusted confidence
    adjusted_confidence: float  # After all verification adjustments
    confidence_adjustments: List[str]  # Reasons for adjustment
```

---

## Example Output

### Before Verification

```json
{
  "finding_type": "adoption_trend",
  "content": "GitHub Copilot adoption has reached 77% among developers",
  "confidence_score": 0.85
}
```

### After Verification

```json
{
  "finding_type": "adoption_trend",
  "content": "GitHub Copilot adoption has reached 77% among developers",
  "confidence_score": 0.85,

  "verification": {
    "verification_status": "verified_with_caveats",
    "sources_agreeing": 3,
    "sources_disagreeing": 1,
    "agreement_ratio": 0.75,

    "bias_score": 0.6,
    "bias_type": "vendor_marketing",
    "skin_in_the_game": "GitHub/Microsoft benefits from high adoption perception",

    "plausibility_score": 0.5,
    "expert_notes": "77% seems high for 'adoption'. Likely measures 'have tried' not 'regular use'. Enterprise surveys show 30-40% regular usage.",
    "adjusted_estimate": "30-40% regular production use; 70-80% have tried",

    "primary_source_identified": true,
    "source_quality_avg": 0.7,
    "citation_depth": "primary",

    "has_contradictions": true,
    "contradiction_notes": "Enterprise survey shows 35% - likely different definition of 'adoption'",

    "adjusted_confidence": 0.65,
    "confidence_adjustments": [
      "-0.10: Vendor as primary source",
      "-0.05: Definition ambiguity ('tried' vs 'regular use')",
      "-0.05: Contradiction with enterprise data"
    ]
  }
}
```

---

## Implementation Priority

| Component | Value | Complexity | Priority |
|-----------|-------|------------|----------|
| Cross-Reference Analysis | High | Medium | 1 |
| Bias Detection | High | Low | 2 |
| Expert Sanity Check | Very High | Low | 3 |
| Source Quality Assessment | Medium | Low | 4 |
| Contradiction Resolution | High | Medium | 5 |

**Recommendation**: Start with #2 (Bias Detection) and #3 (Expert Sanity Check) as they add most value with least complexity, then add cross-referencing.
