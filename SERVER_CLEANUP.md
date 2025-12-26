# Server Cleanup Guide

This guide helps you clean up your Linode server before a fresh deployment.

## ⚠️ Important Warnings

**This will DELETE:**
- All Docker containers (running and stopped)
- All Docker volumes (**including databases and all data!**)
- All Docker networks (except default ones)
- All project files in `/root/code/`
- Optionally: All Docker images

**Make sure you have backups if you need any data!**

## Quick Cleanup (Recommended)

Use the automated cleanup script:

```bash
# Make script executable
chmod +x cleanup-server.sh

# Run the cleanup script
./cleanup-server.sh
```

The script will:
1. Ask for confirmation
2. Connect to your server via SSH
3. Stop all containers
4. Remove all containers, volumes, and networks
5. Remove project directories
6. Clean up Docker system
7. Show verification status

## Manual Cleanup Steps

If you prefer to do it manually, SSH into your server and run these commands:

### 1. Connect to Server

```bash
ssh root@173.255.249.250
```

### 2. Stop All Containers

```bash
docker ps -q | xargs docker stop
```

### 3. Remove All Containers

```bash
docker ps -aq | xargs docker rm -f
```

### 4. Remove All Volumes (⚠️ Deletes Database!)

```bash
docker volume ls -q | xargs docker volume rm -f
```

### 5. Remove Custom Networks

```bash
# Remove traefik-public network
docker network rm traefik-public

# Remove any other custom networks (be careful!)
docker network ls --format "{{.Name}}" | grep -vE "^bridge$|^host$|^none$" | xargs docker network rm
```

### 6. Remove Project Directories

```bash
# Remove finance-tracker project
rm -rf /root/code/finance-tracker

# Remove traefik configuration
rm -rf /root/code/traefik-public

# Remove code directory if empty
rmdir /root/code 2>/dev/null || true
```

### 7. Clean Up Docker System

```bash
docker system prune -f
```

### 8. (Optional) Remove All Docker Images

```bash
# WARNING: This removes all Docker images
docker images -q | xargs docker rmi -f
```

### 9. Verify Cleanup

```bash
# Check containers
docker ps -a

# Check volumes
docker volume ls

# Check networks
docker network ls

# Check images
docker images

# Check disk usage
df -h /
```

## Advanced Cleanup (Including Images)

If you also want to remove Docker images to free up more space:

```bash
chmod +x cleanup-server-advanced.sh
./cleanup-server-advanced.sh
```

## What Gets Removed

### Docker Resources
- ✅ All containers (finance-tracker-frontend, finance-tracker-backend, finance-tracker-db, adminer, traefik, etc.)
- ✅ All volumes (app-db-data, supervisor-logs, traefik-public-certificates, etc.)
- ✅ Custom networks (traefik-public)
- ⚠️ Docker images (only if using advanced script)

### Project Files
- ✅ `/root/code/finance-tracker/` - Entire application directory
- ✅ `/root/code/traefik-public/` - Traefik configuration
- ✅ All `.env` files in project directories
- ✅ All Docker Compose files
- ✅ All application code and data

### What Stays
- ✅ Docker itself (still installed)
- ✅ System files and configuration
- ✅ Default Docker networks (bridge, host, none)
- ✅ Docker images (unless using advanced cleanup)

## After Cleanup

Once cleanup is complete, you can proceed with a fresh deployment:

1. **Set up Cloudflare DNS** (if not done)
   - See `CLOUDFLARE_DNS_SETUP.md`

2. **Deploy Traefik**
   - See `PRODUCTION_DEPLOYMENT.md` Step 4

3. **Deploy Application**
   - See `PRODUCTION_DEPLOYMENT.md` Step 5-6

## Troubleshooting

### "Cannot remove network: network is in use"

```bash
# First, stop and remove all containers
docker ps -aq | xargs docker rm -f

# Then remove the network
docker network rm traefik-public
```

### "Volume is in use"

```bash
# First, stop and remove all containers
docker ps -aq | xargs docker rm -f

# Then remove volumes
docker volume ls -q | xargs docker volume rm -f
```

### "Permission denied" errors

Make sure you're running as root or using sudo:

```bash
sudo docker ps -a
```

### SSH Connection Issues

If you can't connect via SSH:

1. Check if the server is running
2. Verify the IP address: `173.255.249.250`
3. Check your SSH key: `ssh-keygen -f ~/.ssh/known_hosts -R 173.255.249.250`
4. Try connecting: `ssh root@173.255.249.250`

## Disk Space Check

Before cleanup, check how much space you're using:

```bash
ssh root@173.255.249.250 "df -h / && docker system df"
```

After cleanup, verify space was freed:

```bash
ssh root@173.255.249.250 "df -h / && docker system df"
```

## Quick Reference Commands

```bash
# Connect to server
ssh root@173.255.249.250

# View all containers
docker ps -a

# View all volumes
docker volume ls

# View all networks
docker network ls

# View disk usage
df -h /

# View Docker disk usage
docker system df
```

---

**Ready for fresh deployment?** Follow `PRODUCTION_DEPLOYMENT.md` after cleanup!

