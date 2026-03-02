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

import { property } from './validator';

describe('Property validator', () => {
  it('Input is object and has identifier', () => {
    const control = new FormControl({ id: 1 });
    expect(property('id')(control)).toBeNull();
  });

  it('Input is object and has name', () => {
    const control = new FormControl({ name: 'name' });
    expect(property('name')(control)).toBeNull();
  });

  it('Input is object and has no identifier', () => {
    const control = new FormControl({ dumb: 1 });
    expect(property('id')(control)).toEqual({ hasProperty: { value: 'id' } });
  });

  it('Input is string', () => {
    const control = new FormControl('dumb string');
    expect(property('id')(control)).toEqual({ hasProperty: { value: 'id' } });
  });

  it('Input is object and has identifier', () => {
    const control = new FormControl({ id: 1, value: 1 });
    expect(property('id,value')(control)).toBeNull();
  });

  it('Input is object and has no two properties', () => {
    const control = new FormControl(1);
    expect(property('id,value')(control)).toEqual({ hasProperty: { value: 'id,value' } });
  });
});
