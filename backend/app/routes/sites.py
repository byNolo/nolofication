"""Site registration and management routes."""
from flask import Blueprint, request, jsonify
from app import db, limiter
from app.models import Site
from app.utils.auth import require_admin_auth

bp = Blueprint('sites', __name__, url_prefix='/api')


@bp.route('/sites/register', methods=['POST'])
@limiter.limit("5 per hour")
def register_site():
    """
    Register a new site.
    
    Request body should contain:
    - site_id: Unique identifier for the site (e.g., 'vinylvote')
    - name: Display name of the site
    - description: Description of the site (optional)
    - creator_keyn_id: KeyN user ID of the creator
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    required_fields = ['site_id', 'name', 'creator_keyn_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    site_id = data['site_id']
    name = data['name']
    description = data.get('description', '')
    creator_keyn_id = data['creator_keyn_id']
    
    # Check if site already exists
    existing_site = Site.query.filter_by(site_id=site_id).first()
    if existing_site:
        return jsonify({'error': 'Site ID already registered'}), 409
    
    # Generate API key
    api_key = Site.generate_api_key()
    
    # Create site (requires admin approval by default)
    site = Site(
        site_id=site_id,
        name=name,
        description=description,
        api_key=api_key,
        creator_keyn_id=creator_keyn_id,
        is_active=False,
        is_approved=False
    )
    
    db.session.add(site)
    db.session.commit()
    
    return jsonify({
        'message': 'Site registered successfully. Awaiting admin approval.',
        'site_id': site.site_id,
        'api_key': api_key,
        'status': 'pending_approval'
    }), 201


@bp.route('/sites', methods=['GET'])
@require_admin_auth
def list_sites(user):
    """List all registered sites (admin only)."""
    try:
        sites = Site.query.all()

        return jsonify({
            'total': len(sites),
            'sites': [{
                'id': site.id,
                'site_id': site.site_id,
                'name': site.name,
                'description': site.description,
                'is_active': site.is_active,
                'is_approved': site.is_approved,
                'creator_keyn_id': site.creator_keyn_id,
                'created_at': site.created_at.isoformat() if site.created_at else None
            } for site in sites]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error listing sites: {e}")
        return jsonify({'error': 'Internal server error listing sites'}), 500


@bp.route('/sites/<site_id>', methods=['GET'])
def get_site(site_id):
    """Get basic details of a specific site (public for active sites)."""
    site = Site.query.filter_by(site_id=site_id, is_active=True, is_approved=True).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    # Return public info only (no API key)
    return jsonify({
        'site_id': site.site_id,
        'name': site.name,
        'description': site.description,
        'created_at': site.created_at.isoformat()
    }), 200


@bp.route('/sites/<site_id>', methods=['DELETE'])
@require_admin_auth
def delete_site(site_id):
    """Delete a site (admin only)."""
    site = Site.query.filter_by(site_id=site_id).first()
    
    if not site:
        return jsonify({'error': 'Site not found'}), 404
    
    db.session.delete(site)
    db.session.commit()
    
    return jsonify({'message': 'Site deleted successfully'}), 200


@bp.route('/sites/public', methods=['GET'])
def list_public_sites():
    """List all active and approved sites (public endpoint)."""
    sites = Site.query.filter_by(is_active=True, is_approved=True).all()
    
    return jsonify({
        'total': len(sites),
        'sites': [{
            'site_id': site.site_id,
            'name': site.name,
            'description': site.description
        } for site in sites]
    }), 200
