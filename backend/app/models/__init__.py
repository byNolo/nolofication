"""Database models for Nolofication."""
from datetime import datetime
from app import db
import secrets


class User(db.Model):
    """User model - stores minimal user data from KeyN."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    keyn_user_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(200))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    preferences = db.relationship('UserPreference', back_populates='user', 
                                 cascade='all, delete-orphan')
    site_preferences = db.relationship('SitePreference', back_populates='user',
                                      cascade='all, delete-orphan')
    notifications = db.relationship('Notification', back_populates='user',
                                   cascade='all, delete-orphan')
    web_push_subscriptions = db.relationship('WebPushSubscription', back_populates='user',
                                            cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'keyn_user_id': self.keyn_user_id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'


class Site(db.Model):
    """Registered sites that can send notifications."""
    __tablename__ = 'sites'
    
    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    api_key = db.Column(db.String(100), unique=True, nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=False)  # Requires admin approval
    is_approved = db.Column(db.Boolean, default=False)
    
    # Metadata
    creator_keyn_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    preferences = db.relationship('SitePreference', back_populates='site',
                                 cascade='all, delete-orphan')
    notifications = db.relationship('Notification', back_populates='site',
                                   cascade='all, delete-orphan')
    categories = db.relationship('SiteNotificationCategory', back_populates='site',
                                 cascade='all, delete-orphan')
    
    @staticmethod
    def generate_api_key():
        """Generate a secure API key."""
        return secrets.token_urlsafe(32)
    
    def __repr__(self):
        return f'<Site {self.site_id}>'


class UserPreference(db.Model):
    """Global notification preferences for a user."""
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Channel preferences
    email_enabled = db.Column(db.Boolean, default=True)
    web_push_enabled = db.Column(db.Boolean, default=False)
    discord_enabled = db.Column(db.Boolean, default=False)
    webhook_enabled = db.Column(db.Boolean, default=False)
    
    # Discord settings
    discord_user_id = db.Column(db.String(100))
    
    # Webhook settings
    webhook_url = db.Column(db.String(500))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='preferences')
    
    def to_dict(self):
        """Convert preferences to dictionary."""
        return {
            'email': self.email_enabled,
            'web_push': self.web_push_enabled,
            'discord': self.discord_enabled,
            'webhook': self.webhook_enabled,
            'discord_user_id': self.discord_user_id,
            'webhook_url': self.webhook_url
        }
    
    def __repr__(self):
        return f'<UserPreference user_id={self.user_id}>'


class SitePreference(db.Model):
    """Site-specific notification preferences (overrides global settings)."""
    __tablename__ = 'site_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    
    # Channel preferences (None = use global setting)
    email_enabled = db.Column(db.Boolean, nullable=True)
    web_push_enabled = db.Column(db.Boolean, nullable=True)
    discord_enabled = db.Column(db.Boolean, nullable=True)
    webhook_enabled = db.Column(db.Boolean, nullable=True)

    # Scheduling preferences per user per site (defaults for categories)
    # frequency: 'instant' | 'daily' | 'weekly'
    frequency = db.Column(db.String(20), default='instant')
    # time_of_day stored as HH:MM (24h) in user's local timezone
    time_of_day = db.Column(db.String(5), nullable=True)
    timezone = db.Column(db.String(100), nullable=True)
    # weekly_day: 0-6 (Mon=0) if frequency == 'weekly'
    weekly_day = db.Column(db.Integer, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='site_preferences')
    site = db.relationship('Site', back_populates='preferences')
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'site_id', name='unique_user_site'),
    )
    
    def to_dict(self):
        """Convert preferences to dictionary."""
        return {
            'email': self.email_enabled,
            'web_push': self.web_push_enabled,
            'discord': self.discord_enabled,
            'webhook': self.webhook_enabled,
            'schedule': {
                'frequency': self.frequency,
                'time_of_day': self.time_of_day,
                'timezone': self.timezone,
                'weekly_day': self.weekly_day
            }
        }
    
    def __repr__(self):
        return f'<SitePreference user_id={self.user_id} site_id={self.site_id}>'


class Notification(db.Model):
    """Notification log for tracking sent notifications."""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    
    # Notification content
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50))  # e.g., 'info', 'warning', 'success'
    category_key = db.Column(db.String(100))  # site-defined category key (e.g., 'reminder')
    
    # Delivery channels
    sent_via_email = db.Column(db.Boolean, default=False)
    sent_via_web_push = db.Column(db.Boolean, default=False)
    sent_via_discord = db.Column(db.Boolean, default=False)
    sent_via_webhook = db.Column(db.Boolean, default=False)
    
    # Status
    is_read = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = db.relationship('User', back_populates='notifications')
    site = db.relationship('Site', back_populates='notifications')
    
    def to_dict(self):
        """Convert notification to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.notification_type,
            'category': self.category_key,
            'site_id': self.site.site_id,
            'site_name': self.site.name,
            'channels': {
                'email': self.sent_via_email,
                'web_push': self.sent_via_web_push,
                'discord': self.sent_via_discord,
                'webhook': self.sent_via_webhook
            },
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Notification {self.id}: {self.title}>'


