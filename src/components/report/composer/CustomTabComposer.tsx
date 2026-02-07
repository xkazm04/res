'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme } from '../core/ThemeContext';
import {
  useCustomTabStore,
  builtInTemplates,
  type CustomTabComposition,
  type DataSourceType,
  defaultFindingsConfig,
  defaultEntitiesConfig,
  defaultSourcesConfig,
  defaultPerspectivesConfig,
  defaultContradictionsConfig,
  defaultGapsConfig,
  defaultCausalChainsConfig,
} from '@/src/stores/customTabStore';
import {
  TextFilterBuilder,
  RangeFilterBuilder,
  MultiSelectChips,
  SectionToggle,
  LimitInput,
  FINDING_TYPES,
  ENTITY_TYPES,
  SOURCE_TYPES,
  PERSPECTIVE_TYPES,
  GAP_PRIORITIES,
  TEMPORAL_CONTEXTS,
} from './FilterBuilder';
import {
  DATA_SOURCE_LABELS,
  DATA_SOURCE_ICONS,
  extractCustomTabData,
  computeCustomTabStats,
  type ExtractedCustomTabData,
  type CustomTabStats,
} from '@/src/lib/customTabComposition';
import type { SessionWithDetails } from '@/src/types/research';

// ============================================
// COMPOSER MODAL
// ============================================

interface CustomTabComposerProps {
  session?: SessionWithDetails;
  onClose: () => void;
  onSave?: (tabId: string) => void;
}

