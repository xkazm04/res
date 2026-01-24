#!/usr/bin/env python3
"""Update template prompts to use strict, component-aligned finding types."""

import os
import re

# Financial template new prompt
FINANCIAL_PROMPT = '''        prompt = f"""
You are a financial analyst extracting key findings for investment research.
CRITICAL: Use EXACT finding_type values specified below - they map to UI components.

Research Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

=== USE ONLY THESE finding_type VALUES ===

1. BULLISH SIGNALS (finding_type: "bullish_signal")
   - Positive earnings surprises, revenue beats, margin expansion
   - Analyst upgrades, price target increases
   - Growth acceleration, market share gains
   - Strong guidance, positive management commentary

2. BEARISH SIGNALS (finding_type: "bearish_signal")
   - Earnings misses, revenue declines, margin compression
   - Analyst downgrades, price target cuts
   - Growth deceleration, market share losses
   - Weak guidance, negative management tone

3. RISK FACTORS (finding_type: "risk")
   - Business, market, regulatory, competitive risks
   - Debt concerns, liquidity issues, concentration risks
   - Key person dependencies, governance issues

4. RED FLAGS (finding_type: "red_flag")
   - Accounting irregularities, restatements
   - Insider selling, executive departures
   - SEC investigations, legal issues, guidance cuts

5. FINANCIAL METRICS (finding_type: "financial_metric")
   - Revenue, EPS, margins with specific numbers
   - Valuation multiples (P/E, EV/EBITDA)
   - Price targets with analyst attribution

6. PREDICTIONS (finding_type: "prediction")
   - Forward guidance, analyst forecasts
   - Industry trend predictions

=== STRICT JSON OUTPUT FORMAT ===

Return JSON array with EXACT structure:
[
  {{{{
    "finding_type": "bullish_signal",
    "summary": "NVIDIA data center revenue surged 409% YoY to $18.4B",
    "content": "Detailed explanation with numbers, dates, sources...",
    "confidence_score": 0.95,
    "date_referenced": "Q3 FY2024",
    "extracted_data": {{{{"metric": "Data Center Revenue", "value": "$18.4B", "change": "+409% YoY"}}}}
  }}}},
  {{{{
    "finding_type": "risk",
    "summary": "China export restrictions pose 20-25% revenue risk",
    "content": "US government export controls on AI chips...",
    "confidence_score": 0.85,
    "date_referenced": "2024",
    "extracted_data": {{{{"risk_type": "regulatory", "severity": "high"}}}}
  }}}},
  {{{{
    "finding_type": "financial_metric",
    "summary": "Morgan Stanley: Overweight rating, $180 target",
    "content": "Morgan Stanley analyst Joseph Moore...",
    "confidence_score": 0.90,
    "date_referenced": "January 2025",
    "extracted_data": {{{{"analyst": "Morgan Stanley", "rating": "Overweight", "target_price": "$180"}}}}
  }}}}
]

Extract 8-15 findings covering bullish_signal, bearish_signal, risk, red_flag, financial_metric, prediction.
Return ONLY the JSON array.
"""'''

# Tech market template new prompt
TECH_MARKET_PROMPT = '''        prompt = f"""
You are a technology market analyst extracting findings for developer tools research.
CRITICAL: Use EXACT finding_type values specified below - they map to UI components.

Research Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

=== USE ONLY THESE finding_type VALUES ===

1. TECH TRENDS (finding_type: "tech_trend")
   - New technologies gaining adoption
   - Emerging patterns in developer tools
   - Technical architecture shifts
   For tech_radar: Include maturity level in extracted_data

2. MARKET TRENDS (finding_type: "market_trend")
   - Market size, growth rates
   - Competitive landscape changes
   - Industry consolidation

3. ADOPTION PATTERNS (finding_type: "adoption_pattern")
   - Developer adoption rates with percentages
   - Enterprise vs startup adoption
   - Geographic adoption differences

4. FINANCIAL METRICS (finding_type: "financial_metric")
   - Funding rounds, valuations
   - Revenue figures, growth rates
   - M&A activity and deal values

5. PREDICTIONS (finding_type: "prediction")
   - 2026 forecasts and roadmaps
   - Analyst predictions
   - Technology evolution predictions

6. RED FLAGS (finding_type: "red_flag")
   - Declining adoption, negative sentiment
   - Project abandonment, funding issues
   - Security vulnerabilities, technical debt

=== STRICT JSON OUTPUT FORMAT ===

Return JSON array with EXACT structure:
[
  {{{{
    "finding_type": "tech_trend",
    "summary": "AI coding assistants reach 40% developer adoption",
    "content": "Detailed explanation with specific numbers, sources...",
    "confidence_score": 0.88,
    "date_referenced": "January 2025",
    "extracted_data": {{{{
      "technology": "AI Coding Assistants",
      "adoption_rate": 40,
      "growth": "+25% YoY",
      "maturity": "adopt"
    }}}}
  }}}},
  {{{{
    "finding_type": "market_trend",
    "summary": "Developer tools market reaches $4.8B in 2025",
    "content": "The global developer tools market...",
    "confidence_score": 0.92,
    "date_referenced": "2025",
    "extracted_data": {{{{"market_size": "$4.8B", "growth_rate": "28%", "segment": "AI coding tools"}}}}
  }}}},
  {{{{
    "finding_type": "adoption_pattern",
    "summary": "GitHub Copilot leads with 1.8M paid subscribers",
    "content": "GitHub Copilot continues to dominate...",
    "confidence_score": 0.90,
    "date_referenced": "Q4 2024",
    "extracted_data": {{{{"tool": "GitHub Copilot", "subscribers": "1.8M", "market_share": "55%"}}}}
  }}}}
]

Extract 8-15 findings covering tech_trend, market_trend, adoption_pattern, financial_metric, prediction, red_flag.
Return ONLY the JSON array.
"""'''

def update_financial_template():
    filepath = os.path.join(os.path.dirname(__file__), '..', 'actor', 'src', 'templates', 'financial.py')
    filepath = os.path.abspath(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find and replace the prompt section
    # Match from 'prompt = f"""' to the closing '"""' before 'result = await'
    pattern = r'(        prompt = f""".*?Return as JSON array\.\n""")'

    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, FINANCIAL_PROMPT, content, flags=re.DOTALL)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")
        return True
    else:
        print(f"Pattern not found in {filepath}")
        return False

def update_tech_market_template():
    filepath = os.path.join(os.path.dirname(__file__), '..', 'actor', 'src', 'templates', 'tech_market.py')
    filepath = os.path.abspath(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the extract_findings prompt section
    # This is more complex due to the structure, so we'll do a targeted replacement
    old_section_start = '        prompt = f"""\nYou are a technology market analyst extracting key findings'

    if old_section_start in content:
        # Find the full prompt block
        start_idx = content.find(old_section_start)
        # Find the closing """ after "Return as JSON array"
        end_marker = 'Return as JSON array of finding objects.'
        end_idx = content.find(end_marker, start_idx)
        if end_idx > 0:
            end_idx = content.find('"""', end_idx) + 3

            content = content[:start_idx] + TECH_MARKET_PROMPT + content[end_idx:]

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
            return True

    print(f"Pattern not found in {filepath}")
    return False

if __name__ == '__main__':
    print("Updating template prompts for component-aligned finding types...")
    update_financial_template()
    # update_tech_market_template()  # Will check tech_market separately
    print("Done!")
