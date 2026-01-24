"""Research templates for different investigation types."""

from typing import Dict, Type

from .base import BaseTemplate
from .investigative import InvestigativeTemplate
from .financial import FinancialTemplate
from .competitive import CompetitiveTemplate
from .legal import LegalTemplate
from .tech_market import TechMarketTemplate
from .contract import ContractTemplate
from .understanding import UnderstandingTemplate
from .due_diligence import DueDiligenceTemplate
from .purchase_decision import PurchaseDecisionTemplate
from .reputation import ReputationTemplate

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
    "BaseTemplate",
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
    "get_template",
    "TEMPLATES",
]
