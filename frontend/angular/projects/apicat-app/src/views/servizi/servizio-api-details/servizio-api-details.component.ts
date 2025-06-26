import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { MenuAction } from '@linkit/components';
import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { UtilsLib } from 'projects/linkit/components/src/lib/utils/utils.lib';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { AllegatoComponent } from '@linkit/components';

import { ServizioApiCreate } from './servizio-api-create';

import { ModalChoicesComponent } from '@app/components/modal-choices/modal-choices.component';

import { Grant } from '@app/model/grant';
import { EventType } from '@linkit/components';

import * as _ from 'lodash';
import { ApiAuthTypeGroup, ApiConfiguration, ApiCreateRequest, ApiCustomProperty, ApiReadDetails, ApiUpdateRequest, IHistory, Profile } from './servizio-api-interfaces';
declare const saveAs: any;

export const EROGATO_SOGGETTO_DOMINIO: string = 'erogato_soggetto_dominio';
export const EROGATO_SOGGETTO_ADERENTE: string = 'erogato_soggetto_aderente';

export type Campo = {
    nome_gruppo: string;
    classe_dato: string;
    nome: string;
    etichetta: string;
    tipo: string;
    required: boolean;
    valori?: any[];
    regular_expression?: string;
    ruoli_abilitati?: string[];
};

export type GruppiCampi = Record<string, Campo[]>;

