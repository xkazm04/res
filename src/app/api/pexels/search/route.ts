import { NextRequest, NextResponse } from 'next/server';

const PEXELS_API_BASE = 'https://api.pexels.com/videos/search';

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  page: number;
  per_page: number;
  total_results: number;
  videos: PexelsVideo[];
}

export interface PexelsVideoResult {
  id: number;
  url: string;
  width: number;
  height: number;
  duration: number;
  thumbnail: string;
}

/**
 * Pick the best video file — prefer HD (1280x720+) MP4, fallback to largest available.
 */
function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  const mp4s = files.filter(f => f.file_type === 'video/mp4');
  if (mp4s.length === 0) return files[0] || null;

  // Prefer HD quality
  const hd = mp4s.find(f => f.quality === 'hd' && f.width >= 1280);
  if (hd) return hd;

  // Fallback: largest MP4
  return mp4s.sort((a, b) => b.width - a.width)[0];
}

/**
 * GET /api/pexels/search?query=...&per_page=5&orientation=landscape
 *
 * Proxies Pexels Video Search API. Returns slim video metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PEXELS_API_KEY not configured' },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 },
      );
    }

    const perPage = Math.min(Number(searchParams.get('per_page')) || 5, 20);
    const orientation = searchParams.get('orientation') || 'landscape';

    const params = new URLSearchParams({
      query,
      per_page: String(perPage),
      orientation,
    });

    const response = await fetch(`${PEXELS_API_BASE}?${params}`, {
      headers: { Authorization: apiKey },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Pexels] API error:', response.status, text);
      return NextResponse.json(
        { error: `Pexels API returned ${response.status}` },
        { status: 502 },
      );
    }

    const data: PexelsSearchResponse = await response.json();

    const videos: PexelsVideoResult[] = data.videos
      .map(v => {
        const best = pickBestFile(v.video_files);
        if (!best) return null;
        return {
          id: v.id,
          url: best.link,
          width: best.width,
          height: best.height,
          duration: v.duration,
          thumbnail: v.image,
        };
      })
      .filter((v): v is PexelsVideoResult => v !== null);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('[Pexels] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
