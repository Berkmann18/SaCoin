'use strict';

const {TRANSACTION_FEE} = require('./config'), {verify, sign} = require('./crypto'), SHA256 = require('crypto-js/sha256'), {setColours, colour} = require('./cli');

setColours();

/** @private */
let prvProps = new WeakMap();

class Transaction {
  /**
   *@description Crypto transaction.
   * @param {string} fromAddr Address of the sender
   * @param {Key} fromPubKey Public key of the sender
   * @param {string} toAddr Wallet of the receiver
   * @param {number} amount Amount of coins
   * @param {string=} signature Signature of the sender
   * @param {number} [fee=0] Transaction fee
   * @version 2
   */
  constructor(fromAddr, fromPubKey, toAddr, amount = 0, signature, fee = TRANSACTION_FEE) {
    prvProps.set(this, {
      fromAddr,
      fromPubKey,
      toAddr,
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
    return SHA256(this.fromAddr + this.toAddr + this.amount/* + this.fee*/ + this.timestamp).toString();
  }

  /**
   * @description Update the hash of the block.
   */
  updateHash() {
    prvProps.get(this).hash = this.calculateHash();
  }

  /**
   * @description Get the sender's address.
   * @return {string} Address of the origin
   */
  get fromAddr() {
    return prvProps.get(this).fromAddr;
  }

  /**
   * @description Get the receiver's address.
   * @return {string} Address of the destination
   */
  get toAddr() {
    return prvProps.get(this).toAddr;
  }

  /**
   * @description Get the public key the transaction comes from.
   * @return {Key} Origin
   */
  get fromPubKey() {
    return prvProps.get(this).fromPubKey;
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
   * @description Change the transaction fee.
   * @param {number} val New fee
   */
  set fee(val) {
    prvProps.get(this).fee = val;
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
   * @param {Key} sk Secret key
   */
  sign(sk) {
    prvProps.get(this).signature = sign(sk, this.hash);
  }

  /**
   * @description Check if the hash is valid.
   * @return {boolean} Validity
   */
  isValid() {
    return this.hash === this.calculateHash() && this.hasValidSignature() && this.amount > 0 && this.fee >= 0
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
   * @param {boolean} [cliColour=true] Add the CLI colour.
   * @return {string} Transaction
   */
  toString(cliColour = true) {
    let str = `Transaction(fromAddr=${this.fromAddr}, fromPubKey=${this.fromPubKey}, toAddr=${this.toAddr}, amount=${this.amount}, timestamp=${this.timestamp}, fee=${this.fee}, hash=${this.hash})`;
    return cliColour ? colour('tx', str) : str;
  }
}

module.exports = Transaction;