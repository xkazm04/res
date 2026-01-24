# Deep Research Actor - Event System Design

## Overview

This document describes the event-driven architecture for the Deep Research Actor, enabling:
- Real-time progress tracking via status messages
- Webhook notifications for async integrations
- Pricing transparency mapped to execution phases
- UI integration for cost visibility

---

## 1. Research Lifecycle Events

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESEARCH LIFECYCLE EVENTS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ACTOR.RUN.CREATED                                                           │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 1: INITIALIZATION                                              │    │
│  │ Event: research.initialized                                          │    │
│  │ Status: "Initializing research session..."                           │    │
│  │ Cost: $0.00 (no API calls yet)                                       │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 2: QUERY GENERATION                                            │    │
│  │ Event: research.queries_generated                                    │    │
│  │ Status: "Generated {n} search queries"                               │    │
│  │ Cost: ~$0.01 (1 Gemini call)                                         │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 3: WEB SEARCH (iterative)                                      │    │
│  │ Events: research.search_started, research.search_completed           │    │
│  │ Status: "Searching {n}/{total}: {query}..."                          │    │
│  │ Cost: ~$0.01-0.02 per search (grounded search + extraction)          │    │
│  │                                                                       │    │
│  │ Sub-events per search:                                                │    │
│  │   - search.grounding_complete (sources found)                        │    │
│  │   - search.extraction_complete (findings extracted)                  │    │
│  │   - search.verification_complete (bias/sanity checks)                │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 4: PERSPECTIVE ANALYSIS                                        │    │
│  │ Event: research.perspectives_generated                               │    │
│  │ Status: "Analyzing from {n} expert perspectives..."                  │    │
│  │ Cost: ~$0.02-0.04 (1 Gemini call with all findings)                  │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 5: REPORT GENERATION (optional)                                │    │
│  │ Event: research.report_generated                                     │    │
│  │ Status: "Generating {variant} report..."                             │    │
│  │ Cost: ~$0.01-0.02 (1 Gemini call)                                    │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 6: DELIVERY                                                    │    │
│  │ Event: research.delivery_started                                     │    │
│  │ Status: "Delivering results..."                                      │    │
│  │ Cost: $0.00 (storage/email)                                          │    │
│  │                                                                       │    │
│  │ Sub-events:                                                           │    │
│  │   - delivery.dataset_pushed                                          │    │
│  │   - delivery.email_sent (if enabled)                                 │    │
│  │   - delivery.webhook_sent (if configured)                            │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ACTOR.RUN.SUCCEEDED                                                         │
│  Event: research.completed                                                   │
│  Status: "Research complete: {n} findings, {m} sources"                     │
│  (Terminal status message)                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Event Schema Definition

### Base Event Structure

```typescript
interface ResearchEvent {
  // Event identification
  event_type: string;           // e.g., "research.search_completed"
  event_id: string;             // Unique ID: "evt_abc123"
  timestamp: string;            // ISO 8601

  // Context
  session_id: string;           // Research session ID
  apify_run_id: string;         // Apify run ID

  // Phase tracking
  phase: ResearchPhase;         // Current phase
  phase_progress: number;       // 0.0 - 1.0
  overall_progress: number;     // 0.0 - 1.0

  // Cost tracking (cumulative)
  cost_so_far: CostSnapshot;

  // Phase-specific data
  data: EventData;
}

type ResearchPhase =
  | "initialization"
  | "query_generation"
  | "web_search"
  | "perspective_analysis"
  | "report_generation"
  | "delivery"
  | "completed"
  | "failed";

interface CostSnapshot {
  tokens_used: number;
  searches_completed: number;
  api_cost_usd: number;         // Gemini API cost
  platform_cost_usd: number;    // Apify platform cost
  total_cost_usd: number;
}
```

### Event Types Catalog

