import { NextResponse } from 'next/server';
import { getStoredTokens } from '@/src/lib/youtube';

export async function GET() {
  try {
    const tokens = await getStoredTokens();

    if (!tokens) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = new Date(tokens.expires_at).getTime() < Date.now();

    return NextResponse.json({
      connected: true,
      channelName: tokens.channel_name,
      channelId: tokens.channel_id,
      tokenExpired: isExpired,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
