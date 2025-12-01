"""Authentication utilities for KeyN OAuth integration."""
import requests
from functools import wraps
from flask import request, jsonify, current_app
from app import db
from app.models import User


class KeyNAuthError(Exception):
    """Custom exception for KeyN authentication errors."""
    pass


def verify_keyn_token(token):
    """
    Verify a KeyN OAuth token by calling KeyN's user-scoped endpoint.
    
    Args:
        token: OAuth access token string
        
    Returns:
        dict: User data from KeyN
        
    Raises:
        KeyNAuthError: If token is invalid
    """
    try:
        response = requests.get(
            f"{current_app.config['KEYN_BASE_URL']}/api/user-scoped",
            headers={'Authorization': f'Bearer {token}'},
            verify=current_app.config['KEYN_VERIFY_SSL'],
            timeout=5
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            raise KeyNAuthError("Invalid or expired token")
        else:
            raise KeyNAuthError(f"Token verification failed: {response.status_code}")
            
    except requests.RequestException as e:
        raise KeyNAuthError(f"Failed to verify token with KeyN: {str(e)}")


def get_or_create_user(keyn_user_data):
    """
    Get or create a user based on KeyN data.
    
    Args:
        keyn_user_data: Dictionary containing user data from KeyN OAuth
        
    Returns:
        User: User model instance
    """
    # KeyN returns 'id' field for user ID
    keyn_user_id = str(keyn_user_data.get('id'))
    
    user = User.query.filter_by(keyn_user_id=keyn_user_id).first()
    
    if not user:
        user = User(
            keyn_user_id=keyn_user_id,
            username=keyn_user_data.get('username', ''),
            email=keyn_user_data.get('email', '')
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update user info if changed
        if keyn_user_data.get('username'):
            user.username = keyn_user_data['username']
        if keyn_user_data.get('email'):
            user.email = keyn_user_data['email']
        db.session.commit()
    
    return user


def require_auth(f):
    """
    Decorator to require KeyN authentication.
    
    Verifies the OAuth token from the Authorization header and injects
    the user object into the decorated function.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        current_app.logger.info(f"[AUTH] Request to {request.path}, has auth header: {bool(auth_header)}")
        
        if not auth_header or not auth_header.startswith('Bearer '):
            current_app.logger.warning("[AUTH] No valid authorization header")
            return jsonify({'error': 'No authorization header provided'}), 401
        
        try:
            # Extract token
            parts = auth_header.split()
            if len(parts) != 2:
                current_app.logger.warning("[AUTH] Invalid header format")
                return jsonify({'error': 'Invalid authorization header format'}), 401
            
            token = parts[1]
            current_app.logger.info(f"[AUTH] Verifying token: {token[:20]}...")
            
            # Verify token and get user data from KeyN
            keyn_user_data = verify_keyn_token(token)
            current_app.logger.info(f"[AUTH] Token verified for user: {keyn_user_data.get('username')}")
            
            # Get or create user in our database
            user = get_or_create_user(keyn_user_data)
            
            # Inject user into the function
            return f(user=user, *args, **kwargs)
            
        except KeyNAuthError as e:
            current_app.logger.error(f"[AUTH] KeyN auth error: {str(e)}")
            return jsonify({'error': str(e)}), 401
        except Exception as e:
            current_app.logger.error(f"[AUTH] Authentication error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function


def require_site_auth(f):
    """
    Decorator to require site API key authentication.
    
    Verifies the API key from the X-API-Key header and injects
    the site object into the decorated function.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.models import Site
        
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'No API key provided'}), 401
        
        site = Site.query.filter_by(api_key=api_key).first()
        
        if not site:
            return jsonify({'error': 'Invalid API key'}), 401
        
        if not site.is_active:
            return jsonify({'error': 'Site is not active'}), 403
        
        if not site.is_approved:
            return jsonify({'error': 'Site is not approved'}), 403
        
        # Inject site into the function
        return f(site=site, *args, **kwargs)
    
    return decorated_function


def require_admin_auth(f):
    """
    Decorator to require admin authentication.
    User must be logged in via KeyN and be user ID 1 (Sam).
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
        
        token = token.split(' ')[1]
        
        # Verify KeyN token
        try:
            payload = verify_keyn_token(token)
        except Exception as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        
        # KeyN returns 'id' field, not 'sub'
        keyn_user_id = str(payload.get('id'))
        username = payload.get('username')
        
        # Debug logging
        current_app.logger.info(f"Admin auth check: keyn_user_id={keyn_user_id}, username={username}")
        current_app.logger.info(f"Check result: keyn_user_id != '1': {keyn_user_id != '1'}, username.lower() != 'sam': {username.lower() != 'sam'}")
        
        # Check if user is admin (KeyN user ID 1, username Sam)
        if keyn_user_id != '1' or username.lower() != 'sam':
            current_app.logger.warning(f"Admin access denied for user {username} (ID: {keyn_user_id})")
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get or create user in database
        from app.models import User
        user = User.query.filter_by(keyn_user_id=keyn_user_id).first()
        if not user:
            user = User(
                keyn_user_id=keyn_user_id,
                username=username,
                email=payload.get('email')
            )
            db.session.add(user)
            db.session.commit()
        
        return f(user=user, *args, **kwargs)
    
    return decorated_function
