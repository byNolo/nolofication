"""Admin routes for site and notification management."""
from flask import Blueprint, request, jsonify
from sqlalchemy import func, desc
from app import db
from app.models import Site, Notification, User, SiteNotificationCategory
from app.utils.auth import require_admin_auth
from app.services.notification_service import NotificationService

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@bp.route('/dashboard', methods=['GET'])
@require_admin_auth
def get_dashboard(user):
    """Get admin dashboard overview."""
    total_notifications = Notification.query.count()
    total_users = User.query.count()
    total_sites = Site.query.count()
    active_sites = Site.query.filter_by(is_active=True).count()
    pending_sites = Site.query.filter_by(is_approved=False).count()
    
    # Notifications by channel
    email_count = Notification.query.filter_by(sent_via_email=True).count()
    web_push_count = Notification.query.filter_by(sent_via_web_push=True).count()
    discord_count = Notification.query.filter_by(sent_via_discord=True).count()
    webhook_count = Notification.query.filter_by(sent_via_webhook=True).count()
    
    # Recent activity
    recent_notifications = Notification.query.order_by(
        Notification.created_at.desc()
    ).limit(10).all()
    
    return jsonify({
        'stats': {
            'notifications': total_notifications,
            'users': total_users,
            'sites': total_sites,
            'active_sites': active_sites,
            'pending_sites': pending_sites
        },
        'channels': {
            'email': email_count,
            'web_push': web_push_count,
            'discord': discord_count,
            'webhook': webhook_count
        },
        'recent_notifications': [n.to_dict() for n in recent_notifications]
    }), 200


@bp.route('/sites', methods=['GET'])
@require_admin_auth
def list_all_sites(user):
    """List all sites with detailed information."""
    sites = Site.query.order_by(Site.created_at.desc()).all()
    
    sites_data = []
    for site in sites:
        notification_count = Notification.query.filter_by(site_id=site.id).count()
        category_count = SiteNotificationCategory.query.filter_by(site_id=site.id).count()
        
        sites_data.append({
            'id': site.id,
            'site_id': site.site_id,
            'name': site.name,
            'description': site.description,
            'creator_keyn_id': site.creator_keyn_id,
            'is_approved': site.is_approved,
            'is_active': site.is_active,
            'api_key': site.api_key,
            'created_at': site.created_at.isoformat(),
            'notification_count': notification_count,
            'category_count': category_count
        })
    
    return jsonify({'sites': sites_data}), 200


@bp.route('/sites', methods=['POST'])
@require_admin_auth
def create_site(user):
    """Create a new site (admin only)."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['site_id', 'name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if site already exists
    existing_site = Site.query.filter_by(site_id=data['site_id']).first()
    if existing_site:
        return jsonify({'error': 'Site ID already exists'}), 400
    
    site = Site(
        site_id=data['site_id'],
        name=data['name'],
        description=data.get('description', ''),
        api_key=Site.generate_api_key(),  # Generate API key
        creator_keyn_id=user.keyn_user_id,  # Admin is the creator
        is_approved=True,  # Auto-approve admin-created sites
        is_active=True
    )
    
    db.session.add(site)
    db.session.commit()
    
    return jsonify({
        'message': 'Site created successfully',
        'site': {
            'site_id': site.site_id,
            'name': site.name,
            'api_key': site.api_key,
            'is_approved': site.is_approved,
            'is_active': site.is_active
        }
    }), 201


@bp.route('/sites/<site_id>', methods=['PUT'])
@require_admin_auth
def update_site(user, site_id):
    """Update site information."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update allowed fields
    if 'name' in data:
        site.name = data['name']
    if 'description' in data:
        site.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Site updated successfully',
        'site': {
            'site_id': site.site_id,
            'name': site.name,
            'description': site.description
        }
    }), 200


@bp.route('/sites/<site_id>', methods=['DELETE'])
@require_admin_auth
def delete_site(user, site_id):
    """Delete a site and all its data."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    # Delete all associated data
    Notification.query.filter_by(site_id=site.id).delete()
    SiteNotificationCategory.query.filter_by(site_id=site.id).delete()
    
    db.session.delete(site)
    db.session.commit()
    
    return jsonify({'message': 'Site deleted successfully'}), 200


@bp.route('/sites/<site_id>/approve', methods=['POST'])
@require_admin_auth
def approve_site(user, site_id):
    """Approve a pending site registration."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    site.is_approved = True
    site.is_active = True
    db.session.commit()
    
    return jsonify({
        'message': 'Site approved successfully',
        'site_id': site.site_id,
        'is_approved': site.is_approved,
        'is_active': site.is_active
    }), 200


@bp.route('/sites/<site_id>/deactivate', methods=['POST'])
@require_admin_auth
def deactivate_site(user, site_id):
    """Deactivate a site."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    site.is_active = False
    db.session.commit()
    
    return jsonify({
        'message': 'Site deactivated successfully',
        'site_id': site.site_id,
        'is_active': site.is_active
    }), 200


@bp.route('/sites/<site_id>/activate', methods=['POST'])
@require_admin_auth
def activate_site(user, site_id):
    """Activate a site."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    if not site.is_approved:
        return jsonify({'error': 'Site must be approved before activation'}), 400
    
    site.is_active = True
    db.session.commit()
    
    return jsonify({
        'message': 'Site activated successfully',
        'site_id': site.site_id,
        'is_active': site.is_active
    }), 200


