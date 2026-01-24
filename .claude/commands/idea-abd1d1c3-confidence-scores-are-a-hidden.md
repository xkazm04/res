You are an expert software engineer. Execute the following requirement immediately. Do not ask questions, do not wait for confirmation. Read the requirement carefully and implement all changes to the codebase as specified.

REQUIREMENT TO EXECUTE NOW:

# Confidence Scores Are a Hidden Bayesian Network

## Metadata
- **Category**: user_benefit
- **Effort**: Unknown (N/A/3)
- **Impact**: Unknown (N/A/3)
- **Scan Type**: insight_synth
- **Generated**: 1/3/2026, 8:19:36 PM

## Description
The system calculates confidence through multiple mechanisms: source credibility (_assess_credibility), finding confidence_score, adjusted_confidence from verification, and perspective confidence. These are computed independently but are conceptually linked. A Bayesian approach would recognize: P(finding is true) depends on P(source is credible) which depends on P(domain is authoritative). Currently base.py line 931-955 calculates adjusted_confidence by summing adjustments, but Bayesian inference would multiply probabilities appropriately. This would also enable: explaining why a confidence dropped, what evidence would change a conclusion.

## Reasoning
Users see confidence percentages but cannot understand them. A proper probabilistic model makes confidence scores interpretable and actionable. 'This finding has 73% confidence because source A (85% credible) corroborates source B (60% credible) but contradicts source C (40% credible)'. This is the difference between opaque AI and explainable AI.

## Context

**Note**: This section provides supporting architectural documentation and is NOT a hard requirement. Use it as guidance to understand existing code structure and maintain consistency.

### Context: Actor

**Description**: # AI-Powered Document Analysis and Report Generation Actor

## Overview

### What is this context/feature?
This is a comprehensive actor (autonomous service) designed to analyze documents using AI capabilities and generate detailed, interactive reports. It leverages multiple AI providers (Google Gemini, OpenRouter), cloud services (Google Cloud Run, Supabase), and specialized processing tools (OCR, email delivery) to extract insights from documents and present them in structured formats.

### What problem does it solve?
- **Document Intelligence**: Extracts meaningful information from various document types through OCR and AI analysis
- **Multi-Provider AI Access**: Abstracts multiple AI backends (Gemini, OpenRouter) allowing flexible model selection
- **Cost Optimization**: Tracks and manages API costs across different providers
- **Report Generation**: Creates both static and interactive reports from analyzed data
- **Enterprise Integration**: Connects to Supabase for data persistence, Resend for email delivery, and LangSmith for observability
- **Scalable Processing**: Runs on Google Cloud Run for serverless, scalable execution

### Who uses it?
- Enterprise users needing automated document analysis
- Teams requiring cost-tracked AI processing pipelines
- Organizations needing interactive report generation and distribution
- Developers building document intelligence workflows

---

## Architecture

### Overall Design Pattern
The system follows a **layered, modular architecture** with clear separation of concerns:

```
Configuration Layer (actor.json, INPUT/OUTPUT_SCHEMA)
        ↓
Schema/Validation Layer (input.py, output.py)
        ↓
Client Layer (cloud_run, gemini, openrouter, resend, supabase)
        ↓
Service Layer (cache, cost_tracker, events, langsmith, ocr, report)
        ↓
Core Execution (Main actor logic)
```

### Key Components

#### 1. **Client Layer** (`clients/`)
Provides abstraction for external service integrations:
- **cloud_run.py**: Google Cloud Run deployment and invocation
- **gemini.py**: Google Gemini AI model integration
- **openrouter.py**: OpenRouter API for multiple LLM access
- **resend.py**: Email delivery service client
- **supabase.py**: PostgreSQL database with real-time capabilities

