/**
 * Deep Research Full Test Runner
 *
 * Runs all test scenarios against the deployed Apify actor with deep granularity.
 * Collects Cloudflare R2 URLs for generated reports.
 *
 * Usage:
 *   cd researcher && node scripts/run-deep-tests.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ACTOR_ID = 'xkazm04/deep-research';

// Test scenarios covering all templates - updated for 2026
const TEST_SCENARIOS = [
  // Tech Market (3 tests)
  {
    id: 1,
    template: 'tech_market',
    query: 'AI coding assistants market adoption and trends 2026 predictions',
    purpose: 'Single technology trend analysis',
  },
  {
    id: 2,
    template: 'tech_market',
    query: 'Kubernetes vs Docker Swarm vs Nomad container orchestration 2026',
    purpose: 'Multi-technology comparison',
  },
  {
    id: 3,
    template: 'tech_market',
    query: 'Rust programming language enterprise adoption 2026 predictions',
    purpose: 'Language adoption forecast',
  },

  // Financial (3 tests)
  {
    id: 4,
    template: 'financial',
    query: 'NVIDIA 2026 earnings outlook and AI chip market valuation',
    purpose: 'Single stock analysis',
  },
  {
    id: 5,
    template: 'financial',
    query: 'Tesla vs Rivian vs Lucid EV market financial comparison 2026',
    purpose: 'Sector comparison',
  },
  {
    id: 6,
    template: 'financial',
    query: 'Anthropic Series E valuation and competitive financial position 2026',
    purpose: 'Private company analysis',
  },

  // Competitive (3 tests)
  {
    id: 7,
    template: 'competitive',
    query: 'Stripe vs Square vs Adyen payment processing market share 2026',
    purpose: 'Fintech comparison',
  },
  {
    id: 8,
    template: 'competitive',
    query: 'AWS vs Azure vs GCP cloud infrastructure competitive analysis 2026',
    purpose: 'Cloud providers',
  },
  {
    id: 9,
    template: 'competitive',
    query: 'Figma vs Sketch vs Adobe XD design tool market positioning 2026',
    purpose: 'Design tools',
  },

  // Investigative (2 tests)
  {
    id: 10,
    template: 'investigative',
    query: 'OpenAI leadership governance changes and controversies 2024-2026',
    purpose: 'Corporate governance',
  },
  {
    id: 11,
    template: 'investigative',
    query: 'Binance regulatory issues and legal challenges investigation 2024-2026',
    purpose: 'Crypto exchange',
  },

  // Legal (3 tests)
  {
    id: 12,
    template: 'legal',
    query: 'AI copyright and training data lawsuits 2025-2026',
    purpose: 'IP/Copyright',
  },
  {
    id: 13,
    template: 'legal',
    query: 'GDPR enforcement actions against tech companies 2025-2026',
    purpose: 'Privacy regulation',
  },
  {
    id: 14,
    template: 'legal',
    query: 'SEC cryptocurrency and DeFi enforcement actions 2025-2026',
    purpose: 'Securities regulation',
  },

  // Contract (2 tests)
  {
    id: 15,
    template: 'contract',
    query: 'US Department of Defense cloud computing contracts JEDI JWCC analysis 2026',
    purpose: 'Federal IT contract',
  },
  {
    id: 16,
    template: 'contract',
    query: 'State of California IT modernization contracts 2025-2026 analysis',
    purpose: 'State government IT',
  },

  // Due Diligence (3 tests)
  {
    id: 17,
    template: 'due_diligence',
    query: 'WeWork company vetting and red flags analysis retrospective',
    purpose: 'Failed company case study',
  },
  {
    id: 18,
    template: 'due_diligence',
    query: 'Palantir Technologies vendor vetting for enterprise partnership 2026',
    purpose: 'Enterprise vendor check',
  },
  {
    id: 19,
    template: 'due_diligence',
    query: 'Superhuman email client company vetting before enterprise purchase 2026',
    purpose: 'SaaS vendor evaluation',
  },

  // Purchase Decision (3 tests)
  {
    id: 20,
    template: 'purchase_decision',
    query: 'MacBook Pro M4 Max vs Dell XPS 15 vs ThinkPad X1 Carbon for software development 2026',
    purpose: 'Laptop comparison',
  },
  {
    id: 21,
    template: 'purchase_decision',
    query: 'Slack vs Microsoft Teams vs Discord for startup team communication 2026',
    purpose: 'Team software',
  },
  {
    id: 22,
    template: 'purchase_decision',
    query: 'Tesla Model 3 vs BMW i4 vs Polestar 2 electric vehicle purchase 2026',
    purpose: 'EV purchase',
  },

  // Reputation (3 tests)
  {
    id: 23,
    template: 'reputation',
    query: 'Is Temu legitimate and safe to buy from scam check 2026',
    purpose: 'E-commerce legitimacy',
  },
  {
    id: 24,
    template: 'reputation',
    query: 'Upwork freelancer platform legitimacy and trustworthiness review 2026',
    purpose: 'Platform reputation',
  },
  {
    id: 25,
    template: 'reputation',
    query: 'Celsius Network cryptocurrency platform legitimacy check retrospective',
    purpose: 'Crypto platform (known fraud)',
  },

  // Understanding (3 tests)
  {
    id: 26,
    template: 'understanding',
    query: 'OpenAI Sam Altman firing and reinstatement November 2023 causes and analysis',
    purpose: 'Corporate crisis',
  },
  {
    id: 27,
    template: 'understanding',
    query: 'Silicon Valley Bank collapse March 2023 causes and implications',
    purpose: 'Financial crisis',
  },
  {
    id: 28,
    template: 'understanding',
    query: 'EU AI Act passage 2024 implications and industry response 2026',
    purpose: 'Regulatory event',
  },
];

async function runActorTest(scenario) {
  const input = {
    query: scenario.query,
    template: scenario.template,
    granularity: 'deep',
    generate_report: true,
    report_format: 'html',
  };

  const inputJson = JSON.stringify(input);
  const testId = `test_${String(scenario.id).padStart(2, '0')}_${scenario.template}`;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`[${testId}] ${scenario.purpose}`);
  console.log(`Template: ${scenario.template} | Granularity: deep`);
  console.log(`Query: ${scenario.query.slice(0, 60)}...`);
  console.log('='.repeat(70));

  const startTime = Date.now();

  return new Promise((resolve) => {
    // Use apify call with JSON output
    // Use -t for timeout (in seconds), escape for Windows cmd
    const escapedInput = inputJson.replace(/"/g, '\\"');
    const cmd = `apify call ${ACTOR_ID} --input "${escapedInput}" --json -t 900`;

    try {
      console.log('Starting actor run...');
      console.log(`Command: apify call ${ACTOR_ID} --input [JSON] --json -t 900`);
      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        timeout: 15 * 60 * 1000, // 15 min timeout
        cwd: path.join(__dirname, '..', 'actor'),
        shell: true, // Required for Windows
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      // Parse JSON result
      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch (e) {
        console.error('Failed to parse JSON result');
        resolve({
          id: scenario.id,
          testId,
          template: scenario.template,
          query: scenario.query,
          purpose: scenario.purpose,
          success: false,
          error: 'JSON parse error',
          elapsed,
        });
        return;
      }

      const output = parsed.output || {};
      const reportUrl = output.report_url || output.cloudflare_url || '';

      console.log(`Completed in ${elapsed}s`);
      console.log(`- Status: ${parsed.status}`);
      console.log(`- Findings: ${output.findings?.length || 0}`);
      console.log(`- Sources: ${output.sources?.length || 0}`);
      console.log(`- Perspectives: ${output.perspectives?.length || 0}`);
      console.log(`- Report URL: ${reportUrl || 'N/A'}`);

      resolve({
        id: scenario.id,
        testId,
        template: scenario.template,
        query: scenario.query,
        purpose: scenario.purpose,
        success: parsed.status === 'SUCCEEDED',
        runId: parsed.id,
        status: parsed.status,
        findings_count: output.findings?.length || 0,
        sources_count: output.sources?.length || 0,
        perspectives_count: output.perspectives?.length || 0,
        report_url: reportUrl,
        elapsed,
        cost: parsed.stats?.computeUnits || 0,
      });

    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`Error: ${error.message}`);

      resolve({
        id: scenario.id,
        testId,
        template: scenario.template,
        query: scenario.query,
        purpose: scenario.purpose,
        success: false,
        error: error.message,
        elapsed,
      });
    }
  });
}

async function main() {
  console.log('Deep Research Full Test Runner');
  console.log('==============================');
  console.log(`Total tests: ${TEST_SCENARIOS.length}`);
  console.log(`Actor: ${ACTOR_ID}`);
  console.log(`Granularity: deep`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  const results = [];
  const startTime = Date.now();

  // Run tests sequentially (to avoid overwhelming the actor)
  for (const scenario of TEST_SCENARIOS) {
    const result = await runActorTest(scenario);
    results.push(result);

    // Small delay between tests
    await new Promise(r => setTimeout(r, 2000));
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Generate summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total: ${results.length} | Success: ${successful.length} | Failed: ${failed.length}`);
  console.log(`Total time: ${totalTime} minutes`);

  // Report URLs
  console.log('\n--- CLOUDFLARE REPORT URLS ---');
  results.filter(r => r.report_url).forEach(r => {
    console.log(`[${r.testId}] ${r.report_url}`);
  });

  // Save manifest
  const manifest = {
    generated_at: new Date().toISOString(),
    total_scenarios: results.length,
    successful: successful.length,
    failed: failed.length,
    total_time_minutes: parseFloat(totalTime),
    reports: results.map(r => ({
      id: r.id,
      template: r.template,
      query: r.query,
      purpose: r.purpose,
      url: r.report_url || null,
      job_id: r.runId || null,
      findings_count: r.findings_count || 0,
      perspectives_count: r.perspectives_count || 0,
      sources_count: r.sources_count || 0,
      success: r.success,
      error: r.error || null,
    })),
    errors: failed.map(r => ({
      id: r.id,
      testId: r.testId,
      error: r.error,
    })),
  };

  const outputPath = path.join(__dirname, '..', 'test_reports', 'manifest_deep_tests.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved: ${outputPath}`);

  // Also save a simple URL list
  const urlsPath = path.join(__dirname, '..', 'test_reports', 'report_urls.txt');
  const urlList = results
    .filter(r => r.report_url)
    .map(r => `${r.testId}: ${r.report_url}`)
    .join('\n');
  fs.writeFileSync(urlsPath, urlList);
  console.log(`URL list saved: ${urlsPath}`);

  console.log('\nDone!');
}

main().catch(console.error);
