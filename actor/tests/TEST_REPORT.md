# Deep Research Actor - Test Report

**Generated:** 2025-12-25 13:38:08
**Total Duration:** 65.0 seconds
**Tests:** 7/7 passed (0 failed)

---

## Executive Summary

All tests passed successfully. The actor is ready for deployment.

| Service | Status | Duration | Technical Quality | Business Value |
|---------|--------|----------|-------------------|----------------|
| Gemini Client - Google Search Grounding | PASS | 3227ms | Excellent | High - Core search functionality works |
| Gemini Client - JSON Generation | PASS | 1990ms | Excellent | High - Query generation works |
| Cost Tracker Service | PASS | 0ms | Excellent | Medium - Helps with cost monitoring |
| Investigative Template - Query Generation | PASS | 2069ms | Good | High - Drives research quality |
| Financial Template - Query Generation | PASS | 1745ms | Good | High - Key for financial research product |
| Report Generation Service | PASS | 0ms | Excellent | High - Key deliverable for users |
| Full Research Flow - End-to-End | PASS | 53083ms | Excellent | Excellent - Delivers actionable research insights |

---

## Detailed Test Results

### 1. Gemini Client - Google Search Grounding

**Status:** PASSED
**Duration:** 3227ms

**Request:**
```json
{
  "api_key": "AIzaSyASD2...",
  "model": "gemini-2.0-flash",
  "query": "What is Apple's current stock price and market cap?",
  "mode": "GROUNDED"
}
```

**Response:**
```json
{
  "text_length": 212,
  "text_preview": "As of December 24 or 25, 2025, here's the information on Apple's (AAPL) stock:\n\n*   **Stock Price:** Around \\$272.13 to \\$274.61.\n*   **Market Capitalization:** Approximately \\$4.024 trillion to \\$4.063 trillion.",
  "sources_count": 5,
  "sources": [
    {
      "url": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQE6qkN1l5FsJ0KgGhZc8vdMqyKdZgr1Bt-YatvH94WLS8PUa8xfkLHwwOrZQ-ErqpzS8XX0Lblbtk8kNnrKhtLj-js_phIyriOuSZsc77nDWWxcXEKrhIXgqT1EHqVWGmVfSGI=",
      "title": "robinhood.com"
    },
    {
      "url": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHDKuBvdmMPwWl77g1yY3lsgLTaVk9evMFOLLfxtxdhT9NRWtw6G3qDi3n4yPqCc-hIuSUIoT0K-KrmM0AdruG0K0TU0J93z2hxWrUFwqOwp8-_EC6vzEdRExvZ6X8=",
      "title": "etoro.com"
    },
    {
      "url": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHU53XM_oGgzcKsOPhz06ixPZ5iDQXzfTqM8NOSGHZfTqRLlFtIWtPrmZTDcsJnT33X2kP3swe-o9uNZHW-ENCpzJiy6lPhi8qeHrTLKwK7hHtdI7lfPcFZ-CPghaAS729CwTn893bVMipO",
      "title": "companiesmarketcap.com"
    },
    {
      "url": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHwkCobivYkNqgO8K_kba-Tl4CEGqTpsXnLSFWEHAW8mk_kwzCWPTJcCu1HqX0hy_hE8vC7tmWdc_AUoK2VwvCoJ7HvoMb143XeRimpSL7TlD-boKRbT6YQ1gbzThjit7u4ePZ_zo1aXGbpAaNUX1fDBZ7gMqiq3EPsbA==",
      "title": "macrotrends.net"
    },
    {
      "url": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEerW0iFtcA1GUAhoPmiJCR1VzzKtmo3ffVK9CmY6EjQ2XMBOXUfysAYIdkmzvmREyDB1Dc6Qr1XxTQfYym2UQeAt31MY2b68uX4dTDDuf5sSZjzjVUTT3bEc_kIwcmQam30SMXKgOzMTEVvqQ=",
      "title": "stockanalysis.com"
    }
  ],
  "search_queries": [
    "Apple stock price",
    "Apple market cap"
  ],
  "token_usage": {
    "input_tokens": 12,
    "output_tokens": 80,
    "total_tokens": 92
  },
  "cost_usd": 2.4900000000000002e-05
}
```

