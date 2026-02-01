'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SessionWithDetails } from '@/src/types/research';
import type { VideoContentSelection } from './useContentSelection';
import { transformSelectionToContent, generateNarrationPrompt } from './contentTransformer';

export type NarrationStatus = 'idle' | 'generating_script' | 'generating_audio' | 'ready' | 'playing' | 'paused' | 'error';

export interface NarrationScript {
  text: string;
  wordCount: number;
  estimatedDuration: number;
}

export interface AudioNarrationState {
  status: NarrationStatus;
  script: NarrationScript | null;
  audioUrl: string | null;
  audioDuration: number;
  currentTime: number;
  error: string | null;
}

export interface UseAudioNarrationReturn extends AudioNarrationState {
  generateNarration: () => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

export type VoiceOption = 'professional' | 'conversational' | 'authoritative';

const VOICE_IDS: Record<VoiceOption, string> = {
  professional: 'pNInz6obpgDQGcFmaJgB', // Adam
  conversational: '21m00Tcm4TlvDq8ikWAM', // Rachel
  authoritative: 'yoZ06aMxZJJ28mfd3POQ', // Sam
};

interface UseAudioNarrationOptions {
  session: SessionWithDetails;
  selection: VideoContentSelection;
  voice?: VoiceOption;
}

export function useAudioNarration({ session, selection, voice = 'professional' }: UseAudioNarrationOptions): UseAudioNarrationReturn {
  const [state, setState] = useState<AudioNarrationState>({
    status: 'idle',
    script: null,
    audioUrl: null,
    audioDuration: 0,
    currentTime: 0,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Generate narration script using Gemini (via existing API)
  const generateScript = useCallback(async (): Promise<NarrationScript> => {
    const content = transformSelectionToContent(session, selection);
    const prompt = generateNarrationPrompt(session, selection, content);

    // Use the research API or a dedicated script generation endpoint
    // For now, we'll use a simple template-based approach
    const topFindings = (session.findings || [])
      .filter(f => selection.selectedFindings.includes(f.id))
      .slice(0, 2);

    const hookPhrases = [
      'Breaking discovery:',
      'Our investigation reveals:',
      'The evidence shows:',
      'Critical finding:',
    ];

    const closingPhrases = [
      'The verdict is clear.',
      'The data speaks for itself.',
      'Our recommendation: dig deeper.',
      'Stay informed.',
    ];

    // Build a simple script
    const hook = hookPhrases[Math.floor(Math.random() * hookPhrases.length)];
    const finding1 = topFindings[0]?.content.slice(0, 60) || 'significant patterns emerged';
    const finding2 = topFindings[1]?.content.slice(0, 40) || '';
    const closing = closingPhrases[Math.floor(Math.random() * closingPhrases.length)];
    const confidence = content.stats.avgConfidence;

    let scriptText = `${hook} ${finding1}.`;
    if (finding2) {
      scriptText += ` Additionally, ${finding2}.`;
    }
    scriptText += ` With ${confidence}% confidence across ${content.stats.findings} findings, ${closing}`;

    const wordCount = scriptText.split(/\s+/).length;

    return {
      text: scriptText,
      wordCount,
      estimatedDuration: Math.round((wordCount / 150) * 60), // 150 WPM
    };
  }, [session, selection]);

  // Generate audio from script using ElevenLabs
  const generateAudio = useCallback(async (script: NarrationScript): Promise<{ audioUrl: string; duration: number }> => {
    const response = await fetch('/api/audio/narration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: script.text,
        voiceId: VOICE_IDS[voice],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate audio');
    }

    const data = await response.json();
    return {
      audioUrl: data.audioData,
      duration: data.duration,
    };
  }, [voice]);

  // Main generation function
  const generateNarration = useCallback(async () => {
    try {
      // Step 1: Generate script
      setState(prev => ({ ...prev, status: 'generating_script', error: null }));
      const script = await generateScript();

      // Step 2: Generate audio
      setState(prev => ({ ...prev, status: 'generating_audio', script }));
      const { audioUrl, duration } = await generateAudio(script);

      // Create audio element
      const audio = new Audio(audioUrl);
      audio.addEventListener('timeupdate', () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      });
      audio.addEventListener('ended', () => {
        setState(prev => ({ ...prev, status: 'ready', currentTime: 0 }));
      });
      audio.addEventListener('loadedmetadata', () => {
        setState(prev => ({ ...prev, audioDuration: audio.duration }));
      });

      audioRef.current = audio;

      setState(prev => ({
        ...prev,
        status: 'ready',
        audioUrl,
        audioDuration: duration,
      }));
    } catch (error) {
      console.error('[Audio] Generation error:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [generateScript, generateAudio]);

  // Playback controls
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setState(prev => ({ ...prev, status: 'playing' }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, status: 'paused' }));
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState(prev => ({ ...prev, status: 'ready', currentTime: 0 }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  return {
    ...state,
    generateNarration,
    play,
    pause,
    stop,
    seek,
  };
}
