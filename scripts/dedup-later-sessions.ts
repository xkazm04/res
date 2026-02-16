import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Sessions to deduplicate (the later-completed groups)
const SESSION_PATTERNS = [
  'House Oversight Part 1',
  'House Oversight Part 2',
  'House Oversight Part 3',
  'Virginia Giuffre',
  'Political & Media',
  'Plea Deal',
  'Katie Johnson',
  'Network & Timeline',
  'DOJ Audio',
  'Court Records',
];

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z .'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    // Remove titles/suffixes
    .replace(/^(dr|mr|mrs|ms|prof|judge|sen|rep|gov|atty|det|sgt|lt|capt|col|gen) /, '')
    .replace(/ (jr|sr|ii|iii|iv|esq|md|phd)$/, '')
    // Common name variations
    .replace(/^jeffrey /, 'jeffrey ')
    .replace(/^ghislaine /, 'ghislaine ')
    .replace(/^les /, 'les ')
    .replace(/^lawrence /, 'lawrence ')
    .replace(/^boris /, 'boris ')
    .replace(/^richard /, 'richard ')
    .replace(/^larry /, 'larry ');
}

async function main() {
  // Get all later sessions
  const { data: sessions } = await sb.from('research_sessions')
    .select('id, title')
    .eq('thematic_group', 'Jeffrey Epstein Investigation')
    .eq('workspace_id', 'epstein-investigation');

  const targetSessions = sessions!.filter(s =>
    SESSION_PATTERNS.some(p => s.title.includes(p))
  );

  console.log(`Found ${targetSessions.length} sessions to deduplicate:`);
  targetSessions.forEach(s => console.log(`  - ${s.title}`));

  let totalLinked = 0;
  let totalDupGroups = 0;

  for (const session of targetSessions) {
    // Get actor findings for this session
    const { data: actors } = await sb.from('research_findings')
      .select('id, finding_type, content, summary, confidence_score, extracted_data')
      .eq('session_id', session.id)
      .eq('finding_type', 'actor')
      .order('confidence_score', { ascending: false });

    if (!actors || actors.length < 2) continue;

    console.log(`\n--- ${session.title} (${actors.length} actors) ---`);

    // Group by normalized name
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

      // Sort: highest confidence, then longest content
      entries.sort((a, b) => {
        if (b!.confidence_score !== a!.confidence_score) return b!.confidence_score - a!.confidence_score;
        return b!.content.length - a!.content.length;
      });

      const primary = entries[0]!;
      const duplicates = entries.slice(1);
      const dupeIds = duplicates.map(d => d!.id);

      // Merge: append existing related_findings
      const existing = primary.extracted_data?.related_findings || [];
      const allRelated = [...new Set([...existing, ...dupeIds])];

      const { error } = await sb.from('research_findings')
        .update({ related_findings: allRelated })
        .eq('id', primary.id);

      if (!error) {
        totalLinked += dupeIds.length;
        console.log(`  ${name}: ${entries.length} entries -> primary ${primary.id.slice(0, 8)}`);
      } else {
        console.error(`  ERROR linking ${name}:`, error.message);
      }
    }

    // Also deduplicate relationship findings with very similar summaries
    const { data: rels } = await sb.from('research_findings')
      .select('id, finding_type, content, summary, confidence_score')
      .eq('session_id', session.id)
      .eq('finding_type', 'relationship')
      .order('confidence_score', { ascending: false });

    if (rels && rels.length > 1) {
      const relGroups: Record<string, typeof rels> = {};
      rels.forEach(r => {
        // Normalize relationship summaries: extract actor names mentioned
        const actors = (r.summary || '')
          .toLowerCase()
          .replace(/[^a-z ]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length > 2)
          .sort()
          .join(' ');
        // Use first 60 chars as key to catch near-duplicates
        const key = actors.slice(0, 60);
        if (!key) return;
        if (!relGroups[key]) relGroups[key] = [];
        relGroups[key]!.push(r);
      });

      for (const [key, entries] of Object.entries(relGroups)) {
        if (!entries || entries.length <= 1) continue;

        // Only link if summaries are actually similar (> 50% word overlap)
        const words0 = new Set((entries[0]!.summary || '').toLowerCase().split(/\s+/));
        const words1 = new Set((entries[1]!.summary || '').toLowerCase().split(/\s+/));
        const overlap = [...words0].filter(w => words1.has(w)).length;
        const similarity = overlap / Math.max(words0.size, words1.size);

        if (similarity < 0.5) continue;

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
          console.log(`  [rel] "${entries[0]!.summary?.slice(0, 50)}": ${entries.length} entries -> primary`);
        }
      }
    }
  }

  console.log(`\n=== TOTAL: Linked ${totalLinked} duplicates in ${totalDupGroups} groups ===`);
}

main().catch(console.error);
