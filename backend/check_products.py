from app.core.db import engine
from sqlalchemy.orm import Session
from sqlalchemy import text

session = Session(engine)
try:
    # Check categories
    result = session.execute(text('SELECT name FROM product_category'))
    categories = result.fetchall()
    print('Categories:', [r[0] for r in categories])
    
    # Check statuses  
    result = session.execute(text('SELECT name FROM product_status'))
    statuses = result.fetchall()
    print('Statuses:', [r[0] for r in statuses])
    
    # Check products
    result = session.execute(text('SELECT COUNT(*) FROM product'))
    product_count = result.fetchone()
    print('Products count:', product_count[0])
    
except Exception as e:
    print('Error:', e)
finally:
    session.close()