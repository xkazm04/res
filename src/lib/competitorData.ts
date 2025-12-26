// Competitor comparison data for Market Research template

export interface CompetitorData {
  id: string;
  name: string;
  logo: string; // Emoji for now
  tagline: string;
  tier: 'leader' | 'challenger' | 'emerging';
  score: number; // 0-100 overall score
  metrics: {
    marketShare: number;
    growth: number;
    revenue: string;
    employees: string;
    founded: number;
    satisfaction: number;
  };
  features: Record<string, FeatureStatus>;
  strengths: string[];
  weaknesses: string[];
  recentNews: string;
}

export type FeatureStatus = 'full' | 'partial' | 'planned' | 'none';

export const featureCategories = [
  { key: 'aiPowered', label: 'AI-Powered Analytics', icon: '🧠' },
  { key: 'realtime', label: 'Real-time Processing', icon: '⚡' },
  { key: 'api', label: 'API & Integrations', icon: '🔌' },
  { key: 'mobile', label: 'Mobile App', icon: '📱' },
  { key: 'collaboration', label: 'Team Collaboration', icon: '👥' },
  { key: 'security', label: 'Enterprise Security', icon: '🔒' },
  { key: 'customization', label: 'White-label Options', icon: '🎨' },
  { key: 'support', label: '24/7 Support', icon: '🛟' },
  { key: 'analytics', label: 'Advanced Reporting', icon: '📊' },
  { key: 'automation', label: 'Workflow Automation', icon: '🤖' },
] as const;

export const competitors: CompetitorData[] = [
  {
    id: 'alpha',
    name: 'AlphaTech Pro',
    logo: '🚀',
    tagline: 'Enterprise AI Leader',
    tier: 'leader',
    score: 94,
    metrics: {
      marketShare: 34.2,
      growth: 127,
      revenue: '$4.2B',
      employees: '12,400',
      founded: 2015,
      satisfaction: 4.8,
    },
    features: {
      aiPowered: 'full',
      realtime: 'full',
      api: 'full',
      mobile: 'full',
      collaboration: 'full',
      security: 'full',
      customization: 'partial',
      support: 'full',
      analytics: 'full',
      automation: 'full',
    },
    strengths: ['Market leader in AI', 'Best-in-class API', 'Strong enterprise focus'],
    weaknesses: ['Premium pricing', 'Complex onboarding'],
    recentNews: 'Launched GPT-5 integration with 3x performance boost',
  },
  {
    id: 'nexus',
    name: 'NexusFlow',
    logo: '💎',
    tagline: 'Developer-First Platform',
    tier: 'leader',
    score: 89,
    metrics: {
      marketShare: 28.5,
      growth: 89,
      revenue: '$2.8B',
      employees: '8,200',
      founded: 2017,
      satisfaction: 4.7,
    },
    features: {
      aiPowered: 'full',
      realtime: 'full',
      api: 'full',
      mobile: 'partial',
      collaboration: 'full',
      security: 'full',
      customization: 'full',
      support: 'partial',
      analytics: 'full',
      automation: 'full',
    },
    strengths: ['Best developer experience', 'Open-source friendly', 'Fastest time-to-value'],
    weaknesses: ['Limited enterprise features', 'Smaller partner ecosystem'],
    recentNews: 'Series E funding at $12B valuation',
  },
  {
    id: 'quantum',
    name: 'QuantumScale',
    logo: '⚡',
    tagline: 'Speed & Scale Optimized',
    tier: 'challenger',
    score: 82,
    metrics: {
      marketShare: 18.3,
      growth: 156,
      revenue: '$1.4B',
      employees: '4,800',
      founded: 2019,
      satisfaction: 4.5,
    },
    features: {
      aiPowered: 'full',
      realtime: 'full',
      api: 'partial',
      mobile: 'full',
      collaboration: 'partial',
      security: 'full',
      customization: 'partial',
      support: 'full',
      analytics: 'partial',
      automation: 'full',
    },
    strengths: ['Fastest processing', 'Best price-performance', 'Rapid innovation'],
    weaknesses: ['Younger platform', 'Limited legacy integrations'],
    recentNews: 'Achieved 1M+ concurrent users milestone',
  },
  {
    id: 'zenith',
    name: 'ZenithCloud',
    logo: '☁️',
    tagline: 'Seamless Cloud Native',
    tier: 'challenger',
    score: 78,
    metrics: {
      marketShare: 12.1,
      growth: 203,
      revenue: '$890M',
      employees: '2,900',
      founded: 2020,
      satisfaction: 4.6,
    },
    features: {
      aiPowered: 'partial',
      realtime: 'full',
      api: 'full',
      mobile: 'full',
      collaboration: 'full',
      security: 'partial',
      customization: 'planned',
      support: 'partial',
      analytics: 'full',
      automation: 'partial',
    },
    strengths: ['Fastest growing', 'Modern architecture', 'Great UX'],
    weaknesses: ['AI features catching up', 'Enterprise security gaps'],
    recentNews: 'Expanding to APAC with 3 new data centers',
  },
  {
    id: 'nova',
    name: 'NovaSync',
    logo: '✨',
    tagline: 'AI-Native Disruptor',
    tier: 'emerging',
    score: 71,
    metrics: {
      marketShare: 6.9,
      growth: 312,
      revenue: '$340M',
      employees: '1,200',
      founded: 2022,
      satisfaction: 4.4,
    },
    features: {
      aiPowered: 'full',
      realtime: 'partial',
      api: 'partial',
      mobile: 'planned',
      collaboration: 'partial',
      security: 'partial',
      customization: 'none',
      support: 'partial',
      analytics: 'partial',
      automation: 'full',
    },
    strengths: ['Most innovative AI', 'Disruptive pricing', 'Startup agility'],
    weaknesses: ['Limited scale proven', 'Fewer integrations', 'Young company'],
    recentNews: 'Breakthrough in real-time AI processing, 10x efficiency',
  },
];

export const marketInsights = {
  totalMarket: '$18.4B',
  cagr: '24.3%',
  topTrend: 'AI Integration',
  keyDriver: 'Enterprise Digital Transformation',
};
