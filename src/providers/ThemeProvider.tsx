'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/src/stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  // Handle hydration - only apply theme after mount to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document root
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  // Prevent flash by not rendering until mounted
  // Children still render for SEO, but theme-dependent styles use CSS defaults
  return <>{children}</>;
}
