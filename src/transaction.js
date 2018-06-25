'use strict';

const {TRANSACTION_FEE} = require('./config'), {verify, sign} = require('./crypto'), SHA256 = require('crypto-js/sha256');

/** @private */
let prvProps = new WeakMap();

class Transaction {
  /**
   *@description Crypto transaction.
   * @param {Key} fromPubKey Public key of the sender
   * @param {Key} toPubKey Public key of the receiver
   * @param {number} amount Amount of coins
   * @param {string=} signature Signature of the sender
   * @param {number} [fee=0] Transaction fee
   */
  constructor(fromPubKey, toPubKey, amount = 0, signature, fee = TRANSACTION_FEE) {
    prvProps.set(this, {
      fromPubKey,
      toPubKey,
      amount,
      signature,
      hash: null,
      timestamp: Date.now(),
      fee
    });
    this.updateHash();
  }

  /**
   * @description Calculate the hash of the transaction.
   * @return {string} Hash
   */
  calculateHash() {
    return SHA256(this.fromPubKey + this.toPubKey + this.amount + this.fee + this.timestamp).toString();
  }

  /**
   * @description Update the hash of the block.
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash();
  }

  /**
   * @description Get the address the transaction comes from.
   * @return {Key} Origin
   */
  get fromPubKey() {
    return prvProps.get(this).fromPubKey;
  }

  /**
   * @description Get the address the transaction goes to.
   * @return {Key} Destination
   */
  get toPubKey() {
    return prvProps.get(this).toPubKey;
  }

  /**
   * @description Get the transaction's amount.
   * @return {number} Coins
   */
  get amount() {
    return prvProps.get(this).amount;
  }

  /**
   * @description Get the transaction's timestamp.
   * @return {number} Timestamp
   */
  get timestamp() {
    return prvProps.get(this).timestamp;
  }


  /**
   * @description Get the transaction's hash.
   * @return {string} Hash
   */
  get hash() {
    return prvProps.get(this).hash;
  }

  /**
   * @description Get the transaction's fee.
   * @return {number} Fee
   */
  get fee() {
    return prvProps.get(this).fee;
  }

  /**
   * @description Get the transaction's signature.
   * @return {string} Signature
   */
  get signature() {
    return prvProps.get(this).signature;
  }

  /**
   * @description Sign this transaction with a given private key.
   * @param {RSAKey} sk Secret key
   */
  sign(sk) {
    prvProps.get(this).signature = sign(sk, this.hash);
  }

  /**
   * @description Check if the hash is valid.
   * @return {boolean} Validity
   */
  isValid() {
    return this.hash === this.calculateHash()
  }

  /**
   * @description Check if the signature is valid.
   * @return {boolean} Validity
   */
  hasValidSignature() {
    return this.signature && verify(this.fromPubKey, this.hash, this.signature);
  }

  /**
   * @description String representation of a transaction.
   * @return {string} Transaction
   */
  toString() {
    return `Transaction(fromPubKey=${this.fromPubKey}, toPubKey=${this.toPubKey}, amount=${this.amount}, timestamp=${this.timestamp}, fee=${this.fee}, hash=${this.hash})`;
  }
}

module.exports = Transaction;