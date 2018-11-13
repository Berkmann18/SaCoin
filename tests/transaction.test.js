const SHA256 = require('crypto-js/sha256'),
  { use } = require('nclr');
const Transaction = require('../src/transaction'),
  { sign, verify } = require('../src/crypto'),
  FEE = require('../src/config').TRANSACTION_FEE,
  Wallet = require('../src/wallet');

let sender = new Wallet(null, 'se'), sHash = SHA256('se'), receiver = new Wallet(null, 're'), rHash = SHA256('re'), amt = 5, sig = sign(sender.secretKey(sHash), amt.toString());
let txCfg = {
  fromAddr: sender.address,
  fromPubKey: sender.publicKey,
  toAddr: receiver.address,
  amount: amt,
  sig
}
let tx = new Transaction(txCfg);

test('Init', () => {
  expect(tx.fromAddr).toBe(sender.address);
  expect(tx.fromPubKey).toBe(sender.publicKey);
  expect(tx.toAddr).toBe(receiver.address);
  expect(tx.amount).toBe(amt);
  expect(tx.timestamp <= Date.now()).toBeTruthy();
  expect(typeof tx.hash).toBe('string');
  expect(tx.fee).toBe(FEE);
  expect(tx.sig).toBe(sig);
  expect(tx.isValid()).toBeFalsy(); //tests calculateHash() so no need to test that
  expect(tx.toString()).toBe(use('tx', `Transaction(fromAddr=${tx.fromAddr}, fromPubKey=${tx.fromPubKey}, toAddr=${tx.toAddr}, amount=${amt}, timestamp=${tx.timestamp}, fee=${FEE}, hash=${tx.hash})`));
  expect(tx.toString(false)).toBe(`Transaction(fromAddr=${tx.fromAddr}, fromPubKey=${tx.fromPubKey}, toAddr=${tx.toAddr}, amount=${amt}, timestamp=${tx.timestamp}, fee=${FEE}, hash=${tx.hash})`);
});

test('Default', () => {
  let tx = new Transaction({
    fromAddr: sender.address,
    fromPubKey: sender.publicKey,
    toAddr: receiver.address,
    sig
  });
  expect(tx.fromAddr).toBe(sender.address);
  expect(tx.fromPubKey).toBe(sender.publicKey);
  expect(tx.toAddr).toBe(receiver.address);
  expect(tx.amount).toBe(0);
  expect(tx.timestamp <= Date.now()).toBeTruthy();
  expect(typeof tx.hash).toBe('string');
  expect(tx.fee).toBe(FEE);
  expect(tx.sig).toBe(sig);
});

test('All set', () => {
  let tx = new Transaction({
    fromAddr: sender.address,
    fromPubKey: sender.publicKey,
    toAddr: receiver.address,
    fee: 1
  });
  expect(tx.fromAddr).toBe(sender.address);
  expect(tx.fromPubKey).toBe(sender.publicKey);
  expect(tx.toAddr).toBe(receiver.address);
  expect(tx.amount).toBe(0);
  expect(tx.fee).toBe(1);
});

test('Empty', () => {
  expect(() => new Transaction()).toThrowError(Error)
});

test('Signature et al', () => {
  expect.assertions(5);
  return new Promise((resolve) => {
    resolve(tx.hasValidSignature())
  }).then(bool => {
    expect(bool).toBeFalsy();
    return expect(verify({
      pubKey: sender.publicKey,
      msg: tx.hash,
      sig: tx.sig
    })).toBeFalsy()
  })
    .then(vrf => tx.sign(sender.secretKey(sHash)))
    .then(signed => expect(tx.hasValidSignature()).toBeTruthy())
    .then(correct => {
      expect(verify({
        pubKey: sender.publicKey,
        msg: tx.hash,
        sig: tx.sig
      })).toBeTruthy();
      expect(tx.isValid()).toBeTruthy();
    })
    .catch(err => console.log('This went wrong:', err.toString()))
});

test('Changing', () => {
  expect(tx.fee).toStrictEqual(FEE);
  tx.fee = 3;
  expect(tx.fee).toStrictEqual(3);
  expect(tx.fee !== FEE).toBeTruthy();
});