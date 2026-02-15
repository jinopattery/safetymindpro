"""
Utility functions for automotive FMEA calculations.

This module contains shared utility functions used by both models and calculations
to avoid circular imports.
"""


def calculate_rpn(severity: int, occurrence: int, detection: int) -> int:
    """
    Calculate Risk Priority Number from FMEA ratings.
    
    RPN is the product of Severity, Occurrence, and Detection ratings.
    Each rating should be in the range 1-10.
    
    Args:
        severity: Severity rating (1-10)
        occurrence: Occurrence rating (1-10)
        detection: Detection rating (1-10)
        
    Returns:
        RPN value (1-1000)
    """
    return severity * occurrence * detection
