#! /usr/bin/env bash

set -e
set -x

# Ensure we're using the virtual environment Python
export PATH="/app/.venv/bin:$PATH"
export PYTHONPATH="/app"

# Verify Python can import the app module
python -c "import app.core.db; print('✅ App module can be imported')" || {
    echo "❌ Failed to import app module. Checking Python path..."
    python -c "import sys; print('Python path:', sys.path)"
    exit 1
}

# Let the DB start
python app/backend_pre_start.py

# Run migrations
alembic upgrade head

# Create initial data in DB
python app/initial_data.py
