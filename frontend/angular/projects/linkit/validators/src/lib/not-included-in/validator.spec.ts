import { FormControl, Validators } from '@angular/forms';

import { notIncludedIn } from './validator';

describe('notIncludedIn', () => {

  it('[1, 2, 3] should not include 5', () => {
    const control = new FormControl(5);
    expect(notIncludedIn([1, 2, 3])(control)).toBeNull();
  });

  it('["a", "b", "c"] should not include "x"', () => {
    const control = new FormControl('x');
    expect(notIncludedIn(['a', 'b', 'c'])(control)).toBeNull();
  });

  it('[1, 2, 3] should include 3', () => {
    const control = new FormControl(3);
    expect(notIncludedIn([1, 2, 3])(control)).toEqual({ notIncludedIn: { value: 3, reason: [1, 2, 3] } });
  });

  it('should return null when includedInArr is not present', () => {
    const control = new FormControl(5);
    expect(notIncludedIn(null as any)(control)).toBeNull();
  });

  it('should return null when control is required and value is empty', () => {
    const control = new FormControl('', Validators.required);
    expect(notIncludedIn([1, 2, 3])(control)).toBeNull();
  });

  it('should return null when control value is not in includedInArr', () => {
    const control = new FormControl(5);
    expect(notIncludedIn([1, 2, 3])(control)).toBeNull();
  });

  it('should return error object when control value is in includedInArr', () => {
    const control = new FormControl(3);
    expect(notIncludedIn([1, 2, 3])(control)).toEqual({ notIncludedIn: { value: 3, reason: [1, 2, 3] } });
  });
});
