import { NextRequest, NextResponse } from 'next/server';
import { buildAuthUrl } from '@/src/lib/youtube';

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/youtube/callback`;
    const authUrl = buildAuthUrl(redirectUri);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build auth URL' },
      { status: 500 },
    );
  }
}
