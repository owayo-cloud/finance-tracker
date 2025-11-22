"""Add performance indexes

Revision ID: b125c8790ea0
Revises: 6a72763fceb5
Create Date: 2025-01-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'b125c8790ea0'
down_revision = '6a72763fceb5'
branch_labels = None
depends_on = None


def _index_exists(connection, index_name, table_name):
    """Check if an index exists"""
    inspector = inspect(connection)
    indexes = inspector.get_indexes(table_name)
    return any(idx['name'] == index_name for idx in indexes)


def upgrade():
    connection = op.get_bind()
    
    # Add indexes for frequently queried date fields (only if they don't exist)
    # Note: Some indexes may already exist from initial migration
    indexes_to_create = [
        ('ix_sale_sale_date', 'sale', ['sale_date']),
        ('ix_stock_entry_entry_date', 'stock_entry', ['entry_date']),
        ('ix_expense_expense_date', 'expense', ['expense_date']),
        ('ix_debt_debt_date', 'debt', ['debt_date']),
        ('ix_shift_reconciliation_shift_date', 'shift_reconciliation', ['shift_date']),
        # Composite indexes (these are new)
        ('ix_sale_product_date', 'sale', ['product_id', 'sale_date']),
        ('ix_sale_user_date', 'sale', ['created_by_id', 'sale_date']),
    ]
    
    for index_name, table_name, columns in indexes_to_create:
        if not _index_exists(connection, index_name, table_name):
            op.create_index(index_name, table_name, columns, unique=False)


def downgrade():
    connection = op.get_bind()
    
    # Remove indexes in reverse order (only if they exist)
    # Note: We only drop indexes we created, not ones from initial migration
    indexes_to_drop = [
        ('ix_sale_user_date', 'sale'),
        ('ix_sale_product_date', 'sale'),
        ('ix_shift_reconciliation_shift_date', 'shift_reconciliation'),
        ('ix_debt_debt_date', 'debt'),
        ('ix_expense_expense_date', 'expense'),
        ('ix_stock_entry_entry_date', 'stock_entry'),
        ('ix_sale_sale_date', 'sale'),
    ]
    
    for index_name, table_name in indexes_to_drop:
        if _index_exists(connection, index_name, table_name):
            op.drop_index(index_name, table_name=table_name)

