import { Ripper } from '../index';
test('My Ripper', () => {
  const r = new Ripper();
  expect(r.getName()).toBe('default name');
  r.setName('Pepa');
  const r2 = new Ripper();
  expect(r2.getName()).toBe('default name');
  expect(r.getName()).toBe('Pepa');
});
