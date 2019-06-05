const Spinner = require('clui').Spinner;

const loader = new Spinner('Mining....');

const mine = (user, blockchain) => (args, cb) => {
  loader.start();
  blockchain.minePendingTransactions(user.wallet);
  loader.stop();
  cb();
};

module.exports = mine;
