'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  FileText,
  Users,
  Globe,
  BarChart3,
  Scale,
  Building2,
  Zap,
  Mail,
  Database,
  ChevronRight,
  Clock,
  Target,
  Eye,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import {
  GlassCard,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Tabs,
  LoadingState,
  EmptyState,
} from '@/src/components/ui';
import {
  FindingsGrid,
  PerspectivesPanel,
  SourcesList,
  SearchQueries,
  ResearchStatus,
  ReportViewer,
  type Finding,
  type Source,
  type Perspective,
} from '@/src/components/investigation';

// ============================================================================
// TYPES
// ============================================================================
interface CostSummary {
  total_tokens: number;
  gemini_cost_usd: number;
  openrouter_cost_usd: number;
  total_cost_usd: number;
}

interface ActorOutput {
  session_id: string;
  query: string;
  template: string;
  status: string;
  findings: Finding[];
  perspectives: Perspective[];
  sources: Source[];
  search_queries_executed: string[];
  report_markdown?: string;
  cost_summary: CostSummary;
  execution_time_seconds: number;
  errors: string[];
  warnings: string[];
}

interface ActorInput {
  query: string;
  template: string;
  granularity: string;
  max_searches: number;
  generate_report: boolean;
  report_variant: string;
  input_text: string;
  user_email: string;
  persist_to_db: boolean;
  send_email_on_complete: boolean;
}

// ============================================================================
// TEMPLATE CONFIG
// ============================================================================
const templateConfig: Record<string, { icon: LucideIcon; color: string; description: string }> = {
  investigative: {
    icon: Search,
    color: 'cyan',
    description: 'Deep investigative research with fact-checking and evidence analysis',
  },
  financial: {
    icon: BarChart3,
    color: 'emerald',
    description: 'Financial analysis with market data, metrics, and investment insights',
  },
  competitive: {
    icon: Target,
    color: 'violet',
    description: 'Competitive intelligence with market positioning and strategy analysis',
  },
  legal: {
    icon: Scale,
    color: 'amber',
    description: 'Legal research with regulatory analysis and case precedents',
  },
};

// ============================================================================
// QUICK START QUESTIONS
// ============================================================================
const quickStartQuestions = [
  {
    template: 'investigative',
    question: 'What are the key allegations and evidence in the FTX/Sam Bankman-Fried fraud case?',
    short: 'FTX Fraud Case',
  },
  {
    template: 'investigative',
    question: 'Investigate the Theranos scandal: fraudulent claims, key players, and consequences',
    short: 'Theranos Scandal',
  },
  {
    template: 'financial',
    question: 'Analyze NVIDIA (NVDA) as an investment: bull/bear cases, metrics, and sentiment',
    short: 'NVIDIA Analysis',
  },
  {
    template: 'financial',
    question: 'Deep financial analysis of Tesla (TSLA): valuation, growth prospects, and risks',
    short: 'Tesla Analysis',
  },
  {
    template: 'competitive',
    question: 'Compare OpenAI vs Anthropic vs Google DeepMind in the AI race',
    short: 'AI Companies',
  },
  {
    template: 'competitive',
    question: 'Cloud computing market: AWS vs Azure vs Google Cloud dynamics',
    short: 'Cloud Wars',
  },
  {
    template: 'legal',
    question: 'Key SEC regulations around cryptocurrency and recent enforcement actions',
    short: 'SEC Crypto',
  },
  {
    template: 'legal',
    question: 'Analyze the antitrust cases against Google: allegations and potential outcomes',
    short: 'Google Antitrust',
  },
];

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================
const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Grid pattern */}
    <div className="absolute inset-0 grid-pattern opacity-30" />

    {/* Mesh gradient */}
    <div className="absolute inset-0 mesh-gradient" />

    {/* Floating orbs */}
    <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full bg-[var(--cyan-glow)]/5 blur-[100px] float" />
    <div
      className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-[var(--violet-glow)]/5 blur-[100px] float"
      style={{ animationDelay: '-2s' }}
    />
    <div
      className="absolute bottom-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-[var(--amber-glow)]/5 blur-[100px] float"
      style={{ animationDelay: '-4s' }}
    />

    {/* Decorative lines */}
    <svg className="absolute inset-0 w-full h-full opacity-10">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--cyan-glow)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--cyan-glow)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--cyan-glow)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="20%" x2="100%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" />
      <line x1="0" y1="70%" x2="100%" y2="60%" stroke="url(#lineGradient)" strokeWidth="1" />
    </svg>
  </div>
);

