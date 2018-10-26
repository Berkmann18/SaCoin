const MerkleTree = require('merkletreejs')
SHA256 = require('crypto-js/sha256'),
SHA3 = require('crypto-js/sha3');
const Transaction = require('../src/transaction'),
  Wallet = require('../src/wallet'),
  Chain = require('../src/blockchain'),
  { BSHA3 } = require('../src/crypto');
const { sha3 } = require('ethereumjs-util');

const bufferify = f => x => Buffer.from(f(x.toString()).toString(), 'hex');
const hashFn = bufferify(SHA256);

test('crypto-js - sha256', () => { //Taken from https://github.com/miguelmota/merkletreejs/commit/922f78fa275658a8a2b9392e59e4b84b7dc97d8f
  const leaves = ['a', 'b', 'c'].map(BSHA3);
  const tree = new MerkleTree(leaves, SHA256);
  const root = '57e9ee696a291f8a51d224a6d64ba4a0693920a63f1e0329efe96c02a5f28849';
  expect(tree.getRoot().toString('hex')).toEqual(root);
});

test('Simple', () => {
  const data = ['Lorem', 'Ipsum', 'Dolore', 'Sit', 'Amet'];

  const leaves = data.map(x => sha3(x));

  let tree = new MerkleTree(leaves, SHA256);
  expect(tree instanceof MerkleTree).toBeTruthy();
  expect(tree.getLeaves()).toBe(leaves);
  let root = () => {
    let layers = tree.getLayers();
    return layers[layers.length - 1][0];
  };
  expect(tree.getRoot()).toBe(root());
});

test('With Transactions', () => {
  let chain = new Chain();
  let w0 = new Wallet(chain, '0'),
    w1 = new Wallet(chain, '1'),
    w2 = new Wallet(chain, '2');
  [w0, w1, w2].forEach(wlt => chain.utpool.addUT(wlt.address, 10));

  let txs = [
    new Transaction(w0.address, w0.publicKey, w1.address, 2),
    new Transaction(w1.address, w1.publicKey, w2.address, 4),
  ];
  w0.signTransaction(txs[0], SHA256('0'));
  w1.signTransaction(txs[1], SHA256('1'));
  expect(txs[0].isValid()).toBeTruthy();
  expect(txs[1].isValid()).toBeTruthy();

  const leaves = txs.map(hashFn);
  let tree = new MerkleTree(leaves, bufferify(SHA3));
  expect(tree.getLayers().length).toBe(2);
  let proofs = txs.map(tx => {
    let leaf = hashFn(tx);
    return tree.getProof(leaf);
  });
  let root = tree.getRoot();
  let vrfs = proofs.map((p, i) => tree.verify(p, leaves[i], root));
  expect(vrfs).toEqual(new Array(txs.length).fill(true));
});