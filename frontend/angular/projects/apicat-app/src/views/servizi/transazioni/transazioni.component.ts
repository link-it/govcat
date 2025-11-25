import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpHeaders, HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';

import { ConfigService } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';

import { SearchBarFormComponent } from '@linkit/components';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs/operators';

import { EventType } from '@linkit/components';
import { Page } from '@app/models/page';

import * as moment from 'moment';
import * as _ from 'lodash';
import { uuid } from 'projects/linkit/validators/src/lib/uuid/validator';
declare const saveAs: any;

enum TransactionOutcome {
  Personalized = 'personalizzato',
  OK = 'ok',
  Fault = 'fault',
  Failed = 'fallite',
  FailedAndFault = 'fallite_e_fault',
  FailedExcludeDiscarded = 'fallite_escludi_scartate',
  FailedAndFaultExcludeDiscarded = 'fallite_e_fault_escludi_scartate',
}

enum SearchTypeEnum {
  Generic = 'generic',
  Transaction = 'transaction',
}

@Component({
  selector: 'app-transazioni',
  templateUrl: 'transazioni.component.html',
  styleUrls: ['transazioni.component.scss'],
  standalone: false
})
export class TransazioniComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'TransazioniComponent';
  readonly model: string = 'transazioni';

  id: number | null = null;
  environmentId: string = 'collaudo'; // collaudo / produzione

  service: any = null;

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  Tools = Tools;

  config: any;
  transazioniConfig: any;
  _monitoraggioLimitata: boolean = false;

  elements: any[] = [];
  _page: Page = new Page({});
  _links: any = {};
  _allElements: number = 0;
  
  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any = {};

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  _spinExport: boolean = false;
  desktop: boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;

  showHistory: boolean = false;
  showSearch: boolean = true;
  showSorting: boolean = true;

  readonly SearchTypeEnum = SearchTypeEnum;

  _searchTypes: {value: string, label: string}[] = [
    { value: SearchTypeEnum.Generic, label: this.translate.instant('APP.TRANSACTIONS.SEARCH_TYPE.' + SearchTypeEnum.Generic) },
    { value: SearchTypeEnum.Transaction, label: this.translate.instant('APP.TRANSACTIONS.SEARCH_TYPE.' + SearchTypeEnum.Transaction) }
  ];

  private _outcomes: {value: string, label: string}[] = [ 
    { value: TransactionOutcome.Personalized, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Personalized) },
    { value: TransactionOutcome.OK, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.OK) },
    { value: TransactionOutcome.Fault, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Fault) },
    { value: TransactionOutcome.Failed, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.Failed) },
    { value: TransactionOutcome.FailedAndFault, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.FailedAndFault) },
    { value: TransactionOutcome.FailedExcludeDiscarded, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.FailedExcludeDiscarded) },
    { value: TransactionOutcome.FailedAndFaultExcludeDiscarded, label: this.translate.instant('APP.LABEL.TRANSACTION_OUTCOME.' + TransactionOutcome.FailedAndFaultExcludeDiscarded) }
  ];
  public _outcomesEnum: any = {};
  _tempTO = this._outcomes.map((item: any) => {
    this._outcomesEnum =  { ...this._outcomesEnum, [item.value]: item.label};
    return item;
  });

  public outcomes: {value: string, label: string}[] = [];

  public transactionDetailedOutcomes: {value: number, label:string}[] = [];

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [
    { field: 'search_type', label: 'APP.LABEL.SearchType', type: 'string', condition: 'like', options: { hide: true } },
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    { field: 'data_da', label: 'APP.LABEL.DateFrom', type: 'date', condition: 'gte', format: 'DD/MM/YYYY HH:mm' },
    { field: 'data_a', label: 'APP.LABEL.DateTo', type: 'date', condition: 'lte', format: 'DD/MM/YYYY HH:mm' },
    { field: 'id_api', label: 'APP.LABEL.id_api', type: 'text', condition: 'equal', params: { resource: 'api', field: 'nome' } },
    { field: 'id_adesione', label: 'APP.LABEL.id_adesione', type: 'text', condition: 'equal', params: { resource: 'adesioni', field: 'soggetto.nome' } },
    { field: 'esito', label: 'APP.LABEL.Outcome', type: 'enum', condition: 'equal', enumValues: this._outcomesEnum },
    { field: 'transaction_outcome_codes', label: 'APP.LABEL.TransactionDetailedOutcome', type: 'array', condition: 'contain', data: this.transactionDetailedOutcomes },
    { field: 'id_transazione', label: 'APP.LABEL.IdTransazione', type: 'array', condition: 'equal', data: this.transactionDetailedOutcomes }
  ];
  useCondition: boolean = false;
  currentSearchType: string | null = SearchTypeEnum.Generic;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'title', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'title' }
  ];

  viewBoxed: boolean = false;

  api_url: string = '';
  defaultTransactionInterval: number = 30;

  generalConfig: any = Tools.Configurazione || null;

  _useNewSearchUI : boolean = false;

  _currentTab: string = 'informazioni-generali';

  minLengthTerm = 1;

  servizioApis$!: Observable<any[]>;
  servizioApisInput$ = new Subject<string>();
  servizioApisLoading: boolean = false;

  _apiSelected: any = null;
  _isFirst: boolean = true;
  _apiCount: number = 0;

  adesioni$!: Observable<any[]>;
  adesioniInput$ = new Subject<string>();
  adesioniLoading: boolean = false;
  
  _adesioneSelected: any = null;

  _isBack: boolean = false;

  _bsDateConfig: Partial<BsDatepickerConfig> = {
    withTimepicker: true,
    containerClass: 'theme-dark-blue',
    showTodayButton: true,
    todayPosition: 'left',
    todayButtonLabel: this.translate.instant('APP.BUTTON.Today'),
    showClearButton: true,
    clearPosition: 'right',
    clearButtonLabel: this.translate.instant('APP.BUTTON.Clear'),
    showWeekNumbers: false,
    dateInputFormat: 'DD/MM/YYYY, HH:mm'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    private eventsManagerService: EventsManagerService,
    public tools: Tools,
    private apiService: OpenAPIService,
    private authenticationService: AuthenticationService,
    private utils: UtilService
  ) {
    this.config = this.configService.getConfiguration();
    this._useNewSearchUI = true; // this.config.AppConfig.Search.newLayout || false;
    this._monitoraggioLimitata = this.generalConfig?.monitoraggio.limitata || false;

    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;
    this._isBack = _state?.back || false;

    this.api_url = this.config.AppConfig.GOVAPI.HOST;
    this.defaultTransactionInterval = this.config.AppConfig.DEFAULT_TRANSACTION_INTERVAL;

    this._loadTransactionDetailedOutcomes();
    this.searchFields[6].data = this.transactionDetailedOutcomes;
    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.environmentId = params['id_ambiente'] || 'collaudo';
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.transazioniConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
            }
            this._initServizioApiSelect([]);
            this._initAdesioniSelect([]);
          }
        );
      }
    });

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (event: any) => {
        this.generalConfig = Tools.Configurazione || null;
        this._monitoraggioLimitata = this.generalConfig?.monitoraggio.limitata || false;
    });
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!this._isBack) {
      this.searchBarForm._clearPinSearch();
    }
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
      setTimeout(() => {
        this._loadTransazioni();
      }, 100);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _title = this.service ? this.service.nome + ' v. ' + this.service.versione : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _view = (localStorage.getItem('SERVIZI_VIEW') === 'TRUE') ? '/view' : '';
    this.breadcrumbs = [
      { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
      { label: `${_title}`, url: `/servizi/${this.id}${_view}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.TITLE.Transactions', url: ``, type: 'link' }
    ];
  }

  _setErrorMessages(isError: boolean, error: any = null) {
    this._error = isError;
    if (this._error) {
      if (error?.error?.status === 403) {
        this._message = 'APP.MESSAGE.ERROR.Unauthorized';
        // this._messageHelp = error.error.detail;
        this._messageHelp = this.translate.instant('APP.MESSAGE.NoTransactionForService', { id: this.service.id_servizio });
      } else {
        this._message = 'APP.MESSAGE.ERROR.Default';
        this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
      }
    } else {
      this._message = 'APP.MESSAGE.NoResults';
      this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
    }
  }

  private _loadTransactionDetailedOutcomes() {
    this.transactionDetailedOutcomes = Array(...Array(49).keys()).map((_, i) => ({value: i, label: this.translate.instant('APP.ESITO.SHORT.INDEX_' + i)}));
  }

  private prepareTransactionOutcomeField(isErrorDistribution: boolean) {
    this.outcomes = isErrorDistribution ? this._outcomes.filter((o) => o.value !== TransactionOutcome.OK): this._outcomes;
    const transactionOutcomeControl = this._formGroup.get('esito');
    if(transactionOutcomeControl && isErrorDistribution && transactionOutcomeControl.value === TransactionOutcome.OK){
      transactionOutcomeControl.setValue(null);
    }
  }

  _initSearchForm() {
    const transactionOutcomeCodesControl = new UntypedFormControl(null);

    // Imposta le date di default (ultimi N minuti)
    const defaultDataDa = moment().add(-this.defaultTransactionInterval, 'minutes').toDate();
    const defaultDataA = moment().toDate();

    this._formGroup = new UntypedFormGroup({
      search_type: new UntypedFormControl(SearchTypeEnum.Generic),
      data_da: new UntypedFormControl(defaultDataDa),
      data_a: new UntypedFormControl(defaultDataA),
      q: new UntypedFormControl(''),
      id_api: new UntypedFormControl(null, Validators.required),
      id_adesione: new UntypedFormControl(''),
      esito: new UntypedFormControl(null),
      transaction_outcome_codes: transactionOutcomeCodesControl,
      id_transazione: new UntypedFormControl(''),
    });

    this.prepareTransactionOutcomeField(false);

    transactionOutcomeCodesControl.disable();
    this._formGroup.get('esito')?.valueChanges.subscribe((current: TransactionOutcome | null) => {
      if (!transactionOutcomeCodesControl) return;

      if (current && current !== TransactionOutcome.Personalized || !current) {
        transactionOutcomeCodesControl.clearValidators();
        transactionOutcomeCodesControl.setValue(null);
        transactionOutcomeCodesControl.disable();
      } else {
        transactionOutcomeCodesControl.setValidators([Validators.required]);
        transactionOutcomeCodesControl.enable();
      }
      transactionOutcomeCodesControl.updateValueAndValidity();
    });

    this._formGroup.get('search_type')?.valueChanges.subscribe((type: string | null) => {
      this.currentSearchType = type;
      if (type === SearchTypeEnum.Generic) {
        this._formGroup.get('id_transazione')?.setValue(null);
        this._formGroup.get('id_transazione')?.clearValidators();
        this._formGroup.get('id_transazione')?.updateValueAndValidity();

        this._formGroup.get('id_api')?.setValidators([Validators.required]);
        this._formGroup.get('id_api')?.updateValueAndValidity();
      } else {
        this._formGroup.get('data_da')?.setValue(null);
        this._formGroup.get('data_a')?.setValue(null);
        this._formGroup.get('q')?.setValue(null);
        this._formGroup.get('id_adesione')?.setValue(null);
        this._formGroup.get('esito')?.setValue(null);
        this._formGroup.get('transaction_outcome_codes')?.setValue(null);
        if (this._apiCount > 1) {
          this._formGroup.get('id_api')?.setValue('');
        }
        this._formGroup.get('id_api')?.clearValidators();
        this._formGroup.get('id_api')?.updateValueAndValidity();

        this._formGroup.get('id_transazione')?.setValidators([Validators.required, uuid()]);
        this._formGroup.get('id_transazione')?.updateValueAndValidity();
      }
      this._formGroup.markAllAsTouched();
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _hasControlError(name: string) {
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  _loadServizio() {
    if (this.id) {
      this.service = null;
      this.apiService.getDetails('servizi', this.id).subscribe({
        next: (response: any) => {
          this.service = response;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _prepareData(query: any) {
    const _data: any = {
      api: {
        id_servizio: this.id,
        id_api: query.id_api || null,
        id_adesione: query.id_adesione || null,
        id_client: query.id_client || null
      },
      // operazione: 'string',
      intervallo_temporale: {
        // 'ultime_ore' - 'ultimi_giorni' - 'ultimi_mesi' - 'personalizzato'
        tipo_intervallo_temporale: 'personalizzato',
        data_inizio: query.data_da,
        data_fine: query.data_a
      }
    };

    if (query.esito || (query.transaction_outcome_codes && query.transaction_outcome_codes.length)){
      _data.esito = {
        tipo: query.esito || undefined,
        codici: (query.transaction_outcome_codes && query.transaction_outcome_codes.length > 0) ? query.transaction_outcome_codes : undefined
      };
    }

    return _data;
  }

  _prepareRange(query: any) {
    let _range: any = null;
    if (_.isEmpty(query.data_da) && !_.isObject(query.data_da)) {
      if (_.isEmpty(query.data_a) && !_.isObject(query.data_a)) {
        _range = {
          data_da: moment().add(-this.defaultTransactionInterval, 'minutes').format(),
          data_a: moment().format()
        };
      } else {
        _range = {
          data_da: moment(query.data_a).add(-this.defaultTransactionInterval, 'minutes').format(),
          data_a: moment(query.data_a).format()
        }
      }
    } else {
      if (_.isEmpty(query.data_a) && !_.isObject(query.data_a)) {
        _range = {
          data_da: moment(query.data_da).format(),
          data_a: moment().format()
        };
      } else {
        _range = {
          data_da: moment(query.data_da).format(),
          data_a: moment(query.data_a).format()
        }
      }
    }
    _range = JSON.parse(JSON.stringify(_range));
    console.log('_range', _range);
    return _range;
  }

  _loadTransazioni(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    if (!this._formGroup.valid) {
      this._spin = false;
      return;
    }

    let _data: any = null;
    let _path: string = '';
    if (this.currentSearchType === SearchTypeEnum.Generic) {
      query = { ...query, id_servizio: this.id };
      const _range: any = this._prepareRange(query);
      query = { ...query, ..._range };

      _data = this._prepareData(query);

      const _verifica = this._tipoVerifica(this._apiSelected);
      const _soggetto = this._getSoggettoNome();
      _path = `${this.environmentId}/${_verifica}/${_soggetto}/diagnostica/lista-transazioni`;

      if (url) {
        // gestione delle chiamate url per ngx-infinite-scroll o per la paginazione
        let searchParmas = url.replace(/^[^:]+:\/\/[^/?#]+.+?(?=\?)/, '');
        _path = `${_path}${searchParmas}`;
      } else {
        this.elements = [];
      }
    } else {
      _data = { id_transazione: query.id_transazione, id_servizio: this.service.id_servizio };
      _path = `${this.environmentId}/diagnostica/lista-transazioni-id`;
    }

    this._allElements = 0;
    this._spin = true;
    
    this.apiService.postMonitor(`${_path}`, _data).subscribe({
      next: (response: any) => {

        response ? this._page = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        this._allElements = this._page.totalElements || 0;
        if (response && response.content) {
          const _list: any = response.content.map((transaction: any) => {
            // let _richiedenteCustom = transaction.richiedente || '<img class='align-text-top icon-16' src='./assets/images/anonymous.png'>';
            // const _titleTooltip = !transaction.richiedente ? this.translate.instant('APP.TOOLTIP.RichiestaAnonima') : '';
            // let _richiedenteCustom = transaction.richiedente || `<span class='bi bi-person-fill' title='${_titleTooltip}' [tooltip]='_titleTooltip' container='body' [delay]='500'><span class='small'>?</span></span>`;
            let _nomeErogatore = transaction.api?.nome;
            let _erogatore = transaction.api?.erogatore ? transaction.api.erogatore : null;
            if (_erogatore && transaction.ruolo_component === 'erogato_soggetto_dominio') { // erogato_soggetto_aderente
              _nomeErogatore = `${_nomeErogatore}@${_erogatore.nome}`;
            }
            let _returnCodeHttp = this.translate.instant('APP.LABEL.HTTP');
            if (Number(transaction.esito.codice) === 2) {
              if (transaction.api?.tipologia === 'rest') {
                _returnCodeHttp = this.translate.instant('APP.LABEL.ProblemDetails');
                _returnCodeHttp = `${_returnCodeHttp} ${transaction.return_code_http}`;
              }
              else if (transaction.api?.tipologia === 'soap') {
                _returnCodeHttp = this.translate.instant('APP.LABEL.SOAPFault');
                _returnCodeHttp = `${_returnCodeHttp} ${transaction.return_code_http}`;
              }
              else {
                _returnCodeHttp = `${_returnCodeHttp} ${transaction.return_code_http}`;
              }
            } else {
              _returnCodeHttp = `${_returnCodeHttp} ${transaction.return_code_http}`;
            }
            const element = {
              id: transaction.id_traccia,
              editMode: false,
              source: {
                ...transaction,
                nome_erogatore: _nomeErogatore,
                // richiedente_custom: _richiedenteCustom,
                richiedente_anonimo: transaction.richiedente ? null : '?',
                return_code_http_custom: _returnCodeHttp
              },
            };
            return element;
          });
          this.elements = (url) ? [...this.elements, ..._list] : [..._list];
          this._preventMultiCall = false;
          this._spin = false;
        }
      },
      error: (error: any) => {
        this._setErrorMessages(true, error);
        this._preventMultiCall = false;
        this._spin = false;
        console.log('error', error);
      }
    });
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadTransazioni(this._filterData, this._links.next.href);
    }
  }

  _onExportTransazioni() {
    this.__exportTransazioni(this._filterData);
  }

  __exportTransazioni(query: any = null) {
    let aux: any;

    let _path: string = '';
    if (this.currentSearchType === SearchTypeEnum.Generic) {
      query = { ...query, id_servizio: this.id };
      const _range: any = this._prepareRange(query);
      query = { ...query, ..._range };
      if (query) aux = { params: this.utils._queryToHttpParams(query, false) };

      const _verifica = this._tipoVerifica(this._apiSelected);
      // const _profilo = this._isSoggettoPDND() ? 'pdnd' : 'modi';
      // _path = `${this.environmentId}/${_verifica}/${_profilo}/diagnostica/lista-transazioni`;
      const _idSoggetto = this._getSoggettoNome();
      _path = `${this.environmentId}/${_verifica}/${_idSoggetto}/diagnostica/lista-transazioni`;
    } else {
      aux = { params: this.utils._queryToHttpParams({ id_transazione: query.id_transazione, id_servizio: this.service.id_servizio }) };
      _path = `${this.environmentId}/diagnostica/lista-transazioni-id`;
    }

    this._spinExport = true;

    let headers = new HttpHeaders();
    headers = headers.set('Accept', 'text/csv');

    aux = { responseType: 'blob' as 'json', ...aux };

    this.apiService.getMonitor(`${_path}`, aux).subscribe({
      next: (response: any) => {
        this._spinExport = false;
        let name: string = `lista-transazioni.csv`;
        saveAs(response, name);
      },
      error: (error: any) => {
        console.log('__exportTransazioni error', error);
        // this._setErrorMessages(true);
        this._spinExport = false;
      }
    });
  }

  _onNew() {
    this.router.navigate([this.model, 'new']);
  }

  _onEdit(event: any, param: any) {
    if (this.searchBarForm) {
      this.searchBarForm._pinLastSearch();
    }
    const _state: any = {
      environment: this.environmentId
    };
    this.router.navigate([`/servizi/${this.id}/transazioni`, param.id], { state: _state });
  }

  _onCloseEdit() {
    this._isEdit = false;
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    if (!this._formGroup.valid) {
      this._resetForm();
    } else {
      this._loadTransazioni(this._filterData);
    }
  }

  _setDefaultDateRange() {
    // Utility: Imposta le date di default se non sono già valorizzate (usato in caso di reset/modifica)
    if (this.currentSearchType === SearchTypeEnum.Generic) {
      const dataDaControl = this._formGroup.get('data_da');
      const dataAControl = this._formGroup.get('data_a');

      if (!dataDaControl?.value && !dataAControl?.value) {
        // Entrambe le date sono vuote, impostiamo il range di default
        const dataDa = moment().add(-this.defaultTransactionInterval, 'minutes').toDate();
        const dataA = moment().toDate();

        dataDaControl?.setValue(dataDa);
        dataAControl?.setValue(dataA);
      } else if (dataDaControl?.value && !dataAControl?.value) {
        // Solo data_da è impostata, impostiamo data_a a "ora"
        const dataA = moment().toDate();
        dataAControl?.setValue(dataA);
      } else if (!dataDaControl?.value && dataAControl?.value) {
        // Solo data_a è impostata, impostiamo data_da usando defaultTransactionInterval
        const dataDa = moment(dataAControl.value).add(-this.defaultTransactionInterval, 'minutes').toDate();
        dataDaControl?.setValue(dataDa);
      }
    }
  }

  _resetForm() {
    console.log('_apiSelected', this._apiSelected);
    this._filterData = {};

    this.elements = [];
    this.currentSearchType = SearchTypeEnum.Generic;
    this._formGroup.get('search_type')?.setValue(SearchTypeEnum.Generic);
    if (this._apiSelected && (this._apiCount === 1)) {
      this._formGroup.get('id_api')?.setValue(this._apiSelected.id_api);
      this._formGroup.get('id_api')?.disable();
      this._updateControlAdesione();
    } else {
      this._apiSelected = null;
      this._formGroup.get('id_api')?.setValue(null);
      this._formGroup.get('id_adesione')?.setValue(null);
      this._formGroup.get('id_adesione')?.clearValidators();
      this._formGroup.get('id_adesione')?.updateValueAndValidity();
    }

    if (this.currentSearchType === SearchTypeEnum.Generic) {
      this._formGroup.get('id_transazione')?.setValue(null);
      this._formGroup.get('id_transazione')?.clearValidators();

      this._formGroup.get('id_api')?.setValidators([Validators.required]);
    } else {
      this._formGroup.get('data_da')?.setValue(null);
      this._formGroup.get('data_a')?.setValue(null);
      this._formGroup.get('q')?.setValue(null);
      this._formGroup.get('esito')?.setValue(null);
      this._formGroup.get('transaction_outcome_codes')?.setValue(null);
      this._formGroup.get('id_transazione')?.setValidators([Validators.required, uuid()]);
    }

    this._formGroup.get('id_api')?.updateValueAndValidity();
    this._formGroup.get('id_transazione')?.updateValueAndValidity();
    this._formGroup.markAllAsTouched();

    this._setErrorMessages(false);

    setTimeout(() => {
      this.searchBarForm._openSearch();
    }, 200);
  }

  _onSort(event: any) {
    console.log(event);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _showCollaudo() {
    this.environmentId = 'collaudo';
    this._loadTransazioni(this._filterData);
  }

  _showProduzione() {
    this.environmentId = 'produzione';
    this._loadTransazioni(this._filterData);
  }

  _isCollaudo() {
    return (this.environmentId === 'collaudo');
  }

  trackApiBySelectFn(item: any) {
    return item.id_api;
  }

  _initServizioApiSelect(defaultValue: any[] = []) {
    this.servizioApis$ = concat(
      of(defaultValue),
      this.servizioApisInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        distinctUntilChanged(),
        debounceTime(300),
        tap(() => this.servizioApisLoading = true),
        switchMap((term: any) => {
          return this.getData('api', term).pipe(
            catchError(() => of([])), // empty list on error
            map((resp: any) => {
              if (this._isFirst) { this._apiCount = resp.length; this._isFirst = false; }
              if (resp.length === 1) {
                // autoselect element
                this._apiSelected = resp[0];
                this._formGroup.get('id_api')?.setValue(this._apiSelected.id_api);
                this._formGroup.get('id_api')?.disable();
                this._updateControlAdesione();
              } else {
                this._formGroup.get('id_api')?.setValue(null);
              }
              this._formGroup.get('id_api')?.updateValueAndValidity();
              this._formGroup.markAllAsTouched();
              if (this._formGroup.valid) {
                this._onSubmit(this._formGroup.getRawValue());
              } else {
                if (this._filterData.id_api) {
                  this._apiSelected = resp.find((item: any) => item.id_api === this._filterData.id_api );
                  this._formGroup.get('id_api')?.setValue(this._apiSelected.id_api);
                  this._onSubmit(this._formGroup.getRawValue());
                } else {
                  this.searchBarForm._openSearch();
                }
              }
              return resp;
            }),
            tap(() => this.servizioApisLoading = false)
          )
        })
      )
    );
  }

  trackAdesioniBySelectFn(item: any) {
    return item.id_api;
  }

  _initAdesioniSelect(defaultValue: any[] = []) {
    this.adesioni$ = concat(
      of(defaultValue),
      this.adesioniInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        distinctUntilChanged(),
        debounceTime(300),
        tap(() => this.adesioniLoading = true),
        switchMap((term: any) => {
          const _ssa = this.authenticationService._getConfigModule('adesione').stati_scheda_adesione;
          const _stati = _ssa ? _ssa.join(',') : '';
          return this.getData('adesioni', term, { stato: _stati }).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.adesioniLoading = false)
          )
        })
      )
    );
  }

  getData(model: string, term: any = null, params: any = {}, sort: string = 'id', sort_direction: string = 'desc'): Observable<any> {
    // let _options: any = { params: { limit: 100, sort: sort, sort_direction: 'asc' } };
    let _options: any = { params: params };
    if (term) {
      if (typeof term === 'string' ) {
        _options.params =  { ..._options.params, q: term };
      }
      if (typeof term === 'object' ) {
        _options.params =  { ..._options.params, ...term };
      }
    }

    _options.params.id_servizio = this.id;

    return this.apiService.getList(model, _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          });
          return _items;
        }
      })
      );
  }

  onSelectedSearchDropdwon($event: Event){
    this.searchBarForm.setNotCloseForm(true)
    $event.stopPropagation();
  }

  onChangeApiSearchDropdwon(event: any){
    this._apiSelected = event;
    this._updateControlAdesione();
    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false)
    }, 200);
  }

  _updateControlAdesione() {
    if (this._apiSelected && this._apiSelected.ruolo === 'erogato_soggetto_aderente') {
      this._formGroup.get('id_adesione')?.setValidators(Validators.required);
    } else {
      this._formGroup.get('id_adesione')?.setValue(null);
      this._formGroup.get('id_adesione')?.clearValidators();
    }
    this._formGroup.get('id_adesione')?.updateValueAndValidity();
    this._formGroup.markAllAsTouched();
  }

  onChangeAdesioneSearchDropdwon(event: any){
    this._adesioneSelected = event;
    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false)
    }, 200);
  }

  _hasIdentificativoeServicePDND(api: any) {
    const ac: any = api.proprieta_custom || [];
    const _iespdnd: any = ac.find((item: any) => { return item.nome === 'identificativo_eservice_pdnd' }) || null;
    return (_iespdnd !== null);
  }

  _hasPDNDAuthType(api: any) {
    let _hasPDND: boolean = false;

    const _profili = this.authenticationService._getConfigModule('servizio')?.api?.profili || [];

    api.dati_erogazione.gruppi_auth_type.map((auth: any) => {
      const _profile = _profili.find((item: any) => item.codice_interno === auth.profilo);
      if (_profile.auth_type.includes('pdnd')) {
        _hasPDND = true;
      }
    });

    return _hasPDND;
  }

  _isSoggettoPDND() {
    const _soggettoServizio = this.service?.dominio?.soggetto_referente?.nome || '';
    const _soggettiPDND = this.authenticationService._getConfigModule('pdnd') || [];

    const _index = _soggettiPDND.findIndex((item: any) => item.nome_soggetto === _soggettoServizio);

    return (_index !== -1);
  }

  _getSoggettoId(verifica: string) {
    return (verifica === 'erogazioni') ? this.service?.dominio?.soggetto_referente?.nome : this.service?.dominio?.soggetto_interno?.nome;
  }

  _getSoggettoNome() {
    return this.service?.soggetto_interno?.nome || this.service?.dominio?.soggetto_referente?.nome;
  }

  _tipoVerifica(api: any) {
    if (api.ruolo === 'erogato_soggetto_dominio') {
      if (this.service?.soggetto_interno) {
        return 'fruizioni';
      } else {
        return 'erogazioni';
      }
    } else {
      return 'fruizioni';
    }
  }
}
