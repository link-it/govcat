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

import { arrayLength } from './validator';

describe('ArrayLength validator', () => {
  it('Input is array', () => {
    const control = new FormControl(['ok']);
    expect(arrayLength(0)(control)).toBeNull();
  });

  it('Input not array', () => {
    const control = new FormControl({ dumb: 1 });
    expect(arrayLength(1)(control)).toEqual({ arrayLength: { minLength: 1 } });
  });

  it('Input is array of object and greater than 1', () => {
    const control = new FormControl([{ dumb: 1 }, { dumb: 2 }]);
    expect(arrayLength(1)(control)).toBeNull();
  });

  it('Input is array of object and less than 2', () => {
    const control = new FormControl([{ dumb: 1 }]);
    expect(arrayLength(2)(control)).toEqual({ arrayLength: { minLength: 2 } });
  });
});
