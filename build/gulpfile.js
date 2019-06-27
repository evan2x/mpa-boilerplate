const path = require('path');
const minimist = require('minimist');
const gulp = require('gulp');
const _ = require('lodash');
const defaultConfig = require('./config.default');
const util = require('./util');

const argv = minimist(process.argv.slice(2));
const config = _.mergeWith(
  defaultConfig, 
  util.getUserConfig(argv.buildfile || path.resolve('build.config.js')),
  (c1, c2) => Array.isArray(c1) ? c1.concat(c2) : void 0
);
const {
  clean,
  vendor,
  script,
  style,
  image,
  tmpl,
  copies,
  watch,
  replaceRefs
} = require('./tasks/general')(config, process.env.NODE_ENV !== 'production');
const {
  cleanRevManifest,
  scriptRev,
  styleRev,
  imageRev,
  copiesRev,
  tmplRev
} = require('./tasks/revision')(config);
const {
  symbolsGenerate,
  iconfontGenerate
} = require('./tasks/misc')(config);

replaceRefs.displayName = 'replace:refs';
symbolsGenerate.displayName = 'symbols:gen';
iconfontGenerate.displayName = 'iconfont:gen';
cleanRevManifest.displayName = 'clean:rev:manifest';
scriptRev.displayName = 'script:rev';
styleRev.displayName = 'style:rev';
imageRev.displayName = 'image:rev';
copiesRev.displayName = 'copies:rev';
tmplRev.displayName = 'tmpl:rev';

/* exports.script = script;
exports.style = style;
exports.tmpl = tmpl;
exports.replaceRefs = replaceRefs;
exports.image = image;

exports.cleanRevManifest = cleanRevManifest;
exports.scriptRev = scriptRev;
exports.styleRev = styleRev;
exports.imageRev = imageRev;
exports.copiesRev = copiesRev;
exports.tmplRev = tmplRev; */

const build = gulp.series(
  clean,
  vendor,
  gulp.parallel(
    script,
    style,
    image,
    copies
  ),
  tmpl,
  replaceRefs,
  cleanRevManifest,
  imageRev,
  copiesRev,
  styleRev,
  scriptRev,
  tmplRev
);

exports.symbolsGenerate = symbolsGenerate;
exports.iconfontGenerate = iconfontGenerate;
exports.clean = clean;
exports.vendor = vendor;
exports.watch = watch;
exports.build = build;
