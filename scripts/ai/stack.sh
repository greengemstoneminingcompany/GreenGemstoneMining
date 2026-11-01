#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
command -v docker >/dev/null || { echo 'Docker CLI missing; expose host Docker and install its CLI/Compose plugin.' >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo 'Docker daemon inaccessible.' >&2; exit 1; }
docker compose version >/dev/null
# Do not use compose config: its output may contain interpolated credentials.
exec "$root/scripts/ai/run.sh" docker compose --env-file /dev/null -f "$root/infra/ai/compose.yaml" "$@"
