/**
 * Post-composition processing: resolves pexelsQuery fields in StockFootageScene
 * scenes to actual Pexels video URLs via the /api/pexels/search endpoint.
 */

import type { ComposedScene } from './types';
import type { PexelsVideoResult } from '@/src/app/api/pexels/search/route';

interface PexelsSearchResponse {
  videos: PexelsVideoResult[];
}

/**
 * Resolve all StockFootageScene pexelsQuery fields to actual video URLs.
 * Runs in parallel. On failure, scene keeps videoUrl: '' (component shows fallback).
 */
export async function resolveStockFootage(
  scenes: ComposedScene[],
): Promise<ComposedScene[]> {
  const footageIndices: number[] = [];
  scenes.forEach((scene, i) => {
    if (scene.component === 'StockFootageScene' && scene.data.pexelsQuery) {
      footageIndices.push(i);
    }
  });

  if (footageIndices.length === 0) return scenes;

  // Resolve all queries in parallel
  const resolutions = await Promise.all(
    footageIndices.map(async (idx) => {
      const query = scenes[idx].data.pexelsQuery as string;
      try {
        const params = new URLSearchParams({
          query,
          per_page: '3',
          orientation: 'landscape',
        });
        const res = await fetch(`/api/pexels/search?${params}`);
        if (!res.ok) {
          console.warn(`[resolveStockFootage] Pexels search failed for "${query}": ${res.status}`);
          return { idx, video: null };
        }
        const data: PexelsSearchResponse = await res.json();
        // Pick the first result (best match)
        const video = data.videos[0] || null;
        return { idx, video };
      } catch (err) {
        console.warn(`[resolveStockFootage] Error resolving "${query}":`, err);
        return { idx, video: null };
      }
    }),
  );

  // Inject resolved URLs into scene data
  const result = [...scenes];
  for (const { idx, video } of resolutions) {
    const scene = result[idx];
    result[idx] = {
      ...scene,
      data: {
        ...scene.data,
        videoUrl: video?.url || '',
        videoWidth: video?.width || 0,
        videoHeight: video?.height || 0,
        videoDuration: video?.duration || 0,
        thumbnail: video?.thumbnail || '',
      },
    };
  }

  return result;
}
