import { FormControl, Validators } from '@angular/forms';

import { max } from './validator';

describe('Max', () => {
  it('1 should be under 5', () => {
    const control = new FormControl(1);
    expect(max(5)(control)).toBeNull();
  });

  it('9 should not be over 5', () => {
    const control = new FormControl(9);
    expect(max(5)(control)).toEqual({ max: { value: 5 } });
  });

  it('"19" should not be over 5', () => {
    const control = new FormControl('19');
    expect(max(5)(control)).toEqual({ max: { value: 5 } });
  });

  it('should return null when value is not present', () => {
    const control = new FormControl(1);
    expect(max(null as any)(control)).toBeNull();
  });

  it('should return null when control is required', () => {
    const control = new FormControl(1, Validators.required);
    expect(max(5)(control)).toBeNull();
  });

  it('should return null when control value is less than max value', () => {
    const control = new FormControl(1);
    expect(max(5)(control)).toBeNull();
  });

  it('should return error object when control value is greater than max value', () => {
    const control = new FormControl(9);
    expect(max(5)(control)).toEqual({ max: { value: 5 } });
  });

  it('should return error object when control value is a string and is greater than max value', () => {
    const control = new FormControl('19');
    expect(max(5)(control)).toEqual({ max: { value: 5 } });
  });

  it('should return null when control is required and value is empty', () => {
  const control = new FormControl('', Validators.required);
  expect(max(5)(control)).toBeNull();
});
});
