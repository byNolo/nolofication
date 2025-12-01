# Changelog

All notable changes to Nolofication will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-30

### Added
- **Core notification system** with multi-channel delivery (Email, Web Push, Discord, Webhooks)
- **Category-based notifications** with user-configurable settings per category
- **Scheduled notifications** supporting instant, daily, and weekly delivery
- **Pending notification queue** with ability to cancel scheduled notifications before delivery
- **KeyN OAuth integration** for secure user authentication
- **Admin web panel** for managing sites, categories, users, and notifications
- **Site API key authentication** for trusted site integrations
- **HTML email support** with beautiful templates in light mode
- **Web Push notifications** via service worker
- **Discord bot integration** for direct messages
- **Webhook notifications** for custom integrations
- **User preference management** at global and per-site levels
- **Category preference overrides** for fine-grained notification control
- **Timezone-aware scheduling** respecting user local times
- **Rate limiting** on notification endpoints (100 req/hour)
- **Notification history** with filtering and pagination
- **Site categories** for organizing notification types
- **Frontend UI** with React 19 + TailwindCSS v4
- **Backend API** with Flask 3.0 + SQLAlchemy
- **Comprehensive documentation** including integration guide, API reference, and setup guides
- **Production deployment scripts** for Gunicorn + Cloudflare Tunnel
- **Scheduler service** for processing pending notifications
- **Admin CLI tools** for site and notification management

### Features
- Send notifications with title, message, type, and optional HTML content
- Bulk notification sending to multiple users
- User-controlled notification preferences (global and per-site)
- Category-based scheduling (different schedules for different notification types)
- Soft deletion of cancelled notifications for audit trail
- Notification metadata for custom data passing
- Site registration with API key generation
- Admin dashboard with statistics
- Site management (create, edit, delete, activate/deactivate)
- Category management (define defaults, user overrides)
- User browsing and monitoring
- Notification history with filtering by site, user, type
- Responsive UI for desktop and mobile
- Clean light-mode email templates
- Service worker for web push notifications
- OAuth callback handling
- JWT token verification
- CORS support for cross-origin requests

### Security
- HTTPS-only in production
- JWT verification via KeyN public key
- Per-site API key authentication
- Admin user verification (KeyN user ID check)
- Rate limiting on public endpoints
- CORS protection
- Environment-based configuration
- Minimal user data storage

### Documentation
- README.md - Project overview and quick start
- INTEGRATION_GUIDE.md - Complete integration documentation
- QUICKSTART.md - Fast setup guide
- API.md - Full API reference
- KEYN_OAUTH_SETUP.md - OAuth configuration guide
- CLOUDFLARE_TUNNEL_SETUP.md - Production deployment guide
- DEPLOYMENT.md - Deployment instructions
- CONTRIBUTING.md - Contribution guidelines
- Brand guidelines and design outline

### Infrastructure
- SQLite database with migrations
- Gunicorn WSGI server
- Vite development server
- Production deployment scripts (prod.sh, restart.sh, stop.sh)
- Development launcher (dev.sh)
- Status checker (status.sh)
- Cloudflare Tunnel integration
- Scheduler process for pending notifications

## [Unreleased]

### Potential Future Enhancements
- PostgreSQL/MySQL support
- Advanced notification analytics
- Notification templates
- Mobile app (React Native)
- Notification sound customization
- Quiet hours per user
- User notification export
- Batch analytics and reporting
