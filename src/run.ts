import {fetch} from 'cross-fetch';
import {FioReader, Ripper} from './index';
const r = new Ripper();

r.setName('pep');
console.log(r.getName());

const fr = new FioReader();

fr.getRecord().then( frr =>{
    console.log('frr:',frr);
})