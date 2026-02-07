import { Inbox, Sparkles } from 'lucide-react';
import { initiateTheme } from './InitiateTheme';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = 'No topics yet',
  description = 'Click Discover to find trending topics from this source.',
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon container with subtle glow */}
      <div className={`
        w-14 h-14 rounded-2xl
        ${initiateTheme.bgGlass}
        border ${initiateTheme.borderSubtle}
        flex items-center justify-center mb-5
        ${initiateTheme.glowSubtle}
      `}>
        <Inbox size={24} className={initiateTheme.textMuted} />
      </div>

      <h3 className={`text-sm font-medium ${initiateTheme.text} mb-2`}>
        {title}
      </h3>

      <p className={`text-xs ${initiateTheme.textMuted} max-w-[220px] leading-relaxed`}>
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={`
            mt-5 px-4 py-2
            text-xs font-medium
            rounded-lg
            ${initiateTheme.buttonPrimary}
            transition-all duration-200
            ${initiateTheme.focusRing}
            flex items-center gap-2
          `}
        >
          <Sparkles size={12} />
          {action.label}
        </button>
      )}
    </div>
  );
}
