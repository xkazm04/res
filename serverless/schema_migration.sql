-- ============================================
-- SCHEMA MIGRATION FOR SERVERLESS COMPATIBILITY
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add 'started' status to research_sessions check constraint
ALTER TABLE research_sessions
DROP CONSTRAINT IF EXISTS research_sessions_status_check;

ALTER TABLE research_sessions
ADD CONSTRAINT research_sessions_status_check
CHECK (status IN ('active', 'started', 'searching', 'analyzing', 'completed', 'paused', 'failed'));

-- 2. Add specialized_data column to research_perspectives (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'research_perspectives'
        AND column_name = 'specialized_data'
    ) THEN
        ALTER TABLE research_perspectives ADD COLUMN specialized_data JSONB;
    END IF;
END $$;

-- 3. Add created_at alias view for research_queries (code expects created_at)
-- Option A: Add created_at column that mirrors executed_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'research_queries'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE research_queries ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 4. Add research_gaps table (used by serverless but may not exist)
CREATE TABLE IF NOT EXISTS research_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    gap_type TEXT DEFAULT 'information',
    priority INT DEFAULT 2,
    suggested_queries TEXT[],
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'ignored')),
    addressed_by_session_id UUID REFERENCES research_sessions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gaps_session ON research_gaps(session_id);
CREATE INDEX IF NOT EXISTS idx_gaps_status ON research_gaps(status);

-- 5. Add research_contradictions table (used by serverless but may not exist)
CREATE TABLE IF NOT EXISTS research_contradictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE NOT NULL,
    finding_id_1 UUID REFERENCES research_findings(id) ON DELETE CASCADE,
    finding_id_2 UUID REFERENCES research_findings(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    resolution_status TEXT DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'resolved', 'ignored')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contradictions_session ON research_contradictions(session_id);

-- 6. Add GIN index for specialized_data JSONB queries
CREATE INDEX IF NOT EXISTS idx_perspectives_specialized_gin
ON research_perspectives USING GIN(specialized_data);

-- 7. Verify the changes
SELECT
    'research_sessions status constraint updated' as change,
    conname as constraint_name
FROM pg_constraint
WHERE conname = 'research_sessions_status_check';

SELECT
    'research_perspectives.specialized_data exists' as change,
    column_name, data_type
FROM information_schema.columns
WHERE table_name = 'research_perspectives' AND column_name = 'specialized_data';

SELECT
    'research_queries.created_at exists' as change,
    column_name, data_type
FROM information_schema.columns
WHERE table_name = 'research_queries' AND column_name = 'created_at';

SELECT
    'research_gaps table exists' as change,
    table_name
FROM information_schema.tables
WHERE table_name = 'research_gaps';

SELECT
    'research_contradictions table exists' as change,
    table_name
FROM information_schema.tables
WHERE table_name = 'research_contradictions';

-- ============================================
-- SCALABILITY INDEXES FOR PAGINATION
-- Added for Research Map performance
-- ============================================

-- 8. Index for cursor pagination by template and creation time
-- Supports: GET /api/sessions?cursor=<id>&limit=50&template=<filter>
CREATE INDEX IF NOT EXISTS idx_sessions_template_created
ON research_sessions(template_type, created_at DESC);

-- 9. Index for topic-based queries
-- Supports: GET /api/sessions/by-topic/[topicId]
CREATE INDEX IF NOT EXISTS idx_sessions_topic
ON research_sessions(primary_topic_id);

-- 10. Composite index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_sessions_workspace_template_status
ON research_sessions(workspace_id, template_type, status);

-- 11. Set defaults to ensure counts are never null
ALTER TABLE research_sessions
  ALTER COLUMN claim_count SET DEFAULT 0,
  ALTER COLUMN source_count SET DEFAULT 0;

-- 12. Update any existing null counts to 0
UPDATE research_sessions SET claim_count = 0 WHERE claim_count IS NULL;
UPDATE research_sessions SET source_count = 0 WHERE source_count IS NULL;

-- 13. Verify scalability indexes
SELECT
    'Scalability indexes created' as change,
    indexname
FROM pg_indexes
WHERE tablename = 'research_sessions'
  AND indexname IN (
    'idx_sessions_template_created',
    'idx_sessions_topic',
    'idx_sessions_workspace_template_status'
  );

-- ============================================
-- PHASE 08: Data Sources and Research Topics
-- Added: 2026-01-31
-- ============================================

-- 14. Create data_sources table for news source registry
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    search_pattern TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Create research_topics table for discovered topics
CREATE TABLE IF NOT EXISTS research_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'queued', 'researching', 'completed', 'failed')),
    session_id UUID REFERENCES research_sessions(id) ON DELETE SET NULL,
    signals JSONB DEFAULT '[]',
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Create indexes for research_topics
CREATE INDEX IF NOT EXISTS idx_topics_source_status ON research_topics(source_id, status);
CREATE INDEX IF NOT EXISTS idx_topics_discovered ON research_topics(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_sources_slug ON data_sources(slug);

-- 17. Seed data for 10 news sources
INSERT INTO data_sources (slug, name, icon, color, search_pattern, active) VALUES
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
ON CONFLICT (slug) DO NOTHING;

-- 18. Verify Phase 08 tables
SELECT
    'data_sources table exists' as change,
    table_name
FROM information_schema.tables
WHERE table_name = 'data_sources';

SELECT
    'research_topics table exists' as change,
    table_name
FROM information_schema.tables
WHERE table_name = 'research_topics';

SELECT
    'data_sources seeded' as change,
    COUNT(*) as source_count
FROM data_sources;