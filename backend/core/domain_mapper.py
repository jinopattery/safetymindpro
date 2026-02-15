"""
Domain Mapper Interface

Defines the contract for mapping domain-specific concepts to the universal
Form-Function-Failure graph structure. Each domain (automotive, financial,
process plant, etc.) implements this interface.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from backend.core.universal_graph import (
    UniversalGraph, FormElement, Function, FailureMode
)


class DomainMapper(ABC):
    """
    Abstract base class for domain mappers.
    
    Maps domain-specific concepts to universal graph structure and
    formats universal results back to domain-specific format.
    """
    
    @property
    @abstractmethod
    def domain_name(self) -> str:
        """
        Unique identifier for this domain
        
        Returns:
            Domain name (e.g., 'automotive', 'process_plant', 'financial')
        """
        pass
    
    @abstractmethod
    def map_to_universal_graph(self, domain_data: Dict[str, Any]) -> UniversalGraph:
        """
        Convert domain-specific data to universal graph
        
        Args:
            domain_data: Domain-specific input data
            
        Returns:
            UniversalGraph instance
        """
        pass
    
    @abstractmethod
    def map_form_element(self, domain_element: Dict[str, Any]) -> FormElement:
        """
        Map domain element to FormElement
        
        Examples:
        - Automotive: Component → FormElement
        - Financial: Account → FormElement
        - Process Plant: Equipment → FormElement
        
        Args:
            domain_element: Domain-specific element data
            
        Returns:
            FormElement instance
        """
        pass
    
    @abstractmethod
    def map_function(self, domain_function: Dict[str, Any]) -> Function:
        """
        Map domain function to Function
        
        Examples:
        - Automotive: "Brake" → Function
        - Financial: "Process Transaction" → Function
        - Process Plant: "Heat Fluid" → Function
        
        Args:
            domain_function: Domain-specific function data
            
        Returns:
            Function instance
        """
        pass
    
    @abstractmethod
    def map_failure_mode(self, domain_failure: Dict[str, Any]) -> FailureMode:
        """
        Map domain failure to FailureMode
        
        Examples:
        - Automotive: FMEA entry → FailureMode
        - Financial: Fraud risk → FailureMode
        - Process Plant: Overpressure → FailureMode
        
        Args:
            domain_failure: Domain-specific failure data
            
        Returns:
            FailureMode instance
        """
        pass
    
    @abstractmethod
    def format_results(self, results: Dict[str, Any], graph: UniversalGraph) -> Dict[str, Any]:
        """
        Format universal results back to domain-specific format
        
        Args:
            results: Universal algorithm results
            graph: UniversalGraph that was analyzed
            
        Returns:
            Domain-specific formatted results
        """
        pass
    
    def validate_domain_data(self, domain_data: Dict[str, Any]) -> bool:
        """
        Validate domain-specific input data
        
        Optional method that domains can override for custom validation.
        
        Args:
            domain_data: Domain-specific data to validate
            
        Returns:
            True if valid, False otherwise
        """
        return True
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get domain metadata
        
        Optional method that domains can override to provide additional metadata.
        
        Returns:
            Dictionary of metadata
        """
        return {
            'domain': self.domain_name,
            'version': '1.0'
        }