// ============================================================================
// HEADER
// ============================================================================
const Header = () => (
  <header className="relative z-10 mb-8">
    <div className="flex items-center gap-4 mb-2">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] blur-xl opacity-50" />
        <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[var(--graphite)] to-[var(--obsidian)] border border-[var(--glass-border)]">
          <Sparkles className="w-6 h-6 text-[var(--cyan-glow)]" />
        </div>
      </div>
      <div>
        <h1
          className="text-3xl font-bold text-gradient-mixed"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Deep Research
        </h1>
        <p className="text-sm text-[var(--mist)]">
          AI-powered intelligence with Gemini + Google Search grounding
        </p>
      </div>
    </div>
  </header>
);

// ============================================================================
// TEMPLATE SELECTOR
// ============================================================================
interface TemplateSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {Object.entries(templateConfig).map(([key, config]) => {
      const Icon = config.icon;
      const isActive = value === key;

      return (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            relative p-4 rounded-xl text-left transition-all duration-300 overflow-hidden group
            ${
              isActive
                ? `bg-[var(--${config.color}-glow)]/10 border-2 border-[var(--${config.color}-glow)]/50`
                : 'bg-[var(--graphite)] border-2 border-transparent hover:border-[var(--ash)]'
            }
          `}
        >
          {/* Glow effect */}
          {isActive && (
            <div
              className={`absolute inset-0 bg-[var(--${config.color}-glow)]/5 blur-xl`}
            />
          )}

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Icon
                className={`w-4 h-4 ${isActive ? `text-[var(--${config.color}-glow)]` : 'text-[var(--mist)]'}`}
              />
              <span
                className={`text-sm font-semibold capitalize ${isActive ? 'text-[var(--pure)]' : 'text-[var(--cloud)]'}`}
              >
                {key}
              </span>
            </div>
            <p className="text-[10px] text-[var(--mist)] line-clamp-2">{config.description}</p>
          </div>
        </button>
      );
    })}
  </div>
);

// ============================================================================
// QUICK START
// ============================================================================
interface QuickStartProps {
  onSelect: (template: string, question: string) => void;
}

const QuickStart: React.FC<QuickStartProps> = ({ onSelect }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[var(--amber-glow)]" />
        <h3 className="text-sm font-semibold text-[var(--pure)]" style={{ fontFamily: 'var(--font-display)' }}>
          Quick Start
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {quickStartQuestions.map((q, i) => {
          const config = templateConfig[q.template];
          const Icon = config.icon;
          const isHovered = hoveredIndex === i;

          return (
            <button
              key={i}
              onClick={() => onSelect(q.template, q.question)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`
                relative p-3 rounded-xl text-left transition-all duration-300 overflow-hidden
                bg-[var(--obsidian)] border border-[var(--glass-border)]
                hover:border-[var(--${config.color}-glow)]/30
                hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]
              `}
            >
              {isHovered && (
                <div className={`absolute inset-0 bg-[var(--${config.color}-glow)]/5`} />
              )}

              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3 h-3 text-[var(--${config.color}-glow)]`} />
                  <span className={`text-[10px] font-medium text-[var(--${config.color}-glow)]`}>
                    {q.template}
                  </span>
                </div>
                <p className="text-xs text-[var(--cloud)] line-clamp-2">{q.short}</p>
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// CONFIGURATION PANEL
// ============================================================================
interface ConfigPanelProps {
  input: ActorInput;
  setInput: React.Dispatch<React.SetStateAction<ActorInput>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ input, setInput, onSubmit, loading, error }) => {
  const config = templateConfig[input.template];

  return (
    <GlassCard variant="elevated" className="p-6 sticky top-6">
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--${config.color}-glow)] via-[var(--violet-glow)] to-transparent rounded-t-2xl`} />

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Query */}
        <div>
          <label className="block text-xs font-medium text-[var(--mist)] uppercase tracking-wider mb-2">
            Research Query
          </label>
          <Textarea
            value={input.query}
            onChange={(e) => setInput({ ...input, query: e.target.value })}
            placeholder="Enter your research question..."
            rows={4}
            className="resize-none"
            required
          />
        </div>

        {/* Template */}
        <div>
          <label className="block text-xs font-medium text-[var(--mist)] uppercase tracking-wider mb-2">
            Research Template
          </label>
          <TemplateSelector
            value={input.template}
            onChange={(template) => setInput({ ...input, template })}
          />
        </div>

        {/* Depth */}
        <div>
          <label className="block text-xs font-medium text-[var(--mist)] uppercase tracking-wider mb-2">
            Research Depth
          </label>
          <Select
            value={input.granularity}
            onChange={(e) => setInput({ ...input, granularity: e.target.value })}
            options={[
              { value: 'quick', label: 'Quick (1-3 searches)' },
              { value: 'standard', label: 'Standard (4-6 searches)' },
              { value: 'deep', label: 'Deep (7+ searches)' },
            ]}
          />
        </div>

        {/* Max searches slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[var(--mist)] uppercase tracking-wider">
              Max Searches
            </label>
            <span className="text-sm font-mono text-[var(--cyan-glow)]">{input.max_searches}</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={input.max_searches}
            onChange={(e) => setInput({ ...input, max_searches: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Report options */}
        <div className="p-4 rounded-xl bg-[var(--obsidian)] border border-[var(--glass-border)] space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={input.generate_report}
              onChange={(e) => setInput({ ...input, generate_report: e.target.checked })}
            />
            <span className="text-sm text-[var(--cloud)]">Generate Report</span>
          </label>

          {input.generate_report && (
            <Select
              value={input.report_variant}
              onChange={(e) => setInput({ ...input, report_variant: e.target.value })}
              options={[
                { value: 'executive_summary', label: 'Executive Summary' },
                { value: 'full_report', label: 'Full Report' },
                { value: 'investment_thesis', label: 'Investment Thesis' },
              ]}
            />
          )}
        </div>

        {/* Backup & Notifications */}
        <div className="p-4 rounded-xl bg-[var(--obsidian)] border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--mist)] uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" />
            Backup & Notifications
          </div>

          <Input
            type="email"
            value={input.user_email}
            onChange={(e) =>
              setInput({
                ...input,
                user_email: e.target.value,
                send_email_on_complete: e.target.value.length > 0 ? input.send_email_on_complete : false,
              })
            }
            placeholder="your@email.com"
            icon={Mail}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={input.persist_to_db}
                onChange={(e) => setInput({ ...input, persist_to_db: e.target.checked })}
              />
              <span className="text-sm text-[var(--cloud)] flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                Save to database
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={input.send_email_on_complete}
                disabled={!input.user_email}
                onChange={(e) => setInput({ ...input, send_email_on_complete: e.target.checked })}
              />
              <span
                className={`text-sm flex items-center gap-2 ${input.user_email ? 'text-[var(--cloud)]' : 'text-[var(--mist)]'}`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email when complete
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading || !input.query} loading={loading} className="w-full" size="lg">
          {loading ? 'Researching...' : 'Start Research'}
        </Button>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--rose-glow)]/10 border border-[var(--rose-glow)]/20">
            <p className="text-sm text-[var(--rose-glow)]">{error}</p>
          </div>
        )}
      </form>
    </GlassCard>
  );
};

// ============================================================================
// RESULTS PANEL
// ============================================================================
interface ResultsPanelProps {
  output: ActorOutput | null;
  loading: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ output, loading }) => {
  const [activeTab, setActiveTab] = useState('findings');

  const tabs = [
    { id: 'findings', label: 'Findings', icon: FileText, count: output?.findings.length },
    { id: 'perspectives', label: 'Perspectives', icon: Eye, count: output?.perspectives.length },
    { id: 'sources', label: 'Sources', icon: Globe, count: output?.sources.length },
    { id: 'report', label: 'Report', icon: Layers },
  ];

  if (loading) {
    return (
      <LoadingState
        message="Executing deep research"
        subMessage="Analyzing sources and extracting insights..."
        progress={undefined}
      />
    );
  }

  if (!output) {
    return (
      <EmptyState
        icon={Search}
        title="Ready to Research"
        description="Configure your research parameters and click 'Start Research' to begin. Or select a quick start question above."
      />
    );
  }

  return (
    <div className="space-y-4 reveal-stagger">
      {/* Status header */}
      <ResearchStatus
        status={output.status}
        executionTime={output.execution_time_seconds}
        findingsCount={output.findings.length}
        sourcesCount={output.sources.length}
        tokensUsed={output.cost_summary.total_tokens}
        cost={output.cost_summary.total_cost_usd}
        errors={output.errors}
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'findings' && <FindingsGrid findings={output.findings} />}
        {activeTab === 'perspectives' && <PerspectivesPanel perspectives={output.perspectives} />}
        {activeTab === 'sources' && <SourcesList sources={output.sources} />}
        {activeTab === 'report' && (
          output.report_markdown ? (
            <ReportViewer markdown={output.report_markdown} />
          ) : (
            <EmptyState
              icon={FileText}
              title="No Report Generated"
              description="Enable 'Generate Report' in the configuration to create a research report."
            />
          )
        )}
      </div>

      {/* Search queries */}
      {output.search_queries_executed.length > 0 && (
        <SearchQueries queries={output.search_queries_executed} />
      )}
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function ActorPage() {
  const [input, setInput] = useState<ActorInput>({
    query: '',
    template: 'investigative',
    granularity: 'standard',
    max_searches: 5,
    generate_report: true,
    report_variant: 'full_report',
    input_text: '',
    user_email: '',
    persist_to_db: true,
    send_email_on_complete: false,
  });

  const [output, setOutput] = useState<ActorOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch('/api/actor/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setOutput(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = (template: string, question: string) => {
    setInput({ ...input, template, query: question });
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Header />

        <QuickStart onSelect={handleQuickStart} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Config panel */}
          <div className="lg:col-span-4">
            <ConfigPanel
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-8">
            <ResultsPanel output={output} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
