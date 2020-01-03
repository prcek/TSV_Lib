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
import { createMongooseConnection, mongod } from '../jestutils';
import { ICategoryInfo, ReportPayments } from '../report_payments';

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

const lookupcategory = jest.fn(
  (catKey: string, seasonKey:string): Promise<ICategoryInfo | null> => {
    let ci: ICategoryInfo | null = null;
    switch (catKey) {
      case 'f1':
        ci = { key: catKey, seasonKey, firmKey: 'firm1', courseKeys: ['c1', 'c2'], name: 'cat1' };
        break;
      case 'f2':
        ci = { key: catKey, seasonKey, firmKey: 'firm1', courseKeys: ['c1'], name: 'cat2' };
        break;
      case 'f3':
        ci = { key: catKey, seasonKey, firmKey: 'firm2', courseKeys: [], name: 'cat3' };
        break;
    }
    return Promise.resolve(ci);
  },
);

test('CoursePayments - get multi payments', async () => {
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

  const rps = new ReportPayments({
    lookupCategoryInfo: lookupcategory,
    coursePaymentsStore: cps,
    endDate: new Date('1996-01-01T00:00'),
  });


  const cat1 = await lookupcategory('f1','s1');
  expect(cat1).toMatchObject({key:'f1'});
  expect(cat1?.courseKeys).toStrictEqual(['c1','c2'])
  expect(cat1?.firmKey).toBe('firm1');


  expect(await rps.addCategory('f1','s1')).toBe(true);
  const rep1 = await rps.createReportUpToDate(null);
  expect(rep1).toHaveLength(1);
  expect(rep1[0].courses).toHaveLength(2);

  expect(rep1[0].amount).toBe(6600);
  expect(rep1[0].amountByStatus.e).toBe(0);
  expect(rep1[0].amountByStatus.s).toBe(0);
  expect(rep1[0].amountByStatus.n).toBe(4900);
  expect(rep1[0].amountByStatus.k).toBe(1700);

  expect(rep1[0].cat.name).toBe('cat1');
  expect(rep1[0].cat.firmKey).toBe('firm1');

  expect(await rps.addCategory('f2','s1')).toBe(true);

  const rep2 = await rps.createReportUpToDate(null);
  expect(rep2).toHaveLength(2);
  expect(rep2[0].courses).toHaveLength(2);
  expect(rep2[0].amount).toBe(6600);
  expect(rep2[0].amountByStatus.e).toBe(0);
  expect(rep2[0].amountByStatus.s).toBe(0);
  expect(rep2[0].amountByStatus.n).toBe(4900);
  expect(rep2[0].amountByStatus.k).toBe(1700);
  expect(rep2[0].date).toBe(null);
 
 
  expect(rep2[1].courses).toHaveLength(1);
  expect(rep2[1].amount).toBe(4900);
  expect(rep2[1].amountByStatus.e).toBe(0);
  expect(rep2[1].amountByStatus.s).toBe(0);
  expect(rep2[1].amountByStatus.n).toBe(4900);
  expect(rep2[1].amountByStatus.k).toBe(0);
  expect(rep2[1].date).toBe(null);
 
  expect(await rps.clearCategories()).toBe(true);
  const repe = await rps.createReportUpToDate(null);
  expect(repe).toHaveLength(0);


  expect(await rps.addCategory('f2','s1')).toBe(true);
  const rep3 = await rps.createReportUpToDate(new Date('1996-01-01T00:00:00.000Z'));
  expect(rep3).toHaveLength(1);
  expect(rep3[0].amount).toBe(3200);
  expect(rep3[0].amountByStatus.e).toBe(0);
  expect(rep3[0].amountByStatus.s).toBe(0);
  expect(rep3[0].amountByStatus.n).toBe(3200);
  expect(rep3[0].amountByStatus.k).toBe(0);


  expect(rep3[0].date).toEqual(new Date('1996-01-01T00:00:00.000Z'));

  const rep4 = await rps.createReportUpToDate(new Date('1996-01-01T04:00:00.000Z'));
  expect(rep4).toHaveLength(1);
  expect(rep4[0].amount).toBe(4900);
  expect(rep4[0].amountByStatus.e).toBe(0);
  expect(rep4[0].amountByStatus.s).toBe(0);
  expect(rep4[0].amountByStatus.n).toBe(4900);
  expect(rep4[0].amountByStatus.k).toBe(0);


  expect(await rps.clearCategories()).toBe(true);
  expect(await rps.addCourses(['c1','c2'])).toBe(true);
  const rep5= await rps.createReportUpToDate(new Date('1996-01-01T00:00:00.000Z'));
  expect(rep5).toHaveLength(1);
  expect(rep5[0].amount).toBe(3200);
  expect(rep5[0].amountByStatus.e).toBe(0);
  expect(rep5[0].amountByStatus.s).toBe(0);
  expect(rep5[0].amountByStatus.n).toBe(3200);
  expect(rep5[0].amountByStatus.k).toBe(0);


  mc.close();
});
