'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSessionWithDetails } from '@/src/lib/supabase';
import { USE_MOCK_DATA, getMockSessionData } from '@/src/lib/mockData';
import type { SessionWithDetails, SessionStatus } from '@/src/types/research';

const POLL_INTERVAL = 3000; // 3 seconds

interface UseResearchPollingOptions {
  sessionId: string;
  templateType?: 'investigation' | 'financial' | 'market';
  onUpdate: (session: SessionWithDetails) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useResearchPolling({
  sessionId,
  templateType = 'investigation',
  onUpdate,
  onError,
  enabled = true,
}: UseResearchPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<SessionStatus | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Use mock data if flag is set
      if (USE_MOCK_DATA) {
        const mockData = getMockSessionData(templateType);
        onUpdate(mockData);
        lastStatusRef.current = mockData.status;
        return;
      }

      // Fetch from Supabase
      const data = await getSessionWithDetails(sessionId);
      if (data) {
        onUpdate(data);
        lastStatusRef.current = data.status;
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [sessionId, templateType, onUpdate, onError]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    // Initial fetch
    fetchData();

    // Don't poll if using mock data (it's static)
    if (USE_MOCK_DATA) return;

    // Set up polling
    intervalRef.current = setInterval(() => {
      // Stop polling if session is completed
      if (lastStatusRef.current === 'completed' || lastStatusRef.current === 'failed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      fetchData();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, enabled, fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!intervalRef.current && enabled && !USE_MOCK_DATA) {
      intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    }
  }, [enabled, fetchData]);

  return {
    refetch,
    stopPolling,
    startPolling,
    isPolling: !!intervalRef.current,
  };
}

// Simpler hook for just session status
export function useSessionStatus(sessionId: string, templateType: 'investigation' | 'financial' | 'market' = 'investigation') {
  const statusRef = useRef<SessionStatus>('active');

  useEffect(() => {
    if (!sessionId) return;

    const checkStatus = async () => {
      try {
        if (USE_MOCK_DATA) {
          const mockData = getMockSessionData(templateType);
          statusRef.current = mockData.status;
          return;
        }

        const data = await getSessionWithDetails(sessionId);
        if (data) {
          statusRef.current = data.status;
        }
      } catch {
        // Ignore errors for status check
      }
    };

    checkStatus();

    // Don't poll if using mock data
    if (USE_MOCK_DATA) return;

    const interval = setInterval(checkStatus, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [sessionId, templateType]);

  return statusRef.current;
}