| Event Type | Phase | Trigger | Data Fields |
|------------|-------|---------|-------------|
| `research.initialized` | initialization | Actor started | `query`, `template`, `granularity` |
| `research.queries_generated` | query_generation | Queries ready | `queries[]`, `query_count` |
| `research.search_started` | web_search | Search begins | `search_index`, `query`, `total_searches` |
| `research.search_completed` | web_search | Search done | `search_index`, `sources_found`, `findings_extracted` |
| `research.perspectives_started` | perspective_analysis | Analysis begins | `perspective_types[]` |
| `research.perspectives_completed` | perspective_analysis | Analysis done | `perspectives_count`, `insights_count` |
| `research.report_started` | report_generation | Report begins | `report_variant`, `format` |
| `research.report_completed` | report_generation | Report ready | `report_length`, `sections_count` |
| `research.delivery_started` | delivery | Delivery begins | `channels[]` |
| `research.email_sent` | delivery | Email delivered | `recipient`, `success` |
| `research.webhook_sent` | delivery | Webhook fired | `url`, `status_code` |
| `research.completed` | completed | All done | `summary`, `final_cost` |
| `research.failed` | failed | Error occurred | `error_code`, `error_message`, `phase` |

---

## 3. Status Message Updates

### Implementation Pattern (Python)

```python
from apify import Actor

class StatusReporter:
    """Manages status messages during research execution."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.phase = "initialization"
        self.searches_total = 0
        self.searches_completed = 0

    async def update(self, message: str, is_terminal: bool = False):
        """Update actor status message."""
        await Actor.set_status_message(message, is_terminal=is_terminal)

    # Phase-specific updates
    async def initialized(self, query: str, template: str, granularity: str):
        await self.update(f"Starting {granularity} {template} research...")

    async def queries_generated(self, count: int):
        self.searches_total = count
        await self.update(f"Generated {count} search queries")

    async def search_progress(self, index: int, query: str):
        self.searches_completed = index
        progress = int((index / self.searches_total) * 100)
        await self.update(f"Searching [{index}/{self.searches_total}] {progress}%: {query[:40]}...")

    async def search_completed(self, findings: int, sources: int):
        await self.update(
            f"Search complete: {findings} findings from {sources} sources"
        )

    async def perspectives_started(self, count: int):
        await self.update(f"Analyzing from {count} expert perspectives...")

    async def report_generating(self, variant: str):
        await self.update(f"Generating {variant} report...")

    async def completed(self, findings: int, sources: int, cost: float):
        await self.update(
            f"Complete: {findings} findings, {sources} sources (${cost:.4f})",
            is_terminal=True
        )

    async def failed(self, error: str):
        await self.update(f"Failed: {error}", is_terminal=True)
```

### Status Message Format Standards

| Phase | Format | Example |
|-------|--------|---------|
| Initialization | `Starting {granularity} {template} research...` | "Starting deep tech_market research..." |
| Query Generation | `Generated {n} search queries` | "Generated 12 search queries" |
| Web Search | `Searching [{n}/{total}] {pct}%: {query}` | "Searching [5/12] 42%: AI coding adoption..." |
| Perspectives | `Analyzing from {n} expert perspectives...` | "Analyzing from 8 expert perspectives..." |
| Report | `Generating {variant} report...` | "Generating full_report report..." |
| Delivery | `Delivering to {channels}...` | "Delivering to email, webhook..." |
| Complete | `Complete: {findings} findings, {sources} sources (${cost})` | "Complete: 17 findings, 24 sources ($0.19)" |
| Failed | `Failed: {error}` | "Failed: API quota exceeded" |

---

## 4. Pricing Tiers Mapped to Events

### Tier Definitions

