#!/bin/bash
# Script to fix Traefik on the server
# Run this script ON THE SERVER (after copying the fixed docker-compose.traefik.yml)

echo "=========================================="
echo "Fixing Traefik Configuration"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.traefik.yml" ]; then
    echo "Error: docker-compose.traefik.yml not found in current directory"
    echo "Please run this script from /root/code/traefik-public/"
    exit 1
fi

# Set environment variables (use the values from PRODUCTION_DEPLOYMENT.md)
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com

echo "Environment variables set:"
echo "  DOMAIN: $DOMAIN"
echo "  USERNAME: $USERNAME"
echo "  EMAIL: $EMAIL"
echo ""

# Stop the current Traefik container
echo "Step 1: Stopping Traefik container..."
docker compose -f docker-compose.traefik.yml down

# Wait a moment
sleep 2

# Start Traefik with the fixed configuration
echo ""
echo "Step 2: Starting Traefik with fixed configuration..."
docker compose -f docker-compose.traefik.yml up -d

# Wait for container to start
echo ""
echo "Step 3: Waiting for Traefik to start..."
sleep 5

# Check status
echo ""
echo "Step 4: Checking Traefik status..."
docker ps | grep traefik

# Check logs
echo ""
echo "Step 5: Recent Traefik logs (last 10 lines)..."
docker logs traefik-public-traefik-1 --tail=10

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "If you see errors, check the full logs with:"
echo "  docker logs traefik-public-traefik-1"
echo ""

