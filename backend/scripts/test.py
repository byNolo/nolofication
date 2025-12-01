#!/usr/bin/env python3
"""Quick test script to verify Nolofication backend is working."""
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import requests
from app import create_app, db
from app.models import Site

app = create_app()

def test_database():
    """Test database connection."""
    print("Testing database connection...")
    try:
        with app.app_context():
            # Try to query
            count = Site.query.count()
            print(f"✓ Database connected ({count} sites registered)")
            return True
    except Exception as e:
        print(f"✗ Database error: {e}")
        return False

def test_health_endpoint():
    """Test the health check endpoint."""
    print("\nTesting health endpoint...")
    try:
        response = requests.get('http://localhost:5005/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Health endpoint working: {data}")
            return True
        else:
            print(f"✗ Health endpoint returned {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"✗ Cannot connect to server: {e}")
        print("  Make sure the server is running: python app.py")
        return False

def test_public_sites():
    """Test the public sites endpoint."""
    print("\nTesting public sites endpoint...")
    try:
        response = requests.get('http://localhost:5005/api/sites/public', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Public sites endpoint working ({data['total']} sites)")
            return True
        else:
            print(f"✗ Public sites endpoint returned {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"✗ Error: {e}")
        return False

def test_vapid_key():
    """Test VAPID public key endpoint."""
    print("\nTesting VAPID key endpoint...")
    try:
        response = requests.get('http://localhost:5005/api/webpush/vapid-public-key', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('public_key'):
                print(f"✓ VAPID key configured")
                return True
            else:
                print("⚠ VAPID key not configured (web push won't work)")
                return False
        else:
            print(f"✗ VAPID endpoint returned {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"✗ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("🔥 Nolofication Backend Test Suite")
    print("=" * 50)
    
    results = []
    
    # Test database
    results.append(test_database())
    
    # Test endpoints (server must be running)
    results.append(test_health_endpoint())
    results.append(test_public_sites())
    results.append(test_vapid_key())
    
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✓ All {total} tests passed!")
        return 0
    else:
        print(f"⚠ {passed}/{total} tests passed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
