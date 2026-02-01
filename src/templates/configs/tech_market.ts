/**
 * Tech Market Template Configuration
 *
 * Migrated from: actor/src/templates/tech_market.py
 *
 * Template for technology market analysis including:
 * - Developer tools, infrastructure, and enterprise technology trends
 * - 2025 developments and 2026 predictions
 * - Funding rounds, adoption patterns, and market dynamics
 */

import { TemplateConfig } from '../types';

export const techMarketConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'tech_market',
  templateName: 'Tech Market Analysis',
  description: 'Technology market trends, 2025 developments, and 2026 predictions',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a technology market analyst planning comprehensive research on developer tools, infrastructure, and enterprise technology trends.',

  searchAngles: [
    {
      name: 'SOFTWARE DEVELOPMENT ECOSYSTEM',
      items: [
        'Programming languages: adoption trends, new releases, performance comparisons',
        'Frameworks: frontend (React, Vue, Svelte, Next.js), backend (Node, Go, Rust, Python)',
        'IDEs and development tools: VS Code extensions, JetBrains, AI coding assistants',
        'Testing: test frameworks, quality engineering, shift-left practices',
        'Developer productivity: pair programming, code review tools, documentation',
      ],
    },
    {
      name: 'AI/ML AND FULL STACK INFRASTRUCTURE',
      items: [
        'LLM platforms: OpenAI, Anthropic, Google, open-source models (Llama, Mistral)',
        'AI coding assistants: GitHub Copilot, Cursor, Codeium, Tabnine adoption',
        'MLOps tools: model training, deployment, monitoring, vector databases',
        'Cloud platforms: AWS, Azure, GCP innovations, multi-cloud strategies',
        'Edge AI and on-device inference trends',
      ],
    },
    {
      name: 'DEVOPS AND PLATFORM ENGINEERING',
      items: [
        'Platform engineering: internal developer platforms, golden paths',
        'GitOps and infrastructure as code: Terraform, Pulumi, Crossplane',
        'Containers and orchestration: Kubernetes ecosystem, service mesh',
        'CI/CD innovations: GitHub Actions, GitLab CI, Dagger',
        'Observability: OpenTelemetry, distributed tracing, AIOps',
      ],
    },
    {
      name: 'ENTERPRISE TECH STACK',
      items: [
        'Security: DevSecOps, zero-trust, SAST/DAST, supply chain security',
        'Databases: NewSQL, time-series, graph databases, serverless databases',
        'APIs: GraphQL adoption, API gateways, API-first development',
        'Data engineering: data mesh, lakehouse, real-time analytics',
        'Microservices: event-driven architecture, distributed systems',
      ],
    },
    {
      name: 'MARKET DYNAMICS',
      items: [
        'Funding rounds and valuations for developer tools companies',
        'M&A activity and consolidation trends',
        'Developer survey results (Stack Overflow, JetBrains, GitHub)',
        'Enterprise adoption case studies and ROI analysis',
        'Open source project health and governance',
      ],
    },
    {
      name: 'TEMPORAL FOCUS',
      items: [
        "Include '2025' in searches for current developments",
        "Include '2026 predictions' or 'roadmap 2026' for future trends",
        "Search for 'State of X 2025' reports where relevant",
        'Include analyst predictions and market forecasts',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: '4-5 searches on key emerging tech and major trends',
    standard: '8-10 searches covering all domains with market dynamics',
    deep: '12+ searches with comprehensive coverage including funding, predictions, and niche areas',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a technology market analyst extracting key findings for developer tools research. CRITICAL: Use EXACT finding_type values specified below - they map to UI components (Tech Radar).',

  findingTypes: [
    {
      name: 'tech_trend',
      displayName: 'Tech Trend',
      description:
        'New technologies gaining adoption (for Tech Radar visualization). Emerging patterns in developer tools, frameworks, languages. Technical architecture shifts, new paradigms.',
      extractedDataSchema:
        '{"technology": "...", "maturity": "adopt|trial|assess|hold", "adoption_rate": 40, "momentum": "growing|stable|declining"}',
      analysisFallback:
        'This technology trend reflects evolving developer preferences and may indicate future adoption patterns.',
    },
    {
      name: 'market_trend',
      displayName: 'Market Trend',
      description:
        'Market size, growth rates, TAM/SAM estimates. Competitive landscape changes, consolidation. Industry-wide shifts and inflection points.',
      extractedDataSchema:
        '{"market_size": "...", "growth_rate": "...", "segment": "...", "trend_direction": "growing|stable|declining"}',
      analysisFallback:
        'This market trend provides context for understanding the broader technology landscape.',
    },
    {
      name: 'adoption_pattern',
      displayName: 'Adoption Pattern',
      description:
        'Developer adoption rates with specific percentages. Enterprise vs startup adoption differences. Geographic or segment adoption variations.',
      extractedDataSchema:
        '{"tool": "...", "adoption_rate": 40, "segment": "enterprise|startup|all", "growth_yoy": "..."}',
      analysisFallback:
        'This adoption pattern helps understand real-world technology uptake and usage trends.',
    },
    {
      name: 'financial_metric',
      displayName: 'Financial Metric',
      description:
        'Funding rounds, valuations, revenue figures. M&A activity and deal values. Pricing changes, business model shifts.',
      extractedDataSchema:
        '{"company": "...", "metric": "funding|revenue|valuation", "value": "...", "round": "...", "investors": [...]}',
      analysisFallback:
        'This financial metric provides insight into market investment and company valuations.',
    },
    {
      name: 'prediction',
      displayName: 'Prediction',
      description:
        '2026 forecasts and roadmaps. Analyst predictions with timelines. Technology evolution predictions.',
      extractedDataSchema:
        '{"prediction": "...", "timeline": "2026", "confidence": 0.8, "source": "...", "prediction_basis": [...]}',
      analysisFallback:
        'This prediction offers a forward-looking perspective on technology evolution.',
    },
    {
      name: 'red_flag',
      displayName: 'Red Flag',
      description:
        'Declining adoption, negative developer sentiment. Project stagnation, maintainer burnout. Security issues, funding problems.',
      extractedDataSchema:
        '{"issue": "...", "severity": "high|medium|low", "affected_projects": [...], "evidence": "..."}',
      analysisFallback: 'This red flag indicates potential concerns that warrant monitoring.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive reasoning, not just describe the finding.
Good example: "This adoption rate represents a major inflection point. The 40% threshold typically signals mainstream adoption in developer tools. However, the 'adoption' definition varies - active daily use vs occasional use shows different patterns. Enterprise adoption lags individual developers by 12-18 months."

IMPORTANT:
- Be skeptical of vendor-provided adoption statistics
- Note methodology differences between surveys
- Distinguish between hype and verified adoption`,

  analysisInstruction: `YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * Why this trend/finding matters for the technology landscape
  * What it implies for developers, enterprises, or the market
  * Any caveats, counter-trends, or nuances to consider`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'prediction',
    'tech_trend',
    'adoption_pattern',
    'financial_metric',
    'market_trend',
    'red_flag',
  ],
  groupingOrder: [
    'prediction',
    'tech_trend',
    'adoption_pattern',
    'financial_metric',
    'market_trend',
    'red_flag',
  ],

  // ---- Perspectives ----
  // 8 total: 4 VC/Startup + 4 Developer Community
  perspectives: [
    // VC & Startup focused
    'venture_capitalist',
    'startup_founder',
    'product_manager',
    'developer_advocate',
    // Developer Community
    'open_source_maintainer',
    'devrel_engineer',
    'senior_engineer',
    'platform_engineer',
  ],

  // ---- Verification ----
  // Tech market is MOST prone to hype, vendor marketing, and inflated claims
  // Adoption rates vary wildly by definition, predictions are often wrong
  // Needs maximum verification to separate signal from noise
  verificationConfig: {
    crossReference: 'thorough', // Adoption numbers vary wildly
    biasDetection: 'thorough', // Vendor marketing everywhere
    expertSanityCheck: 'thorough', // Flag hype and unrealistic claims
    sourceQuality: 'thorough', // Distinguish surveys from blogs
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 12,
};

export default techMarketConfig;
