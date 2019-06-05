module.exports = {
  env: {
    es6: true,
    node: true
  },
  plugins: ['security', 'jquery'],
  extends: [
    'eslint:recommended',
    'plugin:security/recommended',
    'plugin:you-dont-need-lodash-underscore/compatible',
    'plugin:node/recommended',
    'plugin:jquery/slim'
  ],
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error'],
    'no-console': 'off',
    'no-extra-semi': 'off',
    'prefer-const': 'error',
    quotes: ['error', 'single'],
    'no-trailing-spaces': ['error'],
    'symbol-description': ['warn']
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 8
  }
};
