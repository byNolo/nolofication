#!/bin/bash
# Restart all Nolofication services
# This is equivalent to running stop.sh followed by prod.sh

set -e

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Restarting Nolofication services..."
echo ""

# Stop all services
./stop.sh

echo ""
echo "⏳ Waiting 2 seconds before starting..."
sleep 2
echo ""

# Start all services
./prod.sh
