import { FetchMock } from 'jest-fetch-mock';
import { FioCfg } from '../fio_cfg';
import { FioDataStore } from '../fio_ds';
import { FioMultiSyncer } from '../fio_multi_syncer';
import { FioReader } from '../fio_reader';
import { FioSyncer } from '../fio_syncer';
import { createMongooseConnection, mongod } from '../jestutils';

jest.mock('../fio_reader');
jest.mock('../fio_ds');

const fetchMock = fetch as FetchMock;

beforeEach(() => {
  return mongod.start();
});

afterEach(() => {
  return mongod.stop();
});

test('FioMultiSync  manual setup', async () => {
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);

  const ms = new FioMultiSyncer();

  const syncer1 = ms.add(mc, { fioAccountId: 'a1', fioToken: 't1', firmKey: 'f1' });

  const s1 = syncer1.getStore() as jest.Mocked<FioDataStore>;

  s1.getLastId.mockReturnValue(Promise.resolve(null));
  s1.getLastTransaction.mockReturnValue(Promise.resolve(null));
  s1.getFioAccountId.mockReturnValue('a1');

  const r1 = syncer1.getReader() as jest.Mocked<FioReader>;
  r1.getDayLastId.mockReturnValue(Promise.resolve(1234));
  r1.setLastId.mockReturnValue(Promise.resolve(true));
  r1.getLast.mockReturnValue(Promise.resolve(null));
  r1.checkToken.mockResolvedValue(true);

  const res = await ms._initOne(syncer1, 's1');
  expect(res).toBe(true);
  expect(r1.getDayLastId).toBeCalledTimes(1);
  expect(r1.setLastId).toBeCalledWith(1234);

  const resL = await ms._syncLastOne(syncer1, 's1');
  expect(resL).toBe(false);
  expect(r1.getLast).toBeCalledTimes(1);

  r1.getLast.mockReset();
  r1.getLast.mockReturnValue(
    Promise.resolve({
      userId: 1,
      id: 1,
      title: 'string',
      completed: true,
      accountStatement: {
        info: {
          accountId: 'string',
          bankId: 'string',
          currency: 'string',
          iban: 'string',
          bic: 'string',
          idFrom: null,
          idTo: null,
          idLastDownload: 1234,
        },
        transactionList: {
          transaction: [],
        },
      },
    }),
  );
  s1.getLastId.mockReturnValue(Promise.resolve(1234));

  expect(await ms._syncLastOne(syncer1, 's1')).toBe(true);
  expect(r1.getLast).toBeCalledTimes(1);
  expect(await ms._syncLastOne(syncer1, 's1')).toBe(true);
  expect(r1.getLast).toBeCalledTimes(2);

  const syncer2 = ms.add(mc, { fioAccountId: 'a2', fioToken: 't2', firmKey: 'f1' });
  const s2 = syncer2.getStore() as jest.Mocked<FioDataStore>;
  s2.getLastId.mockReturnValue(Promise.resolve(1234));
  s2.getLastTransaction.mockReturnValue(Promise.resolve(null));
  s2.getFioAccountId.mockReturnValue('a2');

  const r2 = syncer2.getReader() as jest.Mocked<FioReader>;
  r2.getDayLastId.mockReturnValue(Promise.resolve(1234));
  r2.setLastId.mockReturnValue(Promise.resolve(true));
  r2.getLast.mockReturnValue(Promise.resolve(null));
  r2.checkToken.mockResolvedValue(true);

  expect(await ms._initOne(syncer2, 's2')).toBe(true);
  // console.log('=======');
  expect(await ms.init()).toBe(true);
  expect(await ms.syncLast()).toBe(false); // syncer2  failed

  r1.getLast.mockReset();
  r1.getLast.mockReturnValue(
    Promise.resolve({
      userId: 1,
      id: 1,
      title: 'string',
      completed: true,
      accountStatement: {
        info: {
          accountId: 'string',
          bankId: 'string',
          currency: 'string',
          iban: 'string',
          bic: 'string',
          idFrom: null,
          idTo: null,
          idLastDownload: 1234,
        },
        transactionList: {
          transaction: [],
        },
      },
    }),
  );

  r2.getLast.mockReset();
  r2.getLast.mockReturnValue(
    Promise.resolve({
      userId: 1,
      id: 1,
      title: 'string',
      completed: true,
      accountStatement: {
        info: {
          accountId: 'string',
          bankId: 'string',
          currency: 'string',
          iban: 'string',
          bic: 'string',
          idFrom: null,
          idTo: null,
          idLastDownload: 1234,
        },
        transactionList: {
          transaction: [],
        },
      },
    }),
  );

  expect(await ms.syncLast()).toBe(true); // syncer2  is now ok
  expect(r1.getLast).toBeCalledTimes(1);
  expect(r2.getLast).toBeCalledTimes(1);

  mc.close();
});

function setup_syncer_mock(syncer: FioSyncer): void {
  const s = syncer.getStore() as jest.Mocked<FioDataStore>;
  s.getLastId.mockReturnValue(Promise.resolve(1234));
  s.getLastTransaction.mockReturnValue(Promise.resolve(null));

  const r = syncer.getReader() as jest.Mocked<FioReader>;

  r.getDayLastId.mockReturnValue(Promise.resolve(1234));
  r.setLastId.mockReturnValue(Promise.resolve(true));
  r.getLast.mockReturnValue(
    Promise.resolve({
      userId: 1,
      id: 1,
      title: 'string',
      completed: true,
      accountStatement: {
        info: {
          accountId: 'string',
          bankId: 'string',
          currency: 'string',
          iban: 'string',
          bic: 'string',
          idFrom: null,
          idTo: null,
          idLastDownload: 1234,
        },
        transactionList: {
          transaction: [],
        },
      },
    }),
  );
  r.checkToken.mockResolvedValue(true);
}

test('FioMultiSync  multi', async () => {
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);

  const logger = {
    logRaw: jest.fn(),
    logTransaction: jest.fn(),
  };
  logger.logRaw.mockResolvedValue(true);
  logger.logTransaction.mockResolvedValue(true);

  const ms = new FioMultiSyncer(logger);
  const cfg = new FioCfg();
  cfg.addFio('a1', 't1', 'f1');
  cfg.addFio('a2', 't2', 'f1');

  const sl = ms.addAll(mc, cfg);

  const s1 = sl[0];
  const s2 = sl[1];
  setup_syncer_mock(s1);
  setup_syncer_mock(s2);

  expect(await ms.init()).toBe(true);
  expect(logger.logRaw).toBeCalled();
  logger.logRaw.mockClear();
  expect(await ms.syncLast()).toBe(true);
  expect(logger.logRaw).toBeCalledTimes(4);

  mc.close();
});
