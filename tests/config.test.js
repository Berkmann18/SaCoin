const cfg = require('../src/config'), Wallet = require('../src/wallet'), Blockchain = require('../src/blockchain');

test('Static', () => {
  expect(cfg.DIFFICULTY >= 1).toBeTruthy();
  expect(cfg.MINING_REWARD >= 10).toBeTruthy();
  expect(cfg.CURRENCY).toBe('XSC');
  expect(cfg.TRANSACTION_FEE >= 1).toBeTruthy();
});

test('BANK', () => {
  expect(typeof cfg.BANK).toBe('object');
  expect(typeof cfg.BANK.pk).toBe('object');
  expect(cfg.BANK.pk).not.toStrictEqual(cfg.BANK.sk);
  expect(cfg.BANK.amount >= 500).toBeTruthy();
  expect(cfg.BANK.wallet).toBe(null);
  expect(typeof cfg.BANK.address).toBe('object');
  expect(cfg.BLOCKCHAIN).toBe(null);
  cfg.init();
  expect(cfg.BANK.wallet instanceof Wallet).toBeTruthy();
  expect(cfg.BANK.address.length > 5).toBeTruthy();
  expect('pool' in cfg.BANK.pool).toBeTruthy();
  expect(cfg.BANK.pool.pool[cfg.BANK.address]).toBe(cfg.BANK.amount);
  expect(cfg.BANK.pool.pool).toStrictEqual({[cfg.BANK.address]: cfg.BANK.amount});
  expect(cfg.BLOCKCHAIN instanceof Blockchain).toBeTruthy();
});