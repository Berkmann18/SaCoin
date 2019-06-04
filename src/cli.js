'use strict';
/**
 * @fileoverview CLI.
 * @module
 */

const vorpal = require('vorpal')();
const {succ, warn, error} = require('nclr');
const Wallet = require('./wallet');
const Blockchain = require('./blockchain');
const checkPw = require('./pwck');

const SXC = new Blockchain();
const user = {
  wallet: null,
  // peers: []
}

// @todo Implement: mining, sending transactions, checking balance, discovering peers
// vorpal
//   .command('mine', 'Mine a block')
//   .action((args, cb) => {
//     throw new Error('Not implemented yet')
//     // cb();
//   })
vorpal
  .command('join', 'Join the network')
  .action((args, cb) => {
    // console.log('args=', args);
    vorpal.activeCommand.prompt({
      type: 'password',
      name: 'pwd',
      message: 'Password: ',
      validate(input) {
        const check = checkPw(input);
        if (check.score < 40) {
          warn(`\nThe password is ${check.complexity.toLowerCase()}`);
          return false;
        }
        return true;
      }
    }).then(ans => {
      user.wallet = new Wallet(SXC, ans.pwd);
      succ('Welcome fellow user!');
    }, err => error(err))
    /* eslint-disable-next-line no-unused-vars */
    .then(_ => cb())
  })

vorpal.delimiter('sacoin$').show();