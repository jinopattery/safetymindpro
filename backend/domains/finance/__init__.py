"""
Finance Domain Package

This package provides finance risk analysis capabilities including:
- Share Deposit modeling (Form layer 🏦)
- Investment Function mapping (Function layer 📈)
- Financial Loss assessment (Failure layer 📉)

The FinanceDomain adapter mirrors the automotive three-layer FMEA/FTA structure
and is automatically registered with the domain registry when this module is imported.
"""

from .adapter import FinanceDomain

__all__ = ['FinanceDomain']
