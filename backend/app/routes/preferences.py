"""User preference routes."""
from flask import Blueprint, request, jsonify
from app import db
from app.models import UserPreference, SitePreference, Site, SiteNotificationCategory, UserCategoryPreference
from app.utils.auth import require_auth

bp = Blueprint('preferences', __name__, url_prefix='/api')


@bp.route('/preferences', methods=['GET'])
@require_auth
def get_global_preferences(user):
    """Get global notification preferences for the authenticated user."""
    prefs = UserPreference.query.filter_by(user_id=user.id).first()
    
    if not prefs:
        # Create default preferences
        prefs = UserPreference(user_id=user.id)
        db.session.add(prefs)
        db.session.commit()
    
    return jsonify(prefs.to_dict()), 200


@bp.route('/preferences', methods=['PUT'])
@require_auth
def update_global_preferences(user):
    """Update global notification preferences for the authenticated user."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    prefs = UserPreference.query.filter_by(user_id=user.id).first()
    
    if not prefs:
        prefs = UserPreference(user_id=user.id)
        db.session.add(prefs)
    
    # Update preferences
    if 'email' in data:
        prefs.email_enabled = bool(data['email'])
    if 'web_push' in data:
        prefs.web_push_enabled = bool(data['web_push'])
    if 'discord' in data:
        prefs.discord_enabled = bool(data['discord'])
    if 'webhook' in data:
        prefs.webhook_enabled = bool(data['webhook'])
    if 'discord_user_id' in data:
        prefs.discord_user_id = data['discord_user_id']
    if 'webhook_url' in data:
        prefs.webhook_url = data['webhook_url']
    
    db.session.commit()
    
    return jsonify(prefs.to_dict()), 200


@bp.route('/sites/<site_id>/preferences', methods=['GET'])
@require_auth
def get_site_preferences(user, site_id):
    """Get notification preferences for a specific site."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    site_prefs = SitePreference.query.filter_by(
        user_id=user.id,
        site_id=site.id
    ).first()
    
    # Get global preferences as fallback
    global_prefs = UserPreference.query.filter_by(user_id=user.id).first()
    if not global_prefs:
        global_prefs = UserPreference(user_id=user.id)
        db.session.add(global_prefs)
        db.session.commit()
    
    # Build response with site overrides
    response = {
        'site': {
            'id': site.site_id,
            'name': site.name,
            'description': site.description
        },
        'global_preferences': global_prefs.to_dict(),
        'site_preferences': site_prefs.to_dict() if site_prefs else {
            'email': None,
            'web_push': None,
            'discord': None,
            'webhook': None
        },
        'effective_preferences': {
            'email': site_prefs.email_enabled if (site_prefs and site_prefs.email_enabled is not None) else global_prefs.email_enabled,
            'web_push': site_prefs.web_push_enabled if (site_prefs and site_prefs.web_push_enabled is not None) else global_prefs.web_push_enabled,
            'discord': site_prefs.discord_enabled if (site_prefs and site_prefs.discord_enabled is not None) else global_prefs.discord_enabled,
            'webhook': site_prefs.webhook_enabled if (site_prefs and site_prefs.webhook_enabled is not None) else global_prefs.webhook_enabled
        }
    }
    
    return jsonify(response), 200


@bp.route('/sites/<site_id>/preferences', methods=['PUT'])
@require_auth
def update_site_preferences(user, site_id):
    """Update notification preferences for a specific site."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    site_prefs = SitePreference.query.filter_by(
        user_id=user.id,
        site_id=site.id
    ).first()
    
    if not site_prefs:
        site_prefs = SitePreference(user_id=user.id, site_id=site.id)
        db.session.add(site_prefs)
    
    # Update preferences (None means use global setting)
    if 'email' in data:
        site_prefs.email_enabled = data['email'] if data['email'] is not None else None
    if 'web_push' in data:
        site_prefs.web_push_enabled = data['web_push'] if data['web_push'] is not None else None
    if 'discord' in data:
        site_prefs.discord_enabled = data['discord'] if data['discord'] is not None else None
    if 'webhook' in data:
        site_prefs.webhook_enabled = data['webhook'] if data['webhook'] is not None else None

    # Scheduling preferences (site-level defaults for this user)
    schedule = data.get('schedule')
    if schedule:
        freq = schedule.get('frequency')
        if freq in ('instant', 'daily', 'weekly'):
            site_prefs.frequency = freq
        time_of_day = schedule.get('time_of_day')
        if time_of_day:
            site_prefs.time_of_day = time_of_day
        tz = schedule.get('timezone')
        if tz:
            site_prefs.timezone = tz
        weekly_day = schedule.get('weekly_day')
        if weekly_day is not None:
            site_prefs.weekly_day = int(weekly_day)
    
    db.session.commit()
    
    return jsonify(site_prefs.to_dict()), 200


@bp.route('/sites/<site_id>/my-categories', methods=['GET'])
@require_auth
def list_site_categories(user, site_id):
    """List categories for a site and user's effective settings per category."""
    site = Site.query.filter_by(site_id=site_id).first()
    if not site:
        return jsonify({'error': 'Site not found'}), 404

    categories = SiteNotificationCategory.query.filter_by(site_id=site.id).all()
    result = []
    for cat in categories:
        ucp = UserCategoryPreference.query.filter_by(
            user_id=user.id, site_id=site.id, category_id=cat.id
        ).first()
        result.append({
            'category': cat.to_dict(),
            'user_preference': ucp.to_dict() if ucp else None
        })
    return jsonify({'categories': result}), 200


@bp.route('/sites/<site_id>/categories/<category_key>/preferences', methods=['PUT'])
@require_auth
def update_user_category_preference(user, site_id, category_key):
    """Enable/disable a category and set schedule overrides for a user."""
    site = Site.query.filter_by(site_id=site_id).first()
    if not site:
        return jsonify({'error': 'Site not found'}), 404

    category = SiteNotificationCategory.query.filter_by(site_id=site.id, key=category_key).first()
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json() or {}
    ucp = UserCategoryPreference.query.filter_by(
        user_id=user.id, site_id=site.id, category_id=category.id
    ).first()
    if not ucp:
        ucp = UserCategoryPreference(user_id=user.id, site_id=site.id, category_id=category.id)
        db.session.add(ucp)

    if 'enabled' in data:
        ucp.enabled = bool(data['enabled'])

    schedule = data.get('schedule')
    if schedule is not None:
        freq = schedule.get('frequency')
        if freq in (None, 'instant', 'daily', 'weekly'):
            ucp.frequency = freq
        ucp.time_of_day = schedule.get('time_of_day')
        ucp.timezone = schedule.get('timezone')
        weekly_day = schedule.get('weekly_day')
        ucp.weekly_day = int(weekly_day) if weekly_day is not None else None

    db.session.commit()
    return jsonify({'category': category.key, 'preference': ucp.to_dict()}), 200


@bp.route('/sites/<site_id>/preferences', methods=['DELETE'])
@require_auth
def delete_site_preferences(user, site_id):
    """Delete site-specific preferences (revert to global settings)."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    site_prefs = SitePreference.query.filter_by(
        user_id=user.id,
        site_id=site.id
    ).first()
    
    if site_prefs:
        db.session.delete(site_prefs)
        db.session.commit()
    
    return jsonify({'message': 'Site preferences deleted, using global settings'}), 200
