import { FetchMock } from 'jest-fetch-mock';
const fetchMock = fetch as FetchMock;
jest.useFakeTimers();

import { FetchError } from 'node-fetch';
import { tdFioAccountId, tdJsonDayEmpty } from '../__test_data__/data';
import { FioReader } from '../fio_reader';

test('My FioReader - GetLast', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(
    '{"accountStatement":{"info":{"accountId":"23231","bankId":"2010","currency":"CZK","iban":"CZ81201000000023231","bic":"FIOBCZPPXXX","openingBalance":1.23,"closingBalance":1.42,"dateStart":"2019-06-21+0200","dateEnd":"2019-06-21+0200","yearList":null,"idList":null,"idFrom":null,"idTo":null,"idLastDownload":213131313},"transactionList":{"transaction":[]}}}',
  );
  const fr = new FioReader('test_token','23231');
  const frrP = fr.getLast();
  expect(fetch).toHaveBeenCalledTimes(0);
  jest.runAllTimers();
  expect(fetch).toHaveBeenCalledTimes(1);
  const frr = await frrP;
  expect(frr && frr.accountStatement.info.accountId).toBe('23231');
  //  console.log(frr.accountStatement);
  expect(fetchMock.mock.calls.length).toBe(1);
});

test('My FioReader - GetPeriods', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(
    '{"accountStatement":{"info":{"accountId":"23231","bankId":"2010","currency":"CZK","iban":"CZ81201000000023231","bic":"FIOBCZPPXXX","openingBalance":184778.70,"closingBalance":213138.70,"dateStart":"2019-06-12+0200","dateEnd":"2019-06-12+0200","yearList":null,"idList":null,"idFrom":21349236442,"idTo":21350120640,"idLastDownload":null},"transactionList":{"transaction":[{"column22":{"value":21349236442,"name":"ID pohybu","id":22},"column0":{"value":"2019-06-12+0200","name":"Datum","id":0},"column1":{"value":1480.00,"name":"Objem","id":1},"column14":{"value":"CZK","name":"Měna","id":14},"column2":{"value":"1998087029","name":"Protiúčet","id":2},"column10":{"value":"Monika Valkova","name":"Název protiúčtu","id":10},"column3":{"value":"3030","name":"Kód banky","id":3},"column12":{"value":"Air Bank a.s.","name":"Název banky","id":12},"column4":null,"column5":{"value":"918006226","name":"VS","id":5},"column6":null,"column7":{"value":"Monika Valkova","name":"Uživatelská identifikace","id":7},"column16":{"value":"tanecni Dorián","name":"Zpráva pro příjemce","id":16},"column8":{"value":"Bezhotovostní příjem","name":"Typ","id":8},"column9":null,"column18":null,"column25":{"value":"Monika Valkova","name":"Komentář","id":25},"column26":null,"column17":{"value":24938334622,"name":"ID pokynu","id":17}}]}}}',
  );
  const fr = new FioReader('test_token','23231');
  const frrP = fr.getPeriods(new Date(), new Date());
  jest.runAllTimers();
  expect(fetch).toHaveBeenCalledTimes(1);
  const frr = await frrP;
  expect(frr).not.toBeNull();
  expect(frr && frr.accountStatement.info.accountId).toBe('23231');
  expect(frr && frr.accountStatement.transactionList.transaction[0].amount).toBe(1480);
  // console.log(frr.accountStatement);
  expect(fetchMock.mock.calls.length).toBe(1);
  // console.log(fetchMock.mock.calls[0]);
});

test('My FioReader - getLastId', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(
    JSON.stringify({
      accountStatement: {
        info: {
          accountId: '2901223235',
          bankId: '2010',
          currency: 'CZK',
          iban: 'CZ8120100000002901223235',
          bic: 'FIOBCZPPXXX',
          openingBalance: 1674819.38,
          closingBalance: 1690219.38,
          dateStart: '2019-01-31+0100',
          dateEnd: '2019-01-31+0100',
          yearList: null,
          idList: null,
          idFrom: 18247244228,
          idTo: 18247668131,
          idLastDownload: null,
        },
        transactionList: {
          transaction: [],
        },
      },
    }),
  );

  const fr = new FioReader('test_token','2901223235');

  const frrP = fr.getDayLastId(new Date('2019-01-31'));
  jest.runAllTimers();
  const frr = await frrP;

  expect(frr).toBe(18247668131);
  expect(fetchMock.mock.calls.length).toBe(1);
  expect(fetchMock.mock.calls[0][0]).toBe(
    'https://www.fio.cz/ib_api/rest/periods/test_token/2019-01-24/2019-01-31/transactions.json',
  );

  fetchMock.mockResponseOnce(
    JSON.stringify({
      accountStatement: {
        info: {
          accountId: '2901223235',
          bankId: '2010',
          currency: 'CZK',
          iban: 'CZ8120100000002901223235',
          bic: 'FIOBCZPPXXX',
          openingBalance: 767768.21,
          closingBalance: 767768.21,
          dateStart: '2019-07-31+0200',
          dateEnd: '2019-07-31+0200',
          yearList: null,
          idList: null,
          idFrom: null,
          idTo: null,
          idLastDownload: null,
        },
        transactionList: {
          transaction: [],
        },
      },
    }),
  );

  const frr2P = fr.getDayLastId(new Date('2019-07-31'));
  jest.runAllTimers();
  const frr2 = await frr2P;
  expect(frr2).toBe(null);
  expect(fetchMock.mock.calls.length).toBe(2);
  expect(fetchMock.mock.calls[1][0]).toBe(
    'https://www.fio.cz/ib_api/rest/periods/test_token/2019-07-24/2019-07-31/transactions.json',
  );
});

