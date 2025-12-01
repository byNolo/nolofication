# Nolofication - Quick Reference

## 🚀 Quick Commands

### Development
```bash
./dev.sh                    # Start both backend and frontend in dev mode
./stop.sh                   # Stop all services
./status.sh                 # Check service status
```

### Production
```bash
./prod.sh                   # Build frontend & start production services
./restart.sh                # Restart production services
./stop.sh                   # Stop production services
```

### Backend Only
```bash
cd backend
source venv/bin/activate
flask run                   # Dev server
gunicorn -c gunicorn_config.py app:app  # Production server
python3 scripts/scheduler.py           # Start scheduler
```

### Frontend Only
```bash
cd frontend
npm run dev                 # Dev server
npm run build              # Production build
npm run preview            # Preview production build
```

## 📍 Endpoints

### Live URLs
- **Production**: https://nolofication.bynolo.ca
- **API**: https://nolofication.bynolo.ca/api
- **Admin**: https://nolofication.bynolo.ca/admin

### Local Development
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5005
- **Admin**: http://localhost:5173/admin

## 🔑 Key API Endpoints

### User (Authenticated)
- `GET /api/preferences` - Get global preferences
- `PUT /api/preferences` - Update global preferences
- `GET /api/sites/{site_id}/preferences` - Get site preferences
- `GET /api/notifications` - Notification history

### Site (API Key Required)
- `POST /api/sites/{site_id}/notify` - Send notification
- `GET /api/sites/{site_id}/pending-notifications` - List pending
- `DELETE /api/sites/{site_id}/pending-notifications/{id}` - Cancel notification

### Admin (Admin User Required)
- `GET /api/admin/dashboard` - Stats dashboard
- `GET /api/admin/sites` - List all sites
- `POST /api/admin/sites` - Create site
- `GET /api/admin/users` - List users

## 📊 Database

### Location
- Development: `backend/instance/nolofication.db`
- Production: `backend/instance/nolofication.db`

### Quick Access
```bash
cd backend
sqlite3 instance/nolofication.db

# Useful queries
.tables                                  # List tables
SELECT * FROM sites;                     # List sites
SELECT * FROM users LIMIT 5;             # List users
SELECT * FROM pending_notifications;     # List pending
```

### Models
- `User` - User accounts from KeyN
- `Site` - Registered sites
- `Notification` - Sent notifications log
- `PendingNotification` - Queued scheduled notifications
- `UserPreference` - Global user settings
- `SitePreference` - Per-site user settings
- `SiteNotificationCategory` - Notification categories per site
- `UserCategoryPreference` - User settings per category
- `WebPushSubscription` - Web push subscriptions

## 🛠️ Common Tasks

### Create a New Site
```bash
cd backend
source venv/bin/activate
python3 scripts/admin.py create <site_id> "Site Name" "Description"
python3 scripts/admin.py show <site_id>  # Get API key
```

### Send Test Notification
```bash
python3 scripts/admin.py test-notification <site_id> <keyn_user_id>
```

### Check Logs
```bash
tail -f backend/logs/error.log
tail -f backend/logs/access.log
```

### Database Backup
```bash
cp backend/instance/nolofication.db backend/instance/backup-$(date +%Y%m%d).db
```

## 🔐 Environment Variables

### Backend (.env)
- `SECRET_KEY` - Flask secret key
- `KEYN_BASE_URL` - KeyN OAuth base URL
- `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` - Email config
- `DISCORD_BOT_TOKEN` - Discord bot (optional)
- `ADMIN_API_KEY` - Admin API authentication

### Frontend (.env)
- `VITE_KEYN_CLIENT_ID` - KeyN OAuth client ID
- `VITE_KEYN_BASE_URL` - KeyN OAuth base URL

## 📚 Documentation Files

- **README.md** - Project overview
- **QUICKSTART.md** - Fast setup
- **INTEGRATION_GUIDE.md** - Complete integration docs
- **backend/API.md** - API reference
- **KEYN_OAUTH_SETUP.md** - OAuth setup
- **DEPLOYMENT.md** - Deployment guide
- **CONTRIBUTING.md** - Contribution guide

## 🐛 Troubleshooting

### Services Won't Start
```bash
./stop.sh           # Stop everything
rm backend/*.pid    # Remove stale PIDs
./dev.sh           # Restart
```

### Database Issues
```bash
cd backend
source venv/bin/activate
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

### Frontend Build Errors
```bash
cd frontend
rm -rf node_modules dist .cache
npm install
npm run build
```

### Check Process Status
```bash
ps aux | grep gunicorn     # Backend processes
ps aux | grep scheduler    # Scheduler process
lsof -i :5005             # Check port 5005
lsof -i :5173             # Check port 5173
```

## 🎨 Notification Types

- `info` - Informational (Cyan #2EE9FF)
- `success` - Success messages (Green #00C853)
- `warning` - Warnings (Orange #FF9800)
- `error` - Errors (Red #FF5252)

## 📦 Dependencies

### Backend (Python 3.12)
- Flask 3.0, SQLAlchemy 3.1.1, Gunicorn 21.2.0
- PyJWT, cryptography, pywebpush, requests
- Flask-CORS, Flask-Limiter

### Frontend (Node 22)
- React 19, Vite 7.2.4, TailwindCSS v4
- React Router 7, Lucide React

## 🔗 Related Services

- **KeyN**: https://keyn.bynolo.ca - OAuth authentication
- **byNolo**: https://bynolo.ca - Main website
