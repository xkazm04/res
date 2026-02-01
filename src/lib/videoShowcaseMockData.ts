/**
 * Video Showcase Mock Data
 *
 * Rich, template-specific mock data for video output iteration.
 * Each template has pre-extracted content optimized for video narratives.
 *
 * Focus: Hidden insights, follow the money, pattern recognition
 * Avoid: Confidence scores, LLM metrics, generic data
 */

export type TemplateType =
  | 'investigative'
  | 'financial'
  | 'competitive'
  | 'legal'
  | 'tech_market'
  | 'contract'
  | 'understanding'
  | 'due_diligence';

export interface Actor {
  name: string;
  role: string;
  connection: string;
  imageUrl?: string;
}

export interface MoneyFlow {
  from: string;
  to: string;
  amount: string;
  why: string;
  date?: string;
}

export interface Pattern {
  pattern: string;
  evidence: string;
  implication: string;
}

export interface Comparison {
  item: string;
  claimed: string;
  reality: string;
  difference?: string;
}

export interface RedFlag {
  flag: string;
  severity: 'critical' | 'high' | 'medium';
  evidence: string;
}

export interface VideoContent {
  // Universal
  hook: string;
  title: string;
  subtitle: string;
  keyNarratives: string[];
  warnings: string[];
  verdict: string;
  verdictType: 'positive' | 'negative' | 'caution' | 'mixed';

  // Investigative template
  actors?: Actor[];
  moneyFlows?: MoneyFlow[];
  patterns?: Pattern[];

  // Financial template
  bullCase?: string[];
  bearCase?: string[];
  riskScore?: number;
  riskFactors?: Array<{ label: string; value: number; type?: 'positive' | 'negative' | 'neutral' }>;

  // Competitive template
  competitors?: Array<{ name: string; position: 'leader' | 'challenger' | 'niche' | 'emerging'; strength: number; description?: string }>;
  marketName?: string;
  competitor1?: { name: string; scores: Record<string, number> };
  competitor2?: { name: string; scores: Record<string, number> };
  comparisonDimensions?: string[];

  // Legal template
  ruling?: string;
  impacts?: Array<{ area: string; impact: string; severity: 'high' | 'medium' | 'low' }>;
  jurisdiction?: string;
  atRiskEntities?: Array<{ name: string; type: string; riskLevel: 'critical' | 'high' | 'moderate' | 'low'; reason: string }>;

  // Tech Market template
  hypeRealityItems?: Array<{ claim: string; hypeScore: number; realityScore: number }>;
  adoptionPosition?: number;
  adoptionPhase?: 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards';
  growthRate?: number;
  timeToMainstream?: string;

  // Contract template
  priceItems?: Array<{ item: string; contractPrice: number; marketPrice: number }>;
  contractName?: string;
  shellEntities?: Array<{ name: string; type: 'company' | 'person' | 'offshore' | 'unknown'; suspicious?: boolean }>;
  shellConnections?: Array<{ from: string; to: string; relationship: string; hidden?: boolean }>;
  corruptionFlags?: Array<{ flag: string; evidence: string; severity: 'critical' | 'high' | 'medium' | 'low' }>;

  // Understanding template
  officialNarrative?: string[];
  realStory?: string[];
  discrepancies?: string[];
  causalEvents?: Array<{ event: string; date?: string; impact: string; type: 'cause' | 'effect' | 'hidden' }>;

  // Due Diligence template
  redFlags?: RedFlag[];
  leaders?: Array<{ name: string; role: string; previousCompanies: string[]; issues?: string[]; yearsExperience?: number }>;

  // Purchase Decision template
  costItems?: Array<{ name: string; advertisedCost: number; hiddenCost: number; category?: string }>;
  originalProduct?: { name: string; price: number };
  alternatives?: Array<{ name: string; price: number; rating: number; pros: string[]; cons: string[]; recommended?: boolean }>;

  // Reputation template
  trustScore?: number;
  trustFactors?: Array<{ label: string; value: number; type?: 'positive' | 'negative' | 'neutral' }>;
  verifiedClaims?: number;
  totalClaims?: number;
  complaintCategories?: Array<{ category: string; count: number; trend: 'increasing' | 'stable' | 'decreasing'; examples?: string[] }>;
  totalComplaints?: number;
  complaintTimeRange?: string;

  // Legacy/generic (backwards compatibility)
  comparisons?: Comparison[];
  timeline?: { date: string; event: string }[];
  bullPoints?: string[];
  bearPoints?: string[];
  risks?: string[];
  hiddenCosts?: { cost: string; amount: string }[];
  complaints?: { type: string; count: number; pattern: string }[];
}

