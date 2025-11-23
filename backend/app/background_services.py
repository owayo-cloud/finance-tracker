"""
Background Services for Supplier Debts & Notifications

Scheduled jobs for:
1. Debt reminder emails (daily at 8 AM)
2. Reorder level alerts (daily at 9 AM)
3. Notification cleanup (weekly)
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlmodel import Session, select

from app import crud
from app.core.db import engine
from app.models import (
    Notification,
    Product,
    ReminderLog,
    ReminderLogCreate,
    ReminderSetting,
    Supplier,
    SupplierDebt,
    SupplierProductReorder,
    User,
)
from app.utils import (
    generate_debt_reminder_email,
    generate_reorder_alert_email,
    generate_low_stock_notification_email,
    send_email,
)


def send_debt_reminder_emails():
    """
    Send email reminders for overdue supplier debts.
    
    Runs daily at 8 AM.
    Groups debts by supplier and sends one email per supplier.
    """
    print(f"[{datetime.now()}] Running debt reminder job...")
    
    with Session(engine) as session:
        # Get all admin users with supplier_debt_alerts enabled
        admin_statement = (
            select(User)
            .where(User.role == "admin")
            .where(User.receives_supplier_debt_alerts == True)
        )
        admin_users = session.exec(admin_statement).all()
        
        if not admin_users:
            print("No admin users opted in for debt reminders")
            return
        
        # Get overdue debts
        debt_statement = (
            select(SupplierDebt)
            .where(SupplierDebt.is_overdue == True)
            .where(SupplierDebt.status != "paid")
        )
        overdue_debts = session.exec(debt_statement).all()
        
        if not overdue_debts:
            print("No overdue debts found")
            return
        
        # Group debts by supplier
        debts_by_supplier: dict[str, list[SupplierDebt]] = {}
        for debt in overdue_debts:
            supplier_id = str(debt.supplier_id)
            if supplier_id not in debts_by_supplier:
                debts_by_supplier[supplier_id] = []
            debts_by_supplier[supplier_id].append(debt)
        
        # Send emails to each admin
        for admin in admin_users:
            # Check user's reminder settings
            setting_statement = (
                select(ReminderSetting)
                .where(ReminderSetting.user_id == admin.id)
                .where(ReminderSetting.reminder_type == "supplier_debt_overdue")
                .where(ReminderSetting.is_enabled == True)
            )
            setting = session.exec(setting_statement).first()
            
            if not setting:
                continue  # User hasn't configured this reminder
            
            # Check if we should send today based on frequency
            if not should_send_today(setting):
                continue
            
            # Send email for each supplier
            for supplier_id, debts in debts_by_supplier.items():
                supplier = session.get(Supplier, supplier_id)
                if not supplier:
                    continue
                
                total_overdue = sum(debt.balance for debt in debts)
                
                # Prepare debt details for email template
                debt_details = []
                for debt in debts:
                    days_overdue = (datetime.now(timezone.utc) - debt.due_date).days
                    debt_details.append({
                        "invoice_number": debt.invoice_number or "N/A",
                        "balance": str(debt.balance),
                        "currency": debt.currency,
                        "days_overdue": days_overdue,
                    })
                
                # Generate and send email using template
                try:
                    email_data = generate_debt_reminder_email(
                        email_to=admin.email,
                        username=admin.username or admin.email,
                        supplier_name=supplier.name,
                        total_overdue=str(total_overdue),
                        currency=debts[0].currency,
                        debt_count=len(debts),
                        debts=debt_details,
                    )
                    
                    send_email(
                        email_to=admin.email,
                        subject=email_data.subject,
                        html_content=email_data.html_content,
                    )
                    
                    email_status = "sent"
                    print(f"✓ Sent reminder to {admin.email} for {supplier.name} ({len(debts)} debts)")
                except Exception as e:
                    email_status = "failed"
                    print(f"✗ Failed to send email to {admin.email}: {e}")
                
                # Create reminder log
                log = ReminderLog.model_validate(
                    ReminderLogCreate(
                        reminder_setting_id=setting.id,
                        user_id=admin.id,
                        sent_to_email=admin.email,
                        status=email_status,
                        items_included=len(debts),
                        subject_line=email_data.subject if email_status == "sent" else f"Failed: Overdue Payments - {supplier.name}",
                        extra_data={"supplier_id": supplier_id, "total_overdue": str(total_overdue)},
                    )
                )
                session.add(log)
                
                # Update setting's last_sent_at
                setting.last_sent_at = datetime.now(timezone.utc)
                setting.next_send_at = calculate_next_send(setting)
                session.add(setting)
        
        session.commit()
        print(f"Debt reminder job completed. Processed {len(debts_by_supplier)} suppliers")


def send_reorder_alerts():
    """
    Send alerts for products below reorder level.
    
    Runs daily at 9 AM.
    Groups low-stock products and sends one summary email to admin users.
    Tracks consecutive alerts and stops after max_consecutive_alerts.
    """
    print(f"[{datetime.now()}] Running reorder alert job...")
    
    with Session(engine) as session:
        # Get products with reorder alerts enabled
        product_statement = (
            select(Product)
            .where(Product.enable_reorder_alerts == True)
            .where(Product.current_stock <= Product.reorder_level)
        )
        low_stock_products = session.exec(product_statement).all()
        
        if not low_stock_products:
            print("No products below reorder level")
            return
        
        alerts_sent = 0
        alerts_skipped = 0
        products_to_alert = []
        
        for product in low_stock_products:
            # Check if we've reached max consecutive alerts
            if product.consecutive_reorder_alerts >= product.max_consecutive_alerts:
                alerts_skipped += 1
                continue
            
            # Check throttling (don't send more than once per day)
            if product.last_reorder_alert_sent:
                hours_since_last = (
                    datetime.now(timezone.utc) - product.last_reorder_alert_sent
                ).total_seconds() / 3600
                if hours_since_last < 24:
                    continue
            
            # Add to alert list
            products_to_alert.append({
                "name": product.name,
                "current_stock": product.current_stock,
                "reorder_level": product.reorder_level,
            })
            
            # Create notification for admin users
            crud.create_notification_for_admins(
                session=session,
                notification_type="reorder_alert",
                title=f"Low Stock Alert: {product.name}",
                message=f"Product '{product.name}' is below reorder level. Current: {product.current_stock}, Reorder at: {product.reorder_level}",
                priority="warning",
                link_url=f"/products/{product.id}",
                extra_data={
                    "product_id": str(product.id),
                    "current_stock": str(product.current_stock),
                    "reorder_level": str(product.reorder_level),
                },
            )
            
            # Update product alert tracking
            product.last_reorder_alert_sent = datetime.now(timezone.utc)
            product.consecutive_reorder_alerts += 1
            session.add(product)
            
            alerts_sent += 1
        
        # Send consolidated email to admin users
        if products_to_alert:
            admin_statement = select(User).where(User.role == "admin")
            admin_users = session.exec(admin_statement).all()
            
            for admin in admin_users:
                try:
                    email_data = generate_reorder_alert_email(
                        email_to=admin.email,
                        username=admin.username or admin.email,
                        products=products_to_alert,
                        product_count=len(products_to_alert),
                    )
                    
                    send_email(
                        email_to=admin.email,
                        subject=email_data.subject,
                        html_content=email_data.html_content,
                    )
                    
                    print(f"✓ Sent reorder alert to {admin.email} ({len(products_to_alert)} products)")
                except Exception as e:
                    print(f"✗ Failed to send reorder alert to {admin.email}: {e}")
        
        session.commit()
        print(f"Reorder alert job completed. Sent: {alerts_sent}, Skipped: {alerts_skipped}")


def cleanup_old_notifications():
    """
    Delete read notifications older than 30 days.
    
    Runs weekly (Sunday at midnight).
    Keeps unread notifications indefinitely.
    """
    print(f"[{datetime.now()}] Running notification cleanup job...")
    
    with Session(engine) as session:
        deleted_count = crud.delete_old_notifications(session=session, days=30)
        print(f"Notification cleanup completed. Deleted {deleted_count} old notifications")


def should_send_today(setting: ReminderSetting) -> bool:
    """
    Check if reminder should be sent today based on frequency settings.
    """
    if not setting.last_sent_at:
        return True  # Never sent, send now
    
    now = datetime.now(timezone.utc)
    hours_since_last = (now - setting.last_sent_at).total_seconds() / 3600
    
    if setting.frequency == "daily":
        return hours_since_last >= 24
    elif setting.frequency == "weekly":
        return hours_since_last >= (24 * 7)
    elif setting.frequency == "monthly":
        return hours_since_last >= (24 * 30)
    
    return False


def calculate_next_send(setting: ReminderSetting) -> datetime:
    """
    Calculate next send time based on frequency.
    """
    now = datetime.now(timezone.utc)
    
    if setting.frequency == "daily":
        return now + timedelta(days=1)
    elif setting.frequency == "weekly":
        return now + timedelta(weeks=1)
    elif setting.frequency == "monthly":
        return now + timedelta(days=30)
    
    return now + timedelta(days=1)


# Scheduler configuration for production
# This would be called by a task scheduler like Celery, APScheduler, or cron

def run_scheduled_jobs():
    """
    Main entry point for scheduled jobs.
    
    In production, configure your scheduler to call specific functions:
    - send_debt_reminder_emails() - Daily at 8:00 AM
    - send_reorder_alerts() - Daily at 9:00 AM
    - cleanup_old_notifications() - Weekly on Sunday at midnight
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m app.background_services <job_name>")
        print("Available jobs:")
        print("  - debt_reminders")
        print("  - reorder_alerts")
        print("  - notification_cleanup")
        return
    
    job_name = sys.argv[1]
    
    if job_name == "debt_reminders":
        send_debt_reminder_emails()
    elif job_name == "reorder_alerts":
        send_reorder_alerts()
    elif job_name == "notification_cleanup":
        cleanup_old_notifications()
    else:
        print(f"Unknown job: {job_name}")


if __name__ == "__main__":
    run_scheduled_jobs()
