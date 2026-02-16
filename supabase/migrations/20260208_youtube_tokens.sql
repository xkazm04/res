-- YouTube OAuth2 token storage (single channel)
CREATE TABLE IF NOT EXISTS youtube_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  channel_name TEXT,
  channel_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE youtube_tokens ENABLE ROW LEVEL SECURITY;

-- Allow all operations (local app, single user)
CREATE POLICY "Allow all youtube_tokens operations" ON youtube_tokens
  FOR ALL USING (true) WITH CHECK (true);
