# Domain-specific imports and registration calls commented out

# from .automotive import AutomotiveDomain
# from .process_plant import ProcessPlantDomain
# from .financial import FinancialDomain
# from .trading import TradingDomain

from .base import DomainAdapter, DomainAlgorithm, StylingConfig
from .registry import registry, register_domain, get_domain, list_domains

# Commenting out domain-specific registration calls
# _register_all_domains()  # This line should be commented out to disable all domains
# AutomotiveDomain.register()  # Disable AutomotiveDomain
# ProcessPlantDomain.register()  # Disable ProcessPlantDomain
# FinancialDomain.register()  # Disable FinancialDomain
# TradingDomain.register()  # Disable TradingDomain
