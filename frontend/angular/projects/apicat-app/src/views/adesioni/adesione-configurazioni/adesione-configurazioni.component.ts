import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { SearchBarFormComponent } from 'projects/components/src/lib/ui/search-bar-form/search-bar-form.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { YesnoDialogBsComponent } from 'projects/components/src/lib/dialogs/yesno-dialog-bs/yesno-dialog-bs.component';

import { Page } from '@app/models/page';

import { Observable, Subject, Subscription, forkJoin } from 'rxjs';

import { Grant, RightsEnum } from '@app/model/grant';

import { Datispecifici, PeriodEnum } from './datispecifici';
import { DatiSpecItem } from './datispecifici';
import { CommonName } from './datispecifici';
import { DoubleCert } from './datispecifici';

import { Erogazioni } from './erogazioni';
import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';

enum TipoClientEnum {
    Nuovo = 'nuovo',
    Riferito = 'riferito',
    Proposto = 'proposto'
}

enum SelectedClientEnum {
    NuovoCliente = 'nuovoClient',
    UsaClientEsistente = 'usaClientEsistente',
    Default = ''
}

enum StatoConfigurazioneEnum {
    CONFIGURATO = 'configurato',
    NONCONFIGURATO = 'Non configurato',
    CONFIGINPROGRESS = 'config_in_progress'
}

const fake_tipoCertificatoEnum = [
    { 'nome': 'fornito', 'value': 'fornito'}, 
    { 'nome': 'richiesto_cn', 'value': 'richiesto_cn'}, 
    { 'nome': 'richiesto_csr', 'value': 'richiesto_csr'}
];

const fake_credenziali = [
    {'nome': 'Nuove credenziali'}, 
    {'nome': 'client_modi_p1'}, 
    {'nome': 'client_modi_p2'}
];

declare const saveAs: any;
import * as _ from 'lodash';

@Component({
    selector: 'app-adesione-configurazioni',
    templateUrl: 'adesione-configurazioni.component.html',
    styleUrls: ['adesione-configurazioni.component.scss']
})
export class AdesioneConfigurazioniComponent implements OnInit, AfterContentChecked, OnDestroy {
    static readonly Name = 'AdesioneConfigurazioniComponent';
    readonly model: string = 'adesioni';

    @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
    @ViewChild('editClients') editClients!: any;
    @ViewChild('editErogazioni') editErogazioni!: any;

    id: number = 0;

    Tools = Tools;

    config: any;
    adesioniClientsConfig: any;
    adesioniErogazConfig: any;

    id_erogazione: any = null;

    adesione: any = null;
    adesioneConfigClients: any[] = [];
    adesioneConfigErogazioni: any[] = [];
    _listaClient: any[] = [];
    _paging: Page = new Page({});
    _links: any = {};
    // _pagingErogaz: Page = new Page({});
    // _linksErogaz: any = {};

    _isEdit: boolean = false;
    _currClient: any = null;
    _currDatiSpecifici: any = null;

    _hasFilter: boolean = false;
    _formGroup: UntypedFormGroup = new UntypedFormGroup({});
    _filterData: any[] = [];

    _preventMultiCall: boolean = false;
    _isConfigClients: boolean = true;

    _currentTab: string = 'clients'; // clients | erogazioni | ...proprieta_custom.nome_gruppo
    _currentTabCustom: any = null;

    _spin: boolean = false;
    desktop: boolean = false;

    _useRoute : boolean = false;
    _useDialog : boolean = true;

    _message = 'APP.MESSAGE.ChooseEnvironment';
    _messageHelp = 'APP.MESSAGE.ChooseEnvironmentHelp';

    _error: boolean = false;
    _errorMsg: string = '';

    showHistory: boolean = true;
    showSearch: boolean = true;
    showSorting: boolean = true;

    sortField: string = 'date';
    sortDirection: string = 'asc';
    sortFields: any[] = [];

