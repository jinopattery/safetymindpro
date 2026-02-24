"""
Configuration management for SafetyMindPro
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "SafetyMindPro"
    app_version: str = "1.0.0"
    environment: str = "development"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./safetymindpro.db"
    
    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Logging
    log_level: str = "INFO"
    
    # Email Verification
    email_verification_required: bool = True
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    app_base_url: str = "http://localhost:3000"

    # Domain isolation: comma-separated list of domain names to expose.
    # When empty (default) all registered domains are available.
    # Example: ENABLED_DOMAINS=automotive  or  ENABLED_DOMAINS=finance,financial
    enabled_domains: str = ""

    # GDPR / Privacy
    privacy_policy_version: str = "1.0"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()