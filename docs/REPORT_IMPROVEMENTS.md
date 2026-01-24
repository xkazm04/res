# Research Actor Report Quality Improvements

## Analysis Summary

After reviewing the example outputs and the EPSTEIN_INVESTIGATION_V3.html reference report, I've identified 18 extensions organized into 5 categories that would significantly improve report quality, data presentation, and user experience.

---

## Category 1: Interactive HTML Report Design
*Inspired by EPSTEIN_INVESTIGATION_V3.html's sophisticated dashboard layout*

### 1. Dashboard-Style HTML Reports

**Current State:** Reports are markdown-only, requiring external rendering.

**Extension:** Add `generate_rich_html()` method to templates that produces self-contained HTML reports with:
- Fixed header with key statistics (finding count, confidence avg, sources count)
- Sidebar navigation with section badges showing counts
- Tab-based content switching between report sections
- Compact typography (13px base, system fonts, tight line-height)

**Implementation:**
```python
# In base.py
def generate_rich_html(self, result: Dict[str, Any], title: Optional[str] = None) -> str:
    """Generate interactive HTML dashboard report."""
    # Include CSS variables for theming
    # Fixed header with stats
    # Sidebar with nav-items and badges
    # Main content area with sections
```

**Templates Affected:** All (base method, override for customization)

---

### 2. Network Visualization for Relationships

**Current State:** Relationships listed as text bullets.

**Extension:** Generate SVG/CSS-based network graphs showing:
- Actor nodes (color-coded by type: core, financial, political, etc.)
- Relationship edges with labels
- Hover states showing relationship details
- Legend explaining node colors

**Implementation:**
```python
def _generate_network_visualization(self, actors: List[Dict], relationships: List[Dict]) -> str:
    """Generate CSS-positioned network graph HTML."""
    # Calculate node positions using force-directed layout approximation
    # Generate SVG lines for relationships
    # Create positioned divs for actor nodes
```

**Templates Affected:** `investigative`, `competitive`, `legal`

---

### 3. Parallel Timeline View

**Current State:** Events listed chronologically but not visually aligned.

**Extension:** Multi-column timeline showing different event streams in parallel:
- Column per actor/category (e.g., "Legal", "Financial", "Public", "Regulatory")
- Events placed in time-aligned rows
- Color-coded event badges by type
- Useful for seeing how events across different domains correlate

**Implementation:**
```python
def _generate_parallel_timeline(self, events: List[Dict]) -> str:
    """Generate grid-based parallel timeline HTML."""
    # Group events by stream/category
    # Create timeline grid with year rows
    # Position events in appropriate cells
```

**Templates Affected:** `investigative`, `financial`, `legal`, `contract`

---

### 4. Sankey-Style Money Flow Diagrams

**Current State:** Financial transactions listed as text.

**Extension:** Visual flow diagrams showing:
- Source entities on left, intermediaries in middle, destinations on right
- Flow line thickness proportional to amount
- Amount labels on flow lines
- Clickable for transaction details

**Implementation:**
```python
def _generate_money_flow(self, financial_findings: List[Dict]) -> str:
    """Generate Sankey-style money flow HTML using CSS."""
    # Extract payer -> payee -> amount triples
    # Calculate flow widths relative to max amount
    # Generate flow-row divs with styled lines
```

**Templates Affected:** `investigative`, `financial`, `contract`

---

### 5. Collapsible Evidence Drawers

**Current State:** All finding content shown inline, making reports very long.

**Extension:** Expandable/collapsible sections for:
- Detailed evidence under each finding summary
- Source quotes with citation
- Verification details (bias score, expert check results)
- Uses JavaScript-free CSS `:target` selector for toggling

**Implementation:**
```python
def _generate_evidence_drawer(self, finding: Dict) -> str:
    """Generate collapsible evidence section."""
    # Accordion-style header with summary
    # Hidden content div with details
    # CSS-only toggle using :checked pseudo-class
```

**Templates Affected:** All

---

### 6. Confidence Progress Bars & Stat Cards

**Current State:** Confidence shown as percentage text.

