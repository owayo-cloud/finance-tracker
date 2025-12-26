# Fix Traefik Configuration Error

The Traefik container is failing with the error: `"field not found, node: enabled"`

This is because the HTTP/2 configuration syntax is incorrect for Traefik v3.2.

## Solution

### Step 1: Copy the Fixed Configuration File

From your **local machine** (Windows/WSL), copy the fixed file to the server:

```bash
# From WSL
wsl scp docker-compose.traefik.yml root@173.255.249.250:/root/code/traefik-public/

# Or from PowerShell
scp docker-compose.traefik.yml root@173.255.249.250:/root/code/traefik-public/
```

### Step 2: SSH into Server and Fix Traefik

```bash
ssh root@173.255.249.250
cd /root/code/traefik-public
```

### Step 3: Set Environment Variables

```bash
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com
```

### Step 4: Restart Traefik

```bash
# Stop Traefik
docker compose -f docker-compose.traefik.yml down

# Start Traefik with fixed config
docker compose -f docker-compose.traefik.yml up -d

# Check logs
docker logs traefik-public-traefik-1 --tail=20
```

### Alternative: Use the Fix Script

1. Copy the fix script to server:
```bash
scp fix-traefik-on-server.sh root@173.255.249.250:/root/code/traefik-public/
```

2. SSH and run it:
```bash
ssh root@173.255.249.250
cd /root/code/traefik-public
chmod +x fix-traefik-on-server.sh
./fix-traefik-on-server.sh
```

## What Was Fixed

The problematic line:
```yaml
- --entrypoints.https.http2.enabled=true
```

Was removed because:
- HTTP/2 is enabled by default in Traefik v3 for HTTPS endpoints
- The syntax `http2.enabled` is not valid in Traefik v3.2

## Verify It's Working

After restarting, check:

```bash
# Check container status (should be "Up", not "Restarting")
docker ps | grep traefik

# Check logs (should not show errors)
docker logs traefik-public-traefik-1 --tail=20

# Test HTTP endpoint
curl -I http://localhost
```

If Traefik is running correctly, you should see:
- Container status: `Up X minutes` (not restarting)
- No error messages in logs
- HTTP response when curling localhost

## Create .env File (Optional but Recommended)

To avoid setting environment variables each time, create a `.env` file:

```bash
cd /root/code/traefik-public
cat > .env << EOF
DOMAIN=wiseman-palace.co.ke
USERNAME=admin
PASSWORD=WiseManPalace2025!
HASHED_PASSWORD=$(openssl passwd -apr1 WiseManPalace2025!)
EMAIL=owayopaul@gmail.com
EOF
```

Then Docker Compose will automatically load these variables.

## Troubleshooting

### Still seeing "field not found, node: enabled" error

1. Make sure you copied the **fixed** docker-compose.traefik.yml file
2. Verify the file on the server doesn't have the HTTP/2 line:
   ```bash
   grep -n "http2" /root/code/traefik-public/docker-compose.traefik.yml
   ```
   Should return nothing (or only comments)

### "required variable DOMAIN is missing"

Make sure environment variables are set:
```bash
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com
```

Or create a `.env` file as shown above.

### Container still restarting

Check the full logs:
```bash
docker logs traefik-public-traefik-1
```

Look for any other configuration errors and fix them accordingly.

