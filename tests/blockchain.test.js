const Chain = require('../src/blockchain'), {DIFFICULTY, MINING_REWARD, CURRENCY, BANK, TRANSACTION_FEE, UTPOOL} = require('../cfg'), Block = require('../src/block'),
  Transaction = require('../src/transaction'), {TransactionError, BlockError, OutOfBoundsError} = require('../src/error'), gen = require('../src/crypto').genKey, UTPool = require('../src/utpool'),
  Wallet = require('../src/wallet'), SHA256 = require('crypto-js/sha256'), {colour} = require('../src/cli');

let bankPair = gen();
BANK.pk = bankPair.pk;
BANK.sk = bankPair.sk;
BANK.wallet = new Wallet(new Chain(), 'sxcBank', bankPair, BANK.address);

test('Init', () => {
  let SXC = new Chain();
  expect(SXC.chain.length).toBe(1);
  expect(SXC.difficulty).toBe(DIFFICULTY);
  expect(SXC.miningReward).toBe(MINING_REWARD);
  expect(SXC.currency).toBe(CURRENCY);
  expect(SXC.utpool).toStrictEqual(new UTPool(UTPOOL));
  expect(SXC.utpool).toStrictEqual(new UTPool()); //Should fail IF init was called thus changing BANK.pool
  expect(Chain.createGenesisBlock()).not.toBe(SXC.chain[0]);
  expect(SXC.size).toBe(1);
  expect(SXC.toString()).toBe(colour('chain', `Blockchain(chain=[${SXC.chain}], pendingTransactions=[], difficulty=${DIFFICULTY}, miningReward=${MINING_REWARD}, currency=${CURRENCY})`));
  expect(SXC.toString(false)).toBe(`Blockchain(chain=[${SXC.chain}], pendingTransactions=[], difficulty=${DIFFICULTY}, miningReward=${MINING_REWARD}, currency=${CURRENCY})`);
  expect(SXC.isValid()).toBeTruthy();
});

test('Customised', () => {
  let genesis = new Block('root', [], 1, 0), GBP = new Chain(3, BANK.pool, genesis, 10, 'GBP');
  expect(GBP.difficulty).toBe(3);
  expect(GBP.utpool).toBe(BANK.pool);
  expect(GBP.chain).toStrictEqual([genesis]);
  expect(GBP.miningReward).toBe(10);
  expect(GBP.currency).toBe('GBP');
});

test('Cont.', () => {
  let SXC = new Chain(), block = new Block(SXC.getBlock(-1).hash, [], 0, 1);
  expect(block.prevHash).toBe(SXC.getBlock(-1).hash);
  expect(() => SXC.addBlock(block)).toThrowError(BlockError);
  block.mine();
  expect(() => SXC.addBlock(block)).not.toThrowError(BlockError);
  expect(SXC.getBlock(0).isValid()).toBeTruthy();
  expect(SXC.getBlock(1).isValid()).toBeTruthy();
  expect(() => SXC.getBlock(2)).toThrowError(OutOfBoundsError);
  expect(SXC.isValid()).toBeTruthy();
  expect(SXC.size).toBe(2);
  expect(SXC.getBlock(-1)).toEqual(block); //Same as getBlock(1)
  let tx = new Transaction(BANK.address, BANK.pk, BANK.address);
  expect(block.beneficiaryAddr).toBe(BANK.address);
  expect(() => {
    SXC._add([tx], BANK.address);
  }).toThrowError(TransactionError); //Should throw since no signature and tx.amount = 0
  expect(() => {
    tx.sign(BANK.sk);
    SXC._add([tx], BANK.address);
  }).toThrowError(TransactionError); //Should throw since tx.amount = 0
  expect(SXC.getBlockByHash(block.hash)).toBe(block);
  expect(() => {
    let blk = new Block(block.hash, [], 0, 1);
    SXC.addBlock(blk);
    SXC.getBlockByHash(block.hash)
  }).toThrowError(BlockError); //Duplicate block

  let wlt = new Wallet(SXC, ' ');
  tx = new Transaction(BANK.address, BANK.pk, wlt.address, 5);
  tx.sign(BANK.sk);
  SXC._add([tx]);
});

