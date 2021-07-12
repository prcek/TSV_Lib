import * as fs from 'fs';
import { ExecutionResult, graphql, GraphQLObjectType, GraphQLSchema, printSchema } from 'graphql';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import * as pdfmake from 'pdfmake/build/pdfmake';
import * as vfs_fonts from 'pdfmake/build/vfs_fonts';
import { FioDataStore, FioReader, FioSyncer } from './index';
import { GraphQLInvoiceQueryType, IInvoice, IInvoiceQueryContext, InvoiceResolver } from './invoice';
// tslint:disable-next-line:no-var-requires
require('dotenv').config();

const mongod = new MongoMemoryServer();

async function startLocalMongoDB(): Promise<mongoose.Connection> {
  const mongoUri: string =  mongod.getUri();

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
const fr = new FioReader(process.env.FIO_TOKEN || 'missing', 'ac1');

fr.getPeriods(new Date(), new Date()).then(frr => {
  if (frr) {
    console.log('fxff');
    console.log(frr.accountStatement.transactionList.transaction);
  } else {
    console.log('null')
  }
  
});
*/
console.log('xxx');

async function main() {
  const fr = new FioReader(process.env.FIO_TOKEN || 'missing', 'ac1');
  const frr = await fr.getPeriods(new Date(), new Date());
  console.log('xx');
}

main().then(console.log);

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
//

/*
// PDFMAKE TEST
const docDefinition = {
  content: ['Příliš žluťoučký kůň úpěl ďábelské ódy'],
};
const pdf = pdfmake.createPdf(docDefinition, null, pdfmake.fonts, vfs_fonts.pdfMake.vfs);
pdf.getBuffer((result, pages) => {
  console.log(pages);
  const f = fs.createWriteStream('test.pdf');
  f.write(result);
  f.end();
});
// END OF PDFMAKE TEST
*/

/*
// PDFKIT TEST
// tslint:disable-next-line:no-var-requires
import * as pdfkit from 'pdfkit';
// tslint:disable-next-line:no-var-requires
const MemoryStream = require('memory-stream');
const doc = new pdfkit({
  size: 'A4',
});

const ws = new MemoryStream();
ws.on('finish', ()=>{
  console.log(ws.toBuffer());
});
doc.pipe(ws);


doc.fillColor('green')// .font(fonts.Roboto.normal)
.fontSize(25)
.text('X žluťoučký kůň...',100,100,{width:150,height:20});

doc.image("./public/images/image.png",0,0,{height:50});

// drawQr(doc,50,100,50,"bbbbbbbbb3248-32ksfjkadshfkasfdkjasfjkhsakfhsdkfjhsdkfhdfkjashdkf");

doc.flushPages();
doc.end();
*/
// END OF PDFKIT TEST

// var f = fs.createWriteStream(filename);
// f.write(data);
// f.end();
