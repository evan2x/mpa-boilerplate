const gulp = require('gulp');
const config = require('./config');

const {
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
exports.server = server;
exports.build = build;
