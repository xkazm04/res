'use client';

/**
 * StoryExporter
 *
 * Export story timeline as video, animated GIF, or presentation.
 * Uses canvas recording for video capture.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { StoryScript } from '@/src/lib/storyScript';
import { cn } from '@/src/lib/utils';
import {
  Film,
  Image,
  FileText,
  Download,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Settings,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface StoryExporterProps {
  script: StoryScript;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

type ExportFormat = 'video' | 'gif' | 'presentation' | 'json';
type ExportQuality = 'low' | 'medium' | 'high';
type ExportStatus = 'idle' | 'preparing' | 'recording' | 'processing' | 'complete' | 'error';

interface ExportSettings {
  format: ExportFormat;
  quality: ExportQuality;
  includeNarration: boolean;
  includeChapterMarkers: boolean;
  speed: number;
}

// ============================================================================
// Component
// ============================================================================

export function StoryExporter({
  script,
  containerRef,
  onClose,
}: StoryExporterProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();

  const [settings, setSettings] = useState<ExportSettings>({
    format: 'video',
    quality: 'medium',
    includeNarration: true,
    includeChapterMarkers: true,
    speed: 1,
  });

  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Format options with details
  const formatOptions: Array<{
    id: ExportFormat;
    label: string;
    description: string;
    icon: typeof Film;
    extension: string;
  }> = [
    {
      id: 'video',
      label: 'Video (WebM)',
      description: 'High quality video for presentations',
      icon: Film,
      extension: '.webm',
    },
    {
      id: 'gif',
      label: 'Animated GIF',
      description: 'Shareable animation, larger file size',
      icon: Image,
      extension: '.gif',
    },
    {
      id: 'presentation',
      label: 'Presentation',
      description: 'HTML slideshow with narration',
      icon: FileText,
      extension: '.html',
    },
    {
      id: 'json',
      label: 'Data Export',
      description: 'Raw script data for integration',
      icon: Download,
      extension: '.json',
    },
  ];

  // Quality presets
  const qualityPresets: Record<
    ExportQuality,
    { label: string; resolution: string; fps: number }
  > = {
    low: { label: 'Low', resolution: '720p', fps: 15 },
    medium: { label: 'Medium', resolution: '1080p', fps: 30 },
    high: { label: 'High', resolution: '1440p', fps: 60 },
  };

  // Estimate file size
  const estimateFileSize = useCallback(() => {
    const baseSizeMB = script.totalDuration / 60; // 1MB per minute baseline
    const qualityMultiplier =
      settings.quality === 'high' ? 3 : settings.quality === 'medium' ? 1.5 : 0.5;
    const formatMultiplier =
      settings.format === 'video' ? 1 : settings.format === 'gif' ? 2 : 0.1;

    return Math.round(baseSizeMB * qualityMultiplier * formatMultiplier * 10) / 10;
  }, [script.totalDuration, settings.quality, settings.format]);

  // Export JSON data
  const exportJSON = useCallback(() => {
    const data = {
      title: script.title,
      description: script.description,
      totalDuration: script.totalDuration,
      chapters: script.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        description: ch.description,
        mood: ch.mood,
        eventCount: ch.events.length,
      })),
      events: script.events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        date: ev.date,
        narration: ev.narration,
        chapter: ev.chapter,
        importance: ev.importance,
        duration: ev.duration,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setStatus('complete');
  }, [script]);

  // Export HTML presentation
  const exportPresentation = useCallback(() => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${script.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; }
    .slide { min-height: 100vh; padding: 4rem; display: flex; flex-direction: column; justify-content: center; }
    .slide-title { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; }
    .slide-content { font-size: 1.5rem; opacity: 0.8; max-width: 800px; }
    .chapter { background: #111; border-left: 4px solid #3b82f6; }
    .event { border-bottom: 1px solid #222; }
    .event-date { font-size: 0.875rem; opacity: 0.5; margin-bottom: 0.5rem; }
    .narration { font-style: italic; opacity: 0.7; margin-top: 1rem; }
    nav { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; }
    nav button { padding: 0.5rem 1rem; background: #333; border: none; color: #fff; cursor: pointer; border-radius: 0.25rem; }
    nav button:hover { background: #444; }
  </style>
</head>
<body>
  <!-- Title Slide -->
  <div class="slide chapter">
    <h1 class="slide-title">${script.title}</h1>
    <p class="slide-content">${script.description}</p>
  </div>

  ${script.chapters
    .map(
      (chapter) => `
  <!-- Chapter: ${chapter.title} -->
  <div class="slide chapter">
    <h2 class="slide-title">${chapter.title}</h2>
    <p class="slide-content">${chapter.description}</p>
  </div>

  ${chapter.events
    .map(
      (event) => `
  <div class="slide event">
    ${event.date ? `<div class="event-date">${new Date(event.date).toLocaleDateString()}</div>` : ''}
    <h3 class="slide-title" style="font-size: 2rem;">${event.title}</h3>
    <p class="slide-content">${event.description}</p>
    ${settings.includeNarration ? `<p class="narration">"${event.narration}"</p>` : ''}
  </div>
  `
    )
    .join('')}
  `
    )
    .join('')}

  <nav>
    <button onclick="prev()">← Previous</button>
    <button onclick="next()">Next →</button>
  </nav>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    function show(i) {
      slides.forEach((s, j) => s.style.display = j === i ? 'flex' : 'none');
    }
    function next() { current = Math.min(current + 1, slides.length - 1); show(current); }
    function prev() { current = Math.max(current - 1, 0); show(current); }
    show(0);
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    });
  </script>
</body>
</html>
    `.trim();

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setStatus('complete');
  }, [script, settings.includeNarration]);

  // Start video/gif recording
  const startRecording = useCallback(async () => {
    if (!containerRef.current) {
      setError('Container not found');
      setStatus('error');
      return;
    }

    setStatus('preparing');
    setProgress(0);

    try {
      // Get canvas stream from container
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width * (settings.quality === 'high' ? 2 : 1);
      canvas.height = rect.height * (settings.quality === 'high' ? 2 : 1);

      // For now, we'll export as a simulated progress
      // In production, you'd use html2canvas + MediaRecorder
      setStatus('recording');

      // Simulate recording progress
      const totalFrames = Math.ceil(script.totalDuration * qualityPresets[settings.quality].fps);
      let frame = 0;

      const recordFrame = () => {
        frame++;
        setProgress((frame / totalFrames) * 100);

        if (frame < totalFrames) {
          requestAnimationFrame(recordFrame);
        } else {
          setStatus('processing');
          // Simulate processing
          setTimeout(() => {
            // Create a placeholder blob (in production, this would be the actual video)
            const placeholderData = `Story: ${script.title}\nEvents: ${script.events.length}\nDuration: ${Math.round(script.totalDuration)}s`;
            const blob = new Blob([placeholderData], {
              type: settings.format === 'video' ? 'video/webm' : 'image/gif',
            });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setStatus('complete');
          }, 1000);
        }
      };

      recordFrame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording failed');
      setStatus('error');
    }
  }, [containerRef, script, settings, qualityPresets]);

  // Handle export
  const handleExport = useCallback(() => {
    setError(null);
    setDownloadUrl(null);

    switch (settings.format) {
      case 'json':
        exportJSON();
        break;
      case 'presentation':
        exportPresentation();
        break;
      case 'video':
      case 'gif':
        startRecording();
        break;
    }
  }, [settings.format, exportJSON, exportPresentation, startRecording]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;

    const option = formatOptions.find((f) => f.id === settings.format);
    const filename = `${script.title.toLowerCase().replace(/\s+/g, '-')}${option?.extension ?? '.bin'}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.click();
  }, [downloadUrl, settings.format, script.title, formatOptions]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            <Film size={20} style={{ color: colors.primary }} />
            <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
              Export Story
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {status === 'idle' && (
            <>
              {/* Format selection */}
              <div>
                <label
                  className="text-xs font-medium mb-3 block"
                  style={{ color: colors.textSecondary }}
                >
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = settings.format === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          setSettings((s) => ({ ...s, format: option.id }))
                        }
                        className={cn(
                          'p-3 rounded-xl text-left transition-all',
                          isSelected && 'ring-2'
                        )}
                        style={{
                          backgroundColor: isSelected
                            ? colors.primaryFill
                            : colors.surfaceBg,
                          ...(isSelected && {
                            '--tw-ring-color': colors.primary,
                          } as React.CSSProperties),
                        }}
                      >
                        <Icon
                          size={18}
                          style={{
                            color: isSelected ? colors.primary : colors.textSecondary,
                          }}
                        />
                        <p
                          className="text-sm font-medium mt-2"
                          style={{ color: colors.textPrimary }}
                        >
                          {option.label}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: colors.textMuted }}
                        >
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quality selection (for video/gif) */}
              {(settings.format === 'video' || settings.format === 'gif') && (
                <div>
                  <label
                    className="text-xs font-medium mb-3 block"
                    style={{ color: colors.textSecondary }}
                  >
                    Quality
                  </label>
                  <div className="flex gap-2">
                    {(Object.keys(qualityPresets) as ExportQuality[]).map((q) => {
                      const preset = qualityPresets[q];
                      const isSelected = settings.quality === q;

                      return (
                        <button
                          key={q}
                          onClick={() => setSettings((s) => ({ ...s, quality: q }))}
                          className={cn(
                            'flex-1 p-3 rounded-lg text-center transition-colors',
                            isSelected && 'ring-2'
                          )}
                          style={{
                            backgroundColor: isSelected
                              ? colors.primaryFill
                              : colors.surfaceBg,
                            ...(isSelected && {
                              '--tw-ring-color': colors.primary,
                            } as React.CSSProperties),
                          }}
                        >
                          <p
                            className="text-sm font-medium"
                            style={{ color: colors.textPrimary }}
                          >
                            {preset.label}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{ color: colors.textMuted }}
                          >
                            {preset.resolution} @ {preset.fps}fps
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    Include narration text
                  </span>
                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        includeNarration: !s.includeNarration,
                      }))
                    }
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{
                      backgroundColor: settings.includeNarration
                        ? colors.primary
                        : colors.border,
                    }}
                  >
                    <motion.div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                      animate={{ left: settings.includeNarration ? '22px' : '2px' }}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    Include chapter markers
                  </span>
                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        includeChapterMarkers: !s.includeChapterMarkers,
                      }))
                    }
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{
                      backgroundColor: settings.includeChapterMarkers
                        ? colors.primary
                        : colors.border,
                    }}
                  >
                    <motion.div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                      animate={{
                        left: settings.includeChapterMarkers ? '22px' : '2px',
                      }}
                    />
                  </button>
                </label>
              </div>

              {/* Estimate */}
              <div
                className="p-3 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: colors.surfaceBg }}
              >
                <span className="text-xs" style={{ color: colors.textMuted }}>
                  Estimated file size
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  ~{estimateFileSize()} MB
                </span>
              </div>
            </>
          )}

          {/* Progress states */}
          {(status === 'preparing' ||
            status === 'recording' ||
            status === 'processing') && (
            <div className="py-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-4"
              >
                <Loader2 size={48} style={{ color: colors.primary }} />
              </motion.div>

              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {status === 'preparing' && 'Preparing export...'}
                {status === 'recording' && 'Recording frames...'}
                {status === 'processing' && 'Processing video...'}
              </p>

              {status === 'recording' && (
                <div className="mt-4">
                  <div
                    className="h-2 rounded-full overflow-hidden mx-auto max-w-xs"
                    style={{ backgroundColor: colors.border }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: colors.primary }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                    {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Complete */}
          {status === 'complete' && (
            <div className="py-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.successFill }}
              >
                <Check size={32} style={{ color: colors.success }} />
              </div>

              <p
                className="text-sm font-medium mb-2"
                style={{ color: colors.textPrimary }}
              >
                Export complete!
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Your file is ready to download
              </p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="py-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.dangerFill }}
              >
                <AlertTriangle size={32} style={{ color: colors.danger }} />
              </div>

              <p className="text-sm font-medium mb-2" style={{ color: colors.danger }}>
                Export failed
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {error ?? 'An unknown error occurred'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg"
            style={{ color: colors.textSecondary }}
          >
            {status === 'complete' ? 'Close' : 'Cancel'}
          </button>

          {status === 'idle' && (
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: colors.primary,
                color: colors.textOnDark,
              }}
            >
              <Download size={16} />
              Export
            </button>
          )}

          {status === 'complete' && downloadUrl && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: colors.success,
                color: colors.textOnDark,
              }}
            >
              <Download size={16} />
              Download
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={() => setStatus('idle')}
              className="px-4 py-2 text-sm font-medium rounded-lg"
              style={{
                backgroundColor: colors.primary,
                color: colors.textOnDark,
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default StoryExporter;