**Extension:** Visual indicators including:
- Progress bars with color coding (red <50%, yellow 50-70%, green >70%)
- Stat cards showing key metrics at report header
- Mini-charts for distribution of findings by type

**Implementation:**
```python
def _generate_confidence_indicator(self, confidence: float) -> str:
    """Generate visual confidence bar."""
    color = "danger" if confidence < 0.5 else "warning" if confidence < 0.7 else "success"
    return f'<div class="progress-bar"><div class="progress-fill {color}" style="width:{confidence*100}%"></div></div>'
```

**Templates Affected:** All

---

## Category 2: Data Quality Improvements

### 7. Entity Resolution & Deduplication

**Current State:** Multiple findings may refer to the same entity with variations (e.g., "Vercel", "Vercel Inc.", "vercel").

**Extension:** Post-processing step that:
- Identifies likely duplicate entities using fuzzy matching
- Merges findings about the same entity
- Creates unified entity profiles
- Links all mentions to canonical entity

**Implementation:**
```python
async def resolve_entities(self, findings: List[Dict]) -> List[Dict]:
    """Deduplicate and resolve entity references."""
    # Extract entity mentions from findings
    # Cluster by similarity (Levenshtein, embedding similarity)
    # Merge findings for same entity
    # Update cross-references
```

**Templates Affected:** All (especially `investigative`, `competitive`)

---

### 8. Source Recency Weighting

**Current State:** Source credibility based primarily on domain authority.

**Extension:** Factor in:
- Publication date (recent sources weighted higher for current events)
- Author expertise (if detectable)
- Source type (primary vs. secondary)
- Update frequency (news sites vs. static pages)

**Implementation:**
```python
def calculate_source_credibility(self, source: Dict) -> float:
    """Calculate multi-factor source credibility score."""
    domain_score = self._get_domain_authority(source['domain'])
    recency_score = self._calculate_recency_weight(source.get('published_date'))
    source_type_score = self._classify_source_type(source)
    return weighted_average([domain_score, recency_score, source_type_score])
```

**Templates Affected:** All

---

### 9. Contradiction Detection

**Current State:** Contradicting findings not explicitly flagged.

**Extension:** Analyze findings for contradictions:
- Semantic similarity check between findings
- Flag pairs with high similarity but opposing conclusions
- Generate "Contradictions" section in reports
- Show both sides with source quality comparison

**Implementation:**
```python
async def detect_contradictions(self, findings: List[Dict]) -> List[Dict]:
    """Identify contradicting findings."""
    prompt = """Analyze these findings for contradictions:
    {findings}
    Return pairs that contradict each other with explanation."""
    # Use LLM to identify semantic contradictions
    # Return structured contradiction objects
```

**Templates Affected:** All

---

### 10. Temporal Consistency Validation

**Current State:** No validation that dates/events are logically consistent.

**Extension:** Check for:
- Anachronistic claims (e.g., "2024 product launched in 2023")
- Impossible sequences (effect before cause)
- Date conflicts between findings
- Flag temporal inconsistencies for review

**Implementation:**
```python
def validate_temporal_consistency(self, findings: List[Dict]) -> List[str]:
    """Check for temporal inconsistencies."""
    # Extract all temporal claims
    # Build event sequence graph
    # Check for cycles or impossible orderings
    # Return list of inconsistency warnings
```

**Templates Affected:** `investigative`, `financial`, `legal`

---

## Category 3: New Report Sections

### 11. "What We Don't Know" Section

**Current State:** Gaps listed but not prominent.

**Extension:** Dedicated, prominent section highlighting:
- Critical knowledge gaps
- Why each gap matters
- Suggested research queries to fill gaps
- Impact on report confidence if gaps persist

**Implementation:**
```python
def _generate_knowledge_gaps_section(self, findings: List[Dict]) -> str:
    """Generate prominent knowledge gaps section."""
    gaps = [f for f in findings if f.get('finding_type') == 'gap']
    # Prioritize by importance
    # Generate suggested follow-up queries
    # Show impact assessment
```

**Templates Affected:** All

---

### 12. Stakeholder Impact Matrix

**Current State:** Perspectives analyze from viewpoints but don't map impacts.

