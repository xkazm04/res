/**
 * Label Texture Cache
 *
 * Pre-renders label text to off-screen canvases to avoid per-frame
 * measureText() and fillText() calls, which are expensive on Canvas 2D.
 *
 * Cache key: `${text}|${fontSize}|${fontWeight}|${color}`
 * Each entry is an ImageBitmap or off-screen canvas that can be drawn with drawImage().
 */

// ============================================================================
// Types
// ============================================================================

interface CachedLabel {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  width: number;
  height: number;
  baseline: number;
  lastUsed: number;
}

type CacheKey = string;

// ============================================================================
// Label Cache
// ============================================================================

const MAX_CACHE_SIZE = 500;
const EVICT_BATCH = 100;

export class LabelCache {
  private cache = new Map<CacheKey, CachedLabel>();
  private dpr: number;

  constructor(dpr: number = 1) {
    this.dpr = dpr;
  }

  /**
   * Update device pixel ratio (call on DPR changes)
   */
  setDPR(dpr: number): void {
    if (this.dpr !== dpr) {
      this.dpr = dpr;
      this.clear(); // DPR change invalidates all cached labels
    }
  }

  /**
   * Get or create a cached label texture.
   * Returns the cached canvas + dimensions for drawImage().
   */
  get(
    text: string,
    fontSize: number,
    fontWeight: string = 'normal',
    color: string = '#E8E8E8',
    fontFamily: string = 'Inter, system-ui, sans-serif',
  ): CachedLabel {
    const key = `${text}|${fontSize}|${fontWeight}|${color}`;
    const existing = this.cache.get(key);

    if (existing) {
      existing.lastUsed = performance.now();
      return existing;
    }

    // Create new cached label
    const entry = this.renderLabel(text, fontSize, fontWeight, color, fontFamily);
    this.cache.set(key, entry);

    // Evict old entries if cache is full
    if (this.cache.size > MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    return entry;
  }

  /**
   * Pre-render a label to an off-screen canvas
   */
  private renderLabel(
    text: string,
    fontSize: number,
    fontWeight: string,
    color: string,
    fontFamily: string,
  ): CachedLabel {
    const font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Measure text using a temporary context
    const measureCanvas = this.createCanvas(1, 1);
    const measureCtx = this.getContext(measureCanvas);
    measureCtx.font = font;
    const metrics = measureCtx.measureText(text);

    // Calculate dimensions with padding
    const padding = 4;
    const width = Math.ceil(metrics.width + padding * 2);
    const height = Math.ceil(fontSize * 1.4 + padding * 2);
    const baseline = Math.ceil(fontSize * 1.1 + padding);

    // Create the actual canvas at DPR scale
    const canvas = this.createCanvas(
      Math.max(1, width * this.dpr),
      Math.max(1, height * this.dpr),
    );
    const ctx = this.getContext(canvas);
    ctx.scale(this.dpr, this.dpr);

    // Render text
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, padding, baseline);

    return {
      canvas,
      width,
      height,
      baseline,
      lastUsed: performance.now(),
    };
  }

  /**
   * Draw a cached label at a screen position (centered horizontally)
   */
  drawCentered(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: string = 'normal',
    color: string = '#E8E8E8',
    alpha: number = 1,
  ): void {
    const cached = this.get(text, fontSize, fontWeight, color);

    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;

    // Draw centered at (x, y)
    ctx.drawImage(
      cached.canvas as HTMLCanvasElement,
      0, 0, cached.canvas.width, cached.canvas.height,
      x - cached.width / 2,
      y - cached.height / 2,
      cached.width,
      cached.height,
    );

    ctx.restore();
  }

  /**
   * Get measured width for a text string without rendering
   */
  measureWidth(
    text: string,
    fontSize: number,
    fontWeight: string = 'normal',
  ): number {
    const cached = this.get(text, fontSize, fontWeight);
    return cached.width;
  }

  /**
   * Evict oldest entries from cache
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    for (let i = 0; i < EVICT_BATCH && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
    };
  }

  // Canvas creation helpers (SSR-safe)

  private createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  private getContext(canvas: OffscreenCanvas | HTMLCanvasElement): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    return ctx as CanvasRenderingContext2D;
  }
}

// ============================================================================
// Singleton
// ============================================================================

let labelCacheInstance: LabelCache | null = null;

export function getLabelCache(dpr?: number): LabelCache {
  if (!labelCacheInstance) {
    labelCacheInstance = new LabelCache(dpr);
  } else if (dpr !== undefined) {
    labelCacheInstance.setDPR(dpr);
  }
  return labelCacheInstance;
}
