# Nolofication - Unified Notification Service

**Tagline:** Unified notifications for apps byNolo

A centralized notification service for the byNolo ecosystem, providing multi-channel notifications with user-controlled preferences, category-based scheduling, and KeyN OAuth authentication.

## 🎯 Project Overview

Nolofication is a standalone microservice that handles all notifications for byNolo projects (Vinyl Vote, SideQuest, KeyN, etc.). It provides:

- **Multi-channel delivery**: Email (with HTML support), Web Push, Discord, and webhooks
- **User control**: Global and site-specific preference management with category-based settings
- **Flexible scheduling**: Instant, daily, or weekly notification delivery per category
- **Pending notification management**: Sites can cancel scheduled notifications
- **Secure authentication**: KeyN OAuth integration with JWT verification
- **Site registration**: API key-based authentication for trusted sites
- **Admin controls**: Web-based admin panel for site and user management
- **Beautiful UI**: React 19 frontend with TailwindCSS v4

## 🏗️ Architecture

- **Backend**: Flask 3.0 + SQLAlchemy + SQLite (Python)
- **Frontend**: React 19 + Vite 7.2.4 + TailwindCSS v4
- **Auth**: KeyN OAuth with JWT verification
- **Deployment**: Gunicorn + Cloudflare Tunnel
- **Live URL**: https://nolofication.bynolo.ca

## 📁 Project Structure

```
nolofication/
├── backend/              # Flask backend (Python)
│   ├── app/
│   │   ├── models/      # Database models (User, Site, Notification, etc.)
│   │   ├── routes/      # API endpoints (auth, preferences, notifications, admin)
│   │   ├── services/    # Notification channels (email, push, discord, webhook)
│   │   └── utils/       # Auth & helpers (KeyN JWT verification)
│   ├── scripts/         # Admin, scheduler, and setup scripts
│   │   ├── admin.py     # CLI admin tools
│   │   └── scheduler.py # Scheduled notification dispatcher
│   └── examples/        # Integration examples
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages (Home, Login, Preferences, Admin)
│   │   ├── hooks/       # React hooks (useAuth, useApi)
│   │   └── utils/       # API client
│   └── public/
│       └── sw.js        # Service worker for web push
├── docs/               # Design & integration documentation
├── dev.sh              # Development launcher
├── prod.sh             # Production deployment
├── restart.sh          # Restart production services
└── stop.sh             # Stop production services
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- KeyN OAuth client registration (see [KEYN_OAUTH_SETUP.md](KEYN_OAUTH_SETUP.md))
- SMTP server for email notifications (Gmail, SendGrid, etc.)

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/nolofication.git
cd nolofication

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure backend
cp .env.example .env
# Edit .env with your KeyN OAuth credentials and SMTP settings

# Initialize database
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Return to root
cd ..

# Frontend setup
cd frontend
npm install

# Configure frontend  
cp .env.example .env
# Edit .env with your KeyN client ID

cd ..

# Launch both services in development mode
./dev.sh
```

Visit:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5005
- Admin Panel: http://localhost:5173/admin (login as configured admin user)

### Production

```bash
# Build frontend and start production services
./prod.sh

# Check status
./status.sh

# Restart services
./restart.sh

# Stop services
./stop.sh
```

**Production Requirements:**
- Configure Cloudflare Tunnel for HTTPS (see [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md))
- Set up supervisor or systemd for scheduler process
- Configure production-grade SMTP
- Use strong secret keys in `.env`

## 🔐 Authentication Setup

Nolofication uses **KeyN OAuth** for user authentication. See [KEYN_OAUTH_SETUP.md](KEYN_OAUTH_SETUP.md) for detailed setup instructions.

Quick steps:
1. Register OAuth application with KeyN at https://keyn.bynolo.ca
2. Set redirect URI to `http://localhost:5173/auth/callback` (dev) or your production URL
3. Update `VITE_KEYN_CLIENT_ID` in `frontend/.env`
4. Update `KEYN_CLIENT_ID` and `KEYN_CLIENT_SECRET` in `backend/.env`
5. Test login flow

## ✨ Key Features

### Category-Based Notifications
Sites can define notification categories (e.g., "reminders", "updates", "social") that users can:
- Enable/disable individually
- Set custom delivery schedules (instant, daily, weekly)
- Configure preferred delivery times per category

