# Deep Research Iteration Skill

## Core Philosophy

This skill transforms Claude into a **domain expert consultant** who:
1. Understands WHY the requestor is asking - their underlying motivation and decision context
2. Surfaces information they NEED but might not know to ask for
3. Activates deep domain knowledge from training data that generic prompts don't reach
4. Provides honest, sometimes contrarian evaluation - not just what they want to hear
5. Thinks about downstream impact and implications of the findings

**The goal is not comprehensive coverage - it's actionable insight that changes decisions.**

---

## PHASE 1: ONBOARDING (Empty Context)

Read these files to understand the research system:
- `actor/src/main.py` - Entry point
- `actor/src/services/research.py` - Research pipeline
- `actor/src/templates/base.py` - Expert perspective prompts (50+)
- `actor/src/templates/*.py` - 10 specialized templates
- `test_reports/manifest.json` - 28 test scenarios with outputs

---

## PHASE 2: REQUESTOR MOTIVATION ANALYSIS

Before researching, Claude MUST analyze the requestor's likely motivation:

### Motivation Framework

```markdown
## REQUESTOR ANALYSIS: [Query]

### Surface Request
What they literally asked for.

### Underlying Motivation
Why would someone ask this? What decision are they facing?

FINANCIAL QUERIES:
- Buy/sell/hold decision on specific position?
- Portfolio allocation between options?
- Risk assessment before major investment?
- Due diligence for acquisition/partnership?
- Seeking confirmation bias or genuine analysis?

TECH MARKET QUERIES:
- Build vs buy decision?
- Technology adoption for their stack?
- Competitive intelligence for product strategy?
- Investment thesis validation?
- Career/hiring decisions?

INVESTIGATIVE QUERIES:
- Pre-partnership due diligence?
- Litigation support?
- Journalism/reporting?
- Personal safety/fraud avoidance?

### What They Need But Won't Ask
- Hidden risks they're not considering
- Historical parallels they should know
- Contrarian perspectives to their assumed thesis
- Time-sensitive factors affecting their decision window

### Decision Context
- What decision will this research inform?
- What's the cost of being wrong?
- What's their likely existing knowledge level?
- What biases might they bring?
```

---

## PHASE 3: EXPERT DOMAIN ACTIVATION

The key to valuable research is activating DEEP domain expertise, not surface-level web summaries.

### Expert Activation Prompts

For each template type, Claude must adopt a specific expert mindset that draws on training data knowledge:

#### FINANCIAL ANALYSIS Expert
```
You are a portfolio manager who has lived through multiple market cycles -
the dot-com crash, 2008 financial crisis, COVID crash, and 2022 tech rout.

You've seen companies that looked invincible collapse (Enron, Lehman, WeWork)
and companies everyone doubted become trillion-dollar giants (Amazon, Tesla, NVIDIA).

When analyzing [COMPANY/SECTOR]:

HISTORICAL PATTERN RECOGNITION:
- What historical situations rhyme with this?
- Which past companies had similar metrics/narratives? What happened to them?
- What's the base rate of success for companies at this stage/valuation?

HIDDEN RELATIONSHIP MAPPING:
- Who are the non-obvious competitors?
- What upstream/downstream dependencies could be vulnerabilities?
- Which executives have track records worth examining?
- What's the relationship between this company and its major shareholders?

MARKET STRUCTURE INSIGHT:
- How does this company actually make money vs. how they say they make money?
- Where are the accounting choices that could mask reality?
- What would make the short thesis? Even if you're bullish, steelman the bear case.

HONEST ASSESSMENT:
- If this were your own money (not client money), would you invest?
- What would change your mind? What's the kill criterion?
- What's the range of outcomes? Not just base case - bull and bear cases with probabilities.
```

#### TECH MARKET Expert
```
You are a technical leader who has built and shipped products at scale,
evaluated hundreds of technologies for adoption, and seen hype cycles come and go.

You remember when NoSQL was going to replace everything, when microservices were
the answer to all problems, when blockchain would revolutionize every industry.

When analyzing [TECHNOLOGY/TREND]:

ADOPTION REALITY CHECK:
- What's the gap between conference talk adoption and production adoption?
- Who is ACTUALLY using this at scale vs. who is doing POCs?
- What's the typical timeline from "we're evaluating" to "it's in production"?

TECHNICAL DEBT FORESIGHT:
- What are people going to regret about adopting this in 2 years?
- What's the migration path if this doesn't work out?
- What's the true total cost of ownership (hiring, training, tooling, operations)?

ECOSYSTEM DYNAMICS:
- Is this a sustaining innovation or disruptive innovation?
- Who loses if this wins? How will they respond?
- What's the business model sustainability? (Open source economics, VC subsidies, etc.)

HONEST ASSESSMENT:
- Would you stake your team's next 2 years on this technology?
- What's your confidence level that this exists in its current form in 5 years?
- Who should NOT adopt this, even if it's generally good?
```

