/** Taken from ServerBuilder's utils.js file */
const clr = require('colors/safe');

const clrScheme = {
  in: 'white',
  out: 'cyan',
  inf: 'green',
  err: 'red',
  warn: 'yellow',
  debug: 'grey',
  block: 'bgCyan',
  tx: ['white', 'underline'],
  chain: ['green', 'bold']
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
 * @throws {Error} Unspecified name
 */
const colour = (name, ...data) => {
  if (name in clrScheme) return eval(`clr.${name}(...data)`);
  throw new Error(`The name ${name} isn't specified in the theme used`);
};

/* @todo Add the commander/yarg function for CLI usage */

module.exports = {setColours, colour, clrScheme};