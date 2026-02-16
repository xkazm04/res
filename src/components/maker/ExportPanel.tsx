'use client';

import { useState, useCallback, useEffect } from 'react';
import { Download, Loader2, X, AlertCircle, Check, Film, Upload, ExternalLink } from 'lucide-react';
import { useVideoExport } from '@/src/hooks/useVideoExport';
import { buildDescription } from '@/src/lib/youtube';
import type { VideoFormat } from '@/src/types/research';
import type { ComposedScene } from './cli/types';
import type { VideoContent } from '@/src/lib/videoShowcaseMockData';

interface ExportPanelProps {
  sessionId: string;
  sessionTitle?: string;
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
  keywords?: string[];
}

type YouTubeStatus = 'idle' | 'checking' | 'disconnected' | 'connected';
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function ExportPanel(props: ExportPanelProps) {
  const { sessionTitle, keywords = [], audioData } = props;
  const {
    isExporting, progress, status, error, downloadUrl, muxedBlob,
    startExport, cancelExport, downloadVideo,
  } = useVideoExport({
    sessionId: props.sessionId,
    templateType: props.templateType,
    format: props.format,
    compositionId: props.compositionId,
    inputProps: props.inputProps,
    audioData,
  });

  const [ytStatus, setYtStatus] = useState<YouTubeStatus>('idle');
  const [ytChannelName, setYtChannelName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Check YouTube connection status on mount
  useEffect(() => {
    setYtStatus('checking');
    fetch('/api/youtube/status')
      .then(r => r.json())
      .then(data => {
        if (data.connected) {
          setYtStatus('connected');
          setYtChannelName(data.channelName);
        } else {
          setYtStatus('disconnected');
        }
      })
      .catch(() => setYtStatus('disconnected'));
  }, []);

  const handleYouTubeUpload = useCallback(async () => {
    if (!muxedBlob) return;

    setUploadStatus('uploading');
    setUploadProgress('Preparing upload...');
    setUploadError(null);

    try {
      const title = sessionTitle || `Research Video ${new Date().toLocaleDateString()}`;
      const description = buildDescription(title, keywords);

      const metadata = {
        title: title.length > 100 ? title.substring(0, 97) + '...' : title,
        description,
        tags: keywords.slice(0, 30),
        privacyStatus: 'unlisted' as const,
        categoryId: '22',
        madeForKids: false,
      };

      const formData = new FormData();
      const ext = muxedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('video', muxedBlob, `video.${ext}`);
      formData.append('metadata', JSON.stringify(metadata));

      setUploadProgress('Uploading to YouTube...');

      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const result = await res.json();
      setVideoUrl(result.videoUrl);
      setUploadStatus('success');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus('error');
    }
  }, [muxedBlob, sessionTitle, keywords]);

  const handleConnect = useCallback(() => {
    window.location.href = '/api/youtube/auth';
  }, []);

  // Rendering state
  if (isExporting) {
    return (
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-sm font-medium text-white">
              {status === 'bundling' ? 'Preparing...'
                : status === 'muxing' ? 'Muxing audio...'
                : status === 'encoding' ? 'Encoding...'
                : 'Rendering...'}
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
          {status === 'bundling' && ' — First export takes longer (bundling)'}
          {status === 'muxing' && ' — Adding narration audio'}
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
      <div className="space-y-3">
        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400">Export complete</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {audioData ? 'MP4 with narration audio' : 'MP4 video'}
              </p>
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

        {/* YouTube Upload Section */}
        {muxedBlob && (
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            {/* Upload success */}
            {uploadStatus === 'success' && videoUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <Check className="w-4 h-4" />
                  Uploaded to YouTube
                </div>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400
                             hover:bg-red-500/20 border border-red-500/30 text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open on YouTube
                </a>
              </div>
            ) : uploadStatus === 'uploading' ? (
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                <span className="text-sm font-medium text-white">{uploadProgress}</span>
              </div>
            ) : uploadStatus === 'error' ? (
              <div>
                <p className="text-xs text-red-400 mb-2">{uploadError}</p>
                <button
                  onClick={handleYouTubeUpload}
                  className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium
                             hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  Retry Upload
                </button>
              </div>
            ) : ytStatus === 'connected' ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-400">
                    Connected to {ytChannelName || 'YouTube'}
                  </span>
                </div>
                <button
                  onClick={handleYouTubeUpload}
                  className="w-full py-2.5 px-4 rounded-lg bg-red-500 text-white text-sm font-medium
                             hover:bg-red-400 transition-all flex items-center justify-center gap-2
                             shadow-lg shadow-red-500/20"
                >
                  <Upload className="w-4 h-4" />
                  Upload to YouTube
                </button>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Uploads as unlisted Shorts
                </p>
              </>
            ) : ytStatus === 'checking' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                <span className="text-xs text-slate-400">Checking YouTube...</span>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="w-full py-2.5 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium
                           hover:bg-red-500/20 transition-all flex items-center justify-center gap-2
                           border border-red-500/30"
              >
                <Upload className="w-4 h-4" />
                Connect YouTube
              </button>
            )}
          </div>
        )}
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
            {audioData ? ' • With narration' : ''}
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
        Server-side rendering • MP4 format{audioData ? ' + narration' : ''}
      </p>
    </div>
  );
}
