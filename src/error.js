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
   * @param {*} context Context in which the error happened
   */
  constructor(message, context) {
    super();
    this.message = message;
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') Error.captureStackTrace(this, this.constructor);
    else this.stack = (new Error(message)).stack; //For IE and maybe Firefox
    this.context = context;
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