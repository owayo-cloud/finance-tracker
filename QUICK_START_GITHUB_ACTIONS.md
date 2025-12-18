# Quick Start: GitHub Actions Setup

Follow these steps in order. Copy and paste commands as needed.

---

## STEP 1: Generate SSH Key on Server

**Run this on your server (SSH in):**
```bash
# Copy the setup script to server OR run these commands directly:

ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Display private key - COPY THIS ENTIRE OUTPUT
echo "=== START PRIVATE KEY ==="
cat ~/.ssh/github_actions_deploy
echo "=== END PRIVATE KEY ==="
```

**Action:** Copy the entire private key output (from `-----BEGIN` to `-----END`)

---

## STEP 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `finance-tracker` (or your choice)
3. Choose Public or Private
4. **DO NOT** check "Add a README file"
5. Click "Create repository"

---

## STEP 3: Push Code to GitHub

**On your local machine:**
```bash
cd C:\Users\uchiha\Documents\projects\finance-tracker

# Check if git is initialized
git status

# If not initialized:
git init
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git

# Check current branch
git branch

# If on 'main', switch to 'master' (or keep main if you prefer)
git checkout -b master  # or: git branch -M master

# Add all files
git add .

# Commit
git commit -m "Initial commit with nginx security fix and GitHub Actions setup"

# Push
git push -u origin master
```

**Replace `YOUR_USERNAME` with your GitHub username!**

---

## STEP 4: Generate Required Secrets

**On your local machine (PowerShell or WSL):**
```bash
# Generate SECRET_KEY
python -c "import secrets; print('SECRET_KEY:', secrets.token_urlsafe(32))"

# Generate POSTGRES_PASSWORD  
python -c "import secrets; print('POSTGRES_PASSWORD:', secrets.token_urlsafe(32))"
```

**Action:** Copy both generated values - you'll need them!

---

## STEP 5: Add GitHub Secrets

Go to: **https://github.com/YOUR_USERNAME/finance-tracker/settings/secrets/actions**

Click **"New repository secret"** for each:

### Secret 1: SSH_PRIVATE_KEY
- Name: `SSH_PRIVATE_KEY`
- Value: [Paste the entire private key from STEP 1]

### Secret 2: SERVER_USER
- Name: `SERVER_USER`
- Value: `root`

### Secret 3: SERVER_HOST
- Name: `SERVER_HOST`
- Value: `173.255.249.250`

### Secret 4: APP_DIR
- Name: `APP_DIR`
- Value: `/root/code/finance-tracker`

### Secret 5: DOMAIN_PRODUCTION
- Name: `DOMAIN_PRODUCTION`
- Value: `wiseman-palace.co.ke`

### Secret 6: STACK_NAME
- Name: `STACK_NAME`
- Value: `wiseman-palace-production`

### Secret 7: SECRET_KEY
- Name: `SECRET_KEY`
- Value: [Paste the SECRET_KEY from STEP 4]

### Secret 8: FIRST_SUPERUSER
- Name: `FIRST_SUPERUSER`
- Value: `admin@wiseman-palace.co.ke`

### Secret 9: FIRST_SUPERUSER_PASSWORD
- Name: `FIRST_SUPERUSER_PASSWORD`
- Value: [Choose a strong password]

### Secret 10: POSTGRES_PASSWORD
- Name: `POSTGRES_PASSWORD`
- Value: [Paste the POSTGRES_PASSWORD from STEP 4]

### Secret 11: POSTGRES_USER
- Name: `POSTGRES_USER`
- Value: `postgres`

### Secret 12: POSTGRES_DB
- Name: `POSTGRES_DB`
- Value: `app`

### Secret 13: POSTGRES_PORT
- Name: `POSTGRES_PORT`
- Value: `5432`

### Secret 14: SMTP_HOST
- Name: `SMTP_HOST`
- Value: [Your SMTP server, e.g., `smtp.gmail.com`]

### Secret 15: SMTP_USER
- Name: `SMTP_USER`
- Value: [Your email/SMTP username]

### Secret 16: SMTP_PASSWORD
- Name: `SMTP_PASSWORD`
- Value: [Your SMTP password or app password]

### Secret 17: EMAILS_FROM_EMAIL
- Name: `EMAILS_FROM_EMAIL`
- Value: `noreply@wiseman-palace.co.ke`

---

## STEP 6: Trigger Deployment

1. Go to: **https://github.com/YOUR_USERNAME/finance-tracker/actions**
2. Click on **"Deploy to Production"** workflow (left sidebar)
3. Click **"Run workflow"** button (top right, dropdown)
4. Select branch: `master`
5. Click **"Run workflow"** button

**Watch it run!** The workflow will:
- Connect to your server
- Pull latest code
- Build and deploy Docker images
- Update your containers

---

## STEP 7: Verify

**Check workflow status:**
- Should show ✅ green checkmark when done

**Check server:**
```bash
ssh root@173.255.249.250
docker ps
```

**Check website:**
- Visit: https://dashboard.wiseman-palace.co.ke
- Test security: `curl -I https://dashboard.wiseman-palace.co.ke/.env` should return 404

---

## Done! 🎉

Now whenever you:
1. Make code changes
2. Commit and push to `master`
3. Go to Actions → "Deploy to Production" → "Run workflow"

No more manual server connections needed!

