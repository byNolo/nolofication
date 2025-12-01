# Notification Scheduling & Categories - Quick Start

## What's New?

Nolofication now supports **scheduled notifications** and **category-based preferences**, giving users unprecedented control over when and what notifications they receive.

## 🎯 Key Features

### For Users
- ✅ **Choose notification types** - Enable only the categories you want
- ✅ **Set your schedule** - Instant, daily, or weekly delivery
- ✅ **Pick your time** - Get notifications when it's convenient
- ✅ **Timezone-aware** - Notifications arrive in your local time

### For Developers
- ✅ **Define categories** - Group notifications by type (reminders, updates, social, etc.)
- ✅ **Flexible defaults** - Set sensible defaults per category
- ✅ **Backward compatible** - Existing code works without changes
- ✅ **Simple integration** - Just add a `category` parameter

## 🚀 Quick Start

### For Site Developers

**1. Define categories for your site:**
```python
# Categories are created via admin API or scripts
categories = [
    {
        'key': 'reminders',
        'name': 'Daily Reminders',
        'defaults': {'frequency': 'daily', 'time_of_day': '09:00'}
    },
    {
        'key': 'updates',
        'name': 'Product Updates',
        'defaults': {'frequency': 'instant'}
    }
]
```

**2. Send notifications with categories:**
```python
from services.nolofication import nolofication

# Send a reminder (user's schedule applies)
nolofication.send_notification(
    user_id=user_id,
    title="Task Due Soon",
    message="Complete your project today",
    category='reminders'  # ← Add this
)
```

That's it! The notification will be delivered according to the user's preference for the "reminders" category.

### For Users

**Configure your preferences:**
1. Go to https://nolofication.bynolo.ca
2. Navigate to site-specific preferences
3. See new sections:
   - **Default Schedule** - Set site-wide timing
   - **Notification Categories** - Control each type individually

**Example setup:**
- Security alerts: Instant ✅
- Task reminders: Daily at 6:00 PM 📅
- Social activity: Instant ✅
- Weekly digest: Weekly on Monday at 9:00 AM 📊

## 📚 Documentation

- **[Integration Guide](INTEGRATION_GUIDE.md)** - Complete developer guide
- **[Scheduling Feature Docs](SCHEDULING_FEATURE.md)** - Architecture & usage
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - What was built
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Production deployment steps

## 🔧 Installation

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python scripts/test_scheduling.py  # Verify setup
```

### Start Scheduler
```bash
# Development
python scripts/scheduler.py

# Production (systemd)
sudo systemctl start nolofication-scheduler
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # or npm run build
```

## 📊 Examples

### Instant Notifications (Default)
```python
# Security alert - always instant
nolofication.send_notification(
    user_id=user_id,
    title="Security Alert",
    message="New login from unknown device",
    category='security'  # instant by default
)
```

### Daily Digest
```python
# Task reminder - delivered daily at user's time
nolofication.send_notification(
    user_id=user_id,
    title="Pending Tasks",
    message="You have 3 tasks due today",
    category='reminders'  # user sets daily 9 AM
)
```

### Weekly Summary
```python
# Weekly recap - delivered once per week
nolofication.send_notification(
    user_id=user_id,
    title="Your Weekly Stats",
    message="Here's how your week went",
    category='digest'  # user sets Monday 9 AM
)
```

## 🎨 UI Preview

The new UI includes:
- **Schedule selector** - Instant / Daily / Weekly
- **Time picker** - Choose delivery time
- **Day selector** - Pick day of week (weekly mode)
- **Timezone input** - Your local timezone
- **Category toggles** - Enable/disable per type
- **Per-category overrides** - Fine-tune each category

## 🧪 Testing

**Run tests:**
```bash
cd backend
python scripts/test_scheduling.py
```

**Manual testing:**
```bash
# Create test categories
curl -X POST http://localhost:5000/api/sites/test-site/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"key":"test","name":"Test Category","defaults":{"frequency":"instant"}}'

# Send test notification
curl -X POST http://localhost:5000/api/sites/test-site/notify \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"user_id":"test","title":"Test","message":"Hello","category":"test"}'
```

## 🔄 Migration

**No breaking changes!** Existing code works as-is:
- Notifications without categories → instant delivery
- Existing API calls → unchanged behavior
- Database → auto-migrates on startup

**To adopt new features:**
1. Define categories for your site
2. Add `category` parameter to notification sends
3. Update documentation for users

## 📈 Benefits

### User Experience
- **Reduced notification fatigue** - Batch non-urgent notifications
- **Better control** - Fine-grained preferences
- **Respects user time** - Timezone-aware delivery
- **Opt-in by type** - Only get what you want

### Developer Experience
- **Simple API** - One parameter addition
- **Flexible** - Support many use cases
- **Organized** - Categorize notification types
- **Analytics-ready** - Track by category

## 🛠️ Architecture

```
User Preferences
    ↓
Category Settings (per site)
    ↓
Scheduler (checks every minute)
    ↓
Dispatches at user's local time
    ↓
Delivers via channels (email, push, etc.)
```

**Components:**
- **Models**: SiteNotificationCategory, UserCategoryPreference
- **Routes**: /api/sites/{id}/categories, /api/sites/{id}/categories/{key}/preferences
- **Scheduler**: background worker (scripts/scheduler.py)
- **UI**: SitePreferences page with scheduling controls

## 🎯 Use Cases

### Task Management App
```python
categories = ['reminders', 'updates', 'team_activity']
# Users get reminders daily, team activity instant
```

### Social Platform
```python
categories = ['mentions', 'likes', 'messages', 'digest']
# Users batch likes/mentions, messages instant
```

### SaaS Product
```python
categories = ['security', 'billing', 'features', 'newsletter']
# Security instant, newsletter weekly
```

## 💡 Best Practices

1. **Always instant for security** - Don't delay important alerts
2. **Default to daily for summaries** - Respect user attention
3. **Weekly for analytics** - Batch non-urgent data
4. **Let users customize** - Provide sensible defaults, allow overrides

## 🐛 Troubleshooting

**Categories not showing?**
- Ensure categories are created for your site
- Check site is active/approved

**Scheduled notifications not sending?**
- Verify scheduler is running
- Check user timezone settings
- Review scheduler logs

**Preferences not saving?**
- Check authentication
- Verify API endpoints
- Review browser console

## 🚀 Deployment

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete guide.

**Quick steps:**
1. Install dependencies
2. Restart backend
3. Start scheduler
4. Build frontend
5. Test API endpoints
6. Announce to users

## 📞 Support

- **Documentation**: See files above
- **Issues**: Check GitHub issues or contact admin
- **API Reference**: See `backend/API.md`

## ✨ What's Next?

Future enhancements:
- Notification batching preview
- Smart scheduling based on engagement
- Category analytics dashboard
- Template library

---

**Ready to get started?** See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete instructions.
