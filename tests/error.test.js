const {TransactionError, BlockError, OutOfBoundsError} = require('../src/error');

test('TransactionError', () => {
  expect(() => {
    throw new TransactionError();
  }).toThrowError(TransactionError);
  let txt = 'Invalid tx', named = () => {
    throw new TransactionError(txt);
  };
  expect(named).toThrowError(TransactionError);
  expect(named).toThrowError(txt);
  let ctxted = () => {
    throw new TransactionError(txt, test);
  };
  expect(ctxted).toThrowError(txt);
  let gstack = () => {
    let stk = null;
    try {
      throw new TransactionError();
    } catch (err) {
      stk = err.stack;
    }
    return stk;
  };
  expect(typeof gstack()).toBe('string');
  expect(gstack().startsWith('TransactionError')).toBeTruthy();
});


test('BlockError', () => {
  expect(() => {
    throw new BlockError();
  }).toThrowError(BlockError);
  let txt = 'Invalid block', named = () => {
    throw new BlockError(txt);
  };
  expect(named).toThrowError(BlockError);
  expect(named).toThrowError(txt);
  let ctxted = () => {
    throw new BlockError(txt, test);
  };
  expect(ctxted).toThrowError(txt);
  let gstack = () => {
    let stk = null;
    try {
      throw new BlockError();
    } catch (err) {
      stk = err.stack;
    }
    return stk;
  };
  expect(typeof gstack()).toBe('string');
  expect(gstack().startsWith('BlockError')).toBeTruthy();
});

test('OOBError', () => {
  expect.assertions(3);
  let txt = 'Too big', ctxted = () => {
    throw new OutOfBoundsError(txt, test);
  };
  expect(ctxted).toThrowError(txt);
  return new Promise((resolve) => {
    resolve(() => {
      throw new OutOfBoundsError('i too big');
    })
  }).then(f => {
    expect(f).toThrowError('i too big');
    expect(f).toThrowError(OutOfBoundsError);
  }).catch(err => console.log('err:', err));
  let gstack = () => {
    let stk = null;
    try {
      throw new OutOfBoundsError();
    } catch (err) {
      stk = err.stack;
    }
    return stk;
  };
  expect(typeof gstack()).toBe('string');
  expect(gstack().startsWith('OutOfBoundsError')).toBeTruthy();
});