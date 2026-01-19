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
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';

import { Tools } from '@linkit/components';

@Component({
  selector: 'ui-error-view',
  templateUrl: './error-view.component.html',
  styleUrls: ['./error-view.component.scss'],
  standalone: false
})
export class ErrorViewComponent implements OnInit {

  @Input('errTitle') title: string | null = null;
  @Input() errors: any[] = [];
  @Input() showClose: boolean = false;

  @Output() onClose = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.title) {
      this.title = changes.title.currentValue;
    }
    if (changes.errors) {
      this.errors = changes.errors.currentValue;
    }
  }

  _getCustomFieldLabel(field: string) {
    const _elem = Tools.CustomFieldsLabel.find((item: any) => item.label === field)
    return _elem?.value || field;
  }

  _hasCustomFieldLabel(field: string) {
    const _elem = Tools.CustomFieldsLabel.find((item: any) => item.label === field)
    return !!_elem;
  }

  _getProfiloLabel(cod: string) {
    const _srv: any = Tools.Configurazione.servizio;
    const _profili = (_srv && _srv.api) ? _srv.api.profili : [];
    const _profilo = _profili.find((item: any) => item.codice_interno === cod);
    return _profilo ? _profilo.etichetta : cod;
  }

  _getParms(err: any) {
    const _params = err.params || {};
    switch (err.sottotipo) {
      case 'Profilo':
        _params['profilo'] = this._getProfiloLabel(_params['profilo']);
        break;
      default:
        break;
    }
    return _params;
  }

  _getSottotipoKey(sottotipo: any[]) {
    const label = sottotipo.map((item:any) => item.tipo).join('.');
    return label;
  }

  closeMessages() {
    this.onClose.emit(true);
  }
}
