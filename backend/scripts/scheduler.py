"""Simple scheduler to dispatch scheduled pending notifications.

Run as a separate process (e.g., systemd or `python scripts/scheduler.py`).
"""
import os
import sys
from datetime import datetime, timedelta
import time

# Add parent directory to path to import app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import (
    User, Site, Notification, SitePreference,
    SiteNotificationCategory, UserCategoryPreference,
    PendingNotification
)
from app.services.notification_service import NotificationService

app = create_app(os.getenv('FLASK_ENV', 'production'))


def dispatch_scheduled_notifications():
    """Process and dispatch pending notifications that are due."""
    with app.app_context():
        now = datetime.utcnow()
        
        # Query pending notifications that are due and not cancelled
        pending = PendingNotification.query.filter(
            PendingNotification.scheduled_for <= now,
            PendingNotification.cancelled_at == None
        ).all()
        
        for notif in pending:
            try:
                # Dispatch the notification
                NotificationService._dispatch_notification(
                    notif.user,
                    notif.site,
                    notif.title,
                    notif.message,
                    notif.notification_type,
                    category_key=notif.category_key,
                    html_message=notif.html_message
                )
                
                # Remove from pending queue
                db.session.delete(notif)
                db.session.commit()
                
                print(f"Dispatched pending notification {notif.id} to user {notif.user.keyn_user_id}")
            except Exception as e:
                print(f"Error dispatching pending notification {notif.id}: {e}")
                db.session.rollback()
        
        # Clean up old cancelled notifications (older than 7 days)
        seven_days_ago = now - timedelta(days=7)
        PendingNotification.query.filter(
            PendingNotification.cancelled_at != None,
            PendingNotification.cancelled_at < seven_days_ago
        ).delete()
        db.session.commit()



def main_loop():
    print("Scheduler started. Checking every minute...")
    while True:
        try:
            dispatch_scheduled_notifications()
        except Exception as e:
            print("Scheduler error:", e)
        # Sleep until next minute
        time.sleep(60)


if __name__ == '__main__':
    main_loop()
