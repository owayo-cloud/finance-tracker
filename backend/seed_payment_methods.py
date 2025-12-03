#!/usr/bin/env python3
"""
Standalone script to seed payment methods.
Run this from the backend directory: python seed_payment_methods.py
"""
import os
import sys

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging

from sqlmodel import Session, select

from app.core.db import engine
from app.models import PaymentMethod

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_payment_methods():
    """Seed payment methods if they don't exist"""
    payment_methods = [
        {"name": "POS Cash Acc", "description": "Cash payments at point of sale", "is_active": True},
        {"name": "POS Mpesa", "description": "M-Pesa mobile money payments", "is_active": True},
        {"name": "POS KCB PAYBILL", "description": "KCB Bank paybill payments", "is_active": True},
        {"name": "POS Equity PAYBILL", "description": "Equity Bank paybill payments", "is_active": True},
        {"name": "Credit Note", "description": "Credit note payments", "is_active": True},
    ]

    with Session(engine) as session:
        for pm_data in payment_methods:
            statement = select(PaymentMethod).where(
                PaymentMethod.name == pm_data["name"]
            )
            existing_pm = session.exec(statement).first()

            if not existing_pm:
                payment_method = PaymentMethod(**pm_data)
                session.add(payment_method)
                logger.info(f"✓ Created payment method: {pm_data['name']}")
            else:
                logger.info(f"⊘ Payment method already exists: {pm_data['name']}")

        session.commit()
        logger.info("✅ Payment methods seeding complete!")


if __name__ == "__main__":
    logger.info("Starting payment methods seeding...")
    seed_payment_methods()

