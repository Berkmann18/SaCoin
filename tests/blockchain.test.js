const SHA256 = require('crypto-js/sha256'),
  {use} = require('nclr');
const Chain = require('../src/blockchain'),
  {DIFFICULTY, MINING_REWARD, CURRENCY, BANK, TRANSACTION_FEE, UTPOOL} = require('../cfg'),
  Block = require('../src/block'),
  Transaction = require('../src/transaction'),
  {TransactionError, BlockError, OutOfBoundsError} = require('../src/error'),
  gen = require('../src/crypto').genKey,
  UTPool = require('../src/utpool'),
  Wallet = require('../src/wallet');

const bankPair = gen();
BANK.pk = bankPair.pk;
BANK.sk = bankPair.sk;
BANK.wallet = new Wallet(new Chain(), 'sxcBank', bankPair, BANK.address);

test('Init', () => {
  const SXC = new Chain();
  expect(SXC.chain.length).toBe(1);
  expect(SXC.difficulty).toBe(DIFFICULTY);
  expect(SXC.miningReward).toBe(MINING_REWARD);
  expect(SXC.currency).toBe(CURRENCY);
  expect(SXC.utpool).toStrictEqual(new UTPool(UTPOOL));
  expect(SXC.utpool).toStrictEqual(new UTPool()); //Should fail IF init was called thus changing BANK.pool
  expect(Chain.createGenesisBlock()).not.toBe(SXC.chain[0]);
  expect(SXC.size).toBe(1);
  expect(SXC.toString()).toBe(
    use(
      'chain',
      `Blockchain(chain=[${
        SXC.chain
      }], pendingTransactions=[], difficulty=${DIFFICULTY}, miningReward=${MINING_REWARD}, currency=${CURRENCY})`
    )
  );
  expect(SXC.toString(false)).toBe(
    `Blockchain(chain=[${
      SXC.chain
    }], pendingTransactions=[], difficulty=${DIFFICULTY}, miningReward=${MINING_REWARD}, currency=${CURRENCY})`
  );
  expect(SXC.isValid()).toBeTruthy();
});

test('Customised', () => {
  const genesis = new Block({nonce: 1}),
    GBP = new Chain({
      difficulty: 3,
      utpool: BANK.pool,
      genesisBlock: genesis,
      miningReward: 10,
      currency: 'GBP'
    });
  expect(GBP.difficulty).toBe(3);
  expect(GBP.utpool).toBe(BANK.pool);
  expect(GBP.chain).toStrictEqual([genesis]);
  expect(GBP.miningReward).toBe(10);
  expect(GBP.currency).toBe('GBP');
});

test('Cont.', () => {
  const SXC = new Chain(),
    block = new Block({
      prevHash: SXC.getBlock(-1).hash,
      height: 1
    });
  expect(block.prevHash).toBe(SXC.getBlock(-1).hash);
  expect(() => SXC.addBlock(block)).toThrowError(BlockError);
  block.mine();
  expect(() => SXC.addBlock(block)).not.toThrowError(BlockError);
  expect(SXC.getBlock(0).isValid()).toBeTruthy();
  expect(SXC.getBlock(1).isValid()).toBeTruthy();
  expect(() => SXC.getBlock('1')).toThrowError(TypeError);
  expect(() => SXC.getBlock(2)).toThrowError(OutOfBoundsError);
  expect(SXC.isValid()).toBeTruthy();
  expect(SXC.size).toBe(2);
  expect(SXC.getBlock(-1)).toEqual(block); //Same as getBlock(1)
  let tx = new Transaction({
    fromAddr: BANK.address,
    fromPubKey: BANK.pk,
    toAddr: BANK.address
  });
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
    const blk = new Block({
      prevHash: block.hash,
      height: 1
    });
    SXC.addBlock(blk);
    SXC.getBlockByHash(block.hash);
  }).toThrowError(BlockError); //Duplicate block

  const wlt = new Wallet(SXC, ' ');
  tx = new Transaction({
    fromAddr: BANK.address,
    fromPubKey: BANK.pk,
    toAddr: wlt.address,
    amount: 5
  });
  tx.sign(BANK.sk);
  SXC._add([tx]);
});

test('Transactions', () => {
  const SXC = new Chain();

  expect(SXC.getBlock(-1)).toBeDefined();
  let tx = new Transaction({
    fromAddr: BANK.address,
    fromPubKey: BANK.pk,
    toAddr: BANK.address,
    amount: MINING_REWARD * 2
  });
  expect(() => {
    SXC.addTransaction(tx);
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
  const wlt = new Wallet(SXC, 'lol'),
    hash = SHA256('lol');
  tx = new Transaction({
    fromAddr: wlt.address,
    fromPubKey: wlt.publicKey,
    toAddr: BANK.address,
    amount: 100
  });
  tx.sign(wlt.secretKey(hash));
  expect(() => SXC.addTransaction(tx)).toThrowError(
    `The balance of the sender ${wlt.address} has no unspent coins`
  ); //TransactionError
  const spending = 1;
  SXC.utpool.addUT(wlt.address, spending);
  const trans = new Transaction({
    fromAddr: wlt.address,
    fromPubKey: wlt.publicKey,
    toAddr: BANK.address,
    amount: spending
  });
  trans.sign(wlt.secretKey(hash));
  expect(() => SXC.addTransaction(trans)).toThrowError(TransactionError); //Not enough coins
  SXC.utpool.addUT(wlt.address, 5);
  SXC.addTransaction(trans);
  SXC.minePendingTransactions(wlt);
  expect(SXC.getTransactionsByHash(trans.hash)).toStrictEqual([trans]);
  expect(() => SXC.addTransaction(trans)).toThrowError(
    `Transaction already in blockchain: ${trans.toString()}`
  ); //TransactionError
});

test('Mining', () => {
  const SXC = new Chain({
      utpool: new UTPool({[BANK.address]: BANK.amount})
    }),
    transferred = 5;
  BANK.wallet.blockchain = SXC;
  const hash = SHA256('123'),
    coin = 7;

  const me = new Wallet(SXC, '123'),
    tx = new Transaction({
      fromAddr: BANK.address,
      fromPubKey: BANK.pk,
      toAddr: me.address,
      amount: transferred
    });
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

  let myCoins = coin + transferred + TRANSACTION_FEE,
    bkCoins = BANK.amount - transferred - TRANSACTION_FEE;
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  const him = new Wallet(SXC, '00'),
    trans = new Transaction({
      fromAddr: BANK.address,
      fromPubKey: BANK.pk,
      toAddr: me.address,
      amount: transferred
    }); // BANK.wallet.createTransaction(me.address, transferred, SHA256('sxcBank'));
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
  bkCoins -= transferred + hisCoins + MINING_REWARD;
  expect(SXC.utpool.pool[me.address]).toBe(myCoins);
  expect(SXC.utpool.pool[BANK.address]).toBe(bkCoins);
  expect(SXC.utpool.pool[him.address]).toBe(hisCoins);
  const balance = transferred * 2 + MINING_REWARD + TRANSACTION_FEE;
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
