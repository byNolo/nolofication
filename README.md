<div align="center">

# Nolofication - byNolo

**Unified notification service with multi-channel delivery, scheduling, and user-controlled preferences.**  
Email · Web Push · Discord · Webhooks · Category-based Scheduling

[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
![Status](https://img.shields.io/badge/Status-Production-success)
![byNolo](https://img.shields.io/badge/Website-byNolo-34d399?labelColor=0b0f12)

<br />
<sub>Designed, developed &amp; deployed · <strong>Nolofication - byNolo</strong></sub>

</div>

---

## Key Highlights

| Capability | What You Get | Notes |
|------------|--------------|-------|
| Multi-Channel Delivery | Email, Web Push, Discord, Webhooks | Rich HTML emails with fallback |
| Category-Based Notifications | User-configured per category | Reminders, updates, social, etc. |
| Flexible Scheduling | Instant, daily, or weekly delivery | Timezone-aware scheduling |
| Pending Notification Management | Query & cancel scheduled notifications | Perfect for "reminder" workflows |
| KeyN OAuth Integration | Secure user authentication | Unified identity across byNolo |
| Admin Web Panel | Real-time site & user management | Zero command-line required |
| Site API Authentication | API key-based integration | Rate-limited & secure |
| Developer-Friendly | Python, Node.js, PHP examples | Comprehensive integration docs |

---

## Table of Contents
1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Integration Guide](#integration-guide)
4. [Architecture](#architecture)
5. [API Reference](#api-reference)
6. [Category System](#category-system)
7. [Pending Notifications](#pending-notifications)
8. [Security Features](#security-features)
9. [Development](#development)
10. [Configuration](#configuration)
11. [Deployment](#deployment)
12. [Documentation](#documentation)
13. [Brand & Attribution](#brand--attribution)
14. [Support](#support)

---

## Features
Core capabilities for modern notification management:
- **Multi-Channel Delivery** – Email (HTML + plain text), Web Push, Discord DMs, Webhooks
- **Category-Based System** – Sites define notification types (reminders, updates, social, etc.)
- **Flexible Scheduling** – Instant, daily, or weekly delivery with timezone awareness
- **Pending Queue Management** – Query and cancel scheduled notifications before delivery
- **User Preference Control** – Global settings + per-site overrides + per-category customization
- **KeyN OAuth Integration** – Unified authentication across byNolo ecosystem
- **Admin Web Panel** – Manage sites, categories, users, and view notification history
- **Site API Authentication** – Secure API key-based integration for trusted sites
- **Rate Limiting** – Protection against notification spam (100 req/hour)
- **Beautiful Templates** – Light-mode HTML email templates with responsive design
- **Extensible Architecture** – Easy to add new channels or notification types

---

## Architecture
```
┌──────────────┐     ┌────────────────┐      ┌────────────────┐
│  Site Apps   │ ─▶  │  Nolofication  │ ─▶  │  Multi-Channel │
│  (API Keys)  │     │  API Server    │      │  Delivery      │
└──────────────┘     └────────────────┘      └────────────────┘
             │                      │                        │
             │             ┌────────────────┐                │
             └────────────▶│  User Prefs &  │◀──────────────┘
                           │  Scheduling    │
                           └────────────────┘
```

### Components
* `backend/` – Flask 3.0 API + SQLAlchemy (port 5005)
* `frontend/` – React 19 + Vite UI (port 5173)
* `scripts/` – Admin CLI, scheduler daemon, testing utilities
* `docs/` – Integration guides, design documentation

### Tech Stack
* **Backend**: Flask 3.0, SQLAlchemy 3.1.1, Gunicorn 21.2.0, PyJWT
* **Frontend**: React 19, Vite 7.2.4, TailwindCSS v4, React Router 7
* **Database**: SQLite (easily swappable with PostgreSQL/MySQL)
* **Deployment**: Gunicorn + Cloudflare Tunnel + HTTPS
* **Live URL**: https://nolofication.bynolo.ca

---

## Project Structure

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

## Quick Start

### Prerequisites
* Python 3.12+
* Node.js 22+
* SMTP server (Gmail, SendGrid, etc.)
* KeyN OAuth client (see [KEYN_OAUTH_SETUP.md](KEYN_OAUTH_SETUP.md))

### Installation
```bash
git clone https://github.com/SamN20/nolofication.git
cd nolofication

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env → KeyN OAuth, SMTP, secrets

# Initialize database
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Frontend setup
cd ../frontend
npm install
cp .env.example .env
# Edit .env → KeyN client ID

# Launch development servers
cd ..
./dev.sh
```

### Minimal Dev Run
```bash
./dev.sh  # Starts both backend (5005) and frontend (5173)
```

**Production Deployment**
```bash
./prod.sh      # Build & start production
./status.sh    # Check service status
./restart.sh   # Restart services
./stop.sh      # Stop all services
```

---

## Integration Guide
Nolofication exposes a clean REST API for site integration.

**Register Site via CLI**
```bash
cd backend
source venv/bin/activate
python3 scripts/admin.py create your-site-id "Your Site Name" "Description"
python3 scripts/admin.py show your-site-id  # Get API key
```

**Register Site via Admin Panel**
1. Login to https://nolofication.bynolo.ca/admin
2. Navigate to Sites → Create New Site
3. Configure categories and delivery defaults
4. Copy generated API key

**Send Notification (Python)**
```python
import requests

response = requests.post(
    'https://nolofication.bynolo.ca/api/sites/your-site-id/notify',
    headers={'X-API-Key': 'your-site-api-key'},
    json={
        'user_id': 'keyn-user-id',
        'title': 'Welcome!',
        'message': 'Thanks for joining our service',
        'type': 'success',
        'category': 'updates'  # Optional: enables scheduling
    }
)
```

**Integration Flow**
1. Site sends notification with category
2. Nolofication checks user's schedule for that category
3. If instant → delivers immediately
4. If scheduled → queues for later delivery
5. Returns pending_id for potential cancellation

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete examples in Python, Node.js, and PHP.

---

## Category System
Sites define notification categories that users customize:

**Example Categories:**
* `reminders` – Daily task reminders (default: daily 9 AM)
* `updates` – New content notifications (default: instant)
* `social` – Comments, likes, mentions (default: instant)
* `digest` – Weekly summaries (default: weekly Monday 9 AM)

**User Controls:**
* Enable/disable per category
* Override schedule (instant, daily, weekly)
* Set preferred delivery time
* Choose timezone

---

## Pending Notifications
Query and cancel scheduled notifications before delivery.

**Use Case:** Daily vote reminder
```python
# Send reminder (scheduled for user's preferred time)
result = nolofication.send_notification(
    user_id=user.keyn_id,
    title="Don't forget to vote!",
    category='reminders'
)
pending_id = result.get('pending_id')

# User votes → cancel reminder
if pending_id:
    requests.delete(
        f'https://nolofication.bynolo.ca/api/sites/your-site-id/pending-notifications/{pending_id}',
        headers={'X-API-Key': 'your-api-key'}
    )
```

**Query Pending:**
```python
# List all pending for a user
pending = requests.get(
    'https://nolofication.bynolo.ca/api/sites/your-site-id/pending-notifications',
    headers={'X-API-Key': 'your-api-key'},
    params={'user_id': 'keyn-user-id', 'category': 'reminders'}
).json()
```

---

## Security Features
* **HTTPS-Only** - TLS enforcement in production (Cloudflare Tunnel)
* **JWT Verification** - KeyN public key cryptography
* **API Key Authentication** - Secure urlsafe base64 tokens per site
* **Rate Limiting** - 100 req/hour on notification endpoints
* **Admin Role Check** - KeyN user ID verification (configurable admin user)
* **CORS Protection** - Configured allowed origins
* **Soft Deletion** - Audit trail for cancelled notifications
* **Environment Secrets** - No hardcoded credentials

### Admin Interface
Login at `/admin` to access:
* Real-time dashboard with statistics
* Site management (create, edit, activate/deactivate)
* Category configuration with defaults
* User browsing and monitoring
* Notification history with filtering

---

## Development
### Run Services
```bash
./dev.sh              # Start both backend + frontend
./stop.sh             # Stop all services
./status.sh           # Check running processes
```

### Site Management
```bash
cd backend
source venv/bin/activate
python3 scripts/admin.py list
python3 scripts/admin.py create site-id "Site Name" "Description"
python3 scripts/admin.py show site-id
```

### Database Management
```bash
cd backend
sqlite3 instance/nolofication.db
.tables
.schema notifications
SELECT * FROM sites;
```

### Scheduler (Background Process)
```bash
cd backend
source venv/bin/activate
python3 scripts/scheduler.py  # Processes pending notifications every minute
```

### Testing
```bash
cd backend
python3 scripts/test.py
python3 scripts/test_scheduling.py
python3 scripts/admin.py test-notification <site_id> <keyn_user_id>
```

---

## Configuration
Key environment variables (see `.env.example`):

**Backend (`backend/.env`)**
```bash
SECRET_KEY=your-secret-key
KEYN_BASE_URL=https://keyn.bynolo.ca
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DISCORD_BOT_TOKEN=your-discord-token  # Optional
ADMIN_API_KEY=generate-secure-key
CORS_ORIGINS=https://app1.com,https://app2.com
```

**Frontend (`frontend/.env`)**
```bash
VITE_KEYN_CLIENT_ID=nolofication
VITE_KEYN_BASE_URL=https://keyn.bynolo.ca
```

---

## Deployment
1. Configure environment + secrets (see [DEPLOYMENT.md](DEPLOYMENT.md))
2. Enable TLS (Cloudflare Tunnel recommended)
3. Run `./prod.sh` to build + start services
4. Set up scheduler as systemd service or supervisor
5. Monitor logs in `backend/logs/`

See [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md) for production setup.

---

## Documentation
* [Quick Start](QUICKSTART.md) - Fast setup guide
* [Integration Guide](INTEGRATION_GUIDE.md) - Complete integration docs with examples
* [API Reference](backend/API.md) - Full endpoint documentation
* [KeyN OAuth Setup](KEYN_OAUTH_SETUP.md) - Authentication configuration
* [Deployment Guide](DEPLOYMENT.md) - Production deployment
* [Quick Reference](QUICK_REFERENCE.md) - Common commands and tasks
* [Design Outline](docs/nolofication_designoutline.md) - System architecture
* [Brand Guidelines](docs/nolofication_brandguidelines.md) - Visual identity

---

## Brand & Attribution
First mention: **Nolofication – byNolo**. Thereafter: **Nolofication**. Preserve *byNolo* stylization (lowercase b, uppercase N). Optional attribution footer: "Powered by Nolofication – byNolo".

**Color Identity:**
* Primary: Nolo Green `#00C853`
* Accent: Electric Cyan `#2EE9FF`
* Background: `#0B0F10` (dark mode) / `#F5F5F5` (emails)

---

## Support
* Issues: [GitHub Issues](https://github.com/SamN20/nolofication/issues)
* Documentation: Comprehensive guides in `/docs`
* Security: Report privately to repo owner

---

## API Reference
### Authentication
`POST /auth/login` · `GET /auth/callback` · `GET /auth/me` · `POST /auth/logout`

### User Preferences
`GET /api/preferences` · `PUT /api/preferences` · `GET /api/sites/{id}/preferences` · `PUT /api/sites/{id}/preferences`

### Notifications
`POST /api/sites/{id}/notify` · `GET /api/sites/{id}/pending-notifications` · `DELETE /api/sites/{id}/pending-notifications/{id}`

### Categories
`GET /api/sites/{id}/categories` · `GET /api/sites/{id}/my-categories` · `PUT /api/sites/{id}/categories/{key}/preferences`

### Admin (restricted)
`GET /api/admin/dashboard` · `GET /api/admin/sites` · `POST /api/admin/sites` · `PUT /api/admin/sites/{id}` · `DELETE /api/admin/sites/{id}`  
`POST /api/admin/sites/{id}/categories` · `GET /api/admin/users` · `GET /api/admin/notifications`

See [backend/API.md](backend/API.md) for complete reference.

---

### Why Nolofication – byNolo?
Focused on **user empowerment and developer simplicity**: category-based control, scheduling flexibility, and clean integration patterns.

| Principle | Example |
|-----------|---------|
| User Control | Per-category schedules + instant override |
| Flexibility | Daily digests or instant alerts, user decides |
| Cancellation | Pending notification management API |
| Multi-Channel | Email, Push, Discord, Webhooks |
| Developer-Friendly | Simple REST API + comprehensive docs |
| Extensibility | Clean module separation + easy to fork |

---

<p align="center"><sub>Written, designed, deployed - <strong>byNolo</strong>.</sub></p>
