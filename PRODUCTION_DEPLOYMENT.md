# Production Deployment Guide

This guide walks you through deploying your finance-tracker application to production on Linode with Cloudflare DNS.

## Prerequisites Checklist

- [x] Linode server created and accessible via SSH
- [ ] Domain name configured in Cloudflare
- [ ] Docker installed on Linode server
- [ ] SSH access to Linode server working

## Step 1: Configure DNS in Cloudflare

1. Log into your Cloudflare dashboard
2. Select your domain
3. Go to **DNS** → **Records**
4. Add the following DNS records (replace `yourdomain.com` with your actual domain):

   | Type | Name | Content | Proxy Status | TTL |
   |------|------|---------|--------------|-----|
   | A | @ | `YOUR_LINODE_IP` | Proxied (orange cloud) | Auto |
   | A | traefik | `YOUR_LINODE_IP` | Proxied | Auto |
   | A | api | `YOUR_LINODE_IP` | Proxied | Auto |
   | A | dashboard | `YOUR_LINODE_IP` | Proxied | Auto |
   | A | adminer | `YOUR_LINODE_IP` | Proxied | Auto |

   **Example for wiseman-palace.co.ke:**
   - `@` → `wiseman-palace.co.ke`
   - `traefik` → `traefik.wiseman-palace.co.ke`
   - `api` → `api.wiseman-palace.co.ke`
   - `dashboard` → `dashboard.wiseman-palace.co.ke`
   - `adminer` → `adminer.wiseman-palace.co.ke`

   **Note:** If you want to use Cloudflare's proxy (recommended for DDoS protection), keep the orange cloud ON. If you want direct connection, turn it OFF (gray cloud).

5. Wait for DNS propagation (usually 1-5 minutes, can take up to 24 hours)

## Step 2: Connect to Your Linode Server

```bash
ssh root@YOUR_LINODE_IP
```

## Step 3: Install Docker (if not already installed)

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## Step 4: Set Up Traefik

### 4.1 Create Traefik Directory

```bash
mkdir -p /root/code/traefik-public
cd /root/code/traefik-public
```

### 4.2 Copy Traefik Configuration

From your local machine, copy the Traefik compose file:

```bash
# Run this from your LOCAL machine (not on server)
scp docker-compose.traefik.yml root@YOUR_LINODE_IP:/root/code/traefik-public/
```

Or manually create the file on the server:

```bash
# On the server
nano /root/code/traefik-public/docker-compose.traefik.yml
# Paste the contents of docker-compose.traefik.yml
```

### 4.3 Create Traefik Network

```bash
docker network create traefik-public
```

### 4.4 Set Traefik Environment Variables

```bash
# Set your domain
export DOMAIN=wiseman-palace.co.ke

# Set admin username for Traefik dashboard
export USERNAME=admin

# Set admin password (choose a strong password)
export PASSWORD=your_secure_password_here

# Generate hashed password
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)

# Set email for Let's Encrypt certificates
export EMAIL=your-email@example.com

# i used these

# export DOMAIN=wiseman-palace.co.ke
# export USERNAME=admin
# export PASSWORD=WiseManPalace2025!
# export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
# export EMAIL=owayopaul@gmail.com

# Verify the hashed password
echo $HASHED_PASSWORD
```

### 4.5 Start Traefik

```bash
cd /root/code/traefik-public
docker compose -f docker-compose.traefik.yml up -d
```

### 4.6 Verify Traefik is Running

```bash
docker ps
docker logs traefik-public-traefik-1
```

You should be able to access the Traefik dashboard at: `https://traefik.wiseman-palace.co.ke` (with the username/password you set)

## Step 5: Prepare Your Application Deployment

### 5.1 Create Application Directory

```bash
mkdir -p /root/code/finance-tracker
cd /root/code/finance-tracker
```

### 5.2 Copy Project Files to Server

From your **local machine**, copy the project files:

```bash
# Option 1: Using rsync (recommended - excludes node_modules, __pycache__, etc.)
rsync -avz --exclude 'node_modules' --exclude '__pycache__' --exclude '.git' \
  --exclude 'dist' --exclude 'htmlcov' --exclude '*.pyc' \
  /home/uchiha/Documents/projects/finance-tracker/ \
  root@YOUR_LINODE_IP:/root/code/finance-tracker/

# Option 2: Using scp (simpler but slower)
scp -r /home/uchiha/Documents/projects/finance-tracker/* \
  root@YOUR_LINODE_IP:/root/code/finance-tracker/
```

### 5.3 Create Production .env File

On the server, create a `.env` file:

```bash
cd /root/code/finance-tracker
nano .env
```

Paste the following template and fill in your values:

```bash
# Domain
DOMAIN=wiseman-palace.co.ke
FRONTEND_HOST=https://dashboard.wiseman-palace.co.ke

# Environment
ENVIRONMENT=production

# Project Configuration
PROJECT_NAME="Finance Tracker"
STACK_NAME=wiseman-palace-production

# Backend CORS
BACKEND_CORS_ORIGINS=https://dashboard.wiseman-palace.co.ke,https://api.wiseman-palace.co.ke

# Secret Key - Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=GENERATE_A_SECURE_KEY_HERE

# First Superuser
FIRST_SUPERUSER=admin@wiseman-palace.co.ke
FIRST_SUPERUSER_PASSWORD=GENERATE_A_SECURE_PASSWORD_HERE

# Email Configuration (required for background jobs)
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_TLS=True
SMTP_SSL=False
EMAILS_FROM_EMAIL=noreply@wiseman-palace.co.ke
EMAILS_FROM_NAME=Finance Tracker

# PostgreSQL
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=GENERATE_A_SECURE_PASSWORD_HERE

# Sentry (optional)
SENTRY_DSN=

# Docker Images
DOCKER_IMAGE_BACKEND=finance-tracker-backend
DOCKER_IMAGE_FRONTEND=finance-tracker-frontend
TAG=latest
```

