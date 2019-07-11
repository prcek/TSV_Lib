export interface IStudentInfo {
    studentKey: string;
    firmKey: string;
    courseCost: number;
    paid: number;
}

export enum ECoursePaymentType {
    INITIAL = 'INITIAL',
    BY_HAND = 'BY_HAND',
    AUTO = 'AUTO'
}
  

export interface ICoursePayment {
    _id: any;
    type: ECoursePaymentType,

    date: Date;
    amount: number;
    firmKey: string;
    studentKey: string;

    fioTrRef: string | null;
    manualRef: string | null;
    manualComment: string | null;
}


type TLookupStudentInfoType = (vs: string) => Promise<IStudentInfo | null>;
type TFirmAccounts = Record<string,string[]>;
type TUpdateStudentPaymentInfo = (studentKey: string, paid: number) => Promise<boolean>;

interface ICoursePaymentsStoreOptions {
    lookupStudentInfo: TLookupStudentInfoType,
    updateStudentPaymentInfo: TUpdateStudentPaymentInfo,
    firmAccounts: TFirmAccounts
}


export class CoursePaymentsStore {
    
    private lookupStudentInfo: TLookupStudentInfoType;
    private updateStudentPaymentInfo: TUpdateStudentPaymentInfo;
    private firmAccounts: TFirmAccounts;
    constructor(opts: ICoursePaymentsStoreOptions) {
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

    public async storeNewPayment(cp: ICoursePayment):Promise<ICoursePayment> {
        const up = await this.updateStudentPaymentInfo(cp.studentKey,1); 
        return Promise.resolve(cp);
    }
    public async getStudentPayments(studentKey: string): Promise<ICoursePayment[]> {
        return Promise.resolve([]);
    }
    public async getStudentPaidAmount(studentKey: string): Promise<number | null> {
        return Promise.resolve(null);
    }

    private lookupFirmKey(accountId: string): string | null {
        let r = null;
        Object.entries(this.firmAccounts).forEach( ([key,value])=>{
            if (value.includes(accountId)) {
                r = key;
            }
        })
        return r;
    }
}
