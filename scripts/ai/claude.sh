#!/usr/bin/env bash
set -euo pipefail

claude_bin="/home/pwuser/.vscode-server/extensions/anthropic.claude-code-2.1.314-linux-arm64/resources/native-binary/claude"
[[ -x "$claude_bin" ]] || {
  echo "Claude Code executable was not found at the expected extension path." >&2
  exit 1
}

export ANTHROPIC_BASE_URL="http://127.0.0.1:4000"
export ANTHROPIC_MODEL="claude-code"
export ANTHROPIC_DEFAULT_OPUS_MODEL="claude-code"
export ANTHROPIC_DEFAULT_SONNET_MODEL="claude-code"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-code"
export ANTHROPIC_AUTH_TOKEN="${GGM_CLAUDE_CODE_API_KEY:?Inject with scripts/ai/run.sh}"
unset ANTHROPIC_API_KEY

exec "$claude_bin" "$@"
