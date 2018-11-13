/**
 * @fileoverview Error definitions.
 * @module
 * @see https://stackoverflow.com/a/32749533/5893085
 */

/**
 * @class ExtendedError
 * @description Extended error.
 * @protected
 */
class ExtendedError extends Error {
  /**
   * @description Create a custom (extended) error.
   * @param {string} message Error message
   * @param {...*} params Extra parameters
   */
  constructor(message, ...params) {
    super(...params);
    this.message = message;
    this.name = this.constructor.name;
    Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @class TransactionError
 * @augments ExtendedError
 */
class TransactionError extends ExtendedError {}

/**
 * @class BlockError
 * @augments ExtendedError
 */
class BlockError extends ExtendedError {}

/**
 * @class OutOfBoundsError
 * @augments ExtendedError
 */
class OutOfBoundsError extends ExtendedError {}

module.exports = { TransactionError, BlockError, OutOfBoundsError };