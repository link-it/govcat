import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components'
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { SearchGoogleFormComponent } from '@linkit/components';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import { EventType } from '@linkit/components';
import { Page} from '../../models/page';

import * as moment from 'moment';

const fake_ambiente = [ 'collaudo', 'produzione'];

@Component({
  selector: 'app-clients',
  templateUrl: 'clients.component.html',
  styleUrls: ['clients.component.scss'],
  standalone: false

})
export class ClientsComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ClientsComponent';
  readonly model: string = 'client'; 

  @ViewChild('searchGoogleForm') searchGoogleForm!: SearchGoogleFormComponent;

  Tools = Tools;

  config: any;
  clientsConfig: any;

  clients: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

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

  sortField: string = 'nome';
  sortDirection: string = 'asc';
  sortFields: any[] = [
    { field: 'nome', label: 'APP.LABEL.nome', icon: '' }
  ];

  _statiClient: any[] = [];

  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    { field: 'stato', label: 'APP.LABEL.Status', type: 'enum', condition: 'equal', enumValues: Tools.StatiClientEnum },
    { field: 'auth_type', label: 'APP.CLIENT.LABEL.Auth_type', type: 'string', condition: 'like' },
    { field: 'ambiente', label: 'APP.CLIENT.LABEL.Ambient', type: 'string', condition: 'equal' },
    { field: 'id_soggetto', label: 'APP.CLIENT.LABEL.Subject', type: 'text', condition: 'equal', params: { resource: 'soggetti', field: 'nome' } },
    { field: 'id_organizzazione', label: 'APP.ADESIONI.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' } }
  ];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Client', url: '', type: 'title', icon: '' }
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

  _authTypeEnum: any[] = [];
  _ambienteEnum: any[] = [];

  _useNewSearchUI : boolean = false;

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
    this.config = this.configService.getConfiguration();
    this._useNewSearchUI = true; // this.config.AppConfig.Search.newLayout || false;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    if (Tools.StatiClient) { this._statiClient = [...Tools.StatiClient]; } 
    if (Tools.Configurazione) { Tools.Configurazione.servizio.api.auth_type.map((item: any) => this._authTypeEnum.push(item.type)); }
    this._ambienteEnum = fake_ambiente;

    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.clientsConfig = config;
      }
    );

    this._initSoggettiSelect([]);
    this._initOrganizzazioniSelect([]);

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
      this._statiClient = [...Tools.StatiClient]; 
      Tools.Configurazione.servizio.api.auth_type.map((item: any) => this._authTypeEnum.push(item.type));
      console.log('Configurazione Remota', Tools.Configurazione);
    });
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchGoogleForm && this.searchGoogleForm._isPinned())) {
      setTimeout(() => {
        this._loadClients();
      }, 100);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
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
      auth_type: new UntypedFormControl(''),
      ambiente: new UntypedFormControl(''),
      id_soggetto: new UntypedFormControl(''),
      id_organizzazione: new UntypedFormControl(''),
    });
  }

  _loadClients(query: any = null, url: string = '') {
    let aux: any;
    this._setErrorMessages(false);

    if (!url) { 
      this.clients = [];
      const sort: any = { sort: `${this.sortField},${this.sortDirection}` }
      query = { ...query, ...sort };
      aux = { params: this.utils._queryToHttpParams(query) };
    }

    this._spin = true;
    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {

        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response.content) {
          const _list: any = response.content.map((client: any) => {
            
            const element = {
              id: client.id_client,
              editMode: false,
              source: { ...client },
              idSoggetto: client.soggetto.id_soggetto,
              nomeSoggetto: client.soggetto.nome,
              nome: client.nome,
              stato: client.stato,
            };
            return element;
          });
          this.clients = (url) ? [...this.clients, ..._list] : [..._list];
          this._preventMultiCall = false;
        }
        Tools.ScrollTo(0);

        this._spin = false;
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

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadClients(null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useRoute) {
      this.router.navigate([this.model, 'new']);
    } else {
      this._isEdit = true;
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useRoute) {
      if (this.searchGoogleForm) {
        this.searchGoogleForm._pinLastSearch();
      }
      
      this.router.navigate([this.model, param.source.id_client]);
    } else {
      this._isEdit = true;
      this._editCurrent = param;
    }
  }

  _onCloseEdit() {
    this._isEdit = false;
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  _onSubmit(form: any) {
    if (this.searchGoogleForm) {
      this.searchGoogleForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadClients(this._filterData);
  }

  _initSoggettiSelect(defaultValue: any[] = []) {
    this.soggetti$ = concat(
      of(defaultValue),
      this.soggettiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.soggettiLoading = true),
        switchMap((term: any) => {
          return this.getSoggetti(term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.soggettiLoading = false)
          )
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
          const _items = resp.content.map((item: any) => {
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          });
          return _items;
        }
      })
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
          return this.getOrganizzazioni(term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.organizzazioniLoading = false)
          )
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
          const _items = resp.content.map((item: any) => {
            return item;
          });
          return _items;
        }
      })
      );
  }

  onChangeSearchDropdwon(event: any, param: string) {
    if (param == 'soggetto') { this._searchSoggettoSelected = event }
    if (param == 'organizzazione') { this._searchOrganizzazioneSelected = event; }
    
    setTimeout(() => {
      this.searchGoogleForm.setNotCloseForm(false)
    }, 200);
  }

  onSelectedSearchDropdwon($event: any) {
    this.searchGoogleForm.setNotCloseForm(true)
    $event.stopPropagation();
  }

  _resetForm() {
    this._filterData = [];
    this._loadClients(this._filterData);
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadClients(this._filterData);
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

  trackByFn(item: any) {
    return item.id;
  }

  trackBySelectFn(item: any) {
    return item.id_soggetto || item.id_organizzazione;
  }
}
