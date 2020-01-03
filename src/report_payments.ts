// import { MongoError } from 'mongodb';
// import * as mongoose from 'mongoose';
import * as R from 'ramda';
import { CoursePaymentsStore, EStudentStatusType, ICoursePaymentsReport } from './course_payments';

export interface ICategoryInfo {
  key: string;
  seasonKey: string;
  firmKey: string;
  courseKeys: string[];
  name: string;
}
type TLookupCategoryInfoType = (catKey: string, seasonKey:string) => Promise<ICategoryInfo | null>;

interface IReportPaymentsOptions {
  coursePaymentsStore: CoursePaymentsStore;
  lookupCategoryInfo: TLookupCategoryInfoType;
  endDate: Date;
}


interface IReportPaymentsResult {
    cat: ICategoryInfo;
    date: Date | null;
    courses: Array<ICoursePaymentsReport |null>;
    amount: number;
    amountByStatus: Record<EStudentStatusType, number>;
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
  public async addCategory(catKey: string, seasonKey: string): Promise<boolean> {
    const cat = await this.lookupCategoryInfo(catKey, seasonKey);
    if (cat) {
      this.cats.push(cat);
      return true;
    }
    return false;
  }

  public async addCourses(courseKeys: string[]): Promise<boolean> {
    const cat: ICategoryInfo = {
        key: "",
        seasonKey: "",
        firmKey: "",
        courseKeys,
        name: "",
    }
    if (cat) {
      this.cats.push(cat);
      return true;
    }
    return false;
  }

  public async createReportUpToDate(toDate: Date | null): Promise<IReportPaymentsResult[]> {
    const rs: IReportPaymentsResult[] = []
    for(const cat of this.cats) {
        // console.log('createReport - cat', cat.name);
        const catR: IReportPaymentsResult = {
            cat,
            courses:[],
            date: toDate,
            amount: 0,
            amountByStatus:  {s:0, n:0, k:0, e:0}
        }
        for(const courseKey of cat.courseKeys) {
            // console.log('createReport - courseKey');
            const r = await ( toDate ?  this.coursePaymentsStore.getCoursePaymentsUpToDate(courseKey, toDate): this.coursePaymentsStore.getCoursePayments(courseKey));
            catR.courses.push(r);
            if (r) {
                catR.amount += r.amount;
                catR.amountByStatus.e += r.amountByStatus.e;
                catR.amountByStatus.s += r.amountByStatus.s;
                catR.amountByStatus.n += r.amountByStatus.n;
                catR.amountByStatus.k += r.amountByStatus.k;
            }
            
        }
        rs.push(catR);
    }  
    return rs;
  }
}
