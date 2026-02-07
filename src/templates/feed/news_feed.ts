/**
 * News Feed Discovery Template Configuration
 *
 * Template for discovering research-worthy topics from multiple news sources.
 * Focus on extracting verifiable CLAIMS (not headlines) that can be:
 * - Debunked, challenged, or verified
 * - Analyzed for bias and perspective
 * - Used as direct input to research templates
 *
 * Variables:
 * - {{query}} - Optional: specific topic focus (default: general news)
 * - {{source}} - Optional: specific source slug or "all" (default: all)
 * - {{period}} - Optional: time period (default: "last 24 hours")
 */

import { TemplateConfig } from '../types';

export const newsFeedConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'news_feed',
  templateName: 'News Feed Discovery',
  description:
    'Extract research-worthy claims from news sources. Focuses on verifiable claims, bias detection, and generating research queries.',

  // ---- Search Phase Configuration ----
  searchIntro: `You are a research assistant specializing in extracting VERIFIABLE CLAIMS from news coverage.

Your goal is NOT to collect headlines, but to identify claims that:
1. Can be fact-checked, challenged, or debunked
2. Make specific assertions about facts, events, or relationships
3. Have clear research potential for deeper investigation

## Variables
- Query focus: {{query}} (if "general", look for claims across all topics)
- Source filter: {{source}} (if "all", search all 10 sources below)
- Time period: {{period}}

## Sources to Search
Search these sources using their site: patterns:
1. Twitter/X (site:twitter.com OR site:x.com) - Viral claims, breaking assertions
2. BBC (site:bbc.com/news) - World news claims, official statements
3. Reuters (site:reuters.com) - Breaking claims, market assertions
4. TechCrunch (site:techcrunch.com) - Tech claims, funding assertions
5. Bloomberg (site:bloomberg.com) - Financial claims, market predictions
6. NYT (site:nytimes.com) - Investigative claims, policy assertions
7. Guardian (site:theguardian.com) - Investigative journalism claims
8. AP News (site:apnews.com) - Wire claims, official statements
9. Al Jazeera (site:aljazeera.com) - International claims, underreported assertions
10. Reddit (site:reddit.com r/news OR r/worldnews) - Viral claims, disputed stories

## Source Bias Reference (use for source_bias field)
- **left**: Al Jazeera, Guardian
- **center-left**: NYT, BBC, AP News, Reuters
- **center**: TechCrunch, Bloomberg
- **center-right**: (none in default sources)
- **right**: (none in default sources)
- Twitter/Reddit vary by account/subreddit`,

  searchAngles: [
    {
      name: 'FACTUAL CLAIMS TO VERIFY',
      items: [
        'What specific assertions are being made that can be fact-checked?',
        'What numerical claims (statistics, amounts, dates) are being reported?',
        'What cause-effect relationships are being claimed?',
      ],
    },
    {
      name: 'DISPUTED OR CONTROVERSIAL CLAIMS',
      items: [
        'What claims are being challenged or contradicted by other sources?',
        'What stories have multiple conflicting versions?',
        'What official statements are being disputed?',
      ],
    },
    {
      name: 'ACTOR-RELATED CLAIMS',
      items: [
        'What claims involve specific people, organizations, or governments?',
        'What allegations are being made about specific actors?',
        'What relationships between actors are being claimed?',
      ],
    },
    {
      name: 'EVENT CLAIMS',
      items: [
        'What claims about recent events can be verified?',
        'What timeline assertions are being made?',
        'What claims about outcomes or consequences are being reported?',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Search 3-4 sources, extract 2-3 claims each (8-12 total)',
    standard: 'Search all 10 sources, extract 3-5 claims each (30-50 total)',
    deep: 'Search all sources thoroughly, extract 5-7 claims each (50-70 total)',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro: `Extract VERIFIABLE CLAIMS from your search results - not just headlines.

## CRITICAL: Claim Extraction (not headline copying)
Transform headlines into verifiable claims:
- BAD: "Trump announces new tariffs" (headline)
- GOOD: "Trump administration claims 25% tariffs on Chinese goods will reduce trade deficit" (verifiable claim)

## Research Template Mapping
Based on the claim type, suggest which research template to use:
- **debunk_claim**: Factual assertions, statistics, cause-effect claims
- **actor_investigation**: Claims about specific people/organizations
- **event_timeline**: Claims about sequences of events, timelines
- **policy_analysis**: Claims about policy effects, government actions
- **financial_investigation**: Claims about money, markets, transactions
- **controversy_analysis**: Disputed claims, multiple perspectives

## Research Query Generation
Generate a single research query that:
1. Combines the key question(s) the claim raises
2. Can be directly used in research templates
3. Is specific enough to yield actionable results
Example: "What evidence supports or contradicts the claim that X caused Y?"

## Debunkability Scale (1-5)
Score how easily the claim can be verified:
- **5**: Easily verifiable with public data (statistics, dates, quotes)
- **4**: Verifiable with some research (policy documents, records)
- **3**: Requires moderate investigation (multiple sources, expert analysis)
- **2**: Difficult to verify (private information, conflicting accounts)
- **1**: Nearly impossible to verify (classified info, no public records)

## IMPORTANT: Save Topics via API
After extracting topics, you MUST call the API to save them:

\`\`\`bash
curl -X POST http://localhost:3001/api/topics/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "topics": [
      {
        "sourceSlug": "bbc",
        "title": "Original headline for reference",
        "description": "Brief context about the story",
        "sourceUrl": "https://...",
        "signals": ["breaking"],
        "claim": "The specific verifiable claim extracted from the story",
        "researchQuery": "What evidence supports the claim that X caused Y?",
        "suggestedTemplate": "debunk_claim",
        "sourceBias": "center-left",
        "debunkable": 4
      }
    ]
  }'
\`\`\``,

  findingTypes: [
    {
      name: 'research_topic',
      displayName: 'Research Topic',
      description:
        'A verifiable claim extracted from news that can be researched. Must include claim, research query, template suggestion, bias, and debunkability.',
      extractedDataSchema: `{
  "sourceSlug": "bbc|reuters|twitter|...",
  "title": "Original headline",
  "description": "Brief context",
  "sourceUrl": "https://...",
  "signals": ["breaking", "trending", "controversial"],
  "claim": "The specific verifiable claim",
  "researchQuery": "Research question based on the claim",
  "suggestedTemplate": "debunk_claim|actor_investigation|event_timeline|policy_analysis|financial_investigation|controversy_analysis",
  "sourceBias": "left|center-left|center|center-right|right",
  "debunkable": 1-5
}`,
      analysisFallback:
        'This claim requires investigation to determine its veracity and implications.',
    },
  ],

  extractionGuidelines: `## CRITICAL: Extract CLAIMS, not headlines

### Required Fields for Each Topic
1. **title**: Keep original headline for reference
2. **claim**: Extract the VERIFIABLE CLAIM (most important!)
3. **researchQuery**: Generate a research question that can investigate this claim
4. **suggestedTemplate**: Choose the best template for this type of claim
5. **sourceBias**: Note the source's political leaning
6. **debunkable**: Score 1-5 on verifiability
7. **signals**: Classify urgency/engagement

### Signal Definitions (unchanged)
- **breaking**: Developing story, happened within 24 hours, high urgency
- **trending**: High engagement, widely discussed
- **controversial**: Multiple perspectives, disputed claims

### Quality Checklist
- [ ] Is this a claim that can be verified/debunked, not just a headline?
- [ ] Does the research query enable meaningful investigation?
- [ ] Is the template suggestion appropriate for the claim type?
- [ ] Is the debunkability score justified?
- [ ] Is the source bias correctly identified?

### Prioritize Topics That Are:
1. High debunkability (4-5) - Can actually be researched
2. Controversial or disputed - Multiple perspectives exist
3. Actor-specific - Involves named entities that can be investigated
4. Time-bound - Has clear dates/timeframes to verify

ALWAYS call the API at the end to save all discovered topics.`,

  analysisInstruction: `Explain why this claim is research-worthy: What makes it verifiable? What would challenging this claim reveal?`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: ['research_topic'],
  groupingOrder: ['research_topic'],

  // ---- Perspectives ----
  perspectives: ['research_analyst'],

  // ---- Verification ----
  verificationConfig: {
    crossReference: 'standard',
    biasDetection: 'standard',
    expertSanityCheck: 'light',
    sourceQuality: 'standard',
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 15,

  // ---- Input Variables ----
  variables: [
    {
      name: 'query',
      label: 'Topic Focus',
      type: 'text',
      required: false,
      default: 'general',
      placeholder: 'e.g., AI regulation, climate policy (or leave for general news)',
    },
    {
      name: 'source',
      label: 'Source Filter',
      type: 'select',
      required: false,
      default: 'all',
      options: [
        { value: 'all', label: 'All Sources' },
        { value: 'twitter', label: 'Twitter/X' },
        { value: 'bbc', label: 'BBC' },
        { value: 'reuters', label: 'Reuters' },
        { value: 'techcrunch', label: 'TechCrunch' },
        { value: 'bloomberg', label: 'Bloomberg' },
        { value: 'nytimes', label: 'NYT' },
        { value: 'guardian', label: 'Guardian' },
        { value: 'apnews', label: 'AP News' },
        { value: 'aljazeera', label: 'Al Jazeera' },
        { value: 'reddit', label: 'Reddit' },
      ],
    },
    {
      name: 'period',
      label: 'Time Period',
      type: 'select',
      required: false,
      default: 'last 24 hours',
      options: [
        { value: 'last 24 hours', label: 'Last 24 Hours' },
        { value: 'last 48 hours', label: 'Last 48 Hours' },
        { value: 'last 3 days', label: 'Last 3 Days' },
        { value: 'this week', label: 'This Week' },
      ],
    },
  ],
};

export default newsFeedConfig;