```typescript
interface PricingTier {
  id: string;
  name: string;
  granularity: "quick" | "standard" | "deep";

  // Limits
  max_searches: number;
  max_perspectives: number;

  // Time estimates
  estimated_duration: {
    min_minutes: number;
    max_minutes: number;
  };

  // Pricing
  base_price_usd: number;
  per_search_cost: number;
  per_perspective_cost: number;

  // Event triggers for metering
  billable_events: string[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "quick",
    name: "Quick Research",
    granularity: "quick",
    max_searches: 5,
    max_perspectives: 4,
    estimated_duration: { min_minutes: 3, max_minutes: 8 },
    base_price_usd: 0.25,
    per_search_cost: 0.02,
    per_perspective_cost: 0.01,
    billable_events: [
      "research.search_completed",
      "research.perspectives_completed"
    ]
  },
  {
    id: "standard",
    name: "Standard Research",
    granularity: "standard",
    max_searches: 8,
    max_perspectives: 6,
    estimated_duration: { min_minutes: 6, max_minutes: 13 },
    base_price_usd: 0.50,
    per_search_cost: 0.02,
    per_perspective_cost: 0.01,
    billable_events: [
      "research.search_completed",
      "research.perspectives_completed",
      "research.report_completed"
    ]
  },
  {
    id: "deep",
    name: "Deep Research",
    granularity: "deep",
    max_searches: 15,
    max_perspectives: 8,
    estimated_duration: { min_minutes: 12, max_minutes: 25 },
    base_price_usd: 1.00,
    per_search_cost: 0.02,
    per_perspective_cost: 0.01,
    billable_events: [
      "research.search_completed",
      "research.perspectives_completed",
      "research.report_completed"
    ]
  }
];
```

### Cost Breakdown by Phase

| Phase | Events | Estimated Cost | Cost Driver |
|-------|--------|----------------|-------------|
| Initialization | 1 | $0.00 | None |
| Query Generation | 1 | $0.01 | 1 Gemini call |
| Web Search | N (3-15) | $0.01-0.02/search | Grounded search + extraction |
| Perspective Analysis | 1 | $0.02-0.04 | 1 large Gemini call |
| Report Generation | 0-1 | $0.01-0.02 | 1 Gemini call |
| Delivery | 1-3 | $0.00 | Storage only |

### Price Calculator

```typescript
interface PriceQuote {
  tier: PricingTier;

  // Breakdown
  base_cost: number;
  search_cost: number;        // max_searches × per_search_cost
  perspective_cost: number;   // max_perspectives × per_perspective_cost
  report_cost: number;        // $0.02 if generate_report

  // Addons
  pdf_processing: number;     // $0.10 if input_file_url
  priority_queue: number;     // base × 0.5 if priority

  // Total
  subtotal: number;
  platform_margin: number;    // 20% margin
  total_usd: number;

  // Estimates
  estimated_duration: { min: number; max: number };
}

function calculatePriceQuote(input: ResearchInput): PriceQuote {
  const tier = PRICING_TIERS.find(t => t.granularity === input.granularity);

  const base_cost = tier.base_price_usd;
  const search_cost = tier.max_searches * tier.per_search_cost;
  const perspective_cost = tier.max_perspectives * tier.per_perspective_cost;
  const report_cost = input.generate_report ? 0.02 : 0;

  const pdf_processing = input.input_file_url ? 0.10 : 0;
  const priority_queue = input.priority ? base_cost * 0.5 : 0;

  const subtotal = base_cost + search_cost + perspective_cost +
                   report_cost + pdf_processing + priority_queue;
  const platform_margin = subtotal * 0.20;

  return {
    tier,
    base_cost,
    search_cost,
    perspective_cost,
    report_cost,
    pdf_processing,
    priority_queue,
    subtotal,
    platform_margin,
    total_usd: subtotal + platform_margin,
    estimated_duration: tier.estimated_duration
  };
}
```

---

## 5. Webhook Configuration

### Apify Webhook Setup

```json
{
  "eventTypes": [
    "ACTOR.RUN.SUCCEEDED",
    "ACTOR.RUN.FAILED",
    "ACTOR.RUN.TIMED_OUT",
    "ACTOR.RUN.ABORTED"
  ],
  "requestUrl": "https://your-api.com/webhooks/apify",
  "payloadTemplate": {
    "event": "{{eventType}}",
    "run_id": "{{resource.id}}",
    "actor_id": "{{resource.actId}}",
    "status": "{{resource.status}}",
    "started_at": "{{resource.startedAt}}",
    "finished_at": "{{resource.finishedAt}}",
    "dataset_id": "{{resource.defaultDatasetId}}",
    "key_value_store_id": "{{resource.defaultKeyValueStoreId}}",
    "usage_usd": "{{resource.usageTotalUsd}}"
  }
}
```

