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

import { cf } from './validator';

describe('CodiceFiscale', () => {
  const error = {cf: true};

  const cfValid = [
    'BRNMRS80A01L781B'
  ];

  it('"test@gmail.com" should be cf', () => {
    const control = new FormControl('test@gmail.com');
    expect(cf()(control)).toEqual(error);
  });

  it('"test@xxx" should not be cf', () => {
    const control = new FormControl('test');
    expect(cf()(control)).toEqual(error);
  });

  it('"abc" should not be cf', () => {
    const control = new FormControl('abc');
    expect(cf()(control)).toEqual(error);
  });

  it('"BRNMRS80A01L781B" should be cf', () => {
    const control = new FormControl('BRNMRS80A01L781B');
    expect(cf()(control)).toBeNull();
  });
});
