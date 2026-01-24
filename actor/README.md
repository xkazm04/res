# Deep Research Actor

AI-powered deep research using Gemini with Google Search grounding. Get verified findings with automatic bias detection, multi-perspective expert analysis, and beautiful interactive reports - all in under 5 minutes.

**Try it now:** Enter your research question and click "Start" - no configuration needed!

## What It Does

This actor performs comprehensive web research on any topic, returning:
- **Structured Findings**: Facts, events, metrics, and predictions with confidence scores
- **Source Verification**: Automatic bias detection, expert sanity checks, and cross-referencing
- **Expert Perspectives**: Analysis from 4-8 domain experts (VCs, engineers, analysts, etc.)
- **Formatted Reports**: Interactive HTML dashboards, executive summaries, or investment thesis documents
- **Email Delivery**: Get reports delivered directly to your inbox

## Use Cases

| Need | Template | Example Query |
|------|----------|--------------|
| **Tech trends & market analysis** | `tech_market` | "AI coding assistants market 2025" |
| **Vet a company before partnering** | `due_diligence` | "WeWork Adam Neumann company vetting" |
| **Research before buying** | `purchase_decision` | "MacBook Pro M3 vs Dell XPS 15" |
| **Check if something is legit** | `reputation` | "Is Temu legitimate safe to buy" |
| **Understand major events** | `understanding` | "US-Venezuela diplomatic crisis January 2026" |
| **Stock/investment analysis** | `financial` | "NVIDIA Q4 2025 earnings outlook" |
| **Compare competitors** | `competitive` | "Stripe vs Square vs Adyen" |
| **Legal & regulatory research** | `legal` | "AI copyright lawsuits 2025" |

## Quick Start

### Minimal Request

```json
{
  "query": "What is the current adoption rate of AI coding assistants among professional developers in 2025?"
}
```

### Full-Featured Request

```json
{
  "query": "Compare GitHub Copilot vs Cursor vs Claude Code adoption in enterprise",
  "template": "tech_market",
  "granularity": "deep",
  "generate_report": true,
  "report_variant": "full_report"
}
```

---

## Input Parameters

