const Chain = require('../src/blockchain'), {DIFFICULTY, MINING_REWARD, CURRENCY, BANK, TRANSACTION_FEE, init, BLOCKCHAIN} = require('../src/config'), Block = require('../src/block'),
  Transaction = require('../src/transaction'), {TransactionError} = require('../src/error'), gen = require('../src/crypto').genKey, UTPool = require('../src/utpool'),
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
  expect(SXC.getBlockByHash(block.hash)).toBe(block);
});

test('Transactions', () => {
  let SXC = new Chain();
  init(SXC);
  let tx = new Transaction(BANK.address, BANK.pk, BANK.address, MINING_REWARD * 2);
  expect(() => {
    SXC.addTransaction(tx)
  }).toThrowError(TransactionError);
  expect(() => {
    tx.sign(BANK.sk);
    SXC.addTransaction(tx);
  }).not.toThrowError(TransactionError);
  expect(SXC.getTransactionsByHash(tx.hash)).toStrictEqual([]);
  expect(SXC.pendingTransactions.includes(tx)).toBeTruthy();
  expect(SXC.pendingTransactions.length).toBe(1);
  SXC.minePendingTransactions(BANK.wallet);
  expect(SXC.pendingTransactions.length).toBe(1); //0 transaction + 1 reward transaction
  expect(SXC.getTransactionsByHash(tx.hash)).toStrictEqual([tx]);
  expect(SXC.getAllTransactions()).toStrictEqual([tx]);
  expect(SXC.getAllTransactions(true)).toStrictEqual([tx.toString(false)]);
  expect(SXC.getAllTransactions(true, true)).toStrictEqual([tx.toString()]);
});

test('Mining', () => {
  let utp = BANK.pool, SXC = new Chain(DIFFICULTY, utp), transferred = 5;
  let hash = SHA256('123'), coin = 7;
  init(SXC);
  let me = new Wallet(SXC, '123'), tx = new Transaction(BANK.address, BANK.pk, me.address, transferred);
  // SXC = BLOCKCHAIN;
  utp.addUT(me.address, coin);
  expect(me.publicKey).not.toBe(BANK.pk);
  // console.log('addr me/BANK', me.address, BANK.address);
  // console.log('utp=', utp.toString());
  // console.log('SXC pool=', SXC.utpool.toString());
  expect(SXC.utpool.pool[me.address]).toBe(coin);
  expect(SXC.utpool.pool[BANK.address]).toBe(BANK.amount);
  me.signTransaction(tx, hash); //Will not work because BANK is the owner of the transaction
  expect(tx.isValid()).toBeFalsy();
  expect(() => SXC.addTransaction(tx)).toThrowError(TransactionError); //Should throw since the receiver can't sign that transaction
  tx.sign(BANK.sk);
  SXC.addTransaction(tx);
  expect(SXC.utpool.pool[me.address]).toBe(coin);
  expect(SXC.utpool.pool[BANK.address]).toBe(BANK.amount);
  SXC.minePendingTransactions(me);

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
  expect(me.calculateBalance()).toBe(transferred);
  expect(BANK.wallet.calculateBalance()).toBe(-transferred);
  // console.log('me', myCoins, 'pool', SXC.utpool.pool[me.address], 'balance', me.calculateBalance(), 'ut', me.unspentBalance(utp));
  // console.log('BANK', bkCoins, 'pool', SXC.utpool.pool[BANK.address], 'balance', BANK.wallet.calculateBalance(), 'ut', BANK.wallet.unspentBalance(utp));
  SXC.minePendingTransactions(him);

  myCoins += transferred + MINING_REWARD;
  bkCoins -= (transferred + TRANSACTION_FEE + MINING_REWARD);
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  expect(SXC.utpool.pool[him.address]).toBe(TRANSACTION_FEE);
  // console.log('me', myCoins, 'pool', SXC.utpool.pool[me.address], 'balance', me.calculateBalance());
  let balance = transferred * 2 + MINING_REWARD;
  expect(me.calculateBalance()).toBe(balance); //Since the coins given by the UT pool aren't coming from the blockchain
  // console.log('BANK', bkCoins, 'pool', SXC.utpool.pool[BANK.address], 'balance', BANK.wallet.calculateBalance());
  expect(BANK.wallet.calculateBalance()).toBe(-balance);
  expect(him.calculateBalance()).toBe(0); //Not in blockchain yet
  SXC.minePendingTransactions(BANK.wallet);

  bkCoins -= MINING_REWARD;
  let hisCoins = TRANSACTION_FEE + MINING_REWARD;
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  expect(SXC.utpool.pool[him.address]).toBe(hisCoins);

});