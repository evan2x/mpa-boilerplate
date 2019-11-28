const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const tildify = require('tildify');
const log = require('fancy-log');
const glob = require('glob');
const glob2base = require('glob2base');
const isValidGlob = require('is-valid-glob');
const _ = require('lodash');

/**
 * 读取用户配置
 * @param {String} filepath 配置文件路径
 * @return {Object}
 * @todo 配置文件如果返回的是一个函数，那么会立即调用它且使用它的返回值
 */
function getUserConfig(filepath) {
  if (!filepath) return {};

  if (!path.isAbsolute(filepath)) {
    filepath = path.join(process.cwd(), filepath);
  }

  if (fs.existsSync(filepath)) {
    try {
      let config = require(filepath);

      if (_.isFunction(config)) {
        config = config();
      }

      log('Using buildfile %s', chalk.magenta(tildify(filepath)));

      return config;
    } catch (_) {}
  }

  return {};
}

/**
 * 遍历globs
 * @param {String|Array<String>} globs 
 * @param {Function} callback 
 * @return {String|Array<String>}
 */
function traverseGlob(globs, callback) {
  if (!isValidGlob(globs)) {
    throw new Error(`Invalid arguments: ${globs}`);
  }

  if (Array.isArray(globs)) {
    return globs.map(callback);
  }

  return callback(globs);
}

/**
 * 拼接 context 和 globs
 * @param {String} context 
 * @param {String|Array<String>} globs
 * @return {String|Array<String>}
 */
function joinContextToGlob(context, globs) {
  return traverseGlob(globs, pattern => path.posix.join(context, pattern));
}

/**
 * 获取globs的目录
 * @param {String|Array<String>} globs
 * @return {String|Array<String>}
 */
function dirnameGlob(globs) {
  return traverseGlob(globs, pattern => path.posix.dirname(pattern));
}

/**
 * 获取globs的后缀
 * @param {*} globs 
 * @param {String|Array<String>} globs
 * @return {String|Array<String>}
 */
function extnameGlob(globs) {
  return traverseGlob(globs, pattern => (
    path.posix.extname(pattern).slice(1).replace(/^{+|}+$/g, '').split(',')
  ))
}

/**
 * 生成资源解解析器
 * @param {String} context 源文件根目录
 * @param {String} output 输出文件根目录
 * @param {Boolean} isRevision 是否为revision模式，如果为true则从输出目录匹配资源
 * @return {Function}
 */
function assetResolver(context, output, isRev = false) {
  let sourceContext = context;

  if (isRev) {
    sourceContext = path.posix.join(output, sourceContext);
  }

  /**
   * @param {Object} asset 资源配置，必须包含`src`和`dest`属性
   */
  return (asset) => {
    const { src, dest } = asset;

    if (src == null || dest == null) {
      throw new Error('Invalid src or dest')
    }
    
    return {
      globs: joinContextToGlob(sourceContext, src),
      out: path.posix.join(output, context, dest)
    }
  }
}

/**
 * 检查vendor包是否存在
 * @param {String} output 
 * @param {Object} assets 
 * @return {Boolean}
 */
function checkVendor(output, assets) {
  const manifestPath = path.resolve(assets.vendor.manifest, 'vendor.json');

  if (!fs.existsSync(manifestPath)) {
    console.log('');
    console.error(chalk.red('[Webpack] The vendor manifest is missing. Please run `npm run vendor`\n'));
    return false;
  }
  
  const manifest = require(manifestPath);
  const vendorPath = path.resolve(output, assets.dest, `${manifest.name}.js`);

  if (!fs.existsSync(vendorPath)) {
    console.log('');
    console.error(chalk.red('[Webpack] The vendor file is missing. Please run `npm run vendor`\n'));
    return false;
  }

  return true;
}

/**
 * 生成一个从entry中提取name的函数
 * @param {String|Array<String>} globs
 * @return {Function} entry2name
 */
