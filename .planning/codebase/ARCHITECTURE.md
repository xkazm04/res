# Architecture

**Analysis Date:** 2026-01-27

## Pattern Overview

**Overall:** Hybrid Architecture - Client-Server with Centralized State Management

The system is composed of:
1. **Frontend**: Next.js 16 React app with Zustand state management and canvas-based visualization
2. **Backend API**: Next.js API routes orchestrating research operations
3. **Backend Services**: Python-based actor services for deep research, reporting, and data processing
4. **Data Layer**: Supabase PostgreSQL for persistent research session storage

**Key Characteristics:**
- Client state drives UI (map navigation, report modal visibility)
- Backend API acts as orchestrator, delegating to Python services via HTTP
- Supabase stores all research results for recovery and visualization
- D3/Canvas for infinite interactive visualization of research sessions grouped by template type
- Real-time subscriptions enabled via Supabase for live progress tracking

## Layers

**Presentation Layer:**
- Purpose: Interactive research map and report visualization
- Location: `src/components/` (canvas, map, report, layout, swiss)
- Contains: React components for D3 canvas rendering, modal management, header, breadcrumbs
- Depends on: Zustand store, research service hooks, Supabase subscriptions
- Used by: Main app page at `src/app/page.tsx`

**State Management Layer:**
- Purpose: Unified application state for sessions, current session, map navigation
- Location: `src/stores/appStore.ts`
- Contains: Zustand store with session fetching, report modal control, map zoom state
- Depends on: Supabase client functions
- Used by: All presentational components via hooks (useSessions, useAppStore)

**API/Orchestration Layer:**
- Purpose: Handle research requests and delegate to Python backend services
- Location: `src/app/api/actor/run/route.ts`
- Contains: POST endpoint that instantiates ResearchService, executes research, persists results
- Depends on: ResearchService, Supabase persistence functions, Google API
- Used by: External clients, frontend (though frontend primarily uses stored results)

**Service Layer (TypeScript):**
- Purpose: Core research orchestration in TypeScript
- Location: `src/lib/research/`
- Contains:
  - `research-service.ts`: Orchestrates research phases (query generation, searching, finding extraction, perspective analysis, report generation)
  - `gemini-client.ts`: Wraps Genkit AI for Gemini + Google Search grounding
  - `templates.ts`: Template configurations, search query generation, finding extraction prompts
  - `email-service.ts`: Resend email notifications
  - `index.ts`: Exports
- Depends on: Gemini API via Genkit, Supabase for persistence
- Used by: API route handler

**Data Access Layer:**
- Purpose: Supabase query/mutation abstraction
- Location: `src/lib/supabase.ts`
- Contains:
  - Read operations: `getAllSessions()`, `getSessionWithDetails()`, `getFindings()`, `getSources()`, `getPerspectives()`, `getRelationships()`, `getContradictions()`, `getGaps()`, `getCausalChains()`, `getDecomposition()`, `getEntitiesForSession()`, `getClaimRelationships()`
  - Write operations: `createActorSession()`, `updateActorSession()`, `saveActorFindings()`, `saveActorSources()`, `saveActorPerspectives()`, `saveActorReport()`
  - Real-time subscriptions: `subscribeToSession()`, `subscribeToFindings()`
- Depends on: Supabase JS client, types
- Used by: ResearchService, app store, hooks

**Backend Services Layer (Python):**
- Purpose: Heavy lifting for research actor and report generation
- Location: `actor/src/services/`
- Contains: intelligence.py (research orchestration), report.py (markdown generation), report_interactive.py (interactive HTML), research.py (web search coordination), visualizations.py (D3 charts), templates/ (template configs)
- Entry point: `actor/src/main.py`
- Deployment: Cloud Run (serverless)
- Used by: API route handler via HTTP POST

**Type System:**
- Location: `src/types/research.ts`
- Contains: Comprehensive type definitions matching Supabase schema (ResearchSession, ResearchFinding, ResearchSource, ResearchPerspective, enums for FindingType, ClaimType, EntityType, RelationshipType, PerspectiveType, etc.)
- Used by: All layers for type safety

## Data Flow

**User Research Flow:**

1. User enters query on home page
2. Page renders ResearchMap component
3. ResearchMap uses useSessions hook to fetch initial sessions from Supabase
4. Sessions grouped by template_type and rendered on canvas with D3 force layout
5. User clicks session → calls openReportModal(sessionId)
6. App store fetches session details from Supabase (includes findings, sources, perspectives, contradictions, gaps)
7. ReportModal opens with ReportView displaying structured findings/perspectives/sources
8. User can navigate breadcrumb to zoom into template groups or select different sessions

**Backend Research Execution Flow:**

1. External client POSTs to `/api/actor/run` with research query
2. API handler instantiates ResearchService with Gemini API key
3. ResearchService.executeResearch() orchestrates phases:
   - Phase 1: Generate search queries via Gemini
   - Phase 2: Execute grounded searches via Gemini + Google Search
   - Phase 3: Assess source credibility
   - Phase 4: Extract findings via Gemini JSON generation
   - Phase 5: Run multi-perspective analysis via Gemini
   - Phase 6: Generate markdown report (optional)
4. During execution:
   - Progress updates saved to Supabase via updateActorSession()
   - Sessions subscribed via Supabase realtime
5. On completion:
   - Findings saved via saveActorFindings()
   - Sources saved via saveActorSources()
   - Perspectives saved via saveActorPerspectives()
   - Report saved via saveActorReport()
