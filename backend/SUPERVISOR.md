# Background Jobs with Supervisor

This document describes how background jobs are managed using Supervisor in the Finance Tracker application.

## Overview

Supervisor is used to manage two main processes in the backend container:
1. **FastAPI Application** - The main web server
2. **Scheduler** - Background jobs for reminders, alerts, and cleanup

## Architecture

### Supervisor Configuration

The `supervisord.conf` file defines two programs:

```ini
[program:fastapi]
command=fastapi run --workers 4 app/main.py
priority=100

[program:scheduler]
command=python scheduler.py
priority=200
```

### Background Jobs

The scheduler runs three types of jobs:

1. **Debt Reminder Emails** (Daily at 8:00 AM)
   - Sends email reminders for overdue supplier debts
   - Groups debts by supplier
   - Uses `debt_reminder.html` email template

2. **Reorder Alerts** (Daily at 9:00 AM)
   - Alerts for products below reorder level
   - Creates in-app notifications
   - Sends consolidated email with all low-stock products
   - Uses `reorder_alert.html` email template

3. **Notification Cleanup** (Weekly on Sunday at Midnight)
   - Deletes read notifications older than 30 days
   - Keeps unread notifications indefinitely

## Email Templates

Email templates are built from MJML sources during the Docker build process:

### Source Templates (MJML)
- `app/email-templates/src/debt_reminder.mjml`
- `app/email-templates/src/reorder_alert.mjml`
- `app/email-templates/src/low_stock_notification.mjml`
- `app/email-templates/src/new_account.mjml`
- `app/email-templates/src/reset_password.mjml`
- `app/email-templates/src/test_email.mjml`

### Built Templates (HTML)
Generated in `app/email-templates/build/` directory

### Building Templates Locally

```bash
cd backend
npx mjml app/email-templates/src/debt_reminder.mjml -o app/email-templates/build/debt_reminder.html
npx mjml app/email-templates/src/reorder_alert.mjml -o app/email-templates/build/reorder_alert.html
npx mjml app/email-templates/src/low_stock_notification.mjml -o app/email-templates/build/low_stock_notification.html
```

## Managing Supervisor

### View Process Status

```bash
docker exec -it <backend-container> supervisorctl status
```

### Restart a Process

```bash
# Restart FastAPI
docker exec -it <backend-container> supervisorctl restart fastapi

# Restart Scheduler
docker exec -it <backend-container> supervisorctl restart scheduler
```

### View Logs

```bash
# FastAPI logs
docker exec -it <backend-container> tail -f /var/log/supervisor/fastapi.log

# Scheduler logs
docker exec -it <backend-container> tail -f /var/log/supervisor/scheduler.log

# All supervisor logs (from host with volume mount)
docker logs <backend-container>
```

### Supervisor Web Interface

In development mode, the Supervisor web interface is available at:
- **URL**: http://localhost:9001
- **Note**: This is only enabled in development for monitoring

## Development Mode

### Running Without Background Jobs

To disable background jobs in development, edit `docker-compose.override.yml`:

```yaml
backend:
  command:
    - fastapi
    - run
    - --reload
    - "app/main.py"
```

### Running With Background Jobs

Use Supervisor (current default in `docker-compose.override.yml`):

```yaml
backend:
  command: /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
```

**Note**: With `--reload`, the FastAPI process will auto-restart on code changes, but you'll need to manually restart the scheduler if you change `scheduler.py` or `background_services.py`:

```bash
docker exec -it finance-tracker-backend-1 supervisorctl restart scheduler
```

## Production Deployment

In production, Supervisor automatically manages both processes:

1. **Build the image** (templates are built during Docker build)
   ```bash
   docker build -t your-registry/finance-tracker-backend:latest ./backend
   ```

2. **Deploy with docker-compose**
   ```bash
   docker-compose up -d
   ```

3. **Verify processes are running**
   ```bash
   docker exec -it <backend-container> supervisorctl status
   ```

Expected output:
```
fastapi                          RUNNING   pid 12, uptime 0:01:23
scheduler                        RUNNING   pid 13, uptime 0:01:23
```

## Logs and Monitoring

### Log Files

All logs are stored in `/var/log/supervisor/` inside the container:

- `supervisord.log` - Supervisor daemon logs
- `fastapi.log` - FastAPI application stdout
- `fastapi_error.log` - FastAPI application stderr
- `scheduler.log` - Scheduler stdout
- `scheduler_error.log` - Scheduler stderr

### Log Rotation

Logs are automatically rotated by Supervisor:
- Max size: 50MB per file
- Backups: 10 files kept

### Accessing Logs

Via Docker volumes (production):
```bash
docker volume inspect finance-tracker_supervisor-logs
```

Via Docker exec:
```bash
docker exec -it <backend-container> ls -lh /var/log/supervisor/
```

## Troubleshooting

### Scheduler Not Running

Check status:
```bash
docker exec -it <backend-container> supervisorctl status scheduler
```

View logs:
```bash
docker exec -it <backend-container> tail -100 /var/log/supervisor/scheduler_error.log
```

Restart:
```bash
docker exec -it <backend-container> supervisorctl restart scheduler
```

### Background Jobs Not Executing

1. Check scheduler logs for errors
2. Verify database connection
3. Check that admin users have email addresses configured
4. Verify SMTP settings in environment variables

### Email Templates Not Rendering

1. Ensure MJML templates were built during Docker build
2. Check that HTML files exist in `app/email-templates/build/`
3. Rebuild the Docker image if templates were updated

```bash
docker-compose build backend
docker-compose up -d backend
```

## Migration from wiseman-scheduler.service

The old systemd service (`wiseman-scheduler.service`) has been replaced by Supervisor. Key differences:

| Feature | Old (systemd) | New (Supervisor) |
|---------|---------------|------------------|
| Process Manager | systemd | Supervisor |
| Manages | Scheduler only | FastAPI + Scheduler |
| Container-native | No | Yes |
| Web Interface | No | Yes (dev mode) |
| Log Management | systemd journal | Supervisor (rotated files) |
| Restart Policy | systemd | Supervisor (automatic) |

### Migration Steps

1. **Remove old service** (if deployed on bare metal/VM):
   ```bash
   sudo systemctl stop wiseman-scheduler
   sudo systemctl disable wiseman-scheduler
   sudo rm /etc/systemd/system/wiseman-scheduler.service
   ```

2. **Deploy with Docker** using the updated configuration

3. **Verify background jobs are running** via Supervisor

## Schedule Customization

To change job schedules, edit `backend/scheduler.py`:

```python
# Debt reminders - currently 8:00 AM daily
scheduler.add_job(
    debt_reminders,
    CronTrigger(hour=8, minute=0),  # Change time here
    id='debt_reminder_job',
    name='Send debt reminder emails',
    replace_existing=True
)

# Reorder alerts - currently 9:00 AM daily
scheduler.add_job(
    reorder_alerts,
    CronTrigger(hour=9, minute=0),  # Change time here
    id='reorder_alert_job',
    name='Send reorder alerts',
    replace_existing=True
)

# Notification cleanup - currently Sunday at midnight
scheduler.add_job(
    notification_cleanup,
    CronTrigger(day_of_week='sun', hour=0, minute=0),  # Change schedule here
    id='notification_cleanup_job',
    name='Cleanup old notifications',
    replace_existing=True
)
```

After changes, restart the scheduler:
```bash
docker exec -it <backend-container> supervisorctl restart scheduler
```

## References

- [Supervisor Documentation](http://supervisord.org/)
- [APScheduler Documentation](https://apscheduler.readthedocs.io/)
- [MJML Documentation](https://mjml.io/documentation/)
