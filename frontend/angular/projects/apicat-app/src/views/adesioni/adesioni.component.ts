import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import { SearchGoogleFormComponent } from 'projects/components/src/lib/ui/search-google-form/search-google-form.component';

import { EventType } from 'projects/tools/src/lib/classes/events';
import { Page} from '../../models/page';

import { Servizio } from '../servizi/servizio-details/servizio';
import { ServiceBreadcrumbsData } from '../servizi/route-resolver/service-breadcrumbs.resolver';

@Component({
  selector: 'app-adesioni',
  templateUrl: 'adesioni.component.html',
  styleUrls: ['adesioni.component.scss']
})
export class AdesioniComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'AdesioniComponent';
  readonly model: string = 'adesioni';

  @ViewChild('searchGoogleForm') searchGoogleForm!: SearchGoogleFormComponent;

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

  searchFields: any[] = [
    { field: 'q', label: 'APP.ADESIONI.LABEL.Name', type: 'string', condition: 'like' },
    { field: 'stato', label: 'APP.LABEL.Status', type: 'enum', condition: 'equal', enumValues: Tools.StatiAdesioneEnum },
    { field: 'id_dominio', label: 'APP.LABEL.id_dominio', type: 'text', condition: 'equal', params: { resource: 'domini', field: 'nome' } },
    { field: 'id_servizio', label: 'APP.ADESIONI.LABEL.Service', type: 'text', condition: 'equal', params: { resource: 'servizi', field: '{nome} v.{versione}' }  },
    { field: 'id_organizzazione', label: 'APP.ADESIONI.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' }  },
    { field: 'id_soggetto', label: 'APP.ADESIONI.LABEL.Subject', type: 'text', condition: 'equal', params: { resource: 'soggetti', field: 'nome' } },
    { field: 'id_client', label: 'APP.ADESIONI.LABEL.Client', type: 'text', condition: 'equal', params: { resource: 'client', field: 'nome' }  },
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    private utils: UtilService
  ) {

    this.route.data.subscribe((data) => {
      const serviceBreadcrumbs: ServiceBreadcrumbsData = data.serviceBreadcrumbs;
      if(!serviceBreadcrumbs)return;
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
    });
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchGoogleForm && this.searchGoogleForm._isPinned())) {
      setTimeout(() => {
        if (!this._param_id_servizio) {
          this.refresh();
        }
      }, 100);
    }
    if (this.searchGoogleForm && this._param_id_servizio) {
      const _values = {
        id_servizio: this._param_id_servizio
      };
      this.searchGoogleForm._setSearch(_values);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  refresh() {
    // this.searchGoogleForm._clearSearch(null);
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
      stato: new UntypedFormControl(null),
      id_dominio: new UntypedFormControl(null),
      id_servizio: new UntypedFormControl(null),
      id_organizzazione: new UntypedFormControl(null),
      id_soggetto: new UntypedFormControl(null),
      id_client: new UntypedFormControl(null),
    });
  }

  _loadAdesioni(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    if (!url) { this.adesioni = []; }
    
    let aux = {
      params: new HttpParams()
    };


    if (query)  aux = { params: this.utils._queryToHttpParams(query) };

    if(this.service && this.service.id_servizio){
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
              id: adesione.id,
              editMode: false,
              source: _adesione
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
    this.searchGoogleForm.setNotCloseForm(true)
    $event.stopPropagation();
  }

  showSoggetto: boolean = false;

  onChangeOrganizzazioneDropdwon(event: any){
    this._organizzazioneSelected = event;
    this._formGroup.get('id_soggetto')?.setValue(null);

    this.showSoggetto = this._organizzazioneSelected.multi_soggetto;
    if (this.showSoggetto) {
      this._initSoggettiSelect([]);
    }

    setTimeout(() => {
      this.searchGoogleForm.setNotCloseForm(false)
    }, 200);
  }

  onChangeSearchDropdwon(event: any){
    setTimeout(() => {
      this.searchGoogleForm.setNotCloseForm(false)
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
      if (this.searchGoogleForm) {
        this.searchGoogleForm._pinLastSearch();
      }
      
      if (this._useEditWizard) {
        const params = (param.source.stato.includes('pubblicato_produzione')) ? [param.source.id_adesione, 'view'] : [param.source.id_adesione];
        this.router.navigate(params, { relativeTo: this.route });
      } else {
        if (this._useViewRoute) {
            this.router.navigate([param.source.id_adesione, 'view'], { relativeTo: this.route });
        } else {
          this.router.navigate([param.source.id_adesione], { relativeTo: this.route });
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
    if (this.searchGoogleForm) {
      this.searchGoogleForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
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
}
