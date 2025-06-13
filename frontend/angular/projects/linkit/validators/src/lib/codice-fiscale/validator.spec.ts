import { FormControl } from '@angular/forms';

import { cf } from './validator';

describe('CodiceFiscale', () => {
  const error = {cf: true};

  const cfValid = [
    'BRNMRS80A01L781B'
  ];

  it('"test@gmail.com" should be cf', () => {
    const control = new FormControl('test@gmail.com');
    expect(cf()(control)).toEqual(error);
  });

  it('"test@xxx" should not be cf', () => {
    const control = new FormControl('test');
    expect(cf()(control)).toEqual(error);
  });

  it('"abc" should not be cf', () => {
    const control = new FormControl('abc');
    expect(cf()(control)).toEqual(error);
  });

  it('"BRNMRS80A01L781B" should be cf', () => {
    const control = new FormControl('BRNMRS80A01L781B');
    expect(cf()(control)).toBeNull();
  });
});
