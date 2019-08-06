export interface IFioCfgRecord {
  fioAccountId: string;
  fioToken: string;
  firmKey: string;
}

export class FioCfg {
  private list: IFioCfgRecord[] = [];
  public getList(): IFioCfgRecord[] {
    return this.list;
  }
  public addFio(fioAccountId: string, fioToken: string, firmKey: string): void {
    if (fioAccountId === '') {
      throw Error('missing fioAccountId');
    }
    if (fioToken === '') {
      throw Error('missing fioToken');
    }
    if (firmKey === '') {
      throw Error('missing firmKey');
    }
    if (this.list.filter(v => v.fioAccountId === fioAccountId).length > 0) {
      throw Error('duplicate fioAccountId');
    }
    if (this.list.filter(v => v.fioToken === fioToken).length > 0) {
      throw Error('duplicate fioToken');
    }
    this.list.push({
      fioAccountId,
      fioToken,
      firmKey,
    });
  }

  public getFirmAccounts(): Record<string, string[]> {
    return this.list.reduce<Record<string, string[]>>((acc, r) => {
      if (acc[r.firmKey] == null) {
        acc[r.firmKey] = [r.fioAccountId];
      } else {
        acc[r.firmKey].push(r.fioAccountId);
      }
      return acc;
    }, {});
  }
  public anyFio(): boolean {
    return this.list.length > 0;
  }
}

export function createFioCfgFromEnv(): FioCfg {
  const fc = new FioCfg();
  if (process.env.BANK_FIO_ON_SRO === 'true') {
    fc.addFio(process.env.BANK_FIO_ACCOUNT_ID_SRO || '', process.env.BANK_FIO_TOKEN_SRO || '', 'sro');
  }
  if (process.env.BANK_FIO_ON_LB === 'true') {
    fc.addFio(process.env.BANK_FIO_ACCOUNT_ID_LB || '', process.env.BANK_FIO_TOKEN_LB || '', 'lb');
  }
  if (process.env.BANK_FIO_ON_AB === 'true') {
    fc.addFio(process.env.BANK_FIO_ACCOUNT_ID_AB || '', process.env.BANK_FIO_TOKEN_AB || '', 'ab');
  }

  return fc;
}
