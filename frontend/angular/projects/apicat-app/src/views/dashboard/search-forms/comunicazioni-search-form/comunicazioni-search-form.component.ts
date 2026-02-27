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
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { SearchBarFormComponent } from '@linkit/components';

@Component({
  selector: 'app-comunicazioni-search-form',
  templateUrl: './comunicazioni-search-form.component.html',
  styleUrls: ['./comunicazioni-search-form.component.scss'],
  standalone: false
})
export class ComunicazioniSearchFormComponent {

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  @Input() historyStore: string = 'dashboard-comunicazioni';
  @Output() search: EventEmitter<any> = new EventEmitter();

  _formGroup: UntypedFormGroup = new UntypedFormGroup({
    q: new UntypedFormControl('')
  });

  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' }
  ];

  _onSearch(values: any) {
    this.search.emit(values);
  }
}
