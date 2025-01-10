import { FormControl } from '@angular/forms';

import { oneOf } from './validator';

describe('oneOf', () => {

  it('[1, 2, 3] should include 3', () => {
    const control = new FormControl(3);
    expect(oneOf([1, 2, 3])(control)).toBeNull();
  });

  it('["a", "b", "c"] should include "a"', () => {
    const control = new FormControl('a');
    expect(oneOf(['a', 'b', 'c'])(control)).toBeNull();
  });

  it('[1, 2, 3] should not include 5', () => {
    const control = new FormControl(5);
    expect(oneOf([1, 2, 3])(control)).toEqual({ oneOf: { value: 5, reason: [1, 2, 3] } });
  });
});
