# Testing Patterns

**Analysis Date:** 2026-01-27

## Test Framework

**JavaScript/TypeScript:**
- No test framework currently configured
- No Jest, Vitest, or other runner present in `package.json`
- No test files found in `src/` directory
- ESLint configured but no test-specific tooling

**Python (Actor):**
- Test framework: pytest (implied by test file structure)
- Test files located in: `actor/tests/`
- Test discovery: `test_*.py` and `*_test.py` files
- Existing tests: `actor/tests/test_all_services.py`, `actor/tests/test_e2e_research_flow.py`

**Node/Python Versions:**
- Node: Not specified (inferred modern version via Next.js 16+)
- Python: Tests use `asyncio` for async testing (Python 3.8+)

## Test File Organization

**Location - JavaScript/TypeScript:**
- Status: **No test files present**
- When implemented, suggest co-located pattern:
  - `src/components/report/FindingCard.tsx` → `src/components/report/FindingCard.test.tsx`
  - `src/lib/utils.ts` → `src/lib/utils.test.ts`
  - Alternative: centralized `__tests__/` directories per feature

**Location - Python:**
- Location: `actor/tests/`
- Naming: `test_<module>.py` format
- Current tests: `test_all_services.py`, `test_e2e_research_flow.py`

**Naming Convention:**
- Python: `test_<functionality>` (e.g., `test_all_services`, `test_e2e_research_flow`)
- Recommended TypeScript: `.test.ts` or `.spec.ts` suffix

## Test Structure

**Python Test Structure:**

```python
# From actor/tests/test_all_services.py

class TestResult:
    """Container for test results."""
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.duration_ms = 0
        self.error: str = ""

class TestReport:
    """Generates comprehensive test report."""
    def __init__(self):
        self.results: List[TestResult] = []
        self.start_time = datetime.now()

    def add_result(self, result: TestResult):
        self.results.append(result)
```

**Test Patterns:**
- Tests are async-first: `async def test_function():`
- Use `asyncio.run()` or `asyncio.gather()` for async operations
- Custom `TestResult` and `TestReport` classes track results with:
  - `name`: Test identifier
  - `passed`: Boolean outcome
  - `duration_ms`: Execution time
  - `error`: Exception message if failed
  - `notes`: List of observations
  - Business value and technical quality assessments

**Setup/Teardown:**
- Environment loading via `dotenv`: `load_dotenv(env_path)`
- API keys retrieved from `.env`: `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, `SUPABASE_*`
- No explicit setup/teardown fixtures; environment-driven

**Assertion Pattern:**
- Python uses custom assertions in `TestResult`
- `result.passed = boolean_condition`
- `result.error = exception_message if failed`
- Report generation: `report.generate_markdown()` produces test summary

## Mocking

**Framework:**
- Python: No explicit mocking framework seen (unittest.mock available if needed)
- TypeScript: No mocking framework configured

**Current Approach - Python:**
- Real API calls in tests (see `test_all_services.py`)
- Environment-based credentials: `os.getenv("GEMINI_API_KEY", "")`
- Tests verify actual integration with Google, OpenRouter, Supabase

**What to Mock (Recommendations):**
- External API responses (if adding mocking)
- File I/O operations
- Email sending (test without sending real emails)
- Supabase operations in unit tests

**What NOT to Mock:**
- Core business logic (research execution, data transformation)
- Database queries in integration tests
- API response parsing

## Fixtures and Factories

**Test Data - Python:**

Location: Inline in test files (see `actor/tests/test_all_services.py`)

Example approach from existing tests:
```python
# Test creates ActorInput objects
actor_input = ActorInput(
    query="latest AI breakthroughs 2024",
    template="tech_market",
    granularity="standard"
)

# Custom TestResult objects track execution
result = TestResult("test_gemini_research")
result.passed = True
result.duration_ms = execution_time
```

**No Factory Pattern:**
- Tests create objects directly via class constructors
- Fixtures not abstracted into separate factory files
- Each test builds its own test data

**Recommendation for TypeScript:**
- Create fixtures in `__fixtures__/` or `__mocks__/` directories
- Factory functions: `createMockSession()`, `createMockFinding()`
- Use libraries like `@faker-js/faker` for realistic test data

## Coverage

**Requirements:**
- Not enforced
- No coverage tooling configured
- No minimum coverage threshold

**View Coverage:**
- Python: `pytest --cov=actor/src` (if pytest-cov installed)
- TypeScript: Would use `jest --coverage` or `vitest --coverage` when test framework added

**Gaps:**
- TypeScript/React components untested
- No unit tests for `src/lib/utils.ts`, `src/hooks/`, `src/stores/`
- No component snapshot or integration tests

## Test Types

**Unit Tests:**
- **Scope:** Individual functions and services in isolation
- **Approach (Python):** Test each service method with mocked dependencies
- **Location:** `actor/tests/test_*.py`
- **Not implemented (TypeScript):** No unit tests for React components or utils

**Integration Tests:**
- **Scope:** Services interacting with real APIs and databases
- **Approach (Python):** `test_all_services.py` tests actual API calls
- **Current pattern:**
  ```python
  # Real API call to Gemini
  response = await client.research(search_query)
  # Verify response structure
  assert response.sources is not None
  # Track in TestResult
  result.passed = len(response.sources) > 0
  ```
- **Not implemented (TypeScript):** No integration tests for Supabase queries or external APIs

**E2E Tests:**
- **Scope:** Full research flow from query to report generation
- **Framework:** Python-based (not web UI automation)
- **Location:** `actor/tests/test_e2e_research_flow.py`
- **Pattern:** Execute complete research pipeline and validate outputs
- **Not implemented (TypeScript):** No Cypress/Playwright tests for frontend

## Common Patterns

**Async Testing - Python:**

```python
# From actor/tests/test_all_services.py
import asyncio

