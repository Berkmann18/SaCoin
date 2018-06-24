const {TransactionError, BlockError, OutOfBoundsError} = require('../src/error');

test('BlockError', () => {
  expect(() => {
    throw new TransactionError();
  }).toThrowError(TransactionError);
});


test('BlockError', () => {
  expect(() => {
    throw new BlockError();
  }).toThrowError(BlockError);
});

test('OOBError', () => {
  expect.assertions(2);
  return new Promise((resolve) => {
    resolve(() => {
      throw new OutOfBoundsError('i too big');
    })
  }).then(f => {
    expect(f).toThrowError('i too big');
    expect(f).toThrowError(OutOfBoundsError);
  }).catch(err => console.log('err:', err));
});