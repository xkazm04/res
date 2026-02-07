'use client';

import { useState, useCallback, useRef } from 'react';
import type { VideoRenderStatus, VideoFormat } from '@/src/types/research';

interface ExportOptions {
  sessionId: string;
  templateType: string;
  format: VideoFormat;
  playerRef: React.RefObject<HTMLDivElement | null>;
  durationInFrames: number;
  fps: number;
}

interface ExportState {
  isExporting: boolean;
  progress: number;
  status: VideoRenderStatus;
  error: string | null;
  downloadUrl: string | null;
}

// API helpers
async function createRenderJob(sessionId: string, templateType: string, format: VideoFormat) {
  const res = await fetch('/api/video/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, template_type: templateType, format }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create render job');
  return (await res.json()).render;
}

async function updateRenderStatus(renderId: string, updates: Record<string, unknown>) {
  await fetch('/api/video/render', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ render_id: renderId, ...updates }),
  }).catch(() => {}); // Non-critical
}

function getBestMimeType(): string {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
  return 'video/webm';
}

/**
 * Hook for client-side video export using MediaRecorder.
 * Captures the Remotion Player's canvas output and encodes to WebM.
 */
export function useVideoExport(options: ExportOptions) {
  const { sessionId, templateType, format, playerRef, durationInFrames, fps } = options;

  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    status: 'pending',
    error: null,
    downloadUrl: null,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const abortedRef = useRef(false);
  const renderIdRef = useRef<string | null>(null);

  const startExport = useCallback(async () => {
    if (state.isExporting || !playerRef.current) return;

    abortedRef.current = false;
    chunksRef.current = [];
    setState({ isExporting: true, progress: 0, status: 'pending', error: null, downloadUrl: null });

    try {
      // Create server-side tracking
      const render = await createRenderJob(sessionId, templateType, format);
      renderIdRef.current = render.id;

      // Find canvas
      const canvas = playerRef.current.querySelector('canvas');
      if (!canvas) throw new Error('No canvas found. Ensure the video is loaded.');

      // Setup MediaRecorder
      const mimeType = getBestMimeType();
      const stream = canvas.captureStream(fps);
      recorderRef.current = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });

      recorderRef.current.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);

      recorderRef.current.onstop = async () => {
        if (abortedRef.current) {
          setState((s) => ({ ...s, isExporting: false, status: 'failed', error: 'Cancelled' }));
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const downloadUrl = URL.createObjectURL(blob);
        await updateRenderStatus(render.id, { status: 'complete', signed_url: downloadUrl });
        setState((s) => ({ ...s, isExporting: false, progress: 100, status: 'complete', downloadUrl }));
      };

      recorderRef.current.onerror = () => {
        setState((s) => ({ ...s, isExporting: false, status: 'failed', error: 'Recording failed' }));
      };

      // Start recording
      recorderRef.current.start(1000);
      await updateRenderStatus(render.id, { status: 'rendering' });

      // Track progress
      const durationMs = (durationInFrames / fps) * 1000;
      const startTime = Date.now();

      const trackProgress = () => {
        if (abortedRef.current) return;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(99, Math.round((elapsed / durationMs) * 100));
        setState((s) => ({ ...s, progress, status: progress > 90 ? 'encoding' : 'rendering' }));
        if (elapsed < durationMs) requestAnimationFrame(trackProgress);
      };
      requestAnimationFrame(trackProgress);

      // Stop after duration
      await new Promise((r) => setTimeout(r, durationMs + 500));
      if (!abortedRef.current && recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Export failed';
      if (renderIdRef.current) await updateRenderStatus(renderIdRef.current, { status: 'failed', error_message: msg });
      setState((s) => ({ ...s, isExporting: false, status: 'failed', error: msg }));
    }
  }, [state.isExporting, sessionId, templateType, format, playerRef, durationInFrames, fps]);

  const cancelExport = useCallback(() => {
    abortedRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setState((s) => ({ ...s, isExporting: false, status: 'failed', error: 'Cancelled' }));
  }, []);

  const downloadVideo = useCallback(() => {
    if (!state.downloadUrl) return;
    const a = document.createElement('a');
    a.href = state.downloadUrl;
    a.download = `${sessionId}-${templateType}-${format.replace(':', 'x')}.webm`;
    a.click();
  }, [state.downloadUrl, sessionId, templateType, format]);

  return { ...state, startExport, cancelExport, downloadVideo };
}
