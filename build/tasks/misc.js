const path = require('path');
const gulp = require('gulp');
const cheerio = require('gulp-cheerio');
const svgSymbols = require('gulp-svg-symbols');
const filter = require('gulp-filter');
const rename = require('gulp-rename');
const iconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');

module.exports = function (config) {
  const icon = config.iconBuilder;

  function symbolsGenerate() {
    const { symbols } = icon;
    const name = `${symbols.name}.svg`;
    const tmpl = path.resolve(__dirname, '../templates/svg-symbols.html');
    const SVGFilter = filter(file => /\.svg$/.test(file.path), {
      restore: true
    });
    const HTMLFilter = filter(file => /\.html$/.test(file.path), {
      restore: true
    });

    return gulp.src(icon.src)
      .pipe(cheerio({
        run($) {
          $('style').remove();
          $('[class]').removeAttr('class');
          $('[id]').removeAttr('id');
          $('[fill]').removeAttr('fill');
          $('[stroke]').removeAttr('stroke');
        },
        parserOptions: {
          xmlMode: true
        }
      }))
      .pipe(svgSymbols({
        templates: ['default-svg', tmpl],
        transformData(svg, data) {
          let filePath = path.posix.join(symbols.dest, name);

          if (!filePath.startsWith('/')) {
            filePath = `/${filePath}`;
          }

          return {
            id: data.id,
            className: data.className,
            width: '48px',
            height: '48px',
            filePath
          };
        }
      }))
      .pipe(SVGFilter)
      .pipe(rename(name))
      .pipe(gulp.dest(symbols.dest))
      .pipe(SVGFilter.restore)
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

    return gulp.src(icon.src)
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
          .pipe(consolidate('lodash', Object.assign({}, data, {
            fontPath
          })))
          .pipe(rename(`${font.name}.css`))
          .pipe(gulp.dest(font.style));

        // 生成iconfont文档样式
        gulp.src(tmpl.css)
          .pipe(consolidate('lodash', Object.assign({}, data, {
            fontPath: ''
          })))
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
