#!/usr/bin/env bash
# Teste ponta a ponta sem chave real: API Anthropic simulada + servidor MCP local.
# Uso: npm run build && npm run e2e
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)

for port in 3123 4010 4020; do
  if curl -s -o /dev/null "localhost:$port"; then
    echo "Porta $port já está em uso; encerre o processo antes de rodar o e2e." >&2
    exit 1
  fi
done

# Cada processo em seu próprio grupo (setsid) para encerrar também os filhos
# (o `npx next start` cria um next-server filho que sobreviveria ao kill do npx).
PIDS=()
start() { setsid "$@" & PIDS+=($!); }
cleanup() { for pid in "${PIDS[@]}"; do kill -- "-$pid" 2>/dev/null || true; done; }
trap cleanup EXIT

start node e2e/fake-anthropic.js "$OUT/requests.log" > "$OUT/fake.log" 2>&1
start node e2e/mcp-server.mjs "$PWD/node_modules" > "$OUT/mcp.log" 2>&1
start env ANTHROPIC_API_KEY=fake ANTHROPIC_BASE_URL=http://localhost:4010/v1 \
  MCP_SERVER_URL=http://localhost:4020/mcp COPILOTKIT_TELEMETRY_DISABLED=true \
  AUTH_DEV_LOGIN=true NEXTAUTH_URL=http://localhost:3123 NEXTAUTH_SECRET=e2e-only-secret \
  npx next start -p 3123 > "$OUT/next.log" 2>&1
for _ in $(seq 1 30); do curl -s -o /dev/null localhost:3123 && break; sleep 1; done
node e2e/drive.js "$OUT"
echo "Logs e screenshots em $OUT"
