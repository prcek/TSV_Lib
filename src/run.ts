import { fetch } from 'cross-fetch';
import { FioReader, Ripper } from './index';
// tslint:disable-next-line:no-var-requires
require('dotenv').config();

const r = new Ripper();

r.setName('pep');
console.log(r.getName());

const fr = new FioReader(process.env.FIO_TOKEN || 'missing');

fr.getPeriods(new Date(), new Date()).then(frr => {
  console.log(frr.accountStatement.transactionList.transaction);
});