#### 2. **Service Layer** (`services/`)
Business logic and specialized processing:
- **cache.py**: Caching mechanism to reduce redundant API calls
- **cost_tracker.py**: Monitors and reports API usage costs
- **events.py**: Event emission and tracking system
- **langsmith.py**: LangChain observability and debugging
- **ocr.py**: Optical Character Recognition for document text extraction
- **report.py**: Static report generation and formatting
- **report_interactive.py**: Interactive report creation with dynamic elements

#### 3. **Schema Layer** (`schemas/`)
Data validation and type safety:
- **input.py**: Validates actor input parameters
- **output.py**: Defines and validates output structure

#### 4. **Configuration Layer**
- **actor.json**: Actor metadata, dependencies, and runtime configuration
- **INPUT_SCHEMA.json**: JSON Schema for input validation
- **OUTPUT_SCHEMA.json**: JSON Schema for output validation

### Design Patterns Used

1. **Dependency Injection**: Clients are initialized with configuration and injected into services
2. **Service Locator**: Centralized client access through `__init__.py` files
3. **Factory Pattern**: Client creation abstracted in respective modules
4. **Decorator Pattern**: Cost tracking and caching wrap core functionality
5. **Observer Pattern**: Event system for monitoring and logging
6. **Strategy Pattern**: Multiple AI providers (Gemini, OpenRouter) with interchangeable interfaces

---

## File Structure

### Configuration Files

#### `actor/.actor/actor.json`
- **Purpose**: Actor metadata and configuration
- **Contains**: Name, version, description, dependencies, environment variables
- **Role**: Defines how the actor is deployed and executed on the platform

#### `actor/.actor/INPUT_SCHEMA.json`
- **Purpose**: JSON Schema defining valid input parameters
- **Contains**: Required fields, data types, constraints, descriptions
- **Role**: Validates user input at runtime

#### `actor/.actor/OUTPUT_SCHEMA.json`
- **Purpose**: JSON Schema defining output structure
- **Contains**: Response format, field definitions, data types
- **Role**: Documents and validates output to consumers

### Client Layer

#### `actor/src/clients/__init__.py`
- **Purpose**: Exports and initializes all client classes
- **Exports**: CloudRunClient, GeminiClient, OpenRouterClient, ResendClient, SupabaseClient
- **Role**: Single entry point for client access

#### `actor/src/clients/cloud_run.py`
- **Purpose**: Google Cloud Run integration
- **Provides**: Service deployment, function invocation, scaling management
- **Dependencies**: Google Cloud libraries

#### `actor/src/clients/gemini.py`
- **Purpose**: Google Gemini AI model client
- **Provides**: Text generation, vision analysis, embeddings
- **Dependencies**: Google Generative AI SDK

#### `actor/src/clients/openrouter.py`
- **Purpose**: OpenRouter API abstraction for multiple LLMs
- **Provides**: Access to various open-source and proprietary models
- **Dependencies**: OpenRouter HTTP API

#### `actor/src/clients/resend.py`
- **Purpose**: Email delivery service integration
- **Provides**: Email sending, template rendering, delivery tracking
- **Dependencies**: Resend API

#### `actor/src/clients/supabase.py`
- **Purpose**: PostgreSQL database and real-time features
- **Provides**: CRUD operations, real-time subscriptions, authentication
- **Dependencies**: Supabase Python client

### Schema Layer

#### `actor/src/schemas/__init__.py`
- **Purpose**: Exports input and output schema classes
- **Exports**: InputSchema, OutputSchema
- **Role**: Central schema access point

#### `actor/src/schemas/input.py`
- **Purpose**: Input data validation and type definitions
- **Contains**: Pydantic models for input parameters
- **Validates**: Document paths, AI model selection, output preferences

#### `actor/src/schemas/output.py`
- **Purpose**: Output data structure and validation
- **Contains**: Pydantic models for response format
- **Validates**: Report data, analysis results, metadata

### Service Layer

#### `actor/src/services/__init__.py`
- **Purpose**: Exports all service classes
- **Exports**: CacheService, CostTracker, EventService, LangSmithService, OCRService, ReportService, InteractiveReportService
- **Role**: Service access point

