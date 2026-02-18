-- Migration: Add user_verdict and reviewed_at columns to research_topics
-- Purpose: Track accept/reject decisions and which topics have been reviewed by the Learn system
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. Add user_verdict column
-- ============================================
ALTER TABLE research_topics
ADD COLUMN IF NOT EXISTS user_verdict TEXT
CHECK (user_verdict IS NULL OR user_verdict IN ('accepted', 'rejected'));

COMMENT ON COLUMN research_topics.user_verdict IS 'User accept/reject decision: null=pending, accepted=user wants this type, rejected=user does not want this type';

-- ============================================
-- 2. Add reviewed_at column (for Learn tracking)
-- ============================================
ALTER TABLE research_topics
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN research_topics.reviewed_at IS 'When the Learn system last reviewed this topic for preference learning. NULL = not yet reviewed.';

-- ============================================
-- 3. Add index for unreviewed query
-- ============================================
CREATE INDEX IF NOT EXISTS idx_research_topics_unreviewed
ON research_topics (reviewed_at)
WHERE reviewed_at IS NULL AND user_verdict IS NOT NULL;

-- ============================================
-- 4. Backfill: mark existing 'deleted' topics as rejected
-- ============================================
UPDATE research_topics
SET user_verdict = 'rejected',
    status = 'new'
WHERE status = 'deleted'
  AND user_verdict IS NULL;
