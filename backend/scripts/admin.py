#!/usr/bin/env python3
"""Script to manage sites and admin tasks."""
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import Site, User, Notification

app = create_app()


def list_sites():
    """List all registered sites."""
    with app.app_context():
        sites = Site.query.all()
        
        if not sites:
            print("No sites registered yet.")
            return
        
        print(f"\n{'ID':<5} {'Site ID':<20} {'Name':<30} {'Active':<8} {'Approved':<10}")
        print("-" * 80)
        
        for site in sites:
            status = "✓" if site.is_active else "✗"
            approved = "✓" if site.is_approved else "✗"
            print(f"{site.id:<5} {site.site_id:<20} {site.name:<30} {status:<8} {approved:<10}")
        
        print(f"\nTotal: {len(sites)} sites")


def approve_site(site_id):
    """Approve and activate a site."""
    with app.app_context():
        site = Site.query.filter_by(site_id=site_id).first()
        
        if not site:
            print(f"Error: Site '{site_id}' not found.")
            return
        
        site.is_approved = True
        site.is_active = True
        db.session.commit()
        
        print(f"✓ Site '{site_id}' has been approved and activated.")
        print(f"API Key: {site.api_key}")


def show_site(site_id):
    """Show details for a site."""
    with app.app_context():
        site = Site.query.filter_by(site_id=site_id).first()
        
        if not site:
            print(f"Error: Site '{site_id}' not found.")
            return
        
        print(f"\nSite Details:")
        print(f"  ID: {site.id}")
        print(f"  Site ID: {site.site_id}")
        print(f"  Name: {site.name}")
        print(f"  Description: {site.description}")
        print(f"  API Key: {site.api_key}")
        print(f"  Active: {'Yes' if site.is_active else 'No'}")
        print(f"  Approved: {'Yes' if site.is_approved else 'No'}")
        print(f"  Creator: {site.creator_keyn_id}")
        print(f"  Created: {site.created_at}")


def create_site(site_id, name, description=""):
    """Create and approve a new site."""
    with app.app_context():
        existing = Site.query.filter_by(site_id=site_id).first()
        
        if existing:
            print(f"Error: Site '{site_id}' already exists.")
            return
        
        api_key = Site.generate_api_key()
        site = Site(
            site_id=site_id,
            name=name,
            description=description,
            api_key=api_key,
            creator_keyn_id="admin",
            is_active=True,
            is_approved=True
        )
        
        db.session.add(site)
        db.session.commit()
        
        print(f"✓ Site '{site_id}' created and approved.")
        print(f"  Name: {name}")
        print(f"  API Key: {api_key}")


def stats():
    """Show database statistics."""
    with app.app_context():
        total_sites = Site.query.count()
        active_sites = Site.query.filter_by(is_active=True).count()
        total_users = User.query.count()
        total_notifications = Notification.query.count()
        
        print("\nDatabase Statistics:")
        print(f"  Total Sites: {total_sites}")
        print(f"  Active Sites: {active_sites}")
        print(f"  Total Users: {total_users}")
        print(f"  Total Notifications: {total_notifications}")


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Nolofication Admin Script")
        print("\nUsage:")
        print("  python scripts/admin.py list                         # List all sites")
        print("  python scripts/admin.py show <site_id>               # Show site details")
        print("  python scripts/admin.py approve <site_id>            # Approve a site")
        print("  python scripts/admin.py create <site_id> <name>      # Create new site")
        print("  python scripts/admin.py stats                        # Show statistics")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'list':
        list_sites()
    elif command == 'show':
        if len(sys.argv) < 3:
            print("Error: site_id required")
            sys.exit(1)
        show_site(sys.argv[2])
    elif command == 'approve':
        if len(sys.argv) < 3:
            print("Error: site_id required")
            sys.exit(1)
        approve_site(sys.argv[2])
    elif command == 'create':
        if len(sys.argv) < 4:
            print("Error: site_id and name required")
            sys.exit(1)
        site_id = sys.argv[2]
        name = sys.argv[3]
        description = sys.argv[4] if len(sys.argv) > 4 else ""
        create_site(site_id, name, description)
    elif command == 'stats':
        stats()
    else:
        print(f"Error: Unknown command '{command}'")
        sys.exit(1)


if __name__ == '__main__':
    main()
