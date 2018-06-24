'use strict';

const Block = require('./block'), {DIFFICULTY, MINING_REWARD, CURRENCY, BANK} = require('./config'), Transaction = require('./transaction');

/** @private */
let prvProps = new WeakMap();

class Blockchain {
  /**
   * @description Creates a blockchain
   * @param {number} [difficulty=DIFFICULTY] Difficulty of the hashes
   * @param {Block} [genesisBlock=Blockchain.createGenesisBlock(difficulty)] Genesis block
   * @param {number} [reward=MINING_REWARD] Mining reward
   * @param {string} [currency=CURRENCY] Currency name
   */
  constructor(difficulty = DIFFICULTY, genesisBlock = Blockchain.createGenesisBlock(), reward = MINING_REWARD, currency = CURRENCY) {
    // genesisBlock.mine();
    prvProps.set(this, {
      chain: [genesisBlock],
      difficulty,
      pendingTransactions: [],
      miningReward: reward,
      currency
    });
  }

  /**
   * @description Get the blockchain.
   * @return {Block[]} Chain
   */
  get chain() {
    return prvProps.get(this).chain;
  }

  /**
   * @description Get the hash difficulty.
   * @return {number} Difficulty
   */
  get difficulty() {
    return prvProps.get(this).difficulty;
  }

  /**
   * @description Get the mining reward.
   * @return {number} Reward
   */
  get miningReward() {
    return prvProps.get(this).miningReward;
  }

  /**
   * @description Get the currency.
   * @return {string} Name
   */
  get currency() {
    return prvProps.get(this).currency
  }

  /**
   * @description Create the first (genesis) block.
   * @return {Block} Genesis block
   */
  static createGenesisBlock() {
    return new Block();
  }

  /**
   * @description Size of the chain.
   * @return {number} Size
   */
  size() {
    return prvProps.get(this).chain.length;
  }

  /**
   * @description Get a specific block.
   * @param {number} index Index
   * @return {Block} Block
   */
  getBlock(index) {
    let sz = this.size();
    if (index > sz) throw new Error('Index out of bounds');
    else return (index < 0) ? prvProps.get(this).chain[sz + index] : prvProps.get(this).chain[index];
  }

  /**
   * @description Validates the chain.
   * @return {boolean} Validity
   */
  isValid() {
    let chain = this.chain;
    for (let i = 1; i < chain.length; ++i){
      const currentBlock = chain[i], prevBlock = chain[i - 1], pad = '0'.repeat(this.difficulty);
      let incorrectPadding = (!currentBlock.hash.startsWith(pad) || !prevBlock.hash.startsWith(pad));
      if (incorrectPadding || currentBlock.hash !== currentBlock.calculateHash() || currentBlock.prevHash !== prevBlock.hash) return false;
    }
    return true;
  }

  /**
   * @description String representation.
   * @return {string} Blockchain
   */
  toString() {
    return `Blockchain(chain=[${this.chain.map(block => block.toString())}], pendingTransactions=${prvProps.get(this).pendingTransactions}, difficulty=${this.difficulty}, miningReward=${this.miningReward}, currency=${this.currency})`;
  }

  _add() {

  }

  /**
   * @description Add a transaction to the list of pending ones.
   * @param {Transaction} transaction New transaction
   * @throws {Error} Undeliverable transaction (negative amount or not enough funds)
   */
  addTransaction(transaction) {
    //Validation here
    if (transaction.amount < 0) throw `Negative transactions aren\'t doable (from ${transaction.from} to ${transaction.to})`; //throw new Error('Negative transactions aren\'t doable');
    // let senderBalance = this.getBalanceOfAddress(transaction.from);
    if (transaction.from !== BANK && senderBalance < transaction.amount) throw `The transaction requires more coins than the sender (${transaction.from}) has (${transaction.amount}${this.currencySymbol} off ${senderBalance}${this.currencySymbol})`;//throw new Error(`The transaction requires more coins than the sender has (${transaction.amount} ${this.currencySymbol} off ${senderBalance} ${this.currencySymbol})`);
    prvProps.get(this).pendingTransactions.push(transaction);
  }

  /**
   * @description Mine a new block and send the reward to the miner.
   * @param {(string|RSAKey|crypto.ECDSA)} miningRewardAddr Address of the miner who gained a mining reward
   */
  minePendingTransaction(miningRewardAddr) {
    //Create a new block with all pending transactions and mine it and add the newly mined block to the chain
    this._add(prvProps.get(this).pendingTransactions);

    //Reset the pending transactions and send the mining reward
    prvProps.get(this).pendingTransactions = [new Transaction(BANK.pk, miningRewardAddr, this.miningReward)];
  }
}

