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

import { url } from './validator';

describe('Url', () => {
  let control: FormControl;
  let validator: ValidatorFn;

  beforeEach(() => {
    validator = url;
  });

  it('"http://www.test.com" should equal to "null"', () => {
    control = new FormControl('http://www.test.com');
    expect(validator(control)).toBeNull();
  });

  it('"https://www.test.com/test/test.html" should equal to "null"', () => {
    control = new FormControl('https://www.test.com/test/test.html');
    expect(validator(control)).toBeNull();
  });

  it('"23a" should equal to "{url: true}"', () => {
    control = new FormControl('23a');
    expect(validator(control)).toEqual({url: true});
  });
});
