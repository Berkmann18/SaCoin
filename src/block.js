'use strict';
const SHA256 = require('crypto-js/sha256'), Transaction = require('./transaction'), {DIFFICULTY} = require('./config'), {TransactionError} = require('./error');

/** @private */
let prvProps = new WeakMap();
const GENESIS_HASH = 'b076b4ac5dfd570677538e23b54818022a379d2e8da1ef6f1b40f08965b528ff';

class Block {
  /**
   * @description Block.
   * @param {string} [prevHash=GENESIS_HASH] Previous hash
   * @param {Transaction[]} [transactions=[]] List of transactions inside the block
   * @param {number} [nonce=0] Nonce associated to the block
   * @param {number} [height=0] Height of the block within a chain
   */
  constructor(prevHash = GENESIS_HASH, transactions = [], nonce = 0, height = 0) {
    prvProps.set(this, {
      prevHash,
      difficulty: DIFFICULTY,
      transactions,
      nonce,
      timestamp: Date.now(),
      hash: '',
      height: 0
    });

    this.updateHash()
  }

  /**
   * @description Get the block's transactions.
   * @return {Transaction[]} Transaction
   */
  get transactions() {
    return prvProps.get(this).transactions;
  }

  /**
   * @description Get the timestamp associated to the block.
   * @return {number} Timestamp
   */
  get timestamp() {
    return prvProps.get(this).timestamp
  }

  /**
   * @description Get the previous hash.
   * @return {string} Previous hash
   */
  get prevHash() {
    return prvProps.get(this).prevHash
  }

  /**
   * @description Get the block's hash.
   * @return {*} Hash
   */
  get hash() {
    return prvProps.get(this).hash
  }

  /**
   * @description Get the block's height within a chain.
   */
  get height() {
    return prvProps.get(this).height;
  }

  /**
   * @description Calculate the hash.
   */
  calculateHash() {
    return SHA256(this.timestamp + JSON.stringify(this.transactions) + this.prevHash + prvProps.get(this).nonce).toString()
  }

  /**
   * @description Update the hash of the block.
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash()
  }

  /**
   * @description String representation of a block.
   * @return {string} Block
   */
  toString() {
    return `Block(transactions=[${this.transactions.map(trans => trans.toString())}], timestamp=${this.timestamp}, prevHash=${this.prevHash}, hash=${this.hash})`
  }

  /**
   * @description Add a transaction to this block.
   * @param {Transaction} transaction New transaction
   */
  addTransaction(transaction) {
    if (!transaction.isValid()) throw new TransactionError(`The transaction almost added to the block ${this.hash} is invalid`);
    prvProps.get(this).transactions.push(transaction)
  }

  /**
   * @description Check if the block is valid.
   * @return {boolean} Validity
   */
  isValid() {
    let actualHash = this.calculateHash(), actualPad = '0'.repeat(prvProps.get(this).difficulty);
    let correctHash = this.hash === actualHash, correctPadding = this.hash.substring(0, prvProps.get(this).difficulty) === actualPad,
      correctParent = this.prevHash === GENESIS_HASH;
    return correctHash && correctPadding && correctParent;
  }

  /**
   * @description Check if this block is a genesis block.
   * @return {boolean} Genesis block?
   */
  isGenesis() {
    return this.prevHash === GENESIS_HASH
  }

  /**
   * @description Increment the nonce until a valid hash is obtained with enough 0's at the beginning (based on the difficulty).
   * @param {string} beneficiarySig Signature of the beneficiary
   */
  mine(beneficiarySig) {
    while (this.hash.substring(0, prvProps.get(this).difficulty) !== '0'.repeat(prvProps.get(this).difficulty)) {
      prvProps.get(this).nonce++;
      this.updateHash();
    }
    // this.addTransaction(new Transaction(BANK.pk, this.beneficiary, MINING_REWARD, beneficiarySig))
  }

}

module.exports = Block;