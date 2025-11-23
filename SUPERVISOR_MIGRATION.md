# Supervisor Migration Summary

## Overview

Successfully migrated from `wiseman-scheduler.service` (systemd) to **Supervisor** for managing background jobs in the Finance Tracker application.

## What Was Changed

### 1. **New Files Created**

#### Configuration
- **`backend/supervisord.conf`** - Supervisor configuration managing FastAPI + Scheduler processes
- **`backend/SUPERVISOR.md`** - Comprehensive documentation for Supervisor usage
- **`backend/supervisor-ctl.sh`** - Helper script for managing supervisor processes

#### Email Templates (MJML Sources)
- **`backend/app/email-templates/src/debt_reminder.mjml`** - Supplier debt reminder email
- **`backend/app/email-templates/src/reorder_alert.mjml`** - Low stock reorder alert email
- **`backend/app/email-templates/src/low_stock_notification.mjml`** - Individual product low stock alert

#### Email Templates (Built HTML)
- **`backend/app/email-templates/build/debt_reminder.html`** - Generated from MJML
- **`backend/app/email-templates/build/reorder_alert.html`** - Generated from MJML
- **`backend/app/email-templates/build/low_stock_notification.html`** - Generated from MJML

### 2. **Modified Files**

#### Docker Configuration
- **`backend/Dockerfile`**
  - Added Supervisor installation (`apt-get install supervisor`)
  - Added Node.js and MJML for template building
  - Created log directories for Supervisor
  - Added automatic MJML → HTML template compilation during build
  - Changed CMD from `fastapi run` to `supervisord`

- **`docker-compose.yml`**
  - Added `supervisor-logs` volume for persistent logging
  - Backend service now uses Supervisor by default

- **`docker-compose.override.yml`**
  - Added `supervisor-logs-dev` volume for development
  - Exposed port 9001 for Supervisor web interface (dev only)
  - Documented how to toggle between Supervisor and direct FastAPI mode

#### Backend Code
- **`backend/app/utils.py`**
  - Added `generate_debt_reminder_email()` function
  - Added `generate_reorder_alert_email()` function
  - Added `generate_low_stock_notification_email()` function

- **`backend/app/background_services.py`**
  - Integrated email template functions
  - Updated `send_debt_reminder_emails()` to send formatted HTML emails
  - Updated `send_reorder_alerts()` to send consolidated HTML emails
  - Added proper error handling for email failures
  - Added email status logging ("sent" or "failed")

## Key Features

### 1. **Process Management**
Supervisor manages two processes:
- **FastAPI** (4 workers) - Priority 100
- **Scheduler** (APScheduler) - Priority 200

### 2. **Automated Background Jobs**

| Job | Schedule | Description |
|-----|----------|-------------|
| Debt Reminders | Daily at 8:00 AM | Sends email reminders for overdue supplier debts |
| Reorder Alerts | Daily at 9:00 AM | Alerts admins about products below reorder level |
| Notification Cleanup | Weekly (Sunday midnight) | Deletes read notifications older than 30 days |

### 3. **Professional Email Templates**
- Built using MJML (responsive email framework)
- Automatically compiled to HTML during Docker build
- Jinja2 template rendering for dynamic content
- Consistent branding across all emails

### 4. **Logging & Monitoring**
- Centralized logs in `/var/log/supervisor/`
- Automatic log rotation (50MB max, 10 backups)
- Separate stdout/stderr for each process
- Web interface available on port 9001 (dev mode)

## Usage

### Quick Start

```bash
# Build and start with supervisor
docker-compose build backend
docker-compose up -d backend

# Check status
./backend/supervisor-ctl.sh status

# View logs
./backend/supervisor-ctl.sh logs scheduler
./backend/supervisor-ctl.sh logs fastapi

# Restart a process
./backend/supervisor-ctl.sh restart scheduler
```

### Development Mode

**Option 1: With Background Jobs (Default)**
```yaml
# docker-compose.override.yml
backend:
  command: /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
```

**Option 2: Without Background Jobs**
```yaml
# docker-compose.override.yml
backend:
  command:
    - fastapi
    - run
    - --reload
    - "app/main.py"
```

### Managing Email Templates

