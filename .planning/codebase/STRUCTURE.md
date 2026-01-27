# Codebase Structure

**Analysis Date:** 2026-01-27

## Directory Layout

```
researcher/
├── src/                           # Frontend React/Next.js application
│   ├── app/                       # Next.js app router
│   │   ├── page.tsx              # Home page (root / route)
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── globals.css           # Global Tailwind styles
│   │   └── api/
│   │       └── actor/
│   │           └── run/
│   │               └── route.ts   # POST endpoint for research execution
│   ├── components/               # React components (49 total)
│   │   ├── canvas/              # D3 canvas visualization
│   │   │   ├── ResearchCanvas.tsx # Main infinite canvas component
│   │   │   ├── useCanvasRenderer.ts # D3 rendering hook
│   │   │   ├── useCanvasInteraction.ts # D3 zoom/pan interaction
│   │   │   ├── layout.ts        # Force layout algorithm
│   │   │   ├── renderOverview.ts # Canvas rendering (overview mode)
│   │   │   ├── renderFocused.ts  # Canvas rendering (focused mode)
│   │   │   ├── types.ts          # Canvas-specific types
│   │   │   └── index.tsx         # Component exports
│   │   ├── map/                 # Research map UI
│   │   │   ├── ResearchMap.tsx   # Main map component (orchestrates canvas + header)
│   │   │   ├── MapBreadcrumb.tsx # Navigation breadcrumbs for zooming
│   │   │   ├── MapLegend.tsx     # Color legend for templates
│   │   │   ├── MapEmptyState.tsx # Empty/loading/error states
│   │   │   └── index.tsx         # Component exports
│   │   ├── report/              # Report display components
│   │   │   ├── ReportView.tsx    # Main report container
│   │   │   ├── ReportHeader.tsx  # Report title and metadata
│   │   │   ├── FindingsSection.tsx # Findings display
│   │   │   ├── PerspectivesSection.tsx # Expert perspectives display
│   │   │   ├── SourcesSection.tsx # Sources with credibility
│   │   │   ├── ContradictionsSection.tsx # Contradictions display
│   │   │   ├── GapsSection.tsx   # Research gaps display
│   │   │   ├── FindingCard.tsx   # Individual finding component
│   │   │   ├── PerspectiveCard.tsx # Individual perspective component
│   │   │   └── index.tsx         # Component exports
│   │   ├── layout/              # Page layout components
│   │   │   ├── Header.tsx        # App header
│   │   │   ├── ReportModal.tsx   # Modal for viewing reports
│   │   │   └── index.tsx         # Component exports
│   │   ├── swiss/               # Reusable UI components (design system)
│   │   │   ├── SwissBadge.tsx
│   │   │   ├── SwissButton.tsx
│   │   │   ├── SwissCard.tsx
│   │   │   ├── SwissCollapsible.tsx
│   │   │   ├── SwissProgress.tsx
│   │   │   ├── SwissTooltip.tsx
│   │   │   └── index.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useSessions.ts       # Hook to fetch and manage sessions list
│   │   ├── useSession.ts        # Hook for single session detail
│   │   ├── useSessions.ts       # Hook with polling for active sessions
│   │   └── useMapData.ts        # Hook to derive map visualization data
│   ├── lib/                     # Utility libraries and services
│   │   ├── research/           # Research orchestration
│   │   │   ├── research-service.ts # Main ResearchService class (phases, orchestration)
│   │   │   ├── gemini-client.ts # GeminiClient wrapper for Genkit AI
│   │   │   ├── templates.ts     # Template configs, prompt templates, search generation
│   │   │   ├── email-service.ts # Email delivery via Resend
│   │   │   └── index.ts         # Exports
│   │   ├── d3/                 # D3 utilities (if any)
│   │   ├── supabase.ts         # Supabase client and all CRUD operations
│   │   └── utils.ts            # Utility functions
│   ├── stores/                 # Zustand state management
│   │   └── appStore.ts         # Unified app state (sessions, current session, map nav)
│   └── types/                  # TypeScript type definitions
│       ├── research.ts         # All research-related types matching Supabase schema
│       └── techMarket.ts       # Tech market specific types (if any)
│
├── actor/                      # Python backend services (Cloud Run)
│   ├── src/
│   │   ├── main.py            # Entry point for Cloud Run
│   │   ├── config.py          # Configuration and environment setup
│   │   ├── clients/           # External API clients
│   │   │   ├── gemini.py
│   │   │   ├── openrouter.py
│   │   │   ├── cloud_run.py
│   │   │   ├── r2.py          # Cloudflare R2 for file storage
│   │   │   ├── resend.py      # Email service
│   │   │   ├── supabase.py
│   │   │   └── __init__.py
│   │   ├── services/          # Business logic services
│   │   │   ├── intelligence.py # Research intelligence orchestration
│   │   │   ├── report.py      # Markdown report generation
│   │   │   ├── report_interactive.py # Interactive HTML report
│   │   │   ├── research.py    # Web search coordination
│   │   │   ├── visualizations.py # D3 chart generation
│   │   │   ├── ocr.py         # PDF/document OCR processing
│   │   │   ├── cache.py       # Query result caching
│   │   │   ├── cost_tracker.py # Token/cost tracking
│   │   │   ├── progress.py    # Progress tracking
│   │   │   ├── bayesian_confidence.py # Confidence calculation
│   │   │   ├── langsmith.py   # LangSmith integration
│   │   │   ├── exporters/     # Multi-format report export
│   │   │   │   ├── base.py
│   │   │   │   ├── pdf.py
│   │   │   │   ├── docx.py
│   │   │   │   ├── json_ld.py
│   │   │   │   ├── obsidian.py
│   │   │   │   ├── slack.py
│   │   │   │   └── __init__.py
│   │   │   ├── report_components.py # Reusable report components
│   │   │   ├── report_component_renderer.py
│   │   │   ├── report_component_styles.py
│   │   │   ├── templates/     # Template definitions
│   │   │   │   ├── base.py
│   │   │   │   ├── competitive.py
│   │   │   │   ├── contract.py
│   │   │   │   ├── due_diligence.py
│   │   │   │   ├── financial.py
│   │   │   │   ├── investigative.py
│   │   │   │   ├── legal.py
│   │   │   │   ├── purchase_decision.py
│   │   │   │   ├── reputation.py
│   │   │   │   ├── understanding.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── schemas/           # Input/output schema validation
│   │   │   ├── input.py
│   │   │   ├── output.py
│   │   │   └── __init__.py
│   │   └── __init__.py
│   └── README.md              # Actor documentation
│
├── public/                    # Static assets
│
├── docs/                      # Documentation files
│
├── serverless/                # Serverless function configurations (if any)
│
├── scripts/                   # Utility scripts
│
├── test_reports/              # Generated test reports
│
├── mock_outputs/              # Mock data for testing
│
├── .claude/                   # Claude configuration
│   └── settings.local.json
│
├── .planning/                 # GSD planning documents
│   └── codebase/             # Codebase analysis (ARCHITECTURE.md, STRUCTURE.md, etc.)
│
├── .git/                     # Git repository
│
├── package.json              # Frontend dependencies (Next.js, React, D3, Zustand, Genkit, Supabase, Tailwind)
│
├── package-lock.json         # Dependency lock file
│
├── tsconfig.json             # TypeScript configuration
│
├── next.config.js            # Next.js configuration
│
├── tailwind.config.ts        # Tailwind CSS configuration
│
├── test_cases.json           # Test cases for validation
│
└── README.md
```

