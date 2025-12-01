#!/bin/bash
# Development launcher for Nolofication
# Runs backend, frontend, and optionally scheduler in development mode

set -e

echo "🚀 Starting Nolofication in development mode..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Parse arguments
START_SCHEDULER=false
if [[ "$1" == "--with-scheduler" ]] || [[ "$1" == "-s" ]]; then
    START_SCHEDULER=true
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill 0
    wait
    echo "✅ Services stopped"
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📦 Starting Flask backend..."
cd backend
source venv/bin/activate
export FLASK_ENV=development
export FLASK_DEBUG=1
python app.py &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "⚛️  Starting Vite frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Start scheduler if requested
if [ "$START_SCHEDULER" = true ]; then
    echo "⏰ Starting notification scheduler..."
    cd backend
    source venv/bin/activate
    python scripts/scheduler.py &
    SCHEDULER_PID=$!
    cd ..
fi

echo ""
echo "✅ Development servers running:"
echo "   Backend:  http://localhost:5005 (PID: $BACKEND_PID)"
echo "   Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
if [ "$START_SCHEDULER" = true ]; then
    echo "   Scheduler: Running (PID: $SCHEDULER_PID)"
fi
echo ""
if [ "$START_SCHEDULER" = false ]; then
    echo "💡 Tip: Run with --with-scheduler or -s to start the scheduler too"
    echo ""
fi
echo "Press Ctrl+C to stop all servers"
echo ""
echo ""

# Wait for both processes
wait
