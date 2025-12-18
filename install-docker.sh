#!/bin/bash
# Install Docker on Debian/Ubuntu Server
# Run this script on your server: root@173.255.249.250

set -e

echo "=== Installing Docker ==="
echo ""

# Update package index
echo "Updating package index..."
apt-get update

# Install prerequisites
echo "Installing prerequisites..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
echo "Adding Docker GPG key..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo "Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
apt-get update

# Install Docker Engine, CLI, and Docker Compose plugin
echo "Installing Docker..."
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
echo "Starting Docker service..."
systemctl start docker
systemctl enable docker

# Verify installation
echo ""
echo "=== Verifying Docker installation ==="
docker --version
docker compose version

# Test Docker
echo ""
echo "Testing Docker with hello-world..."
docker run hello-world

echo ""
echo "=== Docker installation complete! ==="
echo ""
echo "You can now use:"
echo "  docker --version"
echo "  docker compose version"
echo "  docker ps"

