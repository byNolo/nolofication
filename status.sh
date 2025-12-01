#!/bin/bash
# Check status of all Nolofication services

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📊 Nolofication Services Status"
echo "================================"
echo ""

# Check backend
echo "🐍 Backend (Gunicorn):"
if [ -f "backend/gunicorn.pid" ]; then
    BACKEND_PID=$(cat backend/gunicorn.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "   ✅ Running (PID: $BACKEND_PID)"
        # Test health endpoint
        HEALTH=$(curl -s http://localhost:5005/health 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "   ✅ Health check: OK"
        else
            echo "   ⚠️  Health check: FAILED"
        fi
    else
        echo "   ❌ Not running (stale PID file)"
    fi
else
    echo "   ❌ Not running (no PID file)"
fi
echo ""

# Check frontend
echo "⚛️  Frontend (Serve):"
if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "   ✅ Running (PID: $FRONTEND_PID)"
        # Test if port is responding
        if curl -s -I http://localhost:5173 > /dev/null 2>&1; then
            echo "   ✅ Port 5173: Responding"
        else
            echo "   ⚠️  Port 5173: Not responding"
        fi
    else
        echo "   ❌ Not running (stale PID file)"
    fi
else
    echo "   ❌ Not running (no PID file)"
fi
echo ""

# Check scheduler
echo "⏰ Scheduler:"
if [ -f "backend/scheduler.pid" ]; then
    SCHEDULER_PID=$(cat backend/scheduler.pid)
    if ps -p $SCHEDULER_PID > /dev/null 2>&1; then
        echo "   ✅ Running (PID: $SCHEDULER_PID)"
        # Show last few log lines
        if [ -f "backend/logs/scheduler.log" ]; then
            LAST_LOG=$(tail -1 backend/logs/scheduler.log 2>/dev/null)
            if [ ! -z "$LAST_LOG" ]; then
                echo "   📝 Last log: ${LAST_LOG:0:60}..."
            fi
        fi
    else
        echo "   ❌ Not running (stale PID file)"
    fi
else
    echo "   ❌ Not running (no PID file)"
fi
echo ""

# Summary
echo "================================"
RUNNING=0
TOTAL=3

if [ -f "backend/gunicorn.pid" ]; then
    BACKEND_PID=$(cat backend/gunicorn.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        RUNNING=$((RUNNING + 1))
    fi
fi

if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        RUNNING=$((RUNNING + 1))
    fi
fi

if [ -f "backend/scheduler.pid" ]; then
    SCHEDULER_PID=$(cat backend/scheduler.pid)
    if ps -p $SCHEDULER_PID > /dev/null 2>&1; then
        RUNNING=$((RUNNING + 1))
    fi
fi

if [ $RUNNING -eq $TOTAL ]; then
    echo "✅ All services running ($RUNNING/$TOTAL)"
elif [ $RUNNING -eq 0 ]; then
    echo "❌ No services running ($RUNNING/$TOTAL)"
else
    echo "⚠️  Partial services running ($RUNNING/$TOTAL)"
fi
echo ""

# Show URLs
if [ $RUNNING -gt 0 ]; then
    echo "🔗 Service URLs:"
    echo "   Backend:  http://localhost:5005"
    echo "   Frontend: http://localhost:5173"
    echo ""
    echo "📊 Logs:"
    echo "   Backend:   backend/logs/error.log & backend/logs/access.log"
    echo "   Frontend:  backend/logs/frontend.log"
    echo "   Scheduler: backend/logs/scheduler.log"
fi
