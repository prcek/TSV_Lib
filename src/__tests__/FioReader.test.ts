import { FetchMock } from 'jest-fetch-mock';
const fetchMock = fetch as FetchMock;

import { FioReader } from '../index';
test('My FioReader', async () => {
  fetchMock.resetMocks();
  fetchMock.mockResponseOnce(JSON.stringify({ title: 'title test' }));
  const fr = new FioReader();
  const frr = await fr.getRecord();
  expect(frr).toMatchObject({ title: 'title test' });
});
