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

import { equalTo } from './validator';

describe('EqualTo', () => {

  it('"aaa" and "aaa" should be equalTo', () => {
    const control = new FormControl('aaa');
    const control1 = new FormControl('aaa');

    expect(equalTo(control1)(control)).toBeNull();
  });

  it('"aaa" and "bbb" should not be equalTo', () => {
    const control = new FormControl('aaa');
    const control1 = new FormControl('bbb');

    expect(equalTo(control1)(control)).toEqual({ equalTo: { control: control1, value: control1.value } });
  });
});
