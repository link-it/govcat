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
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ui-add-edit-value',
    templateUrl: './add-edit-value.component.html',
    styleUrls: [
        './add-edit-value.component.scss'
    ],
    standalone: false
})
export class AddEditValueComponent {

  @Input('value') _value = '';
  @Input('pholder') _placehoder = '';

  @Output() save: EventEmitter<any> = new EventEmitter();

  _save() {
    this.save.emit({ value: this._value });
    this._value = '';
  }
}
