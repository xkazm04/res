/**
 * Tech Market Test Runner
 *
 * Runs the first two test questions against the tech_market template
 * and exports results to the project root.
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. In another terminal: node scripts/run-tech-market-tests.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/actor/run';

const testQueries = [
  {
    id: 'test-1-ai-coding-assistants',
    name: 'AI Coding Assistants Adoption & Impact',
    query: `What is the current adoption rate of AI coding assistants (GitHub Copilot, Cursor, Claude Code, Codeium, Tabnine) among professional developers in 2025, and what measurable productivity impact are enterprises reporting? Include: adoption percentages, productivity gains (lines of code, time savings, PR velocity), enterprise vs individual adoption rates, top tools by market share, and 2026 predictions.`,
  },
  {
    id: 'test-2-cloud-cost-optimization',
    name: 'Cloud Infrastructure Cost Optimization',
    query: `What are the top cloud cost optimization strategies enterprises are adopting in 2025, and what is the current state of FinOps maturity across organizations? Include: average cloud waste percentage, FinOps adoption rates, top cost optimization techniques (spot instances, rightsizing, reserved capacity, Kubernetes cost management), multi-cloud vs single-cloud cost implications, and 2026 predictions for cloud spending optimization.`,
  },
];

async function runTest(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${test.name}`);
  console.log(`${'='.repeat(60)}\n`);

  const payload = {
    query: test.query,
    template: 'tech_market',
    granularity: 'standard',
    max_searches: 8,
    generate_report: true,
    report_variant: 'full_report',
    persist_to_db: false,
    send_email_on_complete: false,
  };

  try {
    console.log('Sending request to API...');
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log(`Completed in ${elapsed}s`);
    console.log(`- Findings: ${result.findings?.length || 0}`);
    console.log(`- Sources: ${result.sources?.length || 0}`);
    console.log(`- Perspectives: ${result.perspectives?.length || 0}`);
    console.log(`- Cost: $${result.cost_summary?.total_cost_usd?.toFixed(4) || 'N/A'}`);

    return {
      success: true,
      testId: test.id,
      testName: test.name,
      query: test.query,
      result,
      executionTimeSeconds: parseFloat(elapsed),
    };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return {
      success: false,
      testId: test.id,
      testName: test.name,
      query: test.query,
      error: error.message,
    };
  }
}

function generateMarkdownReport(testResult) {
  const { testName, query, result } = testResult;

  let md = `# Tech Market Test: ${testName}\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `## Query\n\n${query}\n\n`;

  if (!result) {
    md += `## Error\n\nTest failed to execute.\n`;
    return md;
  }

  // Summary stats
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Findings | ${result.findings?.length || 0} |\n`;
  md += `| Sources | ${result.sources?.length || 0} |\n`;
  md += `| Perspectives | ${result.perspectives?.length || 0} |\n`;
  md += `| Search Queries | ${result.search_queries_executed?.length || 0} |\n`;
  md += `| Execution Time | ${result.execution_time_seconds?.toFixed(1) || 'N/A'}s |\n`;
  md += `| Total Cost | $${result.cost_summary?.total_cost_usd?.toFixed(4) || 'N/A'} |\n`;
  md += `\n`;

  // Search queries executed
  if (result.search_queries_executed?.length > 0) {
    md += `## Search Queries Executed\n\n`;
    result.search_queries_executed.forEach((q, i) => {
      md += `${i + 1}. ${q}\n`;
    });
    md += `\n`;
  }

  // Findings by type
  if (result.findings?.length > 0) {
    md += `## Findings\n\n`;

    // Group by finding type
    const byType = {};
    result.findings.forEach(f => {
      const type = f.finding_type || 'unknown';
      if (!byType[type]) byType[type] = [];
      byType[type].push(f);
    });

    Object.entries(byType).forEach(([type, findings]) => {
      md += `### ${type.replace(/_/g, ' ').toUpperCase()} (${findings.length})\n\n`;
      findings.forEach((f, i) => {
        md += `**${i + 1}. ${f.summary || 'No summary'}**\n`;
        md += `- Confidence: ${(f.confidence_score * 100).toFixed(0)}%\n`;
        md += `- Temporal: ${f.temporal_context || 'N/A'}\n`;
        md += `- Content: ${f.content?.slice(0, 500)}${f.content?.length > 500 ? '...' : ''}\n`;
        if (f.extracted_data) {
          md += `- Data: \`${JSON.stringify(f.extracted_data).slice(0, 200)}\`\n`;
        }
        md += `\n`;
      });
    });
  }

  // Key predictions (filter for 2026)
  const predictions = result.findings?.filter(f =>
    f.temporal_context === 'predicted' ||
    f.finding_type === 'prediction' ||
    f.content?.includes('2026')
  ) || [];

  if (predictions.length > 0) {
    md += `## 2026 Predictions Extracted\n\n`;
    predictions.forEach((p, i) => {
      md += `${i + 1}. **${p.summary || 'Prediction'}** (Confidence: ${(p.confidence_score * 100).toFixed(0)}%)\n`;
      md += `   ${p.content?.slice(0, 300)}...\n\n`;
    });
  }

  // Sources
  if (result.sources?.length > 0) {
    md += `## Sources (Top 10)\n\n`;
    result.sources.slice(0, 10).forEach((s, i) => {
      md += `${i + 1}. [${s.title || 'Untitled'}](${s.url})\n`;
      md += `   - Domain: ${s.domain || 'N/A'}\n`;
      md += `   - Credibility: ${s.credibility_label || 'N/A'} (${(s.credibility_score * 100).toFixed(0)}%)\n`;
      md += `\n`;
    });
  }

  // Perspectives
  if (result.perspectives?.length > 0) {
    md += `## Expert Perspectives\n\n`;
    result.perspectives.forEach(p => {
      md += `### ${p.perspective_type?.replace(/_/g, ' ').toUpperCase()}\n\n`;
      md += `${p.analysis_text?.slice(0, 500)}...\n\n`;

      if (p.key_insights?.length > 0) {
        md += `**Key Insights:**\n`;
        p.key_insights.slice(0, 3).forEach(insight => {
          md += `- ${insight}\n`;
        });
        md += `\n`;
      }

      if (p.recommendations?.length > 0) {
        md += `**Recommendations:**\n`;
        p.recommendations.slice(0, 3).forEach(rec => {
          md += `- ${rec}\n`;
        });
        md += `\n`;
      }
    });
  }

  // Full report if available
  if (result.report_markdown) {
    md += `## Generated Report\n\n`;
    md += result.report_markdown;
  }

  return md;
}

async function main() {
  console.log('Tech Market Test Runner');
  console.log('=======================\n');
  console.log('Make sure the dev server is running: npm run dev\n');

  // Check if server is running
  const baseUrl = API_URL.replace('/api/actor/run', '');
  try {
    const healthCheck = await fetch(baseUrl);
    console.log(`Server is responding at ${baseUrl}\n`);
  } catch (e) {
    console.error(`ERROR: Dev server is not running at ${baseUrl}!`);
    console.error('Please start it with: npm run dev -p 3001');
    process.exit(1);
  }

  const results = [];

  for (const test of testQueries) {
    const result = await runTest(test);
    results.push(result);

    // Export individual result
    const outputPath = path.join(__dirname, '..', `${test.id}-results.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Saved: ${test.id}-results.json`);

    // Export markdown report
    if (result.success) {
      const mdPath = path.join(__dirname, '..', `${test.id}-report.md`);
      const mdContent = generateMarkdownReport(result);
      fs.writeFileSync(mdPath, mdContent);
      console.log(`Saved: ${test.id}-report.md`);
    }
  }

  // Export combined summary
  const summaryPath = path.join(__dirname, '..', 'tech-market-test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    runDate: new Date().toISOString(),
    testsRun: results.length,
    testsSucceeded: results.filter(r => r.success).length,
    testsFailed: results.filter(r => !r.success).length,
    results: results.map(r => ({
      id: r.testId,
      name: r.testName,
      success: r.success,
      findingsCount: r.result?.findings?.length || 0,
      sourcesCount: r.result?.sources?.length || 0,
      executionTime: r.executionTimeSeconds || r.result?.execution_time_seconds,
      error: r.error,
    })),
  }, null, 2));
  console.log(`\nSaved: tech-market-test-summary.json`);

  console.log('\n' + '='.repeat(60));
  console.log('Test run complete!');
  console.log(`Results: ${results.filter(r => r.success).length}/${results.length} succeeded`);
  console.log('='.repeat(60));
}

main().catch(console.error);
