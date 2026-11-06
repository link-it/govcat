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
import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute, Navigation } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';

import { ConfigService, COMPONENTS_IMPORTS, Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { Transazione } from './transazione';
import { auditAbilitato, auditDettaglio, erroreAudit, PARAMETRO_AUDIT } from '../audit';

import { Observable, of, Subject, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

declare const saveAs: any;

@Component({
  selector: 'app-transazione-details',
  templateUrl: 'transazione-details.component.html',
  styleUrls: ['transazione-details.component.scss'],
  standalone: true,
  imports: [TranslateModule, MarkdownModule, ...COMPONENTS_IMPORTS]
})
export class TransazioneDetailsComponent implements OnInit, OnChanges, AfterContentChecked {
  static readonly Name = 'TransazioneDetailsComponent';
  readonly model: string = 'transazioni';

  @Input() id: number | null = null;
  @Input() data: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  service: any = null;
  sid: number | null = null;
  environmentId: string = 'collaudo';

  Tools = Tools;

  dominio: any = null;
  richiedente: any = null;
  anagrafiche: any = null;

  appConfig: any;

  hasTab: boolean = true;
  tabs: any[] = [
    { label: 'APP.TRANSACTIONS.TABS.InformazioniGenerali', icon: 'details', link: 'InformazioniGenerali', enabled: true },
    { label: 'APP.TRANSACTIONS.TABS.InformazioniMittente', icon: 'details', link: 'InformazioniMittente', enabled: true },
    { label: 'APP.TRANSACTIONS.TABS.DettaglioMessaggio', icon: 'details', link: 'DettaglioMessaggio', enabled: true }
  ];
  _currentTab: string = 'InformazioniGenerali';

  _editable: boolean = true;
  _deleteable: boolean = false;
  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _data: Transazione = new Transazione({});
  _dataCreate: any = null;

  _spin: boolean = true;
  _downloading: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  apiUrl: string = '';
  _imagePlaceHolder: string = './assets/images/logo-placeholder.png';

  domini$!: Observable<any[]>;
  dominiInput$ = new Subject<string>();
  dominiLoading: boolean = false;
  selectedDominio: any;

  utenti$!: Observable<any[]>;
  utentiInput$ = new Subject<string>();
  utentiLoading: boolean = false;
  selectedUtente: any;

  referenti$!: Observable<any[]>;
  referentiInput$ = new Subject<string>();
  referentiLoading: boolean = false;
  selectedreferente: any;

  referentiTecnici$!: Observable<any[]>;
  referentiTecniciInput$ = new Subject<string>();
  referentiTecniciLoading: boolean = false;
  selectedreferenteTecnico: any;

  minLengthTerm = 1;

  generalConfig: any = Tools.Configurazione;

  _singleColumn: boolean = false;

  _hasFocus: boolean = false;

  _fromDashboard: boolean = false;
  _dashboardSection: string = '';

  environment: string = 'collaudo';

  _hasInvocazioneApi: boolean = false;
  _hasInformazioniToken: boolean = false;

  /** Dettaglio aperto dalla pagina Audit. */
  _audit: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private apiService: OpenAPIService,
    private utils: UtilService
  ) {
    this.appConfig = this.configService.getConfiguration();
    this._audit = !!this.route.snapshot?.data?.['audit'];
    if (this._audit) {
      this.tabs = [{ label: 'APP.AUDIT.TABS.Audit', icon: 'details', link: 'Audit', enabled: true }, ...this.tabs];
      this._currentTab = 'Audit';
    } else {
      this.tabs = [...this.tabs, { label: 'APP.TRANSACTIONS.TABS.InformazioniAudit', icon: 'details', link: 'InformazioniAudit', enabled: false }];
    }
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;

    this.apiUrl = this.appConfig.AppConfig.GOVAPI.HOST;

    const _currentNav: Navigation | null = this.router.getCurrentNavigation();
    if (_currentNav?.extras.state) {
      if (_currentNav.extras.state.environment ) {
        this.environment = _currentNav.extras.state.environment || 'collaudo';
      }
    }

    this.route.queryParams.subscribe((val) => {
      if (val.from === 'dashboard') {
        this._fromDashboard = true;
        this._dashboardSection = val.section || '';
        this._initBreadcrumb();
      }
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.sid = params['id'];
        this.environmentId = params['id_ambiente'] || 'collaudo';
        this.id = params['tid'];
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.config = config;
            this._singleColumn = config.editSingleColumn || false;
            if (!this.service) {
              this._loadAll();
            } else {
              this._loadtransaction();
            }
          }
        );
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadServizio();
    this._loadtransaction();
  }

  _hasControlError(name: string) {
    return !!(this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm(data: any = null) {
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'id':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroup = new UntypedFormGroup(_group);
    }
  }

  _downloadAction(event: any) {
    // Dummy
  }

  _loadServizio() {
    if (this.id) {
      this.service = null;
      this.apiService.getDetails('servizi', this.sid).subscribe({
        next: (response: any) => {
          this.service = response;
          // this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadtransaction(spin: boolean = true) {
    if (this.id) {
      this._spin = spin;
      if (spin) { this.data = null; }
      // this.configService.getJson('transazione').subscribe({
      const _path = `${this.environment}/diagnostica`;
      const _dettaglio$ = this._conAudit$().pipe(
        switchMap((conAudit: boolean) => conAudit
          ? this.apiService.getMonitorDetails(_path, this.id, undefined, { params: { [PARAMETRO_AUDIT]: 'true' } }).pipe(
            // Transazione di un'API senza audit: si mostra il dettaglio senza le informazioni di audit
            catchError((error: any) => (!this._audit && erroreAudit(error)) ? this.apiService.getMonitorDetails(_path, this.id) : throwError(() => error))
          )
          : this.apiService.getMonitorDetails(_path, this.id))
      );
      _dettaglio$.subscribe({
        next: (response: any) => {
          let _applicativoToken = '';
          const _data = response;
          const _ruolo = this.translate.instant('APP.LABEL.' + _data.ruolo_component + '_type');
          let _tipologia = `${_ruolo} (${_data.profilo})`;
          const _indirizzoIp = _data.dati_mittente ? (_data.dati_mittente.indirizzo_ip_inoltrato || _data.dati_mittente.indirizzo_ip) : null;
          let _profiloCollaborazione = null;
          if (_data.api?.tipologia === 'soap') {
            _profiloCollaborazione = _data.api.profilo_collaborazione;
          }
          this._hasInformazioniToken = !!_data.token;
          if (this._hasInformazioniToken) {
            _applicativoToken = `${_data.token.applicativo}@${_data.token.soggetto}`;
          }
          this._hasInvocazioneApi = !!_data.api;
          let _returnCodeHttp = this.translate.instant('APP.LABEL.HTTP');
          if (Number(_data.esito.codice) === 2) {
            if (_data.api?.tipologia === 'rest') {
              _returnCodeHttp = this.translate.instant('APP.LABEL.ProblemDetails');
              _returnCodeHttp = `${_returnCodeHttp} ${_data.return_code_http}`;
            }
            else if (_data.api?.tipologia === 'soap') {
              _returnCodeHttp = this.translate.instant('APP.LABEL.SOAPFault');
              _returnCodeHttp = `${_returnCodeHttp} ${_data.return_code_http}`;
            }
            else {
              _returnCodeHttp = `${_returnCodeHttp} ${_data.return_code_http}`;
            }
          } else {
            _returnCodeHttp = `${_returnCodeHttp} ${_data.return_code_http}`;
          }
          const _esitoLabel = this.translate.instant(`APP.TOOLTIP.ESITO.INDEX_${_data.esito.codice}`);
          const _esitoConsegna = _data.return_code_http ? ` (${_data.return_code_http})` : '';
          let _esitoComposed = `${_esitoLabel}${_esitoConsegna}`;
        // delete _data.dettaglio_errore;
          this.data = {
            ..._data,
            tipologia: _tipologia,
            ip_richiedente: _indirizzoIp,
            profilo_collaborazione: _profiloCollaborazione,
            esito_composed: _esitoComposed,
            token: { ..._data.token, applicativo_token: _applicativoToken },
            audit: auditDettaglio(_data.audit)
          };
          this._initTabs();
          this._spin = false;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.service ? this.service.nome + ' v. ' + this.service.versione : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _view = (localStorage.getItem('SERVIZI_VIEW') === 'TRUE') ? '/view' : '';
    if (this._fromDashboard) {
      const _dashboardParams = this._dashboardSection ? { section: this._dashboardSection } : null;
      this.breadcrumbs = [
        { label: 'APP.TITLE.Dashboard', url: '/dashboard', type: 'link', iconBs: 'speedometer2', params: _dashboardParams },
        { label: `${_title}`, url: `/servizi/${this.sid}${_view}`, type: 'link', tooltip: _toolTipServizio },
        { label: this._audit ? 'APP.TITLE.Audit' : 'APP.TITLE.Transactions', url: `/servizi/${this.sid}/${this._audit ? 'audit' : 'transazioni'}`, type: 'link', params: { back: true } },
        { label: `${this.data.id_traccia}`, url: ``, type: 'link' },
      ];
    } else {
      this.breadcrumbs = [
        { label: '', url: '', type: 'title', iconBs: 'grid-3x3-gap' },
        { label: 'APP.TITLE.Services', url: '/servizi', type: 'link' },
        { label: `${_title}`, url: `/servizi/${this.sid}${_view}`, type: 'link', tooltip: _toolTipServizio },
        { label: this._audit ? 'APP.TITLE.Audit' : 'APP.TITLE.Transactions', url: `/servizi/${this.sid}/${this._audit ? 'audit' : 'transazioni'}`, type: 'link', params: { back: true } },
        { label: `${this.data.id_traccia}`, url: ``, type: 'link' },
      ];
    }
  }

  /** Informazioni di audit richieste se abilitate; al primo caricamento la configurazione remota può non essere ancora disponibile. */
  _conAudit$(): Observable<boolean> {
    if (this._audit) {
      return of(true);
    }
    const _monitoraggio$: Observable<any> = Tools.Configurazione
      ? of(Tools.Configurazione.monitoraggio)
      : this.apiService.getList('configurazione').pipe(
        map((config: any) => config?.monitoraggio),
        catchError(() => of(null))
      );
    return _monitoraggio$.pipe(map((monitoraggio: any) => auditAbilitato(monitoraggio)));
  }

  get _tabAudit(): string {
    return this._audit ? 'Audit' : 'InformazioniAudit';
  }

  _initTabs() {
    const _conAudit = !this._audit && !!this.data.audit;
    this.tabs = this.tabs.map((item: any) => {
      let _enabled = true;
      if (item.link === 'InformazioniMittente') {
        _enabled = !!this.data.dati_mittente;
      }
      if (item.link === 'DettaglioMessaggio') {
        _enabled = !!this.data.richiesta || !!this.data.risposta;
      }
      if (item.link === 'InformazioniAudit') {
        _enabled = _conAudit;
      }
      return {
        ...item,
        enabled: _enabled
      };
    });
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      if (event.params?.section) {
        this.router.navigate([event.url], { queryParams: event.params });
      } else {
        this.router.navigate([event.url], { state: event.params || null, queryParamsHandling: 'preserve' });
      }
    }
  }

  /** Elementi nome/valore di una sezione che indica il campo dell'elenco. */
  _elencoSezione(section: any): any[] {
    const _valore = (section?.field || '').split('.').reduce((obj: any, key: string) => obj?.[key], this.data);
    return Array.isArray(_valore) ? _valore : [];
  }

  _onTabs(tab: string) {
    this._currentTab = tab;
  }
}
