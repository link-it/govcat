import { FormControl } from '@angular/forms';

import { cf } from './validator';

describe('CodiceFiscale', () => {
  const error = {cf: true};

  it('"test@gmail.com" should be cf', () => {
    const control = new FormControl('test@gmail.com');
    expect(cf(control)).toBeNull();
  });

  it('"test@xxx" should not be cf', () => {
    const control = new FormControl('test');
    expect(cf(control)).toEqual(error);
  });

  it('"abc" should not be cf', () => {
    const control = new FormControl('abc');
    expect(cf(control)).toEqual(error);
  });
});
