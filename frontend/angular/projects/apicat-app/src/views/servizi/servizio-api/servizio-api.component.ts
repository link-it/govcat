import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';
import { SearchBarFormComponent } from '@linkit/components';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Page } from '@app/models/page';
import { Grant } from '@app/model/grant';
import { EventType } from '@linkit/components';

@Component({
  selector: 'app-servizio-api',
  templateUrl: 'servizio-api.component.html',
  styleUrls: ['servizio-api.component.scss'],
  standalone: false
})
export class ServizioApiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioApiComponent';
  readonly model: string = 'api';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  id: number = 0;

  Tools = Tools;

  config: any;
  apiConfig: any;

  service: any = null;
  serviceApi: any[] = [];
  serviceApiDominio: any[] = [];
  serviceApiAderente: any[] = [];
  _paging: Page = new Page({});
  _pagingDominio: Page = new Page({});
  _pagingAderente: Page = new Page({});
  _links: any = {};
  _linksDominio: any = {};
  _linksAderente: any = {};

  _isSoggettoDominio: boolean = true;

  _grant: Grant | null = null;

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = false;
  _formGroup: FormGroup = new FormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;
  _loadedAll: number = 0;

  _useRoute : boolean = true;
  _useDialog : boolean = false;

  _message: string = 'APP.MESSAGE.NoApi';
  _messageHelp: string = 'APP.MESSAGE.NoApiHelp';

  _error: boolean = false;

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.SERVICES.TITLE.API', url: '', type: 'link' }
  ];

  _updateMapper: string = '';

  _componentBreadcrumbs: ComponentBreadcrumbsData|null = null;

  _profili: any = null;

  hideVersions: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    private eventsManagerService: EventsManagerService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public authenticationService: AuthenticationService,
    private utils: UtilService
  ) {
    this.route.data.subscribe((data) => {
      if (!data.componentBreadcrumbs) return;
      this._componentBreadcrumbs = data.componentBreadcrumbs;
      this._initBreadcrumb();
    });

    this.config = this.configService.getConfiguration();
    this.hideVersions = this.config?.AppConfig?.Services?.hideVersions || false;
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;
    this._grant = _state?.grant;
    const _srv: any = Tools.Configurazione?.servizio || null;
    this._profili = (_srv && _srv.api) ? _srv.api.profili : [];

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let _id = params['id'];
      const _cid = params['cid'];
      if (_cid) { _id = _cid; }
      if (_id) {
        this.id = _id;
        this.configService.getConfig('api').subscribe(
          (config: any) => {
            this.apiConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
            }
            this._loadedAll = 0;
            this._loadServiceApi(true);
            this._loadServiceApi(false);
          }
        );
      }
    });

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (event: any) => {
        const _srv: any = Tools.Configurazione?.servizio || null;
        this._profili = (_srv && _srv.api) ? _srv.api.profili : [];
    });
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _nome: string = this.service ? this.service.nome : null;
    const _versione: string = this.service ? this.service.versione : null;
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';

    let title = this.hideVersions ? _nome : ((_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New'));
    let baseUrl = `/servizi`;

    if (this._componentBreadcrumbs) {
      title = this.hideVersions ? _nome : ((_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...');
      baseUrl = `/servizi/${this._componentBreadcrumbs.service.id_servizio}/componenti`;
    }

    const _mainLabel = this._componentBreadcrumbs ? 'APP.TITLE.Components' : 'APP.TITLE.Services';
    const _mainTooltip = this._componentBreadcrumbs ? 'APP.TOOLTIP.ComponentsList' : '';
    const _mainIcon = this._componentBreadcrumbs ? '' : 'grid-3x3-gap';

    this.breadcrumbs = [
      { label: _mainLabel, url: `${baseUrl}`, type: 'link', iconBs: _mainIcon, tooltip: _mainTooltip },
      { label: `${title}`, url: `${baseUrl}/${this.id}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.SERVICES.TITLE.API', url: ``, type: 'link' }
    ];

    if(this._componentBreadcrumbs){
      this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
    }
  }

  _setErrorApi(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.NoApi';
      this._messageHelp = 'APP.MESSAGE.NoApiHelp';
    }
  }

  _initSearchForm() {
    this._formGroup = new FormGroup({
      id_api: new FormControl(''),
    });
  }

  _loadServizio() {
    if (this.id) {
      this.service = null;
      this.apiService.getDetails('servizi', this.id, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant ;
          this.apiService.getDetails('servizi', this.id).subscribe({
            next: (response: any) => {
              this.service = response;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
            },
            error: (error: any) => {
              Tools.OnError(error);
            }
          });
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadServiceApi(dominio: boolean, query: any = null, url: string = '') {
    this._setErrorApi(false);
    if (this.id) {
      if (!url) { this.serviceApi = []; }

      let aux: any;
      let _query: any = { ...query, id_servizio: this.id, sort: `id,asc` };
      _query.ruolo = dominio ? 'erogato_soggetto_dominio' : 'erogato_soggetto_aderente';
      if (_query) aux = { params: this.utils._queryToHttpParams(_query) };
  
      this._spin = true;
      this.apiService.getList(this.model, aux).subscribe({
        next: (response: any) => {
          if (dominio) {
            this._pagingDominio = new Page(response.page);
            this._paging = this._pagingDominio;
            this._linksDominio = response._links || null;
            this._links = this._linksDominio;
          } else {
            this._pagingAderente = new Page(response.page);
            this._paging = this._pagingAderente;
            this._linksAderente = response._links || null;
            this._links = this._linksAderente;
          }

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          
          if (response && response.content) {
            const profiloLabelI18n = this.translate.instant(`APP.LABEL.Profilo`);
            const defaultLabelI18n = this.translate.instant(`APP.LABEL.Multipli`);
    
            const _list: any = response.content.map((api: any) => {
              const tipProfiloValue = api?.gruppi_auth_type?.length === 1 ? api.gruppi_auth_type[0].profilo : defaultLabelI18n;
              const tipoProfilo = this._getProfiloLabelMapper(tipProfiloValue);

              const element = {
                id: api.id_api,
                editMode: false,
                source: { ...api, tipo_profilo: dominio ? `${profiloLabelI18n}: ${tipoProfilo}` : null }
              };
              return element;
            });

            if (dominio) {
              this.serviceApiDominio = (url) ? [...this.serviceApiDominio, ..._list] : [..._list];
              this.serviceApi = [ ...this.serviceApiDominio ];
              this._loadedAll = this._loadedAll + 1;
            } else {
              this.serviceApiAderente = (url) ? [...this.serviceApiAderente, ..._list] : [..._list];
              if ((this.serviceApiDominio.length === 0) && (this.serviceApiAderente.length > 0)) {
                this.serviceApi = [ ...this.serviceApiAderente ];
              }
              this._loadedAll = this._loadedAll + 1;
            }
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
          this._spin = (this._loadedAll < 2);
        },
        error: (error: any) => {
          this._setErrorApi(true);
          this._spin = false;
          // Tools.OnError(error);
        }
      });
    }
  }

  _getProfiloLabelMapper(cod: string) {
    const _profilo = this._profili.find((item: any) => item.codice_interno === cod);
    return _profilo ? _profilo.etichetta : cod;
}

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServiceApi(this._isSoggettoDominio, null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useRoute) {
      if (this._componentBreadcrumbs) {
        this.router.navigate(['servizi', this._componentBreadcrumbs.service.id_servizio, 'componenti', this.service.id_servizio, 'api', 'new']);
      } else {
        this.router.navigate([`/servizi/${this.id}/api`, 'new'], { relativeTo: this.route });
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
      if (this._componentBreadcrumbs) {
        this.router.navigate(['servizi', this._componentBreadcrumbs.service.id_servizio, 'componenti', this.service.id_servizio, 'api', param.id]);
      } else {
        this.router.navigate([`/servizi/${this.id}/api`, param.id]);
      }
    } else {
      this._isEdit = true;
      this._editCurrent = param;
    }
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadServiceApi(this._isSoggettoDominio, this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServiceApi(this._isSoggettoDominio, this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  _onSort(event: any) {
    console.log(event);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _onCloseEdit(event: any) {
    this._isEdit = false;
  }

  _showSoggettoDominio() {
    this._spin = true;
    this._isSoggettoDominio = true;
    this.serviceApi = [ ...this.serviceApiDominio ];
    this._paging = this._pagingDominio;
    this._links = this._linksDominio;
    this._spin = false;
  }
  
  _showSoggettoAderente() {
    this._spin = true;
    this._isSoggettoDominio = false;
    this.serviceApi = [ ...this.serviceApiAderente ];
    this._paging = this._pagingAderente;
    this._links = this._linksAderente;
    this._spin = false;
  }

  _canJoinMapper = (): boolean => {
    return this.authenticationService.canJoin('servizio', this.service?.stato);
  }

  _canAddMapper = (): boolean => {
    return this.authenticationService.canAdd('servizio', this.service?.stato, this._grant?.ruoli);
  }

  _canEditMapper = (): boolean => {
    return this.authenticationService.canEdit('servizio', 'servizio', this.service?.stato, this._grant?.ruoli);
  }

  onActionMonitor(event: any) {
    switch (event.action) {
      case 'backview':
        const url = `/servizi/${this.service.id_servizio}/view`;
        this.router.navigate([url]);
        break;
      default:
        break;
    }
  }
}
