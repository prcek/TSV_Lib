import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { CoursePaymentsStore, ECoursePaymentType, ICoursePayment, IStudentInfo } from '../course_payments';

const mongod = new MongoMemoryServer({ debug: false, autoStart: false });

async function createMongooseConnection(mongoUri: string): Promise<mongoose.Connection> {
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
  return mongooseConnection;
}

beforeEach(() => {
  return mongod.start();
});

afterEach(() => {
  return mongod.stop();
});

const lookup = jest.fn(
  (vs: string): Promise<IStudentInfo | null> => {
    let si: IStudentInfo | null = null;
    switch (vs) {
      case '1':
        si = { studentKey: 'st1', firmKey: 'f1', courseCost: 1000, paid: 0 };
        break;
      case '2':
        si = { studentKey: 'st2', firmKey: 'f1', courseCost: 1200, paid: 0 };
        break;
      case '3':
        si = { studentKey: 'st3', firmKey: 'f2', courseCost: 1200, paid: 800 };
        break;
      case '4':
        si = { studentKey: 'st4', firmKey: 'f2', courseCost: 1200, paid: 0 };
        break;
    }
    return Promise.resolve(si);
  },
);

const update = jest.fn(
  (studentKey: string, paid: number): Promise<boolean> => {
    return Promise.resolve(true);
  },
);

test('CoursePayments - lookup Exact', async () => {
  // lookup.mockResolvedValueOnce({
  //   key: "1",
  //   course_cost: 1,
  //   paid: 1
  // });
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const cps = new CoursePaymentsStore(mc, {
    lookupStudentInfo: lookup,
    updateStudentPaymentInfo: update,
    firmAccounts: { f1: ['ac1'], f2: ['ac2', 'ac3'] },
  });

  expect(await cps.checkNewBankPaymentExact('ac1', '1', 1000)).toBe(true);
  expect(await cps.checkNewBankPaymentExact('ac2', '1', 1000)).toBe(false); // wrong account
  expect(await cps.checkNewBankPaymentExact('ac1', '1', 999)).toBe(false);
  expect(await cps.checkNewBankPaymentExact('ac1', '4', 1000)).toBe(false);
  expect(await cps.checkNewBankPaymentExact('ac2', '3', 1200)).toBe(false);
  expect(await cps.checkNewBankPaymentExact('ac2', '4', 1200)).toBe(true);
  expect(await cps.checkNewBankPaymentExact('ac3', '4', 1200)).toBe(true);
  expect(await cps.checkNewBankPaymentExact('ac4', '4', 1200)).toBe(false);

  mc.close();
});

test('CoursePayments - insert payments', async () => {
  update.mockClear();
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const cps = new CoursePaymentsStore(mc, {
    lookupStudentInfo: lookup,
    updateStudentPaymentInfo: update,
    firmAccounts: { f1: ['ac1'], f2: ['ac2', 'ac3'] },
  });

  const np = {
    type: ECoursePaymentType.AUTO,
    date: new Date(),
    amount: 1000,
    firmKey: 'f1',
    studentKey: 'st1',
  } as ICoursePayment;

  expect(await cps.storeNewPayment(np)).toMatchObject({ _id: expect.anything() });
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledWith('st1', 1000);
  expect(await cps.storeNewPayment(np)).toMatchObject({ _id: expect.anything() });
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenCalledWith('st1', 2000);

  mc.close();
});
