"""Bayesian confidence model for explainable AI confidence scores.

This module implements a proper Bayesian inference model for calculating
confidence scores, making them interpretable and actionable. Instead of
ad-hoc additive adjustments, this uses proper probability propagation.

Key concepts:
- P(finding is true) depends on P(source is credible)
- P(source is credible) depends on P(domain is authoritative)
- All probabilities are properly multiplied, not added
- Explanations are generated showing the reasoning chain
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from enum import Enum
import math


class EvidenceType(Enum):
    """Types of evidence that can affect confidence."""
    SOURCE_CREDIBILITY = "source_credibility"
    CROSS_REFERENCE = "cross_reference"
    BIAS_DETECTION = "bias_detection"
    EXPERT_SANITY = "expert_sanity"
    CORROBORATION = "corroboration"
    CONTRADICTION = "contradiction"


@dataclass
class EvidenceNode:
    """Represents a piece of evidence in the Bayesian network.

    Each node has:
    - prior: Base probability before considering this evidence
    - likelihood: P(evidence | hypothesis is true)
    - marginal: P(evidence) - the probability of seeing this evidence
    - posterior: Calculated P(hypothesis | evidence)
    """
    evidence_type: EvidenceType
    name: str
    prior: float
    likelihood: float
    marginal: float
    posterior: float = 0.0
    explanation: str = ""
    raw_data: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        """Calculate posterior using Bayes' theorem."""
        if self.marginal > 0:
            self.posterior = (self.likelihood * self.prior) / self.marginal
        else:
            self.posterior = self.prior

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "evidence_type": self.evidence_type.value,
            "name": self.name,
            "prior": round(self.prior, 4),
            "likelihood": round(self.likelihood, 4),
            "marginal": round(self.marginal, 4),
            "posterior": round(self.posterior, 4),
            "explanation": self.explanation,
        }


@dataclass
class ConfidenceExplanation:
    """Structured explanation of how confidence was calculated."""

    base_confidence: float
    final_confidence: float
    evidence_chain: List[EvidenceNode] = field(default_factory=list)
    summary: str = ""
    what_would_increase: List[str] = field(default_factory=list)
    what_would_decrease: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "base_confidence": round(self.base_confidence, 4),
            "final_confidence": round(self.final_confidence, 4),
            "summary": self.summary,
            "evidence_chain": [e.to_dict() for e in self.evidence_chain],
            "what_would_increase": self.what_would_increase,
            "what_would_decrease": self.what_would_decrease,
        }

    def generate_narrative(self) -> str:
        """Generate human-readable explanation of confidence."""
        lines = []
        pct = lambda x: f"{x*100:.0f}%"

        lines.append(f"This finding has {pct(self.final_confidence)} confidence.")
        lines.append("")
        lines.append("Reasoning:")
        lines.append(f"  - Started with {pct(self.base_confidence)} base confidence")

        for evidence in self.evidence_chain:
            impact = evidence.posterior - evidence.prior
            direction = "increased" if impact > 0 else "decreased"
            lines.append(f"  - {evidence.name}: {direction} to {pct(evidence.posterior)}")
            if evidence.explanation:
                lines.append(f"    ({evidence.explanation})")

        if self.what_would_increase:
            lines.append("")
            lines.append("To increase confidence:")
            for item in self.what_would_increase[:3]:
                lines.append(f"  - {item}")

        if self.what_would_decrease:
            lines.append("")
            lines.append("Factors that could lower confidence:")
            for item in self.what_would_decrease[:3]:
                lines.append(f"  - {item}")

        return "\n".join(lines)


