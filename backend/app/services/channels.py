"""Notification channel handlers."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from discord_webhook import DiscordWebhook, DiscordEmbed
import requests
from pywebpush import webpush, WebPushException
import json


class EmailChannel:
    """Email notification handler."""
    
    @staticmethod
    def send(recipient_email, title, message, notification_type='info', html_message=None):
        """
        Send an email notification.
        
        Args:
            recipient_email: Recipient's email address
            title: Email subject
            message: Plain text email body (fallback)
            notification_type: Type of notification (info, warning, success, error)
            html_message: Optional HTML version of the message
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not current_app.config['SMTP_USERNAME'] or not current_app.config['SMTP_PASSWORD']:
            current_app.logger.warning("SMTP not configured, skipping email")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = title
            msg['From'] = f"{current_app.config['SMTP_FROM_NAME']} <{current_app.config['SMTP_FROM_EMAIL']}>"
            msg['To'] = recipient_email
            
            # Plain text version (always include as fallback)
            text_body = f"{title}\n\n{message}"
            msg.attach(MIMEText(text_body, 'plain'))
            
            # HTML version
            if html_message:
                # Use custom HTML if provided
                html_body = EmailChannel._wrap_custom_html(html_message, title, notification_type)
            else:
                # Use default branded template
                html_body = EmailChannel._create_default_html(title, message, notification_type)
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(current_app.config['SMTP_HOST'], current_app.config['SMTP_PORT']) as server:
                if current_app.config['SMTP_USE_TLS']:
                    server.starttls()
                server.login(current_app.config['SMTP_USERNAME'], current_app.config['SMTP_PASSWORD'])
                server.send_message(msg)
            
            current_app.logger.info(f"Email sent to {recipient_email}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to send email: {str(e)}")
            return False
    
    @staticmethod
    def _create_default_html(title, message, notification_type):
        """Create default branded HTML email template."""
        # Type-specific colors
        type_colors = {
            'info': '#2EE9FF',      # Electric Cyan
            'success': '#00C853',   # Nolo Green
            'warning': '#FFA726',   # Orange
            'error': '#EF5350'      # Red
        }
        border_color = type_colors.get(notification_type, '#00C853')
        
        # Escape HTML in message for security
        import html
        safe_message = html.escape(message).replace('\n', '<br>')
        safe_title = html.escape(title)
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; border-left: 4px solid {border_color}; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 40px 40px 20px;">
                                    <h2 style="color: {border_color}; margin: 0; font-size: 24px; font-weight: 600;">
                                        {safe_title}
                                    </h2>
                                </td>
                            </tr>
                            
                            <!-- Body -->
                            <tr>
                                <td style="padding: 0 40px 30px;">
                                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                                        {safe_message}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="text-align: center;">
                                                <p style="margin: 0; font-size: 12px; color: #6B7280;">
                                                    <span style="color: #00C853; font-weight: 600;">Nolo</span><span style="color: #333333;">fication</span>
                                                    <br>
                                                    Unified notifications for apps byNolo
                                                </p>
                                                <p style="margin: 10px 0 0; font-size: 11px; color: #6B7280;">
                                                    <a href="https://nolofication.bynolo.ca/preferences" 
                                                       style="color: #2EE9FF; text-decoration: none;">
                                                        Manage notification preferences
                                                    </a>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
    
    @staticmethod
    def _wrap_custom_html(custom_html, title, notification_type):
        """Wrap custom HTML in Nolofication branded container."""
        import html
        safe_title = html.escape(title)
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <!-- Custom Content -->
                        <table width="600" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    {custom_html}
                                </td>
                            </tr>
                        </table>
                        
                        <!-- Nolofication Footer -->
                        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                            <tr>
                                <td style="padding: 20px; background-color: #ffffff; border-radius: 8px; border-top: 1px solid #e5e7eb; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                                    <p style="margin: 0; font-size: 11px; color: #6B7280;">
                                        Powered by <span style="color: #00C853; font-weight: 600;">Nolo</span><span style="color: #333333;">fication</span>
                                        · 
                                        <a href="https://nolofication.bynolo.ca/preferences" 
                                           style="color: #2EE9FF; text-decoration: none;">
                                            Manage preferences
                                        </a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """


class WebPushChannel:
    """Web Push notification handler."""
    
    @staticmethod
    def send(subscription_info, title, message, notification_type='info'):
        """
        Send a web push notification.
        
        Args:
            subscription_info: Web push subscription object (dict with endpoint, keys)
            title: Notification title
            message: Notification body
            notification_type: Type of notification
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not current_app.config['VAPID_PRIVATE_KEY'] or not current_app.config['VAPID_PUBLIC_KEY']:
            current_app.logger.warning("VAPID keys not configured, skipping web push")
            return False
        
        try:
            payload = json.dumps({
                'title': title,
                'body': message,
                'type': notification_type,
                'icon': '/icon-192x192.png',
                'badge': '/badge-96x96.png'
            })
            
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=current_app.config['VAPID_PRIVATE_KEY'],
                vapid_claims={
                    "sub": current_app.config['VAPID_SUBJECT']
                }
            )
            
            current_app.logger.info(f"Web push sent to {subscription_info['endpoint'][:50]}...")
            return True
            
        except WebPushException as e:
            current_app.logger.error(f"Failed to send web push: {str(e)}")
            return False
        except Exception as e:
            current_app.logger.error(f"Web push error: {str(e)}")
            return False


