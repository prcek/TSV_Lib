import * as mongoose  from 'mongoose';
import * as R from 'ramda';
import { MongoError } from 'mongodb';

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

export interface IFioBankSyncInfo {
  _id: any;
  fioAccountId: string;
  idLastDownload: number;
}

export interface IFioBankTransactionModel extends mongoose.Document, IFioBankTransaction {
}
export interface IFioBankSyncInfoModel extends mongoose.Document, IFioBankSyncInfo {
}


export class FioDataStore {
  private mongooseConnection: mongoose.Connection;
  private fioBankTransactionModel: mongoose.Model<IFioBankTransactionModel>;
  private fioBankTranscationSchema = new mongoose.Schema({
    fioId: Number,
    fioAccountId: String,
    currency: String,
    amount: Number,
    type: String,
    fAccountId: String,
    fBankId: String,
    fAccountName: String,
    fBankName:String,
    ks: String,
    vs: String,
    ss: String,
    userRef: String,
    userMsg: String,
    comment: String,
  }).index({fioId: 1, fioAccountId: 1}, { unique: true });

  private fioBankSyncInfoModel: mongoose.Model<IFioBankSyncInfoModel>;
  private fioBankSyncInfoSchema = new mongoose.Schema({
    fioAccountId: String,
    idLastDownload: Number
  }).index({fioAccountId: 1}, { unique: true });

  private fioAccountId: string;

  constructor(mcon: mongoose.Connection, fioAccountId: string) {
    this.fioAccountId = fioAccountId;
    this.mongooseConnection = mcon;
    this.fioBankTransactionModel = this.mongooseConnection.model<IFioBankTransactionModel>('FioBankTransaction',this.fioBankTranscationSchema,'fiobanktranscations');
    this.fioBankSyncInfoModel = this.mongooseConnection.model<IFioBankSyncInfoModel>('FioBankSyncInfo',this.fioBankSyncInfoSchema,'fiobanksyncinfo');
  }
  public async getMongoVersion(): Promise<string> {
    const info = await this.mongooseConnection.db.admin().buildInfo();
    // console.log(`mongodb version ${info.version}`);
    return info.version;
  }
  public async storeTransactionRecord(tr: IFioBankTransaction): Promise<IFioBankTransaction> {
    const trcopy =  R.omit(['_id'],tr);
    if (tr.fioAccountId != this.fioAccountId) {
      throw new Error("wrong fioAccountId");
    }

    try {
      const str = await this.fioBankTransactionModel.create(trcopy);
      return str;
    } catch (e) {
      if(e instanceof MongoError) {
        if (e.code !== 11000) {  // ignore duplicate
          throw e;
        }
      } else {
        throw e;
      }
    }
    const old_tr = await this.fioBankTransactionModel.findOne({fioId:trcopy.fioId, fioAccountId:this.fioAccountId});
    if (old_tr !==null) {
      return old_tr;
    }
    throw Error("can't insert tr");
  }
  public async fetchAllTransactions(): Promise<IFioBankTransaction[]> {
    return this.fioBankTransactionModel.find({fioAccountId:this.fioAccountId}).sort({fioId:-1});
  }

  public async removeTransactionRecord(id: string): Promise<boolean> {
    const rr = await this.fioBankTransactionModel.findByIdAndRemove(id);
    return rr != null;
  }

  public async getLastTransaction(): Promise<IFioBankTransaction | null> {
    return this.fioBankTransactionModel.findOne({fioAccountId:this.fioAccountId}).sort({fioId:-1});
  }

  public async getLastId(): Promise<number | null> {
    const rec = await this.fioBankSyncInfoModel.findOne({fioAccountId:this.fioAccountId}); 
    if (rec) {
      return rec.idLastDownload;
    } 
    return null;
  }
  public async setLastId(lastCorrectId: number): Promise<boolean> {
    const nd = await this.fioBankSyncInfoModel.findOneAndUpdate({fioAccountId:this.fioAccountId},{idLastDownload: lastCorrectId}, {
      new: true,
      upsert: true // Make this update into an upsert
    });
    return true;
  }
  public async resetLastId(): Promise<boolean> {
    const nd = await this.fioBankSyncInfoModel.findOneAndUpdate({fioAccountId:this.fioAccountId},{idLastDownload: null}, {
      new: true,
      upsert: true // Make this update into an upsert
    });
    return true;
  }
}
