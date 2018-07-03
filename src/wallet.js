'use strict';

const {genKey} = require('./crypto'), Transaction = require('./transaction'), SHA256 = require('crypto-js/sha256'), UTPool = require('./utpool');

/** @private */
let prvProps = new WeakMap();
const ATTEMPT = {}, ATTEMPT_THRESHOLD = 3;
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

class Wallet {
  /**
   * @description Electronic wallet.
   * @param {Blockchain} blockchain Blockchain associated
   * @param {{pk: Key, sk: Key}} [keyPair=genKey()]
   * @param {string} password Password to access fully access the wallet
   * @param {string} [address=generateAddress(keyPair.pk)] Hex address
   */
  constructor(blockchain, password, keyPair = genKey(), address = Wallet.generateAddress(keyPair.pk, password)) {
    prvProps.set(this, {
      address,
      password: SHA256(password),
      keyPair,
      blockchain,
      balance: 0
    }
    );
    _setAttempt(address, 0);
  }

  /**
   * @description Generate a Wallet address.
   * @param {Key} pubKey Public key of the wallet
   * @param {string} pwd Password
   * @return {string} Address
   */
  static generateAddress(pubKey, pwd) {
    return SHA256(pubKey + Date.now() + pwd).toString();
  }

  /**
   * @description Get the wallet's address.
   * @return {string} Hex address
   */
  get address() {
    return prvProps.get(this).address;
  }

  /**
   * @description Get the wallet's public key.
   * @return {Key} Public key
   */
  get publicKey() {
    return prvProps.get(this).keyPair.pk;
  }

  /**
   * @description Get the wallet's secret key.
   * @param {string} pwd Password
   * @private
   */
  _secretKey(pwd) {
    if (_getAttempt(this.address) >= ATTEMPT_THRESHOLD) throw Error('Secret key recovery attempt threshold exceeded.');
    if (pwd.toString() !== prvProps.get(this).password.toString()) {
      _setAttempt(this.address, 1 + _getAttempt(this.address));
      throw Error(`A secret key recovery was attempted on the address ${this.address} with ${_getAttempt(this.address)} attempts`);
    }
    return prvProps.get(this).keyPair.sk;
  }

  /**
   * @description Reset the recovery attempts to 0.
   * @param {string} pwd Password
   */
  reset(pwd) {
    if (pwd.toString() === prvProps.get(this).password.toString()) _setAttempt(this.address, 0);
  }

  /**
   * @description Get the wallet's balance.
   * @param {UTPool} utp Unspent transactions pool
   * @return {number} Balance from the chain
   */
  unspentBalance(utp) {
    return utp.pool[this.address];
  }

  /**
   * @description Calculate the wallet's balance by going through its associated blockchain.
   * @return {number} Calculated balance
   */
  calculateBalance() {
    let balance = 0;
    //Loop over each block and each transaction inside the block
    for (const block of this.blockchain.chain) {
      for (const tx of block.transactions) {
        //If the given address is the sender -> reduce the balance
        if (tx.fromAddr === this.address) balance -= tx.amount;
        //If the given address is the receiver -> increase the balance
        if (tx.toAddr === this.address) balance += tx.amount;
      }
    }
    return balance;
  }

  /**
   * @description Get the associated blockchain.
   * @return {Blockchain} Blockchain
   */
  get blockchain() {
    return prvProps.get(this).blockchain;
  }

  /**
   * @description String representation of the wallet.
   * @param {boolean} [cliColour=true] Add CLI colours
   * @return {string} Wallet
   */
  toString(cliColour = true) {
    return `Wallet(blockchain=${this.blockchain.toString()}, address=${this.address}, publicKey=${this.publicKey})`
  }

  /**
   * @description Create and sign a transaction.
   * @param {string} receiverAddress Address of the receiver
   * @param {number} amount Amount of coins to send
   * @param {string} pwd Password
   * @return {Transaction} Transaction
   */
  createTransaction(receiverAddress, amount, pwd) {
    let tx = new Transaction(this.address, this.publicKey, receiverAddress, amount);
    tx.sign(this._secretKey(pwd));
    return tx
  }

  /**
   * @description Get all the transactions coming from/to this wallet within its associated blockchain.
   * @return {{in: Array, out: Array}}
   * @todo Change Transaction's API to offer addresses for from/to instead of just PKs for this to work
   */
  getTransactions() {
    let txs = {
      'in': [],
      'out': []
    };
    for (const block of this.blockchain.chain) {
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
   * @param {string} pwd Password
   */
  signTransaction(tx, pwd) {
    tx.sign(this._secretKey(pwd));
  }

}

module.exports = Wallet;