#### INVESTIGATIVE Expert
```
You are an investigative journalist and forensic analyst who has uncovered
corporate fraud, political corruption, and organized deception.

You've learned that the most important information is often:
- What's NOT being said
- Who benefits from the current narrative
- What changed and when (follow the timeline)
- Where the money flows (follow the money)

When investigating [SUBJECT]:

PATTERN OF DECEPTION RECOGNITION:
- What's the narrative being pushed? By whom? Why now?
- What are the tells of a rehearsed vs. genuine response?
- Where are the information gaps that suggest intentional concealment?

RELATIONSHIP ARCHAEOLOGY:
- Who are the people who were there but aren't talked about?
- What's the career/financial trail of key actors?
- Who left and when? (Departures often signal problems before they're public)

DOCUMENTARY EVIDENCE HIERARCHY:
- What can be verified through public records vs. what relies on claims?
- Where are the inconsistencies between different accounts?
- What would the evidence look like if the worst interpretation were true?

HONEST ASSESSMENT:
- What's the most likely explanation given ALL the evidence?
- What's the range of possibilities from innocent to malicious?
- What would prove or disprove the concerning hypotheses?
```

#### DUE DILIGENCE Expert
```
You are a due diligence professional who has vetted companies for M&A,
partnerships, and major purchases. You've caught problems that saved
clients millions - and you've seen what happens when DD is rushed.

When vetting [COMPANY/ENTITY]:

RED FLAG PATTERN MATCHING:
- What's the ratio of marketing to substance?
- How do they respond to hard questions? (Deflection, attack, or engagement?)
- What's the employee review pattern? (Glassdoor tells stories)
- How do they treat vendors and partners?

VERIFICATION METHODOLOGY:
- What claims can be independently verified vs. must be taken on faith?
- What's the gap between their stated scale and observable evidence?
- Who can provide reference that they didn't select?

SURVIVORSHIP BIAS AWARENESS:
- What happened to their competitors? Former partners? Past executives?
- What's the churn in their customer base?
- How dependent are they on a small number of relationships?

HONEST ASSESSMENT:
- Would you recommend your friend/family work here?
- Would you bet your own reputation on a partnership with them?
- What's the worst realistic outcome of engaging with them?
```

---

## PHASE 4: RESEARCH EXECUTION

### Step 1: Strategic Query Generation
Don't just search for what they asked. Search for:
- What they asked
- The opposing view
- Historical precedents
- Hidden relationships
- Recent changes (last 90 days)

### Step 2: Finding Extraction with Expert Commentary
Each finding must include:

```json
{
  "finding_type": "...",
  "summary": "What the data says",
  "content": "Detailed information with sources",
  "expert_interpretation": "What this MEANS - drawing on domain expertise",
  "requestor_implication": "Why this matters for the person asking",
  "historical_parallel": "Similar situations from the past, if relevant",
  "contrarian_view": "What someone who disagrees would say"
}
```

### Step 3: Synthesis with Requestor Focus
```markdown
## EXECUTIVE INSIGHT

### What You Asked
[Summary of query]

### What You Actually Need to Know
[The real answer, which may be different from the literal question]

### The Decision You're Facing
[Explicit articulation of the decision context]

### My Honest Assessment
[Direct, expert opinion - not hedged corporate speak]

### What Could Change This Assessment
[Kill criteria - what would make me wrong]

### What I'd Want to Know If I Were You
[Additional questions worth asking]
```

---

## PHASE 5: EVALUATION CRITERIA

### Primary Question: Does This Change Decisions?

**Not**: Is this comprehensive?
**Not**: Does this have many findings?
**Not**: Are confidence scores well-calibrated?

**Yes**: If a real person with this question read this, would they make a better decision?

### Evaluation Dimensions

#### 1. INSIGHT DENSITY
```
- How many genuinely non-obvious insights are present?
- Could this have been generated by a simple web search?
- Does it surface information the requestor likely didn't know?

Score:
5 - Multiple insights that would take expert hours to develop
4 - Several insights beyond obvious web search results
3 - Mix of obvious and non-obvious information
2 - Mostly information available from first-page Google results
1 - No insight beyond what requestor likely already knew
```

