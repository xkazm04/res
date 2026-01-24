import { create } from 'zustand';
import type { SessionWithDetails } from '@/src/types/research';
import type {
  TechnologyDomain,
  ScenarioType,
  TechMarketView,
  TechTimelineEvent,
  TechnologyAdoption,
  PredictionMatrixItem,
  TechScenario,
  TechTrend2025,
  DomainSummary,
  QuarterLabel,
  AdoptionPhase,
  ImpactLevel,
  MatrixQuadrant,
  DOMAIN_LABELS,
} from '@/src/types/techMarket';

interface TechMarketState {
  // Session data
  session: SessionWithDetails | null;
  isLoading: boolean;
  error: string | null;

  // View state
  activeView: TechMarketView;
  activeDomain: TechnologyDomain | 'all';
  selectedScenarioType: ScenarioType | 'all';
  timelineYear: 2025 | 2026 | 'both';
  confidenceThreshold: number;
  showHighConfidenceOnly: boolean;

  // Extracted/derived data
  timelineEvents: TechTimelineEvent[];
  adoptionCurves: TechnologyAdoption[];
  matrixItems: PredictionMatrixItem[];
  scenarios: TechScenario[];
  trends2025: TechTrend2025[];

  // Actions
  setSession: (session: SessionWithDetails) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveView: (view: TechMarketView) => void;
  setActiveDomain: (domain: TechnologyDomain | 'all') => void;
  setSelectedScenarioType: (type: ScenarioType | 'all') => void;
  setTimelineYear: (year: 2025 | 2026 | 'both') => void;
  setConfidenceThreshold: (threshold: number) => void;
  toggleHighConfidenceOnly: () => void;

  // Extraction methods
  extractTimelineEvents: () => void;
  extractAdoptionCurves: () => void;
  extractMatrixItems: () => void;
  extractScenarios: () => void;
  extractTrends: () => void;

  // Computed getters
  getFilteredTimelineEvents: () => TechTimelineEvent[];
  getFilteredMatrixItems: () => PredictionMatrixItem[];
  getDomainSummary: () => Record<TechnologyDomain, DomainSummary>;
}

// Helper functions
function determineQuarter(dateStr?: string): QuarterLabel {
  if (!dateStr) return 'Q1';
  const month = new Date(dateStr).getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

function determineYear(dateStr?: string, temporalContext?: string): 2025 | 2026 {
  if (temporalContext === 'predicted' || temporalContext === 'prediction') {
    return 2026;
  }
  if (!dateStr) return 2025;
  const year = new Date(dateStr).getFullYear();
  return year >= 2026 ? 2026 : 2025;
}

function inferDomain(content: string): TechnologyDomain {
  const lower = content.toLowerCase();
  if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning') ||
      lower.includes('llm') || lower.includes('gpt') || lower.includes('claude')) {
    return 'ai_ml';
  }
  if (lower.includes('cloud') || lower.includes('aws') || lower.includes('azure') || lower.includes('gcp')) {
    return 'cloud_infrastructure';
  }
  if (lower.includes('devops') || lower.includes('kubernetes') || lower.includes('ci/cd') ||
      lower.includes('platform engineer') || lower.includes('docker')) {
    return 'devops_platform';
  }
  if (lower.includes('enterprise') || lower.includes('sap') || lower.includes('salesforce') ||
      lower.includes('microservices') || lower.includes('api gateway')) {
    return 'enterprise_stack';
  }
  if (lower.includes('security') || lower.includes('zero trust') || lower.includes('devsecops')) {
    return 'security';
  }
  if (lower.includes('data') || lower.includes('analytics') || lower.includes('lakehouse')) {
    return 'data_analytics';
  }
  return 'software_development';
}

