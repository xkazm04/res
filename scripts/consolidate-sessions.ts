/**
 * Consolidate 20 "Epstein Archive:" sessions + 1 Synthesis session
 * into a single unified research session.
 *
 * Strategy:
 *   1. Create new consolidated session
 *   2. Move all findings, sources, perspectives to new session
 *   3. Store original session title in each finding's extracted_data.source_session
 *   4. Delete old empty sessions
 */
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 1. Get all sessions
  const { data: sessions, error: sessErr } = await sb.from('research_sessions')
    .select('id, title, claim_count, source_count, created_at')
    .eq('thematic_group', 'Jeffrey Epstein Investigation')
    .order('title');

  if (sessErr || !sessions) {
    console.error('Failed to fetch sessions:', sessErr?.message);
    return;
  }

  console.log(`Found ${sessions.length} sessions to consolidate:`);
  let totalFindings = 0;
  let totalSources = 0;
  sessions.forEach(s => {
    console.log(`  ${s.id.slice(0, 8)} | ${s.claim_count} findings | ${s.title}`);
    totalFindings += s.claim_count;
    totalSources += s.source_count;
  });
  console.log(`\nTotal: ${totalFindings} findings, ${totalSources} sources`);

  const oldIds = sessions.map(s => s.id);
  const earliestCreated = sessions.reduce((min, s) =>
    s.created_at < min ? s.created_at : min, sessions[0].created_at);

  // 2. Create new consolidated session
  const newSessionId = crypto.randomUUID();
  const { error: createErr } = await sb.from('research_sessions').insert({
    id: newSessionId,
    workspace_id: 'epstein-investigation',
    title: 'Jeffrey Epstein Network Investigation',
    query: 'Comprehensive analysis of 65+ documents from Epstein archive covering depositions, financial records, flight logs, court records, House Oversight releases, and cross-session synthesis',
    template_type: 'investigative',
    parameters: {
      granularity: 'deep',
      source: 'archive-ingest + manual-enrichment',
      type: 'consolidated',
      original_sessions: sessions.map(s => ({ id: s.id, title: s.title, findings: s.claim_count })),
    },
    status: 'completed',
    thematic_group: 'Jeffrey Epstein Investigation',
    claim_count: 0, // Will update after move
    source_count: 0,
    created_at: earliestCreated,
    completed_at: new Date().toISOString(),
  });

  if (createErr) {
    console.error('Failed to create consolidated session:', createErr.message);
    return;
  }
  console.log(`\nCreated consolidated session: ${newSessionId.slice(0, 8)}`);

  // 3. Tag each finding with its original session title before moving
  for (const session of sessions) {
    const shortTitle = session.title
      .replace('Epstein Archive: ', '')
      .replace('Cross-Session Synthesis & Enrichment', 'Synthesis & Enrichment');

    // Get all findings for this session
    const { data: findings } = await sb.from('research_findings')
      .select('id, extracted_data')
      .eq('session_id', session.id);

    if (!findings || findings.length === 0) continue;

    // Batch update: add source_session to extracted_data
    const updates = findings.map(f => ({
      id: f.id,
      extracted_data: {
        ...(f.extracted_data || {}),
        source_session: shortTitle,
      },
    }));

    // Supabase doesn't support batch updates with different values per row,
    // so we do this in batches using upsert
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      for (const upd of batch) {
        await sb.from('research_findings')
          .update({ extracted_data: upd.extracted_data })
          .eq('id', upd.id);
      }
    }
    console.log(`  Tagged ${findings.length} findings with source_session="${shortTitle}"`);
  }

  // 4. Move all findings to new session
  const { error: moveErr, count: movedFindings } = await sb.from('research_findings')
    .update({ session_id: newSessionId })
    .in('session_id', oldIds);

  if (moveErr) {
    console.error('Failed to move findings:', moveErr.message);
    return;
  }
  console.log(`\nMoved ${movedFindings ?? '?'} findings to consolidated session`);

  // 5. Move all sources
  const { error: srcErr, count: movedSources } = await sb.from('research_sources')
    .update({ session_id: newSessionId })
    .in('session_id', oldIds);

  if (srcErr) {
    console.error('Failed to move sources:', srcErr.message);
  } else {
    console.log(`Moved ${movedSources ?? '?'} sources`);
  }

  // 6. Move all perspectives
  const { error: perspErr, count: movedPersp } = await sb.from('research_perspectives')
    .update({ session_id: newSessionId })
    .in('session_id', oldIds);

  if (perspErr) {
    console.error('Failed to move perspectives:', perspErr.message);
  } else {
    console.log(`Moved ${movedPersp ?? '?'} perspectives`);
  }

  // 7. Get actual counts
  const { count: actualFindings } = await sb.from('research_findings')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', newSessionId);

  const { count: actualSources } = await sb.from('research_sources')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', newSessionId);

  // 8. Update consolidated session counts
  await sb.from('research_sessions')
    .update({
      claim_count: actualFindings || totalFindings,
      source_count: actualSources || totalSources,
    })
    .eq('id', newSessionId);

  console.log(`\nConsolidated session: ${actualFindings} findings, ${actualSources} sources`);

  // 9. Delete old sessions (findings already moved, so CASCADE won't destroy them)
  const { error: delErr } = await sb.from('research_sessions')
    .delete()
    .in('id', oldIds);

  if (delErr) {
    console.error('Failed to delete old sessions:', delErr.message);
  } else {
    console.log(`Deleted ${oldIds.length} old sessions`);
  }

  // 10. Verify final state
  const { data: finalSessions } = await sb.from('research_sessions')
    .select('id, title, claim_count, source_count')
    .eq('thematic_group', 'Jeffrey Epstein Investigation');

  console.log('\n=== Final State ===');
  finalSessions?.forEach(s => {
    console.log(`  ${s.id.slice(0, 8)} | ${s.claim_count} findings | ${s.source_count} sources | ${s.title}`);
  });

  // 11. Verify no orphaned findings
  const { count: orphaned } = await sb.from('research_findings')
    .select('id', { count: 'exact', head: true })
    .in('session_id', oldIds);

  if (orphaned && orphaned > 0) {
    console.error(`WARNING: ${orphaned} orphaned findings still reference old session IDs!`);
  } else {
    console.log('\nNo orphaned findings. Consolidation complete.');
  }
}

main().catch(console.error);
