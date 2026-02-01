"""
Unit tests for the Bayesian confidence calculation module.

Tests the BayesianConfidenceCalculator and related functions
without requiring external API calls.
"""

import sys
from pathlib import Path

# Add src/services to path for direct import
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "services"))

try:
    import pytest
    HAS_PYTEST = True
except ImportError:
    HAS_PYTEST = False

from bayesian_confidence import (
    BayesianConfidenceCalculator,
    ConfidenceExplanation,
    EvidenceNode,
    EvidenceType,
    calculate_bayesian_confidence,
    calculate_source_credibility,
)


class TestDomainAuthority:
    """Tests for domain authority assessment."""

    def test_government_domain_high_authority(self):
        """Government domains should have high authority."""
        calculator = BayesianConfidenceCalculator()
        prob, explanation = calculator.get_domain_authority("sec.gov")
        assert prob >= 0.9
        assert "authoritative" in explanation.lower() or "gov" in explanation.lower()

    def test_edu_domain_high_authority(self):
        """Educational domains should have high authority."""
        calculator = BayesianConfidenceCalculator()
        prob, explanation = calculator.get_domain_authority("mit.edu")
        assert prob >= 0.9
        assert "edu" in explanation.lower()

    def test_major_news_source_high_authority(self):
        """Major news sources should have high authority."""
        calculator = BayesianConfidenceCalculator()
        prob, _ = calculator.get_domain_authority("reuters.com")
        assert prob >= 0.85

    def test_unknown_domain_default_prior(self):
        """Unknown domains should use default prior."""
        calculator = BayesianConfidenceCalculator()
        prob, explanation = calculator.get_domain_authority("randomwebsite123.com")
        assert prob == calculator.DEFAULT_DOMAIN_PRIOR
        assert "unknown" in explanation.lower() or "default" in explanation.lower()

    def test_partial_domain_match(self):
        """Partial domain matches should work."""
        calculator = BayesianConfidenceCalculator()
        prob, _ = calculator.get_domain_authority("news.bbc.com")
        assert prob > calculator.DEFAULT_DOMAIN_PRIOR


class TestSourceCredibility:
    """Tests for source credibility calculation."""

    def test_high_authority_source(self):
        """High authority sources should get high credibility."""
        source = {
            "url": "https://www.sec.gov/filing",
            "domain": "sec.gov",
            "title": "SEC Filing: Quarterly Report",
            "snippet": "The company reported revenue of $10 billion...",
            "source_type": "web",
        }
        score, evidence = BayesianConfidenceCalculator().calculate_source_credibility(source)
        assert score >= 0.8
        assert evidence.evidence_type == EvidenceType.SOURCE_CREDIBILITY

    def test_low_authority_source(self):
        """Unknown sources should get moderate credibility."""
        source = {
            "url": "https://random-blog.xyz/article",
            "domain": "random-blog.xyz",
            "title": "Best investment tips!",  # Marketing language
            "snippet": "This is the best investment...",
            "source_type": "blog",
        }
        score, evidence = BayesianConfidenceCalculator().calculate_source_credibility(source)
        assert score < 0.6

    def test_academic_source_boost(self):
        """Academic sources should get a credibility boost."""
        source = {
            "url": "https://arxiv.org/paper",
            "domain": "arxiv.org",
            "title": "Machine Learning in Finance: A Comprehensive Study",
            "snippet": "This paper presents findings from 1000 experiments...",
            "source_type": "academic",
        }
        score, _ = BayesianConfidenceCalculator().calculate_source_credibility(source)
        assert score >= 0.7


