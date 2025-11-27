import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import { SearchBarFormComponent } from '@linkit/components';

import { EventType } from '@linkit/components';
import { NavigationService } from '@app/services/navigation.service';
import { Page} from '../../models/page';

import { Servizio } from '../servizi/servizio-details/servizio';
import { ServiceBreadcrumbsData } from '../servizi/route-resolver/service-breadcrumbs.resolver';

export enum StatoConfigurazione {
  FALLITA = 'fallita',
  IN_CODA = 'in_coda',
  KO = 'ko',
  OK = 'ok',
  RETRY = 'retry'
}

@Component({
  selector: 'app-adesioni',
  templateUrl: 'adesioni.component.html',
  styleUrls: ['adesioni.component.scss'],
  standalone: false
})
export class AdesioniComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'AdesioniComponent';
  readonly model: string = 'adesioni';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('reportTemplate') reportTemplate!: any;

  Tools = Tools;

  config: any;
  adesioniConfig: any;

  adesioni: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any = {};

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;

  showHistory: boolean = false;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  service: Servizio|null = null;

  configStatusList: any = [
    { value: StatoConfigurazione.FALLITA, label: 'APP.STATUS.fallita' },
    { value: StatoConfigurazione.IN_CODA, label: 'APP.STATUS.in_coda' },
    { value: StatoConfigurazione.KO, label: 'APP.STATUS.ko' },
    { value: StatoConfigurazione.OK, label: 'APP.STATUS.ok' },
    { value: StatoConfigurazione.RETRY, label: 'APP.STATUS.retry' }
  ];
  configStatusEnum: any = {};
  _tempEnable = this.configStatusList.map((item: any) => {
    this.configStatusEnum =  { ...this.configStatusEnum, [item.value]: item.label};
    return item;
  });

  searchFields: any[] = [
    { field: 'q', label: 'APP.ADESIONI.LABEL.Name', type: 'string', condition: 'like' },
    { field: 'stato', label: 'APP.LABEL.Status', type: 'enum', condition: 'equal', enumValues: Tools.StatiAdesioneEnum },
    { field: 'id_dominio', label: 'APP.LABEL.id_dominio', type: 'text', condition: 'equal', params: { resource: 'domini', field: 'nome' } },
    { field: 'id_servizio', label: 'APP.ADESIONI.LABEL.Service', type: 'text', condition: 'equal', params: { resource: 'servizi', field: '{nome} v.{versione}' }  },
    { field: 'id_organizzazione', label: 'APP.ADESIONI.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' }  },
    { field: 'id_soggetto', label: 'APP.ADESIONI.LABEL.Subject', type: 'text', condition: 'equal', params: { resource: 'soggetti', field: 'nome' } },
    { field: 'id_client', label: 'APP.ADESIONI.LABEL.Client', type: 'text', condition: 'equal', params: { resource: 'client', field: 'nome' }  },
    { field: 'stato_configurazione_automatica', label: 'APP.ADESIONI.LABEL.AutomaticConfigurationStatus', type: 'enum', condition: 'equal', enumValues: this.configStatusEnum },
  ];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' }
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
  selectedDominio: any;

  generalConfig: any = Tools.Configurazione || null;
  _workflowStati: any[] = Tools.Configurazione?.adesione.workflow.stati || [];
  _adesioni_multiple: any[] = Tools.Configurazione?.servizio.adesioni_multiple || [];

  minLengthTerm = 1;

  _useNewSearchUI : boolean = false;

  _param_id_servizio: any = null;
  _param_isWeb: boolean = false;

  _useViewRoute: boolean = false;
  _useEditWizard: boolean = false;

  hasMultiSelection: boolean = false;
  elementsSelected: any[] = [];
  bilkExecutionInProgress: boolean = false;
  uncheckAllInTheMenu: boolean = true;

  bulkResponse: any = null

  modalReportRef!: BsModalRef;
  
  _updateMapper: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    private tools: Tools,
    private eventsManagerService: EventsManagerService,
    private apiService: OpenAPIService,
    private utils: UtilService,
    private authenticationService: AuthenticationService,
    private modalService: BsModalService,
    private navigationService: NavigationService
  ) {

    this.route.data.subscribe((data) => {
      const serviceBreadcrumbs: ServiceBreadcrumbsData = data.serviceBreadcrumbs;
      if (!serviceBreadcrumbs) return;
      this.service = serviceBreadcrumbs.service;
      this.breadcrumbs.unshift(...serviceBreadcrumbs.breadcrumbs);
    });

    this.config = this.configService.getConfiguration();
    this._useNewSearchUI = true; // this.config.AppConfig.Search.newLayout || false;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.queryParams.subscribe((val) => { 
      if(val.id_servizio) {
        this._param_id_servizio = val.id_servizio;
        this._param_isWeb = val.web || false;
      }
    });

    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.adesioniConfig = config;
        this._useViewRoute = this.adesioniConfig.useViewRoute || false;
        this._useEditWizard = this.adesioniConfig.useEditWizard || false;
        this._initDominiSelect([]);
        this._initServiziSelect([]);
        this._initOrganizzazioniSelect([]);
        this._initClientsSelect([]);
      }
    );

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
      this.generalConfig = Tools.Configurazione || null;
      this._workflowStati = Tools.Configurazione?.adesione.workflow.stati || [];
      this._adesioni_multiple = Tools.Configurazione?.servizio.adesioni_multiple || [];
      this._updateMapper = new Date().getTime().toString();
      this.updateMultiSelectionMapper();
    });
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
      setTimeout(() => {
        if (!this._param_id_servizio) {
          this.refresh();
        }
      }, 100);
    }
    if (this.searchBarForm && this._param_id_servizio) {
      const _values = {
        id_servizio: this._param_id_servizio
      };
      this.searchBarForm._setSearch(_values);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  get isGestore(): boolean {
    return this.authenticationService.isGestore();
  }

  refresh() {
    // this.searchBarForm._clearSearch(null);
    this._filterData = {};
    this._loadAdesioni();
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

  _loadAdesioni(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    if (!url) { this.adesioni = []; }
    
    let aux = {
      params: new HttpParams()
    };


    if (query)  aux = { params: this.utils._queryToHttpParams(query) };

    if (this.service && this.service.id_servizio){
      aux.params = aux.params.set('id_servizio', this.service.id_servizio.toString() || '');
    }
    
    this._spin = true;
    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {

        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response && response.content) {
          const _list: any = response.content.map((adesione: any) => {
            const _adesione = { ...adesione, id_logico: this._adesioni_multiple ? adesione.id_logico : null };
            const element = {
              id: adesione.id_adesione,
              editMode: false,
              source: _adesione,
              selected: false
            };
            return element;
          });
          this.adesioni = (url) ? [...this.adesioni, ..._list] : [..._list];
          this._preventMultiCall = false;
          this._spin = false;
        }
        Tools.ScrollTo(0);
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
        this._spin = false;
        // Tools.OnError(error);
      }
    });
  }

  _trackBy(index: any, item: any) {
    return item.id;
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
            catchError(() => of([])), // empty list on error
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
            catchError(() => of([])), // empty list on error
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
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.soggettiLoading = true),
        switchMap((term: any) => {
          return this.getData('soggetti', term, { id_organizzazione: this._organizzazioneSelected?.id_organizzazione || '' }).pipe(
            catchError(() => of([])), // empty list on error
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
            catchError(() => of([])), // empty list on error
            tap(() => this.clientsLoading = false)
          )
        })
      )
    );
  }

  _organizzazioneSelected: any = null;

  _initDominiSelect(defaultValue: any[] = []) {
    this.domini$ = concat(
      of(defaultValue),
      this.dominiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        // startWith(''),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.dominiLoading = true),
        switchMap((term: any) => {
          return this.getData('domini', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.dominiLoading = false)
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

  showSoggetto: boolean = false;

  onChangeOrganizzazioneDropdwon(event: any){
    this._organizzazioneSelected = event;
    this._formGroup.get('id_soggetto')?.setValue(null);

    this.showSoggetto = this._organizzazioneSelected?.multi_soggetto || false;
    if (this.showSoggetto) {
      this._initSoggettiSelect([]);
    }

    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false)
    }, 200);
  }

  onChangeSearchDropdwon(event: any){
    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false)
    }, 200);
  }

  trackBySelectFn(item: any) {
    return item.id_client || item.id_servizio;
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
        this._preventMultiCall = true;
        this._loadAdesioni(null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useRoute) {
      if (this._useEditWizard) {
        this.router.navigate(['new', 'edit'], {relativeTo: this.route});
      } else {
        this.router.navigate(['new'], {relativeTo: this.route});
      }
    } else {
      this._isEdit = true;
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useRoute) {
      if (this.searchBarForm) {
        this.searchBarForm._pinLastSearch();
      }

      // Supporto per apertura in nuova scheda (Ctrl+Click, Cmd+Click, middle-click)
      const mouseEvent = this.navigationService.extractEvent(event);
      const data = this.navigationService.extractData(param) || param;
      const source = data.source || data;

      if (this._useEditWizard) {
        const params = (source.stato.includes('pubblicato_produzione')) ? [source.id_adesione, 'view'] : [source.id_adesione];
        if (this.navigationService.shouldOpenInNewTab(mouseEvent)) {
          mouseEvent?.preventDefault();
          mouseEvent?.stopPropagation();
          const baseUrl = this.router.url.split('?')[0];
          this.navigationService.openInNewTab([baseUrl, ...params]);
        } else {
          this.router.navigate(params, { relativeTo: this.route });
        }
      } else {
        if (this._useViewRoute) {
          const params = [source.id_adesione, 'view'];
          if (this.navigationService.shouldOpenInNewTab(mouseEvent)) {
            mouseEvent?.preventDefault();
            mouseEvent?.stopPropagation();
            const baseUrl = this.router.url.split('?')[0];
            this.navigationService.openInNewTab([baseUrl, ...params]);
          } else {
            this.router.navigate(params, { relativeTo: this.route });
          }
        } else {
          const params = [source.id_adesione];
          if (this.navigationService.shouldOpenInNewTab(mouseEvent)) {
            mouseEvent?.preventDefault();
            mouseEvent?.stopPropagation();
            const baseUrl = this.router.url.split('?')[0];
            this.navigationService.openInNewTab([baseUrl, ...params]);
          } else {
            this.router.navigate(params, { relativeTo: this.route });
          }
        }
      }
    } else {
      this._isEdit = true;
      this._editCurrent = param;
    }
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
    this.resetSeleted();
    this.updateMultiSelectionMapper();
    this._updateMapper = new Date().getTime().toString();
    this._loadAdesioni(this._filterData);
  }

  _resetForm() {
    this._filterData = [];

    this._organizzazioneSelected = null;
    this._formGroup.get('stato')?.setValue(null);
    this._formGroup.get('id_adesione')?.setValue(null);
    this._formGroup.get('id_api')?.setValue(null);
    this._formGroup.get('id_organizzazione')?.setValue(null);
    this._formGroup.get('id_soggetto')?.setValue(null);
    this._formGroup.get('id_client')?.setValue(null);
    this._formGroup.markAllAsTouched();

    this._setErrorMessages(false);

    this._loadAdesioni(this._filterData);
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

  hasConfigurazioneAutomaticaMapper = () => {
    const configAutomatica = this.generalConfig?.adesione?.configurazione_automatica || null;
    return configAutomatica && (configAutomatica?.length > 0);
  }

  getStatoAutomatico() {
    const configAutomatica = this.generalConfig?.adesione?.configurazione_automatica || null;
    if (configAutomatica?.length > 0) {
      const status = this._formGroup.get('stato')?.value;
      return  configAutomatica.find((item: any) => item.stato_iniziale === status);
    }
    return null;
  }

  getLabelStatoAutomaticoMapper = () => {
    const stato = this.getStatoAutomatico();
    return stato ? this.translate.instant('APP.WORKFLOW.STATUS.' + stato.stato_in_configurazione) : '<NO STATUS>';
  }

  updateMultiSelectionMapper() {
    const configAutomatica = this.generalConfig?.adesione?.configurazione_automatica || null;
    if (configAutomatica?.length > 0) {
      const status = this._formGroup.get('stato')?.value;
      const index = configAutomatica.findIndex((item: any) => item.stato_iniziale === status);
      this.hasMultiSelection = this.isGestore && index !== -1;
    } else {
      this.hasMultiSelection = false;
    }
  }

  resetSeleted() {
    this.elementsSelected = [];
    this._updateMapper = new Date().getTime().toString();
  }

  deselectAll() {
    this.elementsSelected = [];
    const _elements = this.adesioni.map((element: any) => {
        return { ...element, selected: false };
    });
    this.adesioni = [ ..._elements ];
    this._updateMapper = new Date().getTime().toString();
  }

  onSelect(event: any, element: any) {
    event.stopPropagation();
    const _index = this.elementsSelected.findIndex((item: any) => item === element.id);
    if (_index === -1) {
      element.selected = true;
      this.elementsSelected.push(element.id);
    } else {
      element.selected = false;
      this.elementsSelected.splice(_index, 1);
    }
  }

  onSelectionAction(action: any) {
    switch (action.action) {
      case 'search':
        this.onConfirmBulkAction('search')
        break;
      case 'selection':
        this.onConfirmBulkAction('selection')
        break;
      case 'uncheckAll':
        this.deselectAll();
        break;
      default:
        break;
    }
  }

  resetReport() {
    this.bulkResponse = null;
  }

  onConfirmBulkAction(type: string) {
    const stato = this.getStatoAutomatico();
    if (stato) {
      const toStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + stato.stato_in_configurazione);
      const fromStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + stato.stato_iniziale);
      this.resetReport();
      const data = {
        title: 'APP.MESSAGE.ConfirmBulkAction',
        message: 'APP.MESSAGE.ConfirmBulkActionMessage',
        confirm: 'APP.BUTTON.Confirm',
        cancel: 'APP.BUTTON.Cancel',
        type: type,
        stato: stato.stato_in_configurazione
      };
      const count = (type === 'search') ? this._paging.totalElements : this.elementsSelected.length;
      const message = this.translate.instant('APP.WORKFLOW.MESSAGE.AreYouSureBulk', { next: toStatus, count: count });
      this.utils._confirmDialog(message, data, this.onBulkAction.bind(this));
    } else {
      Tools.showMessage(this.translate.instant('APP.MESSAGE.ERROR.NoAutomaticStatus'), 'danger', true);
    }
  }

  onBulkAction(data: any) {
    let aux: any;
    let query = null;

    if (data.type === 'search') {
        query = { ...this._filterData };
    } else {
        query = { id: [...this.elementsSelected ] };
    }

    if (query)  aux = { params: this.utils._queryToHttpParams(query) };

    const body = {
      stato: data.stato
    };

    this.bilkExecutionInProgress = true;
    this.apiService.postElement(`${this.model}/stato`, body, aux).subscribe({
      next: (response: any) => {
        this.bilkExecutionInProgress = false;
        this.bulkResponse = response;
        this.showReportDialog();
        this._onSearch(this._filterData);
      },
      error: (error: any) => {
        this.bilkExecutionInProgress = false;
        this._setErrorMessages(true);
        Tools.OnError(error);
      }
    });
  }

  showReportDialog() {
    this.modalReportRef = this.modalService.show(this.reportTemplate, {
        ignoreBackdropClick: false,
        class: 'modal-half'
    });
  }

  closeErrorModal(){
    this.modalReportRef.hide();
  }
}
