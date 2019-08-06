import { FetchMock } from 'jest-fetch-mock';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore, FioReader, FioSyncer } from '../index';
// tslint:disable-next-line:ordered-imports
import { IFioBankTransaction, FioTransactionProcessingStatus, FioTransactionType } from '../fio_ds';
// tslint:disable-next-line:ordered-imports
import { tdJsonDay1, tdFioAccountId, tdJsonDay0, tdJsonDayEmpty, tdJsonTrTypes } from '../__test_data__/data';
import { IFioSyncerLogger } from '../fio_syncer';

import { createMongooseConnection, mongod } from '../jestutils';

const fetchMock = fetch as FetchMock;

beforeEach(() => {
  // console.log('beforeEach');
  return mongod.start();
});

afterEach(() => {
  // console.log('afterEach');
  return mongod.stop();
});

test('My FioSyncer - first start', async () => {
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, 'a1');
  const frd = new FioReader('test_token', tdFioAccountId);
  const fs = new FioSyncer(frd, fds);

  expect(await fs.isFirstSync()).toBe(true);

  // check recover
  const tt = await fds.storeTransactionRecord({
    ps: FioTransactionProcessingStatus.NEW,
    fioId: 1,
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
    rawData: '',
  } as IFioBankTransaction);
  expect(await fs.isFirstSync()).toBe(false);
  await fds.removeTransactionRecord(tt._id);
  expect(await fs.isFirstSync()).toBe(true);

  await fds.setLastId(3);
  expect(await fs.isFirstSync()).toBe(false);
  await fds.resetLastId();
  expect(await fs.isFirstSync()).toBe(true);

  // start sequence A (db is empty)- get now day -1, rememeber lastid of last tr of the day (as lastid).
  // start sequence A2 (normal recovery), lastId is same as lasttr_id;
  // start sequence B (db has no lastId, but have transactions), get last tr, remember last tr as lastid.
  // start sequence C (db has no trs, but have lastid), do nothing;
  // start sequence D (lastid != lasttr_id) => fails!
  // - check seq A:

  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonDay0).mockResponseOnce('');

  expect(await fs.recoverSync(new Date('2019-01-31'))).toBe(true);

  expect(fetchMock.mock.calls.length).toBe(2);
  expect(fetchMock.mock.calls[0][0]).toBe(
    'https://www.fio.cz/ib_api/rest/periods/test_token/2019-01-24/2019-01-31/transactions.json',
  );
  expect(fetchMock.mock.calls[1][0]).toBe('https://www.fio.cz/ib_api/rest/set-last-id/test_token/18247668131/');

  // - check seq A2:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce('');

  const tt2 = await fds.storeTransactionRecord({
    ps: 'NEW',
    fioId: 1234,
    // tslint:disable-next-line:object-literal-sort-keys
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);
  await fds.setLastId(1234);
  expect(await fs.recoverSync(new Date('2019-01-31'))).toBe(true);
  expect(fetchMock.mock.calls.length).toBe(1);
  expect(fetchMock.mock.calls[0][0]).toBe('https://www.fio.cz/ib_api/rest/set-last-id/test_token/1234/');

  // - check seq B:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce('');
  await fds.resetLastId();
  expect(await fs.recoverSync(new Date('2019-01-31'))).toBe(true);
  expect(fetchMock.mock.calls.length).toBe(1);
  expect(fetchMock.mock.calls[0][0]).toBe('https://www.fio.cz/ib_api/rest/set-last-id/test_token/1234/');

  // - check seq C:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce('');
  await fds.setLastId(1235);
  await fds.removeTransactionRecord(tt2._id);
  expect(await fs.recoverSync(new Date('2019-01-31'))).toBe(true);
  expect(fetchMock.mock.calls.length).toBe(1);
  expect(fetchMock.mock.calls[0][0]).toBe('https://www.fio.cz/ib_api/rest/set-last-id/test_token/1235/');

  // - check seq D:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(''); // never call
  const tt3 = await fds.storeTransactionRecord({
    ps: 'NEW',
    fioId: 1235,
    // tslint:disable-next-line:object-literal-sort-keys
    fioAccountId: 'a1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
  } as IFioBankTransaction);
  await fds.setLastId(1234);
  expect(await fs.recoverSync(new Date('2019-01-31'))).toBe(false);
  expect(fetchMock.mock.calls.length).toBe(0);

  mc.close();
});

test('My FioSyncer - sync day', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonDay1);

  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, tdFioAccountId);
  const frd = new FioReader('test_token', tdFioAccountId);
  const fs = new FioSyncer(frd, fds);

  const res = await fs.syncDate(new Date('2019-07-08'));
  expect(res).toBe(true);
  expect(fetchMock.mock.calls[0][0]).toBe(
    'https://www.fio.cz/ib_api/rest/periods/test_token/2019-07-08/2019-07-08/transactions.json',
  );
  const atrs = await fds.fetchAllTransactions();
  expect(atrs.length).toBe(3);
  expect(atrs[0].fioAccountId).toBe(tdFioAccountId);
  expect(atrs[0]).toMatchObject({ fioAccountId: tdFioAccountId });
  // console.log(atrs);

  mc.close();
});

