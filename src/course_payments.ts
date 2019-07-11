export interface IStudentInfo {
    studentKey: string;
    firmKey: string;
    courseCost: number;
    paid: number;
}

type TLookupStudentInfoType = (vs: string) => Promise<IStudentInfo | null>;
type TFirmAccounts = Record<string,string[]>;

interface ICoursePaymentsStoreOptions {
    lookupStudentInfo: TLookupStudentInfoType,
    firmAccounts: TFirmAccounts
}

export class CoursePaymentsStore {
    
    private lookupStudentInfo: TLookupStudentInfoType;
    private firmAccounts: TFirmAccounts;
    constructor(opts: ICoursePaymentsStoreOptions) {
        this.lookupStudentInfo = opts.lookupStudentInfo;
        this.firmAccounts = opts.firmAccounts;
    }
    
    public async checkNewBankPaymentExact(accountId: string, vs: string, amount: number): Promise<boolean> {
        const firmKey = this.lookupFirmKey(accountId);
        if (firmKey === null) {
            console.log("can't find firm for account", accountId);
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
