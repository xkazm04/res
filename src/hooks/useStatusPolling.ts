'use client';

import { useEffect, useRef, useCallback } from 'react';
import { TopicStatus } from '@/src/types/research';

/**
 * Status update from the polling API
 */
export interface TopicStatusUpdate {
  id: string;
  status: TopicStatus;
  updatedAt: string;
  sessionId?: string;
}

interface StatusResponse {
  topics: Array<{
    id: string;
    status: string;
    updatedAt: string;
    sessionId?: string;
  }>;
}

const POLL_INTERVAL_MS = 5000;

/**
 * Conditional polling hook for topic status updates.
 *
 * Features:
 * - Only polls when hasActiveTopics is true
 * - Pauses when tab is hidden (document.visibilityState)
 * - Uses 5 second interval
 * - Logs errors but doesn't throw (keeps polling)
 *
 * @param hasActiveTopics - Whether there are topics with 'queued' or 'researching' status
 * @param onStatusUpdate - Callback for status updates, receives array of changed topics
 */
export function useStatusPolling(
  hasActiveTopics: boolean,
  onStatusUpdate: (updates: TopicStatusUpdate[]) => void
): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  // Keep callback ref current to avoid re-triggering effect
  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  const fetchStatuses = useCallback(async () => {
    // Don't fetch if tab is hidden
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    try {
      const response = await fetch('/api/topics/status?active=true');

      if (!response.ok) {
        console.error('[useStatusPolling] Failed to fetch statuses:', response.status);
        return;
      }

      const data: StatusResponse = await response.json();

      if (data.topics && data.topics.length > 0) {
        const updates: TopicStatusUpdate[] = data.topics.map((topic) => ({
          id: topic.id,
          status: topic.status as TopicStatus,
          updatedAt: topic.updatedAt,
          sessionId: topic.sessionId,
        }));
        onStatusUpdateRef.current(updates);
      }
    } catch (error) {
      // Log but don't throw - keep polling
      console.error('[useStatusPolling] Error fetching statuses:', error);
    }
  }, []);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start polling if there are active topics
    if (!hasActiveTopics) {
      return;
    }

    // Start polling
    intervalRef.current = setInterval(fetchStatuses, POLL_INTERVAL_MS);

    // Cleanup on unmount or when hasActiveTopics becomes false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasActiveTopics, fetchStatuses]);

  // Handle visibility change - pause/resume polling
  useEffect(() => {
    if (!hasActiveTopics) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - fetch immediately and resume polling
        fetchStatuses();
      }
      // Note: When hidden, the fetchStatuses function itself checks visibility
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasActiveTopics, fetchStatuses]);
}
