import { FioDataStore, FioTransactionProcessingStatus, FioTransactionType } from './fio_ds';
import { FioReader, IFioInfo, IFioTransaction } from './fio_reader';

type TLogFunction = (msg: string) => Promise<any>;

const nullLog: TLogFunction = async (m: string) => Promise.resolve(true);
export interface IFioSyncerLogger {
  logRaw: TLogFunction;
  logTransaction: TLogFunction;
}

export class FioSyncer {
  private reader: FioReader;
  private store: FioDataStore;
  private ready: boolean = false;
  private logRaw: TLogFunction = nullLog;
  private logTransaction: TLogFunction = nullLog;

  constructor(reader: FioReader, store: FioDataStore, logger: IFioSyncerLogger | null = null) {
    this.reader = reader;
    this.store = store;
    if (logger) {
      this.logRaw = logger.logRaw;
      this.logTransaction = logger.logTransaction;
    }
  }
  public getReader(): FioReader {
    return this.reader;
  }
  public getStore(): FioDataStore {
    return this.store;
  }

  public async checkToken(): Promise<boolean> {
    return this.reader.checkToken();
  }

  //  public async isFirstStart(): Promise<boolean> {
  //
  //  }
  public async isFirstSync(): Promise<boolean> {
    const lastId = await this.store.getLastId();
    if (lastId != null) {
      return false;
    }
    const lastTr = await this.store.getLastTransaction();
    if (lastTr) {
      return false;
    }
    return true;
  }

  public async recoverSync(fromDay: Date): Promise<boolean> {
    const lastId = await this.store.getLastId();
    const lastTr = await this.store.getLastTransaction();

    // first run
    if (lastId === null && lastTr === null) {
      const rlastId = await this.reader.getDayLastId(fromDay);
      if (rlastId == null) {
        await this.logRaw(JSON.stringify({ method: 'recoverSync', msg: "can't recover - no last transaction" }));
        return false;
      }
      return this.reader.setLastId(rlastId);
    }

    // normal recovery
    if (lastId !== null && lastTr !== null && lastTr.fioId === lastId) {
      await this.logRaw(JSON.stringify({ method: 'recoverSync', msg: 'normal recovery' }));
      return this.reader.setLastId(lastId);
    }

    // recovery (lastId missing)
    if (lastId === null && lastTr != null && lastTr.fioId) {
      await this.logRaw(JSON.stringify({ method: 'recoverSync', msg: 'normal recovery from lastTr' }));
      return this.reader.setLastId(lastTr.fioId);
    }

    // recovery (lasttr missing)
    if (lastId !== null && lastTr === null) {
      await this.logRaw(JSON.stringify({ method: 'recoverSync', msg: 'normal recovery from checkPoint' }));
      return this.reader.setLastId(lastId);
    }
    await this.logRaw(JSON.stringify({ method: 'recoverSync', msg: "can't recover", vars: [lastId, lastTr] }));
    return false; //  TODO
  }

  public async syncDate(date: Date): Promise<boolean> {
    const trs = await this.reader.getPeriods(date, date);
    await this.logRaw(JSON.stringify({ method: 'syncDate', args: [date], result: trs }));
    if (trs === null) {
      return false;
    }
    if (trs.accountStatement.transactionList.transaction.length) {
      const dxo = await Promise.all(
        trs.accountStatement.transactionList.transaction.map(t =>
          this.storeTr(trs.accountStatement.info, t, FioTransactionProcessingStatus.NEW),
        ),
      );
      return true;
    }
    return true;
  }

  public async syncLast(): Promise<boolean> {
    const trs = await this.reader.getLast();
    await this.logRaw(JSON.stringify({ method: 'syncLast', args: [], result: trs }));
    if (trs == null) {
      return false;
    }
    if (trs.accountStatement.transactionList.transaction.length) {
      await Promise.all(
        trs.accountStatement.transactionList.transaction.map(t =>
          this.storeTr(trs.accountStatement.info, t, FioTransactionProcessingStatus.NEW),
        ),
      );

      // store lastID:
      if (trs.accountStatement.info.idTo !== null) {
        await this.store.setLastId(trs.accountStatement.info.idTo);
      } else {
        throw Error('missing idTo!');
      }

      return true;
    } else {
      if (trs.accountStatement.info.idLastDownload === (await this.store.getLastId())) {
        // ok
      } else {
        throw Error('no tr, but lastDownload id is different');
      }
    }
    return true;
  }

  private async storeTr(ainfo: IFioInfo, t: IFioTransaction, ps: FioTransactionProcessingStatus) {
    let d = new Date(0);
    try {
      const n = Date.parse(t.date.slice(0, 10));
      if (!isNaN(n)) {
        d = new Date(n);
      }
      // tslint:disable-next-line:no-empty
    } catch (e) {}

    let tt = FioTransactionType.UNKNOWN;
    switch (t.type) {
      case 'Bezhotovostní příjem':
        tt = FioTransactionType.IN;
        break;
      case 'Příjem převodem uvnitř banky':
        tt = FioTransactionType.IN;
        break;
      case 'Bezhotovostní platba':
        tt = FioTransactionType.OUT;
        break;
      case 'Platba převodem uvnitř banky':
        tt = FioTransactionType.OUT;
        break;
      case 'Platba kartou':
        tt = FioTransactionType.CARD_OUT;
        break;
      case 'Vklad pokladnou':
        tt = FioTransactionType.IN;
        break;
    }

    const newtr = await this.store.storeTransactionRecord({
      _id: null,
      ps,
      psRef: null,
      fioId: t.id,
      // tslint:disable-next-line:object-literal-sort-keys
      fioAccountId: ainfo.accountId,
      date: d, // t.date,
      amount: t.amount,
      currency: t.currency,
      type: tt,
      fAccountId: t.fAccountId,
      fBankId: t.fBankId,
      fAccountName: t.fAccountName,
      fBankName: t.fBankName,
      ks: t.ks,
      vs: t.vs,
      ss: t.ss,
      userRef: t.userRef,
      userMsg: t.userMsg,
      comment: t.comment,
      rawData: t.rawData,
    });
    await this.logTransaction(JSON.stringify({ method: 'storeTr', args: [ainfo, t, ps], result: newtr }));
    return newtr;
  }
}
