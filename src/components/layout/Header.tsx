'use client';

import { Map } from 'lucide-react';
import { ThemeSwitcher } from '@/src/components/swiss/ThemeSwitcher';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={className}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--text-primary)] flex items-center justify-center">
            <Map className="w-4 h-4 text-[var(--text-inverse)]" />
          </div>
          <div>
            <h1 className="text-headline text-lg">Research Intelligence</h1>
            <p className="text-xs text-[var(--text-muted)]">AI-powered research visualization</p>
          </div>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
