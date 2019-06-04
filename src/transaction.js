'use strict';

/**
 * @fileoverview Cryptocurrency transactions.
 * @module
 */

const { use } = require('./utils'),
  SHA256 = require('crypto-js/sha256');
const { verify, sign } = require('./crypto'),
  { TRANSACTION_FEE } = require('./config');

/** @private */
let prvProps = new WeakMap();

/**
 * @class Transaction
 */
class Transaction {
  /**
   * @description Crypto transaction.
   * @param {Object} obj Details of the transaction
   * @param {string} obj.fromAddr Address of the sender
   * @param {Key} obj.fromPubKey Public key of the sender
   * @param {string} obj.toAddr Address of the receiver
   * @param {number} [obj.amount=0] Amount of coins
   * @param {string=} [obj.sig] Signature of the sender
   * @param {number} [obj.fee=0] Transaction fee
   * @version 3
   * @memberof Transaction
   * @throws {Error} No fromAddr/fromPubKey/toAddr property
   */
  constructor({
    fromAddr, fromPubKey,
    toAddr,
    amount = 0,
    sig,
    fee = TRANSACTION_FEE
  } = {}) {
    if (!fromAddr || !fromPubKey || !toAddr) throw new Error('A transaction needs to have a fromAddr, fromPubKey and toAddr property');
    prvProps.set(this, {
      fromAddr,
      fromPubKey,
      toAddr,
      amount,
      sig,
      hash: null,
      timestamp: Date.now(),
      fee
    });
    this.updateHash();
  }

  /**
   * @description Calculate the hash of the transaction.
   * @return {string} Hash
   * @memberof Transaction
   */
  calculateHash() {
    return SHA256(this.fromAddr + this.toAddr + this.amount /* + this.fee*/ + this.timestamp).toString();
  }

  /**
   * @description Update the hash of the block.
   * @memberof Transaction
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash();
  }

  /**
   * @description Get the sender's address.
   * @return {string} Address of the origin
   * @memberof Transaction
   */
  get fromAddr() {
    return prvProps.get(this).fromAddr;
  }

  /**
   * @description Get the receiver's address.
   * @return {string} Address of the destination
   * @memberof Transaction
   */
  get toAddr() {
    return prvProps.get(this).toAddr;
  }

  /**
   * @description Get the public key the transaction comes from.
   * @return {Key} Origin
   * @memberof Transaction
   */
  get fromPubKey() {
    return prvProps.get(this).fromPubKey;
  }

  /**
   * @description Get the transaction's amount.
   * @return {number} Coins
   * @memberof Transaction
   */
  get amount() {
    return prvProps.get(this).amount;
  }

  /**
   * @description Get the transaction's timestamp.
   * @return {number} Timestamp
   * @memberof Transaction
   */
  get timestamp() {
    return prvProps.get(this).timestamp;
  }


  /**
   * @description Get the transaction's hash.
   * @return {string} Hash
   * @memberof Transaction
   */
  get hash() {
    return prvProps.get(this).hash;
  }

  /**
   * @description Get the transaction's fee.
   * @return {number} Fee
   * @memberof Transaction
   */
  get fee() {
    return prvProps.get(this).fee;
  }

  /**
   * @description Change the transaction fee.
   * @param {number} val New fee
   * @memberof Transaction
   */
  set fee(val) {
    prvProps.get(this).fee = val;
  }

  /**
   * @description Get the transaction's signature.
   * @return {string} Signature
   * @memberof Transaction
   */
  get sig() {
    return prvProps.get(this).sig;
  }

  /**
   * @description Sign this transaction with a given private key.
   * @param {Key} sk Secret key
   * @memberof Transaction
   */
  sign(sk) {
    prvProps.get(this).sig = sign(sk, this.hash);
  }

  /**
   * @description Check if the hash is valid.
   * @return {boolean} Validity
   * @memberof Transaction
   */
  isValid() {
    return this.hash === this.calculateHash() && this.hasValidSignature() && this.amount > 0 && this.fee >= 0
  }

  /**
   * @description Check if the signature is valid.
   * @return {boolean} Validity
   * @memberof Transaction
   */
  hasValidSignature() {
    return this.sig && verify({
      pubKey: this.fromPubKey,
      msg: this.hash,
      sig: this.sig
    });
  }

  /**
   * @description String representation of a transaction.
   * @param {boolean} [cliColour=true] Add the CLI colour.
   * @return {string} Transaction
   * @memberof Transaction
   */
  toString(cliColour = true) {
    let str = `Transaction(fromAddr=${this.fromAddr}, fromPubKey=${this.fromPubKey}, toAddr=${this.toAddr}, amount=${this.amount}, timestamp=${this.timestamp}, fee=${this.fee}, hash=${this.hash})`;
    return cliColour ? use('tx', str) : str;
  }
}

module.exports = Transaction;