export function CustomTabComposer({ session, onClose, onSave }: CustomTabComposerProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const {
    draft,
    editingTabId,
    startCreating,
    updateDraft,
    saveDraft,
    cancelEditing,
  } = useCustomTabStore();

  const [activeStep, setActiveStep] = useState<'templates' | 'configure' | 'preview'>(
    draft ? 'configure' : 'templates'
  );

  // Handle template selection
  const handleSelectTemplate = useCallback(
    (templateId?: string) => {
      startCreating(templateId);
      setActiveStep('configure');
    },
    [startCreating]
  );

  // Handle save
  const handleSave = useCallback(() => {
    const id = saveDraft();
    if (id) {
      onSave?.(id);
      onClose();
    }
  }, [saveDraft, onSave, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancelEditing();
    onClose();
  }, [cancelEditing, onClose]);

  // Session stats for preview
  const sessionStats = useMemo(() => {
    if (!session) return null;
    return {
      findings: session.findings?.length || 0,
      entities: session.entities?.length || 0,
      sources: session.sources?.length || 0,
      perspectives: session.perspectives?.length || 0,
      contradictions: session.contradictions?.length || 0,
      gaps: session.gaps?.length || 0,
      causalChains: session.causal_chains?.length || 0,
    };
  }, [session]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl ${
          isRadar
            ? 'bg-slate-900 border border-cyan-500/30'
            : 'bg-white border border-stone-200'
        }`}
        data-testid="custom-tab-composer-modal"
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isRadar ? 'border-cyan-500/20 bg-slate-950/50' : 'border-stone-200'
          }`}
        >
          <div>
            <h2 className={`text-lg font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {editingTabId ? 'Edit Custom Tab' : 'Create Custom Tab'}
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {activeStep === 'templates' && 'Start from a template or create from scratch'}
              {activeStep === 'configure' && 'Configure your data filters and layout'}
              {activeStep === 'preview' && 'Preview how your tab will look'}
            </p>
          </div>

          <button
            onClick={handleCancel}
            className={`p-2 rounded-lg transition-colors ${
              isRadar
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
            }`}
            data-testid="composer-close-btn"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className={`px-6 py-3 border-b ${isRadar ? 'border-slate-800' : 'border-stone-100'}`}>
          <div className="flex gap-2">
            {(['templates', 'configure', 'preview'] as const).map((step, i) => (
              <button
                key={step}
                onClick={() => step !== 'templates' || !draft ? setActiveStep(step) : null}
                disabled={step !== 'templates' && !draft}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  activeStep === step
                    ? isRadar
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-stone-900 text-white'
                    : isRadar
                      ? 'text-slate-400 hover:text-slate-300'
                      : 'text-stone-500 hover:text-stone-700'
                } ${step !== 'templates' && !draft ? 'opacity-50 cursor-not-allowed' : ''}`}
                data-testid={`composer-step-${step}`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    activeStep === step
                      ? isRadar
                        ? 'bg-cyan-500 text-slate-900'
                        : 'bg-white text-stone-900'
                      : isRadar
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="capitalize">{step}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeStep === 'templates' && (
              <TemplatesStep key="templates" onSelect={handleSelectTemplate} />
            )}
            {activeStep === 'configure' && draft && (
              <ConfigureStep
                key="configure"
                draft={draft}
                onUpdate={updateDraft}
                sessionStats={sessionStats}
              />
            )}
            {activeStep === 'preview' && draft && session && (
              <PreviewStep key="preview" draft={draft} session={session} />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isRadar ? 'border-cyan-500/20 bg-slate-950/50' : 'border-stone-200 bg-stone-50'
          }`}
        >
          <button
            onClick={handleCancel}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              isRadar
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200'
            }`}
            data-testid="composer-cancel-btn"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {activeStep !== 'templates' && (
              <button
                onClick={() =>
                  setActiveStep(activeStep === 'configure' ? 'templates' : 'configure')
                }
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  isRadar
                    ? 'text-slate-300 border border-slate-600 hover:border-slate-500'
                    : 'text-stone-700 border border-stone-300 hover:border-stone-400'
                }`}
                data-testid="composer-back-btn"
              >
                Back
              </button>
            )}

            {activeStep === 'configure' && (
              <button
                onClick={() => setActiveStep('preview')}
                disabled={!session}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  session
                    ? isRadar
                      ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                      : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                    : 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-500'
                }`}
                data-testid="composer-preview-btn"
              >
                Preview
              </button>
            )}

            {(activeStep === 'configure' || activeStep === 'preview') && (
              <button
                onClick={handleSave}
                disabled={!draft?.name}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  draft?.name
                    ? isRadar
                      ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                    : 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-500'
                }`}
                data-testid="composer-save-btn"
              >
                {editingTabId ? 'Save Changes' : 'Create Tab'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// TEMPLATES STEP
// ============================================

interface TemplatesStepProps {
  onSelect: (templateId?: string) => void;
}

function TemplatesStep({ onSelect }: TemplatesStepProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 space-y-6"
    >
      {/* Start from scratch */}
      <button
        onClick={() => onSelect()}
        className={`w-full p-4 rounded-lg border-2 border-dashed transition-colors text-left group ${
          isRadar
            ? 'border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/50'
            : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'
        }`}
        data-testid="template-blank"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
              isRadar
                ? 'bg-slate-800 group-hover:bg-cyan-500/20'
                : 'bg-stone-100 group-hover:bg-stone-200'
            }`}
          >
            ➕
          </div>
          <div>
            <h3 className={`font-medium ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              Start from Scratch
            </h3>
            <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              Build a custom tab with your own filters
            </p>
          </div>
        </div>
      </button>

      {/* Template categories */}
      <div className="space-y-4">
        <h3 className={`text-sm font-medium ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
          Or start from a template
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {builtInTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`p-4 rounded-lg border transition-colors text-left group ${
                isRadar
                  ? 'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
              data-testid={`template-${template.id}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate ${isRadar ? 'text-white' : 'text-stone-900'}`}>
                    {template.name}
                  </h4>
                  <p className={`text-xs mt-1 line-clamp-2 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                    {template.description}
                  </p>
                  <span
                    className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${
                      isRadar
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {template.category.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// CONFIGURE STEP
// ============================================

interface ConfigureStepProps {
  draft: Partial<CustomTabComposition>;
  onUpdate: (updates: Partial<CustomTabComposition>) => void;
  sessionStats: {
    findings: number;
    entities: number;
    sources: number;
    perspectives: number;
    contradictions: number;
    gaps: number;
    causalChains: number;
  } | null;
}

function ConfigureStep({ draft, onUpdate, sessionStats }: ConfigureStepProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 space-y-6"
    >
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
            Tab Name *
          </label>
          <input
            type="text"
            value={draft.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Financial Risk Analysis"
            className={`w-full px-4 py-2 rounded-lg border ${
              isRadar
                ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500'
                : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-400'
            } focus:outline-none`}
            data-testid="tab-name-input"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
            Description
          </label>
          <textarea
            value={draft.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe what this tab focuses on..."
            rows={2}
            className={`w-full px-4 py-2 rounded-lg border resize-none ${
              isRadar
                ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500'
                : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-400'
            } focus:outline-none`}
            data-testid="tab-description-input"
          />
        </div>

        <div className="flex gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
              Icon
            </label>
            <input
              type="text"
              value={draft.icon || ''}
              onChange={(e) => onUpdate({ icon: e.target.value })}
              placeholder="📊"
              className={`w-16 px-3 py-2 rounded-lg border text-center text-lg ${
                isRadar
                  ? 'bg-slate-800 border-slate-600 text-white focus:border-cyan-500'
                  : 'bg-white border-stone-200 text-stone-900 focus:border-stone-400'
              } focus:outline-none`}
              data-testid="tab-icon-input"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
              Layout
            </label>
            <select
              value={draft.layout || 'stacked'}
              onChange={(e) => onUpdate({ layout: e.target.value as 'stacked' | 'columns' | 'grid' })}
              className={`px-3 py-2 rounded-lg border ${
                isRadar
                  ? 'bg-slate-800 border-slate-600 text-white focus:border-cyan-500'
                  : 'bg-white border-stone-200 text-stone-900 focus:border-stone-400'
              } focus:outline-none`}
              data-testid="tab-layout-select"
            >
              <option value="stacked">Stacked</option>
              <option value="columns">Two Columns</option>
              <option value="grid">Grid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Source Sections */}
      <div className="space-y-3">
        <h3 className={`text-sm font-medium ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
          Data Sources
        </h3>

        {/* Findings */}
        <SectionToggle
          label={DATA_SOURCE_LABELS.findings}
          icon={DATA_SOURCE_ICONS.findings}
          enabled={draft.findings?.enabled ?? false}
          onToggle={(enabled) =>
            onUpdate({
              findings: { ...(draft.findings || defaultFindingsConfig), enabled },
            })
          }
          count={sessionStats?.findings}
        >
          <MultiSelectChips
            label="Finding Types"
            options={FINDING_TYPES}
            selected={draft.findings?.types || []}
            onChange={(types) =>
              onUpdate({
                findings: { ...(draft.findings || defaultFindingsConfig), types },
              })
            }
          />
          <RangeFilterBuilder
            label="Confidence"
            value={draft.findings?.confidence || { enabled: false, min: 0, max: 100 }}
            onChange={(confidence) =>
              onUpdate({
                findings: { ...(draft.findings || defaultFindingsConfig), confidence },
              })
            }
          />
          <MultiSelectChips
            label="Temporal Context"
            options={TEMPORAL_CONTEXTS}
            selected={draft.findings?.temporalContext || []}
            onChange={(temporalContext) =>
              onUpdate({
                findings: { ...(draft.findings || defaultFindingsConfig), temporalContext },
              })
            }
          />
          <TextFilterBuilder
            value={draft.findings?.textFilter || { enabled: false, query: '', matchType: 'contains' }}
            onChange={(textFilter) =>
              onUpdate({
                findings: { ...(draft.findings || defaultFindingsConfig), textFilter },
              })
            }
            placeholder="Filter findings by keyword..."
          />
          <LimitInput
            value={draft.findings?.limit}
            onChange={(limit) =>
              onUpdate({
                findings: { ...(draft.findings || defaultFindingsConfig), limit },
              })
            }
          />
        </SectionToggle>

        {/* Entities */}
        <SectionToggle
          label={DATA_SOURCE_LABELS.entities}
          icon={DATA_SOURCE_ICONS.entities}
          enabled={draft.entities?.enabled ?? false}
          onToggle={(enabled) =>
            onUpdate({
              entities: { ...(draft.entities || defaultEntitiesConfig), enabled },
            })
          }
          count={sessionStats?.entities}
        >
          <MultiSelectChips
            label="Entity Types"
            options={ENTITY_TYPES}
            selected={draft.entities?.types || []}
            onChange={(types) =>
              onUpdate({
                entities: { ...(draft.entities || defaultEntitiesConfig), types },
              })
            }
          />
          <TextFilterBuilder
            value={draft.entities?.textFilter || { enabled: false, query: '', matchType: 'contains' }}
            onChange={(textFilter) =>
              onUpdate({
                entities: { ...(draft.entities || defaultEntitiesConfig), textFilter },
              })
            }
            placeholder="Filter entities by name..."
          />
          <LimitInput
            value={draft.entities?.limit}
            onChange={(limit) =>
              onUpdate({
                entities: { ...(draft.entities || defaultEntitiesConfig), limit },
              })
            }
          />
        </SectionToggle>

        {/* Sources */}
        <SectionToggle
          label={DATA_SOURCE_LABELS.sources}
          icon={DATA_SOURCE_ICONS.sources}
          enabled={draft.sources?.enabled ?? false}
          onToggle={(enabled) =>
            onUpdate({
              sources: { ...(draft.sources || defaultSourcesConfig), enabled },
            })
          }
          count={sessionStats?.sources}
        >
          <MultiSelectChips
            label="Source Types"
            options={SOURCE_TYPES}
            selected={draft.sources?.types || []}
            onChange={(types) =>
              onUpdate({
                sources: { ...(draft.sources || defaultSourcesConfig), types },
              })
            }
          />
          <RangeFilterBuilder
            label="Credibility"
            value={draft.sources?.credibility || { enabled: false, min: 0, max: 100 }}
            onChange={(credibility) =>
              onUpdate({
                sources: { ...(draft.sources || defaultSourcesConfig), credibility },
              })
            }
          />
          <TextFilterBuilder
            value={draft.sources?.textFilter || { enabled: false, query: '', matchType: 'contains' }}
            onChange={(textFilter) =>
              onUpdate({
                sources: { ...(draft.sources || defaultSourcesConfig), textFilter },
              })
            }
            placeholder="Filter sources by URL or title..."
          />
          <LimitInput
            value={draft.sources?.limit}
            onChange={(limit) =>
              onUpdate({
                sources: { ...(draft.sources || defaultSourcesConfig), limit },
              })
            }
          />
        </SectionToggle>

        {/* Perspectives */}
        <SectionToggle
          label={DATA_SOURCE_LABELS.perspectives}
          icon={DATA_SOURCE_ICONS.perspectives}
          enabled={draft.perspectives?.enabled ?? false}
          onToggle={(enabled) =>
            onUpdate({
              perspectives: { ...(draft.perspectives || defaultPerspectivesConfig), enabled },
            })
          }
          count={sessionStats?.perspectives}
        >
          <MultiSelectChips
            label="Perspective Types"
            options={PERSPECTIVE_TYPES}
            selected={draft.perspectives?.types || []}
            onChange={(types) =>
              onUpdate({
                perspectives: { ...(draft.perspectives || defaultPerspectivesConfig), types },
              })
            }
          />
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.perspectives?.includeWarnings ?? true}
                onChange={(e) =>
                  onUpdate({
                    perspectives: {
                      ...(draft.perspectives || defaultPerspectivesConfig),
                      includeWarnings: e.target.checked,
                    },
                  })
                }
              />
              <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                Warnings
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.perspectives?.includeInsights ?? true}
                onChange={(e) =>
                  onUpdate({
                    perspectives: {
                      ...(draft.perspectives || defaultPerspectivesConfig),
                      includeInsights: e.target.checked,
                    },
                  })
                }
              />
              <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                Insights
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.perspectives?.includeRecommendations ?? true}
                onChange={(e) =>
                  onUpdate({
                    perspectives: {
                      ...(draft.perspectives || defaultPerspectivesConfig),
                      includeRecommendations: e.target.checked,
                    },
                  })
                }
              />
              <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                Recommendations
              </span>
            </label>
          </div>
          <TextFilterBuilder
            value={draft.perspectives?.textFilter || { enabled: false, query: '', matchType: 'contains' }}
            onChange={(textFilter) =>
              onUpdate({
                perspectives: { ...(draft.perspectives || defaultPerspectivesConfig), textFilter },
              })
            }
            placeholder="Filter perspectives by content..."
          />
          <LimitInput
            value={draft.perspectives?.limit}
            onChange={(limit) =>
              onUpdate({
                perspectives: { ...(draft.perspectives || defaultPerspectivesConfig), limit },
              })
            }
          />
        </SectionToggle>

        {/* Contradictions */}
        <SectionToggle
          label={DATA_SOURCE_LABELS.contradictions}
          icon={DATA_SOURCE_ICONS.contradictions}
          enabled={draft.contradictions?.enabled ?? false}
          onToggle={(enabled) =>
            onUpdate({
              contradictions: { ...(draft.contradictions || defaultContradictionsConfig), enabled },
            })
          }
          count={sessionStats?.contradictions}
        >
          <TextFilterBuilder
            value={draft.contradictions?.textFilter || { enabled: false, query: '', matchType: 'contains' }}
            onChange={(textFilter) =>
              onUpdate({
                contradictions: { ...(draft.contradictions || defaultContradictionsConfig), textFilter },
              })
            }
            placeholder="Filter contradictions by claim..."
          />
          <LimitInput
            value={draft.contradictions?.limit}
            onChange={(limit) =>
              onUpdate({
                contradictions: { ...(draft.contradictions || defaultContradictionsConfig), limit },
              })
            }
          />
        </SectionToggle>

        {/* Gaps */}
        <SectionToggle
          label={DATA_SOURCE_LABELS.gaps}
          icon={DATA_SOURCE_ICONS.gaps}
          enabled={draft.gaps?.enabled ?? false}
          onToggle={(enabled) =>
            onUpdate({
              gaps: { ...(draft.gaps || defaultGapsConfig), enabled },
            })
          }
          count={sessionStats?.gaps}
        >
          <MultiSelectChips
            label="Priority"
            options={GAP_PRIORITIES}
            selected={draft.gaps?.priorities || []}
            onChange={(priorities) =>
              onUpdate({
                gaps: { ...(draft.gaps || defaultGapsConfig), priorities },
              })
            }
          />
          <TextFilterBuilder
            value={draft.gaps?.textFilter || { enabled: false, query: '', matchType: 'contains' }}
            onChange={(textFilter) =>
              onUpdate({
                gaps: { ...(draft.gaps || defaultGapsConfig), textFilter },
              })
            }
            placeholder="Filter gaps by description..."
          />
          <LimitInput
            value={draft.gaps?.limit}
            onChange={(limit) =>
              onUpdate({
                gaps: { ...(draft.gaps || defaultGapsConfig), limit },
              })
            }
          />
        </SectionToggle>

        {/* Causal Chains */}
        <SectionToggle
          label={DATA_SOURCE_LABELS.causalChains}
          icon={DATA_SOURCE_ICONS.causalChains}
          enabled={draft.causalChains?.enabled ?? false}
          onToggle={(enabled) =>
            onUpdate({
              causalChains: { ...(draft.causalChains || defaultCausalChainsConfig), enabled },
            })
          }
          count={sessionStats?.causalChains}
        >
          <div>
            <label className={`block text-xs mb-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              Minimum chain length
            </label>
            <input
              type="number"
              min={0}
              value={draft.causalChains?.minLength || ''}
              onChange={(e) =>
                onUpdate({
                  causalChains: {
                    ...(draft.causalChains || defaultCausalChainsConfig),
                    minLength: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              placeholder="No minimum"
              className={`w-24 px-2 py-1 text-xs rounded border ${
                isRadar
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                  : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
              } focus:outline-none`}
            />
          </div>
          <TextFilterBuilder
            value={draft.causalChains?.textFilter || { enabled: false, query: '', matchType: 'contains' }}
            onChange={(textFilter) =>
              onUpdate({
                causalChains: { ...(draft.causalChains || defaultCausalChainsConfig), textFilter },
              })
            }
            placeholder="Filter chains by description..."
          />
          <LimitInput
            value={draft.causalChains?.limit}
            onChange={(limit) =>
              onUpdate({
                causalChains: { ...(draft.causalChains || defaultCausalChainsConfig), limit },
              })
            }
          />
        </SectionToggle>
      </div>
    </motion.div>
  );
}

// ============================================
// PREVIEW STEP
// ============================================

interface PreviewStepProps {
  draft: Partial<CustomTabComposition>;
  session: SessionWithDetails;
}

function PreviewStep({ draft, session }: PreviewStepProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';

  const composition: CustomTabComposition = {
    id: 'preview',
    name: draft.name || 'Preview',
    findings: draft.findings || defaultFindingsConfig,
    entities: draft.entities || defaultEntitiesConfig,
    sources: draft.sources || defaultSourcesConfig,
    perspectives: draft.perspectives || defaultPerspectivesConfig,
    contradictions: draft.contradictions || defaultContradictionsConfig,
    gaps: draft.gaps || defaultGapsConfig,
    causalChains: draft.causalChains || defaultCausalChainsConfig,
    layout: draft.layout || 'stacked',
    sectionOrder: draft.sectionOrder || ['findings', 'entities', 'sources', 'perspectives', 'contradictions', 'gaps', 'causalChains'],
    collapsedSections: draft.collapsedSections || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
    usageCount: 0,
  };

  const extracted = extractCustomTabData(session, composition);
  const stats = computeCustomTabStats(extracted);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 space-y-6"
    >
      {/* Stats Summary */}
      <div
        className={`p-4 rounded-lg ${
          isRadar ? 'bg-slate-800/50 border border-slate-700' : 'bg-stone-50 border border-stone-200'
        }`}
      >
        <h3 className={`text-sm font-medium mb-3 ${isRadar ? 'text-white' : 'text-stone-900'}`}>
          Filter Results
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isRadar ? 'text-cyan-400' : 'text-stone-900'}`}>
              {stats.filteredItems}
            </div>
            <div className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              Filtered Items
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
              {stats.totalItems}
            </div>
            <div className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              Total Items
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {Math.round((1 - stats.filterRate) * 100)}%
            </div>
            <div className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              Retention
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isRadar ? 'text-purple-400' : 'text-purple-600'}`}>
              {extracted.enabledSections.length}
            </div>
            <div className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              Sections
            </div>
          </div>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="space-y-2">
        <h3 className={`text-sm font-medium ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
          Section Breakdown
        </h3>

        {(Object.keys(stats.sectionStats) as DataSourceType[]).map((section) => {
          const sectionStat = stats.sectionStats[section];
          if (!sectionStat.enabled) return null;

          return (
            <div
              key={section}
              className={`flex items-center gap-3 p-2 rounded ${
                isRadar ? 'bg-slate-800/30' : 'bg-stone-50'
              }`}
            >
              <span className="text-lg">{DATA_SOURCE_ICONS[section]}</span>
              <span className={`flex-1 text-sm ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
                {DATA_SOURCE_LABELS[section]}
              </span>
              <span
                className={`text-sm font-medium ${
                  isRadar ? 'text-cyan-400' : 'text-stone-900'
                }`}
              >
                {sectionStat.filtered}
              </span>
              <span className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                / {sectionStat.total}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sample content preview */}
      {extracted.findings.length > 0 && (
        <div className="space-y-2">
          <h3 className={`text-sm font-medium ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
            Sample Findings Preview
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {extracted.findings.slice(0, 3).map((finding) => (
              <div
                key={finding.id}
                className={`p-3 rounded-lg text-sm ${
                  isRadar
                    ? 'bg-slate-800/50 border border-slate-700 text-slate-300'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isRadar ? 'bg-cyan-500/20 text-cyan-300' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {finding.finding_type}
                  </span>
                  {finding.confidence_score !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        finding.confidence_score >= 0.8
                          ? isRadar
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-700'
                          : finding.confidence_score >= 0.5
                            ? isRadar
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-amber-100 text-amber-700'
                            : isRadar
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {Math.round(finding.confidence_score * 100)}%
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2">{finding.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default CustomTabComposer;
