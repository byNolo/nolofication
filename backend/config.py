"""Configuration module for Nolofication backend."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///nolofication.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # KeyN OAuth
    KEYN_BASE_URL = os.getenv('KEYN_BASE_URL', 'https://auth-keyn.bynolo.ca')
    KEYN_JWT_PUBLIC_KEY_URL = os.getenv('KEYN_JWT_PUBLIC_KEY_URL', 
                                         'https://auth-keyn.bynolo.ca/api/public-key')
    KEYN_VERIFY_SSL = os.getenv('KEYN_VERIFY_SSL', 'true').lower() == 'true'
    KEYN_CLIENT_ID = os.getenv('KEYN_CLIENT_ID', '')
    KEYN_CLIENT_SECRET = os.getenv('KEYN_CLIENT_SECRET', '')
    
    # Email (SMTP)
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', 'noreply@bynolo.ca')
    SMTP_FROM_NAME = os.getenv('SMTP_FROM_NAME', 'Nolofication')
    
    # Web Push (VAPID)
    VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
    VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', '')
    VAPID_SUBJECT = os.getenv('VAPID_SUBJECT', 'mailto:admin@bynolo.ca')
    
    # Discord
    DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN', '')
    DISCORD_CLIENT_ID = os.getenv('DISCORD_CLIENT_ID', '')
    DISCORD_CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET', '')
    DISCORD_REDIRECT_URI = os.getenv('DISCORD_REDIRECT_URI', 'https://nolofication.bynolo.ca/auth/discord/callback')
    
    # Rate Limiting
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
    RATE_LIMIT_STORAGE_URL = os.getenv('RATE_LIMIT_STORAGE_URL', 'memory://')
    
    # Admin
    ADMIN_API_KEY = os.getenv('ADMIN_API_KEY', 'admin-key-change-in-production')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Server
    PORT = int(os.getenv('PORT', '5005'))
    HOST = os.getenv('HOST', '0.0.0.0')
    
    # Proxy Trust (for Cloudflare Tunnel + NPM)
    TRUST_PROXY = os.getenv('TRUST_PROXY', 'false').lower() == 'true'


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
