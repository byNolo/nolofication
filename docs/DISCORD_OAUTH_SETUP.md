# Discord OAuth Setup Guide

## Prerequisites
- Discord account
- Admin access to Discord Developer Portal
- Access to nolofication backend `.env` file

## Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter name: `NoloFication`
4. Accept terms and click **"Create"**

## Step 2: Get Client ID and Secret

1. In your application, navigate to **OAuth2** → **General**
2. Copy the **Client ID**
3. Click **"Reset Secret"** to generate a new **Client Secret**
4. Copy the **Client Secret** (you can only see this once!)

## Step 3: Configure OAuth2 Redirect

1. Still in **OAuth2** → **General**
2. Under **Redirects**, click **"Add Redirect"**
3. Add: `https://nolofication.bynolo.ca/auth/discord/callback`
4. For local testing, also add: `http://localhost:5173/auth/discord/callback`
5. Click **"Save Changes"**

## Step 4: Update Backend Environment

Add these lines to `/home/sam/nolofication/backend/.env`:

```bash
# Discord OAuth Configuration
DISCORD_CLIENT_ID=YOUR_CLIENT_ID_HERE
DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
DISCORD_REDIRECT_URI=https://nolofication.bynolo.ca/auth/discord/callback
```

Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with the values from Step 2.

## Step 5: Restart Backend

```bash
cd /home/sam/nolofication
./scripts/restart.sh
```

## Step 6: Test Discord Linking

1. Go to https://nolofication.bynolo.ca/preferences
2. Enable Discord notifications
3. Click **"Link Account"** button
4. Authorize the application in the popup
5. Your Discord ID should appear in the input field
6. Click **"Test Discord"** to verify notifications work

## How It Works

### OAuth Flow
1. User clicks "Link Account" → Frontend calls `/api/auth/discord/authorize`
2. Backend returns Discord OAuth URL with client_id and redirect_uri
3. Frontend opens Discord authorization in popup window
4. User approves "identify" scope on Discord
5. Discord redirects to `/auth/discord/callback?code=...`
6. Frontend sends code to backend via `/api/auth/discord/callback`
7. Backend exchanges code for access token
8. Backend calls Discord API `/users/@me` to get user info
9. Saves Discord ID to UserPreference table
10. Returns success with Discord username

### Discord DM Sending
1. Bot uses stored Discord User ID from preferences
2. Creates DM channel via `POST /users/{user_id}/channels`
3. Sends embed message via `POST /channels/{channel_id}/messages`
4. Message includes color-coded embed based on notification type

## Troubleshooting

### "Invalid OAuth2 redirect_uri"
- Ensure redirect URI in Discord app matches `DISCORD_REDIRECT_URI` in `.env`
- Check for trailing slashes - they must match exactly

### "Missing Access" or "Cannot send messages to this user"
- Discord bots can only DM users who:
  - Share a server with the bot, OR
  - Have authorized the OAuth app (our implementation)

### "Invalid Client Credentials"
- Verify `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct
- Ensure no extra spaces or quotes in `.env` file
- Client secret can only be viewed once - regenerate if lost

### Popup Blocked
- Browser may block popup window
- Users need to allow popups for nolofication.bynolo.ca
- Alternative: Open OAuth in same window (less ideal UX)

## Security Notes

- **Client Secret**: Keep secret! Never commit to git or expose in frontend
- **OAuth Scope**: We only request `identify` - minimal permissions needed
- **Token Storage**: Access tokens are only used server-side during OAuth flow
- **User Privacy**: We only store Discord User ID, not tokens or personal data

## References

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Discord User Resource](https://discord.com/developers/docs/resources/user)
- [Discord DM Channels](https://discord.com/developers/docs/resources/channel#create-dm)
