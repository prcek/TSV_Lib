
import { CoursePaymentsStore, IStudentInfo } from '../course_payments';

const lookup = jest.fn( (vs: string): Promise<IStudentInfo | null> => {
  let si: IStudentInfo | null = null;
  switch(vs) {
      case "1": si = { studentKey:"st1", firmKey:"f1", courseCost:1000, paid:0}; break;
      case "2": si = { studentKey:"st2", firmKey:"f1", courseCost:1200, paid:0}; break;
      case "3": si = { studentKey:"st3", firmKey:"f2", courseCost:1200, paid:800}; break;
      case "4": si = { studentKey:"st4", firmKey:"f2", courseCost:1200, paid:0}; break;
  }
  return Promise.resolve(si);
})

test('CoursePayments - lookup Exact', async () => {
  // lookup.mockResolvedValueOnce({
  //   key: "1",
  //   course_cost: 1,
  //   paid: 1
  // });
  
  const cps = new CoursePaymentsStore({
      lookupStudentInfo: lookup,
      firmAccounts: {"f1":["ac1"], "f2":["ac2","ac3"]}
  });
  expect(await cps.checkNewBankPaymentExact("ac1","1",1000)).toBe(true);
  expect(await cps.checkNewBankPaymentExact("ac2","1",1000)).toBe(false); // wrong account
  expect(await cps.checkNewBankPaymentExact("ac1","1",999)).toBe(false);
  expect(await cps.checkNewBankPaymentExact("ac1","4",1000)).toBe(false);
  expect(await cps.checkNewBankPaymentExact("ac2","3",1200)).toBe(false);
  expect(await cps.checkNewBankPaymentExact("ac2","4",1200)).toBe(true);
  expect(await cps.checkNewBankPaymentExact("ac3","4",1200)).toBe(true);
  expect(await cps.checkNewBankPaymentExact("ac4","4",1200)).toBe(false);

});
  