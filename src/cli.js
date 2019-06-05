'use strict';
/**
 * @fileoverview CLI.
 * @module
 */

const vorpal = require('vorpal')();
const join = require('./commands/join');
const inf = require('./commands/info');
const Blockchain = require('./blockchain');

const SXC = new Blockchain();
const user = {
  wallet: null
  // peers: []
};

// @todo Implement: mining, sending transactions, checking balance, discovering peers
// vorpal
//   .command('mine', 'Mine a block')
//   .action((args, cb) => {
//     throw new Error('Not implemented yet')
//     // cb();
//   })
vorpal.command('join', 'Join the network').action(join(vorpal, SXC));

vorpal.command('info', 'User information').action(inf(user, SXC));

vorpal.delimiter('sacoin$').show();
