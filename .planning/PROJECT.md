# Research Explorer

## What This Is

A research initiation and exploration platform. Users discover newsworthy topics from multiple data sources (Twitter, BBC, etc.), review and initiate deep research on selected topics, and explore completed research findings. The current focus is a dashboard for topic discovery and research initiation.

## Core Value

Enable users to efficiently discover, prioritize, and initiate research on newsworthy topics from diverse data sources.

## Current Milestone: v2.0 Research Initiation Dashboard

**Goal:** Build a compact, efficient UI for discovering and initiating research from 10 data source lists

**Target features:**
- New `/initiate` page with 10-column topic lists (Swiss theme)
- Data sources: Twitter, BBC, Reuters, etc. (mocked initially)
- Per-list: download topics action
- Per-item: delete, research trigger, status indicator (pending/researching/completed)
- LLM prompt for on-demand topic discovery per source
- Database schema for research topics and data sources

## Requirements

### Validated

- Research sessions stored in Supabase with template types, findings, sources, perspectives
- Python actor generates research with Gemini + web search grounding
- Multiple template types exist (investigative, financial, competitive, tech_market, legal, due_diligence, contract, purchase_decision, reputation, understanding)

### Active

**Dashboard Layout (v2):**
- [ ] New `/initiate` page route
- [ ] 10-column layout showing all source lists without scrolling
- [ ] Swiss theme styling (clean, minimal, high-contrast)
- [ ] Compact, information-dense design

**Data Sources (v2):**
- [ ] 10 mocked data sources (Twitter, BBC, Reuters, etc.)
- [ ] Source header with name and download action
- [ ] Source list with scrollable topic items

**Topic Items (v2):**
- [ ] Display topic title and discovery date
- [ ] Delete action (soft delete)
- [ ] Research action (triggers Python actor)
- [ ] Status indicator: pending (default), researching (in progress), completed (linked to session)

**LLM Discovery (v2):**
- [ ] Prompt design for web-search enabled LLM
- [ ] On-demand discovery button per source
- [ ] Topics returned: title, description, URL, signals (controversial/trending/breaking)

**Database Schema (v2):**
- [ ] `data_sources` table — source definitions
- [ ] `research_topics` table — discovered topics with status
- [ ] Migration script for Supabase
- [ ] Link research_topics to research_sessions on completion

**Deferred from v1:**
- [ ] Navigation shell (template selector, breadcrumb)
- [ ] Topic map visualization
- [ ] Transitions and animations
- [ ] Research detail modal

### Out of Scope

- Search functionality — discovery-first approach
- User authentication/multi-tenant — single user for now
- Mobile-first design — desktop primary
- Automated/scheduled discovery — on-demand only for v2
- Topic editing — only delete and research actions
- Batch research — one topic at a time

## Context

**Existing Codebase:**
- Next.js 16 + React 19 frontend with Tailwind CSS 4
- Python backend with Apify SDK, deployed to Cloud Run
- Supabase PostgreSQL for all research data
- Zustand for state management
- Swiss theme system with semantic CSS variables (from v1)

**v1 Foundation (completed):**
- Theme switcher with persistence (Radar, Swiss, Organic)
- Semantic variable system (~35 variables)
- Legacy component cleanup

**Current Schema (research_sessions):**
- Sessions have template_type, query, status, parameters
- Findings have type, content, confidence_score, evidence
- Sources have url, title, domain, credibility_score
- No table for unresearched topics (v2 adds this)

**v2 Schema Additions:**
- `data_sources` — 10 source definitions (Twitter, BBC, etc.)
- `research_topics` — Topics discovered but not yet researched

## Constraints

- **Performance**: 10 lists visible simultaneously without layout shift
- **Data compatibility**: Extend Supabase schema, don't break existing tables
- **Theme**: Swiss theme only for v2 (other themes deferred)
- **Actor integration**: Must trigger existing Python research actor

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pivot from v1 explorer to v2 initiation | User priority shifted to research initiation workflow | — Pending |
| 10-column layout for source lists | Maximize information density, minimize scrolling | — Pending |
| Swiss theme only for v2 | Focus on functionality first, visual variety later | — Pending |
| LLM discovery on-demand | Avoid background processing complexity | — Pending |
| Soft delete for topics | Preserve data for audit, allow recovery | — Pending |

---
*Last updated: 2026-01-31 after v2 milestone start*
