const path = require('path');
const webpack = require('webpack');
const WebpackBar = require('webpackbar');

module.exports = function (config, debug) {
  return {
    entry: {
      [config.vendor.name]: ['core-js/stable', 'regenerator-runtime/runtime'].concat(config.vendor.modules)
    },
    devtool: debug ? 'cheap-module-inline-source-map' : 'none',
    output: {
      filename: '[name].js',
      library: '[name]'
    },
    mode: debug ? 'development' : 'production',
    performance: {
      hints: false
    },
    resolve: {
      alias: config.alias
    },
    plugins: [
      new WebpackBar(),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      }),
      new webpack.DllPlugin({
        context: process.cwd(),
        path: path.join(config.vendor.manifest, '[name].json'),
        name: '[name]'
      }),
      new webpack.HashedModuleIdsPlugin()
    ]
  };
};
