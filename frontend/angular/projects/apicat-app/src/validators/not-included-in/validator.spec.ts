/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
