import { FetchMock } from 'jest-fetch-mock';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { FioDataStore, FioReader, FioSyncer } from '../index';
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



test('My FioSyncer - start empty',  async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(
    '{"accountStatement":{"info":{"accountId":"23231","bankId":"2010","currency":"CZK","iban":"CZ81201000000023231","bic":"FIOBCZPPXXX","openingBalance":1.23,"closingBalance":1.42,"dateStart":"2019-06-21+0200","dateEnd":"2019-06-21+0200","yearList":null,"idList":null,"idFrom":null,"idTo":null,"idLastDownload":213131313},"transactionList":{"transaction":[]}}}',
  );

  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const fds = new FioDataStore(mc);
  const frd = new FioReader("<test_token>");
  const fs = new FioSyncer(frd,fds);

  let res = await fs.syncDate(new Date());
  expect(res).toBe(true);
  fetchMock.mockResponseOnce(
    '{"accountStatement":{\
      "info":{"accountId":"23231","bankId":"2010","currency":"CZK","iban":"CZ81201000000023231","bic":"FIOBCZPPXXX","openingBalance":184778.70,"closingBalance":213138.70,"dateStart":"2019-06-12+0200","dateEnd":"2019-06-12+0200","yearList":null,"idList":null,"idFrom":21349236442,"idTo":21350120640,"idLastDownload":null},\
      "transactionList":{"transaction":[\
        {"column22":{"value":21349236442,"name":"ID pohybu","id":22},"column0":{"value":"2019-06-12+0200","name":"Datum","id":0},"column1":{"value":1480.00,"name":"Objem","id":1},"column14":{"value":"CZK","name":"Měna","id":14},"column2":{"value":"1998087029","name":"Protiúčet","id":2},"column10":{"value":"Monika Valkova","name":"Název protiúčtu","id":10},"column3":{"value":"3030","name":"Kód banky","id":3},"column12":{"value":"Air Bank a.s.","name":"Název banky","id":12},"column4":null,"column5":{"value":"918006226","name":"VS","id":5},"column6":null,"column7":{"value":"Monika Valkova","name":"Uživatelská identifikace","id":7},"column16":{"value":"tanecni Dorián","name":"Zpráva pro příjemce","id":16},"column8":{"value":"Bezhotovostní příjem","name":"Typ","id":8},"column9":null,"column18":null,"column25":{"value":"Monika Valkova","name":"Komentář","id":25},"column26":null,"column17":{"value":24938334622,"name":"ID pokynu","id":17}},\
        {"column22":{"value":21349236443,"name":"ID pohybu","id":22},"column0":{"value":"2019-06-12+0200","name":"Datum","id":0},"column1":{"value":1480.00,"name":"Objem","id":1},"column14":{"value":"CZK","name":"Měna","id":14},"column2":{"value":"1998087029","name":"Protiúčet","id":2},"column10":{"value":"Monika Valkova","name":"Název protiúčtu","id":10},"column3":{"value":"3030","name":"Kód banky","id":3},"column12":{"value":"Air Bank a.s.","name":"Název banky","id":12},"column4":null,"column5":{"value":"918006226","name":"VS","id":5},"column6":null,"column7":{"value":"Monika Valkova","name":"Uživatelská identifikace","id":7},"column16":{"value":"tanecni Dorián","name":"Zpráva pro příjemce","id":16},"column8":{"value":"Bezhotovostní příjem","name":"Typ","id":8},"column9":null,"column18":null,"column25":{"value":"Monika Valkova","name":"Komentář","id":25},"column26":null,"column17":{"value":24938334622,"name":"ID pokynu","id":17}}\
      ]}}}',
  );
  res = await fs.syncDate(new Date());
  expect(res).toBe(true);
  const atrs = await fds.fetchAllTransactions();
  expect(atrs.length).toBe(2);
  expect(atrs[0].fioAccountId).toBe("23231");
  expect(atrs[0]).toMatchObject({fioAccountId:"23231"});
  console.log(atrs);

  mc.close();

 
});

