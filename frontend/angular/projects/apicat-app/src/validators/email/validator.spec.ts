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

import { email } from './validator';

describe('Email', () => {
  const error = {email: true};

  it('"test@gmail.com" should be email', () => {
    const control = new FormControl('test@gmail.com');
    expect(email(control)).toBeNull();
  });

  it('"test@xxx" should not be email', () => {
    const control = new FormControl('test');
    expect(email(control)).toEqual(error);
  });

  it('"abc" should not be email', () => {
    const control = new FormControl('abc');
    expect(email(control)).toEqual(error);
  });
});
