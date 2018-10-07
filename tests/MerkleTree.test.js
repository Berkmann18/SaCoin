const MerkleTree = require('merkletreejs'),
  SHA256 = require('crypto-js/sha256'),
  SHA224 = require('crypto-js/sha224'),
  SHA3 = require('crypto-js/sha3'),
  Transaction = require('../src/transaction'),
  Wallet = require('../src/wallet'),
  Chain = require('../src/blockchain');
const { sha3 } = require('ethereumjs-util');

const bufferify = f => x => Buffer.from(f(x.toString()).toString(), 'hex');
const hashFn = bufferify(SHA256);

test('crypto-js - sha256', done => { //Taken from https://github.com/miguelmota/merkletreejs/commit/922f78fa275658a8a2b9392e59e4b84b7dc97d8f
  const leaves = ['a', 'b', 'c'].map(x => sha3(x));

  const tree = new MerkleTree(leaves, SHA256);

  const root = '311d2e46f49b15fff8b746b74ad57f2cc9e0d9939fda94387141a2d3fdf187ae';
  // assert.expect(1);
  expect(tree.getRoot().toString('hex')).toEqual(root);
  done();
});

test('Simple', () => {
  const data = ['Lorem', 'Ipsum', 'Dolore', 'Sit', 'Amet'];
  // const leaves = data.map(d => Buffer.from(SHA256(d).toString(), 'hex'));
  const leaves = data.map(x => sha3(x));
  // console.log(leaves);
  // expect(leaves[0] instanceof Buffer).toBeTruthy();
  // expect(Buffer.isBuffer(SHA256('hello')))1.toBeTruthy();
  let tree = new MerkleTree(leaves, SHA256);
  // console.log(tree);
  expect(tree instanceof MerkleTree).toBeTruthy();
  expect(tree.getLeaves()).toBe(leaves);
  // console.log(tree.getLayers());
  let root = () => {
    let layers = tree.getLayers();
    return layers[layers.length - 1][0];
  };
  expect(tree.getRoot()).toBe(root());
  let proof1 = tree.getProof(leaves[1]);
  // console.log(tree.verify(proof1, leaves[1], tree.getRoot()))

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
  // console.log(tree.getLeaves());
  expect(tree.getLayers().length).toBe(2);
  let proofs = txs.map(tx => {
    let leaf = hashFn(tx);
    return tree.getProof(leaf);
  });
  let root = tree.getRoot();
  let vrfs = proofs.map((p, i) => tree.verify(p, leaves[i], root));
  // console.log(vrfs);
  expect(vrfs).toEqual(new Array(txs.length).fill(true));
});