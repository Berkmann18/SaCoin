const { use } = require('../src/utils');


test('Init', () => {
  // expect()
  let inp = () => console.log(use('in', 'Input'));
  expect(inp).toThrowError('The name in isn\'t specified in the theme used');
  expect(use('out', 'Output')).not.toStrictEqual('Output');
  expect(use('info', 'Info')).not.toStrictEqual('Info');
  expect(typeof use('error', 'Error')).toStrictEqual('string');
  expect(typeof use('warn', 'Warning')).toStrictEqual('string');
});

test('This', () => {
  // setColours();
  expect(use('block', 'Block(...)')).not.toStrictEqual('Block(...)');
  expect(use('block', 'Block(...)')).toBeDefined();
  expect(use('tx', 'Transaction(...)')).not.toStrictEqual('Transaction(...)');
  expect(use('tx', 'Transaction(...)')).toBeDefined();
  expect(use('chain', 'Blockchain(...)')).not.toStrictEqual('Blockchain(...)');
  expect(use('chain', 'Blockchain(...)')).toBeDefined();
  let wrong = () => use('wallet', 'Wallet(...)');
  expect(wrong).toThrow('The name wallet isn\'t specified in the theme used');
});