
import { FioDataStore, FioTransactionProcessingStatus, IFioBankTransaction } from '../fio_ds';
import { FioMultiDataStore } from '../fio_multi_ds';
import { createMongooseConnection, mongod } from '../jestutils';

beforeEach(() => {
  // console.log('beforeEach');
  return mongod.start();
});

afterEach(() => {
  // console.log('afterEach');
  return mongod.stop();
});

test('FioMultiDataStore', async () => {
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
 
  const fds1 = new FioDataStore(mc, 'a1');
  const fds2 = new FioDataStore(mc, 'a2');
  const fds3 = new FioDataStore(mc, 'a3');
  // fill db - a1 - 2 tr
  await fds1.storeTransactionRecord({
    ps: 'NEW',
    fioId: 1,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: 'IN',
  } as IFioBankTransaction);
  await fds1.storeTransactionRecord({
    ps: 'NEW',
    fioId: 2,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: 'IN',
  } as IFioBankTransaction);
  // fill db - a2  - 1 tr
  await fds2.storeTransactionRecord({
    ps: 'NEW',
    fioId: 3,
    fioAccountId: 'a2',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: 'IN',
  } as IFioBankTransaction);
  // full db - a3  - 1 tr
  await fds3.storeTransactionRecord({
    ps: 'NEW',
    fioId: 4,
    fioAccountId: 'a3',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: 'IN',
  } as IFioBankTransaction);

 
  // multi store - a1 , a2.
  const mds = new FioMultiDataStore(mc,['a1','a2']);

  // solve tr1, a1 - ok
  const tr1 = await mds.fetchOneNewTransaction();
  expect(tr1).not.toBeNull();
  if (tr1) {
    expect(tr1.fioAccountId).toMatch(/[12]/);
    await mds.changeTransactionStatus(tr1._id,FioTransactionProcessingStatus.SOLVED,null);
  }
  
  // solve tr2, a1 - review
  const tr2 = await mds.fetchOneNewTransaction();
  expect(tr2).not.toBeNull();
  if (tr2) {
    expect(tr2.fioAccountId).toMatch(/[12]/);
    await mds.changeTransactionStatus(tr2._id,FioTransactionProcessingStatus.REVIEW,null);
  }

  // solve tr3, a2 - ok
  const tr3 = await mds.fetchOneNewTransaction();
  expect(tr3).not.toBeNull();
  if (tr3) {
    expect(tr3.fioAccountId).toMatch(/[12]/);
    await mds.changeTransactionStatus(tr3._id,FioTransactionProcessingStatus.SOLVED,null);
  }

  // store is empty (a3 tr is not visible);
  const tr4 = await mds.fetchOneNewTransaction();
  expect(tr4).toBeNull();

  // check tr2, a1 for review
  const tr5 = await mds.fetchReviewTransactions();
  expect(tr5).toHaveLength(1);
  if (tr2) {
    expect(tr5[0]).toMatchObject({fioId:tr2.fioId});
  }

  const tr6 = await mds.fetchReviewTransactions(['a3']);
  expect(tr6).toHaveLength(0);

  mc.close();
});
