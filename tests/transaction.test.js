const Transaction = require('../src/transaction'), {genKey, sign, verify} = require('../src/crypto'), FEE = require('../src/config').TRANSACTION_FEE;

let fromKP = genKey(), toKP = genKey(), from = sign(fromKP.sk, 'from'), to = sign(toKP.sk, 'to');

const amt = 10, trans = new Transaction(fromKP.pk, toKP.pk, amt, from);

test('Init', () => {
  expect(trans.fromPubKey).toBe(fromKP.pk);
  expect(trans.toPubKey).toBe(toKP.pk);
  expect(trans.amount).toBe(amt);
  expect(trans.signature).toBe(from);
  expect(trans.fee).toBe(FEE);
  expect(trans.timestamp <= Date.now()).toBeTruthy();
  expect(trans.isValid()).toBeTruthy(); //tests calculateHash() so no need to test that
  expect(trans.toString()).toBe(`Transaction(fromPubKey=${trans.fromPubKey}, toPubKey=${trans.toPubKey}, amount=${amt}, timestamp=${trans.timestamp}, fee=${FEE}, hash=${trans.hash})`)
});

test('Signatures et al', () => {
  expect.assertions(4);
  return new Promise((resolve) => {
    resolve(trans.hasValidSignature());
  }).then(bool => {
    expect(bool).toBeFalsy();
    return expect(verify(fromKP.pk, trans.hash, trans.signature)).toBeFalsy()
  })
    .then(wrong => trans.sign(fromKP.sk))
    .then(signed => expect(trans.hasValidSignature()).toBeTruthy())
    .then(correct => {
      expect(verify(fromKP.pk, trans.hash, trans.signature)).toBeTruthy();
    })sr
    .catch(err => console.log('This went wrong:', err))
});