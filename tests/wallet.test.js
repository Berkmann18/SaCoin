const BANK = require('../src/config').BANK, Wallet = require('../src/wallet'), UTPool = require('../src/utpool'), Chain = require('../src/blockchain'),
  TransactionError = require('../src/error').TransactionError, Transaction = require('../src/transaction'), SHA256 = require('crypto-js/sha256');

test('Init', () => {
  let chain = new Chain(), pw = 'pass', wlt = new Wallet(chain, pw), utp = new UTPool(), amt = 2, hash = SHA256(pw);
  expect(typeof wlt.address).toBe('string');
  expect(wlt.address).toBeDefined();
  expect(typeof wlt.keyPair).toBe('undefined');
  expect(wlt.keyPair).toBeUndefined();
  expect(typeof wlt.privateKey).toBe('undefined');
  expect(wlt.privateKey).toBeUndefined();
  expect(wlt.secretKey).toBeUndefined();
  expect(wlt.password).toBeUndefined();
  expect(typeof wlt._secretKey).toBe('function');
  expect(() => wlt._secretKey(pw)).toThrowError(Error);
  expect(typeof wlt._secretKey(hash)).toBe('object');
  expect(() => wlt._secretKey(SHA256(pw + '0'))).toThrowError(Error);
  expect(() => wlt._secretKey(hash ^ 0)).toThrowError(`A secret key recovery was attempted on the address ${wlt.address} with 3 attempts`);
  expect(() => wlt._secretKey(hash ^ 1)).toThrowError('Secret key recovery attempt threshold exceeded.');
  expect(typeof wlt.publicKey).toBe('object');
  expect(wlt.publicKey).toBeDefined();
  expect(Wallet.generateAddress(wlt.publicKey)).not.toBe(wlt.address);
  expect(wlt.unspentBalance(utp)).toBeUndefined();
  utp.addUT(wlt.address, amt);
  expect(wlt.unspentBalance(utp)).toBe(amt);
  expect(wlt.calculateBalance()).toBe(0); //Not in blockchain so 0
  expect(wlt.blockchain).toBe(chain);
  expect(wlt.toString()).toBe(`Wallet(blockchain=${wlt.blockchain.toString()}, address=${wlt.address}, publicKey=${wlt.publicKey})`);
  wlt.reset(hash);
  let createTx = () => wlt.createTransaction(BANK.pk, -1, hash);
  expect(createTx).not.toThrowError(TransactionError);
  let tx = createTx();
  expect(tx instanceof Transaction).toBeTruthy();
  expect(tx.hasValidSignature()).toBeTruthy();
  expect(tx.isValid()).toBeFalsy(); //-1 < 0 so fail
});

test('Integration', () => {
  let utp = new UTPool(), chain = new Chain(2, utp), w0 = new Wallet(chain, 'z'), w1 = new Wallet(chain, 'o'), xch = 3,
    tx = new Transaction(w0.address, w0.publicKey, w1.address, xch), start = 10;
  utp.addUT(w0.address, start);
  utp.addUT(w1.address, start);
  w0.signTransaction(tx, SHA256('z'));
  expect(() => chain.addTransaction(tx)).not.toThrowError(TransactionError);
  expect(chain.getTransactionsByHash(tx.hash).length).toBe(0);
  expect(() => chain.addTransaction(tx)).toThrowError(`Transaction already pending: ${tx.toString()}`);
});