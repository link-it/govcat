import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormGroup, FormControl } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgxMasonryOptions } from 'ngx-masonry';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { LocalStorageService } from '@linkit/components';
import { UtilsLib } from 'projects/linkit/components/src/lib/utils/utils.lib';
import { UtilService } from '@app/services/utils.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { EventType } from '@linkit/components';
import { BreadcrumbService } from '@linkit/components'

import { SearchBarFormComponent } from '@linkit/components'
import { ModalCategoryChoiceComponent } from '@app/components/modal-category-choice/modal-category-choice.component';
import { ModalGroupChoiceComponent } from '@app/components/modal-group-choice/modal-group-choice.component';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import { Page } from '@app/models/page';
import { TipoServizioEnum } from '@app/model/tipoServizioEnum';

import * as _ from 'lodash';
import { CardType } from 'projects/linkit/components/src/lib/ui/card/card.component';
declare const saveAs: any;

@Component({
    selector: 'app-servizi',
    templateUrl: 'servizi.component.html',
    styleUrls: ['servizi.component.scss'],
    standalone: false
})
export class ServiziComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
    static readonly Name = 'ServiziComponent';
    readonly model: string = 'servizi';

    @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

    _production: boolean = true; // environment.production;
    
    Tools = Tools;

    config: any;
    serviziConfig: any;

    elements: any[] = [];
    _page: Page = new Page({});
    _links: any = {};
    _allElements: number = 0;

    fullScroll: boolean = false;
    _contentLimeted: boolean = false;

    _groupsView: boolean = true;
    groups: any[] = [];
    _pageGroups: Page = new Page({});
    _linksGroups: any = {};
    _manualSelected: boolean = false;
    
    _showImage: boolean = false;
    _showEmptyImage: boolean = false;
    _fillBox: boolean = false;
    _showMasonry: boolean = false;
    
    _showTaxonomies: boolean = false;

    _isEdit: boolean = false;
    _editCurrent: any = null;

    _hasFilter: boolean = true;
    _formGroup: FormGroup = new FormGroup({});
    _filterData: any = null;
    _filterDataEmpty: boolean = true;

    _preventMultiCall: boolean = false;

    _spin: boolean = true;
    _hideLoader: boolean = false;
    desktop: boolean = false;

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
        // { field: 'nome', label: 'APP.LABEL.nome', icon: '' }
    ];

    _statiServizioEnum: any = {};

    _tipiVisibilitaServizio: {value: string, label: string}[] = [
        ...Tools.TipiVisibilitaServizio
    ];
    _tipiVisibilitaServizioEnum: any = { ...Tools.VisibilitaServizioEnum };

    searchFields: any[] = [
        // { field: 'creationDateFrom', label: 'APP.LABEL.Date', type: 'date', condition: 'gt', format: 'DD/MM/YYYY' },
        // { field: 'creationDateTo', label: 'APP.LABEL.Date', type: 'date', condition: 'lt', format: 'DD/MM/YYYY' },
        { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'text', condition: 'like' },
        { field: 'stato', label: 'APP.LABEL.stato', type: 'enum', condition: 'equal', enumValues: this._statiServizioEnum },
        { field: 'visibilita', label: 'APP.LABEL.visibilita', type: 'enum', condition: 'equal', enumValues: this._tipiVisibilitaServizioEnum },
        { field: 'id_dominio', label: 'APP.LABEL.id_dominio', type: 'text', condition: 'equal', params: { resource: 'domini', field: 'nome', urlParam: '?id_dominio=' } },
        { field: 'id_api', label: 'APP.LABEL.id_api', type: 'text', condition: 'equal', params: { resource: 'api', field: '{nome} v.{versione} ({servizio.dominio.nome})' } },
        // { field: 'id_servizio', label: 'APP.LABEL.id_servizio', type: 'text', condition: 'equal', params: { resource: 'servizi', field: 'nome' } },
        { field: 'tag', label: 'APP.LABEL.tags', type: 'text', condition: 'contain' },
        { field: 'categoria', label: 'APP.LABEL.categoria', type: 'multiple', condition: 'equal', related: 'categoriaLabel' },
        { field: 'categoriaLabel', label: 'APP.LABEL.categoria', type: 'related', condition: 'equal', params: { resource: 'tassonomie', path: 'categorie', field: 'nome' }, options: { hide: true } },
        { field: 'id_gruppo_padre', label: 'APP.LABEL.gruppo', type: 'text', condition: 'equal', params: { resource: 'gruppi', path: '', field: 'nome' } },
        { field: 'id_gruppo_padre_label', label: 'APP.LABEL.gruppo', type: 'related', condition: 'equal', options: { hide: true } },
        // { field: 'taxonomiesGroup', label: 'APP.LABEL.tassonomie', type: 'group', condition: 'equal', options: { hide: true } }
    ];
    useCondition: boolean = false;

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' }
    ];

    viewBoxed: boolean = false;
    CardType = CardType;

    showPresentation: boolean = false;

    api_url: string = '';

    generalConfig: any = Tools.Configurazione || null;
    _workflowStati: any[] = Tools.Configurazione ? Tools.Configurazione.servizio.stati_adesione_consentita : [];
    _workflowStatiFiltered: any[] = [];

    _isMyServices: boolean = false;
    _myServicesCount: number = 0;

    _currIdGruppoPadre: string = '';
    _gruppoPadreNull: boolean = true;
    groupsBreadcrumbs: any[] = [
        // { label: 'APP.GROUPS.TITLE.Root', url: 'root', type: 'link', iconBs: 'folder' }
    ];

    _col: number = 4;

    minLengthTerm = 1;

    servizi$!: Observable<any[]>;
    serviziInput$ = new Subject<string>();
    serviziLoading: boolean = false;
    
    servizioApis$!: Observable<any[]>;
    servizioApisInput$ = new Subject<string>();
    servizioApisLoading: boolean = false;
    
    _searchApiSelected: any = null;
    
    tags$!: Observable<any[]>;
    tagsInput$ = new Subject<string>();
    tagsLoading: boolean = false;

    domini$!: Observable<any[]>;
    dominiInput$ = new Subject<string>();
    dominiLoading: boolean = false;
    selectedDominio: any;

    _settings: any = null;

    _updateMapper: string = '';

    _useNewSearchUI : boolean = false;

    numberCharLogoText: number = 2;
    enabledImageLink: boolean = false;
    colors: any[] = [];
    _lastColor: string = '';
    showGroupIcon: boolean = false;
    showGroupLabel: boolean = false;

    masonryOptions: NgxMasonryOptions = {
        itemSelector: '.masonry-item',
        percentPosition: true,
        columnWidth: '.masonry-item',
        gutter: 15,
        resize: true,
        horizontalOrder: true,
        // fitWidth: true,
        // containerStyle: null,
    };

    hasMultiSelection: boolean = true;
    elementsSelected: any[] = [];
    _downloading: boolean = true;
    uncheckAllInTheMenu: boolean = true;

    tipo_servizio: string = TipoServizioEnum.API;

    constructor(
        private router: Router,
        private modalService: BsModalService,
        private translate: TranslateService,
        private configService: ConfigService,
        public tools: Tools,
        private eventsManagerService: EventsManagerService,
        private localStorageService: LocalStorageService,
        private utilsLib: UtilsLib,
        public utils: UtilService,
        public apiService: OpenAPIService,
        public authenticationService: AuthenticationService,
        private breadCrumbService: BreadcrumbService
    ) {
        this.tipo_servizio = (this.router.url === '/servizi') ? TipoServizioEnum.API : TipoServizioEnum.Generico;

        const servizio = this.authenticationService._getConfigModule('servizio');
        const hasServiziApi = servizio?.api?.abilitato || false;
        const hasGenerico = servizio?.generico?.abilitato || false;
        const _label = this.translate.instant('APP.TITLE.Services');
        let _breadcrumbTitle: string = _label;
        if (hasServiziApi && hasGenerico) {
            const _type = this.translate.instant(this.tipo_servizio === TipoServizioEnum.API ? 'APP.TITLE.ServicesApi' : 'APP.TITLE.GenericServices');
            _breadcrumbTitle = `${_label} - ${_type}`;
        }
        this.breadcrumbs = [
            { label: `${_breadcrumbTitle}`, url: '', type: 'link', iconBs: 'grid-3x3-gap' }
        ];
    
        this.config = this.configService.getConfiguration();
        this.api_url = this.config.AppConfig.GOVAPI.HOST;
        this.numberCharLogoText = this.config.AppConfig.Layout.GroupView.numberCharLogoText || this.numberCharLogoText;
        this.enabledImageLink = this.config.AppConfig.Layout.GroupView.enabledImageLink || this.enabledImageLink;
        this.colors = this.config.AppConfig.Layout.GroupView.colors || [];
        this.showGroupIcon = this.config.AppConfig.Layout.GroupView.showGroupIcon || false;
        this.showGroupLabel = this.config.AppConfig.Layout.GroupView.showGroupLabel || false;
        this._useNewSearchUI = true; // this.config.AppConfig.Search.newLayout || false;
        this.fullScroll = this.config.AppConfig.Layout.fullScroll || false;
        this._showTaxonomies = servizio?.tassonomie_abilitate || false;

        const _isAnonymous = this._isAnonymous();
        this._settings = this.localStorageService.getItem('SERVIZI', null);
        if (!this._settings || _isAnonymous) {
            this._saveSettings();
        } else {
            this._groupsView = this._settings.groupsView;
            this._isMyServices = this._settings.isMyServices;
            if (this._isMyServices) {
                this._groupsView = false;
            }
        }

        if (this._isGestore()) {
            this._tipiVisibilitaServizio = [ ...this._tipiVisibilitaServizio, { value: 'componente', label: 'componente'} ];
            this._tipiVisibilitaServizioEnum = { ...this._tipiVisibilitaServizioEnum, 'componente': 'componente' };
            const _index = this.searchFields.findIndex((s: any) => s.field === 'visibilita');
            if (_index > -1) {
                this.searchFields[_index].enumValues = this._tipiVisibilitaServizioEnum;
            }
        }

        this._initSearchForm();

        this.eventsManagerService.on(EventType.PROFILE_UPDATE, (event: any) => {
            // setTimeout(() => {
                this._updateMapper = new Date().getTime().toString();
                this.hasMultiSelection = this.authenticationService.isGestore();
                this._getUserSettings();
                this._saveSettings();
                this.refresh(false);
            // }, 500);
        });

        this.eventsManagerService.on(EventType.BREADCRUMBS_RESET, (event: any) => {
            this._resetGroupsBreadcrumbs();
            this.refresh();
        });
    }

    _saveSettings() {
        const _isAnonymous = this._isAnonymous();
        this._groupsView = _isAnonymous ? true : this._groupsView;
        this._isMyServices = _isAnonymous ? false : this._isMyServices;
        const _settings = {
            groupsView: this._groupsView,
            isMyServices: this._isMyServices
        };
        this._settings = this.localStorageService.setItem('SERVIZI', _settings);
    }

    @HostListener('window:resize') _onResize() {
        this.desktop = (window.innerWidth >= 992);
    }

    ngOnInit() {
        const groupsBreadcrumbs = this.breadCrumbService.getBreadcrumbs();
        if (groupsBreadcrumbs) {
            this._currIdGruppoPadre = groupsBreadcrumbs.currIdGruppoPadre;
            this._gruppoPadreNull = groupsBreadcrumbs.gruppoPadreNull;
            this.groupsBreadcrumbs = groupsBreadcrumbs.groupsBreadcrumbs;
        }

        this.configService.getConfig(this.model).subscribe(
            (config: any) => {
                this.serviziConfig = config;
                this.viewBoxed = this.serviziConfig.viewBoxed || true;
                this.hasMultiSelection = this.serviziConfig.multiSelection || false;
                this.uncheckAllInTheMenu = this.serviziConfig.uncheckAllInTheMenu || false;
                this.showPresentation = this.serviziConfig.showPresentation || true;
                this._showImage = this.serviziConfig.showImage || true;
                this._showEmptyImage = this.serviziConfig.showEmptyImage || false;
                this._fillBox = this.serviziConfig.fillBox || true;
                this._showMasonry = this.serviziConfig.showMasonry || false;

                if (!this.authenticationService.isGestore()) {
                    this.hasMultiSelection = false;
                }

                this._getUserSettings();

                this._initServiziSelect([]);
                this._initServizioApiSelect([]);
                this._initTagsSelect([]);
                this._initDominiSelect([]);
            }
        );
    }

    _createWorkflowStati() {
        const _configServizio = Tools.Configurazione?.servizio;
        if (_configServizio) {
            this._workflowStati = this._isAnonymous() ? _configServizio.stati_adesione_consentita : _configServizio.workflow.stati;
            this._workflowStatiFiltered = [];
            this._workflowStati.forEach((element: string, index: number) => {
                if (element === 'archiviato' && !this._isGestore()) { return; }
                this._workflowStatiFiltered.push({ value: element, label: element });
            });

            this._statiServizioEnum = Object.fromEntries(this._workflowStatiFiltered.map(item => [item.label, `APP.WORKFLOW.STATUS.${item.value}`])) as {
                [key: string]: string;
            };
            const _index = this.searchFields.findIndex((s: any) => s.field === 'stato');
            if (_index > -1) {
                this.searchFields[_index].enumValues = { ...this._statiServizioEnum };
            }
        }
    }

    _getUserSettings() {
        const currentSession = this.authenticationService.getCurrentSession();
        const _userSettings = currentSession?.settings;

        if (_userSettings && _userSettings.servizi) {
            this._groupsView = (_userSettings.servizi.view === 'card');
            if (this._isMyServices) {
                this.resetElements();
                this._groupsView = false;
            }
            this.showPresentation = _userSettings.servizi.showPresentation || false;
            this._showImage = _userSettings.servizi.showImage || false;
            this._showEmptyImage = _userSettings.servizi.showEmptyImage || false;
            this._fillBox = _userSettings.servizi.fillBox || true;
            this._showMasonry = _userSettings.servizi.showMasonry || false;
        }

        this._createWorkflowStati();
    }

    ngOnDestroy() {}

    ngAfterViewInit() {
        if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
            setTimeout(() => {
                if (this.localStorageService.getItem('PROFILE')) {
                    this.refresh();
                }
            }, 100);
        }
    }

    ngAfterContentChecked(): void {
        this.desktop = (window.innerWidth >= 992);
    }

    refresh(hideLoader: boolean = false) {
        this._hideLoader = hideLoader;
        if (this._groupsView) {
            this.searchBarForm._clearSearch(null);
            this._filterData = null;
            // this._loadServiziGruppi();
        } else {
            this._resetGroupsBreadcrumbs();
            this._loadServizi(this._filterData);
        }
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
            stato: new FormControl(''),
            type: new FormControl(''),
            referente: new FormControl(''),
            id_dominio: new FormControl(''),
            id_gruppo: new FormControl(''),
            visibilita: new FormControl(''),
            categoria: new FormControl(''),
            categoriaLabel: new FormControl(''),
            tag: new FormControl(''),
            in_attesa: new FormControl(''),
            miei_servizi: new FormControl(''),
            id_api: new FormControl(''),
            id_servizio: new FormControl(''),
            id_gruppo_padre: new FormControl(''),
            id_gruppo_padre_label: new FormControl(''),
            // taxonomiesGroup: new FormGroup({})
        });
    }

    _loadServiziGruppi(query: any = null, url: string = '') {
        this._setErrorMessages(false);

        if (!url) { this.resetElements(); }
        
        let aux: any;
        if (!url) {
            query = { ...query, miei_servizi: this._isMyServices, tipo_servizio: this.tipo_servizio };
            if (this._currIdGruppoPadre) { query = { ...query, id_gruppo_padre: this._currIdGruppoPadre }; }
            if (this._gruppoPadreNull) { query = { ...query, gruppo_padre_null: this._gruppoPadreNull }; }
            if (query) aux = { params: this.utils._queryToHttpParams(query) };
        }
        this._spin = !this._hideLoader;
        this.apiService.getList('servizi_gruppi', aux, url).subscribe({
            next: (response: any) => {

                response ? this._pageGroups = new Page(response.page) : null;
                response ? this._linksGroups = response._links || null : null;
                this._allElements = this._pageGroups.totalElements || 0;

                if (response && response.content) {
                    const _list: any = response.content.map((sg: any) => {
                        const _meta: string[] = [];
                        if (sg.descrizione_sintetica) {
                            _meta.push(Tools.TruncateRows(sg.descrizione_sintetica));
                        }
                        const _model: string = sg.tipo === 'servizio' ? 'servizi' : 'gruppi';

                        let _visibilita = sg.visibilita;
                        if (!sg.visibilita && sg.dominio) {
                            _visibilita = sg.visibilita ? sg.visibilita : `${sg.dominio.visibilita}`;
                        }

                        const element = {
                            id: sg.id,
                            type: sg.tipo,
                            nome: sg.nome,
                            editMode: false,
                            source: { ...sg, visibilita: _visibilita },
                            primaryText: sg.label ? sg.label : ((sg.nome && sg.versione) ? `${sg.nome} - v.${sg.versione}` : sg.nome),
                            secondaryText: '', // (sg.descrizione || ''),
                            metadata: _meta.join(', '),
                            logo: sg.immagine ? `${this.api_url}/${_model}/${sg.id}/immagine`: ''
                        };
                        return element;
                    });
                    this.groups = (url) ? [...this.groups, ..._list] : [..._list];
                }

                this._preventMultiCall = false;
                this._spin = false;
                this._hideLoader = false;
            },
            error: (error: any) => {
                this._preventMultiCall = false;
                this._spin = false;
                this._hideLoader = false;
                console.log('_loadServiziGruppi error', error);
            }
        });
    }

    _loadServizi(query: any = null, url: string = '') {
        
        this._setErrorMessages(false);
        if (!this._preventMultiCall) { this.resetSeleted(); }

        if (!url) { this.resetElements(); }
        
        let aux: any;
        if (!url) { query = { ...query, miei_servizi: this._isMyServices, tipo_servizio: this.tipo_servizio }; }
        if (query) {
            // const _taxonomiesGroup = query.taxonomiesGroup;
            const _categoriaLabel = query.categoriaLabel;
            // delete query.taxonomiesGroup;
            delete query.categoriaLabel;
        
            aux = { params: this.utils._queryToHttpParams(query) };
        }

        this._spin = !this._hideLoader;
        this.apiService.getList(this.model, aux, url).subscribe({
            next: (response: any) => {

                response ? this._page = new Page(response.page) : null;
                response ? this._links = response._links || null : null;
                this._allElements = this._page.totalElements || 0;

                if (response && response.content) {
                    const _list: any = response.content.map((service: any, index: number) => {            
                        const _meta: string[] = [];
                        if (service.descrizione_sintetica) {
                            _meta.push(Tools.TruncateRows(service.descrizione_sintetica));
                        }

                        let _visibilita = service.visibilita || 'dominio';
                        if (!service.visibilita && service.dominio) {
                            _visibilita = service.visibilita ? service.visibilita : `${service.dominio.visibilita}`;
                        }
                        service.visibilita = _visibilita;
                        const element = {
                            id: service.id || index,
                            editMode: false,
                            source: { ...service, visibilita: _visibilita, logo: service.immagine ? `${this.api_url}/servizi/${service.id_servizio}/immagine`: '' },
                            idServizio: service.id_servizio,
                            nome: service.nome,
                            versione: service.versione || '',  
                            logo: service.immagine ? `${this.api_url}/servizi/${service.id_servizio}/immagine`: '',
                            descrizione: service.descrizione || '',
                            stato: service.stato || '',
                            multiplo: service.multi_adesione || false,
                            primaryText: service.label ? service.label : ((service.nome && service.versione) ? `${service.nome} - v.${service.versione}` : service.nome),
                            secondaryText: '', // (service.descrizione || ''),
                            metadata: _meta.join(', '),
                            selected: false,
                        };
                        return element;
                    });
                    this.elements = (url) ? [...this.elements, ..._list] : [..._list];
                }

                this._preventMultiCall = false;
                this._spin = false;
                this._hideLoader = false;
            },
            error: (error: any) => {
                this._setErrorMessages(true);
                this._preventMultiCall = false;
                this._spin = false;
                this._hideLoader = false;
            }
        });
    }

    _trackBy(index: any, item: any) {
        return item.id;
    }
    
    __loadMoreData() {
        if (this._groupsView && !this._filterData) {
            if (this._linksGroups && this._linksGroups.next && !this._preventMultiCall) {
                this._preventMultiCall = true;
                this._loadServiziGruppi(null, this._linksGroups.next.href);
            }
        } else {
            if (this._links && this._links.next && !this._preventMultiCall) {
                this._preventMultiCall = true;
                this._loadServizi(null, this._links.next.href);
            }
        }
    }

    _onNew() {
        this.router.navigate([this.model, 'new']);
    }

    _onEdit(event: any, param: any) {
        if (this.searchBarForm) {
            this.searchBarForm._pinLastSearch();
        }
        if (this.showPresentation) {
            this.router.navigate([this.model, param.idServizio, 'view']);
        } else {
            this.router.navigate([this.model, param.idServizio]);
        }
    }

    _onEditGroup(event: any, param: any) {
        if (this.searchBarForm) {
            this.searchBarForm._pinLastSearch();
        }
        if (param.type === 'servizio') {
            if (this.showPresentation) {
                this.router.navigate([this.model, param.id, 'view']);
            } else {
                this.router.navigate([this.model, param.id]);
            }
        } else {
            this._currIdGruppoPadre = param.id;
            this._gruppoPadreNull = false;
            this.groupsBreadcrumbs.push(
                { label: param.primaryText, url: param.id, type: 'link', icon: '', group: true, tooltip: 'APP.TOOLTIP.Group' }
            );
            this._saveGroupsBreadcrumbs();
            this.refresh();
        }
    }

    _onGoupsBreadcrumbs(group: any) {
        if (group.url !== this._currIdGruppoPadre) {
            const _index = this.groupsBreadcrumbs.findIndex((item: any) => { return item.url === group.url; });
            // if (_index > 1 ) {
                this.groupsBreadcrumbs = _.slice(this.groupsBreadcrumbs, 0, _index + 1);
            // }
            if (group.url === 'root') {
                this._currIdGruppoPadre = '';
                this._gruppoPadreNull = true;
            } else {
                this._currIdGruppoPadre = group.url;
                this._gruppoPadreNull = false;
            }
            this._saveGroupsBreadcrumbs();
            this.refresh();
        }
    }

    _saveGroupsBreadcrumbs() {
        const data: any = {
            currIdGruppoPadre: this._currIdGruppoPadre,
            gruppoPadreNull: this._gruppoPadreNull,
            groupsBreadcrumbs: this.groupsBreadcrumbs
        };
        this.breadCrumbService.storeBreadcrumbs(data);
        this.eventsManagerService.broadcast('UPDATE_BREADCRUMBS', data);
    }

    _removeGroupsBreadcrumbs() {
        this.breadCrumbService.clearBreadcrumbs();
        this.breadcrumbs = [ ...this.breadcrumbs ];
        this.eventsManagerService.broadcast('UPDATE_BREADCRUMBS', []);
    }

    _onCloseEdit() {
        this._isEdit = false;
    }

    _onSubmit(form: any) {
        if (this.searchBarForm) {
            this.searchBarForm._onSearch();
        }
    }

    get f(): { [key: string]: AbstractControl } {
        return this._formGroup.controls;
    }

    _onSearch(values: any) {
        if (values.id_gruppo_padre_label) {
            delete values.id_gruppo_padre_label;
        }
        this._filterData = values;
        if (this._filterData.categoria ) {
            const _split = this._filterData.categoria.split('|');
            this._filterData = { ...this._filterData, categoria: _split[1] };
        } else {
            this._filterData = { ...this._filterData, categoriaLabel: '' };
            this._formGroup.get('categoriaLabel')?.setValue('');
        }
        this.updateCategoryInput();

        const _tempFilter = { ...values };
        // delete _tempFilter.taxonomiesGroup;
        delete _tempFilter.categoriaLabel;

        this.resetElements();
        this._groupsView = false;
        this._filterDataEmpty = !Object.values(_tempFilter).some(x => (x !== null && x !== ''));
        if (this._filterDataEmpty) {
            this._groupsView = !this._manualSelected;
        }
        if (this._groupsView) {
            this._loadServiziGruppi();
        } else {
            this._resetGroupsBreadcrumbs();
            this._loadServizi(this._filterData);
        }
    }

    _resetGroupsBreadcrumbs() {
        this._currIdGruppoPadre = '';
        this._gruppoPadreNull = true;
        this.groupsBreadcrumbs = [];
        this._removeGroupsBreadcrumbs();
    }

    _resetForm() {
        this._filterData = null;
        this._loadServizi(this._filterData);
    }

    _onSort(event: any) {
        console.log(event);
    }

    _timestampToMoment(value: number) {
        return value ? new Date(value) : null;
    }

    onBreadcrumb(event: any) {
        if (event.group) {
            const groupsBreadcrumbs = this.breadCrumbService.getBreadcrumbs();
            if (groupsBreadcrumbs && (event.url !== 'root')) {
                this._currIdGruppoPadre = groupsBreadcrumbs.currIdGruppoPadre;
                this._gruppoPadreNull = groupsBreadcrumbs.gruppoPadreNull;
                this.groupsBreadcrumbs = groupsBreadcrumbs.groupsBreadcrumbs;
                this._saveGroupsBreadcrumbs();
            }
            if (event.url === 'root') {
                this._resetGroupsBreadcrumbs();
            }
            this.refresh();
        } else {
            this.router.navigate([event.url]);
        }
    }

    _resetScroll() {
        Tools.ScrollElement('container-scroller', 0);
    }

    _toggleGroups() {
        this.resetElements();
        this._groupsView = !this._groupsView;
        if (this._groupsView) {
            this._isMyServices = false;
        }
        // this._saveSettings();
        this._manualSelected = this._groupsView ? false : true;
        this.refresh();
    }

    _toggleSearchUI() {
        this._useNewSearchUI = !this._useNewSearchUI;
    }

    _toggleCols() {
        this._col = this._col === 4 ? 6 : 4;
    }

    _onMyServices() {
        this.resetElements();
        this._isMyServices = !this._isMyServices;
        if (this._isMyServices) {
            this._groupsView = false;
        } else {
            this._groupsView = !this._manualSelected;
        }
        this._saveSettings();
        this.refresh();
    }

    _showAllServices() {
        this._isMyServices = false;
        this.refresh();
    }

    _isGestore() {
        return this.authenticationService.isGestore();
    }

    _isAnonymous() {
        return this.authenticationService.isAnonymous();
    }

    _hasMyServiceMapper = (): boolean => {
        return !this.authenticationService.isGestore([]) && !this._isAnonymous();
    }

    _isAnonymousMapper = (): boolean => {
        return this._isAnonymous();
    }

    trackBySelectFn(item: any) {
        return item.id_api;
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

    _initServizioApiSelect(defaultValue: any[] = []) {
        this.servizioApis$ = concat(
            of(defaultValue),
            this.servizioApisInput$.pipe(
                filter(res => {
                    return res !== null && res.length >= this.minLengthTerm
                }),
                // startWith(''),
                distinctUntilChanged(),
                debounceTime(500),
                tap(() => this.servizioApisLoading = true),
                switchMap((term: any) => {
                    return this.getData('api', term).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.servizioApisLoading = false)
                    )
                })
            )
        );
    }

    _initTagsSelect(defaultValue: any[] = []) {
        this.tags$ = concat(
            of(defaultValue),
            this.tagsInput$.pipe(
                // filter(res => {
                //     return res !== null && res.length >= this.minLengthTerm
                // }),
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.tagsLoading = true),
                switchMap((term: any) => {
                    return this.getData('tags', term).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.tagsLoading = false)
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

    getData(model: string, term: any = null, sort: string = 'id', sort_direction: string = 'desc'): Observable<any> {
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
                    throwError(() => resp.Error);
                } else {
                    const _items = (resp.content || resp).map((item: any) => {
                        if (model === 'api') {
                            if (item.configurazione_collaudo?.dati_erogazione?.nome_gateway || item.configurazione_produzione?.dati_erogazione?.nome_gateway) {
                                item.descrizione = `${item.configurazione_collaudo?.dati_erogazione?.nome_gateway ?? '-'} | ${item.configurazione_produzione?.dati_erogazione?.nome_gateway ?? '-'}`;
                            } 
                        }
                        return item;
                    });
                    return _items;
                }
            })
        );
    }

    taxonomies: any[] = [];

    _loadTaxonomies() {
        this.taxonomies = [];
        // this._spin = true;
        this.apiService.getList('tassonomie').subscribe({
            next: (response: any) => {
                const _items = response.content.map((item: any) => {
                    return item;
                }).filter((item: any) => item.visibile);

                this.taxonomies = [ ..._items ];

                this._addTaxonomiesForm(this.taxonomies);

                this._spin = false;
            },
            error: (error: any) => {
                // this._spin = false;
            }
        });
    }

    _addTaxonomiesForm(taxonomies: any[]) {
        const _taxonomiesGroup = this._formGroup.get('taxonomiesGroup') as FormGroup;

        (taxonomies || []).forEach((taxonomy: any) => {
            _taxonomiesGroup.addControl(taxonomy.nome, new FormControl('', null));
        });

        this._formGroup.updateValueAndValidity();
    }

    onSelectedSearchDropdwon($event: Event){
        this.searchBarForm.setNotCloseForm(true)
        $event.stopPropagation();
    }

    onChangeSearchDropdwon(event: any){
        this._searchApiSelected = event;
        setTimeout(() => {
            this.searchBarForm.setNotCloseForm(false)
        }, 200);
    }

    _getHashColorMapper = (input: string): string => {
        let color = '';
        if (this.colors.length) {
            color = this.utilsLib.stringToColorIndex(input, this.colors);
        } else {
            color = this.utilsLib._getRandomColor();
        }
        return color;
    }

    _getRandomColorMapper = (): string => {
        let color = '';
        if (this.colors.length) {
            color = this.utilsLib._getRandomDifferent(this.colors, this._lastColor);
        this._lastColor = color;
        } else {
            color = this.utilsLib._getRandomColor();
        }
        return color;
    }

    _getTextColorMapper = (backColor: string): string => {
        return this.utilsLib.contrast(backColor);
    }

    modalChoiceRef!: BsModalRef;

    openChoiceGroupModal(event: any) {
        this.searchBarForm.setNotCloseForm(true)
        event.stopPropagation();

        const initialState = {
            gruppi: [],
            selected: [],
            notSelectable: [],
        };
        this.modalChoiceRef = this.modalService.show(ModalGroupChoiceComponent, {
            ignoreBackdropClick: true,
            // class: 'modal-lg-custom',
            initialState: initialState
        });
        this.modalChoiceRef.content.onClose.subscribe(
            (result: any) => {
                this._formGroup.patchValue({
                    id_gruppo_padre: result[0].id_gruppo,
                    id_gruppo_padre_label: result[0].nome
                })
            }
        );
    }

    clearGroup($event: any) {
        this._formGroup.patchValue({
            id_gruppo_padre: null,
            id_gruppo_padre_label: null
        })
    }

    _listaCategorie: any[] = [];

    openChoiceCategoriesModal(event: any) {
        this.searchBarForm.setNotCloseForm(true)
        event.stopPropagation();

        const initialState = {
            title: 'APP.TITLE.SelectCategory',
            categorie: [],
            selected: [],
            notSelectable: this._listaCategorie
        };
        this.modalChoiceRef = this.modalService.show(ModalCategoryChoiceComponent, {
            ignoreBackdropClick: true,
            // class: 'modal-lg-custom',
            initialState: initialState
        });
        this.modalChoiceRef.content.onClose.subscribe(
            (result: any) => {
                let _categoria = '';
                let _categoriaLabel = '';
                let _idTassonomia = '';
                let _nomeTassonomia = '';
                let _idCategoria = result.id_categoria;
                let _nomeCategoria = result.nome;
                if (result.tassonomia) {
                    _idTassonomia = result.tassonomia.id_tassonomia;
                    _nomeTassonomia = result.tassonomia.nome;
                    _nomeCategoria = result.nome;
                    _idCategoria = result.id_categoria;
                    _categoria = `${_idTassonomia}|${_idCategoria}`;
                    _categoriaLabel = `${result.nome}`;
                } else {
                    _idTassonomia = result.source.tassonomia.id_tassonomia;
                    _nomeTassonomia = result.source.tassonomia.nome;
                    _idCategoria = result.source.id_categoria;
                    _nomeCategoria = result.source.nome;
                    _categoria = `${_idTassonomia}|${_idCategoria}`;
                    _categoriaLabel = `${_nomeCategoria}`;
                }

                if (!this.hasCategory(_idCategoria)) {
                    this._listaCategorie.push({
                        id_tassonomia: _idTassonomia,
                        nome_tassonomia: _nomeTassonomia,
                        id_categoria: _idCategoria,
                        nome_categoria: _nomeCategoria,
                    }); 
                    const _categorie = this._listaCategorie.map((item: any) => `${item.id_tassonomia}|${item.id_categoria}` ).join(',');
                    const _categorieLabels = this._listaCategorie.map((item: any) => `${item.nome_tassonomia}|${item.nome_categoria}` ).join(',');
                    this._formGroup.get('categoria')?.setValue(_categorie);
                    this._formGroup.get('categoriaLabel')?.setValue(_categorieLabels);
                } else {
                    console.log('Categoria esistente', _idCategoria);
                }
            }
        );
    }

    hasCategory(idCategoria: string) {
        return this._listaCategorie.findIndex(item => item.id_categoria === idCategoria) !== -1;
    }

    onDeleteCategory(event: any) {
        event.event.stopImmediatePropagation();

        this._listaCategorie = this._listaCategorie.filter(item => item.id_categoria !== event.data.id_categoria);
        const _categorie = this._listaCategorie.map((item: any) => `${item.id_tassonomia}|${item.id_categoria}` ).join(',');
        const _categorieLabels = this._listaCategorie.map((item: any) => `${item.nome_tassonomia}|${item.nome_categoria}` ).join(',');
        this._formGroup.get('categoria')?.setValue(_categorie);
        this._formGroup.get('categoriaLabel')?.setValue(_categorieLabels);
    }

    updateCategoryInput() {
        this._listaCategorie = [];

        const _categoria = this._formGroup.get('categoria')?.value;
        const __categoriaLabel = this._formGroup.get('categoriaLabel')?.value;

        if (_categoria && __categoriaLabel) {
            const _categorieList = _categoria.split(',');
            const _categorieLabelsList = __categoriaLabel.split(',');

            for (let index = 0; index < _categorieList.length; index++) {
                const _splitValue = _categorieList[index].split('|');
                const _splitLabel = _categorieLabelsList[index].split('|');
                this._listaCategorie.push({
                    id_tassonomia: _splitValue[0],
                    nome_tassonomia: _splitLabel[0],
                    id_categoria: _splitValue[1],
                    nome_categoria: _splitLabel[1],
                });
            }
        }
    }

    resetElements() {
        if (this._hideLoader) { return; }
        this.elements = [];
        this._page = new Page({});
        this._links = null;
        this.groups = [];
        this._pageGroups = new Page({});
        this._linksGroups = null;
        this._allElements = 0;
    }

    resetSeleted() {
        this.elementsSelected = [];
    }

    deselectAll() {
        this.elementsSelected = [];
        const _elements = this.elements.map((element: any) => {
            return { ...element, selected: false };
        });
        this.elements = [ ..._elements ];
    }

    _onSelect(event: any, element: any) {
        event.stopPropagation();
        const _index = this.elementsSelected.findIndex((item: any) => item === element.idServizio);
        if (_index === -1) {
            element.selected = true;
            this.elementsSelected.push(element.idServizio);
        } else {
            element.selected = false;
            this.elementsSelected.splice(_index, 1);
        }
    }

    _onExport(type: string) {
        let aux: any;
        let query = null;

        if (type === 'search') {
            query = { ...this._filterData };
            if (query.id_gruppo_padre_label) {
                delete query.id_gruppo_padre_label;
            }
        } else {
            query = { id_servizio: [...this.elementsSelected ] };
        }
        aux = this.utils._queryToHttpParams(query);

        this._downloading = true;
        this.apiService.download(`${this.model}-export`, null, undefined, aux).subscribe({
            next: (response: any) => {
                let filename: string = Tools.GetFilenameFromHeader(response);
                saveAs(response.body, filename);
                this._downloading = false;
            },
            error: (error: any) => {
                this._downloading = false;
                Tools.showMessage(Tools.GetErrorMsg(error), 'danger', true);
            }
        });
    }
}
