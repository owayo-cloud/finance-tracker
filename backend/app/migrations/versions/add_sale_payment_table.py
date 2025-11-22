"""Add sale_payment table for multiple payment methods

Revision ID: add_sale_payment
Revises: add_username_auditor
Create Date: 2025-11-22 07:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_sale_payment'
down_revision = 'add_username_auditor'
branch_labels = None
depends_on = None


def upgrade():
    # Create sale_payment table
    op.create_table('sale_payment',
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payment_method_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(scale=2), nullable=False),
        sa.Column('reference_number', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['sale_id'], ['sale.id'], ),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_method.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    # Add index on sale_id for faster lookups
    op.create_index('ix_sale_payment_sale_id', 'sale_payment', ['sale_id'], unique=False)


def downgrade():
    # Drop index
    op.drop_index('ix_sale_payment_sale_id', table_name='sale_payment')
    # Drop table
    op.drop_table('sale_payment')

