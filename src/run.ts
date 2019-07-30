import { ExecutionResult, graphql, GraphQLObjectType, GraphQLSchema, printSchema} from 'graphql';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore, FioReader, FioSyncer } from './index';
import { GraphQLInvoiceQueryType, IInvoice, IInvoiceQueryContext, InvoiceResolver } from './invoice'
// tslint:disable-next-line:no-var-requires
require('dotenv').config();

const mongod = new MongoMemoryServer({ debug: false, autoStart: false });

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

async function connectTestMongoDB(): Promise<mongoose.Connection> {
  const mongoUri: string = process.env.MONGO_URI || 'missing';
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

/*
connectTestMongoDB().then(async mc => {
  const fds = new FioDataStore(mc, process.env.FIO_ACCOUNT_ID || 'missing');
  const info = await fds.getMongoVersion();
  console.log(info);

  const frd = new FioReader(process.env.FIO_TOKEN || 'missing');
  const fs = new FioSyncer(frd, fds);
  console.log('isFirstSync', await fs.isFirstSync());
  console.log('recovery', await fs.recoverSync(new Date('2019-07-01')));
  console.log('syncLast', await fs.syncLast());
  mc.close();
});
*/

// const keys = Object.keys(FioTransactionProcessingStatus).filter(k => typeof FioTransactionProcessingStatus[k as any] === "number");
// console.log(keys);




const s = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      invoice: {
        type: GraphQLInvoiceQueryType,
        resolve: () => ({})
      }
    })
  })
})
const query = `
    query Q {
      invoice {
        a:byKey(key:"xxx") {
          student_key
          s3key
          __typename
        }
        b:byKey(key:"xxyx") {
          student_key
          s3key
          __typename
        }
        all {
          student_key
          __typename
        }
        __typename
      }
    }
  `;



// console.log(s.toConfig());
console.log(printSchema(s));

interface IContext extends IInvoiceQueryContext {
  extra: string;
}


startLocalMongoDB().then(async mc => {
  
  const invoiceResolver = new InvoiceResolver(mc);

  const n = await invoiceResolver.create({
    student_key: "ssk",
    no: "no1",
    s3key: null,
    duplicate: false,
    amount: 123,
    description: "popiska",
    sale_date: new Date(),
    issue_date: new Date(),
  });

  const list = await invoiceResolver.getAll();
  console.log(list);

  const ctx: IContext = {
    extra: "extra",
    invoiceResolver
  }
 /*
  const result = await graphql<{invoice:{a:IInvoice,b:IInvoice}}>(s, query, {}, ctx);
  console.log(result.data);
  if (result.data) {
    console.log(result.data.invoice.a)
  } 
  if (result.errors) {
    console.error(result.errors);
  }

//  const up = await ctx.invoiceResolver.updateOneById("1",{student_key:"1",_id:"x", s3key:null});
*/
  mc.close();
  mongod.stop();
  return 'ok';
});





