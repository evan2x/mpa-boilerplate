const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const changed = require('gulp-changed');
const gulpif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const imagemin = require('gulp-imagemin');
const webpack = require('webpack');
const _ = require('lodash');
const log = require('fancy-log');
const chalk = require('chalk');
const figures = require('figures');
const prettyTime = require('pretty-time');
const childProcess = require('child_process');
const useref = require('gulp-useref');
const inlinesource = require('gulp-inline-source');
const filter = require('gulp-filter');
const through = require('through2');
const del = require('del');
const terser = require('terser');
const cssnano = require('cssnano');
const timer = require('../plugins/gulp-timer');
const replace = require('../plugins/gulp-replace');
const util = require('../util');
const getWebpackVendorConfig = require('../webpack/vendor.config');
const getWebpackConfig = require('../webpack/config');
const getPostcssConfig = require('../postcss.config');

/* eslint-disable no-console */

module.exports = function (config, debug) {
  const { output: { path: outputDir, publicPath }, assets, assets: { context } } = config;
  const baseModules = ['core-js/stable', 'regenerator-runtime/runtime'];
  const postcssConfig = getPostcssConfig(config, debug);
  const webpackVendorConfig = getWebpackVendorConfig(assets.script, debug, baseModules);
  const webpackConfig = getWebpackConfig(config, postcssConfig, debug);
  const resolveAsset = util.assetResolver(context, outputDir);
  const watched = { script: false, style: false };
  let watchMode = process.env.WATCH_MODE === 'true';

  /**
   * 删除构建后的资源
   * @type {Task}
   */
  function clean() {
    return del([config.output.path]);
  }

  /**
   * 打包第三方模块
   * @type {Task}
   */
  function vendor(done) {
    webpackVendorConfig.output.path = path.resolve(outputDir, context, assets.script.dest);
    webpack(webpackVendorConfig, (err, stats) => {
      util.webpackHandler(err, stats).then(() => {
        if (_.isFunction(done)) done();
      });
    });
  }

  /**
   * 打包JavaScript
   * @type {Task}
   */
  function script(done) {
    // 检查vendor是否已打包
    if (!util.checkVendor(path.join(outputDir, context), assets.script)) {
      process.exit(1);
    }

    const { globs, out } = resolveAsset(assets.script);

    webpackConfig.watch = watchMode;
    webpackConfig.entry = util.webpackEntries(globs, baseModules);
    webpackConfig.output.path = path.resolve(out);

    return webpack(webpackConfig, (err, stats) => {
      util.webpackHandler(
        err,
        stats,
        watchMode
      ).then(() => {
        if (_.isFunction(done)) done();
      });
    });
  }

  /**
   * 用于处理页面样式而非组件样式，组件的样式通常使用webpack打包
   * @type {Task}
   */
  function style() {
    const { globs, out } = resolveAsset(assets.style);
    let total = 0;

    return gulp.src(globs)
      .pipe(changed(out))
      .pipe(gulpif(debug, sourcemaps.init()))
      .pipe(timer.start())
      .pipe(postcss(() => postcssConfig).on('error', (err) => {
        console.log('Message:');
        console.error(err.message);
        if (!watchMode) {
          process.exit(1);
        }
      }))
      .pipe(timer.end(([, ns]) => {
        total += ns;
      }))
      .pipe(gulpif(debug, sourcemaps.write()))
      .pipe(gulp.dest(out))
      .on('finish', () => {
        if (total > 0) {
          console.log('');
          console.log(chalk.green(`${figures.tick} PostCSS`));
          console.log(chalk.gray(`  Compiled successfully in ${prettyTime([0, total])}`));
          console.log('');
        }
      });
  }

  /**
   * 对图像进行压缩
   * @type {Task}
   * @todo 生产环境下会压缩图片
   */
  function image() {
    const { globs, out } = resolveAsset(assets.image);

    return gulp.src(globs)
      .pipe(changed(out))
      .pipe(gulpif(!debug, imagemin([
        imagemin.gifsicle(),
        imagemin.jpegtran(),
        imagemin.optipng(),
        imagemin.svgo()
      ])))
      .pipe(gulp.dest(out));
  }

  /**
   * 复制静态资源
   * @type {Task}
   */
  function copies() {
    return Promise.all(assets.copies.map((asset) => {
      const { globs, out } = resolveAsset(asset);

      return new Promise((resolve, reject) => {
        gulp.src(globs)
          .pipe(changed(out))
          .once('finish', resolve)
          .pipe(gulp.dest(out))
          .once('error', reject);
      });
    }));
  }

  /**
   * 使用 gulp-useref, gulp-inline-source 对模版进行处理
   * @type {Task}
   */
  function tmpl(done) {
    const { globs, out } = resolveAsset(assets.template);
    const files = [];
    const inline = {};
    const prefix = path.resolve(context);

    // 用于useref，对在模版中直接引用的源代码文件进行压缩
    const optimizeAssets = () => through.obj(function (file, enc, next) {
      let isAsync = false;

      if (file.path.startsWith(prefix)) {
        if (/\.js$/.test(file.path)) {
          const result = terser.minify(file.contents.toString());
          file.contents = Buffer.from(result.code);
        }

        if (/\.css$/.test(file.path)) {
          isAsync = true;
          cssnano.process(file.contents.toString()).then((result) => {
            file.contents = Buffer.from(result.css);
            this.push(file);
            next();
          });
        }
      }

      if (!isAsync) {
        this.push(file);
        next();
      }
    });

    const afterFinish = () => {
      if (!files.length) return done();

      const fileMap = {};
      const sources = [];
      const outputs = new Set();

      files.forEach((file) => {
        if (fileMap[file]) {
          fileMap[file] += 1;
        } else {
          fileMap[file] = 1;
          sources.push(path.join(out, file));
          outputs.add(path.join(outputDir, path.dirname(file)));
        }
      });

      // 将原本打包的资源目录删除掉
      del.sync(Array.from(outputs));
      // 使用gulp将useref处理后的资源复制到资源输出目录
      gulp.src(Object.keys(fileMap), {
        cwd: path.resolve(out),
        base: out
      })
      // 过滤掉内嵌的资源
      // 若对同一资源的内嵌与引用次数不一致则不过滤
        .pipe(filter(file => inline[file.relative] !== fileMap[file.relative]))
        .pipe(gulp.dest(outputDir))
        .once('finish', () => {
        // 删除掉useref处理的资源父目录
          const parent = util.sameParentPath(sources);

          if (parent !== '' && parent !== out && parent !== outputDir) {
            del.sync(parent);
          }

          done();
        });
    };

    const userefOptions = {
      searchPath: process.cwd(),
      transformPath(p) {
        const filepath = path.normalize(p);

        // 若该文件路径不存在，则创建一个空文件
        if (!fs.existsSync(filepath)) {
          console.warn(chalk.yellowBright(`${figures.warning} The file: '${filepath}' does not exist, it will be created.`));
          util.createEmptyFile(filepath);
        }

        return filepath;
      }
    };

    gulp.src(globs)
      .pipe(debug ? useref(userefOptions) : useref(userefOptions, optimizeAssets))
      .pipe(gulpif(/\.(?:css|js)$/, through.obj(function (file, enc, next) {
        files.push(file.relative);
        this.push(file);
        next();
      })))
      .pipe(gulp.dest(out))
      .once('finish', () => {
        const outContext = path.posix.join(outputDir, context);
        // 处理内联样式/脚本
        gulp.src(util.joinContextToGlob(outContext, assets.template.src))
          .pipe(inlinesource({
            compress: false,
            rootpath: out,
            handlers: [(source, ctx) => {
              const relative = path.relative(ctx.rootpath, source.filepath);

              if (inline[relative]) {
                inline[relative] += 1;
              } else {
                inline[relative] = 1;
              }

              return Promise.resolve();
            }]
          }))
          .pipe(gulp.dest(out))
          .once('finish', afterFinish);
      });
  }

  /**
   * 替换引用路径
   * @type {Task}
   */
  function replaceRefs() {
    const script = `${path.dirname(assets.script.src)}/*${path.extname(assets.script.src)}`;
    const sourceGlobs = _.flatten([
      script,
      assets.style,
      assets.image,
      ...assets.copies
    ].map(item => path.join(context, item.src || item)));
    const manifest = util.createReplacementManifest(sourceGlobs, {
      cwd: path.resolve(outputDir),
      publicPath
    });
    const globs = _.flatten([
      script,
      assets.style,
      assets.template
    ]).map(item => path.join(context, item.src || item));
    
    return gulp.src(globs, {
        cwd: path.resolve(outputDir),
        base: outputDir
      })
      .pipe(replace(manifest))
      .pipe(gulp.dest(outputDir));
  }

  /**
   * 启动 watch 模式
   * @type {Task}
   */
  function watch(done) {
    const finish = () => {
      if (_.isFunction(done) && watched.script && watched.style) {
        done();
      }
    };

    // enable watch mode
    watchMode = true;

    // style watch
    const styleGlob = util.joinContextToGlob(context, assets.style.src);

    log(`Watching '${chalk.cyan('style')}'...`);
    style().once('finish', () => {
      watched.style = true;
      finish();
    });

    gulp.watch(styleGlob).on('all', () => {
      style();
    });

    // script watch
    const scriptGlob = util.joinContextToGlob(context, assets.script.src);
    const entry2name = util.getNameByEntry(scriptGlob);

    log(`Watching '${chalk.cyan('script')}'...`);
    let watching = script(() => {
      watched.script = true;
      finish();
    });

    gulp.watch(scriptGlob).on('add', (entry) => {
      const { compiler } = watching;
      const name = entry2name(entry);

      (new webpack.SingleEntryPlugin(
        compiler.context,
        path.resolve(entry),
        name
      )).apply(compiler);

      setTimeout(() => {
        log(`Adding entry: ${chalk.green(entry)}`);
        watching.invalidate();
      }, 1000);
    });
  }

  function server() {
    let started = false;

    watch(() => {
      if (!started) {
        childProcess.spawn('node', ['build/server.js'], {
          stdio: 'inherit'
        });
        started = true;
      }
    });
  }

  return {
    clean,
    vendor,
    script,
    style,
    image,
    tmpl,
    copies,
    watch,
    server,
    replaceRefs
  };
};
