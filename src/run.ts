import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore, FioReader } from './index';
// tslint:disable-next-line:no-var-requires
require('dotenv').config();

const mongod = new MongoMemoryServer({debug:false, autoStart:false});

async function startLocalMongoDB(): Promise<mongoose.Connection> {
  const mongoUri: string = await mongod.getConnectionString();

  const mongooseOpts = {
    // options for mongoose 4.11.3 and above
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    // tslint:disable-next-line:object-literal-sort-keys
    reconnectInterval: 1000,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  };
  const mongooseConnection = await mongoose.createConnection(mongoUri, mongooseOpts);
  console.log(`Mongoose successfully connected to ${mongoUri}`);
  return mongooseConnection;
}

/* 
const fr = new FioReader(process.env.FIO_TOKEN || 'missing');

fr.getPeriods(new Date(), new Date()).then(frr => {
  console.log(frr.accountStatement.transactionList.transaction);
});
*/
/*
startLocalMongoDB().then(async mc => {
  const fds = new FioDataStore(mc);
  const info = await fds.getMongoVersion();
  console.log(info);
  mc.close();
  mongod.stop();
  return 'ok';
});
*/
console.log('create schema');
const sh = new mongoose.Schema({
  fioId: Number,
  fioAccountId: String,
  currency: String,
}).index({fioId: 1, fioAccountId: 1}, { unique: true });


console.log('create schema done');
