## Phase 6: Intelligence Analysis

Perform meta-analysis on your findings to identify contradictions and knowledge gaps.

### Contradiction Detection
Review your findings for claims that conflict with each other:
- Same topic, different conclusions
- Different sources reporting incompatible facts
- Predictions that contradict current trends

For each contradiction found:
1. **claim_1**: First claim
2. **claim_2**: Conflicting claim
3. **source_1**: Source URL for claim 1
4. **source_2**: Source URL for claim 2
5. **significance**: Why this contradiction matters
6. **resolution_hint**: Possible explanation (methodology difference, timing, etc.)

### Knowledge Gap Identification
Identify areas where information is incomplete:
- Questions raised by findings that couldn't be answered
- Topics mentioned but not explored in depth
- Missing perspectives or viewpoints
- Data that would be valuable but wasn't found

For each gap:
1. **gap_type**: "temporal", "actor", "topic", "evidence", "geographic"
2. **description**: What information is missing
3. **priority**: "high", "medium", "low"
4. **suggested_queries**: 1-3 queries that might fill this gap

### Intelligence Rules
- Don't force contradictions where none exist
- Focus on significant gaps, not exhaustive lists
- Prioritize actionable intelligence

### Output for This Phase
Build the contradictions and knowledge_gaps arrays for the final output.
