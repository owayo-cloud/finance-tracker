#!/bin/bash

# Deploy Images to Server
# Run this after building images locally

set -e

SERVER_USER="root"
SERVER_HOST="173.255.249.250"
SERVER_APP_DIR="/root/code/finance-tracker"
BACKEND_IMAGE="wiseman-palace-backend:latest"
FRONTEND_IMAGE="wiseman-palace-frontend:latest"

echo "=========================================="
echo "Deploying to Server"
echo "=========================================="
echo ""

# Check if tar files exist
if [ ! -f "backend.tar" ] || [ ! -f "frontend.tar" ]; then
    echo "Error: backend.tar or frontend.tar not found!"
    echo "Please run ./manual-deploy.sh first to build and save images"
    exit 1
fi

echo "Step 1: Transferring images to server..."
echo "----------------------------------------"
scp backend.tar frontend.tar ${SERVER_USER}@${SERVER_HOST}:/tmp/
echo "✓ Images transferred"
echo ""

echo "Step 2: Deploying on server..."
echo "----------------------------------------"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
set -e

APP_DIR="/root/code/finance-tracker"
BACKEND_IMAGE="wiseman-palace-backend:latest"
FRONTEND_IMAGE="wiseman-palace-frontend:latest"

echo "Loading backend image..."
docker load -i /tmp/backend.tar
echo "✓ Backend image loaded"

echo "Loading frontend image..."
docker load -i /tmp/frontend.tar
echo "✓ Frontend image loaded"

# Clean up tar files
rm -f /tmp/backend.tar /tmp/frontend.tar

# Check if docker-compose.yml exists
if [ ! -f "${APP_DIR}/docker-compose.yml" ]; then
    echo "Warning: docker-compose.yml not found at ${APP_DIR}"
    echo "Containers may need to be restarted manually"
    echo ""
    echo "To restart containers manually:"
    echo "  docker stop finance-tracker-backend-1 finance-tracker-frontend-1"
    echo "  docker start finance-tracker-backend-1 finance-tracker-frontend-1"
    exit 0
fi

cd "${APP_DIR}"

# Update containers using docker-compose
echo "Updating containers..."
docker compose up -d --no-build

# Restart supervisor in backend
echo "Restarting supervisor processes..."
BACKEND_CONTAINER=$(docker compose ps -q backend)
if [ -n "$BACKEND_CONTAINER" ]; then
    docker exec $BACKEND_CONTAINER supervisorctl restart all || true
    echo "✓ Supervisor restarted"
fi

echo ""
echo "Deployment complete!"
echo ""
echo "Container status:"
docker compose ps

ENDSSH

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Verify the deployment:"
echo "  ssh ${SERVER_USER}@${SERVER_HOST} 'docker ps'"
echo "  curl -I https://dashboard.wiseman-palace.co.ke/.env"
echo "  (Should return 404 now)"
echo ""

