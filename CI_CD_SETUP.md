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
git branch -M main
git push -u origin main
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

#### Optional Secrets:

```
APP_DIR                  → /root/code/finance-tracker (default)
FRONTEND_HOST            → https://dashboard.${DOMAIN} (auto-generated)
BACKEND_CORS_ORIGINS     → Auto-generated from domain
DOCKER_IMAGE_BACKEND     → finance-tracker-backend (default)
DOCKER_IMAGE_FRONTEND    → finance-tracker-frontend (default)
SENTRY_DSN               → (optional, leave empty if not using)
```

### 5. How It Works

#### CI Workflow (`.github/workflows/ci.yml`)
- **Triggers**: Push to main/master/develop, Pull requests
- **Actions**:
  - Runs backend tests
  - Tests Docker Compose setup
  - Lints backend code
  - Uploads test coverage

#### Deploy Workflow (`.github/workflows/deploy-production.yml`)
- **Triggers**:
  - Push to main/master branch
  - After CI workflow completes successfully
  - Manual trigger via GitHub Actions UI
- **Actions**:
  - Connects to Linode server via SSH
  - Pulls latest code from GitHub
  - Rebuilds Docker images
  - Restarts services
  - Verifies deployment

### 6. Testing the Pipeline

1. Make a small change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD"
   git push origin main
   ```
3. Go to **Actions** tab in GitHub to watch the workflows
4. Verify deployment completed successfully

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

## Workflow Files

- `.github/workflows/ci.yml` - Continuous Integration (tests, linting)
- `.github/workflows/deploy-production.yml` - Production deployment

## Security Notes

- Never commit SSH private keys to the repository
- Use GitHub Secrets for all sensitive data
- Rotate SSH keys periodically
- Use strong passwords for all services
- Enable 2FA on your GitHub account

## Next Steps

- Set up staging environment
- Configure automated backups
- Set up monitoring and alerts
- Configure log aggregation

