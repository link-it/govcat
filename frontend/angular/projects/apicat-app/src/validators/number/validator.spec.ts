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
import { FormControl } from '@angular/forms';

import { number } from './validator';

describe('Number', () => {
  let control: FormControl;

  it('"23" should equal to "null"', () => {
    control = new FormControl('23');
    expect(number()(control)).toBeNull();
  });

  it('"23.3" should equal to "null"', () => {
    control = new FormControl('23.3');
    expect(number()(control)).toBeNull();
  });

  it('"23a" should equal to "{number: true}"', () => {
    control = new FormControl('23a');
    expect(number()(control)).toEqual({number: true});
  });

  it('"23." should equal to "{number: true}"', () => {
    control = new FormControl('23.');
    expect(number()(control)).toEqual({number: true});
  });
});
