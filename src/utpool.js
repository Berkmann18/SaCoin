'use strict';

/**
 * @fileoverview Transaction pool.
 * @module
 */

const clone = require('lodash/clone');

/** @private */
let prvProps = new WeakMap();

/**
 * @class UTPool
 * @description Unspent Transaction Pool.
 */
class UTPool {
  /**
   * @description UTPool constructor.
   * @param {Object} [pool={}] Pool where keys are wallet addresses and values are the amount of unspent coins
   * @memberof UTPool
   */
  constructor(pool = {}) {
    prvProps.set(this, { pool })
  }

  /**
   * @description Get the UT's pool.
   * @return {Object} pool
   * @memberof UTPool
   */
  get pool() {
    return prvProps.get(this).pool;
  }

  /**
   * @description Add an unspent transaction
   * @param {string} addr Wallet address
   * @param {number} amount Amount of coins
   * @throws {TypeError} amount isn't a number
   * @memberof UTPool
   */
  addUT(addr, amount) {
    if (typeof amount !== 'number') throw new TypeError(`The UT amount needs to be a number not ${amount}`);
    let pool = prvProps.get(this).pool;
    /* eslint-disable security/detect-object-injection */
    if (pool[addr]) {
      if (typeof pool[addr] !== 'number') pool[addr] = Number(pool[addr]);
      pool[addr] += amount;
    } else pool[addr] = amount
    /* eslint-enable security/detect-object-injection */
  }

  /**
   * @description Clone the pool.
   * @return {UTPool} Clone
   * @memberof UTPool
   */
  clone() {
    return new UTPool(clone(this.pool))
  }

  /**
   * @description String representation.
   * @return {string} UTPool
   * @memberof UTPool
   */
  toString() {
    return `UTPool(${JSON.stringify(this.pool)})`;
  }
}

module.exports = UTPool;