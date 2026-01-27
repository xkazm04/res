# Coding Conventions

**Analysis Date:** 2026-01-27

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `SwissCard.tsx`, `ReportView.tsx`, `FindingCard.tsx`)
- Utility files: lowercase with dashes for multi-word names (e.g., `research-service.ts`, `email-service.ts`)
- Index/barrel files: `index.tsx` or `index.ts` for exporting module contents
- API routes: follow Next.js file-based routing (e.g., `src/app/api/actor/run/route.ts`)
- Type files: PascalCase with `types` prefix or `.ts` extension (e.g., `research.ts`, `techMarket.ts`, `types.ts`)
- Hooks: camelCase prefixed with `use` (e.g., `useMapData.ts`, `useSession.ts`, `useSessions.ts`)
- Stores: camelCase with `Store` suffix (e.g., `appStore.ts`)

**Functions:**
- camelCase for all functions (e.g., `getInitials()`, `formatDate()`, `groupBy()`, `executeResearch()`)
- Async functions use `async` keyword (e.g., `async executeResearch()`, `async fetchSession()`)
- Private class methods use underscore prefix (e.g., `_extractFindings()`, `_assessCredibility()`)
- Hook names start with `use` prefix (e.g., `useMapData()`, `useSession()`)
- Factory/builder functions descriptive (e.g., `transformSessionsToHierarchy()`, `buildExecutiveSummary()`)

**Variables:**
- camelCase for all variables and constants
- Immutable constants in UPPER_SNAKE_CASE if module-level (rarely used; prefer const camelCase)
- Boolean variables prefixed with `is`, `has`, `should`, `can`, `do`, `get` (e.g., `isExpanded`, `hasContent`, `shouldRender`, `canAccess`)
- Collections plural (e.g., `sessions`, `findings`, `perspectives`, `sources`)
- Temporary/single-letter variables limited to loops (e.g., `i`, `j`, `k`)

**Types:**
- PascalCase for all TypeScript types and interfaces (e.g., `ResearchSession`, `SwissCardProps`, `TreemapNode`)
- Type suffixes: `-Props` for React component props, `-Type` for discriminated unions
- Union types named descriptively (e.g., `SessionStatus`, `FindingType`, `RelationshipType`)
- Generic type parameters start with `T`, `K`, `V` (e.g., `T extends ResearchSession`, `Record<K, T[]>`)
- Enums PascalCase (e.g., `SearchMode.GROUNDED`)

**CSS/Tailwind:**
- Use `cn()` utility from `src/lib/utils.ts` for conditional class merging
- Component-level CSS classes: kebab-case (e.g., `card`, `card-elevated`, `card-interactive`)
- CSS variable references: `var(--variable-name)` format
- Example: `className={cn('card p-4', isActive && 'bg-blue', customClass)}`

## Code Style

