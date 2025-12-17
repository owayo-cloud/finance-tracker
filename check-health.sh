#!/bin/bash

echo "=========================================="
echo "Container Health Check"
echo "=========================================="
echo ""

echo "1. Container Status:"
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
echo ""

echo "2. Backend Supervisor Status:"
echo "----------------------------------------"
docker exec finance-tracker-backend-1 supervisorctl status 2>/dev/null || echo "Could not check supervisor status"
echo ""

echo "3. Backend Health Check:"
echo "----------------------------------------"
docker exec finance-tracker-backend-1 curl -s http://localhost:8000/api/v1/utils/health-check/ || echo "Health check failed"
echo ""

echo "4. Recent Backend Logs (last 30 lines):"
echo "----------------------------------------"
docker logs --tail=30 finance-tracker-backend-1
echo ""

echo "5. Recent Frontend Logs (last 20 lines):"
echo "----------------------------------------"
docker logs --tail=20 finance-tracker-frontend-1
echo ""

echo "6. Resource Usage:"
echo "----------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

echo "7. Disk Space:"
echo "----------------------------------------"
df -h | head -5
echo ""

echo "8. Docker Disk Usage:"
echo "----------------------------------------"
docker system df
echo ""

