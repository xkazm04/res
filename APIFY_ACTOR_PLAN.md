# Apify Deep Research Actor - Implementation Plan

## Overview

Standalone Apify actor for Deep Research capabilities:
- **Deep Research**: Gemini 3 Flash + Google Search grounding
- **Financial Intelligence**: Specialized template variant
- **Document Input**: PDF/text file processing via OpenRouter Gemini 3 Flash OCR
- **Report Generation**: Markdown/HTML reports from research results
- **Database**: Same Supabase connection as existing service

---

## Project Structure

```
apify-deep-research/
├── .actor/
│   ├── actor.json              # Apify actor config
│   └── INPUT_SCHEMA.json       # Input schema for Apify UI
├── src/
│   ├── __init__.py
│   ├── main.py                 # Actor entry point
│   ├── config.py               # Settings from env vars
│   ├── schemas/
│   │   ├── input.py            # ActorInput model
│   │   └── output.py           # ActorOutput model
│   ├── clients/
│   │   ├── gemini.py           # Gemini + Google Search grounding
│   │   ├── openrouter.py       # OpenRouter for OCR
│   │   └── supabase.py         # Supabase DB client
│   ├── services/
│   │   ├── research.py         # Core research orchestration
│   │   ├── ocr.py              # PDF/image processing
│   │   ├── report.py           # Report generation
│   │   └── cost_tracker.py     # Token/cost tracking
│   ├── templates/
│   │   ├── base.py             # Base template
│   │   ├── investigative.py    # Investigative template
│   │   └── financial.py        # Financial intelligence
│   └── utils/
│       ├── pdf.py              # PDF to images (PyMuPDF)
│       └── retry.py            # Retry decorators
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## Input Schema

```python
class ActorInput(BaseModel):
    # Core research
    query: str                    # Research question (required)
    template: str = "investigative"  # investigative | financial | competitive | legal
    granularity: str = "standard"    # quick | standard | deep
    perspectives: List[str] = None   # Override default perspectives

    # Document input (optional)
    input_file_url: str = None    # URL to PDF/text file
    input_text: str = None        # Direct text context

    # Report generation
    generate_report: bool = False
    report_variant: str = "full_report"  # executive_summary | full_report | investment_thesis
    report_format: str = "markdown"      # markdown | html | json
    report_title: str = None

    # Database options
    save_to_supabase: bool = True
    workspace_id: str = "apify"

    # API keys (use env vars if not provided)
    google_api_key: str = None
    openrouter_api_key: str = None
    supabase_url: str = None
    supabase_key: str = None

    # Limits
    max_searches: int = 5         # 1-15
    max_sources_per_search: int = 10
```

---

## Data Flow

```
┌─────────────────┐
│  ACTOR INPUT    │
│  - query        │
│  - template     │
│  - file_url?    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. INPUT PROCESSING                 │
│    If file_url → Download           │
│    If PDF → OCR (OpenRouter Gemini) │
│    Result: context_text             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. QUERY GENERATION (Gemini JSON)   │
│    Template generates 3-10 queries  │
│    Based on template type           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 3. GROUNDED WEB SEARCH              │
│    Gemini 3 Flash + GoogleSearch  │
│    Extract grounding_metadata       │
│    Collect sources, content         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 4. FINDING EXTRACTION               │
│    Template-specific prompts        │
│    Types: fact, event, evidence...  │
│    Confidence scoring               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. PERSPECTIVE ANALYSIS             │
│    Multi-perspective experts        │
│    Key insights, recommendations    │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────────┐ ┌───────────────────────┐
│ SUPABASE  │ │ REPORT GENERATION     │
│ (optional)│ │ (if generate_report)  │
│           │ │ Markdown → HTML       │
└─────┬─────┘ └───────────┬───────────┘
      │                   │
      └─────────┬─────────┘
                ▼
┌─────────────────────────────────────┐
│ APIFY OUTPUT                        │
│  Key-Value: OUTPUT, REPORT.md       │
│  Dataset: One row per finding       │
└─────────────────────────────────────┘
```

---

## Key Files to Port

### 1. Gemini Client with Google Search
**Source**: `backend/app/research/lib/clients/gemini.py`

```python
class GeminiResearchClient:
    DEFAULT_MODEL = "gemini-3-flash-preview"

    async def research(self, query: str, ...) -> ResearchResponse:
        config = types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())]
        )
        response = self.client.models.generate_content(
            model=self.model, contents=prompt, config=config
        )
        grounding_meta = self._extract_grounding_metadata(response)
        sources = self._extract_sources(grounding_meta)
        return ResearchResponse(text=response.text, sources=sources, ...)
```

### 2. OpenRouter OCR
**Source**: `backend/app/ocr/services/openrouter.py`

```python
async def _call_openrouter(self, image: bytes) -> str:
    headers = {
        "Authorization": f"Bearer {self.api_key}",
        "HTTP-Referer": "https://apify-deep-research.app",
        "X-Title": "Deep Research Actor"
    }
    payload = {
        "model": "google/gemini-3-flash-preview",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": OCR_PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
            ]
        }]
    }
