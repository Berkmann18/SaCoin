'use strict';

const Block = require('./block'), {DIFFICULTY, MINING_REWARD, CURRENCY, BANK} = require('./config'), Transaction = require('./transaction'), {BlockError, TransactionError} = require('./error'),
  flat = require('lodash/flatten'), UTPool = require('./utpool'), {setColours, colour} = require('./cli');

setColours();

/** @private */
let prvProps = new WeakMap();
const ROOT_HASH = 'b076b4ac5dfd570677538e23b54818022a379d2e8da1ef6f1b40f08965b528ff'; //Taken from block.js

class Blockchain {
  /**
   * @description Creates a blockchain
   * @param {number} [difficulty=DIFFICULTY] Difficulty of the hashes
   * @param {UTPool} [utpool=BANK ? BANK.pool : new UTPool()] Unspent transaction pool
   * @param {Block} [genesisBlock=Blockchain.createGenesisBlock()] Genesis block
   * @param {number} [reward=MINING_REWARD] Mining reward
   * @param {string} [currency=CURRENCY] Currency name
   */
  constructor(difficulty = DIFFICULTY, utpool = BANK ? BANK.pool : new UTPool(), genesisBlock = Blockchain.createGenesisBlock(), reward = MINING_REWARD, currency = CURRENCY) {
    // genesisBlock.mine();
    prvProps.set(this, {
      chain: [genesisBlock],
      difficulty,
      pendingTransactions: [],
      miningReward: reward,
      currency,
      utpool
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
    return prvProps.get(this).currency;
  }

  /**
   * @description Get the Unspent Transaction pool.
   * @return {UTPool} UT pool
   */
  get utpool() {
    return prvProps.get(this).utpool;
  }

  /**
   * @description Get the list of pending transactions.
   * @return {Transaction[]} Transactions waiting to be in a block
   */
  get pendingTransactions() {
    return prvProps.get(this).pendingTransactions;
  }

  /**
   * @description Create the first (genesis) block.
   * @param {string} [beneficiaryAddr=BANK ? BANK.address : 'null'] Address of the beneficiary
   * @return {Block} Genesis block
   */
  static createGenesisBlock(beneficiaryAddr = BANK ? BANK.address : 'null') {
    return new Block(ROOT_HASH, [], 0, 0, beneficiaryAddr);
  }

  /**
   * @description Size of the chain.
   * @return {number} Size
   */
  get size() {
    return this.chain.length;
  }

  /**
   * @description Get a specific block.
   * @param {number} index Index
   * @return {Block} Block
   */
  getBlock(index) {
    let sz = this.size, chain = this.chain;
    if (index > sz) throw new Error('Index out of bounds');
    else return (index < 0) ? chain[sz + index] : chain[index];
  }

  /**
   * @description Get a block with a specific hash.
   * @param {string} hash Hash
   * @return {Block} Block
   * @throws {BlockError} Duplicated hash
   */
  getBlockByHash(hash) {
    let blocks = this.chain.filter(block => block.hash === hash);
    if (blocks.length > 1) throw new BlockError(`Duplicated block hash found in the blockchain: ${this.toString()}`);
    return blocks[0];
  }

  /**
   * @description Get all transactions that are in the blockchain.
   * @param {boolean} [toString=false] Get the string variant
   * @param {boolean} [cliColour=false] Set the CLI colour to transactions
   * @return {Transaction[]|string[]} List of (textual) transactions
   */
  getAllTransactions(toString = false, cliColour = false) {
    return toString ? flat(this.chain.map(block => block.transactions.map(tx => tx.toString(cliColour)))) : flat(this.chain.map(block => block.transactions));
  }

  /**
   * @description Get transactions with a specific hash.
   * @param {string} hash Hash
   * @return {Transaction[]} Transactions
   */
  getTransactionsByHash(hash) {
    return flat(this.chain.map(block => block.transactions.filter(tx => tx.hash === hash)));
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
   * @param {boolean} [cliColour=true] Add the CLI colour
   * @return {string} Blockchain
   */
  toString(cliColour = true) {
    let str = `Blockchain(chain=[${this.chain.map(block => block.toString())}], pendingTransactions=[${this.pendingTransactions}], difficulty=${this.difficulty}, miningReward=${this.miningReward}, currency=${this.currency})`;
    return cliColour ? colour('chain', str) : str;
  }

  /**
   * @description Add a new block.
   * @param {Transaction[]} transactions Data contained in the block
   * @param {string} [beneficiaryAddr=this.getBlock(-1).beneficiaryAddr] Wallet address of the beneficiary
   * @param {number} [timestamp=Date.now()] Timestamp associated to the block
   */
  _add(transactions, beneficiaryAddr, timestamp = Date.now()) {
    let prevBlock = this.getBlock(-1), ba = beneficiaryAddr || prevBlock.beneficiaryAddr, newBlock = new Block(prevBlock.hash, transactions, 0, prevBlock.height + 1, ba);
    newBlock.mine();
    prvProps.get(this).chain.push(newBlock);

    //Update the UT pool
    let pool = this.utpool;
    transactions.forEach(tx => {
      let amt = tx.amount, fee = tx.fee; //Just to reduce calls
      pool.addUT(tx.fromAddr, -(amt + fee));
      pool.addUT(tx.toAddr, amt);
      pool.addUT(ba, fee);
    });
  }

  /**
   * @description Add a block.
   * @param {Block} block block
   */
  addBlock(block) {
    if (!block.isValid() || block.prevHash !== this.getBlock(-1).hash) throw new BlockError(`Invalid block: ${block.toString()}`);
    prvProps.get(this).chain.push(block);
  }

  /**
   * @description Add a transaction to the list of pending ones.
   * @param {Transaction} transaction New transaction
   * @throws {TransactionError} Undeliverable transaction (negative amount or not enough funds) or invalid transaction or already in the chain
   */
  addTransaction(transaction) {
    //Check the transaction
    if (!transaction.isValid()) throw new TransactionError(`Invalid transaction: ${transaction.toString()}`);
    let senderBalance = this.utpool.pool[transaction.fromAddr];
    if (senderBalance === undefined) throw new Error(`The balance of the sender ${transaction.fromAddr} has no unspent coins`);
    if (transaction.fromPubKey !== BANK && senderBalance < (transaction.amount + transaction.fee)) throw new TransactionError(`The transaction requires more coins than the sender (${transaction.fromPubKey}) has ((${transaction.amount} + ${transaction.fee})${this.currency} off ${senderBalance}${this.currency})`);
    if (this.getTransactionsByHash(transaction.hash).length) throw new TransactionError(`Transaction already in blockchain: ${transaction.toString()}`);
    if (this.pendingTransactions.includes(transaction)) throw new TransactionError(`Transaction already pending: ${transaction.toString()}`);

    //Eventually place the transaction in the list of pending ones
    prvProps.get(this).pendingTransactions.push(transaction);
  }

  /**
   * @description Mine a new block and prepare the miner's reward.
   * @param {Wallet} minerWallet Wallet of the miner who gained a mining reward
   */
  minePendingTransactions(minerWallet) {
    //Create a new block with all pending transactions and mine it and add the newly mined block to the chain
    this._add(prvProps.get(this).pendingTransactions, minerWallet.address, Date.now());

    //Reset the pending transactions and send the mining reward
    let rewardTx = new Transaction(BANK.address, BANK.pk, minerWallet.address, this.miningReward, '', 0);
    rewardTx.sign(BANK.sk);
    prvProps.get(this).pendingTransactions = [rewardTx];
    // prvProps.get(this).utpool.addUT(minerWallet.address, this.miningReward);
  }
}

module.exports = Blockchain;