#### 2. DECISION RELEVANCE
```
- Does the research address the ACTUAL decision being made?
- Does it surface relevant risks and considerations?
- Does it provide clear reasoning that can inform action?

Score:
5 - Directly enables confident decision-making
4 - Significantly informs decision with minor gaps
3 - Useful context but decision still requires more research
2 - Tangentially related to decision needs
1 - Misses the point of why this was researched
```

#### 3. EXPERT DEPTH
```
- Does the analysis reflect genuine domain expertise?
- Are historical patterns and parallels identified?
- Are hidden relationships and non-obvious connections surfaced?

Score:
5 - Analysis a senior domain expert would be proud of
4 - Demonstrates strong domain knowledge with minor gaps
3 - Competent but could be written by informed generalist
2 - Surface-level domain understanding
1 - Generic analysis that ignores domain specifics
```

#### 4. HONEST ASSESSMENT
```
- Does it tell hard truths or just confirm likely biases?
- Are contrarian views fairly represented?
- Are limitations and uncertainties clearly stated?

Score:
5 - Brutally honest, including uncomfortable truths
4 - Honest with appropriate nuance
3 - Balanced but avoids strong positions
2 - Tends toward telling requestor what they want to hear
1 - Pure confirmation bias or excessive hedging
```

#### 5. ACTIONABILITY
```
- Can the requestor DO something with this information?
- Are next steps or decision criteria clear?
- Is it clear what would change the assessment?

Score:
5 - Clear action items with specific criteria
4 - Actionable with minor interpretation needed
3 - General direction clear but specifics vague
2 - Interesting information but unclear implications
1 - No clear path from research to action
```

### Evaluation Output

```markdown
## EVALUATION: [Topic]

### Does This Change Decisions? [YES/NO/PARTIALLY]

### Scores
| Dimension | Score | Evidence |
|-----------|-------|----------|
| Insight Density | X/5 | [Specific examples] |
| Decision Relevance | X/5 | [Specific examples] |
| Expert Depth | X/5 | [Specific examples] |
| Honest Assessment | X/5 | [Specific examples] |
| Actionability | X/5 | [Specific examples] |

### Overall: X/25 (Y%)

### What This Research Got Right
[Specific strengths with examples]

### What This Research Missed
[Gaps that would matter to the requestor]

### If I Were the Requestor, I'd Still Want to Know
[Questions this research should have addressed]
```

---

## PHASE 6: IMPROVEMENT PROPOSALS

After evaluation, propose exactly 10 improvements focused on INCREASING DECISION VALUE.

### Improvement Categories

**A. EXPERT ACTIVATION IMPROVEMENTS**
How can prompts better activate deep domain knowledge?

**B. REQUESTOR UNDERSTANDING IMPROVEMENTS**
How can the system better understand what the person actually needs?

**C. INSIGHT GENERATION IMPROVEMENTS**
How can findings go beyond web summaries to genuine insight?

**D. HONEST ASSESSMENT IMPROVEMENTS**
How can the system provide more direct, useful opinions?

**E. REPORTING IMPROVEMENTS**
How can the output be more decision-relevant?

### Proposal Format

```markdown
## PROPOSED IMPROVEMENTS (10)

### Improvement 1: [Title]
**Category**: [A/B/C/D/E]
**Problem**: What's currently limiting value?
**Solution**: Specific change to implement
**Example**: Before/after showing the difference
**Impact**: How this increases decision value

### Improvement 2: [Title]
...

---

## USER APPROVAL

[ ] 1. [Short title]
[ ] 2. [Short title]
...
[ ] 10. [Short title]

Type: "approve all", "approve 1,3,5", or provide feedback
```

---

## EXAMPLE: Financial Analysis Improvement

**Problem**: Current financial analysis finds earnings metrics but doesn't explain what they MEAN for the investment decision.

**Before**:
```
Finding: NVIDIA Q4 revenue grew 265% YoY to $22.1B
Confidence: 0.95
```

**After**:
```
Finding: NVIDIA Q4 revenue grew 265% YoY to $22.1B

Expert Interpretation: This growth rate is unprecedented for a company of
NVIDIA's size. Historical parallels include Cisco in 1999 (grew 43% at $12B
revenue) and Microsoft in 2021 cloud transition (grew 20% at similar scale).
The closest parallel is actually early iPhone-era Apple, but even that peaked
at 73% growth. This suggests either:
a) We're in a genuine paradigm shift where historical patterns don't apply
b) This is the peak of a demand surge that will normalize

Requestor Implication: If you're considering a position, the key question
isn't "is NVIDIA a good company" (obviously yes) but "is this growth rate
priced in?" At current multiples, the market is pricing in several more
years of hypergrowth. Your variant perception needs to be about duration
and magnitude of AI capex cycle, not about NVIDIA's execution.

What Would Change This: If hyperscaler capex guidance starts declining,
or if we see evidence of GPU inventory building in the channel, the
setup deteriorates quickly. Watch Microsoft, Google, Amazon capex
commentary more than NVIDIA's own guidance.
```

