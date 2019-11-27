const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: ['airbnb-base', 'plugin:vue/essential'],
  rules: {
    'no-continue': OFF,
    'consistent-return': OFF,
    'no-cond-assign': OFF,
    'no-plusplus': OFF,
    'quote-props': OFF,
    'prefer-const': OFF,
    'func-names': OFF,
    'max-len': OFF,
    'no-param-reassign': OFF,
    'no-return-assign': OFF,
    'comma-dangle': [ERROR, 'only-multiline'],
    'no-underscore-dangle': [ERROR, { allow: ['__GLOBAL_CONFIG__'] }],
    'no-unused-vars': [ERROR, { args: 'after-used', varsIgnorePattern: 'app' }],
    'no-empty': [ERROR, { allowEmptyCatch: true }],
    'import/no-extraneous-dependencies': OFF,
    'import/extensions': OFF,
    'import/no-unresolved': OFF,
    'import/prefer-default-export': OFF,
    'vue/html-closing-bracket-newline': [ERROR, {
      singleline: 'never',
      multiline: 'never'
    }]
  },
  env: {
    node: true,
    browser: true,
    es6: true,
    worker: true,
    serviceworker: true
  },
  globals: {
    '__GLOBAL_CONFIG__': 'readonly'
  }
}
