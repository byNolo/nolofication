# Nolofication API Reference

Base URL: `https://nolofication.bynolo.ca/api` (or `http://localhost:5005/api` for local development)

## Table of Contents
- [Authentication](#authentication)
- [User Preferences](#user-preferences)
- [Notifications](#notifications)
- [Site Management](#site-management)
- [Web Push](#web-push)
- [Admin](#admin)

---

## Authentication

### User Authentication (KeyN JWT)

All user-facing endpoints require a valid KeyN JWT token.

```http
Authorization: Bearer <jwt_token>
```

### Site Authentication (API Key)

Sites use API keys to send notifications.

```http
X-API-Key: <site_api_key>
```

### Admin Authentication

Admin endpoints require the admin API key.

```http
X-Admin-Key: <admin_api_key>
```

---

## User Preferences

### Get Global Preferences

Get the authenticated user's global notification preferences.

```http
GET /api/preferences
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "email": true,
  "web_push": false,
  "discord": true,
  "webhook": false,
  "discord_user_id": null,
  "webhook_url": null
}
```

### Update Global Preferences

```http
PUT /api/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": true,
  "web_push": true,
  "discord": false,
  "webhook": false,
  "webhook_url": "https://example.com/webhook"
}
```

### Get Site-Specific Preferences

```http
GET /api/sites/{site_id}/preferences
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "site": {
    "id": "vinylvote",
    "name": "Vinyl Vote",
    "description": "Music voting platform"
  },
  "global_preferences": {
    "email": true,
    "web_push": false,
    "discord": true,
    "webhook": false
  },
  "site_preferences": {
    "email": false,
    "web_push": null,
    "discord": null,
    "webhook": null
  },
  "effective_preferences": {
    "email": false,
    "web_push": false,
    "discord": true,
    "webhook": false
  }
}
```

### Update Site Preferences

```http
PUT /api/sites/{site_id}/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": false,
  "web_push": true,
  "discord": null,
  "webhook": null
}
```

**Note:** `null` values mean "use global setting"

### Delete Site Preferences

Removes all site-specific overrides, reverting to global settings.

```http
DELETE /api/sites/{site_id}/preferences
Authorization: Bearer <jwt_token>
```

---

## Notifications

### Send Single Notification

```http
POST /api/sites/{site_id}/notify
X-API-Key: <site_api_key>
Content-Type: application/json

{
  "user_id": "keyn-user-id",
  "title": "New Message",
  "message": "You have a new message from Alice!",
  "type": "info"
}
```

**Types:** `info`, `success`, `warning`, `error`

**Response:**
```json
{
  "message": "Notification sent",
  "user_id": "keyn-user-id",
  "channels": {
    "email": true,
    "web_push": false,
    "discord": true,
    "webhook": false
  }
}
```

### Send Bulk Notification

Send to multiple users at once (max 1000 users).

```http
POST /api/sites/{site_id}/notify
X-API-Key: <site_api_key>
Content-Type: application/json

{
  "user_ids": ["user1", "user2", "user3"],
  "title": "System Maintenance",
  "message": "The system will be down for maintenance tonight.",
  "type": "warning"
}
```

**Response:**
```json
{
  "total": 3,
  "successful": 3,
  "failed": 0,
  "details": [
    {
      "user_id": "user1",
      "status": "sent",
      "channels": { "email": true, "web_push": false, "discord": false, "webhook": false }
    },
    ...
  ]
}
```

### Get Notification History

```http
GET /api/notifications?limit=50&offset=0&site_id=vinylvote
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "total": 123,
  "limit": 50,
  "offset": 0,
  "notifications": [
    {
      "id": 1,
      "title": "New Message",
      "message": "You have a new message!",
      "type": "info",
      "site_id": "vinylvote",
      "site_name": "Vinyl Vote",
      "channels": {
        "email": true,
        "web_push": false,
        "discord": false,
        "webhook": false
      },
      "is_read": false,
      "created_at": "2025-11-29T12:34:56"
    },
    ...
  ]
}
```

### Mark Notification as Read

```http
POST /api/notifications/{notification_id}/read
Authorization: Bearer <jwt_token>
```

---

## Site Management

### Register a Site

```http
POST /api/sites/register
Content-Type: application/json

{
  "site_id": "myapp",
  "name": "My Awesome App",
  "description": "An amazing application",
  "creator_keyn_id": "user123"
}
```

**Response:**
```json
{
  "message": "Site registered successfully. Awaiting admin approval.",
  "site_id": "myapp",
  "api_key": "generated-api-key-here",
  "status": "pending_approval"
}
```

**Important:** Save the API key - it won't be shown again!

### List Public Sites

Get all active, approved sites.

```http
GET /api/sites/public
```

**Response:**
```json
{
  "total": 5,
  "sites": [
    {
      "site_id": "vinylvote",
      "name": "Vinyl Vote",
      "description": "Music voting platform"
    },
    ...
  ]
}
```

---

## Web Push

### Get VAPID Public Key

```http
GET /api/webpush/vapid-public-key
```

**Response:**
```json
{
  "public_key": "BEL3X..."
}
```

### Subscribe to Web Push

```http
POST /api/webpush/subscribe
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BHx...",
    "auth": "abc..."
  }
}
```

### Unsubscribe

```http
POST /api/webpush/unsubscribe
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

### List Subscriptions

```http
GET /api/webpush/subscriptions
Authorization: Bearer <jwt_token>
```

---

## Admin

All admin endpoints require `X-Admin-Key` header.

### Approve Site

```http
POST /api/admin/sites/{site_id}/approve
X-Admin-Key: <admin_api_key>
```

### Activate/Deactivate Site

```http
POST /api/admin/sites/{site_id}/activate
X-Admin-Key: <admin_api_key>
```

```http
POST /api/admin/sites/{site_id}/deactivate
X-Admin-Key: <admin_api_key>
```

### Regenerate API Key

```http
POST /api/admin/sites/{site_id}/regenerate-key
X-Admin-Key: <admin_api_key>
```

**Response:**
```json
{
  "message": "API key regenerated successfully",
  "site_id": "myapp",
  "api_key": "new-api-key-here"
}
```

### Get Statistics

```http
GET /api/admin/notifications/stats
X-Admin-Key: <admin_api_key>
```

**Response:**
```json
{
  "totals": {
    "notifications": 5432,
    "users": 234,
    "sites": 8,
    "active_sites": 6
  },
  "channels": {
    "email": 4123,
    "web_push": 891,
    "discord": 234,
    "webhook": 54
  },
  "by_site": [
    {
      "site_id": "vinylvote",
      "name": "Vinyl Vote",
      "notification_count": 2345
    },
    ...
  ]
}
```

### List Users

```http
GET /api/admin/users?limit=50&offset=0
X-Admin-Key: <admin_api_key>
```

### List All Sites

```http
GET /api/admin/sites
X-Admin-Key: <admin_api_key>
```

### Get User Notifications

```http
GET /api/admin/users/{keyn_user_id}/notifications?limit=50
X-Admin-Key: <admin_api_key>
```

---

## Rate Limits

Default rate limits (configurable):

- Global: 200 requests per day, 50 per hour per IP
- `/api/sites/{site_id}/notify`: 100 per hour
- `/api/sites/register`: 5 per hour

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
