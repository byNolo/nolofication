# KeyN OAuth Setup for Nolofication

## Overview
Nolofication uses KeyN OAuth for user authentication. Users sign in with their KeyN accounts, and Nolofication receives verified identity information via JWT tokens.

## Prerequisites
- KeyN OAuth server running at `https://auth-keyn.bynolo.ca`
- Admin access to KeyN to register OAuth clients

## Step 1: Register OAuth Client with KeyN

### Option A: Using the Management Script
```bash
# SSH into your KeyN server
cd /path/to/keyn

# Register Nolofication as an OAuth client
python scripts/manage_oauth.py create "Nolofication" admin_username \
  --description "Unified notification service for byNolo apps" \
  --website "https://nolofication.bynolo.ca" \
  --redirect-uris "https://nolofication.bynolo.ca/auth/callback" "http://localhost:5173/auth/callback"
```

### Option B: Using the API
```bash
curl -X POST https://auth-keyn.bynolo.ca/api/client/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Nolofication",
    "description": "Unified notification service for byNolo apps",
    "website_url": "https://nolofication.bynolo.ca",
    "redirect_uris": [
      "https://nolofication.bynolo.ca/auth/callback",
      "http://localhost:5173/auth/callback"
    ]
  }'
```

### Save the Credentials
The response will contain:
```json
{
  "client_id": "abc123...",
  "client_secret": "xyz789...",
  "name": "Nolofication",
  ...
}
```

**IMPORTANT:** Save these credentials securely! You'll need the `client_id` for the frontend.

## Step 2: Configure Frontend

Update `frontend/src/pages/Login.jsx`:

```javascript
const CLIENT_ID = 'YOUR_CLIENT_ID_FROM_STEP_1';  // Replace this!
```

Or use environment variables (recommended):

Create `frontend/.env`:
```bash
VITE_KEYN_CLIENT_ID=YOUR_CLIENT_ID_FROM_STEP_1
VITE_KEYN_BASE_URL=https://auth-keyn.bynolo.ca
```

Then update `Login.jsx`:
```javascript
const KEYN_BASE_URL = import.meta.env.VITE_KEYN_BASE_URL || 'https://auth-keyn.bynolo.ca';
const CLIENT_ID = import.meta.env.VITE_KEYN_CLIENT_ID || 'nolofication';
```

## Step 3: Verify Backend Configuration

Ensure `backend/.env` has correct KeyN settings:

```bash
# KeyN OAuth Configuration
KEYN_BASE_URL=https://auth-keyn.bynolo.ca
KEYN_JWT_PUBLIC_KEY_URL=https://auth-keyn.bynolo.ca/api/public-key
KEYN_VERIFY_SSL=true
```

## Step 4: Test OAuth Flow

### Development Testing
```bash
# Start backend and frontend
./dev.sh

# Navigate to http://localhost:5173
# Click "Sign in with KeyN"
# Should redirect to KeyN login
# After login, should redirect back and create user
```

### Production Testing
```bash
# Deploy and navigate to https://nolofication.bynolo.ca
# Follow same flow
```

## OAuth Flow Explained

1. **User clicks "Sign in with KeyN"**
   - Frontend redirects to: `https://auth-keyn.bynolo.ca/oauth/authorize?client_id=...`
   
2. **KeyN shows authorization screen**
   - User sees what data Nolofication wants (id, username, email)
   - User approves or denies

3. **KeyN redirects back with code**
   - Redirects to: `https://nolofication.bynolo.ca/auth/callback?code=...`
   
4. **Frontend exchanges code for token**
   - Posts to: `https://auth-keyn.bynolo.ca/oauth/token`
   - Receives access_token (JWT)

5. **Frontend sends token to Nolofication backend**
   - Posts to: `/api/auth/login` with the JWT token
   
6. **Backend verifies and creates user**
   - Fetches KeyN public key
   - Verifies JWT signature
   - Extracts user data from JWT
   - Creates or updates user in database
   - Returns same token to frontend

7. **Frontend stores token**
   - Saves to localStorage
   - Uses in Authorization header for all API calls

## Requested Scopes

Nolofication requests these user data fields:
- `id` - Unique user identifier
- `username` - User's KeyN username
- `email` - User's email address

## Troubleshooting

### "Invalid client_id"
- Client not registered with KeyN
- Wrong CLIENT_ID in frontend
- Run Step 1 again

### "Token verification failed"
- KeyN public key URL incorrect
- Network issue reaching KeyN
- Check `KEYN_JWT_PUBLIC_KEY_URL` in backend .env

### "Redirect URI mismatch"
- OAuth client has different redirect URIs registered
- Update redirect URIs in KeyN: `python scripts/manage_oauth.py show CLIENT_ID`

### "Failed to exchange code for token"
- CLIENT_SECRET might be required (currently not used)
- Check KeyN OAuth configuration
- Verify code hasn't expired (codes expire quickly)

## Security Notes

- JWT tokens are signed by KeyN and verified by Nolofication
- Tokens contain user identity claims
- Backend always verifies signature before trusting data
- Tokens expire (check KeyN expiration settings)
- State parameter prevents CSRF attacks
- Always use HTTPS in production

## Next Steps

After OAuth is working:
1. Test creating a site notification
2. Verify user preferences load
3. Check notification history displays
4. Test logout and re-login

## KeyN Management Commands

```bash
# List all OAuth clients
python scripts/manage_oauth.py list

# Show specific client details
python scripts/manage_oauth.py show CLIENT_ID

# List authorizations for a user
python scripts/manage_oauth.py authorizations --user USERNAME

# Deactivate a client
python scripts/manage_oauth.py deactivate CLIENT_ID
```
