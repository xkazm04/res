# Deep Research Actor - Implementation Reference

> **Purpose**: This document serves as an implementation reference for building a long-running (~15 min) deep research Actor on the Apify platform. It covers async patterns, storage strategies, and code examples.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Input Schema](#input-schema)
4. [Output Schema](#output-schema)
5. [Storage Strategy](#storage-strategy)
6. [Async Flow Implementation](#async-flow-implementation)
7. [State Persistence & Migration Handling](#state-persistence--migration-handling)
8. [Webhook Integration](#webhook-integration)
9. [Pricing Configuration (Pay-Per-Event)](#pricing-configuration-pay-per-event)
10. [Error Handling](#error-handling)
11. [Complete Code Template](#complete-code-template)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEEP RESEARCH ACTOR FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  USER REQUEST                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Input: { query, depth, webhookUrl?, notificationEmail? }        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  IMMEDIATE RESPONSE (< 5 seconds)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ OUTPUT key in KV Store:                                         │   │
│  │ {                                                               │   │
│  │   status: "processing",                                         │   │
│  │   runId: "abc123",                                              │   │
│  │   reportUrl: "https://api.apify.com/v2/key-value-stores/...",   │   │
│  │   datasetUrl: "https://api.apify.com/v2/datasets/...",          │   │
│  │   consoleUrl: "https://console.apify.com/actors/runs/..."       │   │
│  │ }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  RESEARCH PHASE (~15 minutes)                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. Web search (Google, Bing, etc.)                              │   │
│  │ 2. Content extraction (Website Content Crawler pattern)         │   │
│  │ 3. LLM synthesis (OpenAI, Anthropic, etc.)                      │   │
│  │ 4. Iterative refinement loop                                    │   │
│  │                                                                 │   │
│  │ During this phase:                                              │   │
│  │ - Push findings to Dataset (structured)                         │   │
│  │ - Update PROGRESS key in KV Store                               │   │
│  │ - Save STATE for migration recovery                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  COMPLETION                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. Generate final HTML/Markdown report                          │   │
│  │ 2. Save to REPORT.html in KV Store                              │   │
│  │ 3. Update OUTPUT with status: "completed"                       │   │
│  │ 4. Webhook fires (if configured)                                │   │
│  │ 5. Email sent (if configured)                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
deep-research-actor/
├── .actor/
│   ├── actor.json              # Actor configuration
│   ├── input_schema.json       # Input schema definition
│   └── output_schema.json      # Output schema definition (optional)
├── src/
│   ├── __init__.py
│   ├── main.py                 # Entry point
│   ├── research/
│   │   ├── __init__.py
│   │   ├── searcher.py         # Web search logic
│   │   ├── crawler.py          # Content extraction
│   │   └── synthesizer.py      # LLM synthesis
│   ├── storage/
│   │   ├── __init__.py
│   │   └── manager.py          # Storage operations
│   ├── notifications/
│   │   ├── __init__.py
│   │   └── notifier.py         # Webhook/email handling
│   └── utils/
│       ├── __init__.py
│       └── report_generator.py # HTML/Markdown report generation
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## Input Schema

Create `.actor/input_schema.json`:

```json
{
    "title": "Deep Research Agent Input",
    "description": "Configure your research query and delivery preferences",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
        "query": {
            "title": "Research Query",
            "type": "string",
            "description": "The topic, question, or subject you want to research in depth",
            "editor": "textarea",
            "prefill": "What are the latest developments in quantum computing?"
        },
        "depth": {
            "title": "Research Depth",
            "type": "string",
            "description": "How thorough should the research be?",
            "enum": ["quick", "standard", "deep"],
            "enumTitles": ["Quick (~5 min)", "Standard (~10 min)", "Deep (~20 min)"],
            "default": "standard"
        },
        "maxSources": {
            "title": "Maximum Sources",
            "type": "integer",
            "description": "Maximum number of sources to analyze",
            "default": 20,
            "minimum": 5,
            "maximum": 100
        },
        "outputFormat": {
            "title": "Report Format",
            "type": "string",
            "description": "Format for the final report",
            "enum": ["html", "markdown", "json"],
            "enumTitles": ["HTML (Rich formatting)", "Markdown (Plain text)", "JSON (Structured data)"],
            "default": "html"
        },
        "webhookUrl": {
            "title": "Webhook URL",
            "type": "string",
            "description": "Optional: URL to receive POST notification when research completes",
            "editor": "textfield",
            "pattern": "^https?://.+",
            "nullable": true
        },
        "notificationEmail": {
            "title": "Notification Email",
            "type": "string",
            "description": "Optional: Email address to notify when research completes",
            "editor": "textfield",
            "pattern": "^[^@]+@[^@]+\\.[^@]+$",
            "nullable": true
        },
        "proxyConfiguration": {
            "title": "Proxy Configuration",
            "type": "object",
            "description": "Proxy settings for web requests",
            "editor": "proxy",
            "prefill": {
                "useApifyProxy": true
            }
        }
    },
    "required": ["query"]
}
```

---

## Output Schema

Create `.actor/output_schema.json`:

```json
{
    "actorOutputSchemaVersion": 1,
    "title": "Deep Research Output",
    "description": "Research results and report links",
    "properties": {
        "report": {
            "title": "Research Report",
            "type": "string",
            "description": "Link to the generated report",
            "template": "{{links.keyValueStoreRecordUrl}}/REPORT.html"
        },
        "findings": {
            "title": "Structured Findings",
            "type": "string",
            "description": "Link to structured research findings",
            "template": "{{links.apiDefaultDatasetUrl}}/items"
        }
    }
}
```

---

## Storage Strategy

### Storage Allocation

| Data | Storage Type | Key/Location | Retention | Purpose |
|------|--------------|--------------|-----------|---------|
| Actor input | Default KV Store | `INPUT` | Auto | Standard Apify convention |
| Final output metadata | Default KV Store | `OUTPUT` | 7 days | Links and status for API consumers |
| HTML/MD Report | Default KV Store | `REPORT.html` or `REPORT.md` | 7 days | Human-readable final report |
| Progress updates | Default KV Store | `PROGRESS` | 7 days | Real-time progress for polling |
| Migration state | Default KV Store | `STATE` | 7 days | Recovery after server migration |
| Structured findings | Default Dataset | Rows | 7 days | Exportable CSV/JSON data |

### For Long-Term Persistence (Optional)

If users need reports persisted beyond 7 days, use **named storage**:

```python
# Named store - persists indefinitely
store = await Actor.open_key_value_store(name='research-reports-archive')
```

---

## Async Flow Implementation

### Key Principle

**Never make the client wait for long operations.** Return URLs immediately, populate them asynchronously.

### Public URL Pattern

```python
from apify import Actor
from datetime import datetime
import os

async def get_storage_urls():
    """Generate all public URLs at the start of the run."""
    
    store = await Actor.open_key_value_store()
    dataset = await Actor.open_dataset()
    
    run_id = os.environ.get('APIFY_ACTOR_RUN_ID', 'local-run')
    
    return {
        'report_url': await store.get_public_url('REPORT.html'),
        'progress_url': await store.get_public_url('PROGRESS'),
        'dataset_url': f'https://api.apify.com/v2/datasets/{dataset._id}/items',
        'console_url': f'https://console.apify.com/actors/runs/{run_id}',
        'run_id': run_id
    }
```

### Immediate Response Pattern

```python
async def send_immediate_response(urls: dict, query: str):
    """Send response to client immediately after Actor starts."""
    
    await Actor.set_value('OUTPUT', {
        'status': 'processing',
        'query': query,
        'startedAt': datetime.now().isoformat(),
        'estimatedCompletion': '~15 minutes',
        'reportUrl': urls['report_url'],
        'progressUrl': urls['progress_url'],
        'datasetUrl': urls['dataset_url'],
        'consoleUrl': urls['console_url'],
        'runId': urls['run_id']
    })
    
    Actor.log.info(f"Report will be available at: {urls['report_url']}")
```

### Progress Updates Pattern

```python
async def update_progress(stage: str, percent: int, message: str):
    """Update progress for polling clients."""
    
    store = await Actor.open_key_value_store()
    
    await store.set_value('PROGRESS', {
        'stage': stage,
        'percent': percent,
        'message': message,
        'updatedAt': datetime.now().isoformat()
    })
    
    # Also update Actor status message (visible in Console)
    await Actor.set_status_message(f'{stage}: {message} ({percent}%)')
```

---

## State Persistence & Migration Handling

### Why This Matters

Apify may migrate your Actor to a different server during long runs. When this happens:
- In-memory variables are lost
- Default storages (Dataset, KV Store, Request Queue) are preserved
- You have a few seconds to save state when notified

### Migration Handler

```python
from apify import Actor, Event
from dataclasses import dataclass, asdict
from typing import List, Optional
import json

@dataclass
class ResearchState:
    """Serializable research state for migration recovery."""
    current_phase: str
    sources_processed: int
    total_sources: int
    findings: List[dict]
    search_queries_completed: List[str]
    last_checkpoint: str
    
    def to_dict(self):
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ResearchState':
        return cls(**data) if data else cls(
            current_phase='init',
            sources_processed=0,
            total_sources=0,
            findings=[],
            search_queries_completed=[],
            last_checkpoint=''
        )


class StateManager:
    """Manages state persistence and recovery."""
    
    def __init__(self):
        self.state: Optional[ResearchState] = None
        self._setup_migration_handler()
    
    def _setup_migration_handler(self):
        """Register handler for migration events."""
        Actor.on(Event.MIGRATING, self._on_migrating)
        Actor.on(Event.ABORTING, self._on_migrating)
    
    async def _on_migrating(self, event_data):
        """Called when Actor is about to be migrated or aborted."""
        Actor.log.warning('Migration/abort event received, saving state...')
        await self.save_state()
    
    async def save_state(self):
        """Persist current state to KV store."""
        if self.state:
            await Actor.set_value('STATE', self.state.to_dict())
            Actor.log.info(f'State saved at phase: {self.state.current_phase}')
    
    async def load_state(self) -> ResearchState:
        """Load state from KV store (for recovery after migration)."""
        saved_state = await Actor.get_value('STATE')
        self.state = ResearchState.from_dict(saved_state)
        
        if saved_state:
            Actor.log.info(f'Recovered state from phase: {self.state.current_phase}')
        else:
            Actor.log.info('No previous state found, starting fresh')
        
        return self.state
    
    async def update_state(self, **kwargs):
        """Update state and optionally checkpoint."""
        for key, value in kwargs.items():
            if hasattr(self.state, key):
                setattr(self.state, key, value)
        
        self.state.last_checkpoint = datetime.now().isoformat()
    
    async def checkpoint(self):
        """Force a state checkpoint (call periodically during long operations)."""
        await self.save_state()
```

### Using State Manager in Main Loop

```python
async def research_loop(state_manager: StateManager, input_data: dict):
    """Main research loop with state recovery support."""
    
    state = await state_manager.load_state()
    
    # Skip already completed phases
    phases = ['search', 'crawl', 'analyze', 'synthesize']
    start_index = phases.index(state.current_phase) if state.current_phase in phases else 0
    
    for i, phase in enumerate(phases[start_index:], start=start_index):
        await state_manager.update_state(current_phase=phase)
        
        if phase == 'search':
            # Skip already completed searches
            pending_queries = [q for q in search_queries 
                            if q not in state.search_queries_completed]
            await perform_searches(pending_queries, state_manager)
            
        elif phase == 'crawl':
            await crawl_sources(state, state_manager)
            
        elif phase == 'analyze':
            await analyze_content(state, state_manager)
            
        elif phase == 'synthesize':
            await synthesize_report(state, state_manager)
        
        # Checkpoint after each phase
        await state_manager.checkpoint()
        await update_progress(phase, int((i + 1) / len(phases) * 100), f'{phase} complete')
```

---

## Webhook Integration

### Setup Webhook at Actor Start

```python
async def setup_webhooks(input_data: dict):
    """Configure webhooks for completion notification."""
    
    webhook_url = input_data.get('webhookUrl')
    
    if webhook_url:
        await Actor.add_webhook(
            event_types=['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
            request_url=webhook_url,
            idempotency_key=os.environ.get('APIFY_ACTOR_RUN_ID'),
            payload_template=json.dumps({
                'eventType': '{{eventType}}',
                'runId': '{{resource.id}}',
                'status': '{{resource.status}}',
                'datasetId': '{{resource.defaultDatasetId}}',
                'keyValueStoreId': '{{resource.defaultKeyValueStoreId}}',
                'reportUrl': f'https://api.apify.com/v2/key-value-stores/{{{{resource.defaultKeyValueStoreId}}}}/records/REPORT.html'
            })
        )
        Actor.log.info(f'Webhook configured for: {webhook_url}')
```

### Webhook Payload Structure

When the Actor completes, the webhook receives:

```json
{
    "eventType": "ACTOR.RUN.SUCCEEDED",
    "runId": "abc123xyz",
    "status": "SUCCEEDED",
    "datasetId": "dataset123",
    "keyValueStoreId": "kvstore456",
    "reportUrl": "https://api.apify.com/v2/key-value-stores/kvstore456/records/REPORT.html"
}
```

---

## Pricing Configuration (Pay-Per-Event)

### Recommended Events for Deep Research

```python
# In your Actor code, charge for meaningful events:

async def charge_for_research(findings_count: int):
    """Charge based on research output."""
    
    # Charge for Actor start
    await Actor.charge(event_name='research-started', count=1)
    
    # Charge per source analyzed
    await Actor.charge(event_name='source-analyzed', count=sources_analyzed)
    
    # Charge for report generation
    await Actor.charge(event_name='report-generated', count=1)
```

### Configure in Apify Console (Monetization Tab)

| Event Name | Price (suggested) | Description |
|------------|-------------------|-------------|
| `research-started` | $0.50 | Flat fee per research run |
| `source-analyzed` | $0.01 | Per source/URL processed |
| `report-generated` | $1.00 | Per final report |

### Tiered Pricing Example

```python
# Offer discounts for higher-tier users
async def get_price_multiplier() -> float:
    """Get price multiplier based on user's discount tier."""
    
    user_info = await Actor.apify_client.user().get()
    tier = user_info.get('proxy', {}).get('groups', [])
    
    # BRONZE: 1.0x, SILVER: 0.9x, GOLD: 0.8x
    if 'GOLD' in str(tier):
        return 0.8
    elif 'SILVER' in str(tier):
        return 0.9
    return 1.0
```

---

## Error Handling

### Graceful Failure Pattern

```python
from apify import Actor

async def main():
    try:
        async with Actor:
            await run_research()
            
    except Exception as e:
        Actor.log.exception(f'Research failed: {e}')
        
        # Save partial results if any
        try:
            await save_partial_results()
        except:
            pass
        
        # Update output with error status
        await Actor.set_value('OUTPUT', {
            'status': 'failed',
            'error': str(e),
            'errorType': type(e).__name__,
            'partialResultsAvailable': True
        })
        
        # Re-raise to mark run as failed
        raise
```

### Retry Logic for External APIs

```python
import asyncio
from typing import TypeVar, Callable
from functools import wraps

T = TypeVar('T')

async def retry_async(
    func: Callable[..., T],
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential: bool = True
) -> T:
    """Retry async function with exponential backoff."""
    
    last_exception = None
    
    for attempt in range(max_attempts):
        try:
            return await func()
        except Exception as e:
            last_exception = e
            
            if attempt < max_attempts - 1:
                delay = min(base_delay * (2 ** attempt if exponential else 1), max_delay)
                Actor.log.warning(f'Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...')
                await asyncio.sleep(delay)
    
    raise last_exception
```

---

## Complete Code Template

### main.py

```python
"""
Deep Research Actor - Main Entry Point

A long-running Actor that performs comprehensive research on a given topic,
synthesizes findings using LLMs, and generates a detailed report.
"""

import asyncio
import os
from datetime import datetime
from typing import Optional

from apify import Actor, Event

from src.storage.manager import StateManager
from src.research.searcher import WebSearcher
from src.research.crawler import ContentCrawler
from src.research.synthesizer import LLMSynthesizer
from src.notifications.notifier import Notifier
from src.utils.report_generator import ReportGenerator


async def main():
    """Main Actor entry point."""
    
    async with Actor:
        # ─────────────────────────────────────────────────────────────────
        # 1. INITIALIZATION
        # ─────────────────────────────────────────────────────────────────
        
        Actor.log.info('Starting Deep Research Actor')
        
        # Load input
        input_data = await Actor.get_input() or {}
        query = input_data.get('query')
        
        if not query:
            raise ValueError('Research query is required')
        
        depth = input_data.get('depth', 'standard')
        max_sources = input_data.get('maxSources', 20)
        output_format = input_data.get('outputFormat', 'html')
        
        # Initialize managers
        state_manager = StateManager()
        notifier = Notifier(input_data)
        
        # ─────────────────────────────────────────────────────────────────
        # 2. IMMEDIATE RESPONSE (Return URLs before starting research)
        # ─────────────────────────────────────────────────────────────────
        
        store = await Actor.open_key_value_store()
        dataset = await Actor.open_dataset()
        
        run_id = os.environ.get('APIFY_ACTOR_RUN_ID', 'local-run')
        report_key = f'REPORT.{output_format}'
        
        urls = {
            'report': await store.get_public_url(report_key),
            'progress': await store.get_public_url('PROGRESS'),
            'dataset': f'https://api.apify.com/v2/datasets/{dataset._id}/items',
            'console': f'https://console.apify.com/actors/runs/{run_id}'
        }
        
        # Send immediate response
        await Actor.set_value('OUTPUT', {
            'status': 'processing',
            'query': query,
            'depth': depth,
            'startedAt': datetime.now().isoformat(),
            'estimatedMinutes': {'quick': 5, 'standard': 10, 'deep': 20}.get(depth, 10),
            'reportUrl': urls['report'],
            'progressUrl': urls['progress'],
            'datasetUrl': urls['dataset'],
            'consoleUrl': urls['console'],
            'runId': run_id
        })
        
        Actor.log.info(f'Immediate response sent. Report URL: {urls["report"]}')
        
        # Setup webhooks
        await notifier.setup_webhooks()
        
        # ─────────────────────────────────────────────────────────────────
        # 3. LOAD/RECOVER STATE
        # ─────────────────────────────────────────────────────────────────
        
        state = await state_manager.load_state()
        
        # ─────────────────────────────────────────────────────────────────
        # 4. RESEARCH PHASE
        # ─────────────────────────────────────────────────────────────────
        
        await update_progress(store, 'search', 0, 'Starting web search...')
        
        # Phase 1: Web Search
        if state.current_phase in ['init', 'search']:
            searcher = WebSearcher(input_data.get('proxyConfiguration'))
            search_results = await searcher.search(query, max_results=max_sources)
            
            await state_manager.update_state(
                current_phase='crawl',
                total_sources=len(search_results)
            )
            await state_manager.checkpoint()
        
        await update_progress(store, 'crawl', 25, 'Extracting content from sources...')
        
        # Phase 2: Content Extraction
        if state.current_phase == 'crawl':
            crawler = ContentCrawler(input_data.get('proxyConfiguration'))
            
            for i, source in enumerate(search_results):
                if source['url'] in [f['url'] for f in state.findings]:
                    continue  # Skip already processed
                
                content = await crawler.extract(source['url'])
                
                if content:
                    finding = {
                        'url': source['url'],
                        'title': source.get('title', ''),
                        'content': content,
                        'extractedAt': datetime.now().isoformat()
                    }
                    
                    state.findings.append(finding)
                    await dataset.push_data(finding)
                    
                    await state_manager.update_state(
                        sources_processed=i + 1,
                        findings=state.findings
                    )
                
                # Checkpoint every 5 sources
                if i % 5 == 0:
                    await state_manager.checkpoint()
                    progress = 25 + int((i / len(search_results)) * 25)
                    await update_progress(store, 'crawl', progress, 
                                        f'Processed {i + 1}/{len(search_results)} sources')
            
            await state_manager.update_state(current_phase='analyze')
            await state_manager.checkpoint()
        
        await update_progress(store, 'analyze', 50, 'Analyzing content with AI...')
        
        # Phase 3: LLM Analysis & Synthesis
        if state.current_phase == 'analyze':
            synthesizer = LLMSynthesizer()
            
            analysis = await synthesizer.analyze(
                query=query,
                findings=state.findings,
                depth=depth
            )
            
            await state_manager.update_state(current_phase='synthesize')
            await state_manager.checkpoint()
        
        await update_progress(store, 'synthesize', 75, 'Generating report...')
        
        # Phase 4: Report Generation
        if state.current_phase == 'synthesize':
            generator = ReportGenerator()
            
            report = await generator.generate(
                query=query,
                analysis=analysis,
                findings=state.findings,
                format=output_format
            )
            
            # Save report to KV store
            content_type = {
                'html': 'text/html',
                'markdown': 'text/markdown',
                'json': 'application/json'
            }.get(output_format, 'text/html')
            
            await store.set_value(report_key, report, content_type=content_type)
            
            await state_manager.update_state(current_phase='complete')
        
        # ─────────────────────────────────────────────────────────────────
        # 5. COMPLETION
        # ─────────────────────────────────────────────────────────────────
        
        await update_progress(store, 'complete', 100, 'Research complete!')
        
        # Update final output
        await Actor.set_value('OUTPUT', {
            'status': 'completed',
            'query': query,
            'depth': depth,
            'startedAt': datetime.now().isoformat(),
            'completedAt': datetime.now().isoformat(),
            'sourcesAnalyzed': len(state.findings),
            'reportUrl': urls['report'],
            'datasetUrl': urls['dataset'],
            'consoleUrl': urls['console'],
            'runId': run_id
        })
        
        # Send email notification if configured
        await notifier.send_completion_email(urls['report'])
        
        # Charge for completed research (Pay-Per-Event)
        try:
            await Actor.charge(event_name='research-completed', count=1)
            await Actor.charge(event_name='sources-analyzed', count=len(state.findings))
        except Exception as e:
            Actor.log.warning(f'Charging failed (may be free tier): {e}')
        
        Actor.log.info(f'Research completed successfully. Report: {urls["report"]}')


async def update_progress(store, stage: str, percent: int, message: str):
    """Update progress in KV store and Actor status."""
    
    await store.set_value('PROGRESS', {
        'stage': stage,
        'percent': percent,
        'message': message,
        'updatedAt': datetime.now().isoformat()
    })
    
    await Actor.set_status_message(f'{message} ({percent}%)')


if __name__ == '__main__':
    asyncio.run(main())
```

---

## Actor Configuration

### .actor/actor.json

```json
{
    "actorSpecification": 1,
    "name": "deep-research-agent",
    "title": "Deep Research Agent",
    "description": "AI-powered deep research agent that analyzes multiple sources and generates comprehensive reports",
    "version": "1.0.0",
    "buildTag": "latest",
    "input": "./input_schema.json",
    "output": "./output_schema.json",
    "dockerfile": "../Dockerfile",
    "readme": "../README.md",
    "minMemoryMbytes": 1024,
    "maxMemoryMbytes": 4096,
    "storages": {
        "dataset": {
            "actorSpecification": 1,
            "title": "Research Findings",
            "description": "Structured data from analyzed sources",
            "views": {
                "findings": {
                    "title": "Sources & Findings",
                    "transformation": {
                        "fields": ["url", "title", "extractedAt"]
                    },
                    "display": {
                        "component": "table",
                        "properties": {
                            "url": {"label": "Source URL", "format": "link"},
                            "title": {"label": "Title", "format": "text"},
                            "extractedAt": {"label": "Processed", "format": "text"}
                        }
                    }
                }
            }
        }
    }
}
```

### Dockerfile

```dockerfile
FROM apify/actor-python:3.11

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

CMD ["python", "-m", "src.main"]
```

### requirements.txt

```
apify>=2.0.0
httpx>=0.25.0
beautifulsoup4>=4.12.0
openai>=1.0.0
tiktoken>=0.5.0
jinja2>=3.1.0
markdown>=3.5.0
```

---

## Client Usage Examples

### Python Client - Async Start

```python
from apify_client import ApifyClient

client = ApifyClient('YOUR_API_TOKEN')

# Start the Actor (returns immediately)
run = client.actor('your-username/deep-research-agent').start(
    run_input={
        'query': 'What are the implications of GPT-5 for software development?',
        'depth': 'deep',
        'maxSources': 30,
        'webhookUrl': 'https://your-server.com/webhook'
    }
)

print(f"Run started: {run['id']}")
print(f"Report will be at: https://api.apify.com/v2/key-value-stores/{run['defaultKeyValueStoreId']}/records/REPORT.html")
```

### Python Client - Polling Pattern

```python
import time
from apify_client import ApifyClient

client = ApifyClient('YOUR_API_TOKEN')

# Start the run
run = client.actor('your-username/deep-research-agent').start(
    run_input={'query': 'Latest advances in fusion energy'}
)

run_id = run['id']
kv_store_id = run['defaultKeyValueStoreId']

# Poll for completion
while True:
    run_info = client.run(run_id).get()
    status = run_info['status']
    
    if status in ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']:
        break
    
    # Check progress
    try:
        progress = client.key_value_store(kv_store_id).get_record('PROGRESS')
        print(f"Progress: {progress['value']}")
    except:
        pass
    
    time.sleep(30)

# Fetch results
if status == 'SUCCEEDED':
    report = client.key_value_store(kv_store_id).get_record('REPORT.html')
    print(report['value'])
```

### cURL - Start Actor

```bash
curl -X POST "https://api.apify.com/v2/acts/your-username~deep-research-agent/runs?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Future of autonomous vehicles",
    "depth": "standard",
    "webhookUrl": "https://your-server.com/research-complete"
  }'
```

---

## Summary Checklist

Before deploying your Deep Research Actor, ensure:

- [ ] Input schema validates all required fields
- [ ] Immediate response returns public URLs within seconds
- [ ] State manager handles migration events
- [ ] Progress updates are sent periodically
- [ ] Webhook integration is tested
- [ ] Error handling saves partial results
- [ ] Report generation supports multiple formats
- [ ] Pay-per-event charges are configured (if monetizing)
- [ ] README explains async usage patterns
- [ ] Dataset schema defines output structure

---

## References

- [Apify Actor Documentation](https://docs.apify.com/platform/actors)
- [Apify Storage Documentation](https://docs.apify.com/platform/storage)
- [Apify Webhooks Documentation](https://docs.apify.com/platform/integrations/webhooks)
- [State Persistence Guide](https://docs.apify.com/platform/actors/development/builds-and-runs/state-persistence)
- [Actor Monetization Guide](https://docs.apify.com/platform/actors/publishing/monetize)