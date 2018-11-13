const UTPool = require('../src/utpool'),
  gen = require('../src/crypto').genKey,
  { BANK, init } = require('../src/config'),
  Wallet = require('../src/wallet');

test('Init', () => {
  let utp = new UTPool(), addr = Wallet.generateAddress(gen().pk, '');
  expect(utp.pool).toStrictEqual({});
  utp.addUT(addr, 1);
  expect(utp.pool).toStrictEqual({[addr]: 1});
  utp.addUT(addr, 2);
  expect(utp.pool).toStrictEqual({[addr]: 3});
  let adr = Wallet.generateAddress(gen().pk, '');
  utp.addUT(adr, 5);
  expect(utp.pool[adr]).toBe(5);
  expect(() => utp.addUT(adr, '2')).toThrowError(TypeError);
  expect(() => utp.addUT(adr, null)).toThrowError('The UT amount needs to be a number not null');
});

test('Configured', () => {
  init();
  let utp = BANK.pool.clone(), addr = Wallet.generateAddress(gen().pk, ' ');
  expect(utp).toStrictEqual(BANK.pool);
  expect(utp.toString()).toBe(`UTPool({"${BANK.address}":${BANK.amount}})`);
  utp.addUT(addr, 3);
  expect(utp).not.toBe(BANK.pool);
  expect(utp.toString()).not.toBe(BANK.pool.toString());
});

test('Catching the 32', () => {
  let addr = Wallet.generateAddress(gen().pk, ''), utp = new UTPool({[addr]: '123'});
  utp.addUT(addr, 4); //Should reach l.32
  expect(utp.pool[addr]).toBe(127);
});