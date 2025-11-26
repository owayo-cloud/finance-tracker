#!/bin/bash
# SSH Key Setup for GitHub Actions Deployment
# Run this script on your production server (root@173.255.249.250)

set -e

echo "=== Setting up SSH key for GitHub Actions ==="
echo ""

# Step 1: Generate SSH key pair
echo "Step 1: Generating SSH key pair..."
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N "" -q

echo "✓ SSH key generated"
echo ""

# Step 2: Add public key to authorized_keys
echo "Step 2: Adding public key to authorized_keys..."
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

echo "✓ Public key added to authorized_keys"
echo ""

# Step 3: Display the private key
echo "=========================================="
echo "COPY THE PRIVATE KEY BELOW TO GITHUB SECRET"
echo "=========================================="
echo ""
cat ~/.ssh/github_actions_deploy
echo ""
echo "=========================================="
echo "END OF PRIVATE KEY"
echo "=========================================="
echo ""

echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy the private key above (between the === markers)"
echo "2. Go to GitHub: Settings → Secrets and variables → Actions"
echo "3. Create/Update secret: SSH_PRIVATE_KEY"
echo "4. Make sure these secrets exist:"
echo "   - SERVER_USER = 'root'"
echo "   - SERVER_HOST = '173.255.249.250'"