**Extension:** Generate table showing:
- Rows: Key findings/developments
- Columns: Stakeholder groups
- Cells: Impact rating (positive/negative/neutral) with brief explanation
- Summary of winners/losers

**Implementation:**
```python
async def generate_stakeholder_matrix(self, findings: List[Dict], stakeholders: List[str]) -> str:
    """Generate stakeholder impact analysis matrix."""
    prompt = """For each finding, assess impact on each stakeholder:
    Findings: {findings}
    Stakeholders: {stakeholders}
    Return matrix with impact scores (-2 to +2) and brief rationale."""
```

**Templates Affected:** `competitive`, `financial`, `legal`

---

### 13. Prediction Tracking Dashboard

**Current State:** Predictions listed as findings.

**Extension:** For tech_market template, dedicated section with:
- Timeline visualization of predictions by quarter
- Confidence indicators per prediction
- Source credibility for each prediction
- "Track Record" analysis (for recurring research)

**Implementation:**
```python
def _generate_prediction_dashboard(self, findings: List[Dict]) -> str:
    """Generate prediction timeline dashboard."""
    predictions = [f for f in findings if f.get('temporal_context') == 'predicted']
    # Group by timeframe (Q1 2026, Q2 2026, etc.)
    # Generate timeline visualization
    # Add confidence indicators
```

**Templates Affected:** `tech_market`, `financial`

---

### 14. Executive Decision Brief

**Current State:** Executive summary is a condensed version of full report.

**Extension:** Add focused "Decision Brief" variant:
- One-page max
- 3-5 bullet key facts
- Clear recommendation or action items
- Risk callout box
- "If you read nothing else" format

**Implementation:**
```python
def generate_decision_brief(self, result: Dict[str, Any]) -> str:
    """Generate one-page executive decision brief."""
    # Extract highest-confidence findings
    # Synthesize into 3-5 bullets
    # Generate clear recommendation
    # Add risk callout
```

**Templates Affected:** All (new variant)

---

## Category 4: Template-Specific Enhancements

### 15. Financial Template: Earnings Comparison Tables

**Current State:** Financial metrics listed as text bullets.

**Extension:** Auto-generate structured tables:
- Quarterly earnings comparison
- Analyst estimates vs. actuals
- Valuation multiples comparison (P/E, EV/EBITDA)
- Margin trend analysis

**Implementation:**
```python
def _generate_financial_tables(self, findings: List[Dict]) -> str:
    """Generate structured financial comparison tables."""
    metrics = [f for f in findings if f.get('finding_type') == 'fact']
    # Extract metric values from extracted_data
    # Build comparison table
    # Add beat/miss indicators
```

**Templates Affected:** `financial`

---

### 16. Tech Market: Feature Comparison Matrix

**Current State:** Product comparisons described in prose.

**Extension:** Generate side-by-side comparison tables:
- Products as columns
- Features as rows
- Check marks, values, or ratings in cells
- Highlight differentiators

**Implementation:**
```python
async def generate_feature_matrix(self, query: str, findings: List[Dict]) -> str:
    """Generate product feature comparison matrix."""
    prompt = """Based on these findings, create a feature comparison matrix:
    {findings}
    Products to compare: {extracted from query}
    Return structured matrix with features and ratings."""
```

**Templates Affected:** `tech_market`, `competitive`

---

### 17. Contract Template: Pricing Benchmark Tables

**Current State:** Contract pricing mentioned in text.

**Extension:** Structured pricing analysis:
- Line item breakdown tables
- GSA schedule comparison
- Industry benchmark comparison
- Variance analysis (over/under market)

**Implementation:**
```python
def _generate_pricing_tables(self, findings: List[Dict]) -> str:
    """Generate contract pricing benchmark tables."""
    # Extract pricing data from financial findings
    # Compare to benchmark data
    # Generate variance analysis table
```

**Templates Affected:** `contract`

---

### 18. Investigative Template: Evidence Chain Visualization

**Current State:** Evidence listed but not connected.

**Extension:** Visual representation of:
- How evidence links to conclusions
- Source document chain (who said what, when)
- Corroboration paths (which sources agree)
- Strength of evidence for key claims

