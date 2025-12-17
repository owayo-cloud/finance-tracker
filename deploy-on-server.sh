#!/bin/bash

# Deployment Script to Run ON THE SERVER
# This script is for manual execution on the server after images are transferred

set -e

APP_DIR="/root/code/finance-tracker"
BACKEND_IMAGE="wiseman-palace-backend:latest"
FRONTEND_IMAGE="wiseman-palace-frontend:latest"

echo "=========================================="
echo "Server-Side Deployment"
echo "=========================================="
echo ""

echo "Step 1: Loading images..."
echo "----------------------------------------"
if [ -f "/tmp/backend.tar" ]; then
    docker load -i /tmp/backend.tar
    echo "✓ Backend image loaded"
    rm -f /tmp/backend.tar
else
    echo "⚠ /tmp/backend.tar not found"
fi

if [ -f "/tmp/frontend.tar" ]; then
    docker load -i /tmp/frontend.tar
    echo "✓ Frontend image loaded"
    rm -f /tmp/frontend.tar
else
    echo "⚠ /tmp/frontend.tar not found"
fi
echo ""

echo "Step 2: Updating containers..."
echo "----------------------------------------"
if [ -f "${APP_DIR}/docker-compose.yml" ]; then
    cd "${APP_DIR}"
    docker compose up -d --no-build
    echo "✓ Containers updated via docker-compose"
else
    echo "⚠ docker-compose.yml not found. Restarting containers manually..."
    
    # Stop and remove old containers
    docker stop finance-tracker-backend-1 finance-tracker-frontend-1 2>/dev/null || true
    
    # Start new containers (this assumes they were started with docker-compose previously)
    # You may need to recreate them if docker-compose.yml is missing
    echo "⚠ Manual restart required. Check how containers were originally started."
fi
echo ""

echo "Step 3: Restarting supervisor processes..."
echo "----------------------------------------"
BACKEND_CONTAINER=$(docker ps -q -f name=finance-tracker-backend-1)
if [ -n "$BACKEND_CONTAINER" ]; then
    docker exec $BACKEND_CONTAINER supervisorctl restart all || true
    echo "✓ Supervisor processes restarted"
else
    echo "⚠ Backend container not found"
fi
echo ""

echo "Step 4: Verification..."
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep finance-tracker
echo ""

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Test the security fix:"
echo "  curl -I https://dashboard.wiseman-palace.co.ke/.env"
echo "  (Should return 404)"
echo ""

