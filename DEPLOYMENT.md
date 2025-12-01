# Nolofication Backend - Deployment Guide

## Prerequisites

- Python 3.8+ installed
- Access to SMTP server (for email notifications)
- Domain name (for production)
- SSL/TLS certificate (for production)
- Reverse proxy (nginx recommended)

## Development Deployment

### 1. Initial Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
SECRET_KEY=generate-with-python-secrets-token-hex-32
ADMIN_API_KEY=generate-with-python-secrets-token-hex-32

KEYN_BASE_URL=https://auth-keyn.bynolo.ca
KEYN_JWT_PUBLIC_KEY_URL=https://auth-keyn.bynolo.ca/api/public-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@bynolo.ca
```

### 3. Generate VAPID Keys

```bash
pip install py-vapid
vapid --gen

# Add output to .env:
# VAPID_PRIVATE_KEY=...
# VAPID_PUBLIC_KEY=...
```

### 4. Run Development Server

```bash
python app.py
```

Visit `http://localhost:5000/health`

## Production Deployment

### Option 1: VPS/Cloud Server (Recommended)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and tools
sudo apt install python3 python3-pip python3-venv nginx certbot python3-certbot-nginx -y

# Create application user
sudo useradd -m -s /bin/bash nolofication
sudo su - nolofication
```

#### 2. Application Setup

```bash
# Clone or copy application
cd ~
# (transfer your files here)

# Setup virtual environment
cd ~/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 3. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with production values
```

**Important Production Settings:**
```env
FLASK_ENV=production
SECRET_KEY=use-strong-random-key
ADMIN_API_KEY=use-strong-random-key
DATABASE_URL=sqlite:////home/nolofication/backend/production.db
CORS_ORIGINS=https://nolofication.bynolo.ca,https://bynolo.ca
```

#### 4. Setup Systemd Service

Create `/etc/systemd/system/nolofication.service`:

```ini
[Unit]
Description=Nolofication Notification Service
After=network.target

[Service]
Type=notify
User=nolofication
Group=nolofication
WorkingDirectory=/home/nolofication/backend
Environment="PATH=/home/nolofication/backend/venv/bin"
ExecStart=/home/nolofication/backend/venv/bin/gunicorn -c gunicorn_config.py app:app
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nolofication
sudo systemctl start nolofication
sudo systemctl status nolofication
```

#### 5. Configure Nginx

Create `/etc/nginx/sites-available/nolofication`:

```nginx
upstream nolofication {
    server 127.0.0.1:5000 fail_timeout=0;
}

server {
    listen 80;
    server_name nolofication.bynolo.ca;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nolofication.bynolo.ca;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/nolofication.bynolo.ca/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nolofication.bynolo.ca/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    
    # Logging
    access_log /var/log/nginx/nolofication-access.log;
    error_log /var/log/nginx/nolofication-error.log;
    
    # Client body size (for larger requests)
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://nolofication;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint (bypass rate limiting)
    location /health {
        proxy_pass http://nolofication;
        access_log off;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/nolofication /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d nolofication.bynolo.ca
```

#### 7. Setup Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Option 2: Docker Deployment

#### Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 nolofication && \
    chown -R nolofication:nolofication /app
USER nolofication

# Expose port
EXPOSE 5000

# Run application
CMD ["gunicorn", "-c", "gunicorn_config.py", "app:app"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  nolofication:
    build: ./backend
    container_name: nolofication
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/nolofication.db:/app/nolofication.db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Deploy:
```bash
docker-compose up -d
```

## Post-Deployment

### 1. Create Initial Admin Site

```bash
source venv/bin/activate
python scripts/admin.py create admin "Admin Console" "Internal admin tools"
```

### 2. Test the Deployment

```bash
# Health check
curl https://notify.bynolo.ca/health

# Public sites
curl https://notify.bynolo.ca/api/sites/public

# VAPID key
curl https://notify.bynolo.ca/api/webpush/vapid-public-key
```

### 3. Monitor Logs

```bash
# Systemd service logs
sudo journalctl -u nolofication -f

# Nginx logs
sudo tail -f /var/log/nginx/nolofication-access.log
sudo tail -f /var/log/nginx/nolofication-error.log
```

### 4. Setup Monitoring

Consider adding:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Log aggregation**: Logstash, Papertrail
- **Metrics**: Prometheus + Grafana

## Backup Strategy

### Database Backup

```bash
# Automated daily backup
cat > /home/nolofication/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/nolofication/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /home/nolofication/backend/nolofication.db $BACKUP_DIR/nolofication_$DATE.db
# Keep only last 30 days
find $BACKUP_DIR -name "nolofication_*.db" -mtime +30 -delete
EOF

chmod +x /home/nolofication/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/nolofication/backup.sh
```

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Strong SECRET_KEY and ADMIN_API_KEY
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] Database file permissions restricted
- [ ] SMTP credentials secured
- [ ] Rate limiting enabled
- [ ] CORS origins restricted to your domains
- [ ] Regular security updates scheduled
- [ ] Backups automated and tested
- [ ] Monitoring and alerting configured

## Scaling Considerations

### Horizontal Scaling

1. Use PostgreSQL instead of SQLite
2. Add Redis for rate limiting storage
3. Deploy multiple Gunicorn instances behind load balancer
4. Use separate server for database

### Performance Tuning

```python
# gunicorn_config.py adjustments
workers = (cpu_count * 2) + 1
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
```

## Troubleshooting

### Service won't start
```bash
sudo journalctl -u nolofication -n 50
# Check for Python errors or missing dependencies
```

### Database locked errors
```bash
# SQLite doesn't handle high concurrency well
# Consider migrating to PostgreSQL for production
```

### Email not sending
```bash
# Test SMTP connection
python -c "import smtplib; smtplib.SMTP('smtp.gmail.com', 587).starttls()"
```

### High memory usage
```bash
# Reduce Gunicorn workers
# Check for memory leaks in notification handlers
```

## Maintenance

### Update Application

```bash
sudo su - nolofication
cd ~/backend
source venv/bin/activate
git pull  # or copy new files
pip install -r requirements.txt
sudo systemctl restart nolofication
```

### Database Migrations

```bash
# For schema changes, backup first!
cp nolofication.db nolofication.db.backup

# Make changes and restart
sudo systemctl restart nolofication
```

## Support

For issues:
1. Check logs: `sudo journalctl -u nolofication -f`
2. Verify configuration: `.env` file
3. Test endpoints: `curl` commands
4. Review documentation: README.md, API.md

## Production Checklist

- [ ] Environment variables configured
- [ ] VAPID keys generated
- [ ] SMTP tested and working
- [ ] SSL certificate installed
- [ ] Nginx configured and running
- [ ] Systemd service enabled
- [ ] Firewall rules applied
- [ ] First admin site created
- [ ] Health endpoint accessible
- [ ] Backups scheduled
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained on admin tools
