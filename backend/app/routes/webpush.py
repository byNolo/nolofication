"""Web push subscription routes."""
from flask import Blueprint, request, jsonify
from app import db
from app.models import WebPushSubscription
from app.utils.auth import require_auth

bp = Blueprint('webpush', __name__, url_prefix='/api/webpush')


@bp.route('/subscribe', methods=['POST'])
@require_auth
def subscribe(user):
    """
    Subscribe to web push notifications.
    
    Request body should contain:
    - endpoint: Push service endpoint URL
    - keys: Object containing p256dh and auth keys
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    if 'endpoint' not in data or 'keys' not in data:
        return jsonify({'error': 'Missing required fields: endpoint, keys'}), 400
    
    endpoint = data['endpoint']
    keys = data['keys']
    
    if 'p256dh' not in keys or 'auth' not in keys:
        return jsonify({'error': 'Missing required keys: p256dh, auth'}), 400
    
    # Check if subscription already exists
    existing = WebPushSubscription.query.filter_by(endpoint=endpoint).first()
    
    if existing:
        # Update existing subscription
        existing.p256dh = keys['p256dh']
        existing.auth = keys['auth']
        existing.user_id = user.id
        existing.user_agent = request.headers.get('User-Agent', '')
        db.session.commit()
        
        return jsonify({'message': 'Subscription updated'}), 200
    
    # Create new subscription
    subscription = WebPushSubscription(
        user_id=user.id,
        endpoint=endpoint,
        p256dh=keys['p256dh'],
        auth=keys['auth'],
        user_agent=request.headers.get('User-Agent', '')
    )
    
    db.session.add(subscription)
    db.session.commit()
    
    return jsonify({'message': 'Subscribed successfully'}), 201


@bp.route('/unsubscribe', methods=['POST'])
@require_auth
def unsubscribe(user):
    """
    Unsubscribe from web push notifications.
    
    Request body should contain:
    - endpoint: Push service endpoint URL to unsubscribe
    """
    data = request.get_json()
    
    if not data or 'endpoint' not in data:
        return jsonify({'error': 'Missing required field: endpoint'}), 400
    
    endpoint = data['endpoint']
    
    subscription = WebPushSubscription.query.filter_by(
        endpoint=endpoint,
        user_id=user.id
    ).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    db.session.delete(subscription)
    db.session.commit()
    
    return jsonify({'message': 'Unsubscribed successfully'}), 200


@bp.route('/subscriptions', methods=['GET'])
@require_auth
def get_subscriptions(user):
    """Get all web push subscriptions for the authenticated user."""
    subscriptions = WebPushSubscription.query.filter_by(user_id=user.id).all()
    
    return jsonify({
        'total': len(subscriptions),
        'subscriptions': [{
            'id': sub.id,
            'endpoint': sub.endpoint[:50] + '...',  # Truncate for privacy
            'user_agent': sub.user_agent,
            'created_at': sub.created_at.isoformat(),
            'last_used': sub.last_used.isoformat()
        } for sub in subscriptions]
    }), 200


@bp.route('/vapid-public-key', methods=['GET'])
def get_vapid_public_key():
    """Get the VAPID public key for web push subscriptions."""
    from flask import current_app
    
    public_key = current_app.config.get('VAPID_PUBLIC_KEY', '')
    
    if not public_key:
        return jsonify({'error': 'VAPID public key not configured'}), 500
    
    return jsonify({'public_key': public_key}), 200
