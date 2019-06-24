export interface IFioRecord {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
  accountStatement: IFioAccountStatement;
}

export interface IFioAccountStatement {
  info: IFioInfo;
}

export interface IFioInfo {
  accountId: string;
  bankId: string;
  currency: string;
}

// tslint:disable-next-line:max-classes-per-file
export class FioReader {
  private apiUrl = 'https://www.fio.cz/ib_api/rest/';
  private apiToken: string;
  constructor(token: string) {
    this.apiToken = token;
  }

  public async getRecord(): Promise<IFioRecord> {
    // const r = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const r = await fetch(this.apiUrl + 'last/' + this.apiToken + '/transactions.json');
    // const jt = await r.text();
    const js = await r.json();
    return js;
  }
}
