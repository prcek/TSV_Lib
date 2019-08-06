
import * as mongoose from 'mongoose';
import { FioBankTranscationSchema, FioTransactionProcessingStatus, IFioBankTransaction, IFioBankTransactionModel } from './fio_ds';


export class FioMultiDataStore {
    private fioBankTransactionModel: mongoose.Model<IFioBankTransactionModel>;
    constructor(private mongooseConnection: mongoose.Connection, private fioAccountIds: string[]) {
        this.fioBankTransactionModel = this.mongooseConnection.model<IFioBankTransactionModel>(
            'FioBankTransaction',
            FioBankTranscationSchema,
            'fiobanktranscations',
          );
    }

    public async fetchReviewTransactions(fioAccountIds: string[]|null = null): Promise<IFioBankTransaction[]> {
        
        const fids = fioAccountIds !== null? fioAccountIds: this.fioAccountIds;
        return this.fioBankTransactionModel
          .find({ fioAccountId: {$in:fids}, ps: FioTransactionProcessingStatus.REVIEW })
          .sort({ fioId: -1 });
      }
    
    public async fetchOneNewTransaction():Promise<IFioBankTransaction | null> {
        return this.fioBankTransactionModel
      .findOne({ fioAccountId: {$in:this.fioAccountIds}, ps: FioTransactionProcessingStatus.NEW })
      .sort({ fioId: -1 });
    }

    public async changeTransactionStatus(
        id: string,
        newStatus: FioTransactionProcessingStatus,
        newRef: string | null,
      ): Promise<boolean> {
        const nd = await this.fioBankTransactionModel.findByIdAndUpdate(
            id,
            {
              ps: newStatus,
              psRef: newRef,
            },
            {
              new: true,
            },
          );
          if (nd) {
            return true;
          }
          return false;
      }
}
