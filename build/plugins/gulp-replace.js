const through = require('through2');
const PluginError = require('plugin-error');

module.exports = function (manifest) {
  const regularExpr = {};

  return through.obj(function (file, enc, next) {
    if (file.isNull()) {
      return next();
    }

    if (file.isStream()) {
      this.emit('error', new PluginError('replace', 'Streaming not supported'));
      return next();
    }

    let contents = file.contents.toString();

    Object.keys(manifest).forEach((key) => {
      if (!regularExpr[key]) {
        regularExpr[key] = new RegExp(`\\/?${key}`, 'g');
      }
      contents = contents.replace(regularExpr[key], manifest[key]);
    });

    file.contents = Buffer.from(contents);
    this.push(file);
    next();
  });
};