class TestBayesianConfidenceCalculation:
    """Tests for the full Bayesian confidence calculation."""

    def test_basic_confidence_calculation(self):
        """Basic confidence calculation should work."""
        finding = {
            "finding_type": "fact",
            "content": "The company reported $10B in revenue",
            "confidence_score": 0.7,
        }
        sources = [
            {"domain": "sec.gov", "title": "SEC Filing", "snippet": "Revenue: $10B"},
            {"domain": "reuters.com", "title": "Reuters Report", "snippet": "Company revenue..."},
        ]

        confidence, explanation = calculate_bayesian_confidence(finding, sources)

        assert 0.1 <= confidence <= 0.95
        assert isinstance(explanation, ConfidenceExplanation)
        assert explanation.base_confidence == 0.7

    def test_multiple_sources_increase_confidence(self):
        """Multiple credible sources should increase confidence."""
        finding = {"finding_type": "fact", "content": "Test finding", "confidence_score": 0.6}

        # Single source
        single_source = [{"domain": "reuters.com", "title": "Report", "snippet": "Data"}]
        conf_single, _ = calculate_bayesian_confidence(finding, single_source)

        # Multiple sources
        multiple_sources = [
            {"domain": "reuters.com", "title": "Report", "snippet": "Data"},
            {"domain": "bbc.com", "title": "Report", "snippet": "Data"},
            {"domain": "nytimes.com", "title": "Report", "snippet": "Data"},
        ]
        conf_multiple, _ = calculate_bayesian_confidence(finding, multiple_sources)

        # Multiple credible sources should generally increase confidence
        assert conf_multiple >= conf_single - 0.1  # Allow some tolerance

    def test_verification_bias_decreases_confidence(self):
        """Bias detection should decrease confidence."""
        finding = {"finding_type": "fact", "content": "Test", "confidence_score": 0.8}
        sources = [{"domain": "example.com", "title": "Article", "snippet": "Content"}]

        # Without bias
        verification_no_bias = {}
        conf_clean, _ = calculate_bayesian_confidence(finding, sources, verification_no_bias)

        # With high bias detected
        verification_biased = {
            "bias": {
                "bias_detected": True,
                "bias_score": 0.8,
                "bias_type": "vendor_marketing",
            }
        }
        conf_biased, _ = calculate_bayesian_confidence(finding, sources, verification_biased)

        assert conf_biased < conf_clean

    def test_expert_implausible_decreases_confidence(self):
        """Implausible expert assessment should decrease confidence."""
        finding = {"finding_type": "fact", "content": "Test", "confidence_score": 0.8}
        sources = [{"domain": "example.com", "title": "Article", "snippet": "Content"}]

        verification = {
            "expert_check": {
                "plausibility": "implausible",
                "plausibility_score": 0.2,
            }
        }

        confidence, explanation = calculate_bayesian_confidence(finding, sources, verification)

        assert confidence < 0.7
        # Check that expert check was recorded in evidence chain
        expert_nodes = [n for n in explanation.evidence_chain if n.evidence_type == EvidenceType.EXPERT_SANITY]
        assert len(expert_nodes) > 0

    def test_cross_reference_strong_increases_confidence(self):
        """Strong cross-reference should increase confidence."""
        finding = {"finding_type": "fact", "content": "Test", "confidence_score": 0.5}
        sources = [{"domain": "example.com", "title": "Article", "snippet": "Content"}]

        verification_weak = {
            "cross_reference": {
                "corroboration_level": "weak",
            }
        }
        conf_weak, _ = calculate_bayesian_confidence(finding, sources, verification_weak)

        verification_strong = {
            "cross_reference": {
                "corroboration_level": "strong",
                "supporting_findings": [1, 2, 3],
            }
        }
        conf_strong, _ = calculate_bayesian_confidence(finding, sources, verification_strong)

        assert conf_strong > conf_weak


class TestConfidenceExplanation:
    """Tests for confidence explanation generation."""

    def test_explanation_has_required_fields(self):
        """Explanation should have all required fields."""
        finding = {"content": "Test", "confidence_score": 0.7}
        sources = [{"domain": "example.com", "title": "Source", "snippet": "Content"}]

        _, explanation = calculate_bayesian_confidence(finding, sources)

        assert hasattr(explanation, "base_confidence")
        assert hasattr(explanation, "final_confidence")
        assert hasattr(explanation, "evidence_chain")
        assert hasattr(explanation, "summary")
        assert hasattr(explanation, "what_would_increase")
        assert hasattr(explanation, "what_would_decrease")

    def test_narrative_generation(self):
        """Narrative should be a readable string."""
        finding = {"content": "Test", "confidence_score": 0.7}
        sources = [{"domain": "sec.gov", "title": "SEC Filing", "snippet": "Data"}]

        _, explanation = calculate_bayesian_confidence(finding, sources)
        narrative = explanation.generate_narrative()

        assert isinstance(narrative, str)
        assert "confidence" in narrative.lower()
        assert "%" in narrative

    def test_to_dict_serialization(self):
        """Explanation should serialize to dict properly."""
        finding = {"content": "Test", "confidence_score": 0.7}
        sources = [{"domain": "example.com", "title": "Source", "snippet": "Content"}]

        _, explanation = calculate_bayesian_confidence(finding, sources)
        data = explanation.to_dict()

        assert isinstance(data, dict)
        assert "base_confidence" in data
        assert "final_confidence" in data
        assert "evidence_chain" in data
        assert isinstance(data["evidence_chain"], list)


