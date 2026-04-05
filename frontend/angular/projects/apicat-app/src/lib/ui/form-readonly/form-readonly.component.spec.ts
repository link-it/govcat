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
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormReadonlyComponent } from './form-readonly.component';

describe('FormReadonlyComponent', () => {
  let component: FormReadonlyComponent;

  beforeEach(() => {
    component = new FormReadonlyComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default columns 6', () => {
    expect(component._columns).toBe(6);
  });

  it('should emit downloadClick event with correct item', () => {
    const spy = vi.fn();
    component.downloadClick.subscribe(spy);
    const item = { id: 1, name: 'Test' };
    component.__downloadClick(item);
    expect(spy).toHaveBeenCalledWith({ item });
  });

  it('should accept custom fields', () => {
    const fields = [{ label: 'Nome', value: 'Test' }] as any;
    component._fields = fields;
    expect(component._fields).toBe(fields);
  });
});
