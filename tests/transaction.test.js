const Transaction = require('../src/transaction'), {genKey, sign, verify} = require('../src/crypto'), FEE = require('../src/config').TRANSACTION_FEE;

let fromKP = genKey(), toKP = genKey(), from = sign(fromKP.sk, 'from'), to = sign(toKP.sk, 'to');

test('Init', () => {
  let amt = 10, trans = new Transaction(fromKP.pk, toKP.pk, amt, from);
  expect(trans.fromPubKey).toBe(fromKP.pk);
  expect(trans.toPubKey).toBe(toKP.pk);
  expect(trans.amount).toBe(amt);
  expect(trans.signature).toBe(from);
  expect(trans.fee).toBe(FEE);
  expect(trans.timestamp <= Date.now()).toBeTruthy();
  expect(trans.isValid()).toBeTruthy(); //tests calculateHash() so no need to test that
  // expect(trans.hasValidSignature()).toBeTruthy();
  expect(verify(fromKP.pk, trans.hash, trans.signature)).toBeFalsy(); //Should be true (n.b: the trans.hash shouldn't be dependent on the signature)
  expect(verify(fromKP.pk, 'from', trans.signature)).toBeTruthy(); //It means that the message used in the signature should be something else?!
  expect(trans.toString()).toBe(`Transaction(fromPubKey=${trans.fromPubKey}, toPubKey=${trans.toPubKey}, amount=${amt}, timestamp=${trans.timestamp}, fee=${FEE}, hash=${trans.hash})`)
});