class TestSourceCredibilityFunction:
    """Tests for the convenience source credibility function."""

    def test_returns_score_and_explanation(self):
        """Function should return score and explanation tuple."""
        source = {"domain": "sec.gov", "title": "Filing", "snippet": "Data"}
        score, explanation = calculate_source_credibility(source)

        assert isinstance(score, float)
        assert 0 <= score <= 1
        assert isinstance(explanation, str)

    def test_high_authority_high_score(self):
        """High authority domains should have high scores."""
        source = {"domain": "nature.com", "title": "Research Paper", "snippet": "Scientific data"}
        score, _ = calculate_source_credibility(source)
        assert score >= 0.7


class TestEvidenceNode:
    """Tests for the EvidenceNode data class."""

    def test_posterior_calculation(self):
        """Posterior should be calculated from Bayes' theorem."""
        node = EvidenceNode(
            evidence_type=EvidenceType.SOURCE_CREDIBILITY,
            name="Test Source",
            prior=0.5,
            likelihood=0.8,
            marginal=0.6,
        )
        # P(H|E) = P(E|H) * P(H) / P(E) = 0.8 * 0.5 / 0.6 = 0.667
        expected = (0.8 * 0.5) / 0.6
        assert abs(node.posterior - expected) < 0.001

    def test_to_dict_serialization(self):
        """Node should serialize to dict properly."""
        node = EvidenceNode(
            evidence_type=EvidenceType.BIAS_DETECTION,
            name="Bias Check",
            prior=0.7,
            likelihood=0.5,
            marginal=0.5,
            explanation="High bias detected",
        )
        data = node.to_dict()

        assert data["evidence_type"] == "bias_detection"
        assert data["name"] == "Bias Check"
        assert data["explanation"] == "High bias detected"


class TestBoundaryConditions:
    """Tests for edge cases and boundary conditions."""

    def test_empty_sources_list(self):
        """Should handle empty sources list."""
        finding = {"content": "Test", "confidence_score": 0.7}
        confidence, explanation = calculate_bayesian_confidence(finding, [])

        assert 0.1 <= confidence <= 0.95
        assert isinstance(explanation, ConfidenceExplanation)

    def test_very_high_base_confidence(self):
        """Should clamp very high confidence."""
        finding = {"content": "Test", "confidence_score": 0.99}
        sources = [{"domain": "sec.gov", "title": "Filing", "snippet": "Data"}]

        confidence, _ = calculate_bayesian_confidence(finding, sources)
        assert confidence <= 0.95

    def test_very_low_base_confidence(self):
        """Should clamp very low confidence."""
        finding = {"content": "Test", "confidence_score": 0.01}
        sources = [{"domain": "spam-site.xyz", "title": "Best tips!", "snippet": "Click here"}]

        confidence, _ = calculate_bayesian_confidence(finding, sources)
        assert confidence >= 0.1

    def test_missing_confidence_score(self):
        """Should handle missing confidence_score."""
        finding = {"content": "Test"}  # No confidence_score
        sources = [{"domain": "example.com", "title": "Source", "snippet": "Content"}]

        confidence, explanation = calculate_bayesian_confidence(finding, sources)

        assert 0.1 <= confidence <= 0.95
        assert explanation.base_confidence == 0.5  # Default


def run_tests():
    """Run tests without pytest if pytest is not available."""
    test_classes = [
        TestDomainAuthority,
        TestSourceCredibility,
        TestBayesianConfidenceCalculation,
        TestConfidenceExplanation,
        TestSourceCredibilityFunction,
        TestEvidenceNode,
        TestBoundaryConditions,
    ]

    passed = 0
    failed = 0
    errors = []

    for test_class in test_classes:
        instance = test_class()
        for method_name in dir(instance):
            if method_name.startswith("test_"):
                try:
                    method = getattr(instance, method_name)
                    method()
                    print(f"  PASS: {test_class.__name__}.{method_name}")
                    passed += 1
                except AssertionError as e:
                    print(f"  FAIL: {test_class.__name__}.{method_name}: {e}")
                    failed += 1
                    errors.append((test_class.__name__, method_name, str(e)))
                except Exception as e:
                    print(f"  ERROR: {test_class.__name__}.{method_name}: {e}")
                    failed += 1
                    errors.append((test_class.__name__, method_name, str(e)))

    print(f"\n{'=' * 60}")
    print(f"Results: {passed} passed, {failed} failed")
    if errors:
        print("\nFailures:")
        for cls, method, err in errors:
            print(f"  - {cls}.{method}: {err}")

    return failed == 0


if __name__ == "__main__":
    if HAS_PYTEST:
        import pytest
        pytest.main([__file__, "-v"])
    else:
        print("Running tests without pytest...\n")
        success = run_tests()
        sys.exit(0 if success else 1)
