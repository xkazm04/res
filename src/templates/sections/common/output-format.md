## Output Format

Return your research results as a JSON object matching this exact structure:

```json
{
  "query": "{{query}}",
  "template": "{{templateId}}",
  "status": "completed",
  "findings": [
    {
      "finding_type": "string (from template's finding types)",
      "content": "string (2-4 sentence claim)",
      "summary": "string (one-line summary)",
      "analysis": "string (expert commentary)",
      "confidence_score": 0.75,
      "temporal_context": "current|historical|predicted",
      "extracted_data": { "field": "value per finding type schema" },
      "supporting_sources": ["url1", "url2"]
    }
  ],
  "sources": [
    {
      "url": "string",
      "title": "string",
      "domain": "string",
      "credibility_score": 0.8,
      "credibility_label": "high|medium|low"
    }
  ],
  "perspectives": [
    {
      "perspective_type": "string",
      "analysis_text": "string (200-400 words)",
      "key_insights": ["insight1", "insight2"],
      "recommendations": ["rec1", "rec2"],
      "warnings": ["warning1"]
    }
  ],
  "contradictions": [
    {
      "claim_1": "string",
      "claim_2": "string",
      "source_1": "url",
      "source_2": "url",
      "significance": "string",
      "resolution_hint": "string"
    }
  ],
  "knowledge_gaps": [
    {
      "gap_type": "temporal|actor|topic|evidence|geographic",
      "description": "string",
      "priority": "high|medium|low",
      "suggested_queries": ["query1", "query2"]
    }
  ],
  "meta_analysis": {
    "cross_cutting_patterns": [
      {
        "pattern": "string (emergent pattern description)",
        "supporting_findings": ["finding indices or summaries"],
        "significance": "string (why this matters)",
        "confidence": 0.7
      }
    ],
    "omissions": [
      {
        "what_is_missing": "string",
        "why_it_matters": "string",
        "possible_explanations": ["string"]
      }
    ],
    "incentive_map": {
      "primary_beneficiaries": ["string"],
      "who_is_harmed": ["string"],
      "undisclosed_conflicts": ["string"],
      "cui_bono_summary": "string"
    },
    "historical_parallels": [
      {
        "historical_event": "string",
        "date": "string",
        "parallels": ["string"],
        "outcome_then": "string",
        "implication_now": "string"
      }
    ],
    "contrarian_case": {
      "strongest_counter_argument": "string",
      "weak_points_in_evidence": ["string"],
      "alternative_explanation": "string"
    },
    "key_unanswered_questions": ["string"],
    "synthesis_confidence": 0.65,
    "synthesis_summary": "string (2-3 paragraph synthesis)"
  },
  "search_queries_executed": ["query1", "query2", "..."]
}
```

### Output Rules
1. **status**: Use "completed" if research finished normally, "partial" if limited by resources
2. **findings**: Include ALL findings extracted, ordered by confidence_score descending
3. **sources**: Include ALL sources consulted, even low-credibility ones
4. **perspectives**: Include exactly {{perspectiveCount}} perspectives
5. **contradictions**: Only include genuine contradictions (may be empty)
6. **knowledge_gaps**: Include 2-5 most significant gaps
7. **search_queries_executed**: List all queries you actually ran
8. **meta_analysis**: Required for standard/deep granularity, optional for quick

### Quality Checklist
Before outputting, verify:
- [ ] All finding_type values match the template's defined types
- [ ] Every finding has at least one supporting_source
- [ ] Confidence scores are calibrated (not all 0.9+)
- [ ] Perspectives offer genuinely different viewpoints
- [ ] No duplicate findings
