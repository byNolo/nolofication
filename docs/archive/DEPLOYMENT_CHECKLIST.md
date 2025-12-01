# Deployment Checklist - Scheduling & Categories Feature

## Pre-Deployment

- [ ] Review all code changes in:
  - `backend/app/models/__init__.py`
  - `backend/app/routes/categories.py`
  - `backend/app/routes/preferences.py`
  - `backend/app/__init__.py`
  - `backend/scripts/scheduler.py`
  - `frontend/src/pages/SitePreferences.jsx`
  - `frontend/src/utils/api.js`

- [ ] Review documentation:
  - `INTEGRATION_GUIDE.md` - Updated with categories
  - `SCHEDULING_FEATURE.md` - New feature docs
  - `IMPLEMENTATION_SUMMARY.md` - Implementation overview

- [ ] Backup production database
  ```bash
  sqlite3 instance/nolofication.db ".backup backup-$(date +%Y%m%d).db"
  ```

## Backend Deployment

### 1. Install Dependencies
```bash
cd /home/sam/nolofication/backend
source venv/bin/activate
pip install -r requirements.txt
```

Expected new packages:
- APScheduler==3.10.4
- pytz==2024.1

### 2. Verify Database Migration
```bash
# New tables will be created automatically on app start
# Verify tables exist after restart:
sqlite3 instance/nolofication.db "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected new tables:
- `site_notification_categories`
- `user_category_preferences`

### 3. Restart Application
```bash
# Development
./stop.sh
./dev.sh

# Production
sudo systemctl restart nolofication
sudo systemctl status nolofication
```

### 4. Verify API Endpoints
```bash
# Test category endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/sites/public
```

### 5. Start Scheduler (Production)
```bash
# Option 1: Run in screen/tmux
screen -S scheduler
cd /home/sam/nolofication/backend
source venv/bin/activate
python scripts/scheduler.py

# Option 2: Create systemd service
sudo nano /etc/systemd/system/nolofication-scheduler.service
```

**Systemd service file:**
```ini
[Unit]
Description=Nolofication Scheduler
After=network.target

[Service]
Type=simple
User=sam
WorkingDirectory=/home/sam/nolofication/backend
Environment="FLASK_ENV=production"
ExecStart=/home/sam/nolofication/backend/venv/bin/python /home/sam/nolofication/backend/scripts/scheduler.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nolofication-scheduler
sudo systemctl start nolofication-scheduler
sudo systemctl status nolofication-scheduler
```

## Frontend Deployment

### 1. Build Frontend
```bash
cd /home/sam/nolofication/frontend
npm install  # If any new dependencies
npm run build
```

### 2. Restart Frontend (if needed)
```bash
# If running with dev server
./stop.sh
./dev.sh

# If serving static build, nginx reload
sudo systemctl reload nginx
```

### 3. Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Or increment version in package.json

## Post-Deployment Testing

### 1. Test Backend APIs
```bash
# Test category listing (should return empty array or existing categories)
curl http://localhost:5000/api/sites/test-site/categories

# Run test suite
cd backend
python scripts/test_scheduling.py
```

### 2. Test Frontend UI
- [ ] Visit http://localhost:3000 (or production URL)
- [ ] Log in with test account
- [ ] Navigate to site preferences page
- [ ] Verify new scheduling UI appears
- [ ] Verify category section (if categories exist)
- [ ] Test saving preferences

### 3. Create Test Categories
```bash
# Via Python
cd backend
python scripts/test_scheduling.py

# Or via admin tools
python scripts/admin.py  # Follow prompts
```

### 4. Verify Scheduler
```bash
# Check scheduler is running
ps aux | grep scheduler

# Check scheduler logs
tail -f logs/scheduler.log  # If logging configured

# Or check systemd logs
sudo journalctl -u nolofication-scheduler -f
```

## Verification Steps

### Backend Verification
- [ ] All API endpoints return 200 OK
- [ ] New database tables exist
- [ ] No errors in application logs
- [ ] Scheduler process is running

### Frontend Verification
- [ ] Site preferences page loads without errors
- [ ] Schedule settings UI displays correctly
- [ ] Category preferences UI displays correctly
- [ ] Saving preferences works
- [ ] No console errors in browser

### Integration Verification
- [ ] Send test notification with category
- [ ] Verify category appears in notification log
- [ ] User preferences are respected
- [ ] Scheduled notifications dispatch at correct time

## Rollback Plan

If issues occur:

### 1. Stop New Services
```bash
sudo systemctl stop nolofication-scheduler
```

### 2. Revert Code
```bash
git checkout HEAD~1  # Or specific commit
```

### 3. Restore Database (if needed)
```bash
cd backend/instance
mv nolofication.db nolofication-new.db
cp backup-YYYYMMDD.db nolofication.db
```

### 4. Restart Services
```bash
sudo systemctl restart nolofication
cd frontend && npm run build
```

## Monitoring

### What to Monitor
- [ ] Scheduler uptime (systemd status)
- [ ] API response times
- [ ] Database growth (new tables)
- [ ] Error logs
- [ ] User feedback on new features

### Logs to Watch
```bash
# Application logs
tail -f backend/logs/app.log

# Scheduler logs
sudo journalctl -u nolofication-scheduler -f

# Nginx logs (if applicable)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## User Communication

### Notify Users
- [ ] Announce new scheduling feature
- [ ] Link to preferences page
- [ ] Explain category options
- [ ] Provide timezone guidance

**Example announcement:**
```
🎉 New Feature: Notification Scheduling!

You now have more control over your notifications:
• Choose instant, daily, or weekly delivery
• Set your preferred notification time
• Enable/disable specific notification types
• Configure timezone for accurate delivery

Visit Settings → Notifications to customize your preferences.
```

## Documentation Updates

- [ ] Update API documentation if public API docs exist
- [ ] Add scheduling examples to developer portal
- [ ] Update user help/FAQ section
- [ ] Create video tutorial (optional)

## Success Criteria

✅ Deployment is successful when:
- [ ] All services running without errors
- [ ] Users can access new preferences UI
- [ ] Notifications respect category settings
- [ ] Scheduler dispatches notifications on schedule
- [ ] No increase in error rates
- [ ] User feedback is positive

## Support Preparation

### Common Issues & Solutions

**Issue**: Categories not showing
- **Solution**: Ensure categories are created for the site via admin

**Issue**: Scheduled notifications not sending
- **Solution**: Verify scheduler is running, check timezone settings

**Issue**: Preferences not saving
- **Solution**: Check browser console, verify auth token, check API logs

**Issue**: Time zone confusion
- **Solution**: Use IANA timezone names (e.g., America/New_York)

## Completion Sign-Off

- [ ] Backend deployed and verified
- [ ] Frontend deployed and verified
- [ ] Scheduler running and verified
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Users notified
- [ ] Monitoring in place

**Deployed by**: _________________  
**Date**: _________________  
**Version**: _________________  

---

**Notes**:
