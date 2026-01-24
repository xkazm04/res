# Deep Research Actor - Usage Guide

This guide explains how to use the Deep Research Actor on Apify for AI-powered research with multiple templates and expert perspectives.

**Actor URL**: https://console.apify.com/actors/mj1eRf4tmih4bqlNG

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Request Configuration](#request-configuration)
3. [Templates](#templates)
4. [Report Formats](#report-formats)
5. [Email Delivery](#email-delivery)
6. [Real-Time Progress](#real-time-progress)
7. [Caching](#caching)
8. [Response Structure](#response-structure)
9. [API Examples](#api-examples)
10. [Cost Estimation](#cost-estimation)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimal Request

```json
{
  "query": "What are the latest developments in AI coding assistants?"
}
```

This uses default settings: `tech_market` template, `standard` granularity, full report in markdown.

### Full-Featured Request

```json
{
  "query": "AI coding assistants market 2025 adoption GitHub Copilot vs Cursor enterprise comparison",
  "template": "tech_market",
  "granularity": "deep",
  "generate_report": true,
  "report_variant": "full_report",
  "report_format": "html",
  "send_email": true,
  "email_to": "your@email.com"
}
```

---

## Request Configuration

### Core Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | **required** | The research question or topic to investigate |
| `template` | string | `"tech_market"` | Research template type (see [Templates](#templates)) |
| `granularity` | string | `"standard"` | Research depth: `quick`, `standard`, `deep` |

### Granularity Levels

| Level | Searches | Time | Findings | Use Case |
|-------|----------|------|----------|----------|
| `quick` | 3-5 | 1-2 min | 8-15 | Fast overview, news monitoring |
| `standard` | 5-8 | 2-4 min | 15-25 | General research, reports |
| `deep` | 10-15 | 5-8 min | 25-50 | Investment decisions, comprehensive analysis |

### Report Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `generate_report` | boolean | `true` | Generate formatted report |
| `report_variant` | string | `"full_report"` | Report style (see below) |
| `report_format` | string | `"markdown"` | Output format (see [Report Formats](#report-formats)) |
| `report_title` | string | auto | Custom title for the report |

**Report Variants:**
- `executive_summary` - Key points for leadership (1-2 pages)
- `full_report` - Comprehensive analysis with all findings
- `investment_thesis` - Financial-focused with recommendations

### Context Input (Optional)

| Parameter | Type | Description |
|-----------|------|-------------|
| `input_file_url` | string | URL to PDF/text file for additional context |
| `input_text` | string | Direct text to include as research context |

### Expert Perspectives Override

| Parameter | Type | Description |
|-----------|------|-------------|
| `perspectives` | array | Override default template perspectives |

Example:
```json
{
  "query": "...",
  "perspectives": ["venture_capitalist", "senior_engineer", "legal_liability"]
}
```

### Advanced Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `use_cache` | boolean | `true` | Return cached results for identical queries |
| `extend_cache` | boolean | `true` | Extend cached results with new research |
| `use_cloud_run` | boolean | `true` | Use Cloud Run backend (95%+ cost savings) |
| `export_options` | object | `{}` | Format-specific options (branding, colors) |

---

## Templates

### 1. Tech Market (`tech_market`) - Default

**Purpose**: Technology market trends, developer tools, and predictions

**Best for**:
- AI/ML infrastructure and tooling
- Developer productivity trends
- 2025 current state and 2026 predictions
- Enterprise adoption patterns

**Expert Perspectives**: Venture Capitalist, Startup Founder, Product Manager, Developer Advocate, Open Source Maintainer, DevRel Engineer, Senior Engineer, Platform Engineer

**Finding Types**: `product_launch`, `funding_round`, `adoption_trend`, `market_metric`, `acquisition`, `prediction`, `developer_sentiment`, `open_source_event`, `enterprise_adoption`, `gap`

```json
{
  "query": "AI coding assistants market 2025 GitHub Copilot vs Cursor enterprise adoption",
  "template": "tech_market",
  "granularity": "deep"
}
```

### 2. Financial (`financial`)

**Purpose**: Investment analysis, earnings, and stock research

**Best for**:
- Earnings analysis and guidance
- Stock valuation and price targets
- Risk assessment
- SEC filings review

**Expert Perspectives**: Institutional Investor, Short Seller, Quantitative Risk Analyst, Activist Investor, Macro Strategist

**Finding Types**: `earnings_metric`, `valuation_signal`, `risk_factor`, `guidance`, `analyst_rating`, `competitive_position`, `management_commentary`

```json
{
  "query": "NVIDIA Q4 2025 earnings analysis data center AI chips outlook",
  "template": "financial",
  "report_variant": "investment_thesis"
}
```

### 3. Competitive Intelligence (`competitive`)

**Purpose**: Market analysis and competitor research

**Best for**:
- Competitor profiling
- Market sizing and share
- Strategic positioning
- SWOT analysis

**Expert Perspectives**: Strategy Consultant, Industry Insider, Institutional Investor, Short Seller

```json
{
  "query": "Compare Stripe vs Square vs Adyen payment processing market 2025",
  "template": "competitive",
  "granularity": "deep"
}
```

### 4. Investigative (`investigative`)

**Purpose**: Due diligence, background checks, and evidence gathering

**Best for**:
- Company/individual background research
- Relationship and network mapping
- Timeline reconstruction
- Red flag identification

**Expert Perspectives**: Forensic Financial Analyst, Power Network Analyst, Behavioral Psychologist, Legal Liability Expert, Geopolitical Strategist

**Finding Types**: `actor`, `relationship`, `financial_flow`, `timeline_event`, `red_flag`, `legal_exposure`, `gap`

```json
{
  "query": "FTX collapse investigation key actors Sam Bankman-Fried fraud timeline",
  "template": "investigative"
}
```

### 5. Legal (`legal`)

**Purpose**: Legal research and regulatory analysis

**Best for**:
- Case law research
- Regulatory compliance
- Enforcement actions
- Litigation history

**Expert Perspectives**: Litigation Strategist, Regulatory Expert, Legal Liability Analyst, Forensic Financial Analyst

```json
{
  "query": "EU AI Act enforcement mechanisms company compliance requirements 2025",
  "template": "legal"
}
```

### 6. Contract (`contract`)

**Purpose**: Government contract analysis and procurement investigation

**Best for**:
- Contract pricing analysis
- Bid process evaluation
- Corruption/fraud detection
- GSA schedule benchmarking

**Expert Perspectives**: Contract Auditor, Procurement Investigator, Forensic Accountant, Regulatory Compliance, Industry Benchmarker

**Finding Types**: `contract_entity`, `pricing_analysis`, `bid_process`, `suspicious_element`, `connected_entity`, `red_flag`, `compliance_issue`, `comparable_contract`

```json
{
  "query": "DoD IT modernization contracts 2024 pricing analysis CACI Leidos comparison",
  "template": "contract",
  "granularity": "deep"
}
```

---

## Report Formats

The actor supports multiple output formats:

| Format | Description | Use Case |
|--------|-------------|----------|
| `markdown` | Plain text with formatting | Default, technical docs |
| `html` | Rich interactive dashboard | Email delivery, presentations |
| `pdf` | Print-ready with branding | Executive distribution |
| `docx` | Microsoft Word structure | Stakeholder reports |
| `json_ld` | Structured data with schema.org | SEO, knowledge graphs |
| `obsidian` | Wiki-linked markdown | Knowledge management |
| `slack` | Block Kit message format | Team sharing |

### HTML Report Features

The HTML format includes interactive visualizations:
- **Dashboard layout** with fixed header and sidebar navigation
- **Network visualizations** for relationship mapping (investigative)
- **Timeline views** for event chronology
- **Money flow diagrams** for financial transactions
- **Feature comparison matrices** (tech_market, competitive)
- **Confidence progress bars** with color coding
- **Collapsible evidence drawers** for detailed sources
- **Stat cards** with key metrics

### Export Options

Customize reports with branding:

```json
{
  "export_options": {
    "company_name": "Your Company",
    "primary_color": "#1e293b",
    "accent_color": "#3b82f6",
    "logo_url": "https://example.com/logo.png"
  }
}
```

---

## Email Delivery

### Configuration

```json
{
  "send_email": true,
  "email_to": "recipient@company.com",
  "email_subject": "Research: AI Market Analysis 2025"
}
```

### Email Content

The email includes:
- Executive summary with key metrics
- Top 5 findings with source URLs
- Expert predictions with confidence levels
- Warnings and risk factors highlighted
- Full report attached (markdown + HTML)

### Important: Email Deliverability

> **Note**: Email delivery uses [Resend](https://resend.com). Some email providers (especially regional providers outside major services like Gmail, Outlook, Yahoo) may block or filter emails until domains are whitelisted.

**Recommended Approaches:**

1. **Use major email providers** - Gmail, Outlook, Yahoo have best deliverability
2. **Check spam/junk folders** - First emails may be filtered
3. **Whitelist sender** - Add `noreply@resend.dev` to your contacts
4. **Alternative: Download from Apify** - Reports are always available in the Key-Value Store:
   - `REPORT.md` - Markdown report
   - `REPORT.html` - HTML report

**For Enterprise Deployments:**

If you need reliable email delivery to a specific domain:
1. Contact your IT team to whitelist Resend's sending IPs
2. Consider setting up your own Resend account with verified domain
3. Use the `progress_webhook_url` to trigger your own email system

### Environment Variable

Requires `RESEND_API_KEY` environment variable configured in the actor settings.

---

## Real-Time Progress

### Method 1: Webhook Events

Provide a `progress_webhook_url` to receive real-time HTTP POST events:

```json
{
  "query": "...",
  "progress_webhook_url": "https://your-server.com/webhook"
}
```

**Event Types:**

| Event | When | Key Data |
|-------|------|----------|
| `research.initialized` | Actor starts | query, template, granularity |
| `research.queries_generated` | Search queries ready | queries, query_count |
| `research.search_started` | Each search begins | search_index, query |
| `research.search_completed` | Each search finishes | sources_found, findings |
| `research.verification_completed` | Findings verified | findings_validated |
| `research.perspectives_started` | Expert analysis begins | perspective_types |
| `research.perspectives_completed` | Expert analysis done | perspectives_count |
| `research.report_started` | Report generation begins | variant, format |
| `research.report_completed` | Report ready | report_length |
| `research.completed` | All done | findings_count, results_url |
| `research.failed` | Error occurred | error, error_code |

**Webhook Payload:**

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
    "api_cost_usd": 0.0089,
    "total_cost_usd": 0.0101
  },
  "data": {
    "search_index": 3,
    "total_searches": 5,
    "sources_found": 8
  }
}
```

### Method 2: Polling PROGRESS Key

Poll the key-value store for progress updates:

```javascript
const progress = await client.keyValueStore(run.defaultKeyValueStoreId)
  .getRecord('PROGRESS');

console.log(`${progress.value.phase}: ${progress.value.percent}%`);
```

---

## Caching

### How Caching Works

- Queries are normalized (lowercase, whitespace-trimmed) and hashed
- Cache key includes: query + template + granularity
- Identical queries return instant cached results (~1-2 seconds)
- Cache TTL: 24 hours (configurable)

### Cache Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `use_cache` | boolean | `true` | Check for and return cached results |
| `extend_cache` | boolean | `true` | Run background research to extend cached findings |

### When to Disable Cache

```json
{
  "use_cache": false
}
```

Use `use_cache: false` when:
- You need the absolute latest data
- Research topic changes rapidly (breaking news)
- Previous results were incomplete

---

## Response Structure

### Key-Value Store: `OUTPUT`

Complete research results with all findings, perspectives, and sources.

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "Your research query",
  "template": "tech_market",
  "status": "completed",
  "findings": [...],
  "perspectives": [...],
  "sources": [...],
  "search_queries_executed": [...],
  "report_markdown": "# Research Report\n...",
  "report_html": "<html>...</html>",
  "cost_summary": {
    "total_tokens": 45000,
    "total_cost_usd": 0.0234
  },
  "execution_time_seconds": 67.3,
  "cache_hit": false,
  "cache_extended": false
}
```

### Key-Value Store: `EXECUTIVE_SUMMARY`

Condensed summary for quick consumption:

```json
{
  "session_id": "...",
  "query": "...",
  "status": "completed",
  "findings_count": 18,
  "high_confidence_findings": 12,
  "sources_count": 25,
  "high_credibility_sources": 18,
  "perspectives_count": 8,
  "top_findings": ["Finding 1...", "Finding 2..."],
  "expert_recommendations": ["Recommendation 1..."],
  "expert_warnings": ["Warning 1..."],
  "key_insights": ["Insight 1..."],
  "total_cost_usd": 0.0234,
  "execution_time_seconds": 67.3
}
```

### Dataset: Multi-Record Output

Filter by `record_type`:

| Record Type | Count | Description |
|-------------|-------|-------------|
| `summary` | 1 | Overview with totals and metrics |
| `finding` | N | Individual research findings |
| `perspective` | N | Expert analysis from each perspective |
| `source` | N | Sources with credibility scores |
| `metrics` | 1 | Cost and performance metrics |

### Report Files

- `REPORT.md` - Markdown formatted report
- `REPORT.html` - HTML report (if `report_format: "html"`)

---

## API Examples

### cURL

```bash
curl -X POST "https://api.apify.com/v2/acts/YOUR_ACTOR_ID/runs?token=YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI coding assistants enterprise adoption 2025",
    "template": "tech_market",
    "granularity": "standard",
    "generate_report": true,
    "report_format": "html"
  }'
```

### JavaScript SDK

```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'YOUR_API_TOKEN' });

const run = await client.actor('YOUR_ACTOR_ID').call({
  query: 'AI coding assistants enterprise adoption 2025',
  template: 'tech_market',
  granularity: 'deep',
  generate_report: true,
  report_format: 'html'
});

// Get findings from dataset
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(`Found ${items.length} records`);

// Filter to findings only
const findings = items.filter(item => item.record_type === 'finding');
console.log(`${findings.length} findings extracted`);

// Get full output with report
const output = await client.keyValueStore(run.defaultKeyValueStoreId)
  .getRecord('OUTPUT');
console.log(output.value.report_markdown);
```

### Python SDK

```python
from apify_client import ApifyClient

client = ApifyClient('YOUR_API_TOKEN')

run = client.actor('YOUR_ACTOR_ID').call(run_input={
    'query': 'AI coding assistants enterprise adoption 2025',
    'template': 'tech_market',
    'granularity': 'standard',
    'generate_report': True,
    'report_format': 'html',
    'send_email': True,
    'email_to': 'your@email.com'
})

# Get findings from dataset
for item in client.dataset(run['defaultDatasetId']).iterate_items():
    if item.get('record_type') == 'finding':
        print(f"[{item['finding_type']}] {item['summary']}")

# Get cost and report
output = client.key_value_store(run['defaultKeyValueStoreId']).get_record('OUTPUT')
print(f"Total cost: ${output['value']['cost_summary']['total_cost_usd']:.4f}")
print(f"Report length: {len(output['value'].get('report_markdown', ''))} chars")
```

---

## Cost Estimation

### Gemini API Pricing

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Gemini 2.0 Flash | $0.075 | $0.30 |

### Typical Research Costs

| Granularity | Searches | Tokens | API Cost | Platform | Total |
|-------------|----------|--------|----------|----------|-------|
| Quick | 3-5 | 15-30K | $0.01-0.02 | ~$0.05 | ~$0.06-0.07 |
| Standard | 5-8 | 30-60K | $0.02-0.04 | ~$0.10 | ~$0.12-0.14 |
| Deep | 10-15 | 60-120K | $0.04-0.08 | ~$0.18 | ~$0.22-0.26 |

*Costs vary based on query complexity and source content length.*

### Cloud Run Cost Optimization

With `use_cloud_run: true` (default), research runs on Cloud Run instead of Apify compute, reducing platform costs by 95%+. API costs remain the same.

---

## Best Practices

### Query Formulation

**Good queries are specific and bounded:**
```
"What is GitHub Copilot's enterprise adoption rate and productivity impact
in Fortune 500 companies as of 2025?"
```

**Avoid vague queries:**
```
"Tell me about AI" (too broad, will produce generic results)
```

### Template Selection

| If researching... | Use template |
|-------------------|--------------|
| Tech trends, developer tools, predictions | `tech_market` |
| Stock analysis, earnings, financials | `financial` |
| Market comparison, competitors | `competitive` |
| Company background, controversies | `investigative` |
| Regulations, lawsuits, compliance | `legal` |
| Government contracts, procurement | `contract` |

### Granularity Selection

- **Quick**: News monitoring, simple fact-checking, time-sensitive queries
- **Standard**: General research, blog posts, reports (recommended default)
- **Deep**: Investment decisions, strategic planning, comprehensive analysis

### Report Formats by Use Case

| Use Case | Recommended Format |
|----------|-------------------|
| Email delivery | `html` |
| Documentation | `markdown` |
| Executive sharing | `pdf` or `docx` |
| Knowledge base | `obsidian` |
| Team notifications | `slack` |

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Google API key is required" | Missing API key | Set `GOOGLE_API_KEY` in actor environment |
| "Research execution failed" | API quota exceeded | Wait and retry, or check API limits |
| Empty findings | Query too narrow | Broaden query or reduce granularity |
| Email not received | Provider blocking | Check spam, use Gmail/Outlook, or download from Apify |
| Timeout | Query too complex | Reduce granularity or simplify query |

### Debugging

1. **Check actor logs** in Apify Console for detailed error messages
2. **Review PROGRESS key** for last successful phase
3. **Examine OUTPUT** even on partial failure - may have partial results

### Getting Help

- **Apify Console**: View actor run logs and outputs
- **Apify Documentation**: https://docs.apify.com
- **Bug Reports**: Open an issue in the repository

---

## Changelog

- **v1.2** - Added interactive HTML visualizations, email delivery, 7 export formats
- **v1.1** - Added contract template, caching, progress webhooks
- **v1.0** - Initial release with 5 templates
