#!/bin/bash
# Server Cleanup Script for Linode
# This script will remove all Docker containers, volumes, networks, and project files
# WARNING: This will delete all data including databases!

set -e

SERVER_IP="173.255.249.250"
SERVER_USER="root"

echo "=========================================="
echo "Server Cleanup Script"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This script will DELETE:"
echo "   - All Docker containers"
echo "   - All Docker volumes (including databases!)"
echo "   - All Docker networks (except default)"
echo "   - All project files in /root/code/"
echo "   - All Docker images (optional)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Connecting to server..."
echo "=========================================="

# SSH into server and run cleanup commands
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo ""
echo "Step 1: Stopping all running containers..."
echo "----------------------------------------"
docker ps -q | xargs -r docker stop || echo "No running containers to stop"

echo ""
echo "Step 2: Removing all containers..."
echo "----------------------------------------"
docker ps -aq | xargs -r docker rm -f || echo "No containers to remove"

echo ""
echo "Step 3: Removing all Docker volumes..."
echo "----------------------------------------"
docker volume ls -q | xargs -r docker volume rm -f || echo "No volumes to remove"

echo ""
echo "Step 4: Removing custom Docker networks..."
echo "----------------------------------------"
# Remove traefik-public network if it exists
docker network rm traefik-public 2>/dev/null || echo "traefik-public network not found or already removed"

# List and remove other custom networks (except default Docker networks)
docker network ls --format "{{.Name}}" | grep -vE "^bridge$|^host$|^none$" | while read network; do
    docker network rm "$network" 2>/dev/null || echo "Could not remove network: $network"
done

echo ""
echo "Step 5: Removing project directories..."
echo "----------------------------------------"
if [ -d "/root/code/finance-tracker" ]; then
    echo "Removing /root/code/finance-tracker..."
    rm -rf /root/code/finance-tracker
    echo "✓ Removed finance-tracker directory"
else
    echo "finance-tracker directory not found"
fi

if [ -d "/root/code/traefik-public" ]; then
    echo "Removing /root/code/traefik-public..."
    rm -rf /root/code/traefik-public
    echo "✓ Removed traefik-public directory"
else
    echo "traefik-public directory not found"
fi

# Remove entire /root/code directory if empty
if [ -d "/root/code" ] && [ -z "$(ls -A /root/code)" ]; then
    rmdir /root/code
    echo "✓ Removed empty /root/code directory"
fi

echo ""
echo "Step 6: Cleaning up Docker system..."
echo "----------------------------------------"
docker system prune -f || echo "Docker system prune completed"

echo ""
echo "Step 7: Verifying cleanup..."
echo "----------------------------------------"
echo "Remaining containers:"
docker ps -a
echo ""
echo "Remaining volumes:"
docker volume ls
echo ""
echo "Remaining networks:"
docker network ls
echo ""
echo "Disk usage:"
df -h / | tail -1

echo ""
echo "=========================================="
echo "Cleanup completed!"
echo "=========================================="
echo ""
echo "The server is now clean and ready for a fresh deployment."
echo ""
echo "Next steps:"
echo "1. Set up Cloudflare DNS (see CLOUDFLARE_DNS_SETUP.md)"
echo "2. Deploy Traefik (see PRODUCTION_DEPLOYMENT.md Step 4)"
echo "3. Deploy application (see PRODUCTION_DEPLOYMENT.md Step 5-6)"
echo ""

ENDSSH

echo ""
echo "=========================================="
echo "Server cleanup completed successfully!"
echo "=========================================="

