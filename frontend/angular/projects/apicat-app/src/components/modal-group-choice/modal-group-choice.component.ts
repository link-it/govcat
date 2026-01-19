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
import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@services/utils.service';

import * as _ from 'lodash';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-modal-group-choice',
  templateUrl: './modal-group-choice.component.html',
  styleUrls: ['./modal-group-choice.component.scss'],
  standalone: false
})
export class ModalGroupChoiceComponent implements OnInit {

  gruppi: any[] = [];
  selected: any[] = [];
  notSelectable: any[] = [];
  _gruppi: any[] = [];

  onClose!: Subject<any>;

  _spin: boolean = false;

  filter: string = '';
  searched: boolean = false;
  
  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;
  _errorMsg: string = '';

  constructor(
    public bsModalRef: BsModalRef,
    private translate: TranslateService,
    public apiService: OpenAPIService,
    private utils: UtilService
  ) { }

  ngOnInit() {
    this.onClose = new Subject();
    this._loadGruppi();
  }

  closeModal() {
    this.bsModalRef.hide();
  }

  _loadGruppi(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    
    let aux: any;
    query = { ...query, gruppo_padre_null: true };
    aux = { params: this.utils._queryToHttpParams(query) };

    this._spin = true;
    this.apiService.getList('gruppi', aux, url).subscribe({
      next: (response: any) => {

        if (response.content) {
          const _list: any = response.content.map((gruppo: any) => {
            const element = {
              id: gruppo.id_gruppo,
              id_gruppo: gruppo.id_gruppo,
              nome: gruppo.nome,
              logo: gruppo.immagine || '',
              immagine: gruppo.immagine || '',
              descrizione: gruppo.descrizione || '',
              descrizione_sintetica: gruppo.descrizione_sintetica || '',
              children: gruppo.figli,
              figli: gruppo.figli,
              hasChildren: !!gruppo.figli,
              source: { ...gruppo },
            };
            return element;
          });
          this.gruppi = (url) ? [...this.gruppi, ..._list] : [..._list];

        }
        this._spin = false;
      },
      error: (error: any) => {
        this._spin = false;
        this._setErrorMessages(true);
      }
    });
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.NoResults';
      this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
    }
  }

  onSelected() {
    this.onClose.next(this.selected);
    this.bsModalRef.hide();
  }

  onSelectAll() {
    this.selected = [ ...this.gruppi ];
    // this.onClose.next(this.list);
    // this.bsModalRef.hide();
  }

  onDeselectAll() {
    this.selected = [];
  }

  selectItem(item: any) {
    if (this.isSelected(item)) {
      this.selected = _.filter(this.selected, (o) => (typeof o === 'string') ? o !== item : o.value !== item.value);
    } else {
      this.selected.push(item);
    }
  }

  isSelected(item: any) {
    return (_.findIndex(this.selected, function(o) { return (typeof o === 'string') ? o === item : o.value === item.value; }) !== -1);
  }

  onAction(event: any) {
    switch(event.action) {
      case 'select':
        this.selected.push(event.item);
        this.onSelected();
        break;
    }
  }
}
