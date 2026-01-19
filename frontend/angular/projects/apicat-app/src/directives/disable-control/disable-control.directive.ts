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
import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[disableControl]',
  standalone: false

})
export class DisableControlDirective {

  _ngControl: NgControl;

  @Input() set disableControl(condition: boolean) {
    const action = condition ? 'disable' : 'enable';
    if (this._ngControl && this._ngControl.control) {
      this._ngControl.control[action]();
    }
  }

  constructor(private ngControl: NgControl) {
    this._ngControl = ngControl;
  }
}
