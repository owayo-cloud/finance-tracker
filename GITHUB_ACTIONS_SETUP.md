# GitHub Actions Setup - Quick Guide

## Step 1: Generate SSH Key (if not already done)

**On your server**, run:
```bash
bash setup-ssh-key.sh
```

This will generate and display a private key. **Copy the entire private key output**.

## Step 2: Configure GitHub Secrets

Go to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

### Required Secrets:

| Secret Name | Value | Notes |
|------------|-------|-------|
| `SSH_PRIVATE_KEY` | [Paste the private key from Step 1] | Entire key including `-----BEGIN` and `-----END` |
| `SERVER_USER` | `root` | |
| `SERVER_HOST` | `173.255.249.250` | Your server IP |
| `APP_DIR` | `/root/code/finance-tracker` | Production app directory |
| `DOMAIN_PRODUCTION` | `wiseman-palace.co.ke` | Your domain |
| `SECRET_KEY` | [Generate with: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`] | Backend secret key |
| `FIRST_SUPERUSER` | `admin@wiseman-palace.co.ke` | Admin email |
| `FIRST_SUPERUSER_PASSWORD` | [Your secure password] | Admin password |
| `POSTGRES_PASSWORD` | [Generate secure password] | Database password |
| `POSTGRES_USER` | `postgres` | |
| `POSTGRES_DB` | `app` | |
| `POSTGRES_PORT` | `5432` | |
| `SMTP_HOST` | [Your SMTP host] | e.g., `smtp.gmail.com` |
| `SMTP_USER` | [Your SMTP username] | |
| `SMTP_PASSWORD` | [Your SMTP password] | |
| `EMAILS_FROM_EMAIL` | `noreply@wiseman-palace.co.ke` | |

### Optional Secrets:

| Secret Name | Value | Default |
|------------|-------|---------|
| `STACK_NAME` | `wiseman-palace-production` | `finance-tracker` |
| `SENTRY_DSN` | [Your Sentry DSN] | (empty) |

## Step 3: Push Code to GitHub

Make sure your code is pushed to GitHub (especially the updated `nginx.conf` with security fix):

```bash
git add .
git commit -m "Add nginx security fix and GitHub Actions workflows"
git push origin master
```

## Step 4: Trigger Deployment

1. Go to **Actions** tab in GitHub
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"**
4. Select branch (usually `master`)
5. Click **"Run workflow"**

## How It Works

1. **Build and Push Images** workflow:
   - Triggers on push to `master` or `dev` branch
   - Builds backend and frontend Docker images
   - Pushes to GitHub Container Registry (`ghcr.io`)

2. **Deploy to Production** workflow:
   - Manual trigger (workflow_dispatch)
   - Connects to server via SSH
   - Pulls latest code
   - Loads Docker images
   - Updates containers with `docker compose`
   - Restarts supervisor processes

## Testing

After deployment:
- Check Actions tab for workflow status
- Verify deployment: `curl -I https://dashboard.wiseman-palace.co.ke/.env` (should return 404)
- Check container status on server: `docker ps`

