"""
Domain Registry System

Manages registration and discovery of domain adapters and mappers.
Provides a central registry for all available domains in the system.
"""

from typing import Dict, List, Optional, Type, Union
from backend.domains.base import DomainAdapter, StylingConfig
from backend.core.domain_mapper import DomainMapper
import logging

logger = logging.getLogger(__name__)


class DomainRegistry:
    """
    Singleton registry for domain adapters and mappers.
    
    Manages all registered domains and provides lookup functionality.
    Supports both legacy adapters and new universal mappers.
    """
    
    _instance: Optional['DomainRegistry'] = None
    _domains: Dict[str, DomainAdapter] = {}
    _mappers: Dict[str, DomainMapper] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def register(self, adapter: DomainAdapter) -> None:
        """
        Register a domain adapter (legacy)
        
        Args:
            adapter: Domain adapter instance
        """
        domain_name = adapter.domain_name
        
        if domain_name in self._domains:
            logger.warning(f"Domain '{domain_name}' already registered. Overwriting.")
        
        self._domains[domain_name] = adapter
        logger.info(f"Registered domain adapter: {domain_name} ({adapter.domain_display_name})")
    
    def register_mapper(self, mapper: DomainMapper) -> None:
        """
        Register a domain mapper (new universal architecture)
        
        Args:
            mapper: Domain mapper instance
        """
        domain_name = mapper.domain_name
        
        if domain_name in self._mappers:
            logger.warning(f"Mapper '{domain_name}' already registered. Overwriting.")
        
        self._mappers[domain_name] = mapper
        logger.info(f"Registered domain mapper: {domain_name}")
    
    def get_mapper(self, domain_name: str) -> Optional[DomainMapper]:
        """
        Get a domain mapper by name
        
        Args:
            domain_name: Name of domain
            
        Returns:
            Domain mapper or None if not found
        """
        return self._mappers.get(domain_name)
    
    def list_mappers(self) -> List[str]:
        """
        List all registered mapper domain names
        
        Returns:
            List of domain names with mappers
        """
        return list(self._mappers.keys())
    
    def unregister(self, domain_name: str) -> bool:
        """
        Unregister a domain adapter
        
        Args:
            domain_name: Name of domain to unregister
            
        Returns:
            True if unregistered, False if not found
        """
        if domain_name in self._domains:
            del self._domains[domain_name]
            logger.info(f"Unregistered domain: {domain_name}")
            return True
        return False
    
    def get(self, domain_name: str) -> Optional[DomainAdapter]:
        """
        Get a domain adapter by name
        
        Args:
            domain_name: Name of domain
            
        Returns:
            Domain adapter or None if not found
        """
        return self._domains.get(domain_name)
    
    def list_domains(self) -> List[str]:
        """
        List all registered domain names
        
        Returns:
            List of domain names
        """
        return list(self._domains.keys())
    
    def get_all_domains(self) -> Dict[str, DomainAdapter]:
        """
        Get all registered domain adapters
        
        Returns:
            Dictionary mapping domain names to adapters
        """
        return self._domains.copy()
    
    def get_domain_info(self, domain_name: str) -> Optional[Dict]:
        """
        Get information about a domain
        
        Args:
            domain_name: Name of domain
            
        Returns:
            Domain information dictionary or None
        """
        adapter = self.get(domain_name)
        if not adapter:
            return None
        
        return {
            "name": adapter.domain_name,
            "display_name": adapter.domain_display_name,
            "description": adapter.description,
            "node_types": [nt.dict() for nt in adapter.get_node_types()],
            "edge_types": [et.dict() for et in adapter.get_edge_types()],
            "algorithms": [
                {"name": algo.name, "description": algo.description}
                for algo in adapter.get_algorithms()
            ],
            "export_formats": adapter.get_export_formats()
        }
    
    def get_all_domain_info(self) -> List[Dict]:
        """
        Get information about all registered domains
        
        Returns:
            List of domain information dictionaries
        """
        return [
            self.get_domain_info(name)
            for name in self.list_domains()
        ]
    
    def get_styling_config(self, domain_name: str) -> Optional[StylingConfig]:
        """
        Get styling configuration for a domain
        
        Args:
            domain_name: Name of domain
            
        Returns:
            Styling configuration or None
        """
        adapter = self.get(domain_name)
        return adapter.get_styling_config() if adapter else None
    
    def validate_node(self, domain_name: str, node_data: Dict) -> bool:
        """
        Validate a node against domain rules
        
        Args:
            domain_name: Name of domain
            node_data: Node data to validate
            
        Returns:
            True if valid, False otherwise
        """
        adapter = self.get(domain_name)
        if not adapter:
            logger.error(f"Domain '{domain_name}' not found")
            return False
        
        return adapter.validate_node(node_data)
    
    def validate_edge(self, domain_name: str, edge_data: Dict) -> bool:
        """
        Validate an edge against domain rules
        
        Args:
            domain_name: Name of domain
            edge_data: Edge data to validate
            
        Returns:
            True if valid, False otherwise
        """
        adapter = self.get(domain_name)
        if not adapter:
            logger.error(f"Domain '{domain_name}' not found")
            return False
        
        return adapter.validate_edge(edge_data)


# Global registry instance
registry = DomainRegistry()


def register_domain(adapter: DomainAdapter) -> None:
    """
    Convenience function to register a domain adapter (legacy)
    
    Args:
        adapter: Domain adapter instance
    """
    registry.register(adapter)


def register_mapper(mapper: DomainMapper) -> None:
    """
    Convenience function to register a domain mapper (new)
    
    Args:
        mapper: Domain mapper instance
    """
    registry.register_mapper(mapper)


def get_domain(domain_name: str) -> Optional[DomainAdapter]:
    """
    Convenience function to get a domain adapter
    
    Args:
        domain_name: Name of domain
        
    Returns:
        Domain adapter or None
    """
    return registry.get(domain_name)


def get_mapper(domain_name: str) -> Optional[DomainMapper]:
    """
    Convenience function to get a domain mapper
    
    Args:
        domain_name: Name of domain
        
    Returns:
        Domain mapper or None
    """
    return registry.get_mapper(domain_name)


def list_domains() -> List[str]:
    """
    Convenience function to list all domains
    
    Returns:
        List of domain names
    """
    return registry.list_domains()
