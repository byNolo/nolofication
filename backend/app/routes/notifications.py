"""Notification sending routes."""
from flask import Blueprint, request, jsonify, current_app
from app import db, limiter
from app.models import User, Site, PendingNotification
from app.utils.auth import require_site_auth
from app.services.notification_service import NotificationService
from datetime import datetime

bp = Blueprint('notifications', __name__, url_prefix='/api')


@bp.route('/sites/<site_id>/notify', methods=['POST'])
@require_site_auth
@limiter.limit("100 per hour")
def send_notification(site, site_id):
    """
    Send a notification from a registered site.
    
    Request body should contain:
    - user_id: KeyN user ID (or user_ids for bulk)
    - title: Notification title
    - message: Notification message (plain text, required)
    - type: Notification type (optional, default: 'info')
    - html_message: HTML version of message (optional, for email)
    - metadata: Additional data (optional, dict)
    """
    # Verify site_id matches the authenticated site
    if site.site_id != site_id:
        return jsonify({'error': 'Site ID mismatch'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    if 'title' not in data or 'message' not in data:
        return jsonify({'error': 'Missing required fields: title, message'}), 400
    
    title = data['title']
    message = data['message']
    notification_type = data.get('type', 'info')
    category_key = data.get('category')  # Optional category for scheduling
    html_message = data.get('html_message')
    metadata = data.get('metadata')
    
    # Validate notification type
    valid_types = ['info', 'success', 'warning', 'error']
    if notification_type not in valid_types:
        return jsonify({'error': f'Invalid type. Must be one of: {", ".join(valid_types)}'}), 400
    
    # Check if bulk or single user
    if 'user_ids' in data:
        # Bulk notification
        user_ids = data['user_ids']
        
        if not isinstance(user_ids, list):
            return jsonify({'error': 'user_ids must be an array'}), 400
        
        if len(user_ids) == 0:
            return jsonify({'error': 'user_ids cannot be empty'}), 400
        
        if len(user_ids) > 1000:
            return jsonify({'error': 'Maximum 1000 users per bulk notification'}), 400
        
        results = NotificationService.send_bulk_notification(
            site, user_ids, title, message, notification_type,
            category_key=category_key, html_message=html_message, metadata=metadata
        )
        
        return jsonify(results), 200
        
    elif 'user_id' in data:
        # Single user notification
        keyn_user_id = str(data['user_id'])
        
        user = User.query.filter_by(keyn_user_id=keyn_user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        status = NotificationService.send_notification(
            user, site, title, message, notification_type,
            category_key=category_key, html_message=html_message, metadata=metadata
        )
        
        return jsonify({
            'message': 'Notification sent',
            'user_id': keyn_user_id,
            'channels': status
        }), 200
    
    else:
        return jsonify({'error': 'Either user_id or user_ids must be provided'}), 400


@bp.route('/notifications', methods=['GET'])
def get_notification_history():
    """
    Get notification history for the authenticated user.
    
    Query parameters:
    - limit: Number of notifications to return (default: 50, max: 100)
    - offset: Pagination offset (default: 0)
    - site_id: Filter by site (optional)
    """
    from app.utils.auth import require_auth
    from app.models import Notification
    
    # This would normally use @require_auth decorator,
    # but we'll do it manually to access user
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    try:
        from app.utils.auth import verify_keyn_token, get_or_create_user
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        token = parts[1]
        keyn_user_data = verify_keyn_token(token)
        user = get_or_create_user(keyn_user_data)
        
    except Exception as e:
        return jsonify({'error': 'Authentication failed'}), 401
    
    # Parse query parameters
    limit = min(int(request.args.get('limit', 50)), 100)
    offset = int(request.args.get('offset', 0))
    site_id = request.args.get('site_id')
    
    # Build query
    query = Notification.query.filter_by(user_id=user.id)
    
    if site_id:
        site = Site.query.filter_by(site_id=site_id).first()
        if site:
            query = query.filter_by(site_id=site.id)
    
    # Get total count
    total = query.count()
    
    # Get notifications with pagination
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset).all()
    
    return jsonify({
        'total': total,
        'limit': limit,
        'offset': offset,
        'notifications': [n.to_dict() for n in notifications]
    }), 200


@bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    from app.utils.auth import require_auth
    from app.models import Notification
    
    # Manual auth check to access user
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    try:
        from app.utils.auth import verify_keyn_token, get_or_create_user
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        token = parts[1]
        keyn_user_data = verify_keyn_token(token)
        user = get_or_create_user(keyn_user_data)
        
    except Exception as e:
        return jsonify({'error': 'Authentication failed'}), 401
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user.id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'}), 200


@bp.route('/notifications/test', methods=['POST'])
def send_test_notification():
    """Send a test notification to the authenticated user."""
    from app.utils.auth import verify_keyn_token, get_or_create_user
    
    # Manual auth check
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    try:
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        token = parts[1]
        keyn_user_data = verify_keyn_token(token)
        user = get_or_create_user(keyn_user_data)
    except Exception as e:
        return jsonify({'error': 'Authentication failed'}), 401
    
    data = request.get_json() or {}
    channel = data.get('channel', 'all')
    
    # Validate channel
    valid_channels = ['email', 'web_push', 'discord', 'webhook', 'all']
    if channel not in valid_channels:
        return jsonify({'error': f'Invalid channel. Must be one of: {", ".join(valid_channels)}'}), 400
    
    # Get user preferences
    from app.models import UserPreference
    prefs = UserPreference.query.filter_by(user_id=user.id).first()
    if not prefs:
        prefs = UserPreference(user_id=user.id)
        db.session.add(prefs)
        db.session.commit()
    
    # Create a test site for this notification
    test_site = Site.query.filter_by(site_id='nolofication-test').first()
    if not test_site:
        test_site = Site(
            site_id='nolofication-test',
            name='Nolofication Test',
            description='Internal test site',
            api_key=Site.generate_api_key(),
            is_active=True,
            is_approved=True,
            creator_keyn_id=user.keyn_user_id
        )
        db.session.add(test_site)
        db.session.commit()
    
    # Temporarily enable the specific channel for testing
    original_prefs = {
        'email': prefs.email_enabled,
        'web_push': prefs.web_push_enabled,
        'discord': prefs.discord_enabled,
        'webhook': prefs.webhook_enabled
    }
    
    if channel != 'all':
        # Disable all channels except the one being tested
        prefs.email_enabled = (channel == 'email')
        prefs.web_push_enabled = (channel == 'web_push')
        prefs.discord_enabled = (channel == 'discord')
        prefs.webhook_enabled = (channel == 'webhook')
        db.session.commit()
    
    # Send test notification
    notification_service = NotificationService()
    result = notification_service.send_notification(
        user=user,
        site=test_site,
        title='Test Notification',
        message=f'This is a test notification via {channel}!',
        notification_type='info',
        html_message=f'<h2>Test Notification</h2><p>This is a test notification via <strong>{channel}</strong>!</p>'
    )
    
    # Restore original preferences
    prefs.email_enabled = original_prefs['email']
    prefs.web_push_enabled = original_prefs['web_push']
    prefs.discord_enabled = original_prefs['discord']
    prefs.webhook_enabled = original_prefs['webhook']
    db.session.commit()
    
    return jsonify({
        'message': f'Test notification sent via {channel}',
        'result': result
    }), 200


@bp.route('/sites/<site_id>/pending-notifications', methods=['GET'])
@require_site_auth
def list_pending_notifications(site, site_id):
    """
    List pending (scheduled but not yet sent) notifications for a site.
    
    Query parameters:
    - user_id: Filter by KeyN user ID (optional)
    - category: Filter by category key (optional)
    - limit: Max results (default 100, max 1000)
    - offset: Pagination offset (default 0)
    
    Returns:
        JSON array of pending notifications with details
    """
    # Verify site_id matches
    if site.site_id != site_id:
        return jsonify({'error': 'Site ID mismatch'}), 403
    
    # Build query
    query = PendingNotification.query.filter_by(
        site_id=site.id,
        cancelled_at=None
    )
    
    # Filter by user if specified
    user_id_filter = request.args.get('user_id')
    if user_id_filter:
        user = User.query.filter_by(keyn_user_id=str(user_id_filter)).first()
        if user:
            query = query.filter_by(user_id=user.id)
        else:
            return jsonify({'error': 'User not found'}), 404
    
    # Filter by category if specified
    category_filter = request.args.get('category')
    if category_filter:
        query = query.filter_by(category_key=category_filter)
    
    # Pagination
    limit = min(int(request.args.get('limit', 100)), 1000)
    offset = int(request.args.get('offset', 0))
    
    total = query.count()
    pending = query.order_by(PendingNotification.scheduled_for).limit(limit).offset(offset).all()
    
    return jsonify({
        'total': total,
        'limit': limit,
        'offset': offset,
        'pending_notifications': [p.to_dict() for p in pending]
    }), 200


@bp.route('/sites/<site_id>/pending-notifications/<int:notification_id>', methods=['DELETE'])
@require_site_auth
def cancel_pending_notification(site, site_id, notification_id):
    """
    Cancel a pending notification before it's sent.
    
    Use case: User completes an action (e.g., votes) that makes a scheduled
    reminder notification unnecessary.
    
    Args:
        site: Authenticated site
        site_id: Site ID from URL
        notification_id: Pending notification ID to cancel
        
    Returns:
        Success message or error
    """
    # Verify site_id matches
    if site.site_id != site_id:
        return jsonify({'error': 'Site ID mismatch'}), 403
    
    # Find the pending notification
    pending = PendingNotification.query.filter_by(
        id=notification_id,
        site_id=site.id
    ).first()
    
    if not pending:
        return jsonify({'error': 'Pending notification not found'}), 404
    
    # Check if already cancelled
    if pending.cancelled_at:
        return jsonify({'error': 'Notification already cancelled'}), 400
    
    # Mark as cancelled (soft delete for audit trail)
    pending.cancelled_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Pending notification cancelled successfully',
        'notification_id': notification_id
    }), 200
