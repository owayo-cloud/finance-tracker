# Complete GitHub Actions Setup - From Scratch

This guide walks you through setting up GitHub Actions for automated deployment from zero.

## Prerequisites

- Server accessible via SSH (173.255.249.250)
- GitHub repository (can be empty or existing)
- SSH access to server as root

---

## Step 1: Generate SSH Key on Server

**Connect to your server:**
```bash
ssh root@173.255.249.250
```

**On the server, run:**
```bash
# Navigate to your project directory or home
cd ~

# Run the setup script (if you've copied it to server)
bash setup-ssh-key.sh

# OR manually create the SSH key:
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Add public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Display the PRIVATE key (copy this entire output)
echo "=========================================="
echo "COPY THE PRIVATE KEY BELOW TO GITHUB SECRET"
echo "=========================================="
cat ~/.ssh/github_actions_deploy
echo "=========================================="
echo "END OF PRIVATE KEY"
echo "=========================================="
```

**IMPORTANT:** Copy the entire private key output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

---

## Step 2: Create GitHub Repository (if not exists)

1. Go to GitHub.com
2. Click "New repository"
3. Name it (e.g., `finance-tracker`)
4. Make it private or public (your choice)
5. Don't initialize with README (we'll push code)
6. Click "Create repository"

---

## Step 3: Initialize Git Repository Locally

**On your local machine:**
```bash
cd /path/to/finance-tracker

# Initialize git if not already done
git init

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
# OR use SSH: git remote add origin git@github.com:YOUR_USERNAME/finance-tracker.git

# Check current branch
git branch

# If on 'main', rename to 'master' (or keep 'main' if preferred)
git branch -M master

# Add all files
git add .

# Commit
git commit -m "Initial commit with nginx security fix"

# Push to GitHub
git push -u origin master
```

---

## Step 4: Configure GitHub Secrets

Go to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Generate Required Secrets First

**Generate SECRET_KEY and POSTGRES_PASSWORD:**
```bash
# On your local machine or server:
python3 -c "import secrets; print('SECRET_KEY:', secrets.token_urlsafe(32))"
python3 -c "import secrets; print('POSTGRES_PASSWORD:', secrets.token_urlsafe(32))"
```

### Add These Secrets:

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `SSH_PRIVATE_KEY` | [Paste entire private key from Step 1] | From server: `cat ~/.ssh/github_actions_deploy` |
| `SERVER_USER` | `root` | - |
| `SERVER_HOST` | `173.255.249.250` | Your server IP |
| `APP_DIR` | `/root/code/finance-tracker` | Production app directory |
| `DOMAIN_PRODUCTION` | `wiseman-palace.co.ke` | Your domain |
| `STACK_NAME` | `wiseman-palace-production` | Docker stack name |
| `SECRET_KEY` | [Generated in previous step] | From `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `FIRST_SUPERUSER` | `admin@wiseman-palace.co.ke` | Admin email |
| `FIRST_SUPERUSER_PASSWORD` | [Your secure password] | Choose a strong password |
| `POSTGRES_PASSWORD` | [Generated in previous step] | From `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `POSTGRES_USER` | `postgres` | - |
| `POSTGRES_DB` | `app` | - |
| `POSTGRES_PORT` | `5432` | - |
| `SMTP_HOST` | [Your SMTP server] | e.g., `smtp.gmail.com` |
| `SMTP_USER` | [Your SMTP username] | Your email |
| `SMTP_PASSWORD` | [Your SMTP password/app password] | Email password or app password |
| `EMAILS_FROM_EMAIL` | `noreply@wiseman-palace.co.ke` | - |

**Optional Secrets:**
- `SENTRY_DSN` - (leave empty if not using Sentry)

---

## Step 5: Create GitHub Workflow Files

The workflow files should already exist in `.github/workflows/`. If they don't exist, the deployment will fail. 

**Check if workflows exist:**
```bash
ls -la .github/workflows/
```

If the directory doesn't exist, you need to create the workflow files (see workflow templates below).

---

## Step 6: Test the Setup

### Test SSH Connection (from GitHub Actions perspective)

You can test the SSH key works:
```bash
# From your local machine (if you copied the private key)
ssh -i ~/.ssh/github_actions_deploy root@173.255.249.250

# If it works, you're good to go!
```

### Trigger First Deployment

1. Go to GitHub → Your repository → **Actions** tab
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"** button (top right)
4. Select branch: `master`
5. Leave image_tag as `latest`
6. Click **"Run workflow"**

Watch the workflow run. It should:
- Connect to server via SSH
- Clone/pull your repository
- Build Docker images
- Deploy containers

---

## Step 7: Verify Deployment

After the workflow completes:

1. **Check workflow status:** Should show green checkmark
2. **Check server:**
   ```bash
   ssh root@173.255.249.250
   docker ps
   cd /root/code/finance-tracker
   docker compose ps
   ```
3. **Check website:**
   - Frontend: https://dashboard.wiseman-palace.co.ke
   - Backend API: https://api.wiseman-palace.co.ke/docs
   - Security fix: `curl -I https://dashboard.wiseman-palace.co.ke/.env` should return 404

---

## Troubleshooting

### SSH Connection Fails
- Verify private key is copied correctly (include headers)
- Check `SERVER_USER` and `SERVER_HOST` secrets
- Test SSH manually: `ssh -i private_key root@173.255.249.250`

### Deployment Fails
- Check workflow logs in GitHub Actions
- Verify all secrets are set
- Check server has space: `df -h` on server
- Verify Docker is running on server: `docker ps`

### Changes Not Appearing
- Make sure you pushed code to `master` branch
- Check if workflow actually ran
- Verify containers restarted: `docker ps` on server

---

## Next Steps

After successful setup:
- Make code changes
- Commit and push to `master`
- Workflow will automatically deploy (or trigger manually)
- No more manual server connections needed! 🎉

