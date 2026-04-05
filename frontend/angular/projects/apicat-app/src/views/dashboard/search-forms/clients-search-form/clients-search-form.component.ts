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
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { COMPONENTS_IMPORTS, ConfigService, Tools, SearchBarFormComponent, EventsManagerService, EventType } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

const fake_ambiente = ['collaudo', 'produzione'];

@Component({
  selector: 'app-clients-search-form',
  templateUrl: './clients-search-form.component.html',
  styleUrls: ['./clients-search-form.component.scss'],
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
export class ClientsSearchFormComponent implements OnInit {

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  @Input() historyStore: string = 'dashboard-clients';
  @Output() search: EventEmitter<any> = new EventEmitter();

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});

  _statiClient: any[] = [];
  _authTypeEnum: any[] = [];
  _ambienteEnum: any[] = [];

  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    { field: 'stato', label: 'APP.LABEL.Status', type: 'enum', condition: 'equal', enumValues: Tools.StatiClientEnum },
    { field: 'auth_type', label: 'APP.CLIENT.LABEL.Auth_type', type: 'string', condition: 'like' },
    { field: 'ambiente', label: 'APP.CLIENT.LABEL.Ambient', type: 'string', condition: 'equal' },
    { field: 'id_soggetto', label: 'APP.CLIENT.LABEL.Subject', type: 'text', condition: 'equal', params: { resource: 'soggetti', field: 'nome' } },
    { field: 'id_organizzazione', label: 'APP.ADESIONI.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' } }
  ];

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;

  _searchOrganizzazioneSelected: any = null;

  soggetti$!: Observable<any[]>;
  soggettiInput$ = new Subject<string>();
  soggettiLoading: boolean = false;

  _searchSoggettoSelected: any = null;

  minLengthTerm = 1;

  constructor(
    private readonly translate: TranslateService,
    private readonly configService: ConfigService,
    private readonly apiService: OpenAPIService,
    private readonly eventsManagerService: EventsManagerService
  ) {
    this._initSearchForm();
  }

  ngOnInit() {
    if (Tools.StatiClient) { this._statiClient = [...Tools.StatiClient]; }
    if (Tools.Configurazione) {
      Tools.Configurazione.servizio.api.auth_type.map((item: any) => this._authTypeEnum.push(item.type));
    }
    this._ambienteEnum = fake_ambiente;

    this._initSoggettiSelect([]);
    this._initOrganizzazioniSelect([]);

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
      this._statiClient = [...Tools.StatiClient];
      this._authTypeEnum = [];
      Tools.Configurazione.servizio.api.auth_type.map((item: any) => this._authTypeEnum.push(item.type));
    });
  }

  _initSearchForm() {
    this._formGroup = new UntypedFormGroup({
      q: new UntypedFormControl(''),
      stato: new UntypedFormControl(''),
      auth_type: new UntypedFormControl(''),
      ambiente: new UntypedFormControl(''),
      id_soggetto: new UntypedFormControl(''),
      id_organizzazione: new UntypedFormControl(''),
    });
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this.search.emit(values);
  }

  _initSoggettiSelect(defaultValue: any[] = []) {
    this.soggetti$ = concat(
      of(defaultValue),
      this.soggettiInput$.pipe(
        filter(res => res !== null && res.length >= this.minLengthTerm),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.soggettiLoading = true),
        switchMap((term: any) => {
          return this.getSoggetti(term).pipe(
            catchError(() => of([])),
            tap(() => this.soggettiLoading = false)
          );
        })
      )
    );
  }

  getSoggetti(term: string | null = null): Observable<any> {
    let _options: any = null;
    if (this._searchOrganizzazioneSelected?.id_organizzazione) {
      _options = { params: { q: term, id_organizzazione: this._searchOrganizzazioneSelected.id_organizzazione } };
    } else {
      _options = { params: { q: term } };
    }
    return this.apiService.getList('soggetti', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          return resp.content.map((item: any) => item);
        }
      }));
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
          return this.getOrganizzazioni(term).pipe(
            catchError(() => of([])),
            tap(() => this.organizzazioniLoading = false)
          );
        })
      )
    );
  }

  getOrganizzazioni(term: string | null = null): Observable<any> {
    this._initSoggettiSelect([]);
    const _options: any = { params: { q: term } };
    return this.apiService.getList('organizzazioni', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          return resp.content.map((item: any) => item);
        }
      }));
  }

  onChangeSearchDropdwon(event: any, param: string) {
    if (param == 'soggetto') { this._searchSoggettoSelected = event; }
    if (param == 'organizzazione') { this._searchOrganizzazioneSelected = event; }
    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false);
    }, 200);
  }

  onSelectedSearchDropdwon($event: any) {
    this.searchBarForm.setNotCloseForm(true);
    $event.stopPropagation();
  }

}
