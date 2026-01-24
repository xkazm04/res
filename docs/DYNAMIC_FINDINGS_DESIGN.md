# Dynamic Findings Mechanism Design

## Problem Statement

Currently, findings extraction uses fixed ranges based on granularity:
- **quick**: 8-10 findings
- **standard**: 15-20 findings
- **deep**: 25-30 findings

This approach has limitations:
1. **Source richness ignored** - A query with 50 high-quality sources should yield more findings than one with 10 low-quality sources
2. **No cache enrichment** - Cached results can't be incrementally extended with new findings
3. **User expectations unmet** - Some research types naturally have more findings than others
4. **Duplicates across searches** - Multiple searches may find the same facts, wasting budget

---

## Proposed Solution: Adaptive Findings Budget

### Core Concept: Source-Weighted Extraction

Instead of fixed ranges, calculate a **dynamic findings budget** based on:

```python
findings_budget = base_budget + source_bonus + cache_extension

where:
  base_budget = granularity_base[granularity]  # quick=8, standard=15, deep=25
  source_bonus = min(len(high_quality_sources) * 0.5, cap)  # +0.5 per good source
  cache_extension = previous_findings_count * 0.3 if extending_cache else 0
```

### Implementation

#### 1. New Input Parameter: `findings_mode`

```json
{
  "findings_mode": {
    "title": "Findings Extraction Mode",
    "description": "How to determine the number of findings to extract",
    "type": "string",
    "enum": ["auto", "minimum", "balanced", "exhaustive"],
    "enumTitles": [
      "Auto - Adapt to source quality and quantity (Recommended)",
      "Minimum - Extract only high-confidence core findings",
      "Balanced - Standard extraction across all categories",
      "Exhaustive - Extract every discoverable insight"
    ],
    "default": "auto"
  }
}
```

#### 2. Findings Budget Calculator

```python
class FindingsBudget:
    """Calculate dynamic findings budget based on research context."""

    GRANULARITY_BASE = {
        "quick": 8,
        "standard": 15,
        "deep": 25,
    }

    MODE_MULTIPLIERS = {
        "minimum": 0.6,     # 60% of calculated budget
        "balanced": 1.0,    # 100% of calculated budget
        "auto": 1.0,        # 100% with dynamic adjustment
        "exhaustive": 1.5,  # 150% of calculated budget
    }

    SOURCE_QUALITY_WEIGHTS = {
        "high": 0.8,        # +0.8 findings per high-quality source
        "medium": 0.4,      # +0.4 findings per medium-quality source
        "low": 0.1,         # +0.1 findings per low-quality source
    }

    @classmethod
    def calculate(
        cls,
        granularity: str,
        mode: str,
        sources: List[Dict],
        cached_findings_count: int = 0,
        extending_cache: bool = False,
    ) -> FindingsBudgetResult:
        """Calculate the optimal findings budget."""

        # Base budget from granularity
        base = cls.GRANULARITY_BASE.get(granularity, 15)

        # Source quality bonus
        source_bonus = 0
        for source in sources:
            cred = source.get("credibility_label", "medium")
            source_bonus += cls.SOURCE_QUALITY_WEIGHTS.get(cred, 0.4)

        # Cap source bonus based on granularity
        max_source_bonus = {"quick": 5, "standard": 10, "deep": 20}[granularity]
        source_bonus = min(source_bonus, max_source_bonus)

        # Cache extension bonus (find NEW findings when extending)
        cache_extension = 0
        if extending_cache and cached_findings_count > 0:
            # Target 20-30% more findings when extending cache
            cache_extension = int(cached_findings_count * 0.25)

        # Calculate raw budget
        raw_budget = base + source_bonus + cache_extension

        # Apply mode multiplier
        mode_multiplier = cls.MODE_MULTIPLIERS.get(mode, 1.0)
        final_budget = int(raw_budget * mode_multiplier)

        # Enforce bounds
        min_findings = {"quick": 5, "standard": 10, "deep": 15}[granularity]
        max_findings = {"quick": 15, "standard": 30, "deep": 50}[granularity]
        final_budget = max(min_findings, min(final_budget, max_findings))

        return FindingsBudgetResult(
            target_findings=final_budget,
            base_budget=base,
            source_bonus=source_bonus,
            cache_extension=cache_extension,
            mode_multiplier=mode_multiplier,
            bounds=(min_findings, max_findings),
        )
```

