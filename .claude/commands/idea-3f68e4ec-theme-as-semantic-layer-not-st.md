Execute this requirement immediately without asking questions.

## REQUIREMENT

# Theme As Semantic Layer Not Style Layer

## Metadata
- **Category**: maintenance
- **Effort**: Unknown (N/A/3)
- **Impact**: Unknown (N/A/3)
- **Scan Type**: insight_synth
- **Generated**: 1/30/2026, 1:19:46 AM

## Description
The isRadar conditionals throughout all components reveal that theme is being used for styling, but the radar/swiss distinction is actually semantic: radar=analytical/surveillance, swiss=editorial/presentation. Refactor theming to expose semantic intent (showUncertainty, emphasizeData, prioritizeReadability) rather than visual tokens.

## Reasoning
The dual-theme system encodes different user mindsets, not just color preferences. Radar users want data density and uncertainty visualization; Swiss users want clarity and narrative flow. Making this semantic would enable theme to affect behavior (show/hide confidence) not just appearance.

## Context

**Note**: This section provides supporting architectural documentation and is NOT a hard requirement. Use it as guidance to understand existing code structure and maintain consistency.

### Context: Report Interactive Features

**Description**: Enhanced reading and analysis tools: focus mode for distraction-free reading, speed reader for rapid consumption, intel dashboard for quick insights, and key points panel.
**Related Files**:
- `src/components/report/features/FocusMode.tsx`
- `src/components/report/features/SpeedReader.tsx`
- `src/components/report/features/IntelDashboard.tsx`
- `src/components/report/features/KeyPointsPanel.tsx`
- `src/components/report/features/index.tsx`

**Post-Implementation**: After completing this requirement, evaluate if the context description or file paths need updates. Use the appropriate API/DB query to update the context if architectural changes were made.

## Recommended Skills

- **compact-ui-design**: Use `.claude/skills/compact-ui-design.md` for high-quality UI design references and patterns

## Notes

This requirement was generated from an AI-evaluated project idea. No specific goal is associated with this idea.

## AFTER IMPLEMENTATION

1. Log your implementation using the `log_implementation` MCP tool with:
   - requirementName: the requirement filename (without .md)
   - title: 2-6 word summary
   - overview: 1-2 paragraphs describing what was done

2. Check for test scenario using `check_test_scenario` MCP tool
   - If hasScenario is true, call `capture_screenshot` tool
   - If hasScenario is false, skip screenshot

3. Verify: `npx tsc --noEmit` (fix any type errors)

Begin implementation now.