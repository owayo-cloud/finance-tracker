# CI/CD Workflow Documentation

This document describes the CI/CD pipeline structure and flow for the finance-tracker application.

## Workflow Overview

### 1. CI Workflow (`.github/workflows/ci.yml`)
**Purpose**: Continuous Integration - runs tests, linting, and validation

**Triggers**:
- Push to `master` or `develop` branches
- Pull requests targeting `master` or `develop`

**Jobs**:
1. **lint-backend**: Lints Python backend code
2. **lint-frontend**: Lints TypeScript/React frontend code using Biome
3. **test-backend**: Runs backend unit tests with coverage
4. **test-docker-compose**: Tests Docker Compose setup and service health
5. **coverage-preview**: Uploads test coverage reports (if SMOKESHOW_AUTH_KEY is set)
6. **ci-success**: Summary job that ensures all checks pass

**Flow**: All jobs run in parallel except `coverage-preview` (depends on `test-backend`) and `ci-success` (depends on all others).

---

### 2. Playwright Tests (`.github/workflows/playwright.yml`)
**Purpose**: End-to-end testing with Playwright

**Triggers**:
- Push to `master` or `develop` branches
- Pull requests targeting `master` or `develop`
- Manual dispatch

**Jobs**:
1. **changes**: Detects if relevant files changed (backend, frontend, docker-compose, etc.)
2. **test-playwright**: Runs Playwright tests in 4 parallel shards (only if changes detected)
3. **merge-playwright-reports**: Merges test reports from all shards into HTML report
4. **alls-green-playwright**: Ensures all shards completed (for branch protection)

**Flow**: Tests only run if relevant files changed, improving efficiency.

---

### 3. Deploy to Production (`.github/workflows/deploy-production.yml`)
**Purpose**: Deploy to production environment

**Triggers**:
- Push to `master` branch
- Manual dispatch
- After CI and Playwright workflows complete successfully

**Jobs**:
1. **deploy**: 
   - Connects to production server via SSH
   - Pulls latest code from `master` branch
   - Builds Docker images
   - Restarts services
   - Restarts supervisor processes
   - Verifies deployment with health checks

**Deployment Steps**:
1. SSH connection setup
2. Clone/pull repository
3. Set environment variables
4. Build Docker images
5. Start services with docker-compose
6. Restart supervisor processes
7. Verify deployment:
   - Check container status
   - Check supervisor processes
   - Internal health check (container)
   - External health check (HTTPS endpoint)

**Required Secrets**:
- `SSH_PRIVATE_KEY`: SSH key for server access
- `SERVER_USER`: Server username (default: root)
- `SERVER_HOST`: Production server hostname/IP
- `DOMAIN_PRODUCTION`: Production domain
- `STACK_NAME_PRODUCTION`: Docker Compose stack name
- `SECRET_KEY`, `FIRST_SUPERUSER`, `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_*`: Database credentials
- `SMTP_*`: Email configuration
- And others (see CI_CD_SETUP.md)

---

### 4. Deploy to Staging (`.github/workflows/deploy-staging.yml`)
**Purpose**: Deploy to staging environment

**Triggers**:
- Push to `develop` branch
- Manual dispatch
- After CI workflow completes successfully

**Jobs**:
1. **deploy**: Same structure as production deployment but:
   - Deploys from `develop` branch
   - Uses staging-specific secrets (with fallback to production secrets)
   - Uses separate staging directory and stack name

**Required Secrets** (with `_STAGING` suffix or fallback):
- `SERVER_HOST_STAGING` (or `SERVER_HOST`)
- `DOMAIN_STAGING`
- `STACK_NAME_STAGING`
- `APP_DIR_STAGING` (defaults to `/root/code/finance-tracker-staging`)
- And other staging-specific or shared secrets

---

### 5. Generate Client (`.github/workflows/generate-client.yml`)
**Purpose**: Auto-generate frontend client from OpenAPI schema

**Triggers**:
- Pull requests to `master` or `develop`
- Push to `master` or `develop`

**Jobs**:
1. **generate-client**: 
   - Generates TypeScript client from backend OpenAPI schema
   - Commits changes back to PR (for same-repo PRs)
   - Fails if changes detected but not committed (for fork PRs)

---

## Complete CI/CD Flow

### Development Flow
```
Developer pushes to `develop` branch
    ↓
CI Workflow runs:
    ├─ lint-backend ✓
    ├─ lint-frontend ✓
    ├─ test-backend ✓
    ├─ test-docker-compose ✓
    └─ coverage-preview ✓
    ↓
If CI passes → Deploy to Staging
    ↓
Staging deployment:
    ├─ SSH to staging server
    ├─ Pull latest from develop
    ├─ Build & deploy
    └─ Health checks ✓
```

### Production Flow
```
Developer merges to `master` branch
    ↓
CI Workflow runs (parallel):
    ├─ lint-backend ✓
    ├─ lint-frontend ✓
    ├─ test-backend ✓
    └─ test-docker-compose ✓
    ↓
Playwright Tests run (if relevant files changed):
    ├─ Run E2E tests in 4 shards
    └─ Merge reports ✓
    ↓
If CI + Playwright pass → Deploy to Production
    ↓
Production deployment:
    ├─ SSH to production server
    ├─ Pull latest from master
    ├─ Build & deploy
    ├─ Restart supervisor
    └─ Health checks (internal + external) ✓
```

## Branch Strategy

- **`master`**: Production branch
  - Protected branch
  - Requires CI + Playwright to pass before deployment
  - Auto-deploys to production after successful tests

- **`develop`**: Development/staging branch
  - Requires CI to pass before deployment
  - Auto-deploys to staging after successful CI

## Health Checks

Both staging and production deployments include comprehensive health checks:

1. **Container Status**: Verifies all containers are running
2. **Supervisor Status**: Checks supervisor processes in backend container
3. **Internal Health Check**: Tests backend health endpoint inside container
4. **External Health Check**: Tests backend health endpoint via HTTPS (with retry logic)

Health check endpoint: `/api/v1/utils/health-check/`

## Best Practices

1. **Never skip CI**: All code must pass CI before deployment
2. **Test locally first**: Run `npm run lint` and backend tests before pushing
3. **Use feature branches**: Create PRs from feature branches to `develop` or `master`
4. **Monitor deployments**: Check GitHub Actions logs for deployment status
5. **Health checks**: External health checks may fail due to SSL/certificate issues, but internal checks are the primary indicator

## Troubleshooting

### CI Fails
- Check linting errors in job logs
- Run tests locally to reproduce issues
- Check coverage thresholds

### Deployment Fails
- Verify SSH key is correct
- Check server disk space
- Verify all required secrets are set
- Check Docker logs on server: `docker compose logs`

### Health Checks Fail
- Internal check failure = deployment issue (check container logs)
- External check failure = may be SSL/certificate issue (check Traefik)

## Security Notes

- All secrets stored in GitHub Secrets
- SSH keys never committed to repository
- Production and staging use separate credentials where possible
- Health checks use HTTPS for external verification

