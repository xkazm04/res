"""Research templates for different investigation types."""

from typing import Dict, Type

from .base import (
    BaseTemplate,
    FindingType,
    validate_finding_types,
    validates_finding_types,
    # Report Builder
    ReportBuilder,
    ReportVariantSpec,
    SectionSpec,
    AssessmentSpec,
    MarkdownBuilder,
)
from .investigative import InvestigativeTemplate, InvestigativeFindingType
from .financial import FinancialTemplate, FinancialFindingType
from .competitive import CompetitiveTemplate, CompetitiveFindingType
from .legal import LegalTemplate, LegalFindingType
from .tech_market import TechMarketTemplate, TechMarketFindingType
from .contract import ContractTemplate, ContractFindingType
from .understanding import UnderstandingTemplate, UnderstandingFindingType
from .due_diligence import DueDiligenceTemplate, DueDiligenceFindingType
from .purchase_decision import PurchaseDecisionTemplate, PurchaseDecisionFindingType
from .reputation import ReputationTemplate, ReputationFindingType

# Template registry
TEMPLATES: Dict[str, Type[BaseTemplate]] = {
    "investigative": InvestigativeTemplate,
    "financial": FinancialTemplate,
    "competitive": CompetitiveTemplate,
    "legal": LegalTemplate,
    "tech_market": TechMarketTemplate,
    "contract": ContractTemplate,
    "understanding": UnderstandingTemplate,
    "due_diligence": DueDiligenceTemplate,
    "purchase_decision": PurchaseDecisionTemplate,
    "reputation": ReputationTemplate,
}


def get_template(template_type: str) -> BaseTemplate:
    """Get template instance by type."""
    template_class = TEMPLATES.get(template_type, InvestigativeTemplate)
    return template_class()


__all__ = [
    # Base classes and utilities
    "BaseTemplate",
    "FindingType",
    "validate_finding_types",
    "validates_finding_types",
    # Report Builder
    "ReportBuilder",
    "ReportVariantSpec",
    "SectionSpec",
    "AssessmentSpec",
    "MarkdownBuilder",
    # Templates
    "InvestigativeTemplate",
    "FinancialTemplate",
    "CompetitiveTemplate",
    "LegalTemplate",
    "TechMarketTemplate",
    "ContractTemplate",
    "UnderstandingTemplate",
    "DueDiligenceTemplate",
    "PurchaseDecisionTemplate",
    "ReputationTemplate",
    # Finding Type Enums
    "InvestigativeFindingType",
    "FinancialFindingType",
    "CompetitiveFindingType",
    "LegalFindingType",
    "TechMarketFindingType",
    "ContractFindingType",
    "UnderstandingFindingType",
    "DueDiligenceFindingType",
    "PurchaseDecisionFindingType",
    "ReputationFindingType",
    # Registry
    "get_template",
    "TEMPLATES",
]