@Component({
    selector: 'app-servizio-api-details',
    templateUrl: 'servizio-api-details.component.html',
    styleUrls: ['servizio-api-details.component.scss'],
    standalone: false
})
export class ServizioApiDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
    static readonly Name = 'ServizioApiDetailsComponent';
    readonly model: string = 'api';

    @Input() id: string | null = null;
    @Input() sid: string | null = null;
    @Input() servizioApi: ApiReadDetails | null = null;
    @Input() config: any = null;

    @Output() close: EventEmitter<any> = new EventEmitter<any>();
    @Output() save: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('des') des!: AllegatoComponent;

    appConfig: any;

    _singleColumn: boolean = false;
    _showAllAttachments: boolean = true;

    _isDetails = true;

    _editable: boolean = true;
    _deleteable: boolean = false;
    _isEdit = false;
    _isModify = false;
    _closeEdit = true;
    _isNew = false;
    _newDescrittore = false;
    
    _customAuth = false;
    _customAuthOrig = false;
    _customAuthAdded = false;
    
    _formGroup: FormGroup = new FormGroup({});
    _descrittoreCtrl: FormControl = new FormControl('', []);

    servizioApiResponse: any = null;
    _servizioApi: ServizioApiCreate = new ServizioApiCreate({});
    _servizioApiCreate: ServizioApiCreate = new ServizioApiCreate({});
    service: any = null;
    _hasSpecifica: boolean = true;

    _grant: Grant | null = null;

    _spin: number = 0;
    _loaded: boolean = false;
    _downloading: boolean = true;
    desktop: boolean = false;
    
    _useRoute: boolean = true;

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
        { label: '...', url: '', type: 'link' },
        { label: 'APP.SERVICES.TITLE.API', url: '', type: 'link' },
        { label: '...', url: '', type: 'link' }
    ];

    _error: boolean = false;
    _errorMsg: string = '';
    _errors: any[] = [];

    _servicePlaceHolder: string = './assets/images/logo-placeholder.png';
    _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
    _serviceLogoPlaceholder: string = './assets/images/service-placeholder.png';

    _selectedService: any = null;

    _collaudo: boolean = true;
    _richiesteEnabled: boolean = true;
    _risposteEnabled: boolean = true;
    _adesioniMultiple: boolean = false;
    _apiMultiple: boolean = false;
    _codiceAssetObbligatorio: boolean = false;
    _specificaObbligatorio: boolean = false;
    _transazioni: boolean = false;
    _info_gateway_visualizzate: boolean = false;

    _authTypes: any[] = [];
    _profili: any[] = [];
    _profiliFiltered: any[] = [];
    _pdnd: any = null;
    _apiProprietaCustom: any[] = [];
    _apiProprietaCustomGrouped: any = null;
    _ruoli: any[] = [];
    _labelDominio: string = '';
    _labelAderente: string = '';
    _tipoInterfaccia: any[] = [
        { value: 'soap', label: 'APP.INTERFACE.soap' },
        { value: 'rest', label: 'APP.INTERFACE.rest' }
    ];

    EROGATO_SOGGETTO_DOMINIO: string = EROGATO_SOGGETTO_DOMINIO;
    EROGATO_SOGGETTO_ADERENTE: string = EROGATO_SOGGETTO_ADERENTE;

    _loadingRisorse: boolean = false;
    _risorseOpen: boolean = false;
    _star: number = -1;
    _risorseOrig: string[] = [];
    _risorse: string[] = [];
    _risorseSelected: string[] = [];
    _authSelected: any[] = [];
    _authTypesSelected: any[] = [];

    _customProperties: any = [];
    _customPropertiesFormGroup: FormGroup = new FormGroup({});

    _showTrigger: boolean = true;

    modalChoiceRef!: BsModalRef;

    _markAsteriskUpdated: boolean = true;
    _updateResources: string = '';

    _updateMapper: string = '';

    _otherActions: MenuAction[] = [];
    _showExternalOtherActions: boolean = false;

    _isPDND: boolean = false;

    _isDominioEsterno: boolean = false;

    _componentBreadcrumbs: ComponentBreadcrumbsData | null = null;

    debugMandatoryFields: boolean = false;

    showHistory: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder,
        private translate: TranslateService,
        private modalService: BsModalService,
        private configService: ConfigService,
        public tools: Tools,
        public eventsManagerService: EventsManagerService,
        public utilsLib: UtilsLib,
        public apiService: OpenAPIService,
        public utils: UtilService,
        public authenticationService: AuthenticationService
    ) {
        this.route.data.subscribe((data) => {
        if (!data.componentBreadcrumbs) return;
            this._componentBreadcrumbs = data.componentBreadcrumbs;
            this._initBreadcrumb();
        });

        this.appConfig = this.configService.getConfiguration();
        const _state = this.router.getCurrentNavigation()?.extras.state;
        this.service = _state?.service || null;
        this._grant = _state?.grant;

        const _srv: any = Tools.Configurazione?.servizio;
        this._apiMultiple = _srv ? _srv.api_multiple : false;
        this._adesioniMultiple = _srv ? _srv.adesioni_multiple : false;
        this._richiesteEnabled = this._apiMultiple;
        this._risposteEnabled = this._apiMultiple;
        this._codiceAssetObbligatorio = (_srv && _srv.api) ? _srv.api.codice_asset_obbligatorio : false;
        this._specificaObbligatorio = (_srv && _srv.api) ? _srv.api.specifica_obbligatorio : false;
        this._authTypes = (_srv && _srv.api) ? _srv.api.auth_type : [];
        this._profili = (_srv && _srv.api) ? _srv.api.profili : [];
        this._info_gateway_visualizzate = (_srv && _srv.api) ? _srv.api.info_gateway_visualizzate : false;
        this._pdnd = Tools.Configurazione?.pdnd || null;
    }

    ngOnInit() {
        this.eventsManagerService.on('INIT_DATA', (event: any) => {
            this._initData(true);
        });

        this.route.params.subscribe(params => {
            let _id = params['id'];
            const _cid = params['cid'];
            if (_cid) { _id = _cid; }
                if (_id) {
                    this.sid = _id;
                    if (params['aid'] !== 'new') {
                    this.id = params['aid'];
                    this._isDetails = true;
                    this.configService.getConfig('api').subscribe(
                        (config: any) => {
                        this.config = config;
                        this._singleColumn = config.editSingleColumn || false;
                        this._showAllAttachments = config.showAllAttachments || false;
                        if (!this.service) {
                            this._loadAll();
                        } else {
                            this._initBreadcrumb();
                            this._initRuoli();
                            this._initOtherActionMenu();
            
                            if (this.servizioApi) {
                                this.eventsManagerService.broadcast('INIT_DATA');
                            }
                            this._updateMapper = new Date().getTime().toString();
                            this._loadServiceApi();
                        }
                        }
                    );
                } else {
                    this.configService.getConfig('api').subscribe(
                        (config: any) => {
                            this.config = config;
                            this._singleColumn = config.editSingleColumn || false;
                            this._isNew = true;
                            this._isEdit = true;

                            if (!this.service) {
                                this._loadServizio();
                            }
                            this._servizioApiCreate.id_servizio = this.sid;
                            this._initForm({ ...this._servizioApiCreate });
                        }
                    );
                }
            }
        });

        this.eventsManagerService.on(EventType.PROFILE_UPDATE, (event: any) => {
            const _srv: any = Tools.Configurazione?.servizio;
            this._apiMultiple = _srv ? _srv.api_multiple : false;
            this._adesioniMultiple = _srv ? _srv.adesioni_multiple : false;
            this._richiesteEnabled = this._apiMultiple;
            this._risposteEnabled = this._apiMultiple;
            this._codiceAssetObbligatorio = (_srv && _srv.api) ? _srv.api.codice_asset_obbligatorio : false;
            this._specificaObbligatorio = (_srv && _srv.api) ? _srv.api.specifica_obbligatorio : false;
            this._authTypes = (_srv && _srv.api) ? _srv.api.auth_type : [];
            this._profili = (_srv && _srv.api) ? _srv.api.profili : [];
            this._info_gateway_visualizzate = (_srv && _srv.api) ? _srv.api.info_gateway_visualizzate : false;
            this._pdnd = Tools.Configurazione?.pdnd || null;
        });
    }

    ngOnDestroy() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.id) {
            this.id = changes.id.currentValue;
            this._loadAll();
        }
        if (changes.service) {
            const service = changes.service.currentValue;
            this.servizioApi = service.source;
            this.id = this.servizioApi?.id_api || null;
        }
    }

    ngAfterContentChecked(): void {
        this.desktop = (window.innerWidth >= 992);
    }

    _loadAll() {
        this._loadServizio();
        this._loadServiceApi();
    }

    _hasControlError(name: string) {
        return (this.f[name].errors && this.f[name].touched);
    }

    get f(): { [key: string]: AbstractControl } {
        return this._formGroup.controls;
    }

    getInvalidFields(formGroup: FormGroup): string[] {
        const invalidFields: string[] = [];
    
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
    
            if (control instanceof FormGroup) {
                invalidFields.push(...this.getInvalidFields(control));
            } else if (control?.invalid) {
                invalidFields.push(key);
            }
        });
    
        return invalidFields;
    }

    _initForm(data: any = null) {
        if (data) {
            let _group: any = {};
            Object.keys(data).forEach((key) => {
                let value = '';
                switch (key) {
                    case 'nome':
                        value = data[key] ? data[key] : '';
                        _group[key] = new FormControl(value, [
                            Validators.required,
                            Validators.maxLength(255)
                        ]);
                        break;
                    case 'ruolo':
                        value = data[key] ? data[key] : '';
                        _group[key] = new FormControl(value, [Validators.required]);
                        break;
                    case 'protocollo':
                        value = data[key] ? data[key] : '';
                        _group[key] = new FormControl(value, this._isNew ? [Validators.required] : []);
                        break;
                    case 'descrizione':
                        value = data[key] ? data[key] : null;
                        _group[key] = new FormControl(value, [
                            Validators.maxLength(255)
                        ]);
                        break;
                    case 'versione':
                        value = data[key] ? data[key] : '';
                        _group[key] = new FormControl(value, [
                            Validators.required,
                            Validators.pattern("^[1-9][0-9]*$")
                        ]);
                        break;
                    case 'codice_asset':
                        value = data[key] ? data[key] : null;
                        _group[key] = new FormControl(value,
                            this._codiceAssetObbligatorio ? [Validators.required, Validators.maxLength(255)] : [Validators.maxLength(255)]
                        );
                        break;
                    default:
                        value = data[key] ? data[key] : null;
                        _group[key] = new FormControl(value, []);
                        break;
                }
            });
            _group.descrittore = this._descrittoreCtrl;

            if (this._isNew && (this._specificaObbligatorio || this._hasSpecifica)) {
                this._descrittoreCtrl.setValidators([Validators.required]);
            }

            const _authTypes = this.formBuilder.array([]);
            _group.authTypes = _authTypes;

            this._formGroup = new FormGroup(_group);

            if (this.servizioApi?.configurazione_collaudo && this.servizioApi?.configurazione_collaudo?.protocollo) {
                this._formGroup.get('protocollo')?.setValue(this.servizioApi.configurazione_collaudo.protocollo);
            }
        }
    }

    _toggleSpecifica() {
        this._hasSpecifica = !this._hasSpecifica;
        setTimeout(() => {
            if (this._specificaObbligatorio || this._hasSpecifica) {
                this._descrittoreCtrl.setValidators([Validators.required]);
            } else {
                this._descrittoreCtrl.clearValidators();
            }
            this._descrittoreCtrl.updateValueAndValidity();
            // this.__protocolloChange();
            this.__descrittoreChange(null);
        }, 100);
    }

    _onServiceLoaded(event: any, field: string) {
        this._selectedService = event.target.services[0];
    }

    __onSave(body: any) {
        this.__resetError();
        const _body = this._prepareBodySaveApi(body);
        this._spin++;
        this.apiService.saveElement(this.model, _body)
            .subscribe({
                next: (response: any) => {
                    this.id = response.id_api;
                    this.servizioApiResponse = JSON.parse(JSON.stringify(response));
                    this.servizioApi = response; // new ServizioApi({ ...response });
                    this._servizioApi = new ServizioApiCreate({ ...response });
                    this._initBreadcrumb();
                    this._isEdit = false;
                    this._isNew = false;
                    this._spin--;
                    this.save.emit({ id: this.id, api: response, update: false });
                    this.router.navigate(['servizi', this.sid, this.model, this.id], { replaceUrl: true });
                },
                error: (error: any) => {
                    this._spin--;
                    this._error = true;
                    this._errorMsg = Tools.GetErrorMsg(error);
                }
            });
    }

    _prepareBodySaveApi(body: any) {
        const configurazioneCollaudo: ApiConfiguration = {
            protocollo: body.protocollo,
            dati_erogazione: {
                url: body.url_collaudo || null,
                nome_gateway: body.nome_gateway || null,
                versione_gateway: body.versione_gateway || null,
            }
        };
        
        let configurazioneProduzione: ApiConfiguration | undefined = undefined;

        if (body.url_produzione) {
            configurazioneProduzione = {
                protocollo: body.protocollo,
                dati_erogazione: {
                    url: body.url_produzione
                }
            };
        }

        const _newBody: ApiCreateRequest = {
            nome: body.nome,
            versione: body.versione || '1',
            id_servizio: body.id_servizio,
            ruolo: body.ruolo,
            descrizione: body.descrizione || null,
            codice_asset: body.codice_asset,
            configurazione_collaudo: configurazioneCollaudo,
            configurazione_produzione: configurazioneProduzione,
            proprieta_custom: [],
            gruppi_auth_type: [],
        };

        if (this._hasSpecifica) {
            if (body.content && body.filename) {
                configurazioneCollaudo.specifica = {
                    content_type: body.estensione ? body.estensione : null,
                    content: body.content,
                    filename: body.filename
                };
                if (configurazioneProduzione) {
                    configurazioneProduzione.specifica = {
                        content_type: body.estensione ? body.estensione : null,
                        content: body.content,
                        filename: body.filename
                    };
                }
            };
        }

        if (body.ruolo === this.EROGATO_SOGGETTO_DOMINIO) {;
            _newBody.gruppi_auth_type = body.authTypes.map((item: any):ApiAuthTypeGroup => {
                return {
                    profilo: item.profilo,
                    resources: item.resources,
                    note: item.note || null,
                };
            });
        }

        if (this._apiProprietaCustomGrouped && Object.keys(this._apiProprietaCustomGrouped).length) {
            _newBody.proprieta_custom = [];
            Object.keys(this._apiProprietaCustomGrouped).forEach(k => {
                const _customGrouped: ApiCustomProperty = {
                    gruppo: k,
                    proprieta: []
                };
                this._apiProprietaCustomGrouped[k].forEach((kk: any) => {
                    if (body.proprieta_custom[k][kk.nome]) {
                        _customGrouped.proprieta.push({
                            nome: kk.nome,
                            valore: body.proprieta_custom[k][kk.nome]
                        });
                    }
                });
                _newBody.proprieta_custom.push(_customGrouped);
            });
        }

        return _newBody;
    }

    __onUpdate(id: string | null, body: any) {
        this.__resetError();
        let _body = this._prepareBodyUpdateApi(body);
        this._spin++;
        this.apiService.putElement(this.model, id, _body).subscribe(
            (response: any) => {
                this._isEdit = !this._closeEdit;
                this.servizioApiResponse = JSON.parse(JSON.stringify(response));
                this.servizioApi = response; // new ServizioApi({ ...response });
                this._servizioApi = new ServizioApiCreate({ ...response });
                this.id = response.id_api;
                this.save.emit({ id: this.id, servizioApiapi: response, update: true });
                this._spin--;
                this._updateMapper = new Date().getTime().toString();
                this._loaded = true;
                this._initBreadcrumb();
            },
            (error: any) => {
                this._spin--;
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
            }
        );
    }

    _prepareBodyUpdateApi(body: any) {
        let _newBody: ApiUpdateRequest = {
            identificativo: {
                nome: body.nome,
                versione: body.versione,
                ruolo: body.ruolo,
            },
            dati_generici: {
                descrizione: body.descrizione || null,
                codice_asset: body.codice_asset || null,
            },
        };

        if (body.ruolo === this.EROGATO_SOGGETTO_DOMINIO) {
            _newBody.dati_specifica = {
                ..._newBody.dati_specifica,
                gruppi_auth_type: body.authTypes?.map((item: any) => {
                    const _proprietaCustom: any[] = [];
                    Object.keys(item.customProperties || {}).map((key: string) => {
                        if (item.customProperties[key]) {
                            _proprietaCustom.push({
                                nome: key,
                                valore: item.customProperties[key]
                            });
                        }
                    });

                    return {
                        profilo: item.profilo,
                        resources: item.resources,
                        note: item.note || null,
                        proprieta_custom: _proprietaCustom
                    };
                })
            }
        }

        if (this._apiProprietaCustomGrouped && Object.keys(this._apiProprietaCustomGrouped).length && !this._isPDND) {
            const proprieta_custom: ApiCustomProperty[] = [];
            _newBody.dati_custom = {proprieta_custom: proprieta_custom};
            Object.keys(this._apiProprietaCustomGrouped).forEach(k => {
                const _customGrouped: any = {
                    gruppo: k,
                    proprieta: []
                };
                this._apiProprietaCustomGrouped[k].forEach((kk: any) => {
                    if (body.proprieta_custom[k][kk.nome]) {
                        _customGrouped.proprieta.push({
                            nome: kk.nome,
                            valore: body.proprieta_custom[k][kk.nome]
                        });
                    }
                });
                proprieta_custom.push(_customGrouped);
            });
        }

        return this.authenticationService._removeDNM('servizio', this.service.stato, _newBody, this._grant?.ruoli);
    }

    _getGroupNameByLabel(group: any) {
        const _srv: any = Tools.Configurazione?.servizio;
        let _proprietaCustom = (_srv && _srv.api) ? _srv.api.proprieta_custom.filter((p: any) => p.classe_dato !== 'produzione') : [];
        if (!this._isNew){
            _proprietaCustom = _proprietaCustom.filter((p: any) => p.classe_dato !== 'collaudo');
        }
        return _proprietaCustom.find((item: any) => item.label_gruppo === group)?.nome_gruppo || group;
    }

    _onSubmit(form: any, close: boolean = true) {
        if (this._isEdit && this._formGroup.valid) {
            this._closeEdit = close;
            if (this._isNew) {
                this.__onSave(form);
            } else {
                this.__onUpdate(this.servizioApi?.id_api || null, form);
            }
        }
    }

    _confirmDelection() {
        this.utils._confirmDelection(null, this._deleteServiceApi.bind(this));
    }

    _deleteServiceApi(data: any) {
        this.apiService.deleteElement(this.model, this.servizioApi?.id_api || null).subscribe(
            (response) => {
                if (this._componentBreadcrumbs) {
                    this.router.navigate(['servizi', this._componentBreadcrumbs.service.id_servizio, 'componenti', this.sid, 'api']);
                } else {
                    this.router.navigate(['servizi', this.sid, 'api']);
                }
            },
            (error) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._errors = error.error.errori || [];
            }
        );
    }

    _initRuoli() {
        this._labelDominio = this.translate.instant('APP.ROLE.ErogatoSoggettoDominio.title', { soggetto: this.service.dominio.soggetto_referente.nome });
        this._labelAderente = this.translate.instant('APP.ROLE.ErogatoSoggettoAderente.title');
        this._ruoli = [
            { value: this.EROGATO_SOGGETTO_DOMINIO, label: this._labelDominio, key: this.EROGATO_SOGGETTO_DOMINIO },
            { value: this.EROGATO_SOGGETTO_ADERENTE, label: this._labelAderente, key: this.EROGATO_SOGGETTO_ADERENTE }
        ];
    }

    _initOtherActionMenu() {
        this._otherActions = [
            new MenuAction({
                type: 'menu',
                title: 'APP.MENU.ApiDescriptor',
                icon: 'download',
                subTitle: '',
                action: 'download_service_api',
                enabled: this._canJoin()
            }),
            new MenuAction({
                type: 'divider',
                title: '',
                enabled: this._canJoin()
            }),
            new MenuAction({
                type: 'menu',
                title: 'APP.MENU.DeleteApi',
                icon: 'trash text-danger',
                subTitle: '',
                action: 'delete',
                enabled: this._canAdd()
            }),
            new MenuAction({
                type: 'divider',
                title: '',
                enabled: this._canAdd()
            })
        ];
    }

    _loadServizio() {
        if (this.sid) {
        this.service = null;
        this._spin++;
        this.apiService.getDetails('servizi', this.sid, 'grant').subscribe({
            next: (grant: any) => {
                this._grant = grant;
                console.log('grant', this._grant);
                this.apiService.getDetails('servizi', this.sid).subscribe({
                    next: (response: any) => {
                        this.service = response;
                        this._isDominioEsterno = this.service.dominio.soggetto_referente.organizzazione.esterna || false;
                        this._initBreadcrumb();
                        this._initRuoli();
                        this._initOtherActionMenu();

                        if (this.servizioApi) {
                            this.eventsManagerService.broadcast('INIT_DATA');
                        }
                        this._spin--;
                        this._updateMapper = new Date().getTime().toString();
                    },
                    error: (error: any) => {
                        Tools.OnError(error);
                    }
                });
            },
            error: (error: any) => {
                Tools.OnError(error);
                this._spin--;
            }
        });
        }
    }

    _loadServiceApi() {
        if (this.id) {
            this._isModify = true;
            this.servizioApi = null;
            this._spin++;
            this.apiService.getDetails(this.model, this.id).subscribe({
                next: (response: any) => {
                    this.servizioApiResponse = JSON.parse(JSON.stringify(response));
                    this.servizioApi = response; // new ServizioApi({ ...response });
                    this._servizioApi = new ServizioApiCreate({ ...response });
                    this._hasSpecifica = (this.servizioApi?.configurazione_collaudo?.specifica !== undefined);
                    this._initForm({ ...this._servizioApi });

                    if (this.service) {
                        this.eventsManagerService.broadcast('INIT_DATA');
                    }

                    this._initBreadcrumb();
                    this._spin--;

                    this.__disableUrlFields(this._formGroup.controls);
                },
                error: (error: any) => {
                    this._spin--;
                    Tools.OnError(error);
                }
            });
        }
    }

    _initData(isInit: boolean = false) {
        if (this.service && this.servizioApi) {
            const controls: any = this._formGroup.controls;

            this.__changeRuolo({ value: this.servizioApi.ruolo }, isInit);
            controls.descrittore.setValue(this.servizioApi.configurazione_collaudo?.specifica || '');
            this._newDescrittore = false;
            this.__descrittoreChange(this.servizioApi.configurazione_collaudo?.specifica || '', isInit);
            if (this.servizioApi.gruppi_auth_type?.length !== 0) {
                const _authTypes: ApiAuthTypeGroup[] = this.servizioApi.gruppi_auth_type || [];
                this._risorseSelected = [];
                this._authSelected = [];
                _authTypes.map((auth: any) => {
                    (auth.resources || []).forEach((r: string) => this._risorseSelected.push(r));
                    this._authSelected.push(auth.profilo);
                    const _profile = this._profili.find((item: any) => item.codice_interno === auth.profilo);
                    if (_profile?.auth_type.includes('pdnd')) {
                        this._isPDND = true;
                    }
                });
                this._setAuthsArray(_authTypes);
                this._customAuthOrig = (_authTypes.length > 1);

                this._updateAuthTypesSelected();
                this._initProprietaCustom();
            }
            this._formGroup.updateValueAndValidity();

            this._initProfiliFilterred();
        }
    }

    _initBreadcrumb() {
        const _nome: string = this.service ? this.service.nome : null;
        const _versione: string = this.service ? this.service.versione : null;
        const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
        const _api = this.servizioApi;
        const _titleAPI = _api ? `${_api.nome} v. ${_api.versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');

        let title = (_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...';
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
            { label: `${_titleAPI}`, url: ``, type: 'link', tooltip: '' }
        ];

        if(this._componentBreadcrumbs){
            this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
        }
    }
    
    _editServizioApi() {
        this._initForm({ ...this._servizioApi });
        this._initData();
        setTimeout(() => {
            this._isEdit = true;
            this._error = false;
            this.showHistory = false;
            const controls: any = this._formGroup.controls;
            this._formGroup.updateValueAndValidity();
            this.__disableUrlFields(controls);
        }, 100);
    }

    _onClose() {
        this.close.emit({ id: this.id, servizioApi: this._servizioApi });
    }

    _onSave() {
        this.save.emit({ id: this.id, servizioApi: this._servizioApi });
    }

    _onCancelEdit() {
        this._isEdit = false;
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
        this._customAuth = this._customAuthOrig;
        if (this._isNew) {
            if (this._useRoute) {
                if (this._componentBreadcrumbs) {
                    this.router.navigate(['servizi', this._componentBreadcrumbs.service.id_servizio, 'componenti', this.sid, 'api']);
                } else {
                    this.router.navigate(['servizi', this.sid, 'api']);
                }
            } else {
                this.close.emit({ id: this.id, servizioApi: null });
            }
        } else {
            this.servizioApi = JSON.parse(JSON.stringify(this.servizioApiResponse));
            this._servizioApi = new ServizioApiCreate({ ...this.servizioApi });
            this._hasSpecifica = (this.servizioApi?.configurazione_collaudo?.specifica !== undefined);
            this._initForm({ ...this._servizioApi });
            this._initData();
        }
    }

    onBreadcrumb(event: any) {
        if (this._useRoute) {
            this.router.navigate([event.url]);
        } else {
            this._onClose();
        }
    }

    _downloadServizioApiExport() {
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

    _downloadSpecifica(versione: number = 0) {
        this.__resetError();
        this._downloading = true;
        let aux: any;
        if (versione && versione > 0) {
            aux = this.utils._queryToHttpParams({ versione: versione });
        }
        this.apiService.download(this.model, this.id, `specifica/download`, aux).subscribe({
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

    _downloadHistory(item: IHistory) {
        this._downloadSpecifica(item.versione);
    }

    toggleHistorical() {
        this.showHistory = !this.showHistory;
    }

    __changeRuolo(event: any, isInit: boolean = false) {
        const controls = this._formGroup.controls;
        const _ruolo: string = controls.ruolo.value;

        setTimeout(() => {
            this.__resetGAT();
            this.__checkAutenticazione(_ruolo);

            if (controls.protocollo.value && controls.ruolo.value === this.EROGATO_SOGGETTO_DOMINIO) {
                if (!isInit) { this.__loadRisorse(); }
            } else {
                this._resetProprietaCustom();
            }
        }, 100);
    }

    __checkAutenticazione(ruolo: string) {
        const controls: any = this._formGroup.controls;
        if (ruolo === this.EROGATO_SOGGETTO_DOMINIO) {
            this.__checkAmbiente(controls);
        } else {
            this.__disableAmbiente(controls);
        }
        this._formGroup.updateValueAndValidity();
    }

    __checkAmbiente(controls: any) {
        const _notModifiableFields = this.authenticationService._getClassesNotModifiable('servizio', 'api', this.service.stato);
        const _mandatoryFields = this.authenticationService._getFieldsMandatory('servizio', 'api', this.service.stato);

        _mandatoryFields.forEach((field: string) => {
            if (controls[field]) {
                controls[field].setValidators([Validators.required]);
            }
        });

        if (!this._isNew) {
            _notModifiableFields.forEach((field: string) => {
                if (controls[field]) {
                    controls[field].disable();
                }
            });
        }
        
        this._formGroup.updateValueAndValidity();
    }

    __disableAmbiente(controls: any) {
        this.__disableUrlFields(controls);
        controls.authTypes.disable();
        controls.authTypes.clearValidators();
        this._formGroup.updateValueAndValidity();
    }

    __disableUrlFields(controls: any){
        controls.url_produzione.setValue(null);
        controls.url_produzione.disable();
        controls.url_produzione.clearValidators();
        controls.url_collaudo.setValue(null);
        controls.url_collaudo.disable();
        controls.url_collaudo.clearValidators();
        this._formGroup.updateValueAndValidity();
    }

    __protocolloChange() {
        if (!this._hasSpecifica) {
            this._setAuthsArrayWithoutSpecification();
        }

        if (this._descrittoreCtrl.value) {
            this._descrittoreCtrl.setValue('');
            if (this.des) {
                this.des.reset();
            }
            this.__resetGAT();
        }
    }

    __resetGAT() {
        this._risorseSelected = [];
        this._authSelected = [];
    }
    
    _onDescrittoreChange(value: any) {
        this._newDescrittore = true;
        this.__descrittoreChange(value);
    }

    __descrittoreChange(value: any, isInit: boolean = false) {
        this.__resetGAT();

        const controls = this._formGroup.controls;
        controls.filename.patchValue(value ? value.file : null);
        controls.estensione.patchValue(value ? value.type : null);
        controls.content.patchValue(value ? value.data : null);
        controls.uuid.patchValue(value ? value.uuid : null);
        this._formGroup.updateValueAndValidity();
        if (value && controls.protocollo.value && controls.ruolo.value === this.EROGATO_SOGGETTO_DOMINIO && !isInit) {
            this.__loadRisorse();
        }
    }

    __loadRisorse() {
        this.__resetError();
        const controls = this._formGroup.controls;
        const _apiType: string = controls.protocollo.value;
        const _contentType: string = controls.estensione.value ? controls.estensione.value : null;
        const _document: string = controls.content.value;
        const _uuid: string = controls.uuid.value;
        if (_apiType && (_document || _uuid)) {
            const _body: any = {
                api_type: _apiType,
                document: {}
            };
            if (_document) {
                _body.document.type = 'inline';
                _body.document.content_type = _contentType;
                _body.document.document = _document;
            } else {
                _body.document.type = 'uuid';
                _body.document.uuid = _uuid;
            }
            this._loadingRisorse = true;
            this.apiService.saveElement('tools/lista-risorse-api', _body).subscribe({
                next: (response: any) => {
                    this._risorseOrig = response;
                    const _dominio = this.service.dominio?.nome;
                    const _soggetto = this.service.dominio?.soggetto_referente?.nome;
                    this._profiliFiltered = this._profili.filter((item: any) => {
                        const _isCompatibile = (item.compatibilita === undefined) || (item.compatibilita === _apiType);
                        let _hasSoggetto = (item.soggetti === undefined);
                        let _hasDomini = (item.domini === undefined);
                        let _hasTipoDominio = (item.tipo_dominio === undefined);
                        if (!_hasDomini && item.domini) {
                            _hasDomini = item.domini.includes(_dominio);
                        }
                        if (!_hasSoggetto && item.soggetti) {
                            _hasSoggetto = item.soggetti.includes(_soggetto);
                        }
                        if (!_hasTipoDominio && item.tipo_dominio) {
                            _hasTipoDominio = this._isDominioEsterno ? (item.tipo_dominio === 'esterno') : (item.tipo_dominio === 'interno');
                        }
                        return _isCompatibile && _hasSoggetto && _hasDomini && _hasTipoDominio;
                    });
                    this._loadingRisorse = false;
                    if (this._isNew) {
                        this._autoSelectAllResurces(response);
                    }
                },
                error: (error: any) => {
                    this._error = true;
                    this._errorMsg = Tools.GetErrorMsg(error);
                    this._risorse = [];
                    this._descrittoreCtrl.setValue('');
                    if (this.des) {
                        this.des.reset();
                    }
                    this._loadingRisorse = false;
                }
            });
        }
    }

    __compareWith(el: any, item: any): boolean {
        return (item && el.code === item.code);
    }

    __onRemove(event: any) {
        this._risorseSelected = this._risorseSelected.filter((s: string) => {
            return ((event.target.resources || []).indexOf(s) === -1);
        });
        this._authSelected = this._authSelected.filter((at: string) => {
            return (event.target.profilo !== at);
        });
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
    }

    _autoSelectAllResurces(resource: string[]) {
        this.__resetError();
        if (resource.length !== 0) {
            this._risorseSelected = _.union(this._risorseSelected, resource);

            const _auth = {
                profilo: '',
                resources: resource,
                note: ''
            };
            this._setAuthsArray([ _auth ]);
        }
    }

    _initProfiliFilterred() {
        const controls = this._formGroup.controls;
        const _apiType: string = controls.protocollo.value;
        const _dominio = this.service.dominio?.nome;
        const _soggetto = this.service.dominio?.soggetto_referente?.nome;

        this._profiliFiltered = this._profili.filter((item: any) => {
            const _isCompatibile = (item.compatibilita === undefined) || (item.compatibilita === _apiType);
            let _hasSoggetto = (item.soggetti === undefined);
            let _hasDomini = (item.domini === undefined);
            let _hasTipoDominio = (item.tipo_dominio === undefined);
            if (!_hasDomini && item.domini) {
                _hasDomini = item.domini.includes(_dominio);
            }
            if (!_hasSoggetto && item.soggetti) {
                _hasSoggetto = item.soggetti.includes(_soggetto);
            }
            if (!_hasTipoDominio && item.tipo_dominio) {
                _hasTipoDominio = this._isDominioEsterno ? (item.tipo_dominio === 'esterno') : (item.tipo_dominio === 'interno');
            }
            return _isCompatibile && _hasSoggetto && _hasDomini && _hasTipoDominio;
        });
    }

    _setAuthsArrayWithoutSpecification() {
        this.__resetError();
        this.__resetGAT();

        this._initProfiliFilterred();

        this._loadingRisorse = true;
        setTimeout(() => {
            const _auth = {
                profilo: '',
                resources: ['/dummy'],
                note: ''
            };
            this._setAuthsArray([ _auth ]);
            this._loadingRisorse = false;
        }, 0);
    }

    _hasControlCustomPropertiesError(name: string, index: number) {
        return (this.cfgc(index)[name].errors && this.cfgc(index)[name].touched);
    }

    _hasControlCustomPropertiesValue(name: string, index: number) {
        return (this.cfgc(index)[name] && this.cfgc(index)[name].value);
    }

    // customFormGroup

    afg(index: number) {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        return _authGroupCntrl;
    }

    afgc(index: number) {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        return _authGroupCntrl.controls;
    }

    cfg(index: number) {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        const _customPropertiesCntrl: FormGroup = _authGroupCntrl.controls['customProperties'] as FormGroup;
        return _customPropertiesCntrl;
    }

    // customFormGroupControls
    cfgc(index: number): { [key: string]: AbstractControl } {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        const _customPropertiesCntrl: FormGroup = _authGroupCntrl.controls['customProperties'] as FormGroup;
        return _customPropertiesCntrl.controls;
    }

    cfgcName(index: number, name: string) {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        const _customPropertiesCntrl: FormGroup = _authGroupCntrl.controls['customProperties'] as FormGroup;
        return _customPropertiesCntrl.controls[name];
    }

    _getProfilo(cod: string) {
        return this._profili.find((item: any) => item.codice_interno === cod);
    }

    _getProfiloLabelMapper = (cod: string) => {
        const _profilo = this._profili.find((item: any) => item.codice_interno === cod);
        return _profilo ? _profilo.etichetta : cod;
    }

    _getProfiloProprietaValue(index: number) {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        return _authGroupCntrl.controls.profilo.value;
    }

    _getProfiloAuthType(index: number) {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        const ac: any = _authGroupCntrl.controls.profilo.value;
        return this._getProfilo(ac)?.auth_type || '';
    }

    _getAllProfileValues() {
        const profiles: string[] = [];
        for (let i = 0; i < this.authTypesArray().length; i++) {
            const _authGroupCntrl: FormGroup = this.authTypesArray().at(i) as FormGroup;
            profiles.push(_authGroupCntrl.controls.profilo.value);
        }
        return profiles;
    }

    _onChangeProfilo(event: any, index: number = -1) {
        this._removeCustomControls(index);

        this._markAsteriskUpdated = false;

        const profilo_codice_interno = this._getProfiloProprietaValue(index);
        this._isPDND = profilo_codice_interno?.includes('PDND') || false;

        this._markAsteriskUpdated = true;

        this._updateAuthTypesSelected();
        this._initProprietaCustom();
    }

    _removeCustomControls(index: number = -1) {
        if (index >= 0) {
            const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
            _authGroupCntrl.removeControl('customProperties');
            this._formGroup.updateValueAndValidity();
        }
    }

    _createAuthGroup(data: any) {
        const _auth: any = {
            profilo: [data.profilo, [Validators.required]],
            resources: [data.resources, [Validators.required]],
            note: [data.note]
        };

        const _customProperties = this._getProfilo(data.profilo)?.proprieta_custom || [];

        if (_customProperties.length) {
            const _cpf: any = {};
            _customProperties.forEach((item: any) => {
                const _validators = [];
                if (item.required) { _validators.push(Validators.required); }
                if (item.regular_expression) { _validators.push(Validators.pattern(item.regular_expression)); }
                const p = data.proprieta_custom.find((p: any) => p.nome === item.nome );
                const _value = p?.valore || '';
                _cpf[item.nome] = [_value, [..._validators] ];
            });
            
            _auth.customProperties = this.formBuilder.group(_cpf);
        }

        return this.formBuilder.group(_auth);
    }

    _removeAuthGroup(index: number = -1) {
        if (index >= 0) {
            const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
            const _deletedResources = _authGroupCntrl.controls.resources.value;
            this._risorseSelected = this._risorseSelected.filter((i: string) => !_deletedResources.filter((y: string) => y === i).length);
            this.authTypesArray().removeAt(index);
            this._updateResources = new Date().getTime().toString();
        }
    }

    _setAuthsArray(auths: any[]) {
        this._formGroup.removeControl('authTypes');

        let transformedAuths = auths.map((auth: any) => this._createAuthGroup(auth));

        const _aba = this.formBuilder.array(transformedAuths);
        this._formGroup.addControl('authTypes', _aba);
    }

    _openChoiceModal(list: any[], selected: any[], index: number) {
        const initialState = {
            list: list,
            selected: selected,
        };
        this.modalChoiceRef = this.modalService.show(ModalChoicesComponent, {
            ignoreBackdropClick: true,
            class: 'modal-with-65',
            initialState: initialState
        });
        this.modalChoiceRef.content.onClose.subscribe(
            (result: any) => {
                const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
                const _oldResources = _authGroupCntrl.controls.resources.value;
                const _newResources = this._risorseSelected.filter((i: string) => !_oldResources.filter((y: string) => y === i).length);
                _authGroupCntrl.controls.resources.setValue(result);
                this._risorseSelected = _.union(_newResources, result);
                this._updateResources = new Date().getTime().toString();
            }
        );
    }

    _changeResources(index: number) {
        const _authGroupCntrl: FormGroup = this.authTypesArray().at(index) as FormGroup;
        const resources: any = _authGroupCntrl.controls.resources.value;

        const _risorseFiltered = this._risorseOrig.filter((el: string) => {
            return (this._risorseSelected.indexOf(el) === -1) || ( resources.indexOf(el) !== -1);
        });

        this._openChoiceModal(_risorseFiltered, resources, index);
    }

    authTypesArray(): FormArray {
        return this._formGroup.get('authTypes') as FormArray;
    }

    _onToggleCustomAuth() {
        this._customAuth = !this._customAuth;
    }

    _onResetCustomAuth() {
        if ( this._customAuthAdded ) {
            const _authArray: FormArray = this.authTypesArray();
            _authArray.clear();
            this._autoSelectAllResurces(this._risorseOrig);
            this._customAuthAdded = false;
        }
        this._customAuth = false;
    }

    _onAddCustomAuth() {
        const _auth = {
            profilo: '',
            resources: [],
            note: ''
        };

        const authTypesArray = this.authTypesArray();
        authTypesArray.push(this._createAuthGroup(_auth));
        this._customAuthAdded = true;
    }

    _geControlResourcest(index: number) {
        const controls: any = this._formGroup.controls;
        const _authGroup = controls.authTypes.value[index];
        return _authGroup.resources;
    }

    _canAddAuthentication() {
        return (this._risorseSelected.length !== this._risorseOrig.length);
    }

    _canAddAuthenticationMapper = (): boolean => {
        return this._canAddAuthentication();
    }

    _isGestore() {
        return this.authenticationService.isGestore(this._grant?.ruoli);
    }

    _canEditMapper = (): boolean => {
        return this.authenticationService.canEdit('servizio', 'api', this.service?.stato || '', this._grant?.ruoli);
    }

    _canJoin() {
        return this.authenticationService.canJoin('servizio', this.service?.stato);
    }

    _canJoinMapper = (): boolean => {
        return this._canJoin();
    }

    _canAdd() {
        return this.authenticationService.canAdd('servizio', this.service?.stato, this._grant?.ruoli);
    }

    _canAddMapper = (): boolean => {
        return this._canAdd();
    }

    _canEditFieldMapper = (field: string): boolean => {
        return this.authenticationService.canEditField('servizio', 'api', this.service?.stato || '', field, this._grant?.ruoli);
    }

    _hasPDNDConfiguredMapper = (): boolean => {
        let _hasPDND: boolean = false;
        let _index: number = -1;

        if(!this.servizioApi?.gruppi_auth_type){
            return _hasPDND;
        }

        this.servizioApi.gruppi_auth_type.map((auth: any) => {
            const _profile = this._profili.find((item: any) => item.codice_interno === auth.profilo);
            if (_profile.auth_type.includes('pdnd')) {
                if (this.servizioApi?.proprieta_custom?.length) {
                    _index = this.servizioApi.proprieta_custom?.findIndex((item: any) => item.gruppo === 'PDNDProduzione');
                    if (_index !== -1) {
                        const _property = this.servizioApi.proprieta_custom[_index].proprieta.find((item: any) => item.nome === 'identificativo_eservice_pdnd');
                        _hasPDND = _property ? !!_property.valore : false;
                    }
                    if (!_hasPDND) {
                        _index = this.servizioApi.proprieta_custom?.findIndex((item: any) => item.gruppo === 'PDNDCollaudo');
                        if (_index !== -1) {
                            const _property = this.servizioApi.proprieta_custom[_index].proprieta.find((item: any) => item.nome === 'identificativo_eservice_pdnd');
                            _hasPDND = _property ? !!_property.valore : false;
                        }
                    }
                }
            }
        });

        return _hasPDND;
    }

    // API Proprietà custom

    acfg() {
        return this._formGroup.controls['proprieta_custom'] as FormGroup;
    }

    acfgc(group_name: string) {
        return (this._formGroup.controls['proprieta_custom'] as FormGroup).get(group_name) as FormGroup;
    }

    _hasControlApiCustomPropertiesError(group_name: string, name: string) {
        return (this.acfgc(group_name).controls[name].errors && this.acfgc(group_name).controls[name].touched);
    }

    _hasControlApiCustomPropertiesValue(name: string) {
        return (this.acfg().controls[name] && this.acfg().controls[name].value);
    }

    _resetProprietaCustom() {
        this._formGroup.removeControl('proprieta_custom');
        this._apiProprietaCustom = [];
        this._apiProprietaCustomGrouped = [];
    }

    _getGroupLabelMapper = (group: any): string => {
        const _srv: any = Tools.Configurazione?.servizio;
        let _proprietaCustom = (_srv && _srv.api) ? _srv.api.proprieta_custom.filter((p: any) => p.classe_dato !== 'produzione') : [];
        if (!this._isNew){
            _proprietaCustom = _proprietaCustom.filter((p: any) => p.classe_dato !== 'collaudo');
        }
        let labelGroup = _proprietaCustom.find((item: any) => item.nome_gruppo === group)?.label_gruppo;
        if (!labelGroup) {
            labelGroup = _proprietaCustom.find((item: any) => item.label_gruppo === group)?.label_gruppo;
        }
        return labelGroup;
    }

    _initProprietaCustom() {
        const fieldToGroup = 'label_gruppo';

        this._resetProprietaCustom();

        const profiles = this._getAllProfileValues();

        const _srv: any = Tools.Configurazione?.servizio;
        const profili: Profile[] = _srv.api?.profili.filter((p: any) => profiles.includes(p.codice_interno));

        let _proprietaCustom = (_srv && _srv.api) ? _srv.api.proprieta_custom.filter((p: any) => p.classe_dato !== 'produzione') : [];

        if (!this._isNew){
            _proprietaCustom = _proprietaCustom.filter((p: any) => p.classe_dato !== 'collaudo');
        }

        _proprietaCustom.forEach((item: any) => {
            if (item.profili && !item.profili.some((p: string) => profili.some((pr: Profile) => pr.codice_interno === p))) {
                return;
            }

            if (item.auth_type && !item.auth_type.some((auth_type: string) => profili.some((pr: Profile) => pr.auth_type === auth_type))) {
                return;
            }

            // const _gruppo = item.nome_gruppo;
            const _gruppo = item[fieldToGroup];
            const _ruoli_abilitati = item.ruoli_abilitati;
            item.proprieta.sort((a: any, b: any) => a.index - b.index).forEach((proprieta: any) => {
                this._apiProprietaCustom.push({
                    nome_gruppo: _gruppo,
                    classe_dato: item.classe_dato,
                    ...proprieta,
                    ruoli_abilitati: _ruoli_abilitati ? [ ..._ruoli_abilitati ] : undefined
                });
            });
        });
        this._apiProprietaCustomGrouped = _.groupBy(this._apiProprietaCustom, 'nome_gruppo');

        const filtered = this.filtraCampiPerRuoli(this._apiProprietaCustomGrouped, this._grant?.ruoli || []);

        const mandatoryFields = this.authenticationService._getFieldsMandatory('servizio', 'api', this.service.stato);
        const genericoCustomPropertiesAreMandatory = mandatoryFields.some((item: string) => item === 'generico');
        const collaudoCustomPropertiesAreMandatory = mandatoryFields.some((item: string) => item === 'collaudo');

        if (this._apiProprietaCustom.length) {
            this._formGroup.addControl('proprieta_custom', this.formBuilder.group({}));

            Object.keys(filtered).forEach((key: any) => {
                (filtered[key] || []).forEach((item: any) => {
                    const _validators = [];

                    let required = false;

                    if (item.classe_dato === 'generico' && genericoCustomPropertiesAreMandatory) {
                        required = item.required;
                    }

                    if (item.classe_dato === 'collaudo' && collaudoCustomPropertiesAreMandatory) {
                        required = item.required;
                    }

                    if (required) { _validators.push(Validators.required); }
                    if (item.regular_expression) { _validators.push(Validators.pattern(item.regular_expression)); }

                    this.proprietaCustom.addControl(item.nome_gruppo, this.formBuilder.group({}));

                    const _gruppo = this._servizioApi.proprieta_custom?.find((pc: any) => {
                        return (pc.gruppo === item.nome_gruppo);
                    });
                    const _value = _gruppo?.proprieta.find((p: any) => p.nome === item.nome );
                    let _val = _value ? _value.valore : null;
                    if (!this._servizioApi.proprieta_custom?.length && (item.tipo === 'select')) {
                        const _defaultItem = item.valori.find((item: any) => item.default);
                        _val =_defaultItem?.nome || null;
                    }

                    const group = this.proprietaCustom.get(item.nome_gruppo) as FormGroup;
                    group.addControl(item.nome, new FormControl(_val, [..._validators]));
                });
            });
            this._apiProprietaCustomGrouped = { ...filtered };
        }

        this._updateMapper = new Date().getTime().toString();
    }

    filtraCampiPerRuoli(data: GruppiCampi, ruoliUtente: string[]): GruppiCampi {
        const risultatoFiltrato: GruppiCampi = {};

        for (const [nomeGruppo, campi] of Object.entries(data)) {
            const campiFiltrati = campi.filter(campo => {
                if (!campo.ruoli_abilitati || campo.ruoli_abilitati.length === 0) {
                    return true; // campo visibile a tutti
                }

                return campo.ruoli_abilitati.some(ruolo => ruoliUtente.includes(ruolo));
            });

            if (campiFiltrati.length > 0) {
                risultatoFiltrato[nomeGruppo] = campiFiltrati;
            }
        }

        return risultatoFiltrato;
    }

    get proprietaCustom(): FormGroup {
        return this._formGroup.get('proprieta_custom') as FormGroup;
    }

    _updateAuthTypesSelected() {
        this._authTypesSelected = [];
        this._formGroup.value['authTypes'].forEach((item: any) => {
        const _index = this._profili.findIndex((p: any) => { return (p.codice_interno === item.profilo); });
        if (_index !== -1) {
            this._authTypesSelected.push(this._profili[_index].auth_type);
        }
        });
        this._authTypesSelected = _.uniq(this._authTypesSelected);
    }

    _hasIdentificativoeServicePDND() {
        const _eserviceId = this.acfg() ? this._hasControlApiCustomPropertiesValue('identificativo_eservice_pdnd') : null;
        return (_eserviceId !== null);
    }

    _hasIdentificativoeServicePDNDMapper = (): boolean => {
        return this._hasIdentificativoeServicePDND();
    }

    _getCustomSelectLabelMapper = (cod: string, name: string, group: string) => {
        const _srv: any = Tools.Configurazione?.servizio;
        const _proprietaCustom = (_srv && _srv.api) ? _srv.api.proprieta_custom : [];
        const _group = _proprietaCustom.find((item: any) => item.nome_gruppo === group);
        const _pItem = _group.proprieta.find((item: any) => item.nome === name);
        const _label = _pItem.valori.find((item: any) => item.nome === cod)?.etichetta;

        return _label || cod;
    }

    _showAllegati() {
        this.router.navigate(['allegati'], { relativeTo: this.route });
    }

    _showPDNDConfiguration() {
        const _queryParams = { };
        if (this._componentBreadcrumbs) {
            this.router.navigate(
                ['servizi', this._componentBreadcrumbs.service.id_servizio, 'componenti', this.sid, 'api', this.id, 'pdnd-configuration'],
                { queryParams: _queryParams }
            );
            } else {
            this.router.navigate(
                ['servizi', this.sid, 'api', this.id, 'pdnd-configuration'],
                { queryParams: _queryParams }
            );
        }
    }

    _showPDND() {
        const _soggetto = this.service.dominio.soggetto_referente.nome;
        const _index = this._pdnd.findIndex((item: any) => item.nome_soggetto === _soggetto);
        if (_index !== -1) {
            const _pdnd = this._pdnd[_index];
            const _queryParams = {
                producerIdCollaudo: _pdnd.collaudo.id_producer,
                producerIdProduzione: _pdnd.produzione.id_producer
            };
            if (this._componentBreadcrumbs) {
                this.router.navigate(
                    ['servizi', this._componentBreadcrumbs.service.id_servizio, 'componenti', this.sid, 'api', this.id, 'subscribers'],
                    { queryParams: _queryParams }
                );
            } else {
                this.router.navigate(
                    ['servizi', this.sid, 'api', this.id, 'subscribers'],
                    { queryParams: _queryParams }
                );
            }
        }
    }

    _showGeneralInformationsPDND() {
        const _soggetto = this.service.dominio.soggetto_referente.nome;
        const _index = this._pdnd.findIndex((item: any) => item.nome_soggetto === _soggetto);
        if (_index !== -1) {
            const _pdnd = this._pdnd[_index];
            const _queryParams = {
                producerIdCollaudo: _pdnd.collaudo.id_producer,
                producerIdProduzione: _pdnd.produzione.id_producer
            };
            if (this._componentBreadcrumbs) {
                this.router.navigate(
                    ['servizi', this._componentBreadcrumbs.service.id_servizio, 'componenti', this.sid, 'api', this.id, 'pdnd-informations'],
                    { queryParams: _queryParams }
                );
            } else {
                this.router.navigate(
                    ['servizi', this.sid, 'api', this.id, 'pdnd-informations'],
                    { queryParams: _queryParams }
                );
            }
        }
    }

    onActionMonitor(event: any) {
        switch (event.action) {
            case 'delete':
                this._confirmDelection();
                break;
            case 'download_service_api':
                this._downloadServizioApiExport();
                break;
            case 'backview':
                const url = `/servizi/${this.service.id_servizio}/view`;
                this.router.navigate([url]);
                break;
            default:
                break;
        }
    }

    _showMandatoryFields(controls: any) {
        if (this.debugMandatoryFields) {
            console.group('Mandatory fields')
            let _nessuno: boolean = true;
            Object.keys(controls).forEach((key, index) => {
                if (controls[key].hasValidator(Validators.required)) {
                    console.log(index + ') ', key)
                    _nessuno = false
                }
            });
            (_nessuno == true) ? console.log('NESSUN CAMPO OBBLIGATORIO') : null;
            console.groupEnd();
        }
    }

    _goToProductionConfiguration(){
        this.router.navigate(['servizi', this.sid, 'api', this.id, 'configuration', 'produzione']);
    }

    _goToTestingConfiguration(){
        this.router.navigate(['servizi', this.sid, 'api', this.id, 'configuration', 'collaudo']);
    }

    getFieldsStatus(): string[] {
        const controls: any = this._formGroup.controls;
        return Object.getOwnPropertyNames(controls).map(function(c){
            const f = controls[c]; 
            return`${c} - ${f.valid} - ${f.status}`;
        });
    }
}
