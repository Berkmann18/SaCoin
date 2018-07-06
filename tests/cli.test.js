const {setColours, colour, clrScheme} = require('../src/cli');


test('Init', () => {
  // expect()
  let inp = () => console.log(colour('in', 'Input'));
  expect(inp).toThrowError(TypeError); //clr.in is not a function
  setColours();
  expect(inp).toBeDefined();
  expect(colour('out', 'Output')).not.toBe('Output');
  expect(colour('inf', 'Info')).not.toBe('Info');
  expect(typeof colour('err', 'Error')).toBe('string');
  expect(typeof colour('warn', 'Warning')).toBe('string');
});

test('This', () => {
  setColours();
  expect(colour('block', 'Block(...)')).not.toBe('Block(...)');
  expect(colour('block', 'Block(...)')).toBeDefined();
  expect(colour('tx', 'Transaction(...)')).not.toBe('Transaction(...)');
  expect(colour('tx', 'Transaction(...)')).toBeDefined();
  expect(colour('chain', 'Blockchain(...)')).not.toBe('Blockchain(...)');
  expect(colour('chain', 'Blockchain(...)')).toBeDefined();
  let wrong = () => colour('wallet', 'Wallet(...)');
  expect(wrong).toThrow('The name wallet isn\'t specified in the theme used');
});