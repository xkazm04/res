import { Inbox } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
        <Inbox size={24} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-[200px]">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-3 py-1.5 text-xs font-medium text-[var(--blue-primary)] hover:bg-[var(--blue-light)] rounded transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
