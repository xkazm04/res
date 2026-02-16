-- Video Drafts Table
-- AI-composed video content snapshots with scene composition
-- Stores curated selections, enrichments, rewrites, and composed scene sequences

CREATE TABLE IF NOT EXISTS video_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'Draft 1',

  -- Content selection snapshot (which findings/perspectives/analysis are included)
  selection JSONB NOT NULL DEFAULT '{}',

  -- AI enrichments (additional stats, quotes, facts from web research)
  enrichments JSONB NOT NULL DEFAULT '[]',

  -- AI rewrites (optimized copy for video format)
  rewrites JSONB NOT NULL DEFAULT '[]',

  -- AI-composed scene sequence with per-scene data
  -- NULL = use static template config (backward compatible)
  scene_composition JSONB DEFAULT NULL,

  -- Versioning (incremented on each save)
  version INTEGER NOT NULL DEFAULT 1,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying drafts by session (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_video_drafts_session_id ON video_drafts(session_id);

-- Index for ordering by latest update
CREATE INDEX IF NOT EXISTS idx_video_drafts_updated_at ON video_drafts(updated_at DESC);

-- Trigger to auto-update updated_at on modification
CREATE OR REPLACE FUNCTION update_video_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_drafts_updated_at
  BEFORE UPDATE ON video_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_video_drafts_updated_at();

-- Comments for documentation
COMMENT ON TABLE video_drafts IS 'AI-composed video content snapshots with curated selections and scene compositions';
COMMENT ON COLUMN video_drafts.selection IS 'JSONB: selectedFindings, selectedPerspectives, selectedContradictions, selectedGaps, selectedCausalChains, sectionAssignments';
COMMENT ON COLUMN video_drafts.enrichments IS 'JSONB array: [{itemId, type, content, source?}] — AI-researched supplementary data';
COMMENT ON COLUMN video_drafts.rewrites IS 'JSONB array: [{itemId, originalContent, optimizedContent}] — AI-optimized copy for video';
COMMENT ON COLUMN video_drafts.scene_composition IS 'JSONB array: [{sceneId, component, durationSeconds, data}] — AI-composed scene sequence. NULL = use static template config';
COMMENT ON COLUMN video_drafts.version IS 'Auto-incremented on each save for optimistic concurrency';
