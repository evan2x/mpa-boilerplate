const path = require('path');
const atImport = require('postcss-import');
const willChange = require('postcss-will-change');
const nested = require('postcss-nested');
const presetEnv = require('postcss-preset-env');
const sprites = require('postcss-sprites');
const cssnano = require('cssnano');

/**
 * 匹配CSS Sprites 图片分组的正则
 * @type {RegExp}
 */
const groupRE= /\?__group=([^\\/]+)$/;

module.exports = function (config, debug, imageWalker) {
  const { output: { path: outputDir }, assets, assets: { context } } = config;
  const stylesheetPath = path.posix.join(outputDir, context, assets.style.dest);
  const spritePath = path.posix.join(outputDir, context, assets.image.dest);
  let referencePath = path.posix.join(context, assets.image.dest);

  if (!referencePath.startsWith('/')) {
    referencePath = `/${referencePath}`;
  }
  
  return {
    plugins: [
      atImport({
        path: config.assets.context
      }),
      willChange(),
      nested(),
      presetEnv({
        preserve: false,
        features: {
          'nesting-rules': true,
          'color-mod-function': true
        },
        browserslist: [
          'last 3 versions',
          '> 1% in CN',
          'Firefox ESR',
          'opera 12.1',
          'ie >= 9',
          'edge >= 12',
          'safari >= 7'
        ]
      })
    ].concat(debug ? [] : [
      sprites({
        stylesheetPath,
        spritePath,
        retina: true,
        spritesmith: {
          padding: 1
        },
        hooks: {
          onUpdateRule(rule, token, image) {
            const { ratio, coords, spriteWidth, spriteHeight } = image;
            const posX = -1 * Math.abs(coords.x / ratio);
            const posY = -1 * Math.abs(coords.y / ratio);
            const sizeX = spriteWidth / ratio;
            const sizeY = spriteHeight / ratio;
            const spritePath = path.posix.join(referencePath, path.basename(image.spritePath));

            token.cloneAfter({
              type: 'decl',
              prop: 'background-image',
              value: `url(${spritePath})`
            }).cloneAfter({
              prop: 'background-position',
              value: `${posX}px ${posY}px`
            }).cloneAfter({
              prop: 'background-size',
              value: `${sizeX}px ${sizeY}px`
            });
          },
          onSaveSpritesheet(opts, spritesheet) {
            const groups = [];
            const scaleFactors = [];

            spritesheet.groups.forEach(group => {
              if (/^@\d+x$/.test(group)) {
                scaleFactors.push(group);
              } else {
                groups.push(group);
              }
            });
            
            const filename = groups.join('.') + scaleFactors.join('.') + '.' + spritesheet.extension;
			      return path.join(opts.spritePath, filename);
          }
        },
        filterBy(image) {
          if (groupRE.test(image.originalUrl)) {
            return Promise.resolve();
          }

          return Promise.reject();
        },
        groupBy(image) {
          const group = image.originalUrl.match(groupRE);
          if (group && group[1]) {
            return Promise.resolve(group[1]);
          }

          return Promise.reject();
        }
      }),
      cssnano()
    ])
  }
}
