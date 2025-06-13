import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute, Navigation } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { Transazione } from './transazione';

import { Observable, Subject } from 'rxjs';

declare const saveAs: any;

@Component({
  selector: 'app-transazione-details',
  templateUrl: 'transazione-details.component.html',
  styleUrls: ['transazione-details.component.scss'],
  standalone: false
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

  environment: string = 'collaudo';

  _hasInvocazioneApi: boolean = false;
  _hasInformazioniToken: boolean = false;

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
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;

    this.apiUrl = this.appConfig.AppConfig.GOVAPI.HOST;

    const _currentNav: Navigation | null = this.router.getCurrentNavigation();
    if (_currentNav?.extras.state) {
      if (_currentNav.extras.state.environment ) {
        this.environment = _currentNav.extras.state.environment || 'collaudo';
      }
    }
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
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
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

  trackByFn(item: any) {
    return item.id;
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
      this.apiService.getMonitorDetails(`${this.environment}/diagnostica`, this.id).subscribe({
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
            token: { ..._data.token, applicativo_token: _applicativoToken }
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
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', iconBs: 'grid-3x3-gap' },
      { label: 'APP.TITLE.Services', url: '/servizi', type: 'link' },
      { label: `${_title}`, url: `/servizi/${this.sid}${_view}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.TITLE.Transactions', url: `/servizi/${this.sid}/transazioni`, type: 'link', params: { back: true } },
      { label: `${this.data.id_traccia}`, url: ``, type: 'link' },
    ];
  }

  _initTabs() {
    this.tabs = this.tabs.map((item: any) => {
      let _enabled = true;
      if (item.link === 'InformazioniMittente') {
        _enabled = !!this.data.dati_mittente;
      }
      if (item.link === 'DettaglioMessaggio') {
        _enabled = !!this.data.richiesta || !!this.data.risposta;
      }
      return {
        ...item,
        enabled: _enabled
      };
    });
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url], { state: event.params || null });
    }
  }

  _onTabs(tab: string) {
    this._currentTab = tab;
  }
}
