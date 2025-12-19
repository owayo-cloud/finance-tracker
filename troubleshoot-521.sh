#!/bin/bash
# Troubleshooting script for Cloudflare Error 521
# Run this on your server: root@173.255.249.250

echo "=========================================="
echo "Troubleshooting Error 521 - Web Server Down"
echo "=========================================="
echo ""

echo "1. Checking Docker containers status..."
echo "----------------------------------------"
docker ps -a | grep -E "finance-tracker|traefik"
echo ""

echo "2. Checking Traefik container..."
echo "----------------------------------------"
docker ps | grep traefik || echo "⚠ Traefik not running!"
echo ""

echo "3. Checking finance-tracker containers..."
echo "----------------------------------------"
cd /root/code/finance-tracker 2>/dev/null || echo "⚠ Directory not found"
docker compose ps 2>/dev/null || docker ps | grep finance-tracker
echo ""

echo "4. Checking container logs (last 30 lines)..."
echo "----------------------------------------"
echo "Frontend logs:"
docker logs finance-tracker-frontend-1 --tail=30 2>&1 | tail -10
echo ""
echo "Backend logs:"
docker logs finance-tracker-backend-1 --tail=30 2>&1 | tail -10
echo ""
echo "Traefik logs:"
docker logs traefik-public-traefik-1 --tail=30 2>&1 | tail -10 || echo "Traefik container not found"
echo ""

echo "5. Checking network connectivity..."
echo "----------------------------------------"
echo "Checking if Traefik network exists:"
docker network ls | grep traefik-public || echo "⚠ traefik-public network not found"
echo ""

echo "6. Checking if services are listening on ports..."
echo "----------------------------------------"
netstat -tlnp | grep -E ":80|:443" || ss -tlnp | grep -E ":80|:443" || echo "No processes listening on ports 80/443"
echo ""

echo "7. Testing local connectivity..."
echo "----------------------------------------"
curl -I http://localhost 2>&1 | head -5 || echo "⚠ Cannot connect to localhost:80"
echo ""

echo "=========================================="
echo "Quick Fixes to Try:"
echo "=========================================="
echo ""
echo "If containers are not running:"
echo "  cd /root/code/finance-tracker"
echo "  docker compose ps"
echo "  docker compose up -d"
echo ""
echo "If Traefik is not running:"
echo "  cd /root/code/traefik-public"
echo "  docker compose -f docker-compose.traefik.yml up -d"
echo ""
echo "If traefik-public network is missing:"
echo "  docker network create traefik-public"
echo ""

