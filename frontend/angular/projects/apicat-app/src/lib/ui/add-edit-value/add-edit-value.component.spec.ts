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
import { AddEditValueComponent } from './add-edit-value.component';

describe('AddEditValueComponent', () => {
  let component: AddEditValueComponent;

  beforeEach(() => {
    component = new AddEditValueComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty default value', () => {
    expect(component._value).toBe('');
  });

  it('should have empty default placeholder', () => {
    expect(component._placehoder).toBe('');
  });

  it('should emit save with value and reset on _save', () => {
    const spy = vi.fn();
    component.save.subscribe(spy);
    component._value = 'test-value';
    component._save();
    expect(spy).toHaveBeenCalledWith({ value: 'test-value' });
    expect(component._value).toBe('');
  });

  it('should emit save with empty value on _save', () => {
    const spy = vi.fn();
    component.save.subscribe(spy);
    component._save();
    expect(spy).toHaveBeenCalledWith({ value: '' });
  });

  it('should accept custom inputs', () => {
    component._value = 'custom';
    component._placehoder = 'enter value';
    expect(component._value).toBe('custom');
    expect(component._placehoder).toBe('enter value');
  });
});
