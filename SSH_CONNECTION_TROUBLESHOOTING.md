# SSH Connection Troubleshooting Guide

## Problem: "Connection timed out during banner exchange"

This error means GitHub Actions cannot establish an SSH connection to your server. Here's how to diagnose and fix it.

## Quick Diagnosis Steps

### 1. Verify Server is Running

Check your hosting provider dashboard (Linode, AWS, etc.) to ensure:
- Server is powered on
- Server is not in maintenance mode
- No recent incidents or outages

### 2. Test SSH from Your Local Machine

Try connecting from your local computer:

```bash
ssh -v root@YOUR_SERVER_IP
```

**If this works:** The issue is likely firewall/network blocking GitHub Actions IPs  
**If this fails:** The issue is with your server configuration

### 3. Check Firewall Rules

#### For Linode (Cloud Firewall):

1. Go to Linode Dashboard → **Firewalls**
2. Find your firewall (or create one)
3. **Inbound Rules** should include:
   - **Label:** SSH
   - **Protocol:** TCP
   - **Ports:** 22
   - **Sources:** `0.0.0.0/0` (or specific IP ranges - see below)

#### For UFW (if installed on server):

```bash
# On your server, check UFW status
sudo ufw status

# If UFW is active, allow SSH
sudo ufw allow 22/tcp
sudo ufw reload
```

#### For iptables (if used):

```bash
# Check current rules
sudo iptables -L -n | grep 22

# Allow SSH (if needed)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables-save
```

### 4. Check SSH Service Status

On your server (via console/terminal access):

```bash
# Check if SSH service is running
sudo systemctl status ssh
# or
sudo systemctl status sshd

# If not running, start it
sudo systemctl start ssh
sudo systemctl enable ssh
```

### 5. Verify SSH Port is Open

From your local machine (if you have `nc` installed):

```bash
nc -zv YOUR_SERVER_IP 22
```

**Expected output:** `Connection to YOUR_SERVER_IP 22 port [tcp/ssh] succeeded!`

### 6. GitHub Actions IP Whitelisting

GitHub Actions uses dynamic IP addresses. You have two options:

#### Option A: Allow All IPs (Less Secure, Easier)

In your firewall, allow SSH from `0.0.0.0/0` (all IPs).

**Security Note:** This allows SSH from anywhere. Mitigate risk by:
- Using SSH key authentication only (disable password auth)
- Using a non-standard SSH port
- Using fail2ban to block brute force attempts

#### Option B: Whitelist GitHub IP Ranges (More Secure)

GitHub publishes their IP ranges. However, these change frequently:

```bash
# Get GitHub Actions IP ranges
curl https://api.github.com/meta | jq '.actions[]'

# You'll need to update firewall rules periodically
```

**Recommended:** Use Option A for now, then tighten security later.

### 7. Verify GitHub Secrets

In GitHub: **Settings** → **Secrets and variables** → **Actions**

Verify these secrets are correct:
- `SERVER_HOST` - Should be IP address (e.g., `173.255.249.250`) or hostname
- `SERVER_USER` - Usually `root`
- `SSH_PRIVATE_KEY` - Should match the public key on your server

### 8. Check Server Logs

On your server, check SSH logs:

```bash
# Check SSH auth logs
sudo tail -f /var/log/auth.log
# or
sudo journalctl -u ssh -f

# Try connecting from GitHub Actions and watch for connection attempts
```

## Common Solutions

### Solution 1: Allow SSH from All IPs (Quick Fix)

**Linode Cloud Firewall:**
1. Go to Linode Dashboard → **Firewalls**
2. Edit your firewall
3. Add Inbound Rule:
   - **Label:** SSH
   - **Protocol:** TCP
   - **Ports:** 22
   - **Sources:** `0.0.0.0/0`
4. Save and apply to your server

**UFW (on server):**
```bash
sudo ufw allow from 0.0.0.0/0 to any port 22 proto tcp
sudo ufw reload
```

### Solution 2: Verify SSH Service

```bash
# On server
sudo systemctl status ssh
sudo systemctl start ssh
sudo systemctl enable ssh
```

### Solution 3: Check Server IP/Hostname

Verify `SERVER_HOST` in GitHub secrets matches your actual server IP.

Test DNS resolution:
```bash
# From GitHub Actions (or locally)
nslookup YOUR_SERVER_HOST
# or
dig YOUR_SERVER_HOST
```

### Solution 4: Use IP Instead of Hostname

If using a hostname, try using the IP address directly in `SERVER_HOST` secret.

## Testing After Fixes

1. **Test locally first:**
   ```bash
   ssh -v root@YOUR_SERVER_IP
   ```

2. **Test from GitHub Actions:**
   - Re-run the deployment workflow
   - Check the "Verify server connectivity" step output

3. **Monitor server logs:**
   ```bash
   # On server
   sudo tail -f /var/log/auth.log
   ```

## Security Best Practices (After Fixing)

Once SSH is working, improve security:

1. **Disable password authentication:**
   ```bash
   # On server, edit /etc/ssh/sshd_config
   sudo nano /etc/ssh/sshd_config
   
   # Set:
   PasswordAuthentication no
   PermitRootLogin prohibit-password
   
   # Restart SSH
   sudo systemctl restart ssh
   ```

2. **Install fail2ban:**
   ```bash
   sudo apt-get install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **Use a non-standard SSH port** (optional):
   ```bash
   # Edit /etc/ssh/sshd_config
   Port 2222  # Change from 22
   # Update firewall to allow new port
   # Update GitHub secret SERVER_HOST to include port: IP:2222
   ```

## Still Not Working?

1. **Check hosting provider status page** for outages
2. **Try server console/terminal** (if available) to verify server is responsive
3. **Contact hosting provider support** - they can check firewall/network logs
4. **Try alternative deployment method:**
   - Manual deployment via server console
   - Use a VPN/bastion host
   - Use GitHub Actions self-hosted runner on your network

## Quick Reference Commands

```bash
# Test SSH connection
ssh -v root@YOUR_SERVER_IP

# Check SSH service
sudo systemctl status ssh

# Check firewall (UFW)
sudo ufw status

# Check firewall (iptables)
sudo iptables -L -n | grep 22

# Check SSH logs
sudo tail -f /var/log/auth.log

# Test port connectivity
nc -zv YOUR_SERVER_IP 22
```