test('Transactions', () => {
  let SXC = new Chain();

  expect(SXC.getBlock(-1)).toBeDefined();
  let tx = new Transaction(BANK.address, BANK.pk, BANK.address, MINING_REWARD * 2);
  expect(() => {
    SXC.addTransaction(tx)
  }).toThrowError(TransactionError); //Unsigned
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
  let wlt = new Wallet(SXC, 'lol'), hash = SHA256('lol') ;
  tx = new Transaction(wlt.address, wlt.publicKey, BANK.address, 100);
  tx.sign(wlt.secretKey(hash));
  expect(() => SXC.addTransaction(tx)).toThrowError(`The balance of the sender ${wlt.address} has no unspent coins`); //TransactionError
  let spending = 1;
  SXC.utpool.addUT(wlt.address, spending);
  let trans = new Transaction(wlt.address, wlt.publicKey, BANK.address, spending);
  trans.sign(wlt.secretKey(hash));
  expect(() => SXC.addTransaction(trans)).toThrowError(TransactionError); //Not enough coins
  SXC.utpool.addUT(wlt.address, 5);
  SXC.addTransaction(trans);
  SXC.minePendingTransactions(wlt);
  expect(SXC.getTransactionsByHash(trans.hash)).toStrictEqual([trans]);
  expect(() => SXC.addTransaction(trans)).toThrowError(`Transaction already in blockchain: ${trans.toString()}`); //TransactionError
});

test('Mining', () => {
  let SXC = new Chain(DIFFICULTY, new UTPool({[BANK.address]: BANK.amount})), transferred = 5;
  BANK.wallet.blockchain = SXC;
  let hash = SHA256('123'), coin = 7;

  let me = new Wallet(SXC, '123'), tx = new Transaction(BANK.address, BANK.pk, me.address, transferred);
  SXC.utpool.addUT(me.address, coin);
  expect(me.publicKey).not.toBe(BANK.pk);
  expect(SXC.utpool.pool[BANK.address]).toBe(BANK.amount);
  me.signTransaction(tx, hash); //Will not work because BANK is the owner of the transaction
  expect(tx.isValid()).toBeFalsy();
  expect(() => SXC.addTransaction(tx)).toThrowError(TransactionError); //Should throw since the receiver can't sign that transaction
  tx.sign(BANK.sk);
  SXC.addTransaction(tx);
  expect(SXC.utpool.pool[me.address]).toBe(coin);
  expect(SXC.utpool.pool[BANK.address]).toBe(BANK.amount);
  SXC.minePendingTransactions(me);

  let myCoins = coin + transferred + TRANSACTION_FEE, bkCoins = BANK.amount - transferred - TRANSACTION_FEE;
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  let him = new Wallet(SXC, '00'), trans = new Transaction(BANK.address, BANK.pk, me.address, transferred); // BANK.wallet.createTransaction(me.address, transferred, SHA256('sxcBank'));
  trans.sign(BANK.sk);
  SXC.addTransaction(trans);
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  expect(SXC.utpool.pool[him.address]).toBeUndefined();
  expect(me.calculateBalance()).toBe(transferred + TRANSACTION_FEE);
  expect(BANK.wallet.calculateBalance()).toBe(-transferred);
  SXC.minePendingTransactions(him);

  myCoins += transferred + MINING_REWARD;
  let hisCoins = 2 * TRANSACTION_FEE;
  bkCoins -= (transferred + hisCoins + MINING_REWARD);
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  expect(SXC.utpool.pool[him.address]).toBe(hisCoins);
  let balance = transferred * 2 + MINING_REWARD + TRANSACTION_FEE;
  expect(me.calculateBalance()).toBe(balance); //Since the coins given by the UT pool aren't coming from the blockchain
  expect(me.calculateBalance()).toBe(SXC.utpool.pool[me.address] - coin);
  expect(BANK.wallet.calculateBalance()).toBe(TRANSACTION_FEE - balance);
  expect(him.calculateBalance()).toBe(hisCoins); //Not in blockchain yet
  SXC.minePendingTransactions(BANK.wallet);

  bkCoins -= MINING_REWARD;
  hisCoins += MINING_REWARD;
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  expect(SXC.utpool.pool[him.address]).toBe(hisCoins);
});