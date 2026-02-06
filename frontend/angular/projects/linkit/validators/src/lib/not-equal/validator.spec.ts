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

import { notEqual } from './validator';

describe('NotEqual', () => {

  it('"aaa" and "bbb" should be notEqual', () => {
    const control = new FormControl('bbb');
    expect(notEqual('aaa')(control)).toBeNull();
  });

  it('"aaa" and "aaa" should not be notEqual', () => {
    const control = new FormControl('aaa');
    expect(notEqual('aaa')(control)).toEqual({ notEqual: { value: 'aaa' } });
  });
});
