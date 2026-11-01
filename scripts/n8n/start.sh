#!/usr/bin/env bash
set -euo pipefail
workspace_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
node_bin="$workspace_root/.tools/n8n-runtime/node_modules/node/bin/node"
n8n_bin="$workspace_root/.tools/n8n-runtime/node_modules/n8n/bin/n8n"
user_folder="$workspace_root/n8n/migrated-runtime"
if [[ ! -x "$node_bin" || ! -f "$n8n_bin" || ! -d "$user_folder/.n8n" ]]; then
  echo "The local n8n runtime or restored data directory is missing. Restore the existing setup before starting." >&2
  exit 1
fi
if curl --silent --fail --max-time 3 http://127.0.0.1:5678/healthz/readiness >/dev/null; then
  echo "n8n is already ready at http://127.0.0.1:5678"
  exit 0
fi
export N8N_USER_FOLDER="$user_folder"
export N8N_HOST=127.0.0.1 N8N_PORT=5678 N8N_PROTOCOL=http N8N_SECURE_COOKIE=false
exec "$node_bin" "$n8n_bin" start
