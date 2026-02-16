/**
 * Hierarchy Worker
 *
 * Offloads node hierarchy building to a Web Worker for datasets >1,000 sessions.
 * This prevents main-thread jank during layout calculations.
 *
 * Communication protocol:
 * Main → Worker: { type: 'buildHierarchy', sessions, topics, options }
 * Worker → Main: { type: 'hierarchyReady', nodes, bounds }
 * Worker → Main: { type: 'progress', percent, phase }
 * Worker → Main: { type: 'error', message }
 */

// ============================================================================
// Message Types
// ============================================================================

export interface WorkerBuildRequest {
  type: 'buildHierarchy';
  sessions: SerializedSession[];
  topics: SerializedTopic[];
  options: HierarchyBuildOptions;
}

export interface WorkerHierarchyResult {
  type: 'hierarchyReady';
  nodes: SerializedNode[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export interface WorkerProgress {
  type: 'progress';
  percent: number;
  phase: 'grouping' | 'layout' | 'connecting';
}

export interface WorkerError {
  type: 'error';
  message: string;
}

export type WorkerInMessage = WorkerBuildRequest;
export type WorkerOutMessage = WorkerHierarchyResult | WorkerProgress | WorkerError;

// Serialized types for structured clone transfer
export interface SerializedSession {
  id: string;
  title: string;
  query: string;
  template_type: string;
  status: string;
  thematic_group: string | null;
  primary_topic_id: string | null;
  claim_count: number;
  source_count: number;
  created_at: string;
  updated_at: string;
}

export interface SerializedTopic {
  id: string;
  name: string;
  session_ids: string[];
  description?: string;
}

export interface SerializedNode {
  id: string;
  type: 'cluster' | 'template' | 'thematic_group' | 'topic' | 'session';
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
  aggregatedCount: number;
  children: string[];
  parent?: string;
  templateType?: string;
  thematicGroup?: string;
  sessionId?: string;
  topicId?: string;
}

export interface HierarchyBuildOptions {
  centerX: number;
  centerY: number;
  baseRadius: number;
  templateColors: Record<string, string>;
  templateNames: Record<string, string>;
}

// ============================================================================
// Worker Manager (runs on main thread)
// ============================================================================

export class HierarchyWorkerManager {
  private worker: Worker | null = null;
  private pendingResolve: ((result: WorkerHierarchyResult) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;
  private onProgress: ((progress: WorkerProgress) => void) | null = null;

  /**
   * Initialize the worker. Call once on app startup.
   */
  init(): void {
    if (this.worker) return;
    if (typeof Worker === 'undefined') return; // SSR guard

    try {
      this.worker = new Worker(
        new URL('./hierarchyWorker.worker.ts', import.meta.url),
        { type: 'module' },
      );

      this.worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        const msg = event.data;

        switch (msg.type) {
          case 'hierarchyReady':
            this.pendingResolve?.(msg);
            this.pendingResolve = null;
            this.pendingReject = null;
            break;

          case 'progress':
            this.onProgress?.(msg);
            break;

          case 'error':
            this.pendingReject?.(new Error(msg.message));
            this.pendingResolve = null;
            this.pendingReject = null;
            break;
        }
      };

      this.worker.onerror = (err) => {
        this.pendingReject?.(new Error(err.message));
        this.pendingResolve = null;
        this.pendingReject = null;
      };
    } catch {
      // Worker creation failed (e.g., CSP restrictions)
      this.worker = null;
    }
  }

  /**
   * Build hierarchy off-thread. Returns a promise that resolves with the result.
   */
  build(
    request: WorkerBuildRequest,
    progressCallback?: (progress: WorkerProgress) => void,
  ): Promise<WorkerHierarchyResult> {
    // Fall back to synchronous if worker unavailable
    if (!this.worker) {
      return Promise.reject(new Error('Worker not available'));
    }

    return new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
      this.onProgress = progressCallback ?? null;
      this.worker!.postMessage(request);
    });
  }

  /**
   * Check if the worker is available
   */
  get isAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * Terminate the worker
   */
  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pendingResolve = null;
    this.pendingReject = null;
    this.onProgress = null;
  }
}

// ============================================================================
// Singleton
// ============================================================================

let workerManagerInstance: HierarchyWorkerManager | null = null;

export function getHierarchyWorkerManager(): HierarchyWorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new HierarchyWorkerManager();
  }
  return workerManagerInstance;
}
