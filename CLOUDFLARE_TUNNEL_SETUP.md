# Nolofication - Cloudflare Tunnel & NPM Proxy Setup

This guide covers deploying Nolofication with Cloudflare Tunnel and Nginx Proxy Manager running on separate machines.

## Architecture

```
Internet
   ↓
Cloudflare Tunnel (Machine A) → nolofication.bynolo.ca
   ↓
Nginx Proxy Manager (Machine B) → proxy server
   ↓
Nolofication Server (Machine C - this machine)
   ├── Backend (port 5005)
   └── Frontend (served as static files or port 5173)
```

## Setup Instructions

### 1. Nolofication Server Configuration

#### Backend Configuration

The backend needs to trust proxy headers since it's behind Cloudflare and NPM:

**Update `backend/.env`:**
```bash
# Server Configuration
PORT=5005
HOST=0.0.0.0

# CORS - Add your domain
CORS_ORIGINS=https://nolofication.bynolo.ca

# Trust proxy headers (for rate limiting and IP detection)
TRUST_PROXY=true
```

#### Production Deployment

Build and run in production mode:
```bash
# Build frontend
cd frontend
npm run build
cd ..

# Start both services
./prod.sh
```

This will:
- Build the frontend to `frontend/dist/`
- Start Gunicorn backend on `0.0.0.0:5005`
- Serve frontend static files on `0.0.0.0:5173`

### 2. Nginx Proxy Manager Configuration (Machine B)

Add a new Proxy Host in NPM:

**Details Tab:**
- Domain Names: `nolofication.bynolo.ca`
- Scheme: `http`
- Forward Hostname/IP: `<nolofication-server-ip>`
- Forward Port: `5173` (frontend)
- Cache Assets: ✓ Enabled
- Block Common Exploits: ✓ Enabled
- Websockets Support: ✓ Enabled

**SSL Tab:**
- SSL Certificate: Select or request Let's Encrypt
- Force SSL: ✓ Enabled
- HTTP/2 Support: ✓ Enabled
- HSTS Enabled: ✓ Enabled

**Advanced Tab:**
```nginx
# Proxy to frontend (static files)
location / {
    proxy_pass http://<nolofication-server-ip>:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Proxy API requests to backend
location /api {
    proxy_pass http://<nolofication-server-ip>:5005;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # WebSocket support for future real-time features
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 3. Cloudflare Tunnel Configuration (Machine A)

Create a tunnel pointing to your NPM server:

**Using Cloudflare Zero Trust Dashboard:**
1. Navigate to Zero Trust → Networks → Tunnels
2. Create a new tunnel
3. Install cloudflared on Machine A
4. Configure public hostname:
   - Public hostname: `nolofication.bynolo.ca`
   - Service: `http://<npm-server-ip>:80` or `http://<npm-server-ip>:443`

**Or via CLI on Machine A:**
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create nolofication

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: nolofication.bynolo.ca
    service: http://<npm-server-ip>:443
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run nolofication

# Install as service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 4. Cloudflare DNS Configuration

Add DNS records in your Cloudflare dashboard:

1. Go to DNS settings for `bynolo.ca`
2. Add CNAME record:
   - Type: `CNAME`
   - Name: `nolofication`
   - Target: `<tunnel-id>.cfargotunnel.com`
   - Proxy status: ✓ Proxied (orange cloud)

### 5. Security Considerations

#### Update CORS Origins

Edit `backend/.env`:
```bash
CORS_ORIGINS=https://nolofication.bynolo.ca
```

#### Rate Limiting

The backend uses Flask-Limiter which respects `X-Forwarded-For` headers. Ensure NPM passes the real client IP:
```bash
RATE_LIMIT_ENABLED=true
TRUST_PROXY=true
```

#### Admin API Key

Generate a secure admin key:
```bash
ADMIN_API_KEY=$(openssl rand -base64 32)
```

### 6. Testing the Setup

```bash
# Test backend directly (from nolofication server)
curl http://localhost:5005/api/health

# Test frontend directly (from nolofication server)
curl http://localhost:5173

# Test through NPM (from anywhere)
curl http://<npm-server-ip>/api/health

# Test through Cloudflare Tunnel (from anywhere)
curl https://nolofication.bynolo.ca/api/health
```

### 7. Monitoring & Logs

**Nolofication Server:**
```bash
# Backend logs
tail -f backend/logs/error.log
tail -f backend/logs/access.log

# Frontend logs
tail -f backend/logs/frontend.log

# Check services
ps aux | grep gunicorn
ps aux | grep serve
```

**NPM (Machine B):**
- Check logs in NPM dashboard
- View access logs: `/data/logs/proxy-host-*.log`

**Cloudflare Tunnel (Machine A):**
```bash
# Check tunnel status
cloudflared tunnel info nolofication

# View logs
sudo journalctl -u cloudflared -f
```

## Alternative: Direct Cloudflare Tunnel to Nolofication

If you want to skip NPM and tunnel directly to this server:

**Cloudflare Tunnel config on Machine A:**
```yaml
tunnel: <tunnel-id>
credentials-file: /path/to/credentials.json

ingress:
  # API requests
  - hostname: nolofication.bynolo.ca
    path: /api/*
    service: http://<nolofication-server-ip>:5005
  
  # Frontend
  - hostname: nolofication.bynolo.ca
    service: http://<nolofication-server-ip>:5173
  
  - service: http_status:404
```

## Troubleshooting

**Issue: CORS errors**
- Ensure `CORS_ORIGINS` includes `https://nolofication.bynolo.ca`
- Check NPM proxy headers are set correctly

**Issue: 502 Bad Gateway**
- Verify backend is running: `ps aux | grep gunicorn`
- Check backend logs: `tail -f backend/logs/error.log`
- Test backend directly: `curl localhost:5005/api/health`

**Issue: Static files not loading**
- Verify frontend is built: `ls frontend/dist/`
- Check serve is running: `ps aux | grep serve`
- Test frontend: `curl localhost:5173`

**Issue: Rate limiting not working**
- Ensure `TRUST_PROXY=true` in `.env`
- Verify NPM passes `X-Forwarded-For` header

## Production Checklist

- [ ] Frontend built (`npm run build`)
- [ ] Backend running with Gunicorn
- [ ] `.env` configured with production values
- [ ] CORS origins set to actual domain
- [ ] Admin API key generated
- [ ] SSL certificates configured in NPM
- [ ] Cloudflare Tunnel connected
- [ ] DNS records pointed to tunnel
- [ ] Rate limiting enabled
- [ ] Logs rotating properly
- [ ] Backup strategy for SQLite database