class DiscordChannel:
    """Discord notification handler."""
    
    @staticmethod
    def send_dm(user_id, title, message, notification_type='info'):
        """
        Send a Discord DM notification.
        
        Args:
            user_id: Discord user ID
            title: Notification title
            message: Notification message
            notification_type: Type of notification
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not current_app.config['DISCORD_BOT_TOKEN']:
            current_app.logger.warning("Discord bot token not configured, skipping Discord DM")
            return False
        
        if not user_id:
            current_app.logger.warning("No Discord user ID provided")
            return False
        
        try:
            # Discord API headers
            headers = {
                'Authorization': f"Bot {current_app.config['DISCORD_BOT_TOKEN']}",
                'Content-Type': 'application/json'
            }
            
            # Step 1: Create a DM channel with the user
            dm_response = requests.post(
                'https://discord.com/api/v10/users/@me/channels',
                headers=headers,
                json={'recipient_id': str(user_id)},
                timeout=10
            )
            
            if dm_response.status_code != 200:
                current_app.logger.error(f"Failed to create DM channel: {dm_response.status_code} - {dm_response.text}")
                return False
            
            dm_channel = dm_response.json()
            channel_id = dm_channel['id']
            
            # Step 2: Send the message
            # Type-specific colors and emojis
            type_config = {
                'info': {'color': 0x2EE9FF, 'emoji': 'ℹ️'},
                'success': {'color': 0x00C853, 'emoji': '✅'},
                'warning': {'color': 0xFFA726, 'emoji': '⚠️'},
                'error': {'color': 0xEF5350, 'emoji': '❌'}
            }
            config = type_config.get(notification_type, type_config['info'])
            
            # Create embed
            embed = {
                'title': f"{config['emoji']} {title}",
                'description': message,
                'color': config['color'],
                'footer': {
                    'text': 'Nolofication - Manage preferences at nolofication.bynolo.ca'
                },
                'timestamp': None  # Discord will use current time
            }
            
            message_response = requests.post(
                f'https://discord.com/api/v10/channels/{channel_id}/messages',
                headers=headers,
                json={'embeds': [embed]},
                timeout=10
            )
            
            if message_response.status_code not in [200, 201]:
                current_app.logger.error(f"Failed to send Discord message: {message_response.status_code} - {message_response.text}")
                return False
            
            current_app.logger.info(f"Discord DM sent to user {user_id}")
            return True
            
        except requests.RequestException as e:
            current_app.logger.error(f"Discord API request failed: {str(e)}")
            return False
        except Exception as e:
            current_app.logger.error(f"Failed to send Discord DM: {str(e)}")
            return False
    
    @staticmethod
    def send_webhook(webhook_url, title, message, notification_type='info'):
        """
        Send a Discord webhook notification.
        
        Args:
            webhook_url: Discord webhook URL
            title: Notification title
            message: Notification message
            notification_type: Type of notification
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Color mapping for notification types
            color_map = {
                'info': 0x2EE9FF,      # Cyan
                'success': 0x00C853,    # Green
                'warning': 0xFFA726,    # Orange
                'error': 0xEF5350       # Red
            }
            
            webhook = DiscordWebhook(url=webhook_url)
            
            embed = DiscordEmbed(
                title=title,
                description=message,
                color=color_map.get(notification_type, 0x2EE9FF)
            )
            embed.set_footer(text='Nolofication')
            embed.set_timestamp()
            
            webhook.add_embed(embed)
            response = webhook.execute()
            
            if response.status_code in [200, 204]:
                current_app.logger.info(f"Discord webhook sent successfully")
                return True
            else:
                current_app.logger.error(f"Discord webhook failed: {response.status_code}")
                return False
            
        except Exception as e:
            current_app.logger.error(f"Failed to send Discord webhook: {str(e)}")
            return False


class WebhookChannel:
    """Generic webhook notification handler."""
    
    @staticmethod
    def send(webhook_url, title, message, notification_type='info', site_name=None):
        """
        Send a generic webhook notification.
        
        Args:
            webhook_url: Webhook URL
            title: Notification title
            message: Notification message
            notification_type: Type of notification
            site_name: Name of the site sending the notification
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            payload = {
                'title': title,
                'message': message,
                'type': notification_type,
                'site': site_name,
                'timestamp': None  # Will be set by server
            }
            
            response = requests.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code in [200, 201, 202, 204]:
                current_app.logger.info(f"Webhook sent to {webhook_url[:50]}...")
                return True
            else:
                current_app.logger.error(f"Webhook failed: {response.status_code}")
                return False
            
        except requests.RequestException as e:
            current_app.logger.error(f"Failed to send webhook: {str(e)}")
            return False
