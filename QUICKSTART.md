# Nolofication Quick Reference

## 🚀 Getting Started

```bash
# Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Run development server
python app.py

# Run production server
gunicorn -c gunicorn_config.py app:app
```

## 🔧 Common Admin Tasks

```bash
# List all sites
python scripts/admin.py list

# Create a new site (auto-approved)
python scripts/admin.py create <site_id> "<name>" "<description>"

# Approve pending site
python scripts/admin.py approve <site_id>

# Show site details (including API key)
python scripts/admin.py show <site_id>

# Get statistics
python scripts/admin.py stats
```

## 📡 API Quick Examples

### Send Notification (cURL)
```bash
curl -X POST http://localhost:5005/api/sites/myapp/notify \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "keyn-user-id",
    "title": "Hello!",
    "message": "This is a test notification",
    "type": "info"
  }'
```

### Get User Preferences (cURL)
```bash
curl -X GET http://localhost:5005/api/preferences \
  -H "Authorization: Bearer keyn-jwt-token"
```

### Update Preferences (cURL)
```bash
curl -X PUT http://localhost:5005/api/preferences \
  -H "Authorization: Bearer keyn-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": true,
    "web_push": true,
    "discord": false,
    "webhook": false
  }'
```

## 🐍 Python Integration

```python
from examples.integration_example import NoloficationClient

# Initialize
client = NoloficationClient(
    base_url='http://localhost:5005',
    site_id='myapp',
    api_key='your-api-key'
)

# Send single notification
client.send_notification(
    user_id='user123',
    title='New Message',
    message='You have a new message!',
    notification_type='info'
)

# Send bulk notification
client.send_bulk_notification(
    user_ids=['user1', 'user2', 'user3'],
    title='Update Available',
    message='A new version is ready!',
    notification_type='success'
)
```

## 🔑 Environment Variables (Essential)

```bash
# Required
SECRET_KEY=your-secret-key-change-in-production
ADMIN_API_KEY=your-admin-key-change-in-production

# KeyN Integration
KEYN_BASE_URL=https://auth-keyn.bynolo.ca
KEYN_JWT_PUBLIC_KEY_URL=https://auth-keyn.bynolo.ca/api/public-key

# Email (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Web Push (if using web push)
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_PUBLIC_KEY=your-vapid-public-key
```

## 🧪 Testing

```bash
# Test backend setup
python scripts/test.py

# Expected output:
# ✓ Database connected
# ✓ Health endpoint working
# ✓ Public sites endpoint working
# ✓ VAPID key configured
```

## 📊 Notification Types

| Type | Use Case | Color |
|------|----------|-------|
| `info` | General information | Cyan |
| `success` | Positive events | Green |
| `warning` | Important alerts | Orange |
| `error` | Problems/errors | Red |

## 🔐 Authentication Headers

| Endpoint Type | Header | Value |
|--------------|--------|-------|
| User endpoints | `Authorization` | `Bearer <keyn_jwt>` |
| Site endpoints | `X-API-Key` | `<site_api_key>` |
| Admin endpoints | `X-Admin-Key` | `<admin_api_key>` |

## 📝 Preference Hierarchy

```
Site-specific preference (if set)
    ↓ (if null)
Global preference
    ↓ (default)
Default value (email: true, others: false)
```

## 🌐 Default Ports

- Development: `5005`
- Production: Configure in `.env` (PORT variable)

## 📚 Documentation Files

- `README.md` - Project overview
- `backend/README.md` - Backend setup guide
- `backend/API.md` - Complete API reference
- `docs/nolofication_designoutline.md` - Architecture
- `docs/nolofication_brandguidelines.md` - Branding

## 🔗 Useful Endpoints

- Health check: `GET /health`
- Public sites: `GET /api/sites/public`
- VAPID key: `GET /api/webpush/vapid-public-key`

## ⚡ Rate Limits

- Default: 200/day, 50/hour per IP
- Notify endpoint: 100/hour
- Register endpoint: 5/hour

## 🐛 Troubleshooting

**Database not found?**
```bash
# Tables are created automatically on first run
python app.py
```

**VAPID keys missing?**
```bash
pip install py-vapid
vapid --gen
# Add output to .env
```

**Site not approved?**
```bash
python scripts/admin.py approve <site_id>
```

**Can't connect to server?**
```bash
# Make sure server is running
python app.py
# Test health endpoint
curl http://localhost:5005/health
```
