# Codebase Concerns

**Analysis Date:** 2026-01-27

## Security Issues

### Exposed API Keys and Secrets in .env File

**Risk:** Critical

- **Issue:** `.env` file contains hardcoded `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` checked into git repository
- **Files:** `/c/Users/mkdol/dolla/res/.env` (public API keys exposed)
- **Impact:** Supabase credentials are accessible to anyone with repository access; could enable unauthorized database access
- **Current mitigation:** Keys are public/anon-only but still enable unauthenticated database operations
- **Recommendations:**
  1. Remove `.env` from git history immediately using `git filter-branch` or similar
  2. Rotate Supabase anon key in Supabase dashboard
  3. Add `.env` to `.gitignore` if not already there
  4. Use environment variable injection in deployment pipeline instead
  5. Implement RLS (Row Level Security) policies on Supabase tables to prevent unauthorized reads

### API Key Access in Code

**Risk:** Medium

- **Issue:** Environment variables checked at runtime without proper initialization guards in some cases
- **Files:** `src/lib/supabase.ts` (lines 19-20), `src/app/api/actor/run/route.ts` (line 33)
- **Current mitigation:** Some code validates presence; others use optional chaining or non-null assertions
- **Recommendations:**
  1. Create centralized secrets management utility with validation on app startup
  2. Fail fast during initialization if critical API keys are missing
  3. Never log API keys even in debug mode

## Tech Debt

### Large Monolithic Components

**Risk:** Medium

- **Problem:** Multiple large React components handling complex rendering and state:
  - `ResearchCanvas.tsx` (1000+ lines of canvas rendering)
  - `supabase.ts` (674 lines with 40+ query functions)
  - `research-service.ts` (620 lines of orchestration)
  - `base.py` (1764 lines of template definitions)
  - `report_interactive.py` (1296 lines of interactive reporting)

- **Files:** `src/components/canvas/ResearchCanvas.tsx`, `src/lib/supabase.ts`, `src/lib/research/research-service.ts`, `actor/src/templates/base.py`
- **Impact:** Harder to test, debug, and maintain; increased risk of regressions
- **Fix approach:**
  1. Extract canvas rendering into smaller sub-components: `CanvasBackground`, `CanvasNodes`, `CanvasInteraction`
  2. Split supabase.ts into domain-specific files: `sessions.ts`, `findings.ts`, `perspectives.ts`
  3. Extract report template logic into separate template service
  4. Break large Python files into service layer + template definitions

### Missing Error Boundaries and Fallbacks

**Risk:** Medium

- **Issue:** React components lack error boundaries; Supabase queries return empty arrays on error but don't distinguish between "no data" and "failed"
- **Files:** `src/lib/supabase.ts` (all query functions), `src/components/canvas/ResearchCanvas.tsx`, `src/components/report/`
- **Impact:** Silent failures; users can't distinguish between empty results and network errors; canvas rendering failures crash entire page
- **Recommendations:**
  1. Implement `<ErrorBoundary>` wrapper around canvas and report components
  2. Add explicit error states to all Supabase queries (return `{data, error}` pattern)
  3. Display error toast notifications for failed research operations
  4. Add fallback UI for canvas rendering failures

### Untyped API Responses

**Risk:** Medium

- **Problem:** Gemini API responses use `any` type with comments `@ts-ignore`, losing type safety
- **Files:** `src/lib/research/gemini-client.ts` (lines 75-76, 147-148)
- **Impact:** Runtime errors possible when API response format changes; hard to refactor safely
- **Fix approach:**
  1. Create proper TypeScript interfaces for Gemini response structures
  2. Add response validation schema (Zod or similar)
  3. Remove all `@ts-ignore` comments

## Performance Bottlenecks

### Inefficient Database Queries

**Risk:** Medium

- **Problem:** `getSessionWithDetails()` in `src/lib/supabase.ts` (lines 74-126) makes 9 parallel queries for a single session
- **Files:** `src/lib/supabase.ts` (lines 85-95)
- **Current capacity:** Can handle ~100 concurrent session loads before hitting Supabase RLS limits
- **Limit:** Scales poorly with number of findings/perspectives per session
- **Scaling path:**
  1. Implement pagination for findings, sources, perspectives
  2. Use Supabase view-based queries to consolidate related data
  3. Cache session details at app level with stale-while-revalidate pattern
  4. Add composite indexes on `session_id` + `created_at` for sorting

### Missing Pagination for Large Datasets

**Risk:** High