test('My FioSyncer - start (recovery A), sync last - one fetch, 2 empty', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonDay1).mockResponseOnce('');

  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, tdFioAccountId);
  const frd = new FioReader('test_token', tdFioAccountId);
  frd.test_disableThrottling();

  const fs = new FioSyncer(frd, fds);
  expect(await fs.isFirstSync()).toBe(true);
  const p = fs.recoverSync(new Date());
  expect(await p).toBe(true);

  fetchMock.mockResponseOnce(tdJsonDay1);
  expect(await fs.syncLast()).toBe(true);

  const atrs = await fds.fetchAllTransactions(); // last as first
  expect(atrs.length).toBe(3);
  expect(await fds.getLastId()).toBe(atrs[0].fioId);
  expect(await fs.isFirstSync()).toBe(false);

  fetchMock.mockResponseOnce(tdJsonDayEmpty);
  expect(await fs.syncLast()).toBe(true);

  fetchMock.mockResponseOnce(tdJsonDayEmpty);
  expect(await fs.syncLast()).toBe(true);

  mc.close();
});

test('My FioSyncer - transaction types', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonTrTypes);
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, tdFioAccountId);
  const frd = new FioReader('test_token', tdFioAccountId);
  const fs = new FioSyncer(frd, fds);

  expect(await fs.syncLast()).toBe(true);
  const atrs = await fds.fetchAllTransactions(); // last as first
  expect(atrs.length).toBe(1);
  expect(atrs[0].type).toBe(FioTransactionType.IN);

  mc.close();
});

test('My FioSyncer - logger', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonTrTypes);
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, tdFioAccountId);
  const frd = new FioReader('test_token', tdFioAccountId);
  const logger = {
    logRaw: jest.fn(),
    logTransaction: jest.fn(),
  };
  logger.logRaw.mockResolvedValue(true);
  logger.logTransaction.mockResolvedValue(true);
  const fs = new FioSyncer(frd, fds, logger);

  expect(await fs.syncLast()).toBe(true);
  const atrs = await fds.fetchAllTransactions(); // last as first
  expect(atrs.length).toBe(1);
  expect(atrs[0].type).toBe(FioTransactionType.IN);
  expect(logger.logRaw.mock.calls.length).toBe(1);
  expect(logger.logRaw).toHaveBeenCalledWith(
    '{"method":"syncLast","args":[],"result":{"accountStatement":{"info":{"accountId":"2901234567","bankId":"2010","currency":"CZK","iban":"CZ8120100000002901234567","bic":"FIOBCZPPXXX","idFrom":18247244228,"idTo":18247668131,"idLastDownload":null},"transactionList":{"transaction":[{"id":21369426788,"date":"2019-07-08+0200","amount":3400,"currency":"CZK","type":"Bezhotovostní příjem","fAccountId":"613989173","fBankId":"0800","fAccountName":"Kovář Marek","fBankName":"Česká spořitelna, a.s.","ks":"0000","vs":"99038366","ss":null,"userRef":"Kovář Marek","userMsg":"D101","comment":"Kovář Marek","rawData":"{\\"column22\\":{\\"value\\":21369426788,\\"name\\":\\"ID pohybu\\",\\"id\\":22},\\"column0\\":{\\"value\\":\\"2019-07-08+0200\\",\\"name\\":\\"Datum\\",\\"id\\":0},\\"column1\\":{\\"value\\":3400,\\"name\\":\\"Objem\\",\\"id\\":1},\\"column14\\":{\\"value\\":\\"CZK\\",\\"name\\":\\"Měna\\",\\"id\\":14},\\"column2\\":{\\"value\\":\\"613989173\\",\\"name\\":\\"Protiúčet\\",\\"id\\":2},\\"column10\\":{\\"value\\":\\"Kovář Marek\\",\\"name\\":\\"Název protiúčtu\\",\\"id\\":10},\\"column3\\":{\\"value\\":\\"0800\\",\\"name\\":\\"Kód banky\\",\\"id\\":3},\\"column12\\":{\\"value\\":\\"Česká spořitelna, a.s.\\",\\"name\\":\\"Název banky\\",\\"id\\":12},\\"column4\\":{\\"value\\":\\"0000\\",\\"name\\":\\"KS\\",\\"id\\":4},\\"column5\\":{\\"value\\":\\"99038366\\",\\"name\\":\\"VS\\",\\"id\\":5},\\"column6\\":null,\\"column7\\":{\\"value\\":\\"Kovář Marek\\",\\"name\\":\\"Uživatelská identifikace\\",\\"id\\":7},\\"column16\\":{\\"value\\":\\"D101\\",\\"name\\":\\"Zpráva pro příjemce\\",\\"id\\":16},\\"column8\\":{\\"value\\":\\"Bezhotovostní příjem\\",\\"name\\":\\"Typ\\",\\"id\\":8},\\"column9\\":null,\\"column18\\":null,\\"column25\\":{\\"value\\":\\"Kovář Marek\\",\\"name\\":\\"Komentář\\",\\"id\\":25},\\"column26\\":null,\\"column17\\":{\\"value\\":25021190533,\\"name\\":\\"ID pokynu\\",\\"id\\":17}}"}]}}}}',
  );
  expect(logger.logTransaction.mock.calls.length).toBe(1);

  mc.close();
});
