module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "plugins": ["security"],
  "extends": "plugin:security/recommended",
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error"
    ],
    "no-console": "off",
    "no-extra-semi": "off",
    "prefer-const": "off",
    "quotes": [
      "error",
      "single"
    ],
    "no-trailing-spaces": [
      "error"
    ],
    "symbol-description": [
      "warn"
    ]
  },
  "parserOptions": {
    "sourceType": "module"
  }
};