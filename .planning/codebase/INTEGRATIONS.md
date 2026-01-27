# External Integrations

**Analysis Date:** 2026-01-27

## APIs & External Services

**LLM & Search:**
- Google Gemini - AI-powered research with web search grounding
  - SDK/Client: `google-genai` (Python), `@genkit-ai/googleai` (TypeScript)
  - Auth: `GOOGLE_API_KEY` / `GEMINI_API_KEY` environment variable
  - Implementation: `actor/src/clients/gemini.py` and `src/lib/research/gemini-client.ts`
  - Features: Grounded search, cost tracking, token usage

- OpenRouter API - Vision-based OCR for document processing
  - SDK/Client: httpx (async HTTP client)
  - Auth: `OPENROUTER_API_KEY` environment variable
  - Model: `google/gemini-2.5-flash-preview` (configurable via `OPENROUTER_OCR_MODEL`)
  - Base URL: https://openrouter.ai/api/v1
  - Implementation: `actor/src/clients/openrouter.py`

**Email & Communication:**
- Resend - Transactional email delivery
  - SDK/Client: `resend` npm package with httpx wrapper
  - Auth: `RESEND_API_KEY` environment variable
  - From Email: `Deep Research <research@resend.dev>`
  - Implementation: `actor/src/clients/resend.py`
  - Use: Report delivery and notifications

**Actor Orchestration:**
- Apify - Actor deployment platform
  - SDK: `apify` Python package (>=1.6.0)
  - Entry point: `actor/src/main.py`
  - Usage: Actor task orchestration, execution, and metadata

**Monitoring & Observability:**
- LangSmith - LLM observability and cost tracking
  - SDK: `langsmith` Python package (>=0.1.0)
  - Auth: `LANGSMITH_API_KEY` / `LANGCHAIN_API_KEY` environment variable
  - Project: `deep-research-actor` (configurable via `LANGSMITH_PROJECT`)
  - Status: `LANGSMITH_ENABLED` environment toggle
  - Implementation: Integrated with research execution for token and cost tracking

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Provider: PostgreSQL via Supabase
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` (TypeScript), `supabase>=2.0.0` (Python)
  - Implementation:
    - TypeScript: `src/lib/supabase.ts` - Full query API with real-time subscriptions
    - Python: `actor/src/clients/supabase.py` - Simplified data persistence
  - Tables used:
    - `research_sessions` - Session metadata and status
    - `research_findings` - Individual research findings
    - `research_sources` - Source URLs with credibility scores
    - `research_perspectives` - Analysis perspectives
    - `query_decompositions` - Query breakdown structure
    - `sub_queries` - Sub-query details
    - `finding_relationships` - Finding interconnections
    - `research_contradictions` - Contradictory findings
    - `research_gaps` - Knowledge gaps identified
    - `causal_chains` - Causal relationships
    - `finding_perspectives` - Perspective-specific finding data
    - `knowledge_entities` - Named entities from claims
    - `claim_entities` - Entity-claim mappings
    - `claim_relationships` - Knowledge graph edges
  - Features: Real-time subscriptions via postgres_changes channel

**File Storage:**
- Cloudflare R2 - Object storage for research reports
  - Provider: Cloudflare R2 (S3-compatible)
  - Auth: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` environment variables
  - Bucket: `deep-research-reports` (configurable via `R2_BUCKET_NAME`)
  - Custom Domain: `R2_PUBLIC_URL` environment variable
  - Implementation: `actor/src/clients/r2.py`
  - Features: Pre-signed URLs, placeholder HTML with auto-refresh, report hosting

**Caching:**
- Redis/In-memory caching (via CacheService)
  - Implementation: `actor/src/services/cache.py`
  - Purpose: Research result caching to avoid duplicate processing

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (implicit via anon key)
  - Implementation: Public anon key for frontend access
  - Scope: Read-only access to public research_sessions and related tables

## Cloud Services

**Serverless Computing:**
- Google Cloud Run - Research engine backend
  - URL: `CLOUD_RUN_URL` environment variable
  - Implementation: `actor/src/clients/cloud_run.py`
  - Purpose: Fire-and-forget async research execution
  - Timeouts: 1200s (20 min) for research, 10s for dispatch acknowledgment
  - Health check: `/health` endpoint

## Monitoring & Observability

**Error Tracking:**
- LangSmith - LLM call tracing and cost analysis
  - Integration point: `actor/src/config.py` Settings class
  - Enabled by: `LANGSMITH_ENABLED=true`

**Logs:**
- Python logging module - Structured logging
  - Format: "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
  - Level: INFO
  - Implementation: Standard library `logging` in Python components
- Next.js console - Browser and server console logging

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from Next.js) - Frontend deployment
- Cloud Run (referenced via CloudRunClient) - Serverless backend
- Apify - Actor hosting and management

**CI Pipeline:**
- Not explicitly detected in codebase

## Environment Configuration

**Required env vars (Critical):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase instance
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client auth
- `GOOGLE_API_KEY` / `GEMINI_API_KEY` - Gemini API key
- `OPENROUTER_API_KEY` - Vision API
- `SUPABASE_KEY` - Server-side Supabase key
- `RESEND_API_KEY` - Email delivery

**Optional env vars (Features):**
- `LANGSMITH_API_KEY` / `LANGCHAIN_API_KEY` - LLM monitoring
- `LANGSMITH_PROJECT` - LangSmith project name
- `LANGSMITH_ENABLED` - Toggle monitoring (default: true)
- `CLOUD_RUN_URL` - Async research dispatch
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` - Report storage
- `R2_BUCKET_NAME` - R2 bucket (default: deep-research-reports)
- `R2_PUBLIC_URL` - Custom R2 domain
- `GEMINI_MODEL` - Model override (default: gemini-3-flash-preview)
- `OPENROUTER_BASE_URL` - OpenRouter endpoint override
- `OPENROUTER_OCR_MODEL` - Vision model override

**Secrets location:**
- `.env` file in project root (verified present, contains Supabase credentials)
- Environment variables for deployment platforms

## Webhooks & Callbacks

**Incoming:**
- Cloud Run health check endpoint - `/health`
- Research dispatch endpoint - POST to Cloud Run service

**Outgoing:**
- Resend email delivery - HTTP POST to https://api.resend.com
- Research report URLs - S3-compatible PUT requests to Cloudflare R2
- Real-time updates - Supabase postgres_changes subscriptions (bidirectional via WebSocket)

## Data Flow Integration

**Research Execution:**
1. Frontend/API (`src/app/api/actor/run/route.ts`) receives research request
2. ResearchService initializes with Genkit + Google Gemini client
3. Gemini performs grounded web search, extracts sources
4. Results saved to Supabase via `saveActorFindings()`, `saveActorSources()`, etc.
5. Report generated and stored in Cloudflare R2
6. Email sent via Resend if configured
7. Real-time updates streamed via Supabase subscriptions
8. Optional async dispatch to Cloud Run for long-running research

**Session Tracking:**
- Sessions created/updated in `research_sessions` table
- Status progresses: searching → analyzing → completed/failed
- Parameters stored as JSONB for flexible metadata
- Completion triggers email notification if `user_email` provided

## Cost Tracking

**Token Usage Tracking:**
- Gemini: Input `$0.15`/1M, Output `$0.60`/1M (gemini-2.5-flash)
- OpenRouter: `$0.50` per request (configurable)
- Calculated and stored in session parameters
- Exposed via `/cost_summary` in research response

---

*Integration audit: 2026-01-27*
