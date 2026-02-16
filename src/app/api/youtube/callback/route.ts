import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeTokens, fetchChannelInfo } from '@/src/lib/youtube';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    // User denied access
    return NextResponse.redirect(new URL('/maker?yt_error=denied', request.nextUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/maker?yt_error=no_code', request.nextUrl.origin));
  }

  try {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/youtube/callback`;

    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Fetch channel info for display
    const channelInfo = await fetchChannelInfo(tokens.access_token);

    await storeTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      channel_name: channelInfo?.channelName,
      channel_id: channelInfo?.channelId,
    });

    return NextResponse.redirect(
      new URL('/maker?yt_connected=true', request.nextUrl.origin),
    );
  } catch (err) {
    console.error('[youtube] OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/maker?yt_error=token_exchange', request.nextUrl.origin),
    );
  }
}
