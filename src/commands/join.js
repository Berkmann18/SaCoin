const {succ, warn, error} = require('nclr');
const checkPw = require('./pwck');
const Wallet = require('./wallet');

module.exports = (vorpal, blockchain) => (args, cb) => {
  vorpal.activeCommand
    .prompt({
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
    })
    .then(
      ans => {
        user.wallet = new Wallet(blockchain, ans.pwd);
        succ('Welcome fellow user!');
      },
      err => error(err)
    )
    /* eslint-disable-next-line no-unused-vars */
    .then(_ => cb());
};
