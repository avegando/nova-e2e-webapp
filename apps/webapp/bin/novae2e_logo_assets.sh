#!/bin/bash
# Regenerates every logo file from apps/webapp/brand/source (run on the E2E server, needs the puppeteer image, no network).
set -euo pipefail
cd "$(dirname "$0")/../../.."
docker run --rm --user root --network none -e PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer -v "$PWD":/work -w /work/apps/webapp ghcr.io/puppeteer/puppeteer:latest \
  sh -c 'ln -sfn /home/pptruser/node_modules /work/apps/webapp/bin/node_modules && node bin/novae2e_logo_assets.mjs; r=$?; unlink /work/apps/webapp/bin/node_modules; exit $r'
