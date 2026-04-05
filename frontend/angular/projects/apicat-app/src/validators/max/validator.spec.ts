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
