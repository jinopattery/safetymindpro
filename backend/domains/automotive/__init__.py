"""
Automotive Domain Package

This package provides automotive safety analysis capabilities including:
- FMEA (Failure Mode and Effects Analysis)
- FTA (Fault Tree Analysis)
- Component modeling and failure propagation

The AutomotiveDomain adapter is the main entry point and is automatically
registered with the domain registry when this module is imported.
"""

from .adapter import AutomotiveDomain

__all__ = ['AutomotiveDomain']
