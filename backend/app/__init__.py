"""Nolofication Flask application initialization."""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from config import config

# Initialize extensions
db = SQLAlchemy()

def get_real_ip():
    """Get real client IP from proxy headers."""
    from flask import request
    # Try X-Forwarded-For first (from Cloudflare/NPM)
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    # Fallback to X-Real-IP
    if request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    # Fallback to remote_addr
    return request.remote_addr

limiter = Limiter(
    key_func=get_real_ip,
    default_limits=["200 per day", "50 per hour"]
)


def create_app(config_name='default'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Trust proxy headers (Cloudflare + NPM setup)
    # This ensures we get the real client IP and proper scheme (https)
    if app.config.get('TRUST_PROXY', False):
        app.wsgi_app = ProxyFix(
            app.wsgi_app,
            x_for=2,  # Number of proxies (Cloudflare + NPM)
            x_proto=1,
            x_host=1,
            x_prefix=1
        )
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    if app.config['RATE_LIMIT_ENABLED']:
        limiter.init_app(app)
    
    # Register blueprints
    from app.routes import preferences, notifications, sites, admin, webpush, auth, categories
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(preferences.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(sites.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(webpush.bp)
    app.register_blueprint(categories.bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'nolofication'}, 200
    
    # API health check endpoint
    @app.route('/api/health')
    def api_health_check():
        return {'status': 'healthy', 'service': 'nolofication-api'}, 200
    
    return app
