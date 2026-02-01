/**
 * Focus Controller
 *
 * Manages drill-down navigation through the node hierarchy:
 * Overview → Template → Topic → Session
 *
 * Only one template/topic visible at a time when drilled in.
 */

import type {
  StrategicMapNode,
  NodeHierarchy,
  DrillDownState,
  DrillLevel,
  BreadcrumbItem,
  ViewState,
} from './types';

// ============================================================================
// Focus Controller
// ============================================================================

export class FocusController {
  private state: DrillDownState;
  private hierarchy: NodeHierarchy | null = null;
  private onStateChange: (state: DrillDownState) => void;
  private onViewRequest: (view: Partial<ViewState>, animate: boolean) => void;

  constructor(
    onStateChange: (state: DrillDownState) => void,
    onViewRequest: (view: Partial<ViewState>, animate: boolean) => void
  ) {
    this.state = {
      level: 'overview',
      focusedTemplateId: null,
      focusedTopicId: null,
      breadcrumbs: [],
    };
    this.onStateChange = onStateChange;
    this.onViewRequest = onViewRequest;
  }

  /**
   * Set the node hierarchy
   */
  setHierarchy(hierarchy: NodeHierarchy): void {
    this.hierarchy = hierarchy;
  }

  /**
   * Get current drill-down state
   */
  getState(): DrillDownState {
    return { ...this.state };
  }

  /**
   * Get current drill level
   */
  getLevel(): DrillLevel {
    return this.state.level;
  }

  /**
   * Drill into a node (template or topic)
   */
  drillInto(node: StrategicMapNode): void {
    if (!this.hierarchy) return;

    if (node.type === 'template' || node.type === 'cluster') {
      // Drill into template
      const templateId = node.type === 'cluster'
        ? node.children[0] // Get the template from cluster
        : node.id;

      const templateNode = this.hierarchy.nodeMap.get(templateId);
      if (!templateNode) return;

      this.state = {
        level: 'template',
        focusedTemplateId: templateId,
        focusedTopicId: null,
        breadcrumbs: [
          {
            id: 'overview',
            label: 'Overview',
            type: 'cluster',
            color: '#22D3EE',
          },
          {
            id: templateId,
            label: templateNode.label,
            type: 'template',
            color: templateNode.color,
          },
        ],
      };

      // Auto-navigate camera to template with appropriate zoom
      this.navigateToNode(templateNode, 0.8);

    } else if (node.type === 'topic') {
      // Drill into topic
      const parentId = node.parent;
      if (!parentId) return;

      const templateNode = this.hierarchy.nodeMap.get(parentId);
      if (!templateNode) return;

      this.state = {
        level: 'topic',
        focusedTemplateId: parentId,
        focusedTopicId: node.id,
        breadcrumbs: [
          {
            id: 'overview',
            label: 'Overview',
            type: 'cluster',
            color: '#22D3EE',
          },
          {
            id: parentId,
            label: templateNode.label,
            type: 'template',
            color: templateNode.color,
          },
          {
            id: node.id,
            label: node.label,
            type: 'topic',
            color: node.color,
          },
        ],
      };

      // Auto-navigate camera to topic
      this.navigateToNode(node, 1.5);
    }

    this.onStateChange(this.getState());
  }

  /**
   * Navigate to a breadcrumb level
   */
  navigateToBreadcrumb(breadcrumbId: string): void {
    if (!this.hierarchy) return;

    if (breadcrumbId === 'overview') {
      // Return to overview
      this.drillOut();
      return;
    }

    const node = this.hierarchy.nodeMap.get(breadcrumbId);
    if (!node) return;

    if (node.type === 'template') {
      // Go back to template level
      this.state = {
        level: 'template',
        focusedTemplateId: node.id,
        focusedTopicId: null,
        breadcrumbs: [
          {
            id: 'overview',
            label: 'Overview',
            type: 'cluster',
            color: '#22D3EE',
          },
          {
            id: node.id,
            label: node.label,
            type: 'template',
            color: node.color,
          },
        ],
      };

      this.navigateToNode(node, 0.8);
    }

    this.onStateChange(this.getState());
  }

  /**
   * Drill out one level
   */
  drillOut(): void {
    if (!this.hierarchy) return;

    if (this.state.level === 'topic' && this.state.focusedTemplateId) {
      // Go back to template level
      const templateNode = this.hierarchy.nodeMap.get(this.state.focusedTemplateId);
      if (templateNode) {
        this.state = {
          level: 'template',
          focusedTemplateId: this.state.focusedTemplateId,
          focusedTopicId: null,
          breadcrumbs: [
            {
              id: 'overview',
              label: 'Overview',
              type: 'cluster',
              color: '#22D3EE',
            },
            {
              id: templateNode.id,
              label: templateNode.label,
              type: 'template',
              color: templateNode.color,
            },
          ],
        };

        this.navigateToNode(templateNode, 0.8);
      }
    } else if (this.state.level === 'template') {
      // Go back to overview
      this.state = {
        level: 'overview',
        focusedTemplateId: null,
        focusedTopicId: null,
        breadcrumbs: [],
      };

      // Reset camera to overview (fully zoomed out to see all categories)
      this.onViewRequest(
        { offsetX: 0, offsetY: 0, scale: 0.12 },
        true
      );
    }

    this.onStateChange(this.getState());
  }

  /**
   * Reset to overview
   */
  reset(): void {
    this.state = {
      level: 'overview',
      focusedTemplateId: null,
      focusedTopicId: null,
      breadcrumbs: [],
    };

    this.onViewRequest(
      { offsetX: 0, offsetY: 0, scale: 0.12 },
      true
    );

    this.onStateChange(this.getState());
  }

