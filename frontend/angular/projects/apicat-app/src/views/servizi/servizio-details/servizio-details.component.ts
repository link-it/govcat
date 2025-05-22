import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { MenuAction } from 'projects/components/src/lib/classes/menu-action';
import { ConfigService } from 'projects/tools/src/lib/config.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Servizio } from './servizio';
import { ServizioCreate, Soggetto } from './servizioCreate';

import { concat, forkJoin, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

// import { ModalGroupChoiceComponent } from '@app/components/modal-group-choice/modal-group-choice.component';

import { EventType } from 'projects/tools/src/lib/classes/events';
import { Grant } from '@app/model/grant';

declare const saveAs: any;
import * as moment from 'moment';

@Component({
    selector: 'app-servizio-details',
    templateUrl: 'servizio-details.component.html',
    styleUrls: ['servizio-details.component.scss']
})
export class ServizioDetailsComponent implements OnInit, OnChanges, AfterContentChecked {
    static readonly Name = 'ServizioDetailsComponent';
    readonly model: string = 'servizi';

    @Input() id: string | null = null;
    @Input() data: any = null;
    @Input() config: any = null;

    @Output() close: EventEmitter<any> = new EventEmitter<any>();
    @Output() save: EventEmitter<any> = new EventEmitter<any>();

    Tools = Tools;

    dominio: any = null;
    richiedente: any = null;
    utenteUltimaModifica: any = null;
    anagrafiche: any = null;

    appConfig: any;

    _editable: boolean = true;
    _deleteable: boolean = false;
    _isEdit = false;
    _closeEdit = true;
    _isNew = false;
    _formGroup: UntypedFormGroup = new UntypedFormGroup({});
    _data: Servizio = new Servizio({});
    _dataCreate: ServizioCreate = new ServizioCreate({});

    _spin: boolean = true;
    _downloading: boolean = true;
    _changingStatus: boolean = false;
    desktop: boolean = false;

    _useRoute: boolean = true;

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
        { label: '...', url: '', type: 'link' }
    ];

    _error: boolean = false;
    _errorMsg: string = '';
    _errors: any[] = [];
    _fromStatus: string = '';
    _toStatus: string = '';

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

    generalConfig: any = Tools.Configurazione || null;

    _singleColumn: boolean = false;
    _showMarkdown: boolean = false;
    _showMarkdownPreview: boolean = false;

    _otherLinks: any[] = [];
    _otherLinksDefault: any[] = [
        {
            title: 'APP.SERVICES.TITLE.ApiInformations',
            subTitle: 'APP.SERVICES.TITLE.ApiInformations_sub',
            buttonTitle: 'APP.BUTTON.Go',
            buttonIcon: 'navigate_next',
            route: 'api',
            show: true
        },
        {
            title: 'APP.SERVICES.TITLE.ComponentsInformations',
            subTitle: 'APP.SERVICES.TITLE.ComponentsInformations_sub',
            buttonTitle: 'APP.BUTTON.Go',
            buttonIcon: 'navigate_next',
            route: 'componenti',
            show: true
        },
        {
            title: 'APP.SERVICES.TITLE.Attachments',
            subTitle: 'APP.SERVICES.TITLE.Attachments_sub',
            buttonTitle: 'APP.BUTTON.Go',
            buttonIcon: 'navigate_next',
            route: 'allegati',
            show: true
        },
        // {
        //   title: 'APP.SERVICES.TITLE.Specific',
        //   subTitle: 'APP.SERVICES.TITLE.Specific_sub',
        //   buttonTitle: 'APP.BUTTON.Go',
        //   buttonIcon: 'navigate_next',
        //   route: 'allegati-specifica',
        //   show: true
        // },
        {
            title: 'APP.SERVICES.TITLE.ShowReferents',
            subTitle: 'APP.SERVICES.TITLE.ShowReferents_sub',
            buttonTitle: 'APP.BUTTON.Go',
            buttonIcon: 'navigate_next',
            route: 'referenti',
            show: true
        },
        {
            title: 'APP.SERVICES.TITLE.ShowGroups',
            subTitle: 'APP.SERVICES.TITLE.ShowGroups_sub',
            buttonTitle: 'APP.BUTTON.Go',
            buttonIcon: 'navigate_next',
            route: 'gruppi',
            show: true
        },
        {
            title: 'APP.SERVICES.TITLE.ShowCategories',
            subTitle: 'APP.SERVICES.TITLE.ShowCategories_sub',
            buttonTitle: 'APP.BUTTON.Go',
            buttonIcon: 'navigate_next',
            route: 'categorie',
            show: true
        }
    ];

    _otherActions: MenuAction[] = [
        new MenuAction({
            type: 'menu',
            title: 'APP.MENU.JoinService',
            icon: 'display',
            subTitle: '',
            action: 'join_service',
            enabled: true
        }),
        new MenuAction({
            type: 'submenu',
            title: 'APP.MENU.eServiceDescriptor',
            icon: 'download',
            subTitle: '',
            action: 'download_service',
            enabled: true,
            submenus: [
                new MenuAction({
                    type: 'submenu',
                    title: 'APP.MENU.DownloadeServiceDescriptorZip',
                    icon: 'file-zip',
                    subTitle: '',
                    action: 'download_service',
                    enabled: true,
                }),
                new MenuAction({
                    type: 'menu',
                    title: 'APP.MENU.DownloadeServiceDescriptorCsv',
                    icon: 'filetype-csv',
                    subTitle: '',
                    action: 'download_service_extended',
                    enabled: true
                })
            ]
        }),
        new MenuAction({
            type: 'divider',
            title: '',
            enabled: true
        })
    ];
    _showExternalOtherActions: boolean = true;
    _showDeleteActions: boolean = false;

    modalChoiceRef!: BsModalRef;

    _grant: Grant | null = null;
    _updateData: string = '';

    _tipiVisibilitaServizio = [
        { label: 'EreditataDominio ', value: null },
        ...Tools.TipiVisibilitaServizio
    ];

    _tipiServizio = [
        { label: 'API', value: 'API', enabled: true },
        { label: 'Generico', value: 'Generico', enabled: true }
    ];

    hasServiziApi: boolean = false;
    hasGenerico: boolean = false;

    _notification: any = null;
    _notificationId: string = '';
    _notificationMessageId: string = '';

    _hasMultiDominio: boolean = false;
    _multiDominioEmail: string | null = null;
    _hasFlagConsentiNonSottoscrivibile: boolean = false;
    _hasAdesioniMultiple: boolean = false;
    
    _isDominioEsterno: boolean = false;

    organizzazioniInterne$!: Observable<any[]>;
    organizzazioniInterneInput$ = new Subject<string>();
    organizzazioniInterneLoading: boolean = false;
    selectedOrganizzazione: any;

    selectedSoggetto: any;

    _disabled_id_soggetto: any = null;
    _hideSoggettoDropdown: boolean = true;
    _hideSoggettoInfo: boolean = true;
    _elencoSoggetti: any[] = [];
    
    _isDominioDeprecato: boolean = false;

    _showDateCreationModification: boolean = true;

    debugMandatoryFields: boolean = false;

    _componentBreadcrumbs: ComponentBreadcrumbsData | null = null;

    constructor(
        public route: ActivatedRoute,
        private router: Router,
        private translate: TranslateService,
        private modalService: BsModalService,
        private configService: ConfigService,
        private eventsManagerService: EventsManagerService,
        public tools: Tools,
        private apiService: OpenAPIService,
        private utils: UtilService,
        private authenticationService: AuthenticationService
    ) {
        this.route.data.subscribe((data) => {
        if (!data.componentBreadcrumbs) return;
            this._componentBreadcrumbs = data.componentBreadcrumbs;
            this._initBreadcrumb();
        });

        this.appConfig = this.configService.getConfiguration();
        this.apiUrl = this.appConfig.AppConfig.GOVAPI.HOST;
        const servizio = this.authenticationService._getConfigModule('servizio');
        this.hasServiziApi = servizio?.api?.abilitato || false;
        this.hasGenerico = servizio?.generico?.abilitato || false;
        this._tipiServizio.map((ts: any) => {
            ts.enabled = (ts.value === 'API' && this.hasServiziApi) || (ts.value === 'Generico' && this.hasGenerico);
        });

        this._hasMultiDominio = Tools.Configurazione?.dominio?.multi_dominio || false;
        this._multiDominioEmail = Tools.Configurazione?.dominio?.multi_dominio?.email || null;
        this._hasFlagConsentiNonSottoscrivibile = Tools.Configurazione?.servizio.consenti_non_sottoscrivibile || false;
        this._hasAdesioniMultiple = Tools.Configurazione?.servizio?.adesioni_multiple || false;

        this.loadAnagrafiche();
    }

    ngOnInit() {
        localStorage.setItem('SERVIZI_VIEW', 'FALSE');

        if (this._isGestore()) {
            this._tipiVisibilitaServizio = [ ...this._tipiVisibilitaServizio, { value: 'componente', label: 'componente'} ];
        }

        this.route.params.subscribe(params => {
        let _id = params['id'];
        const _cid = params['cid'];
        if (_cid) { _id = _cid; }
            if (_id && _id !== 'new') {
                this.id = _id;
                this.configService.getConfig(this.model).subscribe(
                    (config: any) => {
                        this.config = config;
                        this._singleColumn = config.editSingleColumn || false;
                        this._showMarkdown = config.showMarkdown || false;
                        this._loadAll();
                    }
                );
            } else {

                this._initBreadcrumb();

                this.configService.getConfig(this.model).subscribe(
                    (config: any) => {
                        this.config = config;
                        this._singleColumn = config.editSingleColumn || false;
                        this._showMarkdown = config.showMarkdown || false;
                        this.data = this._dataCreate;
                        this._initForm({ ...this._dataCreate });
                        this._initDominiSelect([]);
                        // this._initUtentiSelect([]);
                        this._initReferentiSelect([]);
                        this._initReferentiTecniciSelect([]);
                        this._initOrganizzazioniInterneSelect([]);
                        // this.loadAnagrafiche();
                        this._isNew = true;
                        this._isEdit = true;
                        this._spin = false;
                    }
                );
            }
        });

        this.route.queryParams.subscribe((val) => { 
            this._notification = null;
            this._notificationId = '';
            this._notificationMessageId = '';
            if (val.notificationId && val.messageid) {
                this._notificationId = val.notificationId;
                this._notificationMessageId = val.messageid;
            }
            if (val.notification) {
                const _notification = JSON.parse(decodeURI(atob(val.notification)));
                this._notification = _notification;
                this._notificationId = this._notification.id_notifica;
                this._notificationMessageId = this._notification.entita.id_entita;
            }
        })

        this.eventsManagerService.on(EventType.PROFILE_UPDATE, (event: any) => {
            this.generalConfig = Tools.Configurazione || null;
            this._hasMultiDominio = Tools.Configurazione?.dominio?.multi_dominio || false;
            this._multiDominioEmail = Tools.Configurazione?.dominio?.multi_dominio?.email || null;
            this._hasFlagConsentiNonSottoscrivibile = Tools.Configurazione?.servizio.consenti_non_sottoscrivibile || false;
            this._hasAdesioniMultiple = Tools.Configurazione?.servizio?.adesioni_multiple || false;
            this._updateOtherLinks()
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
        this._loadService();
    }

    _hasControlError(name: string) {
        return (this.f[name] && this.f[name].errors && this.f[name].touched);
    }

    _isVisibilita(type: string) {
        return (this.f['visibilita'] && this.f['visibilita'].value === type);
    }
    
    _isVisibilitaNull() {
        return (this.f['visibilita'] && (!this.f['visibilita'].value || this.f['visibilita'].value === 'null'));
    }

    _isVisibilitaNullMapper = (): boolean => {
        return (this._isVisibilitaNull() && (!this._isNew || this.selectedDominio));
    }

    _canMonitoraggioMapper = (): boolean => {
        return this.authenticationService.canMonitoraggio(this._grant?.ruoli);
    }

    _updateOtherLinks() {
        this._otherLinks = this._otherLinksDefault.filter((item: any) => {
            if (item.route === 'categorie') {
                const _taxonomiesRemoteConfig: any = this.authenticationService._getConfigModule('servizio');
                const _showTaxonomies = _taxonomiesRemoteConfig?.tassonomie_abilitate || false;
                // if (_showTaxonomies && this.anagrafiche) {
                //   console.log(this.anagrafiche);
                //   return this.anagrafiche['tassonomie']?.length > 0 || false;
                // }
                return _showTaxonomies;
            }
            if (item.route === 'api') {
                return !this.data?.package;
            }
            if (item.route === 'componenti') {
                return this.data?.package || false;
            }
            return true;
        });

        const _isGestore = this.authenticationService.isGestore();

        this._otherActions = this._otherActions.map((item: any) => {
            let _enabled = true;
            const _canJoin = this._canJoin();
            switch (item.action) {
                case 'join_service':
                case 'download_service':
                    _enabled = _canJoin;
                break;
                default:
                    if (item.type === 'divider') {
                        _enabled = _canJoin;
                    }
            }

            let _subMenus = [];
            if (item.submenus) {
                _subMenus = item.submenus.map((subItem: any) => {
                    let _subEnabled = true;
                    switch (subItem.action) {
                        case 'download_service_extended':
                            _subEnabled = _isGestore;
                        break;
                    }
                    return {
                        ...subItem,
                        enabled: _subEnabled
                    };
                });
            }

            const _item = { ...item, enabled: _enabled };
            if (_subMenus.length > 0) {
                _item.submenus = _subMenus;
            }

            return _item;
        });
    }

    onLinkClick(item: any) {
        // [routerLink]="[link.route]" [state]="{ service: data, grant: _grant }" [relativeTo]="route"
        this.router.navigate([item.route], { state: { service: this.data, grant: this._grant }, relativeTo: this.route });
    }

    get f(): { [key: string]: AbstractControl } {
        return this._formGroup.controls;
    }

    _initForm(data: any = null) {
        if (data) {
            let _group: any = {};
            Object.keys(data).forEach((key) => {
                let value = '';
                let boolValue = false; 
                switch (key) {
                    // case 'id_servizio':
                    //   value = data[key] ? data[key] : null;
                    //   _group[key] = new UntypedFormControl(value, [Validators.required]);
                    //   break;
                    // case 'utente_richiedente':
                    // case 'utente_ultima_modifica':
                    case 'referente':
                    // case 'referente_tecnico':
                        value = data[key] ? data[key] : null;
                        _group[key] = new UntypedFormControl(value, [Validators.required]);
                        break;
                    case 'versione':
                        value = data[key] ? data[key] : '';
                        _group[key] = new UntypedFormControl(value, [
                            Validators.required,
                            Validators.pattern("^[1-9][0-9]*$")
                        ]);
                        break;
                    case 'nome':
                    case 'descrizione_sintetica':
                        value = data[key] ? data[key] : null;
                        _group[key] = new UntypedFormControl(value, [
                            // Validators.required,
                            Validators.maxLength(255)
                        ]);
                        break;
                    case 'descrizione':
                        value = data[key] ? data[key] : null;
                        _group[key] = new UntypedFormControl(value, [
                            // Validators.required,
                            Validators.maxLength(4000)
                        ]);
                        break;
                    case 'note':
                        value = data[key] ? data[key] : null;
                        _group[key] = new UntypedFormControl(value, [
                            Validators.maxLength(1000)
                        ]);
                        break;
                    case 'termini_ricerca':
                        value = data[key] ? data[key] : null;
                        _group[key] = new UntypedFormControl(value, [
                            Validators.maxLength(255)
                        ]);
                        break;
                    case 'multi_adesione':
                        value = data[key] ? data[key] : false;
                        _group[key] = new UntypedFormControl({ value: value, disabled: true }, [Validators.required]);
                        break;
                    case 'id_dominio':
                    // case 'dominio':
                        value = data['dominio'] ? data['dominio'].id_dominio : this.generalConfig?.dominio?.dominio_default;
                        _group[key] = new UntypedFormControl(value, [Validators.required]);
                        break;
                    // case 'id_gruppo':
                    // // case 'gruppo':
                    //   value = data['gruppo'] ? data['gruppo'].id_gruppo : null;
                    //   _group[key] = new UntypedFormControl(value, []);
                    //   break;
                    case 'classi':
                        value = (data[key] ? data[key] : []);
                        _group[key] = new UntypedFormControl(value, []);
                        break;
                    case 'data_creazione':
                    case 'data_ultima_modifica':
                        const _now = moment().format('DD-MM-YYYY hh:mm:ss');
                        value = data[key] ? moment(data[key]).format('DD-MM-YYYY HH:mm:ss') : _now;
                        _group[key] = new UntypedFormControl({ value: value, disabled: true }, []);
                        break;
                    // case 'package':
                    //   value = data[key] ? data[key] : false;
                    //   _group[key] = new UntypedFormControl({ value: value, disabled: this.hasApi || this.hasComponenti }, []);
                    //   break;
                    case 'skip_collaudo':
                        value = data[key] ? data[key] : false;
                        _group[key] = new UntypedFormControl(value, []);
                        break;
                    case 'adesione_disabilitata':
                        boolValue = data[key] ? data[key] : false;
                        _group[key] = new UntypedFormControl(boolValue, []);
                        break;
                    default:
                        value = data[key] ? data[key] : null;
                        _group[key] = new UntypedFormControl(value, []);
                        break;
                }
            });
            this._formGroup = new UntypedFormGroup(_group);

            const controls: any = this._formGroup.controls;
            if (this._isVisibilita('riservato')) {
                controls.classi.setValidators(Validators.required);
            } else {
                controls.classi.clearValidators();
            }
            controls.classi.updateValueAndValidity();

            this.updateTipiVisibilitaServizio();

            this.enableDisableControlPackage();
            this.enableDisableControlAdesioneConsentita();
        }
    }

    updateTipiVisibilitaServizio() {
        const _origTipiVisibilitaServizio = [
            { label: 'EreditataDominio', value: null },
            ...Tools.TipiVisibilitaServizio  
        ];

        const _isPackage = this._formGroup.get('package')?.value || false;
        if (_isPackage) {
            this._tipiVisibilitaServizio = [ ..._origTipiVisibilitaServizio ];
        } else {
            if (this._isGestore()) {
                this._tipiVisibilitaServizio = [ ..._origTipiVisibilitaServizio, { value: 'componente', label: 'componente'} ];
            }
        }
    }

    __onSave(body: any) {
        this.__resetError();
        const _body = this._prepareBodySaveServizio(body);
        this._spin = true;
        this.apiService.saveElement(this.model, _body).subscribe(
            (response: any) => {
                this.id = response.id_servizio;
                this.data = response; // new Servizio({ ...response });
                this._data = new Servizio({ ...response });
                this._initBreadcrumb();
                this._spin = false;
                this._isEdit = false;
                this._isNew = false;
                this.save.emit({ id: this.id, service: response, update: false });
                this.router.navigate([this.model, this.id], { replaceUrl: true });
            },
            (error: any) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._spin = false;
                this._errors = error.error.errori || [];
            }
        );
    }

    _prepareBodySaveServizio(body: any) {
        const _classi: any[] = body.classi || [];

        const _newBody: any = {
            tipo: (body.tipo || null),
            nome: (body.nome || null),
            versione: body.versione || '1',
            id_dominio: body.id_dominio || this.generalConfig.dominio.dominio_default,
            // id_gruppo: body.id_gruppo || null,
            descrizione_sintetica: body.descrizione_sintetica || null,
            descrizione: body.descrizione || null,
            // stato: set by server,
            termini_ricerca: body.termini_ricerca || null,
            multi_adesione: body.multi_adesione || false,
            visibilita: (body.visibilita === 'null') ? null : body.visibilita,
            classi: _classi,
            note: body.note || null,
            immagine: body.immagine,
            adesione_disabilitata: body.adesione_disabilitata || false,
            id_soggetto_interno: body.id_soggetto_interno || null,
            package: body.package || false,
            skièp_collaudo: body.skièp_collaudo || false,
        };

            if (!body.package) {
            _newBody.referenti = [
                { id_utente: body.referente, tipo: 'referente' }
            ];
            if (body.referente_tecnico) {
                _newBody.referenti.push({ id_utente: body.referente_tecnico, tipo: 'referente_tecnico' });
            }
        }

        if (body.tags && Array.isArray(body.tags)) {
            _newBody.tags = body.tags;
        }
        _newBody.taxonomies = [];
        // if (body.tassonomie) {
        //   Object.keys(body.tassonomie).forEach((key: string) => {
        //     (body.tassonomie[ key ] || []).forEach((o: any) => {
        //       _newBody.taxonomies.push({
        //         taxonomy_id: key,
        //         category_id: o.idCategoria
        //       });
        //     });
        //   });
        // }

        return _newBody;
    }

    __onUpdate(id: number, body: any) {
        this.__resetError();
        const _body = this._prepareBodyUpdateServizio(body);
        this._spin = false;
        this.apiService.putElement(this.model, id, _body).subscribe(
            (response: any) => {
                this._isEdit = !this._closeEdit;
                if (response) {
                    this.data = response; // new Servizio({ ...response });
                    this._data = new Servizio({ ...response });
                    this.id = this.data.id_servizio;
                    this._isDominioDeprecato = this.data.dominio.deprecato || false;
                    this._isDominioEsterno = this.data.dominio.soggetto_referente.organizzazione.esterna || false;
                    this._initBreadcrumb();
                    this.loadCurrentData();
                    if (this.data.package) {
                        this._loadComponenti();
                    } else {
                        this._loadApis();
                }
                } else {
                    this._loadService(false);
                }
                this.save.emit({ id: this.id, data: response, update: true });
                this._spin = false;
            },
            (error: any) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._spin = false;
                this._errors = error.error.errori || [];
            }
        );
    }

    _prepareBodyUpdateServizio(body: any) {
        const _tags: any[] = body.tags || [];
        const _tassonomie: any[] = body.tassonomie || [];
        const _classi: any[] = (body.classi || []).map((item: any) => { return (typeof(item) === 'object') ? item.id_classe_utente : item; });
        let _immagine: any = {};

        if (body.immagine && body.immagine.uuid) {
            _immagine.tipo_documento = 'uuid';
            _immagine.uuid = body.immagine.uuid;
        } else {
            _immagine = body.immagine;
        }

        const _newBody: any = {
            identificativo: {
                tipo: body.tipo,
                nome: body.nome,
                versione: body.versione,
                id_dominio: body.id_dominio,
                visibilita: (body.visibilita === 'null') ? null : body.visibilita,
                multi_adesione: body.multi_adesione,
                classi: _classi,
                adesione_disabilitata: body.adesione_disabilitata || false,
                id_soggetto_interno: body.id_soggetto_interno || null,
                package: body.package || false,
                skip_collaudo: body.skip_collaudo || false
            },
            dati_generici: {
                // gruppo: body.id_gruppo,
                descrizione: body.descrizione || null,
                descrizione_sintetica: body.descrizione_sintetica || null,
                immagine: _immagine,
                tags: _tags,
                tassonomie: _tassonomie,
                termini_ricerca: body.termini_ricerca || null,
                note: body.note || null
            }
        };
        return this.authenticationService._removeDNM('servizio', this.data.stato, _newBody, this._grant?.ruoli);
    }

    _onSubmit(form: any, close: boolean = true) {
        if (this._isEdit && this._formGroup.valid) {
            this._closeEdit = close;
            if (this._isNew) {
                this.__onSave(form);
            } else {
                this.__onUpdate(this.data.id_servizio, form);
            }
        }
    }

    _confirmDelection(data: any = null) {
        this.utils._confirmDelection(data, this.__deleteService.bind(this));
    }

    __deleteService() {
        this.apiService.deleteElement(this.model, this.data.id_servizio).subscribe({
            next: (response) => {
                this.router.navigate([this.model], { relativeTo: this.route });
            },
            error: (error) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
            }
        });
    }

    trackByFn(item: any) {
        return item.id;
    }

    getDomini(term: string | null = null): Observable<any> {
        const _options: any = term ? { params: { q: term } } : { params: {} };
        if (!this.authenticationService.isGestore()) {
            _options.params.deprecato = false;
            _options.params.esterno = false;
        }
        return this.apiService.getList('domini', _options)
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

    getUtenti(term: string | null = null, role: string | null = null, stato: string = 'abilitato'): Observable<any> {
        const _options: any = { params: {} };
        if (term) { _options.params.q = term; }
        if (role) { _options.params.ruolo = role; }
        if (stato) { _options.params.stato = stato; }

        // In caso di erogazione filtrare per organizzazione
        if (!this._isDominioEsterno && this.selectedDominio) {
            _options.params.id_organizzazione = this.selectedDominio.soggetto_referente.organizzazione.id_organizzazione;
        }

        return this.apiService.getList('utenti', _options)
            .pipe(map(resp => {
                if (resp.Error) {
                    throwError(resp.Error);
                } else {
                    const _items = resp.content.map((item: any) => {
                        item.nome_completo = `${item.nome} ${item.cognome}`;
                        // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
                        return item;
                    });
                    return _items;
                }
            })
        );
    }

    _canManagement() {
        const _canManagement = this.authenticationService.canManagement('servizio', 'servizio', this.data?.stato, this._grant?.ruoli);
        const _isPackage = this.data?.package || false;
        const _isGestore = this.authenticationService.isGestore(this._grant?.ruoli);
        return _isPackage ? _isGestore : _canManagement;
    }

    _loadService(spin: boolean = true) {
        if (this.id) {
            this._spin = spin;
            if (spin) { this.data = null; }
            this.apiService.getDetails('servizi', this.id, 'grant').subscribe({
                next: (grant: any) => {
                    this._grant = grant;
                    this.apiService.getDetails(this.model, this.id).subscribe({
                        next: (response: any) => {
                            this.data = response; // new Servizio({ ...response });
                            if (!this._canManagement()) {
                                this.router.navigate(['servizi', this.data.id_servizio, 'view'], { relativeTo: this.route });
                            } else {
                                this._data = new Servizio({ ...response });
                                this._isDominioDeprecato = this.data.dominio.deprecato || false;
                                this._isDominioEsterno = this.data.dominio.soggetto_referente.organizzazione.esterna || false;
                                this._initForm({ ...this._data });
                                this._spin = false;
                                this._initBreadcrumb();
                                this._updateOtherLinks();
                                this.loadCurrentData();
                                // this.loadAnagrafiche();
                                if (this.data.package) {
                                    this._loadComponenti();
                                } else {
                                    this._loadApis();
                                }
                                this._enableDisableSkipCollaudo(this.data.dominio);
                            }
                            this._showDeleteActions = this.data.eliminabile || false;
                        },
                        error: (error: any) => {
                            Tools.OnError(error);
                            this._spin = false;
                        }
                    });
                },
                error: (error: any) => {
                    Tools.OnError(error);
                    this._spin = false;
                }
            });
        }
    }

    _initDominiSelect(defaultValue: any[] = []) {
        this.domini$ = concat(
            of(defaultValue),
            this.dominiInput$.pipe(
                // filter(res => {
                //   return res !== null && res.length >= this.minLengthTerm
                // }),
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.dominiLoading = true),
                switchMap((term: any) => {
                    return this.getDomini(term).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.dominiLoading = false)
                    )
                })
            )
        );
    }

    _initUtentiSelect(defaultValue: any[] = []) {
        this.utenti$ = concat(
            of(defaultValue),
            this.utentiInput$.pipe(
                // filter(res => {
                //   return res !== null && res.length >= this.minLengthTerm
                // }),
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.utentiLoading = true),
                switchMap((term: any) => {
                    return this.getUtenti(term).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.utentiLoading = false)
                    )
                })
            )
        );
    }

    _initReferentiSelect(defaultValue: any[] = []) {
        this.referenti$ = concat(
            of(defaultValue),
            this.referentiInput$.pipe(
                // filter(res => {
                //   return res !== null && res.length >= this.minLengthTerm
                // }),
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.referentiLoading = true),
                switchMap((term: any) => {
                    return this.getUtenti(term, 'referente_servizio,gestore,coordinatore').pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.referentiLoading = false)
                    )
                })
            )
        );
    }

    _initReferentiTecniciSelect(defaultValue: any[] = []) {
        this.referentiTecnici$ = concat(
            of(defaultValue),
            this.referentiTecniciInput$.pipe(
                // filter(res => {
                //   return res !== null && res.length >= this.minLengthTerm
                // }),
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.referentiTecniciLoading = true),
                switchMap((term: any) => {
                    return this.getUtenti(term).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.referentiTecniciLoading = false)
                    )
                })
            )
        );
    }

    _initOrganizzazioniInterneSelect(defaultValue: any[] = []) {
        this.organizzazioniInterne$ = concat(
            of(defaultValue),
            this.organizzazioniInterneInput$.pipe(
                // filter(res => {
                //   return res !== null && res.length >= this.minLengthTerm
                // }),
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.organizzazioniInterneLoading = true),
                switchMap((term: any) => {
                    return this.getOrganizzazioni(term, true).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.organizzazioniInterneLoading = false)
                    )
                })
            )
        );
    }

    loadCurrentData() {
        this._initDominiSelect([this.data.dominio]);

        this.selectedOrganizzazione = this.data.soggetto_interno?.organizzazione ?? null;

        this._formGroup.get('id_organizzazione_interna')?.disable();
        this._formGroup.patchValue({id_organizzazione_interna: this.selectedOrganizzazione?.id_organizzazione});

        if (!this.authenticationService.isGestore()) {
            if (this._isDominioDeprecato || this._isDominioEsterno) {
                this._formGroup.get('id_dominio')?.disable();
            }
        }
        this._formGroup.get('id_organizzazione_interna')?.setValidators(this._isDominioEsterno ? [Validators.required] : null);
        this._formGroup.get('id_organizzazione_interna')?.updateValueAndValidity();
        this._formGroup.get('id_soggetto_interno')?.setValidators(this._isDominioEsterno ? [Validators.required] : null);
        this._formGroup.get('id_soggetto_interno')?.updateValueAndValidity();

        this._initOrganizzazioniInterneSelect(this.selectedOrganizzazione ? [this.selectedOrganizzazione] : []);

        this.richiedente = this.data.utente_richiedente;
        this.utenteUltimaModifica = this.data.utente_ultima_modifica;

        this.getSoggetti(null, true).subscribe(
            (result) => {
                if (result.length === 1) {
                    this._hideSoggettoDropdown = true;
                    this._hideSoggettoInfo = true;
                    this._formGroup.controls.id_soggetto_interno.patchValue(result[0].id_soggetto)
                    this._formGroup.controls.id_soggetto_interno.updateValueAndValidity()
                } else {
                    this._hideSoggettoDropdown = false;
                    this._hideSoggettoInfo = false;
                    this._elencoSoggetti = [...result];
                    this._formGroup.controls.id_soggetto_interno.patchValue(this.data.soggetto_interno?.id_soggetto)
                    this._formGroup.controls.id_soggetto_interno.updateValueAndValidity()
                    this._formGroup.updateValueAndValidity();
                }
            },
            (error: any) => {
                Tools.OnError(error);
                this._spin = false;
            }
        );
    }
    

    getOrganizzazioni(term: string | null = null, aderente: true): Observable<any> {
        const _options: any = { params: { q: term, esterna: false } };
        if (aderente) {
            _options.params.aderente = aderente;
        }
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

    getSoggetti(term: string | null = null, referente: boolean = false): Observable<any> {
        let _options: any = null;
        if (this.selectedOrganizzazione?.id_organizzazione) {
            _options = { params: { id_organizzazione: this.selectedOrganizzazione?.id_organizzazione } };
        } else {
            _options = { params: { q: term } };
        }
        if (referente) {
            _options.params.referente = referente;
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

    onChangeSelect(event: any, param: string) {
        if (param == 'organizzazione') {
            this.selectedOrganizzazione = event;
            this._checkSoggetto(event);
        }
        if (param == 'soggetto') { this.selectedSoggetto = event }
    }

    _checkSoggetto(event: any) {  
        if(event) {
            this.getSoggetti(null, true).subscribe(
                (result) => {
                    const controls = this._formGroup.controls;
                    if (result.length == 1) {
                        this._hideSoggettoDropdown = true;
                        this._hideSoggettoInfo = true;

                        let aux: Soggetto = {
                            aderente: result[0].aderente,
                            id_soggetto: result[0].id_soggetto,
                            nome: result[0].nome,
                            organizzazione: result[0].organizzazione,
                            referente: result[0].referente,
                        }
                        controls.id_soggetto_interno.patchValue(aux.id_soggetto);
                        controls.id_soggetto_interno.disable();
                        this._disabled_id_soggetto = aux.id_soggetto;
                        
                    } else {
                        this._elencoSoggetti = [...result];

                        controls.id_soggetto_interno.enable();
                        controls.id_soggetto_interno.updateValueAndValidity();
                        this._disabled_id_soggetto = null;
                        this._hideSoggettoDropdown = false;
                        this._hideSoggettoInfo = false;
                    }

                    this._formGroup.updateValueAndValidity();
                },
                (err) => console.log(err)
            );
            
        } else {
            const controls = this._formGroup.controls;
            controls.id_soggetto_interno.patchValue(null);
            this._formGroup.updateValueAndValidity();

            this._elencoSoggetti = [];
            this._hideSoggettoDropdown = true;
        }
    }


    async loadAnagrafiche() {
        const tables: any[] = [
            // 'organizzazioni',
            // 'utenti',
            // 'domini',
            'classi-utente',
            'gruppi',
            'tags',
            'tassonomie'
        ];
        this.anagrafiche = await this.utils.getAnagrafiche(tables);
    }

    _initBreadcrumb() {
        const _nome: string = this.data ? this.data.nome : 'null';
        const _versione: string = this.data ? this.data.versione : null;

        let title = (_nome && _versione) ? `${_nome} v. ${_versione}` : (this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New'));
        let baseUrl = `/${this.model}`;

        if (this._componentBreadcrumbs) {
            title = (_nome && _versione) ? `${_nome} v. ${_versione}` : '...';
            baseUrl = `/servizi/${this._componentBreadcrumbs.service.id_servizio}/componenti`;
        }

        const _mainLabel = this._componentBreadcrumbs ? 'APP.TITLE.Components' : 'APP.TITLE.Services';
        const _mainTooltip = this._componentBreadcrumbs ? 'APP.TOOLTIP.ComponentsList' : '';
        const _mainIcon = this._componentBreadcrumbs ? '' : 'grid-3x3-gap';

        this.breadcrumbs = [
            { label: _mainLabel, url: `${baseUrl}`, type: 'link', iconBs: _mainIcon, tooltip: _mainTooltip },
            { label: title, url: ``, type: 'link' },
        ];

        if(this._componentBreadcrumbs){
            this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
        }
    }

    _editService() {
        // this._initForm({ ...this._data });
        this._isEdit = true;
        this._changeEdit(this._isEdit);
        this.__resetError();
        if (this.debugMandatoryFields) { this.utils._showMandatoryFields(this._formGroup); }
    }

    _onClose() {
        this.close.emit({ id: this.id, service: this._data });
    }

    _onSave() {
        this.save.emit({ id: this.id, service: this._data });
    }

    _onCancelEdit() {
        this._isEdit = false;
        this._showMarkdownPreview = false;
        this.__resetError();
        this._errorMsg = '';
        if (this._isNew) {
            if (this._useRoute) {
                if (this.id) {
                    this.router.navigate([this.model, this.id], { replaceUrl: true , relativeTo: this.route });
                } else {
                    this.router.navigate([this.model], { relativeTo: this.route });
                }
            } else {
                this.close.emit({ id: this.id, service: null });
            }
        } else {
            this._data = new Servizio({ ...this.data });
            this._initForm({ ...this._data });
            this._changeEdit(this._isEdit);
            this.enableDisableControlPackage();
            this.enableDisableControlAdesioneConsentita();
        }
        this._changeEdit(this._isEdit);
    }

    _changeEdit(edit: boolean) {
        if (edit) {
            // this._formGroup.get('adesione_disabilitata')?.enable();
            this._formGroup.get('multi_adesione')?.enable();
        } else {
            // this._formGroup.get('adesione_disabilitata')?.disable();
            this._formGroup.get('multi_adesione')?.disable();
        }
    }

    _onEditComponent(event: any, component: any) {
        console.log('_onEditComponent', component);
    }

    onBreadcrumb(event: any) {
        if (this._useRoute) {
            this.router.navigate([event.url], { relativeTo: this.route });
        } else {
            this._onClose();
        }
    }

    backPresentationView() {
        const url = `/servizi/${this.id}/view`;
        this.router.navigate([url]);
    }

    onWorkflowAction(event: any) {
        this.__resetError();
        this.utils.__confirmCambioStatoServizio(event, this.data, this._changeStatus.bind(this));
    }

    _onChangeType(event: any) {
        console.log('_onChangeType', this._formGroup.get('tipo')?.value);
    }

    _enableDisableSkipCollaudo(dominio: any) {
        if (dominio?.skip_collaudo) {
            if (this.data.vincola_skip_collaudo) {
                this._formGroup.get('skip_collaudo')?.disable();
            } else {
                this._formGroup.get('skip_collaudo')?.enable();
            }
        } else {
            if (this._isNew) {
                this._formGroup.get('skip_collaudo')?.setValue(false);
            }
            this._formGroup.get('skip_collaudo')?.disable();
        }
    }

    _onChangeDominio(event: any) {
        this.selectedDominio = event;

        this._isDominioEsterno = this.selectedDominio?.soggetto_referente?.organizzazione?.esterna || false;
        this._formGroup.get('id_organizzazione_interna')?.setValidators(this._isDominioEsterno ? [Validators.required] : null);
        this._formGroup.get('id_organizzazione_interna')?.updateValueAndValidity();
        this._formGroup.get('id_soggetto_interno')?.setValidators(this._isDominioEsterno ? [Validators.required] : null);
        this._formGroup.get('id_soggetto_interno')?.updateValueAndValidity();

        this._enableDisableSkipCollaudo(this.selectedDominio);
    }

    _changeStatus(event: any, service: any) {
        this._changingStatus = true;
        const _url: string = `${this.model}/${this.id}/stato`;
        const _body: any = {
            stato: event.status.nome
        };
        this.apiService.saveElement(_url, _body).subscribe(
            (response: any) => {
                this.data = { ...response };
                this._data = new Servizio({ ...response });
                this._changingStatus = false;
                const _status: string = this.translate.instant('APP.WORKFLOW.STATUS.' + this.data.stato);
                const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusSuccess', {status: _status});
                Tools.showMessage(_msg, 'success', true);
                this._updateData = new Date().getTime().toString();
            },
            (error: any) => {
                this._changingStatus = false;
                this._error = true;
                this._errorMsg = Tools.WorkflowErrorMsg(error);
                this._errors = error.error.errori || [];
                this._fromStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + this.data.stato);
                this._toStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + event.status.nome);
                const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusError', {status: this._toStatus});
                Tools.showMessage(_msg, 'danger', true);
                this._updateData = new Date().getTime().toString();
            },
        );
    }

    _onChangeVisibilita(event: any) {
        const controls: any = this._formGroup.controls;
        controls.classi.reset();

        if (event.target.value === 'riservato') {
            controls.classi.setValidators(Validators.required);
        } else {
            controls.classi.setValue([]);
            controls.classi.clearValidators();
        }
        controls.classi.updateValueAndValidity();

        this.enableDisableControlPackage();
        this.enableDisableControlAdesioneConsentita();
    }

    showReferenti: boolean = true;

    _onChangePackage(event: any) {
        const controls: any = this._formGroup.controls;
        if (this._isNew) {
            if (controls.package.value) {
                controls.referente.clearValidators();
                controls.referente.setValue(null);
                controls.referente.updateValueAndValidity();
                this.showReferenti = false;
            } else {
                controls.referente.setValidators(Validators.required);
                controls.referente.updateValueAndValidity();
                this.showReferenti = true;
            }
        }
        this.updateTipiVisibilitaServizio();
        controls.visibilita.setValue(null);
    }

    _onImageLoaded(event: any) {
        if (event) {
            var _split = event.split(',');
            var _type = _split[0].split(';')[0].replace('data:', '');
            var _content = _split[1];

            const _immagine: any = {
                content_type: _type,
                content: _content
            };
            if (!this._isNew) {
                _immagine.tipo_documento = 'nuovo';
            }

            this._formGroup.get('immagine')?.setValue(_immagine);
        } else {
            this._formGroup.get('immagine')?.setValue(null);
        }
    }

    _compareClassiFn(item: any, selected: any) {
        return item.id_classe_utente === selected.id_classe_utente;
    }

    _downloadServizioExport() {
        this.__resetError();
        this._downloading = true;
        this.apiService.download(this.model, this.id, `export`).subscribe({
            next: (response: any) => {
                let filename: string = Tools.GetFilenameFromHeader(response);
                saveAs(response.body, filename);
                this._downloading = false;
            },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._downloading = false;
            }
        });
    }

    _downloadServizioEstesoExport() {
        this.__resetError();
        this._downloading = true;

        let aux: any;
        const query = { id_servizio: [ this.id ] };
        aux = this.utils._queryToHttpParams(query);

        this.apiService.download(`${this.model}-export`, null, undefined, aux).subscribe({
            next: (response: any) => {
                let filename: string = Tools.GetFilenameFromHeader(response);
                saveAs(response.body, filename);
                this._downloading = false;
            },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._downloading = false;
            }
        });
    }

    _joinServizio() {
        this.router.navigate(['adesioni', 'new', 'edit'], { queryParams: { id_servizio: this.id } });
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
    }

    _toggleMarkdownPreview() {
        this._showMarkdownPreview = !this._showMarkdownPreview;
    }

    _canJoin() {
        const _usePackage = this.data?.package || false;
        return this.authenticationService.canJoin('servizio', this.data?.stato, _usePackage);
    }

    _canJoinMapper = (): boolean => {
        return this._canJoin();
    }

    _canEditMapper = (): boolean => {
        return this.authenticationService.canEdit('servizio', 'servizio', this.data?.stato, this._grant?.ruoli);
    }

    _isGestoreMapper = (): boolean => {
        return this.authenticationService.isGestore(this._grant?.ruoli);
    }

    onActionMonitor(event: any) {
        let url = '';
        switch (event.action) {
            case 'join_service':
                this._joinServizio();
                break;
            case 'download_service':
                this._downloadServizioExport();
                break;
            case 'download_service_extended':
                this._downloadServizioEstesoExport();
                break;
            case 'backview':
                url = `/servizi/${this.data.id_servizio}/view`;
                this.router.navigate([url], { relativeTo: this.route });
                break;
            default:
                url = `/servizi/${this.data.id_servizio}/${event.action}`;
                this.router.navigate([url], { relativeTo: this.route });
                break;
        }
    }

    _onCloseNotificationBar(event: any) {
        this.router.navigate([this.model, this.id], { relativeTo: this.route });
    }

    _isGestore() {
        return this.authenticationService.isGestore();
    }

    get isComponente() {
        return this._formGroup.get('visibilita')?.value === 'componente' || false;
    }

    enableDisableControlPackage() {
        if (this.hasApi || this.hasComponenti) {
            this._formGroup.get('package')?.disable();
        } else {
            if (this.isComponente) {
                this._formGroup.get('package')?.disable();
            } else {
                this._formGroup.get('package')?.enable();
            }
        }
        this._formGroup.get('package')?.updateValueAndValidity();
    }

    enableDisableControlAdesioneConsentita() {
        if (this.isComponente) {
            this._formGroup.get('adesione_disabilitata')?.setValue(false);
            this._formGroup.get('adesione_disabilitata')?.disable();
        } else {
            this._formGroup.get('adesione_disabilitata')?.enable();
        }
        this._formGroup.get('adesione_disabilitata')?.updateValueAndValidity();
    }

    _getLogoMapper = (data: any): string => {
        return data.immagine ? `${this.apiUrl}/servizi/${data.id_servizio}/immagine`: data.imagePlaceHolder || '';
    }

    get hasHelpPackage() {
        return this.hasApi || this.hasComponenti || this.isComponente;
    }

    get helpTooltipPackage() {
        let label: string = '';

        if (this.hasApi) {
            label = 'APP.TOOLTIP.ServiceHasApi';
        } else if (this.hasComponenti) {
            label = 'APP.TOOLTIP.ServiceHasComponents';
        }
        
        if (this.isComponente) {
            label = 'APP.TOOLTIP.ServiceHasVisibilitaComponent';
        }

        return label;
    }

    get helpTooltipAdesioneConsentita() {
        return this.isComponente ? 'APP.TOOLTIP.ServiceHasVisibilitaComponent' : '';
    }

    apiComponentiLoading: boolean = false;
    hasApi: boolean = false;
    hasComponenti: boolean = false;
    packageToolTip: string = '';

    _loadApis() {
        this.hasApi = false;
        const reqs: Observable<any>[] = [];
        let aux: any;
        const query: any = { id_servizio: this.id };
        query.ruolo = 'erogato_soggetto_dominio';
        aux = { params: this.utils._queryToHttpParams(query) };
        reqs.push(
        this.apiService.getList('api', aux)
            .pipe(
                catchError((err) => {
                    return of({ items: [] });
                })
            )
        );
        query.ruolo = 'erogato_soggetto_aderente';
        aux = { params: this.utils._queryToHttpParams(query) };
        reqs.push(
        this.apiService.getList('api', aux)
            .pipe(
                catchError((err) => {
                    return of({ items: [] });
                })
            )
        );

        forkJoin(reqs).subscribe(
            (results: Array<any>) => {
                const serviceApiDominio = results[0].content;
                const serviceApiAderente = results[1].content;
                this.apiComponentiLoading = false;
                this.hasApi = (serviceApiDominio.length + serviceApiAderente.length) > 0;
                this.enableDisableControlPackage();
                this._updateOtherLinks();
            },
            (error: any) => {
                console.log('_loadApis error', error);
                this.apiComponentiLoading = false;
                this._updateOtherLinks();
            }
        );
    }

    _loadComponenti() {
        this.hasComponenti = false;
        this.apiService.getDetails(this.model, this.id, 'componenti').subscribe(
            (response: any) => {
                this.apiComponentiLoading = false;
                this.hasComponenti = response.content.length > 0;
                this.enableDisableControlPackage();
                this._updateOtherLinks();
            },
            (error: any) => {
                console.log('_loadComponenti error', error);
                this.apiComponentiLoading = false;
                this._updateOtherLinks();
            }
        )
    }
}