### Core Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | **required** | The research question or topic to investigate |
| `template` | string | `tech_market` | Research template (see [Templates](#templates)) |
| `granularity` | string | `standard` | Research depth: `quick`, `standard`, `deep` |

### Research Depth

| Level | Searches | Approx. Time | Best For |
|-------|----------|--------------|----------|
| `quick` | 3-5 | 1-2 min | Fast overview, time-sensitive queries |
| `standard` | 5-8 | 2-4 min | Balanced depth and speed |
| `deep` | 10-15 | 5-8 min | Comprehensive research, complex topics |

### Report Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `generate_report` | boolean | `true` | Generate formatted report |
| `report_variant` | string | `full_report` | `executive_summary`, `full_report`, `investment_thesis` |
| `report_format` | string | `markdown` | `markdown` or `html` |

### Optional Context

| Parameter | Type | Description |
|-----------|------|-------------|
| `input_file_url` | string | URL to PDF/text file to include as research context |
| `input_text` | string | Additional text context to guide the research |

### Email Delivery (Optional)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `send_email` | boolean | `false` | Send research report via email when complete |
| `email_to` | string | - | Recipient email address |
| `email_subject` | string | auto | Custom subject (defaults to "Research Complete: [query]") |

Requires `RESEND_API_KEY` environment variable. Email delivery is non-blocking - if it fails, the actor still completes successfully.

### Real-Time Progress (Optional)

| Parameter | Type | Description |
|-----------|------|-------------|
| `progress_webhook_url` | string | URL to receive real-time progress events via HTTP POST |

See [Real-Time Progress Tracking](#real-time-progress-tracking) for event details.

### Caching Options (NEW)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `use_cache` | boolean | `true` | Return cached results for identical queries (exact match) |
| `extend_cache` | boolean | `true` | Extend cached results in background for future users |

**How caching works:**
- Queries are normalized (lowercase, whitespace-trimmed) and hashed
- Cache key includes: query + template + granularity
- Identical queries return instant cached results (~1-2 seconds vs. 2-8 minutes)
- Dramatically reduces cost for repeated queries
- Set `use_cache: false` to force fresh research

---

## Templates

### Tech Market (`tech_market`) - Default

**Best for**: Developer tools, AI/ML trends, cloud infrastructure, 2025/2026 predictions

**Experts**: Venture Capitalist, Startup Founder, Product Manager, Developer Advocate, Open Source Maintainer, DevRel Engineer, Senior Engineer, Platform Engineer

```json
{
  "query": "What are the top Kubernetes alternatives gaining adoption in 2025?",
  "template": "tech_market"
}
```

---

### Financial (`financial`)

**Best for**: Stock analysis, earnings, valuations, SEC filings, risk assessment

**Experts**: Institutional Investor, Short Seller, Quantitative Risk Analyst, Activist Investor, Macro Strategist

```json
{
  "query": "What is Apple's current financial position and growth outlook?",
  "template": "financial",
  "report_variant": "investment_thesis"
}
```

---

### Competitive Intelligence (`competitive`)

**Best for**: Market sizing, competitor profiling, strategic positioning, SWOT analysis

**Experts**: Strategy Consultant, Industry Insider, Institutional Investor, Short Seller

```json
{
  "query": "Compare Stripe vs Square vs Adyen in payment processing",
  "template": "competitive",
  "granularity": "deep"
}
```

---

### Investigative (`investigative`)

**Best for**: Due diligence, background checks, relationship mapping, evidence gathering

**Experts**: Forensic Financial Analyst, Power Network Analyst, Behavioral Psychologist, Legal Liability Expert, Geopolitical Strategist

```json
{
  "query": "What are the business relationships and controversies surrounding Company X?",
  "template": "investigative"
}
```

---

### Legal (`legal`)

**Best for**: Case law, regulations, compliance, enforcement actions, litigation history

**Experts**: Litigation Strategist, Regulatory Expert, Legal Liability Analyst, Forensic Financial Analyst

```json
{
  "query": "Recent FTC enforcement actions against tech companies for privacy violations",
  "template": "legal"
}
```

---

### Contract (`contract`) - NEW

**Best for**: Government contract analysis, pricing evaluation, corruption detection, bid process review

**Experts**: Contract Auditor, Procurement Investigator, Forensic Accountant, Regulatory Compliance, Industry Benchmarker

**Specialized for:**
- Software development contracts
- Construction contracts
- Government procurement analysis
- Overpricing detection
- Fraud and corruption red flags
- Connected entity analysis

```json
{
  "query": "Analyze $50M IT modernization contract awarded to ABC Technologies by State of Texas",
  "template": "contract",
  "granularity": "deep"
}
```

**Finding types specific to contract template:**
- `contract_entity` - Vendors, agencies, contracting officers
- `pricing_analysis` - Cost breakdown vs. market rates
- `bid_process` - Competition level, bidders, award basis
- `suspicious_element` - Unusual terms, conflict indicators
- `connected_entity` - Related parties, shell companies
- `red_flag` - Strong fraud/corruption indicators
- `compliance_issue` - Regulatory violations
- `comparable_contract` - Similar contracts for benchmarking

---

### Due Diligence (`due_diligence`)

**Best for**: Vetting companies, vendors, partners, or employers before signing contracts or making commitments

**Experts**: Due Diligence Analyst, Forensic Financial Analyst, Legal Liability Expert, Industry Insider

**Use when you need to:**
- Vet a potential business partner or vendor
- Research a company before signing a contract
- Check an employer before accepting a job
- Pre-screen an investment opportunity

```json
{
  "query": "WeWork Adam Neumann company vetting before investment",
  "template": "due_diligence"
}
```

**Finding types:**
- `company_profile` - Basic facts, founding date, size, leadership
- `financial_health` - Revenue signals, funding, stability indicators
- `legal_history` - Lawsuits, regulatory actions, settlements
- `red_flag` - Warning signs with severity levels (high/medium/low)
- `reputation_signal` - Reviews, industry standing, testimonials
- `key_person` - Leadership background and track record

---

### Purchase Decision (`purchase_decision`)

**Best for**: Researching products and services before buying - real reviews, hidden costs, and alternatives

**Experts**: Consumer Advocate, Technical Expert, Value Analyst, Long-Term Owner

**Use when you need to:**
- Compare expensive products before buying (laptops, cars, appliances)
- Choose software or SaaS tools for your team
- Find hidden costs and real user experiences
- Identify better alternatives

```json
{
  "query": "MacBook Pro M3 vs Dell XPS 15 for software development 2025",
  "template": "purchase_decision"
}
```

**Finding types:**
- `product_strength` - What it genuinely does well (backed by user reports)
- `product_weakness` - Known issues with severity (deal_breaker/annoying/minor)
- `real_user_experience` - Actual owner feedback from forums and reviews
- `hidden_cost` - Unexpected expenses (maintenance, add-ons, subscriptions)
- `alternative_option` - Competitors worth considering
- `value_assessment` - Price vs. value verdict

---

### Reputation Check (`reputation`)

**Best for**: Verifying legitimacy and trustworthiness - scam detection, reviews, and trust signals

**Experts**: Consumer Protection Specialist, Reputation Analyst, Fact Checker, Industry Benchmarker

**Use when you need to:**
- Check if an online business is legitimate
- Verify a company before a large purchase
- Research a professional (doctor, lawyer, contractor)
- Detect potential scams

```json
{
  "query": "Is Temu legitimate safe to buy from scam check",
  "template": "reputation"
}
```

**Finding types:**
- `trust_signal` - Positive legitimacy indicators (verified/unverified/self-reported)
- `warning_sign` - Red flags with severity (critical/significant/minor)
- `complaint_pattern` - Recurring issues from multiple sources
- `verification_status` - Credentials, licenses, certifications status
- `sentiment_trend` - How perception has changed over time
- `comparison_benchmark` - How they compare to industry peers

**Trust verdict included:** Reports include an overall verdict: "DO NOT ENGAGE", "PROCEED WITH CAUTION", "APPEARS LEGITIMATE", or "INSUFFICIENT DATA"

---

### Understanding (`understanding`)

**Best for**: Deep analysis of major world events - causes, media credibility, financial motivations, misinformation detection

**Experts**: Media Analyst, Forensic Financial Analyst, Geopolitical Strategist, Fact Checker, Historian, Intelligence Analyst

**Use when you need to:**
- Understand what led to a major event (military operations, political upheavals)
- Analyze how media covered predecessor events
- Find financial motivations behind events
- Detect misinformation and propaganda patterns

```json
{
  "query": "US captured Venezuela's president January 2026 causes and implications",
  "template": "understanding"
}
```

**Finding types:**
- `event_chain` - Chronological events leading to the main event
- `media_narrative` - How outlets covered events (with accuracy assessment)
- `financial_motivation` - Money flows, beneficiaries, economic interests
- `misinformation_pattern` - Detected false claims and propaganda techniques
- `source_credibility` - Historical accuracy of sources on similar topics
- `actor_interest` - Stakeholders' stated vs. hidden interests
- `counter_narrative` - Alternative explanations and dissenting views
- `historical_parallel` - Similar events in history for context

---

## Output Structure

### Key-Value Store: `OUTPUT`

```json
{
  "session_id": "uuid",
  "query": "Your research query",
  "template": "tech_market",
  "status": "completed",

  "findings": [
    {
      "finding_id": "f1",
      "finding_type": "adoption_trend",
      "content": "GitHub Copilot has reached 1.8 million paid subscribers...",
      "summary": "Copilot crosses 1.8M subscribers",
      "confidence_score": 0.92,
      "adjusted_confidence": 0.88,
      "temporal_context": "present",
      "date_referenced": "December 2024",
      "date_range": "Q4 2024",
      "extracted_data": {
        "technology": "GitHub Copilot",
        "adoption_rate": "77%"
      },
      "verification": {
        "bias_detected": false,
        "expert_validated": true,
        "cross_referenced": true
      },
      "supporting_sources": [
        {"url": "https://...", "title": "GitHub Blog"}
      ]
    }
  ],

  "perspectives": [
    {
      "perspective_type": "venture_capitalist",
      "analysis_text": "The AI coding assistant market shows strong momentum...",
      "key_insights": ["Market consolidating around 3-4 major players"],
      "recommendations": ["Watch for M&A activity from cloud providers"],
      "predictions": [
        {
          "prediction": "Microsoft will acquire a smaller AI coding startup by Q2 2025",
          "rationale": "Strategic move to consolidate market and integrate with VS Code ecosystem",
          "confidence": "high",
          "timeline": "Q1-Q2 2025",
          "supporting_sources": ["GitHub market analysis", "Microsoft earnings call"]
        }
      ],
      "warnings": ["Commoditization risk as base models improve"],
      "confidence": 0.85
    }
  ],

  "sources": [
    {
      "url": "https://github.blog/...",
      "title": "GitHub Copilot reaches 1.8M subscribers",
      "domain": "github.blog",
      "credibility_score": 0.95,
      "credibility_label": "high"
    }
  ],

  "report_markdown": "# Research Report\n\n...",

  "cost_summary": {
    "total_tokens": 45000,
    "total_cost_usd": 0.0234
  },

  "execution_time_seconds": 67.3,

  "cache_hit": false,
  "cache_extended": false,
  "original_cached_at": null
}
```

### Key-Value Store: `EXECUTIVE_SUMMARY`

A condensed summary for quick consumption:

```json
{
  "session_id": "uuid",
  "query": "Your research query",
  "status": "completed",
  "findings_count": 12,
  "high_confidence_findings": 8,
  "sources_count": 15,
  "high_credibility_sources": 10,
  "perspectives_count": 6,
  "top_findings": ["Finding 1 summary", "Finding 2 summary", ...],
  "expert_recommendations": ["Recommendation 1", ...],
  "expert_warnings": ["Warning 1", ...],
  "key_insights": ["Insight 1", ...],
  "total_cost_usd": 0.0234,
  "execution_time_seconds": 67.3
}
```

### Dataset: Multi-Record Output

The dataset contains multiple record types for complete data access. Filter by `record_type`:

| Record Type | Count | Description |
|-------------|-------|-------------|
| `summary` | 1 | Overview with totals and key metrics |
| `finding` | N | Individual research findings |
| `perspective` | N | Expert analysis from each perspective |
| `source` | N | Sources with credibility scores |
| `metrics` | 1 | Cost and performance metrics |

#### Finding Records

| Field | Description |
|-------|-------------|
| `finding_id` | Unique identifier (f1, f2, ...) |
| `finding_type` | Type: fact, event, prediction, adoption_trend, etc. |
| `summary` | One-sentence summary |
| `confidence_score` | Confidence level (0.0-1.0) |
| `temporal_context` | past, present, ongoing, prediction |
| `date_referenced` | Specific date mentioned (e.g., "December 2024") |
| `date_range` | Date range if applicable (e.g., "Q4 2024", "2024-2025") |

#### Perspective Records

| Field | Description |
|-------|-------------|
| `perspective_type` | Expert type (venture_capitalist, senior_engineer, etc.) |
| `analysis_text` | Full analysis from this perspective |
| `key_insights` | List of key insights |
| `recommendations` | List of recommendations |
| `predictions` | List of structured predictions (see below) |
| `warnings` | List of warnings or concerns |

#### Prediction Structure (NEW)

Each prediction in `perspectives[].predictions` contains:

| Field | Description |
|-------|-------------|
| `prediction` | What will happen |
| `rationale` | Why this is expected (evidence-based reasoning) |
| `confidence` | "high", "medium", or "low" |
| `timeline` | When expected (e.g., "Q1 2025", "6-12 months") |
| `supporting_sources` | List of sources supporting this prediction |

#### Source Records

| Field | Description |
|-------|-------------|
| `url` | Source URL |
| `title` | Source title |
| `domain` | Source domain |
| `credibility_score` | Credibility rating (0.0-1.0) |
| `credibility_label` | high, medium, or low |

### Report Files

If `generate_report: true`:
- **REPORT.md** - Markdown formatted report
- **REPORT.html** - HTML report (if `report_format: "html"`)

---

## Source Verification

All findings go through automatic verification:

| Check | What It Does |
|-------|--------------|
| **Bias Detection** | Identifies vendor marketing, analyst conflicts, "skin in the game" |
| **Expert Sanity Check** | Flags implausible claims using domain expertise |
| **Cross-Reference** | Verifies claims appear in multiple independent sources |

The `adjusted_confidence` score reflects these verification results.

---

## API Examples

### cURL

```bash
curl -X POST "https://api.apify.com/v2/acts/YOUR_ACTOR_ID/runs?token=YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the top cloud cost optimization strategies in 2025?",
    "template": "tech_market",
    "granularity": "standard"
  }'
```

### JavaScript SDK

```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'YOUR_API_TOKEN' });

const run = await client.actor('YOUR_ACTOR_ID').call({
  query: 'Current state of Kubernetes adoption in enterprises',
  template: 'tech_market',
  granularity: 'deep',
  generate_report: true
});

// Get findings
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(`Found ${items.length} findings`);

// Get full output with report
const output = await client.keyValueStore(run.defaultKeyValueStoreId).getRecord('OUTPUT');
console.log(output.value.report_markdown);
```

### Python SDK

```python
from apify_client import ApifyClient

client = ApifyClient('YOUR_API_TOKEN')

run = client.actor('YOUR_ACTOR_ID').call(run_input={
    'query': 'Leading indicators of developer productivity in 2025',
    'template': 'tech_market',
    'granularity': 'standard',
    'generate_report': True
})

# Get findings
for item in client.dataset(run['defaultDatasetId']).iterate_items():
    print(f"[{item['finding_type']}] {item['summary']}")

# Get cost
output = client.key_value_store(run['defaultKeyValueStoreId']).get_record('OUTPUT')
print(f"Cost: ${output['value']['cost_summary']['total_cost_usd']:.4f}")
```

---

## Cost & Time Estimation

Based on actual production runs:

| Depth | Searches | Time | API Cost | Platform Cost | Total |
|-------|----------|------|----------|---------------|-------|
| Quick | 4-5 | 2-4 min | $0.02-0.04 | ~$0.08 | ~$0.10-0.16 |
| Standard | 6-8 | 4-8 min | $0.04-0.08 | ~$0.12 | ~$0.15-0.27 |
| Deep | 10-12 | 8-15 min | $0.08-0.15 | ~$0.20 | ~$0.27-0.45 |

**Factors affecting cost:**
- Query complexity (more nuanced queries = more tokens)
- Source content length (longer articles = more processing)
- Number of expert perspectives (more = higher cost)
- Report length (investment_thesis > full_report > executive_summary)

**Platform cost** includes Apify compute time. **API cost** is Gemini token usage only.

---

## Best Practices

### Writing Good Queries

**Specific and bounded:**
```
"What is GitHub Copilot's enterprise adoption rate in Fortune 500 companies as of 2025?"
```

**Avoid vague queries:**
```
"Tell me about AI" (too broad)
```

### Choosing Templates

| Researching... | Use Template |
|----------------|--------------|
| Tech trends, developer tools, predictions | `tech_market` |
| **Vetting a company/vendor/employer** | `due_diligence` |
| **Products before buying, comparisons** | `purchase_decision` |
| **Is this business/service legit?** | `reputation` |
| **Major world events, causes, media credibility** | `understanding` |
| Stock analysis, earnings, financial metrics | `financial` |
| Market comparison, competitors | `competitive` |
| Company background, controversies | `investigative` |
| Regulations, lawsuits, compliance | `legal` |
| Government contracts, pricing, corruption | `contract` |

### Report Types

| Variant | Best For |
|---------|----------|
| `executive_summary` | Leadership briefings (1-2 pages) |
| `full_report` | Comprehensive analysis |
| `investment_thesis` | Financial decisions |

---

## Example Runs

These example runs demonstrate the actor across all templates and configurations:

### Tech Market Template

| Topic | Template | Depth | Report | Run URL |
|-------|----------|-------|--------|---------|
| AI coding assistants enterprise adoption 2025 | tech_market | quick | executive_summary | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/L4IU2nPHd9P5x0RRV) |
| Kubernetes alternatives gaining traction 2025 | tech_market | standard | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/CdWKKC6BcTzgEvUKi) |
| Developer productivity tools market outlook 2026 | tech_market | deep | investment_thesis | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/sCHEppOLikeMOfMCC) |
| React vs Vue vs Svelte framework adoption 2025 | tech_market | standard | executive_summary | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/eFBIAa4HhRT7DQn4C) |
| GitHub Actions vs GitLab CI enterprise adoption | tech_market | quick | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/V2om9AWA3mmRm4CsZ) |
| LLM infrastructure and vector database market 2025-2026 | tech_market | deep | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/BLJVsg9wHnZDo3FDQ) |

