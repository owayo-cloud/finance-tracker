#!/bin/bash
# Script to fix Traefik configuration on server

SERVER_IP="173.255.249.250"
SERVER_USER="root"

echo "Copying fixed docker-compose.traefik.yml to server..."
scp docker-compose.traefik.yml ${SERVER_USER}@${SERVER_IP}:/root/code/traefik-public/

echo ""
echo "Connecting to server to restart Traefik..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/code/traefik-public

echo "Stopping Traefik container..."
docker compose -f docker-compose.traefik.yml down

echo "Starting Traefik with fixed configuration..."
docker compose -f docker-compose.traefik.yml up -d

echo "Waiting 5 seconds for container to start..."
sleep 5

echo "Checking Traefik status..."
docker ps | grep traefik

echo ""
echo "Checking Traefik logs..."
docker logs traefik-public-traefik-1 --tail=20

ENDSSH

echo ""
echo "Done! Check the logs above to verify Traefik is running correctly."