### Pending Notification Management
Sites can:
- Query pending scheduled notifications
- Cancel notifications before they're sent
- Perfect for "vote reminder" scenarios where action completion makes notification unnecessary

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete examples.

### Multi-Channel Delivery
- **Email**: Beautiful HTML templates with plain text fallback
- **Web Push**: Browser notifications via service worker
- **Discord**: Direct messages via Discord bot
- **Webhooks**: HTTP POST to custom endpoints

### Admin Panel
Web-based admin interface for managing:
- Sites (create, edit, delete, regenerate API keys)
- Categories (define notification types and defaults)
- Users (browse and monitor)
- Notifications (view delivery history and stats)
- Dashboard with real-time statistics

## 🔑 Integration Guide

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for comprehensive integration instructions including:
- Site registration
- Category setup
- Backend integration examples (Python, Node.js, PHP)
- Scheduling and digests
- Cancelling pending notifications
- HTML email templates
- Testing and troubleshooting

### Quick Integration Example

```python
# Install requests
pip install requests

# Send a notification
import requests

response = requests.post(
    'https://nolofication.bynolo.ca/api/sites/your-site-id/notify',
    headers={'X-API-Key': 'your-site-api-key'},
    json={
        'user_id': 'keyn-user-id',
        'title': 'Welcome!',
        'message': 'Thanks for joining our service',
        'type': 'success',
        'category': 'updates',  # Optional: for scheduled delivery
        'html_message': '<h1>Welcome!</h1><p>Thanks for joining</p>'  # Optional
    }
)

print(response.json())
# Response: {'message': 'Notification sent', 'user_id': '...', 'channels': {...}}
# Or if scheduled: {'status': 'scheduled', 'scheduled_for': '...', 'pending_id': 123}
```

### Cancel a Pending Notification

```python
# List pending notifications for a user
response = requests.get(
    'https://nolofication.bynolo.ca/api/sites/your-site-id/pending-notifications',
    headers={'X-API-Key': 'your-api-key'},
    params={'user_id': 'keyn-user-id', 'category': 'reminders'}
)

pending = response.json()['pending_notifications']

# Cancel a specific notification
if pending:
    notification_id = pending[0]['id']
    requests.delete(
        f'https://nolofication.bynolo.ca/api/sites/your-site-id/pending-notifications/{notification_id}',
        headers={'X-API-Key': 'your-api-key'}
    )
```

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Fast setup and first notification
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Complete integration documentation
- **[Backend API Reference](backend/API.md)** - Full API documentation
- **[Backend README](backend/README.md)** - Backend setup and development
- **[Frontend README](frontend/README.md)** - Frontend setup and development
- **[KEYN_OAUTH_SETUP.md](KEYN_OAUTH_SETUP.md)** - OAuth configuration
- **[CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)** - Production deployment
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
- **[Design Outline](docs/nolofication_designoutline.md)** - System architecture
- **[Brand Guidelines](docs/nolofication_brandguidelines.md)** - Visual identity

## 🎨 Design

### Color Palette

- **Primary (Nolo Green)**: `#00C853` - Success states, primary CTAs
- **Accent (Electric Cyan)**: `#2EE9FF` - Interactive elements, info notifications
- **Background**: `#0B0F10` - Deep dark background
- **Surface**: `#13181A` - Card and elevated surfaces
- **Text**: `#F3F7F7` - Primary text on dark backgrounds
- **Muted**: `#6B7280` - Secondary text

### Notification Types

Each type has a distinct color for visual identification:
- **info** - Cyan `#2EE9FF`
- **success** - Green `#00C853`
- **warning** - Orange `#FF9800`
- **error** - Red `#FF5252`

## 🛠️ Tech Stack

### Backend
- **Flask 3.0** - Web framework
- **SQLAlchemy 3.1.1** - ORM
- **SQLite** - Database (easily swappable with PostgreSQL/MySQL)
- **Gunicorn 21.2.0** - Production WSGI server
- **PyJWT** - JWT token verification
- **pywebpush** - Web push notifications
- **Requests** - HTTP client
- **Flask-Limiter** - Rate limiting
- **Flask-CORS** - Cross-origin requests

