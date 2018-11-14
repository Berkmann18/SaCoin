const MerkleTree = require('merkletreejs'),
  { SHA256, SHA3, enc } = require('crypto-js');
const Transaction = require('../src/transaction'),
  Wallet = require('../src/wallet'),
  Chain = require('../src/blockchain');

const bufferify = x => Buffer.from(x.toString(enc.Hex), 'hex');

test('crypto-js - sha256', () => { //Taken from https://github.com/miguelmota/merkletreejs/commit/922f78fa275658a8a2b9392e59e4b84b7dc97d8f
  const leaves = ['a', 'b', 'c'].map(SHA3);
  const tree = new MerkleTree(leaves, SHA256);
  const root = '57e9ee696a291f8a51d224a6d64ba4a0693920a63f1e0329efe96c02a5f28849';
  expect(tree.getRoot().toString('hex')).toEqual(root);
});

test('Simple verification', () => {
  const leaves = ['Lorem', 'Ipsum', 'Dolore', 'Sit', 'Amet'].map(SHA3)

  const tree = new MerkleTree(leaves, SHA256)
  expect(tree.getLeaves()).toEqual(leaves.map(bufferify))
  expect(tree.getLeaves()).toEqual(leaves.map(MerkleTree.bufferify))

  const root = tree.getRoot();

  const verifications = leaves.map(leaf => {
    const proof = tree.getProof(leaf)
    return tree.verify(proof, leaf, root)
  });

  expect(verifications.every(Boolean)).toBeTruthy()
});

test('With Transactions', () => {
  let chain = new Chain();
  let w0 = new Wallet(chain, '0'),
    w1 = new Wallet(chain, '1'),
    w2 = new Wallet(chain, '2');
  [w0, w1, w2].forEach(wlt => chain.utpool.addUT(wlt.address, 10));

  let txs = [
    new Transaction({
      fromAddr: w0.address,
      fromPubKey: w0.publicKey,
      toAddr: w1.address,
      amount: 2
    }),
    new Transaction({
      fromAddr: w1.address,
      fromPubKey: w1.publicKey,
      toAddr: w2.address,
      amount: 4
    })
  ];
  w0.signTransaction(txs[0], SHA256('0'));
  w1.signTransaction(txs[1], SHA256('1'));
  expect(txs[0].isValid()).toBeTruthy();
  expect(txs[1].isValid()).toBeTruthy();

  const leaves = txs.map(SHA256);
  let tree = new MerkleTree(leaves, SHA3);
  expect(tree.getLayers().length).toBe(2);
  const proofs = txs.map(tx => {
    let leaf = bufferify(SHA256(tx));
    return tree.getProof(leaf);
  });
  let root = tree.getRoot();
  /* eslint-disable security/detect-object-injection */
  let vrfs = proofs.map((proof, i) => tree.verify(proof, leaves[i], root));
  /* eslint-enable security/detect-object-injection */
  expect(vrfs).toEqual(new Array(txs.length).fill(true));
});