#!/bin/bash
# Authentication Flow Test Script

set -e

BACKEND_URL="http://localhost:5005"
FRONTEND_URL="http://localhost:5173"

echo "============================================"
echo "Nolofication Auth Flow Test"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend health check
echo "1. Testing backend health..."
if curl -s "${BACKEND_URL}/health" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "Start backend with: ./dev.sh"
    exit 1
fi

# Test 2: Auth endpoint exists
echo ""
echo "2. Testing auth endpoints..."
if curl -s "${BACKEND_URL}/api/auth/verify" -H "Content-Type: application/json" -d '{}' | grep -q "Token is required"; then
    echo -e "${GREEN}✓ Auth endpoints are accessible${NC}"
else
    echo -e "${RED}✗ Auth endpoints not found${NC}"
    exit 1
fi

# Test 3: Frontend is accessible
echo ""
echo "3. Testing frontend..."
if curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" | grep -q "200"; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may not be running${NC}"
    echo "Start with: ./dev.sh"
fi

# Test 4: Check KeyN connectivity
echo ""
echo "4. Testing KeyN OAuth server connectivity..."
if curl -s "https://auth-keyn.bynolo.ca/api/public-key" | grep -q "BEGIN PUBLIC KEY"; then
    echo -e "${GREEN}✓ KeyN OAuth server is reachable${NC}"
else
    echo -e "${RED}✗ Cannot reach KeyN OAuth server${NC}"
    exit 1
fi

echo ""
echo "============================================"
echo "Manual Testing Steps:"
echo "============================================"
echo ""
echo "1. Navigate to: ${FRONTEND_URL}"
echo "2. You should be redirected to /login"
echo "3. Click 'Sign in with KeyN'"
echo "4. Should redirect to KeyN authorization page"
echo "5. Login with your KeyN account"
echo "6. Approve the requested permissions"
echo "7. Should redirect back to Nolofication"
echo "8. Should see your username in the header"
echo "9. Should be able to access all pages"
echo ""
echo "Test Logout:"
echo "1. Click 'Logout' in the header"
echo "2. Should redirect to /login"
echo "3. localStorage should be cleared"
echo ""
echo "============================================"
echo "Database Verification:"
echo "============================================"
echo ""
echo "After logging in, check the database:"
echo ""
echo "cd backend"
echo "sqlite3 nolofication.db"
echo "SELECT * FROM users;"
echo ".quit"
echo ""
echo "You should see your user record with:"
echo "- keyn_user_id (from JWT)"
echo "- username (from KeyN)"
echo "- email (from KeyN)"
echo ""
echo "============================================"

echo -e "${GREEN}Pre-flight checks complete!${NC}"
echo "Ready for manual testing."
