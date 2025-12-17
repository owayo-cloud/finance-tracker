#!/bin/bash

# Manual Deployment Script for Finance Tracker
# This script builds images locally, saves them, and prepares them for transfer to server

set -e

echo "=========================================="
echo "Manual Deployment Preparation"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKEND_IMAGE="wiseman-palace-backend:latest"
FRONTEND_IMAGE="wiseman-palace-frontend:latest"
SERVER_USER="root"
SERVER_HOST="173.255.249.250"
SERVER_APP_DIR="/root/code/finance-tracker"

echo "Step 1: Building Backend Image..."
echo "----------------------------------------"
cd backend
docker build -t ${BACKEND_IMAGE} .
cd ..
echo -e "${GREEN}✓ Backend image built${NC}"
echo ""

echo "Step 2: Building Frontend Image (with security fix)..."
echo "----------------------------------------"
cd frontend
docker build -t ${FRONTEND_IMAGE} .
cd ..
echo -e "${GREEN}✓ Frontend image built with updated nginx.conf${NC}"
echo ""

echo "Step 3: Saving Images to Tar Files..."
echo "----------------------------------------"
docker save -o backend.tar ${BACKEND_IMAGE}
docker save -o frontend.tar ${FRONTEND_IMAGE}
echo -e "${GREEN}✓ Images saved to tar files${NC}"
echo ""

echo "Step 4: Checking File Sizes..."
echo "----------------------------------------"
ls -lh *.tar
echo ""

echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Transfer images to server:"
echo "   scp backend.tar frontend.tar ${SERVER_USER}@${SERVER_HOST}:/tmp/"
echo ""
echo "2. On the server, run the deployment commands:"
echo "   (See deploy-on-server.sh)"
echo ""
echo "Or run this command to deploy automatically:"
echo "   ./deploy-to-server.sh"
echo ""

