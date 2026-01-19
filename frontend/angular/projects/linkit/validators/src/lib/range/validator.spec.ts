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

import { range } from './validator';

describe('Range [4, 9]', () => {
  let control: FormControl;
  let validator: ValidatorFn;

  beforeEach(() => {
    validator = range([4, 9]);
  });

  it('"3" should equal to "{range: true, reason: [4, 9]}"', () => {
    control = new FormControl(3);
    expect(validator(control)).toEqual({ range: { value: [4, 9] } });
  });

  it('"4" should equal to "null"', () => {
    control = new FormControl(4);
    expect(validator(control)).toBeNull();
  });

  it('"9" should equal to "null"', () => {
    control = new FormControl(9);
    expect(validator(control)).toBeNull();
  });

  it('"10" should equal to "{range: true, reason: [4, 9]}"', () => {
    control = new FormControl(10);
    expect(validator(control)).toEqual({ range: { value: [4, 9] } });
  });
});
