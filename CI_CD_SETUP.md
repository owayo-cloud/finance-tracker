# CI/CD Setup Guide

This guide helps you set up continuous integration and deployment (CI/CD) for your finance-tracker application using GitHub Actions.

## Quick Setup Checklist

- [ ] Generate SSH key pair for GitHub Actions
- [ ] Add public key to Linode server
- [ ] Push code to GitHub repository
- [ ] Configure GitHub Secrets
- [ ] Test the CI/CD pipeline

## Step-by-Step Setup

### 1. Generate SSH Key

On your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

### 2. Add Public Key to Server

```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@YOUR_LINODE_IP
```

### 3. Push Code to GitHub

```bash
cd /root/code/finance-tracker  # On server, or your local project directory
git init  # If not already a git repo
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
git add .
git commit -m "Initial commit"
git branch -M master  # Production branch is 'master'
git push -u origin master
```

### 4. Configure GitHub Secrets

Go to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Required Secrets:

```
SSH_PRIVATE_KEY          → Contents of ~/.ssh/github_actions_deploy (private key)
SERVER_USER              → root
SERVER_HOST              → YOUR_LINODE_IP or yourdomain.com
DOMAIN_PRODUCTION        → wiseman-palace.co.ke
STACK_NAME_PRODUCTION    → wiseman-palace-production
SECRET_KEY               → Your backend secret key
FIRST_SUPERUSER          → admin@wiseman-palace.co.ke
FIRST_SUPERUSER_PASSWORD → Your admin password
POSTGRES_PASSWORD        → Your database password
POSTGRES_USER            → postgres
POSTGRES_DB              → app
POSTGRES_PORT            → 5432
SMTP_HOST                → smtp.gmail.com
SMTP_USER                → Your email
SMTP_PASSWORD            → Your email password
EMAILS_FROM_EMAIL        → noreply@wiseman-palace.co.ke
```

#### Staging Secrets (Optional - for staging environment):

```
SERVER_HOST_STAGING      → Staging server hostname/IP (or use SERVER_HOST)
SERVER_USER_STAGING      → Staging server user (or use SERVER_USER)
APP_DIR_STAGING          → /root/code/finance-tracker-staging (default)
DOMAIN_STAGING           → staging.yourdomain.com
STACK_NAME_STAGING       → finance-tracker-staging
POSTGRES_DB_STAGING      → app_staging (default)
FRONTEND_HOST_STAGING    → https://dashboard.${DOMAIN_STAGING}
BACKEND_CORS_ORIGINS_STAGING → Auto-generated from staging domain
```

#### Optional Secrets:

```
APP_DIR                  → /root/code/finance-tracker (default)
FRONTEND_HOST            → https://dashboard.${DOMAIN} (auto-generated)
BACKEND_CORS_ORIGINS     → Auto-generated from domain
DOCKER_IMAGE_BACKEND     → finance-tracker-backend (default)
DOCKER_IMAGE_FRONTEND    → finance-tracker-frontend (default)
SENTRY_DSN               → (optional, leave empty if not using)
SMOKESHOW_AUTH_KEY       → (optional, for coverage preview)
REPO_DEPLOY_KEY          → (optional, for private repo access)
REPO_DEPLOY_KEY_B64      → (optional, base64 encoded deploy key)
REPO_PAT                 → (optional, Personal Access Token for repo access)
```

### 5. How It Works

#### CI Workflow (`.github/workflows/ci.yml`)
- **Triggers**: Push to `master` or `develop`, Pull requests
- **Actions**:
  - Lints backend code (Python)
  - Lints frontend code (TypeScript/React with Biome)
  - Runs backend tests with coverage
  - Tests Docker Compose setup and health checks
  - Uploads test coverage (if SMOKESHOW_AUTH_KEY is set)

#### Playwright Tests (`.github/workflows/playwright.yml`)
- **Triggers**: Push to `master` or `develop`, Pull requests
- **Actions**:
  - Runs end-to-end tests in parallel (4 shards)
  - Only runs if relevant files changed (smart filtering)
  - Generates and uploads HTML test reports

