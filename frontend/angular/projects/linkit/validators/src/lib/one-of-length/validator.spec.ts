import { FormControl } from '@angular/forms';

import { oneOfLength } from './validator';

describe('oneOfLength', () => {

  it('[1, 2, 3] should include 3', () => {
    const control = new FormControl(3);
    expect(oneOfLength([1, 2, 3])(control)).toBeNull();
  });

  it('["a", "b", "c"] should include "a"', () => {
    const control = new FormControl('a');
    expect(oneOfLength(['a', 'b', 'c'])(control)).toBeNull();
  });

  it('[1, 2, 3] should not include 5', () => {
    const control = new FormControl(5);
    expect(oneOfLength([1, 2, 3])(control)).toEqual({ oneOfLength: { value: 5, reason: [1, 2, 3] } });
  });
});