function getNameByEntry(globs) {
  const baseList = traverseGlob(globs, pattern => glob2base(new glob.Glob(pattern)));

  return (entry) => {
    let base = baseList;

    if (Array.isArray(baseList)) {
      base = baseList.find(b => name.indexOf(b) === 0);
    }

    return path.relative(base, entry.replace(path.extname(entry), ''));
  }
}

/**
 * 使用globs生成webpack entries
 * @param {String|Array<String>} globs
 * @return {Object}
 */
function webpackEntries(globs, baseModules = []) {
  const entries = glob.sync(globs, {
    matchBase: true
  });
  const entry2name = getNameByEntry(globs);

  return entries.reduce((acc, entry) => {
    name = entry2name(entry);

    acc[name] = baseModules.concat([path.resolve(entry)]);
    return acc;
  }, {});
}

/**
 * webpack stats 处理器
 * @param {Error} err 
 * @param {Object} stats 
 * @return {Promise}
 */
function webpackHandler(err, stats, watch = false) {
  return new Promise((resolve, reject) => {
    if (err) {
      reject(err);
      return;
    }

    const info = stats.toJson({
      errorDetails: false,
      moduleTrace: false
    });
  
    if (stats.hasErrors()) {
      console.error(chalk.redBright(info.errors), '\n');
      reject(info.errors);
      return;
    }

    if (stats.hasWarnings()) {
      console.warn(chalk.yellowBright(info.warnings), '\n');
    }
    
    if (!watch) {
      console.info(stats.toString({
        modules: false,
        children: false,
        colors: true
      }), '\n');
    }

    resolve();
  });
}

/**
 * 获取多个路径的相同父目录
 * @param {Array} filepaths 
 * @return {String}
 */
function sameParentPath(filepaths) {
  let parent = '';
  let tester = '';

  if (Array.isArray(filepaths) && filepaths[0]) {
    const casual = filepaths[0].split(path.sep);

    for (let i = 0; i < casual.length; i++) {
      tester += `${casual[i]}${path.sep}`;
  
      for (let j = 0; j < filepaths.length; j++) {
        if (!filepaths[j].startsWith(tester)) {
          return parent;
        }
      }

      parent = tester;
    }
  }

  return parent;
}

/**
 * 创建一个用于替换前缀的资源表
 * @param {Array} globs 
 * @param {Object} options 
 * @param {String} options.context 
 * @param {String} options.publicPath
 * @return {Object} 
 * @example
 * {
 *   "assets/js/main.js": "${publicPath}/assets/js/main.js"
 * }
 */
function createReplacementManifest(globs, {
  cwd = '',
  publicPath = ''
}) {
  if (publicPath === '' || publicPath == null) return {};

  return globs.reduce((acc, cur) => (
    acc.concat(glob.sync(cur, { 
      nodir: true, 
      cwd
    })
  )), []).reduce((acc, cur) => {
    acc[cur] = path.posix.join(publicPath, cur);
    return acc;
  }, {});
}

/**
 * 根据文件路径创建一个空文件
 * @param {String} filepath 
 * @return {Boolean}
 */
function createEmptyFile(filepath) {
  try {
    const dir = path.dirname(filepath);

    if (!fs.existsSync(dir)) {
      mkdirp.sync(dir);
    }

    fs.writeFileSync(filepath, '');
  } catch (_) {
    return false;
  }

  return true;
}

exports.getUserConfig = getUserConfig;
exports.traverseGlob = traverseGlob;
exports.joinContextToGlob = joinContextToGlob;
exports.dirnameGlob = dirnameGlob;
exports.extnameGlob = extnameGlob;
exports.assetResolver = assetResolver;
exports.checkVendor = checkVendor;
exports.getNameByEntry = getNameByEntry;
exports.webpackEntries = webpackEntries;
exports.webpackHandler = webpackHandler;
exports.sameParentPath = sameParentPath;
exports.createReplacementManifest = createReplacementManifest;
exports.createEmptyFile = createEmptyFile;
