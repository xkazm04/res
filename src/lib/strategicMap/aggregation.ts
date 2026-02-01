/**
 * Node Aggregation and Hierarchy Builder
 *
 * Transforms research sessions and topics into a hierarchical node structure:
 * Clusters (by template type) → Templates → Topics → Sessions
 */

import type { ResearchSession } from '@/src/types/research';
import type {
  TopicWithSessions,
  groupSessionsByTemplate,
  getTemplateColor,
  getTemplateDisplayName,
  getTopicsForTemplate,
} from '@/src/stores/appStore';
import type {
  StrategicMapNode,
  NodeHierarchy,
  StrategicNodeType,
} from './types';

// Import helpers from appStore
import {
  groupSessionsByTemplate as groupByTemplate,
  getTemplateColor as templateColor,
  getTemplateDisplayName as templateName,
  getTopicsForTemplate as topicsForTemplate,
} from '@/src/stores/appStore';

// ============================================================================
// Dynamic Layout Configuration
// ============================================================================

/**
 * Data statistics for dynamic layout calculation
 */
export interface DataStats {
  totalSessions: number;
  templateCount: number;
  maxTopicsPerTemplate: number;
  maxSessionsPerTopic: number;
  avgSessionsPerTemplate: number;
}

/**
 * Dynamic layout parameters calculated from data
 */
export interface LayoutParams {
  clusterRadius: number;
  templateSpread: number;
  topicSpread: number;
  sessionSpread: number;
  minNodeRadius: number;
  maxNodeRadius: number;
  sessionThreshold: number; // Max sessions to render individually
}

/**
 * Calculate dynamic layout parameters based on data statistics
 *
 * This replaces the old hardcoded constants:
 * - CLUSTER_RADIUS = 400 → scales with template count
 * - TEMPLATE_SPREAD = 200 → scales with session density
 * - TOPIC_SPREAD = 150 → scales with max topics per template
 * - SESSION_SPREAD = 80 → scales with max sessions per topic
 */
export function calculateDynamicLayout(stats: DataStats): LayoutParams {
  const {
    totalSessions,
    templateCount,
    maxTopicsPerTemplate,
    maxSessionsPerTopic,
    avgSessionsPerTemplate,
  } = stats;

  // Cluster radius scales with template count (log scale for large counts)
  // Reduced base: 120, scales up to ~300 for 20+ templates (closer to center)
  const clusterRadius = 120 * (1 + Math.log2(Math.max(templateCount, 2)) * 0.6);

  // Template spread scales with session density
  // More sessions per template = more spread needed
  const templateSpread = 80 + Math.sqrt(avgSessionsPerTemplate) * 20;

  // Topic spread scales with max topics per template
  // Minimum 80, scales with topic count
  const topicSpread = Math.max(80, 50 + maxTopicsPerTemplate * 12);

  // Session spread uses Fibonacci-like spacing for dense clusters
  const sessionSpread = Math.max(50, 40 + Math.sqrt(maxSessionsPerTopic) * 8);

  // Node radii scale inversely with density
  // Dense datasets get smaller nodes to avoid overlap
  const densityFactor = Math.min(1, 500 / Math.max(totalSessions, 1));
  const minNodeRadius = Math.max(8, 15 * densityFactor);
  const maxNodeRadius = Math.max(40, 80 * densityFactor);

  // Session threshold: only render individual nodes if count is below this
  // Scales down for larger datasets
  const sessionThreshold = totalSessions > 1000 ? 10 : totalSessions > 500 ? 15 : 20;

  return {
    clusterRadius,
    templateSpread,
    topicSpread,
    sessionSpread,
    minNodeRadius,
    maxNodeRadius,
    sessionThreshold,
  };
}

/**
 * Extract statistics from sessions and topics
 */
