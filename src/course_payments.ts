import { MongoError } from 'mongodb';
import * as mongoose from 'mongoose';
import * as R from 'ramda';
import { FioTransactionProcessingStatus, FioTransactionType, IFioBankTransaction } from './fio_ds';

export interface IStudentInfo {
  studentKey: string;
  firmKey: string;
  courseCost: number;
  paid: number;
}

export enum ECoursePaymentType {
  INITIAL = 'INITIAL',
  BY_HAND = 'BY_HAND',
  AUTO = 'AUTO',
}

export interface ICoursePayment {
  _id: any;
  type: ECoursePaymentType;

  date: Date;
  amount: number;
  firmKey: string;
  studentKey: string;

  fioTrRef: string | null;
  manualRef: string | null;
  manualComment: string | null;
}

export interface ICoursePaymentModel extends mongoose.Document, ICoursePayment {}

type TLookupStudentInfoType = (vs: string) => Promise<IStudentInfo | null>;
type TFirmAccounts = Record<string, string[]>;
type TUpdateStudentPaymentInfo = (studentKey: string, paid: number) => Promise<boolean>;

interface ICoursePaymentsStoreOptions {
  lookupStudentInfo: TLookupStudentInfoType;
  updateStudentPaymentInfo: TUpdateStudentPaymentInfo;
  firmAccounts: TFirmAccounts;
}

export class CoursePaymentsStore {
  private mongooseConnection: mongoose.Connection;
  private coursePaymentModel: mongoose.Model<ICoursePaymentModel>;
  private coursePaymentSchema = new mongoose.Schema(
    {
      type: {
        required: true,
        type: String,
        enum: Object.keys(ECoursePaymentType),
      },
      date: {
        type: Date,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      firmKey: {
        type: String,
        required: true,
      },
      studentKey: {
        type: String,
        required: true,
      },
      fioTrRef: String,
      manualRef: String,
      manualComment: String,
    },
    { timestamps: true },
  ).index({ studentKey: 1 });

  private lookupStudentInfo: TLookupStudentInfoType;
  private updateStudentPaymentInfo: TUpdateStudentPaymentInfo;
  private firmAccounts: TFirmAccounts;
  constructor(mcon: mongoose.Connection, opts: ICoursePaymentsStoreOptions) {
    this.mongooseConnection = mcon;
    this.coursePaymentModel = this.mongooseConnection.model<ICoursePaymentModel>(
      'CoursePayment',
      this.coursePaymentSchema,
      'coursepayments',
    );

    this.lookupStudentInfo = opts.lookupStudentInfo;
    this.updateStudentPaymentInfo = opts.updateStudentPaymentInfo;
    this.firmAccounts = opts.firmAccounts;
  }

  public async checkNewBankPaymentExact(accountId: string, vs: string, amount: number): Promise<boolean> {
    if (amount == null) {
        return false;
    }
    if (amount <= 0) {
        return false;
    }

    const si = await this.lookupAndCheckStudent(accountId,vs);

    if (si) {
      if (si.paid === 0 && si.courseCost === amount) {
        return true;
      }
    }
    return false;
  }

  public async tryAutoNewPayment(tr: IFioBankTransaction): Promise<ICoursePayment | null> {
    if (tr.ps !== FioTransactionProcessingStatus.NEW) {
        return null;
    }
    if (tr.type !== FioTransactionType.IN) {
        return null;
    }
    if (tr.vs == null) {
        return null;
    }
    if (tr.date == null) {
        return null;
    }
    if (!(tr.amount > 0)) {
        return null;
    }

   
    const si = await this.lookupAndCheckStudent(tr.fioAccountId,tr.vs);
    if (si == null) {
        // console.log("NO SI for", tr.fioAccountId,tr.vs);
        return null;
    }
    if (si.paid +tr.amount <= si.courseCost) {
        const cp: ICoursePayment = {
            _id:null,
            type: ECoursePaymentType.AUTO,
            date: tr.date,
            amount: tr.amount,
            firmKey: si.firmKey,
            studentKey: si.studentKey,
            fioTrRef: tr._id,
            manualComment: null,
            manualRef: null,
        };
        return this.storeNewPayment(cp);
    } 
    return null;

  }

  public async storeNewPayment(cp: ICoursePayment): Promise<ICoursePayment> {
    const cpcopy = R.omit(['_id'], cp);
    const scp = await this.coursePaymentModel.create(cpcopy);
    const amount = await this.getStudentPaidAmount(cp.studentKey);
    if (amount !== null) {
      const up = await this.updateStudentPaymentInfo(cp.studentKey, amount);
    }
    return scp;
  }
  public async getStudentPayments(studentKey: string): Promise<ICoursePayment[]> {
    return this.coursePaymentModel.find({ studentKey }).sort({ date: 1 });
  }
  public async getStudentPaidAmount(studentKey: string): Promise<number | null> {
    const payments = await this.getStudentPayments(studentKey);
    if (payments.length === 0) {
      return null;
    }
    const paid = payments.reduce((p, cp) => p + cp.amount, 0);
    return paid;
  }

  private lookupFirmKey(accountId: string): string | null {
    let r = null;
    Object.entries(this.firmAccounts).forEach(([key, value]) => {
      if (value.includes(accountId)) {
        r = key;
      }
    });
    return r;
  }
  private async lookupAndCheckStudent(accountId: string, vs: string): Promise<IStudentInfo | null> {
    if (accountId == null) {
        return null;
    }
    if (vs == null) {
        return null;
    }
 
    const firmKey = this.lookupFirmKey(accountId);
    if (firmKey === null) {
      return null;
    }

    const si = await this.lookupStudentInfo(vs);
    if (si) {
      if (si.firmKey !== firmKey) {
        return null;
      }
      return si;
    }
    return null;
  }
}
