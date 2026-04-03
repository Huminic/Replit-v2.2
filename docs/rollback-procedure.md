# Rollback Procedure: Coolify Container to PM2

**Scope:** Revert live.huminic.app from Coolify container (localhost:5001) back to PM2 hot standby (localhost:5000).

**Architecture reference:** A-001 decisions D-003, D-005, D-006.

---

## 1. When to Rollback

Trigger a rollback if ANY of the following are true:

- `curl -sf https://live.huminic.app/api/health` fails or returns non-200 for more than 2 minutes
- Coolify container has crashed or is not running (`docker ps` shows no container on port 5001)
- A bad deploy introduced a regression visible to users (broken login, blank pages, API errors)
- Coolify itself is down and cannot restart the container

**Do NOT rollback for:** transient 502s during a Coolify redeploy (wait 60 seconds first), scheduled maintenance windows, or issues that only affect dev.huminicdev.com.

---

## 2. Pre-Rollback Checks

Verify the PM2 hot standby is healthy before switching traffic to it.

```bash
# Check PM2 process is running
pm2 list | grep nexxus-app

# Expected: nexxus-app | online | port 5000

# Health check PM2 directly
curl -sf http://localhost:5000/api/health

# Expected: 200 OK with JSON health response

# If PM2 is stopped, restart it first
pm2 restart nexxus-app
sleep 5
curl -sf http://localhost:5000/api/health
```

If PM2 is not healthy either, do NOT proceed with the rollback. Debug the PM2 process first — switching traffic to a broken backend makes things worse.

---

## 3. Execute Rollback

Caddy is the sole reverse proxy (D-006). The rollback is a single-line edit and reload.

### Step 3a: Back up current Caddyfile

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)
```

### Step 3b: Edit Caddyfile — change live.huminic.app target

```bash
sudo sed -i 's/reverse_proxy localhost:5001/reverse_proxy localhost:5000/' /etc/caddy/Caddyfile
```

### Step 3c: Validate Caddyfile syntax

```bash
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

If validation fails, restore from backup:

```bash
sudo cp /etc/caddy/Caddyfile.backup-* /etc/caddy/Caddyfile  # use the most recent backup
```

### Step 3d: Reload Caddy (zero-downtime)

```bash
sudo systemctl reload caddy
```

Caddy reload is instant and does not drop existing connections.

---

## 4. Verify Rollback

Run all checks within 60 seconds of the reload.

```bash
# Production should now respond via PM2
curl -sf https://live.huminic.app/api/health
echo "---"
curl -sf -o /dev/null -w "%{http_code}" https://live.huminic.app/
echo ""

# Dev should still work (unchanged)
curl -sf https://dev.huminicdev.com/api/health 2>/dev/null || echo "dev not configured yet"

# Confirm PM2 is the one serving (check PM2 logs for incoming requests)
pm2 logs nexxus-app --lines 5 --nostream
```

**Success criteria:**
- `https://live.huminic.app/api/health` returns 200
- `https://live.huminic.app/` returns 200 (login page loads)
- PM2 logs show incoming requests on port 5000

---

## 5. Communicate

Notify the following:

| Who | How | What to say |
|-----|-----|-------------|
| Project owner (Duane) | Direct message | "Production rolled back from container to PM2 at [time]. Reason: [reason]. Site is up." |

No external customer notification is needed unless the outage exceeded 5 minutes or data was affected.

---

## 6. Restore Production (After Fix)

Once the container issue is resolved and verified:

### Step 6a: Verify container is healthy

```bash
# Check Coolify container is running
docker ps | grep 5001

# Health check the container directly
curl -sf http://localhost:5001/api/health
```

### Step 6b: Repoint Caddy back to container

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)
sudo sed -i 's/reverse_proxy localhost:5000/reverse_proxy localhost:5001/' /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

### Step 6c: Verify restoration

```bash
curl -sf https://live.huminic.app/api/health
curl -sf -o /dev/null -w "%{http_code}" https://live.huminic.app/
```

---

## 7. Post-Incident

After every rollback, create a record:

1. **Write incident report** in `evidence/incidents/` with:
   - Timestamp of detection, rollback, and resolution
   - Root cause (or "unknown — investigating")
   - Duration of impact
   - What was done to fix

2. **Update issues.md** if the root cause reveals a bug or gap

3. **Check if the Coolify deploy pipeline needs a fix** (bad Dockerfile, missing env var, failed build)

4. **Verify PM2 hot standby is current** — if PM2 is running old code, rebuild it:

```bash
cd /home/ubuntu/Claude-store/nexxus2.2_replit
git pull
npm ci
npm run build
pm2 restart nexxus-app
curl -sf http://localhost:5000/api/health
```

---

## Quick Reference (Copy-Paste Emergency)

```bash
# ROLLBACK: live.huminic.app from container to PM2
pm2 list | grep nexxus-app
curl -sf http://localhost:5000/api/health
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)
sudo sed -i 's/reverse_proxy localhost:5001/reverse_proxy localhost:5000/' /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
curl -sf https://live.huminic.app/api/health
```
