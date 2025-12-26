# Fix Docker API Version Compatibility Issue

Traefik is now running, but there's a Docker API version mismatch. The error shows:
```
client version 1.24 is too old. Minimum supported API version is 1.44
```

## Quick Fix

### Option 1: Update Docker on Server (Recommended)

SSH into your server and run:

```bash
ssh root@173.255.249.250

# Update Docker to latest version
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt-get update
apt-get install -y docker-compose-plugin

# Restart Docker daemon
systemctl restart docker

# Verify Docker is working
docker --version
docker ps

# Restart Traefik
cd /root/code/traefik-public
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com

docker compose -f docker-compose.traefik.yml down
docker compose -f docker-compose.traefik.yml up -d

# Check logs (should not show API version errors)
docker logs traefik-public-traefik-1 --tail=20
```

### Option 2: Use Newer Traefik Version

Alternatively, you can use Traefik v3.3 or later which supports newer Docker API versions:

```bash
cd /root/code/traefik-public

# Edit docker-compose.traefik.yml
nano docker-compose.traefik.yml

# Change line 3 from:
#   image: traefik:v3.2
# To:
#   image: traefik:v3.3

# Or use latest:
#   image: traefik:latest

# Then restart
export DOMAIN=wiseman-palace.co.ke
export USERNAME=admin
export PASSWORD=WiseManPalace2025!
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export EMAIL=owayopaul@gmail.com

docker compose -f docker-compose.traefik.yml down
docker compose -f docker-compose.traefik.yml up -d
```

## Check Current Docker Version

```bash
# Check Docker version
docker --version

# Check Docker daemon API version
docker version

# Check if Docker Compose is installed
docker compose version
```

## Verify Fix

After updating, check Traefik logs:

```bash
docker logs traefik-public-traefik-1 --tail=30
```

You should **NOT** see:
- ❌ "client version 1.24 is too old"
- ❌ "Minimum supported API version is 1.44"

You **SHOULD** see:
- ✅ Traefik starting successfully
- ✅ "Configuration loaded" messages
- ✅ No API version errors

## What's Happening?

Traefik v3.2 uses an older Docker API client (version 1.24), but your Docker daemon requires API version 1.44 or higher. This happens when:

1. Docker was recently updated on the server
2. Traefik version is older than the Docker version
3. There's a version mismatch between Docker client and daemon

## Recommended Solution

**Update Docker** (Option 1) is recommended because:
- Ensures you have the latest security patches
- Keeps Docker and Docker Compose in sync
- Works with all Traefik versions
- Better long-term compatibility

## After Fixing

Once the API version error is resolved, Traefik should:
- ✅ Successfully connect to Docker daemon
- ✅ Discover containers automatically
- ✅ Route traffic correctly
- ✅ Generate SSL certificates via Let's Encrypt

## Next Steps

After fixing the Docker API issue:
1. Verify Traefik is working: `docker logs traefik-public-traefik-1`
2. Test HTTP endpoint: `curl -I http://localhost`
3. Proceed with application deployment (see `PRODUCTION_DEPLOYMENT.md`)

