# Cloudflare DNS Setup Guide for wiseman-palace.co.ke

This guide will help you configure Cloudflare DNS records for your finance-tracker application.

## Prerequisites

- Cloudflare account with `wiseman-palace.co.ke` domain added
- Server IP address: `173.255.249.250`
- Access to Cloudflare dashboard

## Step 1: Access Cloudflare DNS Settings

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select the domain **wiseman-palace.co.ke**
3. Navigate to **DNS** → **Records**

## Step 2: Add DNS Records

Add the following DNS records. If any records already exist, you may need to edit or delete them first.

### Record 1: Root Domain (Optional - for main domain)
- **Type**: `A`
- **Name**: `@` (or leave blank, represents the root domain)
- **IPv4 address**: `173.255.249.250`
- **Proxy status**: 🟠 **Proxied** (orange cloud ON)
- **TTL**: Auto

**Result**: `wiseman-palace.co.ke` → `173.255.249.250`

---

### Record 2: Dashboard (Frontend)
- **Type**: `A`
- **Name**: `dashboard`
- **IPv4 address**: `173.255.249.250`
- **Proxy status**: 🟠 **Proxied** (orange cloud ON)
- **TTL**: Auto

**Result**: `dashboard.wiseman-palace.co.ke` → `173.255.249.250`

---

### Record 3: API (Backend)
- **Type**: `A`
- **Name**: `api`
- **IPv4 address**: `173.255.249.250`
- **Proxy status**: 🟠 **Proxied** (orange cloud ON)
- **TTL**: Auto

**Result**: `api.wiseman-palace.co.ke` → `173.255.249.250`

---

### Record 4: Traefik Dashboard
- **Type**: `A`
- **Name**: `traefik`
- **IPv4 address**: `173.255.249.250`
- **Proxy status**: 🟠 **Proxied** (orange cloud ON)
- **TTL**: Auto

**Result**: `traefik.wiseman-palace.co.ke` → `173.255.249.250`

---

### Record 5: Adminer (Database Admin)
- **Type**: `A`
- **Name**: `adminer`
- **IPv4 address**: `173.255.249.250`
- **Proxy status**: 🟠 **Proxied** (orange cloud ON)
- **TTL**: Auto

**Result**: `adminer.wiseman-palace.co.ke` → `173.255.249.250`

---

## Step 3: Verify DNS Records

After adding all records, your DNS records table should look like this:

| Type | Name      | Content          | Proxy | TTL  |
|------|-----------|------------------|-------|------|
| A    | @         | 173.255.249.250  | 🟠    | Auto |
| A    | dashboard | 173.255.249.250  | 🟠    | Auto |
| A    | api       | 173.255.249.250  | 🟠    | Auto |
| A    | traefik   | 173.255.249.250  | 🟠    | Auto |
| A    | adminer   | 173.255.249.250  | 🟠    | Auto |

## Step 4: Configure Cloudflare SSL/TLS Settings

1. In Cloudflare dashboard, go to **SSL/TLS** → **Overview**
2. Set SSL/TLS encryption mode to: **Full** or **Full (strict)**
   - **Full**: Cloudflare encrypts traffic between visitor and Cloudflare, and between Cloudflare and your server
   - **Full (strict)**: Same as Full, but requires a valid SSL certificate on your server (recommended after Let's Encrypt certificates are issued)

3. Go to **SSL/TLS** → **Edge Certificates**
   - Enable **Always Use HTTPS** (optional but recommended)
   - Enable **Automatic HTTPS Rewrites** (optional but recommended)

## Step 5: Wait for DNS Propagation

- DNS changes typically propagate within **1-5 minutes**
- Can take up to **24 hours** in rare cases
- You can check propagation status using:
  - [whatsmydns.net](https://www.whatsmydns.net/#A/dashboard.wiseman-palace.co.ke)
  - Command line: `dig dashboard.wiseman-palace.co.ke` or `nslookup dashboard.wiseman-palace.co.ke`

## Step 6: Verify DNS Resolution

Once DNS has propagated, verify each subdomain resolves correctly:

```bash
# Check dashboard subdomain
nslookup dashboard.wiseman-palace.co.ke

# Check API subdomain
nslookup api.wiseman-palace.co.ke

# Check Traefik subdomain
nslookup traefik.wiseman-palace.co.ke

# Check Adminer subdomain
nslookup adminer.wiseman-palace.co.ke
```

All should resolve to `173.255.249.250` (or Cloudflare's proxy IPs if proxied).

## Important Notes

### Proxy Status (Orange Cloud)

- **🟠 Proxied (ON)**: 
  - Traffic goes through Cloudflare's CDN
  - Provides DDoS protection
  - Hides your server's real IP
  - Recommended for production

- **⚪ DNS Only (OFF)**:
  - Direct connection to your server
  - No Cloudflare protection
  - Use only if you need direct IP access

### SSL/TLS Mode

- **Full** or **Full (strict)** is required for Let's Encrypt to work properly
- After Traefik obtains SSL certificates, you can switch to **Full (strict)** for better security

### Firewall Rules (Optional)

Consider setting up Cloudflare Firewall Rules to:
- Block specific countries/regions
- Rate limit API endpoints
- Protect admin interfaces

## Troubleshooting

### DNS Not Resolving

1. **Check DNS propagation**: Use [whatsmydns.net](https://www.whatsmydns.net)
2. **Clear DNS cache**: 
   - Windows: `ipconfig /flushdns`
   - Linux/Mac: `sudo systemd-resolve --flush-caches` or restart network service
3. **Wait longer**: Some DNS servers cache records for up to 24 hours

### SSL Certificate Issues

1. Ensure DNS records are correct and propagated
2. Verify SSL/TLS mode is set to **Full** or **Full (strict)**
3. Check Traefik logs: `docker logs traefik-public-traefik-1 | grep -i acme`
4. Ensure ports 80 and 443 are open on your server

### Cloudflare Error 521

If you see Cloudflare Error 521 (Web server is down):
1. Check if Traefik is running: `docker ps | grep traefik`
2. Verify server is accessible: `curl -I http://173.255.249.250`
3. Check firewall rules on your server
4. See `troubleshoot-521.sh` for detailed diagnostics

## Next Steps

After DNS is configured:

1. ✅ DNS records added
2. ⏭️ Deploy Traefik (see `PRODUCTION_DEPLOYMENT.md` Step 4)
3. ⏭️ Deploy application (see `PRODUCTION_DEPLOYMENT.md` Step 5-6)
4. ⏭️ Verify all services are accessible via HTTPS

## Quick Reference URLs

Once deployed, your services will be available at:

- **Frontend Dashboard**: `https://dashboard.wiseman-palace.co.ke`
- **Backend API**: `https://api.wiseman-palace.co.ke`
- **API Documentation**: `https://api.wiseman-palace.co.ke/docs`
- **Traefik Dashboard**: `https://traefik.wiseman-palace.co.ke`
- **Adminer (Database)**: `https://adminer.wiseman-palace.co.ke`

---

**Need Help?** Check `PRODUCTION_DEPLOYMENT.md` for the complete deployment guide.

