#!/bin/bash
# Restart Traefik after Docker update
# Run this ON THE SERVER

echo "=========================================="
echo "Restarting Traefik with Updated Docker"
echo "=========================================="
echo ""

cd /root/code/traefik-public

# Set environment variables
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com

echo "Environment variables set"
echo ""

echo "Step 1: Stopping Traefik..."
docker compose -f docker-compose.traefik.yml down

echo ""
echo "Step 2: Starting Traefik..."
docker compose -f docker-compose.traefik.yml up -d

echo ""
echo "Step 3: Waiting for Traefik to start..."
sleep 5

echo ""
echo "Step 4: Checking Traefik status..."
docker ps | grep traefik

echo ""
echo "Step 5: Checking Traefik logs..."
docker logs traefik-public-traefik-1 --tail=30

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "If you see Docker API version errors, they should be gone now."
echo "Traefik should successfully connect to Docker daemon."

