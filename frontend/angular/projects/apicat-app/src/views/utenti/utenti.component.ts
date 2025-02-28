import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { SearchGoogleFormComponent } from 'projects/components/src/lib/ui/search-google-form/search-google-form.component';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import { Page} from '../../models/page';

@Component({
  selector: 'app-utenti',
  templateUrl: 'utenti.component.html',
  styleUrls: ['utenti.component.scss']
})
export class UtentiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'UtentiComponent';
  readonly model: string = 'utenti';

  @ViewChild('searchGoogleForm') searchGoogleForm!: SearchGoogleFormComponent;

  config: any;
  utentiConfig: any;

  utenti: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _isEdit: boolean = false;

  _hasFilter: boolean = true;
  _formGroup: FormGroup = new FormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';

  _error: boolean = false;

  showHistory: boolean = false;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'cognome';
  sortDirection: string = 'asc';
  sortFields: any[] = [
    { field: 'cognome', label: 'APP.LABEL.cognome', icon: '' }
  ];

  yesNoList: any = [
    { value: true, label: 'APP.BOOLEAN.Yes' },
    { value: false, label: 'APP.BOOLEAN.No' }
  ];
  _enabledEnum: any = {};
  _tempEnable = this.yesNoList.map((item: any) => {
    this._enabledEnum =  { ...this._enabledEnum, [item.value]: item.label};
    return item;
  });

  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    { field: 'email', label: 'APP.LABEL.email', type: 'string', condition: 'like' },
    { field: 'ruolo', label: 'APP.LABEL.Role', type: 'string', condition: 'like' },
    { field: 'stato', label: 'APP.LABEL.Status', type: 'string', condition: 'like' },
    { field: 'username', label: 'APP.LABEL.Username', type: 'string', condition: 'like' },
    { field: 'id_organizzazione', label: 'APP.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' } },
    { field: 'classe_utente', label: 'APP.LABEL.classi', type: 'array', condition: 'contain', params: { resource: 'classi-utente', field: 'nome' } },
    { field: 'referente_tecnico', label: 'APP.LABEL.ReferenteTecnico', type: 'enum', condition: 'equal', enumValues: this._enabledEnum }
  ];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Users', url: '', type: 'title', icon: '' }
  ];

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;

  _searchOrganizzazioneSelected: any = null;

  _statoArr: any[] = [];
  _ruoloArr: any[] = [];

  minLengthTerm = 1;

  _useNewSearchUI : boolean = false;

  classiUtente$!: Observable<any[]>;
  classiUtenteInput$ = new Subject<string>();
  classiUtenteLoading: boolean = false;

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
    this._statoArr = [ 'non_configurato', 'abilitato', 'disabilitato' ];
    this._ruoloArr = [ 'nessun_ruolo', 'referente_servizio', 'gestore' ];

    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.utentiConfig = config;
        this._initOrganizzazioniSelect([]);
        this._initClassiUtenteSelect([]);
        // this._loadUtenti(this._filterData);
        this.searchGoogleForm?._onSearch();
      }
    );
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
  }

  ngAfterViewInit() {
    if (!(this.searchGoogleForm && this.searchGoogleForm._isPinned())) {
      setTimeout(() => {
        this.refresh();
      }, 100);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  refresh() {
    this._loadUtenti(this._filterData);
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
    this._formGroup = new FormGroup({
      q: new FormControl(''),
      email: new FormControl(''),
      ruolo: new FormControl(''),
      stato: new FormControl(''),
      username: new FormControl(''),
      id_organizzazione: new FormControl(''),
      classe_utente: new FormControl(''),
      referente_tecnico: new FormControl('')
    });
  }

  _loadUtenti(query: any = null, url: string = '') {
    this._spin = true;
    let aux: any;
    this._setErrorMessages(false);
    
    if (!url) { 
      this.utenti = [];
      const sort: any = { sort: `${this.sortField},${this.sortDirection}` }
      query = { ...query, ...sort };
      aux = { params: this.utils._queryToHttpParams(query) };
    }

    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {

        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response.content) {
          const _list: any = response.content.map((org: any) => {
            
            const element = {
              id: org.id_utente,
              editMode: false,
              enableCollapse: false,
              source: { ...org }
            };
            return element;
          });

          this.utenti = (url) ? [...this.utenti, ..._list] : [..._list];
          this._preventMultiCall = false;

          this._spin = false;
        }
        Tools.ScrollTo(0);
        
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
        this._spin = false;
        Tools.OnError(error);
      }
    });
  }

  _trackBy(index: any, item: any) {
    return item.id;
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadUtenti(null, this._links.next.href);
    }
  }

  _onEdit(event: any, param: any) {
    if (this.searchGoogleForm) {
      this.searchGoogleForm._pinLastSearch();
    }
    this.router.navigate([this.model, param.id]);
  }

  _onNew() {
    this.router.navigate([this.model, 'new']);
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
    this._filterData = this.utils._removeEmpty(values);
    this._loadUtenti(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadUtenti(this._filterData);
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadUtenti(event);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _sortToHttpParams(sort: any) : HttpParams {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('sort', `${sort.sortField}` + ',' + `${sort.sortBy}`);
    return httpParams; 
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
          // return this.getOrganizzazioni(term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.organizzazioniLoading = false)
          )
        })
      )
    );
  }

  getOrganizzazioni(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
    return this.apiService.getList('organizzazioni', _options)
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

  _initClassiUtenteSelect(defaultValue: any[] = []) {
    this.classiUtente$ = concat(
      of(defaultValue),
      this.classiUtenteInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        distinctUntilChanged(),
        debounceTime(300),
        tap(() => this.classiUtenteLoading = true),
        switchMap((term: any) => {
          return this.getData('classi-utente', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.classiUtenteLoading = false)
          )
        })
      )
    );
  }

  getData(model: string, term: any = null, sort: string = 'id', sort_direction: string = 'desc'): Observable<any> {
    // let _options: any = { params: { limit: 100, sort: sort, sort_direction: 'asc' } };
    let _options: any = { params: { } };
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
          });
          return _items;
        }
      })
      );
  }

  onChangeSearchDropdwon(event: any){
    this._searchOrganizzazioneSelected = event;
    setTimeout(() => {
      this.searchGoogleForm.setNotCloseForm(false)
    }, 200);
  }

  onSelectedSearchDropdwon($event: Event){
    this.searchGoogleForm.setNotCloseForm(true)
    $event.stopPropagation();
  }

  trackBySelectFn(item: any) {
    return item.id_client || item.id_servizio;
  }
}
