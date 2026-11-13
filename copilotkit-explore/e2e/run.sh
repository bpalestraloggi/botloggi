#!/usr/bin/env bash
# Teste ponta a ponta sem chave real: API Anthropic simulada + servidor MCP local.
# Uso: npm run build && npm run e2e
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
cleanup() { kill $(jobs -p) 2>/dev/null || true; }
trap cleanup EXIT
node e2e/fake-anthropic.js "$OUT/requests.log" > "$OUT/fake.log" 2>&1 &
node e2e/mcp-server.mjs "$PWD/node_modules" > "$OUT/mcp.log" 2>&1 &
ANTHROPIC_API_KEY=fake ANTHROPIC_BASE_URL=http://localhost:4010/v1 \
MCP_SERVER_URL=http://localhost:4020/mcp COPILOTKIT_TELEMETRY_DISABLED=true \
  npx next start -p 3123 > "$OUT/next.log" 2>&1 &
for _ in $(seq 1 30); do curl -s -o /dev/null localhost:3123 && break; sleep 1; done
node e2e/drive.js "$OUT"
echo "Logs e screenshots em $OUT"
