const path = require('path');
const minimist = require('minimist');
const _ = require('lodash');
const util = require('./util');
const defaultConfig = require('./config.default');

const argv = minimist(process.argv.slice(2));

module.exports = _.mergeWith(
  defaultConfig,
  util.getUserConfig(argv.buildfile || path.resolve('build.config.js')),
  (c1, c2) => (Array.isArray(c1) ? c1.concat(c2) : undefined)
);
