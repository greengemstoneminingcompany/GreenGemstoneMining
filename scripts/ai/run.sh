#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cli="$root/.tools/infisical/node_modules/.bin/infisical"
: "${INFISICAL_ENV:?Set the selected Infisical environment slug}"
[[ -x "$cli" ]] || { echo 'Install workspace-local Infisical first.' >&2; exit 1; }
[[ $# -gt 0 ]] || { echo 'Usage: scripts/ai/run.sh command [args...]' >&2; exit 1; }
cd "$root"
exec "$cli" run --domain=https://app.infisical.com/api --env="$INFISICAL_ENV" --path="${INFISICAL_SECRET_PATH:-/}" -- "$@"