    searchFields: any[] = [];

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' },
        { label: '...', url: '', type: 'title' },
        { label: 'APP.TITLE.SubscriptionConfigurations', url: '', type: 'title' }
    ];

    _modalEditRef!: BsModalRef;
    _modalConfirmRef!: BsModalRef;

    _editFormGroupClients: FormGroup = new FormGroup({});
    _editFormGroupErogazioni: FormGroup = new FormGroup({});
    _descrittoreCtrl: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr_modulo: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_firma: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr_firma: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr_modulo_firma: FormControl = new FormControl('', [Validators.required]);

    minLengthTerm: number = 1;
    referenti$!: Observable<any[]>;
    referentiInput$ = new Subject<string>();
    referentiLoading: boolean = false;
    referentiFilter: string = '';

    anagrafiche: any = {};

    _generalConfig: any = {};

    _collaudo: boolean = true;
    environmentId: string = ''; // collaudo / produzione

    _fake_credenziali: any[] = [];
    _fake_tipoCertificatoEnum: any[] = [];

    _isFornito: boolean = false; 
    _isRichiesto_cn: boolean = false; 
    _isRichiesto_csr: boolean = false;
    _ip_richiesto: boolean = false;
    _show_erogazione_ip_fruizione: boolean = false;
    _show_erogazione_rate_limiting: boolean = false;
    _show_erogazione_finalita: boolean = false;
    _show_nome_proposto: boolean = false;
    _show_client_form: boolean = true;

    _downloading: boolean = false;
    _deleting: boolean = false;

    _tipoAllegati: string = '';
    
    _certificato_csr: any = {};
    _certificato_fornito: any = {};
    _modulo_richiesta_csr: any = {};

    _arr_clients_riuso: any[] = [];

    _auth_type: any = null;
    _tipo_client: any = null;

    _isFornito_firma: boolean = false; 
    _isRichiesto_cn_firma: boolean = false; 
    _isRichiesto_csr_firma: boolean = false;

    _certificato_csr_firma: any = {};
    _certificato_fornito_firma: any = {};
    _modulo_richiesta_csr_firma: any = {};
    _modulo_richiesta_csr_firma_ceritifato: any = {};

    _isNoDati: boolean = false;
    _isIndirizzoIP: boolean = false;
    _isHttpBasic: boolean = false;
    _isOauthAuthCode: boolean = false;
    _isOauthClientCredentials: boolean = false;
    _isHttps: boolean = false;
    _isHttpsSign: boolean = false;
    _isPdnd: boolean = false;
    _isHttpsPdnd: boolean = false;
    _isHttpsPdndSign: boolean = false;
    _isSign: boolean = false;
    _isSignPdnd: boolean = false;

    _codice_interno_profilo: any = null;

    _certificato_cn: any = {};
    _certificato_cn_firma: any = {};

    _grant: Grant | null = null;

    _id_client_riuso: any = null;

    private _currentServiceClient: string = '';

    _serviceBreadcrumbs: ServiceBreadcrumbsData|null = null;

    ratePeriods: any[] = [
        {'value': PeriodEnum.Giorno, 'label': 'APP.LABEL.Giorno'},
        {'value': PeriodEnum.Ora, 'label': 'APP.LABEL.Ora'},
        {'value': PeriodEnum.Minuti, 'label': 'APP.LABEL.Minuto'}
    ];

    configurazioni: any[] = [];
    proprietaCustom: any = null;

    client: any = null;
    showSubscription!: Subscription;
    loadingDialog: boolean = false;

    erogaz: any = null;

    debugMandatoryFields: boolean = false;

    newLayout: boolean = true;
    singleColumn: boolean = false;
    showGroupLabel: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private modalService: BsModalService,
        private translate: TranslateService,
        private configService: ConfigService,
        private apiService: OpenAPIService,
        private authenticationService: AuthenticationService
    ) {
        this.route.data.subscribe((data) => {
            if (!data.serviceBreadcrumbs) return;
            this._serviceBreadcrumbs = data.serviceBreadcrumbs;
            this._initBreadcrumb();
        });

        this.config = this.configService.getConfiguration();
        this.proprietaCustom = this.authenticationService._getConfigModule('adesione').proprieta_custom;
        
        this._initSearchForm();

        if (this.router.getCurrentNavigation()?.extras.state != null) {
            this.adesione = this.router.getCurrentNavigation()?.extras.state;
        }
    }

    @HostListener('window:resize') _onResize() {
        this.desktop = (window.innerWidth >= 992);
    }

    ngOnInit() {    
        this._loadGeneralConfig();
        
        this._fake_credenziali = fake_credenziali;
        this._fake_tipoCertificatoEnum = fake_tipoCertificatoEnum;

        this.route.params.subscribe(params => {
            this._spin = true;

            if (params['id']) {
                this.id = params['id'];

                // ================================
                const _grant: Observable<any> = this.apiService.getDetails(this.model, this.id, 'grant');
                const _adesione: Observable<any> = this.apiService.getDetails(this.model, this.id);
                const _configErogaz: Observable<any> = this.configService.getConfig('adesioniErogaz');
                const _configClients: Observable<any> = this.configService.getConfig('adesioniClients');

                const combined = forkJoin([_grant, _adesione, _configErogaz, _configClients]);
                combined.subscribe(result => {
                    
                    let aux: any = result[0];
                    this._grant = { ...aux };
                    this.adesione = result[1];
                    this.adesioniErogazConfig = result[2];
                    this.adesioniClientsConfig = result[3];

                    console.log('grant', this._grant);

                    if (this.adesione?.stato.includes('produzione')){
                        this._collaudo = false;
                    }

                    this._initBreadcrumb();

                    // this._loadAdesioneConfigErogazioni();
                    // this._loadAdesioneConfigClients();

                    this._spin = false;
                });
            }
        });
    }

    ngOnDestroy() {
        // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
        if (this.showSubscription) {
            this.showSubscription.unsubscribe();
        }
    }

    ngAfterContentChecked(): void {
        this.desktop = (window.innerWidth >= 992);
    }

    public onActionMonitor(event: any) {
        if(event.action == 'backview') {
            this.router.navigate(['../view'], { relativeTo: this.route });
        }
    }

    _initBreadcrumb() {
        const _organizzazione: string = this.adesione ? this.adesione.soggetto.organizzazione.nome : null;
        const _servizio: string = this.adesione ? this.adesione.servizio.nome : '';
        const _versione: string = this.adesione ? this.adesione.servizio.versione : '';
        const _adesione: string = this.adesione ? this.adesione.id_adesione : '';
        const _toolTipAdesione = this.adesione ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.adesione.stato) : '';

        let title = this.adesione ? `${_organizzazione} - ${_servizio} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
        let baseUrl = `/${this.model}`;

        if (this._serviceBreadcrumbs) {
            title = _organizzazione;
            baseUrl = `/servizi/${this._serviceBreadcrumbs.service.id_servizio}/${this.model}`;
        }

        this.breadcrumbs = [
            { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
            { label: title, url: `${baseUrl}/${_adesione}`, type: 'link', tooltip: _toolTipAdesione },
            { label: 'APP.TITLE.SubscriptionConfigurations', url: ``, type: 'link' }
        ];

        if(this._serviceBreadcrumbs){
            this.breadcrumbs.unshift(...this._serviceBreadcrumbs.breadcrumbs);
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
        this._formGroup = new UntypedFormGroup({
            "organization.taxCode": new UntypedFormControl(''),
            creationDateFrom: new UntypedFormControl(''),
            creationDateTo: new UntypedFormControl(''),
            fileName: new UntypedFormControl(''),
            status: new UntypedFormControl(''),
            type: new UntypedFormControl(''),
        });
    }

    _loadAdesione() {
        if (this.id) {
            this.apiService.getDetails(this.model, this.id).subscribe({
                next: (response: any) => {
                    this.adesione = response;
                    this._initBreadcrumb();
                },
                error: (error: any) => {
                    Tools.OnError(error);
                }
            });
        }
    }

    _loadGeneralConfig() {
        this.apiService.getList('configurazione').subscribe({
            next: (response: any) => {
                this._generalConfig = response;
            },
            error: (error: any) => {
                Tools.OnError(error);
            }
        });
    }

    _loadAdesioneConfigClients(query: any = null, url: string = '', ignoreSpin: boolean = false) {
        this._isConfigClients = true;
        this._setErrorMessages(false);
        if (this.id) {
            this._spin = ignoreSpin ? false : true;
            if (!url && !ignoreSpin) { this.adesioneConfigClients = []; }
            let _ambiente: string = this.environmentId;
            // this._collaudo ? _ambiente = 'collaudo' : _ambiente = 'produzione';
            this.apiService.getDetails(this.model, this.id, _ambiente + '/client').subscribe({
                next: (response: any) => {

                    response ? this._paging = new Page(response.page) : null;
                    response ? this._links = response._links || null : null;
            
                    // ============== new =============
                    const _clientsArr: any = [];

                    // clclo sui client_richiesti per sottoscrivere l'adesione
                    _.uniqWith(this.adesione.client_richiesti, _.isEqual).map((item: any) => {

                        // guardo la configurazione (da general config) per il profilo item.profilo
                        const _temp_profilo: any = this._generalConfig.servizio.api.profili.find((pro: any) => { return pro.codice_interno === item.profilo });
                        
                        // guardo se IP è da richiedere oppure no
                        const _temp_auth_type_info: any = this._generalConfig.servizio.api.auth_type.find((pro: any) => { return pro.type === _temp_profilo.auth_type });

                        // verifico se tra i client già associati all'adesione, ce n'è uno definito per l'elemento corrente (item)
                        const _clientAssociato: any = response.content.find((el: any) => {return item.profilo === el.profilo});
                        
                        let _element: any = {
                            id_client: null,
                            codice_interno: null,
                            auth_type: null,
                            stato: null,
                            nome: null,
                            ip_richiesto: null,
                            etichetta: null
                        };

                        _element = { ..._clientAssociato };
                        if (_clientAssociato) {
                            _element.id_client = _clientAssociato.id_client;
                            _element.codice_interno = _clientAssociato.profilo;
                            _element.auth_type = _clientAssociato.dati_specifici?.auth_type || _temp_profilo.auth_type;
                            _element.stato = StatoConfigurazioneEnum.CONFIGURATO;
                            if (_clientAssociato.nome_proposto && !_clientAssociato.nome) {
                                if (this.authenticationService.isGestore(this._grant?.ruoli)) {
                                    _element.stato = StatoConfigurazioneEnum.CONFIGINPROGRESS;
                                } else {
                                    _element.stato = StatoConfigurazioneEnum.NONCONFIGURATO;
                                }
                            }
                            _element.nome = _clientAssociato.nome ||_clientAssociato.nome_proposto;
                            _element.nome_proposto = _clientAssociato.nome_proposto;
                            _element.ip_richiesto = _temp_auth_type_info?.indirizzi_ip || false;
                            _element.etichetta = _temp_profilo.etichetta;
                        } else {
                            _element.id_client = null;
                            _element.codice_interno = item.profilo;
                            _element.auth_type = _temp_profilo.auth_type;
                            _element.stato = StatoConfigurazioneEnum.NONCONFIGURATO;
                            _element.nome = null;
                            _element.nome_proposto = null;
                            _element.ip_richiesto = _temp_auth_type_info?.indirizzi_ip || false;
                            _element.etichetta = _temp_profilo.etichetta;
                        }

                        _clientsArr.push(_element);
                    })
                    // console.log('client richiesti: ', this.adesione.client_richiesti)
                    // console.log(_clientsArr)
                    // ================================

                    const _list: any = _clientsArr.map((client: any) => {
                        const element = {
                            id_client: client.id_client,
                            auth_type: client.auth_type,
                            ip_richiesto: client.ip_richiesto,
                            etichetta: client.etichetta,
                            editMode: false,
                            enableCollapse: false,
                            source: { ...client }
                        };
                        return element;
                    });

                    this.adesioneConfigClients = (url) ? [...this.adesioneConfigClients, ..._list] : [..._list];
                    this._preventMultiCall = false;

                    this.adesioneConfigClients.map((el) => {
                        if (el.source.stato != StatoConfigurazioneEnum.CONFIGURATO) {
                            el.id_client = null;
                            el.source.id_client = null;
                        }
                    })
                    
                    this._spin = false;
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
    }

    _loadAdesioneConfigErogazioni(query: any = null, url: string = '', ignoreSpin: boolean = false) {
        this._isConfigClients = false;
        this._setErrorMessages(false);
        if (this.id) {
            Tools.WaitForResponse(true, false, false);
            if (!url && !ignoreSpin) { this.adesioneConfigErogazioni = []; }
            let _ambiente: string = this.environmentId;
            // this._collaudo ? _ambiente = 'collaudo' : _ambiente = 'produzione';
            this.apiService.getDetails(this.model, this.id, _ambiente + '/erogazioni').subscribe({
                next: (response: any) => {

                    // console.log('adesione: ', this.adesione)
                    // console.log('res. erogazioni: ', response)
                    // console.log('rEROGAZIONI RICHIESTE: ', this.adesione.erogazioni_richieste)

                    // ============== new =============
                    const _erogazioniArr: any = [];

                    // clclo sulle erogaz_richieste per sottoscrivere l'adesione
                    this.adesione.erogazioni_richieste.map((item: any) => {

                        //verifico se tra i client già associati all'adesione, ce una erogazione definita per l'elemento corrente (item)
                        const _erogazioneAssociata: any = response.content.find((el: any) => {return item.api.id_api === el.api.id_api});
                        
                        const _element: any = {
                            codice_asset: null,
                            descrizione: null,
                            id_api: null,
                            nome: null,
                            protocollo: null,
                            protocollo_dettaglio: null,
                            ruolo: null,
                            versione: null,
                            stato: null,
                            specifica: {
                                content_type: null,
                                filename: null,
                                uuid: null
                            },
                            id_erogazione: null,
                            indirizzi_ip: null,
                            url: null
                        }

                        if (_erogazioneAssociata) {
                            _element.codice_asset = _erogazioneAssociata.api.codice_asset,
                            _element.id_api = _erogazioneAssociata.api.id_api,
                            _element.nome = _erogazioneAssociata.api.nome,
                            _element.protocollo = _erogazioneAssociata.api.protocollo,
                            _element.protocollo_dettaglio = _erogazioneAssociata.api.protocollo_dettaglio,
                            _element.ruolo = _erogazioneAssociata.api.ruolo,
                            _element.versione = _erogazioneAssociata.api.versione,
                            _element.stato = StatoConfigurazioneEnum.CONFIGURATO,
                            _element.specifica = _erogazioneAssociata.api.specifica
                            _element.id_erogazione = _erogazioneAssociata.api.id_api
                            _element.indirizzi_ip = _erogazioneAssociata.indirizzi_ip
                            _element.url = _erogazioneAssociata.url
                        } else {
                            _element.codice_asset = item.api?.codice_asset,
                            _element.id_api = item.api?.id_api,
                            _element.nome = item.api?.nome,
                            _element.protocollo = item.api?.protocollo,
                            _element.protocollo_dettaglio = item.api?.protocollo_dettaglio,
                            _element.ruolo = item.api?.ruolo,
                            _element.versione = item.api?.versione,
                            _element.stato = StatoConfigurazioneEnum.NONCONFIGURATO,
                            _element.id_erogazione = item.api?.id_api
                            _element.indirizzi_ip = item.api?.indirizzi_ip
                            _element.url = item.api?.url
                        }

                        _erogazioniArr.push(_element)
                    })
                    // console.log('erogazioni richieste: ', _erogaz_richieste)
                    // console.log('_erogazioniArr: ',_erogazioniArr)
                    // ================================

                    const _list: any = _erogazioniArr.map((erogazioni: any) => {
                        const element = {
                            id_api: erogazioni.id_api,
                            nome: erogazioni.nome,
                            stato: erogazioni.stato,
                            versione: erogazioni.versione,
                            id_erogazione: erogazioni.id_erogazione,
                            indirizzi_ip: erogazioni.indirizzi_ip,
                            url: erogazioni.url,
                            editMode: false,
                            enableCollapse: false,
                            source: { ...erogazioni }
                        };
                        return element;
                    });
                    this.adesioneConfigErogazioni = (url) ? [...this.adesioneConfigErogazioni, ..._list] : [..._list];
                    this._preventMultiCall = false;

                    // console.log('adesioneConfigErogazioni: ', this.adesioneConfigErogazioni)
                    
                    Tools.ScrollTo(0);
                },
                error: (error: any) => {
                    this._setErrorMessages(true);
                    this._preventMultiCall = false;
                    // Tools.OnError(error);
                }
            });
        }
    }

    __loadMoreData() {
        if (this._links && this._links.next && !this._preventMultiCall) {
            this._preventMultiCall = true;
            (this._isConfigClients) ? this._loadAdesioneConfigClients() : this._loadAdesioneConfigErogazioni();
        }
    }

    _onSubmit(form: any) {
        if (this.searchBarForm) {
            this.searchBarForm._onSearch();
        }
    }

    _onSearch(values: any) {
        this._filterData = values;
        this._loadAdesioneConfigClients(this._filterData);
    }

    _resetForm() {
        this._filterData = [];
        this._loadAdesioneConfigClients(this._filterData);
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

    get f(): { [key: string]: AbstractControl } {
        return this._editFormGroupClients.controls;
    }

    get fe(): { [key: string]: AbstractControl } {
        return this._editFormGroupErogazioni.controls;
    };

    get fRate(): { [key: string]: AbstractControl } {
        return (this._editFormGroupClients.get('rate_limiting') as FormGroup).controls;
    }

    _loadCredenziali(auth_type: string = '', organizzazione: string = '', ambiente: string = '') {
        this._arr_clients_riuso = [];

        if (organizzazione === '') {
            this._arr_clients_riuso.push({'nome': 'Nuove credenziali', 'id_client': null});
        } else {
            if (this._generalConfig.adesione.visualizza_elenco_client_esistenti) {
                this._loadClientsRiuso(auth_type, organizzazione, ambiente, true);
            } else {
                this._arr_clients_riuso.unshift({'nome': this.translate.instant('APP.ADESIONI.LABEL.ScegliCredenziali'), 'id_client': ''});
                this._arr_clients_riuso.push({'nome': this.translate.instant('APP.ADESIONI.LABEL.NuoveCredenziali'), 'id_client': SelectedClientEnum.NuovoCliente});
                this._arr_clients_riuso.push({'nome': this.translate.instant('APP.ADESIONI.LABEL.UsaClientEsistente'), 'id_client': SelectedClientEnum.UsaClientEsistente});
                if (this.authenticationService.isGestore()) {
                    this._loadClientsRiuso(auth_type, organizzazione, ambiente);
                }
            }
        }
    };

    _loadClientsRiuso(auth_type: string = '', organizzazione: string = '', ambiente: string = '', checkRiuso: boolean = false) {
        const _options: any = { params: { 'auth_type': `${auth_type}`, 'id_organizzazione': `${organizzazione}`, 'ambiente': `${ambiente}`, 'stato': StatoConfigurazioneEnum.CONFIGURATO } };

        this.apiService.getList('client', _options).subscribe({
            next: (response: any) => {
                response.content.map((el: any) => { this._arr_clients_riuso.push(el); });
                if (checkRiuso) {
                    const _riuso_client_obbligatorio: boolean = this._generalConfig.adesione.riuso_client_obbligatorio;
                    if (this._arr_clients_riuso.length === 0 || !_riuso_client_obbligatorio) {
                        this._arr_clients_riuso.unshift({'nome': this.translate.instant('APP.ADESIONI.LABEL.NuoveCredenziali'), 'id_client': SelectedClientEnum.NuovoCliente});
                        this._arr_clients_riuso.unshift({'nome': this.translate.instant('APP.ADESIONI.LABEL.ScegliCredenziali'), 'id_client': SelectedClientEnum.Default});
                    }
                }
            },
            error: (error: any) => {
                this._setErrorMessages(true);
                this._preventMultiCall = false;
            }
        });
    }

    _downloadsEnabled() {
        // console.log('form cred', this._editFormGroupClients.get('credenziali')?.value)
        // console.log('current cred', this._currentServiceClient)
        return this._currentServiceClient === this._editFormGroupClients.get('credenziali')?.value;
    }

    _initEditFormClients(data: any) {
        // console.log('client: ', data)

        this._resetCertificatesAll();
        this._resetDescrittoriAll()

        this._checkAndSetAuthTypeCase(this._auth_type);

        this._currDatiSpecifici = data?.dati_specifici || null;
        console.log('_initEditFormClients data', data);
        this._tipo_client = (this._currDatiSpecifici?.certificato_autenticazione ) ? TipoClientEnum.Riferito : TipoClientEnum.Nuovo;

        this._show_client_form = true;
        this._show_nome_proposto = (data && data.nome_proposto);
        if (this._show_nome_proposto) {
            this._show_client_form = !!data.id_client;
        }

        let _credenziali: string = '';
        let _nome: any = data?.nome || null;
        let _nome_proposto: any = data?.nome_proposto|| null;
        let _tipo_certificato: any = null;
        let _tipo_certificato_firma: any = null;
        let _cn: any = null;
        let _cn_firma: any = null;
        let _url_redirezione: string | null = null;
        let _url_esposizione: string | null = null;
        let _help_desk: string | null = null;
        let _nome_applicazione_portale: string | null = null;
        let _client_id: string | null = null;
        let _username: string | null = null;

        const ambiente: string = this.environmentId; // this._collaudo ? 'collaudo' : 'produzione';
        const organizzazione: string = this.adesione?.soggetto?.organizzazione?.id_organizzazione || '';
        // const organizzazione: string = this.adesione?.servizio?.dominio?.soggetto?.organizzazione?.id_organizzazione || '';
        this._loadCredenziali(this._auth_type, organizzazione, ambiente);

        if (data) {
            _credenziali = data.id_client;
            _nome = data.nome;
        } else {
            _credenziali = this._arr_clients_riuso[0]?.id_client;
            _nome = this._arr_clients_riuso[0]?.nome;
        }

        this._currentServiceClient = _credenziali;

        if (data?.dati_specifici) {
            _tipo_certificato = data.dati_specifici.certificato_autenticazione?.tipo_certificato;
            this._isFornito = (_tipo_certificato === 'fornito') ? true : false;
            this._isRichiesto_cn = (_tipo_certificato === 'richiesto_cn') ? true : false;
            this._isRichiesto_csr = (_tipo_certificato === 'richiesto_csr') ? true : false;

            _tipo_certificato_firma = data.dati_specifici.certificato_firma?.tipo_certificato;
            this._isFornito_firma = (_tipo_certificato_firma === 'fornito') ? true : false;
            this._isRichiesto_cn_firma = (_tipo_certificato_firma === 'richiesto_cn') ? true : false;
            this._isRichiesto_csr_firma = (_tipo_certificato_firma === 'richiesto_csr') ? true : false;
        }

        if (data?.source?.stato === StatoConfigurazioneEnum.NONCONFIGURATO) {
            this._certificato_csr = null;
            this._modulo_richiesta_csr = null;
            this._certificato_fornito = null;
        } else {

            if (this._isFornito) {
                this._certificato_fornito = data?.dati_specifici?.certificato_autenticazione?.certificato || null;
            }

            if (this._isRichiesto_cn) {
                _cn = data?.dati_specifici?.certificato_autenticazione?.cn || null;
            }
            
            if(this._isRichiesto_csr) {
                this._certificato_csr = data?.dati_specifici?.certificato_autenticazione?.richiesta || null;
                this._modulo_richiesta_csr = data?.dati_specifici?.certificato_autenticazione?.modulo_richiesta || null;
            }

            if (this._isFornito_firma) {
                this._certificato_fornito_firma = data?.dati_specifici?.certificato_firma?.certificato || null;
            }

            if (this._isRichiesto_cn_firma) {
                _cn_firma = data?.dati_specifici?.certificato_firma?.cn || null;
            }

            if (this._isRichiesto_csr_firma) {
                this._certificato_csr_firma = data?.dati_specifici?.certificato_firma?.richiesta || null;
                this._modulo_richiesta_csr_firma = data?.dati_specifici?.certificato_firma?.modulo_richiesta || null;
                this._modulo_richiesta_csr_firma_ceritifato = data?.dati_specifici?.certificato_firma?.certificato || null;
            }

            if (this._isHttpBasic) {
                _username = data?.dati_specifici?.username || null;
            }

            if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd || this._isOauthClientCredentials || this._isOauthAuthCode) {
                _client_id = data?.dati_specifici?.client_id || null;
            }

            if (this._isOauthAuthCode) {
                _url_redirezione = data?.dati_specifici?.url_redirezione || null;
                _url_esposizione = data?.dati_specifici?.url_esposizione || null;
                _help_desk = data?.dati_specifici?.help_desk || null;
                _nome_applicazione_portale = data?.dati_specifici?.nome_applicazione_portale || null;
            }
        }

        this._editFormGroupClients = new FormGroup({
            credenziali: new FormControl(_credenziali, [Validators.required]),
            nome_proposto: new FormControl({value: _nome_proposto, disabled: true}, _nome_proposto ? [Validators.required] : []),
            nome: new FormControl({value: _nome, disabled: true}, [Validators.required]),
            tipo_certificato: new FormControl({value: _tipo_certificato, disabled: true}, [Validators.required]),
            tipo_certificato_firma: new FormControl({value: _tipo_certificato_firma, disabled: true}),

            filename: new FormControl(this._certificato_fornito?.filename || null),
            estensione: new FormControl(this._certificato_fornito?.content_type || null),
            content: new FormControl(this._certificato_fornito?.content || null),
            uuid: new FormControl(this._certificato_fornito?.uuid || null),

            filename_firma: new FormControl(this._certificato_fornito_firma?.filename || null),
            estensione_firma: new FormControl(this._certificato_fornito_firma?.content_type || null),
            content_firma: new FormControl(this._certificato_fornito_firma?.content || null),
            uuid_firma: new FormControl(this._certificato_fornito_firma?.uuid || null),
            
            filename_csr: new FormControl(this._certificato_csr?.filename || null),
            estensione_csr: new FormControl(this._certificato_csr?.content_type || null),
            content_csr: new FormControl(this._certificato_csr?.content || null),
            uuid_csr: new FormControl(this._certificato_csr?.uuid || null),

            filename_csr_firma: new FormControl(this._certificato_csr_firma?.filename || null),
            estensione_csr_firma: new FormControl(this._certificato_csr_firma?.content_type || null),
            content_csr_firma: new FormControl(this._certificato_csr_firma?.content || null),
            uuid_csr_firma: new FormControl(this._certificato_csr_firma?.uuid || null),

            cn: new FormControl(_cn),
            cn_firma: new FormControl(_cn_firma),
            csr: new FormControl(null),
            modulo_richiesta_csr: new FormControl(this._modulo_richiesta_csr || null),
            modulo_richiesta_csr_firma: new FormControl(this._modulo_richiesta_csr_firma || null),

            ip_fruizione: new FormControl({value: data?.indirizzo_ip || null, disabled: true}),
            descrizione: new FormControl({value: data?.descrizione || null, disabled: true}),
            rate_limiting: new FormGroup({
                quota: new FormControl({value: data?.dati_specifici?.rate_limiting?.quota || null, disabled: true}),
                periodo: new FormControl({value: data?.dati_specifici?.rate_limiting?.periodo || null, disabled: true}),
            }),
            finalita: new FormControl({value: data?.dati_specifici?.finalita || null, disabled: true}),
            id_utente: new FormControl(null),

            url_redirezione: new FormControl({value: _url_redirezione || null, disabled: true}),
            url_esposizione: new FormControl({value: _url_esposizione || null, disabled: true}),
            help_desk: new FormControl({value: _help_desk || null, disabled: true}),
            nome_applicazione_portale: new FormControl({value: _nome_applicazione_portale || null, disabled: true}),

            client_id: new FormControl({value: _client_id || null, disabled: true}),
            username: new FormControl({value: _username || null, disabled: true}),
        });

        const controls = this._editFormGroupClients.controls;
        
        if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd) {
            controls.client_id.setValidators(Validators.required);
            controls.client_id.updateValueAndValidity();
        } else {
            controls.client_id.clearValidators();
            controls.client_id.updateValueAndValidity();
        }

        if(this._isHttpsSign || this._isHttpsPdndSign || this._isHttpsPdndSign || this._isSign || this._isSignPdnd) {
            controls.tipo_certificato_firma.setValidators(Validators.required);
            controls.tipo_certificato_firma.updateValueAndValidity();
        }

        if (this._isSign || this._isSignPdnd) {
            controls.tipo_certificato_firma.enable()
            controls.tipo_certificato.clearValidators();
        }

        if (this._isOauthAuthCode) {
            controls.url_redirezione.enable();
            controls.url_redirezione.setValidators(Validators.required);
            controls.url_redirezione.updateValueAndValidity();
            controls.url_esposizione.enable();
            controls.url_esposizione.setValidators(Validators.required);
            controls.url_esposizione.updateValueAndValidity();
            controls.help_desk.enable();
            controls.help_desk.setValidators(Validators.required);
            controls.help_desk.updateValueAndValidity();
            controls.nome_applicazione_portale.enable();
            controls.nome_applicazione_portale.setValidators(Validators.required);
            controls.nome_applicazione_portale.updateValueAndValidity();
        }

        setTimeout((ctrl:any = this._editFormGroupClients.controls) => {
            if (this._arr_clients_riuso.length === 1) {
                ctrl.credenziali.patchValue(this._arr_clients_riuso[0].id_client);
                ctrl.credenziali.updateValueAndValidity();
                this._editFormGroupClients.updateValueAndValidity();
                this.onChangeCredenziali(this._arr_clients_riuso[0].id_client);
            } else {
                this.onChangeCredenziali(_credenziali);
            }
        }, 100);

        if (!this._isModifiableMapper(data)) {
            this._disableAllFields(controls);
        }

        this._editFormGroupClients.updateValueAndValidity();

        this._showMandatoryFields(this._editFormGroupClients.controls);
    }
    
    _initEditFormErogazioni(data: any) {
        
        const _indirizzi_ip: any = data.indirizzi_ip || null;
        const _nome: string = data.nome;
        const _versione: string = data.versione;
        const _url: string = data.url || null;
        
        this._editFormGroupErogazioni = new FormGroup({
            nome: new FormControl({value: _nome, disabled: true}),
            versione: new FormControl({value: _versione, disabled: true}),
            url: new FormControl(_url, [Validators.required]),
            indirizzi_ip: new FormControl(_indirizzi_ip),
        });

        if (!this._isModifiableMapper(data)) {
            this._disableAllFields(this._editFormGroupErogazioni.controls);
        }
    }

    _disableAllFields(data: any) {
        Object.keys(data).forEach((key) => {
            data[key].disable()      
        });
    }

    _onSaveModalClient(body: any){

        let _isNuovo: boolean = false;
        let _tipo_documento: any = null;
        let _isNuovo_2: boolean = false;
        let _tipo_documento_2: any = null;

        let _isNuovo_firma: boolean = false;
        let _tipo_documento_firma: any = null;
        let _isNuovo_2_firma: boolean = false;
        let _tipo_documento_2_firma: any = null;

        let temp_cert: any;
        let temp_cert_modulo: any;
        let temp_datiSpecItem: DatiSpecItem;
        let temp_commonName: CommonName;
        let temp_doubleCert: DoubleCert;

        const _docNew: string = 'nuovo';
        const _docUuid: string = 'uuid';

        const _body:any = {...body};
        const _payload:any = {};
        const auth_type: any = this._auth_type || null;

        const _tipoCert: any = this._editFormGroupClients.getRawValue().tipo_certificato;
        const _tipoCertFirma: any = this._editFormGroupClients.getRawValue().tipo_certificato_firma;
        const _cn: any = this._editFormGroupClients.getRawValue().cn;
        const _cn_firma: any = this._editFormGroupClients.getRawValue().cn_firma;
        const _client_id: any = this._editFormGroupClients.getRawValue().client_id || null;
        const _nome: any = this._editFormGroupClients.getRawValue().nome;

        this._removeNullProperties(_body)

        delete _body.credenziali;

        // this._collaudo ? _body.ambiente = 'collaudo' : _body.ambiente = 'produzione';
        _body.ambiente = this.environmentId;

        let _datiSpecifici: Datispecifici = {
            auth_type: this._auth_type
        };
        
        const _rateLimiting = this._editFormGroupClients.controls['rate_limiting'].value || null;
        if (this._show_erogazione_rate_limiting && _rateLimiting && _rateLimiting.quota) {
            _datiSpecifici.rate_limiting = _rateLimiting;
        }
        if (this._show_erogazione_finalita && _body.finalita) {
            _datiSpecifici.finalita = _body.finalita;
        }

        _payload.nome_proposto = this._editFormGroupClients.controls['nome_proposto'].value;
        _payload.id_soggetto = this.adesione.soggetto.id_soggetto;
        _payload.tipo_client = this._tipo_client;
        _payload.indirizzo_ip = this._editFormGroupClients.controls['ip_fruizione'].value || null;
        _payload.descrizione = this._editFormGroupClients.controls['descrizione'].value || null;
        
        this._removeNullProperties(_payload)

        if (_tipoCert == 'richiesto_cn') {
            temp_commonName = {
                'tipo_certificato': _tipoCert,
                'cn': _cn
            }
            _datiSpecifici.certificato_autenticazione = temp_commonName;
        }

        if (_tipoCert == 'fornito') {
            (this._certificato_fornito) ? _isNuovo = false : _isNuovo = true;
            (_isNuovo) ? _tipo_documento = _docNew : _tipo_documento = _docUuid;
            temp_cert = {
                'tipo_documento': _tipo_documento,
                'content_type': _body.estensione || null,
                'content': _body.content,
                'filename': _body.filename,
                'uuid': this._certificato_fornito?.uuid || null
            }
            temp_datiSpecItem = {
                'tipo_certificato': _tipoCert,
                'certificato': temp_cert
            }
            this._removeNullProperties(temp_cert);
            _datiSpecifici.certificato_autenticazione = temp_datiSpecItem;
        
        }

        if (_tipoCert == 'richiesto_csr') {
            (this._certificato_csr) ? _isNuovo = false : _isNuovo = true;
            (_isNuovo) ? _tipo_documento = _docNew : _tipo_documento = _docUuid;
            (this._modulo_richiesta_csr) ? _isNuovo_2 = false : _isNuovo_2 = true;
            (_isNuovo_2) ? _tipo_documento_2 = _docNew : _tipo_documento_2 = _docUuid;
            temp_cert = {
                'tipo_documento': _tipo_documento,
                'content_type': _body.estensione_csr|| null,
                'content': _body.content_csr,
                'filename': _body.filename_csr,
                'uuid': this._certificato_csr?.uuid || null
            }
            temp_cert_modulo = {
                'tipo_documento': _tipo_documento_2,
                'content_type': _body.estensione|| null,
                'content': _body.content,
                'filename': _body.filename,
                'uuid': this._modulo_richiesta_csr?.uuid || null
            }
            temp_doubleCert = {
                'tipo_certificato': _tipoCert,
                'richiesta': temp_cert,
                'modulo_richiesta': temp_cert_modulo
            }
            this._removeNullProperties(temp_cert);
            this._removeNullProperties(temp_cert_modulo);
            _datiSpecifici.certificato_autenticazione = temp_doubleCert;
        }

        if (_tipoCertFirma == 'richiesto_cn') {
            temp_commonName = {
                'tipo_certificato': _tipoCertFirma,
                'cn': _cn_firma
            }
            _datiSpecifici.certificato_firma = temp_commonName;
        }

        if (_tipoCertFirma == 'fornito') {
            (this._certificato_fornito_firma) ? _isNuovo_firma = false : _isNuovo_firma = true;
            (_isNuovo_firma) ? _tipo_documento_firma = _docNew : _tipo_documento_firma = _docUuid;
            temp_cert = {
                'tipo_documento': _tipo_documento_firma,
                'content_type': _body.estensione_firma || null,
                'content': _body.content_firma,
                'filename': _body.filename_firma,
                'uuid': this._certificato_fornito?.uuid || null
            }
            temp_datiSpecItem = {
                'tipo_certificato': _tipoCertFirma,
                'certificato': temp_cert
            }
            this._removeNullProperties(temp_cert);
            _datiSpecifici.certificato_firma = temp_datiSpecItem;
        }

        if (_tipoCertFirma == 'richiesto_csr') {
            (this._certificato_csr_firma) ? _isNuovo_firma = false : _isNuovo_firma = true;
            (_isNuovo_firma) ? _tipo_documento_firma = _docNew : _tipo_documento_firma = _docUuid;
            (this._modulo_richiesta_csr_firma) ? _isNuovo_2_firma = false : _isNuovo_2_firma = true;
            (_isNuovo_2_firma) ? _tipo_documento_2_firma = _docNew : _tipo_documento_2_firma = _docUuid;      
            temp_cert = {
                'tipo_documento': _tipo_documento_firma,
                'content_type': _body.estensione_csr_firma || null,
                'content': _body.content_csr_firma,
                'filename': _body.filename_csr_firma,
                'uuid': this._certificato_csr_firma?.uuid || null
            }
            temp_cert_modulo = {
                'tipo_documento': _tipo_documento_2_firma,
                'content_type': _body.estensione_firma || null,
                'content': _body.content_firma,
                'filename': _body.filename_firma,
                'uuid': this._modulo_richiesta_csr_firma?.uuid || null
            }
            temp_doubleCert = {
                'tipo_certificato': _tipoCertFirma,
                'richiesta': temp_cert,
                'modulo_richiesta': temp_cert_modulo
            }
            this._removeNullProperties(temp_cert);
            this._removeNullProperties(temp_cert_modulo);
            _datiSpecifici.certificato_firma = temp_doubleCert;
        }

        if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd || this._isOauthClientCredentials || this._isOauthAuthCode) {
            _datiSpecifici.client_id = _client_id;
        }

        if (this._isOauthAuthCode) {
            _datiSpecifici.url_redirezione = this._editFormGroupClients.getRawValue().url_redirezione;
            _datiSpecifici.url_esposizione = this._editFormGroupClients.getRawValue().url_esposizione;
            _datiSpecifici.help_desk = this._editFormGroupClients.getRawValue().help_desk;
            _datiSpecifici.nome_applicazione_portale = this._editFormGroupClients.getRawValue().nome_applicazione_portale;
        }

    // =============TEST FOR CHANGES ====================
        // const _bodyPatch: any[] = jsonpatch.compare(this._currDatiSpecifici, _body.dati_specifici);
        // if (_bodyPatch) {
        //   console.log('Hai modificato !!') 
        // } else {
        //   console.log('No difference');
        // }
    // =================================================

        const _DVLP_invia: boolean = true;

        // console.log('_datiSpecifici: ', _datiSpecifici);

        if (this._currClient?.id_client) {
            // se è presente id_client ==> devo fare una modifica ad un client esistente
            const id_adesione: string = this.adesione.id_adesione;
            const ambiente: string = this.environmentId;
            const profilo: string = this._codice_interno_profilo;
            const path: string = `${ambiente}` + '/client/' + `${profilo}`;

            _payload.id_soggetto = this._currClient.soggetto.id_soggetto;
            _payload.ambiente = this.environmentId;
            _payload.nome = _nome || this._currClient.nome,
            _payload.dati_specifici = _datiSpecifici;

            console.log('PUT for UPDATING: ', _payload);

            if (_DVLP_invia) {
                // this.apiService.putElement('client', this._currClient.id_client, _payload).subscribe(
                this.apiService.putElementRelated('adesioni', id_adesione, path, _payload).subscribe(
                    (response: any) => {
                        this._loadAdesioneConfigClients();
                        this.closeModal();
                    },
                    (error: any) => {
                        this._error = true;
                        this._errorMsg = Tools.GetErrorMsg(error);
                    }
                );
            }
        } else {
        // se NON è presente id_client ==> devo registrare un nuovo client

        const id_adesione: string = this.adesione.id_adesione;
        const ambiente: string = this.environmentId; // this._collaudo ? 'collaudo' : 'produzione';
        const profilo: string = this._codice_interno_profilo;
        const path: string = `${ambiente}` + '/client/' + `${profilo}`;
        
        _payload.ambiente = this.environmentId; // this._collaudo ? 'collaudo' : 'produzione';
        _payload.nome = _nome;
        _payload.dati_specifici = _datiSpecifici;
        
        console.log('PUT: ', _payload);

        if (_DVLP_invia) {
            this.apiService.putElementRelated('adesioni', id_adesione, path, _payload).subscribe(
                (response: any) => {
                    this._loadAdesioneConfigClients();
                    this.closeModal();
                },
                (error: any) => {
                    this._error = true;
                    this._errorMsg = Tools.GetErrorMsg(error);
                }
            );
        }
        }
    }

    _onSaveModalErogazioni(body: any) {
        const _DVLP_invia: boolean = true;

        const id_adesione: string = this.adesione.id_adesione;
        const ambiente: string = this.environmentId; // this._collaudo ? 'collaudo' : 'produzione';
        const id_erogazione: string = this.id_erogazione;
        const path: string = `${ambiente}` + '/erogazioni/' + `${id_erogazione}`;

        let _payload: Erogazioni = {
            url : body.url,
            indirizzi_ip : body.indirizzi_ip
        };

        this._removeNullProperties(_payload);

        console.log('PUT for UPDATING: ', _payload, path);

        if (_DVLP_invia) {
            this.apiService.putElementRelated('adesioni', id_adesione, path, _payload).subscribe(
                (response: any) => {
                    this._loadAdesioneConfigErogazioni();
                    this.closeModal();
                },
                (error: any) => {
                    this._error = true;
                    this._errorMsg = Tools.GetErrorMsg(error);
                }
            );
        }
    }

    closeModal(){
        this._arr_clients_riuso = [];
        this._modalEditRef.hide();
        this._isEdit = false;
        if (this.showSubscription) {
            this.showSubscription.unsubscribe();
        }
    }

    _onEditClient(client: any) {
        this.client = client;

        this._ip_richiesto = client.ip_richiesto;
        this._auth_type = client.auth_type
        this._codice_interno_profilo = client.source.codice_interno;

        this._checkAndSetAuthTypeCase(this._auth_type);
        
        this.onChangeTipoCertificato(null);
        this.onChangeTipoCertificatoFirma(null);

        const _modalConfig: any = {
            ignoreBackdropClick: true,
            class: 'modal-half-'
        };

        const _isNotConfigurato = (client.source.stato === StatoConfigurazioneEnum.NONCONFIGURATO);
        const _isNomeProposto = client?.source?.nome_proposto ? true : false;
        this._show_nome_proposto = _isNomeProposto;

        // this.loadingDialog = false;
        this.showSubscription = this.modalService.onShown.subscribe(($event: any, reason: string) => {
            setTimeout(() => {
                const _id_client =  client.id_client;
                if (_isNomeProposto && !_id_client) {
                    this._editFormGroupClients.controls['credenziali'].setValue(SelectedClientEnum.UsaClientEsistente);
                    this._currentServiceClient = _id_client;
                    this.onChangeCredenziali(SelectedClientEnum.UsaClientEsistente);
                } else {
                    this._editFormGroupClients.controls['credenziali'].setValue(_id_client || '');
                    this.onChangeCredenziali(SelectedClientEnum.Default);
                }
                // this.loadingDialog = false;
            }, 400);
        });

        if (!client.id_client || _isNotConfigurato || _isNomeProposto) {
            this._isEdit = false;
            this._currClient = _isNomeProposto ? { ...client } : {};

            setTimeout(() => {
                this._initEditFormClients(this._currClient.source);
                this._modalEditRef = this.modalService.show(this.editClients, _modalConfig)
            }, 200);

        } else {
            this._isEdit = true;

            this.apiService.getDetails('client', client.id_client).subscribe(
                (response: any) => {
                    this._currClient = { ...response };

                    setTimeout(() => {
                        this._initEditFormClients(this._currClient);
                        this._modalEditRef = this.modalService.show(this.editClients, _modalConfig);
                    }, 200);
                },
                (error: any) => {
                    this._error = true;
                    this._errorMsg = Tools.GetErrorMsg(error);
                    // this.closeModal();
                }
            );
        }
    }

    _onEditAdesioneErogaz(erogaz: any) {
        this.erogaz = erogaz;
        this.id_erogazione = erogaz.id_erogazione;
        this._initEditFormErogazioni(erogaz)

        const _modalConfig: any = {
            ignoreBackdropClick: false,
            class: 'modal-half-'
        };
        
        this._modalEditRef = this.modalService.show(this.editErogazioni, _modalConfig);
    }

    _onSaveCustomProperty(event: any) {
        this._loadAdesioneConfigClients(null, '', true);
        this._loadAdesioneConfigErogazioni(null, '', true);
        this._loadConfigurazioni();
    }

    _hasControlError(name: string) {
        return (this.f[name] && this.f[name].errors && this.f[name].touched);
    }

    trackByFn(item: any) {
        return item.id;
    }

    _showCollaudo() {
        this.environmentId = 'collaudo';
        this._collaudo = true;
        this._loadAdesioneConfigClients();
        this._loadAdesioneConfigErogazioni();
        this._loadConfigurazioni();
    }
    
    _showProduzione() {
        this.environmentId = 'produzione';
        this._collaudo = false;
        this._loadAdesioneConfigClients();
        this._loadAdesioneConfigErogazioni();
        this._loadConfigurazioni();
    }

    _isCollaudo() {
        return (this.environmentId === 'collaudo');
    }

    _isProduzione() {
        return (this.environmentId === 'produzione');
    }

    _onChangeTipoReferente(isReferent: boolean) {
        this.referentiFilter = isReferent ? 'referente_servizio,gestore' : '';
    }

    _onShowTab(item: any, tab: string = '') {
        if (item) {
            this._currentTab = item.nome_gruppo;
            this._currentTabCustom = item;
        } else {
            this._currentTab = tab;
            this._currentTabCustom = null;
            (tab === 'clients') ? this._showClients() : this._showEndpointAPI();
        }
    }

    public _proprietaCustomFiltered: any[] = [];

    _loadConfigurazioni() {
        if (this.id) {
            this.apiService.getDetails(this.model, this.id, this.environmentId + '/configurazioni').subscribe({
                next: (response: any) => {
                    this.configurazioni = response.content;
                    const _adesioneAuthType: string[] = this.adesione.client_richiesti.map((item: any) => item.auth_type);
                    const _adesioneProfili: string[] = this.adesione.client_richiesti.map((item: any) => item.profilo);
                    this._proprietaCustomFiltered = this.proprietaCustom.filter((item: any) => {
                        const _hasAuthType = item.auth_type ? _.intersection(_adesioneAuthType, item.auth_type).length > 0 : true;
                        const _hasProfilo = item.profili ? _.intersection(_adesioneProfili, item.profili).length > 0 : true;
                        const _hasClasseDato = (item.classe_dato.includes(this.environmentId));
                        const _ruoli = this._grant?.ruoli || [];
                        const _hasRuolo = item.ruoli_abilitati ? _.intersection(_ruoli, item.ruoli_abilitati).length > 0 : true;
                        return _hasClasseDato && _hasProfilo && _hasAuthType && _hasRuolo;
                    });
                    this._initBreadcrumb();
                },
                error: (error: any) => {
                    Tools.OnError(error);
                }
            });
        }
    }

    loadAnagrafiche() {
        this.anagrafiche['tipo-referente'] = [
            { nome: 'referente', filter: 'referente_servizio,gestore' },
            { nome: 'referente_tecnico', filter: '' }
        ];
    }

    onChangeCredenziali(selected_client_id: any) {
        this._certificato_cn = null;
        this._certificato_cn_firma = null;

        const controls = this._editFormGroupClients.controls;

        this._show_nome_proposto = !!this.client?.source?.nome_proposto;
        this._show_client_form = true;

        let _aux: any = null;
        
        if (selected_client_id && selected_client_id !== 'null') {
            this.updateAllValidators(selected_client_id);

            controls.nome_proposto.disable();
            controls.nome_proposto.clearValidators();

            switch (selected_client_id) {
                case SelectedClientEnum.NuovoCliente:
                    this._tipo_client = TipoClientEnum.Nuovo;
                    controls.nome.enable();
                    controls.nome.setValidators(Validators.required);
                    controls.nome.patchValue(null);

                    controls.ip_fruizione.patchValue('');
                    controls.ip_fruizione.enable();
                    controls.descrizione.patchValue('');
                    controls.descrizione.enable();
                    controls.rate_limiting.patchValue({ quota: null, periodo: PeriodEnum.Giorno });
                    controls.rate_limiting.enable();
                    controls.finalita.patchValue('');
                    controls.finalita.enable();
                    controls.finalita.setValidators(Validators.pattern(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i));
                    controls.client_id.patchValue('');
                    controls.client_id.enable();
            
                    controls.tipo_certificato.patchValue(null);
                    this.onChangeTipoCertificato(null);
            
                    if (this._isHttps || this._isHttpsSign || this._isHttpsPdnd || this._isHttpsPdndSign) {
                        controls.tipo_certificato.setValidators(Validators.required);
                        controls.tipo_certificato.enable();
                    }
            
                    if (this._isHttpsSign || this._isHttpsPdndSign) {
                        controls.tipo_certificato_firma.setValidators(Validators.required);
                        controls.tipo_certificato_firma.enable();
                    }
            
                    controls.url_redirezione.patchValue(null);
                    controls.url_esposizione.patchValue(null);
                    controls.help_desk.patchValue(null);
                    controls.nome_applicazione_portale.patchValue(null);
            
                    if (this._isOauthAuthCode) {
                        controls.url_redirezione.enable();
                        controls.url_redirezione.setValidators(Validators.required);
                        controls.url_redirezione.updateValueAndValidity();
                        controls.url_esposizione.enable();
                        controls.url_esposizione.setValidators(Validators.required);
                        controls.url_esposizione.updateValueAndValidity();
                        controls.help_desk.enable();
                        controls.help_desk.setValidators(Validators.required);
                        controls.help_desk.updateValueAndValidity();
                        controls.nome_applicazione_portale.enable();
                        controls.nome_applicazione_portale.setValidators(Validators.required);
                        controls.nome_applicazione_portale.updateValueAndValidity();
                    }
                    break;

                case SelectedClientEnum.UsaClientEsistente:
                    this._tipo_client = TipoClientEnum.Proposto;
                    this._show_nome_proposto = true;
                    controls.nome_proposto.enable();
                    controls.nome_proposto.setValidators(Validators.required);
                    controls.nome_proposto.updateValueAndValidity();

                    controls.tipo_certificato.clearValidators();
                    controls.tipo_certificato.updateValueAndValidity();
                    controls.tipo_certificato_firma.clearValidators();
                    controls.tipo_certificato_firma.updateValueAndValidity();
                    controls.url_redirezione.clearValidators();
                    controls.url_redirezione.updateValueAndValidity();
                    controls.url_esposizione.clearValidators();
                    controls.url_esposizione.updateValueAndValidity();
                    controls.help_desk.clearValidators();
                    controls.help_desk.updateValueAndValidity();
                    controls.nome_applicazione_portale.clearValidators();
                    controls.nome_applicazione_portale.updateValueAndValidity();
                    controls.cn.clearValidators();
                    controls.cn.updateValueAndValidity();
                    controls.cn_firma.clearValidators();
                    controls.cn_firma.updateValueAndValidity();
                    controls.filename_csr.clearValidators();
                    controls.filename_csr.updateValueAndValidity();
                    controls.estensione_csr.clearValidators();
                    controls.estensione_csr.updateValueAndValidity();
                    controls.content_csr.clearValidators();
                    controls.content_csr.updateValueAndValidity();
                    controls.filename_firma.clearValidators();
                    controls.filename_firma.updateValueAndValidity();
                    controls.estensione_firma.clearValidators();
                    controls.estensione_firma.updateValueAndValidity();
                    controls.content_firma.clearValidators();
                    controls.content_firma.updateValueAndValidity();
                    controls.content.clearValidators();
                    controls.content.updateValueAndValidity();

                    controls.nome.patchValue(null);
                    controls.nome.updateValueAndValidity();
                    controls.ip_fruizione.patchValue('');
                    controls.ip_fruizione.updateValueAndValidity();
                    controls.descrizione.patchValue('');
                    controls.descrizione.updateValueAndValidity();
                    controls.rate_limiting.patchValue({ quota: null, periodo: PeriodEnum.Giorno });
                    controls.rate_limiting.updateValueAndValidity();
                    controls.finalita.patchValue('');
                    controls.finalita.updateValueAndValidity();
                    controls.client_id.patchValue('');
                    controls.client_id.updateValueAndValidity();

                    this._show_client_form = !!controls.client_id.value;
                    break;

                default:
                    this._tipo_client = TipoClientEnum.Riferito;

                    _aux = this._arr_clients_riuso.find((el) => el.id_client == selected_client_id);
                    if (!_aux) {
                        _aux = this._currClient.source || this._currClient;
                    }
                    this._currClient = _aux;

                    let _cert_type: any = null
                    this._checkAndSetAuthTypeCase(this._auth_type)

                    // console.log('onChangeCredenziali _currClient', this._currClient);
                    // console.log('onChangeCredenziali default aux', _aux);

                    this._id_client_riuso = _aux?.id_client || null;
                    controls.client_id.patchValue(this._id_client_riuso);

                    if (this._isHttps || this._isHttpsSign || this._isHttpsPdnd || this._isHttpsPdndSign) {
                        _cert_type = _aux?.dati_specifici.certificato_autenticazione.tipo_certificato || null;

                        controls.tipo_certificato.enable()
                        controls.tipo_certificato.patchValue(_cert_type)
                        controls.tipo_certificato.disable();
                        controls.tipo_certificato.updateValueAndValidity();

                        switch (_cert_type) {
                            case 'fornito':
                                this.onChangeTipoCertificato({'nome': _cert_type})
                                this._certificato_fornito = _aux.dati_specifici.certificato_autenticazione.certificato;
                                controls.content.clearValidators()
                                controls.content.updateValueAndValidity();
                                break;
                            case 'richiesto_cn':
                                this.onChangeTipoCertificato({'nome': _cert_type})
                                this._certificato_cn = _aux.dati_specifici.certificato_autenticazione.certificato;
                                controls.cn.enable();
                                controls.cn.patchValue(_aux.dati_specifici.certificato_autenticazione.cn);
                                controls.cn.disable();

                                controls.cn.clearValidators()
                                controls.cn.updateValueAndValidity();
                                break;
                            case 'richiesto_csr':
                                this.onChangeTipoCertificato({'nome': _cert_type})
                                this._certificato_csr = _aux.dati_specifici.certificato_autenticazione.richiesta;
                                this._modulo_richiesta_csr = _aux.dati_specifici.certificato_autenticazione.modulo_richiesta;              
                                controls.content.clearValidators()
                                controls.content.updateValueAndValidity();
                                controls.content_csr.clearValidators()
                                controls.content_csr.updateValueAndValidity();
                                break;
                            default:
                                console.log('*** TIPO CERTIFICATO *** ', _cert_type);
                                break;
                        }
                    }

                    if (this._isHttpsSign || this._isHttpsPdndSign || this._isSignPdnd || this._isSign) {
                        _cert_type = _aux.dati_specifici.certificato_firma.tipo_certificato;

                        controls.tipo_certificato_firma.enable();
                        controls.tipo_certificato_firma.patchValue(_cert_type)
                        controls.tipo_certificato_firma.disable();
                        controls.tipo_certificato_firma.updateValueAndValidity();

                        switch (_cert_type) {
                            case 'fornito':
                                this.onChangeTipoCertificatoFirma({'nome': _cert_type})
                                this._certificato_fornito_firma = _aux.dati_specifici.certificato_firma.certificato;
                                controls.content_firma.clearValidators()
                                controls.content_firma.updateValueAndValidity();
                                break;
                            case 'richiesto_cn':
                                this.onChangeTipoCertificatoFirma({'nome': _cert_type})
                                this._certificato_cn_firma = _aux.dati_specifici.certificato_firma.certificato;
                                controls.cn_firma.enable();
                                controls.cn_firma.patchValue(_aux.dati_specifici.certificato_firma.cn);
                                controls.cn_firma.disable();

                                controls.cn_firma.clearValidators()
                                controls.cn_firma.updateValueAndValidity();
                                break;
                            case 'richiesto_csr':
                                this.onChangeTipoCertificatoFirma({'nome': _cert_type})
                                this._certificato_csr_firma = _aux.dati_specifici.certificato_firma.richiesta;
                                this._modulo_richiesta_csr_firma = _aux.dati_specifici.certificato_firma.modulo_richiesta;
                                this._modulo_richiesta_csr_firma_ceritifato = _aux.dati_specifici.certificato_firma.certificato;
                                controls.content_firma.clearValidators()
                                controls.content_firma.updateValueAndValidity();
                                controls.content_csr_firma.clearValidators()
                                controls.content_csr_firma.updateValueAndValidity();
                                break;
                            default:
                                console.log('*** TIPO CERTIFICATO *** ', _cert_type);
                                break;
                        }
                    }

                    if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isOauthClientCredentials || this._isOauthAuthCode) {
                        controls.client_id.patchValue(_aux?.dati_specifici?.client_id)
                        controls.client_id.disable();
                    }

                    // ======== ok_zone =========
                    controls.nome.disable();
                    controls.nome.patchValue(_aux?.nome);
                    controls.nome.updateValueAndValidity();

                    controls.descrizione.disable();
                    controls.descrizione.patchValue(_aux?.descrizione);
                    controls.descrizione.updateValueAndValidity();

                    controls.ip_fruizione.disable();
                    controls.ip_fruizione.patchValue(_aux?.indirizzo_ip);
                    controls.ip_fruizione.clearValidators();

                    controls.rate_limiting.disable();
                    controls.rate_limiting.patchValue(_aux?.dati_specifici?.rate_limiting || { quota: null, periodo: null });
                    controls.rate_limiting.clearValidators();

                    controls.finalita.disable();
                    controls.finalita.patchValue(_aux?.dati_specifici?.finalita);
                    // controls.finalita.clearValidators();

                    controls.tipo_certificato.updateValueAndValidity();
                    controls.tipo_certificato_firma.updateValueAndValidity();
                    this._editFormGroupClients.updateValueAndValidity();
                    // ==========================

                    controls.url_redirezione.patchValue(_aux?.dati_specifici?.url_redirezione);
                    controls.url_esposizione.patchValue(_aux?.dati_specifici?.url_esposizione);
                    controls.help_desk.patchValue(_aux?.dati_specifici?.help_desk);
                    controls.nome_applicazione_portale.patchValue(_aux?.dati_specifici?.nome_applicazione_portale);

                    if (this._isOauthAuthCode) {
                        controls.url_redirezione.disable();
                        controls.url_redirezione.clearValidators();
                        controls.url_esposizione.disable();
                        controls.url_esposizione.clearValidators();
                        controls.help_desk.disable();
                        controls.help_desk.clearValidators();
                        controls.nome_applicazione_portale.disable();
                        controls.nome_applicazione_portale.clearValidators();
                    }

                    this._show_client_form = !!controls.client_id.value;
                    // end default
            }
        } else {
            controls.nome.disable();
            // controls.nome.patchValue(null);
            controls.nome.updateValueAndValidity();

            controls.nome.disable();
            // controls.tipo_certificato.patchValue(null);
            controls.tipo_certificato.clearValidators();

            if (this._isOauthAuthCode) {
                controls.url_redirezione.disable();
                // controls.url_redirezione.clearValidators();
                controls.url_redirezione.updateValueAndValidity();
                controls.url_esposizione.disable();
                // controls.url_esposizione.clearValidators();
                controls.url_esposizione.updateValueAndValidity();
                controls.help_desk.disable();
                // controls.help_desk.clearValidators();
                controls.help_desk.updateValueAndValidity();
                controls.nome_applicazione_portale.disable();
                // controls.nome_applicazione_portale.clearValidators();
                controls.nome_applicazione_portale.updateValueAndValidity();
            }
            
            controls.descrizione.disable();
            // controls.descrizione.patchValue(null);
            controls.descrizione.updateValueAndValidity();
            controls.ip_fruizione.disable();
            // controls.ip_fruizione.patchValue(null);
            controls.ip_fruizione.updateValueAndValidity();
            controls.rate_limiting.disable();
            // controls.rate_limiting.patchValue({ quota: null, periodo: null });
            controls.rate_limiting.updateValueAndValidity();
            controls.finalita.disable();
            // controls.finalita.patchValue(null);
            controls.finalita.updateValueAndValidity()
        }
        
        controls.tipo_certificato.updateValueAndValidity();
        controls.tipo_certificato_firma.updateValueAndValidity();

        this._showMandatoryFields(controls);
    }

    updateAllValidators(type: SelectedClientEnum) {
        const controls = this._editFormGroupClients.controls;

        switch (type) {
            case SelectedClientEnum.NuovoCliente:
            case SelectedClientEnum.Default:

                // controls.nome_proposto.patchValue(null);
                controls.nome_proposto.clearValidators();

                if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd) {
                    controls.client_id.setValidators(Validators.required);
                    controls.client_id.updateValueAndValidity();
                } else {
                    controls.client_id.clearValidators();
                    controls.client_id.updateValueAndValidity();
                }

                if(this._isHttpsSign || this._isHttpsPdndSign || this._isHttpsPdndSign || this._isSign || this._isSignPdnd) {
                    controls.tipo_certificato_firma.setValidators(Validators.required);
                    controls.tipo_certificato_firma.updateValueAndValidity();
                }
                if (this._isSign || this._isSignPdnd) {
                    controls.tipo_certificato_firma.enable()
                    controls.tipo_certificato.clearValidators();
                }

                if (this._isOauthAuthCode) {
                    controls.url_redirezione.enable();
                    controls.url_redirezione.setValidators(Validators.required);
                    controls.url_redirezione.updateValueAndValidity();
                    controls.url_esposizione.enable();
                    controls.url_esposizione.setValidators(Validators.required);
                    controls.url_esposizione.updateValueAndValidity();
                    controls.help_desk.enable();
                    controls.help_desk.setValidators(Validators.required);
                    controls.help_desk.updateValueAndValidity();
                    controls.nome_applicazione_portale.enable();
                    controls.nome_applicazione_portale.setValidators(Validators.required);
                    controls.nome_applicazione_portale.updateValueAndValidity();
                }
                break;

            case SelectedClientEnum.UsaClientEsistente:

                controls.nome_proposto.setValidators([Validators.required]);
                controls.nome.clearValidators();
                controls.nome.updateValueAndValidity();
                controls.ip_fruizione.clearValidators();
                controls.ip_fruizione.updateValueAndValidity();
                controls.descrizione.clearValidators();
                controls.descrizione.updateValueAndValidity();
                controls.rate_limiting.clearValidators();
                controls.rate_limiting.updateValueAndValidity();
                controls.finalita.clearValidators();
                controls.finalita.updateValueAndValidity();
                controls.client_id.clearValidators();
                controls.client_id.updateValueAndValidity();
                controls.url_redirezione.clearValidators();
                controls.url_redirezione.updateValueAndValidity();
                controls.url_esposizione.clearValidators();
                controls.url_esposizione.updateValueAndValidity();
                controls.help_desk.clearValidators();
                controls.help_desk.updateValueAndValidity();
                controls.nome_applicazione_portale.clearValidators();
                controls.nome_applicazione_portale.updateValueAndValidity();    
                break;

            default:
                if (this._show_nome_proposto) {
                    controls.nome_proposto.setValidators([Validators.required]);
                    controls.nome_proposto.updateValueAndValidity();
                } else {
                    controls.nome_proposto.patchValue(null);
                    controls.nome_proposto.clearValidators();
                    controls.nome_proposto.updateValueAndValidity();
                }
                break ;
        }

        this._editFormGroupClients.updateValueAndValidity();
    }

    _resetDescrittori() {
        this._descrittoreCtrl.setValue('');
        this._descrittoreCtrl_csr.setValue('');
        this._descrittoreCtrl_csr_modulo.setValue('');
        this._descrittoreCtrl.updateValueAndValidity();
        this._descrittoreCtrl_csr.updateValueAndValidity();
        this._descrittoreCtrl_csr_modulo.updateValueAndValidity();
    }

    _resetUploadCertificateComponents(controls: any) {
        controls.filename.setValue(null);
        controls.filename.updateValueAndValidity();
        controls.estensione.setValue(null);
        controls.estensione.updateValueAndValidity();
        controls.content.setValue(null);
        controls.content.clearValidators();
        controls.content.updateValueAndValidity();

        controls.cn.setValue(null);
        controls.cn.clearValidators();
        controls.cn.updateValueAndValidity();

        controls.filename_csr.setValue(null);
        controls.filename_csr.updateValueAndValidity();
        controls.estensione_csr.setValue(null);
        controls.estensione_csr.updateValueAndValidity();
        controls.content_csr.setValue(null);
        controls.content_csr.clearValidators();
        controls.content_csr.updateValueAndValidity();

        this._resetDescrittori();

        this._editFormGroupClients.updateValueAndValidity()
    }

    onChangeTipoCertificato(event: any) {
        const controls = this._editFormGroupClients.controls;

        (Object.keys(controls).length > 0) ? this._resetUploadCertificateComponents(controls) : null;

        if (event) {
            switch (event.nome) {
                case 'fornito':
                    controls?.content?.setValidators(Validators.required);
                    controls?.content?.updateValueAndValidity();
                    
                    this._isFornito = true; 
                    this._isRichiesto_cn = false; 
                    this._isRichiesto_csr = false;

                    this._certificato_fornito = this._currDatiSpecifici?.certificato?.certificato || null;
                    this._certificato_csr = null;
                    this._modulo_richiesta_csr = null;
                    break;
                case 'richiesto_cn': 
                    controls?.cn?.setValidators(Validators.required);
                    controls?.cn?.updateValueAndValidity();
                    
                    this._isFornito = false; 
                    this._isRichiesto_cn = true; 
                    this._isRichiesto_csr = false;

                    this._certificato_fornito =  null;
                    this._certificato_csr = null;
                    this._modulo_richiesta_csr = null;
                    break;
                case 'richiesto_csr': 
                    controls?.content?.setValidators(Validators.required);
                    controls?.content?.updateValueAndValidity();
                    controls?.content_csr?.setValidators(Validators.required);
                    controls?.content_csr?.updateValueAndValidity();
                    
                    this._isFornito = false; 
                    this._isRichiesto_cn = false; 
                    this._isRichiesto_csr = true;

                    this._certificato_fornito = null;
                    this._certificato_csr = this._currDatiSpecifici?.certificato?.richiesta || null;
                    this._modulo_richiesta_csr = this._currDatiSpecifici?.certificato?.modulo_richiesta || null;
                    break;
                default:
                    this._isFornito = false; 
                    this._isRichiesto_cn = false; 
                    this._isRichiesto_csr = false;

                    this._certificato_fornito =  null;
                    this._certificato_csr = null;
                    this._modulo_richiesta_csr = null;
                    break;
            }
        } else {

            this._isFornito = false; 
            this._isRichiesto_cn = false; 
            this._isRichiesto_csr = false;

            this._resetCertificates();
        }

        // ================================
        this._editFormGroupClients.updateValueAndValidity()
        // ================================
    }

    _resetCertificatesAll() {
        this._resetCertificates();
        this._resetCertificatesFirma();
    }

    _resetCertificates() {
        this._certificato_csr = null;
        this._certificato_fornito = null;
        this._modulo_richiesta_csr = null;
        this._certificato_cn = null;
    }

    _resetCertificatesFirma() {
        this._certificato_csr_firma = null;
        this._certificato_fornito_firma = null;
        this._modulo_richiesta_csr_firma = null;
        this._modulo_richiesta_csr_firma_ceritifato = null;
        this._certificato_cn_firma = null;
    }

    _resetDescrittoriAll() {
        this._resetDescrittori();
        this._resetDescrittoriFirma();
    }

    _resetDescrittoriFirma() {
        this._descrittoreCtrl_firma.setValue('');
        this._descrittoreCtrl_csr_firma.setValue('');
        this._descrittoreCtrl_csr_modulo_firma.setValue('');
        this._descrittoreCtrl_firma.updateValueAndValidity();
        this._descrittoreCtrl_csr_firma.updateValueAndValidity();
        this._descrittoreCtrl_csr_modulo_firma.updateValueAndValidity();
    }

    _resetUploadCertificateComponentsFirma(controls: any) {

        controls.filename_firma.setValue(null);
        controls.filename_firma.updateValueAndValidity();
        controls.estensione_firma.setValue(null);
        controls.estensione_firma.updateValueAndValidity();
        controls.content_firma.setValue(null);
        controls.content_firma.clearValidators();
        controls.content_firma.updateValueAndValidity();

        controls.cn_firma.setValue(null);
        controls.cn_firma.clearValidators();
        controls.cn_firma.updateValueAndValidity();

        controls.filename_csr_firma.setValue(null);
        controls.filename_csr_firma.updateValueAndValidity();
        controls.estensione_csr_firma.setValue(null);
        controls.estensione_csr_firma.updateValueAndValidity();
        controls.content_csr_firma.setValue(null);
        controls.content_csr_firma.clearValidators();
        controls.content_csr_firma.updateValueAndValidity();

        this._resetDescrittoriFirma();

        this._editFormGroupClients.updateValueAndValidity()
    }

    onChangeTipoCertificatoFirma(event: any) {
        const controls = this._editFormGroupClients.controls;

        (Object.keys(controls).length > 0) ? this._resetUploadCertificateComponentsFirma(controls) : null;
        
        if (event) {
            switch (event.nome) {
                case 'fornito':
                    controls?.content_firma?.setValidators(Validators.required);
                    controls?.content_firma?.updateValueAndValidity();

                    this._isFornito_firma = true; 
                    this._isRichiesto_cn_firma = false; 
                    this._isRichiesto_csr_firma = false;

                    this._certificato_fornito_firma = this._currDatiSpecifici?.certificato?.certificato || null;
                    this._certificato_csr_firma = null;
                    this._modulo_richiesta_csr_firma = null;
                    break;
                case 'richiesto_cn': 
                    controls?.cn_firma?.setValidators(Validators.required);
                    controls?.cn_firma?.updateValueAndValidity();

                    this._isFornito_firma = false; 
                    this._isRichiesto_cn_firma = true; 
                    this._isRichiesto_csr_firma = false;

                    this._certificato_fornito_firma =  null;
                    this._certificato_csr_firma = null;
                    this._modulo_richiesta_csr_firma = null;
                    break;
                case 'richiesto_csr': 
                    controls?.content_firma?.setValidators(Validators.required);
                    controls?.content_firma?.updateValueAndValidity();
                    controls?.content_csr_firma?.setValidators(Validators.required);
                    controls?.content_csr_firma?.updateValueAndValidity();

                    this._isFornito_firma = false; 
                    this._isRichiesto_cn_firma = false; 
                    this._isRichiesto_csr_firma = true;

                    this._certificato_fornito_firma = null;
                    this._certificato_csr_firma = this._currDatiSpecifici?.certificato?.richiesta || null;;
                    this._modulo_richiesta_csr_firma = this._currDatiSpecifici?.certificato?.modulo_richiesta || null;;
                    break;
                default:
                    this._isFornito_firma = false; 
                    this._isRichiesto_cn_firma = false; 
                    this._isRichiesto_csr_firma = false;

                    this._certificato_fornito_firma =  null;
                    this._certificato_csr_firma = null;
                    this._modulo_richiesta_csr_firma = null;
                    this._modulo_richiesta_csr_firma_ceritifato = null;
                    break;
            }
        } else {
            this._isFornito_firma = false; 
            this._isRichiesto_cn_firma = false; 
            this._isRichiesto_csr_firma = false;

            this._resetCertificatesFirma();
        }

        // ================================
        this._editFormGroupClients.updateValueAndValidity()
        // ================================

    }

    __descrittoreChange(value: any, csr?: boolean ) {
        
        !csr ? csr = false : null;
        const controls = this._editFormGroupClients.controls;

        if (csr) {
            controls.filename_csr.patchValue(value.file);
            controls.estensione_csr.patchValue(value.type);
            controls.content_csr.patchValue(value.data);
        } else {
            controls.filename.patchValue(value.file);
            controls.estensione.patchValue(value.type);
            controls.content.patchValue(value.data);
        }
        this._editFormGroupClients.updateValueAndValidity();
        this._error = false;
        this._errorMsg = '';
    }

    __descrittoreChangeFirma(value: any, csr?: boolean ) {
        
        !csr ? csr = false : null;
        const controls = this._editFormGroupClients.controls;

        if (csr) {
            controls.filename_csr_firma.patchValue(value.file);
            controls.estensione_csr_firma.patchValue(value.type);
            controls.content_csr_firma.patchValue(value.data);
        } else {
            controls.filename_firma.patchValue(value.file);
            controls.estensione_firma.patchValue(value.type);
            controls.content_firma.patchValue(value.data);
        }
        this._editFormGroupClients.updateValueAndValidity();
        this._error = false;
        this._errorMsg = '';
    }

    _downloadAllegato(data: any) {
        // const _data = data.source;
        // this.__resetError();
        this._downloading = true;

        let _ambiente: string = this.environmentId;
        // this._collaudo ? _ambiente = 'collaudo' : _ambiente = 'produzione';
        
        const _partial = `${_ambiente}/client/${data.uuid}/download`;
        this.apiService.download(this.model, this.id, _partial).subscribe({
            next: (response: any) => {
                // const _ext = data.filename.split('/')[1];
                // let name: string = `${data.filename}.${_ext}`;
                let name: string = `${data.filename}`;
                saveAs(response.body, name);
                this._downloading = false;
            },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._downloading = false;
            }
        });
    }

    _showClients() {
        this._isConfigClients = true;
        this._loadAdesioneConfigClients();
    }

    _showEndpointAPI() {
        this._isConfigClients = false;
        this._loadAdesioneConfigErogazioni();
    }

    _checkTipoCertificato(auth_type: string = '', tipo_cert: string = '') {

        if (auth_type == 'https') {
            this._isFornito = (tipo_cert == 'fornito')
            this._isRichiesto_cn = (tipo_cert == 'richiesto_cn')
            this._isRichiesto_csr = (tipo_cert == 'richiesto_csr')
        }

        if (auth_type == 'https_sign') {
            this._isFornito = (tipo_cert == 'fornito')
            this._isRichiesto_cn = (tipo_cert == 'richiesto_cn')
            this._isRichiesto_csr = (tipo_cert == 'richiesto_csr')

            // this._isFornito_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'fornito')
            // this._isRichiesto_cn_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'richiesto_cn')
            // this._isRichiesto_csr_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'richiesto_csr')
        }
    }

    _resetAllAuthType() {
        this._isNoDati = false;
        this._isIndirizzoIP = false;
        this._isHttpBasic = false;
        this._isOauthAuthCode = false;
        this._isOauthClientCredentials = false;
        this._isHttps = false;
        this._isHttpsSign = false;
        this._isPdnd = false;
        this._isHttpsPdnd = false;
        this._isHttpsPdndSign = false;
        this._isSign = false;
        this._isSignPdnd = false;
    }

    _checkAndSetAuthTypeCase(auth_type: any = null) {

        const authTypes: any = this.authenticationService._getConfigModule('servizio').api.auth_type;
        const configAuthType = authTypes.find((x: any) => x.type == auth_type);
        if (configAuthType) {
            this._show_erogazione_ip_fruizione = configAuthType.indirizzi_ip || false;
            this._show_erogazione_rate_limiting = configAuthType.rate_limiting || false;
            this._show_erogazione_finalita = configAuthType.finalita || false;
        }

        this._resetAllAuthType();

        switch (auth_type) {
            case 'no_dati':
                this._isNoDati = true; 
                break;
            case 'indirizzo_ip':
                this._isIndirizzoIP = true; 
                break;
            case 'http_basic':
                this._isHttpBasic = true; 
                break;
            case 'oauth_authorization_code':
                this._isOauthAuthCode = true;
                break;
            case 'oauth_client_credentials':
                this._isOauthClientCredentials = true;
                break;
            case 'https':
                this._isHttps = true;
                break;
            case 'https_sign':
                this._isHttpsSign = true;
                break;
            case 'pdnd':
                this._isPdnd = true;
                break;
            case 'https_pdnd':
                this._isHttpsPdnd = true;
                break;
            case 'https_pdnd_sign':
                this._isHttpsPdndSign = true;
                break;
            case 'sign':
                this._isSign = true;
                break;
            case 'sign_pdnd':
                this._isSignPdnd = true;
                break;
            default:
                break;
        }
    }

    _removeNullProperties(obj: any) {
        Object.keys(obj).forEach((k: string) => {
            obj[k] == null ? delete obj[k] : null;
        })
    }

    _getProfilo(client: any) : string {
        return client.source.codice_interno;
    }

    _showDialogDissociaClient(item: any) {
        const initialState = {
            title: this.translate.instant('APP.TITLE.Attention'),
            messages: [
                this.translate.instant('APP.CLIENT.MESSAGES.DeassociateClient')
            ],
            cancelText: this.translate.instant('APP.BUTTON.Cancel'),
            confirmText: this.translate.instant('APP.BUTTON.Confirm'),
            confirmColor: 'danger'
        };

        this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
            ignoreBackdropClick: true,
            initialState: initialState
        });
        this._modalConfirmRef.content.onClose.subscribe(
            (response: any) => {
                if (response) {
                    this._codice_interno_profilo = this._getProfilo(item);
                    let _ambiente: string = this.environmentId;
                    // this._collaudo ? _ambiente = 'collaudo' : _ambiente = 'produzione';
                    const _url: any = this.adesione.id_adesione + '/' + _ambiente + '/client/' + this._codice_interno_profilo;

                    this.apiService.deleteElement(this.model, _url).subscribe(
                        (response) => {
                            this._loadAdesioneConfigClients();
                        },
                        (error) => {
                            this._error = true;
                            this._errorMsg = Tools.GetErrorMsg(error);
                        }
                    );
                }
            }
        );
    }

    _canEdit = (): boolean => {
        const _canEdit = this.authenticationService.canEdit('adesione', 'adesione', this.adesione?.stato, this._grant?.ruoli);
        return _canEdit;
    }

    _showMandatoryFields(data: any) {
        if (this.debugMandatoryFields) {
            console.group('Mandatory fields')
            let _nessuno: boolean = true;
            Object.keys(data).forEach((key, index) => {
                if (data[key].hasValidator(Validators.required)) {
                    console.log(index + ') ', key)
                    _nessuno = false
                    }
                
            });
            (_nessuno == true) ? console.log('NESSUN CAMPO OBBLIGATORIO') : null;
            console.groupEnd()
        }
    }

    _canAddMapper = (): boolean => {
        const _cnm = this.authenticationService._getClassesNotModifiable('adesione', 'adesione', this.adesione?.stato);
        const _lstPerm = [];
        if (this._collaudo && (_.indexOf(_cnm, 'collaudo') === -1) && (_.indexOf(_cnm, 'collaudo_configurato') === -1)) {
            _lstPerm.push(true);
        }
        if (!this._collaudo && (_.indexOf(_cnm, 'produzione') === -1) && (_.indexOf(_cnm, 'produzione_configurato') === -1)) {
            _lstPerm.push(true);
        }
        if (_lstPerm.length) {
            let _can = true;
            _lstPerm.forEach((value: boolean) => {
                _can = _can && value;
            });
            return _can && this._hasActions();
        }
        return false;
    }

    _isGestoreMapper = (): boolean => {
        return this.authenticationService.isGestore(this._grant?.ruoli);
    }
    
    _isConfiguratoMapper = (item: any): boolean => {
        let _isConfigurato = (item.source.stato === StatoConfigurazioneEnum.CONFIGURATO);
        const _isNomeProposto = item?.source?.nome_proposto ? true : false;
        if (_isNomeProposto) {
            _isConfigurato = false;
        }
        return _isConfigurato;
    }

    _isModifiableMapper = (item: any = null): boolean => {
        if (this._grant) {
            if ((this.environmentId === 'collaudo') && (this._grant.collaudo === RightsEnum.Scrittura)) {
                return true;
            }
            if ((this.environmentId === 'produzione') && (this._grant.produzione === RightsEnum.Scrittura)) {
                return true;
            }
        }
        return false;
    }

    _isModifiableMapperOld = (item: any = null): boolean => {
        const _isNotModifiable = this.authenticationService._getClassesNotModifiable('adesione', 'adesione', this.adesione?.stato);
        const _lstPerm = [];
        if (this.authenticationService.isGestore(this._grant?.ruoli)) {
            _lstPerm.push(true);
        }
        if (this._collaudo && (_.indexOf(_isNotModifiable, 'collaudo') === -1 && _.indexOf(_isNotModifiable, 'collaudo_configurato') === -1)) {
            _lstPerm.push(true);
        }
        if (!this._collaudo && (_.indexOf(_isNotModifiable, 'produzione') === -1 && _.indexOf(_isNotModifiable, 'produzione_configurato') === -1)) {
            _lstPerm.push(true);
        }
        if (_lstPerm.length) {
        let _can = true;
            _lstPerm.forEach((value: boolean) => {
                _can = _can && value;
            });

            let _isModificabile = (_can && this._hasActions()) || (item && (item.source ? (item.source.stato !== StatoConfigurazioneEnum.CONFIGURATO) : item.stato !== StatoConfigurazioneEnum.CONFIGURATO));
            const _isNomeProposto = item?.source?.nome_proposto ? true : false;
            if (_isNomeProposto) {
                _isModificabile = true;
            }
            return _isModificabile;
        }
        return false;
    }

    _hasActions() {
        if (this.authenticationService.isGestore(this._grant?.ruoli)) { return true; }
        if (this.adesione) {
            const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', this._grant?.ruoli);
            return _statoSuccessivo;
        }
        return false;
    }
}
