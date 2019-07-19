# Multi-page application boilerplate

[![Badge](https://img.shields.io/badge/node.js->=_8.9.0-brightgreen.svg?style=flat)]()
[![David](https://img.shields.io/david/dev/evan2x/mpa-boilerplate.svg)]()

## Commands

```bash
# 开发环境 启用watch对脚本和样式文件进行编译
npm run watch

# 生产环境 构建项目
npm run build

# 生成svg symbols
npm run symbols:gen

# 生成 iconfont
npm run iconfont:gen
```

## 配置项

完整的配置项请参考[build/config.default.js](https://github.com/evan2x/mpa-boilerplate/blob/master/build/config.default.js)，该文件中的所有配置均为默认值，如果用户需要自定义配置，请在项目目录下创建`build.config.js`文件，此文件中的配置会与`默认配置`进行合并。

**以下的例子均配置在`build.config.js`文件中，你不应该修改`build/config.default.js`文件。**

### output 配置

```js
module.exports = {
  output: {
    path: './dist',
    publicPath: 'https://cdn.example.com'
    // or
    publicPath: 'https://cdn.example.com/prefix'
    // or
    publicPath: '/prefix'
  }
}
```

> `output.path` 指定了所有资源打包后输出的目录。  
`output.publicPath` 用于指定静态资源访问时的前缀或者是静态资源服务器地址。

### assets 配置

以下是assets中相关的配置，接下来会着重介绍其中一些关键的配置项。

```js
module.exports = {
  assets: {
    // 静态资源版本号相关配置
    revision: {
      // ...
    },
    // 静态资源的上下文，默认是 `assets`目录
    context: './assets',
    // 模版相关配置
    template: {
      // ...
    },
    // 脚本相关配置
    script: {
      // ...
    },
    // 样式相关配置
    style: {
      // ...
    },
    // 图片相关配置
    image: {
      // ...
    },
    // 需要复制的资源，例如：音频或者视频以及其他文件
    copies: [
      {
        // ...
      }
    ]
  }
}
```

* `assets.context` 该配置项指定了静态资源的目录，`assets`中所有资源相关配置中的 `src` 和 `dest` 都相对于该目录，默认是以下配置：

```js
module.exports = {
  assets: {
    context: './assets'
  }
}
```

* `assets.script.vendor` 中包含了第三方模块打包的相关配置，其中的`modules`用于指定哪些模块被打包到`vendor`中，例如：

```js
module.exports = {
  assets: {
    script: {
      vendor: {
        modules: ['axios', 'moment', 'vue']
      }
    }
  }
}
```

> 默认情况下，只打包`@babel/polyfill`，该模块会强制被打包到vendor包中，**若引入的第三方模块是按需加载的模块，则不应配置在此处**

* `assets.script.alias` 用于设置路径引用时的别名，默认是以下配置：

```js
module.exports = {
  assets: {
    script: {
      alias: {
        '@': path.resolve(context), // 此处指定的 context 为 assets.context 的值
        'vue$': 'vue/dist/vue.esm.js'
      }
    }
  }
}
```

* `assets.script.cssModules` 用于设置是否开启[css modules](https://github.com/css-modules/css-modules)，默认是以下配置：

```js
module.exports = {
  assets: {
    script: {
      cssModules: true
    }
  }
}
```

* `assets.revision` 中的`qs`是用来控制构建系统如何生成版本号，如果为true，则版本号会附加在静态资源引用路径中的`querystring`，如果为false，则版本号会附加到文件名中。如下示例：

  - `true` => `/assets/img/foo.png?v=fb9b032790`
  - `false` => `/assets/img/foo-fb9b032790.png`

> 在文件名中添加版本号通常用于静态资源的`非覆盖式发布`。

* `assets.copies` 是一个数组，默认会将目录`assets/font`和`assets/symbol`中的文件进行拷贝，输出到`output.path`指定的目录中，你可以自己向其中添加一些其他拷贝文件的操作，例如：

```js
module.exports = {
  assets: {
    copies: [
      {
        src: 'media/**/*.{mp4,wav}',
        dest: 'media/',
        useHash: false
      }
    ]
  }
}
```

> `copies`的配置会与默认配置项进行`concat`操作，所以`assets/font`和`assets/symbol`并不会被覆盖掉。

> 在copies配置中的每一项会有一个`useHash`配置项，它指定了该静态资源是否使用hash版本号，若为false，则该资源将不会计入到 `assets.revision.manifest`指定的文件中。

### iconBuilder 配置

该配置项作用于图标生成器，主要用于生成`SVG Symbols`或`iconfont`

```js
module.exports = {
  iconBuilder: {
    docDir: './docs',
    symbols: {
      // 图标原文件，通常是svg文件
      src: 'icon/symbols/**/*.svg',
      // SVG Symbols，默认生成到资源目录下的symbol目录
      dest: path.join(context, 'symbol'),
      // SVG Symbols 文件名，不需要写后缀
      name: 'icon-symbols',
      // 使用文档输出路径
      doc: './docs/svg-symbols/demo.html'
    },
    iconfont: {
      // 图标原文件，通常是svg文件
      src: 'icon/fonts/**/*.svg',
      // iconfont，默认生成到资源目录下的font目录
      dest: path.join(context, 'font'),
      // iconfont 文件名，不需要写后缀
      name: 'iconfont',
      // iconfont样式文件输出目录，默认生成到资源目录下的css目录
      style: path.join(context, 'css'),
      // 使用文档输出路径
      doc: './docs/iconfont/demo.html'
    }
  }
}
```

### svg symbols使用方式

在需要使用svg symbols的页面中引入通过`npm run symbols:gen`命令生成的脚本文件

```html
<!-- build:js /assets/symbols/icon-symbols.js -->
<script src="/assets/symbol/icon-symbols.js"></script>
<!-- endbuild -->
```

然后使用如下代码来引用图标：

```xml
<svg role="img">
  <use xlink:href="#icon-图标名称"></use>
</svg>
```

### iconfont使用方式

在吸引使用iconfont的页面中引入通过`npm run iconfont:gen`命令生成的样式文件

```html
<!-- build:css /assets/css/iconfont.css -->
<link rel="stylesheet" href="/assets/css/iconfont.css">
<!-- endbuild -->
```

然后使用如下代码来引用图标：

```html
<span class="icon-图标名称"></span>
```

**这两个命令会在项目目录下生成`docs`目录用于存放图标的使用文档。**

## 模版

你可以随意使用如：`Velocity`、`Freemarker`、`Nunjucks`、`Pug`、`Jinja2` 等等模版引擎，由于模版的多样性导致我们无法动态的为模版插入其依赖的样式与脚本，所以我们需要使用[useref](https://github.com/jonkemp/useref)的语法对资源的引入进行管理，接下来将用`Velocity`模版作为例子：

`views/layout.vm`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta content="yes" name="apple-mobile-web-app-capable">
  <meta content="yes" name="apple-touch-fullscreen">
  <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <meta name="format-detection" content="telephone=no, email=no">
  <title>$!{title}</title>
  <meta name="description" content="$!{description}">
  <meta name="keywords" content="$!{keywords}">
  <!-- build:css /assets/css/base.css inline -->
  <link rel="stylesheet" href="/assets/css/common/reset.css">
  <link rel="stylesheet" href="/assets/css/iconfont.css">
  <link rel="stylesheet" href="/dist/assets/css/common/base.css">
  <link rel="stylesheet" href="/dist/assets/css/common.css">
  <link rel="stylesheet" href="/dist/assets/css/vue-components.css">
  <!-- endbuild -->
  $!{head}
</head>
<body>
  $!{body}
  #if($bodyScript)
  <!-- build:js /assets/js/runtime.js -->
  <script src="/dist/assets/js/webpack-runtime.js"></script>
  <!-- endbuild -->
  <!-- build:js /assets/js/vendor.js -->
  <script src="/dist/assets/js/vendor.js"></script>
  <!-- endbuild -->
  <!-- build:js /assets/js/common.js -->
  <script src="/dist/assets/js/common.js"></script>
  <script src="/dist/assets/js/vue-components.js"></script>
  <!-- endbuild -->
  #end
  $!{bodyScript}
</body>
</html>
```

`views/index.vm`

```html
#set($layout = "layout.vm")
#set($title = "example")

#define($head)
<!-- build:css /assets/css/index.css -->
<link rel="stylesheet" href="/dist/assets/css/index.css">
<!-- endbuild -->
#end

#define($body)
<section class="container">
  <h1>Hello World</h1>
</section>
#end

#define($bodyScript)
<!-- build:js /assets/js/index/main.js -->
<script src="/dist/assets/js/index/main.js"></script>
<!-- endbuild -->
#end
```

在以上模版中我们看到许多的

```
<!-- build:<type>(alternate search path) <path> <parameters> -->
... HTML Markup, list of script / link tags.
<!-- endbuild -->
```

在`useref`中，它被称之为`block`，在`block`中的资源将被合并成一个文件，关于`useref`对块以及使用方式的具体介绍请[点击这里](https://github.com/jonkemp/useref)

同时对于移动端来说一些小文件的样式或者脚本没有必要外链资源，为此你需要在`useref`的`block`中加入`inline`参数，如下：

```html
<!-- build:js /assets/js/index/main.js inline -->
<script src="/dist/assets/js/index/main.js"></script>
<!-- endbuild -->
```

它将被内嵌到模版中，避免了在移动端等弱网环境下请求不必要的小文件带来的高延迟问题。

## CSS Sprites

该功能之在生产环境下使用

使用此功能需要在css中的图片引用路径后面加上`?__group=[groupName]`, 此处的`groupName`表示当前图片将合并到哪个分组中，分组名相同的图片引用会合并到一张图中，如下示例：

```css
/* input */
.foo {
  background: url(/assets/img/foo@2x.png?__group=baz) no-repeat;
}

.bar {
  background: url(/assets/img/bar@2x.png?__group=baz) no-repeat;
}

/* output */
.foo, .bar {
  background-image: (/assets/img/baz@2x.png);
  background-size: 200px 200px;
}

.foo {
  background-position: 0 0;
}

.bar {
  background-position: -100px -100px;
}
```
