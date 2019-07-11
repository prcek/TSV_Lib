import { MongoError } from 'mongodb';
import * as mongoose from 'mongoose';
import * as R from 'ramda';

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
    const firmKey = this.lookupFirmKey(accountId);
    if (firmKey === null) {
      return false;
    }

    const si = await this.lookupStudentInfo(vs);
    if (si) {
      if (si.firmKey !== firmKey) {
        return false;
      }
      if (si.paid === 0 && si.courseCost === amount) {
        return true;
      }
    }
    return false;
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
}
