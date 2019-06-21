import { FetchMock } from 'jest-fetch-mock';
const fetchMock = fetch as FetchMock;

import { FioReader } from '../index';
test('My FioReader', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce('{"accountStatement":{"info":{"accountId":"23231","bankId":"2010","currency":"CZK","iban":"CZ81201000000023231","bic":"FIOBCZPPXXX","openingBalance":1.23,"closingBalance":1.42,"dateStart":"2019-06-21+0200","dateEnd":"2019-06-21+0200","yearList":null,"idList":null,"idFrom":null,"idTo":null,"idLastDownload":213131313},"transactionList":{"transaction":[]}}}');
  const fr = new FioReader("test_token");
  const frr = await fr.getRecord();
  // expect(frr).toMatchObject({ title: 'title test' });
  expect(frr.accountStatement.info.accountId).toBe('23231');
  expect(fetchMock.mock.calls.length).toBe(1);
});
