#!/bin/sh
# Bun may already exist in Codex's local runtime even when it is outside PATH.
set -eu
cd "$(dirname "$0")"
if command -v bun >/dev/null 2>&1; then
  exec bun run dev "$@"
fi
if [ -x "$HOME/.bun/bin/bun" ]; then
  exec "$HOME/.bun/bin/bun" run dev "$@"
fi
if [ -x "$HOME/.codex/tools/pstack/bun" ]; then
  exec "$HOME/.codex/tools/pstack/bun" run dev "$@"
fi
echo 'Bun was not found. Install Bun, then run bun install and bun run dev.' >&2
exit 1
