const {info, use} = require('nclr');

module.exports = (user, blockchain) => (args, cb) => {
  const cur = blockchain.currency;
  info(
    `Wallet:\nAddress: ${use('info', user.wallet.address)}\nPublic key: ${use(
      'info',
      user.wallet.publicKey.pubKeyHex
    )}\nBalance: ${use('info', user.wallet.calculateBalance())} ${cur}\nUnspent balance: ${use(
      'info',
      user.wallet.unspentBalance(blockchain.utpool)
    )} ${cur}`
  );
  cb();
};
