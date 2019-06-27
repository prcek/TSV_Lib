import { FioDataStore } from "./fio_ds";
import { FioReader, IFioInfo, IFioTransaction } from "./fio_reader";

export class FioSyncer {
    private reader: FioReader;
    private store: FioDataStore;

 
    constructor(reader: FioReader, store: FioDataStore) {
        this.reader = reader;
        this.store = store;
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

