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
import { HttpParams } from '@angular/common/http';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { OpenAPIService } from '@services/openAPI.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-modal-category-choice',
  templateUrl: './modal-category-choice.component.html',
  styleUrls: ['./modal-category-choice.component.scss'],
  standalone: false
})
export class ModalCategoryChoiceComponent implements OnInit {

  title: string = 'APP.TITLE.AddCategory';
  categorie: any[] = [];
  selected: any;
  notSelectable: any[] = [];

  tassonomie: any[] = [];

  onClose!: Subject<any>;

  _spin: boolean = false;

  _message: string = 'APP.MESSAGE.SelectTaxonomy';
  _messageHelp: string = 'APP.MESSAGE.SelectTaxonomyHelp';

  _error: boolean = false;
  _errorMsg: string = '';

  minLengthTerm: number = 0;
  tassonomie$!: Observable<any[]>;
  tassonomieInput$ = new Subject<string>();
  tassonomieLoading: boolean = false;
  selectedTassonomia: any;

  constructor(
    public bsModalRef: BsModalRef,
    private translate: TranslateService,
    public apiService: OpenAPIService,
  ) { }

  ngOnInit() {
    this.onClose = new Subject();
    this._initTassonomieSelect([]);
  }

  closeModal() {
    this.bsModalRef.hide();
  }

  _initTassonomieSelect(defaultValue: any[] = []) {
    this.tassonomie$ = concat(
      of(defaultValue),
      this.tassonomieInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        startWith(''),
        distinctUntilChanged(),
        debounceTime(200),
        tap(() => this.tassonomieLoading = true),
        switchMap((term: any) => {
          return this.getData('tassonomie', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.tassonomieLoading = false)
          )
        })
      )
    );
  }

  getData(model: string, term: any = null, sort: string = 'id', sort_direction: string = 'desc'): Observable<any> {
    let _options: any = { params: { limit: 100, sort: sort, sort_direction: 'asc' } };
    // let _options: any = { params: { } };
    if (term) {
      if (typeof term === 'string' ) {
        _options.params =  { ..._options.params, q: term };
      }
      if (typeof term === 'object' ) {
        _options.params =  { ..._options.params, ...term };
      }
    }

    return this.apiService.getList(model, _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = (resp.content || resp).map((item: any) => {
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          }).filter((item: any) => item.visibile);
          return _items;
        }
      })
      );
  }

  onChangeSearchDropdwon(event: any){
    this.selectedTassonomia = event;
  }

  trackBySelectFn(item: any) {
    return item.id_tassonomia;
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.NoTaxonomies';
      this._messageHelp = 'APP.MESSAGE.NoTaxonomiesHelp';
    }
  }

  onSelected() {
    this.onClose.next(this.selected);
    this.bsModalRef.hide();
  }

  onAction(event: any) {
    switch(event.action) {
      case 'select':
        this.selected = event.item;
        this.onSelected();
        break;
    }
  }
}
