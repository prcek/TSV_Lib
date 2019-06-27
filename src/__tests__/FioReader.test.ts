import { FetchMock } from 'jest-fetch-mock';
const fetchMock = fetch as FetchMock;

import { FioReader } from '../fio_reader';
test('My FioReader - GetLast', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(
    '{"accountStatement":{"info":{"accountId":"23231","bankId":"2010","currency":"CZK","iban":"CZ81201000000023231","bic":"FIOBCZPPXXX","openingBalance":1.23,"closingBalance":1.42,"dateStart":"2019-06-21+0200","dateEnd":"2019-06-21+0200","yearList":null,"idList":null,"idFrom":null,"idTo":null,"idLastDownload":213131313},"transactionList":{"transaction":[]}}}',
  );
  const fr = new FioReader('test_token');
  const frr = await fr.getLast();
  expect(frr.accountStatement.info.accountId).toBe('23231');
  //  console.log(frr.accountStatement);
  expect(fetchMock.mock.calls.length).toBe(1);
});

test('My FioReader - GetPeriods', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(
    '{"accountStatement":{"info":{"accountId":"23231","bankId":"2010","currency":"CZK","iban":"CZ81201000000023231","bic":"FIOBCZPPXXX","openingBalance":184778.70,"closingBalance":213138.70,"dateStart":"2019-06-12+0200","dateEnd":"2019-06-12+0200","yearList":null,"idList":null,"idFrom":21349236442,"idTo":21350120640,"idLastDownload":null},"transactionList":{"transaction":[{"column22":{"value":21349236442,"name":"ID pohybu","id":22},"column0":{"value":"2019-06-12+0200","name":"Datum","id":0},"column1":{"value":1480.00,"name":"Objem","id":1},"column14":{"value":"CZK","name":"Měna","id":14},"column2":{"value":"1998087029","name":"Protiúčet","id":2},"column10":{"value":"Monika Valkova","name":"Název protiúčtu","id":10},"column3":{"value":"3030","name":"Kód banky","id":3},"column12":{"value":"Air Bank a.s.","name":"Název banky","id":12},"column4":null,"column5":{"value":"918006226","name":"VS","id":5},"column6":null,"column7":{"value":"Monika Valkova","name":"Uživatelská identifikace","id":7},"column16":{"value":"tanecni Dorián","name":"Zpráva pro příjemce","id":16},"column8":{"value":"Bezhotovostní příjem","name":"Typ","id":8},"column9":null,"column18":null,"column25":{"value":"Monika Valkova","name":"Komentář","id":25},"column26":null,"column17":{"value":24938334622,"name":"ID pokynu","id":17}}]}}}',
  );
  const fr = new FioReader('test_token');
  const frr = await fr.getPeriods(new Date(), new Date());
  expect(frr.accountStatement.info.accountId).toBe('23231');
  expect(frr.accountStatement.transactionList.transaction[0].amount).toBe(1480);
  // console.log(frr.accountStatement);
  expect(fetchMock.mock.calls.length).toBe(1);
  // console.log(fetchMock.mock.calls[0]);
});
