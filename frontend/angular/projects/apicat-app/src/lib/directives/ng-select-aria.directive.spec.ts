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
import { describe, it, expect } from 'vitest';
import { ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { NgSelectAriaDirective } from './ng-select-aria.directive';

describe('NgSelectAriaDirective', () => {
  const setup = (control: FormControl) => {
    const host = document.createElement('ng-select');
    const input = document.createElement('input');
    input.setAttribute('role', 'combobox');
    host.appendChild(input);
    const directive = new NgSelectAriaDirective(new ElementRef(host), { control } as any);
    return { directive, input };
  };

  it('should set aria-required for a required control', () => {
    const { directive, input } = setup(new FormControl(null, Validators.required));
    directive.ngAfterViewInit();
    expect(input.getAttribute('aria-required')).toBe('true');
    directive.ngOnDestroy();
  });

  it('should describe the input with the hint and, when invalid, with the error', () => {
    const control = new FormControl(null, Validators.required);
    const { directive, input } = setup(control);
    directive.describedBy = 'cp-req-hint';
    directive.errorId = 'cp-error';
    directive.ngAfterViewInit();
    expect(input.getAttribute('aria-describedby')).toBe('cp-req-hint');

    control.markAsTouched();
    directive.onFocusOut();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('cp-req-hint cp-error');
    directive.ngOnDestroy();
  });

  it('should not set aria-describedby without hint and errors', () => {
    const { directive, input } = setup(new FormControl('x'));
    directive.errorId = 'cp-error';
    directive.ngAfterViewInit();
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    directive.ngOnDestroy();
  });
});
