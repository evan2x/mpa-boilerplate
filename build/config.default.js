const path = require('path');

const docDir = './docs';
const context = './assets';

module.exports = {
  /**
   * 资源输出相关配置
   * @type {Object}
   */
  output: {
    /**
     * 资源输出目录
     * @type {String}
     */
    path: './dist',
    publicPath: ''
  },
  /** 
   * 内置的node服务
   */
  server: {
    /**
     * 端口号
     * @type {Number}
     */
    port: 8060,
    /**
     * 模版目录
     * @type {String}
     */
    view: 'views/',
    /**
     * 公共资源访问路径与目录映射
     * @type {String}
     */
    public: {
      '/assets': 'assets/',
      '/dist/assets': 'dist/assets/'
    },
    /**
     * 代理配置，与webpack-dev-server的proxy配置相同
     * @see https://webpack.js.org/configuration/dev-server/#devserverproxy
     */
    proxy: {} 
  },
  /**
   * 资源配置
   * @todo 大部分资源都会有`src`和`dest`属性, 其中`src`相对于`assets.context`，而`dest`相对于`output.path`
   * @type {Object}
   */
  assets: {
    /**
     * 对资源进行hash版本的处理
     */
    revision: {
      /**
       * 是否开启querystring模式 true => querystring mode  false => normal mode
       * @type {Boolean}
       * @example
       * normal mode:
       *  /assets/img/foo-v334d5a948a.png
       * querystring mode:
       *  /assets/img/foo.png?v=v334d5a948a
       */
      qs: true,
      /**
       * 资源清单文件路径
       * @type {String}
       */
      manifest: './rev-manifest.json',
    },
    /**
     * 资源上下文目录
     * @type {String}
     */
    context,
    /**
     * 模板配置
     * @type {Object}
     */
    template: {
      src: '../views/**/*.{vm,ftl,html}',
      dest: '../views/'
    },
    /**
     * JavaScript配置
     * @type {Object}
     */
    script: {
      /**
       * JS的`src`需要指定每个页面的入口文件，所以它最后匹配的文件名必须是一个具名，例如`main.js`
       * @type {String}
       */
      src: 'js/**/main.js',
      dest: 'js/',
      /**
       * 公共模块名称
       * @todo 该模块用于提取JavaScript代码中复用的模块，对于在js文件中引入的样式将提取到 `style.dest` 指定的目录下，样式文件名与模块名相同
       */
      commonChunkName: 'common',
      /**
       * 是否开启 css modules
       */
      cssModules: true,
      /**
       * 第三方模块配置，使用webpack dll打包
       * @type {Object}
       */
      vendor: {
        /**
         * 第三方模块名称
         * @type {Object}
         */
        name: 'vendor',
        /**
         * 第三方模块资源表缓存路径
         * @type {Object}
         */
        manifest: './node_modules/__vendor-bundle__',
        /**
         * 第三方模块所需要打包的模块
         * @type {Array}
         * @todo 之所以不默认匹配node_modules的原因在于一些模块可以通过tree-shaking优化或者babel插件做按需加载，这些模块不应该被打包到vendor中
         */
        modules: []
      },
      /**
       * 模块引入时的别名
       * @type {Object}
       */
      alias: {
        '@': path.resolve(context),
        'vue$': 'vue/dist/vue.esm.js'
      }
    },
    /**
     * CSS配置
     * @type {Object}
     */
    style: {
      src: 'css/**/*.css',
      dest: 'css/'
    },
    /**
     * 图片配置
     * @type {Object}
     */
    image: {
      src: 'img/**/*.{png,jpg,jpeg,svg}',
      dest: 'img/'
    },
    /**
     * 拷贝文件，`useHash`表示对文件引用是否增加hash版本号
     * @type {Array}
     */
    copies: [
      {
        src: 'font/**/*.{eot,ttf,woff,svg}',
        dest: 'font/',
        useHash: true
      },
      {
        src: 'symbol/**/*.svg',
        dest: 'symbol/',
        useHash: true
      }
    ]
  },
  /**
   * 图标生成器配置
   */
  iconBuilder: {
    /**
     * svg symbols配置项
     * @type {Object}
     */
    symbols: {
      src: 'icon/symbols/**/*.svg',
      dest: path.join(context, 'symbol'),
      /**
       * 输出文件名
       * @type {String}
       */
      name: 'icon-symbols',
      /**
       * 使用文档输出路径
       * @type {String}
       */
      doc: path.join(docDir, 'svg-symbols/demo.html')
    },
    /**
     * iconfont配置项
     * @type {Object}
     */
    iconfont: {
      src: 'icon/fonts/**/*.svg',
      dest: path.join(context, 'font'),
      /**
       * iconfont
       * @type {String}
       */
      name: 'iconfont',
      /**
       * 图标格式
       */
      formats: ['svg', 'ttf', 'eot', 'woff'],
      /**
       * 样式输出路径
       * @type {String}
       */
      style: path.join(context, 'css'),
      /**
       * 使用文档输出路径
       * @type {String}
       */
      doc: path.join(docDir, 'iconfont/demo.html')
    }
  }
};
