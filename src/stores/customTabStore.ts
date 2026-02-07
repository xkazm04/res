/**
 * Custom Tab Composition Store
 *
 * Manages user-created custom tabs that combine and filter content
 * across all data types (findings, entities, sources, perspectives, etc.)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FindingType,
  EntityType,
  SourceType,
  PerspectiveType,
  GapPriority,
  TemporalContext,
} from '@/src/types/research';

// ============================================
// FILTER TYPES
// ============================================

export interface ConfidenceFilter {
  enabled: boolean;
  min: number; // 0-100
  max: number; // 0-100
}

export interface CredibilityFilter {
  enabled: boolean;
  min: number; // 0-100
  max: number; // 0-100
}

export interface DateFilter {
  enabled: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TextFilter {
  enabled: boolean;
  query: string;
  matchType: 'contains' | 'exact' | 'regex';
}

// ============================================
// DATA SOURCE CONFIGURATIONS
// ============================================

export interface FindingsConfig {
  enabled: boolean;
  types: FindingType[];
  confidence: ConfidenceFilter;
  temporalContext: TemporalContext[];
  textFilter: TextFilter;
  limit?: number;
}

export interface EntitiesConfig {
  enabled: boolean;
  types: EntityType[];
  roles: string[]; // financial, political, etc.
  minMentions?: number;
  textFilter: TextFilter;
  limit?: number;
}

export interface SourcesConfig {
  enabled: boolean;
  types: SourceType[];
  credibility: CredibilityFilter;
  textFilter: TextFilter;
  limit?: number;
}

export interface PerspectivesConfig {
  enabled: boolean;
  types: PerspectiveType[];
  includeWarnings: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
  textFilter: TextFilter;
  limit?: number;
}

export interface ContradictionsConfig {
  enabled: boolean;
  minSignificance?: number;
  textFilter: TextFilter;
  limit?: number;
}

export interface GapsConfig {
  enabled: boolean;
  priorities: GapPriority[];
  types: string[];
  textFilter: TextFilter;
  limit?: number;
}

export interface CausalChainsConfig {
  enabled: boolean;
  minLength?: number;
  textFilter: TextFilter;
  limit?: number;
}

// ============================================
// CUSTOM TAB DEFINITION
// ============================================

export type DataSourceType =
  | 'findings'
  | 'entities'
  | 'sources'
  | 'perspectives'
  | 'contradictions'
  | 'gaps'
  | 'causalChains';

export interface CustomTabComposition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;

  // Data source configurations
  findings: FindingsConfig;
  entities: EntitiesConfig;
  sources: SourcesConfig;
  perspectives: PerspectivesConfig;
  contradictions: ContradictionsConfig;
  gaps: GapsConfig;
  causalChains: CausalChainsConfig;

  // Layout preferences
  layout: 'stacked' | 'columns' | 'grid';
  sectionOrder: DataSourceType[];
  collapsedSections: DataSourceType[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  templateCategory?: string;
  author?: string;
  usageCount: number;
}

// ============================================
// TEMPLATE PRESETS
// ============================================

export interface CustomTabTemplate {
  id: string;
  name: string;
  description: string;
  category: 'due_diligence' | 'competitive_intel' | 'investigative' | 'financial' | 'general';
  icon: string;
  composition: Omit<CustomTabComposition, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

const defaultTextFilter: TextFilter = {
  enabled: false,
  query: '',
  matchType: 'contains',
};

const defaultConfidenceFilter: ConfidenceFilter = {
  enabled: false,
  min: 0,
  max: 100,
};

const defaultCredibilityFilter: CredibilityFilter = {
  enabled: false,
  min: 0,
  max: 100,
};

export const defaultFindingsConfig: FindingsConfig = {
  enabled: true,
  types: [],
  confidence: defaultConfidenceFilter,
  temporalContext: [],
  textFilter: defaultTextFilter,
};

export const defaultEntitiesConfig: EntitiesConfig = {
  enabled: false,
  types: [],
  roles: [],
  textFilter: defaultTextFilter,
};

export const defaultSourcesConfig: SourcesConfig = {
  enabled: false,
  types: [],
  credibility: defaultCredibilityFilter,
  textFilter: defaultTextFilter,
};

export const defaultPerspectivesConfig: PerspectivesConfig = {
  enabled: false,
  types: [],
  includeWarnings: true,
  includeInsights: true,
  includeRecommendations: true,
  textFilter: defaultTextFilter,
};

export const defaultContradictionsConfig: ContradictionsConfig = {
  enabled: false,
  textFilter: defaultTextFilter,
};

export const defaultGapsConfig: GapsConfig = {
  enabled: false,
  priorities: [],
  types: [],
  textFilter: defaultTextFilter,
};

export const defaultCausalChainsConfig: CausalChainsConfig = {
  enabled: false,
  textFilter: defaultTextFilter,
};

// ============================================
// BUILT-IN TEMPLATES
// ============================================

export const builtInTemplates: CustomTabTemplate[] = [
  {
    id: 'financial-risk',
    name: 'Financial Risk Analysis',
    description: 'High-priority gaps, money-related contradictions, financial entities, and credibility concerns',
    category: 'financial',
    icon: '💰',
    composition: {
      name: 'Financial Risk Analysis',
      description: 'Focus on financial risks and money-related findings',
      icon: '💰',
      color: '#22c55e',
      isTemplate: true,
      templateCategory: 'financial',
      findings: {
        ...defaultFindingsConfig,
        enabled: true,
        types: ['evidence', 'relationship', 'pattern'],
        confidence: { enabled: true, min: 0, max: 60 },
        textFilter: { enabled: true, query: 'money|financial|fund|payment|transaction|invest', matchType: 'regex' },
      },
      entities: {
        ...defaultEntitiesConfig,
        enabled: true,
        types: ['organization', 'person'],
        roles: ['financial', 'beneficiary'],
        textFilter: defaultTextFilter,
      },
      sources: {
        ...defaultSourcesConfig,
        enabled: true,
        credibility: { enabled: true, min: 0, max: 50 },
        textFilter: defaultTextFilter,
      },
      perspectives: {
        ...defaultPerspectivesConfig,
        enabled: true,
        types: ['financial', 'economic'],
        includeWarnings: true,
        includeInsights: false,
        includeRecommendations: false,
        textFilter: defaultTextFilter,
      },
      contradictions: {
        ...defaultContradictionsConfig,
        enabled: true,
        textFilter: { enabled: true, query: 'money|financial|fund|amount', matchType: 'regex' },
      },
      gaps: {
        ...defaultGapsConfig,
        enabled: true,
        priorities: ['high'],
        textFilter: defaultTextFilter,
      },
      causalChains: defaultCausalChainsConfig,
      layout: 'stacked',
      sectionOrder: ['gaps', 'contradictions', 'findings', 'entities', 'sources', 'perspectives', 'causalChains'],
      collapsedSections: [],
    },
  },
  {
    id: 'due-diligence',
    name: 'Due Diligence Review',
    description: 'Comprehensive entity background check with red flags and source verification',
    category: 'due_diligence',
    icon: '🔍',
    composition: {
      name: 'Due Diligence Review',
      description: 'Background check focused on entities and verification',
      icon: '🔍',
      color: '#3b82f6',
      isTemplate: true,
      templateCategory: 'due_diligence',
      findings: {
        ...defaultFindingsConfig,
        enabled: true,
        types: ['fact', 'event', 'actor', 'relationship'],
        textFilter: defaultTextFilter,
      },
      entities: {
        ...defaultEntitiesConfig,
        enabled: true,
        types: ['person', 'organization'],
        minMentions: 2,
        textFilter: defaultTextFilter,
      },
      sources: {
        ...defaultSourcesConfig,
        enabled: true,
        types: ['government', 'academic', 'news'],
        textFilter: defaultTextFilter,
      },
      perspectives: {
        ...defaultPerspectivesConfig,
        enabled: true,
        types: ['network', 'journalist'],
        includeWarnings: true,
        includeInsights: true,
        includeRecommendations: true,
        textFilter: defaultTextFilter,
      },
      contradictions: {
        ...defaultContradictionsConfig,
        enabled: true,
        textFilter: defaultTextFilter,
      },
      gaps: {
        ...defaultGapsConfig,
        enabled: true,
        priorities: ['high', 'medium'],
        types: ['actor', 'evidence'],
        textFilter: defaultTextFilter,
      },
      causalChains: defaultCausalChainsConfig,
      layout: 'stacked',
      sectionOrder: ['entities', 'findings', 'contradictions', 'gaps', 'sources', 'perspectives', 'causalChains'],
      collapsedSections: [],
    },
  },
  {
    id: 'competitive-intel',
    name: 'Competitive Intelligence',
    description: 'Market positioning, competitor entities, and strategic patterns',
    category: 'competitive_intel',
    icon: '⚔️',
    composition: {
      name: 'Competitive Intelligence',
      description: 'Focus on competitors and market dynamics',
      icon: '⚔️',
      color: '#8b5cf6',
      isTemplate: true,
      templateCategory: 'competitive_intel',
      findings: {
        ...defaultFindingsConfig,
        enabled: true,
        types: ['pattern', 'relationship', 'event'],
        textFilter: { enabled: true, query: 'market|competitor|strategy|launch|product', matchType: 'regex' },
      },
      entities: {
        ...defaultEntitiesConfig,
        enabled: true,
        types: ['organization', 'product'],
        textFilter: defaultTextFilter,
      },
      sources: {
        ...defaultSourcesConfig,
        enabled: true,
        types: ['news', 'corporate'],
        textFilter: defaultTextFilter,
      },
      perspectives: {
        ...defaultPerspectivesConfig,
        enabled: true,
        types: ['economic', 'technological'],
        textFilter: defaultTextFilter,
      },
      contradictions: defaultContradictionsConfig,
      gaps: {
        ...defaultGapsConfig,
        enabled: true,
        priorities: ['high'],
        types: ['topic'],
        textFilter: defaultTextFilter,
      },
      causalChains: {
        ...defaultCausalChainsConfig,
        enabled: true,
        minLength: 3,
        textFilter: defaultTextFilter,
      },
      layout: 'columns',
      sectionOrder: ['findings', 'entities', 'causalChains', 'gaps', 'sources', 'perspectives', 'contradictions'],
      collapsedSections: [],
    },
  },
  {
    id: 'investigative',
    name: 'Investigative Journalism',
    description: 'Red flags, contradictions, source credibility issues, and evidence gaps',
    category: 'investigative',
    icon: '📰',
    composition: {
      name: 'Investigative Journalism',
      description: 'Focus on uncovering issues and verifying claims',
      icon: '📰',
      color: '#ef4444',
      isTemplate: true,
      templateCategory: 'investigative',
      findings: {
        ...defaultFindingsConfig,
        enabled: true,
        types: ['claim', 'evidence', 'gap'],
        confidence: { enabled: true, min: 0, max: 70 },
        textFilter: defaultTextFilter,
      },
      entities: {
        ...defaultEntitiesConfig,
        enabled: true,
        types: ['person', 'organization'],
        textFilter: defaultTextFilter,
      },
      sources: {
        ...defaultSourcesConfig,
        enabled: true,
        credibility: { enabled: true, min: 0, max: 60 },
        textFilter: defaultTextFilter,
      },
      perspectives: {
        ...defaultPerspectivesConfig,
        enabled: true,
        types: ['journalist', 'conspirator'],
        includeWarnings: true,
        includeInsights: false,
        includeRecommendations: false,
        textFilter: defaultTextFilter,
      },
      contradictions: {
        ...defaultContradictionsConfig,
        enabled: true,
        textFilter: defaultTextFilter,
      },
      gaps: {
        ...defaultGapsConfig,
        enabled: true,
        priorities: ['high', 'medium'],
        types: ['evidence', 'actor'],
        textFilter: defaultTextFilter,
      },
      causalChains: defaultCausalChainsConfig,
      layout: 'stacked',
      sectionOrder: ['contradictions', 'gaps', 'findings', 'sources', 'perspectives', 'entities', 'causalChains'],
      collapsedSections: [],
    },
  },
];

// ============================================
// STORE INTERFACE
// ============================================

interface CustomTabState {
  // User's custom tabs
  customTabs: CustomTabComposition[];

  // Currently editing tab (if any)
  editingTabId: string | null;

  // Draft state for new/editing tab
  draft: Partial<CustomTabComposition> | null;

  // Active custom tab in view
  activeCustomTabId: string | null;

  // Composer modal state
  isComposerOpen: boolean;

  // Actions
  createTab: (name: string, fromTemplate?: string) => string;
  updateTab: (id: string, updates: Partial<CustomTabComposition>) => void;
  deleteTab: (id: string) => void;
  duplicateTab: (id: string) => string;

  // Draft management
  startEditing: (id: string) => void;
  startCreating: (fromTemplate?: string) => void;
  updateDraft: (updates: Partial<CustomTabComposition>) => void;
  saveDraft: () => string | null;
  cancelEditing: () => void;

  // View management
  setActiveCustomTab: (id: string | null) => void;
  openComposer: () => void;
  closeComposer: () => void;

  // Template management
  saveAsTemplate: (id: string, category: CustomTabTemplate['category']) => void;
  incrementUsage: (id: string) => void;

  // Import/Export
  exportTab: (id: string) => string;
  importTab: (json: string) => string | null;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

function generateId(): string {
  return `custom-tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyComposition(name: string): CustomTabComposition {
  return {
    id: generateId(),
    name,
    findings: { ...defaultFindingsConfig },
    entities: { ...defaultEntitiesConfig },
    sources: { ...defaultSourcesConfig },
    perspectives: { ...defaultPerspectivesConfig },
    contradictions: { ...defaultContradictionsConfig },
    gaps: { ...defaultGapsConfig },
    causalChains: { ...defaultCausalChainsConfig },
    layout: 'stacked',
    sectionOrder: ['findings', 'entities', 'sources', 'perspectives', 'contradictions', 'gaps', 'causalChains'],
    collapsedSections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
    usageCount: 0,
  };
}

function createFromTemplate(template: CustomTabTemplate): CustomTabComposition {
  return {
    ...template.composition,
    id: generateId(),
    name: template.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  };
}

export const useCustomTabStore = create<CustomTabState>()(
  persist(
    (set, get) => ({
      customTabs: [],
      editingTabId: null,
      draft: null,
      activeCustomTabId: null,
      isComposerOpen: false,

      createTab: (name, fromTemplateId) => {
        const template = fromTemplateId
          ? builtInTemplates.find(t => t.id === fromTemplateId)
          : null;

        const newTab = template
          ? createFromTemplate(template)
          : createEmptyComposition(name);

        newTab.name = name;

        set(state => ({
          customTabs: [...state.customTabs, newTab],
        }));

        return newTab.id;
      },

      updateTab: (id, updates) => {
        set(state => ({
          customTabs: state.customTabs.map(tab =>
            tab.id === id
              ? { ...tab, ...updates, updatedAt: new Date().toISOString() }
              : tab
          ),
        }));
      },

      deleteTab: (id) => {
        set(state => ({
          customTabs: state.customTabs.filter(tab => tab.id !== id),
          activeCustomTabId: state.activeCustomTabId === id ? null : state.activeCustomTabId,
        }));
      },

      duplicateTab: (id) => {
        const state = get();
        const original = state.customTabs.find(t => t.id === id);
        if (!original) return '';

        const duplicate: CustomTabComposition = {
          ...original,
          id: generateId(),
          name: `${original.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0,
        };

        set(state => ({
          customTabs: [...state.customTabs, duplicate],
        }));

        return duplicate.id;
      },

      startEditing: (id) => {
        const tab = get().customTabs.find(t => t.id === id);
        if (tab) {
          set({ editingTabId: id, draft: { ...tab }, isComposerOpen: true });
        }
      },

      startCreating: (fromTemplateId) => {
        const template = fromTemplateId
          ? builtInTemplates.find(t => t.id === fromTemplateId)
          : null;

        const draft = template
          ? { ...template.composition, id: generateId() }
          : createEmptyComposition('New Custom Tab');

        set({ editingTabId: null, draft, isComposerOpen: true });
      },

      updateDraft: (updates) => {
        set(state => ({
          draft: state.draft ? { ...state.draft, ...updates } : null,
        }));
      },

      saveDraft: () => {
        const { draft, editingTabId, customTabs } = get();
        if (!draft) return null;

        const now = new Date().toISOString();

        if (editingTabId) {
          // Update existing tab
          set({
            customTabs: customTabs.map(tab =>
              tab.id === editingTabId
                ? { ...tab, ...draft, updatedAt: now } as CustomTabComposition
                : tab
            ),
            editingTabId: null,
            draft: null,
            isComposerOpen: false,
          });
          return editingTabId;
        } else {
          // Create new tab
          const newTab: CustomTabComposition = {
            ...createEmptyComposition(draft.name || 'Custom Tab'),
            ...draft,
            id: draft.id || generateId(),
            createdAt: now,
            updatedAt: now,
          };

          set({
            customTabs: [...customTabs, newTab],
            editingTabId: null,
            draft: null,
            isComposerOpen: false,
          });
          return newTab.id;
        }
      },

      cancelEditing: () => {
        set({ editingTabId: null, draft: null, isComposerOpen: false });
      },

      setActiveCustomTab: (id) => {
        set({ activeCustomTabId: id });
        if (id) {
          get().incrementUsage(id);
        }
      },

      openComposer: () => {
        set({ isComposerOpen: true });
      },

      closeComposer: () => {
        set({ isComposerOpen: false, editingTabId: null, draft: null });
      },

      saveAsTemplate: (id, category) => {
        set(state => ({
          customTabs: state.customTabs.map(tab =>
            tab.id === id
              ? { ...tab, isTemplate: true, templateCategory: category, updatedAt: new Date().toISOString() }
              : tab
          ),
        }));
      },

      incrementUsage: (id) => {
        set(state => ({
          customTabs: state.customTabs.map(tab =>
            tab.id === id
              ? { ...tab, usageCount: tab.usageCount + 1 }
              : tab
          ),
        }));
      },

      exportTab: (id) => {
        const tab = get().customTabs.find(t => t.id === id);
        if (!tab) return '';

        const exportData = {
          version: 1,
          type: 'custom-tab-composition',
          data: tab,
        };

        return JSON.stringify(exportData, null, 2);
      },

      importTab: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (parsed.type !== 'custom-tab-composition') {
            return null;
          }

          const tab = parsed.data as CustomTabComposition;
          const newTab: CustomTabComposition = {
            ...tab,
            id: generateId(),
            name: `${tab.name} (Imported)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
          };

          set(state => ({
            customTabs: [...state.customTabs, newTab],
          }));

          return newTab.id;
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'custom-tab-storage',
      partialize: (state) => ({
        customTabs: state.customTabs,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectCustomTabs = (state: CustomTabState) => state.customTabs;
export const selectActiveCustomTab = (state: CustomTabState) =>
  state.customTabs.find(t => t.id === state.activeCustomTabId);
export const selectDraft = (state: CustomTabState) => state.draft;
export const selectIsComposerOpen = (state: CustomTabState) => state.isComposerOpen;
export const selectUserTemplates = (state: CustomTabState) =>
  state.customTabs.filter(t => t.isTemplate);
