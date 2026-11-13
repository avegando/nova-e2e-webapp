#!/bin/bash
# NovaE2E: runs the production bundle and stops with an error when webpack reports errors
# (a bundle "compiled with N errors" must never end up in an image).
set -uo pipefail
cd "$(dirname "$0")/.."
LOG="$(mktemp)"
node ../../node_modules/webpack/bin/webpack.js --config "${1:-webpack.config.lowmem.js}" 2>&1 | tee "$LOG"
STATUS=${PIPESTATUS[0]}
if [ "$STATUS" -ne 0 ] || grep -Eq "compiled with [0-9]+ errors?" "$LOG"; then
  echo "NovaE2E build: the bundle has errors, stopping." >&2
  exit 1
fi
