import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore } from '../index';


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
  console.log('beforeEach');
  return mongod.start();
});

afterEach( () => {
  console.log('afterEach');
  return mongod.stop()
});



test('My FioDataStore',  async () => {
 
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc);
  const info = await fds.getMongoVersion();
  expect(info).toBe("4.0.3");
  mc.close();

 
});

test('My FioDataStore2',  async () => {
 
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc);
  const info = await fds.getMongoVersion();
  expect(info).toBe("4.0.3");
  mc.close();

 
});