### Frontend
- **React 19** - UI framework
- **Vite 7.2.4** - Build tool and dev server
- **TailwindCSS v4** - Utility-first CSS
- **React Router 7** - Client-side routing
- **Lucide React** - Icon library

### Development Tools
- **Python 3.12** - Backend runtime
- **Node.js 22** - Frontend runtime
- **ESLint** - Code linting
- **Git** - Version control

## 📊 API Endpoints

### Public Endpoints
- `GET /api/sites/public` - List all active sites
- `GET /api/sites/{site_id}` - Get site details
- `POST /auth/login` - Initiate KeyN OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/me` - Get current user info

### User Endpoints (Requires Auth)
- `GET/PUT /api/preferences` - Global notification preferences
- `GET/PUT /api/sites/{site_id}/preferences` - Site-specific preferences
- `GET /api/sites/{site_id}/categories` - List categories with user settings
- `PUT /api/sites/{site_id}/categories/{key}/preferences` - Update category preferences
- `GET /api/notifications` - Notification history

### Site Endpoints (Requires Site API Key)
- `POST /api/sites/{site_id}/notify` - Send notification to user(s)
- `POST /api/sites/{site_id}/notify/bulk` - Bulk notification sending
- `GET /api/sites/{site_id}/pending-notifications` - List pending scheduled notifications
- `DELETE /api/sites/{site_id}/pending-notifications/{id}` - Cancel pending notification

### Admin Endpoints (Requires Admin Auth)
- `GET /api/admin/dashboard` - Statistics and overview
- `GET/POST/PUT/DELETE /api/admin/sites` - Site management
- `POST /api/admin/sites/{id}/categories` - Create notification category
- `GET /api/admin/users` - List users
- `GET /api/admin/notifications` - All notifications with filtering

See [Backend API Reference](backend/API.md) for complete documentation with request/response examples.

## 🔐 Security Features

- **HTTPS-only** in production via Cloudflare Tunnel
- **JWT verification** via KeyN public key cryptography
- **Per-site API keys** with secure generation (urlsafe base64)
- **Admin authentication** via KeyN user ID verification
- **Rate limiting** on all public endpoints (100 req/hour for notifications)
- **CORS protection** with configured allowed origins
- **Minimal data storage** - only essential user info from KeyN
- **Soft deletion** for audit trails on cancelled notifications
- **Environment-based secrets** - never commit credentials

## 🚦 Project Status

### ✅ Completed Features
- Backend API with all endpoints
- Database models and migrations
- KeyN OAuth integration
- Multi-channel notification delivery (Email, Web Push, Discord, Webhooks)
- Category-based notification system
- Scheduled notifications (instant, daily, weekly)
- Pending notification queue and cancellation
- Admin web panel
- Frontend UI (Home, Login, Preferences, Site Preferences, Notifications, Admin)
- Production deployment with Gunicorn + Cloudflare Tunnel
- HTML email templates (light mode)
- Rate limiting and security measures
- Comprehensive documentation

### 🎯 Potential Future Enhancements
- PostgreSQL/MySQL support for larger deployments
- Advanced notification filtering and search
- Notification templates for common scenarios
- Batch notification analytics
- User notification export
- Mobile app (React Native)
- Notification sound customization
- Quiet hours per user
- Notification preview before sending

## 🤝 Integration Examples

Sites in the byNolo ecosystem that can integrate:

- **Vinyl Vote** - Contest notifications, vote reminders, winner announcements
- **SideQuest** - Quest updates, achievement unlocks, daily streaks
- **KeyN** - Security alerts, login notifications, password changes
- **Portfolio Sites** - Contact form submissions, comment notifications
- **Monitoring Tools** - System alerts, uptime notifications

## 🧪 Testing

```bash
# Backend tests
cd backend
source venv/bin/activate
python3 scripts/test.py

# Test notification sending
python3 scripts/admin.py test-notification <site_id> <user_keyn_id>

# Test scheduler
python3 scripts/test_scheduling.py
```

## 📝 License

Private project - Part of the byNolo ecosystem.

## 👤 Author

**Sam (byNolo)**
- Website: https://bynolo.ca
- KeyN: https://keyn.bynolo.ca

## 🔗 Related Projects

- **KeyN** - OAuth authentication system: https://keyn.bynolo.ca
- **Vinyl Vote** - Music voting platform
- **SideQuest** - Achievement tracking system
