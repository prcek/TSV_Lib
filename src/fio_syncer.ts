import { FioDataStore, FioTransactionProcessingStatus, FioTransactionType } from './fio_ds';
import { FioReader, IFioInfo, IFioTransaction } from './fio_reader';

export class FioSyncer {
  private reader: FioReader;
  private store: FioDataStore;
  private ready: boolean = false;

  constructor(reader: FioReader, store: FioDataStore) {
    this.reader = reader;
    this.store = store;
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
        return false;
      }
      return this.reader.setLastId(rlastId);
    }

    // normal recovery
    if (lastId !== null && lastTr !== null && lastTr.fioId === lastId) {
      return this.reader.setLastId(lastId);
    }

    // recovery (lastId missing)
    if (lastId === null && lastTr != null && lastTr.fioId) {
      return this.reader.setLastId(lastTr.fioId);
    }

    // recovery (lasttr missing)
    if (lastId !== null && lastTr === null) {
      return this.reader.setLastId(lastId);
    }

    return false; //  TODO
  }

  public async syncDate(date: Date): Promise<boolean> {
    const trs = await this.reader.getPeriods(date, date);
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

    return this.store.storeTransactionRecord({
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
  }
}
