"""
Domain Management Package

This package manages all domain-specific adapters and their registration.

Currently active domains:
- Automotive: FMEA and FTA analysis for automotive safety

Domain Registration:
Each domain adapter has a register() class method that creates an instance
and registers it with the global domain registry. This allows the domain
to be discovered through the API and used in the frontend dashboard.

To enable additional domains, uncomment their import and registration lines below.
"""

# Active domain imports
from .automotive import AutomotiveDomain

# Disabled domains (uncomment to enable)
# from .process_plant import ProcessPlantDomain
# from .financial import FinancialDomain
# from .trading import TradingDomain

# Base classes and registry
from .base import DomainAdapter, DomainAlgorithm, StylingConfig
from .registry import registry, register_domain, get_domain, list_domains

# Domain registration calls
# Each domain's register() method creates an instance and adds it to the registry
AutomotiveDomain.register()  # Register automotive domain

# Disabled domain registrations (uncomment to enable)
# ProcessPlantDomain.register()
# FinancialDomain.register()
# TradingDomain.register()
