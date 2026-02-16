/**
 * Scene Catalog for AI Composition
 *
 * Describes every available scene component with its data schema,
 * rendering constraints (maxLength, maxItems), and suggested durations.
 * Used by the CLI prompt to guide AI in composing video scenes.
 *
 * IMPORTANT: constraints are measured against the 640x360 (16:9) viewport.
 * Usable height after p-6 padding + 6% letterbox bars is ~269px.
 * All maxLength/maxItems values are set to the tightest fit that avoids overflow.
 */

export interface SceneFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  maxLength?: number;
  maxItems?: number;
  description?: string;
  enum?: string[];
  fields?: Record<string, SceneFieldSchema>;
}

export interface SceneCatalogEntry {
  component: string;
  description: string;
  category: 'universal' | 'investigative' | 'financial' | 'competitive' | 'legal' | 'tech_market' | 'contract' | 'understanding' | 'due_diligence';
  suggestedDuration: { min: number; max: number; default: number };
  dataSchema: Record<string, SceneFieldSchema>;
}

export const SCENE_CATALOG: SceneCatalogEntry[] = [
  // ── Universal ──
  {
    component: 'HookScene',
    description: 'Opening hook that grabs attention with a provocative statement and topic title',
    category: 'universal',
    suggestedDuration: { min: 2, max: 4, default: 3 },
    dataSchema: {
      hook: { type: 'string', required: true, maxLength: 50, description: 'Provocative opening line (2 lines max at 40px)' },
      title: { type: 'string', required: true, maxLength: 40, description: 'Research topic title' },
    },
  },
  {
    component: 'VerdictScene',
    description: 'Closing verdict with final assessment, warnings, and call-to-action',
    category: 'universal',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      verdict: { type: 'string', required: true, maxLength: 60, description: 'Final verdict statement (2 lines at 24px)' },
      verdictType: { type: 'string', required: true, enum: ['positive', 'negative', 'caution', 'mixed'] },
      warnings: { type: 'array', maxItems: 2, fields: { item: { type: 'string', maxLength: 50 } }, description: 'Warning statements' },
      cta: { type: 'string', maxLength: 40, description: 'Call-to-action text' },
    },
  },

  // ── Stock Footage (Pexels) ──
  {
    component: 'StockFootageScene',
    description: 'Real stock footage clip from Pexels with optional text overlay. Use as opening establishing shot or visual transition between data scenes.',
    category: 'universal',
    suggestedDuration: { min: 2, max: 4, default: 3 },
    dataSchema: {
      pexelsQuery: {
        type: 'string', required: true, maxLength: 60,
        description: 'Search keywords for Pexels video (e.g. "stock market trading floor", "city skyline night")',
      },
      overlayText: {
        type: 'string', maxLength: 50,
        description: 'Optional text displayed over the video clip',
      },
      overlayPosition: {
        type: 'string', enum: ['center', 'bottom'],
        description: 'Where to place overlay text',
      },
    },
  },

  // ── Investigative ──
  {
    component: 'ActorNetworkScene',
    description: 'Animated network showing connected actors/entities with roles and relationships',
    category: 'investigative',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      actors: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          name: { type: 'string', maxLength: 10 },
          role: { type: 'string', maxLength: 20 },
          connection: { type: 'string', maxLength: 17 },
        },
        description: 'Key actors in the investigation',
      },
      title: { type: 'string', maxLength: 30, description: 'Scene title override' },
    },
  },
  {
    component: 'MoneyTrailScene',
    description: 'Animated money flow visualization showing financial connections between entities',
    category: 'investigative',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      flows: {
        type: 'array', required: true, maxItems: 2,
        fields: {
          from: { type: 'string', maxLength: 10 },
          to: { type: 'string', maxLength: 10 },
          amount: { type: 'string', maxLength: 15 },
          why: { type: 'string', maxLength: 40 },
        },
        description: 'Money flow connections',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },
  {
    component: 'PatternRevealScene',
    description: 'Reveals hidden patterns with evidence and implications',
    category: 'investigative',
    suggestedDuration: { min: 3, max: 5, default: 4 },
    dataSchema: {
      patterns: {
        type: 'array', required: true, maxItems: 2,
        fields: {
          pattern: { type: 'string', maxLength: 30 },
          evidence: { type: 'string', maxLength: 50 },
          implication: { type: 'string', maxLength: 50 },
        },
        description: 'Discovered patterns',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },

  // ── Financial ──
  {
    component: 'BullBearScene',
    description: 'Split-screen bull vs bear arguments for balanced financial analysis',
    category: 'financial',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      bullCase: {
        type: 'array', required: true, maxItems: 3,
        fields: { item: { type: 'string', maxLength: 45 } },
        description: 'Arguments in favor',
      },
      bearCase: {
        type: 'array', required: true, maxItems: 3,
        fields: { item: { type: 'string', maxLength: 45 } },
        description: 'Arguments against',
      },
    },
  },
  {
    component: 'RiskMeterScene',
    description: 'Animated risk gauge with contributing risk factors',
    category: 'financial',
    suggestedDuration: { min: 3, max: 5, default: 3 },
    dataSchema: {
      riskScore: { type: 'number', required: true, description: 'Overall risk score 0-100' },
      riskFactors: {
        type: 'array', required: true, maxItems: 4,
        fields: {
          label: { type: 'string', maxLength: 25 },
          value: { type: 'number', description: '0-100 factor intensity' },
          type: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
        },
        description: 'Individual risk factors',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },

  // ── Competitive ──
  {
    component: 'CompetitiveLandscapeScene',
    description: 'Market landscape showing competitors positioned by strength and role',
    category: 'competitive',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      competitors: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          name: { type: 'string', maxLength: 15 },
          position: { type: 'string', enum: ['leader', 'challenger', 'niche', 'emerging'] },
          strength: { type: 'number', description: '0-100 competitive strength' },
          description: { type: 'string', maxLength: 30 },
        },
        description: 'Market competitors',
      },
      marketName: { type: 'string', maxLength: 25, description: 'Market/industry name' },
    },
  },
  {
    component: 'BattleMapScene',
    description: 'Head-to-head comparison radar chart between two competitors',
    category: 'competitive',
    suggestedDuration: { min: 3, max: 5, default: 4 },
    dataSchema: {
      competitor1: {
        type: 'object', required: true,
        fields: {
          name: { type: 'string', maxLength: 15 },
          scores: { type: 'object', description: 'Dimension name -> score (0-100)' },
        },
      },
      competitor2: {
        type: 'object', required: true,
        fields: {
          name: { type: 'string', maxLength: 15 },
          scores: { type: 'object', description: 'Dimension name -> score (0-100)' },
        },
      },
      dimensions: {
        type: 'array', required: true, maxItems: 5,
        fields: { item: { type: 'string', maxLength: 15 } },
        description: 'Comparison dimension names',
      },
    },
  },

  // ── Legal ──
  {
    component: 'RulingImpactScene',
    description: 'Legal ruling with cascading impact areas and severity indicators',
    category: 'legal',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      ruling: { type: 'string', required: true, maxLength: 70, description: 'The ruling or legal decision' },
      impacts: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          area: { type: 'string', maxLength: 20 },
          impact: { type: 'string', maxLength: 40 },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        description: 'Areas impacted by the ruling',
      },
      jurisdiction: { type: 'string', maxLength: 25 },
    },
  },
  {
    component: 'AtRiskScene',
    description: 'Entities at risk with threat levels and reasons',
    category: 'legal',
    suggestedDuration: { min: 3, max: 5, default: 3 },
    dataSchema: {
      entities: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          name: { type: 'string', maxLength: 20 },
          type: { type: 'string', maxLength: 15 },
          riskLevel: { type: 'string', enum: ['critical', 'high', 'moderate', 'low'] },
          reason: { type: 'string', maxLength: 40 },
        },
        description: 'Entities under threat',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },

  // ── Tech Market ──
  {
    component: 'HypeVsRealityScene',
    description: 'Side-by-side hype vs reality comparison bars for tech claims',
    category: 'tech_market',
    suggestedDuration: { min: 3, max: 5, default: 4 },
    dataSchema: {
      items: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          claim: { type: 'string', maxLength: 30 },
          hypeScore: { type: 'number', description: '0-100 hype level' },
          realityScore: { type: 'number', description: '0-100 reality level' },
        },
        description: 'Tech claims with hype vs reality scores',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },
  {
    component: 'AdoptionCurveScene',
    description: 'Technology adoption S-curve with current position marker',
    category: 'tech_market',
    suggestedDuration: { min: 3, max: 5, default: 3 },
    dataSchema: {
      technology: { type: 'string', required: true, maxLength: 25, description: 'Technology name' },
      currentPosition: { type: 'number', required: true, description: '0-100 position on adoption curve' },
      phase: { type: 'string', required: true, enum: ['innovators', 'early_adopters', 'early_majority', 'late_majority', 'laggards'] },
      growthRate: { type: 'number', required: true, description: 'Growth rate percentage' },
      timeToMainstream: { type: 'string', maxLength: 15, description: 'Estimated time to mainstream' },
    },
  },

  // ── Contract ──
  {
    component: 'PriceComparisonScene',
    description: 'Contract price vs market price comparison for line items',
    category: 'contract',
    suggestedDuration: { min: 3, max: 5, default: 4 },
    dataSchema: {
      items: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          item: { type: 'string', maxLength: 25 },
          contractPrice: { type: 'number' },
          marketPrice: { type: 'number' },
        },
        description: 'Items with contract vs market prices',
      },
      contractName: { type: 'string', maxLength: 25 },
    },
  },
  {
    component: 'ShellCompanyWebScene',
    description: 'Network graph of shell companies with hidden connections',
    category: 'contract',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      entities: {
        type: 'array', required: true, maxItems: 5,
        fields: {
          name: { type: 'string', maxLength: 15 },
          type: { type: 'string', enum: ['company', 'person', 'offshore', 'unknown'] },
          suspicious: { type: 'boolean' },
        },
        description: 'Entities in the shell company web',
      },
      connections: {
        type: 'array', required: true, maxItems: 6,
        fields: {
          from: { type: 'string', maxLength: 15 },
          to: { type: 'string', maxLength: 15 },
          relationship: { type: 'string', maxLength: 20 },
          hidden: { type: 'boolean' },
        },
        description: 'Connections between entities',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },
  {
    component: 'CorruptionFlagsScene',
    description: 'Animated reveal of corruption indicators with severity badges',
    category: 'contract',
    suggestedDuration: { min: 3, max: 5, default: 3 },
    dataSchema: {
      flags: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          flag: { type: 'string', maxLength: 28 },
          evidence: { type: 'string', maxLength: 50 },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        },
        description: 'Corruption indicators',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },

  // ── Understanding ──
  {
    component: 'NarrativeComparisonScene',
    description: 'Official narrative vs real story side-by-side comparison',
    category: 'understanding',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      officialNarrative: {
        type: 'array', required: true, maxItems: 3,
        fields: { item: { type: 'string', maxLength: 50 } },
        description: 'Official/public narrative points',
      },
      realStory: {
        type: 'array', required: true, maxItems: 3,
        fields: { item: { type: 'string', maxLength: 50 } },
        description: 'Reality/hidden truth points',
      },
      discrepancies: {
        type: 'array', maxItems: 2,
        fields: { item: { type: 'string', maxLength: 50 } },
        description: 'Key discrepancies between narratives',
      },
    },
  },
  {
    component: 'CausalChainScene',
    description: 'Cause-and-effect chain showing how events connect',
    category: 'understanding',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      events: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          event: { type: 'string', maxLength: 25 },
          date: { type: 'string', maxLength: 12 },
          impact: { type: 'string', maxLength: 50 },
          type: { type: 'string', enum: ['cause', 'effect', 'hidden'] },
        },
        description: 'Events in the causal chain',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },

  // ── Due Diligence ──
  {
    component: 'RedFlagCompilationScene',
    description: 'Dramatic reveal of red flags with severity and evidence',
    category: 'due_diligence',
    suggestedDuration: { min: 3, max: 5, default: 4 },
    dataSchema: {
      flags: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          flag: { type: 'string', maxLength: 28 },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          evidence: { type: 'string', maxLength: 50 },
        },
        description: 'Red flags discovered during diligence',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },
  {
    component: 'LeadershipHistoryScene',
    description: 'Leadership team cards with track record and issues',
    category: 'due_diligence',
    suggestedDuration: { min: 3, max: 6, default: 4 },
    dataSchema: {
      leaders: {
        type: 'array', required: true, maxItems: 3,
        fields: {
          name: { type: 'string', maxLength: 20 },
          role: { type: 'string', maxLength: 20 },
          previousCompanies: { type: 'array', maxItems: 2, fields: { item: { type: 'string', maxLength: 15 } } },
          issues: { type: 'array', maxItems: 2, fields: { item: { type: 'string', maxLength: 30 } } },
          yearsExperience: { type: 'number' },
        },
        description: 'Leadership team members',
      },
      title: { type: 'string', maxLength: 30 },
    },
  },
];

