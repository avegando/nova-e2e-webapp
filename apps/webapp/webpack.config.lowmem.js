/*
 * NovaE2E build helper for a small build host (the E2E server next to the running cluster):
 * same production config, but one minifier worker, three modules in flight, no source maps and
 * no on-disk build cache, so the bundle step stays well below the memory limit of the build
 * container. Use with NODE_OPTIONS=--max-old-space-size=2304 and MALLOC_ARENA_MAX=2. The build takes longer.
 * The shipped code is the same as with webpack.config.js.
 */
const TerserPlugin = require('terser-webpack-plugin');

const config = require('./webpack.config.js');

module.exports = {
  ...config,
  cache: false,
  devtool: false,
  optimization: {
    ...config.optimization,
    minimizer: [new TerserPlugin({parallel: 1, terserOptions: {compress: {passes: 2}}})],
  },
  parallelism: 3,
};
