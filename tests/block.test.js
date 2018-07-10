const Block = require('../src/block'), SHA256 = require('crypto-js/sha256'), {/*DIFFICULTY, */BANK} = require('../cfg.json'), Transaction = require('../src/transaction'),
  gen = require('../src/crypto').genKey, {colour} = require('../src/cli'), TransactionError = require('../src/error').TransactionError, Wallet = require('../src/wallet'),
  UTPool = require('../src/utpool');

test('Block creation', () => {
  let block = new Block();
  expect(block.transactions).toEqual([]);
  expect(block.timestamp <= Date.now()).toBeTruthy();
  expect(block.prevHash).toEqual('b076b4ac5dfd570677538e23b54818022a379d2e8da1ef6f1b40f08965b528ff');
  expect(block.hash).toBe(block.calculateHash());
  expect(block.height).toBe(0);
  expect(block.toString()).toBe(colour('block', `Block(transactions=[], timestamp=${block.timestamp}, prevHash=${block.prevHash}, hash=${block.hash})`));
  expect(block.toString(false)).toBe(`Block(transactions=[], timestamp=${block.timestamp}, prevHash=${block.prevHash}, hash=${block.hash})`);
  expect(block.isGenesis()).toBeTruthy();
  expect(block.isValid()).toBeFalsy();
  expect(block.nonce).toBe(undefined); //Instead of 0
  expect(block.difficulty).toBe(undefined); //Instead of DIFFICULTY
  expect(block.beneficiaryAddr).toBe(BANK.address);
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
  let kp = gen();
  let tx = new Transaction(BANK.address, BANK.pk, kp.pk, 5);
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
  // chain.utpool.addUT(wlt.address, 10);
  // chain.utpool.addUT(BANK.address, 100);
  let tx = new Transaction(BANK.address, BANK.pk, wlt.publicKey, 5);

  expect(() => {
    let block = new Block('genesis', [tx]);
  }).toThrow(`Invalid transaction ant-Block creation: ${tx.toString()}`);
  tx.sign(BANK.sk);
  expect(() => {
    let block = new Block('genesis', [tx]);
  }).not.toThrow(`Invalid transaction ant-Block creation: ${tx.toString()}`);
});