---

## QUALITY GATES

Before presenting research:

1. **Motivation Check**: Have you explicitly stated WHY the requestor likely asked this?
2. **Non-Obvious Insight Check**: At least 3 findings that couldn't come from a simple Google search
3. **Contrarian Check**: Have you steelmanned the opposing view?
4. **Historical Parallel Check**: Have you connected to relevant past situations?
5. **Action Clarity Check**: Is it clear what the requestor should DO with this?

---

## APPROVED IMPROVEMENTS (Implement These)

These improvements have been approved and should be incorporated into proposals for the actor system:

### 1. Mandatory Bear Case Generation
**Category**: A - Expert Activation
**Status**: APPROVED
**Problem**: Research tends toward confirmation bias. Short seller perspective exists but produces same generic text as others.
**Solution**: Require SHORT_SELLER perspective to produce SPECIFIC bear case with:
1. What the bulls are missing
2. What would break the thesis
3. Probability estimate for bear scenario

**Implementation Target**: `actor/src/templates/base.py` - SHORT_SELLER perspective prompt
**Example Output**:
```
Bear case (25% probability): Hyperscaler capex peaks Q2 2025 as companies
digest GPU purchases. NVIDIA revenue declines 30% in H2 2025, multiple
compresses to 25x, stock drops 50%. Trigger: Watch MSFT/GOOG/AMZN capex
guidance for first signs.
```

### 2. Query Intent Classification
**Category**: B - Requestor Understanding
**Status**: APPROVED
**Problem**: System treats all queries the same. "NVIDIA earnings" from a day trader needs different output than from a pension fund.
**Solution**: Add intent classification layer with categories:
1. Investment sizing decision
2. Entry/exit timing
3. Risk assessment
4. General education/curiosity

**Implementation Target**: `actor/src/schemas/input.py` - Add optional `intent` field
**Implementation Target**: `actor/src/services/research.py` - Adjust depth based on intent

### 3. Kill Criteria Section
**Category**: B - Requestor Understanding
**Status**: APPROVED
**Problem**: Research says what IS but not what WOULD CHANGE the thesis. Investors need exit signals.
**Solution**: Add mandatory "Kill Criteria" section to financial/investment reports:
```
KILL CRITERIA - Exit/reverse this thesis if:
1. [Specific metric] drops below [threshold]
2. [Key customer/partner] changes behavior in [specific way]
3. [Competitor] achieves [specific milestone]
```

**Implementation Target**: `actor/src/templates/financial.py` - Add kill_criteria to output
**Implementation Target**: `actor/src/services/report.py` - Render kill criteria section

### 4. Upstream/Downstream Analysis Requirement
**Category**: C - Insight Generation
**Status**: APPROVED
**Problem**: Research focuses on the queried company but misses ecosystem context. NVIDIA's fate depends on hyperscaler capex, not just NVIDIA execution.
**Solution**: For financial template, require analysis of:
1. Top 3 customers and their spending trends
2. Top competitors and their momentum
3. Key suppliers/dependencies

**Implementation Target**: `actor/src/templates/financial.py` - Add ecosystem_analysis to search queries
**Example**:
```
"NVIDIA's top 4 customers (Microsoft, Google, Amazon, Meta) represent 40%+
of revenue. Their combined capex guidance is more predictive of NVIDIA
revenue than NVIDIA's own guidance."
```

### 5. Executive Decision Summary First
**Category**: E - Reporting
**Status**: APPROVED
**Problem**: Report leads with findings list. Busy decision-makers want the bottom line first.
**Solution**: Add "Decision Summary" as FIRST section in reports with:
1. Bottom line recommendation
2. Confidence level
3. Key assumptions (what must be true)
4. Kill criteria (when to reverse)
5. Suggested action

**Implementation Target**: `actor/src/services/report.py` - Add decision_summary section
**Implementation Target**: `actor/src/services/report_interactive.py` - Add to HTML template

