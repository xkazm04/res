'use client';

import { useState } from 'react';
import { Download, Upload, Loader2, Check, ExternalLink } from 'lucide-react';

interface ActionPanelProps {
  templateType: string;
  isVideoReady?: boolean;
}

export function ActionPanel({ templateType, isVideoReady = true }: ActionPanelProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleDownload = async () => {
    if (downloadState !== 'idle') return;

    setDownloadState('loading');

    // Simulate download preparation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would trigger actual video export
    // For now, show success state
    setDownloadState('done');

    // Reset after showing success
    setTimeout(() => setDownloadState('idle'), 2000);
  };

  const handleUploadYouTube = async () => {
    if (uploadState !== 'idle') return;

    setUploadState('loading');

    // Simulate OAuth flow and upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    setUploadState('done');

    // Reset after showing success
    setTimeout(() => setUploadState('idle'), 2000);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg w-48">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Export Video
      </h3>

      {/* Download MP4 Button */}
      <button
        onClick={handleDownload}
        disabled={!isVideoReady || downloadState !== 'idle'}
        className={`
          flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
          text-sm font-medium transition-all duration-200
          ${downloadState === 'done'
            ? 'bg-emerald-600 text-white'
            : downloadState === 'loading'
            ? 'bg-slate-700 text-slate-300 cursor-wait'
            : isVideoReady
            ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600'
            : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
          }
        `}
      >
        {downloadState === 'loading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Rendering...</span>
          </>
        ) : downloadState === 'done' ? (
          <>
            <Check size={16} />
            <span>Downloaded</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Download MP4</span>
          </>
        )}
      </button>

      {/* Upload to YouTube Button */}
      <button
        onClick={handleUploadYouTube}
        disabled={!isVideoReady || uploadState !== 'idle'}
        className={`
          flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
          text-sm font-medium transition-all duration-200
          ${uploadState === 'done'
            ? 'bg-red-600 text-white'
            : uploadState === 'loading'
            ? 'bg-slate-700 text-slate-300 cursor-wait'
            : isVideoReady
            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 hover:border-red-600/50'
            : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
          }
        `}
      >
        {uploadState === 'loading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Uploading...</span>
          </>
        ) : uploadState === 'done' ? (
          <>
            <Check size={16} />
            <span>Uploaded</span>
          </>
        ) : (
          <>
            <Upload size={16} />
            <span>Upload YouTube</span>
          </>
        )}
      </button>

      {/* Video info */}
      <div className="pt-2 border-t border-slate-800">
        <div className="text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Template:</span>
            <span className="text-slate-400">{templateType}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Duration:</span>
            <span className="text-slate-400">~15s</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Format:</span>
            <span className="text-slate-400">MP4 H.264</span>
          </div>
        </div>
      </div>

      {/* YouTube link hint */}
      {uploadState === 'done' && (
        <a
          href="#"
          className="flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <span>View on YouTube</span>
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