export function extractDataStats(
  sessions: ResearchSession[],
  topics: TopicWithSessions[]
): DataStats {
  // Group by template
  const byTemplate = groupByTemplate(sessions);
  const templateCount = Object.keys(byTemplate).length;

  // Calculate max topics per template
  let maxTopicsPerTemplate = 0;
  for (const templateType of Object.keys(byTemplate)) {
    const templateTopics = topicsForTemplate(templateType, topics);
    maxTopicsPerTemplate = Math.max(maxTopicsPerTemplate, templateTopics.length);
  }

  // Calculate max sessions per topic
  let maxSessionsPerTopic = 0;
  for (const topic of topics) {
    const topicSessionCount = topic.sessions?.length || 0;
    maxSessionsPerTopic = Math.max(maxSessionsPerTopic, topicSessionCount);
  }

  // Average sessions per template
  const avgSessionsPerTemplate = templateCount > 0
    ? sessions.length / templateCount
    : 0;

  return {
    totalSessions: sessions.length,
    templateCount,
    maxTopicsPerTemplate,
    maxSessionsPerTopic,
    avgSessionsPerTemplate,
  };
}

// Legacy constants for backward compatibility (used as fallbacks)
const DEFAULT_LAYOUT: LayoutParams = {
  clusterRadius: 400,
  templateSpread: 200,
  topicSpread: 150,
  sessionSpread: 80,
  minNodeRadius: 15,
  maxNodeRadius: 80,
  sessionThreshold: 20,
};

// ============================================================================
// Hierarchy Builder
// ============================================================================

/**
 * Build a complete node hierarchy from sessions and topics
 *
 * Hierarchy:
 * - Cluster (L1) → Template (L2) → Thematic Group (L2.5) → Session (L3)
 *
 * Thematic groups are optional - sessions without a thematic_group
 * are placed directly under the template.
 */
