import * as mongoose  from 'mongoose';
import * as R from 'ramda';

export interface IFioBankTransaction {
    _id: any;
    fioId: number;
    fioAccountId: string;
    date: string;
    amount: number;
    currency: string;
    type: string;
    fAccountId: string | null;
    fBankId: string | null;
    fAccountName: string | null;
    fBankName: string | null;
  
    ks: string | null;
    vs: string | null;
    ss: string | null;
    userRef: string | null;
    userMsg: string | null;
    comment: string | null;
}

export interface IFioBankTransactionModel extends mongoose.Document, IFioBankTransaction {
}


export class FioDataStore {
  private mongooseConnection: mongoose.Connection;
  private fioBankTransactionModel: mongoose.Model<IFioBankTransactionModel>;
  private fioBankTranscationSchema = new mongoose.Schema({
    fioId: Number,
    fioAccountId: String,
    currency: String,
  }).index({fioId: 1, fioAccountId: 1}, { unique: true });
  constructor(mcon: mongoose.Connection) {
    this.mongooseConnection = mcon;
    this.fioBankTransactionModel = this.mongooseConnection.model<IFioBankTransactionModel>('FioBankTransaction',this.fioBankTranscationSchema,'fiobanktranscations');
  }
  public async getMongoVersion(): Promise<string> {
    const info = await this.mongooseConnection.db.admin().buildInfo();
    // console.log(`mongodb version ${info.version}`);
    return info.version;
  }
  public async storeTransactionRecord(tr: IFioBankTransaction): Promise<IFioBankTransaction> {
    const trcopy =  R.omit(['_id'],tr);
    return this.fioBankTransactionModel.create(trcopy);
  }
  public async fetchAllTransactions(): Promise<IFioBankTransaction[]> {
    return this.fioBankTransactionModel.find();
  }
}
