"""Add username and auditor role

Revision ID: add_username_auditor
Revises: b125c8790ea0
Create Date: 2025-01-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'add_username_auditor'
down_revision = 'b125c8790ea0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add username column (nullable initially, then we can make it unique after data migration if needed)
    op.add_column('user', sa.Column('username', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.create_index(op.f('ix_user_username'), 'user', ['username'], unique=True)
    
    # Add is_auditor column
    op.add_column('user', sa.Column('is_auditor', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove is_auditor column
    op.drop_column('user', 'is_auditor')
    
    # Remove username index and column
    op.drop_index(op.f('ix_user_username'), table_name='user')
    op.drop_column('user', 'username')

