'use strict';
const SHA256 = require('crypto-js/sha256'), Transaction = require('./transaction'), /*{DIFFICULTY, BANK} = require('./config'), */{TransactionError} = require('./error'),
  {setColours, colour} = require('./cli'), {DIFFICULTY, BANK} = require('../cfg.json');

setColours();

/** @private */
let prvProps = new WeakMap();
const ROOT_HASH = 'b076b4ac5dfd570677538e23b54818022a379d2e8da1ef6f1b40f08965b528ff';

class Block {
  /**
   * @description Block.
   * @param {string} [prevHash=ROOT_HASH] Previous hash
   * @param {Transaction[]} [transactions=[]] List of transactions inside the block
   * @param {number} [nonce=0] Nonce associated to the block
   * @param {number} [height=0] Height of the block within a chain
   * @param {string} [beneficiaryAddr=BANK.address] Address of the beneficiary
   */
  constructor(prevHash = ROOT_HASH, transactions = [], nonce = 0, height = 0, beneficiaryAddr = BANK.address) {

    if (transactions.length) transactions.forEach(tx => {
      if (!tx.isValid()) throw new TransactionError(`Invalid transaction ant-Block creation: ${tx.toString()}`);
    });

    prvProps.set(this, {
      prevHash,
      difficulty: DIFFICULTY,
      transactions,
      nonce,
      timestamp: Date.now(),
      hash: '',
      height,
      beneficiaryAddr
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
   * @description Get the block's hash which also acts as its header.
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
   * @description Get the block's beneficiary's address.
   * @return {string} Address
   */
  get beneficiaryAddr() {
    return prvProps.get(this).beneficiaryAddr;
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
   * @param {boolean} [cliColour=true] Add the CLI colour.
   * @return {string} Block
   */
  toString(cliColour = true) {
    let str = `Block(transactions=[${this.transactions.map(trans => trans.toString())}], timestamp=${this.timestamp}, prevHash=${this.prevHash}, hash=${this.hash})`;
    return cliColour ? colour('block', str) : str;
  }

  /**
   * @description Add a transaction to this block.
   * @param {Transaction} transaction New transaction
   * @throws {TransactionError} Invalid transaction
   * @throws {Error} Transaction already added
   * @deprecated
   */
  addTransaction(transaction) {
    if (!transaction.isValid()) throw new TransactionError(`The transaction nearly added is invalid: ${transaction.toString()}`);
    if (this.transactions.includes(transaction)) throw new Error(`The transaction already in the block: ${transaction.toString()}`);
    prvProps.get(this).transactions.push(transaction)
  }

  /**
   * @description Check if the block is valid.
   * @return {boolean} Validity
   */
  isValid() {
    let diff = prvProps.get(this).difficulty, actualHash = this.calculateHash(), actualPad = '0'.repeat(diff);
    let correctHash = this.hash === actualHash, correctPadding = this.hash.substring(0, diff) === actualPad;
    // if (log) console.log('correctHash=', correctHash, 'correctPadding=', correctPadding);
    return correctHash && correctPadding;
  }

  /**
   * @description Check if this block is a genesis block.
   * @return {boolean} Genesis block?
   */
  isGenesis() {
    return this.prevHash === ROOT_HASH
  }

  /**
   * @description Increment the nonce until a valid hash is obtained with enough 0's at the beginning (based on the difficulty).
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