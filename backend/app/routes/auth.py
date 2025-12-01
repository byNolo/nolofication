"""Authentication routes."""
from flask import Blueprint, request, jsonify, current_app
import requests
from app import db
from app.models import User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def verify_keyn_token(token):
    """
    Verify KeyN OAuth token by calling KeyN's user-scoped endpoint.
    
    Args:
        token: OAuth access token from KeyN
        
    Returns:
        dict: User data from KeyN
        
    Raises:
        Exception: If token is invalid or request fails
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
        else:
            raise Exception(f"Invalid token: {response.status_code}")
            
    except requests.RequestException as e:
        raise Exception(f"Failed to verify token with KeyN: {str(e)}")


def get_or_create_user(keyn_data):
    """
    Get or create user from KeyN data.
    
    Args:
        keyn_data: User data from KeyN OAuth
        
    Returns:
        User: User model instance
    """
    # KeyN returns 'id' field for user ID
    keyn_user_id = str(keyn_data.get('id'))
    
    user = User.query.filter_by(keyn_user_id=keyn_user_id).first()
    
    if not user:
        user = User(
            keyn_user_id=keyn_user_id,
            username=keyn_data.get('username', ''),
            email=keyn_data.get('email', '')
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update user info if changed
        if keyn_data.get('username'):
            user.username = keyn_data['username']
        if keyn_data.get('email'):
            user.email = keyn_data['email']
        db.session.commit()
    
    return user


@bp.route('/oauth/callback', methods=['POST'])
def oauth_callback():
    """
    Handle OAuth callback - exchange code for token.
    This proxies the request to KeyN to avoid CORS issues.
    
    Request body:
    {
        "code": "authorization_code",
        "redirect_uri": "https://nolofication.bynolo.ca/auth/callback"
    }
    
    Returns:
    {
        "token": "access_token",
        "user": {...}
    }
    """
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({'error': 'Authorization code is required'}), 400
    
    code = data['code']
    redirect_uri = data.get('redirect_uri', request.headers.get('Origin', '') + '/auth/callback')
    
    # Get KeyN OAuth credentials from env
    client_id = current_app.config.get('KEYN_CLIENT_ID')
    client_secret = current_app.config.get('KEYN_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        return jsonify({'error': 'OAuth credentials not configured'}), 500
    
    try:
        # Exchange code for token with KeyN
        token_response = requests.post(
            f"{current_app.config['KEYN_BASE_URL']}/oauth/token",
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri
            },
            verify=current_app.config['KEYN_VERIFY_SSL'],
            timeout=10
        )
        
        if token_response.status_code != 200:
            error_data = token_response.json() if token_response.headers.get('content-type', '').startswith('application/json') else {}
            return jsonify({
                'error': error_data.get('error', 'token_exchange_failed'),
                'error_description': error_data.get('error_description', 'Failed to exchange code for token')
            }), token_response.status_code
        
        token_data = token_response.json()
        access_token = token_data['access_token']
        
        # Verify token and get user data
        keyn_data = verify_keyn_token(access_token)
        
        # Get or create user
        user = get_or_create_user(keyn_data)
        
        return jsonify({
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"OAuth callback error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/login', methods=['POST'])
def login():
    """
    Login with KeyN OAuth token.
    Verifies the token with KeyN and creates/updates the user.
    
    Request body:
    {
        "token": "oauth_access_token_from_keyn"
    }
    
    Returns:
    {
        "token": "same_oauth_token",
        "user": {
            "id": 1,
            "keyn_user_id": "123",
            "username": "john",
            "email": "john@example.com"
        }
    }
    """
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'error': 'Token is required'}), 400
    
    token = data['token']
    
    try:
        # Verify the token with KeyN
        keyn_data = verify_keyn_token(token)
        
        # Get or create user
        user = get_or_create_user(keyn_data)
        
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401


@bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Get current user information from OAuth token.
    
    Requires Authorization header with Bearer token.
    
    Returns:
    {
        "id": 1,
        "keyn_user_id": "123",
        "username": "john",
        "email": "john@example.com"
    }
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization header required'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify the token with KeyN
        keyn_data = verify_keyn_token(token)
        
        # Get or create user
        user = get_or_create_user(keyn_data)
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401


@bp.route('/verify', methods=['POST'])
def verify_token():
    """
    Verify if a token is valid.
    
    Request body:
    {
        "token": "oauth_access_token"
    }
    
    Returns:
    {
        "valid": true,
        "user": {...}
    }
    """
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'error': 'Token is required'}), 400
    
    token = data['token']
    
    try:
        keyn_data = verify_keyn_token(token)
        user = get_or_create_user(keyn_data)
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'valid': False,
            'error': str(e)
        }), 401


@bp.route('/discord/authorize', methods=['GET'])
def discord_authorize():
    """
    Get Discord OAuth2 authorization URL.
    
    Returns URL for user to authorize Discord access.
    """
    client_id = current_app.config['DISCORD_CLIENT_ID']
    redirect_uri = current_app.config['DISCORD_REDIRECT_URI']
    
    if not client_id:
        return jsonify({'error': 'Discord OAuth not configured'}), 500
    
    # Discord OAuth2 URL with 'identify' scope to get user ID
    auth_url = (
        f"https://discord.com/api/oauth2/authorize"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope=identify"
    )
    
    return jsonify({'url': auth_url}), 200


@bp.route('/discord/callback', methods=['POST'])
def discord_callback():
    """
    Handle Discord OAuth2 callback.
    
    Request body:
    {
        "code": "oauth_code_from_discord"
    }
    
    Returns user's Discord ID and saves it to their profile.
    """
    from app.utils.auth import verify_keyn_token, get_or_create_user
    from app.models import UserPreference
    
    # Get KeyN token from Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No authorization header provided'}), 401
    
    try:
        parts = auth_header.split()
        if len(parts) != 2:
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        keyn_token = parts[1]
        keyn_user_data = verify_keyn_token(keyn_token)
        user = get_or_create_user(keyn_user_data)
    except Exception as e:
        return jsonify({'error': 'Authentication failed'}), 401
    
    # Get Discord OAuth code
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'error': 'Authorization code is required'}), 400
    
    code = data['code']
    
    try:
        # Exchange code for access token
        token_response = requests.post(
            'https://discord.com/api/v10/oauth2/token',
            data={
                'client_id': current_app.config['DISCORD_CLIENT_ID'],
                'client_secret': current_app.config['DISCORD_CLIENT_SECRET'],
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': current_app.config['DISCORD_REDIRECT_URI']
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        
        if token_response.status_code != 200:
            return jsonify({'error': 'Failed to exchange Discord code'}), 400
        
        tokens = token_response.json()
        access_token = tokens['access_token']
        
        # Get user info from Discord
        user_response = requests.get(
            'https://discord.com/api/v10/users/@me',
            headers={'Authorization': f"Bearer {access_token}"},
            timeout=10
        )
        
        if user_response.status_code != 200:
            return jsonify({'error': 'Failed to get Discord user info'}), 400
        
        discord_user = user_response.json()
        discord_id = discord_user['id']
        discord_username = discord_user.get('username', '')
        
        # Save Discord ID to user preferences
        prefs = UserPreference.query.filter_by(user_id=user.id).first()
        if not prefs:
            prefs = UserPreference(user_id=user.id)
            db.session.add(prefs)
        
        prefs.discord_user_id = discord_id
        db.session.commit()
        
        return jsonify({
            'success': True,
            'discord_id': discord_id,
            'discord_username': discord_username,
            'message': 'Discord account linked successfully!'
        }), 200
        
    except requests.RequestException as e:
        current_app.logger.error(f"Discord OAuth error: {str(e)}")
        return jsonify({'error': 'Failed to communicate with Discord'}), 500
    except Exception as e:
        current_app.logger.error(f"Error linking Discord: {str(e)}")
        return jsonify({'error': 'Failed to link Discord account'}), 500


@bp.route('/discord/bot-authorize-url', methods=['GET'])
def get_discord_bot_authorize_url():
    """
    Get Discord bot authorization URL for direct user authorization.
    When users authorize the bot directly, Discord creates a DM channel automatically.
    
    Returns:
    {
        "authorize_url": "https://discord.com/oauth2/authorize?client_id=..."
    }
    """
    client_id = current_app.config.get('DISCORD_CLIENT_ID')
    
    if not client_id:
        return jsonify({'error': 'Discord not configured'}), 500
    
    # Direct bot authorization - creates DM channel automatically
    authorize_url = f"https://discord.com/oauth2/authorize?client_id={client_id}"
    
    return jsonify({
        'authorize_url': authorize_url
    }), 200

