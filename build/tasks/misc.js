const path = require('path');
const gulp = require('gulp');
const cheerio = require('gulp-cheerio');
const svgSymbols = require('gulp-svg-symbols');
const filter = require('gulp-filter');
const rename = require('gulp-rename');
const iconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const postcss = require('postcss');

module.exports = function (config) {
  const icon = config.iconBuilder;

  function symbolsGenerate() {
    const { symbols } = icon;
    const name = `${symbols.name}.js`;
    const symbolTmpl = path.resolve(__dirname, '../templates/svg-symbols.js');
    const tmpl = path.resolve(__dirname, '../templates/svg-symbols.html');
    const SymbolFilter = filter((file) => /\.js$/.test(file.path), {
      restore: true
    });
    const HTMLFilter = filter((file) => /\.html$/.test(file.path), {
      restore: true
    });

    return gulp.src(symbols.src)
      .pipe(cheerio({
        run($) {
          const style = $('style').text();

          postcss.parse(style).walkDecls((delc) => {
            if (delc.parent) {
              $(delc.parent.selector).attr('style', delc.toString()).removeAttr('class');
            }
          });
        },
        parserOptions: {
          xmlMode: true
        }
      }))
      .pipe(svgSymbols({
        templates: [symbolTmpl, tmpl],
        transformData(_, defaultData) {
          const prefix = 'icon-';

          return {
            ...defaultData,
            id: prefix + defaultData.id,
            class: defaultData.class.slice(0, 1) + prefix + defaultData.class.slice(1)
          };
        }
      }))
      .pipe(SymbolFilter)
      .pipe(rename(name))
      .pipe(gulp.dest(symbols.dest))
      .pipe(gulp.dest(path.dirname(symbols.doc)))
      .pipe(SymbolFilter.restore)
      .pipe(HTMLFilter)
      .pipe(rename(path.basename(symbols.doc)))
      .pipe(gulp.dest(path.dirname(symbols.doc)));
  }

  function iconfontGenerate() {
    const font = icon.iconfont;
    const destDoc = path.dirname(font.doc);
    const tmpl = {
      css: path.resolve(__dirname, '../templates/iconfont.css'),
      html: path.resolve(__dirname, '../templates/iconfont.html')
    };

    return gulp.src(font.src)
      .pipe(iconfont({
        fontName: font.name,
        formats: font.formats,
        normalize: true,
        fontHeight: 1001,
        timestamp: Math.round(Date.now() / 1000)
      }))
      .on('glyphs', (glyphs) => {
        const data = {
          className: 'icon',
          fontName: font.name,
          glyphs
        };

        let fontPath = font.dest.split(path.sep).join(path.posix.sep);

        if (!fontPath.startsWith('/')) {
          fontPath = `/${fontPath}`;
        }

        if (!fontPath.endsWith('/')) {
          fontPath = `${fontPath}/`;
        }

        // 生成iconfont样式
        gulp.src(tmpl.css)
          .pipe(consolidate('lodash', { ...data, fontPath }))
          .pipe(rename(`${font.name}.css`))
          .pipe(gulp.dest(font.style));

        // 生成iconfont文档样式
        gulp.src(tmpl.css)
          .pipe(consolidate('lodash', { ...data, fontPath: '' }))
          .pipe(rename('style.css'))
          .pipe(gulp.dest(destDoc));

        // 生成iconfont文档
        gulp.src(tmpl.html)
          .pipe(consolidate('lodash', data))
          .pipe(rename(path.basename(font.doc)))
          .pipe(gulp.dest(destDoc));
      })
      .pipe(gulp.dest(font.dest))
      .pipe(gulp.dest(destDoc));
  }

  return {
    symbolsGenerate,
    iconfontGenerate
  };
};