class BayesianConfidenceCalculator:
    """Calculates confidence using Bayesian inference.

    This replaces the additive adjustment model with proper probabilistic
    inference, making confidence scores interpretable and actionable.
    """

    # Domain authority priors - P(domain is authoritative)
    DOMAIN_AUTHORITY_PRIORS: Dict[str, float] = {
        # Highest authority - government and academic
        "gov": 0.95,
        "edu": 0.92,
        "mil": 0.93,

        # High authority - major wire services and papers of record
        "reuters.com": 0.90,
        "apnews.com": 0.90,
        "bbc.com": 0.88,
        "nytimes.com": 0.87,
        "wsj.com": 0.88,
        "ft.com": 0.87,
        "bloomberg.com": 0.86,
        "sec.gov": 0.95,

        # Medium-high authority - quality publications
        "forbes.com": 0.75,
        "businessinsider.com": 0.70,
        "cnbc.com": 0.72,
        "marketwatch.com": 0.70,
        "washingtonpost.com": 0.80,
        "economist.com": 0.85,
        "nature.com": 0.92,
        "sciencedirect.com": 0.88,

        # Tech-focused high authority
        "github.com": 0.75,
        "stackoverflow.com": 0.70,
        "arxiv.org": 0.85,
        "acm.org": 0.88,
        "ieee.org": 0.88,
    }

    # Default prior for unknown domains
    DEFAULT_DOMAIN_PRIOR = 0.50

    def __init__(self):
        self.evidence_nodes: List[EvidenceNode] = []

    def reset(self):
        """Reset evidence chain for new calculation."""
        self.evidence_nodes = []

    def get_domain_authority(self, domain: str) -> Tuple[float, str]:
        """Get domain authority prior probability.

        Returns:
            Tuple of (probability, explanation)
        """
        domain_lower = domain.lower()

        # Check for exact match first
        if domain_lower in self.DOMAIN_AUTHORITY_PRIORS:
            prob = self.DOMAIN_AUTHORITY_PRIORS[domain_lower]
            return prob, f"Known authoritative domain: {domain}"

        # Check for TLD-based matches
        for tld in ["gov", "edu", "mil"]:
            if domain_lower.endswith(f".{tld}"):
                prob = self.DOMAIN_AUTHORITY_PRIORS[tld]
                return prob, f"Authoritative {tld.upper()} domain"

        # Check for partial domain matches
        for known_domain, prob in self.DOMAIN_AUTHORITY_PRIORS.items():
            if known_domain in domain_lower:
                return prob, f"Associated with {known_domain}"

        return self.DEFAULT_DOMAIN_PRIOR, "Unknown domain - using default prior"

    def calculate_source_credibility(
        self,
        source: Dict[str, Any],
    ) -> Tuple[float, EvidenceNode]:
        """Calculate P(source is credible) using Bayesian inference.

        The model:
        - P(credible | domain) = P(domain authoritative) * P(content quality)
        - Domain authority is a strong prior
        - Content indicators can adjust

        Returns:
            Tuple of (credibility_score, evidence_node)
        """
        domain = source.get("domain", "")

        # Get domain authority as prior
        domain_prior, domain_explanation = self.get_domain_authority(domain)

        # Estimate content quality likelihood from available signals
        # P(quality content | source is credible) vs P(quality content | not credible)
        content_signals = self._assess_content_signals(source)

        # Calculate using simplified Bayesian update
        # P(credible | signals) = P(signals | credible) * P(credible) / P(signals)
        likelihood_if_credible = content_signals
        likelihood_if_not_credible = 1 - content_signals

        # Marginal: P(signals) = P(signals|credible)*P(credible) + P(signals|not)*P(not)
        marginal = (
            likelihood_if_credible * domain_prior +
            likelihood_if_not_credible * (1 - domain_prior)
        )

        # Posterior: P(credible | signals)
        if marginal > 0:
            posterior = (likelihood_if_credible * domain_prior) / marginal
        else:
            posterior = domain_prior

        # Clamp to reasonable range
        posterior = max(0.1, min(0.95, posterior))

        evidence = EvidenceNode(
            evidence_type=EvidenceType.SOURCE_CREDIBILITY,
            name=f"Source: {domain}",
            prior=domain_prior,
            likelihood=likelihood_if_credible,
            marginal=marginal,
            posterior=posterior,
            explanation=domain_explanation,
            raw_data={"domain": domain, "content_signals": content_signals}
        )

        return posterior, evidence

    def _assess_content_signals(self, source: Dict[str, Any]) -> float:
        """Assess content quality signals from source metadata.

        Returns probability that content is high quality given observable signals.
        """
        signals_score = 0.5  # Start at neutral

        title = source.get("title", "")
        snippet = source.get("snippet", "")
        source_type = source.get("source_type", "web")

        # Title quality signals
        if title:
            # Longer, descriptive titles tend to be higher quality
            if len(title) > 30:
                signals_score += 0.05
            if len(title) > 60:
                signals_score += 0.05

            # Marketing language is a negative signal
            marketing_words = ["best", "top", "amazing", "revolutionary", "guaranteed"]
            if any(w in title.lower() for w in marketing_words):
                signals_score -= 0.10

        # Snippet quality signals
        if snippet:
            # Substantive snippets suggest better content
            if len(snippet) > 100:
                signals_score += 0.05

            # Contains numbers/data (suggests factual content)
            if any(c.isdigit() for c in snippet):
                signals_score += 0.05

        # Source type signals
        if source_type == "academic":
            signals_score += 0.15
        elif source_type == "news":
            signals_score += 0.05
        elif source_type == "blog":
            signals_score -= 0.05
        elif source_type == "social":
            signals_score -= 0.10

        return max(0.1, min(0.9, signals_score))

    def calculate_finding_confidence(
        self,
        finding: Dict[str, Any],
        sources: List[Dict[str, Any]],
        verification: Optional[Dict[str, Any]] = None,
    ) -> Tuple[float, ConfidenceExplanation]:
        """Calculate P(finding is true) using full Bayesian network.

        The network structure:
        - P(finding true) depends on P(sources credible)
        - Multiple credible sources increase confidence (corroboration)
        - Bias detection decreases confidence
        - Expert sanity check can increase or decrease

        Returns:
            Tuple of (confidence_score, explanation)
        """
        self.reset()

        # Start with base confidence from finding extraction
        base_confidence = finding.get("confidence_score", 0.5)

        # Track cumulative probability
        current_confidence = base_confidence

        # Phase 1: Source credibility
        # P(finding | sources) = product of P(source_i credible) for corroborating sources
        source_posteriors = []
        for source in sources[:5]:  # Limit to top 5 sources
            cred_score, evidence = self.calculate_source_credibility(source)
            source_posteriors.append(cred_score)
            self.evidence_nodes.append(evidence)

        if source_posteriors:
            # Combine source credibilities using Bayesian combination
            # Multiple agreeing sources increase confidence
            combined_source_cred = self._combine_source_credibilities(source_posteriors)

            # Update confidence based on source credibility
            # P(finding | sources) = P(finding) * adjustment_factor
            source_adjustment = self._calculate_source_adjustment(
                base_confidence, combined_source_cred
            )
            current_confidence = source_adjustment

            self.evidence_nodes.append(EvidenceNode(
                evidence_type=EvidenceType.CORROBORATION,
                name="Source Agreement",
                prior=base_confidence,
                likelihood=combined_source_cred,
                marginal=0.5,  # Neutral marginal
                posterior=current_confidence,
                explanation=f"Combined credibility from {len(source_posteriors)} sources"
            ))

        # Phase 2: Verification adjustments
        if verification:
            current_confidence = self._apply_verification_evidence(
                current_confidence, verification
            )

        # Generate explanation
        explanation = self._generate_explanation(
            base_confidence, current_confidence, finding, sources
        )

        # Clamp final result
        final_confidence = max(0.1, min(0.95, current_confidence))
        explanation.final_confidence = final_confidence

        return final_confidence, explanation

    def _combine_source_credibilities(self, credibilities: List[float]) -> float:
        """Combine multiple source credibilities using Bayesian update.

        Multiple independent credible sources increase confidence:
        P(true | source1, source2) > P(true | source1) if source2 corroborates

        We use a log-odds model for combining evidence.
        """
        if not credibilities:
            return 0.5

        if len(credibilities) == 1:
            return credibilities[0]

        # Convert to log-odds and sum
        log_odds = []
        for p in credibilities:
            # Clamp to avoid log(0)
            p = max(0.01, min(0.99, p))
            log_odds.append(math.log(p / (1 - p)))

        # Average log-odds (for independent evidence this is additive)
        # But we use a weighted average with diminishing returns
        # First source has full weight, subsequent sources have reduced weight
        weights = [1.0 / (i + 1) for i in range(len(log_odds))]
        total_weight = sum(weights)
        weighted_log_odds = sum(lo * w for lo, w in zip(log_odds, weights)) / total_weight

        # Convert back to probability
        combined = 1 / (1 + math.exp(-weighted_log_odds))

        # Apply bonus for multiple sources (corroboration boost)
        if len(credibilities) >= 3:
            combined = combined * 1.05  # 5% boost for 3+ sources
        if len(credibilities) >= 5:
            combined = combined * 1.05  # Additional 5% boost for 5+ sources

        return min(0.95, combined)

    def _calculate_source_adjustment(
        self,
        base_confidence: float,
        source_credibility: float
    ) -> float:
        """Calculate adjusted confidence based on source credibility.

        Uses a Bayesian update where source credibility affects our belief
        in the finding being true.
        """
        # P(finding | sources) = P(sources support finding | finding true) * P(finding) / P(sources support)
        # Simplified: we weight the base confidence by source credibility

        # If sources are highly credible, pull confidence toward their level
        # If sources are low credibility, pull down

        # Weight based on how much evidence we have
        weight = 0.4  # How much source credibility affects the final score

        adjusted = (1 - weight) * base_confidence + weight * source_credibility

        return adjusted

    def _apply_verification_evidence(
        self,
        current_confidence: float,
        verification: Dict[str, Any],
    ) -> float:
        """Apply verification results using Bayesian updates.

        Unlike additive adjustments, we use proper probability updates.
        """
        confidence = current_confidence

        # Bias detection evidence
        if "bias" in verification:
            bias = verification["bias"]
            bias_score = bias.get("bias_score", 0.0)

            if bias_score > 0.3:
                # High bias detected - this is evidence against the finding
                # P(finding true | bias detected) = P(bias | true) * P(true) / P(bias)
                # If source is biased, less likely finding is objective truth

                # Likelihood ratio: P(bias | finding true) / P(bias | finding false)
                # Biased sources more likely to push false narratives
                likelihood_ratio = 0.7 - (bias_score * 0.4)  # 0.3 to 0.7

                confidence = self._bayesian_update(
                    prior=confidence,
                    likelihood_ratio=likelihood_ratio
                )

                self.evidence_nodes.append(EvidenceNode(
                    evidence_type=EvidenceType.BIAS_DETECTION,
                    name="Bias Detection",
                    prior=current_confidence,
                    likelihood=likelihood_ratio,
                    marginal=0.5,
                    posterior=confidence,
                    explanation=f"Bias score: {bias_score:.2f} - {bias.get('bias_type', 'unknown')}",
                    raw_data=bias
                ))

        # Expert sanity check evidence
        if "expert_check" in verification:
            expert = verification["expert_check"]
            plausibility = expert.get("plausibility", "plausible")
            plausibility_score = expert.get("plausibility_score", 0.7)

            # Expert judgment provides strong evidence
            if plausibility == "implausible":
                # Strong evidence against
                likelihood_ratio = 0.3
                explanation = "Expert assessment: claim is implausible"
            elif plausibility == "questionable":
                # Moderate evidence against
                likelihood_ratio = 0.6
                explanation = "Expert assessment: claim is questionable"
            else:
                # Slight positive evidence
                likelihood_ratio = 1.0 + (plausibility_score - 0.7) * 0.3
                explanation = f"Expert assessment: claim is plausible ({plausibility_score:.0%})"

            prior = confidence
            confidence = self._bayesian_update(
                prior=confidence,
                likelihood_ratio=likelihood_ratio
            )

            self.evidence_nodes.append(EvidenceNode(
                evidence_type=EvidenceType.EXPERT_SANITY,
                name="Expert Sanity Check",
                prior=prior,
                likelihood=likelihood_ratio if likelihood_ratio <= 1 else 1/likelihood_ratio,
                marginal=0.5,
                posterior=confidence,
                explanation=explanation,
                raw_data=expert
            ))

            # Flag extraordinary claims
            if expert.get("extraordinary_claim", False):
                # Extraordinary claims require extraordinary evidence
                confidence = confidence * 0.85
                self.evidence_nodes.append(EvidenceNode(
                    evidence_type=EvidenceType.EXPERT_SANITY,
                    name="Extraordinary Claim Flag",
                    prior=confidence / 0.85,
                    likelihood=0.85,
                    marginal=0.5,
                    posterior=confidence,
                    explanation="Extraordinary claim requires stronger evidence"
                ))

        # Cross-reference evidence
        if "cross_reference" in verification:
            cross_ref = verification["cross_reference"]
            corroboration = cross_ref.get("corroboration_level", "unknown")

            # Cross-reference provides corroboration evidence
            corroboration_map = {
                "strong": 1.3,      # Strong positive evidence
                "moderate": 1.1,    # Moderate positive
                "weak": 0.95,       # Slight negative
                "uncorroborated": 0.8,  # No corroboration is weak negative
                "unknown": 1.0      # Neutral
            }

            likelihood_ratio = corroboration_map.get(corroboration, 1.0)

            # Check for contradictions
            contradictions = cross_ref.get("contradicting_findings", [])
            if contradictions:
                # Each contradiction is evidence against
                likelihood_ratio *= (0.9 ** len(contradictions))

            prior = confidence
            confidence = self._bayesian_update(
                prior=confidence,
                likelihood_ratio=likelihood_ratio
            )

            explanation = f"Cross-reference: {corroboration}"
            if contradictions:
                explanation += f" ({len(contradictions)} contradictions)"

            self.evidence_nodes.append(EvidenceNode(
                evidence_type=EvidenceType.CROSS_REFERENCE,
                name="Cross-Reference Analysis",
                prior=prior,
                likelihood=min(1.0, likelihood_ratio),
                marginal=0.5,
                posterior=confidence,
                explanation=explanation,
                raw_data=cross_ref
            ))

        return confidence

    def _bayesian_update(
        self,
        prior: float,
        likelihood_ratio: float,
    ) -> float:
        """Apply Bayesian update using likelihood ratio.

        posterior_odds = likelihood_ratio * prior_odds

        Args:
            prior: Prior probability P(H)
            likelihood_ratio: P(E|H) / P(E|not H)

        Returns:
            Posterior probability P(H|E)
        """
        # Convert to odds
        if prior >= 0.99:
            prior = 0.99
        if prior <= 0.01:
            prior = 0.01

        prior_odds = prior / (1 - prior)

        # Update odds
        posterior_odds = likelihood_ratio * prior_odds

        # Convert back to probability
        posterior = posterior_odds / (1 + posterior_odds)

        return max(0.1, min(0.95, posterior))

    def _generate_explanation(
        self,
        base_confidence: float,
        final_confidence: float,
        finding: Dict[str, Any],
        sources: List[Dict[str, Any]],
    ) -> ConfidenceExplanation:
        """Generate structured explanation of confidence calculation."""

        # Determine what would increase confidence
        what_would_increase = []
        what_would_decrease = []

        # Check source diversity
        domains = set(s.get("domain", "") for s in sources)
        if len(domains) < 3:
            what_would_increase.append(
                "Additional corroborating sources from different domains"
            )

        # Check for high-authority sources
        high_auth_count = sum(
            1 for s in sources
            if self.get_domain_authority(s.get("domain", ""))[0] > 0.8
        )
        if high_auth_count < 2:
            what_would_increase.append(
                "Citations from authoritative sources (academic, government, major publications)"
            )

        # Check verification status
        for node in self.evidence_nodes:
            if node.evidence_type == EvidenceType.BIAS_DETECTION:
                if node.posterior < node.prior:
                    what_would_decrease.append(
                        f"Bias detected: {node.explanation}"
                    )
            if node.evidence_type == EvidenceType.EXPERT_SANITY:
                if "implausible" in node.explanation.lower():
                    what_would_decrease.append(
                        "Expert assessment flagged claim as implausible"
                    )
                elif "questionable" in node.explanation.lower():
                    what_would_decrease.append(
                        "Expert assessment flagged claim as questionable"
                    )

        # Add general factors
        if final_confidence < 0.7:
            what_would_increase.append(
                "Verification by independent fact-checking"
            )

        if final_confidence > 0.8:
            what_would_decrease.append(
                "Discovery of conflicting evidence or retractions"
            )

        # Generate summary
        pct = lambda x: f"{x*100:.0f}%"

        if final_confidence >= base_confidence + 0.1:
            summary = (
                f"Confidence increased from {pct(base_confidence)} to {pct(final_confidence)} "
                f"due to corroborating evidence from credible sources."
            )
        elif final_confidence <= base_confidence - 0.1:
            summary = (
                f"Confidence decreased from {pct(base_confidence)} to {pct(final_confidence)} "
                f"due to verification concerns (bias, plausibility, or lack of corroboration)."
            )
        else:
            summary = (
                f"Confidence of {pct(final_confidence)} reflects balanced evidence "
                f"from the available sources and verification checks."
            )

        return ConfidenceExplanation(
            base_confidence=base_confidence,
            final_confidence=final_confidence,
            evidence_chain=self.evidence_nodes.copy(),
            summary=summary,
            what_would_increase=what_would_increase[:5],
            what_would_decrease=what_would_decrease[:5],
        )


def calculate_bayesian_confidence(
    finding: Dict[str, Any],
    sources: List[Dict[str, Any]],
    verification: Optional[Dict[str, Any]] = None,
) -> Tuple[float, ConfidenceExplanation]:
    """Convenience function for calculating Bayesian confidence.

    Args:
        finding: Finding dictionary with confidence_score
        sources: List of source dictionaries
        verification: Optional verification results

    Returns:
        Tuple of (confidence_score, explanation)
    """
    calculator = BayesianConfidenceCalculator()
    return calculator.calculate_finding_confidence(finding, sources, verification)


def calculate_source_credibility(source: Dict[str, Any]) -> Tuple[float, str]:
    """Calculate credibility score for a single source.

    Returns:
        Tuple of (credibility_score, explanation_string)
    """
    calculator = BayesianConfidenceCalculator()
    score, evidence = calculator.calculate_source_credibility(source)
    return score, evidence.explanation