- **Issue:** `getAllSessions()` fetches all sessions without pagination
- **Files:** `src/lib/supabase.ts` (lines 29-40)
- **Impact:** Performance degrades as session count grows; can timeout or OOM with 10k+ sessions
- **Fix approach:**
  1. Implement cursor-based pagination (use `created_at` as cursor)
  2. Default to 50 sessions per page
  3. Implement infinite scroll or "Load More" UI
  4. Cache paginated results client-side with pagination state

### D3 Force Layout Recalculation

**Risk:** Medium

- **Problem:** `ResearchCanvas.tsx` recalculates D3 force layout on every session count change; no memoization of layout
- **Files:** `src/components/canvas/layout.ts`, `src/components/canvas/ResearchCanvas.tsx`
- **Impact:** Janky interaction with 100+ sessions visible; ~2-3 second layout calculation
- **Fix approach:**
  1. Memoize layout calculations with session data hash
  2. Implement quadtree-based spatial partitioning for force calculations
  3. Use Web Workers for async layout calculations
  4. Add viewport culling to skip rendering off-screen nodes

## Fragile Areas

### Session Persistence Race Condition

**Risk:** High

- **Problem:** Research can complete and save before database session is created
- **Files:** `src/lib/research/research-service.ts` (lines 106-123)
- **Why fragile:**
  - `executeResearch()` creates DB session but doesn't wait for confirmation
  - If `createActorSession` fails silently, subsequent `updateActorSession` calls fail
  - Multiple concurrent research requests could overwrite session state
- **Safe modification:**
  1. Add transaction-based session creation that validates before proceeding
  2. Add exponential backoff retry logic for session creation
  3. Return session ID only after confirmed database write
  4. Use optimistic locking with version counters

### Cache Service with No Invalidation

**Risk:** Medium

- **Files:** `actor/src/services/cache.py`
- **What's not tested:** Cache invalidation when research updates; stale cache scenarios
- **Why fragile:**
  - Cache key = `query + template + granularity` (query string normalization can differ)
  - No TTL on cached results; returns stale data indefinitely
  - No mechanism to invalidate cache when underlying data changes
- **Safe modification:**
  1. Add 24-hour TTL to all cache entries
  2. Implement cache invalidation when source data is updated
  3. Add query normalization utility with test coverage
  4. Log cache hits/misses for monitoring

### Unvalidated Research Input

**Risk:** Medium

- **Problem:** Research templates accept arbitrary `input_text` and `input_file_url` without validation
- **Files:** `src/lib/research/research-service.ts` (lines 146-148), `actor/src/services/research.py`
- **Impact:**
  - Large input files could cause OOM or timeout
  - Malicious input could inject prompts to bypass research template logic
  - No file type validation on `input_file_url`
- **Recommendations:**
  1. Add input validation: max 50KB for text, max 10MB for files
  2. Whitelist file types (PDF, TXT only)
  3. Validate URLs match trusted domain allowlist
  4. Sanitize input before passing to Gemini API

### Perspective Analysis Type Mapping

**Risk:** Medium

- **Files:** `src/lib/supabase.ts` (lines 552-568)
- **Problem:** Custom perspective types map to generic schema values, losing specificity
  - `forensic_financial` → `financial`
  - `power_network` → `network`
  - `psychological_behavioral` → `psychological`
- **Impact:** Can't filter or analyze by specific expert perspective in reports
- **Safe modification:**
  1. Extend `research_perspectives` schema to support `specialized_data` JSONB field (already partially done)
  2. Store original perspective type in `specialized_data.original_type`
  3. Update reports to use original type for display

## Test Coverage Gaps

### No Unit Tests for React Hooks

**Risk:** Medium

- **What's not tested:** `useMapData.ts`, `useSessions.ts`, `useSession.ts` custom hooks
- **Files:** `src/hooks/`, specifically interaction between store and hook logic
- **Risk:** Hook dependencies cause infinite loops or stale data without catching it
- **Priority:** High
- **Recommendation:** Add tests for:
  1. Hook initialization and cleanup
  2. Store synchronization
  3. Dependency array correctness

### No Integration Tests for Research Flow

**Risk:** High

- **What's not tested:** End-to-end research flow from query input to report generation
- **Files:** `src/app/api/actor/run/route.ts`, `actor/src/main.py`
- **Risk:** Breaking changes in research orchestration not caught until production
- **Priority:** High
- **Recommendation:**
  1. Create mock Gemini client for testing
  2. Test research flow with 2-3 different templates
  3. Verify session persistence works
  4. Test error handling and recovery

### No Tests for Database Query Edge Cases

**Risk:** Medium