#### `actor/src/services/cache.py`
- **Purpose**: Caching layer for API responses
- **Provides**: Memoization, TTL-based expiration, cache invalidation
- **Benefits**: Reduces API calls and costs

#### `actor/src/services/cost_tracker.py`
- **Purpose**: Monitor and track API usage costs
- **Provides**: Cost calculation, usage metrics, billing reports
- **Tracks**: Per-provider costs, cumulative totals, per-request pricing

#### `actor/src/services/events.py`
- **Purpose**: Event emission and logging
- **Provides**: Event publishing, listener registration, async event handling
- **Events**: Processing milestones, errors, completions

#### `actor/src/services/langsmith.py`
- **Purpose**: LangChain integration for observability
- **Provides**: Trace logging, debugging, performance monitoring
- **Benefits**: Visibility into AI model calls and chains

#### `actor/src/services/ocr.py`
- **Purpose**: Optical Character Recognition
- **Provides**: Text extraction from images and PDFs
- **Supports**: Multiple document formats, language detection

#### `actor/src/services/report.py`
- **Purpose**: Static report generation
- **Provides**: Formatting, templating, document export (PDF, HTML, Markdown)
- **Features**: Structured data presentation, styling

#### `actor/src/services/report_interactive.py`
- **Purpose**: Interactive report creation
- **Provides**: Dynamic dashboards, real-time updates, user interactions
- **Features**: Charts, filters, drill-down capabilities

### Relationships and Data Flow

```
Input (INPUT_SCHEMA) → InputSchema validation
                    ↓
            Main Actor Logic
                    ↓
        ┌───────────┼───────────┬──────────────┐
        ↓           ↓           ↓              ↓
    OCRService  GeminiClient OpenRouterClient CostTracker
        ↓           ↓           ↓              ↓
    CacheService ─ Events ─ LangSmith ─ Supabase
        ↓           ↓           ↓              ↓
    ReportService  ResendClient CloudRunClient
        ↓
    Output (OUTPUT_SCHEMA) → OutputSchema validation
```

### Entry Points

1. **Primary Entry**: Actor execution triggered by platform
2. **Input Validation**: `schemas/input.py` validates parameters
3. **Service Initialization**: `services/__init__.py` creates service instances
4. **Client Initialization**: `clients/__init__.py` creates API clients
5. **Output Generation**: `schemas/output.py` validates and formats results

### Key Integration Points

- **Supabase**: Persistent data storage and real-time updates
- **Google Cloud Run**: Serverless execution environment
- **Google Gemini**: Primary AI analysis engine
- **OpenRouter**: Fallback/alternative AI models
- **Resend**: Report distribution via email
- **LangSmith**: Debugging and monitoring AI operations

### Initialization Order

1. Load `actor.json` configuration
2. Validate input against `INPUT_SCHEMA.json`
3. Initialize clients from `clients/`
4. Initialize services from `services/`
5. Execute core business logic
6. Generate reports (static and interactive)
7. Validate output against `OUTPUT_SCHEMA.json`
8. Return results",
  "fileStructure": "```
actor/
├── .actor/
│   ├── actor.json                    # Actor metadata & deployment config
│   ├── INPUT_SCHEMA.json             # Input validation schema
│   └── OUTPUT_SCHEMA.json            # Output validation schema
│
└── src/
    ├── clients/
    │   ├── __init__.py               # Client exports & initialization
    │   ├── cloud_run.py              # Google Cloud Run integration
    │   ├── gemini.py                 # Google Gemini AI client
    │   ├── openrouter.py             # OpenRouter LLM client
    │   ├── resend.py                 # Email delivery client
    │   └── supabase.py               # Database client
    │
    ├── schemas/
    │   ├── __init__.py               # Schema exports
    │   ├── input.py                  # Input validation (Pydantic)
    │   └── output.py                 # Output structure (Pydantic)
    │
    └── services/
        ├── __init__.py               # Service exports & initialization
        ├── cache.py                  # Response caching layer
        ├── cost_tracker.py           # API cost monitoring
        ├── events.py                 # Event emission system
        ├── langsmith.py              # LangChain observability
        ├── ocr.py                    # Document OCR processing
        ├── report.py                 # Static report generation
        └── report_interactive.py     # Interactive report creation
