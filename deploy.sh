#!/bin/bash
# Meowdel Production Deploy
# rsync web-app/ → apps.afterdarksys.com:/opt/meowdel/
# then compile zones + docker compose up --build on the server

set -euo pipefail

REMOTE="apps.afterdarksys.com"
REMOTE_DIR="/opt/meowdel"
LOCAL_DIR="$(cd "$(dirname "$0")/web-app" && pwd)"
COMPOSE="docker compose"

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
info() { echo -e "${YELLOW}→ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

echo ""
echo "  Meowdel Deploy  →  apps.afterdarksys.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Pre-flight ────────────────────────────────────────────────────────────────
info "Pre-flight checks..."

[ -d "$LOCAL_DIR" ] || die "web-app/ not found at $LOCAL_DIR"

# TypeScript check (skip with --no-check)
if [[ "${1:-}" != "--no-check" ]]; then
  info "TypeScript check..."
  cd "$LOCAL_DIR"
  npx tsc --noEmit 2>&1 && ok "TypeScript clean" || die "TypeScript errors — fix before deploying (or pass --no-check)"
  cd - > /dev/null
fi

# SSH connectivity
info "Checking SSH to $REMOTE..."
ssh -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE" exit 2>/dev/null || die "Cannot SSH to $REMOTE"
ok "SSH reachable"

echo ""

# ── Rsync ─────────────────────────────────────────────────────────────────────
info "Syncing web-app/ → $REMOTE:$REMOTE_DIR/ ..."

rsync -az --checksum \
  --exclude '.next/' \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude '._*' \
  "$LOCAL_DIR/" "$REMOTE:$REMOTE_DIR/"

ok "Rsync complete"
echo ""

# ── Remote: build + restart ───────────────────────────────────────────────────
info "Building and restarting on $REMOTE ..."

ssh "$REMOTE" bash -s << 'REMOTE_SCRIPT'
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
info() { echo -e "${YELLOW}  → $*${NC}"; }
die()  { echo -e "${RED}  ✗ $*${NC}"; exit 1; }

cd /opt/meowdel

# Fix any rsync ownership issues
info "Fixing file ownership..."
find . -user 501 -exec chown root:root {} + 2>/dev/null || true
find . -name '._*' -delete 2>/dev/null || true
ok "Ownership clean"

# Build Docker image
info "Building meowdel-web image..."
docker compose build meowdel-web 2>&1 | tail -3
ok "Image built"

# Start/restart all services
info "Starting services..."
docker compose up -d --remove-orphans
ok "Services up"

# Wait for health
info "Waiting for health check..."
for i in $(seq 1 20); do
  STATUS=$(docker inspect meowdel-meowdel-web-1 --format '{{.State.Health.Status}}' 2>/dev/null \
           || docker inspect meowdel-web --format '{{.State.Health.Status}}' 2>/dev/null \
           || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    ok "meowdel-web is healthy"
    break
  fi
  [ $i -eq 20 ] && die "Health check timed out (status: $STATUS)"
  sleep 3
done

# Quick smoke test
CONTAINER=$(docker compose ps -q meowdel-web 2>/dev/null | head -1)
if [ -n "$CONTAINER" ]; then
  RESPONSE=$(docker exec "$CONTAINER" node -e "
require('http').get('http://localhost:3000/api/health', r => {
  let d=''; r.on('data',c=>d+=c); r.on('end',()=>process.stdout.write(r.statusCode + ' ' + d.slice(0,60)));
}).on('error', e => { process.stdout.write('ERROR: ' + e.message); process.exit(1); });
" 2>/dev/null)
  echo "  Health: $RESPONSE"
fi

REMOTE_SCRIPT

echo ""
ok "Deploy complete"
echo ""

# ── DNS zone recompile (if gdns servers are reachable) ────────────────────────
if ssh -o ConnectTimeout=3 -o BatchMode=yes gdns1 exit 2>/dev/null; then
  info "Recompiling DNS zones on gdns1 + gdns2..."
  for ns in gdns1 gdns2; do
    ssh "$ns" bash -s << 'DNS_SCRIPT' &
      find /opt/dnsscienced/zones -name '._*' -delete 2>/dev/null || true
      find /opt/dnsscienced/zones -name '*.dnszone' -user 501 -exec chown root:root {} + 2>/dev/null || true
      /opt/dnsscienced/bin/dnsscienced-compile \
        -input /opt/dnsscienced/zones/meowdel.ai.dnszone -force 2>&1 | tail -3
      systemctl restart dnsscienced
DNS_SCRIPT
  done
  wait
  ok "DNS zones recompiled"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  All done. meowdel.ai is live.${NC}"
echo ""
