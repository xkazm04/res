-- Video Renders Table
-- Phase 21: Lambda Rendering
-- Tracks video render jobs from Remotion Lambda

CREATE TABLE IF NOT EXISTS video_renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('16:9', '9:16')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rendering', 'encoding', 'complete', 'failed')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),

  -- Remotion Lambda tracking
  render_id VARCHAR(255), -- Remotion Lambda render ID
  bucket_name VARCHAR(255), -- S3 bucket name

  -- Render metadata
  estimated_duration_seconds INTEGER,
  estimated_cost_usd DECIMAL(10, 4),

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Output
  s3_output_key VARCHAR(500), -- S3 key for the rendered video
  signed_url TEXT, -- Pre-signed download URL (cached)
  signed_url_expires_at TIMESTAMPTZ, -- When the cached signed URL expires

  -- Error handling
  error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by session
CREATE INDEX IF NOT EXISTS idx_video_renders_session_id ON video_renders(session_id);

-- Index for querying active renders
CREATE INDEX IF NOT EXISTS idx_video_renders_status ON video_renders(status) WHERE status IN ('pending', 'rendering', 'encoding');

-- Index for querying by Remotion render ID
CREATE INDEX IF NOT EXISTS idx_video_renders_render_id ON video_renders(render_id) WHERE render_id IS NOT NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_video_renders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_renders_updated_at
  BEFORE UPDATE ON video_renders
  FOR EACH ROW
  EXECUTE FUNCTION update_video_renders_updated_at();

-- Comments for documentation
COMMENT ON TABLE video_renders IS 'Tracks video render jobs from Remotion Lambda';
COMMENT ON COLUMN video_renders.render_id IS 'Remotion Lambda render ID for progress tracking';
COMMENT ON COLUMN video_renders.bucket_name IS 'S3 bucket containing the rendered video';
COMMENT ON COLUMN video_renders.s3_output_key IS 'S3 object key for the rendered MP4 file';
COMMENT ON COLUMN video_renders.signed_url IS 'Cached pre-signed URL for download (regenerate if expired)';
COMMENT ON COLUMN video_renders.estimated_cost_usd IS 'Estimated AWS Lambda rendering cost';
