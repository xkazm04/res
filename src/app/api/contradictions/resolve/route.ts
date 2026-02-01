/**
 * API Route: Contradiction Resolution
 *
 * Handles AI-powered resolution suggestions and persistence of resolutions.
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  ResearchContradiction,
  ResearchFinding,
  ResearchSource,
} from '@/src/types/research';
import type {
  ResolutionStrategy,
  ResolutionStrategyType,
  Resolution,
} from '@/src/lib/contradictionResolution';

// ============================================================================
// Types
// ============================================================================

interface ResolveRequest {
  action: 'get_suggestions' | 'save_resolution' | 'get_resolution';
  contradiction?: ResearchContradiction;
  finding1?: ResearchFinding;
  finding2?: ResearchFinding;
  source1?: ResearchSource;
  source2?: ResearchSource;
  resolution?: Partial<Resolution>;
  contradictionId?: string;
}

interface ResolveResponse {
  success: boolean;
  data?: {
    strategies?: ResolutionStrategy[];
    resolution?: Resolution;
    aiInsights?: string;
  };
  error?: string;
}

// ============================================================================
// Strategy Generation (simplified version - could integrate with LLM)
// ============================================================================

function generateAIStrategies(
  contradiction: ResearchContradiction,
  finding1?: ResearchFinding,
  finding2?: ResearchFinding,
  source1?: ResearchSource,
  source2?: ResearchSource
): ResolutionStrategy[] {
  const strategies: ResolutionStrategy[] = [];

  const cred1 = source1?.credibility_score ?? 0.5;
  const cred2 = source2?.credibility_score ?? 0.5;
  const conf1 = finding1?.confidence_score ?? 0.5;
  const conf2 = finding2?.confidence_score ?? 0.5;

  // Strategy based on credibility difference
  if (Math.abs(cred1 - cred2) > 0.15) {
    const prefersClaim = cred1 > cred2 ? 1 : 2;
    strategies.push({
      id: `strategy-cred-${Date.now()}`,
      type: prefersClaim === 1 ? 'accept_claim_1' : 'accept_claim_2',
      title: `Accept Claim ${prefersClaim} (Higher Credibility)`,
      description: `Source ${prefersClaim} has ${Math.round(Math.abs(cred1 - cred2) * 100)}% higher credibility`,
      rationale:
        'When there is a significant credibility gap between sources, the more credible source typically provides more reliable information.',
      confidence: 0.65 + Math.abs(cred1 - cred2) * 0.3,
      prefersClaim,
      requiredActions: [
        'Document the credibility-based decision',
        'Flag the lower-credibility source for future verification',
      ],
    });
  }

  // Strategy based on confidence difference
  if (Math.abs(conf1 - conf2) > 0.2) {
    const prefersClaim = conf1 > conf2 ? 1 : 2;
    strategies.push({
      id: `strategy-conf-${Date.now()}`,
      type: prefersClaim === 1 ? 'accept_claim_1' : 'accept_claim_2',
      title: `Accept Claim ${prefersClaim} (Higher Confidence)`,
      description: `Claim ${prefersClaim} has ${Math.round(Math.abs(conf1 - conf2) * 100)}% higher confidence score`,
      rationale:
        'The confidence score reflects how well-supported each claim is by the available evidence.',
      confidence: 0.55 + Math.abs(conf1 - conf2) * 0.4,
      prefersClaim,
    });
  }

  // Synthesis strategy
  strategies.push({
    id: `strategy-synth-${Date.now()}`,
    type: 'synthesize',
    title: 'Synthesize Both Claims',
    description: 'Both claims may contain partial truths that can be reconciled',
    rationale:
      'Many apparent contradictions arise from incomplete information or different perspectives. A nuanced synthesis may honor both viewpoints.',
    confidence: 0.45,
    requiredActions: [
      'Identify the specific point of disagreement',
      'Look for common ground between claims',
      'Draft a synthesized statement',
      'Validate the synthesis with available evidence',
    ],
  });

  // Contextual strategy
  strategies.push({
    id: `strategy-context-${Date.now()}`,
    type: 'contextual',
    title: 'Context-Dependent Resolution',
    description: 'The claims may be true in different contexts',
    rationale:
      'What appears contradictory may be context-dependent. Both claims could be valid within their specific circumstances.',
    confidence: 0.4,
    requiredActions: [
      'Identify the context for each claim',
      'Document when each claim applies',
      'Clarify scope and limitations',
    ],
  });

  // Temporal strategy if time references exist
  if (
    finding1?.temporal_context ||
    finding2?.temporal_context ||
    finding1?.event_date ||
    finding2?.event_date
  ) {
    strategies.push({
      id: `strategy-temporal-${Date.now()}`,
      type: 'temporal',
      title: 'Temporal Resolution',
      description: 'The contradiction may be due to changes over time',
      rationale:
        'Information and situations evolve. A claim that was accurate at one time may no longer be current.',
      confidence: 0.5,
      requiredActions: [
        'Verify the time periods for each claim',
        'Determine if circumstances changed between claims',
        'Document the temporal scope',
      ],
    });
  }

  // More research needed (for high-severity cases)
  strategies.push({
    id: `strategy-research-${Date.now()}`,
    type: 'requires_more_research',
    title: 'Requires Additional Research',
    description: 'Insufficient evidence to confidently resolve this contradiction',
    rationale:
      'Given the available information, making a premature decision could introduce errors. Additional research is recommended.',
    confidence: 0.3,
    requiredActions: [
      'Identify specific evidence gaps',
      'Draft targeted research queries',
      'Seek additional primary sources',
    ],
    evidenceGaps: [
      'Primary source verification needed',
      'Additional context required',
    ],
  });

  // Sort by confidence
  strategies.sort((a, b) => b.confidence - a.confidence);

  return strategies;
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ResolveRequest = await request.json();
    const { action, contradiction, finding1, finding2, source1, source2, resolution, contradictionId } = body;

    switch (action) {
      case 'get_suggestions': {
        if (!contradiction) {
          return NextResponse.json(
            { success: false, error: 'Contradiction is required' },
            { status: 400 }
          );
        }

        const strategies = generateAIStrategies(
          contradiction,
          finding1,
          finding2,
          source1,
          source2
        );

        // Generate AI insights summary
        const cred1 = source1?.credibility_score ?? 0.5;
        const cred2 = source2?.credibility_score ?? 0.5;
        const credDiff = Math.abs(cred1 - cred2);

        let aiInsights = 'Analysis: ';

        if (credDiff > 0.3) {
          aiInsights += `There is a significant credibility gap (${Math.round(credDiff * 100)}%) between sources, which strongly suggests accepting the higher-credibility source. `;
        } else if (credDiff > 0.15) {
          aiInsights += `A moderate credibility difference exists between sources. Consider this when evaluating claims. `;
        } else {
          aiInsights += `Sources have similar credibility levels. Resolution will depend on other factors. `;
        }

        if (finding1?.temporal_context !== finding2?.temporal_context) {
          aiInsights += 'The temporal contexts differ, suggesting a time-based resolution may be appropriate. ';
        }

        if (contradiction.resolution_hint) {
          aiInsights += `The initial analysis suggests: "${contradiction.resolution_hint}"`;
        }

        const response: ResolveResponse = {
          success: true,
          data: {
            strategies,
            aiInsights,
          },
        };

        return NextResponse.json(response);
      }

      case 'save_resolution': {
        if (!resolution || !contradictionId) {
          return NextResponse.json(
            { success: false, error: 'Resolution and contradictionId are required' },
            { status: 400 }
          );
        }

        // In a production app, this would save to Supabase
        // For now, we acknowledge the save request
        const savedResolution: Resolution = {
          id: resolution.id ?? `res-${Date.now()}`,
          contradictionId,
          status: resolution.status ?? 'unresolved',
          selectedStrategy: resolution.selectedStrategy,
          customResolution: resolution.customResolution,
          resolvedBy: resolution.resolvedBy,
          resolvedAt: resolution.resolvedAt,
          notes: resolution.notes,
          votes: resolution.votes ?? [],
          confidenceImpacts: resolution.confidenceImpacts,
        };

        const response: ResolveResponse = {
          success: true,
          data: {
            resolution: savedResolution,
          },
        };

        return NextResponse.json(response);
      }

      case 'get_resolution': {
        if (!contradictionId) {
          return NextResponse.json(
            { success: false, error: 'contradictionId is required' },
            { status: 400 }
          );
        }

        // In a production app, this would fetch from Supabase
        // For now, return null (client will use localStorage)
        const response: ResolveResponse = {
          success: true,
          data: {
            resolution: undefined,
          },
        };

        return NextResponse.json(response);
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in contradiction resolution API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
