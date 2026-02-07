-- Migration: Create research_topics infrastructure
-- Purpose: Create data_sources and research_topics tables for news feed discovery
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. Create data_sources table
-- ============================================
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'globe',
  color TEXT NOT NULL DEFAULT '#666666',
  search_pattern TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_data_sources_slug ON data_sources(slug);

-- ============================================
-- 2. Seed data_sources with 10 news sources
-- ============================================
INSERT INTO data_sources (slug, name, icon, color, search_pattern, active)
VALUES
  ('twitter', 'Twitter', 'twitter', '#1DA1F2', 'site:twitter.com OR site:x.com', true),
  ('bbc', 'BBC', 'globe', '#B80000', 'site:bbc.com/news', true),
  ('reuters', 'Reuters', 'newspaper', '#FF8000', 'site:reuters.com', true),
  ('techcrunch', 'TechCrunch', 'cpu', '#0A9B00', 'site:techcrunch.com', true),
  ('bloomberg', 'Bloomberg', 'trending-up', '#0A0A0A', 'site:bloomberg.com', true),
  ('nyt', 'NYT', 'newspaper', '#000000', 'site:nytimes.com', true),
  ('guardian', 'Guardian', 'shield', '#052962', 'site:theguardian.com', true),
  ('ap-news', 'AP News', 'zap', '#FF322E', 'site:apnews.com', true),
  ('al-jazeera', 'Al Jazeera', 'globe', '#FA9000', 'site:aljazeera.com', true),
  ('reddit', 'Reddit', 'message-circle', '#FF5700', 'site:reddit.com', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  search_pattern = EXCLUDED.search_pattern,
  active = EXCLUDED.active;

-- ============================================
-- 3. Create research_topics table
-- ============================================
CREATE TABLE IF NOT EXISTS research_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'queued', 'researching', 'completed', 'failed', 'deleted')),
  session_id UUID,  -- Links to research_sessions when researched

  -- Classification signals
  signals TEXT[] NOT NULL DEFAULT '{}',

  -- Research-oriented fields (new)
  research_query TEXT,  -- Generated query for direct use in research templates
  suggested_template TEXT,  -- Recommended template: debunk_claim, actor_investigation, etc.
  claim TEXT,  -- Verifiable claim extracted from story (not just headline)
  source_bias TEXT CHECK (source_bias IS NULL OR source_bias IN ('left', 'center-left', 'center', 'center-right', 'right')),
  debunkable SMALLINT CHECK (debunkable IS NULL OR (debunkable >= 1 AND debunkable <= 5)),

  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. Create indexes for common queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_research_topics_source_id ON research_topics(source_id);
CREATE INDEX IF NOT EXISTS idx_research_topics_status ON research_topics(status);
CREATE INDEX IF NOT EXISTS idx_research_topics_discovered_at ON research_topics(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_topics_suggested_template ON research_topics(suggested_template);
CREATE INDEX IF NOT EXISTS idx_research_topics_debunkable ON research_topics(debunkable);
CREATE INDEX IF NOT EXISTS idx_research_topics_signals ON research_topics USING GIN(signals);

-- ============================================
-- 5. Add comments for documentation
-- ============================================
COMMENT ON TABLE data_sources IS 'News sources for topic discovery (Twitter, BBC, Reuters, etc.)';
COMMENT ON TABLE research_topics IS 'Discovered topics from news sources, ready for research';

COMMENT ON COLUMN research_topics.research_query IS 'Generated research query for direct use in research templates';
COMMENT ON COLUMN research_topics.suggested_template IS 'Recommended research template (debunk_claim, actor_investigation, event_timeline, policy_analysis, financial_investigation, controversy_analysis)';
COMMENT ON COLUMN research_topics.claim IS 'Verifiable claim extracted from the story (not just headline)';
COMMENT ON COLUMN research_topics.source_bias IS 'Political bias indicator: left, center-left, center, center-right, right';
COMMENT ON COLUMN research_topics.debunkable IS 'Debunkability score 1-5: 1=hard to verify, 5=easily verifiable with public data';
COMMENT ON COLUMN research_topics.signals IS 'Classification signals: breaking, trending, controversial';

-- ============================================
-- 6. Create updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_research_topics_updated_at ON research_topics;
CREATE TRIGGER update_research_topics_updated_at
  BEFORE UPDATE ON research_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Enable Row Level Security (optional)
-- ============================================
-- Uncomment if you want RLS enabled:
-- ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_topics ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all access" ON data_sources FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON research_topics FOR ALL USING (true);
