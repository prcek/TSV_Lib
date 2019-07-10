import { FetchMock } from 'jest-fetch-mock';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore, FioReader, FioSyncer } from '../index';
// tslint:disable-next-line:ordered-imports
import { IFioBankTransaction, FioTransactionProcessingStatus, FioTransactionType } from '../fio_ds';
// tslint:disable-next-line:ordered-imports
import { tdJsonDay1, tdFioAccountId, tdJsonDay0, tdJsonDayEmpty, tdJsonTrTypes } from '../__test_data__/data';

const fetchMock = fetch as FetchMock;

const mongod = new MongoMemoryServer({debug:false, autoStart:false});

async function createMongooseConnection(mongoUri: string): Promise<mongoose.Connection> {
  const mongooseOpts = { // options for mongoose 4.11.3 and above
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      // tslint:disable-next-line:object-literal-sort-keys
      reconnectInterval: 1000,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
  };

  const mongooseConnection = await mongoose.createConnection(mongoUri, mongooseOpts);
  return mongooseConnection;
}


beforeEach( () => {
 // console.log('beforeEach');
  return mongod.start();
});

afterEach( () => {
 // console.log('afterEach');
  return mongod.stop()
});

test('My FioSyncer - first start',  async () => {
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc,"a1");
  const frd = new FioReader("test_token");
  const fs = new FioSyncer(frd,fds);

  expect(await fs.isFirstSync()).toBe(true);

  // check recover
  const tt = await fds.storeTransactionRecord( {
    ps: FioTransactionProcessingStatus.NEW,
    fioId: 1,
    fioAccountId: "a1",
    date: new Date("2019-10-10"),
    amount: 100,
    currency: "CZK",
    type: FioTransactionType.IN,
    rawData: ""
  } as IFioBankTransaction);
  expect(await fs.isFirstSync()).toBe(false);
  await fds.removeTransactionRecord(tt._id)
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
  fetchMock.mockResponseOnce(tdJsonDay0).mockResponseOnce(""); 
    
  expect(await fs.recoverSync(new Date("2019-01-31"))).toBe(true);
 

  expect(fetchMock.mock.calls.length).toBe(2);
  expect(fetchMock.mock.calls[0][0]).toBe("https://www.fio.cz/ib_api/rest/periods/test_token/2019-01-24/2019-01-31/transactions.json");
  expect(fetchMock.mock.calls[1][0]).toBe("https://www.fio.cz/ib_api/rest/set-last-id/test_token/18247668131/");


  // - check seq A2:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce("");

  const tt2 = await fds.storeTransactionRecord( {
    fioId: 1234,
    // tslint:disable-next-line:object-literal-sort-keys
    fioAccountId: "a1",
    date: new Date("2019-10-10"),
    amount: 100,
    currency: "CZK",
    type: FioTransactionType.IN,
  } as IFioBankTransaction);
  await fds.setLastId(1234);
  expect(await fs.recoverSync(new Date("2019-01-31"))).toBe(true);
  expect(fetchMock.mock.calls.length).toBe(1);
  expect(fetchMock.mock.calls[0][0]).toBe("https://www.fio.cz/ib_api/rest/set-last-id/test_token/1234/");

  // - check seq B:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce("");
  await fds.resetLastId();
  expect(await fs.recoverSync(new Date("2019-01-31"))).toBe(true);
  expect(fetchMock.mock.calls.length).toBe(1);
  expect(fetchMock.mock.calls[0][0]).toBe("https://www.fio.cz/ib_api/rest/set-last-id/test_token/1234/");


  // - check seq C:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce("");
  await fds.setLastId(1235);
  await fds.removeTransactionRecord(tt2._id)
  expect(await fs.recoverSync(new Date("2019-01-31"))).toBe(true);
  expect(fetchMock.mock.calls.length).toBe(1);
  expect(fetchMock.mock.calls[0][0]).toBe("https://www.fio.cz/ib_api/rest/set-last-id/test_token/1235/");

  // - check seq D:
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(""); // never call
  const tt3 = await fds.storeTransactionRecord( {
    fioId: 1235,
    // tslint:disable-next-line:object-literal-sort-keys
    fioAccountId: "a1",
    date: new Date("2019-10-10"),
    amount: 100,
    currency: "CZK",
    type: FioTransactionType.IN,
  } as IFioBankTransaction);
  await fds.setLastId(1234);
  expect(await fs.recoverSync(new Date("2019-01-31"))).toBe(false);
  expect(fetchMock.mock.calls.length).toBe(0);

});


test('My FioSyncer - sync day',  async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonDay1);


  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, tdFioAccountId);
  const frd = new FioReader("test_token");
  const fs = new FioSyncer(frd,fds);

  const res = await fs.syncDate(new Date("2019-07-08"));
  expect(res).toBe(true);
  expect(fetchMock.mock.calls[0][0]).toBe("https://www.fio.cz/ib_api/rest/periods/test_token/2019-07-08/2019-07-08/transactions.json");
  const atrs = await fds.fetchAllTransactions();
  expect(atrs.length).toBe(3);
  expect(atrs[0].fioAccountId).toBe(tdFioAccountId);
  expect(atrs[0]).toMatchObject({fioAccountId:tdFioAccountId});
 // console.log(atrs);

  mc.close();

 
});

test('My FioSyncer - start (recovery A), sync last - one fetch, 2 empty',  async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonDay1).mockResponseOnce("");


  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, tdFioAccountId);
  const frd = new FioReader("test_token");
  frd.test_disableThrottling();
  
  const fs = new FioSyncer(frd,fds);
  expect(await fs.isFirstSync()).toBe(true);
  const p = fs.recoverSync(new Date());
  expect(await p).toBe(true);
  

  fetchMock.mockResponseOnce(tdJsonDay1);
  expect(await fs.syncLast()).toBe(true);

  const atrs = await fds.fetchAllTransactions();  // last as first
  expect(atrs.length).toBe(3);
  expect(await fds.getLastId()).toBe(atrs[0].fioId);
  expect(await fs.isFirstSync()).toBe(false);


  fetchMock.mockResponseOnce(tdJsonDayEmpty);
  expect(await fs.syncLast()).toBe(true);

  fetchMock.mockResponseOnce(tdJsonDayEmpty);
  expect(await fs.syncLast()).toBe(true);

  mc.close();


});


test('My FioSyncer - transaction types',  async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonTrTypes);
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc, tdFioAccountId);
  const frd = new FioReader("test_token");
  const fs = new FioSyncer(frd,fds);

  expect(await fs.syncLast()).toBe(true);
  const atrs = await fds.fetchAllTransactions();  // last as first
  expect(atrs.length).toBe(1);
  expect(atrs[0].type).toBe(FioTransactionType.IN);

  mc.close();
});
