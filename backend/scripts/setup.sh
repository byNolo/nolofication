#!/bin/bash

# Nolofication Backend Quick Start Script

echo "🔥 Nolofication Backend Setup"
echo "================================"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration before running the server!"
fi

# Generate VAPID keys if not set
if ! grep -q "VAPID_PRIVATE_KEY=." .env; then
    echo "Generating VAPID keys for web push..."
    pip install -q py-vapid
    vapid --gen > vapid_keys.txt
    echo "📝 VAPID keys saved to vapid_keys.txt - add them to your .env file"
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Run: python app.py"
echo "  3. Visit: http://localhost:5000/health"
echo ""
echo "For production:"
echo "  gunicorn -c gunicorn_config.py app:app"
