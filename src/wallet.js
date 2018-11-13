'use strict';

/**
 * @fileoverview Crypto wallet.
 * @module
 */

const SHA256 = require('crypto-js/sha256'),
  { use } = require('./cli');
const { genKey } = require('./crypto'),
  UTPool = require('./utpool');

/** @private */
let prvProps = new WeakMap();
/**
 * @description Attempt logger.
 * @private
 * @type {Object}
 */
const ATTEMPT = {};

/**
 * @description Threshold for the number of allowed attempts.
 * @private
 * @type {number}
 */
const ATTEMPT_THRESHOLD = 3;
prvProps.set(ATTEMPT, {});

/**
 * @description Set the number of secret key recovery attempts.
 * @param {Wallet.address|string} addr Address of the wallet concerned
 * @param {number} num Number of attempts done
 * @private
 * @return {*}
 */
const _setAttempt = (addr, num) => prvProps.get(ATTEMPT)[addr] = num;

/**
 * @description Get the number of attempts done on the secret key of an address.
 * @param {Wallet.address|string} addr Wallet address
 * @return {number} Number of recovery attempts
 * @private
 */
const _getAttempt = (addr) => prvProps.get(ATTEMPT)[addr];

/**
 * @description Calculate the address of a wallet.
 * @param {Key} pubKey Public key
 * @param {number|Date} time Timestamp to use for the generation
 * @param {string|WordArray} pwd
 * @protected
 */
const calculateAddress = (pubKey, time, pwd) => SHA256(pubKey + time + pwd).toString();

/**
 * @class Wallet
 * @description Electronic wallet.
 */
class Wallet {
  /**
   * @description Wallet constructor.
   * @param {Blockchain} blockchain Blockchain associated
   * @param {{pk: Key, sk: Key}} [keyPair=genKey()]
   * @param {string|WordArray} password Password to access fully access the wallet
   * @param {string} [address=calculateAddress(keyPair.pk, ts, hash)] Hex address
   * @memberof Wallet
   */
  constructor(blockchain, password, keyPair = genKey(), address) {
    let ts = Date.now(),
      hash = SHA256(password),
      addr = address || calculateAddress(keyPair.pk, ts, hash);
    prvProps.set(this, {
      password: hash,
      creationTime: ts,
      address: addr,
      keyPair,
      blockchain,
      balance: 0
    });
    _setAttempt(addr, 0);
  }

  /**
   * @description Generate a Wallet address.
   * @param {Key} pubKey Public key of the wallet
   * @param {string|WordArray} pwd Password
   * @return {string} Address
   * @memberof Wallet
   */
  static generateAddress(pubKey, pwd) {
    return calculateAddress(pubKey, Date.now(), pwd);
  }

  /**
   * @description Check if this wallet has a valid address.
   * @return {boolean} Valid address
   * @memberof Wallet
   */
  hasValidAddress() {
    return this.address === calculateAddress(this.publicKey, prvProps.get(this).creationTime, prvProps.get(this).password);
  }

  /**
   * @description Get the wallet's address.
   * @return {string} Hex address
   * @memberof Wallet
   */
  get address() {
    return prvProps.get(this).address;
  }

  /**
   * @description Get the wallet's public key.
   * @return {Key} Public key
   * @memberof Wallet
   */
  get publicKey() {
    return prvProps.get(this).keyPair.pk;
  }

  /**
   * @description Get the associated blockchain.
   * @return {Blockchain} Blockchain
   * @memberof Wallet
   */
  get blockchain() {
    return prvProps.get(this).blockchain;
  }

  /**
   * @description Change the associated blockchain
   * @param {Blockchain} chain
   * @memberof Wallet
   */
  set blockchain(chain) {
    console.log(`${this.toString()} ${use('warn', 'changed to')} ${chain.toString()}`);
    prvProps.get(this).blockchain = chain;
  }

  /**
   * @description Get the wallet's secret key.
   * @param {string|WordArray} pwd Password
   * @memberof Wallet
   */
  secretKey(pwd) {
    if (_getAttempt(this.address) >= ATTEMPT_THRESHOLD) throw Error('Secret key recovery attempt threshold exceeded.');
    if (pwd.toString() !== prvProps.get(this).password.toString()) {
      _setAttempt(this.address, 1 + _getAttempt(this.address));
      throw Error(`A secret key recovery was attempted on the address ${this.address} with ${_getAttempt(this.address)} attempts`);
    }
    return prvProps.get(this).keyPair.sk;
  }

  /**
   * @description Reset the recovery attempts to 0.
   * @param {string|WordArray} pwd Password
   * @memberof Wallet
   */
  reset(pwd) {
    if (pwd.toString() === prvProps.get(this).password.toString()) _setAttempt(this.address, 0);
    else throw new Error(`Failed reset on ${this.toString()}`);
  }

  /**
   * @description Get the wallet's balance.
   * @param {UTPool} utp Unspent transactions pool
   * @return {number} Balance from the chain
   * @memberof Wallet
   */
  unspentBalance(utp) {
    return utp.pool[this.address];
  }

  /**
   * @description Calculate the wallet's balance by going through its associated blockchain.
   * @param {Blockchain} [blockchain=this.blockchain] Blockchain to use
   * @return {number} Calculated balance
   * @memberof Wallet
   */
  calculateBalance(blockchain = this.blockchain) {
    let balance = 0;
    //Loop over each block and each transaction inside the block
    for (const block of blockchain.chain) {
      for (const tx of block.transactions) {
        //If the given address is the sender -> reduce the balance
        if (tx.fromAddr === this.address) balance -= tx.amount;
        //If the given address is the receiver -> increase the balance
        if (tx.toAddr === this.address) balance += tx.amount;
        //If the address is the fee receiver (block beneficiary) -> increase the balance
        if (block.beneficiaryAddr === this.address) balance += tx.fee;
      }
    }
    return balance;
  }

  /**
   * @description String representation of the wallet.
   * @param {boolean} [cliColour=true] Add CLI colours
   * @return {string} Wallet
   * @memberof Wallet
   */
  toString(cliColour = true) {
    return `Wallet(blockchain=${this.blockchain.toString(cliColour)}, address=${this.address}, publicKey=${this.publicKey.pubKeyHex})`
  }
  /*
    /!**
     * @description Create and sign a transaction.
     * @param {string} receiverAddress Address of the receiver
     * @param {number} amount Amount of coins to send
     * @param {string} pwd Password
     * @return {Transaction} Transaction
     *!/
    createTransaction(receiverAddress, amount, pwd) {
      let tx = new Transaction(this.address, this.publicKey, receiverAddress, amount);
      tx.sign(this.secretKey(pwd));
      return tx
    }*/

  /**
   * @description Get all the transactions coming from/to this wallet within its associated blockchain.
   * @param {Blockchain} [blockchain=this.blockchain] Blockchain to use
   * @return {{in: Transaction[], out: Transaction[]}} Transactions
   * @memberof Wallet
   */
  getTransactions(blockchain = this.blockchain) {
    let txs = {
      'in': [],
      'out': []
    };
    for (const block of blockchain.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddr === this.address) txs.in.push(tx);
        if (tx.toAddr === this.address) txs.out.push(tx);
      }
    }
    return txs
  }

  /**
   * @description Sign a transaction.
   * @param {Transaction} tx Transaction
   * @param {string|WordArray} pwd Password
   * @memberof Wallet
   */
  signTransaction(tx, pwd) {
    tx.sign(this.secretKey(pwd));
  }
}

module.exports = Wallet;