```

### 3. Research Orchestration
**Source**: `backend/app/research/services/orchestrator.py`

Flow:
1. Generate search queries from template
2. Execute grounded searches
3. Assess source credibility
4. Extract findings with confidence
5. Run multi-perspective analysis

### 4. Financial Template
**Source**: `backend/app/research/templates/financial.py`

```python
class FinancialTemplate:
    default_perspectives = ["valuation", "risk", "sentiment", "fundamental"]

    # Query categories: EARNINGS, SEC_FILINGS, ANALYST_COVERAGE,
    # OWNERSHIP, NEWS_SENTIMENT, TECHNICAL, MANAGEMENT
```

### 5. Supabase Operations
**Source**: `backend/app/research/db/__init__.py`

Tables used:
- `research_sessions` - Session metadata
- `research_sources` - Web sources with credibility
- `research_findings` - Extracted findings
- `research_perspectives` - Perspective analyses

---

## Output Schema

### Key-Value Store: OUTPUT
```json
{
  "session_id": "uuid",
  "query": "...",
  "template": "financial",
  "status": "completed",
  "findings": [...],
  "perspectives": [...],
  "sources": [...],
  "search_queries_executed": [...],
  "report_markdown": "...",
  "report_html": "...",
  "cost_summary": {
    "total_tokens": 12500,
    "gemini_cost_usd": 0.0234,
    "openrouter_cost_usd": 0.0015,
    "total_cost_usd": 0.0249
  },
  "execution_time_seconds": 45.2,
  "supabase_session_id": "uuid"
}
```

### Dataset: One row per finding
```json
{
  "finding_id": "f1",
  "session_id": "...",
  "finding_type": "fact",
  "content": "Apple Q4 revenue of $94.9B...",
  "summary": "Apple Q4 beat expectations",
  "confidence_score": 0.92,
  "extracted_data": {"metric": "revenue", "value": 94900000000},
  "supporting_sources": [{"url": "...", "title": "..."}]
}
```

---

## Dependencies

```
apify>=1.6.0
google-genai>=1.0.0
httpx>=0.27.0
supabase>=2.0.0
pymupdf>=1.25.0
pydantic>=2.10.0
tenacity>=9.0.0
python-dotenv>=1.0.0
```

---

## Environment Variables

```bash
GOOGLE_API_KEY=         # Gemini with Google Search
OPENROUTER_API_KEY=     # OCR and HTML generation
SUPABASE_URL=           # Database URL
SUPABASE_KEY=           # Database anon key
```

---

## Implementation Order

### Phase 1: Core Structure
1. Create `apify-deep-research/` directory
2. Set up `.actor/actor.json` and `INPUT_SCHEMA.json`
3. Create `src/schemas/input.py` and `output.py`
4. Set up `src/config.py` with environment loading

### Phase 2: API Clients
5. Port `src/clients/gemini.py` from `backend/app/research/lib/clients/gemini.py`
6. Port `src/clients/openrouter.py` from `backend/app/ocr/services/openrouter.py`
7. Create `src/clients/supabase.py` with simplified operations

### Phase 3: Services
8. Create `src/services/ocr.py` - PDF processing with PyMuPDF
9. Create `src/services/cost_tracker.py` - Token/cost tracking
10. Create `src/templates/base.py`, `investigative.py`, `financial.py`
11. Create `src/services/research.py` - Main orchestration

### Phase 4: Reports & Output
12. Create `src/services/report.py` - Markdown composers
13. Create `src/main.py` - Actor entry point with Apify SDK

### Phase 5: Testing & Deployment
14. Create `requirements.txt` and `Dockerfile`
15. Test locally with `apify run`
16. Deploy to Apify platform

---

## Files to Create

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `.actor/actor.json` | Apify config | 20 |
| `.actor/INPUT_SCHEMA.json` | Input UI schema | 100 |
| `src/schemas/input.py` | Input validation | 80 |
| `src/schemas/output.py` | Output models | 100 |
| `src/config.py` | Settings | 40 |
| `src/clients/gemini.py` | Gemini + Search | 250 |
| `src/clients/openrouter.py` | OpenRouter OCR | 120 |
| `src/clients/supabase.py` | DB operations | 150 |
| `src/services/ocr.py` | PDF processing | 80 |
| `src/services/cost_tracker.py` | Cost tracking | 60 |
| `src/services/research.py` | Research orchestration | 300 |
| `src/services/report.py` | Report generation | 200 |
| `src/templates/base.py` | Base template | 100 |
| `src/templates/investigative.py` | Investigative | 150 |
| `src/templates/financial.py` | Financial | 200 |
| `src/main.py` | Actor entry | 150 |
| `requirements.txt` | Dependencies | 15 |
| `Dockerfile` | Container | 25 |

**Total**: ~2,120 lines across 18 files
