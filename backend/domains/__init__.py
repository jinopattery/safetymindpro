"""
Domain-specific modules

Auto-registers all domain adapters on import.
"""

from backend.domains.base import DomainAdapter, DomainAlgorithm, StylingConfig
from backend.domains.registry import registry, register_domain, get_domain, list_domains

# Import domain adapters
from backend.domains.automotive.adapter import AutomotiveDomain
from backend.domains.process_plant.adapter import ProcessPlantDomain
from backend.domains.financial.adapter import FinancialDomain
from backend.domains.trading.adapter import TradingDomain

# Auto-register domains
def _register_all_domains():
    """Auto-register all available domain adapters"""
    register_domain(AutomotiveDomain())
    register_domain(ProcessPlantDomain())
    register_domain(FinancialDomain())
    register_domain(TradingDomain())

# Register on import
_register_all_domains()

__all__ = [
    'DomainAdapter',
    'DomainAlgorithm',
    'StylingConfig',
    'registry',
    'register_domain',
    'get_domain',
    'list_domains',
    'AutomotiveDomain',
    'ProcessPlantDomain',
    'FinancialDomain',
    'TradingDomain'
]