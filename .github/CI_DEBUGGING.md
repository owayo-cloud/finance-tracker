# CI/CD Debugging Guide

## Quick Fixes for Common CI Failures

### Frontend Linting Fails

**Error**: `Lint Frontend` job fails

**Solution**:
1. Run locally to see errors:
   ```bash
   cd frontend
   npm run lint
   ```
2. Fix the errors manually, or let Biome auto-fix:
   ```bash
   npm run lint  # This will auto-fix with --write flag
   ```
3. Commit the fixes and push again

**Note**: The CI uses `biome check` (without `--write`) to only check for errors, not fix them. You need to fix errors locally first.

---

### Backend Linting Fails

**Error**: `Lint Backend` job fails

**Solution**:
1. Run locally to see errors:
   ```bash
   cd backend
   uv run bash scripts/lint.sh
   ```
2. Fix the errors manually
3. Commit the fixes and push again

---

### Backend Tests Fail

**Error**: `Test Backend` job fails

**Solution**:
1. Run tests locally:
   ```bash
   cd backend
   uv run bash scripts/tests-start.sh
   ```
2. Check the test output for failures
3. Fix failing tests
4. Commit and push again

---

### Docker Compose Test Fails

**Error**: `Test Docker Compose` job fails

**Common Causes**:
1. **Health check timeout**: Backend taking too long to start
   - Check if backend is actually starting
   - Verify database connection
   - Check for port conflicts

2. **Frontend not accessible**: Frontend not responding
   - Check if frontend build succeeded
   - Verify port 5173 is available

**Solution**:
1. Test locally:
   ```bash
   docker compose build
   docker compose up -d
   curl http://localhost:8000/api/v1/utils/health-check/
   curl http://localhost:5173
   docker compose down
   ```

---

## Viewing CI Logs

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Click on the failed workflow run
4. Click on the failed job (e.g., "Lint Frontend")
5. Expand the failed step to see error messages

---

## Common Error Messages

### Biome Errors

- **"X errors found"**: There are linting errors in your code
  - Run `npm run lint` locally to auto-fix
  - Or fix manually based on error messages

- **"File not found"**: Missing files or incorrect paths
  - Check file paths in your code

### Backend Linting Errors

- **Ruff errors**: Python code style issues
  - Check the specific file and line number
  - Fix according to Ruff's suggestions

- **MyPy errors**: Type checking issues
  - Add type hints or fix type mismatches

### Test Failures

- **AssertionError**: Test expectations not met
  - Check test output for expected vs actual values
  - Update tests or fix code

- **ImportError**: Missing dependencies
  - Run `uv sync` in backend directory
  - Check `pyproject.toml` for missing dependencies

---

## Pre-commit Checks

To catch issues before pushing:

```bash
# Install pre-commit hooks (if not already installed)
cd backend
uv run pre-commit install

# Run checks manually
uv run pre-commit run --all-files
```

---

## Fixing All Linting Issues at Once

### Frontend
```bash
cd frontend
npm run lint  # Auto-fixes issues
git add .
git commit -m "fix: resolve frontend linting issues"
```

### Backend
```bash
cd backend
uv run bash scripts/lint.sh  # Shows errors
# Fix errors manually, then:
git add .
git commit -m "fix: resolve backend linting issues"
```

---

## Still Having Issues?

1. **Check GitHub Actions logs** for detailed error messages
2. **Run commands locally** to reproduce the issue
3. **Check recent changes** that might have introduced the error
4. **Verify dependencies** are up to date
5. **Clear caches** if builds are inconsistent:
   ```bash
   # Frontend
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   
   # Backend
   cd backend
   uv sync --refresh
   ```

