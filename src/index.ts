import 'cross-fetch/polyfill';
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

export { FioReader } from './fio';
export { FioDataStore } from './fio_ds';