@bp.route('/sites/<site_id>/regenerate-key', methods=['POST'])
@require_admin_auth
def regenerate_api_key(user, site_id):
    """Regenerate API key for a site."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    new_api_key = Site.generate_api_key()
    site.api_key = new_api_key
    db.session.commit()
    
    return jsonify({
        'message': 'API key regenerated successfully',
        'site_id': site.site_id,
        'api_key': new_api_key
    }), 200


@bp.route('/sites/<site_id>/categories', methods=['POST'])
@require_admin_auth
def create_category(user, site_id):
    """Create a notification category for a site."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['key', 'name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if category already exists
    existing = SiteNotificationCategory.query.filter_by(
        site_id=site.id,
        key=data['key']
    ).first()
    
    if existing:
        return jsonify({'error': 'Category key already exists for this site'}), 400
    
    category = SiteNotificationCategory(
        site_id=site.id,
        key=data['key'],
        name=data['name'],
        description=data.get('description', ''),
        default_frequency=data.get('default_frequency', 'instant'),
        default_time_of_day=data.get('default_time_of_day'),
        default_weekly_day=data.get('default_weekly_day')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category created successfully',
        'category': {
            'key': category.key,
            'name': category.name,
            'description': category.description,
            'default_frequency': category.default_frequency
        }
    }), 201


@bp.route('/notifications', methods=['GET'])
@require_admin_auth
def list_notifications(user):
    """List recent notifications with filtering."""
    limit = min(int(request.args.get('limit', 50)), 100)
    offset = int(request.args.get('offset', 0))
    site_id = request.args.get('site_id')
    
    query = Notification.query
    
    if site_id:
        site = Site.query.filter_by(site_id=site_id).first()
        if site:
            query = query.filter_by(site_id=site.id)
    
    total = query.count()
    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    return jsonify({
        'total': total,
        'limit': limit,
        'offset': offset,
        'notifications': [n.to_dict() for n in notifications]
    }), 200


@bp.route('/users', methods=['GET'])
@require_admin_auth
def list_users(user):
    """List all users."""
    limit = min(int(request.args.get('limit', 50)), 100)
    offset = int(request.args.get('offset', 0))
    
    total = User.query.count()
    users = User.query.order_by(User.created_at.desc()).limit(limit).offset(offset).all()
    
    return jsonify({
        'total': total,
        'limit': limit,
        'offset': offset,
        'users': [{
            'id': u.id,
            'keyn_user_id': u.keyn_user_id,
            'username': u.username,
            'email': u.email,
            'created_at': u.created_at.isoformat()
        } for u in users]
    }), 200


@bp.route('/broadcast', methods=['POST'])
@require_admin_auth
def broadcast(user):
    """Broadcast a notification to all users (admin only).

    Body JSON:
    - title (required)
    - message (required)
    - type (optional, default 'info')
    - html_message (optional)
    """
    data = request.get_json() or {}

    title = data.get('title')
    message = data.get('message')
    notification_type = data.get('type', 'info')
    html_message = data.get('html_message')

    if not title or not message:
        return jsonify({'error': 'Missing title or message'}), 400

    # Ensure a site exists to attribute the broadcast to
    admin_site = Site.query.filter_by(site_id='nolofication-admin').first()
    if not admin_site:
        admin_site = Site(
            site_id='nolofication-admin',
            name='Nolofication (Admin Broadcast)',
            description='Internal admin broadcast site',
            api_key=Site.generate_api_key(),
            is_active=True,
            is_approved=True,
            creator_keyn_id=user.keyn_user_id
        )
        db.session.add(admin_site)
        db.session.commit()

    # Optional targeting
    target = data.get('target', 'all')  # 'all' or 'site_users'
    target_site_id = data.get('site_id')

    user_ids = []

    if target == 'site_users' and target_site_id:
        target_site = Site.query.filter_by(site_id=target_site_id).first()
        if not target_site:
            return jsonify({'error': 'Target site not found'}), 404

        # Users with explicit site preferences for that site
        from app.models import SitePreference
        prefs = SitePreference.query.filter_by(site_id=target_site.id).all()
        user_ids = [User.query.get(p.user_id).keyn_user_id for p in prefs if User.query.get(p.user_id)]
    else:
        # Default: all users
        user_ids = [u.keyn_user_id for u in User.query.with_entities(User.keyn_user_id).all()]

    # If no users, return early
    if not user_ids:
        return jsonify({'message': 'No users to send to'}), 200

    # Use NotificationService to send in bulk
    results = NotificationService.send_bulk_notification(
        admin_site, user_ids, title, message, notification_type,
        html_message=html_message
    )

    return jsonify({'message': 'Broadcast dispatched', 'results': results}), 200

