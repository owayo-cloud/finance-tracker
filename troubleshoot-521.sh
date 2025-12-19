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
TRAEFIK_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i traefik | head -1)
if [ -z "$TRAEFIK_CONTAINER" ]; then
    echo "⚠ Traefik not running!"
    echo "   Checking stopped containers:"
    docker ps -a | grep -i traefik || echo "   No Traefik containers found"
else
    echo "✓ Traefik container found: $TRAEFIK_CONTAINER"
    echo "   Container status:"
    docker ps --filter "name=$TRAEFIK_CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo "   Checking if Traefik is listening on ports 80/443:"
    docker port "$TRAEFIK_CONTAINER" 2>/dev/null | grep -E "80|443" || echo "   ⚠ Ports 80/443 not mapped"
fi
echo ""

echo "3. Checking finance-tracker containers..."
echo "----------------------------------------"
PROJECT_DIR="/root/code/finance-tracker"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "⚠ Directory $PROJECT_DIR not found"
    PROJECT_DIR=""
else
    cd "$PROJECT_DIR" || PROJECT_DIR=""
fi

if [ -n "$PROJECT_DIR" ]; then
    echo "   Full container status:"
    docker compose ps 2>/dev/null || docker ps | grep finance-tracker
    echo ""
    echo "   Checking frontend container specifically:"
    docker ps --filter "name=frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "   ⚠ Frontend container not running"
    echo ""
    echo "   Checking backend container specifically:"
    docker ps --filter "name=backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "   ⚠ Backend container not running"
else
    docker ps | grep finance-tracker || echo "   ⚠ Cannot check containers - project directory not found"
fi
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
if docker network ls | grep -q traefik-public; then
    echo "✓ traefik-public network exists"
    echo "   Network details:"
    docker network inspect traefik-public --format "{{.Name}}: {{.Driver}}" 2>/dev/null || echo "   ⚠ Cannot inspect network"
    echo ""
    echo "   Containers connected to traefik-public network:"
    docker network inspect traefik-public --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | tr ' ' '\n' | grep -v '^$' || echo "   ⚠ No containers connected"
    echo ""
    if [ -n "$TRAEFIK_CONTAINER" ]; then
        echo "   Checking if Traefik is connected to traefik-public:"
        docker network inspect traefik-public --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -q "$TRAEFIK_CONTAINER" && echo "   ✓ Traefik is connected" || echo "   ⚠ Traefik is NOT connected to traefik-public network!"
    fi
    if [ -n "$PROJECT_DIR" ]; then
        FRONTEND_CONTAINER=$(docker ps --format "{{.Names}}" | grep frontend | head -1)
        if [ -n "$FRONTEND_CONTAINER" ]; then
            echo "   Checking if frontend is connected to traefik-public:"
            docker network inspect traefik-public --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -q "$FRONTEND_CONTAINER" && echo "   ✓ Frontend is connected" || echo "   ⚠ Frontend is NOT connected to traefik-public network!"
        fi
    fi
else
    echo "⚠ traefik-public network not found"
    echo "   This is critical - Traefik and services need this network to communicate"
fi
echo ""

echo "6. Checking if services are listening on ports..."
echo "----------------------------------------"
netstat -tlnp | grep -E ":80|:443" || ss -tlnp | grep -E ":80|:443" || echo "No processes listening on ports 80/443"
echo ""

echo "7. Testing local connectivity..."
echo "----------------------------------------"
echo "Testing HTTP (port 80):"
HTTP_TEST=$(curl -I http://localhost 2>&1 | head -5)
if echo "$HTTP_TEST" | grep -q "HTTP"; then
    echo "$HTTP_TEST"
else
    echo "⚠ Cannot connect to localhost:80"
    echo "   Error: $HTTP_TEST"
fi
echo ""
echo "Testing HTTPS (port 443):"
HTTPS_TEST=$(curl -Ik https://localhost 2>&1 | head -5)
if echo "$HTTPS_TEST" | grep -q "HTTP"; then
    echo "$HTTPS_TEST"
else
    echo "⚠ Cannot connect to localhost:443 (this may be normal if cert validation fails)"
    echo "   Error: $(echo "$HTTPS_TEST" | head -1)"
fi
echo ""
echo "8. Checking Traefik routing configuration..."
echo "----------------------------------------"
if [ -n "$TRAEFIK_CONTAINER" ]; then
    echo "   Checking Traefik API for registered routers:"
    TRAEFIK_API=$(docker port "$TRAEFIK_CONTAINER" 2>/dev/null | grep 8080 | awk '{print $3}' | cut -d: -f1)
    if [ -n "$TRAEFIK_API" ]; then
        curl -s "http://localhost:$TRAEFIK_API/api/http/routers" 2>/dev/null | grep -o '"name":"[^"]*"' | head -10 || echo "   ⚠ Cannot query Traefik API"
    else
        echo "   ⚠ Cannot determine Traefik API port"
    fi
else
    echo "   ⚠ Cannot check routing - Traefik not running"
fi
echo ""

echo "=========================================="
echo "Quick Fixes to Try:"
echo "=========================================="
echo ""
echo "1. If traefik-public network is missing:"
echo "   docker network create traefik-public"
echo ""
echo "2. If Traefik is not running:"
echo "   cd /root/code/traefik-public"
echo "   # Make sure .env file exists with DOMAIN, EMAIL, USERNAME, HASHED_PASSWORD"
echo "   docker compose -f docker-compose.traefik.yml up -d"
echo "   # Check logs:"
echo "   docker logs traefik-public-traefik-1"
echo ""
echo "3. If finance-tracker containers are not running:"
echo "   cd /root/code/finance-tracker"
echo "   docker compose ps"
echo "   docker compose up -d"
echo "   # Check logs:"
echo "   docker logs finance-tracker-frontend-1"
echo "   docker logs finance-tracker-backend-1"
echo ""
echo "4. If containers are running but not connected to network:"
echo "   # Connect Traefik to network:"
echo "   docker network connect traefik-public traefik-public-traefik-1"
echo "   # Connect frontend to network:"
echo "   docker network connect traefik-public finance-tracker-frontend-1"
echo "   docker network connect traefik-public finance-tracker-backend-1"
echo ""
echo "5. Verify Cloudflare DNS settings:"
echo "   - dashboard.wiseman-palace.co.ke should point to your server IP"
echo "   - Cloudflare proxy should be enabled (orange cloud)"
echo "   - SSL/TLS mode should be 'Full' or 'Full (strict)'"
echo ""
echo "6. Check firewall/iptables:"
echo "   sudo iptables -L -n | grep -E '80|443'"
echo "   sudo ufw status"
echo ""

