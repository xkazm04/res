'use client';

import { useMemo } from 'react';
import type { ResearchSession } from '@/src/types/research';
import {
  groupSessionsByTemplate,
  getTemplateDisplayName,
  getTemplateColor,
  extractTopicFromQuery,
} from '@/src/stores/appStore';

// ============================================
// TREEMAP HIERARCHY TYPES
// ============================================

export interface TreemapNode {
  name: string;
  displayName: string;
  type: 'root' | 'template' | 'topic' | 'session';
  children?: TreemapNode[];
  value?: number; // For leaf nodes: findings count
  color?: string;
  data?: {
    id: string;
    template_type: string;
    query: string;
    status: string;
    findings_count: number;
    sources_count: number;
    created_at: string;
    completed_at?: string;
  };
}

// ============================================
// TRANSFORM SESSIONS TO HIERARCHY
// ============================================

function groupSessionsByTopic(sessions: ResearchSession[]): Record<string, ResearchSession[]> {
  // Simple topic extraction - group similar queries together
  const topics: Record<string, ResearchSession[]> = {};

  sessions.forEach((session) => {
    const topic = extractTopicFromQuery(session.query);
    if (!topics[topic]) {
      topics[topic] = [];
    }
    topics[topic].push(session);
  });

  return topics;
}

export function transformSessionsToHierarchy(sessions: ResearchSession[]): TreemapNode {
  const byTemplate = groupSessionsByTemplate(sessions);

  const children: TreemapNode[] = Object.entries(byTemplate).map(([template, templateSessions]) => {
    const color = getTemplateColor(template);
    const byTopic = groupSessionsByTopic(templateSessions);

    // If only one topic or few sessions, flatten to sessions directly
    const topicEntries = Object.entries(byTopic);
    let templateChildren: TreemapNode[];

    if (topicEntries.length === 1 || templateSessions.length <= 3) {
      // Flatten: template -> sessions directly
      templateChildren = templateSessions.map((session) => ({
        name: session.id,
        displayName: extractTopicFromQuery(session.query),
        type: 'session' as const,
        value: Math.max(session.claim_count || 1, 1),
        color,
        data: {
          id: session.id,
          template_type: session.template_type,
          query: session.query,
          status: session.status,
          findings_count: session.claim_count || 0,
          sources_count: session.source_count || 0,
          created_at: session.created_at,
          completed_at: session.completed_at,
        },
      }));
    } else {
      // Nested: template -> topics -> sessions
      templateChildren = topicEntries.map(([topic, topicSessions]) => {
        if (topicSessions.length === 1) {
          // Single session in topic - flatten
          const session = topicSessions[0];
          return {
            name: session.id,
            displayName: extractTopicFromQuery(session.query),
            type: 'session' as const,
            value: Math.max(session.claim_count || 1, 1),
            color,
            data: {
              id: session.id,
              template_type: session.template_type,
              query: session.query,
              status: session.status,
              findings_count: session.claim_count || 0,
              sources_count: session.source_count || 0,
              created_at: session.created_at,
              completed_at: session.completed_at,
            },
          };
        }

        // Multiple sessions in topic
        return {
          name: `topic-${topic.replace(/\s+/g, '-').toLowerCase()}`,
          displayName: topic,
          type: 'topic' as const,
          color,
          children: topicSessions.map((session) => ({
            name: session.id,
            displayName: extractTopicFromQuery(session.query),
            type: 'session' as const,
            value: Math.max(session.claim_count || 1, 1),
            color,
            data: {
              id: session.id,
              template_type: session.template_type,
              query: session.query,
              status: session.status,
              findings_count: session.claim_count || 0,
              sources_count: session.source_count || 0,
              created_at: session.created_at,
              completed_at: session.completed_at,
            },
          })),
        };
      });
    }

    return {
      name: template,
      displayName: getTemplateDisplayName(template),
      type: 'template' as const,
      color,
      children: templateChildren,
    };
  });

  return {
    name: 'root',
    displayName: 'All Research',
    type: 'root',
    children,
  };
}

// ============================================
// HOOK
// ============================================

export function useMapData(sessions: ResearchSession[]) {
  const hierarchy = useMemo(() => {
    if (sessions.length === 0) {
      return null;
    }
    return transformSessionsToHierarchy(sessions);
  }, [sessions]);

  const templateCounts = useMemo(() => {
    const counts = groupSessionsByTemplate(sessions);
    return Object.entries(counts).map(([template, items]) => ({
      template,
      displayName: getTemplateDisplayName(template),
      count: items.length,
      color: getTemplateColor(template),
    }));
  }, [sessions]);

  const totalStats = useMemo(() => ({
    totalSessions: sessions.length,
    totalFindings: sessions.reduce((sum, s) => sum + (s.claim_count || 0), 0),
    totalSources: sessions.reduce((sum, s) => sum + (s.source_count || 0), 0),
  }), [sessions]);

  return {
    hierarchy,
    templateCounts,
    totalStats,
  };
}