  /**
   * Navigate camera to a node
   */
  private navigateToNode(node: StrategicMapNode, targetScale: number): void {
    const offsetX = -node.x * targetScale;
    const offsetY = -node.y * targetScale;

    this.onViewRequest(
      { offsetX, offsetY, scale: targetScale },
      true
    );
  }

  /**
   * Filter nodes based on current drill-down state
   */
  filterNodes(nodes: StrategicMapNode[]): StrategicMapNode[] {
    const { level, focusedTemplateId, focusedTopicId } = this.state;

    if (level === 'overview') {
      // Show all templates (not clusters, topics, or sessions)
      return nodes.filter(n => n.type === 'template' || n.type === 'cluster');
    }

    if (level === 'template' && focusedTemplateId) {
      // Show only the focused template (at center, grayed, clickable for back)
      // and its thematic groups or topics around it
      return nodes.filter(n => {
        // Show the focused template (will be rendered grayed at center)
        if (n.id === focusedTemplateId) return true;
        // Show thematic groups that belong to this template
        if (n.type === 'thematic_group' && n.parent === focusedTemplateId) return true;
        // Show topics that belong to this template
        if (n.type === 'topic' && n.parent === focusedTemplateId) return true;
        return false;
      });
    }

    if (level === 'topic' && focusedTopicId && focusedTemplateId) {
      // Show the focused topic and its sessions
      return nodes.filter(n => {
        // Show the focused template (grayed, for back navigation)
        if (n.id === focusedTemplateId) return true;
        // Show the focused topic
        if (n.id === focusedTopicId) return true;
        // Show sessions that belong to this topic
        if (n.type === 'session' && n.parent === focusedTopicId) return true;
        return false;
      });
    }

    return nodes;
  }

  /**
   * Check if clicking a node should trigger drill-back
   */
  shouldDrillBack(node: StrategicMapNode): boolean {
    const { level, focusedTemplateId, focusedTopicId } = this.state;

    // At template level, clicking the focused template goes back to overview
    if (level === 'template' && node.id === focusedTemplateId) {
      return true;
    }

    // At topic level, clicking the focused template goes back to template level
    if (level === 'topic' && node.id === focusedTemplateId) {
      return true;
    }

    return false;
  }

  /**
   * Get the ID of the node that should be rendered grayed (parent for back navigation)
   */
  getParentNodeId(): string | null {
    const { level, focusedTemplateId } = this.state;

    if (level === 'template' || level === 'topic') {
      return focusedTemplateId;
    }

    return null;
  }

  /**
   * Check if a node should be clickable for drill-in
   */
  canDrillInto(node: StrategicMapNode): boolean {
    const { level } = this.state;

    if (level === 'overview') {
      return node.type === 'template' || node.type === 'cluster';
    }

    if (level === 'template') {
      return node.type === 'topic' || node.type === 'thematic_group';
    }

    // At topic level, can only click sessions to open them
    return false;
  }

  /**
   * Navigate to a specific state (used for URL-based navigation restoration)
   * This is called when the browser back/forward button is pressed.
   */
  navigateToState(
    level: DrillLevel,
    templateId: string | null,
    topicId: string | null
  ): void {
    if (!this.hierarchy) return;

    if (level === 'overview') {
      this.reset();
      return;
    }

    if (level === 'template' && templateId) {
      // Find the template node
      const templateNode = this.hierarchy.nodeMap.get(templateId);
      if (!templateNode) {
        // Template not found, fall back to overview
        this.reset();
        return;
      }

      this.state = {
        level: 'template',
        focusedTemplateId: templateId,
        focusedTopicId: null,
        breadcrumbs: [
          {
            id: 'overview',
            label: 'Overview',
            type: 'cluster',
            color: '#22D3EE',
          },
          {
            id: templateId,
            label: templateNode.label,
            type: 'template',
            color: templateNode.color,
          },
        ],
      };

      this.navigateToNode(templateNode, 0.8);
      this.onStateChange(this.getState());
      return;
    }

    if (level === 'topic' && topicId && templateId) {
      // Find the topic and template nodes
      const topicNode = this.hierarchy.nodeMap.get(topicId);
      const templateNode = this.hierarchy.nodeMap.get(templateId);

      if (!topicNode || !templateNode) {
        // Node not found, fall back to template or overview
        if (templateNode) {
          this.navigateToState('template', templateId, null);
        } else {
          this.reset();
        }
        return;
      }

      this.state = {
        level: 'topic',
        focusedTemplateId: templateId,
        focusedTopicId: topicId,
        breadcrumbs: [
          {
            id: 'overview',
            label: 'Overview',
            type: 'cluster',
            color: '#22D3EE',
          },
          {
            id: templateId,
            label: templateNode.label,
            type: 'template',
            color: templateNode.color,
          },
          {
            id: topicId,
            label: topicNode.label,
            type: 'topic',
            color: topicNode.color,
          },
        ],
      };

      this.navigateToNode(topicNode, 1.5);
      this.onStateChange(this.getState());
      return;
    }

    // Unknown state, fall back to overview
    this.reset();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the target scale for a drill level
 */
export function getScaleForLevel(level: DrillLevel): number {
  switch (level) {
    case 'overview':
      return 0.12; // Fully zoomed out to see all categories
    case 'template':
      return 0.8; // Template level with parent visible
    case 'topic':
      return 1.5;
    default:
      return 1.0;
  }
}

/**
 * Get nodes visible at a drill level
 */
export function getVisibleTypesForLevel(level: DrillLevel): string[] {
  switch (level) {
    case 'overview':
      return ['cluster', 'template'];
    case 'template':
      return ['template', 'topic'];
    case 'topic':
      return ['topic', 'session'];
    default:
      return ['template', 'topic'];
  }
}
