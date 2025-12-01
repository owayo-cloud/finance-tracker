"""promote_tags_to_categories_and_remove_tags

Revision ID: a1b2c3d4e5f6
Revises: 9fd90704b796
Create Date: 2025-11-17 10:00:00.000000

"""
import uuid

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9fd90704b796'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    This migration:
    1. Creates new product categories based on the old tag system
    2. Migrates existing products from tags to categories
    3. Removes the tag_id column from products
    4. Drops the product_tag table
    """
    
    # Step 1: Insert new categories (these were previously tags)
    # Get a connection to execute raw SQL
    connection = op.get_bind()
    
    new_categories = [
        ('Whisky', 'Whisky and whiskey products'),
        ('Vodka', 'Vodka products'),
        ('Wine', 'Wine products'),
        ('Champagne', 'Champagne and sparkling wines'),
        ('Cognac & Brandy', 'Cognac and brandy products'),
        ('Beers', 'Beer products'),
        ('Ciders', 'Cider products'),
        ('Beers-infusions', 'Beer infusions and flavored beers'),
        ('Tequila', 'Tequila products'),
        ('Rum', 'Rum products'),
        ('Gin', 'Gin products'),
        ('Soft-Drinks', 'Non-alcoholic beverages'),
        ('Smokes', 'Tobacco products'),
    ]
    
    # Create a mapping of old tag names to new category IDs
    tag_to_category_map = {}
    
    for category_name, description in new_categories:
        category_id = str(uuid.uuid4())
        tag_to_category_map[category_name] = category_id
        
        connection.execute(
            sa.text(
                "INSERT INTO product_category (id, name, description, created_at, updated_at) "
                "VALUES (:id, :name, :description, NOW(), NOW())"
            ),
            {"id": category_id, "name": category_name, "description": description}
        )
    
    # Step 2: Migrate products from tags to categories
    # First, get all existing tags and their products
    tags_result = connection.execute(
        sa.text("SELECT id, name FROM product_tag")
    )
    
    for tag_row in tags_result:
        tag_id = tag_row[0]
        tag_name = tag_row[1]
        
        # Find matching category ID (case-insensitive match)
        matching_category_id = None
        for category_name, cat_id in tag_to_category_map.items():
            if category_name.lower() == tag_name.lower() or \
               category_name.lower().replace(' ', '-') == tag_name.lower().replace(' ', '-'):
                matching_category_id = cat_id
                break
        
        # If we found a matching category, update products
        if matching_category_id:
            connection.execute(
                sa.text(
                    "UPDATE product SET category_id = :category_id "
                    "WHERE tag_id = :tag_id"
                ),
                {"category_id": matching_category_id, "tag_id": str(tag_id)}
            )
        else:
            # If no match found, products will keep their existing category
            pass

    # Step 3: Remove the tag_id foreign key constraint and column
    op.drop_constraint('product_tag_id_fkey', 'product', type_='foreignkey')
    op.drop_column('product', 'tag_id')
    
    # Step 4: Drop the product_tag table
    op.drop_index('ix_product_tag_name', table_name='product_tag')
    op.drop_table('product_tag')


def downgrade() -> None:
    """
    Downgrade is complex because we're merging data.
    This creates the tag table back but doesn't restore the original tag associations.
    """
    
    # Recreate product_tag table
    op.create_table('product_tag',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_product_tag_name', 'product_tag', ['name'], unique=True)
    
    # Add tag_id column back to product
    op.add_column('product', sa.Column('tag_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('product_tag_id_fkey', 'product', 'product_tag', ['tag_id'], ['id'])

    # Note: We cannot fully restore the original tag associations
    # as products now reference categories that were created from tags
