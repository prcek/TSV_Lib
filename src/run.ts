import { fetch } from 'cross-fetch';
import { FioReader, Ripper } from './index';
// tslint:disable-next-line:no-var-requires
require('dotenv').config();

const r = new Ripper();

r.setName('pep');
console.log(r.getName());

const fr = new FioReader(process.env.FIO_TOKEN || 'missing');

fr._getRaw().then(frr => {
  console.log(frr);
});
