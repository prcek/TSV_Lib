import { FioDataStore } from "./fio_ds";
import { FioReader, IFioInfo, IFioTransaction } from "./fio_reader";

export class FioSyncer {
    private reader: FioReader;
    private store: FioDataStore;

 
    constructor(reader: FioReader, store: FioDataStore) {
        this.reader = reader;
        this.store = store;
    }

  //  public async isFirstStart(): Promise<boolean> {
  //
  //  }
    public async isFirstSync(): Promise<boolean> {
        const lastId = await this.store.getLastId();
        if (lastId != null) return false;
        const lastTr = await this.store.getLastTransaction();
        if (lastTr) return false;
        return true;
    }

    public async recoverSync(fromDay: Date): Promise<boolean> {
        const lastId = await this.store.getLastId();
        const lastTr = await this.store.getLastTransaction();

        // first run
        if (lastId === null && lastTr === null) {
            const lastId = await this.reader.getDayLastId(fromDay);
            if (lastId == null) {
                return false;
            }
            return this.reader.setLastId(lastId);
        } 

        // normal recovery
        if (lastId !== null && lastTr !==null && lastTr.fioId == lastId)  {
            return this.reader.setLastId(lastId);;
        }

 
        // recovery (lastId missing)
        if (lastId === null && lastTr !=null && lastTr.fioId)  {
            return this.reader.setLastId(lastTr.fioId);
        }

        // recovery (lasttr missing)
        if (lastId !== null && lastTr === null)  {
            return this.reader.setLastId(lastId);
        }




        return false;  //TODO
    }

    public async syncDate(date: Date): Promise<boolean> {
        const trs = await this.reader.getPeriods(date,date);
        if (trs.accountStatement.transactionList.transaction.length) {
            const dxo = await Promise.all(trs.accountStatement.transactionList.transaction.map( t => this.storeTr(trs.accountStatement.info, t)));
            return true;
        }
        return true;
    }

    private async storeTr(ainfo:IFioInfo, t: IFioTransaction) {
        return this.store.storeTransactionRecord({
            _id: null,
            fioId: t.id,
            // tslint:disable-next-line:object-literal-sort-keys
            fioAccountId: ainfo.accountId,
            date: t.date,
            amount: t.amount,
            currency: t.currency,
            type: t.type,
            fAccountId: t.fAccountId,
            fBankId: t.fBankId,
            fAccountName: t.fAccountName,
            fBankName: t.fBankName,
            ks: t.ks,
            vs: t.vs,
            ss: t.ss,
            userRef: t.userRef,
            userMsg: t.userMsg,
            comment: t.comment
        });
    }

}

