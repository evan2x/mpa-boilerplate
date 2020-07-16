const through = require('through2');
const del = require('del');

module.exports = function () {
  const dustbin = [];

  return through.obj(function (file, enc, next) {
    if (file.path && file.revOrigPath && file.path !== file.revOrigPath) {
      dustbin.push(file.revOrigPath);
    }

    this.push(file);
    next();
  }, (next) => {
    if (dustbin.length === 0) {
      next();
    } else {
      del(dustbin, { force: true }).then(() => {
        next();
      }).catch(next);
    }
  });
};
