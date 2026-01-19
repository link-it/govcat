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
import { FormControl, ValidatorFn } from '@angular/forms';

import { rangeLength } from './validator';

describe('RangeLength [4,9],', () => {
  let control: FormControl;
  let validator: ValidatorFn;

  beforeEach(() => {
    validator = rangeLength([4, 9]);
  });

  it('"abc" should equal to "{rangeLength: true}"', () => {
    control = new FormControl('abc');
    expect(validator(control)).toEqual({ rangeLength: { value: [4, 9] } });
  });

  it('"abcd" should equal to "null"', () => {
    control = new FormControl('abcd');
    expect(validator(control)).toBeNull();
  });

  it('"abcdefghi" should equal to "null"', () => {
    control = new FormControl('abcdefghi');
    expect(validator(control)).toBeNull();
  });

  it('"abcdefghij" should equal to "{rangeLength: true}"', () => {
    control = new FormControl('abcdefghij');
    expect(validator(control)).toEqual({ rangeLength: { value: [4, 9] } });
  });
});