**Notes:**
- Retrieved 5 sources
- Response is 212 characters
- Token usage: 92

**Technical Quality:** Excellent

**Business Value:** High - Core search functionality works

---

### 2. Gemini Client - JSON Generation

**Status:** PASSED
**Duration:** 1990ms

**Request:**
```json
{
  "prompt": "Generate 3 search queries to research Apple's financial performance.\nReturn as JSON array: [\"query1\", \"query2\", \"query3\"]",
  "temperature": 0.3
}
```

**Response:**
```json
{
  "parsed_json": [
    "Apple financial statements SEC filings",
    "Apple revenue by product category 2023",
    "Apple profit margin trends past 5 years"
  ],
  "raw_text": "[\n  \"Apple financial statements SEC filings\",\n  \"Apple revenue by product category 2023\",\n  \"Apple profit margin trends past 5 years\"\n]",
  "parse_error": null
}
```

**Notes:**
- Successfully parsed JSON
- Generated 3 queries

**Technical Quality:** Excellent

**Business Value:** High - Query generation works

---

### 3. Cost Tracker Service

**Status:** PASSED
**Duration:** 0ms

**Request:**
```json
{
  "gemini_input_tokens": 1000,
  "gemini_output_tokens": 500,
  "openrouter_tokens": 200
}
```

**Response:**
```json
{
  "total_tokens": 1700,
  "input_tokens": 1000,
  "output_tokens": 500,
  "gemini_cost_usd": 0.000225,
  "openrouter_cost_usd": 0.0001,
  "total_cost_usd": 0.000325
}
```

**Notes:**
- Calculated total cost: $0.000325
- Cost rates applied correctly

**Technical Quality:** Excellent

**Business Value:** Medium - Helps with cost monitoring

---

### 4. Investigative Template - Query Generation

**Status:** PASSED
**Duration:** 2069ms

**Request:**
```json
{
  "query": "Elon Musk Twitter acquisition controversy",
  "max_searches": 5,
  "granularity": "standard"
}
```

**Response:**
```json
{
  "queries_generated": 5,
  "queries": [
    "Elon Musk Twitter acquisition timeline of events",
    "Elon Musk Twitter deal financing sources and investors",
    "Twitter shareholder lawsuits Elon Musk acquisition",
    "Elon Musk Twitter acquisition SEC filings",
    "Elon Musk Twitter acquisition motivations and controversies"
  ]
}
```

**Notes:**
- Generated 5 investigative queries
- Queries cover multiple investigative angles

**Technical Quality:** Good

**Business Value:** High - Drives research quality

---

### 5. Financial Template - Query Generation

**Status:** PASSED
**Duration:** 1745ms

**Request:**
```json
{
  "query": "NVIDIA stock analysis Q4 2024",
  "max_searches": 5,
  "granularity": "standard"
}
```

**Response:**
```json
{
  "queries_generated": 5,
  "queries": [
    "NVIDIA Q4 2024 earnings call transcript",
    "NVIDIA analyst ratings price targets Q4 2024",
    "NVIDIA Q4 2024 revenue EPS guidance",
    "NVIDIA SEC filings 10-Q Q4 2024",
    "NVIDIA institutional ownership Q4 2024"
  ]
}
```

**Notes:**
- Generated 5 financial queries
- Queries have financial focus

**Technical Quality:** Good

**Business Value:** High - Key for financial research product

---

### 6. Report Generation Service

**Status:** PASSED
**Duration:** 0ms

**Request:**
```json
{
  "research_result": "mock research with 2 findings, 1 perspective",
  "variant": "full_report"
}
```