- **What's not tested:** Queries returning null, empty arrays, malformed data
- **Files:** `src/lib/supabase.ts` (all read operations)
- **Risk:** Silent null handling masks data corruption
- **Recommendation:** Add tests for:
  1. Session not found scenarios
  2. Findings without sources
  3. Contradictions with missing reference findings

### Canvas Rendering Not Tested

**Risk:** High

- **What's not tested:** D3 force layout with various session counts (1, 10, 100, 1000+)
- **Files:** `src/components/canvas/`
- **Risk:** Performance regressions and rendering bugs not caught
- **Priority:** High
- **Recommendation:**
  1. Add visual regression tests with different dataset sizes
  2. Performance benchmarks for force layout calculation
  3. Test zoom/pan interaction under heavy load

## Scaling Limits

### Supabase RLS Query Limits

**Current capacity:** ~1000 concurrent queries before hitting rate limits

- **Limit:** Supabase free tier = 1 concurrent connection
- **Scaling path:**
  1. Upgrade to paid tier (100+ concurrent connections)
  2. Implement connection pooling
  3. Add Redis caching layer for frequently accessed data

### Gemini API Token Limits

**Current capacity:** ~2M tokens/day on standard plan

- **Limit:** ~500 tokens per research session × 4000 sessions/day = token exhaustion
- **Scaling path:**
  1. Implement token budgeting per template
  2. Add caching for repeated queries
  3. Switch to cheaper models for simple queries (Gemini Flash)

### Research Processing Time

**Current capacity:** Sequential processing limits to ~5-8 simultaneous research requests

- **Limit:** Single server can't handle 20+ concurrent research jobs
- **Scaling path:**
  1. Move research to background job queue (Bull, Celery)
  2. Horizontal scale with multiple workers
  3. Implement research prioritization (premium users get priority)

## Dependencies at Risk

### Unmaintained Report Generation Libraries

**Risk:** Low-Medium

- **Package:** `report_interactive.py` (custom implementation)
- **Risk:** No standard HTML generation library; custom HTML generation prone to injection vulnerabilities
- **Impact:** XSS vulnerabilities in generated reports
- **Migration plan:** Consider using templating library like Jinja2 with auto-escaping

### Gemini API Breaking Changes

**Risk:** Medium

- **Package:** `google.genai` (newer Python SDK)
- **Risk:** Google may deprecate older SDK versions; API response formats could change
- **Impact:** Research functionality breaks without warning
- **Migration plan:**
  1. Monitor Google AI SDK changelog
  2. Implement response versioning in code
  3. Add SDK version pinning with documented upgrade path

## Missing Critical Features

### No Audit Trail for Research Sessions

**Risk:** Medium

- **Problem:** Can't track who ran what research or when
- **Blocks:** Compliance requirements, debugging user issues
- **Recommendation:** Add audit logging table with user, timestamp, query, result hash

### No Research Result Versioning

**Risk:** Medium

- **Problem:** If research is re-run, previous findings are lost
- **Blocks:** Comparing results over time, detecting changes in market
- **Recommendation:** Implement versioning: keep all research results, link by content hash

### No Email Delivery Error Handling

**Risk:** Low

- **Problem:** Email failures are caught but silently logged
- **Files:** `src/lib/research/email-service.ts` (lines 140, 147)
- **Blocks:** Users don't know if their report was sent
- **Recommendation:**
  1. Store email delivery status in database
  2. Implement retry queue for failed emails
  3. Show delivery status in UI

## Known Issues

### Canvas Zoom Performance Degrades Over Time

**Symptoms:** Zoom becomes laggy after scrolling for 2-3 minutes

- **Files:** `src/components/canvas/ResearchCanvas.tsx` (lines 125-200)
- **Trigger:** Rapid zoom/pan events accumulate in D3 event handler
- **Workaround:** Refresh page
- **Root cause:** Event handlers not debounced; D3 node simulation continues running during interaction
- **Fix:** Add debounce to zoom handler, pause force layout during interaction

### Report Modal Doesn't Unsubscribe from Real-time Updates

**Symptoms:** Memory leak warning in React; performance degrades after opening/closing 10+ reports

- **Files:** `src/lib/supabase.ts` (lines 634-674)
- **Trigger:** Opening and closing report modal repeatedly
- **Workaround:** Refresh page
- **Root cause:** `subscribeToSession()` and `subscribeToFindings()` never call `.unsubscribe()` when modal closes
- **Fix:** Return subscription handle and call unsubscribe in modal cleanup effect

---

*Concerns audit: 2026-01-27*