**Formatting:**
- No explicit formatter configured (eslint + next's defaults)
- 2-space indentation (implicit from Next.js templates)
- Lines typically kept under 120 characters
- Semicolons required at statement end
- Single quotes for strings in JS/TS (implied by convention)

**Linting:**
- ESLint version 9 with Next.js config
- Config file: `eslint.config.mjs` (flat config format)
- Rules: Next.js core web vitals + TypeScript support
- No strict custom rules; relies on Next.js defaults
- Ignored directories: `.next/`, `out/`, `build/`, `node_modules/`

**Imports:**
- Use path aliases: `@/src/` for absolute imports from project root
- Group imports in this order:
  1. React/Next.js framework imports (`import React`, `from 'react'`, `from 'next'`)
  2. Third-party packages (`from '@supabase/supabase-js'`, `from 'zustand'`, `from 'lucide-react'`)
  3. Relative component/module imports (`from '@/src/components'`, `from '@/src/lib'`)
  4. Type imports (use `import type` for TypeScript types)
- Example from `src/app/page.tsx`:
  ```typescript
  'use client';

  import { ResearchMap } from '@/src/components/map';
  import { ReportModal } from '@/src/components/layout';

  export default function Home() { ... }
  ```

**Path Aliases:**
- Configured in `tsconfig.json`: `"@/*": ["./*"]`
- Always use `@/src/` prefix in imports, never relative paths for cross-directory imports
- Example: `import { formatDate } from '@/src/lib/utils'` (not `from '../../../lib/utils'`)

## Error Handling

**Pattern - Try/Catch:**
- Use try/catch for async operations that may fail
- Always check error type before accessing properties
- Log errors with context information
- Return sensible defaults on error (empty array, null, error object)
- Example from `src/lib/supabase.ts`:
  ```typescript
  try {
    const data = await supabase.from('table').select('*');
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];  // sensible default
  }
  ```

**Pattern - Promise Rejection:**
- Use `.catch()` for promise chains
- Example from `src/lib/supabase.ts`:
  ```typescript
  const { data, error } = await supabase.from('table').select('*').single();

  if (error) {
    console.error('Error message:', error);
    return null;
  }
  ```

**Pattern - Zustand Store:**
- Store methods handle errors internally with `try/catch`
- Set error state on failure: `set({ error: message, loading: false })`
- Example from `src/stores/appStore.ts`:
  ```typescript
  fetchSessions: async () => {
    set({ sessionsLoading: true, sessionsError: null });
    try {
      const sessions = await getAllSessions();
      set({ sessions, sessionsLoading: false });
    } catch (error) {
      set({
        sessionsError: error instanceof Error ? error.message : 'Failed to fetch',
        sessionsLoading: false,
      });
    }
  }
  ```

**Pattern - React Components:**
- Components assume props are valid (validation at boundary)
- Use optional chaining for potentially undefined values: `finding?.summary`
- Fallback rendering: `{value || 'fallback'}`
- Example from `src/components/report/FindingCard.tsx`:
  ```typescript
  const hasContent = finding.content && finding.content !== finding.summary;
  const analysisValue = finding.extracted_data?.analysis;
  return <p>{finding.summary || finding.content}</p>;
  ```

**Pattern - Python (Actor):**
- Use logging module with configured logger (see `actor/src/main.py`)
- Exceptions caught and added to `errors` or `warnings` lists
- Example from `actor/src/main.py`:
  ```python
  try:
    # operation
  except Exception as e:
    errors.append(str(e))
    logger.error(f"Error: {e}")
  ```

## Logging

**Framework:**
- JavaScript/TypeScript: `console.error()`, `console.warn()`, `console.log()`
- Python: `logging` module with named loggers

**Patterns:**
- TypeScript errors use `console.error()` with context: `console.error('Error fetching sessions:', error)`
- Warnings use `console.warn()` for non-critical issues
- Progress/info use `console.log()` with phase names
- Python uses `logger.info()`, `logger.error()`, `logger.warn()` with structured messages
- Always log before throwing or returning error states
- No logging in render methods (React components) unless essential
- Log meaningful context: query strings, session IDs, operation names
- Example: `console.log('Phase 4: Extracting findings...');`

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic
- "Why" explanations, not "what" the code does
- Business rule clarifications
- Workarounds or hacks (mark with `// TODO:` or `// HACK:`)
- Section dividers for large files

**Style:**
- Use `// ` for single-line comments
- Use `/* */` for block comments only at top of file (docstrings)
- Keep comments concise and up-to-date
- Example section dividers from `src/hooks/useMapData.ts`:
  ```typescript
  // ============================================
  // TREEMAP HIERARCHY TYPES
  // ============================================
  ```

**JSDoc/TSDoc:**
- Function exports use docstring format (seen in Python `actor/src/main.py`)
- TypeScript interfaces document field purposes via comments or `@param`
- Example from `actor/src/main.py`:
  ```python
  def build_executive_summary(output: ActorOutput) -> ExecutiveSummary:
    """Build executive summary from actor output."""
  ```
- React components document via PropTypes interfaces: `interface ComponentProps { ... }`

## Function Design

**Size:**
- Prefer functions under 50 lines
- If >100 lines, consider breaking into smaller functions
- Private helper methods for complexity extraction
- Example: `extractFindings()` (30 lines) delegates to smaller steps

**Parameters:**
- Maximum 3-4 parameters; use object destructuring for >3
- Optional parameters last or grouped in options object
- Type all parameters explicitly
- Example from `src/lib/research/research-service.ts`:
  ```typescript
  async executeResearch(
    query: string,
    templateType: TemplateType = 'investigative',
    granularity: string = 'standard',
    maxSearches: number = 5,
    options?: { userEmail?: string; persistToDb?: boolean; }
  ): Promise<ResearchResult>
  ```

**Return Values:**
- Always specify explicit return type
- Return early on validation failure
- Promise-based for async operations
- Use `null` for single missing value, empty array `[]` for collections
- Use discriminated union for complex results (status + data pattern)
- Example from `src/lib/research/gemini-client.ts`:
  ```typescript
  async research(query: string): Promise<ResearchResponse>
  async generateJson<T>(prompt: string): Promise<{ data: T }>
  ```

## Module Design

**Exports:**
- Named exports for utilities and functions: `export function formatDate() { }`
- Default exports only for React page components and layout
- Export interfaces alongside implementations
- Group related exports in index files
- Example from `src/components/swiss/index.tsx`:
  ```typescript
  export function SwissCard() { }
  export function SwissCardHeader() { }
  export function SwissCardSection() { }
  ```

**Barrel Files:**
- `index.ts`/`index.tsx` used to aggregate module exports
- One level of indirection only (don't re-export from re-exports)
- Keep imports organized: components first, then utilities
- Example structure:
  ```typescript
  // src/components/swiss/index.tsx
  export { SwissCard, SwissCardHeader } from './SwissCard';
  export { SwissButton } from './SwissButton';
  export { FindingBadge, ConfidenceProgress } from './badges';
  ```

**File Organization:**
- One component per file (except for small related components)
- Utilities grouped by domain in `/lib` directories
- Types defined alongside usage or in dedicated `types/` folder
- Services isolated in `services/` with single responsibility
- Example: `src/lib/research/` contains `research-service.ts`, `gemini-client.ts`, `templates.ts`, `email-service.ts`

## API Boundaries

**TypeScript/Next.js:**
- Route handlers use strict typing: `Request`, `Response`, `NextRequest`, `NextResponse`
- API input validated at route boundary (even though Pydantic used in Python backend)
- Input/output types defined in `src/types/` or service modules

**Python Actor:**
- Use Pydantic `BaseModel` for all input/output schemas
- File: `actor/src/schemas/input.py`, `actor/src/schemas/output.py`
- All fields documented with `Field(description=...)`
- Example from `actor/src/schemas/input.py`:
  ```python
  class ActorInput(BaseModel):
    query: str = Field(..., description="Research question (required)")
    template: str = Field(default="tech_market", description="...")
  ```

---

*Convention analysis: 2026-01-27*
