# Manual Fix for Traefik - Step by Step

## Step 1: Copy Fixed File from Local to Server

**From your local machine (Windows PowerShell or WSL):**

```powershell
# PowerShell
scp docker-compose.traefik.yml root@173.255.249.250:/root/code/traefik-public/

# Or from WSL
wsl scp docker-compose.traefik.yml root@173.255.249.250:/root/code/traefik-public/
```

## Step 2: SSH into Server

```bash
ssh root@173.255.249.250
```

## Step 3: Navigate to Traefik Directory

```bash
cd /root/code/traefik-public
```

## Step 4: Verify the File Was Copied

```bash
# Check if the HTTP/2 line is removed (should return nothing)
grep "http2.enabled" docker-compose.traefik.yml

# If it returns a line, the old file is still there - copy again from local
```

## Step 5: Set Environment Variables

```bash
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com

# Verify they're set
echo "DOMAIN: $DOMAIN"
echo "EMAIL: $EMAIL"
```

## Step 6: Stop Traefik

```bash
docker compose -f docker-compose.traefik.yml down
```

## Step 7: Start Traefik with Fixed Config

```bash
docker compose -f docker-compose.traefik.yml up -d
```

## Step 8: Check Status

```bash
# Wait a few seconds
sleep 5

# Check container status (should show "Up", not "Restarting")
docker ps | grep traefik

# Check logs (should NOT show "field not found, node: enabled" errors)
docker logs traefik-public-traefik-1 --tail=30
```

## Step 9: Create .env File (Optional - Prevents Needing to Export Each Time)

```bash
cd /root/code/traefik-public

# Disable history expansion to avoid issues with exclamation marks
set +H

# Create .env file (use double quotes and escape the exclamation mark)
cat > .env << "EOF"
DOMAIN=wiseman-palace.co.ke
USERNAME=admin
PASSWORD=WiseManPalace2025!
HASHED_PASSWORD=PLACEHOLDER
EMAIL=owayopaul@gmail.com
EOF

# Generate the hashed password (disable history expansion for this too)
HASHED=$(set +H; openssl passwd -apr1 'WiseManPalace2025!')
# Escape $ characters for Docker Compose ($$ becomes $)
ESCAPED_HASHED=$(echo "$HASHED" | sed 's/\$/$$/g')
sed -i "s|HASHED_PASSWORD=.*|HASHED_PASSWORD=$ESCAPED_HASHED|" .env

# Re-enable history expansion (optional)
set -H

# Verify
cat .env
```

**Alternative method (if the above still has issues):**

```bash
cd /root/code/traefik-public

# Disable history expansion
set +H

# Create file line by line
echo "DOMAIN=wiseman-palace.co.ke" > .env
echo "USERNAME=admin" >> .env
echo "PASSWORD=WiseManPalace2025!" >> .env
echo "EMAIL=owayopaul@gmail.com" >> .env

# Generate hashed password and add it (escape $ for Docker Compose)
HASHED=$(openssl passwd -apr1 'WiseManPalace2025!')
ESCAPED_HASHED=$(echo "$HASHED" | sed 's/\$/$$/g')
echo "HASHED_PASSWORD=$ESCAPED_HASHED" >> .env

# Re-enable history expansion
set -H

# Verify
cat .env
```

After creating `.env`, Docker Compose will automatically load these variables, so you don't need to export them each time.

## Troubleshooting

### Still seeing "field not found, node: enabled"

The old file is still on the server. Make sure you copied the fixed file:

```bash
# On server, check the file
grep -n "http2" /root/code/traefik-public/docker-compose.traefik.yml
```

If you see `http2.enabled`, the old file is still there. Copy the fixed file again from your local machine.

### "required variable DOMAIN is missing"

Make sure environment variables are exported before running docker compose:

```bash
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com
```

Or create a `.env` file as shown in Step 9.

### Container Still Restarting

Check the full logs for other errors:

```bash
docker logs traefik-public-traefik-1
```

Look for any configuration errors and fix them.

