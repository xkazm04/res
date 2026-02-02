## Phase 7: Meta-Analysis & Synthesis

You have now gathered findings, assessed sources, analyzed perspectives, and identified contradictions. This final phase requires stepping back to see patterns that individual findings don't reveal.

### 7.1 Pattern Synthesis

Review ALL your findings together and identify:

**Cross-Cutting Patterns:**
- What pattern connects findings that wasn't explicitly searched for?
- Are there recurring actors, methods, or timing patterns across different findings?
- What "coincidences" appear too frequently to be coincidental?

**Narrative Analysis:**
- What is the dominant narrative across your sources?
- Who benefits from this dominant narrative being believed?
- What alternative narratives exist? Who promotes them?
- How has the narrative evolved over time?

### 7.2 Omission Analysis

Equally important as what IS reported is what is NOT:

**The Dog That Didn't Bark:**
- What obvious questions were NOT answered by any source?
- Which actors are suspiciously absent from coverage?
- What data points would you expect to find but couldn't?
- Are there time periods with unusual silence?

**Systematic Omissions:**
- Do certain source types consistently omit certain facts?
- Is there evidence of coordinated non-coverage?
- What would a skeptic demand to see that isn't available?

### 7.3 Incentive Mapping

For the key claims and narratives you've found:

**Cui Bono Analysis:**
- Who benefits financially from each major claim being believed?
- Who benefits politically or reputationally?
- What career incentives might influence key sources?
- Are there conflicts of interest that weren't disclosed?

**Counter-Incentive Test:**
- Who would be harmed by deeper investigation?
- What would change if the opposite were true?
- Who has incentive to suppress or distort information?

### 7.4 Historical Pattern Recognition

**Playbook Detection:**
- Does this situation resemble historical precedents?
- What happened in similar past situations?
- Are the same actors or methods involved as in past events?
- What does history suggest about likely outcomes?

**Temporal Patterns:**
- Are there suspicious timing coincidences?
- What else was happening when key events occurred?
- Do announcements follow predictable patterns (Friday dumps, holiday releases)?

### 7.5 Network Inference

Beyond explicit relationships, infer implicit connections:

**Hidden Networks:**
- What relationships might exist that aren't publicly documented?
- Are there intermediaries connecting seemingly unrelated actors?
- Do funding flows suggest undisclosed coordination?
- What social/professional networks might explain coordinated behavior?

### 7.6 Contrarian Synthesis

Construct the strongest case AGAINST the dominant narrative:

**Steel Man Opposition:**
- What is the strongest argument against the consensus view?
- What evidence would disprove the main findings?
- What assumptions are we making that might be wrong?
- What would someone with opposite incentives say?

### 7.7 Future Historian Test

Imagine reviewing this situation 20 years from now:

- What would be obvious in hindsight that isn't clear now?
- What are we likely missing due to present-day blind spots?
- What questions would a future investigator ask?
- What would we wish we had documented?

### Output for This Phase

Produce a `meta_analysis` object with:

```json
{
  "meta_analysis": {
    "cross_cutting_patterns": [
      {
        "pattern": "Description of emergent pattern",
        "supporting_findings": ["finding_id_1", "finding_id_2"],
        "significance": "Why this pattern matters",
        "confidence": 0.7
      }
    ],
    "omissions": [
      {
        "what_is_missing": "Description of notable absence",
        "why_it_matters": "Significance of this omission",
        "possible_explanations": ["explanation_1", "explanation_2"]
      }
    ],
    "incentive_map": {
      "primary_beneficiaries": ["actor_1", "actor_2"],
      "who_is_harmed": ["actor_3"],
      "undisclosed_conflicts": ["conflict_1"],
      "cui_bono_summary": "Overall analysis of who benefits"
    },
    "historical_parallels": [
      {
        "historical_event": "Description",
        "date": "YYYY",
        "parallels": ["parallel_1", "parallel_2"],
        "outcome_then": "What happened",
        "implication_now": "What this suggests"
      }
    ],
    "contrarian_case": {
      "strongest_counter_argument": "The best case against consensus",
      "weak_points_in_evidence": ["weakness_1", "weakness_2"],
      "alternative_explanation": "Another way to interpret the facts"
    },
    "key_unanswered_questions": [
      "Question that remains unresolved",
      "Question that sources avoided"
    ],
    "synthesis_confidence": 0.65,
    "synthesis_summary": "2-3 paragraph synthesis of what the meta-analysis reveals"
  }
}
```

### Quality Standards

Your meta-analysis should:
- Go BEYOND summarizing findings to generating NEW insights
- Identify patterns that individual findings don't reveal
- Be specific about WHO benefits and HOW
- Acknowledge uncertainty and alternative interpretations
- Provide actionable intelligence, not just observations
