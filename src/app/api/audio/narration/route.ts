import { NextRequest, NextResponse } from 'next/server';

interface NarrationRequest {
  text: string;
  voiceId?: string;
}

export interface WordTimestamp {
  word: string;
  start: number; // seconds from audio start
  end: number;   // seconds from audio start
}

interface NarrationResponse {
  audioData: string; // base64 data URL
  duration: number;
  wordCount: number;
  wordTimestamps: WordTimestamp[];
}

// Voice presets
const VOICE_PRESETS = {
  default: '3DR8c2yd30eztg65o4jV', // Primary narration voice (~2.35 WPS)
  professional: 'pNInz6obpgDQGcFmaJgB', // Adam
  conversational: '21m00Tcm4TlvDq8ikWAM', // Rachel
  authoritative: 'yoZ06aMxZJJ28mfd3POQ', // Sam
} as const;

/**
 * Convert ElevenLabs character-level alignment data to word-level timestamps.
 */
function charAlignmentToWords(
  characters: string[],
  startTimes: number[],
  endTimes: number[],
): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  let currentWord = '';
  let wordStart = -1;
  let wordEnd = -1;

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];

    if (ch === ' ' || ch === '\n' || ch === '\t') {
      // Whitespace — flush current word
      if (currentWord.length > 0) {
        words.push({ word: currentWord, start: wordStart, end: wordEnd });
        currentWord = '';
        wordStart = -1;
      }
    } else {
      // Non-whitespace — accumulate
      if (currentWord.length === 0) {
        wordStart = startTimes[i];
      }
      currentWord += ch;
      wordEnd = endTimes[i];
    }
  }

  // Flush last word
  if (currentWord.length > 0) {
    words.push({ word: currentWord, start: wordStart, end: wordEnd });
  }

  return words;
}

export async function POST(request: NextRequest) {
  try {
    const body: NarrationRequest = await request.json();

    if (!body.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Use provided voiceId or default narration voice
    const voiceId = body.voiceId || VOICE_PRESETS.default;

    // Use the with-timestamps endpoint for precise word-level timing
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: body.text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
          output_format: 'mp3_44100_128',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Audio] ElevenLabs API error:', response.status, errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Decode audio from base64
    const audioBuffer = Buffer.from(data.audio_base64, 'base64');
    const base64Audio = data.audio_base64;

    // Calculate duration from CBR MP3 (128 kbps)
    const actualDuration = (audioBuffer.byteLength * 8) / 128000;

    // Convert character-level alignment to word-level timestamps
    let wordTimestamps: WordTimestamp[] = [];
    if (data.alignment) {
      wordTimestamps = charAlignmentToWords(
        data.alignment.characters,
        data.alignment.character_start_times_seconds,
        data.alignment.character_end_times_seconds,
      );
    }

    const wordCount = body.text.split(/\s+/).filter(Boolean).length;

    const result: NarrationResponse = {
      audioData: `data:audio/mp3;base64,${base64Audio}`,
      duration: Math.round(actualDuration * 10) / 10,
      wordCount,
      wordTimestamps,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Audio] Error generating narration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available voices
export async function GET() {
  return NextResponse.json({
    voices: [
      { id: VOICE_PRESETS.default, name: 'Default', style: 'Narration' },
      { id: VOICE_PRESETS.professional, name: 'Adam', style: 'Professional' },
      { id: VOICE_PRESETS.conversational, name: 'Rachel', style: 'Conversational' },
      { id: VOICE_PRESETS.authoritative, name: 'Sam', style: 'Authoritative' },
    ],
  });
}
