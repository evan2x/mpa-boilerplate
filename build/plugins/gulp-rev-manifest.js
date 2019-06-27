/**
 * Forked from the manifest in the gulp-rev
 */
const path = require('path');
const through = require('through2');
const vinylFile = require('vinyl-file');
const Vinyl = require('vinyl');
const sortKeys = require('sort-keys');

function relPath(base, filePath) {
  filePath = filePath.replace(/\\/g, '/');
  base = base.replace(/\\/g, '/');

  if (!filePath.startsWith(base)) {
    return filePath;
  }

  const newPath = filePath.slice(base.length);

  if (newPath[0] === '/') {
    return newPath.slice(1);
  }

  return newPath;
}

const getManifestFile = opts => vinylFile.read(opts.path, opts).catch((error) => {
  if (error.code === 'ENOENT') {
    return new Vinyl(opts);
  }

  throw error;
});

module.exports = function (pth, opts) {
  if (typeof pth === 'string') {
    pth = { path: pth };
  }

  opts = Object.assign({
    qs: false,
    path: 'rev-manifest.json',
    merge: false,
    transformer: JSON
  }, opts, pth);

  let manifest = {};

  return through.obj((file, enc, next) => {
    // Ignore all non-rev'd files
    if (!file.path || !file.revOrigPath) {
      next();
      return;
    }

    let filepath = file.path;

    if (opts.qs) {
      filepath = file.revOrigPath;
    }

    const revisionedFile = relPath(path.resolve(file.cwd, file.base), path.resolve(file.cwd, filepath));
    const originalFile = path.join(path.dirname(revisionedFile), path.basename(file.revOrigPath)).replace(/\\/g, '/');
    manifest[originalFile] = revisionedFile + (opts.qs ? `?v=${file.revHash}` : '');

    next();
  }, function (next) {
    // No need to write a manifest file if there's nothing to manifest
    if (Object.keys(manifest).length === 0) {
      next();
      return;
    }

    getManifestFile(opts).then((manifestFile) => {
      if (opts.merge && !manifestFile.isNull()) {
        let oldManifest = {};

        try {
          oldManifest = opts.transformer.parse(manifestFile.contents.toString());
        } catch (err) {}

        manifest = Object.assign(oldManifest, manifest);
      }

      manifestFile.contents = Buffer.from(opts.transformer.stringify(sortKeys(manifest), null, '  '));
      this.push(manifestFile);
      next();
    }).catch(next);
  });
};
