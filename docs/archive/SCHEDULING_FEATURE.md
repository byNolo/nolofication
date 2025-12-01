# Notification Scheduling & Categories Feature

## Overview

Nolofication now supports flexible scheduling and category-based notification management, giving users fine-grained control over when and what notifications they receive.

## Key Features

### 1. Notification Categories
Sites can define multiple notification categories (e.g., "reminders", "updates", "security") that users can enable/disable independently.

### 2. Flexible Scheduling
Three delivery modes:
- **Instant**: Real-time delivery (default)
- **Daily**: Batch notifications once per day at user's preferred time
- **Weekly**: Batch notifications once per week on user's preferred day

### 3. User Control
Users can configure:
- **Global preferences**: Default channels across all sites
- **Site-level defaults**: Default schedule for a site
- **Per-category settings**: Override schedule for specific notification types

## Architecture

### Database Models

**SiteNotificationCategory**
- Defines notification types per site
- Sets default delivery frequency
- Stores default time/day preferences

**UserCategoryPreference**
- Per-user preferences for each category
- Enable/disable specific categories
- Override scheduling settings

**SitePreference** (Extended)
- Added scheduling fields: frequency, time_of_day, timezone, weekly_day
- Site-level defaults for users

**Notification** (Extended)
- Added category_key field to track notification type

### API Endpoints

#### Category Management (Admin)
```
POST   /api/sites/{site_id}/categories          - Create category
GET    /api/sites/{site_id}/categories          - List categories
PUT    /api/sites/{site_id}/categories/{key}    - Update category
```

#### User Preferences
```
GET    /api/sites/{site_id}/categories                              - List with user prefs
PUT    /api/sites/{site_id}/categories/{key}/preferences            - Update category pref
PUT    /api/sites/{site_id}/preferences                             - Update site prefs (includes schedule)
```

### Scheduler

**Location**: `backend/scripts/scheduler.py`

**How it works**:
1. Runs every minute
2. Checks all users and their category preferences
3. For scheduled categories (daily/weekly), checks if current time matches user's preference
4. Respects user timezones
5. Dispatches pending notifications via configured channels

**Running the scheduler**:
```bash
cd backend
source venv/bin/activate
python scripts/scheduler.py
```

For production, use a process manager:
```bash
# systemd service
sudo systemctl start nolofication-scheduler
```

## Usage Guide

### For Site Developers

#### 1. Define Categories

Create categories for your site:
```bash
curl -X POST https://nolofication.bynolo.ca/api/sites/your-site/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "key": "reminders",
    "name": "Daily Reminders",
    "description": "Task and deadline reminders",
    "defaults": {
      "frequency": "daily",
      "time_of_day": "09:00"
    }
  }'
```

#### 2. Send Categorized Notifications

```python
# Python example
nolofication.send_notification(
    user_id=user_id,
    title="Task Reminder",
    message="Don't forget to complete your task",
    category='reminders'  # User's schedule for 'reminders' applies
)
```

The notification will be delivered according to the user's preference:
- If user has 'reminders' set to instant → delivered immediately
- If user has 'reminders' set to daily at 6 PM → batched until 6 PM
- If user has 'reminders' disabled → not delivered

### For Users

Users configure preferences at:
`https://nolofication.bynolo.ca/sites/{site-id}/preferences`

**Options**:
1. **Channel overrides**: Choose which channels to use per site
2. **Default schedule**: Set site-wide delivery timing
3. **Category preferences**: Fine-tune each notification type
   - Enable/disable category
   - Set frequency (instant/daily/weekly)
   - Choose time of day
   - Set timezone
   - Pick day of week (for weekly)

## Best Practices

### Category Design

**Instant categories**:
- Security alerts
- Real-time interactions (comments, mentions)
- Urgent notifications

**Daily categories**:
- Task reminders
- Activity summaries
- Daily digests

**Weekly categories**:
- Performance reports
- Weekly recaps
- Newsletter content

### Example Category Setup

```json
{
  "categories": [
    {
      "key": "security",
      "name": "Security Alerts",
      "defaults": { "frequency": "instant" }
    },
    {
      "key": "reminders",
      "name": "Task Reminders",
      "defaults": {
        "frequency": "daily",
        "time_of_day": "09:00"
      }
    },
    {
      "key": "social",
      "name": "Social Activity",
      "defaults": { "frequency": "instant" }
    },
    {
      "key": "digest",
      "name": "Weekly Summary",
      "defaults": {
        "frequency": "weekly",
        "time_of_day": "09:00",
        "weekly_day": 0
      }
    }
  ]
}
```

## Testing

Run the test suite:
```bash
cd backend
python scripts/test_scheduling.py
```

Test API endpoints:
```bash
# List categories
curl http://localhost:5000/api/sites/test-site/categories

# Update user category preference (requires auth)
curl -X PUT http://localhost:5000/api/sites/test-site/categories/reminders/preferences \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "enabled": true,
    "schedule": {
      "frequency": "daily",
      "time_of_day": "18:00",
      "timezone": "America/New_York"
    }
  }'
```

## Migration Guide

### Existing Sites

1. **Define categories**: Create categories for your notification types
2. **Update send calls**: Add `category` parameter to notification sends
3. **No breaking changes**: Existing notifications without categories work as before (instant delivery)

### Database Migration

The new models are created automatically via SQLAlchemy's `db.create_all()`. For production:

```bash
# Backup database first
sqlite3 instance/nolofication.db ".backup backup.db"

# Restart application to create new tables
sudo systemctl restart nolofication
```

## Troubleshooting

**Scheduled notifications not sending?**
- Check scheduler is running: `ps aux | grep scheduler`
- Verify user has category enabled
- Check timezone settings
- Review scheduler logs

**Categories not showing?**
- Ensure categories are created for the site
- Verify site is active and approved
- Check API response for errors

**User preferences not saving?**
- Verify authentication token
- Check site_id and category_key match
- Review browser console for errors

## Future Enhancements

Potential improvements:
- [ ] Notification batching preview
- [ ] Smart scheduling based on user engagement
- [ ] Category templates for common use cases
- [ ] Bulk category creation API
- [ ] Analytics per category
- [ ] A/B testing for delivery times

## Support

For issues or questions:
- Review integration guide: `/INTEGRATION_GUIDE.md`
- Check API documentation: `/backend/API.md`
- Contact Nolofication admin
