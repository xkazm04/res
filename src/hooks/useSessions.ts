'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/src/stores/appStore';

// Hook to fetch all sessions on mount
export function useSessions() {
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    fetchSessions,
  } = useAppStore();

  useEffect(() => {
    // Only fetch if we don't have sessions yet
    if (sessions.length === 0 && !sessionsLoading && !sessionsError) {
      fetchSessions();
    }
  }, [sessions.length, sessionsLoading, sessionsError, fetchSessions]);

  return {
    sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: fetchSessions,
  };
}
