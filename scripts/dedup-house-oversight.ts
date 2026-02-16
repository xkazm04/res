import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z .'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(dr|mr|mrs|ms|prof|judge|sen|rep|gov|atty|det|sgt) /, '')
    .replace(/ (jr|sr|ii|iii|iv|esq|md|phd)$/, '');
}

async function main() {
  // Get House Oversight sessions
  const { data: sessions } = await sb.from('research_sessions')
    .select('id, title')
    .eq('thematic_group', 'Jeffrey Epstein Investigation')
    .like('title', '%House Oversight%');

  console.log(`Found ${sessions!.length} House Oversight sessions`);

  let totalLinked = 0;
  let totalDupGroups = 0;

  for (const session of sessions!) {
    const { data: actors } = await sb.from('research_findings')
      .select('id, finding_type, content, summary, confidence_score, extracted_data')
      .eq('session_id', session.id)
      .eq('finding_type', 'actor')
      .order('confidence_score', { ascending: false });

    if (!actors || actors.length < 2) {
      console.log(`\n${session.title}: ${actors?.length || 0} actors (skip)`);
      continue;
    }

    console.log(`\n--- ${session.title} (${actors.length} actors) ---`);

    const groups: Record<string, typeof actors> = {};
    actors.forEach(f => {
      const name = normalizeName(f.extracted_data?.name || f.summary || '');
      if (!name || name.length < 3) return;
      if (!groups[name]) groups[name] = [];
      groups[name]!.push(f);
    });

    for (const [name, entries] of Object.entries(groups)) {
      if (!entries || entries.length <= 1) continue;

      totalDupGroups++;
      entries.sort((a, b) => {
        if (b!.confidence_score !== a!.confidence_score) return b!.confidence_score - a!.confidence_score;
        return b!.content.length - a!.content.length;
      });

      const primary = entries[0]!;
      const dupeIds = entries.slice(1).map(d => d!.id);

      const { error } = await sb.from('research_findings')
        .update({ related_findings: dupeIds })
        .eq('id', primary.id);

      if (!error) {
        totalLinked += dupeIds.length;
        console.log(`  ${name}: ${entries.length} entries -> primary ${primary.id.slice(0, 8)}`);
      }
    }
  }

  // Also do a CROSS-SESSION dedup for actors appearing in multiple later sessions
  console.log('\n\n=== Cross-session actor dedup (all sessions) ===');

  const { data: allSessions } = await sb.from('research_sessions')
    .select('id, title')
    .eq('thematic_group', 'Jeffrey Epstein Investigation')
    .eq('workspace_id', 'epstein-investigation');

  // Get ALL actor findings across all sessions
  const allActors: Array<{
    id: string;
    session_id: string;
    summary: string;
    confidence_score: number;
    content: string;
    extracted_data: any;
  }> = [];

  for (const session of allSessions!) {
    const { data: actors } = await sb.from('research_findings')
      .select('id, session_id, content, summary, confidence_score, extracted_data')
      .eq('session_id', session.id)
      .eq('finding_type', 'actor')
      .order('confidence_score', { ascending: false });

    if (actors) allActors.push(...actors);
  }

  console.log(`Total actors across all sessions: ${allActors.length}`);

  // Group by normalized name across all sessions
  const crossGroups: Record<string, typeof allActors> = {};
  allActors.forEach(f => {
    const name = normalizeName(f.extracted_data?.name || f.summary || '');
    if (!name || name.length < 3) return;
    if (!crossGroups[name]) crossGroups[name] = [];
    crossGroups[name]!.push(f);
  });

  // Only report cross-session duplicates (same name in 2+ sessions)
  let crossLinked = 0;
  for (const [name, entries] of Object.entries(crossGroups)) {
    if (!entries || entries.length <= 1) continue;

    const sessionIds = new Set(entries.map(e => e.session_id));
    if (sessionIds.size <= 1) continue; // Same session dupes already handled

    // Sort: highest confidence, then longest content
    entries.sort((a, b) => {
      if (b!.confidence_score !== a!.confidence_score) return b!.confidence_score - a!.confidence_score;
      return b!.content.length - a!.content.length;
    });

    const primary = entries[0]!;
    const otherIds = entries.slice(1).map(d => d!.id);

    // Get existing related_findings
    const { data: existing } = await sb.from('research_findings')
      .select('related_findings')
      .eq('id', primary.id)
      .single();

    const existingRels: string[] = existing?.related_findings || [];
    const mergedRels = [...new Set([...existingRels, ...otherIds])];

    const { error } = await sb.from('research_findings')
      .update({ related_findings: mergedRels })
      .eq('id', primary.id);

    if (!error) {
      crossLinked += otherIds.length;
      const sessionTitles = [...sessionIds].map(sid => {
        const s = allSessions!.find(x => x.id === sid);
        return s?.title.replace('Epstein Archive: ', '') || sid.slice(0, 8);
      });
      console.log(`  ${name}: ${entries.length} across ${sessionIds.size} sessions (${sessionTitles.join(', ')})`);
    }
  }

  console.log(`\n=== Within-session: Linked ${totalLinked} duplicates in ${totalDupGroups} groups ===`);
  console.log(`=== Cross-session: Linked ${crossLinked} actor references ===`);
}

main().catch(console.error);
