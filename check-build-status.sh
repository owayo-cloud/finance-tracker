#!/bin/bash
# Quick script to check Docker build status and diagnose issues

echo "=== Docker Build Status Check ==="
echo "Time: $(date)"
echo ""

echo "1. Checking Docker processes..."
echo "----------------------------------------"
ps aux | grep -E "docker.*build|docker.*compose" | grep -v grep || echo "No active build processes found"
echo ""

echo "2. Checking Docker containers..."
echo "----------------------------------------"
docker ps -a | head -20
echo ""

echo "3. Checking Docker system resources..."
echo "----------------------------------------"
docker system df
echo ""

echo "4. Checking disk space..."
echo "----------------------------------------"
df -h / | tail -1
echo ""

echo "5. Checking recent Docker logs..."
echo "----------------------------------------"
if [ -f /tmp/docker-build.log ]; then
    echo "Build log found. Last 50 lines:"
    tail -50 /tmp/docker-build.log
else
    echo "No build log found at /tmp/docker-build.log"
    echo "Checking for other build logs:"
    ls -lth /tmp/docker-build*.log 2>/dev/null | head -5 || echo "No build logs found"
fi
echo ""

echo "6. Checking Docker build cache..."
echo "----------------------------------------"
docker builder du 2>/dev/null || echo "Cannot check build cache"
echo ""

echo "=== Recommendations ==="
echo ""
echo "If build is stuck, you can:"
echo "1. Check the build log: tail -f /tmp/docker-build*.log"
echo "2. Kill stuck processes: pkill -f 'docker.*build'"
echo "3. Clean up Docker: docker system prune -f"
echo "4. Retry build with fixed command:"
echo "   docker compose --progress=plain -f docker-compose.yml build"
echo ""

