const Block = require('../src/block'), SHA256 = require('crypto-js/sha256'), {/*DIFFICULTY, */BANK} = require('../src/config'), Transaction = require('../src/transaction'),
  gen = require('../src/crypto').genKey, {colour} = require('../src/cli');

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
});

test('Linking', () => {
  let genesis = new Block();
  let block = new Block(genesis.hash, [], 0, 1);
  expect(block.prevHash).toBe(genesis.hash);
  expect(block.isValid()).toBeFalsy();
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
  //Test the block's ability to detect invalid transactions on creation on `addTransaction`
  let kp = gen();
  let tx = new Transaction(BANK.address, BANK.pk, kp.pk, 5);
  let block = new Block('root', []);
});

test('Mining', () =>  {
  let genesis = new Block();
  genesis.mine();
});