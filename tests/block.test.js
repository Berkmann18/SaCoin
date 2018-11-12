const { use } = require('nclr');
const Block = require('../src/block'),
  {BANK, TRANSACTION_FEE} = require('../cfg.json'),
  Transaction = require('../src/transaction'),
  gen = require('../src/crypto').genKey,
  TransactionError = require('../src/error').TransactionError,
  Wallet = require('../src/wallet'),
  UTPool = require('../src/utpool');

test('Block creation', () => {
  let block = new Block();
  expect(block.transactions).toEqual([]);
  expect(block.timestamp <= Date.now()).toBeTruthy();
  expect(block.prevHash).toEqual('b076b4ac5dfd570677538e23b54818022a379d2e8da1ef6f1b40f08965b528ff');
  expect(block.hash).toBe(block.calculateHash());
  expect(block.height).toBe(0);
  expect(Buffer.isBuffer(block.merkleRoot)).toBeTruthy();
  let merkleRoot = block.merkleRoot.toString('utf8');
  expect(merkleRoot === '').toBeTruthy();
  expect(block.toString()).toStrictEqual(use('block', `Block(transactions=[], timestamp=${block.timestamp}, prevHash=${block.prevHash}, merkleRoot=${merkleRoot}, hash=${block.hash}, height=0, beneficiaryAddr=${block.beneficiaryAddr}, transactionFee=1)`));
  expect(block.toString(false)).toStrictEqual(`Block(transactions=[], timestamp=${block.timestamp}, prevHash=${block.prevHash}, merkleRoot=${merkleRoot}, hash=${block.hash}, height=0, beneficiaryAddr=${block.beneficiaryAddr}, transactionFee=1)`);
  expect(block.isGenesis()).toBeTruthy();
  expect(block.isValid()).toBeFalsy();
  expect(block.nonce).toBe(undefined); //Instead of 0
  expect(block.difficulty).toBe(undefined); //Instead of DIFFICULTY
  expect(block.beneficiaryAddr).toBe(BANK.address);
  expect(block.transactionFee).toBe(TRANSACTION_FEE);
  expect(block.hasValidTree()).toBeTruthy();
  block.mine();
  expect(block.isValid()).toBeTruthy(); //This only works with the mining transaction reward commented out
  expect(() => {
    const h = block.hash;
    block.updateHash();
    return block.hash === h;
  }).toBeTruthy();
});

test('Linking', () => {
  let genesis = new Block();
  let block = new Block(genesis.hash, [], 0, 1);
  expect(block.prevHash).toBe(genesis.hash);
  expect(block.isValid()).toBeFalsy();
  expect(block.isGenesis()).toBeFalsy();
  block.mine();
  expect(block.isValid()).toBeTruthy();
  let curGenHash = genesis.hash;
  genesis.mine();
  expect(genesis.hash).not.toEqual(curGenHash);
  block.updateHash();
  //Ensures that if the previous hash is changed than there's no update (so the attacker would have to change everything from it)
  expect(block.prevHash).not.toEqual(genesis.hash);
  expect(block.isValid()).toBeTruthy();
  block.prevHash = genesis.hash; //Shouldn't work as prevHash is read-only
  expect(block.isValid()).toBeTruthy();
  expect(block.height).toBe(1);
});

test('Transactions gone wrong', () => {
  let bankPair = gen();
  BANK.pk = bankPair.pk;
  BANK.sk = bankPair.sk;
  BANK.wallet = new Wallet({}, 'sxcBank', bankPair, BANK.address);
  //Test the block's ability to detect invalid transactions on creation on `addTransaction`
  let tx = new Transaction({
    fromAddr: BANK.address,
    fromPubKey: BANK.pk,
    toAddr: 'ba45734499c7188265c760e93f69018bbecdb6a26998656f4834e8da66ee0007',
    amount: 5
  });
  let block = new Block('root', []);
  expect(() => block.addTransaction(tx)).toThrowError(TransactionError);
  tx.sign(BANK.sk);
  expect(() => block.addTransaction(tx)).not.toThrowError(TransactionError);
  expect(() => block.addTransaction(tx)).toThrowError(Error);
});

test('Transactions gone right', () => {
  let chain = [], pw = 'pass', wlt = new Wallet(chain, pw), utp = new UTPool({
    [wlt.address]: 10,
    [BANK.address]: 100
  });
  let tx = new Transaction({
    fromAddr: BANK.address,
    fromPubKey: BANK.pk,
    toAddr: wlt.publicKey,
    amount: 5
  });

  expect(() => {
    new Block('genesis', [tx]);
  }).toThrow(`Invalid transaction ant-Block creation: ${tx.toString()}`);
  tx.sign(BANK.sk);
  expect(() => {
    new Block('genesis', [tx]);
  }).not.toThrow(`Invalid transaction ant-Block creation: ${tx.toString()}`);
  expect(tx.fee).toBe(TRANSACTION_FEE);
  let block = new Block('root', [tx], 0, 0, wlt.address, 2);
  expect(tx.fee).toBe(2);
});

test('Filled block', () => {
  let w0 = new Wallet({}, '0'), w1 = new Wallet({}, '1');
  let txs = [
    new Transaction({
      fromAddr: BANK.address,
      fromPubKey: BANK.pk,
      toAddr: w0.publicKey,
      amount: 2
    }),
    new Transaction({
      fromAddr: BANK.address,
      fromPubKey: BANK.pk,
      toAddr: w1.publicKey,
      amount: 2
    })
  ];
  txs.forEach(tx => tx.sign(BANK.sk));
  let block = new Block('root', txs);
  expect(block.hasValidTree()).toBeTruthy();
});