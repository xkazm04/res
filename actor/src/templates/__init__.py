"""Research templates for different investigation types."""

from typing import Dict, Type

from .base import BaseTemplate
from .investigative import InvestigativeTemplate
from .financial import FinancialTemplate
from .competitive import CompetitiveTemplate
from .legal import LegalTemplate

# Template registry
TEMPLATES: Dict[str, Type[BaseTemplate]] = {
    "investigative": InvestigativeTemplate,
    "financial": FinancialTemplate,
    "competitive": CompetitiveTemplate,
    "legal": LegalTemplate,
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
    "get_template",
    "TEMPLATES",
]
