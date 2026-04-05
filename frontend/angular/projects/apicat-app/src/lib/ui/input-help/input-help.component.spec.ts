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
import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { InputHelpComponent } from './input-help.component';

describe('InputHelpComponent', () => {
  let component: InputHelpComponent;
  const mockTranslate = {
    instant: (key: string) => key,
  } as any;

  beforeEach(() => {
    component = new InputHelpComponent(mockTranslate);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty field by default', () => {
    expect(component.field).toBe('');
  });

  it('should set _text and _existsValue false when no translation', () => {
    component.context = 'ctx';
    component.ngOnChanges({ field: new SimpleChange(undefined, 'myField', true) });
    expect(component._text).toBe('APP.LABEL_HELP.ctx.myField');
    expect(component._existsValue).toBe(false);
  });

  it('should set _existsValue true when translation exists', () => {
    const mockTranslateFound = {
      instant: (key: string) => 'Help text here',
    } as any;
    const comp = new InputHelpComponent(mockTranslateFound);
    comp.context = 'ctx';
    comp.ngOnChanges({ field: new SimpleChange(undefined, 'field1', true) });
    expect(comp._existsValue).toBe(true);
    expect(comp._text).toBe('Help text here');
  });
});
