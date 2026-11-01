#!/usr/bin/env bash
set -euo pipefail

root="/workspaces/GreenGemstoneMining"
infisical="$root/.tools/infisical/node_modules/.bin/infisical"

cd "$root"
exec "$infisical" secrets get GGM_CLAUDE_CODE_API_KEY \
  --domain=https://app.infisical.com/api \
  --env=dev \
  --path=/ \
  --plain \
  --silent
