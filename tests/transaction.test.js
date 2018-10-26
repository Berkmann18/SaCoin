const Transaction = require('../src/transaction'), {genKey, sign, verify} = require('../src/crypto'), FEE = require('../src/config').TRANSACTION_FEE, Wallet = require('../src/wallet'),
  SHA256 = require('crypto-js/sha256'), {colour} = require('../src/cli');

let sender = new Wallet(null, 'se'), sHash = SHA256('se'), receiver = new Wallet(null, 're'), rHash = SHA256('re'), amt = 5, sig = sign(sender.secretKey(sHash), amt.toString());
let tx = new Transaction(sender.address, sender.publicKey, receiver.address, amt, sig);

test('Init', () => {
  expect(tx.fromAddr).toBe(sender.address);
  expect(tx.fromPubKey).toBe(sender.publicKey);
  expect(tx.toAddr).toBe(receiver.address);
  expect(tx.amount).toBe(amt);
  expect(tx.timestamp <= Date.now()).toBeTruthy();
  expect(typeof tx.hash).toBe('string');
  expect(tx.fee).toBe(FEE);
  expect(tx.signature).toBe(sig);
  expect(tx.isValid()).toBeFalsy(); //tests calculateHash() so no need to test that
  expect(tx.toString()).toBe(colour('tx', `Transaction(fromAddr=${tx.fromAddr}, fromPubKey=${tx.fromPubKey}, toAddr=${tx.toAddr}, amount=${amt}, timestamp=${tx.timestamp}, fee=${FEE}, hash=${tx.hash})`));
  expect(tx.toString(false)).toBe(`Transaction(fromAddr=${tx.fromAddr}, fromPubKey=${tx.fromPubKey}, toAddr=${tx.toAddr}, amount=${amt}, timestamp=${tx.timestamp}, fee=${FEE}, hash=${tx.hash})`);
});

test('Signature et al', () => {
  expect.assertions(5);
  return new Promise((resolve) => {
    resolve(tx.hasValidSignature())
  }).then(bool => {
    expect(bool).toBeFalsy();
    return expect(verify(sender.publicKey, tx.hash, tx.signature)).toBeFalsy()
  })
    .then(vrf => tx.sign(sender.secretKey(sHash)))
    .then(signed => expect(tx.hasValidSignature()).toBeTruthy())
    .then(correct => {
      expect(verify(sender.publicKey, tx.hash, tx.signature)).toBeTruthy();
      expect(tx.isValid()).toBeTruthy();
    })
    .catch(err => console.log('This went wrong:', err.toString()))
});
