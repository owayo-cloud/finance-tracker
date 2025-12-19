#!/bin/bash
# SSH Connection Diagnostic Script
# Run this locally or from a machine that CAN reach the server

echo "=========================================="
echo "SSH Connection Diagnostic Tool"
echo "=========================================="
echo ""

# Get server details
read -p "Enter server IP or hostname: " SERVER_HOST
read -p "Enter SSH username (default: root): " SERVER_USER
SERVER_USER=${SERVER_USER:-root}

echo ""
echo "1. Testing basic network connectivity..."
echo "----------------------------------------"
if ping -c 3 "$SERVER_HOST" 2>/dev/null; then
    echo "✓ Server is reachable via ping"
else
    echo "✗ Cannot ping server - check IP/hostname"
    echo "  This might be normal if ICMP is blocked by firewall"
fi
echo ""

echo "2. Testing SSH port (22) connectivity..."
echo "----------------------------------------"
if command -v nc >/dev/null 2>&1; then
    if nc -zv -w 5 "$SERVER_HOST" 22 2>&1; then
        echo "✓ Port 22 is open and accepting connections"
    else
        echo "✗ Port 22 is not accessible"
        echo "  Possible causes:"
        echo "    - Firewall blocking port 22"
        echo "    - SSH service not running"
        echo "    - Server is down"
    fi
else
    echo "⚠ netcat (nc) not available, skipping port test"
    echo "  Install with: apt-get install netcat-openbsd"
fi
echo ""

echo "3. Testing SSH connection with verbose output..."
echo "----------------------------------------"
echo "Attempting SSH connection (will timeout after 10 seconds)..."
if timeout 10 ssh -v -o ConnectTimeout=10 \
    -o StrictHostKeyChecking=no \
    "${SERVER_USER}@${SERVER_HOST}" \
    "echo 'SSH connection successful!'" 2>&1 | head -30; then
    echo ""
    echo "✓ SSH connection successful!"
else
    echo ""
    echo "✗ SSH connection failed"
    echo ""
    echo "Common issues and solutions:"
    echo ""
    echo "A. Server is down or unreachable:"
    echo "   - Check server status in your hosting provider dashboard"
    echo "   - Verify server IP address is correct"
    echo ""
    echo "B. Firewall blocking SSH:"
    echo "   - Check firewall rules allow port 22"
    echo "   - For cloud providers, check Security Groups/Firewall rules"
    echo "   - For GitHub Actions, may need to whitelist GitHub IPs"
    echo ""
    echo "C. SSH service not running:"
    echo "   - If you have console access, check: systemctl status ssh"
    echo "   - Start SSH: systemctl start ssh"
    echo ""
    echo "D. Wrong IP/hostname:"
    echo "   - Verify SERVER_HOST in GitHub secrets"
    echo "   - Try using IP address instead of hostname"
    echo ""
    echo "E. GitHub Actions IP whitelisting:"
    echo "   - GitHub Actions uses dynamic IPs"
    echo "   - May need to allow all IPs or use GitHub's IP ranges"
    echo "   - See: https://api.github.com/meta"
fi
echo ""

echo "4. Checking GitHub Actions IP ranges..."
echo "----------------------------------------"
echo "GitHub Actions uses these IP ranges (may need to whitelist):"
curl -s https://api.github.com/meta | grep -E '"actions"' | head -5 || echo "Could not fetch GitHub IP ranges"
echo ""
echo "For GitHub Actions, you may need to:"
echo "  1. Allow SSH from all IPs (0.0.0.0/0) - less secure"
echo "  2. Use GitHub's webhook IPs and allow specific ranges"
echo "  3. Use a VPN or bastion host"
echo ""

echo "5. Alternative connection methods..."
echo "----------------------------------------"
echo "If direct SSH fails, consider:"
echo "  - Using server console/terminal (if available)"
echo "  - Using a VPN to access server network"
echo "  - Using a bastion/jump host"
echo "  - Checking if SSH port is different (not 22)"
echo ""

