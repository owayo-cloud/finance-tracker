"""
Background Job Scheduler Configuration

Sets up APScheduler to run background services at specified intervals.
This handles automated email reminders, reorder alerts, and notification cleanup.

Production Deployment:
1. Install APScheduler: pip install apscheduler
2. Run this script as a service: python scheduler.py
3. Monitor logs in logs/scheduler.log
4. Alternatively, use system cron jobs (see scheduler_cron.sh)
"""

import logging
import sys
from datetime import datetime
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.background_services import (
    cleanup_old_notifications,
    send_debt_reminder_emails,
    send_reorder_alerts,
)

# Configure logging - use stdout/stderr which supervisor captures
# Supervisor already logs to /var/log/supervisor/scheduler.log
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger(__name__)


def job_wrapper(job_name: str, job_func):
    """Wrapper to log job execution"""
    def wrapper():
        logger.info(f"Starting job: {job_name}")
        try:
            job_func()
            logger.info(f"Completed job: {job_name}")
        except Exception as e:
            logger.error(f"Error in job {job_name}: {str(e)}", exc_info=True)

    return wrapper


def main():
    """Initialize and start the scheduler"""
    # Initialize scheduler
    scheduler = BlockingScheduler(timezone="Africa/Nairobi")  # Adjust timezone as needed

    logger.info("Initializing background job scheduler...")

    # Job 1: Send Debt Reminder Emails
    # Runs daily at 8:00 AM
    scheduler.add_job(
        job_wrapper("debt_reminder_emails", send_debt_reminder_emails),
        trigger=CronTrigger(hour=8, minute=0),
        id="debt_reminder_emails",
        name="Send Debt Reminder Emails",
        replace_existing=True,
    )
    logger.info("✓ Scheduled: Debt Reminder Emails (Daily at 8:00 AM)")

    # Job 2: Send Reorder Alerts
    # Runs daily at 9:00 AM
    scheduler.add_job(
        job_wrapper("reorder_alerts", send_reorder_alerts),
        trigger=CronTrigger(hour=9, minute=0),
        id="reorder_alerts",
        name="Send Reorder Level Alerts",
        replace_existing=True,
    )
    logger.info("✓ Scheduled: Reorder Alerts (Daily at 9:00 AM)")

    # Job 3: Cleanup Old Notifications
    # Runs weekly on Sunday at midnight
    scheduler.add_job(
        job_wrapper("notification_cleanup", cleanup_old_notifications),
        trigger=CronTrigger(day_of_week="sun", hour=0, minute=0),
        id="notification_cleanup",
        name="Cleanup Old Notifications",
        replace_existing=True,
    )
    logger.info("✓ Scheduled: Notification Cleanup (Weekly on Sunday at 12:00 AM)")

    # Optional: Run jobs immediately on startup (for testing)
    # Uncomment the lines below to test jobs when starting the scheduler
    # logger.info("Running initial jobs...")
    # send_reorder_alerts()
    # logger.info("Initial jobs completed")

    logger.info("=" * 60)
    logger.info("Background Job Scheduler Started Successfully")
    logger.info(f"Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("Waiting for scheduled jobs...")
    logger.info("=" * 60)

    # Print next run times
    for job in scheduler.get_jobs():
        next_run = job.next_run_time if hasattr(job, 'next_run_time') else "Not scheduled yet"
        logger.info(f"Next run: {job.name} at {next_run}")

    try:
        # Start the scheduler (blocking)
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler shutdown requested")
        scheduler.shutdown()
        logger.info("Scheduler stopped")


if __name__ == "__main__":
    main()
