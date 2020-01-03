// import { MongoError } from 'mongodb';
// import * as mongoose from 'mongoose';
import * as R from 'ramda';
import { CoursePaymentsStore } from './course_payments';

export interface ICategoryInfo {
  key: string;
  firmKey: string;
  courseKeys: string[];
  name: string;
}
type TLookupCategoryInfoType = (catKey: string) => Promise<ICategoryInfo | null>;

interface IReportPaymentsOptions {
  coursePaymentsStore: CoursePaymentsStore;
  lookupCategoryInfo: TLookupCategoryInfoType;
  endDate: Date;
}

interface IReportPaymentsResult {
  done: boolean;
}
export class ReportPayments {
  private coursePaymentsStore: CoursePaymentsStore;
  private lookupCategoryInfo: TLookupCategoryInfoType;
  private endDate: Date;
  private cats: ICategoryInfo[];

  constructor(opts: IReportPaymentsOptions) {
    this.coursePaymentsStore = opts.coursePaymentsStore;
    this.lookupCategoryInfo = opts.lookupCategoryInfo;
    this.endDate = opts.endDate;
    this.cats = [];
  }
  public async clearCategories(): Promise<boolean> {
    this.cats = [];
    return true;
  }
  public async addCategory(catKey: string): Promise<boolean> {
    const cat = await this.lookupCategoryInfo(catKey);
    if (cat) {
      return true;
    }
    return false;
  }
  public async createReport(): Promise<IReportPaymentsResult | null> {
    return { done: true };
  }
}
