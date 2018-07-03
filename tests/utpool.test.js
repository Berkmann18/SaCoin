const UTPool = require('../src/utpool'), gen = require('../src/crypto').genKey;

test('Init', () => {
  let utp = new UTPool(), pk = gen().pk;
  expect(utp.pool).toStrictEqual({});
  utp.addUT(pk, 1);
  expect(utp.pool).toStrictEqual({[pk]: 1});
  utp.addUT(pk, 2);
  expect(utp.pool).toStrictEqual({[pk]: 3});
});