#### Deploy to Production (`.github/workflows/deploy-production.yml`)
- **Triggers**:
  - Push to `master` branch
  - After CI and Playwright workflows complete successfully
  - Manual trigger via GitHub Actions UI
- **Actions**:
  - Connects to production server via SSH
  - Pulls latest code from `master` branch
  - Rebuilds Docker images
  - Restarts services and supervisor processes
  - Comprehensive deployment verification:
    - Container status checks
    - Supervisor process checks
    - Internal health check (container)
    - External health check (HTTPS endpoint)

#### Deploy to Staging (`.github/workflows/deploy-staging.yml`)
- **Triggers**:
  - Push to `develop` branch
  - After CI workflow completes successfully
  - Manual trigger via GitHub Actions UI
- **Actions**:
  - Same as production but deploys from `develop` branch
  - Uses staging-specific configuration
  - Includes same health checks as production

### 6. Testing the Pipeline

#### Test CI (Development)
1. Create a feature branch to test:
   ```bash
   git checkout -b feature/test-ci
   ```
2. Make a small change to your code
3. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD"
   git push origin feature/test-ci
   ```
4. Create a Pull Request to `develop` or `master`
5. Go to **Actions** tab in GitHub to watch the CI workflow
6. Verify all checks pass (linting, tests, Docker Compose)

#### Test Staging Deployment
1. Merge your feature to `develop` branch:
   ```bash
   git checkout develop
   git merge feature/test-ci
   git push origin develop
   ```
2. Watch the Actions tab - CI should run, then staging deployment
3. Verify staging deployment completed with health checks

#### Test Production Deployment
1. Merge `develop` to `master`:
   ```bash
   git checkout master
   git merge develop
   git push origin master
   ```
2. Watch the Actions tab - CI and Playwright should run, then production deployment
3. Verify production deployment completed with health checks
4. Check your production site is working

## Troubleshooting

### SSH Connection Fails

```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions_deploy root@YOUR_LINODE_IP

# Check key permissions
chmod 600 ~/.ssh/github_actions_deploy
```

### Deployment Fails

- Check GitHub Actions logs for errors
- Verify all secrets are set correctly
- Check server disk space: `df -h`
- Verify Docker is running: `docker ps`

### Services Not Updating

Manually restart on server:
```bash
cd /root/code/finance-tracker
docker compose restart
```

### Health Checks Fail

- **Internal health check fails**: Check backend container logs
  ```bash
  docker compose logs backend
  docker exec $(docker compose ps -q backend) supervisorctl status
  ```
- **External health check fails**: May be SSL/certificate issue
  - Check Traefik logs
  - Verify domain DNS is correct
  - Internal check passing = deployment likely successful

### Frontend Linting Fails

Run locally to see errors:
```bash
cd frontend
npm run lint
```

### Backend Linting Fails

Run locally to see errors:
```bash
cd backend
uv run bash scripts/lint.sh
```

## Workflow Files

- `.github/workflows/ci.yml` - Continuous Integration (tests, linting)
- `.github/workflows/playwright.yml` - End-to-end testing
- `.github/workflows/deploy-production.yml` - Production deployment
- `.github/workflows/deploy-staging.yml` - Staging deployment
- `.github/workflows/generate-client.yml` - Auto-generate frontend client

See `.github/workflows/README.md` for detailed workflow documentation.

## Security Notes

- Never commit SSH private keys to the repository
- Use GitHub Secrets for all sensitive data
- Rotate SSH keys periodically
- Use strong passwords for all services
- Enable 2FA on your GitHub account

## Branch Strategy

- **`master`**: Production branch
  - Protected branch (recommended)
  - Requires CI + Playwright to pass
  - Auto-deploys to production

- **`develop`**: Development/staging branch
  - Requires CI to pass
  - Auto-deploys to staging

## Next Steps

- ✅ Set up staging environment (now automated)
- Configure automated backups
- Set up monitoring and alerts
- Configure log aggregation
- Set up branch protection rules in GitHub

