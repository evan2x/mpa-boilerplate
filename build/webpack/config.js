const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const WebpackBar = require('webpackbar');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function (config, postcssConfig, debug) {
  const { assets, assets: { script, style } } = config;

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
          test: /\.(?:woff2?|eot|ttf|svg)$/,
          loader: 'file-loader',
          options: {
            name: path.relative(script.dest, 'font/[name].[ext]')
          }
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        },
        {
          test: /\.css$/,
          include: new RegExp(assets.context), // 只针对项目资源目录
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
          test: /\.css$/,
          exclude: new RegExp(assets.context), // 针对除项目资源以外的目录，例如加载node_modules或者element-ui的theme中的样式
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
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
            chunks: 'all',
            minChunks: 2,
            enforce: true,
            reuseExistingChunk: true
          },
          commonStyle: {
            name: script.commonChunkName,
            test: (m) => {
              if (m.nameForCondition) {
                const name = m.nameForCondition();

                return /\.css$/.test(name) || (/\.vue$/.test(name) && !/^javascript/.test(m.type));
              }

              return false;
            },
            chunks: 'all',
            minChunks: 1,
            priority: 10,
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
