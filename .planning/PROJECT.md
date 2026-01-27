# Research Explorer

## What This Is

A multi-level discovery interface for exploring thousands of research sessions across categories (financial, investigative, tech market, competitive, due diligence, etc.). Users arrive unfamiliar with what exists and navigate through a map-like interface to discover compelling insights. Three switchable visual themes (Radar, Swiss, Organic) provide distinct aesthetic experiences.

## Core Value

Enable users to discover and explore research findings through intuitive spatial navigation, teasing compelling insights that draw them deeper into the knowledge landscape.

## Requirements

### Validated

- Research sessions stored in Supabase with template types, findings, sources, perspectives
- Python actor generates research with Gemini + web search grounding
- Multiple template types exist (investigative, financial, competitive, tech_market, legal, due_diligence, contract, purchase_decision, reputation, understanding)

### Active

**Navigation Structure:**
- [ ] Template type selector (Level 1) — tree/hierarchy view of research categories
- [ ] Topic map (Level 2) — geographic-style map with clustered nodes
- [ ] Research detail modal (Level 3) — themed view showing full research
- [ ] Smooth zoom transition from template selector to topic map
- [ ] Click cluster to zoom deeper into sub-clusters
- [ ] Click single research to open modal overlay
- [ ] Breadcrumb navigation showing current path
- [ ] Back button for level navigation
- [ ] Time filter in header to filter visible researches

**Visual Themes (switchable):**
- [ ] Radar theme — dark mode, glowing nodes, command center aesthetic
- [ ] Swiss theme — clean white/light, precise typography, minimal
- [ ] Organic theme — fluid, living ecosystem, natural clustering
- [ ] Theme affects all levels including research detail modal
- [ ] Theme switcher in UI (tab-style)

**Map Nodes:**
- [ ] Node size represents number of researches in cluster
- [ ] Node color represents template type
- [ ] Node label shows topic name (always visible)
- [ ] Hover tooltip with unique styling (not generic)
- [ ] Tooltip shows: insight-style headline + research date

**Research Detail View (new):**
- [ ] Themed modal overlay matching selected theme
- [ ] Display findings, sources, perspectives from research
- [ ] Replace legacy report view entirely

**Data Layer:**
- [ ] Add `headline` column to research_sessions table
- [ ] Update Python actor to generate insight-style headlines
- [ ] Manual backfill headlines for existing researches

**Cleanup:**
- [ ] Delete legacy report components (src/components/report/)
- [ ] Delete legacy canvas components (src/components/canvas/)
- [ ] Delete unused stores and hooks

### Out of Scope

- Search functionality — this is discovery-first, not search-first
- User authentication/multi-tenant — single user exploration
- Real-time collaboration — solo exploration experience
- Mobile-first design — desktop primary (responsive later)
- Export functionality — viewing only for v1

## Context

**Existing Codebase:**
- Next.js 16 + React 19 frontend with Tailwind CSS 4
- Python backend with Apify SDK, deployed to Cloud Run
- Supabase PostgreSQL for all research data
- D3 currently used for canvas (will be replaced/reimagined)
- Zustand for state management
- ~1900 lines of codebase analysis in .planning/codebase/

**Why Rebuilding:**
- Current UI is "ugly and non-creative"
- Visual representation system unclear
- Transitions not smooth, laggy performance
- No clear direction for representing diverse research types attractively

**Research Data Structure:**
- Sessions have template_type, query, status, parameters
- Findings have type, content, confidence_score, evidence
- Sources have url, title, domain, credibility_score
- Perspectives provide expert analysis angles
- Contradictions track conflicting findings
- Gaps identify missing information

## Constraints

- **Performance**: Must handle hundreds of visible nodes without lag
- **Data compatibility**: Must work with existing Supabase schema (extend, don't break)
- **Theme consistency**: All three themes must feel cohesive and complete
- **Headline backfill**: Existing researches won't have headlines until manually updated

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three visual themes instead of one | User preference exploration, differentiation | — Pending |
| Discovery-first over search-first | Users don't know what exists, need wayfinding | — Pending |
| Headline as human-curated hook | No clear metric for "compelling", editorial judgment needed | — Pending |
| Modal overlay for research detail | Maintains map context, quick in/out exploration | — Pending |
| Geographic map metaphor for topics | Handles dozens-to-hundreds of nodes naturally | — Pending |

---
*Last updated: 2026-01-27 after initialization*
