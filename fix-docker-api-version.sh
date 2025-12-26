#!/bin/bash
# Script to fix Docker API version compatibility issue
# Run this ON THE SERVER

echo "=========================================="
echo "Fixing Docker API Version Compatibility"
echo "=========================================="
echo ""

echo "Step 1: Checking Docker version..."
docker --version
docker compose version

echo ""
echo "Step 2: Checking Docker daemon API version..."
docker version

echo ""
echo "Step 3: Checking if Docker needs to be updated..."
# Check if we need to update Docker
DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
echo "Current Docker version: $DOCKER_VERSION"

echo ""
echo "If Docker is outdated, updating Docker..."
echo "This will install/update Docker to the latest version..."

# Update package list
apt-get update

# Install/upgrade Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin if not installed
apt-get install -y docker-compose-plugin

echo ""
echo "Step 4: Restarting Docker daemon..."
systemctl restart docker

echo ""
echo "Step 5: Verifying Docker is working..."
docker ps

echo ""
echo "Step 6: Restarting Traefik..."
cd /root/code/traefik-public
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com

docker compose -f docker-compose.traefik.yml down
docker compose -f docker-compose.traefik.yml up -d

echo ""
echo "Step 7: Waiting for Traefik to start..."
sleep 5

echo ""
echo "Step 8: Checking Traefik logs..."
docker logs traefik-public-traefik-1 --tail=20

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="

