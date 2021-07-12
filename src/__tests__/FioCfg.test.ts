import { createFioCfgFromEnv, FioCfg } from '../index';

test('FioCfg', async () => {
  const cfg = new FioCfg();
  expect(cfg.anyFio()).toBe(false);
  cfg.addFio('a1', 't1', 'f1');
  expect(cfg.anyFio()).toBe(true);

  expect(() => cfg.addFio('a1', 't1', 'f1')).toThrow(); // duplicate account
  expect(() => cfg.addFio('a2', 't1', 'f1')).toThrow(); // duplicate token
  expect(() => cfg.addFio('a2', 't2', 'f1')).not.toThrow();
});

test('FioCfg - read env', () => {
  const cfg = createFioCfgFromEnv();
  expect(cfg.anyFio()).toBe(false);
  process.env.BANK_FIO_ON_SRO = 'true';

  expect(() => createFioCfgFromEnv()).toThrow();
  process.env.BANK_FIO_TOKEN_SRO = 't1';
  process.env.BANK_FIO_ACCOUNT_ID_SRO = 'a1';
  const cfg2 = createFioCfgFromEnv();
  expect(cfg2.anyFio()).toBe(true);

  process.env.BANK_FIO_ON_LB = 'true';
  process.env.BANK_FIO_TOKEN_LB = 't2';
  process.env.BANK_FIO_ACCOUNT_ID_LB = 'a2';

  process.env.BANK_FIO_ON_AB = 'true';
  process.env.BANK_FIO_TOKEN_AB = 't3';
  process.env.BANK_FIO_ACCOUNT_ID_AB = 'a3';

  const cfg3 = createFioCfgFromEnv();
  expect(cfg3.anyFio()).toBe(true);
  expect(cfg3.getList()).toHaveLength(3);

  cfg3.addFio('a4', 't4', 'ab');
  const fa = cfg3.getFirmAccounts();
  // console.log(fa);
  expect(fa).toHaveProperty('sro', ['a1']);
  expect(fa).toHaveProperty('lb', ['a2']);
  expect(fa).toHaveProperty('ab', ['a3', 'a4']);

  const aa = cfg3.getAllAccounts();
  expect(aa).toEqual(['a1', 'a2', 'a3', 'a4']);

  process.env.BANK_FIO_ON_LB = 'false';
  const cfg4 = createFioCfgFromEnv();
  expect(cfg4.anyFio()).toBe(true);
  expect(cfg4.getList()).toHaveLength(2);

  process.env.BANK_FIO_ON_AB = 'false';
  process.env.BANK_FIO_ON_SRO = 'false';
  const cfg5 = createFioCfgFromEnv();
  expect(cfg5.anyFio()).toBe(false);


  process.env.BANK_FIO_ON_LB = 'true';
  process.env.BANK_FIO_ON_ZS = 'true';
  process.env.BANK_FIO_TOKEN_ZS = 'tzs';
  process.env.BANK_FIO_ACCOUNT_ID_ZS = 'a_zs';
  const cfg6 = createFioCfgFromEnv();
  expect(cfg6.anyFio()).toBe(true);
  const aa2 = cfg6.getAllAccounts();
  expect(aa2).toEqual(['a2','a_zs']);

});
