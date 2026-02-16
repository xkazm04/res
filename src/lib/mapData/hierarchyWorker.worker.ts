/**
 * Hierarchy Worker - Web Worker script
 *
 * Runs hierarchy building calculations off the main thread.
 * Uses fibonacci spiral layout for dense node clusters.
 */

import type {
  WorkerBuildRequest,
  WorkerOutMessage,
  SerializedNode,
  SerializedSession,
  SerializedTopic,
  HierarchyBuildOptions,
} from './hierarchyWorker';

// ============================================================================
// Worker Entry Point
// ============================================================================

self.onmessage = (event: MessageEvent<WorkerBuildRequest>) => {
  const { sessions, topics, options } = event.data;

  try {
    postProgress(0, 'grouping');

    // Step 1: Group sessions by template
    const byTemplate = new Map<string, SerializedSession[]>();
    for (const s of sessions) {
      const t = s.template_type || 'unknown';
      if (!byTemplate.has(t)) byTemplate.set(t, []);
      byTemplate.get(t)!.push(s);
    }

    // Build topic lookup
    const topicMap = new Map<string, SerializedTopic>();
    for (const t of topics) {
      topicMap.set(t.id, t);
    }

    postProgress(20, 'grouping');

    // Step 2: Build nodes
    const nodes: SerializedNode[] = [];
    const templates = Array.from(byTemplate.keys()).sort(
      (a, b) => (byTemplate.get(b)?.length || 0) - (byTemplate.get(a)?.length || 0),
    );

    // Layout templates in a ring
    const templateCount = templates.length;
    const templateRadius = options.baseRadius * 0.6;

    postProgress(30, 'layout');

    let boundsMinX = Infinity;
    let boundsMaxX = -Infinity;
    let boundsMinY = Infinity;
    let boundsMaxY = -Infinity;

    for (let ti = 0; ti < templateCount; ti++) {
      const template = templates[ti];
      const templateSessions = byTemplate.get(template) || [];
      const angle = (ti / templateCount) * Math.PI * 2 - Math.PI / 2;
      const tx = options.centerX + Math.cos(angle) * templateRadius;
      const ty = options.centerY + Math.sin(angle) * templateRadius;
      const color = options.templateColors[template] || '#888888';
      const displayName = options.templateNames[template] || template;

      // Template node
      const nodeRadius = Math.max(40, Math.min(120, Math.sqrt(templateSessions.length) * 15));
      nodes.push({
        id: `template-${template}`,
        type: 'template',
        x: tx,
        y: ty,
        radius: nodeRadius,
        color,
        label: displayName,
        aggregatedCount: templateSessions.length,
        children: [],
        templateType: template,
      });

      updateBounds(tx, ty, nodeRadius);

      // Group sessions by thematic_group or topic
      const groups = groupSessionsForTemplate(templateSessions, topics);
      const groupEntries = Array.from(groups.entries());
      const groupRadius = nodeRadius * 1.8;

      for (let gi = 0; gi < groupEntries.length; gi++) {
        const [groupName, groupSessions] = groupEntries[gi];
        const groupAngle = (gi / groupEntries.length) * Math.PI * 2 - Math.PI / 2;
        const gx = tx + Math.cos(groupAngle) * groupRadius;
        const gy = ty + Math.sin(groupAngle) * groupRadius;
        const gNodeRadius = Math.max(20, Math.min(60, Math.sqrt(groupSessions.length) * 10));

        const groupId = `group-${template}-${groupName.replace(/\s+/g, '-').toLowerCase()}`;

        nodes.push({
          id: groupId,
          type: 'thematic_group',
          x: gx,
          y: gy,
          radius: gNodeRadius,
          color,
          label: groupName,
          aggregatedCount: groupSessions.length,
          children: [],
          parent: `template-${template}`,
          templateType: template,
          thematicGroup: groupName,
        });

        // Add to template's children
        const templateNode = nodes.find(n => n.id === `template-${template}`);
        if (templateNode) templateNode.children.push(groupId);

        updateBounds(gx, gy, gNodeRadius);

        // Layout sessions in fibonacci spiral
        const sessionSpread = gNodeRadius * 1.5;
        for (let si = 0; si < groupSessions.length; si++) {
          const session = groupSessions[si];
          const { x: sx, y: sy } = fibonacciSpiral(si, groupSessions.length, gx, gy, sessionSpread);
          const sRadius = Math.max(6, Math.min(20, 6 + (session.claim_count || 0) * 0.3));
          const sessionNodeId = `session-${session.id}`;

          nodes.push({
            id: sessionNodeId,
            type: 'session',
            x: sx,
            y: sy,
            radius: sRadius,
            color,
            label: session.title || session.query,
            aggregatedCount: 0,
            children: [],
            parent: groupId,
            templateType: template,
            sessionId: session.id,
          });

          // Add to group's children
          const groupNode = nodes.find(n => n.id === groupId);
          if (groupNode) groupNode.children.push(sessionNodeId);

          updateBounds(sx, sy, sRadius);
        }
      }

      postProgress(30 + Math.floor((ti / templateCount) * 60), 'layout');
    }

    postProgress(95, 'connecting');

    const result: WorkerOutMessage = {
      type: 'hierarchyReady',
      nodes,
      bounds: {
        minX: boundsMinX,
        maxX: boundsMaxX,
        minY: boundsMinY,
        maxY: boundsMaxY,
      },
    };

    (self as unknown as { postMessage: (msg: WorkerOutMessage) => void }).postMessage(result);

    function updateBounds(x: number, y: number, r: number) {
      if (x - r < boundsMinX) boundsMinX = x - r;
      if (x + r > boundsMaxX) boundsMaxX = x + r;
      if (y - r < boundsMinY) boundsMinY = y - r;
      if (y + r > boundsMaxY) boundsMaxY = y + r;
    }
  } catch (err) {
    const errorMsg: WorkerOutMessage = {
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown worker error',
    };
    (self as unknown as { postMessage: (msg: WorkerOutMessage) => void }).postMessage(errorMsg);
  }
};

