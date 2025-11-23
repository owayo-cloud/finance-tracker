#!/bin/bash
#
# Cron Job Alternative for Background Services
#
# This script can be used with system cron instead of APScheduler.
# Add to crontab with: crontab -e
#
# Example crontab entries:
# 0 8 * * * /path/to/wiseman-pub-prj/backend/scheduler_cron.sh debt_reminders >> /var/log/wiseman/scheduler.log 2>&1
# 0 9 * * * /path/to/wiseman-pub-prj/backend/scheduler_cron.sh reorder_alerts >> /var/log/wiseman/scheduler.log 2>&1
# 0 0 * * 0 /path/to/wiseman-pub-prj/backend/scheduler_cron.sh notification_cleanup >> /var/log/wiseman/scheduler.log 2>&1

# Change to script directory
cd "$(dirname "$0")" || exit 1

# Activate virtual environment (adjust path if needed)
source .venv/bin/activate

# Get job name from command line argument
JOB_NAME=$1

if [ -z "$JOB_NAME" ]; then
    echo "Usage: $0 {debt_reminders|reorder_alerts|notification_cleanup}"
    exit 1
fi

# Log start
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting job: $JOB_NAME"

# Run the job
python -m app.background_services "$JOB_NAME"

# Log completion
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Completed job: $JOB_NAME"