### Financial Template

| Topic | Template | Depth | Report | Run URL |
|-------|----------|-------|--------|---------|
| Apple Q4 2024 earnings and 2025 outlook | financial | quick | executive_summary | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/VfsQ7qS4BALtnCzra) |
| NVIDIA stock valuation and AI chip market 2025 | financial | standard | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/WJJPqXKzboDUlJXEu) |
| Microsoft AI investments ROI analysis | financial | deep | investment_thesis | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/J4AzzGcokJc0lrGU3) |
| Anthropic valuation and competitive position | financial | standard | investment_thesis | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/Dl9fSDTomRCmHLfQH) |

### Competitive Intelligence Template

| Topic | Template | Depth | Report | Run URL |
|-------|----------|-------|--------|---------|
| Stripe vs Square vs Adyen payment processing | competitive | quick | executive_summary | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/cRsPRW2D3QgxPZTtv) |
| AWS vs Azure vs GCP cloud market share 2025 | competitive | standard | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/kFEtoejidI0zzI5Gs) |
| Notion vs Confluence enterprise collaboration | competitive | deep | investment_thesis | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/ddG0iqW3jrugw5vPA) |
| Vercel vs Netlify vs Cloudflare Pages | competitive | standard | executive_summary | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/07UmN7edBzndxUlOx) |

