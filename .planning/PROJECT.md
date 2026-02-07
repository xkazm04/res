# Research Explorer

## What This Is

A research initiation and exploration platform. Users discover newsworthy topics from 10 data sources (Twitter, BBC, Reuters, etc.), review and initiate deep research on selected topics with a single click, and track research progress in real-time. The platform combines LLM-powered topic discovery with automated research generation.

## Core Value

Enable users to efficiently discover, prioritize, and initiate research on newsworthy topics from diverse data sources.

## Current State: v4.0 Video Maker (IN PROGRESS)

**Goal:** Compose research findings into YouTube-ready shorts with server-side Remotion rendering.

**Target features:**
- `/maker` page with browse → select → preview → export workflow
- Left sidebar: compact research sessions list with filters
- Main area: component selection (findings, sources, perspectives)
- Live video preview with format toggle (9:16 Shorts / 16:9 Standard)
- Server-side Remotion rendering to MP4
- YouTube upload integration

## Previous State: v3.0 Claude Code Research Engine (SHIPPED 2026-02-02)

**Delivered:**
- TypeScript template builder generating .md prompt files
- Claude Code CLI with built-in web search for research
- Same Supabase persistence structure as current system
- 7-phase research pipeline with meta-analysis
- All 10 templates migrated to new system
- Legacy actor/serverless code deleted (38k lines removed)

## Previous State (v2.0 Shipped)

**Shipped:** 2026-02-01
**Codebase:** 73,187 lines TypeScript

**Delivered:**
- `/initiate` page with 10-column topic dashboard
- LLM-powered topic discovery with Google Search grounding
- One-click research initiation with source-based template selection
- Real-time status polling (5-second interval)
- Queue dashboard showing all active research
- View Results for completed topics, Retry for failed

**Tech Stack:**
- Next.js 16 + React 19 + Tailwind CSS 4
- Supabase PostgreSQL (data_sources, research_topics tables)
- Gemini API with structured output for discovery
- Python actor on Cloud Run for research generation (REPLACING)
- TanStack Virtual for 60fps list rendering

## Requirements

### Validated (v2.0)

- ✓ 10-column grid layout with horizontal scroll — v2.0
- ✓ Virtualized lists handle 100+ items at 60fps — v2.0
- ✓ TopicCard with status indicators (WCAG compliant) — v2.0
- ✓ LLM discovery with Google Search grounding — v2.0
- ✓ URL validation (HEAD request health check) — v2.0
- ✓ Rate limiting (max 3 concurrent discovery requests) — v2.0
- ✓ Research initiation returns HTTP 202 with session ID — v2.0
- ✓ Template selected based on source — v2.0
- ✓ Status polling every 5 seconds — v2.0
- ✓ Queue dashboard shows all pending/active research — v2.0
- ✓ View Results opens research session — v2.0
- ✓ Retry re-initiates failed research — v2.0

### Validated (v1.0)

- ✓ Research sessions stored in Supabase with template types, findings, sources
- ✓ Python actor generates research with Gemini + web search grounding
- ✓ Theme switcher with persistence (Radar, Swiss, Organic)
- ✓ Semantic CSS variable system (~35 variables)

### Validated (v3.0)

- ✓ TypeScript template builder with composable prompt parts — v3.0
- ✓ Template configs for all 10 templates — v3.0
- ✓ 7-phase research pipeline (with meta-analysis) — v3.0
- ✓ Claude Code CLI invocation with --prompt-file — v3.0
- ✓ Supabase API integration for persistence — v3.0
- ✓ Quality validation against existing research output — v3.0
- ✓ Legacy code deletion (actor/, serverless/) — v3.0

**Deferred (v4+ Candidates):**
- [ ] Signal badges (breaking/trending/controversial) on topic cards
- [ ] Density toggle (comfortable vs compact mode)
- [ ] Column collapse/expand
- [ ] Quick preview on hover
- [ ] Research history context ("Researched 3 days ago")
- [ ] Bulk selection with "Research all selected"
- [ ] Keyboard shortcuts (j/k navigation, r to research)
- [ ] AI-powered topic deduplication across sources
- [ ] Topic clustering by theme (Politics, Tech, Markets)
- [ ] Batch scheduling ("Research all at 6 PM")
- [ ] Priority scoring via LLM
- [ ] Navigation shell (template selector, breadcrumb)
- [ ] Topic map visualization
- [ ] Transitions and animations

### Out of Scope

- Search functionality — discovery-first approach
- User authentication/multi-tenant — single user for now
- Mobile-first design — desktop primary
- Automated/scheduled discovery — on-demand only
- Topic editing — only delete and research actions

## Context

**Database Schema:**
- `data_sources` — 10 source definitions (Twitter, BBC, etc.)
- `research_topics` — Topics with status, session_id link
- `research_sessions` — Sessions with template_type, findings, sources

**API Routes:**
- `POST /api/topics/discover` — LLM discovery with rate limiting
- `POST /api/topics/{id}/research` — Initiate research (202 response)
- `GET /api/topics/status` — Batch status for polling

## Constraints

- **Performance**: 10 lists visible at 60fps (virtualization required)
- **Data compatibility**: Same Supabase schema structure as current system
- **Theme**: Swiss theme only (other themes available but not focus)
- **Claude Code**: Headless CLI with web search enabled, local execution
- **Backwards compatible**: Research output format matches existing structure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pivot from v1 explorer to v2 initiation | User priority shifted to research initiation workflow | ✓ Good |
| 10-column layout for source lists | Maximize information density, minimize scrolling | ✓ Good |
| Swiss theme only for v2 | Focus on functionality first, visual variety later | ✓ Good |
| LLM discovery on-demand | Avoid background processing complexity | ✓ Good |
| Soft delete for topics | Preserve data for audit, allow recovery | ✓ Good |
| useFlushSync: false for TanStack Virtual | React 19 compatibility | ✓ Good |
| HEAD request URL validation | 34% hallucination rate from LLM | ✓ Good |
| Semaphore for rate limiting | Fast-fail 429 responses | ✓ Good |
| Conditional DB update for idempotency | Race condition prevention | ✓ Good |
| Visibility API for polling | Pause on hidden tabs | ✓ Good |

---
*Last updated: 2026-02-04 after v4.0 milestone started*
