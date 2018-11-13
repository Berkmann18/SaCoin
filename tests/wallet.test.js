const SHA256 = require('crypto-js/sha256');
const Wallet = require('../src/wallet'),
  UTPool = require('../src/utpool'),
  Chain = require('../src/blockchain'),
  { BANK } = require('../cfg'),
  TransactionError = require('../src/error').TransactionError,
  Transaction = require('../src/transaction');

let bankPair = require('../src/crypto').genKey();
BANK.pk = bankPair.pk;
BANK.sk = bankPair.sk;
BANK.wallet = new Wallet(new Chain(), 'sxcBank', bankPair, BANK.address);

test('Init', () => {
  let chain = new Chain({
      difficulty: 1,
      utpool: BANK.pool
    }), pw = 'pass', wlt = new Wallet(chain, pw), utp = new UTPool(), amt = 2, hash = SHA256(pw);
  expect(typeof wlt.address).toBe('string');
  expect(wlt.address).toBeDefined();
  expect(typeof wlt.keyPair).toBe('undefined');
  expect(wlt.keyPair).toBeUndefined();
  expect(typeof wlt.privateKey).toBe('undefined');
  expect(wlt.privateKey).toBeUndefined();
  expect(wlt.secretKey).toBeDefined();
  expect(typeof wlt.secretKey).toBe('function');
  expect(wlt.password).toBeUndefined();
  expect(typeof wlt.secretKey).toBe('function');
  expect(() => wlt.secretKey(pw)).toThrowError(Error);
  expect(typeof wlt.secretKey(hash)).toBe('object');
  expect(() => wlt.secretKey(SHA256(pw + '0'))).toThrowError(Error);
  expect(() => wlt.secretKey(String(hash ^ 0))).toThrowError(`A secret key recovery was attempted on the address ${wlt.address} with 3 attempts`);
  expect(() => wlt.secretKey(String(hash ^ 1))).toThrowError('Secret key recovery attempt threshold exceeded.');
  expect(typeof wlt.publicKey).toBe('object');
  expect(wlt.publicKey).toBeDefined();
  expect(Wallet.generateAddress(wlt.publicKey, hash)).not.toBe(wlt.address);
  expect(wlt.hasValidAddress()).toBeTruthy();
  expect(wlt.unspentBalance(utp)).toBeUndefined();
  utp.addUT(wlt.address, amt);
  expect(wlt.unspentBalance(utp)).toBe(amt);
  expect(wlt.calculateBalance()).toBe(0); //Not in blockchain so 0
  expect(wlt.blockchain).toBe(chain);
  expect(wlt.toString()).toBe(`Wallet(blockchain=${wlt.blockchain.toString()}, address=${wlt.address}, publicKey=${wlt.publicKey.pubKeyHex})`);
  expect(wlt.toString(false)).toBe(`Wallet(blockchain=${wlt.blockchain.toString(false)}, address=${wlt.address}, publicKey=${wlt.publicKey.pubKeyHex})`);
  wlt.reset(hash);
  expect(typeof wlt.secretKey(hash)).toBe('object');
  expect(() => wlt.reset(hash + 0)).toThrow(Error);

  let tx = new Transaction({
    fromAddr: wlt.address,
    fromPubKey: wlt.publicKey,
    toAddr: BANK.address,
    amount: -1
  });
  wlt.signTransaction(tx, hash);
  expect(tx instanceof Transaction).toBeTruthy();
  expect(tx.hasValidSignature()).toBeTruthy();
  expect(tx.isValid()).toBeFalsy(); //-1 < 0 so fail
  tx = new Transaction({
    fromAddr: wlt.address,
    fromPubKey: wlt.publicKey,
    toAddr: BANK.address,
    amount: 5
  });
  wlt.signTransaction(tx, hash);
  expect(tx instanceof Transaction).toBeTruthy();
  expect(tx.hasValidSignature()).toBeTruthy();
  expect(tx.isValid()).toBeTruthy();
});

test('Integration 1/2', () => {
  let utp = new UTPool(), chain = new Chain({
      difficulty: 2,
      utpool: utp
    }), w0 = new Wallet(chain, 'z'), w1 = new Wallet(chain, 'o'), xch = 3,
    tx = new Transaction({
      fromAddr: w0.address,
      fromPubKey: w0.publicKey,
      toAddr: w1.address,
      amount: xch
    }), start = 10;
  utp.addUT(w0.address, start);
  utp.addUT(w1.address, start);
  w0.signTransaction(tx, SHA256('z'));
  expect(() => chain.addTransaction(tx)).not.toThrowError(TransactionError);
  expect(chain.getTransactionsByHash(tx.hash).length).toBe(0);
  expect(() => chain.addTransaction(tx)).toThrowError(`Transaction already pending: ${tx.toString()}`);
  let txs = w0.getTransactions(), txs1 = w1.getTransactions();
  expect('in' in txs).toBeTruthy();
  expect('out' in txs).toBeTruthy();
  expect(txs.out).toStrictEqual([]);
  expect(txs1.in).toStrictEqual([]);
  expect(txs.in).toStrictEqual([]);
  expect(txs1.out).toStrictEqual([]);
});

test('Integration 2/2', () => {
  let chain = new Chain(), xch = 5, pw0 = 'z', h0 = SHA256(pw0);

  expect(chain.chain.length).toBe(1);
  expect(chain.difficulty).toBe(2);
  expect(chain.miningReward).toBe(12.5);
  expect(chain.currency).toBe('XSC');

  let w0 = new Wallet(chain, pw0), w1 = new Wallet(chain, 'o'), tx = new Transaction({
      fromAddr: w0.address,
      fromPubKey: w0.publicKey,
      toAddr: w1.address,
      amount: xch
    }), start = 10;
  chain.utpool.addUT(w0.address, start);
  chain.utpool.addUT(w1.address, start);
  w0.signTransaction(tx, h0);
  chain.addTransaction(tx);

  chain.minePendingTransactions(w1);
  let txs = w0.getTransactions(), txs1 = w1.getTransactions();
  expect('in' in txs).toBeTruthy();
  expect('out' in txs).toBeTruthy();
  expect(txs.in).toEqual([tx]);
});