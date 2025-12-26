# Deep Research Actor

AI-powered deep research using Gemini with Google Search grounding.

## Features

- **Deep Research**: Gemini 3 Flash Preview + Google Search grounding for comprehensive web research
- **Multiple Templates**: Investigative, Financial, Competitive Intelligence, and Legal Research templates
- **LLM Monitoring**: Langsmith integration for token/cost tracking and observability
- **Document Input**: PDF/text file processing via OpenRouter OCR
- **Report Generation**: Markdown/HTML reports from research results
- **Database**: Optional Supabase persistence for research sessions
- **Multi-Perspective Analysis**: Expert perspectives from multiple angles

## Quick Start

### Local Testing

```bash
cd actor
pip install -r requirements.txt

# Set environment variables
export GOOGLE_API_KEY=your_key_here
export OPENROUTER_API_KEY=your_key_here  # Optional, for OCR
export SUPABASE_URL=your_url_here        # Optional, for persistence
export SUPABASE_KEY=your_key_here        # Optional

# Run
python -m src.main
```

### Apify Deployment

```bash
apify push
```

## Project Structure

```
actor/
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
│   │   └── langsmith.py        # Langsmith monitoring service
│   ├── templates/
│   │   ├── base.py             # Base template with expert perspectives
│   │   ├── investigative.py    # Investigative journalism
│   │   ├── financial.py        # Financial/stock analysis
│   │   ├── competitive.py      # Competitive intelligence
│   │   └── legal.py            # Legal research
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
    report_format: str = "markdown"      # markdown | html
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
│    Gemini 2.0 Flash + GoogleSearch  │
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

## Environment Variables

```bash
# Required
GOOGLE_API_KEY=         # Gemini with Google Search (required)

# LLM Monitoring (recommended)
LANGSMITH_API_KEY=      # Langsmith API key for LLM monitoring
LANGSMITH_PROJECT=      # Project name (default: deep-research-actor)
LANGCHAIN_TRACING_V2=   # Set to "true" to enable tracing

# Optional
OPENROUTER_API_KEY=     # OCR for PDF processing (optional)
SUPABASE_URL=           # Database URL (optional)
SUPABASE_KEY=           # Database anon key (optional)
```

---

## Langsmith Setup (LLM Monitoring)

Langsmith provides observability for LLM calls including token usage, costs, latency, and trace visualization.

### 1. Get API Key

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign up or log in
3. Go to **Settings** → **API Keys**
4. Create a new API key

### 2. Configure Environment

Create a `.env` file or set environment variables:

```bash
# Required for Langsmith
LANGSMITH_API_KEY=lsv2_pt_xxxxxxxx

# Optional - customize project name
LANGSMITH_PROJECT=deep-research-actor

# Enable tracing (set to "true")
LANGCHAIN_TRACING_V2=true
```

### 3. View Traces

After running research:
1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Select your project (default: `deep-research-actor`)
3. View traces for each research session including:
   - Total tokens used (input/output)
   - Estimated costs per model
   - Request/response payloads
   - Latency breakdown
   - Error traces

### 4. Tracked Events

The Langsmith integration tracks:
- **Research Sessions**: Start/end with metadata
- **Search Queries**: Each grounded search with sources
- **Finding Extraction**: Extracted findings with confidence scores
- **Perspective Analysis**: Expert perspective generation
- **Report Generation**: Final report compilation
- **Token Usage**: Per-call and cumulative token counts
- **Costs**: Estimated costs based on Gemini pricing

---

## Templates

### Investigative Template (`investigative`)
For investigative journalism research with:
- Actor identification and profiling
- Event timeline construction
- Relationship mapping
- Financial transaction tracking
- Evidence chain building

Default perspectives: forensic_financial, power_network, psychological_behavioral, legal_liability, geopolitical_strategic

### Financial Template (`financial`)
For investment and stock analysis with:
- Earnings and financial metrics
- SEC filings analysis
- Analyst coverage
- Valuation analysis
- Risk assessment

Default perspectives: institutional_investor, short_seller, quantitative_risk, activist_investor, macro_strategist

### Competitive Intelligence Template (`competitive`)
For competitive analysis and market research with:
- Market overview and sizing
- Competitor profiling
- Strategic positioning analysis
- Financial benchmarking
- Customer intelligence
- Threats and opportunities

Default perspectives: strategy_consultant, industry_insider, institutional_investor, short_seller

### Legal Research Template (`legal`)
For legal case research and regulatory analysis with:
- Case law and precedent research
- Statutes and regulations
- Enforcement actions tracking
- Litigation history
- Compliance requirements
- Regulatory guidance

Default perspectives: litigation_strategist, regulatory_expert, legal_liability, forensic_financial