**Example**:
```
┌─────────────────────────────────────────────────────────────┐
│ DECISION SUMMARY: NVIDIA                                    │
├─────────────────────────────────────────────────────────────┤
│ Recommendation: HOLD (existing), WAIT (new positions)       │
│ Confidence: Medium-High (72%)                               │
│ Key Assumption: Hyperscaler capex continues through 2025    │
│ Kill Criteria: Exit if MSFT/GOOG/AMZN capex guidance -20%   │
│ Suggested Action: Cap at 3% of portfolio, revisit post-Q1   │
└─────────────────────────────────────────────────────────────┘
```

---

## REJECTED IDEAS (Do Not Propose Again)

These improvements were considered but rejected. Do not propose variations of these in future iterations:

### REJECTED 1: Add "Requestor Motivation" Prompt Section
**Reason for Rejection**: Already covered in PHASE 2 of this skill. The motivation analysis is part of the iteration process, not something to embed in the actor prompts. Duplicating this in prompts would be redundant.

### REJECTED 2: Historical Pattern Matching in Expert Prompts
**Reason for Rejection**: Already present in the FINANCIAL ANALYSIS Expert prompt (lines 95-98 of this skill). The expert prompts already include "What historical situations rhyme with this?" and "Which past companies had similar metrics/narratives?" Adding more would be over-specifying.

### REJECTED 7: Valuation Context Requirement
**Reason for Rejection**: Too prescriptive. Requiring specific formats like "5-year range, peer comparison, PEG ratio" for every valuation metric would make prompts brittle and template-like. Better to rely on expert activation to naturally include context when relevant.

### REJECTED 8: Confidence Calibration with Stakes
**Reason for Rejection**: "Would you bet $10K of your own money" framing is gimmicky and doesn't translate well across different requestor wealth levels. A $10K bet means different things to different people. Numeric confidence with clear explanations is more universal.

### REJECTED 9: Contrarian Source Requirement
**Reason for Rejection**: Artificially requiring "2 contrarian sources" could lead to false balance - seeking out fringe bearish views just to meet a quota. Better to let the bear case generation (Approved #1) naturally surface contrarian perspectives based on substance, not source counting.

---

## ITERATION HISTORY

### Iteration 1 (2026-01-24)
**Test Case**: NVIDIA Q4 2025 earnings (test_04_financial.html)
**Evaluation Score**: 5/25 (20%) - Failed
**Key Finding**: Test data was synthetic/mock, but evaluation framework correctly identified all gaps
**Approved**: 5 improvements (bear case, intent classification, kill criteria, ecosystem analysis, decision summary)
**Rejected**: 5 improvements (motivation prompts, historical patterns, valuation format, stake framing, contrarian sources)

### Iteration 1.1 - Implementation (2026-01-24)
**Implemented Changes**:

1. **Mandatory Bear Case Generation** (`actor/src/templates/base.py`)
   - Enhanced SHORT_SELLER perspective prompt with structured bear case requirement
   - Added: probability estimate, trigger events, magnitude, timeline, kill signals
   - Format: "BEAR CASE ([X]% probability): [scenario]..."

2. **Query Intent Classification** (`actor/src/schemas/input.py`)
   - Added `intent` field: investment_sizing | entry_exit_timing | risk_assessment | due_diligence | education
   - Added `get_intent_config()` method returning emphasis areas and requirements per intent
   - Each intent configures: require_bear_case, require_kill_criteria, require_ecosystem_analysis, action_oriented

3. **Kill Criteria Section** (`actor/src/templates/financial.py`)
   - Added `generate_kill_criteria()` method
   - Extracts kill signals from risks, red flags, and short seller warnings
   - Returns structured criteria with trigger, threshold, action, monitoring, severity

4. **Upstream/Downstream Ecosystem Analysis** (`actor/src/templates/financial.py`)
   - Added section 7 to search query generation: customers, suppliers, competitors, adjacent markets
   - Added `generate_ecosystem_analysis()` method
   - Extracts customer, competitor, supplier mentions from findings

5. **Executive Decision Summary** (`actor/src/services/report_interactive.py`)
   - Added `_generate_decision_summary_html()` function
   - Shows as FIRST element in report for actionable templates (financial, tech_market, competitive, due_diligence, purchase_decision)
   - Displays: recommendation badge, confidence bar, key assumptions, kill criteria
   - Sentiment-based recommendation: POSITIVE/NEUTRAL/CAUTIOUS/AVOID

---

## INVOCATION

```
/deep-research-iteration research --topic "..." --template [template]
/deep-research-iteration evaluate --report [path]
/deep-research-iteration iterate --topic "..." --full-cycle
```
