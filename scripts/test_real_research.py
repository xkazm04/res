#!/usr/bin/env python3
"""
Test real research flow against actual Gemini API.
This script runs research with the real LLM to verify:
1. Prompts produce correctly-typed findings
2. Component renderer handles LLM output properly
3. CSS styling works with real research content

Run from researcher directory:
  cd actor && APIFY_LOCAL_STORAGE_DIR=./storage python -c "exec(open('../scripts/test_real_research.py').read())"
Or:
  cd actor && python ../scripts/test_real_research.py
"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Setup paths - add actor directory to allow "from src.xxx" imports
script_dir = Path(__file__).parent.resolve()
project_dir = script_dir.parent
actor_dir = project_dir / "actor"

# Load .env file from project root BEFORE imports (so config picks up the values)
env_file = project_dir / ".env"
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                value = value.strip().strip('"').strip("'")
                os.environ[key.strip()] = value

if str(actor_dir) not in sys.path:
    sys.path.insert(0, str(actor_dir))

# Import from src package (like the existing tests do)
from src.config import get_settings
from src.clients.gemini import GeminiClient
from src.services.research import ResearchService
from src.services.report import ReportService
from src.services.report_component_renderer import prepare_component_data
from src.services.report_component_styles import get_component_styles
from src.services.report_components import ComponentType, ComponentConfig, render_component


# Test queries for different templates - 2026 predictions focus
TEST_QUERIES = {
    "tech_market": {
        "query": "AI Code Assistants 2026 predictions: GitHub Copilot vs Cursor vs Claude Code market trends",
        "granularity": "quick",
        "max_searches": 4,
    },
    "financial": {
        "query": "NVIDIA stock 2026 outlook: AI chip demand, Blackwell roadmap, investment thesis",
        "granularity": "quick",
        "max_searches": 4,
    },
}


def generate_interactive_html(result: dict, title: str) -> str:
    """Generate interactive HTML report with sidebar navigation."""
    template = result.get("template", "tech_market")
    component_data = prepare_component_data(result)

    css = get_component_styles()

    # View configurations per template - focused on key insights, no stats
    if template == "tech_market":
        views = [
            ("radar", "📡", "Tech Radar", [ComponentType.TECH_RADAR, ComponentType.COMPARISON_TABLE]),
            ("overview", "📊", "Overview", [ComponentType.VERDICT_HERO, ComponentType.KEY_INSIGHTS]),
            ("findings", "🔍", "Findings", [ComponentType.FINDINGS_TABLE]),
            ("analysis", "💡", "Analysis", [ComponentType.EXECUTIVE_SUMMARY, ComponentType.PROS_CONS]),
            ("sources", "📚", "Sources", [ComponentType.SOURCE_LIST]),
        ]
    elif template == "financial":
        views = [
            ("thesis", "💰", "Investment Thesis", [ComponentType.INVESTMENT_THESIS]),
            ("overview", "📊", "Overview", [ComponentType.VERDICT_HERO, ComponentType.KEY_INSIGHTS]),
            ("findings", "🔍", "Findings", [ComponentType.FINDINGS_TABLE]),
            ("analysis", "💡", "Analysis", [ComponentType.EXECUTIVE_SUMMARY, ComponentType.PREDICTION_CARDS]),
            ("sources", "📚", "Sources", [ComponentType.SOURCE_LIST]),
        ]
    else:
        views = [
            ("overview", "📊", "Overview", [ComponentType.VERDICT_HERO, ComponentType.KEY_INSIGHTS]),
            ("findings", "🔍", "Findings", [ComponentType.FINDINGS_TABLE]),
            ("sources", "📚", "Sources", [ComponentType.SOURCE_LIST]),
        ]

    def safe_render(comp_type, data_key):
        try:
            data = component_data.get(data_key, {})
            if not data:
                return ""
            config = ComponentConfig(component_type=comp_type)
            return render_component(comp_type, data, config)
        except Exception as e:
            return f'<!-- Error rendering {comp_type}: {e} -->'

    def render_view(view_id, components):
        html_parts = []
        for comp_type in components:
            data_key = comp_type.value
            rendered = safe_render(comp_type, data_key)
            if rendered and not rendered.startswith("<!--"):
                html_parts.append(rendered)
        if not html_parts:
            html_parts.append('<div class="empty-view">No data available for this view</div>')
        return "\n".join(html_parts)

    # Generate navigation and view panels
    nav_items = "\n".join([
        f'''<button class="nav-item" :class="{{'active': currentView === '{v[0]}'}}" @click="currentView = '{v[0]}'">
            <span class="nav-icon">{v[1]}</span> {v[2]}
        </button>'''
        for v in views
    ])

    view_panels = "\n".join([
        f'''<div class="view-panel" x-show="currentView === '{v[0]}'" x-cloak>
            {render_view(v[0], v[3])}
        </div>'''
        for v in views
    ])

    # Stats
    findings_count = len(result.get("findings", []))
    sources_count = len(result.get("sources", []))
    perspectives_count = len(result.get("perspectives", []))

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        {css}
        [x-cloak] {{ display: none !important; }}
    </style>
</head>
<body>
    <div class="report-shell" x-data="{{ currentView: '{views[0][0]}' }}">
        <aside class="report-sidebar">
            <div class="sidebar-header">
                <span class="sidebar-badge">{template.upper()}</span>
                <h2 class="sidebar-title" style="margin-top: 8px; font-size: 13px;">{title[:40]}...</h2>
            </div>
            <nav class="sidebar-nav">
                {nav_items}
            </nav>
            <div class="sidebar-stats">
                <div class="stat-row"><span>Findings</span><span class="stat-value">{findings_count}</span></div>
                <div class="stat-row"><span>Sources</span><span class="stat-value">{sources_count}</span></div>
                <div class="stat-row"><span>Perspectives</span><span class="stat-value">{perspectives_count}</span></div>
                <div class="stat-row"><span>Generated</span><span class="stat-value">{datetime.now().strftime("%H:%M")}</span></div>
            </div>
        </aside>
        <main class="report-main">
            <header class="report-header-compact">
                <h1 class="report-title-compact">{title}</h1>
                <p class="generated-meta">Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} | Template: {template}</p>
            </header>
            {view_panels}
        </main>
    </div>
</body>
</html>'''
    return html


async def run_research(template: str, config: dict) -> dict:
    """Run actual research using Gemini API."""
    settings = get_settings()

    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY not set. Please set it in environment or .env file.")

    print(f"\n[{template.upper()}] Starting research...")
    print(f"  Query: {config['query'][:60]}...")
    print(f"  API Key: {settings.google_api_key[:10]}...{settings.google_api_key[-4:]}")

    # Initialize clients
    gemini_client = GeminiClient(
        api_key=settings.google_api_key,
        model=settings.gemini_model,
    )

    research_service = ResearchService(
        gemini_client=gemini_client,
        supabase_client=None,
        ocr_service=None,
    )

    # Execute research
    result = await research_service.execute_research(
        query=config["query"],
        template_type=template,
        granularity=config["granularity"],
        max_searches=config["max_searches"],
        save_to_db=False,
        use_cache=False,
    )

    print(f"  Status: {result.get('status')}")
    print(f"  Findings: {len(result.get('findings', []))}")
    print(f"  Sources: {len(result.get('sources', []))}")
    print(f"  Perspectives: {len(result.get('perspectives', []))}")

    # Print finding types
    finding_types = {}
    for f in result.get("findings", []):
        ftype = f.get("finding_type", "unknown")
        finding_types[ftype] = finding_types.get(ftype, 0) + 1
    print(f"  Finding types: {finding_types}")

    return result


async def main():
    """Run real research tests and generate HTML reports."""
    print("=" * 60)
    print("REAL RESEARCH TEST")
    print("Testing against actual Gemini API with updated prompts")
    print("=" * 60)

    output_dir = Path(__file__).parent.parent / "component_examples"
    output_dir.mkdir(exist_ok=True)

    results = {}

    for template, config in TEST_QUERIES.items():
        try:
            result = await run_research(template, config)
            results[template] = result

            # Generate HTML report
            title = f"Real Research: {config['query'][:50]}"
            html = generate_interactive_html(result, title)

            output_file = output_dir / f"real_test_{template}.html"
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(html)

            print(f"  -> Saved: {output_file}")

            # Also save raw JSON for debugging
            import json
            json_file = output_dir / f"real_test_{template}.json"
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, default=str)
            print(f"  -> JSON: {json_file}")

        except Exception as e:
            print(f"\n[{template.upper()}] ERROR: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print("TESTS COMPLETE")
    print(f"Output directory: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
