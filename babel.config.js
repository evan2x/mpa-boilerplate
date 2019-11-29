module.exports = (api) => {
  api.cache(true);
  return {
    'presets': [
      ['@babel/preset-env', 
        {
          modules: false,
          loose: true
        }
      ]
    ],
    'plugins': [
      "transform-vue-jsx",
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-syntax-import-meta',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-json-strings',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-throw-expressions',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      ['@babel/plugin-transform-runtime', {
        corejs: false,
        helpers: true,
        regenerator: false,
        useESModules: false
      }],
      'lodash'
    ]
  };
};
