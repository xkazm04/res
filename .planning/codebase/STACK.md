# Technology Stack

**Analysis Date:** 2026-01-27

## Languages

**Primary:**
- TypeScript 5 - Frontend, Next.js application, API routes
- Python 3.x - Backend research actor (`actor/src/`)

**Secondary:**
- JavaScript - Runtime/build scripts
- HTML/CSS - Template rendering

## Runtime

**Environment:**
- Node.js (inferred from Next.js 16 requirement)
- Python 3.x (specified in actor)

**Package Managers:**
- npm (Node.js) - Version per package-lock.json
- pip (Python) - Dependencies in `actor/requirements.txt`

## Frameworks

**Core:**
- Next.js 16.1.4 - Full-stack React framework with API routes
- React 19.2.3 - UI component library
- Tailwind CSS 4 - Styling

**AI/ML:**
- Genkit 1.27.0 - Google's AI framework
- @genkit-ai/googleai 1.27.0 - Gemini integration plugin
- @genkit-ai/ai 1.27.0 - Core Genkit utilities

**Backend Services (Python):**
- Apify SDK (>=1.6.0) - Task orchestration and actor deployment platform
- google-genai (>=1.0.0) - Google Gemini API client for Python
- Supabase Python SDK (>=2.0.0) - Database client
- PyMuPDF/fitz (pymupdf >=1.25.0) - PDF processing
- httpx (>=0.27.0) - Async HTTP client
- boto3 (>=1.35.0) - AWS S3/CloudFlare R2 API

**Frontend:**
- recharts 3.6.0 - Chart visualization library
- d3 7.9.0 - Data visualization
- d3-shape 3.2.0 - D3 shape utilities
- lucide-react 0.562.0 - Icon library
- zustand 5.0.9 - State management
- @dnd-kit/core 6.3.1 - Drag-and-drop primitives
- @dnd-kit/sortable 10.0.0 - Sortable list functionality
- clsx 2.1.1 - Conditional classname utility
- tailwind-merge 3.4.0 - Tailwind class merging

**Testing & Linting:**
- ESLint 9 - JavaScript/TypeScript linting
- eslint-config-next 16.1.1 - Next.js ESLint configuration

**Data Handling:**
- Pydantic (>=2.10.0) - Data validation and schema (Python)
- date-fns 4.1.0 - Date utilities
- tenacity (>=9.0.0) - Retry logic library (Python)
- python-dotenv (>=1.0.0) - Environment variable loading

**Monitoring & Logging:**
- LangSmith (>=0.1.0) - LLM observability and monitoring

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.89.0 - Real-time database queries, subscriptions, data persistence
- Genkit + @genkit-ai/googleai - Core research engine using Google Gemini with web search grounding
- Apify SDK - Actor deployment, execution, and task management

**Infrastructure:**
- Resend 6.6.0 - Email delivery service
- boto3 - CloudFlare R2 object storage (S3-compatible)
- google-genai - Gemini API with grounding metadata
- OpenRouter API (via httpx) - Vision-based OCR with google/gemini-2.5-flash-preview

## Configuration

**Environment:**
- `.env` file (verified present) - Contains Supabase credentials
- TypeScript paths alias: `@/*` maps to project root
- Environment-based configuration in `actor/src/config.py` using pydantic Settings

**Key Configuration Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client auth
- `GOOGLE_API_KEY` / `GEMINI_API_KEY` - Gemini API authentication
- `OPENROUTER_API_KEY` - OpenRouter vision/OCR API key
- `RESEND_API_KEY` - Email delivery API key
- `LANGSMITH_API_KEY` / `LANGCHAIN_API_KEY` - LLM monitoring
- `SUPABASE_KEY` - Server-side Supabase key
- `CLOUD_RUN_URL` - Cloud Run service endpoint for serverless research dispatch
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` - CloudFlare R2 credentials
- `R2_BUCKET_NAME` - R2 bucket for report storage

**Build:**
- `tsconfig.json` - TypeScript configuration with bundler module resolution
- `next.config.ts` - Next.js build configuration
- Tailwind CSS 4 with PostCSS

## Platform Requirements

**Development:**
- Node.js runtime for Next.js dev server
- Python 3.x with pip for actor development
- Environment variables configured (.env file)

**Production:**
- Vercel or Node.js hosting for Next.js frontend
- Cloud Run or serverless Python hosting for research actor
- Supabase PostgreSQL database
- Cloudflare R2 for report storage
- Google Gemini API access
- Resend email service
- OpenRouter API for vision models

---

*Stack analysis: 2026-01-27*
