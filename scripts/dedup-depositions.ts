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
  // Get depositions session
  const { data: sessions } = await sb.from('research_sessions')
    .select('id')
    .like('title', '%Depositions%')
    .eq('thematic_group', 'Jeffrey Epstein Investigation');

  const sessionId = sessions![0].id;
  console.log('Deduplicating depositions session:', sessionId.slice(0, 8));

  // Get all actor findings in this session
  const { data: actors } = await sb.from('research_findings')
    .select('id, finding_type, content, summary, confidence_score, extracted_data')
    .eq('session_id', sessionId)
    .eq('finding_type', 'actor')
    .order('confidence_score', { ascending: false });

  console.log(`Found ${actors!.length} actor findings`);

  // Group by normalized name
  const groups: Record<string, typeof actors> = {};
  actors!.forEach(f => {
    const name = (f.extracted_data?.name || f.summary || '').toLowerCase().replace(/[^a-z .]/g, '').trim();
    if (!name) return;
    // Also normalize common variations
    const norm = name
      .replace(/^dr /, '')
      .replace(/ jr$/, '')
      .replace(/^allen /, 'alan ')
      .replace(/^bradley james /, 'brad ')
      .replace(/^bradley j /, 'brad ')
      .replace(/^spencer t /, 'spencer ')
      .replace(/^adam d /, 'adam ')
      .replace(/^jack alan /, 'jack a ')
      .replace(/^jack a /, 'jack ')
      .replace(/^isidro m /, 'isidro ')
      .replace(/^isidro manuel /, 'isidro ');

    if (!groups[norm]) groups[norm] = [];
    groups[norm]!.push(f);
  });

  let totalLinked = 0;
  let totalDupGroups = 0;

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

    // Link primary to its duplicates
    const { error } = await sb.from('research_findings')
      .update({ related_findings: dupeIds })
      .eq('id', primary.id);

    if (!error) {
      totalLinked += dupeIds.length;
      console.log(`  ${name}: ${entries.length} entries -> primary ${primary.id.slice(0, 8)}`);
    }
  }

  console.log(`\nLinked ${totalLinked} duplicate actors in ${totalDupGroups} groups`);
}

main().catch(console.error);
