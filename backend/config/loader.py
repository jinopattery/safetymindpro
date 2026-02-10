"""
Domain Configuration Loader

Loads styling and configuration from YAML files for domains.
"""

import yaml
import os
from typing import Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class DomainConfigLoader:
    """
    Loads domain configuration from YAML files.
    
    Configuration files should be placed in backend/config/domains/
    """
    
    def __init__(self, config_dir: Optional[str] = None):
        """
        Initialize config loader
        
        Args:
            config_dir: Directory containing config files. If None, uses default.
        """
        if config_dir:
            self.config_dir = Path(config_dir)
        else:
            # Default to backend/config/domains/
            current_file = Path(__file__)
            backend_dir = current_file.parent.parent
            self.config_dir = backend_dir / "config" / "domains"
        
        self._configs: Dict[str, Dict[str, Any]] = {}
        self._load_all_configs()
    
    def _load_all_configs(self):
        """Load all YAML config files from the config directory"""
        if not self.config_dir.exists():
            logger.warning(f"Config directory not found: {self.config_dir}")
            return
        
        for config_file in self.config_dir.glob("*.yaml"):
            try:
                domain_name = config_file.stem
                with open(config_file, 'r') as f:
                    config = yaml.safe_load(f)
                    self._configs[domain_name] = config
                    logger.info(f"Loaded config for domain: {domain_name}")
            except Exception as e:
                logger.error(f"Failed to load config {config_file}: {e}")
    
    def get_config(self, domain_name: str) -> Optional[Dict[str, Any]]:
        """
        Get configuration for a domain
        
        Args:
            domain_name: Name of the domain
            
        Returns:
            Configuration dictionary or None if not found
        """
        return self._configs.get(domain_name)
    
    def get_styling_config(self, domain_name: str) -> Optional[Dict[str, Any]]:
        """
        Get styling configuration for a domain
        
        Args:
            domain_name: Name of the domain
            
        Returns:
            Styling configuration or None
        """
        config = self.get_config(domain_name)
        if not config:
            return None
        
        return {
            "node_styles": config.get("node_styles", {}),
            "edge_styles": config.get("edge_styles", {}),
            "theme": config.get("theme", {})
        }
    
    def get_theme(self, domain_name: str) -> Optional[Dict[str, Any]]:
        """
        Get theme configuration for a domain
        
        Args:
            domain_name: Name of the domain
            
        Returns:
            Theme configuration or None
        """
        config = self.get_config(domain_name)
        return config.get("theme") if config else None
    
    def get_node_style(self, domain_name: str, node_type: str) -> Optional[Dict[str, Any]]:
        """
        Get node style for a specific type
        
        Args:
            domain_name: Name of the domain
            node_type: Type of node
            
        Returns:
            Node style configuration or None
        """
        config = self.get_config(domain_name)
        if not config:
            return None
        
        node_styles = config.get("node_styles", {})
        return node_styles.get(node_type)
    
    def get_edge_style(self, domain_name: str, edge_type: str) -> Optional[Dict[str, Any]]:
        """
        Get edge style for a specific type
        
        Args:
            domain_name: Name of the domain
            edge_type: Type of edge
            
        Returns:
            Edge style configuration or None
        """
        config = self.get_config(domain_name)
        if not config:
            return None
        
        edge_styles = config.get("edge_styles", {})
        return edge_styles.get(edge_type)
    
    def reload_config(self, domain_name: str) -> bool:
        """
        Reload configuration for a domain
        
        Args:
            domain_name: Name of the domain
            
        Returns:
            True if reloaded successfully, False otherwise
        """
        config_file = self.config_dir / f"{domain_name}.yaml"
        
        if not config_file.exists():
            logger.error(f"Config file not found: {config_file}")
            return False
        
        try:
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
                self._configs[domain_name] = config
                logger.info(f"Reloaded config for domain: {domain_name}")
                return True
        except Exception as e:
            logger.error(f"Failed to reload config for {domain_name}: {e}")
            return False
    
    def list_available_configs(self) -> list[str]:
        """
        List all available domain configurations
        
        Returns:
            List of domain names
        """
        return list(self._configs.keys())
    
    def save_config(self, domain_name: str, config: Dict[str, Any]) -> bool:
        """
        Save configuration for a domain
        
        Args:
            domain_name: Name of the domain
            config: Configuration to save
            
        Returns:
            True if saved successfully, False otherwise
        """
        config_file = self.config_dir / f"{domain_name}.yaml"
        
        try:
            # Create directory if it doesn't exist
            self.config_dir.mkdir(parents=True, exist_ok=True)
            
            with open(config_file, 'w') as f:
                yaml.dump(config, f, default_flow_style=False, sort_keys=False)
            
            # Update in-memory cache
            self._configs[domain_name] = config
            logger.info(f"Saved config for domain: {domain_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to save config for {domain_name}: {e}")
            return False


# Global config loader instance
config_loader = DomainConfigLoader()


def get_domain_config(domain_name: str) -> Optional[Dict[str, Any]]:
    """
    Convenience function to get domain configuration
    
    Args:
        domain_name: Name of the domain
        
    Returns:
        Configuration dictionary or None
    """
    return config_loader.get_config(domain_name)


def get_domain_styling(domain_name: str) -> Optional[Dict[str, Any]]:
    """
    Convenience function to get domain styling configuration
    
    Args:
        domain_name: Name of the domain
        
    Returns:
        Styling configuration or None
    """
    return config_loader.get_styling_config(domain_name)