**Important:** Generate secure passwords and keys:

```bash
# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate POSTGRES_PASSWORD
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5.4 Set Environment Variables for Docker Compose

```bash
export DOMAIN=wiseman-palace.co.ke
export STACK_NAME=wiseman-palace-production
export ENVIRONMENT=production
export FRONTEND_HOST=https://dashboard.wiseman-palace.co.ke
export BACKEND_CORS_ORIGINS="https://dashboard.wiseman-palace.co.ke,https://api.wiseman-palace.co.ke"
```

## Step 6: Deploy the Application

### 6.1 Build and Start Services

```bash
cd /root/code/finance-tracker
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
```

### 6.2 Check Service Status

```bash
# Check all containers
docker compose ps

# Check logs
docker compose logs -f

# Check specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

### 6.3 Verify Supervisor Processes

```bash
# Get backend container name
BACKEND_CONTAINER=$(docker compose ps -q backend)

# Check supervisor status
docker exec -it $BACKEND_CONTAINER supervisorctl status

# Expected output:
# fastapi                          RUNNING   pid 12, uptime 0:01:23
# scheduler                        RUNNING   pid 13, uptime 0:01:23
```

## Step 7: Verify Deployment

1. **Frontend**: Visit `https://dashboard.wiseman-palace.co.ke`
2. **Backend API Docs**: Visit `https://api.wiseman-palace.co.ke/docs`
3. **Adminer (Database UI)**: Visit `https://adminer.wiseman-palace.co.ke`
4. **Traefik Dashboard**: Visit `https://traefik.wiseman-palace.co.ke`

## Step 8: Post-Deployment Tasks

### 8.1 Create Initial Superuser

The first superuser should be created automatically during the prestart phase. If not, you can create it manually:

```bash
docker compose exec backend python -c "
from app.crud import user
from app.core.db import SessionLocal
from app.schemas import UserCreate
db = SessionLocal()
user.create(db, obj_in=UserCreate(
    email='admin@wiseman-palace.co.ke',
    password='your_password',
    is_superuser=True
))
"
```

### 8.2 Verify Background Jobs

```bash
# Check scheduler logs
docker exec -it $(docker compose ps -q backend) tail -f /var/log/supervisor/scheduler.log
```

### 8.3 Set Up Firewall (Optional but Recommended)

```bash
# Install UFW if not installed
apt-get install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS (handled by Traefik)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

## Step 9: Set Up Automatic Updates (Optional)

### 9.1 Create Update Script

```bash
cat > /root/code/finance-tracker/update.sh << 'EOF'
#!/bin/bash
cd /root/code/finance-tracker

# Pull latest code (if using git)
# git pull

# Rebuild and restart
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d

# Restart supervisor processes
BACKEND_CONTAINER=$(docker compose ps -q backend)
docker exec -it $BACKEND_CONTAINER supervisorctl restart all
EOF

chmod +x /root/code/finance-tracker/update.sh
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose logs

# Check container status
docker compose ps

# Restart services
docker compose restart
```

### Database Connection Issues

```bash
# Check database logs
docker compose logs db

# Test database connection
docker compose exec backend python -c "from app.core.db import engine; print('DB OK')"
```

### Traefik Not Routing Traffic

```bash
# Check Traefik logs
docker logs traefik-public-traefik-1

# Verify network
docker network inspect traefik-public

# Check Traefik dashboard for routing rules
# Visit: https://traefik.wiseman-palace.co.ke
```

### SSL Certificate Issues

```bash
# Check Let's Encrypt logs in Traefik
docker logs traefik-public-traefik-1 | grep -i acme

# Verify DNS records are correct
dig wiseman-palace.co.ke
dig api.wiseman-palace.co.ke
dig dashboard.wiseman-palace.co.ke
```

### Background Jobs Not Running

```bash
# Check supervisor status
docker exec -it $(docker compose ps -q backend) supervisorctl status

# Check scheduler logs
docker exec -it $(docker compose ps -q backend) tail -100 /var/log/supervisor/scheduler.log

# Verify email configuration
docker exec -it $(docker compose ps -q backend) env | grep SMTP
```

## Maintenance Commands

```bash
# View all logs
docker compose logs -f

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database)
docker compose down -v

# Update application
cd /root/code/finance-tracker
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d

# Backup database
docker compose exec db pg_dump -U postgres app > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T db psql -U postgres app < backup_file.sql
```

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated secure SECRET_KEY
- [ ] Generated secure POSTGRES_PASSWORD
- [ ] Set up firewall (UFW)
- [ ] Configured SMTP for email notifications
- [ ] Set up regular database backups
- [ ] Enabled Cloudflare proxy (optional but recommended)
- [ ] Set up monitoring/alerting (optional)

## Next Steps

1. Set up automated backups
2. Configure monitoring (e.g., Sentry)
3. Set up CI/CD pipeline (see deployment.md for GitHub Actions)
4. Configure log rotation
5. Set up health checks and alerts

---

**Need Help?** Check the main `deployment.md` file for more detailed information about specific components.