**Implementation:**
```python
def _generate_evidence_chain(self, findings: List[Dict]) -> str:
    """Generate evidence chain visualization."""
    # Build graph of evidence -> claim relationships
    # Show corroboration links
    # Visualize as connected boxes
```

**Templates Affected:** `investigative`, `legal`

---

## Implementation Priority

### Phase 1: High Impact, Lower Effort
1. Confidence Progress Bars & Stat Cards (#6)
2. Collapsible Evidence Drawers (#5)
3. "What We Don't Know" Section (#11)
4. Executive Decision Brief (#14)

### Phase 2: Medium Effort, High Value
5. Dashboard-Style HTML Reports (#1)
6. Contradiction Detection (#9)
7. Source Recency Weighting (#8)
8. Financial Tables (#15)

### Phase 3: Complex Visualizations
9. Network Visualization (#2)
10. Parallel Timeline View (#3)
11. Money Flow Diagrams (#4)
12. Feature Comparison Matrix (#16)

### Phase 4: Advanced Features
13. Entity Resolution (#7)
14. Temporal Consistency Validation (#10)
15. Stakeholder Impact Matrix (#12)
16. Prediction Dashboard (#13)
17. Pricing Benchmark Tables (#17)
18. Evidence Chain Visualization (#18)

---

## Design Guidelines (from EPSTEIN_INVESTIGATION_V3.html)

### Typography
- Base font size: 13px
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Line height: 1.5
- Headers: 18px section headers, 14px panel headers, 10px labels

### Colors
```css
--primary: #228be6;     /* Links, active states */
--danger: #e03131;      /* Warnings, critical findings */
--warning: #f59f00;     /* Medium confidence */
--success: #2f9e44;     /* High confidence */
--purple: #7950f2;      /* Special categories */
--text: #212529;        /* Primary text */
--text-muted: #6c757d;  /* Secondary text */
--border: #dee2e6;      /* Borders */
--surface: #ffffff;     /* Panels */
--surface-alt: #f1f3f5; /* Alternating backgrounds */
```

### Layout
- Fixed header: 48px height
- Sidebar: 200px width
- Main content: max-width 1400px
- Panels: 6px border-radius, 1px border
- Grid gaps: 12px standard

### Components
- Tags: 10px font, uppercase, 3px radius
- Progress bars: 6px height, colored fills
- Stat cards: 28px value, 11px label
- Tables: 12px font, 8-10px padding
- Evidence drawers: click-to-expand, border-left accent

---

## Testing Approach

After implementing each extension, run against:

1. **Tech Market Query:** "AI coding assistants market 2025 adoption GitHub Copilot vs Cursor vs Codeium"
   - Tests: Feature Matrix, Prediction Dashboard, Adoption Trends

2. **Investigative Query:** "FTX collapse investigation key findings Sam Bankman-Fried"
   - Tests: Network Visualization, Evidence Chain, Money Flow, Parallel Timeline

3. **Financial Query:** "NVIDIA Q4 2024 earnings analysis and 2025 outlook"
   - Tests: Financial Tables, Earnings Comparison, Valuation Analysis

4. **Contract Query:** "DoD IT modernization contracts 2024 pricing analysis"
   - Tests: Pricing Benchmark Tables, Risk Heat Maps

5. **Legal Query:** "EU AI Act enforcement mechanisms and company compliance requirements"
   - Tests: Stakeholder Impact, Temporal Timeline, Evidence Drawers

---

## File Changes Required

### New Files
- `actor/src/services/report_html.py` - Rich HTML generation service
- `actor/src/services/entity_resolution.py` - Entity deduplication
- `actor/src/services/contradiction_detection.py` - Contradiction finder
- `actor/src/templates/html_components.py` - Reusable HTML components

### Modified Files
- `actor/src/templates/base.py` - Add `generate_rich_html()` method
- `actor/src/templates/investigative.py` - Network visualization, evidence chain
- `actor/src/templates/financial.py` - Financial tables
- `actor/src/templates/tech_market.py` - Feature matrix, prediction dashboard
- `actor/src/templates/contract.py` - Pricing tables
- `actor/src/services/report.py` - HTML variant support
