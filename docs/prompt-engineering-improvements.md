# Prompt Engineering Improvements for Deeper Insights

## Current State Analysis

The current tech_market template extracts factual findings from web sources. To unlock additional value, we can leverage LLM expertise in these 5 strategic areas:

---

## 1. Contrarian Analysis & Hidden Assumptions

**Concept:** Ask the LLM to actively challenge mainstream narratives and identify hidden assumptions in the data.

**Implementation:**

```python
CONTRARIAN_PROMPT = """
After analyzing the research findings, perform a CONTRARIAN ANALYSIS:

1. CHALLENGE MAINSTREAM NARRATIVES
   - What widely-accepted claims in this data might be wrong or overstated?
   - Which "inevitable trends" have historical precedents of failure?
   - What are vendors/analysts incentivized to exaggerate?

2. IDENTIFY HIDDEN ASSUMPTIONS
   - What unstated assumptions underlie the adoption predictions?
   - What market conditions must remain stable for these forecasts?
   - What dependencies are not being discussed?

3. SECOND-ORDER EFFECTS
   - If Prediction X happens, what unintended consequences follow?
   - What adjacent markets will be disrupted?
   - Who are the hidden losers if this trend accelerates?

4. SURVIVORSHIP BIAS CHECK
   - What failed technologies/companies are missing from this narrative?
   - Are we only hearing from successful adopters?

Return findings with contrarian_score (0-1) indicating strength of counter-argument.
"""
```

**Value:** Prevents echo chamber thinking, surfaces risks competitors might miss.

---

## 2. Cross-Domain Pattern Synthesis

**Concept:** Use LLM's broad knowledge to find patterns from analogous situations in other industries/eras.

**Implementation:**

```python
PATTERN_SYNTHESIS_PROMPT = """
Analyze these tech market findings through CROSS-DOMAIN PATTERN MATCHING:

1. HISTORICAL PARALLELS
   - What past technology cycles does this resemble? (e.g., mainframe→PC, on-prem→cloud)
   - How did those transitions actually play out vs. predictions?
   - What's the typical timeline from hype peak to mainstream adoption?

2. ADJACENT INDUSTRY PATTERNS
   - How did similar disruptions unfold in manufacturing, finance, healthcare?
   - What adoption barriers appeared that weren't anticipated?
   - What unexpected winners emerged?

3. INNOVATION DIFFUSION ANALYSIS
   - Where is each technology on the Rogers adoption curve?
   - What typically triggers the jump from early adopters to early majority?
   - What are the "bowling pin" markets that precede mass adoption?

4. CONSOLIDATION PATTERNS
   - Based on historical M&A cycles, which players are acquisition targets?
   - What's the typical time from fragmentation to consolidation?
   - Who are the likely acquirers based on strategic positioning?

Return insights with historical_confidence (0-1) based on pattern match strength.
"""
```

**Value:** Leverages LLM's training on decades of tech history for predictive power.

---

## 3. Stakeholder Impact Matrix

**Concept:** Systematically analyze how each finding affects different stakeholder groups.

**Implementation:**

```python
STAKEHOLDER_MATRIX_PROMPT = """
For each major finding, generate a STAKEHOLDER IMPACT MATRIX:

STAKEHOLDER GROUPS:
1. DEVELOPERS (Junior/Senior/Staff/Principal)
2. ENGINEERING MANAGERS
3. CTOs/VPs of Engineering
4. PROCUREMENT/IT Directors
5. STARTUP FOUNDERS
6. VC INVESTORS
7. ENTERPRISE ARCHITECTS
8. SECURITY TEAMS
9. OPEN SOURCE MAINTAINERS
10. DEVELOPER TOOL VENDORS

For each group, analyze:
- DIRECT IMPACT: How does this trend affect their daily work?
- CAREER IMPLICATIONS: Skills to develop, roles at risk, new opportunities
- DECISION TRIGGERS: What would make them act on this information?
- TIMELINE: When will this become relevant to them?
- ACTION ITEMS: Specific recommendations

Also identify:
- WINNERS vs LOSERS within each group
- UNEXPECTED BENEFICIARIES
- GROUPS BEING IGNORED in current discourse

Return as structured matrix with impact_severity (high/medium/low) per cell.
"""
```

