'use strict';

/**
 * @fileoverview Cryptographic blocks.
 * @module
 */

const SHA256 = require('crypto-js/sha256'),
  MerkleTree = require('merkletreejs');
const Transaction = require('./transaction'),
  { TransactionError } = require('./error'),
  { setColours, colour } = require('./cli'),
  { DIFFICULTY, BANK, TRANSACTION_FEE } = require('../cfg.json'),
  { BSHA3 } = require('./crypto');

setColours();

/** @private */
let prvProps = new WeakMap();
/**
 * @description Hash of the root of the chain.
 * @private
 */
const ROOT_HASH = 'b076b4ac5dfd570677538e23b54818022a379d2e8da1ef6f1b40f08965b528ff';

/**
 * @class Block
 */
class Block {
  /**
   * @description Block.
   * @param {string} [prevHash=ROOT_HASH] Previous hash
   * @param {Transaction[]} [transactions=[]] List of transactions inside the block
   * @param {number} [nonce=0] Nonce associated to the block
   * @param {number} [height=0] Height of the block within a chain
   * @param {string} [beneficiaryAddr=BANK.address] Address of the beneficiary
   * @param {number} [txFee=TRANSACTION_FEE] Fee for each transaction that will be present in that block
   * @memberof Block
   */
  constructor(prevHash = ROOT_HASH, transactions = [], nonce = 0, height = 0, beneficiaryAddr = BANK.address, txFee = TRANSACTION_FEE) {

    if (transactions.length) transactions.forEach(tx => {
      if (!tx.isValid()) throw new TransactionError(`Invalid transaction ant-Block creation: ${tx.toString()}`);
      tx.fee = txFee;
    });

    prvProps.set(this, {
      prevHash,
      difficulty: DIFFICULTY,
      transactions,
      nonce,
      timestamp: Date.now(),
      hash: '',
      height,
      beneficiaryAddr,
      txFee,
      merkleTree: null
    });

    this.updateTree();
    this.updateHash();
  }

  /**
   * @description Get the block's transactions.
   * @return {Transaction[]} Transaction
   * @memberof Block
   */
  get transactions() {
    return prvProps.get(this).transactions;
  }

  /**
   * @description Get the timestamp associated to the block.
   * @return {number} Timestamp
   * @memberof Block
   */
  get timestamp() {
    return prvProps.get(this).timestamp
  }

  /**
   * @description Get the previous hash.
   * @return {string} Previous hash
   * @memberof Block
   */
  get prevHash() {
    return prvProps.get(this).prevHash
  }

  /**
   * @description Get the block's hash which also acts as its header.
   * @return {Object} Hash
   * @memberof Block
   */
  get hash() {
    return prvProps.get(this).hash
  }

  /**
   * @description Get the block's height within a chain.
   * @return {number} Height
   * @memberof Block
   */
  get height() {
    return prvProps.get(this).height;
  }

  /**
   * @description Get the block's beneficiary's address.
   * @return {string} Address
   * @memberof Block
   */
  get beneficiaryAddr() {
    return prvProps.get(this).beneficiaryAddr;
  }

  /**
   * @description Get the transaction fee.
   * @return {number} Fee
   * @memberof Block
   */
  get transactionFee() {
    return prvProps.get(this).txFee;
  }

  /**
   * @description Get the Merkle tree's root.
   * @return {Buffer} Root of the tree
   * @memberof Block
   */
  get merkleRoot() {
    return prvProps.get(this).merkleTree.getRoot();
  }

  /**
   * @description Calculate the hash.
   * @return {Object} SHA256 hash
   * @memberof Block
   */
  calculateHash() {
    return SHA256(this.timestamp + this.merkleRoot + this.prevHash + prvProps.get(this).nonce).toString()
  }

  /**
   * @description Update the Merkle tree.
   * @memberof Block
   */
  updateTree() {
    const leaves = this.transactions.map(BSHA3);
    prvProps.get(this).merkleTree = new MerkleTree(leaves, SHA256);
  }

  /**
   * @description Update the hash of the block.
   * @memberof Block
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash();
  }

  /**
   * @description String representation of a block.
   * @param {boolean} [cliColour=true] Add the CLI colour.
   * @return {string} Block
   * @memberof Block
   */
  toString(cliColour = true) {
    let str = `Block(transactions=[${this.transactions.map(trans => trans.toString())}], timestamp=${this.timestamp}, prevHash=${this.prevHash}, merkleRoot=${this.merkleRoot.toString('utf8')}, hash=${this.hash}, height=${this.height}, beneficiaryAddr=${this.beneficiaryAddr}, transactionFee=${this.transactionFee})`;
    return cliColour ? colour('block', str) : str;
  }

  /**
   * @description Add a transaction to this block.
   * @param {Transaction} transaction New transaction
   * @throws {TransactionError} Invalid transaction
   * @throws {Error} Transaction already added
   * @deprecated
   * @memberof Block
   */
  addTransaction(transaction) {
    if (!transaction.isValid()) throw new TransactionError(`The transaction nearly added is invalid: ${transaction.toString()}`);
    transaction.fee = this.transactionFee; //Change the transaction's fee to match the block's transaction fee (since it should be up to the block's owner).
    if (this.transactions.includes(transaction)) throw new Error(`The transaction already in the block: ${transaction.toString()}`);
    prvProps.get(this).transactions.push(transaction)
  }

  /**
   * @description Check if the Merkle tree is valid.
   * @return {boolean} Validity
   * @memberof Block
   */
  hasValidTree() {
    let proofs = this.transactions.map(tx => tree.getProof(BSHA3(tx)));
    let root = this.merkleRoot;
    let leaves = prvProps.get(this).merkleTree.getLeaves(); //this.transactions.map(BSHA3);
    let vrfs = proofs.map((p, i) => tree.verify(p, leaves[i], root));
    return vrfs.every(Boolean);
  }

  /**
   * @description Check if the block is valid.
   * @return {boolean} Validity
   * @memberof Block
   */
  isValid() {
    let diff = prvProps.get(this).difficulty,
      actualHash = this.calculateHash(),
      actualPad = '0'.repeat(diff);
    let correctHash = this.hash === actualHash,
      correctPadding = this.hash.substring(0, diff) === actualPad;
    // if (log) console.log('correctHash=', correctHash, 'correctPadding=', correctPadding);
    return correctHash && correctPadding && this.hasValidTree;
  }

  /**
   * @description Check if this block is a genesis block.
   * @return {boolean} Genesis block?
   * @memberof Block
   */
  isGenesis() {
    return this.prevHash === ROOT_HASH
  }

  /**
   * @description Increment the nonce until a valid hash is obtained with enough 0's at the beginning (based on the difficulty).
   * @memberof Block
   */
  mine() {
    let diff = prvProps.get(this).difficulty;
    while (this.hash.substring(0, diff) !== '0'.repeat(diff)) {
      prvProps.get(this).nonce++;
      this.updateHash();
    }
    /*let rewardTx = new Transaction(BANK.address, BANK.pk, this.beneficiaryAddr, MINING_REWARD);
    rewardTx.sign(sk);
    this.addTransaction(rewardTx);
    this.updateHash();*/
    // console.log(`Block mined: ${this.toString()}`);
  }

}

module.exports = Block;