async def test_async_operation():
    result = TestResult("test_name")
    start_time = time.time()

    try:
        # Async operation
        response = await service.executeResearch(query)
        result.passed = response is not None
    except Exception as e:
        result.error = str(e)
    finally:
        result.duration_ms = int((time.time() - start_time) * 1000)

    return result

# Run async test
results = asyncio.run(test_async_operation())
```

**Async Testing - TypeScript (Recommended):**

```typescript
// Not currently used, but recommended pattern
describe('ResearchService', () => {
  it('should fetch sessions', async () => {
    const sessions = await researchService.getSessions();
    expect(sessions).toBeDefined();
    expect(Array.isArray(sessions)).toBe(true);
  });
});
```

**Error Testing - Python:**

```python
# Pattern from test_all_services.py
result = TestResult("test_error_handling")

try:
    # Operation that may fail
    response = await client.research(invalid_query)
    result.passed = False  # Should have failed
except Exception as e:
    result.error = str(e)
    result.passed = True  # Correctly caught error
```

**Error Testing - TypeScript (Recommended):**

```typescript
// Recommended pattern (not yet implemented)
it('should handle fetch errors gracefully', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

  const result = await fetchData();

  expect(result).toEqual([]);  // Returns empty array on error
  fetchSpy.mockRestore();
});
```

## Test Execution

**Run Tests - Python:**

```bash
# Run all tests
cd actor
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_all_services.py -v

# Run with output
python tests/test_all_services.py
```

**Output Format:**
- Custom `TestReport` class generates markdown report
- Results written to file: `test_results.md` (implied)
- Includes: pass/fail status, execution time, error messages, business value assessment

**Watch Mode:**
- Not available for current setup
- Would use `pytest-watch` plugin if implemented

## Test Coverage Gaps

**High Priority:**
1. **React Components** (`src/components/`):
   - No tests for `FindingCard`, `ReportView`, `ResearchMap`, etc.
   - Missing: prop validation, conditional rendering, interaction handling
   - Files: `src/components/report/`, `src/components/map/`, `src/components/swiss/`

2. **Hooks** (`src/hooks/`):
   - No tests for `useMapData`, `useSession`, `useSessions`
   - Missing: state updates, effect timing, cleanup
   - Would require React Testing Library

3. **Utilities** (`src/lib/utils.ts`):
   - Functions like `formatDate()`, `groupBy()`, `sortByDate()` untested
   - Simple and isolated - prime candidates for unit tests
   - Fast to test, high confidence gain

4. **Store** (`src/stores/appStore.ts`):
   - Zustand store logic untested
   - Missing: state mutations, async action handling, error states
   - Would use `vitest` or `jest` with zustand mock

**Medium Priority:**
5. **API Routes** (`src/app/api/`):
   - Route handler in `src/app/api/actor/run/route.ts` untested
   - Should test: input validation, response format, error handling

6. **Services** (TypeScript):
   - `src/lib/research/research-service.ts` exists but untested
   - Could reuse patterns from Python tests

7. **Database Queries** (`src/lib/supabase.ts`):
   - Supabase queries not tested
   - Would require Supabase test client or mocking

**Low Priority:**
8. **UI Components with Complex Logic:**
   - `src/components/canvas/` rendering and interaction
   - `src/components/layout/` modal behavior

## Recommended Test Setup (Not Yet Implemented)

**For TypeScript/React:**
```json
{
  "devDependencies": {
    "vitest": "latest",
    "@testing-library/react": "^15",
    "@testing-library/jest-dom": "^6",
    "@testing-library/user-event": "^14",
    "jsdom": "latest"
  }
}
```

**Configuration:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
  },
})
```

**Run Command:**
```bash
npm run test          # Run all tests
npm run test:watch   # Watch mode
npm run test:cov     # Coverage report
```

---

*Testing analysis: 2026-01-27*
