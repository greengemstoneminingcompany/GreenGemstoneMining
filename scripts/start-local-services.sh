#!/usr/bin/env bash
# Starts the private local AI gateway and restored n8n instance together.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

mkdir -p .tools/ai-runtime .tools/n8n-runtime

stop() {
  trap - INT TERM EXIT
  kill "${litellm_pid:-}" "${n8n_pid:-}" 2>/dev/null || true
  wait "${litellm_pid:-}" "${n8n_pid:-}" 2>/dev/null || true
}
trap stop INT TERM EXIT

INFISICAL_ENV=dev scripts/ai/run.sh .tools/litellm-venv/bin/python -u scripts/ai/local.py \
  >> .tools/ai-runtime/service.log 2>&1 &
litellm_pid=$!

N8N_USER_FOLDER="$root/n8n/migrated-runtime" \
N8N_HOST=127.0.0.1 N8N_PORT=5678 N8N_PROTOCOL=http N8N_SECURE_COOKIE=false \
  .tools/n8n-runtime/node_modules/node/bin/node .tools/n8n-runtime/node_modules/n8n/bin/n8n start \
  >> .tools/n8n-runtime/service.log 2>&1 &
n8n_pid=$!

echo "Starting LiteLLM and n8n. Keep this terminal open while using them."
for _ in $(seq 1 60); do
  if curl -fsS --max-time 2 http://127.0.0.1:4000/health/liveliness >/dev/null \
    && curl -fsS --max-time 2 http://127.0.0.1:5678/ >/dev/null; then
    echo "Ready: n8n http://127.0.0.1:5678 | LiteLLM http://127.0.0.1:4000/ui"
    break
  fi
  sleep 2
done

wait "$litellm_pid" "$n8n_pid"
