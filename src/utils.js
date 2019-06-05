'use strict';
/**
 * @fileoverview CLI related functions.
 * @module
 */

/* Taken from ServerBuilder's utils.js file */
const nclr = require('nclr');

nclr.extend({
  block: 'magenta',
  tx: ['white', 'underline'],
  chain: ['green', 'bold']
});

/**
 * @description Colourise something.
 * @param {string} name Name of the colour in the theme
 * @param {...*} data Data
 * @return {*} Coloured output
 * @throws {Error} Unspecified name
 * @see nclr#use
 */
const use = (name, ...data) => nclr.use(name, ...data);

module.exports = {
  use,
  block: nclr.block,
  tx: nclr.tx,
  chain: nclr.chain
};
