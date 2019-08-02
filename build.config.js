
module.exports = {
  output: {
    publicPath: ''
  },
  server: {
    proxy: {
      '/github/api/*': {
        target: 'https://api.github.com',
        changeOrigin: true,
        pathRewrite: {
          '^/github/api': ''
        }
      }
    }
  },
  assets: {
    script: {
      vendor: {
        modules: ['axios', 'vue']
      }
    }
  }
};