#### 3. Multi-Pass Extraction for Cache Enrichment

When extending cached results:

```python
async def extract_incremental_findings(
    self,
    query: str,
    sources: List[Dict],
    existing_findings: List[Dict],
    budget: FindingsBudgetResult,
) -> List[Dict]:
    """Extract new findings that complement existing cached findings."""

    # Build context of what we already know
    existing_summaries = [f.get("summary", "") for f in existing_findings]
    existing_content_hash = set(
        hashlib.md5(f.get("content", "").encode()).hexdigest()[:8]
        for f in existing_findings
    )

    prompt = f"""
You are extracting NEW findings that are NOT already covered by existing research.

Research Topic: {query}

EXISTING FINDINGS (DO NOT DUPLICATE):
{chr(10).join(f"- {s}" for s in existing_summaries[:20])}

Target: Extract {budget.cache_extension} NEW findings not covered above.

Focus on:
1. Recent developments not in the cached data
2. Different perspectives or angles on the topic
3. Edge cases, contrarian views, or minority opinions
4. Specific data points that add granularity to existing findings
5. Connections or implications not previously identified

Return only genuinely new insights, not rephrased versions of existing findings.
"""

    new_findings = await self._extract_with_dedup(prompt, existing_content_hash)
    return new_findings
```

#### 4. Category-Based Budget Distribution

Ensure balanced coverage across finding types:

```python
def distribute_budget_by_category(
    budget: int,
    template: str,
    sources: List[Dict],
) -> Dict[str, int]:
    """Allocate findings budget across categories."""

    # Template-specific category priorities
    CATEGORY_WEIGHTS = {
        "tech_market": {
            "adoption_trend": 0.25,
            "prediction": 0.20,
            "product_launch": 0.15,
            "market_metric": 0.15,
            "enterprise_adoption": 0.10,
            "funding_round": 0.05,
            "developer_sentiment": 0.05,
            "gap": 0.05,
        },
        "financial": {
            "earnings_metric": 0.30,
            "valuation_signal": 0.20,
            "risk_factor": 0.20,
            "guidance": 0.15,
            "analyst_rating": 0.10,
            "gap": 0.05,
        },
        "investigative": {
            "relationship": 0.25,
            "financial_flow": 0.20,
            "timeline_event": 0.20,
            "red_flag": 0.15,
            "actor_profile": 0.10,
            "gap": 0.10,
        },
    }

    weights = CATEGORY_WEIGHTS.get(template, {})
    distribution = {}

    for category, weight in weights.items():
        distribution[category] = max(1, int(budget * weight))

    return distribution
```

---

## Output Schema Additions

### New Fields in Finding Records

```json
{
  "extraction_metadata": {
    "title": "Extraction Metadata",
    "description": "Information about how this finding was extracted",
    "type": "object",
    "properties": {
      "extraction_pass": {
        "type": "integer",
        "description": "Which extraction pass found this (1=initial, 2+=enrichment)"
      },
      "budget_category": {
        "type": "string",
        "description": "Category this finding was allocated to"
      },
      "novelty_score": {
        "type": "number",
        "description": "How unique this finding is vs others (0-1)"
      },
      "source_coverage": {
        "type": "integer",
        "description": "Number of sources that support this finding"
      }
    }
  }
}
```

### New Fields in Summary Record