### Custom Event Webhook (Actor-Emitted)

During actor execution, emit events to client webhook:

```python
async def emit_event(webhook_url: str, event: ResearchEvent):
    """Emit custom research event to client webhook."""
    if not webhook_url:
        return

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                webhook_url,
                json=event.model_dump(),
                headers={"Content-Type": "application/json"}
            )
    except Exception as e:
        logger.warning(f"Webhook delivery failed: {e}")
```

### Webhook Payload Examples

**research.search_completed**
```json
{
  "event_type": "research.search_completed",
  "event_id": "evt_abc123",
  "timestamp": "2025-12-27T19:35:42Z",
  "session_id": "sess_xyz789",
  "apify_run_id": "kRvREJN1q1z2gwQbC",
  "phase": "web_search",
  "phase_progress": 0.625,
  "overall_progress": 0.45,
  "cost_so_far": {
    "tokens_used": 25000,
    "searches_completed": 5,
    "api_cost_usd": 0.08,
    "platform_cost_usd": 0.05,
    "total_cost_usd": 0.13
  },
  "data": {
    "search_index": 5,
    "query": "AI coding assistants enterprise adoption 2025",
    "sources_found": 8,
    "findings_extracted": 4
  }
}
```

**research.completed**
```json
{
  "event_type": "research.completed",
  "event_id": "evt_def456",
  "timestamp": "2025-12-27T19:42:15Z",
  "session_id": "sess_xyz789",
  "apify_run_id": "kRvREJN1q1z2gwQbC",
  "phase": "completed",
  "phase_progress": 1.0,
  "overall_progress": 1.0,
  "cost_so_far": {
    "tokens_used": 52000,
    "searches_completed": 8,
    "api_cost_usd": 0.15,
    "platform_cost_usd": 0.08,
    "total_cost_usd": 0.23
  },
  "data": {
    "findings_count": 17,
    "perspectives_count": 6,
    "sources_count": 24,
    "report_generated": true,
    "execution_time_seconds": 492,
    "results_url": "https://api.apify.com/v2/key-value-stores/xxx/records/OUTPUT"
  }
}
```

---

## 6. UI Integration

### Event-to-UI Mapping

```typescript
// Frontend store for research progress
interface ResearchProgressState {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";

  // Progress tracking
  current_phase: ResearchPhase;
  phase_progress: number;
  overall_progress: number;

  // Real-time counters
  searches_completed: number;
  searches_total: number;
  findings_count: number;
  sources_count: number;

  // Cost tracking
  cost_so_far: number;
  estimated_total: number;

  // Timing
  started_at: Date;
  estimated_completion: Date;
  elapsed_seconds: number;

  // Phase history
  completed_phases: ResearchPhase[];
  current_phase_started_at: Date;
}

// Event handler
function handleResearchEvent(event: ResearchEvent) {
  switch (event.event_type) {
    case "research.initialized":
      updateProgress({ status: "running", current_phase: "initialization" });
      break;

    case "research.search_completed":
      updateProgress({
        searches_completed: event.data.search_index,
        findings_count: prev => prev + event.data.findings_extracted,
        sources_count: prev => prev + event.data.sources_found,
        cost_so_far: event.cost_so_far.total_cost_usd
      });
      break;

    case "research.completed":
      updateProgress({
        status: "completed",
        overall_progress: 1.0,
        findings_count: event.data.findings_count,
        sources_count: event.data.sources_count
      });
      break;
  }
}
```

### Pricing Display Component

