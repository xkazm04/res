/**
 * Benchmark ElevenLabs voice speed to calibrate WPS estimation.
 *
 * Tests voice 56AoDkrOh6qfVPDXZ7Pt with sentences of varying lengths
 * and measures actual words-per-second from returned audio duration.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '3DR8c2yd30eztg65o4jV';
const MODEL = 'eleven_flash_v2_5';

if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY not found in .env');
  process.exit(1);
}

// Test sentences with different word counts and narration styles
const TEST_SENTENCES = [
  // Short (5-8 words)
  { label: 'short-1', text: 'This company has serious red flags.' },
  { label: 'short-2', text: 'The evidence points to systematic fraud.' },

  // Medium (15-20 words)
  { label: 'medium-1', text: 'Internal documents reveal a pattern of financial misrepresentation that spans more than five years of quarterly reports.' },
  { label: 'medium-2', text: 'Three former executives have confirmed the existence of a shadow accounting system used to inflate revenue numbers.' },

  // Long (30-40 words)
  { label: 'long-1', text: 'When we cross-reference the public filings with leaked internal memos, a disturbing picture emerges. The company systematically overstated its customer base by counting inactive accounts, while simultaneously hiding mounting operational losses from investors and regulators.' },
  { label: 'long-2', text: 'The competitive landscape reveals that while the company claims market leadership, independent analysis shows they rank fourth in actual revenue. Their biggest advantage, a proprietary technology platform, faces three credible patent challenges that could force expensive licensing deals.' },

  // Combined narration (typical full video ~60-80 words)
  { label: 'full-narration', text: 'What they don\'t want you to know about this deal. ... Behind the glossy marketing, our investigation reveals a troubling pattern. Three key executives left within six months, citing irreconcilable differences. The financial statements show a suspicious thirty percent jump in reported revenue, but actual cash collections tell a different story. ... When you follow the money trail, it leads to two offshore entities with no clear business purpose. The bottom line: proceed with extreme caution.' },
];

async function generateAndMeasure(label, text) {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0 && w !== '...').length;

  const start = Date.now();
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
      output_format: 'mp3_44100_128',
    }),
  });
  const latency = Date.now() - start;

  if (!res.ok) {
    const err = await res.text();
    console.error(`  [${label}] API error ${res.status}: ${err}`);
    return null;
  }

  const audioBuffer = await res.arrayBuffer();
  const byteSize = audioBuffer.byteLength;

  // CBR MP3 duration calculation (128 kbps)
  const durationCBR = (byteSize * 8) / 128000;

  const wps = wordCount / durationCBR;

  return {
    label,
    wordCount,
    byteSize,
    durationCBR: Math.round(durationCBR * 100) / 100,
    wps: Math.round(wps * 100) / 100,
    latencyMs: latency,
  };
}

async function main() {
  console.log(`\nBenchmarking ElevenLabs voice: ${VOICE_ID}`);
  console.log(`Model: ${MODEL}`);
  console.log(`${'='.repeat(80)}\n`);

  const results = [];

  for (const { label, text } of TEST_SENTENCES) {
    process.stdout.write(`  Testing "${label}"...`);
    const result = await generateAndMeasure(label, text);
    if (result) {
      results.push(result);
      console.log(` ${result.wordCount} words → ${result.durationCBR}s (${result.wps} WPS) [${result.latencyMs}ms]`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}`);

  const totalWords = results.reduce((s, r) => s + r.wordCount, 0);
  const totalDuration = results.reduce((s, r) => s + r.durationCBR, 0);
  const overallWPS = totalWords / totalDuration;

  // Exclude the full-narration (combined) from per-sentence average
  const perSentence = results.filter(r => r.label !== 'full-narration');
  const avgWPS = perSentence.reduce((s, r) => s + r.wps, 0) / perSentence.length;
  const minWPS = Math.min(...perSentence.map(r => r.wps));
  const maxWPS = Math.max(...perSentence.map(r => r.wps));

  console.log(`\n  Per-sentence WPS range: ${minWPS} – ${maxWPS}`);
  console.log(`  Per-sentence WPS average: ${Math.round(avgWPS * 100) / 100}`);
  console.log(`  Overall WPS (all text): ${Math.round(overallWPS * 100) / 100}`);
  console.log(`  Full narration WPS: ${results.find(r => r.label === 'full-narration')?.wps ?? 'N/A'}`);
  console.log(`\n  Current estimate: 2.5 WPS`);
  console.log(`  Recommended: ${Math.round(avgWPS * 10) / 10} WPS`);

  // Calculate how far off the current estimate is
  const errorPct = Math.round(((2.5 - avgWPS) / avgWPS) * 100);
  console.log(`  Current estimate error: ${errorPct > 0 ? '+' : ''}${errorPct}% (${errorPct > 0 ? 'scenes too short' : 'scenes too long'})`);
}

main().catch(console.error);
