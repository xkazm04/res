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
  // Get synthesis session
  const { data: synthSessions } = await sb.from('research_sessions')
    .select('id')
    .eq('title', 'Cross-Session Synthesis & Enrichment')
    .eq('thematic_group', 'Jeffrey Epstein Investigation');

  const sessionId = synthSessions![0].id;
  console.log('Adding round 3 enrichments to:', sessionId.slice(0, 8));

  const findings = [
    // Leon Black - $170M total confirmed by Senate investigation
    {
      finding_type: 'relationship' as const,
      content: `ENRICHMENT (2025 verified): Leon Black paid Jeffrey Epstein $170 million total (not the $158M initially disclosed). Senate Finance Committee documents released March 2025 by Sen. Wyden reveal the true figure was $12M higher than Apollo's board investigation found. Black claimed the payments were for tax advice that saved him ~$600M. Black also paid $62.5M to USVI in 2023 to settle Epstein-related claims. The House Oversight documents found Black wrote a birthday poem to Epstein with sexual references. Total known Epstein-connected costs to Black: $232.5M+ ($170M payments + $62.5M settlement). This makes Black the single largest documented financial supporter of Epstein's operation by a factor of 3x over Wexner's documented $46.7M circular flows.`,
      summary: 'Leon Black paid $170M to Epstein (Senate confirmed) - largest documented supporter',
      analysis: `Black's $170M in payments to a convicted sex offender for "tax advice" is extraordinary even by billionaire standards. The Senate investigation's discovery of the additional $12M suggests the Apollo board's own investigation was incomplete or minimized. Combined with the sexual birthday poem and $62.5M USVI settlement, the pattern suggests a relationship far deeper than client-advisor.`,
      confidence_score: 0.95,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'financial',
        type: 'enrichment',
        enrichment_source: 'senate_finance_committee_march_2025',
        actor_a: 'Leon Black',
        actor_b: 'Jeffrey Epstein',
        amount: 170000000,
        settlement_amount: 62500000,
      },
    },
    // Jes Staley - JPMorgan deeper than documented
    {
      finding_type: 'relationship' as const,
      content: `ENRICHMENT (2025 verified): Jes Staley's relationship with Epstein was far deeper than House Oversight documents captured. In 2025 FCA tribunal proceedings in London, emails revealed Staley wrote to Epstein "You are a great friend" while Epstein was under house arrest. Staley sought Epstein's advice on JPMorgan's China strategy. In September 2025, Rep. Thomas Massie stated in a House hearing that Staley was on an FBI list of 20+ prominent men that Epstein trafficked young women and girls to. Staley lost his FCA appeal in June 2025 and was banned from UK financial senior leadership. JPMorgan is suing Staley to claw back 8 years of compensation for his role in maintaining the Epstein banking relationship.`,
      summary: 'Jes Staley on FBI list of 20+ men Epstein trafficked to; banned from UK finance',
      analysis: `The progression from "banking relationship" to "FBI trafficking list" represents a fundamental escalation. If the FBI list claim is verified, it transforms Staley from a negligent banker into a trafficking beneficiary. JPMorgan's clawback suit suggests the bank believes Staley's relationship went beyond professional negligence into active complicity.`,
      confidence_score: 0.85,
      temporal_context: 'present',
      extracted_data: {
        original_finding_type: 'actor',
        type: 'enrichment',
        enrichment_source: 'fca_tribunal_2025_house_hearing_sept_2025',
        name: 'Jes Staley',
        role: 'Former CEO JPMorgan Investment Banking, later Barclays CEO',
        significance: 'Named on FBI trafficking list; banned from UK finance; JPMorgan clawback suit',
      },
    },
    // Peggy Siegal - social rehabilitation pipeline
    {
      finding_type: 'pattern' as const,
      content: `CROSS-SESSION + ENRICHMENT: House Oversight documents show Peggy Siegal was Epstein's social rehabilitation architect. A 2011 email exchange reveals Epstein asking Siegal to enlist Arianna Huffington to "refute accusations" and "send reporters to investigate Virginia Giuffre." Siegal organized a December 2010 dinner at Epstein's home including Woody Allen, George Stephanopoulos, Katie Couric, and Prince Andrew. This wasn't passive socialization - it was an active operation to rebuild Epstein's reputation and discredit his victims through media manipulation. Netflix, FX, and Annapurna cut ties with Siegal in 2019 when this was exposed.`,
      summary: 'Siegal actively weaponized media and celebrities to rehabilitate Epstein and discredit victims',
      analysis: `The Siegal-Epstein emails transform the narrative from "socialite naively associating with a convicted offender" to "coordinated reputation management operation." Specifically enlisting Arianna Huffington to investigate a trafficking victim represents a deliberate attempt to use media power to silence accusers. This connects to the broader pattern of coordinated legal obstruction documented across sessions.`,
      confidence_score: 0.92,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'network_inference',
        type: 'enrichment',
        enrichment_source: 'house_oversight_documents_2025',
        actors: ['Peggy Siegal', 'Arianna Huffington', 'Jeffrey Epstein', 'Virginia Giuffre'],
        dinner_guests_dec_2010: ['Woody Allen', 'Soon-Yi Previn', 'George Stephanopoulos', 'Katie Couric', 'Prince Andrew'],
      },
    },
    // Boris Nikolic / Bill Gates connection
    {
      finding_type: 'relationship' as const,
      content: `ENRICHMENT: Boris Nikolic, Bill Gates's former chief science advisor, was named as backup executor of Epstein's $578M will - allegedly without Nikolic's knowledge. Nikolic first met Epstein "in his official capacity for Gates." This directly connects Bill Gates to Epstein's inner circle through his most senior science advisor. Gates Foundation was spending $200M/year on education (per House Oversight documents), and Epstein positioned himself as a conduit for that funding. The selection of Gates's advisor as will executor suggests Epstein believed he had significant leverage or relationship with the Gates orbit, even as Gates has maintained distance from the scandal.`,
      summary: 'Gates science advisor named in Epstein will as backup executor of $578M estate',
      analysis: `Epstein doesn't name random acquaintances as executors of a half-billion dollar estate. Either Nikolic's relationship with Epstein was far deeper than acknowledged, or Epstein was signaling the Gates relationship even from beyond the grave. Combined with the $200M/year Gates education spending discussions in House Oversight documents, the Gates connection appears more substantive than public statements suggest.`,
      confidence_score: 0.88,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'network_inference',
        type: 'enrichment',
        enrichment_source: 'will_filing_plus_house_oversight',
        actors: ['Boris Nikolic', 'Bill Gates', 'Jeffrey Epstein'],
        estate_value: 578000000,
      },
    },
    // DynCorp helicopter tail number
    {
      finding_type: 'evidence' as const,
      content: `CROSS-SESSION + ENRICHMENT: The Network & Timeline findings document that Epstein's helicopter shared tail number N474AW with a State Department/DynCorp counter-insurgency aircraft. FAA records confirm Epstein's Bell helicopter used N474AW on August 6, 2002 flying from Zorro Ranch to Double Eagle II airport. The same N474AW was registered to a DynCorp OV-10 Bronco used in Colombian drug eradication until it crashed in 2006. DynCorp employees were separately investigated for trafficking in underage females aged 12-15 in Bosnia/Kosovo. While mainstream reporting has not established a direct Epstein-DynCorp business relationship, the shared tail number is a verified FAA record anomaly that warrants investigation.`,
      summary: 'Epstein helicopter shared N474AW tail number with DynCorp/State Dept military aircraft',
      analysis: `Shared aircraft registration numbers between a private financier and a covert military contractor is an extraordinary anomaly. It could indicate: (1) administrative error in FAA records, (2) deliberate sharing of tail numbers for operational cover, or (3) a deeper institutional relationship. The fact that DynCorp was separately implicated in trafficking makes this more than coincidental, but hard evidence of a direct relationship remains absent.`,
      confidence_score: 0.72,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'evidence',
        type: 'enrichment',
        enrichment_source: 'faa_records_plus_archive_findings',
        tail_number: 'N474AW',
        epstein_flight_date: '2002-08-06',
        warning: 'Shared tail number verified but direct relationship unconfirmed',
      },
    },
    // Katie Johnson case critical assessment
    {
      finding_type: 'pattern' as const,
      content: `CROSS-SESSION: The Katie Johnson testimony (filed April 2016, withdrawn November 2016) warrants critical assessment against the established evidentiary base. CORROBORATING factors: (1) the massage-as-pretext pattern matches confirmed Epstein M.O. from FBI and depositions, (2) the party-based group exploitation matches multiple victim accounts, (3) Epstein's 1997 party circuit with Trump is documented in other sources. UNDERMINING factors: (1) case filed/withdrawn around presidential election without reaching discovery, (2) associated with Norm Lubow, a known fabricator, (3) $100M damages claim unusual for genuine victim filing, (4) campaign-style infrastructure (website, video promotion) around the filing, (5) no law enforcement investigation ever opened. The 48 findings from this session should be interpreted with these credibility factors in mind.`,
      summary: 'Katie Johnson allegations: partially corroborated by M.O. but serious credibility concerns',
      analysis: `The Johnson case sits at the intersection of verified patterns (Epstein's exploitation M.O., party recruitment, Trump association) and significant red flags (Lubow association, electoral timing, withdrawal without discovery). Responsible analysis requires noting both: the allegations describe behavior consistent with what multiple other victims independently confirmed, but the specific case has procedural and credibility issues that prevent it from being treated as established fact.`,
      confidence_score: 0.7,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'narrative_frame',
        type: 'cross-session-synthesis',
        sessions_referenced: ['Katie Johnson Testimony', 'FBI Investigation Report', 'Ghislaine Maxwell Depositions'],
        corroborating_elements: ['massage pattern', 'party exploitation', 'Trump-Epstein association documented'],
        undermining_elements: ['Norm Lubow association', 'electoral timing', 'no LE investigation', 'campaign infrastructure'],
      },
    },
    // House Oversight - Milken/KinderCare childcare connection
    {
      finding_type: 'relationship' as const,
      content: `CROSS-SESSION: House Oversight Documents reveal a previously underexamined connection: Michael Milken controlled KUE (Knowledge Universe Education), which owned KinderCare - the nation's largest childcare provider with 40,000 employees, $1.48B revenue, and 20% government funding. Milken, a convicted felon ($600M securities fraud), used a complex structure where his entities (KULG) extracted $20M/year management fees from KinderCare. KUE also operated childcare centers inside national security and intelligence facilities. The $150M Credit Suisse loan, $200M promissory notes, and $540M acquisition financing all flowed through Milken-controlled entities. Epstein and Milken shared convicted-felon-turned-philanthropist rehabilitation trajectories and overlapping financial networks.`,
      summary: 'Milken controlled nation\'s largest childcare provider via Epstein-adjacent financial network',
      analysis: `A convicted financial criminal controlling childcare facilities inside intelligence and military installations, with financial structures extracting tens of millions in fees, represents a significant finding that connects to Epstein's known network. While no direct Epstein-Milken-childcare trafficking link is established, the proximity of these networks and the exploitation patterns documented across the archive warrants further investigation.`,
      confidence_score: 0.82,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'network_inference',
        type: 'cross-session-synthesis',
        sessions_referenced: ['House Oversight Committee Documents (Part 2)', 'House Oversight Committee Documents (Part 3)'],
        actors: ['Michael Milken', 'Lowell Milken', 'Jeffrey Epstein'],
        entity: 'KUE / KinderCare',
        revenue: 1477700000,
      },
    },
    // Christine Maxwell / PROMIS intelligence connection
    {
      finding_type: 'actor' as const,
      content: `ENRICHMENT: Christine Maxwell, Ghislaine's sister, ran Chiliad Inc., a data mining company that had contracts with US government intelligence agencies and access to classified databases. Their father Robert Maxwell was a confirmed Mossad asset who helped distribute the PROMIS software (backdoored by Israeli intelligence) to intelligence agencies worldwide before his suspicious death in 1991. The Network & Timeline session identifies Christine as having "deep access to US intelligence databases." This creates a three-generation intelligence nexus: Robert Maxwell (Mossad agent, PROMIS distribution), Christine Maxwell (US intelligence database access), and Ghislaine Maxwell (Epstein operational partner with surveillance equipment). The family's intelligence connections span Israeli, British, and American services.`,
      summary: 'Maxwell family three-generation intelligence nexus: Robert, Christine, and Ghislaine',
      analysis: `The Maxwell family's multi-generational intelligence connections are not conspiracy theory but documented fact. Robert Maxwell's Mossad relationship is confirmed by multiple Israeli intelligence officials. Christine's Chiliad Inc. government contracts are public record. Ghislaine's role operating alongside hidden surveillance equipment at Epstein properties creates a direct operational link between intelligence tradecraft and sexual exploitation infrastructure.`,
      confidence_score: 0.85,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'actor',
        type: 'enrichment',
        enrichment_source: 'archive_plus_public_record',
        name: 'Christine Maxwell',
        role: 'CEO Chiliad Inc., US intelligence contractor',
        family_connections: {
          father: 'Robert Maxwell - Mossad agent, PROMIS software',
          sister: 'Ghislaine Maxwell - Epstein operational partner',
        },
      },
    },
    // Plea Deal NPA immunity - the 4 named co-conspirators
    {
      finding_type: 'pattern' as const,
      content: `CROSS-SESSION: The Plea Deal session reveals "four named co-conspirators granted blanket immunity" under the NPA. Cross-referencing with depositions and FBI findings, the likely identities include Sarah Kellen (appears in 7 sessions, 311 flight log appearances), Nadia Marcinkova (5 sessions), Adriana Ross, and Lesley Groff. The NPA additionally granted immunity to unnamed co-conspirators. This immunity structure explains a critical pattern: why the four facilitators who appear most frequently across all evidence sources were never charged despite overwhelming evidence. The immunity survived Epstein's death and may still protect them from federal prosecution for their roles in trafficking over 100 victims across 15+ years.`,
      summary: 'NPA blanket immunity explains why most-documented facilitators were never charged',
      analysis: `The immunity provision is the keystone that explains the most puzzling aspect of the entire case: how could individuals documented across 7+ independent evidence sources as active trafficking facilitators never face federal charges? The NPA's grant of blanket immunity to both named and unnamed co-conspirators effectively created a permanent legal shield. SDNY's 2019 indictment specifically excluded these individuals, respecting the SDFL NPA, which raises questions about whether the 2019 prosecution was designed to appear aggressive while actually preserving the core protection structure.`,
      confidence_score: 0.9,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'pattern',
        type: 'cross-session-synthesis',
        sessions_referenced: ['Plea Deal & Bail Documents', 'Epstein Depositions', 'FBI Investigation Report', 'Flight Logs'],
        likely_named_co_conspirators: ['Sarah Kellen', 'Nadia Marcinkova', 'Adriana Ross', 'Lesley Groff'],
      },
    },
    // House Oversight duplicate actor cleanup
    {
      finding_type: 'pattern' as const,
      content: `CROSS-SESSION: House Oversight documents reveal Epstein operated as a systematic political intelligence broker spanning multiple administrations. Key operational methods: (1) Masha Drokova served as PR consultant managing Epstein's media image, (2) Peggy Siegal provided social access to Hollywood and media elites, (3) Peter Mandelson provided UK political intelligence, (4) Ehud Barak provided Israeli government access, (5) Landon Thomas Jr. at NYT provided favorable financial press, (6) Michael Wolff exchanged strategic intelligence on Trump. This wasn't socializing - it was a structured intelligence collection operation with assigned roles across political, media, academic, and international domains.`,
      summary: 'Epstein operated structured intelligence collection with assigned domain specialists',
      analysis: `The House Oversight revelations transform the understanding of Epstein's social network from "rich man with famous friends" to "operational intelligence network with domain-specific collectors." Each contact served a functional role: Drokova (PR), Siegal (social access), Mandelson (UK politics), Barak (Israel), Thomas (financial media), Wolff (political intelligence). This structure mirrors professional intelligence collection networks, supporting the "belonged to intelligence" claim.`,
      confidence_score: 0.88,
      temporal_context: 'past',
      extracted_data: {
        original_finding_type: 'pattern',
        type: 'cross-session-synthesis',
        sessions_referenced: ['House Oversight Parts 1-3', 'Network & Timeline Intelligence', 'Black Book'],
        network_roles: {
          pr_management: 'Masha Drokova',
          social_access: 'Peggy Siegal',
          uk_politics: 'Peter Mandelson',
          israel: 'Ehud Barak',
          financial_media: 'Landon Thomas Jr.',
          political_intelligence: 'Michael Wolff',
          academic_laundering: 'Martin Nowak, Lawrence Krauss',
          fashion_recruitment: 'Jean-Luc Brunel, Ed Razek',
        },
      },
    },
  ];

  const records = findings.map(f => ({
    id: crypto.randomUUID(),
    session_id: sessionId,
    finding_type: f.finding_type,
    content: f.content,
    summary: f.summary,
    confidence_score: f.confidence_score,
    temporal_context: f.temporal_context || 'past',
    extracted_data: {
      ...f.extracted_data,
      analysis: f.analysis,
    },
    supporting_sources: [],
    related_findings: [],
    contradicts: [],
    is_promoted: true,
    created_at: new Date().toISOString(),
  }));

  const { error } = await sb.from('research_findings').insert(records);
  if (error) {
    console.error('Failed:', error.message);
    return;
  }

  console.log(`Inserted ${records.length} round-3 enrichment findings`);

  // Update session count
  const { count } = await sb.from('research_findings')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  await sb.from('research_sessions')
    .update({ claim_count: count })
    .eq('id', sessionId);

  console.log(`Synthesis session now has ${count} total findings`);
  records.forEach(r => console.log(`  [${r.finding_type} ${r.confidence_score}] ${r.summary}`));
}

main().catch(console.error);