**Value:** Makes research actionable for specific audiences, enables targeted content.

---

## 4. Uncertainty Decomposition & Scenario Branching

**Concept:** Instead of single predictions, decompose uncertainty and model branching scenarios.

**Implementation:**

```python
UNCERTAINTY_DECOMPOSITION_PROMPT = """
For each prediction, perform UNCERTAINTY DECOMPOSITION:

1. IDENTIFY KEY UNCERTAINTIES
   - What are the 3-5 variables that most affect this prediction?
   - Which uncertainties are reducible (more research) vs irreducible (inherent randomness)?
   - What information would most change our confidence?

2. SCENARIO BRANCHING
   Create decision tree with probability-weighted branches:

   TRIGGER EVENT → SCENARIO A (P=X%) → Sub-outcomes
                 → SCENARIO B (P=Y%) → Sub-outcomes

   For each branch:
   - What observable signals indicate we're on this path?
   - What's the "point of no return"?
   - What hedging strategies work across branches?

3. PREDICTION DEPENDENCIES
   Map which predictions are:
   - Independent (can happen regardless of others)
   - Correlated (likely to happen together)
   - Mutually exclusive (if A happens, B cannot)

4. CONFIDENCE INTERVALS
   Instead of point estimates, provide:
   - 10th percentile outcome (pessimistic but plausible)
   - 50th percentile (base case)
   - 90th percentile (optimistic but plausible)

Return structured scenario tree with conditional probabilities.
"""
```

**Value:** Enables strategic planning under uncertainty, identifies early warning signals.

---

## 5. Implicit Knowledge Extraction

**Concept:** Use LLM's training data to surface insights that aren't in the web sources but are "known" from broader context.

**Implementation:**

```python
IMPLICIT_KNOWLEDGE_PROMPT = """
Based on your training knowledge (not just the provided sources), add IMPLICIT INSIGHTS:

1. EXPERT TACIT KNOWLEDGE
   - What do practitioners know that rarely gets written down?
   - What are the "everyone knows but nobody says" truths in this space?
   - What advice would a 20-year veteran give that surveys don't capture?

2. CULTURAL & ORGANIZATIONAL FACTORS
   - What organizational dynamics affect adoption beyond technology?
   - What cultural resistance patterns are predictable?
   - Which company archetypes will adopt early vs. late?

3. TECHNICAL DEPTH
   - What technical limitations aren't discussed in marketing materials?
   - What integration challenges typically emerge post-adoption?
   - What's the actual vs. claimed performance in production?

4. MARKET DYNAMICS
   - What pricing pressure patterns typically emerge?
   - How do vendor lock-in concerns typically play out?
   - What's the realistic switching cost timeline?

5. FAILURE MODES
   - What are the common implementation failure patterns?
   - What organizational anti-patterns predict failure?
   - What are the early warning signs of troubled adoption?

Label each insight with:
- source_type: "implicit_knowledge"
- confidence_basis: Why you believe this (training patterns, logical inference, etc.)
- validation_suggestion: How this could be verified
"""
```

**Value:** Captures wisdom that exists in the LLM but isn't in current web results.

---

## Implementation Priority

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Implicit Knowledge Extraction | High | Low | 1 |
| Contrarian Analysis | High | Low | 2 |
| Stakeholder Impact Matrix | High | Medium | 3 |
| Cross-Domain Pattern Synthesis | Medium | Medium | 4 |
| Uncertainty Decomposition | Medium | High | 5 |

## Integration Approach

Add as new extraction phase in `tech_market.py`:

```python
async def extract_deep_insights(
    self,
    findings: List[Dict],
    synthesized_content: str,
) -> Dict[str, Any]:
    """Extract deeper insights using LLM expertise."""

    insights = {}

    # Run each analysis type
    insights['contrarian'] = await self._run_contrarian_analysis(findings)
    insights['patterns'] = await self._run_pattern_synthesis(findings)
    insights['stakeholders'] = await self._run_stakeholder_matrix(findings)
    insights['scenarios'] = await self._run_uncertainty_decomposition(findings)
    insights['implicit'] = await self._run_implicit_extraction(findings, synthesized_content)

    return insights
```

These prompts transform the research from "what did we find" to "what does it mean and what should we do about it."
