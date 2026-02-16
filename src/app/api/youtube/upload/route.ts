import { NextRequest, NextResponse } from 'next/server';
import {
  getValidAccessToken,
  initiateResumableUpload,
  uploadVideoData,
  type UploadMetadata,
} from '@/src/lib/youtube';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }
    if (!metadataStr) {
      return NextResponse.json({ error: 'No metadata provided' }, { status: 400 });
    }

    const metadata: UploadMetadata = JSON.parse(metadataStr);
    const accessToken = await getValidAccessToken();

    const arrayBuffer = await videoFile.arrayBuffer();
    const mimeType = videoFile.type || 'video/mp4';

    // Initiate resumable upload
    const uploadUrl = await initiateResumableUpload(
      accessToken,
      metadata,
      arrayBuffer.byteLength,
      mimeType,
    );

    // Upload the video data
    const result = await uploadVideoData(uploadUrl, arrayBuffer, mimeType);

    return NextResponse.json({
      success: true,
      videoId: result.videoId,
      videoUrl: result.videoUrl,
    });
  } catch (error) {
    console.error('[youtube] Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    );
  }
}

// Increase body size limit for video uploads (100MB)
export const config = {
  api: {
    bodyParser: false,
  },
};
