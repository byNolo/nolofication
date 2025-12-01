# Nolofication Scripts Guide

This document explains all the management scripts for running Nolofication in development and production.

## Available Scripts

### 🚀 Production Scripts

#### `./prod.sh`
Starts all services in production mode:
- Stops any running services (using PID files)
- Builds the frontend with Vite
- Starts Gunicorn backend on port 5005
- Starts frontend server on port 5173
- Starts notification scheduler daemon

**Usage:**
```bash
./prod.sh
```

**What it does:**
1. Safely stops old processes using PID files (won't affect other sites on shared servers)
2. Builds optimized frontend bundle
3. Starts backend with 4 Gunicorn workers
4. Serves static frontend files
5. Starts background scheduler for daily/weekly notifications

**PID Files:**
- Backend: `backend/gunicorn.pid`
- Frontend: `frontend/frontend.pid`
- Scheduler: `backend/scheduler.pid`

**Logs:**
- Backend: `backend/logs/error.log` & `backend/logs/access.log`
- Frontend: `backend/logs/frontend.log`
- Scheduler: `backend/logs/scheduler.log`

---

#### `./stop.sh`
Stops all production services gracefully:
- Reads PID files and kills processes
- Cleans up PID files
- Force kills if processes don't stop within timeout

**Usage:**
```bash
./stop.sh
```

**What it does:**
1. Stops backend (Gunicorn)
2. Stops frontend (serve)
3. Stops scheduler
4. Shows summary of stopped services

**Safety features:**
- Only kills processes from PID files (safe for shared servers)
- Force kills stuck processes after timeout
- Cleans up stale PID files

---

#### `./restart.sh`
Convenience script that stops and starts all services:

**Usage:**
```bash
./restart.sh
```

**Equivalent to:**
```bash
./stop.sh
sleep 2
./prod.sh
```

---

#### `./status.sh`
Check the status of all services:

**Usage:**
```bash
./status.sh
```

**What it shows:**
- Backend: Running status, PID, health check
- Frontend: Running status, PID, port accessibility
- Scheduler: Running status, PID, last log line
- Summary of running/stopped services
- Service URLs and log file locations

**Example output:**
```
📊 Nolofication Services Status
================================

🐍 Backend (Gunicorn):
   ✅ Running (PID: 12345)
   ✅ Health check: OK

⚛️  Frontend (Serve):
   ✅ Running (PID: 12346)
   ✅ Port 5173: Responding

⏰ Scheduler:
   ✅ Running (PID: 12347)
   📝 Last log: Checking scheduled notifications...

================================
✅ All services running (3/3)
```

---

### 🛠️ Development Scripts

#### `./dev.sh`
Runs services in development mode with hot reload:

**Usage:**
```bash
# Without scheduler
./dev.sh

# With scheduler (optional)
./dev.sh --with-scheduler
# or
./dev.sh -s
```

**What it does:**
- Starts Flask in debug mode with auto-reload
- Starts Vite dev server with HMR (Hot Module Replacement)
- Optionally starts scheduler in development mode
- All processes run in foreground
- Press Ctrl+C to stop all services

**When to use:**
- Active development
- Testing changes
- Debugging issues

**When NOT to use:**
- Production deployment
- Long-running background tasks
- Shared servers with other users

---

## Quick Reference

| Task | Command | Use Case |
|------|---------|----------|
| Start production | `./prod.sh` | Deploy to production |
| Stop production | `./stop.sh` | Maintenance or shutdown |
| Restart production | `./restart.sh` | After code updates |
| Check status | `./status.sh` | Monitor services |
| Develop locally | `./dev.sh` | Active development |
| Develop with scheduler | `./dev.sh -s` | Test scheduling features |

---

## Service Details

### Backend (Gunicorn)
- **Port:** 5005
- **Workers:** 4
- **Timeout:** 120 seconds
- **Mode:** WSGI daemon
- **Health check:** `http://localhost:5005/health`

### Frontend (Serve)
- **Port:** 5173
- **Serves:** `frontend/dist` (built files)
- **Production build:** Vite optimized bundle

### Scheduler
- **Runs:** Every minute
- **Function:** Dispatches daily/weekly notifications based on user preferences
- **Dependencies:** Requires backend database
- **Logs:** Check `backend/logs/scheduler.log` for activity

---

## Common Tasks

### Deploy Updates
```bash
# Pull latest code
git pull

# Restart services (rebuilds frontend automatically)
./restart.sh
```

### View Logs
```bash
# Backend errors
tail -f backend/logs/error.log

# Backend access logs
tail -f backend/logs/access.log

# Scheduler activity
tail -f backend/logs/scheduler.log

# Frontend server
tail -f backend/logs/frontend.log
```

### Troubleshooting

#### Services won't start
```bash
# Check what's using the ports
lsof -i :5005  # Backend
lsof -i :5173  # Frontend

# Check status
./status.sh

# Clean up and restart
./stop.sh
./prod.sh
```

#### Scheduler not processing
```bash
# Check if running
./status.sh

# Check logs
tail -30 backend/logs/scheduler.log

# Restart just the scheduler
cd backend
kill $(cat scheduler.pid)
nohup python scripts/scheduler.py > logs/scheduler.log 2>&1 &
echo $! > scheduler.pid
```

#### Frontend not serving
```bash
# Rebuild frontend
cd frontend
npm run build
cd ..

# Restart frontend only
kill $(cat frontend/frontend.pid)
cd frontend
nohup npx serve -s dist -l 5173 > ../backend/logs/frontend.log 2>&1 &
echo $! > frontend.pid
```

---

## Safety Notes

### Shared Server Considerations
All production scripts use **PID files** instead of `pkill` to ensure:
- Only your processes are stopped
- Other users' services are not affected
- Clean process management

**Never use:**
```bash
pkill -f gunicorn  # ❌ Kills all Gunicorn processes on server
pkill -f serve     # ❌ Kills all serve processes on server
```

**Always use:**
```bash
./stop.sh          # ✅ Only stops your services
./restart.sh       # ✅ Safe restart
```

---

## Process Management

### PID Files Location
- `backend/gunicorn.pid` - Backend process
- `frontend/frontend.pid` - Frontend process  
- `backend/scheduler.pid` - Scheduler process

### Manual Process Control
```bash
# Check if process is running
ps -p $(cat backend/gunicorn.pid)

# Kill specific process
kill $(cat backend/gunicorn.pid)

# Force kill if needed
kill -9 $(cat backend/gunicorn.pid)

# Clean up PID file
rm backend/gunicorn.pid
```

---

## Environment Variables

Scripts respect these environment variables:

- `FLASK_ENV` - Set to 'development' or 'production' (default: production)
- `FLASK_DEBUG` - Enable debug mode in development (default: 1 for dev.sh)

Development mode:
```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
./dev.sh
```

Production mode:
```bash
export FLASK_ENV=production
./prod.sh
```
