'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UseAudioNarrationReturn, VoiceOption } from './useAudioNarration';

interface AudioControlsProps {
  narration: UseAudioNarrationReturn;
  isRadar: boolean;
  onVoiceChange?: (voice: VoiceOption) => void;
  selectedVoice?: VoiceOption;
}

const VOICE_OPTIONS: { value: VoiceOption; label: string; icon: string }[] = [
  { value: 'professional', label: 'Adam', icon: '👔' },
  { value: 'conversational', label: 'Rachel', icon: '💬' },
  { value: 'authoritative', label: 'Sam', icon: '🎯' },
];

export function AudioControls({ narration, isRadar, onVoiceChange, selectedVoice = 'professional' }: AudioControlsProps) {
  const [showScript, setShowScript] = useState(false);
  const {
    status,
    script,
    audioDuration,
    currentTime,
    error,
    generateNarration,
    play,
    pause,
    stop,
  } = narration;

  const isLoading = status === 'generating_script' || status === 'generating_audio';
  const isReady = status === 'ready' || status === 'playing' || status === 'paused';
  const isPlaying = status === 'playing';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`rounded-xl overflow-hidden ${isRadar ? 'bg-slate-900/50 border border-slate-700/50' : 'bg-white border border-stone-200'}`}>
      <div className={`p-3 ${isRadar ? 'bg-slate-800/50' : 'bg-stone-50'}`}>
        {/* Header Row */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
            🎙️ Audio Narration
          </span>
          <div className="flex-1" />

          {/* Voice Selector (when not generated) */}
          {!isReady && !isLoading && (
            <div className="flex items-center gap-1">
              {VOICE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onVoiceChange?.(opt.value)}
                  className={`
                    px-2 py-1 rounded text-[10px] font-medium transition-all
                    ${selectedVoice === opt.value
                      ? isRadar
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-stone-800 text-white'
                      : isRadar
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200'
                    }
                  `}
                  title={opt.label}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-3">
          {/* Generate / Play/Pause Button */}
          {!isReady && !isLoading && (
            <button
              onClick={generateNarration}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isRadar
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400'
                  : 'bg-stone-800 text-white hover:bg-stone-700'
                }
              `}
            >
              <span>🎤</span>
              <span>Generate Narration</span>
            </button>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-2">
              <div className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${isRadar ? 'border-cyan-500' : 'border-stone-500'}`} />
              <span className={`text-sm ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                {status === 'generating_script' ? 'Generating script...' : 'Creating audio...'}
              </span>
            </div>
          )}

          {isReady && (
            <>
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? pause : play}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${isRadar
                    ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400'
                    : 'bg-stone-800 text-white hover:bg-stone-700'
                  }
                `}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Stop */}
              <button
                onClick={stop}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${isRadar
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }
                `}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>

              {/* Progress Bar */}
              <div className="flex-1 flex items-center gap-2">
                <span className={`text-[10px] font-mono ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                  {formatTime(currentTime)}
                </span>
                <div className={`flex-1 h-1.5 rounded-full ${isRadar ? 'bg-slate-700' : 'bg-stone-200'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${isRadar ? 'bg-cyan-500' : 'bg-stone-600'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={`text-[10px] font-mono ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                  {formatTime(audioDuration)}
                </span>
              </div>

              {/* Word Count Badge */}
              {script && (
                <div className={`px-2 py-1 rounded text-[10px] font-medium ${isRadar ? 'bg-slate-700 text-slate-300' : 'bg-stone-100 text-stone-600'}`}>
                  {script.wordCount} words
                </div>
              )}

              {/* Script Toggle */}
              <button
                onClick={() => setShowScript(!showScript)}
                className={`
                  px-2 py-1 rounded text-[10px] font-medium transition-all
                  ${showScript
                    ? isRadar
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-stone-800 text-white'
                    : isRadar
                      ? 'text-slate-400 hover:text-white'
                      : 'text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                {showScript ? '📝 Hide Script' : '📝 Show Script'}
              </button>
            </>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className={`mt-2 p-2 rounded text-xs ${isRadar ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border-l-2 border-rose-500'}`}>
            Error: {error}
          </div>
        )}
      </div>

      {/* Script Panel */}
      <AnimatePresence>
        {showScript && script && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`p-3 border-t ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}`}>
              <p className={`text-xs leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                "{script.text}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
