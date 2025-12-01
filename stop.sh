#!/bin/bash
# Stop all Nolofication production services

set -e

echo "🛑 Stopping Nolofication services..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

STOPPED=0

# Stop backend
if [ -f "backend/gunicorn.pid" ]; then
    BACKEND_PID=$(cat backend/gunicorn.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo "⚠️  Backend still running, force killing..."
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        rm -f backend/gunicorn.pid
        echo "✅ Backend stopped"
        STOPPED=$((STOPPED + 1))
    else
        echo "⚠️  Backend process not running (cleaning up PID file)"
        rm -f backend/gunicorn.pid
    fi
else
    echo "⚠️  No backend PID file found"
fi

# Stop frontend
if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo "⚠️  Frontend still running, force killing..."
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        rm -f frontend/frontend.pid
        echo "✅ Frontend stopped"
        STOPPED=$((STOPPED + 1))
    else
        echo "⚠️  Frontend process not running (cleaning up PID file)"
        rm -f frontend/frontend.pid
    fi
else
    echo "⚠️  No frontend PID file found"
fi

# Stop scheduler
if [ -f "backend/scheduler.pid" ]; then
    SCHEDULER_PID=$(cat backend/scheduler.pid)
    if ps -p $SCHEDULER_PID > /dev/null 2>&1; then
        echo "🛑 Stopping scheduler (PID: $SCHEDULER_PID)..."
        kill $SCHEDULER_PID 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if ps -p $SCHEDULER_PID > /dev/null 2>&1; then
            echo "⚠️  Scheduler still running, force killing..."
            kill -9 $SCHEDULER_PID 2>/dev/null || true
        fi
        rm -f backend/scheduler.pid
        echo "✅ Scheduler stopped"
        STOPPED=$((STOPPED + 1))
    else
        echo "⚠️  Scheduler process not running (cleaning up PID file)"
        rm -f backend/scheduler.pid
    fi
else
    echo "⚠️  No scheduler PID file found"
fi

echo ""
if [ $STOPPED -eq 0 ]; then
    echo "⚠️  No services were running"
else
    echo "✅ Stopped $STOPPED service(s)"
fi
