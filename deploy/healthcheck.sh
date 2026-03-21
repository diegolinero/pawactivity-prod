#!/usr/bin/env bash
set -Eeuo pipefail

echo "=== Healthcheck PawActivity ==="

echo "→ PM2"
pm2 list

echo "→ API"
curl -fsS http://localhost:4000/v1 >/dev/null

echo "→ WEB"
curl -fsS http://localhost:3000 >/dev/null

echo "→ Ports"
ss -tulpn | grep -E ':3000|:4000' >/dev/null

echo "→ Memory"
free -h

echo "→ Disk"
df -h /

echo "=== Healthcheck OK ==="
