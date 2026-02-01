import { NextRequest, NextResponse } from 'next/server';

interface NarrationRequest {
  text: string;
  voiceId?: string;
}

interface NarrationResponse {
  audioData: string; // base64 data URL
  duration: number;
  wordCount: number;
}

// Voice presets
const VOICE_PRESETS = {
  professional: 'pNInz6obpgDQGcFmaJgB', // Adam
  conversational: '21m00Tcm4TlvDq8ikWAM', // Rachel
  authoritative: 'yoZ06aMxZJJ28mfd3POQ', // Sam
} as const;

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

    // Use provided voiceId or default to professional
    const voiceId = body.voiceId || VOICE_PRESETS.professional;

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: body.text,
          model_id: 'eleven_flash_v2_5', // Fast model with ~75ms latency
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

    // Get audio data as array buffer
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    // Estimate duration: ~150 words per minute for narration
    const wordCount = body.text.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60); // seconds

    const result: NarrationResponse = {
      audioData: `data:audio/mp3;base64,${base64Audio}`,
      duration: estimatedDuration,
      wordCount,
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
      { id: VOICE_PRESETS.professional, name: 'Adam', style: 'Professional' },
      { id: VOICE_PRESETS.conversational, name: 'Rachel', style: 'Conversational' },
      { id: VOICE_PRESETS.authoritative, name: 'Sam', style: 'Authoritative' },
    ],
  });
}
