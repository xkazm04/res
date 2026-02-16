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
  const { data: sessions } = await sb.from('research_sessions')
    .select('id, title')
    .eq('thematic_group', 'Jeffrey Epstein Investigation')
    .eq('workspace_id', 'epstein-investigation')
    .eq('status', 'completed');

  const sessionIds = sessions!.map(s => s.id);
  const sessionMap: Record<string, string> = {};
  sessions!.forEach(s => { sessionMap[s.id] = s.title.replace('Epstein Archive: ', ''); });

  const { data: findings } = await sb.from('research_findings')
    .select('id, session_id, finding_type, summary, extracted_data')
    .in('session_id', sessionIds)
    .eq('finding_type', 'actor');

  // Build actor → sessions map
  const actorSessions: Record<string, { name: string; sessions: Set<string> }> = {};
  findings!.forEach(f => {
    const name = (f.extracted_data?.name || f.summary || '').trim();
    if (!name) return;
    const norm = name.toLowerCase().replace(/[^a-z ]/g, '');
    if (!actorSessions[norm]) actorSessions[norm] = { name, sessions: new Set() };
    actorSessions[norm].sessions.add(sessionMap[f.session_id] || f.session_id.slice(0, 8));
  });

  // Find actors that appear in multiple sessions
  console.log('=== ACTORS APPEARING ACROSS 3+ SESSIONS ===');
  Object.values(actorSessions)
    .filter(a => a.sessions.size >= 3)
    .sort((a, b) => b.sessions.size - a.sessions.size)
    .forEach(a => {
      console.log(`${a.name} (${a.sessions.size} sessions):`);
      [...a.sessions].forEach(s => console.log(`  - ${s}`));
    });

  // Notable Black Book contacts not in other sessions
  const bbSess = sessions!.find(s => s.title.includes('Black Book'));
  if (bbSess) {
    const bbFindings = findings!.filter(f => f.session_id === bbSess.id);
    const nonBbFindings = findings!.filter(f => f.session_id !== bbSess.id);
    const otherActors = new Set(
      nonBbFindings.map(f => (f.extracted_data?.name || f.summary || '').toLowerCase().replace(/[^a-z ]/g, ''))
    );

    console.log('\n=== BLACK BOOK CONTACTS NOT FOUND IN OTHER SESSIONS ===');
    bbFindings.forEach(f => {
      const name = (f.extracted_data?.name || f.summary || '').trim();
      const norm = name.toLowerCase().replace(/[^a-z ]/g, '');
      if (!otherActors.has(norm)) {
        const role = f.extracted_data?.role || '';
        console.log(`  * ${name} - ${role}`);
      }
    });
  }

  // Check deposition actor duplication
  const depSess = sessions!.find(s => s.title.includes('Depositions'));
  if (depSess) {
    const depActors: Record<string, number> = {};
    findings!.filter(f => f.session_id === depSess.id).forEach(f => {
      const name = (f.extracted_data?.name || f.summary || '').toLowerCase().replace(/[^a-z ]/g, '');
      depActors[name] = (depActors[name] || 0) + 1;
    });

    console.log('\n=== MOST DUPLICATED ACTORS IN DEPOSITIONS ===');
    Object.entries(depActors)
      .filter(([_, c]) => c >= 3)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => console.log(`  ${name}: ${count} entries`));
  }
}

main().catch(console.error);
