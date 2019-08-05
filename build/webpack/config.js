const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const WebpackBar = require('webpackbar');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function (config, postcssConfig, debug) {
  const { assets: { script, style } } = config;

  return {
    output: {
      filename: '[name].js'
    },
    resolve: {
      alias: script.alias
    },
    devtool: debug ? 'cheap-module-inline-source-map' : 'none',
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: script.cssModules ? {
                  mode: 'local',
                  localIdentName: '[name]__[local]--[hash:base64:5]'
                } : false,
                sourceMap: debug,
                localsConvention: 'camelCaseOnly'
              }
            },
            {
              loader: 'postcss-loader',
              options: postcssConfig
            }
          ]
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        }
      ]
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true
        }),
        new OptimizeCSSAssetsPlugin()
      ],
      splitChunks: {
        cacheGroups: {
          common: {
            name: script.commonChunkName,
            test: /\.js$/,
            chunks: 'all',
            minChunks: 2,
            enforce: true,
            reuseExistingChunk: true
          },
          commonStyle: {
            name: script.commonChunkName,
            test: /\.css$/,
            chunks: 'all',
            minChunks: 1,
            enforce: true,
            reuseExistingChunk: true
          },
          vue: {
            name: script.vueChunkName,
            test: m => m.nameForCondition && /\.vue$/.test(m.nameForCondition()) && /^javascript/.test(m.type),
            chunks: 'all',
            priority: 10,
            minChunks: 2,
            enforce: true,
            reuseExistingChunk: true
          },
          vueStyle: {
            name: script.vueChunkName,
            test: m => m.nameForCondition && /\.vue$/.test(m.nameForCondition()) && !/^javascript/.test(m.type),
            chunks: 'all',
            priority: 10,
            minChunks: 1,
            enforce: true,
            reuseExistingChunk: true
          }
        }
      },
      runtimeChunk: {
        name: 'webpack-runtime'
      }
    },
    performance: {
      hints: false
    },
    mode: debug ? 'development' : 'production',
    plugins: [
      new WebpackBar(),
      new VueLoaderPlugin(),
      new webpack.DllReferencePlugin({
        context: process.cwd(),
        manifest: path.resolve(script.vendor.manifest, 'vendor.json')
      }),
      new MiniCssExtractPlugin({
        filename: path.relative(script.dest, path.join(style.dest, '[name].css'))
      })
    ].concat(process.env.ANALYZER === 'true' ? [new BundleAnalyzerPlugin()] : [])
  };
};
