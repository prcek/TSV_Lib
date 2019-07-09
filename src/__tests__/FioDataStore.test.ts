import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore, IFioBankTransaction } from '../fio_ds';


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



test('My FioDataStore',  async () => {
 
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc,"123");
  const info = await fds.getMongoVersion();
  expect(info).toBe("4.0.3");
  mc.close();

 
});

test('My FioDataStore - list,store,list',  async () => {
 
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc,"a1");
  const atr  = await fds.fetchAllTransactions();
  expect(atr.length).toBe(0);

  expect(await fds.getLastTransaction()).toBe(null)

  const r = {
    fioId: 1,
    // tslint:disable-next-line:object-literal-sort-keys
    fioAccountId: "a1",
    date: "2019-10-10",
    amount: 100,
    currency: "CZK",
    type: "nic",
  };
  const newtr = await fds.storeTransactionRecord(r as IFioBankTransaction);
  const atr2  = await fds.fetchAllTransactions();
  expect(atr2.length).toBe(1);
  expect(atr2[0]).toMatchObject({currency:"CZK"});

  const ltr = await fds.storeTransactionRecord( {
    fioId: 3,
    // tslint:disable-next-line:object-literal-sort-keys
    fioAccountId: "a1",
    date: "2019-10-12",
    amount: 100,
    currency: "CZK",
    type: "nic",
  } as IFioBankTransaction);


  await fds.storeTransactionRecord( {
    fioId: 2,
    // tslint:disable-next-line:object-literal-sort-keys
    fioAccountId: "a1",
    date: "2019-10-11",
    amount: 100,
    currency: "CZK",
    type: "nic",
  } as IFioBankTransaction);


  expect(await fds.getLastTransaction()).toMatchObject({fioId: 3});
  await fds.removeTransactionRecord(ltr._id);
  expect(await fds.getLastTransaction()).toMatchObject({fioId: 2});

 // console.log("newtr",newtr)
  mc.close();

 
});


test('My FioDataStore - start empty, save lastid, getlastid',  async () => {
 
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc,"a1");
  const fds2 = new FioDataStore(mc,"a2");
  expect(await fds.getLastId()).toBe(null);
  expect(await fds.setLastId(2)).toBe(true);
  expect(await fds.getLastId()).toBe(2);
  expect(await fds2.getLastId()).toBe(null);
  expect(await fds2.setLastId(3)).toBe(true);
  expect(await fds.resetLastId()).toBe(true);
  expect(await fds.getLastId()).toBe(null);
  expect(await fds2.getLastId()).toBe(3);
  
});
