import { MongoError } from 'mongodb';
import * as mongoose from 'mongoose';
import * as R from 'ramda';
import { FioTransactionProcessingStatus, FioTransactionType, IFioBankTransaction } from './fio_ds';

export enum EStudentStatusType {
  SPARE = 's',
  NEW = 'n',
  ENROLL = 'e',
  KICK = 'k',
}

export interface IStudentInfo {
  studentKey: string;
  firmKey: string;
  status: EStudentStatusType;
  courseCost: number;
  paid: number;
}

export interface ICourseInfo {
  students: IStudentInfo[];
  firmKey: string;
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

export interface IStudentPayments {
  payments: ICoursePayment[];
  amount: number;
}

export interface ICoursePaymentsReport {
  date: Date | null;
  students: Record<string, IStudentPayments>;
  studentsByStatus: Record<EStudentStatusType, Record<string, IStudentPayments>>;
  amount: number;
  amountByStatus: Record<EStudentStatusType, number>;
  count: number;
  countByStatus: Record<EStudentStatusType, number>;
}

export interface ICoursePaymentModel extends mongoose.Document, ICoursePayment {}

type TLookupStudentInfoType = (vs: string) => Promise<IStudentInfo | null>;
type TLookupCourseInfoType = (key: string) => Promise<ICourseInfo | null>;
type TFirmAccounts = Record<string, string[]>;
type TUpdateStudentPaymentInfo = (studentKey: string, paid: number) => Promise<boolean>;

interface ICoursePaymentsStoreOptions {
  lookupStudentInfo: TLookupStudentInfoType;
  lookupCourseInfo: TLookupCourseInfoType;
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
  private lookupCourseInfo: TLookupCourseInfoType;
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
    this.lookupCourseInfo = opts.lookupCourseInfo;
    this.updateStudentPaymentInfo = opts.updateStudentPaymentInfo;
    this.firmAccounts = opts.firmAccounts;
  }

  public async checkNewBankPaymentExact(accountId: string, vs: string, amount: number): Promise<boolean> {
    if (amount == null) {
      return false;
    }

    if (!Number.isInteger(amount)) {
      return false;
    }

    if (amount <= 0) {
      return false;
    }

    const si = await this.lookupAndCheckStudent(accountId, vs);

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
    if (!Number.isInteger(tr.amount)) {
      return null;
    }
    if (!(tr.amount > 0)) {
      return null;
    }

    const si = await this.lookupAndCheckStudent(tr.fioAccountId, tr.vs);
    if (si == null) {
      // console.log("NO SI for", tr.fioAccountId,tr.vs);
      return null;
    }
    if (si.paid + tr.amount <= si.courseCost * 2) {
      const cp: ICoursePayment = {
        _id: null,
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

  public async getStudentsPayments(studentKeys: string[]): Promise<Record<string, IStudentPayments>> {
    const payments = await this.coursePaymentModel.find({ studentKey: { $in: studentKeys } }).sort({ date: 1 });
    return this.payments2sp(payments, studentKeys);
  }

  public async getStudentsPaymentsUpToDate(
    studentKeys: string[],
    toDate: Date,
  ): Promise<Record<string, IStudentPayments>> {
    const payments = await this.coursePaymentModel
      .find({ studentKey: { $in: studentKeys }, date: { $lt: toDate } })
      .sort({ date: 1 });
    return this.payments2sp(payments, studentKeys);
  }

  public async getCoursePayments(courseKey: string): Promise<ICoursePaymentsReport | null> {
    const ci = await this.lookupCourseInfo(courseKey);
    if (ci) {
      const studentKeys = R.map(s => s.studentKey, ci.students);
      const sps = await this.getStudentsPayments(studentKeys);
      return this.cpayments2cpr(ci, sps, null);
    }
    return null;
  }

  public async getCoursePaymentsUpToDate(courseKey: string, toDate: Date): Promise<ICoursePaymentsReport | null> {
    const ci = await this.lookupCourseInfo(courseKey);
    if (ci) {
      const studentKeys = R.map(s => s.studentKey, ci.students);
      const sps = await this.getStudentsPaymentsUpToDate(studentKeys, toDate);
      return this.cpayments2cpr(ci, sps, toDate);
    }
    return null;
  }

  private cpayments2cpr(
    ci: ICourseInfo,
    sps: Record<string, IStudentPayments>,
    date: Date | null,
  ): ICoursePaymentsReport {
    const ssg = R.groupBy(s => s.status, ci.students);
    const ssgkeys = R.keys(ssg);

    const sbs: Record<EStudentStatusType, Record<string, IStudentPayments>> = {
      s: {},
      n: {},
      e: {},
      k: {},
    };

    const abs: Record<EStudentStatusType, number> = {
      s: 0,
      n: 0,
      e: 0,
      k: 0,
    };

    const cbs: Record<EStudentStatusType, number> = {
      s: 0,
      n: 0,
      e: 0,
      k: 0,
    };

    for (const key of ssgkeys) {
      const sks = ci.students.filter(s => s.status === key).map(s => s.studentKey);
      const sbsx = R.pick(sks, sps);
      sbs[key as EStudentStatusType] = sbsx;
      const am = R.values(sbsx).reduce((a, s) => a + s.amount, 0);
      abs[key as EStudentStatusType] = am;
      const cn = R.keys(sbsx).length;
      cbs[key as EStudentStatusType] = cn;
    }

    const amount = R.reduce<IStudentPayments, number>((a, s) => a + s.amount, 0, R.values(sps));
    const count = R.keys(sps).length;
    return { date, amount, count, students: sps, studentsByStatus: sbs, amountByStatus: abs, countByStatus: cbs };
  }

  private payments2sp(payments: ICoursePayment[], keys: string[]): Record<string, IStudentPayments> {
    const rr = R.groupBy<ICoursePayment>(p => p.studentKey, payments);

    const sksm = keys.filter(k => !(k in rr));
    for (const mk of sksm) {
      rr[mk] = [];
    }

    return R.map<Record<string, ICoursePayment[]>, Record<string, IStudentPayments>>(cp => {
      const am = cp.reduce((p, ccp) => p + ccp.amount, 0);
      return { payments: cp, amount: am };
    }, rr);
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
