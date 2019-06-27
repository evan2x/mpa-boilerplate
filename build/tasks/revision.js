const path = require('path');
const gulp = require('gulp');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const gulpif = require('gulp-if');
const rename = require('gulp-rename');
const del = require('del');
const _ = require('lodash');
const revDel = require('../plugins/gulp-rev-del');
const revManifest = require('../plugins/gulp-rev-manifest');
const util = require('../util');

module.exports = function (config) {
  const { output: { path: outputDir }, assets, assets: { context, revision } } = config;
  const resolveAsset = util.assetResolver(context, outputDir, true);

  /**
   * 创建修订器
   * @param {String|Array} globs
   * @param {String} out
   * @param {Boolean} rewrite
   */
  const createReviser = (globs, out, rewrite = false) => gulp.src(globs)
    .pipe(gulpif(rewrite, revRewrite({
      manifest: gulp.src(revision.manifest, { allowEmpty: true })
    })))
    .pipe(rev())
    .pipe(gulpif(revision.qs, rename((filepath) => {
      filepath.basename = filepath.basename.replace(/-[\da-z]+$/, '');
    }), revDel()))
    .pipe(gulp.dest(out))
    .pipe(revManifest(revision.manifest, {
      qs: revision.qs,
      merge: true
    }))
    .pipe(gulp.dest(path.dirname(revision.manifest)));

  function cleanRevManifest() {
    return del(revision.manifest);
  }

  /**
   * script revision
   * @type {Task}
   */
  function scriptRev() {
    const { globs, out } = resolveAsset({
      src: `${path.dirname(assets.script.src)}/*${path.extname(assets.script.src)}`,
      dest: assets.script.dest
    });

    return createReviser(globs, out, true);
  }

  /**
   * style revision
   * @type {Task}
   */
  function styleRev() {
    const { globs, out } = resolveAsset(assets.style);
    return createReviser(globs, out, true);
  }

  /**
   * image revision
   * @type {Task}
   */
  function imageRev() {
    const { globs, out } = resolveAsset(assets.image);
    return createReviser(globs, out);
  }

  /**
   * copies revision
   * @type {Task}
   */
  function copiesRev() {
    const tasks = [];

    assets.copies.forEach((asset) => {
      if (asset.useHash) {
        tasks.push(new Promise((resolve, reject) => {
          const { globs, out } = resolveAsset(asset);
          createReviser(globs, out).once('finish', resolve).once('error', reject);
        }));
      }
    });

    return Promise.all(tasks);
  }

  /**
   * template revision
   * @type {Task}
   */
  function tmplRev() {
    const { globs, out } = resolveAsset(assets.template);
    const extensions = _.flatten(util.extnameGlob(globs)).map(v => `.${v}`);

    return gulp.src(globs)
      .pipe(revRewrite({
        manifest: gulp.src(revision.manifest, { allowEmpty: true }),
        replaceInExtensions: Array.from(new Set(extensions))
      }))
      .pipe(gulp.dest(out));
  }

  return {
    cleanRevManifest,
    scriptRev,
    styleRev,
    imageRev,
    copiesRev,
    tmplRev
  };
};
