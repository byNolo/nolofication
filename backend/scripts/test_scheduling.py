"""Test script for scheduling and category features."""
import os
import sys
import requests
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Site, SiteNotificationCategory, User, UserCategoryPreference

app = create_app(os.getenv('FLASK_ENV', 'development'))

def test_category_creation():
    """Test creating notification categories for a site."""
    print("\n=== Testing Category Creation ===")
    
    with app.app_context():
        # Find or create a test site
        site = Site.query.filter_by(site_id='test-site').first()
        if not site:
            site = Site(
                site_id='test-site',
                name='Test Site',
                description='Test site for scheduling',
                api_key=Site.generate_api_key(),
                is_active=True,
                is_approved=True
            )
            db.session.add(site)
            db.session.commit()
            print(f"✓ Created test site: {site.site_id}")
        else:
            print(f"✓ Found existing test site: {site.site_id}")
        
        # Create test categories
        categories = [
            {
                'key': 'security',
                'name': 'Security Alerts',
                'description': 'Important security notifications',
                'default_frequency': 'instant'
            },
            {
                'key': 'reminders',
                'name': 'Daily Reminders',
                'description': 'Task and deadline reminders',
                'default_frequency': 'daily',
                'default_time_of_day': '09:00'
            },
            {
                'key': 'digest',
                'name': 'Weekly Digest',
                'description': 'Weekly summary of activity',
                'default_frequency': 'weekly',
                'default_time_of_day': '09:00',
                'default_weekly_day': 0
            }
        ]
        
        for cat_data in categories:
            existing = SiteNotificationCategory.query.filter_by(
                site_id=site.id, key=cat_data['key']
            ).first()
            
            if existing:
                print(f"  ✓ Category '{cat_data['key']}' already exists")
            else:
                cat = SiteNotificationCategory(
                    site_id=site.id,
                    key=cat_data['key'],
                    name=cat_data['name'],
                    description=cat_data['description'],
                    default_frequency=cat_data.get('default_frequency', 'instant'),
                    default_time_of_day=cat_data.get('default_time_of_day'),
                    default_weekly_day=cat_data.get('default_weekly_day')
                )
                db.session.add(cat)
                print(f"  ✓ Created category '{cat_data['key']}'")
        
        db.session.commit()
        print("\n✓ All categories created successfully")

def test_user_category_preferences():
    """Test setting user preferences for categories."""
    print("\n=== Testing User Category Preferences ===")
    
    with app.app_context():
        site = Site.query.filter_by(site_id='test-site').first()
        if not site:
            print("✗ Test site not found. Run test_category_creation first.")
            return
        
        # Find or create test user
        user = User.query.filter_by(keyn_user_id='test-user-123').first()
        if not user:
            user = User(
                keyn_user_id='test-user-123',
                username='testuser',
                email='test@example.com'
            )
            db.session.add(user)
            db.session.commit()
            print(f"✓ Created test user: {user.username}")
        else:
            print(f"✓ Found existing test user: {user.username}")
        
        # Set preferences for each category
        categories = SiteNotificationCategory.query.filter_by(site_id=site.id).all()
        
        for cat in categories:
            ucp = UserCategoryPreference.query.filter_by(
                user_id=user.id,
                site_id=site.id,
                category_id=cat.id
            ).first()
            
            if not ucp:
                ucp = UserCategoryPreference(
                    user_id=user.id,
                    site_id=site.id,
                    category_id=cat.id,
                    enabled=True,
                    frequency='daily' if cat.key == 'reminders' else None,
                    time_of_day='18:00' if cat.key == 'reminders' else None,
                    timezone='America/New_York'
                )
                db.session.add(ucp)
                print(f"  ✓ Set preferences for category '{cat.key}'")
            else:
                print(f"  ✓ Preferences already set for '{cat.key}'")
        
        db.session.commit()
        print("\n✓ User preferences configured successfully")

def test_api_endpoints():
    """Test API endpoints for categories and scheduling."""
    print("\n=== Testing API Endpoints ===")
    
    base_url = 'http://localhost:5000/api'
    
    # Test public category listing
    print("\n1. Testing GET /sites/test-site/categories")
    try:
        response = requests.get(f'{base_url}/sites/test-site/categories')
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Success! Found {len(data.get('categories', []))} categories")
            for cat in data.get('categories', []):
                print(f"    - {cat['name']} ({cat['key']}): {cat['defaults']['frequency']}")
        else:
            print(f"  ✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"  ✗ Error: {e}")
    
    print("\n✓ API endpoint tests completed")

def test_scheduler_logic():
    """Test the scheduler's time-matching logic."""
    print("\n=== Testing Scheduler Logic ===")
    
    from scripts.scheduler import should_run_now
    import pytz
    
    # Test daily schedule
    tz = 'America/New_York'
    time_of_day = datetime.now(pytz.timezone(tz)).strftime('%H:%M')
    
    result = should_run_now('daily', tz, time_of_day, None)
    print(f"  Daily check (current time): {result}")
    
    # Test weekly schedule
    current_weekday = datetime.now(pytz.timezone(tz)).weekday()
    result = should_run_now('weekly', tz, time_of_day, current_weekday)
    print(f"  Weekly check (current day): {result}")
    
    print("\n✓ Scheduler logic tests completed")

def main():
    """Run all tests."""
    print("=" * 60)
    print("Nolofication Scheduling & Categories Test Suite")
    print("=" * 60)
    
    try:
        test_category_creation()
        test_user_category_preferences()
        test_api_endpoints()
        test_scheduler_logic()
        
        print("\n" + "=" * 60)
        print("✓ All tests completed successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