### Investigative Template

| Topic | Template | Depth | Report | Run URL |
|-------|----------|-------|--------|---------|
| OpenAI leadership and governance changes 2023-2024 | investigative | quick | executive_summary | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/8tj71Ew5oQpIQanRu) |
| FTX collapse timeline and key actors | investigative | standard | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/p5DnoyLhQTSxwj06P) |
| Theranos fraud investigation key findings | investigative | deep | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/813enuQtiewczhTg7) |

### Legal Template

| Topic | Template | Depth | Report | Run URL |
|-------|----------|-------|--------|---------|
| AI copyright and IP lawsuits 2024-2025 | legal | quick | executive_summary | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/W3BcpsRohNUfEKIaO) |
| GDPR enforcement actions tech companies 2024 | legal | standard | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/WHxtWBnMWl0AM1h8e) |
| SEC cryptocurrency regulations 2024-2025 | legal | deep | full_report | [View Run](https://console.apify.com/actors/mj1eRf4tmih4bqlNG/runs/Zzz9bYIKts4zsw5BF) |

---

## Real-Time Progress Tracking

Research can take 2-8 minutes depending on depth. Two methods are available to track progress:

### Method 1: Polling (PROGRESS Key)

Poll the key-value store for progress updates:

```javascript
const client = new ApifyClient({ token: 'YOUR_API_TOKEN' });

// Start the actor
const run = await client.actor('YOUR_ACTOR_ID').start({ query: '...' });

// Poll for progress
const interval = setInterval(async () => {
  const progress = await client.keyValueStore(run.defaultKeyValueStoreId)
    .getRecord('PROGRESS');

  if (progress) {
    console.log(`${progress.value.stage}: ${progress.value.percent}%`);
    console.log(`Searches: ${progress.value.searches_completed}/${progress.value.searches_total}`);

    if (progress.value.stage === 'completed' || progress.value.stage === 'failed') {
      clearInterval(interval);
    }
  }
}, 5000); // Poll every 5 seconds
```

**PROGRESS structure:**

```json
{
  "session_id": "session_abc123",
  "stage": "web_search",
  "phase": "web_search",
  "percent": 35,
  "message": "Searching [3/8]: AI coding assistant market...",
  "searches_completed": 3,
  "searches_total": 8,
  "findings_count": 12,
  "sources_count": 18,
  "elapsed_seconds": 45.2
}
```

### Method 2: Webhook Events

Provide a `progress_webhook_url` to receive real-time HTTP POST events:

```json
{
  "query": "Your research question",
  "progress_webhook_url": "https://your-server.com/webhook"
}
```

**Event types delivered to your webhook:**

| Event | When | Key Data |
|-------|------|----------|
| `research.initialized` | Actor starts | query, template, granularity |
| `research.queries_generated` | Search queries ready | queries, query_count |
| `research.search_started` | Each search begins | search_index, query |
| `research.search_completed` | Each search finishes | sources_found, search_index |
| `research.verification_completed` | Findings verified | findings_validated |
| `research.perspectives_started` | Expert analysis begins | perspective_types |
| `research.perspectives_completed` | Expert analysis done | perspectives_count, insights_count |
| `research.report_started` | Report generation begins | variant, format |
| `research.report_completed` | Report ready | report_length |
| `research.completed` | All done | findings_count, sources_count, results_url |
| `research.failed` | Error occurred | error, error_code, failed_phase |

**Webhook payload structure:**

```json
{
  "event_type": "research.search_completed",
  "event_id": "evt_abc123def456",
  "timestamp": "2025-12-28T10:30:45.123Z",
  "session_id": "session_xyz789",
  "apify_run_id": "Xgge8oXNPKK6OXZVs",
  "phase": "web_search",
  "phase_progress": 0.6,
  "overall_progress": 0.35,
  "cost_so_far": {
    "tokens_used": 15000,
    "searches_completed": 3,
    "api_cost_usd": 0.0089,
    "platform_cost_usd": 0.0012,
    "total_cost_usd": 0.0101
  },
  "data": {
    "search_index": 3,
    "total_searches": 5,
    "sources_found": 8,
    "findings_extracted": 0
  }
}
```

### Progress Phases

| Phase | Progress Range | Description |
|-------|----------------|-------------|
| initialization | 0-5% | Setting up research context |
| query_generation | 5-10% | Generating search queries |
| web_search | 10-60% | Executing searches (bulk of time) |
| verification | 60-65% | Bias detection, sanity checks |
| perspective_analysis | 65-80% | Expert perspective generation |
| report_generation | 80-95% | Creating formatted report |
| delivery | 95-100% | Finalizing and storing results |

---

## Requirements

This actor requires a **Google API key** with access to the Gemini API. Set the `GOOGLE_API_KEY` environment variable in your actor configuration.

### Optional Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | PDF processing via OCR |
| `RESEND_API_KEY` | Email delivery of research reports |

### Email Delivery Setup

To enable email delivery:

1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add `RESEND_API_KEY` to your actor's environment variables
4. Set `send_email: true` and `email_to: "your@email.com"` in your input

The email includes:
- Executive summary with key metrics
- Top findings with source URLs and dates
- Predictions with rationale, confidence, and timeline
- Expert warnings highlighted
- Full report attached as markdown file
- HTML report attached (if `report_format: "html"`)
