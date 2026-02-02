#!/usr/bin/env npx tsx

/**
 * Validation CLI Script
 *
 * Run Claude Code research against Gemini baseline and record validation decisions.
 *
 * Usage:
 *   npm run validate:research -- <template_id> "<query>"
 *   npm run validate:research -- --progress
 *   npm run validate:research -- --list
 */

import * as readline from 'readline';
import { ComparisonService } from '../src/templates/validation/ComparisonService';
import { ValidationTracker } from '../src/templates/validation/ValidationTracker';
import { ResearchOrchestrator } from '../src/templates/builder/ResearchOrchestrator';
import { getAvailableTemplates } from '../src/templates/configs';
import type { Granularity } from '../src/templates/types/granularity';

// ============================================
// READLINE HELPER
// ============================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2);

  // Handle --progress flag
  if (args.includes('--progress')) {
    const tracker = new ValidationTracker();
    console.log(tracker.formatProgressReport());
    rl.close();
    return;
  }

  // Handle --list flag
  if (args.includes('--list')) {
    const tracker = new ValidationTracker();
    const records = tracker.getRecords();
    console.log('\nValidation Records:');
    console.log('-'.repeat(80));
    if (records.length === 0) {
      console.log('  (none yet)');
    } else {
      for (const r of records) {
        const statusLabel =
          r.status === 'approved' ? '[APPROVED]' : r.status === 'rejected' ? '[REJECTED]' : '[PENDING] ';
        const queryPreview = r.query.length > 40 ? r.query.slice(0, 40) + '...' : r.query;
        console.log(`${statusLabel} ${r.templateId} - "${queryPreview}"`);
        console.log(`           Gemini: ${r.geminiSessionId} | Claude: ${r.claudeSessionId || 'N/A'}`);
        if (r.notes) console.log(`           Notes: ${r.notes}`);
      }
    }
    rl.close();
    return;
  }

  // Validate arguments
  if (args.length < 2) {
    console.error('Usage: npm run validate:research -- <template_id> "<query>" [--gemini-id=<id>]');
    console.error('       npm run validate:research -- --progress');
    console.error('       npm run validate:research -- --list');
    console.error('');
    console.error('Templates:', getAvailableTemplates().join(', '));
    rl.close();
    process.exit(1);
  }

  const templateId = args[0];
  const query = args[1];
  const geminiIdArg = args.find((a) => a.startsWith('--gemini-id='));
  const geminiId = geminiIdArg ? geminiIdArg.split('=')[1] : undefined;
  const granularity: Granularity = 'standard';

  console.log('');
  console.log('='.repeat(70));
  console.log('RESEARCH VALIDATION');
  console.log('='.repeat(70));
  console.log(`Template: ${templateId}`);
  console.log(`Query:    ${query}`);
  console.log('');

  const comparisonService = new ComparisonService();
  const tracker = new ValidationTracker();

  // Step 1: Find or specify Gemini session
  console.log('[1/4] Finding Gemini session...');
  let geminiSession;
  try {
    geminiSession = await comparisonService.findGeminiSession(query, templateId);

    if (!geminiSession) {
      console.error('ERROR: No matching Gemini session found.');
      console.error('Ensure there is a completed Gemini research session for this query.');
      rl.close();
      process.exit(1);
    }
    console.log(`   Found: ${geminiSession.id}`);
    console.log(`   Created: ${geminiSession.created_at}`);
  } catch (err) {
    console.error('ERROR finding Gemini session:', err);
    rl.close();
    process.exit(1);
  }

  // Step 2: Run Claude research
  console.log('');
  console.log('[2/4] Running Claude Code research...');
  const orchestrator = new ResearchOrchestrator();
  const claudeResult = await orchestrator.execute({
    templateId,
    query,
    granularity,
    saveToDb: false, // Don't persist yet - only after approval
    verbose: false,
  });

  if (!claudeResult.success || !claudeResult.output) {
    console.error('ERROR: Claude research failed:', claudeResult.error);
    rl.close();
    process.exit(1);
  }
  console.log(`   Complete: ${claudeResult.output.findings?.length || 0} findings`);

  // Step 3: Compare
  console.log('');
  console.log('[3/4] Comparing results...');
  const comparison = await comparisonService.compare(claudeResult.output, geminiSession.id);

  console.log('');
  console.log(comparison.report);

  // Step 4: Get approval
  console.log('');
  console.log('[4/4] Validation Decision');
  console.log('-'.repeat(40));

  const decision = await ask('Approve Claude output? (y/n/s to skip): ');

  if (decision.toLowerCase() === 's') {
    console.log('Skipped.');
    rl.close();
    return;
  }

  const status = decision.toLowerCase() === 'y' ? 'approved' : 'rejected';
  const notes = await ask('Notes (optional): ');

  const record = tracker.addValidation({
    templateId,
    query,
    geminiSessionId: geminiSession.id,
    claudeSessionId: claudeResult.sessionId,
    status,
    notes: notes || '',
    metrics: {
      gemini: {
        findings: comparison.geminiMetrics.findingCount,
        sources: comparison.geminiMetrics.sourceCount,
        perspectives: comparison.geminiMetrics.perspectiveCount,
      },
      claude: {
        findings: comparison.claudeMetrics.findingCount,
        sources: comparison.claudeMetrics.sourceCount,
        perspectives: comparison.claudeMetrics.perspectiveCount,
      },
    },
    validatedBy: 'cli',
  });

  console.log('');
  console.log(`Validation recorded: ${record.id}`);
  console.log(`Status: ${status.toUpperCase()}`);
  console.log('');
  console.log(tracker.formatProgressReport());

  rl.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  rl.close();
  process.exit(1);
});
