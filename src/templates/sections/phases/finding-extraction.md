## Phase 4: Finding Extraction

Extract structured findings from the sources you've assessed.

### Extraction Context
{{extractionIntro}}

### Finding Types for This Template
{{findingTypes}}

### Extraction Guidelines
{{extractionGuidelines}}

### For Each Finding, Provide:
1. **finding_type**: One of the types listed above (use exact name)
2. **content**: The core claim or fact (2-4 sentences)
3. **summary**: One-line summary for quick scanning
4. **analysis**: {{analysisInstruction}}
5. **confidence_score**: 0.0-1.0 based on source quality and corroboration
6. **temporal_context**: "current", "historical", "predicted", etc.
7. **extracted_data**: Structured data matching the type's schema
8. **supporting_sources**: URLs of sources supporting this finding

### Confidence Score Guidelines
- **0.9-1.0**: Multiple high-credibility sources agree
- **0.7-0.9**: Single high-credibility source OR multiple medium sources
- **0.5-0.7**: Medium-credibility sources with some corroboration
- **0.3-0.5**: Limited evidence, single medium source
- **0.0-0.3**: Low-credibility source, unverified claim

### Extraction Rules
1. Use EXACT finding_type values from the list above
2. Don't invent new finding types
3. One finding per distinct claim (don't combine unrelated facts)
4. Always include supporting_sources
5. extracted_data should match the schema hint for each type

### Output for This Phase
Build the findings array for the final output.
