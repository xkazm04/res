/**
 * YouTube Data API v3 client for video upload.
 * Handles OAuth2 token management and resumable uploads.
 */

import { supabase } from './supabase';

const YOUTUBE_API_BASE = 'https://www.googleapis.com';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';

// ============================================
// OAuth2 Helpers
// ============================================

export function getOAuthConfig() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set');
  }
  return { clientId, clientSecret };
}

export function buildAuthUrl(redirectUri: string, state?: string): string {
  const { clientId } = getOAuthConfig();
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', UPLOAD_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  if (state) url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getOAuthConfig();
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getOAuthConfig();
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

// ============================================
// Token Storage (Supabase)
// ============================================

interface YouTubeTokens {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  channel_name: string | null;
  channel_id: string | null;
}

export async function getStoredTokens(): Promise<YouTubeTokens | null> {
  const { data, error } = await supabase
    .from('youtube_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as YouTubeTokens;
}

export async function storeTokens(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  channel_name?: string;
  channel_id?: string;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Upsert: delete old tokens, insert new
  await supabase.from('youtube_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { error } = await supabase.from('youtube_tokens').insert({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    channel_name: tokens.channel_name || null,
    channel_id: tokens.channel_id || null,
  });

  if (error) {
    console.error('[youtube] Failed to store tokens:', error);
    throw new Error('Failed to store YouTube tokens');
  }
}

export async function getValidAccessToken(): Promise<string> {
  const stored = await getStoredTokens();
  if (!stored) throw new Error('No YouTube tokens found. Please connect your account.');

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(stored.expires_at).getTime();
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    // Refresh
    const refreshed = await refreshAccessToken(stored.refresh_token);
    await storeTokens({
      access_token: refreshed.access_token,
      refresh_token: stored.refresh_token,
      expires_in: refreshed.expires_in,
      channel_name: stored.channel_name || undefined,
      channel_id: stored.channel_id || undefined,
    });
    return refreshed.access_token;
  }

  return stored.access_token;
}

// ============================================
// Channel Info
// ============================================

export async function fetchChannelInfo(accessToken: string): Promise<{
  channelId: string;
  channelName: string;
} | null> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/youtube/v3/channels?part=snippet&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) return null;
  return {
    channelId: channel.id,
    channelName: channel.snippet.title,
  };
}

// ============================================
// Video Upload (Resumable)
// ============================================

export interface UploadMetadata {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'private' | 'unlisted' | 'public';
  categoryId?: string;
  madeForKids?: boolean;
}

export function buildDescription(
  sessionTitle: string,
  keywords: string[],
  summary?: string,
): string {
  const hashtags = keywords
    .map(k => `#${k.replace(/[\s#]+/g, '').toLowerCase()}`)
    .filter(h => h.length > 1);

  const lines = [sessionTitle];
  if (summary) lines.push('', summary);
  if (hashtags.length > 0) lines.push('', hashtags.join(' '));
  lines.push('', '#Shorts');
  return lines.join('\n');
}

/**
 * Initiates a resumable upload to YouTube.
 * Returns the upload URI for sending video data.
 */
export async function initiateResumableUpload(
  accessToken: string,
  metadata: UploadMetadata,
  fileSize: number,
  mimeType: string,
): Promise<string> {
  const body = {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: metadata.categoryId || '22', // People & Blogs
    },
    status: {
      privacyStatus: metadata.privacyStatus,
      selfDeclaredMadeForKids: metadata.madeForKids ?? false,
    },
  };

  const res = await fetch(
    `${YOUTUBE_API_BASE}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(fileSize),
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload initiation failed: ${res.status} ${err}`);
  }

  const uploadUrl = res.headers.get('Location');
  if (!uploadUrl) throw new Error('No upload URI in response');
  return uploadUrl;
}

/**
 * Uploads video data to the resumable upload URI.
 * Returns the YouTube video ID on success.
 */
export async function uploadVideoData(
  uploadUrl: string,
  videoData: ArrayBuffer,
  mimeType: string,
): Promise<{ videoId: string; videoUrl: string }> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(videoData.byteLength),
    },
    body: videoData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Video upload failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    videoId: data.id,
    videoUrl: `https://youtube.com/shorts/${data.id}`,
  };
}
