"""
Time-Series Analysis - Property-Centric Algorithms

Domain-independent time-series analysis algorithms that work on time-varying
properties of form elements. These algorithms detect anomalies, identify trends,
and forecast future values.
"""

from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from backend.core.universal_graph import UniversalGraph, FormElement, TimeSeriesData


def analyze_timeseries(form_elements: Dict[str, FormElement]) -> Dict[str, Any]:
    """
    Comprehensive time-series analysis.
    
    Analyzes all time-varying properties across all form elements.
    
    Args:
        form_elements: Dictionary of FormElement instances
        
    Returns:
        Dictionary with time-series analysis results
    """
    return {
        'anomalies': detect_anomalies(form_elements),
        'trends': compute_trends(form_elements),
        'forecasts': forecast_values(form_elements),
        'statistics': compute_statistics(form_elements)
    }


def detect_anomalies(
    form_elements: Dict[str, FormElement],
    threshold: float = 2.0
) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    """
    Detect anomalies in time-series properties.
    
    Uses statistical methods (z-score) to identify outliers.
    
    Args:
        form_elements: Dictionary of FormElement instances
        threshold: Number of standard deviations for anomaly detection
        
    Returns:
        Dictionary mapping form IDs to property anomalies
    """
    anomalies = {}
    
    for form_id, form in form_elements.items():
        form_anomalies = {}
        
        # Check each property
        for property_name in form.properties.values.keys():
            anomaly_indices = form.properties.detect_anomalies(property_name, threshold)
            
            if anomaly_indices:
                anomaly_details = []
                timestamps = form.properties.timestamps
                values = form.properties.values[property_name]
                
                for idx in anomaly_indices:
                    if idx < len(timestamps) and idx < len(values):
                        anomaly_details.append({
                            'index': idx,
                            'timestamp': timestamps[idx].isoformat(),
                            'value': values[idx],
                            'property': property_name
                        })
                
                form_anomalies[property_name] = anomaly_details
        
        if form_anomalies:
            anomalies[form_id] = form_anomalies
    
    return anomalies


def compute_trends(form_elements: Dict[str, FormElement]) -> Dict[str, Dict[str, Dict[str, Any]]]:
    """
    Compute trends for time-series properties.
    
    Identifies:
    - Increasing/decreasing trends
    - Rate of change
    - Trend direction
    
    Args:
        form_elements: Dictionary of FormElement instances
        
    Returns:
        Dictionary mapping form IDs to property trends
    """
    trends = {}
    
    for form_id, form in form_elements.items():
        form_trends = {}
        
        for property_name, values in form.properties.values.items():
            if len(values) < 2:
                continue
            
            # Compute simple linear trend
            trend_info = _compute_linear_trend(values)
            
            if trend_info:
                form_trends[property_name] = trend_info
        
        if form_trends:
            trends[form_id] = form_trends
    
    return trends


def forecast_values(
    form_elements: Dict[str, FormElement],
    horizon: int = 5
) -> Dict[str, Dict[str, List[Any]]]:
    """
    Forecast future values using simple extrapolation.
    
    Args:
        form_elements: Dictionary of FormElement instances
        horizon: Number of steps to forecast
        
    Returns:
        Dictionary mapping form IDs to property forecasts
    """
    forecasts = {}
    
    for form_id, form in form_elements.items():
        form_forecasts = {}
        
        for property_name, values in form.properties.values.items():
            if len(values) < 3:
                continue
            
            # Simple linear extrapolation
            forecast = _simple_forecast(values, horizon)
            
            if forecast:
                form_forecasts[property_name] = forecast
        
        if form_forecasts:
            forecasts[form_id] = form_forecasts
    
    return forecasts


def compute_statistics(form_elements: Dict[str, FormElement]) -> Dict[str, Dict[str, Dict[str, float]]]:
    """
    Compute statistical summaries for time-series properties.
    
    Args:
        form_elements: Dictionary of FormElement instances
        
    Returns:
        Dictionary mapping form IDs to property statistics
    """
    statistics = {}
    
    for form_id, form in form_elements.items():
        form_stats = {}
        
        for property_name, values in form.properties.values.items():
            try:
                numeric_values = [float(v) for v in values]
                
                if numeric_values:
                    stats = _compute_basic_stats(numeric_values)
                    form_stats[property_name] = stats
            except (ValueError, TypeError):
                # Skip non-numeric properties
                continue
        
        if form_stats:
            statistics[form_id] = form_stats
    
    return statistics


