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
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { ConfigService, Tools, SearchBarFormComponent, EventsManagerService, EventType } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

export enum StatoConfigurazione {
  FALLITA = 'fallita',
  IN_CODA = 'in_coda',
  KO = 'ko',
  OK = 'ok',
  RETRY = 'retry'
}

@Component({
  selector: 'app-adesioni-search-form',
  templateUrl: './adesioni-search-form.component.html',
  styleUrls: ['./adesioni-search-form.component.scss'],
  standalone: false
})
export class AdesioniSearchFormComponent implements OnInit {

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  @Input() historyStore: string = 'dashboard-adesioni';
  @Output() search: EventEmitter<any> = new EventEmitter();

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});

  configStatusList: any = [
    { value: StatoConfigurazione.FALLITA, label: 'APP.STATUS.fallita' },
    { value: StatoConfigurazione.IN_CODA, label: 'APP.STATUS.in_coda' },
    { value: StatoConfigurazione.KO, label: 'APP.STATUS.ko' },
    { value: StatoConfigurazione.OK, label: 'APP.STATUS.ok' },
    { value: StatoConfigurazione.RETRY, label: 'APP.STATUS.retry' }
  ];
  configStatusEnum: any = {};
  _tempEnable = this.configStatusList.map((item: any) => {
    this.configStatusEnum = { ...this.configStatusEnum, [item.value]: item.label };
    return item;
  });

  _workflowStati: any[] = Tools.Configurazione?.adesione.workflow.stati || [];

  searchFields: any[] = [
    { field: 'q', label: 'APP.ADESIONI.LABEL.Name', type: 'string', condition: 'like' },
    { field: 'stato', label: 'APP.LABEL.Status', type: 'enum', condition: 'equal', enumValues: Tools.StatiAdesioneEnum },
    { field: 'id_dominio', label: 'APP.LABEL.id_dominio', type: 'text', condition: 'equal', params: { resource: 'domini', field: 'nome' } },
    { field: 'id_servizio', label: 'APP.ADESIONI.LABEL.Service', type: 'text', condition: 'equal', params: { resource: 'servizi', field: '{nome} v.{versione}' } },
    { field: 'id_organizzazione', label: 'APP.ADESIONI.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' } },
    { field: 'id_soggetto', label: 'APP.ADESIONI.LABEL.Subject', type: 'text', condition: 'equal', params: { resource: 'soggetti', field: 'nome' } },
    { field: 'id_client', label: 'APP.ADESIONI.LABEL.Client', type: 'text', condition: 'equal', params: { resource: 'client', field: 'nome' } },
    { field: 'stato_configurazione_automatica', label: 'APP.ADESIONI.LABEL.AutomaticConfigurationStatus', type: 'enum', condition: 'equal', enumValues: this.configStatusEnum },
  ];

  servizi$!: Observable<any[]>;
  serviziInput$ = new Subject<string>();
  serviziLoading: boolean = false;

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;

  soggetti$!: Observable<any[]>;
  soggettiInput$ = new Subject<string>();
  soggettiLoading: boolean = false;

  clients$!: Observable<any[]>;
  clientsInput$ = new Subject<string>();
  clientsLoading: boolean = false;

  domini$!: Observable<any[]>;
  dominiInput$ = new Subject<string>();
  dominiLoading: boolean = false;

  _organizzazioneSelected: any = null;
  showSoggetto: boolean = false;

  minLengthTerm = 1;

  constructor(
    private readonly configService: ConfigService,
    private readonly apiService: OpenAPIService,
    private readonly authenticationService: AuthenticationService,
    private readonly eventsManagerService: EventsManagerService
  ) {
    this._initSearchForm();
  }

  ngOnInit() {
    this._initDominiSelect([]);
    this._initServiziSelect([]);
    this._initOrganizzazioniSelect([]);
    this._initClientsSelect([]);

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
      this._workflowStati = Tools.Configurazione?.adesione.workflow.stati || [];
    });
  }

  get isGestore(): boolean {
    return this.authenticationService.isGestore();
  }

  get hasConfigurazioneAutomatica(): boolean {
    const configAutomatica = Tools.Configurazione?.adesione?.configurazione_automatica || null;
    return configAutomatica && (configAutomatica?.length > 0);
  }

  _initSearchForm() {
    this._formGroup = new UntypedFormGroup({
      q: new UntypedFormControl(''),
      stato: new UntypedFormControl(''),
      id_dominio: new UntypedFormControl(null),
      id_servizio: new UntypedFormControl(null),
      id_organizzazione: new UntypedFormControl(null),
      id_soggetto: new UntypedFormControl(null),
      id_client: new UntypedFormControl(null),
      stato_configurazione_automatica: new UntypedFormControl(''),
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

  getData(model: string, term: any = null, params: any = {}, sort: string = 'id', sort_direction: string = 'desc'): Observable<any> {
    let _options: any = { params: params };
    if (term) {
      if (typeof term === 'string') {
        _options.params = { ..._options.params, q: term };
      }
      if (typeof term === 'object') {
        _options.params = { ..._options.params, ...term };
      }
    }

    return this.apiService.getList(model, _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          return resp.content.map((item: any) => item);
        }
      }));
  }

  _initServiziSelect(defaultValue: any[] = []) {
    this.servizi$ = concat(
      of(defaultValue),
      this.serviziInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.serviziLoading = true),
        switchMap((term: any) => {
          return this.getData('servizi', term).pipe(
            catchError(() => of([])),
            tap(() => this.serviziLoading = false)
          )
        })
      )
    );
  }

  _initOrganizzazioniSelect(defaultValue: any[] = []) {
    this.organizzazioni$ = concat(
      of(defaultValue),
      this.organizzazioniInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.organizzazioniLoading = true),
        switchMap((term: any) => {
          return this.getData('organizzazioni', term).pipe(
            catchError(() => of([])),
            tap(() => this.organizzazioniLoading = false)
          )
        })
      )
    );
  }

  _initSoggettiSelect(defaultValue: any[] = []) {
    this.soggetti$ = concat(
      of(defaultValue),
      this.soggettiInput$.pipe(
        startWith(''),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.soggettiLoading = true),
        switchMap((term: any) => {
          return this.getData('soggetti', term, { id_organizzazione: this._organizzazioneSelected?.id_organizzazione || '' }).pipe(
            catchError(() => of([])),
            tap(() => this.soggettiLoading = false)
          )
        })
      )
    );
  }

  _initClientsSelect(defaultValue: any[] = []) {
    this.clients$ = concat(
      of(defaultValue),
      this.clientsInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.clientsLoading = true),
        switchMap((term: any) => {
          return this.getData('client', term).pipe(
            catchError(() => of([])),
            tap(() => this.clientsLoading = false)
          )
        })
      )
    );
  }

  _initDominiSelect(defaultValue: any[] = []) {
    this.domini$ = concat(
      of(defaultValue),
      this.dominiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.dominiLoading = true),
        switchMap((term: any) => {
          return this.getData('domini', term).pipe(
            catchError(() => of([])),
            tap(() => this.dominiLoading = false)
          )
        })
      )
    );
  }

  onSelectedSearchDropdwon($event: Event) {
    this.searchBarForm.setNotCloseForm(true);
    $event.stopPropagation();
  }

  onChangeOrganizzazioneDropdwon(event: any) {
    this._organizzazioneSelected = event;
    this._formGroup.get('id_soggetto')?.setValue(null);

    this.showSoggetto = this._organizzazioneSelected?.multi_soggetto || false;
    if (this.showSoggetto) {
      this._initSoggettiSelect([]);
    }

    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false);
    }, 200);
  }

  onChangeSearchDropdwon(event: any) {
    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false);
    }, 200);
  }

  trackBySelectFn(item: any) {
    return item.id_client || item.id_servizio || item.id_soggetto || item.id_organizzazione || item.id_dominio;
  }
}