```"
}
**Related Files**:
- `actor/.actor/actor.json`
- `actor/.actor/INPUT_SCHEMA.json`
- `actor/.actor/OUTPUT_SCHEMA.json`
- `actor/src/clients/__init__.py`
- `actor/src/clients/cloud_run.py`
- `actor/src/clients/gemini.py`
- `actor/src/clients/openrouter.py`
- `actor/src/clients/resend.py`
- `actor/src/clients/supabase.py`
- `actor/src/schemas/__init__.py`
- `actor/src/schemas/input.py`
- `actor/src/schemas/output.py`
- `actor/src/services/__init__.py`
- `actor/src/services/cache.py`
- `actor/src/services/cost_tracker.py`
- `actor/src/services/events.py`
- `actor/src/services/langsmith.py`
- `actor/src/services/ocr.py`
- `actor/src/services/report_interactive.py`
- `actor/src/services/report.py`
- `actor/src/services/research.py`
- `actor/src/services/state.py`
- `actor/src/services/status.py`
- `actor/src/templates/__init__.py`
- `actor/src/templates/base.py`
- `actor/src/templates/competitive.py`
- `actor/src/templates/contract.py`
- `actor/src/templates/financial.py`
- `actor/src/templates/investigative.py`
- `actor/src/templates/legal.py`
- `actor/src/templates/tech_market.py`
- `actor/src/utils/__init__.py`
- `actor/src/utils/pdf.py`
- `actor/src/utils/retry.py`
- `actor/src/__init__.py`
- `actor/src/config.py`
- `actor/src/main.py`
- `actor/tests/questions.md`
- `actor/tests/test_all_services.py`
- `actor/tests/TEST_REPORT.md`
- `actor/README.md`

**Post-Implementation**: After completing this requirement, evaluate if the context description or file paths need updates. Use the appropriate API/DB query to update the context if architectural changes were made.

## Recommended Skills

Use Claude Code skills as appropriate for implementation guidance. Check `.claude/skills/` directory for available skills.

## Notes

This requirement was generated from an AI-evaluated project idea. No specific goal is associated with this idea.

## Implementation Guidelines

**Steps**:
1. Analyze the requirement thoroughly
2. Identify all files that need to be modified or created
3. Implement all changes specified in the requirement
4. Follow implementation steps precisely
5. Run any tests if specified
6. Ensure all changes are complete before finishing

## File Structure (Next.js/React Projects)

**Feature-Specific Files** (use `app/features/<feature>` structure):
- `app/features/<feature>/components/` - Feature-specific components and UI
- `app/features/<feature>/lib/` - Feature-specific functions, utilities, helpers
- `app/features/<feature>/` - Main wrapper, index, or page file

**Reusable UI Components** (use `app/components/ui` structure):
- `app/components/ui/` - Shared, reusable UI elements across multiple features

## Test Selectors

**CRITICAL**: Add `data-testid` attributes to ALL interactive UI components for automated testing.

**Guidelines**:
- Add to all clickable elements (buttons, links, icons)
- Use descriptive kebab-case: `data-testid="submit-form-btn"`
- Include component context: `data-testid="goal-delete-btn"`, `data-testid="project-settings-modal"`
- Add to form inputs: `data-testid="email-input"`
- Add to list items: `data-testid="task-item-123"`

**Example**:
```tsx
<button onClick={handleSubmit} data-testid="create-goal-btn">
  Create Goal
</button>

<input
  type="text"
  value={title}
  onChange={handleChange}
  data-testid="goal-title-input"