function determineImpact(confidence?: number): ImpactLevel {
  if (!confidence) return 'medium';
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

function extractTechnologies(content: string): string[] {
  const techKeywords = [
    'React', 'Next.js', 'Vue', 'Svelte', 'Angular',
    'Kubernetes', 'Docker', 'Terraform', 'Pulumi',
    'OpenAI', 'Claude', 'GPT', 'Llama', 'Mistral',
    'AWS', 'Azure', 'GCP', 'Cloudflare',
    'GitHub', 'GitLab', 'Copilot', 'Cursor',
    'TypeScript', 'Rust', 'Go', 'Python',
    'PostgreSQL', 'MongoDB', 'Redis', 'Kafka',
  ];
  return techKeywords.filter(t => content.includes(t));
}

function quarterOrder(q: QuarterLabel): number {
  return { Q1: 1, Q2: 2, Q3: 3, Q4: 4 }[q];
}

function determineQuadrant(impact: number, probability: number): MatrixQuadrant {
  if (impact >= 50 && probability >= 50) return 'act_now';
  if (impact >= 50 && probability < 50) return 'prepare';
  if (impact < 50 && probability >= 50) return 'monitor';
  return 'watch';
}

function determineAdoptionPhase(content: string): AdoptionPhase {
  const lower = content.toLowerCase();
  if (lower.includes('experimental') || lower.includes('prototype') || lower.includes('research')) {
    return 'innovators';
  }
  if (lower.includes('pilot') || lower.includes('early access') || lower.includes('preview')) {
    return 'early_adopters';
  }
  if (lower.includes('mainstream') || lower.includes('production') || lower.includes('enterprise adoption')) {
    return 'early_majority';
  }
  if (lower.includes('widespread') || lower.includes('mature') || lower.includes('established')) {
    return 'late_majority';
  }
  if (lower.includes('declining') || lower.includes('legacy') || lower.includes('sunset')) {
    return 'laggards';
  }
  return 'early_adopters';
}

export const useTechMarketStore = create<TechMarketState>((set, get) => ({
  // Initial state
  session: null,
  isLoading: true,
  error: null,
  activeView: 'overview',
  activeDomain: 'all',
  selectedScenarioType: 'base',
  timelineYear: 'both',
  confidenceThreshold: 0.3,
  showHighConfidenceOnly: false,

  timelineEvents: [],
  adoptionCurves: [],
  matrixItems: [],
  scenarios: [],
  trends2025: [],

  // Actions
  setSession: (session) => {
    set({ session, isLoading: false });
    // Extract all derived data
    get().extractTimelineEvents();
    get().extractAdoptionCurves();
    get().extractMatrixItems();
    get().extractScenarios();
    get().extractTrends();
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setActiveView: (activeView) => set({ activeView }),
  setActiveDomain: (activeDomain) => set({ activeDomain }),
  setSelectedScenarioType: (selectedScenarioType) => set({ selectedScenarioType }),
  setTimelineYear: (timelineYear) => set({ timelineYear }),
  setConfidenceThreshold: (confidenceThreshold) => set({ confidenceThreshold }),
  toggleHighConfidenceOnly: () => set((state) => ({
    showHighConfidenceOnly: !state.showHighConfidenceOnly,
  })),

  // Extraction methods
  extractTimelineEvents: () => {
    const state = get();
    if (!state.session) return;

    const events: TechTimelineEvent[] = state.session.findings
      .filter(f =>
        f.temporal_context === 'predicted' ||
        f.temporal_context === 'prediction' ||
        f.finding_type === 'event' ||
        f.finding_type === 'pattern' ||
        f.event_date
      )
      .map((finding) => {
        const isPrediction = finding.temporal_context === 'predicted' ||
                            finding.temporal_context === 'prediction';
        const year = determineYear(finding.event_date, finding.temporal_context);
        const confidenceScore = finding.confidence_score || 0.5;

        return {
          id: finding.id,
          quarter: determineQuarter(finding.event_date),
          year,
          title: finding.summary || finding.content.slice(0, 60),
          description: finding.content,
          domain: inferDomain(finding.content),
          isPrediction,
          confidenceScore,
          confidenceRange: {
            low: Math.max(0, confidenceScore - 0.15),
            high: Math.min(1, confidenceScore + 0.15),
          },
          impact: determineImpact(confidenceScore),
          relatedTechnologies: extractTechnologies(finding.content),
          findingId: finding.id,
        };
      });

    set({ timelineEvents: events.slice(0, 30) });
  },

  extractAdoptionCurves: () => {
    const state = get();
    if (!state.session) return;

    // Extract adoption trends from findings
    const adoptionFindings = state.session.findings.filter(
      f => f.finding_type === 'pattern' || f.content.toLowerCase().includes('adoption')
    );

    const curves: TechnologyAdoption[] = [];
    const seenTech = new Set<string>();

    adoptionFindings.forEach((finding) => {
      const technologies = extractTechnologies(finding.content);
      technologies.forEach((tech) => {
        if (seenTech.has(tech)) return;
        seenTech.add(tech);

        const phase = determineAdoptionPhase(finding.content);
        const phaseToPercent: Record<AdoptionPhase, number> = {
          innovators: 2,
          early_adopters: 12,
          early_majority: 35,
          late_majority: 65,
          laggards: 90,
        };

        curves.push({
          id: `adoption-${tech}`,
          name: tech,
          domain: inferDomain(finding.content),
          currentPhase: phase,
          adoptionPercentage: phaseToPercent[phase],
          curveData: [],
          projectedPeakYear: 2027,
          keyDrivers: ['Developer productivity', 'Enterprise adoption'],
          barriers: ['Learning curve', 'Migration costs'],
        });
      });
    });

    set({ adoptionCurves: curves.slice(0, 10) });
  },

  extractMatrixItems: () => {
    const state = get();
    if (!state.session) return;

    const items: PredictionMatrixItem[] = [];

    // Extract risks and opportunities from findings
    state.session.findings.forEach((finding) => {
      const lower = finding.content.toLowerCase();
      const isRisk = lower.includes('risk') || lower.includes('threat') ||
                    lower.includes('challenge') || lower.includes('concern');
      const isOpportunity = lower.includes('opportunity') || lower.includes('growth') ||
                           lower.includes('potential') || lower.includes('advantage');

      if (!isRisk && !isOpportunity) return;

      const confidence = finding.confidence_score || 0.5;
      const impact = Math.round(confidence * 100);
      const probability = Math.round((0.3 + Math.random() * 0.5) * 100);

      items.push({
        id: finding.id,
        title: finding.summary || finding.content.slice(0, 50),
        description: finding.content,
        domain: inferDomain(finding.content),
        type: isRisk ? 'risk' : 'opportunity',
        impact,
        probability,
        quadrant: determineQuadrant(impact, probability),
        timeframe: isRisk ? '6-12 months' : '12-18 months',
        mitigationActions: isRisk ? ['Monitor closely', 'Develop contingency plan'] : undefined,
        captureActions: isOpportunity ? ['Invest early', 'Build capabilities'] : undefined,
      });
    });

    set({ matrixItems: items.slice(0, 20) });
  },

  extractScenarios: () => {
    const state = get();
    if (!state.session) return;

    // Extract predictions and create scenarios
    const predictions = state.session.findings.filter(
      f => f.temporal_context === 'predicted' ||
           f.temporal_context === 'prediction'
    );

    const scenarios: TechScenario[] = predictions.slice(0, 8).map((prediction) => ({
      id: `scenario-${prediction.id}`,
      predictionId: prediction.id,
      predictionTitle: prediction.summary || prediction.content.slice(0, 60),
      domain: inferDomain(prediction.content),
      scenarios: {
        bull: {
          probability: 25,
          outcome: `Accelerated adoption: ${prediction.content.slice(0, 100)}`,
          keyAssumptions: ['Strong enterprise demand', 'Rapid technology maturation'],
          implications: ['Market expansion', 'Increased competition'],
          timeframe: 'Q2-Q3 2026',
        },
        base: {
          probability: 50,
          outcome: `Steady progression: ${prediction.content.slice(0, 100)}`,
          keyAssumptions: ['Normal adoption curve', 'Continued investment'],
          implications: ['Gradual market shift', 'Standard competition'],
          timeframe: 'Q3-Q4 2026',
        },
        bear: {
          probability: 25,
          outcome: `Slower adoption: ${prediction.content.slice(0, 100)}`,
          keyAssumptions: ['Market headwinds', 'Technical challenges'],
          implications: ['Delayed timeline', 'Market consolidation'],
          timeframe: 'Q4 2026 - Q1 2027',
        },
      },
    }));

    set({ scenarios });
  },

  extractTrends: () => {
    const state = get();
    if (!state.session) return;

    const trends: TechTrend2025[] = [];

    // Extract from pattern findings
    state.session.findings
      .filter(f => f.finding_type === 'pattern')
      .forEach((finding) => {
        const lower = finding.content.toLowerCase();
        const direction: TechTrend2025['direction'] =
          lower.includes('accelerat') || lower.includes('rapid') || lower.includes('surge') ? 'accelerating' :
          lower.includes('slow') || lower.includes('declin') || lower.includes('decreas') ? 'decelerating' :
          'stable';

        trends.push({
          id: finding.id,
          name: finding.summary || finding.content.split('.')[0].slice(0, 40),
          domain: inferDomain(finding.content),
          direction,
          momentum: Math.round((finding.confidence_score || 0.5) * 100),
          description: finding.content.slice(0, 200),
          keyPlayers: extractTechnologies(finding.content).slice(0, 3),
          enterpriseRelevance: determineImpact(finding.confidence_score),
          signals: ['Market data', 'Developer adoption'],
          findingIds: [finding.id],
        });
      });

    set({ trends2025: trends.slice(0, 12) });
  },

  // Computed getters
  getFilteredTimelineEvents: () => {
    const state = get();
    let events = state.timelineEvents;

    if (state.activeDomain !== 'all') {
      events = events.filter(e => e.domain === state.activeDomain);
    }
    if (state.timelineYear !== 'both') {
      events = events.filter(e => e.year === state.timelineYear);
    }
    if (state.showHighConfidenceOnly) {
      events = events.filter(e => e.confidenceScore >= 0.7);
    } else {
      events = events.filter(e => e.confidenceScore >= state.confidenceThreshold);
    }

    return events.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return quarterOrder(a.quarter) - quarterOrder(b.quarter);
    });
  },

  getFilteredMatrixItems: () => {
    const state = get();
    if (state.activeDomain === 'all') return state.matrixItems;
    return state.matrixItems.filter(m => m.domain === state.activeDomain);
  },

  getDomainSummary: () => {
    const state = get();
    const summary: Record<TechnologyDomain, DomainSummary> = {
      ai_ml: { riskCount: 0, opportunityCount: 0, predictionCount: 0, trendCount: 0 },
      cloud_infrastructure: { riskCount: 0, opportunityCount: 0, predictionCount: 0, trendCount: 0 },
      devops_platform: { riskCount: 0, opportunityCount: 0, predictionCount: 0, trendCount: 0 },
      software_development: { riskCount: 0, opportunityCount: 0, predictionCount: 0, trendCount: 0 },
      enterprise_stack: { riskCount: 0, opportunityCount: 0, predictionCount: 0, trendCount: 0 },
      security: { riskCount: 0, opportunityCount: 0, predictionCount: 0, trendCount: 0 },
      data_analytics: { riskCount: 0, opportunityCount: 0, predictionCount: 0, trendCount: 0 },
    };

    state.matrixItems.forEach(item => {
      if (item.type === 'risk') {
        summary[item.domain].riskCount++;
      } else {
        summary[item.domain].opportunityCount++;
      }
    });

    state.timelineEvents.filter(e => e.isPrediction).forEach(event => {
      summary[event.domain].predictionCount++;
    });

    state.trends2025.forEach(trend => {
      summary[trend.domain].trendCount++;
    });

    return summary;
  },
}));
