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
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { COMPONENTS_IMPORTS, ConfigService, Tools, SearchBarFormComponent } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import { Ruolo, Stato } from '@app/views/utenti/utente-details/utente';

@Component({
  selector: 'app-utenti-search-form',
  templateUrl: './utenti-search-form.component.html',
  styleUrls: ['./utenti-search-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    TranslateModule,
    ...COMPONENTS_IMPORTS
  ]
})
export class UtentiSearchFormComponent implements OnInit {

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  @Input() historyStore: string = 'dashboard-utenti';
  @Output() search: EventEmitter<any> = new EventEmitter();

  _formGroup: FormGroup = new FormGroup({});

  _statoArr: any[] = [];
  _ruoloArr: any[] = [];

  yesNoList: any = [
    { value: true, label: 'APP.BOOLEAN.Yes' },
    { value: false, label: 'APP.BOOLEAN.No' }
  ];
  _enabledEnum: any = {};
  _roleEnum: any = {};
  _statoEnum: any = {};

  searchFields: any[] = [];

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;

  _searchOrganizzazioneSelected: any = null;

  classiUtente$!: Observable<any[]>;
  classiUtenteInput$ = new Subject<string>();
  classiUtenteLoading: boolean = false;

  minLengthTerm = 1;

  constructor(
    private readonly translate: TranslateService,
    private readonly configService: ConfigService,
    private readonly apiService: OpenAPIService,
    private readonly utils: UtilService
  ) {
    this.yesNoList.map((item: any) => {
      this._enabledEnum = { ...this._enabledEnum, [item.value]: item.label };
      return item;
    });
    Object.values(Ruolo).map((value: any) => {
      this._roleEnum = { ...this._roleEnum, [value]: `APP.USERS.ROLES.${value}` };
      return value;
    });
    Object.values(Stato).map((value: any) => {
      this._statoEnum = { ...this._statoEnum, [value]: `APP.USERS.STATUS.${value}` };
      return value;
    });

    this.searchFields = [
      { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
      { field: 'email', label: 'APP.LABEL.email', type: 'string', condition: 'like' },
      { field: 'ruolo', label: 'APP.LABEL.Role', type: 'enum', condition: 'equal', enumValues: this._roleEnum },
      { field: 'stato', label: 'APP.LABEL.Status', type: 'enum', condition: 'equal', enumValues: this._statoEnum },
      { field: 'principal', label: 'APP.USERS.LABEL.Principal', type: 'string', condition: 'like' },
      { field: 'id_organizzazione', label: 'APP.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' } },
      { field: 'classe_utente', label: 'APP.LABEL.classi', type: 'array', condition: 'contain', params: { resource: 'classi-utente', field: 'nome' } },
      { field: 'referente_tecnico', label: 'APP.LABEL.ReferenteTecnico', type: 'enum', condition: 'equal', enumValues: this._enabledEnum }
    ];

    this._initSearchForm();
  }

  ngOnInit() {
    this._statoArr = Object.values(Stato);
    this._ruoloArr = Object.values(Ruolo);

    this._initOrganizzazioniSelect([]);
    this._initClassiUtenteSelect([]);
  }

  _initSearchForm() {
    this._formGroup = new FormGroup({
      q: new FormControl(''),
      email: new FormControl(''),
      ruolo: new FormControl(''),
      stato: new FormControl(''),
      principal: new FormControl(''),
      id_organizzazione: new FormControl(''),
      classe_utente: new FormControl(''),
      referente_tecnico: new FormControl('')
    });
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this.search.emit(this.utils._removeEmpty(values));
  }

  _initOrganizzazioniSelect(defaultValue: any[] = []) {
    this.organizzazioni$ = concat(
      of(defaultValue),
      this.organizzazioniInput$.pipe(
        filter(res => res !== null && res.length >= this.minLengthTerm),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.organizzazioniLoading = true),
        switchMap((term: any) => {
          return this.getData('organizzazioni', term).pipe(
            catchError(() => of([])),
            tap(() => this.organizzazioniLoading = false)
          );
        })
      )
    );
  }

  _initClassiUtenteSelect(defaultValue: any[] = []) {
    this.classiUtente$ = concat(
      of(defaultValue),
      this.classiUtenteInput$.pipe(
        startWith(''),
        distinctUntilChanged(),
        debounceTime(300),
        tap(() => this.classiUtenteLoading = true),
        switchMap((term: any) => {
          return this.getData('classi-utente', term).pipe(
            catchError(() => of([])),
            tap(() => this.classiUtenteLoading = false)
          );
        })
      )
    );
  }

  getData(model: string, term: any = null): Observable<any> {
    let _options: any = { params: {} };
    if (term) {
      if (typeof term === 'string') { _options.params = { ..._options.params, q: term }; }
      if (typeof term === 'object') { _options.params = { ..._options.params, ...term }; }
    }
    return this.apiService.getList(model, _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          return (resp.content || resp).map((item: any) => item);
        }
      }));
  }

  onChangeSearchDropdwon(event: any) {
    this._searchOrganizzazioneSelected = event;
    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false);
    }, 200);
  }

  onSelectedSearchDropdwon($event: Event) {
    this.searchBarForm.setNotCloseForm(true);
    $event.stopPropagation();
  }

}
