# Nolofication Backend

A centralized notification service for the byNolo ecosystem, built with Flask and designed to integrate with KeyN for authentication.

## Features

- **Multi-channel notifications**: Email, Web Push, Discord webhooks, and generic webhooks
- **KeyN OAuth integration**: Secure user authentication via JWT tokens
- **Global and site-specific preferences**: Users can customize notification settings globally or per-site
- **Admin controls**: Site approval, API key management, and notification statistics
- **Rate limiting**: Protects against abuse with configurable rate limits
- **SQLite database**: Lightweight, file-based database for easy deployment

## Project Structure

```
backend/
├── app/
│   ├── __init__.py           # Flask app initialization
│   ├── models/
│   │   └── __init__.py       # Database models
│   ├── routes/
│   │   ├── preferences.py    # User preference endpoints
│   │   ├── notifications.py  # Notification sending/history
│   │   ├── sites.py          # Site registration
│   │   ├── admin.py          # Admin management
│   │   └── webpush.py        # Web push subscriptions
│   ├── services/
│   │   ├── channels.py       # Notification channel handlers
│   │   └── notification_service.py  # Notification dispatching
│   └── utils/
│       └── auth.py           # Authentication decorators
├── app.py                    # Application entry point
├── config.py                 # Configuration management
├── gunicorn_config.py        # Gunicorn server config
├── requirements.txt          # Python dependencies
└── .env.example             # Environment variables template
```

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Required settings
SECRET_KEY=your-secret-key-here
ADMIN_API_KEY=your-admin-api-key

# KeyN OAuth
KEYN_BASE_URL=https://auth-keyn.bynolo.ca
KEYN_JWT_PUBLIC_KEY_URL=https://auth-keyn.bynolo.ca/api/public-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 4. Generate VAPID Keys (for Web Push)

```bash
# Install vapid tool
pip install py-vapid

# Generate keys
vapid --gen

# Copy the output to your .env file
```

### 5. Initialize Database

```bash
python app.py
# Database tables are created automatically on first run
```

## Running the Server

### Development

```bash
# Using Flask development server
python app.py
```

### Production

```bash
# Using Gunicorn
gunicorn -c gunicorn_config.py app:app
```

## API Documentation

### Authentication

Most endpoints require authentication via KeyN JWT tokens or API keys.

**User Authentication** (KeyN JWT):
```
Authorization: Bearer <jwt_token>
```

**Site Authentication** (API Key):
```
X-API-Key: <site_api_key>
```

**Admin Authentication** (Admin Key):
```
X-Admin-Key: <admin_api_key>
```

### Endpoints

#### User Preferences

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/preferences` | User | Get global preferences |
| PUT | `/api/preferences` | User | Update global preferences |
| GET | `/api/sites/{site_id}/preferences` | User | Get site-specific preferences |
| PUT | `/api/sites/{site_id}/preferences` | User | Update site preferences |
| DELETE | `/api/sites/{site_id}/preferences` | User | Delete site preferences |

#### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sites/{site_id}/notify` | Site | Send notification(s) |
| GET | `/api/notifications` | User | Get notification history |
| POST | `/api/notifications/{id}/read` | User | Mark as read |

#### Sites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sites/register` | None | Register new site |
| GET | `/api/sites/public` | None | List active sites |
| GET | `/api/sites` | Admin | List all sites |
| GET | `/api/sites/{site_id}` | Admin | Get site details |
| DELETE | `/api/sites/{site_id}` | Admin | Delete site |

#### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/sites/{site_id}/approve` | Admin | Approve site |
| POST | `/api/admin/sites/{site_id}/activate` | Admin | Activate site |
| POST | `/api/admin/sites/{site_id}/deactivate` | Admin | Deactivate site |
| POST | `/api/admin/sites/{site_id}/regenerate-key` | Admin | Regenerate API key |
| GET | `/api/admin/notifications/stats` | Admin | Get statistics |
| GET | `/api/admin/users` | Admin | List users |

#### Web Push

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/webpush/vapid-public-key` | None | Get VAPID public key |
| POST | `/api/webpush/subscribe` | User | Subscribe to web push |
| POST | `/api/webpush/unsubscribe` | User | Unsubscribe |
| GET | `/api/webpush/subscriptions` | User | List subscriptions |

## Usage Examples

### Register a Site

```bash
curl -X POST http://localhost:5000/api/sites/register \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "vinylvote",
    "name": "Vinyl Vote",
    "description": "Music voting platform",
    "creator_keyn_id": "user123"
  }'
```

Response:
```json
{
  "message": "Site registered successfully. Awaiting admin approval.",
  "site_id": "vinylvote",
  "api_key": "generated-api-key-here",
  "status": "pending_approval"
}
```

### Approve Site (Admin)

```bash
curl -X POST http://localhost:5000/api/admin/sites/vinylvote/approve \
  -H "X-Admin-Key: your-admin-key"
```

### Send Notification (Site)

```bash
curl -X POST http://localhost:5000/api/sites/vinylvote/notify \
  -H "X-API-Key: site-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "keyn-user-id",
    "title": "New Vote Available",
    "message": "A new song is available for voting!",
    "type": "info"
  }'
```

### Bulk Notification

```bash
curl -X POST http://localhost:5000/api/sites/vinylvote/notify \
  -H "X-API-Key: site-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["user1", "user2", "user3"],
    "title": "Contest Results",
    "message": "The voting results are in!",
    "type": "success"
  }'
```

### Update Preferences

```bash
curl -X PUT http://localhost:5000/api/preferences \
  -H "Authorization: Bearer keyn-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": true,
    "web_push": false,
    "discord": true,
    "webhook": false
  }'
```

## Database Models

### User
- Stores minimal user info from KeyN
- Links to preferences and notifications

### Site
- Registered sites that can send notifications
- Each has unique API key
- Requires admin approval

### UserPreference
- Global notification channel preferences
- Stores Discord/webhook URLs

### SitePreference
- Site-specific overrides
- `null` values inherit from global

### Notification
- Log of all sent notifications
- Tracks which channels were used

### WebPushSubscription
- Web push endpoint subscriptions
- One user can have multiple devices

## Security

- **HTTPS Only**: All production deployments must use HTTPS
- **API Key Rotation**: Admins can regenerate site API keys
- **Rate Limiting**: Default limits on sensitive endpoints
- **JWT Verification**: Uses KeyN's public key for token validation
- **Minimal Data Storage**: Only stores necessary user information

## Development

### Running Tests

```bash
# TODO: Add test suite
python -m pytest
```

### Database Migrations

```bash
# For schema changes, you may need to manually migrate
# SQLAlchemy will create tables automatically, but won't alter existing ones
```

## Deployment

1. Set up a production environment with proper secrets
2. Configure SMTP, VAPID keys, and other services
3. Use a reverse proxy (nginx) with SSL/TLS
4. Run with Gunicorn behind the proxy
5. Set up proper logging and monitoring
6. Configure firewall rules

## License

Part of the byNolo ecosystem.
