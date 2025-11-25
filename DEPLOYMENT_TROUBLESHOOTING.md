# Production Deployment Troubleshooting Guide

## How Production Deployment Works

The production deployment (`deploy-production.yml`) triggers in these scenarios:

1. **Direct Push**: When you push to `main` or `master` branch
2. **Manual Trigger**: Via GitHub Actions UI (workflow_dispatch)
3. **After CI Success**: Automatically after CI workflow completes successfully

## Current Deployment Process

1. **SSH to Production Server**
2. **Pull Latest Code**: `git fetch origin` then `git reset --hard origin/main` or `origin/master`
3. **Build Docker Images**: `docker compose build`
4. **Restart Services**: `docker compose up -d`
5. **Restart Supervisor**: Restarts backend supervisor processes

## Common Issues & Solutions

### Issue 1: Changes Not Visible After Push

**Possible Causes:**
- Changes not pushed to master/main branch
- CI workflow failed (deployment only runs after successful CI)
- Deployment workflow didn't run
- Docker images not rebuilt
- Frontend not rebuilt (if only frontend changes)

**Solutions:**

1. **Check if changes are pushed:**
   ```bash
   git status
   git log origin/master --oneline -5
   ```

2. **Check GitHub Actions:**
   - Go to: `https://github.com/YOUR_REPO/actions`
   - Check if "CI" workflow completed successfully
   - Check if "Deploy to Production" workflow ran

3. **Manually trigger deployment:**
   - Go to GitHub Actions → "Deploy to Production"
   - Click "Run workflow" → Select branch → Run

4. **Check if frontend needs rebuild:**
   - If you changed frontend code, ensure Docker rebuilds frontend
   - The workflow runs `docker compose build` which should rebuild everything

### Issue 2: Deployment Workflow Not Running

**Check:**
- GitHub Actions tab shows the workflow
- Workflow has required secrets configured:
  - `SSH_PRIVATE_KEY`
  - `SERVER_USER`
  - `SERVER_HOST`
  - `APP_DIR`
  - `DOMAIN_PRODUCTION`
  - `STACK_NAME_PRODUCTION`
  - And other required secrets

### Issue 3: Deployment Runs But Changes Not Visible

**Possible Causes:**
- Browser cache (hard refresh needed)
- Frontend build cache
- Docker not rebuilding changed files
- Services not restarting properly

**Solutions:**

1. **Hard refresh browser**: `Ctrl+Shift+R` or `Cmd+Shift+R`

2. **Check if services restarted:**
   ```bash
   # On production server
   docker compose ps
   docker compose logs frontend --tail=50
   docker compose logs backend --tail=50
   ```

3. **Force rebuild without cache:**
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

### Issue 4: Only Frontend Changes

If you only changed frontend files, ensure:
- Frontend Docker image is rebuilt
- Frontend container is restarted
- Browser cache is cleared

## Quick Fixes

### Force Redeploy
1. Go to GitHub Actions
2. Find "Deploy to Production" workflow
3. Click "Run workflow" → Select `master` → Run

### Check Deployment Status
```bash
# SSH to production server
ssh USER@SERVER

# Check service status
cd /root/code/finance-tracker  # or your APP_DIR
docker compose ps
docker compose logs frontend --tail=50
docker compose logs backend --tail=50
```

### Manual Deployment (if needed)
```bash
# On production server
cd /root/code/finance-tracker  # or your APP_DIR
git fetch origin
git reset --hard origin/master
docker compose build
docker compose up -d
```

## Verification Steps

1. ✅ Check GitHub Actions: Did deployment run?
2. ✅ Check server logs: Are services running?
3. ✅ Check browser: Hard refresh (Ctrl+Shift+R)
4. ✅ Check Docker: Are containers running?
5. ✅ Check git: Is code up to date on server?

## Next Steps

1. Check your current branch and if changes are committed
2. Push to master/main if not already done
3. Check GitHub Actions to see if workflows ran
4. If needed, manually trigger deployment
5. Verify on production server that code is updated

