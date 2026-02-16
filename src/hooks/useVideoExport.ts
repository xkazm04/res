'use client';

import { useState, useCallback, useRef } from 'react';
import type { VideoRenderStatus, VideoFormat } from '@/src/types/research';
import type { ComposedScene } from '@/src/components/maker/cli/types';
import type { VideoContent } from '@/src/lib/videoShowcaseMockData';

interface ExportOptions {
  sessionId: string;
  templateType: string;
  format: VideoFormat;
  compositionId: string;
  inputProps: {
    templateType: string;
    format: string;
    videoContent: VideoContent;
    sceneComposition?: ComposedScene[] | null;
  };
  audioData?: string | null;
}

type ExportPhase = VideoRenderStatus | 'muxing' | 'bundling';

interface ExportState {
  isExporting: boolean;
  progress: number;
  status: ExportPhase;
  error: string | null;
  downloadUrl: string | null;
  muxedBlob: Blob | null;
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

/**
 * Convert a base64 data URL to an ArrayBuffer.
 */
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Mux video MP4 + audio MP3 into final MP4 using FFmpeg WASM.
 */
async function muxVideoAudio(
  videoBlob: Blob,
  audioDataUrl: string,
  onProgress?: (msg: string) => void,
): Promise<Blob> {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();

  onProgress?.('Loading FFmpeg...');

  // Load FFmpeg WASM from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  onProgress?.('Preparing files...');

  // Write video file
  const videoData = await fetchFile(videoBlob);
  await ffmpeg.writeFile('input.mp4', videoData);

  // Write audio file
  const audioBuffer = dataUrlToArrayBuffer(audioDataUrl);
  await ffmpeg.writeFile('audio.mp3', new Uint8Array(audioBuffer));

  onProgress?.('Muxing video + audio...');

  // Mux: copy video stream, encode audio to AAC, use shorter stream
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-i', 'audio.mp3',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    '-movflags', '+faststart',
    'output.mp4',
  ]);

  onProgress?.('Finalizing...');

  const outputData = await ffmpeg.readFile('output.mp4');
  const outputBlob = new Blob([outputData as unknown as BlobPart], { type: 'video/mp4' });

  ffmpeg.terminate();

  return outputBlob;
}

/**
 * Hook for video export using server-side Remotion rendering.
 * Sends composition data to /api/video/export, receives rendered MP4.
 * Optionally muxes with audio via FFmpeg WASM.
 */
export function useVideoExport(options: ExportOptions) {
  const { sessionId, templateType, format, compositionId, inputProps, audioData } = options;

  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    status: 'pending',
    error: null,
    downloadUrl: null,
    muxedBlob: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const renderIdRef = useRef<string | null>(null);

  const startExport = useCallback(async () => {
    if (state.isExporting) return;

    abortRef.current = new AbortController();
    setState({ isExporting: true, progress: 0, status: 'pending', error: null, downloadUrl: null, muxedBlob: null });

    try {
      // Create server-side tracking record
      const render = await createRenderJob(sessionId, templateType, format);
      renderIdRef.current = render.id;

      // Phase 1: Server-side rendering (bundling + rendering)
      setState((s) => ({ ...s, progress: 5, status: 'bundling' }));
      await updateRenderStatus(render.id, { status: 'rendering' });

      // Simulate progress while waiting for server render
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      progressInterval = setInterval(() => {
        setState((s) => {
          if (!s.isExporting || s.progress >= 80) return s;
          return { ...s, progress: Math.min(80, s.progress + 2), status: 'rendering' };
        });
      }, 2000);

      const res = await fetch('/api/video/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compositionId, inputProps }),
        signal: abortRef.current.signal,
      });

      if (progressInterval) clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server render failed' }));
        throw new Error(errData.error || `Server render failed (${res.status})`);
      }

      // Get video blob from response
      const videoBlob = await res.blob();
      setState((s) => ({ ...s, progress: 85, status: 'encoding' }));

      // Phase 2: Mux with audio if available
      if (audioData) {
        setState((s) => ({ ...s, progress: 90, status: 'muxing' }));
        try {
          const mp4Blob = await muxVideoAudio(videoBlob, audioData, (msg) => {
            console.log('[export]', msg);
          });
          const downloadUrl = URL.createObjectURL(mp4Blob);
          await updateRenderStatus(render.id, { status: 'complete' });
          setState({
            isExporting: false, progress: 100, status: 'complete',
            error: null, downloadUrl, muxedBlob: mp4Blob,
          });
        } catch (muxErr) {
          console.warn('[export] Muxing failed, falling back to video-only:', muxErr);
          const downloadUrl = URL.createObjectURL(videoBlob);
          await updateRenderStatus(render.id, { status: 'complete' });
          setState({
            isExporting: false, progress: 100, status: 'complete',
            error: null, downloadUrl, muxedBlob: videoBlob,
          });
        }
      } else {
        // No audio — just the rendered video
        const downloadUrl = URL.createObjectURL(videoBlob);
        await updateRenderStatus(render.id, { status: 'complete' });
        setState({
          isExporting: false, progress: 100, status: 'complete',
          error: null, downloadUrl, muxedBlob: videoBlob,
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setState((s) => ({ ...s, isExporting: false, status: 'failed', error: 'Cancelled' }));
        return;
      }
      const msg = error instanceof Error ? error.message : 'Export failed';
      if (renderIdRef.current) {
        await updateRenderStatus(renderIdRef.current, { status: 'failed', error_message: msg });
      }
      setState((s) => ({ ...s, isExporting: false, status: 'failed', error: msg }));
    }
  }, [state.isExporting, sessionId, templateType, format, compositionId, inputProps, audioData]);

  const cancelExport = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isExporting: false, status: 'failed', error: 'Cancelled' }));
  }, []);

  const downloadVideo = useCallback(() => {
    if (!state.downloadUrl) return;
    const a = document.createElement('a');
    a.href = state.downloadUrl;
    a.download = `${sessionId}-${templateType}-${format.replace(':', 'x')}.mp4`;
    a.click();
  }, [state.downloadUrl, sessionId, templateType, format]);

  return { ...state, startExport, cancelExport, downloadVideo };
}
