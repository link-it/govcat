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
import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { SearchBarFormComponent } from '@linkit/components'
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Page } from '@app/models/page';
import { Grant } from '@app/model/grant';

import { Observable, Subject } from 'rxjs';

import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-servizio-api-subscribers',
  templateUrl: 'servizio-api-subscribers.component.html',
  styleUrls: ['servizio-api-subscribers.component.scss'],
  standalone: false
})
export class ServizioApiSubscribersComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioApiSubscribersComponent';
  readonly model: string = 'api';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: number = 0;
  sid: string | null = null;

  environmentId: string = ''; // collaudo / produzione

  eserviceId: string = '';
  producerId: string = '';
  producerIdCollaudo: string = '';
  producerIdProduzione: string = '';

  _hasTabCollaudo: boolean = false;
  _hasTabProduzione: boolean = false;

  Tools = Tools;

  config: any;
  apisubscribersConfig: any;

  service: any = null;
  servizioApi: any = null;
  servizioapisubscribers: any[] = [];
  _page: Page = new Page({});
  _links: any = {};
  _allElements: number = 0;

  _grant: Grant | null = null;

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute : boolean = false;
  _useDialog : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;

  _errorSave: boolean = false;
  _errorSaveMsg: string = 'false';

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
    { label: 'APP.SERVICES.TITLE.API', url: '', type: 'link' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.TITLE.PDNDSubscribers', url: '', type: 'link' }
  ];

  _modalEditRef!: BsModalRef;
  _modalConfirmRef!: BsModalRef;

  _editFormGroup: FormGroup = new FormGroup({});

  minLengthTerm: number = 1;
  apisubscribers$!: Observable<any[]>;
  apisubscribersInput$ = new Subject<string>();
  apisubscribersLoading: boolean = false;
  apisubscribersFilter: string = '';

  anagrafiche: any = {};

  _updateMapper: string = '';

  _componentBreadcrumbs: ComponentBreadcrumbsData | null = null;

  hideVersions: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    public utils: UtilService,
    public authenticationService: AuthenticationService
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
        this.sid = _id;
        this.id = params['aid'];
        this.environmentId = params['id_ambiente'] || '';
        this.configService.getConfig('subscribers').subscribe(
          (config: any) => {
            this.apisubscribersConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._autoSelectTab();
            }
          }
        );
      }
    });

    this.route.queryParams.subscribe(params => {
      this.producerIdCollaudo = params.producerIdCollaudo || '';
      this.producerIdProduzione = params.producerIdProduzione || '';
      this._loadServizioApiSubscribers();
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
    const _api = this.servizioApi;
    const _titleAPI = _api ? `${_api.nome} v. ${_api.versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');

    let title = (_nome && _versione) ? (this.hideVersions ? `${_nome}` : `${_nome} v. ${_versione}`) : this.id ? `${this.id}` : '...';
    let baseUrl = `/servizi`;

    if (this._componentBreadcrumbs) {
      title = (_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...';
      baseUrl = `/servizi/${this._componentBreadcrumbs.service.id_servizio}/componenti`;
    }

    const _mainLabel = this._componentBreadcrumbs ? 'APP.TITLE.Components' : 'APP.TITLE.Services';
    const _mainTooltip = this._componentBreadcrumbs ? 'APP.TOOLTIP.ComponentsList' : '';
    const _mainIcon = this._componentBreadcrumbs ? '' : 'grid-3x3-gap';

    this.breadcrumbs = [
      { label: _mainLabel, url: `${baseUrl}/`, type: 'link', iconBs: _mainIcon, tooltip: _mainTooltip },
      { label: `${title}`, url: `${baseUrl}/${this.sid}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.SERVICES.TITLE.API', url: `${baseUrl}/${this.sid}/api`, type: 'link', tooltip: 'APP.TOOLTIP.ApiList' },
      { label: `${_titleAPI}`, url: `${baseUrl}/${this.sid}/api/${this.id}`, type: 'link', tooltip: '' },
      { label: 'APP.TITLE.PDNDSubscribers', url: ``, type: 'link' }
    ];

    if(this._componentBreadcrumbs){
      this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
    }
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      if (this.environmentId) {
        this._message = 'APP.MESSAGE.NoResults';
        this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
      } else {
        this._message = 'APP.MESSAGE.ChooseEnvironment';
        this._messageHelp = 'APP.MESSAGE.ChooseEnvironmentHelp';
      }
    }
  }

  _initSearchForm() {
    this._formGroup = new UntypedFormGroup({
      "organization.taxCode": new UntypedFormControl(''),
      creationDateFrom: new UntypedFormControl(''),
      creationDateTo: new UntypedFormControl('')
    });
  }

  _loadServizio() {
    if (this.sid) {
      this.service = null;
      this._spin = true;
      this.apiService.getDetails('servizi', this.sid, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;
          this.apiService.getDetails('servizi', this.sid).subscribe({
            next: (response: any) => {
              this.service = response;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._spin = false;
              this._loadServizioApi();
            },
            error: (error: any) => {
              Tools.OnError(error);
              this._spin = false;
            }
          });
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadServizioApi() {
    if (this.id) {
      this.servizioApi = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.servizioApi = response;
          this._initBreadcrumb();
          this._autoSelectTab();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _getEService(environment: string) {
    let _environment: string = (environment === 'collaudo') ? 'PDNDCollaudo' : 'PDNDProduzione';
    let _eservice: string = '';
    let _index: number = -1;
    if (this.servizioApi?.proprieta_custom?.length) {
      _index = this.servizioApi.proprieta_custom?.findIndex((item: any) => item.gruppo === _environment);
      if (_index !== -1) {
        const _property = this.servizioApi.proprieta_custom[_index].proprieta.find((item: any) => item.nome === 'identificativo_eservice_pdnd');
        _eservice = _property.valore;
      }
    }
    return _eservice;
  }

  _hasPDNDConfiguredMapper = (environment: string): boolean => {
    return !!this._getEService(environment);
  }

  _loadServizioApiSubscribers(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (!this.eserviceId || !this.producerId) { return; }
    if (this.id) {
      this._spin = true;
      if (!url) { this.servizioapisubscribers = []; }  
      let aux: any;
      if (!url) {
        query = { ...query, eserviceId: this.eserviceId, producerId: this.producerId };
        if (query) aux = { params: this.utils._queryToHttpParams(query) };
      }
      this.apiService.getListPDND(`${this.environmentId}/subscribers`, aux, url).subscribe({
        next: (response: any) => {

          response ? this._page = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          this._allElements = this._page.totalElements || 0;
  
          if (response && response.subscribers) {
            const _list: any = response.subscribers.map((subscriber: any) => {
              const _origin_external = `${subscriber.externalId.origin} ${subscriber.externalId.id}`; 
              const element = {
                id: subscriber.consumerId,
                editMode: false,
                enableCollapse: true,
                source: { ...subscriber, origin_external: _origin_external }
              };
              return element;
            });
            this.servizioapisubscribers = (url) ? [...this.servizioapisubscribers, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
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
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioApiSubscribers(null, this._links.next.href);
    }
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadServizioApiSubscribers(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioApiSubscribers(this._filterData);
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

  _showCollaudo() {
    this.environmentId = 'collaudo';
    this.eserviceId = this._getEService(this.environmentId);
    this.producerId = (this.environmentId === 'collaudo') ? this.producerIdCollaudo : this.producerIdProduzione;
    this._loadServizioApiSubscribers(this._filterData);
  }

  _showProduzione() {
    this.environmentId = 'produzione';
    this.eserviceId = this._getEService(this.environmentId);
    this.producerId = (this.environmentId === 'collaudo') ? this.producerIdCollaudo : this.producerIdProduzione;
    this._loadServizioApiSubscribers(this._filterData);
  }

  _isCollaudo() {
    return (this.environmentId === 'collaudo');
  }

  _isProduzione() {
    return (this.environmentId === 'produzione');
  }

  _autoSelectTab() {
    this._hasTabCollaudo = this._hasPDNDConfiguredMapper('collaudo');
    this._hasTabProduzione = this._hasPDNDConfiguredMapper('produzione');
    if (!(this._hasTabCollaudo && this._hasTabProduzione)) {
      this._hasTabCollaudo ? this._showCollaudo() : this._showProduzione();
    }
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
