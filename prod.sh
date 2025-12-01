#!/bin/bash
# Production launcher for Nolofication
# Stops old processes, rebuilds, and starts backend, frontend, and scheduler

set -e

echo "🚀 Starting Nolofication in production mode..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Kill old production processes using PID files (safer for shared servers)
echo "🔍 Checking for running production processes..."

# Stop backend
if [ -f "backend/gunicorn.pid" ]; then
    BACKEND_PID=$(cat backend/gunicorn.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping old backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
    fi
    rm backend/gunicorn.pid
fi

# Stop frontend
if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping old frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
    fi
    rm frontend/frontend.pid
fi

# Stop scheduler
if [ -f "backend/scheduler.pid" ]; then
    SCHEDULER_PID=$(cat backend/scheduler.pid)
    if ps -p $SCHEDULER_PID > /dev/null 2>&1; then
        echo "🛑 Stopping old scheduler (PID: $SCHEDULER_PID)..."
        kill $SCHEDULER_PID 2>/dev/null || true
        sleep 1
    fi
    rm backend/scheduler.pid
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Start backend with gunicorn
echo "🐍 Starting backend with Gunicorn..."
cd backend
source venv/bin/activate

# Create logs directory if it doesn't exist
mkdir -p logs

# Start gunicorn in background
gunicorn \
    --bind 0.0.0.0:5005 \
    --workers 4 \
    --timeout 120 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --daemon \
    --pid gunicorn.pid \
    "app:create_app()"

# Wait for PID file to be created
sleep 1
if [ -f gunicorn.pid ]; then
    BACKEND_PID=$(cat gunicorn.pid)
    echo "✅ Backend started (PID: $BACKEND_PID)"
else
    echo "⚠️  Backend started but PID file not found"
    BACKEND_PID="unknown"
fi
cd ..

# Serve frontend with a simple HTTP server
echo "⚛️  Starting frontend server..."
cd frontend

# Check if 'serve' is installed, if not install it
if ! command -v serve &> /dev/null; then
    echo "📥 Installing 'serve' package..."
    npm install -g serve
fi

# Start serve in background
nohup serve -s dist -l 5173 > ../backend/logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
echo "✅ Frontend started (PID: $FRONTEND_PID)"
cd ..

# Start scheduler
echo "⏰ Starting notification scheduler..."
cd backend
nohup python scripts/scheduler.py > logs/scheduler.log 2>&1 &
SCHEDULER_PID=$!
echo $SCHEDULER_PID > scheduler.pid
echo "✅ Scheduler started (PID: $SCHEDULER_PID)"
cd ..

echo ""
echo "✅ Production services running:"
echo "   Backend:   http://localhost:5005 (PID: $BACKEND_PID)"
echo "   Frontend:  http://localhost:5173 (PID: $FRONTEND_PID)"
echo "   Scheduler: Running (PID: $SCHEDULER_PID)"
echo ""
echo "📊 Logs:"
echo "   Backend:   backend/logs/error.log & backend/logs/access.log"
echo "   Frontend:  backend/logs/frontend.log"
echo "   Scheduler: backend/logs/scheduler.log"
echo ""
echo "🛑 To stop services, run: ./stop.sh"
echo ""
