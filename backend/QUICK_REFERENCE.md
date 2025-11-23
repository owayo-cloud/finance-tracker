# Quick Reference: Supervisor Commands

## Status & Monitoring

```bash
# Check process status
./backend/supervisor-ctl.sh status

# Watch scheduler logs
./backend/supervisor-ctl.sh logs scheduler

# Watch FastAPI logs
./backend/supervisor-ctl.sh logs fastapi

# Watch all logs
./backend/supervisor-ctl.sh logs all
```

## Process Control

```bash
# Restart scheduler (after code changes)
./backend/supervisor-ctl.sh restart scheduler

# Restart FastAPI
./backend/supervisor-ctl.sh restart fastapi

# Restart all processes
./backend/supervisor-ctl.sh restart all

# Stop a process
./backend/supervisor-ctl.sh stop scheduler

# Start a process
./backend/supervisor-ctl.sh start scheduler
```

## Template Management

```bash
# Rebuild all email templates from MJML
./backend/supervisor-ctl.sh build-templates

# Rebuild specific template
cd backend
npx mjml app/email-templates/src/debt_reminder.mjml -o app/email-templates/build/debt_reminder.html
```

## Manual Job Testing

```bash
# Enter container
docker exec -it finance-tracker-backend-1 bash

# Run debt reminders manually
python -m app.background_services debt_reminders

# Run reorder alerts manually
python -m app.background_services reorder_alerts

# Run notification cleanup manually
python -m app.background_services notification_cleanup
```

## Development Mode

### Enable Background Jobs
Edit `docker-compose.override.yml`:
```yaml
backend:
  command: /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
```

### Disable Background Jobs
Edit `docker-compose.override.yml`:
```yaml
backend:
  command:
    - fastapi
    - run
    - --reload
    - "app/main.py"
```

## Email Template Workflow

1. **Edit MJML source**: `backend/app/email-templates/src/*.mjml`
2. **Build HTML**: `./backend/supervisor-ctl.sh build-templates`
3. **Rebuild container**: `docker-compose build backend`
4. **Restart**: `docker-compose up -d backend`

## Supervisor Web UI (Dev Only)

Access at: http://localhost:9001

## Log Locations

Inside container: `/var/log/supervisor/`
- `fastapi.log` - FastAPI stdout
- `fastapi_error.log` - FastAPI stderr
- `scheduler.log` - Scheduler stdout
- `scheduler_error.log` - Scheduler stderr

## Container Commands

```bash
# Shell into container
docker exec -it finance-tracker-backend-1 bash

# View supervisor config
docker exec -it finance-tracker-backend-1 cat /etc/supervisor/conf.d/supervisord.conf

# Interactive supervisor control
./backend/supervisor-ctl.sh shell
```

## Troubleshooting

```bash
# Container not starting?
docker logs finance-tracker-backend-1

# Process crashed?
./backend/supervisor-ctl.sh status
./backend/supervisor-ctl.sh logs scheduler

# Email not sending?
# 1. Check SMTP env vars in .env
# 2. Check scheduler logs
# 3. Test manually: python -m app.background_services debt_reminders

# Templates not found?
docker exec -it finance-tracker-backend-1 ls -la /app/app/email-templates/build/
```

## Background Job Schedules

| Job | Frequency | Time (UTC) |
|-----|-----------|------------|
| Debt Reminders | Daily | 8:00 AM |
| Reorder Alerts | Daily | 9:00 AM |
| Notification Cleanup | Weekly | Sunday 12:00 AM |

Edit schedules in: `backend/scheduler.py`