```json
{
  "findings_budget": {
    "title": "Findings Budget",
    "description": "How the findings target was calculated",
    "type": "object",
    "properties": {
      "target": {"type": "integer"},
      "actual": {"type": "integer"},
      "mode": {"type": "string"},
      "source_quality_bonus": {"type": "number"},
      "cache_extension_bonus": {"type": "integer"},
      "saturation_reached": {"type": "boolean"}
    }
  }
}
```

---

## Saturation Detection

Know when to stop extracting:

```python
def detect_saturation(
    findings: List[Dict],
    recent_batch: List[Dict],
    threshold: float = 0.3,
) -> bool:
    """
    Detect when additional extraction yields diminishing returns.

    Returns True if:
    - Novelty score of recent findings drops below threshold
    - Duplicate rate exceeds 50%
    - Average confidence drops significantly
    """
    if not recent_batch:
        return True

    # Check novelty scores
    avg_novelty = sum(f.get("novelty_score", 0.5) for f in recent_batch) / len(recent_batch)
    if avg_novelty < threshold:
        return True

    # Check duplicate rate
    existing_hashes = {hash_content(f) for f in findings}
    new_hashes = {hash_content(f) for f in recent_batch}
    overlap = len(existing_hashes & new_hashes)
    if overlap / len(recent_batch) > 0.5:
        return True

    return False
```

---

## Implementation Phases

### Phase 1: Basic Dynamic Budget (Low Effort)
1. Add `findings_mode` input parameter
2. Implement `FindingsBudget` calculator
3. Update extraction prompts to use calculated budget
4. Add `findings_budget` to output metadata

### Phase 2: Category Distribution (Medium Effort)
1. Implement category-based budget distribution
2. Multi-pass extraction with category targeting
3. Balance findings across categories

### Phase 3: Cache Enrichment (Medium Effort)
1. Detect when extending cached results
2. Implement incremental extraction
3. Deduplication against existing findings
4. Merge new findings with cached ones

### Phase 4: Saturation Detection (Low Effort)
1. Track novelty scores during extraction
2. Detect diminishing returns
3. Early termination when saturated
4. Report saturation in output

---

## Example Scenarios

### Scenario 1: Rich Source Query
```
Query: "GitHub Copilot vs Cursor adoption 2025"
Sources: 35 (28 high credibility)
Granularity: standard
Mode: auto

Budget Calculation:
  base = 15
  source_bonus = 28 * 0.8 + 7 * 0.4 = 22.4 + 2.8 = 25.2 (capped at 10)
  cache_extension = 0

  raw_budget = 15 + 10 = 25
  final_budget = 25 (within bounds 10-30)

Result: Extract up to 25 findings (vs. fixed 15-20)
```

### Scenario 2: Cache Enrichment
```
Query: "AI coding assistants market 2025" (cached)
Cached Findings: 18
New Sources: 12 (from recent searches)
Mode: auto + extend_cache=true

Budget Calculation:
  base = 15 (standard)
  source_bonus = 6 (from 12 new sources)
  cache_extension = 18 * 0.25 = 4.5 → 4 new findings target

  raw_budget = 15 + 6 + 4 = 25
  final_budget = 25 total (18 cached + 7 new)

Result: Find ~7 genuinely new findings to enrich cache
```

### Scenario 3: Minimum Mode for Speed
```
Query: "Quick check on Vercel funding"
Sources: 8 (5 high, 3 medium)
Granularity: quick
Mode: minimum

Budget Calculation:
  base = 8
  source_bonus = 5 * 0.8 + 3 * 0.4 = 5.2 (capped at 5)

  raw_budget = 13
  mode_multiplier = 0.6
  final_budget = 13 * 0.6 = 7.8 → 8 (min bound = 5)

Result: Extract only 8 high-confidence findings
```

---

## Migration Notes

1. **Backward Compatibility**: `findings_mode` defaults to `"auto"` which behaves similarly to current logic
2. **No Breaking Changes**: Existing integrations continue working
3. **Gradual Rollout**: Can A/B test with `findings_mode` parameter
