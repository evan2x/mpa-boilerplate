const through = require('through2');
const _ = require('lodash');

let startTime = null;

exports.start = function () {
  return through.obj(function (file, enc, next) {
    if (!startTime) {
      startTime = process.hrtime();
    }

    this.push(file);
    next();
  });
};

exports.end = function (callback) {
  return through.obj(function (file, enc, next) {
    if (startTime != null && _.isFunction(callback)) {
      callback(process.hrtime(startTime));
      startTime = null;
    }

    this.push(file);
    next();
  });
};
