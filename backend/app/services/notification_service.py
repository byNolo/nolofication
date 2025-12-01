"""Notification service for dispatching notifications across channels."""
from flask import current_app
from app import db
from app.models import (
    User, Site, Notification, UserPreference, SitePreference, 
    WebPushSubscription, SiteNotificationCategory, UserCategoryPreference,
    PendingNotification
)
from app.services.channels import EmailChannel, WebPushChannel, DiscordChannel, WebhookChannel
from datetime import datetime, timedelta
import pytz
import json


class NotificationService:
    """Service for managing and dispatching notifications."""
    
    @staticmethod
    def get_user_preferences(user, site):
        """
        Get effective preferences for a user and site.
        
        Combines global preferences with site-specific overrides.
        
        Args:
            user: User model instance
            site: Site model instance
            
        Returns:
            dict: Effective preferences for each channel
        """
        # Get or create global preferences
        global_prefs = UserPreference.query.filter_by(user_id=user.id).first()
        if not global_prefs:
            global_prefs = UserPreference(user_id=user.id)
            db.session.add(global_prefs)
            db.session.commit()
        
        # Get site-specific preferences
        site_prefs = SitePreference.query.filter_by(
            user_id=user.id,
            site_id=site.id
        ).first()
        
        # Build effective preferences (site overrides global)
        effective = {
            'email': global_prefs.email_enabled,
            'web_push': global_prefs.web_push_enabled,
            'discord': global_prefs.discord_enabled,
            'webhook': global_prefs.webhook_enabled,
            'discord_user_id': global_prefs.discord_user_id,
            'webhook_url': global_prefs.webhook_url
        }
        
        if site_prefs:
            if site_prefs.email_enabled is not None:
                effective['email'] = site_prefs.email_enabled
            if site_prefs.web_push_enabled is not None:
                effective['web_push'] = site_prefs.web_push_enabled
            if site_prefs.discord_enabled is not None:
                effective['discord'] = site_prefs.discord_enabled
            if site_prefs.webhook_enabled is not None:
                effective['webhook'] = site_prefs.webhook_enabled
        
        return effective
    
    @staticmethod
    def get_next_scheduled_time(user, site, category_key=None):
        """
        Calculate when a notification should be sent based on user's schedule preferences.
        
        Args:
            user: User model instance
            site: Site model instance
            category_key: Optional category key for category-specific scheduling
            
        Returns:
            datetime: When to send (None means send instantly)
        """
        # Get category preferences if category specified
        if category_key:
            category = SiteNotificationCategory.query.filter_by(
                site_id=site.id, key=category_key
            ).first()
            
            if category:
                # Check for user's category preference
                ucp = UserCategoryPreference.query.filter_by(
                    user_id=user.id, site_id=site.id, category_id=category.id
                ).first()
                
                # Determine frequency (user override > site default > category default)
                frequency = None
                time_of_day = None
                timezone = None
                weekly_day = None
                
                if ucp:
                    frequency = ucp.frequency
                    time_of_day = ucp.time_of_day
                    timezone = ucp.timezone
                    weekly_day = ucp.weekly_day
                
                # Fall back to site preferences
                if not frequency:
                    site_pref = SitePreference.query.filter_by(
                        user_id=user.id, site_id=site.id
                    ).first()
                    if site_pref:
                        frequency = site_pref.frequency
                        time_of_day = time_of_day or site_pref.time_of_day
                        timezone = timezone or site_pref.timezone
                        weekly_day = weekly_day if weekly_day is not None else site_pref.weekly_day
                
                # Fall back to category defaults
                if not frequency:
                    frequency = category.default_frequency or 'instant'
                    time_of_day = time_of_day or category.default_time_of_day
                    weekly_day = weekly_day if weekly_day is not None else category.default_weekly_day
                
                # Calculate next scheduled time
                if frequency != 'instant':
                    tz = pytz.timezone(timezone) if timezone else pytz.UTC
                    now = datetime.utcnow().replace(tzinfo=pytz.UTC)
                    local_now = now.astimezone(tz)
                    
                    if not time_of_day:
                        time_of_day = '09:00'
                    
                    hour, minute = map(int, time_of_day.split(':'))
                    
                    if frequency == 'daily':
                        # Schedule for today or tomorrow at specified time
                        scheduled = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        if scheduled <= local_now:
                            scheduled += timedelta(days=1)
                        return scheduled.astimezone(pytz.UTC).replace(tzinfo=None)
                    
                    elif frequency == 'weekly':
                        # Schedule for next occurrence of weekly_day
                        if weekly_day is None:
                            weekly_day = 0  # Default to Monday
                        
                        days_ahead = weekly_day - local_now.weekday()
                        if days_ahead < 0 or (days_ahead == 0 and local_now.hour >= hour):
                            days_ahead += 7
                        
                        scheduled = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        scheduled += timedelta(days=days_ahead)
                        return scheduled.astimezone(pytz.UTC).replace(tzinfo=None)
        
        return None  # Send instantly
    
    @staticmethod
    def send_notification(user, site, title, message, notification_type='info', 
                         category_key=None, html_message=None, metadata=None):
        """
        Send a notification to a user across enabled channels OR queue it for scheduled delivery.
        
        Args:
            user: User model instance
            site: Site model instance
            title: Notification title
            message: Notification message (plain text, always required)
            notification_type: Type of notification (info, warning, success, error)
            category_key: Optional category key for scheduling
            html_message: Optional HTML version of message (for email)
            metadata: Optional additional data (dict)
            
        Returns:
            dict: Status of delivery or queuing
        """
        # Check if notification should be scheduled
        scheduled_time = NotificationService.get_next_scheduled_time(user, site, category_key)
        
        if scheduled_time:
            # Queue notification for later delivery
            pending = PendingNotification(
                user_id=user.id,
                site_id=site.id,
                title=title,
                message=message,
                html_message=html_message,
                notification_type=notification_type,
                category_key=category_key,
                metadata_json=json.dumps(metadata) if metadata else None,
                scheduled_for=scheduled_time
            )
            db.session.add(pending)
            db.session.commit()
            
            return {
                'status': 'scheduled',
                'scheduled_for': scheduled_time.isoformat(),
                'pending_id': pending.id
            }
        
        # Send immediately
        return NotificationService._dispatch_notification(
            user, site, title, message, notification_type,
            category_key=category_key, html_message=html_message
        )
    
    @staticmethod
    def _dispatch_notification(user, site, title, message, notification_type='info',
                               category_key=None, html_message=None):
        """
        Internal method to actually dispatch a notification across channels.
        
        Args:
            user: User model instance
            site: Site model instance
            title: Notification title
            message: Notification message (plain text)
            notification_type: Type of notification
            category_key: Optional category key
            html_message: Optional HTML version
            
        Returns:
            dict: Status of each channel delivery attempt
        """
        # Get user preferences
        prefs = NotificationService.get_user_preferences(user, site)
        
        # Track delivery status
        status = {
            'email': False,
            'web_push': False,
            'discord': False,
            'webhook': False
        }
        
        # Send via email
        if prefs['email'] and user.email:
            status['email'] = EmailChannel.send(
                user.email,
                title,
                message,
                notification_type,
                html_message=html_message
            )
        
        # Send via web push
        if prefs['web_push']:
            subscriptions = WebPushSubscription.query.filter_by(user_id=user.id).all()
            for subscription in subscriptions:
                try:
                    result = WebPushChannel.send(
                        subscription.to_dict(),
                        title,
                        message,
                        notification_type
                    )
                    if result:
                        status['web_push'] = True
                        subscription.last_used = db.func.now()
                except Exception as e:
                    current_app.logger.error(f"Web push failed for subscription {subscription.id}: {e}")
        
        # Send via Discord
        if prefs['discord']:
            if prefs.get('discord_user_id'):
                status['discord'] = DiscordChannel.send_dm(
                    prefs['discord_user_id'],
                    title,
                    message,
                    notification_type
                )
        
        # Send via webhook
        if prefs['webhook'] and prefs.get('webhook_url'):
            status['webhook'] = WebhookChannel.send(
                prefs['webhook_url'],
                title,
                message,
                notification_type,
                site.name
            )
        
        # Log the notification
        notification = Notification(
            user_id=user.id,
            site_id=site.id,
            title=title,
            message=message,
            notification_type=notification_type,
            category_key=category_key,
            sent_via_email=status['email'],
            sent_via_web_push=status['web_push'],
            sent_via_discord=status['discord'],
            sent_via_webhook=status['webhook']
        )
        db.session.add(notification)
        db.session.commit()
        
        return status
    
    @staticmethod
    def send_bulk_notification(site, user_ids, title, message, notification_type='info', 
                              category_key=None, html_message=None, metadata=None):
        """
        Send a notification to multiple users.
        
        Args:
            site: Site model instance
            user_ids: List of KeyN user IDs
            title: Notification title
            message: Notification message (plain text)
            notification_type: Type of notification
            category_key: Optional category key for scheduling
            html_message: Optional HTML version of message
            metadata: Optional additional data
            
        Returns:
            dict: Summary of delivery results
        """
        results = {
            'total': len(user_ids),
            'successful': 0,
            'scheduled': 0,
            'failed': 0,
            'details': []
        }
        
        for keyn_user_id in user_ids:
            user = User.query.filter_by(keyn_user_id=str(keyn_user_id)).first()
            
            if not user:
                results['failed'] += 1
                results['details'].append({
                    'user_id': keyn_user_id,
                    'status': 'user_not_found'
                })
                continue
            
            try:
                status = NotificationService.send_notification(
                    user, site, title, message, notification_type,
                    category_key=category_key, html_message=html_message, metadata=metadata
                )
                
                if status.get('status') == 'scheduled':
                    results['scheduled'] += 1
                    results['details'].append({
                        'user_id': keyn_user_id,
                        'status': 'scheduled',
                        'scheduled_for': status.get('scheduled_for'),
                        'pending_id': status.get('pending_id')
                    })
                else:
                    results['successful'] += 1
                    results['details'].append({
                        'user_id': keyn_user_id,
                        'status': 'sent',
                        'channels': status
                    })
            except Exception as e:
                results['failed'] += 1
                results['details'].append({
                    'user_id': keyn_user_id,
                    'status': 'error',
                    'error': str(e)
                })
                current_app.logger.error(f"Failed to send notification to user {keyn_user_id}: {e}")
        
        return results
