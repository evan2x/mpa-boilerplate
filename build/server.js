const express = require('express');
const compression = require('compression');
const proxy = require('http-proxy-middleware');
const chalk = require('chalk');
const _ = require('lodash');
const { server: serverConfig } = require('./config');

const app = express();
const PORT = serverConfig.port;

function isEmptyObject(o) {
  if (_.isPlainObject(o)) {
    return Object.keys(o).length === 0;
  }

  return false;
}

function traverseObject(o, iterator) {
  if (isEmptyObject(serverConfig.public)) {
    return false;
  }

  Object.keys(o).forEach(key => {
    iterator(key, o[key]);
  });
}

traverseObject(serverConfig.public, (key, value) => {
  app.use(key, express.static(value));
});

app.use(express.static(serverConfig.view));

traverseObject(serverConfig.proxy, (key, value) => {
  app.use(key, proxy(value));
});

app.use(compression());

app.listen(PORT, '0.0.0.0', () => {
  console.info(`Server is running here: ${chalk.cyan(`http://127.0.0.1:${chalk.bold(PORT)}`)}`)
});