## Directory Purposes

**src/app/**
- Purpose: Next.js app router - all page routes and API endpoints
- Contains: Routes (page.tsx), API handlers (route.ts), layout hierarchy
- Key files: `page.tsx` (home), `api/actor/run/route.ts` (research API)

**src/components/**
- Purpose: React UI components organized by feature area
- Contains: Presentational and container components, design system (swiss)
- Organization: canvas (visualization), map (session browser), report (results view), layout (page structure), swiss (design system)

**src/components/canvas/**
- Purpose: D3-based infinite canvas for visualizing research sessions
- Contains: ResearchCanvas component, layout algorithm, rendering functions, interaction handlers
- Key concepts: Force layout for positioning, zoom/pan state management, two render modes (overview/focused)

**src/components/map/**
- Purpose: High-level map UI orchestrating canvas + controls
- Contains: ResearchMap (main), MapBreadcrumb (navigation), MapLegend (colors), MapEmptyState (placeholder states)

**src/components/report/**
- Purpose: Display structured research results
- Contains: ReportView (container), sections (findings, perspectives, sources, contradictions, gaps), cards (individual items)

**src/hooks/**
- Purpose: Custom React hooks for data fetching and derived state
- Contains: useSessions (fetch list), useMapData (derive visualization data)
- Pattern: Hooks pull from Zustand store, trigger fetches if needed, return data + loading + error

**src/lib/research/**
- Purpose: Core research orchestration and AI integration
- Contains:
  - `research-service.ts`: Phases, token tracking, persistence, email coordination
  - `gemini-client.ts`: Genkit AI wrapper for Gemini + Google Search
  - `templates.ts`: Template configs (perspectives, prompts, search strategies)
  - `email-service.ts`: Resend email delivery

**src/lib/supabase.ts**
- Purpose: Data access layer - all Supabase queries and mutations
- Contains: Read operations (getAllSessions, getSessionWithDetails, getFindings, etc.), write operations (createActorSession, saveActorFindings, etc.), subscriptions
- Pattern: Each operation is a separate exported async function returning typed data

**src/stores/appStore.ts**
- Purpose: Centralized Zustand store for app state
- Contains: Sessions list, current session details, map navigation (zoom path), report modal state
- Helpers: groupSessionsByTemplate, getTemplateColor, extractTopicFromQuery, calculateSessionStats

**src/types/research.ts**
- Purpose: TypeScript type definitions matching Supabase schema
- Contains: Interfaces (ResearchSession, ResearchFinding, ResearchSource, ResearchPerspective, etc.), enums (SessionStatus, FindingType, ClaimType, EntityType, RelationshipType, PerspectiveType, etc.)
- Pattern: One interface per table, comprehensive and aligned with database schema

**actor/src/main.py**
- Purpose: Cloud Run entry point for research actor
- Contains: Input parsing, orchestration of research phases, output formatting
- Responsibilities: Delegate to intelligence.py, call report services, manage lifecycle

**actor/src/services/intelligence.py**
- Purpose: Core research orchestration (backend equivalent of ResearchService)
- Contains: Phase management, search coordination, finding extraction, perspective analysis
- Responsibilities: Multi-phase research execution, result aggregation, error recovery

**actor/src/services/report.py**
- Purpose: Markdown report generation
- Contains: Report templating, finding/perspective formatting, source citation

**actor/src/services/templates/**
- Purpose: Template-specific configurations and prompts
- Contains: One module per template (tech_market, financial, competitive, investigative, legal, contract, due_diligence, purchase_decision, reputation, understanding)
- Pattern: Each template defines experts, prompts, extraction rules, finding types

## Key File Locations

**Entry Points:**
- Frontend: `src/app/page.tsx` - home page rendering ResearchMap
- API: `src/app/api/actor/run/route.ts` - POST handler for research execution
- Backend: `actor/src/main.py` - Cloud Run entry point

**Configuration:**
- TypeScript: `tsconfig.json` (path aliases: @/)
- Tailwind: `tailwind.config.ts`
- Next.js: `next.config.js`
- Environment: `.env.local` (not in repo, but referenced as NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GOOGLE_API_KEY)

**Core Logic:**
- State: `src/stores/appStore.ts` - Zustand store
- Research: `src/lib/research/research-service.ts` - orchestration
- Visualization: `src/components/canvas/ResearchCanvas.tsx` - D3 canvas
- Data: `src/lib/supabase.ts` - all Supabase operations

**Testing:**
- Test cases: `test_cases.json` - validation test cases
- Mock outputs: `mock_outputs/` - reference output data

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: `ComponentName.tsx` (PascalCase, matches export name)
- Hooks: `useHookName.ts` (camelCase with use prefix)
- Services: `service-name.ts` (kebab-case)
- Types: `name.ts` in `types/` directory

**Components:**
- PascalCase for component names: `ResearchCanvas`, `ReportView`, `FindingCard`
- Props interfaces: `{ComponentName}Props`
- Context: Zustand store functions with `use` prefix: `useAppStore()`

**Functions:**
- Async operations: `verb+Noun` format: `fetchSessions()`, `executeResearch()`, `saveActorFindings()`
- Helpers: `verb+Data` or `get+Data`: `groupSessionsByTemplate()`, `extractTopicFromQuery()`, `getTemplateColor()`
- Hooks: `use+Noun`: `useSessions()`, `useMapData()`

**Variables:**
- camelCase for all variables and functions
- Prefixes for visibility: `_private` (underscore) for internal functions (rarely used)
- State refs in canvas: `containerRef`, `canvasRef`, `groupsRef`, `transformRef`

**Types:**
- Interfaces: `{Domain}{Entity}` format: `ResearchSession`, `ResearchFinding`, `ResearchSource`
- Enums: `{Domain}Type` or `{Entity}Type`: `SessionStatus`, `FindingType`, `PerspectiveType`
- Utility types: `{Name}Props`, `{Name}State`, `{Name}Config`

**Database:**
- Tables: `snake_case` plural: `research_sessions`, `research_findings`, `research_sources`
- Columns: `snake_case`: `session_id`, `finding_type`, `confidence_score`
- Foreign keys: `{table}_id`: `session_id`, `decomposition_id`
- JSON fields: `snake_case_with_underscores` for keys: `credibility_factors`, `extracted_data`

## Where to Add New Code

**New Feature (e.g., new template type):**
- Backend templates: Add `src/lib/research/templates.ts` entry for template config (perspectives, prompts)
- Python backend: Add `actor/src/services/templates/{template_name}.py` module
- Report components: Add sections to `src/components/report/` if new display type needed
- Types: Update `src/types/research.ts` with new finding types if needed

**New Component/Module:**
- Visual component: `src/components/{feature}/{ComponentName}.tsx`
- Business logic: `src/lib/{domain}/{service-name}.ts`
- Custom hook: `src/hooks/use{HookName}.ts`
- Type definition: `src/types/{domain}.ts`

**Utilities:**
- Shared helpers: `src/lib/utils.ts`
- D3 utilities: `src/lib/d3/{utility-name}.ts`
- Validation: `actor/src/schemas/{schema-name}.py`

**API Endpoints:**
- Research: `/api/actor/run` (already exists)
- New endpoints: Create `src/app/api/{feature}/{action}/route.ts`
- Pattern: POST handlers that orchestrate service and persist results

## Special Directories

**src/components/canvas/**
- Purpose: D3 visualization with custom rendering and interaction
- Generated: No (hand-written)
- Committed: Yes
- Special pattern: Uses refs to manage D3 state outside React render cycle
- Key files: ResearchCanvas.tsx (component), layout.ts (force simulation), useCanvasRenderer.ts (canvas draw loop), useCanvasInteraction.ts (zoom/pan)

**actor/src/services/templates/**
- Purpose: Template-specific prompts and finding extraction rules
- Generated: Partially (some prompts generated by Gemini)
- Committed: Yes (template definitions)
- Special pattern: Each module maps perspectives to prompts, defines finding types specific to template
- Extensible: Add new template by creating new module and registering in intelligence.py

**.planning/codebase/**
- Purpose: GSD analysis documents for code navigation
- Generated: Yes (created by Claude mapper agent)
- Committed: Yes (stored for reference by planning/execution phases)
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

**mock_outputs/**
- Purpose: Mock research results for testing and demonstration
- Generated: Yes (from test runs)
- Committed: No (gitignored - use for reference only)
- Pattern: Store sample findings, perspectives, sources for UI testing

**public/**
- Purpose: Static assets served directly
- Generated: No
- Committed: Yes
- Contains: Favicon, images, fonts

---

*Structure analysis: 2026-01-27*