test('My FioReader - GetPeriod Throttle', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponse(
    JSON.stringify({
      accountStatement: {
        info: {
          accountId: '2901223235',
          bankId: '2010',
          currency: 'CZK',
          iban: 'CZ8120100000002901223235',
          bic: 'FIOBCZPPXXX',
          openingBalance: 1674819.38,
          closingBalance: 1690219.38,
          dateStart: '2019-01-31+0100',
          dateEnd: '2019-01-31+0100',
          yearList: null,
          idList: null,
          idFrom: 18247244228,
          idTo: 18247668131,
          idLastDownload: null,
        },
        transactionList: {
          transaction: [],
        },
      },
    }),
  );

  const dm = jest.spyOn(global.Date, 'now').mockImplementation(() => new Date(0).valueOf());

  const fr = new FioReader('test_token','2901223235');
  const frr1P = fr.getPeriods(new Date(), new Date());
  expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 0);
  const frr2P = fr.getPeriods(new Date(), new Date());
  expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 30000);
  const frr3P = fr.getPeriods(new Date(), new Date());
  expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 60000);

  expect(fetch).toHaveBeenCalledTimes(0);
  jest.runTimersToTime(1000);
  expect(fetch).toHaveBeenCalledTimes(1);
  jest.runTimersToTime(20000);
  expect(fetch).toHaveBeenCalledTimes(1);
  jest.runTimersToTime(10000);
  expect(fetch).toHaveBeenCalledTimes(2);
  jest.runTimersToTime(31000);
  expect(fetch).toHaveBeenCalledTimes(3);
  jest.runAllTimers();
  const frr1 = await frr1P;
  const frr2 = await frr2P;
  const frr3 = await frr3P;
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(frr1 && frr1.accountStatement.info.accountId).toBe('2901223235');
  //  console.log(frr.accountStatement);
  expect(fetchMock.mock.calls.length).toBe(3);
});

test('My FioReader - http status 409', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonDayEmpty);
  const fr = new FioReader('test_token',tdFioAccountId);
  fr.test_disableThrottling();
  expect(await fr.getLast()).not.toBeNull();
  fetchMock.mockResponseOnce('', { status: 409 });
  expect(await fr.getLast()).toBeNull();
});

test('My FioReader - http timeout', async () => {
  fetchMock.resetMocks();
  const feer = new FetchError('request to ... failed', 'system');
  feer.code = 'ETIMEDOUT';
  feer.errno = 'ETIMEDOUT';

  const feer2 = new FetchError('request to ... failed', 'system');
  feer2.code = 'EUNK';
  feer2.errno = 'EUNK';

  fetchMock.mockRejectedValue(feer2);

  const fr = new FioReader('test_token','a1');
  fr.test_disableThrottling();

  try {
    await fr.getLast();
    // Fail test if above expression doesn't throw anything.
    expect(true).toBe(false);
  } catch (e) {
    expect(e.code).toBe('EUNK');
  }

  try {
    await fr.getPeriods(new Date(), new Date());
    // Fail test if above expression doesn't throw anything.
    expect(true).toBe(false);
  } catch (e) {
    expect(e.code).toBe('EUNK');
  }

  fetchMock.mockRejectedValue(feer);

  expect(await fr.getLast()).toBeNull();
  expect(await fr.getPeriods(new Date(), new Date())).toBeNull();
});



test('My FioReader - wrong account', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(tdJsonDayEmpty);
  const fr = new FioReader('test_token',tdFioAccountId+"wrong");
  fr.test_disableThrottling();
  try {
    await fr.getLast();
    expect(false).toBe(true);
  } catch(err) {
    expect(err).toBeInstanceOf(Error);
  }
  
});
