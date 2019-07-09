import pThrottle = require('p-throttle');

export interface IFioRecord {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
  accountStatement: IFioAccountStatement;
}

export interface IFioAccountStatement {
  info: IFioInfo;
  transactionList: IFioTrList;
}

export interface IFioTrList {
  transaction: IFioTransaction[];
}

export interface IFioTransaction {
  id: number;
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

export interface IFioRawTransaction {
  column22: IFioRawTrRecordN; // ID pohybu
  column0: IFioRawTrRecordS; // Datum
  column1: IFioRawTrRecordN; // Objem
  column14: IFioRawTrRecordS; // Mena
  column8: IFioRawTrRecordS; // Typ

  column2: IFioRawTrRecordS; // protiucet
  column3: IFioRawTrRecordS; // protiucet banka
  column10: IFioRawTrRecordS; // protiucet nazev
  column12: IFioRawTrRecordS; // protiucet banka nazev

  column4: IFioRawTrRecordS; // KS
  column5: IFioRawTrRecordS; // VS
  column6: IFioRawTrRecordS; // SS
  column7: IFioRawTrRecordS; // Uživatelská identifikace
  column16: IFioRawTrRecordS; // Zpráva pro příjemce
  column25: IFioRawTrRecordS; // Komentář
}
export interface IFioRawTrRecordS {
  value: string;
  name: string;
  id: number;
}
export interface IFioRawTrRecordN {
  value: number;
  name: string;
  id: number;
}

export interface IFioInfo {
  accountId: string;
  bankId: string;
  currency: string;
  iban: string;
  bic: string;
  idFrom: number | null;
  idTo: number | null;
  idLastDownload: number | null;
}



export class FioReader {
  private apiUrl = 'https://www.fio.cz/ib_api/rest/';
  private apiToken: string;
  private thfetch =  pThrottle( (url : string) => {
    return fetch(url);
  }, 1, 30000);
  
  
  constructor(token: string) {
    this.apiToken = token;
  }

  public async getLast(): Promise<IFioRecord> {
    const r = await this.thfetch(this.apiUrl + 'last/' + this.apiToken + '/transactions.json');
    const js = await r.json();
    return this.raw2fr(js);
  }

  public async getDayLastId(checkDate: Date): Promise<number | null> {

    const fromD = new Date(checkDate.getTime() - (3600000*24*7)); // 7 days

    const fior = await this.getPeriods(fromD,checkDate);
    if (fior) {
      return fior.accountStatement.info.idTo;
    } 
    return null;
  }

  public async setLastId(lastId: number): Promise<boolean> {
    //https://www.fio.cz/ib_api/rest/set-last-id/{token}/{id}/
    const r = await fetch(this.apiUrl + 'set-last-id/' + this.apiToken + '/'+lastId +'/');
    return r.status == 200;
  }


  public async getPeriods(fromDate: Date, toDate: Date): Promise<IFioRecord> {
    const r = await this.thfetch(
      this.apiUrl +
        'periods/' +
        this.apiToken +
        '/' +
        this.date2fioParam(fromDate) +
        '/' +
        this.date2fioParam(toDate) +
        '/transactions.json',
    );
    const js = await r.json();
    return this.raw2fr(js);
  }

  private async _getRaw(): Promise<string> {
    // const r = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    // const r = await fetch(this.apiUrl + 'last/' + this.apiToken + '/transactions.json');
    const r = await fetch(this.apiUrl + 'periods/' + this.apiToken + '/2019-06-12/2019-06-12/transactions.json');
    const jt = await r.text();
    // const js:IFioRecord = await r.json();
    // console.log(js.accountStatement.transactionList.transaction);
    return jt;
  }

  private date2fioParam(d: Date): string {
    const yp = d
      .getUTCFullYear()
      .toString(10)
      .padStart(2, '0');
    const mp = (d.getUTCMonth() + 1).toString(10).padStart(2, '0');
    const dp = d
      .getUTCDate()
      .toString(10)
      .padStart(2, '0');
    return yp + '-' + mp + '-' + dp;
  }

  private raw2tr(rt: IFioRawTransaction): IFioTransaction {
    return {
      // mandatory fields:
      id: rt.column22.value,
      date: rt.column0.value,
      amount: rt.column1.value,
      currency: rt.column14.value,
      type: rt.column8.value,

      // optional fields:
      fAccountId: rt.column2 ? rt.column2.value : null,
      fBankId: rt.column3 ? rt.column3.value : null,
      fAccountName: rt.column10 ? rt.column10.value : null,
      fBankName: rt.column12 ? rt.column12.value : null,

      ks: rt.column4 ? rt.column4.value : null,
      vs: rt.column5 ? rt.column5.value : null,
      ss: rt.column6 ? rt.column6.value : null,
      userRef: rt.column7 ? rt.column7.value : null,
      userMsg: rt.column16 ? rt.column16.value : null,
      comment: rt.column25 ? rt.column25.value : null,
    };
  }
  private raw2fr(js: any): IFioRecord {
    return {
      userId: js.userId,
      id: js.id,
      title: js.title,
      completed: js.completed,
      accountStatement: {
        info: {
          accountId: js.accountStatement.info.accountId,
          bankId: js.accountStatement.info.bankId,
          currency: js.accountStatement.info.currency,
          iban: js.accountStatement.info.iban,
          bic: js.accountStatement.info.bic,
          idFrom: js.accountStatement.info.idFrom,
          idTo: js.accountStatement.info.idTo,
          idLastDownload: js.accountStatement.info.idLastDownload,
        },
        transactionList: {
          transaction: js.accountStatement.transactionList.transaction.map((rt: IFioRawTransaction) => this.raw2tr(rt)),
        },
      },
    };
  }
}