6. Email notification sent if configured (optional, non-blocking)
7. Results returned in API response

**State Management Flow:**

1. Component uses hooks: `useSessions()` → reads from store
2. Store has async actions: `fetchSessions()` → calls Supabase `getAllSessions()`
3. On mount, useSessions checks if sessions already loaded; if not, triggers fetch
4. Store state updates trigger React re-renders
5. Open report modal action calls `fetchSession(sessionId)` to load detailed session data

## Key Abstractions

**ResearchService:**
- Purpose: Orchestrate all research phases and coordinate with external APIs
- Examples: `src/lib/research/research-service.ts`
- Pattern: Class-based service with typed interfaces (Finding, Perspective, ResearchResult)
- Responsibilities: Phase management, token tracking, error handling, email delivery coordination

**GeminiClient:**
- Purpose: Abstraction over Genkit AI for Gemini model with Google Search grounding
- Examples: `src/lib/research/gemini-client.ts`
- Pattern: Class wrapper with methods for research queries and JSON generation
- Responsibilities: Model initialization, prompt formatting, source extraction from grounding metadata, cost calculation

**TemplateConfigs:**
- Purpose: Define template-specific configurations including search query generation and finding extraction rules
- Examples: `src/lib/research/templates.ts`
- Pattern: Object map of TemplateType to config with perspectives, prompts, search strategies
- Responsibilities: Template selection, perspective definition, prompt generation

**AppStore (Zustand):**
- Purpose: Centralized state for sessions list, current session details, map navigation
- Examples: `src/stores/appStore.ts`
- Pattern: Zustand store with getState/set pattern
- Responsibilities: Session lifecycle (fetch, cache, clear), modal management, breadcrumb state, derived data helpers (groupSessionsByTemplate, getTemplateColor, calculateSessionStats)

**ResearchCanvas:**
- Purpose: D3-powered infinite canvas for visualizing sessions as grouped nodes
- Examples: `src/components/canvas/ResearchCanvas.tsx`
- Pattern: React component with refs for D3 state (outside React render), hooks for interaction
- Responsibilities: Layout calculation, zoom/pan interaction, focus mode for template groups, hover tooltips

**Supabase Queries:**
- Purpose: Type-safe data access with single responsibility
- Examples: `src/lib/supabase.ts`
- Pattern: Async functions returning typed data, error handling returns empty arrays
- Responsibilities: Query execution, error logging, response transformation

## Entry Points

**Frontend Entry Point:**
- Location: `src/app/page.tsx`
- Triggers: Browser navigation to root URL
- Responsibilities: Renders ResearchMap (main component) and ReportModal (manages report viewing)

**API Entry Point:**
- Location: `src/app/api/actor/run/route.ts`
- Triggers: HTTP POST with research parameters
- Responsibilities: Validate input, instantiate ResearchService, execute research, persist results, return JSON response

**Backend Entry Point:**
- Location: `actor/src/main.py`
- Triggers: Cloud Run invocation
- Responsibilities: Parse input, orchestrate research phases, generate reports, manage output

## Error Handling

**Strategy:** Three-tier error handling

**TypeScript/Frontend:**
- Try-catch in async operations (fetchSessions, fetchSession)
- Errors logged to console and stored in Zustand state
- UI displays error boundary with retry option
- Warnings accumulated (non-blocking errors) vs errors (blocking)

**API Route:**
- Input validation (required fields)
- Environment variable checks (GOOGLE_API_KEY)
- Try-catch wrapping entire operation
- Errors returned as JSON with 500 status
- Logging via console.error with [Research] prefix

**ResearchService:**
- Phase-level try-catch (searches, perspective analysis, report generation)
- Errors and warnings collected separately
- Partial results allowed (status: "partial" if some phases fail)
- Failed phases skip but execution continues
- Session persistence failures trigger warnings (non-blocking)
- Email failures trigger warnings
- Final result includes errors[] and warnings[] arrays

## Cross-Cutting Concerns

**Logging:**
- Frontend: console.error/warn in services and hooks
- API: console.log with [Research] prefix for request start/completion
- Backend: Python logging module with progress tracking
- Pattern: Structured log messages with context (query preview, status, token count)

**Validation:**
- Frontend: TypeScript types enforce structure
- API: Check required fields (query parameter)
- ResearchService: Validates search queries array, findings array structure, perspective data
- Supabase: Schema constraints at database level
- Pattern: Fail fast, return meaningful error messages

**Authentication:**
- Frontend: Uses Supabase anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- API: Uses GOOGLE_API_KEY for Gemini; Supabase writes use anon key with Row Level Security
- Backend: Cloud Run service account via GOOGLE_API_KEY
- Pattern: Environment variables for secrets, no secrets in code

**Cost Tracking:**
- ResearchService: Tracks tokens across all API calls
- Cost calculation: Uses model-specific rates (gemini-2.0-flash: $0.075/$0.30 per 1M input/output tokens)
- Results included in response and saved to database
- Pattern: Accumulate costs incrementally during research phases

**Progress Tracking:**
- ResearchService: Updates Supabase session with progress_phase and progress_percent
- Six phases: initializing → searching (20%) → extracting_findings (55%) → analyzing_perspectives (70%) → generating_report (90%) → complete (100%)
- Pattern: Non-blocking updates to database, UI polls for status changes

---

*Architecture analysis: 2026-01-27*
