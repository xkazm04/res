import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabase-server';

interface TopicWithSessions {
  id: string;
  name: string;
  slug: string;
  description?: string;
  topic_type?: string;
  parent_id?: string;
  session_count: number;
  finding_count: number;
  entity_count: number;
  children: TopicWithSessions[];
  sessions: Array<{
    id: string;
    title: string;
    template_type: string;
    status: string;
    claim_count: number;
    source_count: number;
  }>;
}

// GET /api/topics - List all topics with stats and linked sessions
export async function GET() {
  try {
    // Fetch topics
    const { data: topics, error } = await supabaseServer
      .from('knowledge_topics')
      .select('*')
      .order('session_count', { ascending: false });

    if (error) {
      console.error('[API] Error fetching topics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch topics', details: error.message },
        { status: 500 }
      );
    }

    // Fetch sessions that have primary_topic_id set
    const { data: sessionsWithTopic } = await supabaseServer
      .from('research_sessions')
      .select('id, title, template_type, status, claim_count, source_count, primary_topic_id')
      .not('primary_topic_id', 'is', null);

    // Group sessions by topic
    const sessionsByTopic = new Map<string, typeof sessionsWithTopic>();
    sessionsWithTopic?.forEach(session => {
      const topicId = session.primary_topic_id;
      if (!sessionsByTopic.has(topicId)) {
        sessionsByTopic.set(topicId, []);
      }
      sessionsByTopic.get(topicId)!.push(session);
    });

    // Build topics with sessions
    const topicsWithSessions: TopicWithSessions[] = (topics || []).map(topic => ({
      ...topic,
      children: [],
      sessions: sessionsByTopic.get(topic.id) || [],
      session_count: sessionsByTopic.get(topic.id)?.length || topic.session_count || 0,
    }));

    // Build hierarchy
    const topicsMap = new Map(topicsWithSessions.map(t => [t.id, t]));
    const rootTopics: TopicWithSessions[] = [];

    topicsWithSessions.forEach(topic => {
      if (topic.parent_id && topicsMap.has(topic.parent_id)) {
        topicsMap.get(topic.parent_id)!.children.push(topic);
      } else {
        rootTopics.push(topic);
      }
    });

    // Filter out topics with no sessions (either direct or via children)
    const hasSessionsRecursive = (topic: TopicWithSessions): boolean => {
      if (topic.sessions.length > 0) return true;
      return topic.children.some(hasSessionsRecursive);
    };

    const filteredTopics = rootTopics.filter(hasSessionsRecursive);

    return NextResponse.json({
      topics: filteredTopics,
      flat: topicsWithSessions.filter(t => t.sessions.length > 0),
      count: filteredTopics.length,
      totalSessions: sessionsWithTopic?.length || 0,
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