export interface VideoShowcaseMock {
  id: string;
  templateType: TemplateType;
  query: string;
  createdAt: string;
  videoContent: VideoContent;
}

// Template display metadata
export const TEMPLATE_META: Record<TemplateType, { name: string; icon: string; color: string }> = {
  investigative: { name: 'Investigative', icon: '🔍', color: '#E03131' },
  financial: { name: 'Financial', icon: '📈', color: '#228BE6' },
  competitive: { name: 'Competitive', icon: '⚔️', color: '#7950F2' },
  legal: { name: 'Legal', icon: '⚖️', color: '#868E96' },
  tech_market: { name: 'Tech Market', icon: '💻', color: '#2F9E44' },
  contract: { name: 'Contract', icon: '📋', color: '#F59F00' },
  understanding: { name: 'Understanding', icon: '🌐', color: '#1098AD' },
  due_diligence: { name: 'Due Diligence', icon: '🔎', color: '#E64980' },
};

// ============================================================================
// MOCK DATA FOR ALL 10 TEMPLATES
// ============================================================================

export const VIDEO_SHOWCASE_MOCKS: VideoShowcaseMock[] = [
  // 1. INVESTIGATIVE
  {
    id: 'showcase-investigative',
    templateType: 'investigative',
    query: 'Tech CEO Stock Sales Investigation: Insider Trading Patterns at MegaCorp',
    createdAt: '2025-01-15T10:00:00Z',
    videoContent: {
      hook: 'Three executives sold $47 million in stock just 2 weeks before the announcement that crashed the share price 40%...',
      title: 'The MegaCorp Insider Trading Investigation',
      subtitle: 'Following the Money Before the Crash',
      keyNarratives: [
        'Executive stock sales clustered in unusual 10-day window',
        'Shell company connections reveal hidden beneficiaries',
        'Board member\'s brother-in-law received $12M "consulting" payment',
      ],
      actors: [
        { name: 'James Morrison', role: 'CEO', connection: 'Sold $28M in stock via family trust' },
        { name: 'Sarah Chen', role: 'CFO', connection: 'Transferred shares to offshore entity 3 days before' },
        { name: 'Robert Blackwell', role: 'Board Member', connection: 'Brother-in-law runs "consulting firm"' },
        { name: 'Apex Holdings LLC', role: 'Shell Company', connection: 'Same registered agent as CEO\'s trust' },
      ],
      moneyFlows: [
        { from: 'MegaCorp', to: 'Apex Holdings LLC', amount: '$12M', why: 'Consulting services - no deliverables found' },
        { from: 'James Morrison Trust', to: 'Cayman Account', amount: '$28M', why: 'Stock sale proceeds, 2 weeks before announcement' },
        { from: 'Apex Holdings LLC', to: 'Blackwell Consulting', amount: '$4.2M', why: 'Same-day transfer after MegaCorp payment' },
      ],
      patterns: [
        { pattern: 'Clustered insider sales', evidence: '85% of annual exec sales in 10-day window', implication: 'Coordinated timing suggests foreknowledge' },
        { pattern: 'Shell company network', evidence: '4 entities share same registered agent', implication: 'Designed to obscure beneficial ownership' },
        { pattern: 'Consulting fee inflation', evidence: '$12M for services with no documentation', implication: 'Potential kickback mechanism' },
      ],
      warnings: [
        'SEC has opened preliminary inquiry',
        'Similar pattern preceded 2019 enforcement action',
        'Whistleblower complaint filed in December',
      ],
      verdict: 'The evidence strongly suggests coordinated insider trading with potential kickback scheme',
      verdictType: 'negative',
    },
  },

  // 2. FINANCIAL
  {
    id: 'showcase-financial',
    templateType: 'financial',
    query: 'NVIDIA Stock Analysis 2025: Deep Dive Beyond the AI Hype',
    createdAt: '2025-01-20T14:30:00Z',
    videoContent: {
      hook: 'Wall Street has 42 buy ratings. Here\'s what they\'re not telling you about the concentration risk...',
      title: 'NVIDIA 2025: The Hidden Risks',
      subtitle: 'What 95% of Analysts Aren\'t Mentioning',
      keyNarratives: [
        '78% of data center revenue comes from just 4 customers',
        'China restrictions could impact 20% of total revenue',
        'Competitor AMD closing the performance gap faster than expected',
      ],
      bullPoints: [
        'Data center revenue up 409% YoY, $18.4B in Q3',
        'AI infrastructure spending still accelerating',
        'Blackwell architecture extends performance lead',
        'Gross margins holding at 75%+',
      ],
      bearPoints: [
        'Top 4 customers = 78% of data center revenue',
        'Microsoft, Google showing signs of capex deceleration',
        'AMD MI300X gaining traction in inference workloads',
        'China export restrictions tightening',
      ],
      risks: [
        'Customer concentration: Microsoft alone is 25%+ of revenue',
        'Hyperscaler capex cycles historically volatile',
        'Valuation assumes 30%+ growth for 5+ years',
        'Antitrust scrutiny increasing in EU',
      ],
      // Bull/Bear case data
      bullCase: [
        'Data center revenue up 409% YoY, $18.4B in Q3',
        'AI infrastructure spending still accelerating',
        'Blackwell architecture extends performance lead',
        'Gross margins holding at 75%+',
      ],
      bearCase: [
        'Top 4 customers = 78% of data center revenue',
        'Microsoft, Google showing signs of capex deceleration',
        'AMD MI300X gaining traction in inference workloads',
        'China export restrictions tightening',
      ],
      // Risk assessment data
      riskScore: 58,
      riskFactors: [
        { label: 'Customer Concentration', value: 78, type: 'negative' },
        { label: 'Valuation Premium', value: 65, type: 'negative' },
        { label: 'Competition Threat', value: 45, type: 'negative' },
        { label: 'Revenue Growth', value: 95, type: 'positive' },
        { label: 'Margin Stability', value: 75, type: 'positive' },
        { label: 'Tech Leadership', value: 85, type: 'positive' },
      ],
      comparisons: [
        { item: 'Current P/E', claimed: '65x (reasonable for growth)', reality: 'Highest in semiconductor history at this scale' },
        { item: 'Customer Base', claimed: 'Diversified enterprise adoption', reality: '4 hyperscalers = 78% of growth driver' },
        { item: 'Competition', claimed: '2 year technology lead', reality: 'AMD MI300X within 15% on inference benchmarks' },
      ],
      warnings: [
        'Concentration risk underappreciated by sell-side',
        'Hyperscaler capex showing early deceleration signals',
        'Margin compression likely as competition intensifies',
      ],
      verdict: 'Strong fundamentals but valuation leaves no margin of safety for execution risk',
      verdictType: 'caution',
    },
  },

  // 3. COMPETITIVE
  {
    id: 'showcase-competitive',
    templateType: 'competitive',
    query: 'AI Assistant Market 2025: The Battle for Enterprise Dominance',
    createdAt: '2025-01-18T09:00:00Z',
    videoContent: {
      hook: 'While everyone watches the consumer market, a $50B enterprise battle is being decided in the shadows...',
      title: 'The AI Assistant Wars',
      subtitle: 'Who\'s Actually Winning in Enterprise',
      keyNarratives: [
        'Microsoft Copilot has 80% enterprise awareness but only 12% active usage',
        'Anthropic\'s Claude is quietly capturing developer mindshare',
        'Google\'s pivot to vertical-specific solutions changing the game',
      ],
      actors: [
        { name: 'Microsoft Copilot', role: 'Market Leader', connection: 'Bundled with M365, 400M potential users' },
        { name: 'Anthropic Claude', role: 'Developer Favorite', connection: '3x growth in API usage Q4 2024' },
        { name: 'Google Gemini', role: 'Vertical Specialist', connection: 'Healthcare and legal verticals focus' },
        { name: 'OpenAI ChatGPT', role: 'Consumer Leader', connection: 'Enterprise growth slowing vs competitors' },
      ],
      // Market landscape data
      marketName: 'Enterprise AI Assistants',
      competitors: [
        { name: 'Microsoft Copilot', position: 'leader', strength: 85, description: 'Distribution advantage, M365 bundle' },
        { name: 'Anthropic Claude', position: 'challenger', strength: 72, description: 'Developer favorite, coding excellence' },
        { name: 'OpenAI ChatGPT', position: 'leader', strength: 80, description: 'Consumer dominance, brand recognition' },
        { name: 'Google Gemini', position: 'challenger', strength: 68, description: 'Vertical specialization, Google Cloud' },
        { name: 'Perplexity', position: 'emerging', strength: 45, description: 'Search-first approach, rapid growth' },
        { name: 'Mistral', position: 'niche', strength: 38, description: 'Open-source friendly, EU compliance' },
      ],
      // Battle map data
      competitor1: {
        name: 'Microsoft Copilot',
        scores: { 'Enterprise Features': 90, 'Developer Experience': 65, 'Pricing': 55, 'Performance': 75, 'Integration': 95 }
      },
      competitor2: {
        name: 'Anthropic Claude',
        scores: { 'Enterprise Features': 70, 'Developer Experience': 92, 'Pricing': 80, 'Performance': 88, 'Integration': 60 }
      },
      comparisonDimensions: ['Enterprise Features', 'Developer Experience', 'Pricing', 'Performance', 'Integration'],
      comparisons: [
        { item: 'Enterprise Penetration', claimed: 'Copilot leads at 40%', reality: 'Only 12% active weekly usage' },
        { item: 'Developer Preference', claimed: 'GPT-4 dominates', reality: 'Claude leads in coding benchmarks since Oct 2024' },
        { item: 'Cost Efficiency', claimed: 'Similar pricing', reality: 'Claude 40% cheaper for equivalent tasks' },
      ],
      patterns: [
        { pattern: 'Bundle fatigue', evidence: 'Copilot churn 2x higher than standalone tools', implication: 'Forced adoption not driving engagement' },
        { pattern: 'Developer-led adoption', evidence: 'Claude API growth 3x vs ChatGPT', implication: 'Bottom-up adoption may win long-term' },
        { pattern: 'Vertical specialization', evidence: 'Google healthcare deals up 200%', implication: 'Horizontal AI assistants may fragment' },
      ],
      warnings: [
        'Market share numbers misleading without usage data',
        'Enterprise contracts locking in for 3 years',
        'Open source alternatives gaining ground',
      ],
      verdict: 'Microsoft leads on distribution, but engagement metrics favor Anthropic and specialists',
      verdictType: 'mixed',
    },
  },

  // 4. LEGAL
  {
    id: 'showcase-legal',
    templateType: 'legal',
    query: 'EU AI Act Enforcement: First Major Ruling Implications',
    createdAt: '2025-01-22T11:00:00Z',
    videoContent: {
      hook: 'This ruling just made every US tech company rethink their European AI strategy...',
      title: 'EU AI Act: The First Enforcement',
      subtitle: 'What This Ruling Means for Everyone',
      keyNarratives: [
        'First company fined €15M for "high-risk" AI deployment without assessment',
        'Ruling establishes broad interpretation of "high-risk" categories',
        'Extraterritorial reach confirmed - US companies with EU users subject',
      ],
      timeline: [
        { date: 'Aug 2024', event: 'AI Act enters into force' },
        { date: 'Nov 2024', event: 'Commission issues first warning letters' },
        { date: 'Jan 2025', event: 'First formal investigation opened' },
        { date: 'Jan 2025', event: 'First enforcement decision: €15M fine' },
      ],
      comparisons: [
        { item: 'Fine Level', claimed: 'Proportionate to violation', reality: 'Higher than GDPR precedent for first offense' },
        { item: 'Scope', claimed: 'Limited to clear violations', reality: 'Broad interpretation of "high-risk" categories' },
        { item: 'Reach', claimed: 'EU companies primarily', reality: 'Explicit extraterritorial jurisdiction confirmed' },
      ],
      patterns: [
        { pattern: 'Aggressive interpretation', evidence: 'Customer service AI classified as high-risk', implication: 'Many more systems may require assessment' },
        { pattern: 'Precedent-setting intent', evidence: 'Detailed 47-page reasoning published', implication: 'Clear signal to industry of enforcement approach' },
      ],
      // Ruling impact data
      ruling: 'Companies deploying AI systems that interact with EU citizens must complete high-risk assessments before deployment, with violations subject to fines up to 7% of global revenue.',
      jurisdiction: 'European Union',
      impacts: [
        { area: 'Customer Service AI', impact: 'All chatbots now require high-risk assessment documentation', severity: 'high' },
        { area: 'HR Screening Tools', impact: 'Resume scanners must be audited for bias before use', severity: 'high' },
        { area: 'Content Moderation', impact: 'Automated content decisions require human oversight', severity: 'medium' },
        { area: 'Recommendation Systems', impact: 'Personalization algorithms need transparency reports', severity: 'medium' },
        { area: 'US Tech Companies', impact: 'Extraterritorial reach means compliance even outside EU', severity: 'high' },
      ],
      // At-risk entities data
      atRiskEntities: [
        { name: 'US SaaS Companies', type: 'Industry', riskLevel: 'critical', reason: 'Most have unassessed AI features serving EU customers' },
        { name: 'HR Tech Vendors', type: 'Sector', riskLevel: 'critical', reason: 'Resume screening explicitly named as high-risk' },
        { name: 'Customer Service Platforms', type: 'Sector', riskLevel: 'high', reason: 'AI chatbots now require documentation' },
        { name: 'Social Media Companies', type: 'Industry', riskLevel: 'high', reason: 'Content moderation algorithms under scrutiny' },
        { name: 'E-commerce Platforms', type: 'Sector', riskLevel: 'moderate', reason: 'Recommendation systems need transparency' },
        { name: 'Financial Services', type: 'Sector', riskLevel: 'moderate', reason: 'Credit scoring AI already regulated' },
      ],
      warnings: [
        'Companies have 6 months to conduct AI system audits',
        'Documentation requirements more extensive than expected',
        'Third-party AI tools may create liability',
      ],
      verdict: 'All companies using AI with EU customers should immediately audit their systems',
      verdictType: 'caution',
    },
  },

  // 5. TECH MARKET
  {
    id: 'showcase-tech_market',
    templateType: 'tech_market',
    query: 'Rust Programming Language: Hype vs Reality in 2025',
    createdAt: '2025-01-19T16:00:00Z',
    videoContent: {
      hook: 'The hype says Rust is replacing everything. Here\'s what developers actually using it say...',
      title: 'Rust Adoption Reality Check',
      subtitle: 'What the Surveys Don\'t Tell You',
      keyNarratives: [
        'Rust adoption up 200% but from tiny 2% base',
        'Learning curve causing 40% of projects to abandon after 6 months',
        'Sweet spot emerging in systems programming, not general purpose',
      ],
      comparisons: [
        { item: 'Adoption Rate', claimed: '200% YoY growth', reality: 'From 2% to 6% - still niche', difference: 'Hype exceeds reality' },
        { item: 'Learning Curve', claimed: '2-3 months to productivity', reality: '6-12 months for most teams', difference: '3-4x longer than claimed' },
        { item: 'Use Cases', claimed: 'General purpose replacement', reality: 'Systems/infrastructure focused', difference: 'Narrower than marketed' },
        { item: 'Hiring', claimed: 'Growing talent pool', reality: '10x fewer Rust devs than Go', difference: 'Major hiring challenge' },
      ],
      patterns: [
        { pattern: 'Abandonment spike', evidence: '40% of Rust projects inactive after 6 months', implication: 'Learning curve barrier is real' },
        { pattern: 'Infrastructure concentration', evidence: '80% of production Rust in systems programming', implication: 'Not a general-purpose language yet' },
        { pattern: 'Big tech adoption', evidence: 'Microsoft, Google, AWS all investing heavily', implication: 'Long-term trajectory is positive' },
      ],
      // Hype vs Reality data
      hypeRealityItems: [
        { claim: 'Memory safety eliminates bugs', hypeScore: 95, realityScore: 78 },
        { claim: 'Easy to learn from other languages', hypeScore: 75, realityScore: 35 },
        { claim: 'Ready for web development', hypeScore: 80, realityScore: 45 },
        { claim: 'Replaces C/C++ everywhere', hypeScore: 85, realityScore: 40 },
        { claim: 'Growing job market', hypeScore: 70, realityScore: 55 },
        { claim: 'Great tooling and IDE support', hypeScore: 60, realityScore: 72 },
      ],
      // Adoption curve data
      adoptionPosition: 18,
      adoptionPhase: 'early_adopters',
      growthRate: 42,
      timeToMainstream: '4-6 years',
      warnings: [
        'Hiring difficulty persists - plan for training',
        'Tooling ecosystem still maturing',
        'Not recommended for typical web applications',
      ],
      verdict: 'Excellent for systems programming, premature for general adoption',
      verdictType: 'mixed',
    },
  },

  // 6. CONTRACT
  {
    id: 'showcase-contract',
    templateType: 'contract',
    query: 'DoD Cloud Contract Analysis: $2.3B IT Modernization Deal',
    createdAt: '2025-01-17T08:00:00Z',
    videoContent: {
      hook: 'Your tax dollars: $450 per hour for work that should cost $180. Here\'s how...',
      title: 'The $2.3 Billion Cloud Contract',
      subtitle: 'Following the Money in Defense IT',
      keyNarratives: [
        'Labor rates 150% above GSA schedule for equivalent work',
        'Subcontractor markup creates hidden 40% premium',
        'Vendor has prior relationship with contracting officer',
      ],
      comparisons: [
        { item: 'Senior Developer Rate', claimed: '$450/hour (market rate)', reality: '$180/hour GSA schedule', difference: '150% premium' },
        { item: 'Cloud Infrastructure', claimed: '$2.1M/month', reality: '$800K/month comparable DoD contract', difference: '162% premium' },
        { item: 'Project Management', claimed: '$380/hour', reality: '$145/hour commercial equivalent', difference: '162% premium' },
      ],
      actors: [
        { name: 'TechDefense Solutions', role: 'Prime Contractor', connection: 'Won 4 consecutive sole-source awards' },
        { name: 'Digital Dynamics LLC', role: 'Subcontractor', connection: 'CEO is former DoD procurement official' },
        { name: 'Col. Marcus Webb (ret.)', role: 'Consultant', connection: 'Former contracting officer, now TechDefense advisor' },
      ],
      moneyFlows: [
        { from: 'DoD', to: 'TechDefense Solutions', amount: '$2.3B', why: 'Prime contract award' },
        { from: 'TechDefense', to: 'Digital Dynamics LLC', amount: '$890M', why: 'Subcontract with 40% markup' },
        { from: 'TechDefense', to: 'Webb Consulting', amount: '$4.2M', why: 'Advisory services - vague scope' },
      ],
      redFlags: [
        { flag: 'Sole-source justification', severity: 'critical', evidence: '4 consecutive awards without competition' },
        { flag: 'Revolving door', severity: 'high', evidence: 'Former contracting officer now vendor advisor' },
        { flag: 'Price gouging', severity: 'critical', evidence: '150% above GSA schedule rates' },
        { flag: 'Subcontractor markup', severity: 'high', evidence: '40% markup for pass-through services' },
      ],
      // Contract-specific scene data
      contractName: 'DoD Cloud Modernization Initiative',
      priceItems: [
        { item: 'Senior Cloud Architect', contractPrice: 450, marketPrice: 180 },
        { item: 'DevOps Engineer', contractPrice: 380, marketPrice: 155 },
        { item: 'Project Manager', contractPrice: 380, marketPrice: 145 },
        { item: 'Security Analyst', contractPrice: 420, marketPrice: 165 },
        { item: 'AWS Infrastructure (monthly)', contractPrice: 2100000, marketPrice: 800000 },
      ],
      shellEntities: [
        { name: 'TechDefense Solutions', type: 'company', suspicious: false },
        { name: 'Digital Dynamics LLC', type: 'company', suspicious: true },
        { name: 'Webb Consulting Group', type: 'company', suspicious: true },
        { name: 'Potomac Holdings', type: 'offshore', suspicious: true },
        { name: 'Col. Marcus Webb (ret.)', type: 'person', suspicious: true },
        { name: 'Sarah Webb', type: 'person', suspicious: true },
      ],
      shellConnections: [
        { from: 'TechDefense Solutions', to: 'Digital Dynamics LLC', relationship: 'Subcontractor', hidden: false },
        { from: 'TechDefense Solutions', to: 'Webb Consulting Group', relationship: 'Advisor', hidden: true },
        { from: 'Digital Dynamics LLC', to: 'Col. Marcus Webb (ret.)', relationship: 'Board Member', hidden: true },
        { from: 'Col. Marcus Webb (ret.)', to: 'Sarah Webb', relationship: 'Spouse', hidden: true },
        { from: 'Sarah Webb', to: 'Potomac Holdings', relationship: '100% Owner', hidden: true },
        { from: 'Potomac Holdings', to: 'Digital Dynamics LLC', relationship: '40% Stake', hidden: true },
      ],
      corruptionFlags: [
        { flag: 'Revolving door violation', evidence: 'Former contracting officer joined vendor within 2 years', severity: 'critical' },
        { flag: 'Hidden ownership structure', evidence: 'Spouse owns offshore entity with stake in subcontractor', severity: 'critical' },
        { flag: 'No-bid justification fraud', evidence: 'Claimed "unique capabilities" found in 12 competitors', severity: 'high' },
        { flag: 'Inflated labor rates', evidence: '150% above GSA schedule with no justification', severity: 'high' },
        { flag: 'Pass-through billing', evidence: 'Subcontractor adds no value, charges 40% markup', severity: 'medium' },
      ],
      warnings: [
        'GAO audit pending on similar contracts',
        'Inspector General received whistleblower complaint',
        'Pattern matches prior fraud convictions in sector',
      ],
      verdict: 'Strong indicators of waste and potential fraud - recommend investigation',
      verdictType: 'negative',
    },
  },

  // 7. UNDERSTANDING
  {
    id: 'showcase-understanding',
    templateType: 'understanding',
    query: 'Silicon Valley Bank Collapse: Media Narrative vs Reality',
    createdAt: '2025-01-16T12:00:00Z',
    videoContent: {
      hook: 'The official story says it started in March. The real story started in November - and the media missed it...',
      title: 'SVB Collapse: What Really Happened',
      subtitle: 'The Story Behind the Headlines',
      keyNarratives: [
        'Fed rate hike warnings ignored by management for 8 months',
        'Insider sales spiked 400% in months before collapse',
        'Peter Thiel\'s fund withdrawal triggered bank run - unreported for 48 hours',
      ],
      timeline: [
        { date: 'Nov 2022', event: 'Internal risk report warned of rate exposure' },
        { date: 'Dec 2022', event: 'CEO sold $3.6M in stock' },
        { date: 'Jan 2023', event: 'Bond losses exceeded capital cushion' },
        { date: 'Feb 2023', event: 'Founders Fund begins quiet withdrawal' },
        { date: 'Mar 8', event: 'SVB announces stock sale to cover losses' },
        { date: 'Mar 9', event: 'Bank run begins, $42B withdrawn' },
        { date: 'Mar 10', event: 'FDIC seizes bank' },
      ],
      comparisons: [
        { item: 'Timeline Start', claimed: 'March 8 announcement', reality: 'November 2022 internal warnings', difference: '4 months hidden' },
        { item: 'Cause', claimed: 'Sudden rate shock', reality: 'Ignored risk warnings for 8 months' },
        { item: 'Trigger', claimed: 'Public panic', reality: 'Coordinated VC fund withdrawals' },
      ],
      actors: [
        { name: 'Greg Becker', role: 'CEO', connection: 'Sold $3.6M stock before collapse' },
        { name: 'Founders Fund', role: 'Early Withdrawer', connection: 'Peter Thiel-linked, pulled funds Feb 2023' },
        { name: 'Federal Reserve', role: 'Regulator', connection: 'Warned about rate risk repeatedly' },
      ],
      moneyFlows: [
        { from: 'Greg Becker', to: 'Personal Account', amount: '$3.6M', why: 'Stock sale 2 weeks before collapse' },
        { from: 'SVB', to: 'Founders Fund', amount: '$1.2B', why: 'Withdrawal that triggered run' },
      ],
      patterns: [
        { pattern: 'Insider knowledge', evidence: 'CEO stock sales timed before public disclosure', implication: 'Executives knew risk was material' },
        { pattern: 'VC coordination', evidence: 'Multiple funds withdrew same week before public', implication: 'Private information sharing likely' },
      ],
      // Understanding-specific data
      officialNarrative: [
        'Bank run started March 8 after stock sale announcement',
        'Social media panic caused irrational withdrawals',
        'Unforeseeable interest rate shock created losses',
        'Regulators acted swiftly to protect depositors',
      ],
      realStory: [
        'Internal warnings about rate risk came in November 2022',
        'CEO and CFO sold millions in stock before public disclosure',
        'Coordinated VC fund withdrawals started 2 weeks before crash',
        'Fed had warned about exact risk scenario for months',
      ],
      causalEvents: [
        { event: 'Fed rate hikes begin', date: 'Mar 2022', impact: 'Bond portfolio value starts declining', type: 'cause' },
        { event: 'Internal risk report', date: 'Nov 2022', impact: 'Management warned of rate exposure - ignored', type: 'hidden' },
        { event: 'Executive stock sales', date: 'Dec-Feb', impact: 'CEO sells $3.6M, CFO sells $500K before crash', type: 'hidden' },
        { event: 'Founders Fund withdrawal', date: 'Feb 2023', impact: 'Peter Thiel-linked fund quietly pulls $1.2B', type: 'hidden' },
        { event: 'Public announcement', date: 'Mar 8', impact: 'SVB announces $2.25B stock sale to cover losses', type: 'effect' },
        { event: 'Bank run begins', date: 'Mar 9', impact: '$42B withdrawn in single day, stock crashes 60%', type: 'effect' },
        { event: 'FDIC seizure', date: 'Mar 10', impact: 'Second-largest bank failure in US history', type: 'effect' },
      ],
      warnings: [
        'Media initially blamed depositors, not management',
        'Regulatory failures downplayed in coverage',
        'Insider trading investigation still ongoing',
      ],
      verdict: 'Management ignored clear warnings while executives protected themselves',
      verdictType: 'negative',
    },
  },

  // 8. DUE DILIGENCE
  {
    id: 'showcase-due_diligence',
    templateType: 'due_diligence',
    query: 'AI Startup Acquisition Target: NeuraTech Inc Due Diligence',
    createdAt: '2025-01-21T10:30:00Z',
    videoContent: {
      hook: 'Impressive pitch deck. Concerning background. Here\'s what the founders didn\'t mention...',
      title: 'NeuraTech Inc: Due Diligence Report',
      subtitle: 'What the Pitch Deck Left Out',
      keyNarratives: [
        'CEO\'s previous startup collapsed owing vendors $8M',
        'Key technology claims cannot be verified independently',
        'Customer testimonials from companies that don\'t exist',
      ],
      actors: [
        { name: 'Dr. Michael Torres', role: 'CEO/Founder', connection: 'Previous company Synaptix failed, $8M in debts' },
        { name: 'Dr. Elena Vasquez', role: 'CTO', connection: 'PhD research partially retracted in 2022' },
        { name: 'James Liu', role: 'CFO', connection: 'Joined 2 months ago, 4th CFO in 2 years' },
      ],
      redFlags: [
        { flag: 'Prior business failure', severity: 'high', evidence: 'Synaptix collapsed with $8M unpaid to vendors' },
        { flag: 'Research integrity concerns', severity: 'critical', evidence: 'CTO had paper partially retracted for data issues' },
        { flag: 'CFO turnover', severity: 'high', evidence: '4 CFOs in 24 months - pattern of departures' },
        { flag: 'Fake testimonials', severity: 'critical', evidence: '2 of 5 customer logos are non-existent companies' },
        { flag: 'Unverifiable claims', severity: 'high', evidence: 'Core technology benchmarks cannot be reproduced' },
      ],
      // Leadership history data
      leaders: [
        {
          name: 'Dr. Michael Torres',
          role: 'CEO/Founder',
          previousCompanies: ['Synaptix AI', 'DeepMind (Intern)', 'Stanford AI Lab'],
          issues: ['Synaptix failed with $8M debt to vendors', 'SEC inquiry into investor communications'],
          yearsExperience: 12
        },
        {
          name: 'Dr. Elena Vasquez',
          role: 'CTO',
          previousCompanies: ['MIT CSAIL', 'Google Brain', 'Startup X'],
          issues: ['PhD paper partially retracted 2022', 'Previous startup dissolved quietly'],
          yearsExperience: 8
        },
        {
          name: 'James Liu',
          role: 'CFO',
          previousCompanies: ['KPMG', 'Theranos', 'WeWork'],
          issues: ['4th CFO in 2 years', 'Joined only 2 months ago'],
          yearsExperience: 15
        },
        {
          name: 'Sarah Chen',
          role: 'VP Sales',
          previousCompanies: ['Salesforce', 'Oracle', 'SAP'],
          yearsExperience: 10
        },
      ],
      comparisons: [
        { item: 'Revenue', claimed: '$12M ARR', reality: 'Only $3.2M verifiable from contracts', difference: '73% overstated' },
        { item: 'Customers', claimed: '45 enterprise clients', reality: '12 paying, 8 on free trials' },
        { item: 'Team Size', claimed: '85 employees', reality: '62 including contractors' },
      ],
      patterns: [
        { pattern: 'Metric inflation', evidence: 'ARR includes non-binding LOIs as revenue', implication: 'Financial claims unreliable' },
        { pattern: 'Reference manipulation', evidence: 'Provided references all from same VC network', implication: 'Independent validation needed' },
      ],
      warnings: [
        'Technology claims require independent verification',
        'CEO has pattern of vendor payment issues',
        'Customer references should be independently sourced',
      ],
      verdict: 'Significant red flags require extensive additional due diligence before proceeding',
      verdictType: 'negative',
    },
  },

  // 9. (Removed Purchase Decision template)
  // 10. (Removed Reputation template)
];

// Display order for template selector - matches video chronology
// Summary/Understanding comes first, then investigative types, then analytical
export const TEMPLATE_DISPLAY_ORDER: TemplateType[] = [
  'understanding',     // Summary - overall picture first
  'investigative',     // Deep investigation
  'due_diligence',     // Verification
  'financial',         // Financial analysis
  'competitive',       // Market position
  'tech_market',       // Technology trends
  'contract',          // Contract analysis
  'legal',             // Legal implications
];

// Get mocks in display order
export function getOrderedShowcaseMocks(): VideoShowcaseMock[] {
  return TEMPLATE_DISPLAY_ORDER
    .map(type => VIDEO_SHOWCASE_MOCKS.find(mock => mock.templateType === type))
    .filter((mock): mock is VideoShowcaseMock => mock !== undefined);
}

// Helper function to get mock by template type
export function getShowcaseMock(templateType: TemplateType): VideoShowcaseMock | undefined {
  return VIDEO_SHOWCASE_MOCKS.find(mock => mock.templateType === templateType);
}

// Helper to get all mocks
export function getAllShowcaseMocks(): VideoShowcaseMock[] {
  return VIDEO_SHOWCASE_MOCKS;
}
