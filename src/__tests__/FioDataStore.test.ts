import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore, FioTransactionProcessingStatus, FioTransactionType, IFioBankTransaction } from '../fio_ds';

import { createMongooseConnection, mongod } from '../jestutils';

beforeEach(() => {
  //  console.log('beforeEach');
  return mongod.start();
});

afterEach(() => {
  //  console.log('afterEach');
  return mongod.stop();
});

test.skip('My FioDataStore', async () => {
  const muri = mongod.getUri('fs');
  console.log(muri);
  //const mc = await createMongooseConnection(muri);
  //const fds = new FioDataStore(mc, '123');
  //const info = await fds.getMongoVersion();
  //expect(info).toBe('4.0.25');
  //mc.close();
});

test('My FioDataStore - list,store,list', async () => {
  const muri = mongod.getUri('fs');
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, 'a1');
  const atr = await fds.fetchAllTransactions();
  expect(atr.length).toBe(0);

  expect(await fds.getLastTransaction()).toBe(null);

  const r = {
    ps: 'NEW',
    fioId: 1,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: 'IN',
  };
  const newtr = await fds.storeTransactionRecord(r as IFioBankTransaction);
  const atr2 = await fds.fetchAllTransactions();
  expect(atr2.length).toBe(1);
  expect(atr2[0]).toMatchObject({ currency: 'CZK' });

  const ltr = await fds.storeTransactionRecord({
    ps: 'NEW',
    fioId: 3,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);

  await fds.storeTransactionRecord({
    ps: 'NEW',
    fioId: 2,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);

  expect(await fds.getLastTransaction()).toMatchObject({ fioId: 3 });
  await fds.removeTransactionRecord(ltr._id);
  expect(await fds.getLastTransaction()).toMatchObject({ fioId: 2 });

  // console.log("newtr",newtr)
  mc.close();
});

test('My FioDataStore - start empty, save lastid, getlastid', async () => {
  const muri = mongod.getUri('fs');
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, 'a1');
  const fds2 = new FioDataStore(mc, 'a2');
  expect(await fds.getLastId()).toBe(null);
  expect(await fds.setLastId(2)).toBe(true);
  expect(await fds.getLastId()).toBe(2);
  expect(await fds2.getLastId()).toBe(null);
  expect(await fds2.setLastId(3)).toBe(true);
  expect(await fds.resetLastId()).toBe(true);
  expect(await fds.getLastId()).toBe(null);
  expect(await fds2.getLastId()).toBe(3);
  mc.close();
});

test('FioDataStore - duplicate write', async () => {
  const muri = mongod.getUri('fs');
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, 'a1');
  const atr = await fds.fetchAllTransactions();
  expect(atr.length).toBe(0);

  const ltr = await fds.storeTransactionRecord({
    ps: 'NEW',
    fioId: 3,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);

  const atr2 = await fds.fetchAllTransactions();
  expect(atr2.length).toBe(1);

  const ltrDup = await fds.storeTransactionRecord({
    ps: FioTransactionProcessingStatus.NEW,
    fioId: 3,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
    rawData: '',
  } as IFioBankTransaction);
  expect(ltrDup).toMatchObject({ fioId: 3 });

  expect(ltr._id.toString()).toBe(ltrDup._id.toString());

  const atr3 = await fds.fetchAllTransactions();
  expect(atr3.length).toBe(1);

  mc.close();
});

test('FioDataStore -  fetchOneNew, updateStatus', async () => {
  const muri = mongod.getUri('fs');
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, 'a1');

  expect(await fds.fetchOneNewTransaction()).toBeNull();

  const ltr = await fds.storeTransactionRecord({
    ps: 'NEW',
    fioId: 3,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);

  const nt = await fds.fetchOneNewTransaction();
  expect(nt).not.toBeNull();
  expect(nt).toMatchObject({ ps: 'NEW' });
  expect(
    await fds.changeTransactionStatus((nt as IFioBankTransaction)._id, FioTransactionProcessingStatus.SOLVED, null),
  ).toBe(true);

  expect(await fds.fetchOneNewTransaction()).toBeNull();

  mc.close();
});

test('FioDataStore -  multi ds, cross isolation', async () => {
  const muri = mongod.getUri('fs');
  const mc = await createMongooseConnection(muri);
  const fds1 = new FioDataStore(mc, 'a1');
  const fds2 = new FioDataStore(mc, 'a2');

  // start empty
  expect(await fds1.fetchOneNewTransaction()).toBeNull();
  expect(await fds2.fetchOneNewTransaction()).toBeNull();

  // tr into a1, not readable from a2
  const ltr = await fds1.storeTransactionRecord({
    ps: 'NEW',
    fioId: 3,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);

  expect(await fds1.fetchOneNewTransaction()).not.toBeNull();
  expect(await fds2.fetchOneNewTransaction()).toBeNull();

  const ltr2 = await fds2.storeTransactionRecord({
    ps: 'NEW',
    fioId: 3,
    fioAccountId: 'a2',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);

  expect(await fds1.fetchOneNewTransaction()).toMatchObject({ fioAccountId: 'a1' });
  expect(await fds2.fetchOneNewTransaction()).toMatchObject({ fioAccountId: 'a2' });

  mc.close();
});