class PendingNotification(db.Model):
    """Queue for notifications scheduled for later delivery."""
    __tablename__ = 'pending_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    
    # Notification content
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    html_message = db.Column(db.Text, nullable=True)
    notification_type = db.Column(db.String(50), default='info')
    category_key = db.Column(db.String(100), nullable=True, index=True)
    
    # Additional metadata (JSON stored as text)
    metadata_json = db.Column(db.Text, nullable=True)
    
    # Scheduling
    scheduled_for = db.Column(db.DateTime, nullable=False, index=True)  # When to send
    
    # Status
    cancelled_at = db.Column(db.DateTime, nullable=True)  # If cancelled by site
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User')
    site = db.relationship('Site')
    
    def to_dict(self):
        """Convert pending notification to dictionary."""
        import json
        return {
            'id': self.id,
            'user_id': self.user.keyn_user_id,
            'title': self.title,
            'message': self.message,
            'html_message': self.html_message,
            'type': self.notification_type,
            'category': self.category_key,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'metadata': json.loads(self.metadata_json) if self.metadata_json else None
        }
    
    def __repr__(self):
        return f'<PendingNotification id={self.id} user_id={self.user_id} site_id={self.site_id}>'


class WebPushSubscription(db.Model):
    """Web Push subscriptions for users."""
    __tablename__ = 'web_push_subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Push subscription details
    endpoint = db.Column(db.String(500), nullable=False, unique=True)
    p256dh = db.Column(db.String(200), nullable=False)
    auth = db.Column(db.String(200), nullable=False)
    
    # Metadata
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='web_push_subscriptions')
    
    def to_dict(self):
        """Convert subscription to dictionary."""
        return {
            'endpoint': self.endpoint,
            'keys': {
                'p256dh': self.p256dh,
                'auth': self.auth
            }
        }
    
    def __repr__(self):
        return f'<WebPushSubscription user_id={self.user_id}>'


class SiteNotificationCategory(db.Model):
    """Categories defined by a site that users can opt into/out of and schedule."""
    __tablename__ = 'site_notification_categories'

    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    # Unique key per site (e.g., 'reminders', 'updates')
    key = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    # Default scheduling for the category at site level (can be overridden per user)
    default_frequency = db.Column(db.String(20), default='instant')
    default_time_of_day = db.Column(db.String(5), nullable=True)
    default_weekly_day = db.Column(db.Integer, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    site = db.relationship('Site', back_populates='categories')

    __table_args__ = (
        db.UniqueConstraint('site_id', 'key', name='unique_site_category_key'),
    )

    def to_dict(self):
        return {
            'key': self.key,
            'name': self.name,
            'description': self.description,
            'defaults': {
                'frequency': self.default_frequency,
                'time_of_day': self.default_time_of_day,
                'weekly_day': self.default_weekly_day
            }
        }


class UserCategoryPreference(db.Model):
    """Per-user preferences per category for a site, including schedule overrides."""
    __tablename__ = 'user_category_preferences'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('site_notification_categories.id'), nullable=False)

    # Enable/disable this category for the user
    enabled = db.Column(db.Boolean, default=True)

    # Scheduling overrides for this category
    frequency = db.Column(db.String(20), nullable=True)  # None means use category/site default
    time_of_day = db.Column(db.String(5), nullable=True)
    timezone = db.Column(db.String(100), nullable=True)
    weekly_day = db.Column(db.Integer, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'site_id', 'category_id', name='unique_user_site_category'),
    )

    def to_dict(self):
        return {
            'enabled': self.enabled,
            'schedule': {
                'frequency': self.frequency,
                'time_of_day': self.time_of_day,
                'timezone': self.timezone,
                'weekly_day': self.weekly_day
            }
        }