// ============================================================================
// Helpers
// ============================================================================

function postProgress(percent: number, phase: 'grouping' | 'layout' | 'connecting') {
  const msg: WorkerOutMessage = { type: 'progress', percent, phase };
  (self as unknown as { postMessage: (msg: WorkerOutMessage) => void }).postMessage(msg);
}

function groupSessionsForTemplate(
  sessions: SerializedSession[],
  topics: SerializedTopic[],
): Map<string, SerializedSession[]> {
  // Try to group by topic first
  const topicSessionIds = new Map<string, Set<string>>();
  const topicNames = new Map<string, string>();

  for (const topic of topics) {
    const idSet = new Set(topic.session_ids);
    topicSessionIds.set(topic.id, idSet);
    topicNames.set(topic.id, topic.name);
  }

  const grouped = new Map<string, SerializedSession[]>();
  const assigned = new Set<string>();

  // Assign sessions to topics
  for (const session of sessions) {
    if (session.primary_topic_id && topicSessionIds.has(session.primary_topic_id)) {
      const topicName = topicNames.get(session.primary_topic_id) || 'Unknown';
      if (!grouped.has(topicName)) grouped.set(topicName, []);
      grouped.get(topicName)!.push(session);
      assigned.add(session.id);
    }
  }

  // Fall back to thematic_group for unassigned
  for (const session of sessions) {
    if (assigned.has(session.id)) continue;
    const group = session.thematic_group || 'Ungrouped';
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(session);
  }

  return grouped;
}

/**
 * Fibonacci spiral layout for positioning nodes around a center point.
 * Golden angle = ~137.5° ensures even distribution.
 */
function fibonacciSpiral(
  index: number,
  total: number,
  centerX: number,
  centerY: number,
  maxRadius: number,
): { x: number; y: number } {
  if (total <= 1) return { x: centerX, y: centerY };

  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.399 radians
  const fraction = index / Math.max(total - 1, 1);
  const radius = maxRadius * Math.sqrt(fraction);
  const angle = index * goldenAngle;

  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}