def identify_property_correlations(
    form_elements: Dict[str, FormElement]
) -> List[Dict[str, Any]]:
    """
    Identify correlations between properties across form elements.
    
    Args:
        form_elements: Dictionary of FormElement instances
        
    Returns:
        List of correlated property pairs
    """
    correlations = []
    
    # Collect all property time series
    all_properties = []
    for form_id, form in form_elements.items():
        for property_name, values in form.properties.values.items():
            try:
                numeric_values = [float(v) for v in values]
                if len(numeric_values) >= 3:
                    all_properties.append({
                        'form_id': form_id,
                        'property_name': property_name,
                        'values': numeric_values
                    })
            except (ValueError, TypeError):
                continue
    
    # Compute pairwise correlations
    for i in range(len(all_properties)):
        for j in range(i + 1, len(all_properties)):
            prop1 = all_properties[i]
            prop2 = all_properties[j]
            
            # Compute correlation if same length
            if len(prop1['values']) == len(prop2['values']):
                correlation = _compute_correlation(prop1['values'], prop2['values'])
                
                if abs(correlation) > 0.7:  # Strong correlation
                    correlations.append({
                        'property1': f"{prop1['form_id']}.{prop1['property_name']}",
                        'property2': f"{prop2['form_id']}.{prop2['property_name']}",
                        'correlation': correlation,
                        'strength': 'strong' if abs(correlation) > 0.9 else 'moderate'
                    })
    
    # Sort by correlation strength
    correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    return correlations


def _compute_linear_trend(values: List[Any]) -> Optional[Dict[str, Any]]:
    """
    Compute linear trend using simple regression.
    
    Args:
        values: List of values
        
    Returns:
        Trend information or None
    """
    try:
        numeric_values = [float(v) for v in values]
        n = len(numeric_values)
        
        if n < 2:
            return None
        
        # Simple linear regression: y = mx + b
        x = list(range(n))
        x_mean = sum(x) / n
        y_mean = sum(numeric_values) / n
        
        # Calculate slope
        numerator = sum((x[i] - x_mean) * (numeric_values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return None
        
        slope = numerator / denominator
        intercept = y_mean - slope * x_mean
        
        # Determine trend direction
        if abs(slope) < 0.01:
            direction = 'stable'
        elif slope > 0:
            direction = 'increasing'
        else:
            direction = 'decreasing'
        
        # Calculate rate of change (percentage)
        if y_mean != 0:
            rate_of_change = (slope / y_mean) * 100
        else:
            rate_of_change = 0.0
        
        return {
            'direction': direction,
            'slope': slope,
            'intercept': intercept,
            'rate_of_change_percent': rate_of_change
        }
    
    except (ValueError, TypeError, ZeroDivisionError):
        return None


def _simple_forecast(values: List[Any], horizon: int) -> Optional[List[float]]:
    """
    Simple linear extrapolation forecast.
    
    Args:
        values: Historical values
        horizon: Number of steps to forecast
        
    Returns:
        Forecasted values or None
    """
    try:
        numeric_values = [float(v) for v in values]
        n = len(numeric_values)
        
        if n < 2:
            return None
        
        # Compute trend
        trend = _compute_linear_trend(values)
        if not trend:
            return None
        
        slope = trend['slope']
        intercept = trend['intercept']
        
        # Forecast future values
        forecast = []
        for i in range(n, n + horizon):
            predicted = slope * i + intercept
            forecast.append(predicted)
        
        return forecast
    
    except (ValueError, TypeError):
        return None


def _compute_basic_stats(values: List[float]) -> Dict[str, float]:
    """
    Compute basic statistical measures.
    
    Args:
        values: List of numeric values
        
    Returns:
        Dictionary of statistics
    """
    n = len(values)
    
    if n == 0:
        return {}
    
    mean = sum(values) / n
    
    variance = sum((x - mean) ** 2 for x in values) / n
    std = variance ** 0.5
    
    sorted_values = sorted(values)
    
    # Median
    if n % 2 == 0:
        median = (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / 2
    else:
        median = sorted_values[n // 2]
    
    return {
        'mean': mean,
        'median': median,
        'std': std,
        'variance': variance,
        'min': min(values),
        'max': max(values),
        'range': max(values) - min(values),
        'count': n
    }


def _compute_correlation(values1: List[float], values2: List[float]) -> float:
    """
    Compute Pearson correlation coefficient.
    
    Args:
        values1: First time series
        values2: Second time series
        
    Returns:
        Correlation coefficient (-1 to 1)
    """
    n = len(values1)
    
    if n != len(values2) or n == 0:
        return 0.0
    
    mean1 = sum(values1) / n
    mean2 = sum(values2) / n
    
    numerator = sum((values1[i] - mean1) * (values2[i] - mean2) for i in range(n))
    
    sum_sq1 = sum((values1[i] - mean1) ** 2 for i in range(n))
    sum_sq2 = sum((values2[i] - mean2) ** 2 for i in range(n))
    
    denominator = (sum_sq1 * sum_sq2) ** 0.5
    
    if denominator == 0:
        return 0.0
    
    return numerator / denominator
