"""Site notification category management routes (admin)."""
from flask import Blueprint, request, jsonify
from app import db
from app.models import Site, SiteNotificationCategory
from app.utils.auth import require_admin_auth

bp = Blueprint('categories', __name__, url_prefix='/api')


@bp.route('/sites/<site_id>/categories', methods=['POST'])
@require_admin_auth
def create_category(admin_user, site_id):
    """Create a new category for a site.

    Body: { key, name, description?, defaults?: { frequency, time_of_day, weekly_day } }
    """
    site = Site.query.filter_by(site_id=site_id).first()
    if not site:
        return jsonify({'error': 'Site not found'}), 404

    data = request.get_json() or {}
    key = data.get('key')
    name = data.get('name')
    description = data.get('description')
    defaults = data.get('defaults') or {}

    if not key or not name:
        return jsonify({'error': 'key and name are required'}), 400

    existing = SiteNotificationCategory.query.filter_by(site_id=site.id, key=key).first()
    if existing:
        return jsonify({'error': 'Category key already exists'}), 409

    cat = SiteNotificationCategory(
        site_id=site.id,
        key=key,
        name=name,
        description=description,
        default_frequency=defaults.get('frequency', 'instant'),
        default_time_of_day=defaults.get('time_of_day'),
        default_weekly_day=defaults.get('weekly_day')
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({'category': cat.to_dict()}), 201


@bp.route('/sites/<site_id>/categories', methods=['GET'])
def get_categories(site_id):
    """Public list of categories for a site."""
    site = Site.query.filter_by(site_id=site_id, is_active=True, is_approved=True).first()
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    cats = SiteNotificationCategory.query.filter_by(site_id=site.id).all()
    return jsonify({'categories': [c.to_dict() for c in cats]}), 200


@bp.route('/sites/<site_id>/categories/<key>', methods=['PUT'])
@require_admin_auth
def update_category(admin_user, site_id, key):
    """Update category metadata/defaults."""
    site = Site.query.filter_by(site_id=site_id).first()
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    cat = SiteNotificationCategory.query.filter_by(site_id=site.id, key=key).first()
    if not cat:
        return jsonify({'error': 'Category not found'}), 404
    data = request.get_json() or {}
    cat.name = data.get('name', cat.name)
    cat.description = data.get('description', cat.description)
    defaults = data.get('defaults') or {}
    if 'frequency' in defaults:
        cat.default_frequency = defaults.get('frequency')
    if 'time_of_day' in defaults:
        cat.default_time_of_day = defaults.get('time_of_day')
    if 'weekly_day' in defaults:
        cat.default_weekly_day = defaults.get('weekly_day')
    db.session.commit()
    return jsonify({'category': cat.to_dict()}), 200
