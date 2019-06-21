import {fetch} from 'cross-fetch';


export const Greeter = (name: string) => `Hello ${name}`;

export class Ripper {
  private name: string;
  constructor() {
    this.name = 'default name';
  }
  public getName(): string {
    return this.name;
  }
  public setName(name: string) {
    this.name = name;
  }
}

export interface IFioRecord {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
}

// tslint:disable-next-line:max-classes-per-file
export class FioReader {
    public async getRecord(): Promise<IFioRecord> {
       const r = await fetch('https://jsonplaceholder.typicode.com/todos/1');
       const js = await r.json();
       return js;
    }
}