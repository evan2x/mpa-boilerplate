const path = require('path');
const fs = require('fs');
const express = require('express');
const compression = require('compression');
const proxy = require('http-proxy-middleware');
const chalk = require('chalk');
const glob = require('glob');
const glob2base = require('glob2base');
const _ = require('lodash');
const { server: serverConfig, assets, output } = require('./config');

const app = express();
const PORT = serverConfig.port;

function isEmptyObject(o) {
  if (_.isPlainObject(o)) {
    return Object.keys(o).length === 0;
  }

  return false;
}

function traverseObject(o, iterator) {
  if (isEmptyObject(o)) {
    return false;
  }

  Object.keys(o).forEach((key) => {
    iterator(key, o[key]);
  });
}

app.use(compression());

const resources = [
  assets.context, 
  path.join(output.path, assets.context)
].reduce((acc, cur) => {
  let key = path.posix.normalize(cur);

  if (!key.startsWith('/')) {
    key = `/${key}`;
  }

  acc[key] = cur;

  return acc;
}, {});

traverseObject(resources, (key, value) => {
  app.use(key, express.static(value));
});

traverseObject(serverConfig.proxy, (key, value) => {
  app.use(key, proxy(value));
});

const { staticCompiler, src: templateResource } = assets.template;
const viewsPattern = path.relative(process.cwd(), path.resolve(assets.context, templateResource));
const viewsBase = glob2base(new glob.Glob(viewsPattern));

if (staticCompiler) {
  const nunjucks = require('nunjucks');
  
  nunjucks.configure(viewsBase, {
    watch: true
  });

  app.use(function (req, res, next) {
    let filepath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
    
    if (filepath === '' || filepath == null) {
      filepath = 'index.html';
    }
    
    if (fs.existsSync(path.join(viewsBase, filepath))) {
      nunjucks.render(filepath, {}, (err, html) => {
        if (err) {
          return next(err);
        }
  
        res.send(html);
      });
    } else {
      res.status = 404;
      next();
    }
  });
} else {
  app.use(express.static(viewsBase));
}

app.listen(PORT, '0.0.0.0', () => {
  console.info(`Server is running here: ${chalk.cyan(`http://127.0.0.1:${chalk.bold(PORT)}`)}`);
});