```bash
# Rebuild templates after editing MJML
cd backend
./supervisor-ctl.sh build-templates

# Or manually:
npx mjml app/email-templates/src/debt_reminder.mjml -o app/email-templates/build/debt_reminder.html
```

## Benefits Over systemd

| Feature | systemd (Old) | Supervisor (New) |
|---------|---------------|------------------|
| Container-native | ❌ No | ✅ Yes |
| Manages multiple processes | ❌ No | ✅ Yes (FastAPI + Scheduler) |
| Web UI | ❌ No | ✅ Yes (dev mode) |
| Cross-platform | ❌ Linux only | ✅ Container-agnostic |
| Log management | systemd journal | Rotated files with volume mounts |
| Process restart | systemd | Automatic with configurable delays |
| Development support | ❌ Poor | ✅ Excellent |

## Migration from Old System

If you were using `wiseman-scheduler.service`:

1. **Remove systemd service** (on bare metal/VM):
   ```bash
   sudo systemctl stop wiseman-scheduler
   sudo systemctl disable wiseman-scheduler
   sudo rm /etc/systemd/system/wiseman-scheduler.service
   ```

2. **Deploy with Docker**:
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

3. **Verify processes are running**:
   ```bash
   docker exec -it <container> supervisorctl status
   ```

## Environment Variables

Email functionality requires these environment variables in `.env`:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASSWORD=your_password
SMTP_TLS=true
EMAILS_FROM_EMAIL=noreply@example.com
EMAILS_FROM_NAME="Finance Tracker"
```

## Testing Background Jobs

### Manual Testing

```bash
# Enter container
docker exec -it finance-tracker-backend-1 bash

# Run individual jobs
python -m app.background_services debt_reminders
python -m app.background_services reorder_alerts
python -m app.background_services notification_cleanup
```

### Check Scheduler Logs

```bash
./backend/supervisor-ctl.sh logs scheduler
```

### Verify Email Sending

In development with mailcatcher:
1. Visit http://localhost:1080
2. Trigger a background job
3. Check mailcatcher for received emails

## Troubleshooting

### Processes Not Starting

```bash
# Check supervisor logs
docker logs finance-tracker-backend-1

# Check individual process logs
./backend/supervisor-ctl.sh logs fastapi
./backend/supervisor-ctl.sh logs scheduler
```

### Jobs Not Running

1. Check scheduler logs for errors
2. Verify database connection
3. Check SMTP configuration
4. Ensure admin users have email addresses

### Template Rendering Issues

```bash
# Verify templates exist
docker exec -it <container> ls -la /app/app/email-templates/build/

# Rebuild templates
./backend/supervisor-ctl.sh build-templates

# Rebuild container
docker-compose build backend
docker-compose up -d backend
```

## Files to Keep/Remove

### Keep
- ✅ `backend/scheduler.py` - Still used by Supervisor
- ✅ `backend/app/background_services.py` - Core job logic

### Can Remove (Optional)
- ❌ `backend/wiseman-scheduler.service` - Replaced by Supervisor
- ❌ `backend/scheduler_cron.sh` - Not needed with Supervisor

### New & Important
- ✅ `backend/supervisord.conf` - Supervisor config
- ✅ `backend/SUPERVISOR.md` - Documentation
- ✅ `backend/supervisor-ctl.sh` - Helper script
- ✅ `backend/app/email-templates/src/*.mjml` - Email sources
- ✅ `backend/app/email-templates/build/*.html` - Compiled templates

## Next Steps

1. **Test the setup**:
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ./backend/supervisor-ctl.sh status
   ```

2. **Verify background jobs** are scheduled:
   ```bash
   ./backend/supervisor-ctl.sh logs scheduler
   # Should see job scheduling messages
   ```

3. **Configure email settings** in `.env` file

4. **Test email templates** by triggering jobs or using the test endpoint

5. **Monitor logs** for the first few runs to ensure everything works

6. **Remove old systemd service** if migrating from bare metal

## Documentation

- Full documentation: `backend/SUPERVISOR.md`
- Helper script: `./backend/supervisor-ctl.sh --help`
- Supervisor docs: http://supervisord.org/

## Support

For issues or questions:
1. Check logs: `./backend/supervisor-ctl.sh logs all`
2. Review documentation: `backend/SUPERVISOR.md`
3. Verify configuration in `backend/supervisord.conf`
4. Check Docker container status: `docker ps`
