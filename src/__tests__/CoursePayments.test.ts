import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import {
  CoursePaymentsStore,
  ECoursePaymentType,
  EStudentStatusType,
  ICourseInfo,
  ICoursePayment,
  IStudentInfo,
} from '../course_payments';
import { FioDataStore, FioTransactionType, IFioBankTransaction } from '../fio_ds';

import { createMongooseConnection, mongod } from '../jestutils';

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
        si = { studentKey: 'st1', firmKey: 'f1', courseCost: 1000, paid: 0, status: EStudentStatusType.NEW };
        break;
      case '2':
        si = { studentKey: 'st2', firmKey: 'f1', courseCost: 1200, paid: 0, status: EStudentStatusType.NEW };
        break;
      case '3':
        si = { studentKey: 'st3', firmKey: 'f2', courseCost: 1200, paid: 800, status: EStudentStatusType.NEW };
        break;
      case '4':
        si = { studentKey: 'st4', firmKey: 'f2', courseCost: 1200, paid: 0, status: EStudentStatusType.NEW };
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

const lookupcourse = jest.fn(
  (key: string): Promise<ICourseInfo | null> => {
    let ci: ICourseInfo | null = null;
    switch (key) {
      case 'c1':
        ci = {
          firmKey: 'f1',
          students: [
            { studentKey: 'st1', firmKey: 'f1', courseCost: 1000, paid: 0, status: EStudentStatusType.NEW },
            { studentKey: 'st2', firmKey: 'f1', courseCost: 1200, paid: 0, status: EStudentStatusType.NEW },
            { studentKey: 'st4', firmKey: 'f1', courseCost: 1000, paid: 0, status: EStudentStatusType.KICK },
          ],
        };
        break;
      case 'c2':
        ci = {
          firmKey: 'f1',
          students: [{ studentKey: 'st3', firmKey: 'f1', courseCost: 1200, paid: 0, status: EStudentStatusType.KICK }],
        };
        break;
    }
    return Promise.resolve(ci);
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
    lookupCourseInfo: lookupcourse,
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
    lookupCourseInfo: lookupcourse,
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

test('CoursePayments tryAuto', async () => {
  update.mockClear();
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const cps = new CoursePaymentsStore(mc, {
    lookupStudentInfo: lookup,
    lookupCourseInfo: lookupcourse,
    updateStudentPaymentInfo: update,
    firmAccounts: { f1: ['ac1'], f2: ['ac2', 'ac3'] },
  });

  const fds = new FioDataStore(mc, 'ac1');

  expect(await fds.fetchOneNewTransaction()).toBeNull();

  const ltr = await fds.storeTransactionRecord({
    ps: 'NEW',
    fioId: 3,
    fioAccountId: 'ac1',
    date: new Date('2019-10-10'),
    amount: 100,
    currency: 'CZK',
    type: FioTransactionType.IN,
    vs: '1',
  } as IFioBankTransaction);

  const nt = await fds.fetchOneNewTransaction();
  expect(nt).not.toBeNull();
  expect(nt).toMatchObject({ ps: 'NEW' });
  const nnt = nt as IFioBankTransaction;

  const acp = await cps.tryAutoNewPayment(nnt);
  expect(acp).not.toBeNull();

  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledWith('st1', 100);
  const ps = await cps.getStudentPayments('st1');
  expect(ps).toHaveLength(1);
  expect(ps[0]).toMatchObject({ fioTrRef: nnt._id.toString() });
  mc.close();
});

test.only('CoursePayments - get multi payments', async () => {
  update.mockClear();
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const cps = new CoursePaymentsStore(mc, {
    lookupStudentInfo: lookup,
    lookupCourseInfo: lookupcourse,
    updateStudentPaymentInfo: update,
    firmAccounts: { f1: ['ac1'], f2: ['ac2', 'ac3'] },
  });

  const np = {
    type: ECoursePaymentType.AUTO,
    date: new Date('1995-12-17T03:24:00'),
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

  const np2 = {
    type: ECoursePaymentType.AUTO,
    date: new Date('1995-12-23T03:24:00'),
    amount: 1200,
    firmKey: 'f1',
    studentKey: 'st2',
  } as ICoursePayment;

  const np3 = {
    type: ECoursePaymentType.AUTO,
    date: new Date('1996-01-01T03:24:00'),
    amount: 1700,
    firmKey: 'f1',
    studentKey: 'st2',
  } as ICoursePayment;

  const np4 = {
    type: ECoursePaymentType.AUTO,
    date: new Date(),
    amount: 1700,
    firmKey: 'f1',
    studentKey: 'st3',
  } as ICoursePayment;

  expect(await cps.storeNewPayment(np2)).toMatchObject({ _id: expect.anything() });
  expect(await cps.storeNewPayment(np3)).toMatchObject({ _id: expect.anything() });
  expect(await cps.storeNewPayment(np4)).toMatchObject({ _id: expect.anything() });

  const ps = await cps.getStudentsPayments(['st1', 'st2']);
  expect(ps).toMatchObject({ st1: expect.anything() });
  expect(ps).toMatchObject({ st2: expect.anything() });
  expect(ps).not.toMatchObject({ st3: expect.anything() });

  // tslint:disable-next-line:no-string-literal
  expect(ps['st1']).toMatchObject({ amount: 2000, payments: expect.any(Array) });
  // tslint:disable-next-line:no-string-literal
  expect(ps['st2']).toMatchObject({ amount: 2900, payments: expect.any(Array) });

  const ps2 = await cps.getStudentsPaymentsUpToDate(['st1', 'st2'], new Date('1996-01-01T00:00'));
  expect(ps2).toMatchObject({ st1: expect.anything() });
  // tslint:disable-next-line:no-string-literal
  expect(ps2['st1']).toMatchObject({ amount: 2000, payments: expect.any(Array) });
  // tslint:disable-next-line:no-string-literal
  expect(ps2['st2']).toMatchObject({ amount: 1200, payments: expect.any(Array) });

  const ci1 = await lookupcourse('c1');
  expect(ci1).not.toBeNull();
  if (ci1) {
    expect(ci1).toMatchObject({ firmKey: 'f1', students: expect.any(Array) });
    // tslint:disable-next-line:no-string-literal
    expect(ci1['students']).toHaveLength(3);
  }

  const ps3 = await cps.getCoursePayments('c1');
  expect(ps3).not.toBeNull();
  if (ps3) {
    expect(ps3.courseKey).toBe('c1');
    expect(ps3).toMatchObject({ amount: 4900, students: expect.any(Object) });
    expect(ps3.studentsByStatus).toMatchObject({
      n: expect.any(Object),
      s: expect.any(Object),
      k: expect.any(Object),
      e: expect.any(Object),
    });
    expect(ps3.amountByStatus).toMatchObject({ n: 4900, s: 0, k: 0, e: 0 });
    expect(ps3.studentsByStatus.n).toMatchObject({ st1: expect.any(Object), st2: expect.any(Object) });
    expect(ps3.studentsByStatus.k).toMatchObject({ st4: expect.any(Object) });
    expect(ps3.countByStatus).toMatchObject({ s: 0, n: 2, e: 0, k: 1 });
    expect(ps3.count).toBe(3);
    expect(ps3.date).toBe(null);
  }

  const ps4 = await cps.getCoursePaymentsUpToDate('c1', new Date('1996-01-01T00:00:00.000Z'));
  expect(ps4).not.toBeNull();
  if (ps4) {
    expect(ps4).toMatchObject({ amount: 3200, students: expect.any(Object) });
    expect(ps4.amountByStatus).toMatchObject({ s: 0, n: 3200, e: 0, k: 0 });
    expect(ps4.countByStatus).toMatchObject({ s: 0, n: 2, e: 0, k: 1 });
    expect(ps4.count).toBe(3);
    expect(ps4.date).toEqual(new Date('1996-01-01T00:00:00.000Z'));
  }


  const ms1 = await cps.getCoursesPayments(['c1','c2']);
  expect(ms1.courses).toHaveLength(2);
  expect(ms1.sum.amount).toBe(6600);

  const ms2 = await cps.getCoursesPaymentsUpToDate(['c1','c2'], new Date('1996-01-01T00:00:00.000Z'));
  expect(ms2.courses).toHaveLength(2);
  expect(ms2.sum.amount).toBe(3200);
  expect(ms2.sum.amountByStatus.e).toBe(0);
  expect(ms2.sum.amountByStatus.s).toBe(0);
  expect(ms2.sum.amountByStatus.n).toBe(3200);
  expect(ms2.sum.amountByStatus.k).toBe(0);
  mc.close();
});
