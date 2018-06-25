/** Taken from ServerBuilder's utils.js file */
const clr = require('colors');

const clrScheme = {
  in: 'white',
  out: 'cyan',
  inf: 'green',
  err: 'red',
  warn: 'yellow',
  debug: 'grey',
  spec: 'magenta'
};

/**
 * @description Set a colour scheme for the CLI.
 * @protected
 */
const setColours = () => clr.setTheme(clrScheme);

/**
 * @description Colourise something.
 * @param {string} name Name of the colour in the theme
 * @param {...*} data Data
 * @return {*} Coloured output
 */
const colour = (name, ...data) => {
  switch (name) {
    case 'in':
      return clr.in(...data);
    case 'out':
      return clr.out(...data);
    case 'inf':
      return clr.inf(...data);
    case 'err':
      return clr.err(...data);
    case 'warn':
      return clr.warn(...data);
    case 'debug':
      return clr.debug(...data);
    case 'spec':
      return clr.spec(...data);
    default:
      return error(`The name ${name} isn't specified in the theme used`);
  }
};

module.exports = setColours;