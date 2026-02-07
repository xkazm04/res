'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { initiateTheme } from './InitiateTheme';

interface DiscoverButtonProps {
  sourceSlug: string;
  onDiscovered?: (count: number) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function DiscoverButton({
  sourceSlug,
  onDiscovered,
  onError,
  disabled = false,
}: DiscoverButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      const response = await fetch('/api/topics/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceSlug }),
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.count ?? data.topics?.length ?? 0;
        onDiscovered?.(count);
      } else if (response.status === 429) {
        onError?.('Too many requests. Try again.');
      } else if (response.status === 400 || response.status === 404) {
        const data = await response.json();
        onError?.(data.error || 'Discovery failed');
      } else {
        onError?.('Discovery failed');
      }
    } catch {
      onError?.('Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`
        p-2 rounded-lg
        transition-all duration-200
        ${initiateTheme.focusRing}
        ${loading || disabled
          ? 'opacity-50 cursor-not-allowed'
          : `${initiateTheme.textMuted} hover:text-cyan-400 ${initiateTheme.bgHover}`
        }
      `}
      title={loading ? 'Discovering topics...' : 'Discover topics'}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-cyan-400" />
      ) : (
        <Sparkles size={14} />
      )}
    </button>
  );
}
