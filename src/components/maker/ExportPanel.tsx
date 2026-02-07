'use client';

import { Download, Loader2, X, AlertCircle, Check, Film } from 'lucide-react';
import { useVideoExport } from '@/src/hooks/useVideoExport';
import type { VideoFormat } from '@/src/types/research';

interface ExportPanelProps {
  sessionId: string;
  templateType: string;
  format: VideoFormat;
  playerRef: React.RefObject<HTMLDivElement | null>;
  durationInFrames: number;
  fps: number;
}

export function ExportPanel(props: ExportPanelProps) {
  const { isExporting, progress, status, error, downloadUrl, startExport, cancelExport, downloadVideo } =
    useVideoExport(props);

  // Rendering state
  if (isExporting) {
    return (
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-sm font-medium text-white">
              {status === 'encoding' ? 'Encoding...' : 'Rendering...'}
            </span>
          </div>
          <button
            onClick={cancelExport}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 mt-2.5 text-center font-medium tabular-nums">
          {progress}% complete
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-400">Export failed</p>
            <p className="text-xs text-red-400/60 mt-0.5 truncate">{error}</p>
          </div>
        </div>
        <button
          onClick={startExport}
          className="mt-3 w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium
                     hover:bg-red-500/20 border border-red-500/20 transition-all"
        >
          Retry Export
        </button>
      </div>
    );
  }

  // Success state
  if (downloadUrl) {
    return (
      <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">Export complete</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Your video is ready to download</p>
          </div>
        </div>

        <button
          onClick={downloadVideo}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-white text-sm font-medium
                     hover:bg-emerald-400 transition-all flex items-center justify-center gap-2
                     shadow-lg shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          Download Video
        </button>

        <button
          onClick={startExport}
          className="mt-2 w-full py-1.5 text-slate-400 text-xs hover:text-white transition-colors"
        >
          Export again
        </button>
      </div>
    );
  }

  // Ready state
  return (
    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Film className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Export Video</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {props.format === '9:16' ? 'YouTube Shorts' : 'Standard'} format
          </p>
        </div>
      </div>

      <button
        onClick={startExport}
        className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 text-white text-sm font-medium
                   hover:bg-cyan-400 transition-all flex items-center justify-center gap-2
                   shadow-lg shadow-cyan-500/20"
      >
        <Download className="w-4 h-4" />
        Export Video
      </button>

      <p className="text-[10px] text-slate-500 mt-2.5 text-center">
        Renders in real-time • WebM format
      </p>
    </div>
  );
}
