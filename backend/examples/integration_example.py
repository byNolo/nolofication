"""
Example integration with Nolofication.

This demonstrates how to integrate Nolofication into your byNolo app.
"""
import requests
import os


class NoloficationClient:
    """Client for sending notifications via Nolofication."""
    
    def __init__(self, base_url, site_id, api_key):
        """
        Initialize the client.
        
        Args:
            base_url: Nolofication API base URL (e.g., 'https://nolofication.bynolo.ca')
            site_id: Your site's unique identifier
            api_key: Your site's API key
        """
        self.base_url = base_url.rstrip('/')
        self.site_id = site_id
        self.api_key = api_key
    
    def send_notification(self, user_id, title, message, notification_type='info'):
        """
        Send a notification to a single user.
        
        Args:
            user_id: KeyN user ID
            title: Notification title
            message: Notification message
            notification_type: Type ('info', 'success', 'warning', 'error')
            
        Returns:
            dict: Response from the API
        """
        url = f"{self.base_url}/api/sites/{self.site_id}/notify"
        
        payload = {
            'user_id': user_id,
            'title': title,
            'message': message,
            'type': notification_type
        }
        
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Failed to send notification: {e}")
            return None
    
    def send_bulk_notification(self, user_ids, title, message, notification_type='info'):
        """
        Send a notification to multiple users.
        
        Args:
            user_ids: List of KeyN user IDs (max 1000)
            title: Notification title
            message: Notification message
            notification_type: Type ('info', 'success', 'warning', 'error')
            
        Returns:
            dict: Response from the API with delivery status
        """
        url = f"{self.base_url}/api/sites/{self.site_id}/notify"
        
        payload = {
            'user_ids': user_ids,
            'title': title,
            'message': message,
            'type': notification_type
        }
        
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Failed to send bulk notification: {e}")
            return None


# Example usage
if __name__ == '__main__':
    # Initialize client
    client = NoloficationClient(
        base_url=os.getenv('NOLOFICATION_URL', 'http://localhost:5000'),
        site_id=os.getenv('SITE_ID', 'vinylvote'),
        api_key=os.getenv('NOLOFICATION_API_KEY', 'your-api-key')
    )
    
    # Example 1: Send single notification
    print("Sending single notification...")
    result = client.send_notification(
        user_id='test-user-123',
        title='Welcome to Vinyl Vote!',
        message='Thanks for joining our music voting platform.',
        notification_type='success'
    )
    print(f"Result: {result}")
    
    # Example 2: Send bulk notification
    print("\nSending bulk notification...")
    result = client.send_bulk_notification(
        user_ids=['user1', 'user2', 'user3'],
        title='New Contest Starting',
        message='A new voting contest has started! Check it out.',
        notification_type='info'
    )
    print(f"Result: {result}")
    
    # Example 3: Warning notification
    print("\nSending warning...")
    result = client.send_notification(
        user_id='test-user-123',
        title='Vote Closing Soon',
        message='Your vote for "Bohemian Rhapsody" closes in 1 hour!',
        notification_type='warning'
    )
    print(f"Result: {result}")
