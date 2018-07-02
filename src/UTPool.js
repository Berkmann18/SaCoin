'use strict';

const /*clone = require('./utils').clone*/ clone = require('lodash/clone'), {TransactionError} = require('./error');

/** @private */
let prvProps = new WeakMap();

class UnspentTransaction {
  /**
   * @description Unspent transaction object.
   * @param {string} address Address
   * @param {number} amount Amount of coins
   */
  constructor(address, amount) {
    this.address = address;
    this.amount = amount
  }
}

class UTPool {
  /**
   * @description Unspent Transaction Pool.
   * @param {Object} [pool={}] Pool where keys are wallet addresses and values are the amount of unspent coins
   */
  constructor(pool = {}) {
    prvProps.set(this, {pool})
  }

  get pool() {
    return prvProps.get(this).pool;
  }

  /**
   * @description Add an unspent transaction
   * @param {string} addr Wallet address
   * @param {number} amount Amount of coins
   * @throws {TypeError} amount isn't a number
   */
  addUT(addr, amount) {
    if (typeof amount !== 'number') throw new TypeError(`The UT amount needs to be a number not ${amount}`);
    let pool = prvProps.get(this).pool;

    if (pool[addr]) {
      if (typeof pool[addr] !== 'number') pool[addr] = Number(pool[addr]);
      pool[addr] += amount;
    }
    else pool[addr] = amount
  }

  /**
   * @description Clone the pool.
   * @return {UTPool} Clone
   */
  clone() {
    return new UTPool(clone(this.pool))
  }

  /**
   * @description String representation.
   * @return {string} UTPool
   */
  toString() {
    return `UTPool(${JSON.stringify(this.pool)})`;
  }
}

module.exports = UTPool;