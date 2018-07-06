/**
 * @see https://stackoverflow.com/a/32749533/5893085
 */
class ExtendedError extends Error {
  constructor(message, context) {
    super();
    this.message = message;
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') Error.captureStackTrace(this, this.constructor);
    else this.stack = (new Error(message)).stack; //For IE and maybe Firefox
    this.context = context;
  }
}

class TransactionError extends ExtendedError {}

class BlockError extends ExtendedError {}

class OutOfBoundsError extends ExtendedError {}

module.exports = {TransactionError, BlockError, OutOfBoundsError};