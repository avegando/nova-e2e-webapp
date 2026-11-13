#!/bin/bash
# Production build on a small host: the bundle step runs in a container without network access
# and stays below 5 GB of memory (webpack.config.lowmem.js, Node heap 2304 MB, MALLOC_ARENA_MAX=2). Run it from a checkout in which the dependencies are installed
# (yarn install, which also fetches the default configuration) and the libraries are built
# (yarn build:libs).
# The container may use BUILD_CPUS cores (default 4) and BUILD_MEMORY (default 5g) without swap; if memory runs short the kernel ends the
# build first (--oom-score-adj 1000), not other services on the host.
# Result: apps/server/dist and, with BUILD_IMAGE=1, a container image.
set -euo pipefail
cd "$(dirname "$0")/../../.."
IMAGE_NAME="${IMAGE_NAME:-webapp}"
BUILD_CPUS="${BUILD_CPUS:-4}"
BUILD_MEMORY="${BUILD_MEMORY:-5g}"
docker image inspect node:24-bookworm >/dev/null 2>&1 || docker pull -q node:24-bookworm
nice -n 15 docker run --rm --network none --cpus "$BUILD_CPUS" --memory "$BUILD_MEMORY" --memory-swap "$BUILD_MEMORY" --oom-score-adj 1000 -e DISTRIBUTION=master -e MALLOC_ARENA_MAX=2 -e NODE_OPTIONS=--max-old-space-size=2304 \
  -v "$PWD":/work -w /work node:24-bookworm bash -c "cd apps/webapp && node bin/novae2e_apply_brand.js && ../../node_modules/.bin/ts-node bin/generate_react_icons.ts && cd /work && cd libraries/config && ../../node_modules/.bin/tsc && cd /work && cd apps/webapp && bash bin/novae2e_bundle.sh webpack.config.lowmem.js && cd /work && node_modules/.bin/tsc -p apps/server/tsconfig.json && node apps/server/bin/generateVersionFile.js && node apps/server/bin/copy_server_assets.js && node apps/server/bin/novae2e_precompress.js"
echo "bundle done"
if [ "${BUILD_IMAGE:-0}" = "1" ]; then
  TAG="$(date +%Y%m%d)-$(git rev-parse --short HEAD)"
  nice -n 15 docker build -q -f apps/server/Dockerfile -t "$IMAGE_NAME:$TAG" .
  echo "image $IMAGE_NAME:$TAG built"
fi