/**
 * Build a compact JSON representation of the catalog for inclusion in CLI prompts.
 * Strips verbose descriptions and focuses on constraints.
 */
export function buildCatalogForPrompt(): string {
  const compact = SCENE_CATALOG.map(entry => ({
    component: entry.component,
    desc: entry.description,
    category: entry.category,
    duration: entry.suggestedDuration,
    data: Object.fromEntries(
      Object.entries(entry.dataSchema).map(([key, field]) => {
        const compact: Record<string, unknown> = { type: field.type };
        if (field.required) compact.required = true;
        if (field.maxLength) compact.maxLen = field.maxLength;
        if (field.maxItems) compact.maxItems = field.maxItems;
        if (field.enum) compact.enum = field.enum;
        if (field.fields) {
          compact.fields = Object.fromEntries(
            Object.entries(field.fields).map(([fk, fv]) => {
              const fc: Record<string, unknown> = { type: fv.type };
              if (fv.maxLength) fc.maxLen = fv.maxLength;
              if (fv.maxItems) fc.maxItems = fv.maxItems;
              if (fv.enum) fc.enum = fv.enum;
              if (fv.fields) fc.fields = fv.fields;
              return [fk, fc];
            })
          );
        }
        return [key, compact];
      })
    ),
  }));

  return JSON.stringify(compact, null, 2);
}

/**
 * Map of component names for quick validation lookup
 */
export const VALID_SCENE_COMPONENTS = new Set(
  SCENE_CATALOG.map(entry => entry.component)
);

import type { Pacing } from './types';

export const PACING_CONFIG: Record<Pacing, { enterFrames: number; exitFrames: number }> = {
  fast:     { enterFrames: 4,  exitFrames: 3  },
  normal:   { enterFrames: 8,  exitFrames: 6  },
  slow:     { enterFrames: 14, exitFrames: 10 },
  dramatic: { enterFrames: 20, exitFrames: 14 },
};

export const SCENE_VARIANTS: Record<string, string[]> = {
  HookScene:          ['centered', 'editorial', 'cinematic'],
  VerdictScene:       ['standard', 'fullscreen', 'minimal'],
  BullBearScene:      ['split', 'stacked', 'minimal'],
  PatternRevealScene: ['cards', 'timeline'],
};