/>
```

## Theming and Styling

**Before creating new UI components**:
1. Examine existing components in the project
2. Match the color scheme, spacing, and visual patterns
3. Use consistent className patterns (Tailwind CSS)
4. Follow the app's design language (glassmorphism, gradients, shadows, etc.)
5. Support dark mode if the app uses it

## Documentation Policy

**CRITICAL RULE**: Do NOT create separate documentation files (.md, README.md, docs/) for routine implementations.

**Only create documentation when**:
- Implementing a NEW major feature or module (not refactorings)
- Adding a NEW API or public interface
- Creating NEW architectural patterns
- The requirement explicitly asks for documentation

**Do NOT create documentation for**:
- Bug fixes
- Refactorings
- Small adjustments
- UI changes
- Database schema changes
- Performance improvements
- Code quality improvements

**For all implementations**: Create an implementation log entry (see next section) - this is your primary documentation.

## Implementation Logging

After completing the implementation, log your work via a simple API call.

**DO NOT**:
- ❌ Create separate script files for logging
- ❌ Create SQL scripts or use sqlite3
- ❌ Create documentation files (.md, README.md)

**DO**: Make ONE API call to log your implementation:

```bash
curl -X POST "http://localhost:3000/api/implementation-log" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "e1355549-1900-4f21-ab27-be493c58374d",
    "contextId": "49f0dad9-8c7b-4985-8205-93fb44fa7a61",
    "requirementName": "<requirement-filename-without-.md>",
    "title": "<2-6 word summary>",
    "overview": "<1-2 paragraphs describing implementation>",
    "overviewBullets": "<bullet1>\n<bullet2>\n<bullet3>"
  }'
```

**Field Guidelines**:
- `requirementName`: Requirement filename WITHOUT .md extension
- `title`: 2-6 words (e.g., "User Authentication System")
- `overview`: 1-2 paragraphs describing what was done
- `overviewBullets`: 3-5 key points separated by \n

**Example**:
```bash
curl -X POST "http://localhost:3000/api/implementation-log" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-123",
    "requirementName": "implement-dark-mode",
    "title": "Dark Mode Implementation",
    "overview": "Implemented global dark mode toggle with theme persistence.",
    "overviewBullets": "Created ThemeProvider\nUpdated components\nAdded toggle in settings"
  }'
```

**If the API call fails**: Report the error and continue - logging failures are non-blocking.

## Screenshot Capture (Context-Related Only)

**Workflow**:

### Step 1: Check if Test Scenario Exists

```bash
curl -X POST "http://localhost:3000/api/tester/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"contextId":"49f0dad9-8c7b-4985-8205-93fb44fa7a61","scanOnly":true}'
```

**If `hasScenario: false`**: Skip all remaining screenshot steps. Set `screenshot: null` in log.

### Step 2: Start Dev Server (ONLY if scenario exists)

Start your development server manually (e.g., `npm run dev`)

### Step 3: Capture Screenshot

```bash
curl -X POST "http://localhost:3000/api/tester/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"contextId":"49f0dad9-8c7b-4985-8205-93fb44fa7a61"}'
```

### Step 4: Stop Server (CRITICAL)

Stop your development server

### Step 5: Update Log with Screenshot Path

Use the `screenshotPath` from API response in your log creation:

```typescript
screenshot: screenshotPath || null
```

**Error Handling**:
- No scenario → `screenshot: null`
- Server fails (unrelated to your code) → `screenshot: null`
- Server fails (your bugs) → Fix bugs, retry, then screenshot
- Screenshot API fails → `screenshot: null`
- **Always stop the server** to free the port for next task

## Final Checklist

Before finishing:
- [ ] All code changes implemented
- [ ] Test IDs added to interactive components
- [ ] File structure follows guidelines
- [ ] UI components match existing theme
- [ ] Implementation log entry created
- [ ] Screenshot captured (if test scenario exists)
- [ ] NO separate documentation files created (unless new major feature)

Begin implementation now.