**Response:**
```json
{
  "markdown_length": 1033,
  "html_length": 3190,
  "markdown_preview": "# Research Report: Test research query\n\n**Research Query:** Test research query\n**Template:** Investigative Research\n**Generated:** December 25, 2025 at 13:37\n**Status:** Completed\n\n---\n\n## Executive Summary\n\nThis research identified **2** key findings across multiple categories.\n**2** findings have high confidence (>70%).\n\n- **[FACT]** Key finding summary\n- **[EVENT]** Event summary\n\n---\n\n## Detailed Findings\n\n### Fact (1)\n\n#### Key finding summary\n\nTest finding content with important details.\n\n*Confidence: High (85%)*\n\n### Event (1)\n\n#### Event summary\n\nAn important event occurred.\n\n*Confidence: Medium (72%)*\n\n---\n\n## Multi-Perspective Analysis\n\n### Political Perspective\n\nPolitical analysis content.\n\n**Key Insights:**\n- Insight 1\n- Insight 2\n\n**Recommendations:**\n- Recommendation 1\n\n**Warnings:**\n- Warning 1\n\n---\n\n## Sources\n\n- [Example](https://example.com) - Credibility: 80%\n\n---\n\n## Research Metadata\n\n- **Session ID:** test-123\n- **Execution Time:** 30.5 seconds\n- **Total Tokens:*",
  "has_findings_section": true,
  "has_perspectives_section": true,
  "has_sources_section": true
}
```

**Notes:**
- Generated 1033 chars markdown
- Generated 3190 chars HTML
- All required sections present

**Technical Quality:** Excellent

**Business Value:** High - Key deliverable for users

---

### 7. Full Research Flow - End-to-End

**Status:** PASSED
**Duration:** 53083ms

**Request:**
```json
{
  "query": "What were the key developments in AI regulation in 2024?",
  "template": "investigative",
  "granularity": "quick",
  "max_searches": 3,
  "generate_report": true
}
```

**Response:**
```json
{
  "session_id": "dc3782b2-43d3-4f61-8d5e-4e528b94746f",
  "status": "completed",
  "findings_count": 19,
  "perspectives_count": 4,
  "sources_count": 22,
  "queries_executed": [
    "AI regulation 2024 timeline",
    "AI regulation 2024 key actors",
    "AI regulation 2024 jurisdictions"
  ],
  "cost_summary": {
    "total_tokens": 1870,
    "input_tokens": 25,
    "output_tokens": 1845,
    "gemini_cost_usd": 0.000555,
    "openrouter_cost_usd": 0.0,
    "total_cost_usd": 0.000555
  },
  "execution_time": 52.33,
  "errors": [],
  "warnings": [],
  "report_preview": "# Research Report: What were the key developments in AI regulation in\n\n**Research Query:** What were the key developments in AI regulation in 2024?\n**Template:** Investigative Research\n**Generated:** December 25, 2025 at 13:38\n**Status:** Completed\n\n---\n\n## Executive Summary\n\nThis research identified **19** key findings across multiple categories.\n**19** findings have high confidence (>70%).\n\n- **[EVENT]** The Internal Market and Civil Liberties Committees approved the AI Act on February 13, 2024.\n- **[EVENT]** The European Artificial Intelligence Office was launched on February 21, 2024, to support the AI Act's implementation.\n- **[EVENT]** The European Council formally adopted the EU AI Act on May 21, 2024.\n- **[EVENT]** The AI Act was published in the Official Journal of the European Union on July 12, 2024.\n- **[EVENT]** The AI Act entered into force on August 1, 2024.\n\n---\n\n## Detailed Findings\n\n### Event (9)\n\n#### The Internal Market and Civil Liberties Committees approved the AI ",
  "sample_findings": [
    {
      "type": "event",
      "summary": "The Internal Market and Civil Liberties Committees approved the AI Act on February 13, 2024.",
      "confidence": 0.9
    },
    {
      "type": "event",
      "summary": "The European Artificial Intelligence Office was launched on February 21, 2024, to support the AI Act",
      "confidence": 0.9
    },
    {
      "type": "event",
      "summary": "The European Council formally adopted the EU AI Act on May 21, 2024.",
      "confidence": 0.9
    }
  ]
}
```

**Notes:**
- Executed 3 searches
- Extracted 19 findings
- Collected 22 sources
- Generated 4 perspective analyses
- Total cost: $0.0006
- Duration: 52.3s

**Technical Quality:** Excellent

**Business Value:** Excellent - Delivers actionable research insights

---

## Deployment Recommendation

**READY FOR DEPLOYMENT**

All services are functioning correctly. The actor can be deployed to Apify.

---

*Report generated by Deep Research Actor Test Suite*