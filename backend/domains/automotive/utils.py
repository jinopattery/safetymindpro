"""
Utility functions for automotive FMEA calculations.

This module contains shared utility functions used by both models and calculations
to avoid circular imports. By extracting shared functionality here, we ensure that:
- models.py can use calculate_rpn without importing calculations.py
- calculations.py can import from models.py without creating a circular dependency

Design Pattern: Extract Common Dependencies
When two modules need to import from each other, extract the shared code to a
third module that both can import from.
"""


def calculate_rpn(severity: int, occurrence: int, detection: int) -> int:
    """
    Calculate Risk Priority Number from FMEA ratings.
    
    RPN is the product of Severity, Occurrence, and Detection ratings.
    Each rating should be in the range 1-10.
    
    Args:
        severity: Severity rating (1-10) - Impact of the failure
        occurrence: Occurrence rating (1-10) - Frequency of the failure
        detection: Detection rating (1-10) - Likelihood of detecting the failure
        
    Returns:
        RPN value (1-1000) - Higher values indicate higher risk
    """
    return severity * occurrence * detection
