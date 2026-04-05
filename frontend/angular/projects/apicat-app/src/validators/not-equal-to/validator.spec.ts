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

import { notEqualTo } from './validator';

describe('NotEqualTo', () => {
  let notEqualControl: FormControl;
  let control: FormControl;

  beforeEach(() => {
    notEqualControl = new FormControl();
    control = new FormControl();
  });

  it('all control is empty should valid', () => {
    console.log(notEqualTo(notEqualControl)(control));
    expect(notEqualTo(notEqualControl)(control)).toEqual(null);
  });

  it('control.value = "xxx" and notEqualControl.value is empty should valid', () => {
    control.setValue('xxx');
    expect(notEqualTo(notEqualControl)(control)).toBeNull();
  });

  it('control.value = "xxx" and notEqualControl.value = "yyy" should valid', () => {
    control.setValue('xxx');
    notEqualControl.setValue('yyy');
    expect(notEqualTo(notEqualControl)(control)).toBeNull();
  });

  it('control.value = "xxx" and notEqualControl.value = "xxx" should equal to "{notEqualTo: true}"', () => {
    control.setValue('xxx');
    notEqualControl.setValue('xxx');
    expect(notEqualTo(notEqualControl)(control)).toEqual({ notEqualTo: { control: notEqualControl, value: notEqualControl.value } });
  });

  it('control.value is empty and notEqualControl.value = "yyy" should valid', () => {
    control.setValue('');
    notEqualControl.setValue('yyy');
    expect(notEqualTo(notEqualControl)(control)).toBeNull();
  });

});