export function buildNodeHierarchy(
  sessions: ResearchSession[],
  topics: TopicWithSessions[]
): NodeHierarchy {
  const allNodes: StrategicMapNode[] = [];
  const nodeMap = new Map<string, StrategicMapNode>();
  const clusters: StrategicMapNode[] = [];
  const templates: StrategicMapNode[] = [];
  const thematicGroupNodes: StrategicMapNode[] = [];
  const topicNodes: StrategicMapNode[] = [];
  const sessionNodes: StrategicMapNode[] = [];

  // Group sessions by template
  const groupedByTemplate = groupByTemplate(sessions);
  const templateKeys = Object.keys(groupedByTemplate);

  if (templateKeys.length === 0) {
    return {
      allNodes: [],
      nodeMap: new Map(),
      clusters: [],
      templates: [],
      thematicGroups: [],
      topics: [],
      sessions: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  // Calculate dynamic layout based on data statistics
  const stats = extractDataStats(sessions, topics);
  const layout = calculateDynamicLayout(stats);

  // Calculate template positions in a circle
  const templateAngles = evenAngles(templateKeys.length, -Math.PI / 2);

  templateKeys.forEach((templateType, templateIndex) => {
    const templateSessions = groupedByTemplate[templateType];
    const templateAngle = templateAngles[templateIndex];
    const templateX = Math.cos(templateAngle) * layout.clusterRadius;
    const templateY = Math.sin(templateAngle) * layout.clusterRadius;
    const templateId = `template-${templateType}`;
    const color = templateColor(templateType);

    // Create template node
    const templateNode: StrategicMapNode = {
      id: templateId,
      type: 'template',
      x: templateX,
      y: templateY,
      radius: calculateNodeRadius(templateSessions.length, 5, 100, 30, 60),
      color,
      label: templateName(templateType),
      aggregatedCount: templateSessions.length,
      children: [],
      visible: true,
      lod: 'standard',
      templateType,
      sessions: templateSessions,
    };

    allNodes.push(templateNode);
    nodeMap.set(templateId, templateNode);
    templates.push(templateNode);

    // Get topics for this template
    const templateTopics = topicsForTemplate(templateType, topics);

    if (templateTopics.length > 0) {
      // Create topic nodes around template using Fibonacci spiral for dense layouts
      const topicPositions = templateTopics.length > 8
        ? fibonacciSpiralLayout({ x: templateX, y: templateY }, templateTopics.length, layout.topicSpread * 0.5)
        : evenAngles(templateTopics.length, -Math.PI / 2).map((angle, i) => ({
            x: templateX + Math.cos(angle) * layout.topicSpread,
            y: templateY + Math.sin(angle) * layout.topicSpread,
          }));

      templateTopics.forEach((topic, topicIndex) => {
        const { x: topicX, y: topicY } = topicPositions[topicIndex];
        const topicId = `topic-${topic.id}`;

        // Find sessions for this topic
        const topicSessions = sessions.filter(s =>
          topic.sessions?.some(ts => ts.id === s.id)
        );

        const topicNode: StrategicMapNode = {
          id: topicId,
          type: 'topic',
          x: topicX,
          y: topicY,
          radius: calculateNodeRadius(topicSessions.length, 1, 50, 20, 40),
          color,
          label: topic.name,
          aggregatedCount: topicSessions.length,
          children: [],
          parent: templateId,
          visible: true,
          lod: 'standard',
          templateType,
          topic,
          sessions: topicSessions,
        };

        allNodes.push(topicNode);
        nodeMap.set(topicId, topicNode);
        topicNodes.push(topicNode);
        templateNode.children.push(topicId);

        // Create session nodes around topic using dynamic threshold
        if (topicSessions.length <= layout.sessionThreshold) {
          // Use Fibonacci spiral for better distribution
          const sessionPositions = topicSessions.length > 10
            ? fibonacciSpiralLayout({ x: topicX, y: topicY }, topicSessions.length, layout.sessionSpread * 0.4)
            : evenAngles(topicSessions.length, -Math.PI / 2).map(angle => ({
                x: topicX + Math.cos(angle) * layout.sessionSpread,
                y: topicY + Math.sin(angle) * layout.sessionSpread,
              }));

          topicSessions.forEach((session, sessionIndex) => {
            const { x: sessionX, y: sessionY } = sessionPositions[sessionIndex];
            const sessionId = `session-${session.id}`;

            const sessionNode: StrategicMapNode = {
              id: sessionId,
              type: 'session',
              x: sessionX,
              y: sessionY,
              radius: layout.minNodeRadius,
              color,
              label: session.title,
              aggregatedCount: 1,
              children: [],
              parent: topicId,
              visible: true,
              lod: 'standard',
              templateType,
              session,
            };

            allNodes.push(sessionNode);
            nodeMap.set(sessionId, sessionNode);
            sessionNodes.push(sessionNode);
            topicNode.children.push(sessionId);
          });
        }
      });
    } else {
      // No topics - group by thematic_group if available
      const groupedByTheme = new Map<string, ResearchSession[]>();

      for (const session of templateSessions) {
        const group = session.thematic_group || 'Ungrouped';
        if (!groupedByTheme.has(group)) {
          groupedByTheme.set(group, []);
        }
        groupedByTheme.get(group)!.push(session);
      }

      const themeKeys = Array.from(groupedByTheme.keys());

      if (themeKeys.length > 1 || (themeKeys.length === 1 && themeKeys[0] !== 'Ungrouped')) {
        // Multiple themes or one named theme - create thematic group nodes
        const themeAngles = evenAngles(themeKeys.length, -Math.PI / 2);

        // Calculate max sessions in any group for scaling spread
        const maxGroupSize = Math.max(...themeKeys.map(k => groupedByTheme.get(k)!.length));

        themeKeys.forEach((themeName, themeIndex) => {
          const themeSessions = groupedByTheme.get(themeName)!;
          const themeAngle = themeAngles[themeIndex];

          // Scale spread based on group size - larger groups go further out
          const groupSizeFactor = 1 + (themeSessions.length / maxGroupSize) * 0.5;
          const dynamicSpread = layout.templateSpread * groupSizeFactor * 1.2;

          const themeX = templateX + Math.cos(themeAngle) * dynamicSpread;
          const themeY = templateY + Math.sin(themeAngle) * dynamicSpread;
          const themeId = `theme-${templateType}-${themeName.replace(/\s+/g, '-').toLowerCase()}`;

          const themeNode: StrategicMapNode = {
            id: themeId,
            type: 'thematic_group',
            x: themeX,
            y: themeY,
            radius: calculateNodeRadius(themeSessions.length, 1, 50, 25, 45),
            color,
            label: themeName,
            aggregatedCount: themeSessions.length,
            children: [],
            parent: templateId,
            visible: true,
            lod: 'standard',
            templateType,
            thematicGroup: themeName,
            sessions: themeSessions,
          };

          allNodes.push(themeNode);
          nodeMap.set(themeId, themeNode);
          thematicGroupNodes.push(themeNode);
          templateNode.children.push(themeId);

          // Create session nodes around the thematic group
          if (themeSessions.length <= layout.sessionThreshold) {
            const sessionPositions = themeSessions.length > 10
              ? fibonacciSpiralLayout({ x: themeX, y: themeY }, themeSessions.length, layout.sessionSpread * 0.4)
              : evenAngles(themeSessions.length, -Math.PI / 2).map(angle => ({
                  x: themeX + Math.cos(angle) * layout.sessionSpread,
                  y: themeY + Math.sin(angle) * layout.sessionSpread,
                }));

            themeSessions.forEach((session, sessionIndex) => {
              const { x: sessionX, y: sessionY } = sessionPositions[sessionIndex];
              const sessionId = `session-${session.id}`;

              const sessionNode: StrategicMapNode = {
                id: sessionId,
                type: 'session',
                x: sessionX,
                y: sessionY,
                radius: layout.minNodeRadius,
                color,
                label: session.title,
                aggregatedCount: 1,
                children: [],
                parent: themeId,
                visible: true,
                lod: 'standard',
                templateType,
                thematicGroup: themeName,
                session,
              };

              allNodes.push(sessionNode);
              nodeMap.set(sessionId, sessionNode);
              sessionNodes.push(sessionNode);
              themeNode.children.push(sessionId);
            });
          }
        });
      } else {
        // No thematic groups - create session nodes directly under template
        const directThreshold = Math.min(30, layout.sessionThreshold * 1.5);
        if (templateSessions.length <= directThreshold) {
          const sessionPositions = templateSessions.length > 15
            ? fibonacciSpiralLayout({ x: templateX, y: templateY }, templateSessions.length, layout.templateSpread * 0.6)
            : evenAngles(templateSessions.length, -Math.PI / 2).map(angle => ({
                x: templateX + Math.cos(angle) * layout.templateSpread,
                y: templateY + Math.sin(angle) * layout.templateSpread,
              }));

          templateSessions.forEach((session, sessionIndex) => {
            const { x: sessionX, y: sessionY } = sessionPositions[sessionIndex];
            const sessionId = `session-${session.id}`;

            const sessionNode: StrategicMapNode = {
              id: sessionId,
              type: 'session',
              x: sessionX,
              y: sessionY,
              radius: layout.minNodeRadius,
              color,
              label: session.title,
              aggregatedCount: 1,
              children: [],
              parent: templateId,
              visible: true,
              lod: 'standard',
              templateType,
              session,
            };

            allNodes.push(sessionNode);
            nodeMap.set(sessionId, sessionNode);
            sessionNodes.push(sessionNode);
            templateNode.children.push(sessionId);
          });
        }
      }
    }
  });

  // Create cluster nodes (aggregate templates for L1 zoom)
  // For now, we create one cluster per template type (could be merged)
  templates.forEach((template, i) => {
    const clusterId = `cluster-${template.templateType}`;
    const clusterNode: StrategicMapNode = {
      id: clusterId,
      type: 'cluster',
      x: template.x,
      y: template.y,
      radius: template.radius * 1.5,
      color: template.color,
      label: template.label,
      aggregatedCount: template.aggregatedCount,
      children: [template.id],
      visible: true,
      lod: 'standard',
      templateType: template.templateType,
      sessions: template.sessions,
    };

    allNodes.push(clusterNode);
    nodeMap.set(clusterId, clusterNode);
    clusters.push(clusterNode);
    template.parent = clusterId;
  });

  // Calculate bounds
  const bounds = calculateHierarchyBounds(allNodes);

  return {
    allNodes,
    nodeMap,
    clusters,
    templates,
    thematicGroups: thematicGroupNodes,
    topics: topicNodes,
    sessions: sessionNodes,
    bounds,
  };
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Get children of a node
 */
export function getNodeChildren(
  nodeId: string,
  nodeMap: Map<string, StrategicMapNode>
): StrategicMapNode[] {
  const node = nodeMap.get(nodeId);
  if (!node) return [];

  return node.children
    .map(id => nodeMap.get(id))
    .filter((n): n is StrategicMapNode => n !== undefined);
}

/**
 * Get parent of a node
 */
export function getNodeParent(
  nodeId: string,
  nodeMap: Map<string, StrategicMapNode>
): StrategicMapNode | null {
  const node = nodeMap.get(nodeId);
  if (!node || !node.parent) return null;

  return nodeMap.get(node.parent) || null;
}

/**
 * Get all ancestors of a node (for breadcrumb)
 */
export function getNodeAncestors(
  nodeId: string,
  nodeMap: Map<string, StrategicMapNode>
): StrategicMapNode[] {
  const ancestors: StrategicMapNode[] = [];
  let current = nodeMap.get(nodeId);

  while (current?.parent) {
    const parent = nodeMap.get(current.parent);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

// ============================================================================
// Bounds Calculation
// ============================================================================

/**
 * Calculate bounds of all nodes
 */
export function calculateHierarchyBounds(
  nodes: StrategicMapNode[]
): NodeHierarchy['bounds'] {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.radius);
    maxX = Math.max(maxX, node.x + node.radius);
    minY = Math.min(minY, node.y - node.radius);
    maxY = Math.max(maxY, node.y + node.radius);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate evenly spaced angles for circular layout
 */
function evenAngles(count: number, startAngle: number = 0): number[] {
  const angles: number[] = [];
  for (let i = 0; i < count; i++) {
    angles.push(startAngle + (i / count) * Math.PI * 2);
  }
  return angles;
}

/**
 * Point interface for layout functions
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Fibonacci spiral layout for dense clusters
 *
 * Uses the golden angle (~137.5 degrees) to distribute points
 * in a natural spiral pattern that avoids overlap better than
 * uniform circular distribution for large counts.
 */
export function fibonacciSpiralLayout(
  center: Point,
  count: number,
  baseRadius: number
): Point[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
  const positions: Point[] = [];

  for (let i = 0; i < count; i++) {
    // Radius increases with square root for even distribution
    const radius = baseRadius + 15 * Math.sqrt(i);
    const angle = i * goldenAngle;

    positions.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }

  return positions;
}

/**
 * Calculate node radius based on count with min/max bounds
 */
function calculateNodeRadius(
  count: number,
  minCount: number,
  maxCount: number,
  minRadius: number,
  maxRadius: number
): number {
  const normalized = Math.max(0, Math.min(1, (count - minCount) / (maxCount - minCount)));
  return minRadius + normalized * (maxRadius - minRadius);
}

/**
 * Add jitter to a position for visual separation
 */
export function addJitter(
  x: number,
  y: number,
  amount: number
): { x: number; y: number } {
  return {
    x: x + (Math.random() - 0.5) * amount * 2,
    y: y + (Math.random() - 0.5) * amount * 2,
  };
}

/**
 * Find the best position for a new node to avoid overlap
 */
export function findNonOverlappingPosition(
  preferredX: number,
  preferredY: number,
  radius: number,
  existingNodes: StrategicMapNode[],
  maxAttempts: number = 20
): { x: number; y: number } {
  let x = preferredX;
  let y = preferredY;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let hasOverlap = false;

    for (const node of existingNodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = radius + node.radius + 10; // 10px padding

      if (dist < minDist) {
        hasOverlap = true;
        // Push away from overlapping node
        const angle = Math.atan2(dy, dx);
        const pushDist = (minDist - dist) + 5;
        x += Math.cos(angle) * pushDist;
        y += Math.sin(angle) * pushDist;
        break;
      }
    }

    if (!hasOverlap) {
      break;
    }
  }

  return { x, y };
}
