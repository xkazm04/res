-- Migration: Create video_drafts table
-- Purpose: Persist AI compose results (selection, enrichments, rewrites) as immutable draft snapshots
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. Create video_drafts table
-- ============================================
CREATE TABLE IF NOT EXISTS video_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Draft 1',
  selection JSONB NOT NULL,       -- VideoContentSelection (selectedFindings, selectedPerspectives, etc.)
  enrichments JSONB DEFAULT '[]', -- Array of { itemId, type, content, source }
  rewrites JSONB DEFAULT '[]',    -- Array of { itemId, originalContent, optimizedContent }
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_video_drafts_session_id ON video_drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_video_drafts_updated_at ON video_drafts(updated_at DESC);

-- ============================================
-- 3. Add updated_at trigger (reuses existing function from research_topics migration)
-- ============================================
DROP TRIGGER IF EXISTS update_video_drafts_updated_at ON video_drafts;
CREATE TRIGGER update_video_drafts_updated_at
  BEFORE UPDATE ON video_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Add comments
-- ============================================
COMMENT ON TABLE video_drafts IS 'Persisted AI compose results for video content curation';
COMMENT ON COLUMN video_drafts.selection IS 'VideoContentSelection: selectedFindings, selectedPerspectives, selectedContradictions, selectedGaps, selectedCausalChains, sectionAssignments';
COMMENT ON COLUMN video_drafts.enrichments IS 'Web research enrichments: [{itemId, type, content, source}]';
COMMENT ON COLUMN video_drafts.rewrites IS 'Optimized content rewrites: [{itemId, originalContent, optimizedContent}]';
COMMENT ON COLUMN video_drafts.version IS 'Incremented on each update for optimistic concurrency';