```typescript
// Price breakdown for UI
interface PriceDisplayProps {
  tier: "quick" | "standard" | "deep";
  options: {
    generate_report: boolean;
    input_file_url?: string;
    priority?: boolean;
  };
}

function PriceBreakdown({ tier, options }: PriceDisplayProps) {
  const quote = calculatePriceQuote({ granularity: tier, ...options });

  return (
    <div className="price-breakdown">
      <div className="tier-header">
        <span>{quote.tier.name}</span>
        <span className="estimate">
          {quote.estimated_duration.min}-{quote.estimated_duration.max} min
        </span>
      </div>

      <div className="cost-lines">
        <CostLine label="Base research" amount={quote.base_cost} />
        <CostLine label={`Up to ${quote.tier.max_searches} searches`} amount={quote.search_cost} />
        <CostLine label={`${quote.tier.max_perspectives} expert perspectives`} amount={quote.perspective_cost} />
        {options.generate_report && <CostLine label="Report generation" amount={quote.report_cost} />}
        {options.input_file_url && <CostLine label="PDF processing" amount={quote.pdf_processing} />}
        {options.priority && <CostLine label="Priority queue" amount={quote.priority_queue} />}
      </div>

      <div className="total">
        <span>Estimated Total</span>
        <span className="amount">${quote.total_usd.toFixed(2)}</span>
      </div>

      <p className="note">
        Actual cost may be lower based on search efficiency.
        You'll only be charged for completed work.
      </p>
    </div>
  );
}
```

---

## 7. Implementation Checklist

### Actor Changes (Python)

- [ ] Create `StatusReporter` class in `src/services/status.py`
- [ ] Create `EventEmitter` class in `src/services/events.py`
- [ ] Define event schemas in `src/schemas/events.py`
- [ ] Add `progress_webhook_url` to input schema
- [ ] Instrument `ResearchService` with status updates
- [ ] Emit events at each phase transition
- [ ] Track cumulative costs in `CostTracker`
- [ ] Add terminal status message on completion/failure

### API Changes (Next.js)

- [ ] Create `/api/webhooks/apify` endpoint for run events
- [ ] Create `/api/research/[job_id]/events` SSE endpoint
- [ ] Create `pricing-calculator.ts` utility
- [ ] Add `useResearchProgress` React hook
- [ ] Create `PriceBreakdown` component
- [ ] Create `ResearchProgress` component

### Database Schema (Supabase)

- [ ] Create `research_jobs` table
- [ ] Create `research_events` table
- [ ] Create `pricing_tiers` table
- [ ] Add RLS policies

### Configuration

- [ ] Configure Apify webhook for actor
- [ ] Set up environment variables for webhook URLs
- [ ] Configure event retention policy

---

## 8. Event Retention & Storage

### Event Storage Strategy

| Event Type | Storage | Retention |
|------------|---------|-----------|
| Phase events | Supabase `research_events` | 30 days |
| Search events | Supabase `research_events` | 7 days |
| Completion events | Supabase `research_events` | 90 days |
| Cost snapshots | Supabase `research_jobs` | Permanent |

### Event Query Patterns

```sql
-- Get all events for a job
SELECT * FROM research_events
WHERE job_id = 'job_abc123'
ORDER BY timestamp;

-- Get latest status per job
SELECT DISTINCT ON (job_id) *
FROM research_events
WHERE event_type IN ('research.completed', 'research.failed')
ORDER BY job_id, timestamp DESC;

-- Calculate actual vs estimated cost
SELECT
  j.id,
  j.price_quote->>'total_usd' as estimated,
  e.cost_so_far->>'total_cost_usd' as actual,
  (j.price_quote->>'total_usd')::numeric -
    (e.cost_so_far->>'total_cost_usd')::numeric as savings
FROM research_jobs j
JOIN research_events e ON e.job_id = j.id
WHERE e.event_type = 'research.completed';
```

---

## References

- [Apify Webhook Events](https://docs.apify.com/platform/integrations/webhooks/events)
- [Apify Status Messages](https://docs.apify.com/platform/actors/development/programming-interface/status-messages)
- [Apify Actor Lifecycle](https://docs.apify.com/sdk/python/docs/concepts/actor-lifecycle)
- [Ad-hoc Webhooks](https://docs.apify.com/platform/integrations/webhooks/ad-hoc-webhooks)
