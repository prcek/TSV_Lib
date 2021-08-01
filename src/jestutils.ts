import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';

export const mongod = new MongoMemoryServer({ instance: { dbName: 'fs' } });

export async function createMongooseConnection(mongoUri: string): Promise<mongoose.Connection> {
  const mongooseOpts = {
    // options for mongoose 4.11.3 and above
 //   autoReconnect: true,
 //   reconnectTries: Number.MAX_VALUE,
    // tslint:disable-next-line:object-literal-sort-keys
 //   reconnectInterval: 1000,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  };

  const mongooseConnection = await mongoose.createConnection(mongoUri, mongooseOpts);
  return mongooseConnection;
}

export function generateObjectId() {
  return mongoose.Types.ObjectId();
}
export function createObjectId(s: string) {
  return mongoose.Types.ObjectId(s);
}
