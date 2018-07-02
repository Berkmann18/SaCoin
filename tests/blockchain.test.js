const Chain = require('../src/blockchain'), {DIFFICULTY, MINING_REWARD, CURRENCY, BANK, TRANSACTION_FEE} = require('../src/config'), Block = require('../src/block'),
  Transaction = require('../src/transaction'), {TransactionError} = require('../src/error'), gen = require('../src/crypto').genKey, UTPool = require('../src/UTPool'),
  Wallet = require('../src/wallet'), SHA256 = require('crypto-js/sha256'), {colour} = require('../src/cli');

test('Init', () => {
  let SXC = new Chain();
  expect(SXC.chain.length).toBe(1);
  expect(SXC.difficulty).toBe(DIFFICULTY);
  expect(SXC.miningReward).toBe(MINING_REWARD);
  expect(SXC.currency).toBe(CURRENCY);
  expect(SXC.utpool).toStrictEqual(new UTPool());
  expect(Chain.createGenesisBlock()).not.toBe(SXC.chain[0]);
  expect(SXC.size).toBe(1);
  expect(SXC.toString()).toBe(colour('chain', `Blockchain(chain=[${SXC.chain}], pendingTransactions=[], difficulty=${DIFFICULTY}, miningReward=${MINING_REWARD}, currency=${CURRENCY})`));
  expect(SXC.toString(false)).toBe(`Blockchain(chain=[${SXC.chain}], pendingTransactions=[], difficulty=${DIFFICULTY}, miningReward=${MINING_REWARD}, currency=${CURRENCY})`);
});

test('Cont.', () => {
  let SXC = new Chain(), block = new Block(SXC.getBlock(-1).hash, [], 0, 1);
  expect(block.prevHash).toBe(SXC.getBlock(-1).hash);
  expect(block.isValid()).toBeFalsy();
  block.mine();
  expect(block.isValid()).toBeTruthy();
  SXC.addBlock(block);
  expect(SXC.getBlock(-1)).toEqual(block);
  let tx = new Transaction(BANK.address, BANK.pk, BANK.pk);
  expect(block.beneficiaryAddr).toBe(BANK.address);
  expect(() => {
    SXC._add([tx], BANK.sk);
  }).toThrowError(TransactionError); //Should throw since no signature and tx.amount = 0
  expect(() => {
    tx.sign(BANK.sk);
    SXC._add([tx], BANK.sk);
  }).toThrowError(TransactionError); //Should throw since tx.amount = 0
});

test('Transactions', () => {
  let SXC = new Chain(), tx = new Transaction(BANK.address, BANK.pk, BANK.address, MINING_REWARD * 2);
  expect(() => {
    SXC.addTransaction(tx)
  }).toThrowError(TransactionError);
  expect(() => {
    tx.sign(BANK.sk);
    SXC.addTransaction(tx);
  }).not.toThrowError(TransactionError);
});

test('Mining', () => {
  let utp = BANK.pool, SXC = new Chain(DIFFICULTY, utp), me = new Wallet(SXC, '123'), transferred = 5, tx = new Transaction(BANK.address, BANK.pk, me.address, transferred);
  let hash = SHA256('123'), coin = 7;
  utp.addUT(me.address, coin);
  expect(SXC.utpool.pool[me.address]).toBe(coin);
  expect(SXC.utpool.pool[BANK.address]).toBe(BANK.amount);
  me.signTransaction(tx, hash); //Will not2 work because BANK is the owner of the transaction
  expect(() => SXC.addTransaction(tx)).toThrowError(TransactionError); //Should throw since the receiver can't sign that transaction
  tx.sign(BANK.sk);
  SXC.addTransaction(tx);
  expect(SXC.utpool.pool[me.address]).toBe(coin);
  expect(SXC.utpool.pool[BANK.address]).toBe(BANK.amount);
  SXC.minePendingTransaction(me);
  // console.log('me=', me.address);
  // console.log('BANK=', BANK.address);
  // console.log('pending txs=', colour('tx', SXC.pendingTransactions.map(tx => tx.toString(false))));
  // console.log('all txs=', SXC.getAllTransactions(true));
  let myCoins = coin + transferred + TRANSACTION_FEE, bkCoins = BANK.amount - transferred - TRANSACTION_FEE;
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  let him = new Wallet(SXC, '00'), trans = new Transaction(BANK.address, BANK.pk, me.address, transferred); // BANK.wallet.createTransaction(me.address, transferred, SHA256('sxcBank'));
  trans.sign(BANK.sk);
  SXC.addTransaction(trans);
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  expect(SXC.utpool.pool[him.address]).toBeUndefined();
  SXC.minePendingTransaction(him);
  expect(SXC.utpool.pool[me.address]).toBe(myCoins + transferred + MINING_REWARD);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins - transferred - TRANSACTION_FEE - MINING_REWARD);
  expect(SXC.utpool.pool[him.address]).toBe(TRANSACTION_FEE);
});

//todo: toString, getBlockByHash, getTransactionsByHash, getAllTransactions