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

## For Windows Users

You have two options:

### Option A: Use WSL (Recommended - Already Using Bash)

**Install rsync in WSL:**

```bash
# Open WSL terminal and run:
sudo apt update && sudo apt install -y rsync
```

**Then use the rsync commands below.**

### Option B: Use Windows PowerShell

If you prefer PowerShell, you can use `scp` (comes with Windows 10/11) or install `rsync` via WSL and call it from PowerShell:

```powershell
# From PowerShell, call WSL rsync:
wsl rsync -avz --exclude-from=.rsyncignore `
  /mnt/c/Users/uchiha/Documents/projects/finance-tracker/ `
  root@173.255.249.250:/root/code/finance-tracker/
```

**Note:** In PowerShell, use backticks (`) for line continuation instead of backslashes.

---

## Deployment Methods

```bash
# Option 1: Using rsync (recommended - excludes unnecessary files)
rsync -avz \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '*.pyo' \
  --exclude '*.pyd' \
  --exclude '.pytest_cache' \
  --exclude '.ruff_cache' \
  --exclude '.mypy_cache' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude 'htmlcov' \
  --exclude 'coverage' \
  --exclude 'test-results' \
  --exclude 'blob-report' \
  --exclude '.vite' \
  --exclude '.tanstack' \
  --exclude '*.log' \
  --exclude '*.tsbuildinfo' \
  --exclude 'bundle-analysis.html' \
  --exclude '*.md' \
  --exclude '*.MD' \
  --exclude 'tests' \
  --exclude 'test_*.py' \
  --exclude 'test_*.csv' \
  --exclude 'test-*.sh' \
  --exclude 'fix-*.sh' \
  --exclude 'cleanup-*.sh' \
  --exclude 'diagnose-*.sh' \
  --exclude 'troubleshoot-*.sh' \
  --exclude 'check-*.sh' \
  --exclude 'watch-*.sh' \
  --exclude 'setup-*.sh' \
  --exclude 'install-*.sh' \
  --exclude 'restart-*.sh' \
  --exclude 'deploy-*.sh' \
  --exclude 'manual-deploy.sh' \
  --exclude 'docker-compose.override.yml' \
  --exclude 'example.env' \
  --exclude '.env.local' \
  --exclude '.env.*.local' \
  --exclude '.vscode' \
  --exclude '.idea' \
  --exclude '.DS_Store' \
  --exclude 'Thumbs.db' \
  --exclude '*.swp' \
  --exclude '*.swo' \
  --exclude '*.tmp' \
  --exclude '*.bak' \
  --exclude '*.backup' \
  /home/uchiha/Documents/projects/finance-tracker/ \
  root@YOUR_LINODE_IP:/root/code/finance-tracker/
```

**Note:** Replace `YOUR_LINODE_IP` with your actual server IP address (e.g., `173.255.249.250`).

**Simpler Option: Use .rsyncignore file (recommended)**

A `.rsyncignore` file has been created in the project root with all necessary exclusions. Use this simpler command:

**For WSL users (Windows):**

```bash
# Navigate to your project in WSL
# Windows path C:\Users\uchiha\Documents\projects\finance-tracker
# becomes /mnt/c/Users/uchiha/Documents/projects/finance-tracker in WSL

cd /mnt/c/Users/uchiha/Documents/projects/finance-tracker

# Deploy using rsync
rsync -avz --exclude-from=.rsyncignore \
  /mnt/c/Users/uchiha/Documents/projects/finance-tracker/ \
  root@173.255.249.250:/root/code/finance-tracker/
```

**For Linux/Mac users:**

```bash
cd /home/uchiha/Documents/projects/finance-tracker

rsync -avz --exclude-from=.rsyncignore \
  /home/uchiha/Documents/projects/finance-tracker/ \
  root@173.255.249.250:/root/code/finance-tracker/
```

This will exclude:
- All `.md` documentation files
- Test files and directories
- Development scripts (`fix-*.sh`, `cleanup-*.sh`, etc.)
- Build artifacts (`dist/`, `node_modules/`, `__pycache__/`, etc.)
- IDE and OS files
- Temporary and backup files
- Development-only Docker compose files

**Alternative: Using tar + ssh (if rsync is not available):**

If you can't install rsync, you can use tar with exclusions:

```bash
cd /home/uchiha/Documents/projects/finance-tracker

# Create a tar archive excluding unnecessary files
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='htmlcov' \
    --exclude='test-results' \
    --exclude='blob-report' \
    --exclude='*.md' \
    --exclude='tests' \
    --exclude='test_*.py' \
    --exclude='test_*.csv' \
    --exclude='fix-*.sh' \
    --exclude='cleanup-*.sh' \
    --exclude='docker-compose.override.yml' \
    --exclude='.vscode' \
    --exclude='.idea' \
    -czf - . | ssh root@173.255.249.250 "cd /root/code && rm -rf finance-tracker && mkdir -p finance-tracker && cd finance-tracker && tar -xzf -"
```

**Or using tar with .rsyncignore (convert to tar exclusions):**

```bash
cd /home/uchiha/Documents/projects/finance-tracker

# Convert .rsyncignore to tar exclusions
EXCLUDES=$(grep -v '^#' .rsyncignore | grep -v '^$' | sed 's/^/--exclude=/' | tr '\n' ' ')

tar $EXCLUDES -czf - . | ssh root@173.255.249.250 "cd /root/code && rm -rf finance-tracker && mkdir -p finance-tracker && cd finance-tracker && tar -xzf -"
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

### 6.1 Create Minimal Tests Directory (Required)

Since the `tests` directory is excluded by `.rsyncignore`, create a minimal structure to avoid Docker build failures:

```bash
cd /root/code/finance-tracker

# Create minimal tests directory structure
mkdir -p backend/tests
touch backend/tests/__init__.py

# Verify it was created
ls -la backend/tests/
```

### 6.2 Check and Free Disk Space (If Needed)

If you encounter "no space left on device" errors, clean up Docker:

```bash
# Check disk space
df -h

# Check Docker disk usage
docker system df

# Clean up Docker (removes unused images, containers, networks, build cache)
docker system prune -a --volumes -f

# Remove dangling images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Check space again
df -h
```

**Note:** The `docker system prune -a` command will remove ALL unused Docker resources. Make sure no other applications are using Docker images you need.

### 6.3 Generate Frontend Client (If Needed)

The frontend client files should be generated before building. If they're missing, generate them:

```bash
cd /root/code/finance-tracker

# Option 1: If backend is running, download OpenAPI spec and generate
# First, make sure backend is accessible or copy openapi.json from your local machine

# Option 2: Generate client from existing openapi.json (if present)
if [ -f "frontend/openapi.json" ]; then
    cd frontend
    npm install  # Ensure dependencies are installed
    npm run generate-client
    cd ..
fi
```

**Note:** The Dockerfile will also attempt to generate the client during build if `openapi.json` exists.

### 6.4 Build and Start Services

```bash
cd /root/code/finance-tracker
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
```

**Note on Build Optimization:**
The frontend build is configured with code splitting to reduce initial bundle size:
- Vendor libraries are split into separate chunks (React, TanStack, Chakra UI, etc.)
- This improves initial page load time by loading only what's needed
- The main bundle should now be under 500 KB (gzipped)

### 6.5 Check Service Status

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

### 6.6 Verify Supervisor Processes

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

## Step 10: Set Up CI/CD with GitHub Actions

### 10.1 Generate SSH Key for Deployment

On your **local machine**, generate an SSH key pair for GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

This creates two files:
- `~/.ssh/github_actions_deploy` (private key - add to GitHub secrets)
- `~/.ssh/github_actions_deploy.pub` (public key - add to server)

### 10.2 Add Public Key to Linode Server

Copy the public key to your Linode server:

```bash
# From your local machine
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@YOUR_LINODE_IP
```

Or manually add it:

```bash
# On the server
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key content from ~/.ssh/github_actions_deploy.pub
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 10.3 Set Up GitHub Repository

1. **Initialize Git repository** (if not already done):

```bash
cd /root/code/finance-tracker
git init
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
# Or use SSH: git remote add origin git@github.com:YOUR_USERNAME/finance-tracker.git
```

2. **Push your code to GitHub**:

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### 10.4 Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

#### Required Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SSH_PRIVATE_KEY` | Private SSH key for server access | Contents of `~/.ssh/github_actions_deploy` |
| `SERVER_USER` | SSH username for server | `root` |
| `SERVER_HOST` | Server IP address or hostname | `YOUR_LINODE_IP` or `yourdomain.com` |
| `DOMAIN_PRODUCTION` | Your production domain | `wiseman-palace.co.ke` |
| `STACK_NAME_PRODUCTION` | Docker stack name | `wiseman-palace-production` |
| `SECRET_KEY` | Backend secret key | Generated secure key |
| `FIRST_SUPERUSER` | Admin email | `admin@wiseman-palace.co.ke` |
| `FIRST_SUPERUSER_PASSWORD` | Admin password | Secure password |
| `POSTGRES_PASSWORD` | Database password | Generated secure password |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_DB` | Database name | `app` |
| `POSTGRES_PORT` | Database port | `5432` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_USER` | SMTP username | Your email |
| `SMTP_PASSWORD` | SMTP password | Your email password or app password |
| `EMAILS_FROM_EMAIL` | From email address | `noreply@wiseman-palace.co.ke` |

#### Optional Secrets:

| Secret Name | Description | Default |
|------------|-------------|---------|
| `APP_DIR` | Application directory on server | `/root/code/finance-tracker` |
| `FRONTEND_HOST` | Frontend URL | `https://dashboard.${DOMAIN}` |
| `BACKEND_CORS_ORIGINS` | CORS origins | Auto-generated from domain |
| `DOCKER_IMAGE_BACKEND` | Backend image name | `finance-tracker-backend` |
| `DOCKER_IMAGE_FRONTEND` | Frontend image name | `finance-tracker-frontend` |
| `SENTRY_DSN` | Sentry DSN (optional) | Empty |

### 10.5 How CI/CD Works

The CI/CD pipeline is configured in `.github/workflows/`:

1. **CI Workflow** (`.github/workflows/ci.yml`):
   - Runs on every push and pull request
   - Tests backend code
   - Tests Docker Compose setup
   - Lints backend code

2. **Deploy Workflow** (`.github/workflows/deploy-production.yml`):
   - Runs on push to `main` or `master` branch
   - Can be manually triggered via GitHub Actions UI
   - Connects to your Linode server via SSH
   - Pulls latest code from GitHub
   - Rebuilds Docker images
   - Restarts services
   - Verifies deployment

### 10.6 Enable Deployment After Tests

To ensure deployment only happens after tests pass, edit `.github/workflows/deploy-production.yml`:

```yaml
jobs:
  deploy:
    needs: [test-backend, test-docker-compose]  # Uncomment this line
```

### 10.7 Test the CI/CD Pipeline

1. Make a small change to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Go to **Actions** tab in GitHub to see the workflow running
4. Once deployment completes, verify your changes are live

### 10.8 Troubleshooting CI/CD

#### SSH Connection Issues

```bash
# Test SSH connection manually
ssh -i ~/.ssh/github_actions_deploy root@YOUR_LINODE_IP

# Check SSH key permissions
chmod 600 ~/.ssh/github_actions_deploy
```

#### Deployment Fails

- Check GitHub Actions logs for error messages
- Verify all secrets are set correctly
- Ensure server has enough disk space: `df -h`
- Check Docker is running on server: `docker ps`

#### Services Not Restarting

```bash
# On server, manually restart
cd /root/code/finance-tracker
docker compose restart
```

## Next Steps

1. Set up automated backups
2. Configure monitoring (e.g., Sentry)
3. Set up CI/CD pipeline ✅ (Completed above)
4. Configure log rotation
5. Set up health checks and alerts

---

**Need Help?** Check the main `deployment.md` file for more detailed information about specific components.

