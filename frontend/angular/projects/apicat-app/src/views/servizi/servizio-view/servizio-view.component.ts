import { AfterContentChecked, Component, ElementRef, HostListener, Inject, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Grant } from '@app/model/grant';

import { AgidJwtDialogComponent } from '@app/components/authemtications-dialogs/agid-jwt-dialog/agid-jwt-dialog.component';
import { ClientCredentialsDialogComponent } from '@app/components/authemtications-dialogs/client-credentials-dialog/client-credentials-dialog.component';
import { AgidJwtSignatureDialogComponent } from '@app/components/authemtications-dialogs/agid-jwt-signature-dialog/agid-jwt-signature-dialog.component';
import { AgidJwtTrackingEvidenceDialogComponent } from '@app/components/authemtications-dialogs/agid-jwt-tracking-evidence-dialog/agid-jwt-tracking-evidence-dialog.component';
import { CodeGrantDialogComponent } from '@app/components/authemtications-dialogs/code-grant-dialog/code-grant-dialog.component';
import { AgidJwtSignatureTrackingEvidenceDialogComponent } from '@app/components/authemtications-dialogs/agid-jwt-signature-tracking-evidence-dialog/agid-jwt-signature-tracking-evidence-dialog.component';

import { MenuAction } from 'projects/components/src/lib/classes/menu-action';
import { EventType } from 'projects/tools/src/lib/classes/events';

import { environment } from '@app/environments/environment';

export const EROGATO_SOGGETTO_DOMINIO: string = 'erogato_soggetto_dominio';
export const EROGATO_SOGGETTO_ADERENTE: string = 'erogato_soggetto_aderente';

declare const saveAs: any;
import * as _ from 'lodash';
import { ApiConfigurationRead, ApiReadDetails, CustomProperty, CustomPropertyDefinition } from '../servizio-api-details/servizio-api-interfaces';

export interface Organization {
    id_organizzazione: string;
    nome: string;
    descrizione: string;
    codice_ente: string;
    codice_fiscale_soggetto: string;
    id_tipo_utente: string;
    referente: boolean;
    aderente: boolean;
    multi_soggetto: boolean;
}

export interface User {
    id_utente: string;
    nome: string;
    cognome: string;
    telefono_aziendale: string;
    email_aziendale: string;
    username: string;
    stato: string;
    ruolo: string;
    organizzazione?: Organization;
    classi_utente: string[];
}

export interface Referent {
    utente: User;
    tipo: 'referente' | 'referente_servizio' | 'referente_tecnico' | 'referente_dominio';
}

export interface ReferentView {
    id: string;
    name: string;
    email: string;
    types: string[];
}

@Component({
    selector: 'app-servizio-view',
    templateUrl: 'servizio-view.component.html',
    styleUrls: ['servizio-view.component.scss']
})
export class ServizioViewComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
    static readonly Name = 'ServizioViewComponent';
    readonly model: string = 'servizi';

    @ViewChild("myScroll") myScroll!: ElementRef;
    @ViewChild('openApiInfoTemplate') openApiInfoTemplate!: any;

    id: number | null = null;
    data: any = null;
    config: any = null;

    _profili: any = null;
    _proprieta_custom: CustomPropertyDefinition[] = [];

    Tools = Tools;

    // dominio: any = null;
    richiedente: any = null;
    anagrafiche: any = null;
    referenti: ReferentView[] = [];
    referentiLoading: boolean = true;
    serviceApi: any[] = [];
    serviceApiDominio: any[] = [];
    serviceApiAderente: any[] = [];
    serviceApiGrouped: any = null;
    serviceApiLoading: boolean = true;
    _singleApi: boolean = false;
    
    apiConfigCopy: any = null;
    apiConfig: any = null;

    appConfig: any;

    _spin: boolean = true;
    _downloading: boolean = false;
    _showScroll: boolean = false;
    desktop: boolean = false;

    _useRoute: boolean = true;

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
        { label: '...', url: '', type: 'link' }
    ];

    _error: boolean = false;
    _errorMsg: string = '';

    minLengthTerm = 1;

    generalConfig: any = Tools.Configurazione;

    _singleColumn: boolean = false;

    _isPresentationView: boolean = true;

    _defaultLogo: string = './assets/images/logo-servizio.png';

    api_url: string = '';

    _maxReferenti: number = 3;

    _grant: Grant | null = null;
    _ammissibili: string[] = [];
    _updateData: string = '';

    _hasJoined: boolean = false;

    _modalInfoRef!: BsModalRef;

    generateJwtOpened: boolean = false;

    _environmentId: 'collaudo' | 'produzione' = 'collaudo';
    _currentApi: ApiReadDetails|null = null;
    _currentApiConfiguration: ApiConfigurationRead|null = null;

    allowTryIt: boolean = false;
    showAuthorizeBtn: boolean = false;

    showJwtGenerator: boolean = false;
    codiceTokenPolicy: string = '';
    tipoTokenPolicy: string = '';

    authenticationsList: MenuAction[] = [
        new MenuAction({ type: 'menu', title: 'Client Credentials (ClientCredentialsDialogComponent)', icon: '', subTitle: '', action: 'client_credentials', enabled: true }),
        new MenuAction({ type: 'menu', title: 'Code Grant (CodeGrantDialogComponent)', icon: '', subTitle: '', action: 'code_grant', enabled: true }),
        new MenuAction({ type: 'menu', title: 'PDND (AgidJwtDialogComponent)', icon: '', subTitle: '', action: 'pdnd', enabled: true }),
        new MenuAction({ type: 'menu', title: 'PDND Audit (AgidJwtTrackingEvidenceDialogComponent)', icon: '', subTitle: '', action: 'pdnd_audit', enabled: true}),
        new MenuAction({ type: 'menu', title: 'PDND Integrity (AgidJwtSignatureDialogComponent)', icon: '', subTitle: '', action: 'pdnd_integrity', enabled: true }),
        new MenuAction({ type: 'menu', title: 'PDND Audit Integrity (AgidJwtSignatureTrackingEvidenceDialogComponent)', icon: '', subTitle: '', action: 'pdnd_audit_integrity', enabled: true })
    ];

    resultGenerazioneJwt: any = null;
    resultGenerazioneJwtList: any[] = [];
    _showMessageClipboard: boolean = false;

    debug: boolean = !environment.production;

    tokenPolicy: any = null;

    constructor (
        private route: ActivatedRoute,
        private router: Router,
        private clipboard: Clipboard,
        private translate: TranslateService,
        private modalService: BsModalService,
        private configService: ConfigService,
        public tools: Tools,
        private eventsManagerService: EventsManagerService,
        private apiService: OpenAPIService,
        private utils: UtilService,
        private authenticationService: AuthenticationService
    ) {
        this.appConfig = this.configService.getConfiguration();
        this.api_url = this.appConfig.AppConfig.GOVAPI.HOST;
        const _srv: any = Tools.Configurazione?.servizio || null;
        this._profili = (_srv && _srv.api) ? _srv.api.profili : [];
        this._proprieta_custom = (_srv && _srv.api) ? _srv.api.proprieta_custom : [];
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['sid']) {
                this.id = params['sid'];
                this.configService.getConfig(this.model).subscribe(
                    (config: any) => {
                        this.config = config;
                        this._singleColumn = config.editSingleColumn || false;
                        this.allowTryIt = config.swagger?.allowTryIt || false;
                        this.showAuthorizeBtn = config.swagger?.showAuthorizeBtn || false;
                        this._loadAll();
                    }
                );
            } else {
                console.log('NO params', params);
            }
        });

        this.eventsManagerService.on(EventType.PROFILE_UPDATE, (event: any) => {
            const _srv: any = Tools.Configurazione.servizio;
            this._profili = (_srv && _srv.api) ? _srv.api.profili : [];
            this._proprieta_custom = (_srv && _srv.api) ? _srv.api.proprieta_custom : [];
        });
    }

    ngOnDestroy() {
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
                        this._spin = false;
                        this._initBreadcrumb();
                        this.loadCurrentData();

                        if (!this.data.adesione_disabilitata && !this.authenticationService.isAnonymous()) {
                            this._loadJoined(false);
                            this._loadAmmissibili(false);
                        }
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

    _loadJoined(spin: boolean = true) {
        if (this.id) {
            this._spin = spin;
            if (spin) { this.data = null; }
            let aux: any;
            const query: any = { id_servizio: this.id };
            aux = { params: this.utils._queryToHttpParams(query) };
            this.apiService.getList('adesioni', aux).subscribe({
                next: (response: any) => {
                    this._hasJoined = response.content.length > 0;
                },
                error: (error: any) => {
                    Tools.OnError(error);
                    this._spin = false;
                }
            });
        }
    }

    _loadAmmissibili(spin: boolean = true) {
        if (this.id) {
            this._spin = spin;
            if (spin) { this.data = null; }
            this.apiService.getDetails('servizi', this.id, 'ammissibili').subscribe({
                next: (response: any) => {
                    this._ammissibili = response.content;
                    this._updateData = new Date().getTime().toString();
                },
                error: (error: any) => {
                    Tools.OnError(error);
                    this._spin = false;
                }
            });
        }
    }

    loadCurrentData() {
        this.richiedente = this.data.utente_richiedente;

        this.loadReferenti();
        this._loadServiceApi();
    }

    loadReferenti() {
        this.referenti = [];
        this.referentiLoading = true;
        forkJoin({
            referenti: this.apiService.getDetails(this.model, this.id, 'referenti'),
            referentiDominio: this.apiService.getDetails('domini', this.data.dominio.id_dominio, 'referenti')
        }).subscribe({
            next: (response: any) => {
                const referents: Referent[] = response.referenti.content.map((item: any) => ({ ...item, tipo: `${item.tipo}_servizio` }));
                const domainReferents: Referent[] = response.referentiDominio.content.map((item: any) => ({ ...item, tipo: `${item.tipo}_dominio` }));

                const reduceReferents = (acc: ReferentView[], cur: Referent) => {
                    const index = acc.findIndex((item: ReferentView) => item.id === cur.utente.id_utente);
                    if (index === -1) {
                        acc.push({
                            id: cur.utente.id_utente,
                            email: cur.utente.email_aziendale,
                            name: `${cur.utente.nome} ${cur.utente.cognome}`,
                            types: [cur.tipo !== 'referente' || !cur.utente.ruolo ? cur.tipo : cur.utente.ruolo]
                        });
                    } else {
                        acc[index].types.push(cur.tipo);
                    }
                    return acc;
                };

                const allReferents = [
                    ...domainReferents.filter((ref: any) => { return ((ref.tipo === 'referente_dominio') && this.config.showDomainReferent);}),
                    ...referents.filter((ref: any) => { return ((ref.tipo !== 'referente_tecnico_servizio') || this.config.showTechnicalReferent);})
                ];
                this.referenti = allReferents.reduce(reduceReferents, []);

                this.referentiLoading = false;
            },
            error: (error: any) => {
                Tools.OnError(error);
                this._spin = false;
                this.referentiLoading = false;
            }
        });
    }

    _loadServiceApi() {
        this.configService.getConfig('api').subscribe(
            (config: any) => {
                this.apiConfigCopy = JSON.parse(JSON.stringify(config));
                this.apiConfig = JSON.parse(JSON.stringify(config));
                this._loadApis();
            }
        );
    }

    _getProfiloLabelMapper(cod: string) {
        const _profilo = this._profili.find((item: any) => item.codice_interno === cod);
        return _profilo ? _profilo.etichetta : cod;
    }

    _loadApis() {
        this.serviceApiLoading = true;
        const reqs: Observable<any>[] = [];
        let aux: any;
        const query: any = { id_servizio: this.id };
        query.ruolo = EROGATO_SOGGETTO_DOMINIO;
        aux = { params: this.utils._queryToHttpParams(query) };
        reqs.push(
            this.apiService.getList('api', aux)
                .pipe(
                    catchError((err) => {
                        return of({ items: [] });
                    })
                )
        );
        query.ruolo = EROGATO_SOGGETTO_ADERENTE;
        aux = { params: this.utils._queryToHttpParams(query) };
        reqs.push(
            this.apiService.getList('api', aux)
                .pipe(
                    catchError((err) => {
                        return of({ items: [] });
                    })
                )
        );

        const profiloLabelI18n = this.translate.instant(`APP.LABEL.Profilo`);
        const defaultLabelI18n = this.translate.instant(`APP.LABEL.Multipli`);

        forkJoin(reqs).subscribe(
            (results: Array<any>) => {
                this.apiConfig = JSON.parse(JSON.stringify(this.apiConfigCopy));
                this.serviceApiDominio = results[0].content.map((api: ApiReadDetails) => {
                    type Vetrina = CustomProperty & {gruppo: string};

                    let vetrina_properties: Vetrina[] = [];

                    vetrina_properties = this._proprieta_custom.reduce((acc, item) => {
                        const properties = item.proprieta.filter((prop) => prop.vetrina && item.classe_dato === this._environmentId).map(prop => {
                            return { ...prop, gruppo: item.nome_gruppo };
                        });
                        acc.push(...properties);
                        return acc;
                    }, vetrina_properties);

                    let proprieta_api: {
                        key: string;
                        nome: string;
                        valore: string;
                    }[] = [];
                    
                    proprieta_api = api.proprieta_custom.reduce((acc, item) => {
                        const properties = item.proprieta.filter((prop) => vetrina_properties.some((vetrina) => vetrina.nome === prop.nome && vetrina.gruppo === item.gruppo));
                        acc.push(...properties.map((prop) => {
                            const vetrina = vetrina_properties.find((vetrina) => vetrina.nome === prop.nome);
                            const key = vetrina?.nome || 'unknown';
                            const nome = vetrina?.vetrina?.label || 'unknown';
                            const template = vetrina?.vetrina?.template || 'unknown';
                            
                            const etichetta = vetrina?.valori?.find((valore) => valore.nome == prop.valore)?.etichetta || prop.valore;

                            const valore = template.replace('${valore}', etichetta);

                            return { key, nome, valore };
                        }));
                        return acc;
                    }, proprieta_api);

                    const tipProfiloValue = api?.gruppi_auth_type?.length === 1 ? api.gruppi_auth_type[0].profilo : defaultLabelI18n;
                    const tipoProfilo = this._getProfiloLabelMapper(tipProfiloValue);
                    let returnValue: any = { ...api, tipo_profilo: `${profiloLabelI18n}:${tipoProfilo}` };

                    proprieta_api.reverse().forEach((item) => {
                        returnValue[item.key] = item.valore;

                        if(this.apiConfig.itemRowView.secondaryText.some((element: any) => element.field === item.key)) {
                            return;
                        }

                        this.apiConfig.itemRowView.secondaryText.unshift({
                            field: item.key,
                            type: 'label',
                            options: item.key,
                            badged: true,
                            emptySpace: true
                        });

                        this.apiConfig.options[item.key] = {
                            label: item.nome,
                            small: true,
                            values: {
                                default: { label: item.nome, background: '#5897cb', border: '#5897cb', color: '#ffffff' }
                            }
                        };

                    });

                    return returnValue;
                    
                });
                this.serviceApiAderente = results[1].content.map((api: any) => {
                    return { ...api };
                })
                this.serviceApiLoading = false;
                this._singleApi = (this.serviceApiDominio.length === 1) && (this.serviceApiAderente.length === 0);
            },
            (error: any) => {
                console.log('_loadApis forkJoin error', error);
                this.serviceApiLoading = false;
            }
        );
    }

    _initBreadcrumb() {
        const _title = this.data ? this.data.nome + ' v. ' + this.data.versione : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
        this.breadcrumbs = [
            { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
            { label: `${_title}`, url: '', type: 'title' }
        ];
    }

    onBreadcrumb(event: any) {
        if (this._useRoute) {
            this.router.navigate([event.url]);
        }
    }

    gotoManagement() {
        const url = `/servizi/${this.id}`;
        this.router.navigate([url]);
    }

    _getLogoMapper = (bg: boolean = false): string => {
        return this.data.immagine ? `${this.api_url}/servizi/${this.data.id_servizio}/immagine`: this._defaultLogo;
    }

    _getApiUrlMapper = (api: any): string => {
        const tryItOut = this. allowTryIt ? '?try_out=true' : '';
        return api ? `${this.api_url}/api/${api.id_api}/specifica/${this._environmentId}/download${tryItOut}` : '';
    }

    _canDownloadDescriptor() {
        return this.authenticationService.canJoin('servizio', this.data.stato);
    }

    _canDownloadDescriptorMapper = (): boolean => {
        return this._canDownloadDescriptor();
    }

    _downloadServizioExport() {
        this._error = false;
        this._errorMsg = '';
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

    _canJoin() {
        return this.authenticationService.canJoin('servizio', this.data.stato) && !this.data.adesione_disabilitata;
    }

    _canJoinMapper = (): boolean => {
        return this._canJoin() && !this.isComponente;
    }

    _joinServizio() {
        this.router.navigate(['servizi', this.id, 'adesioni', 'new', 'edit'], { queryParams: { web: true } });
    }

    _gotoAdesione() {
        this.router.navigate(['servizi', this.id, 'adesioni'], { queryParams: { web: true } });
    }

    _gotoAdesioni() {
        this.router.navigate(['servizi', this.id, 'adesioni']);
    }

    get isComponente() {
        return this.data.visibilita === 'componente' || false;
    }

    _onShowApi(event: any, data: ApiReadDetails) {
        this.resultGenerazioneJwt = null;
        this.resultGenerazioneJwtList = [];
        this._currentApi = data;
        this._currentApiConfiguration = (this._environmentId === 'collaudo' ? data.configurazione_collaudo : data.configurazione_produzione) || null;
        const profili = this.authenticationService._getConfigModule('servizio')?.api?.profili || [];
        const apiProfilo = this._currentApi.gruppi_auth_type ? this._currentApi.gruppi_auth_type[0].profilo : '';
        const profilo = profili.find((item: any) => item.codice_interno === apiProfilo);
        this.codiceTokenPolicy = profilo?.codice_token_policy || '';
        this.tipoTokenPolicy = this._getTipoTokenPolicy(this.codiceTokenPolicy);
        const _srv: any = Tools.Configurazione.servizio;
        this.tokenPolicy = _srv.api?.token_policies?.find((item: any) => item.tipo_policy === this.tipoTokenPolicy);
        this.showJwtGenerator = this.allowTryIt && this._environmentId !== 'produzione';
        // console.group('Show APi');
        // console.log('profili', profili);
        // console.log('profilo', apiProfilo, profilo);
        // console.log('codiceTokenPolicy', this.codiceTokenPolicy);
        // console.log('tipoTokenPolicy', this.tipoTokenPolicy);
        // console.log('showJwtGenerator', this.showJwtGenerator);
        // console.groupEnd();
        this._openApiInfo();
    }

    _openApiInfo() {
        this._modalInfoRef = this.modalService.show(this.openApiInfoTemplate, {
            id: 'open-api-info',
            ignoreBackdropClick: false,
            class: 'modal-lg-custom modal-with-65'
        });
    }

    closeModal(){
        this._modalInfoRef.hide();
        this.resultGenerazioneJwt = null;
        this.resultGenerazioneJwtList = [];
    }

    _getTipoTokenPolicy(type: string) {
        const negoziazione = this.authenticationService._getConfigModule('servizio')?.api?.token_policies?.find((item: any) => item.codice_policy === type);
        return negoziazione?.tipo_policy || '';
    }

    _getTitleProfiloNegoziazionMapper = (type: string) => {
        return this.translate.instant(`APP.AUTHENTICATION.TITLE.NEGOTIATION.${this.tipoTokenPolicy}`);
    }

    _onActionApi(event: any) {
        this._error = false;
        this._errorMsg = '';
        this._downloading = true;
        const _partial = `specifica/${this._environmentId}/download?includi_doc_allegati=true`;
        this.apiService.download('api', event.id_api, _partial).subscribe({
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

    _onGenerateToken(type: any) {
        let component = null;
        switch (type) {
            case 'client_credentials':
                component = ClientCredentialsDialogComponent;
                break;
            case 'code_grant':
                component = CodeGrantDialogComponent;
                break;
            case 'pdnd':
                component = AgidJwtDialogComponent;
                break;
            case 'pdnd_audit':
                component = AgidJwtTrackingEvidenceDialogComponent;
                break;
            case 'pdnd_integrity':
                component = AgidJwtSignatureDialogComponent;
                break;
            case 'pdnd_audit_integrity':
                component = AgidJwtSignatureTrackingEvidenceDialogComponent;
                break;
        }
        if (component) {
            this.resultGenerazioneJwt = null;
            this.resultGenerazioneJwtList = [];
            this.generateJwtOpened = true;
            const initialState: any = {
                debug: this.debug,
                tokenPolicy: this.tokenPolicy
            };
            this.utils._openGenerateTokenDialog(component, initialState, (data: any) => {
                this.generateJwtOpened = false;
                // Fix: when the nested modal is closed it removes the "modal-open" class from the body
                document.body.classList.add('modal-open');
                if (data && data.result) {
                    this.resultGenerazioneJwt = Object.keys(data.result).length > 0 ? data.result : null;
                    if (this.resultGenerazioneJwt) {
                        this.resultGenerazioneJwtList = Object.keys(this.resultGenerazioneJwt).map((key: any) => {
                            return { label: key, value: this.resultGenerazioneJwt[key] };
                        });
                    }
                }
            });
        } else {
            Tools.Alert(this.translate.instant('APP.AUTHENTICATION.MESSAGE.NoTokenGenerator'));
        }
    }

    onResultCopyClipboard(item: any) {
        this.clipboard.copy(item.value || '--no value--');
        this._showMessageClipboard = true;
        setTimeout(() => {
            this._showMessageClipboard = false;
        }, 3000);
    }

    _canEditMapper = (): boolean => {
        return this.authenticationService.canEdit('servizio', 'servizio', this.data.stato, this._grant?.ruoli);
    }

    _canManagementMapper = (): boolean => {
        const _canManagement = this.authenticationService.canManagement('servizio', 'servizio', this.data.stato, this._grant?.ruoli);
        const _isPackage = this.data && this.data.package || false;
        const _isGestore = this.authenticationService.isGestore(this._grant?.ruoli);
        const _canMonitoraggio = this.authenticationService.canMonitoraggio(this._grant?.ruoli);
        return _isPackage ? _isGestore : _canManagement;
    }

    _canMonitoraggioMapper = (): boolean => {
        return this.authenticationService.canMonitoraggio(this._grant?.ruoli);
    }

    _canManagementComunicazioniMapper = (): boolean => {
        return this.data &&this.authenticationService.canManagementComunicazioni('servizio', 'servizio', this.data.stato, this._grant?.ruoli);
    }

    _isAmmissibile() {
        const user = this.authenticationService.getUser();
        const id_organizzazione = user && user.organizzazione ? user.organizzazione.id_organizzazione : '';
        const index = this._ammissibili.findIndex((item: any) => item.id_organizzazione === id_organizzazione);
        return (index !== -1);
    }

    _isAmmissibileMapper = (): boolean => {
        return this._isAmmissibile();
    }

    _isGestoreMapper = (): boolean => {
        return this.authenticationService.isGestore(this._grant?.ruoli);
    }

    _isReferenteMapper = (): boolean => {
        return (_.indexOf(this._grant?.ruoli, 'referente') !== -1);
    }

    _isReferenteTecnicoAdesioneMapper = (): boolean => {
        return (_.indexOf(this._grant?.ruoli, 'referente_tecnico') !== -1);
    }

    onActionMonitor(event: any) {
        switch (event.action) {
            case 'gestione':
                this.gotoManagement();
                break;
            default:
                localStorage.setItem('SERVIZI_VIEW', 'TRUE');
                const url = `/servizi/${this.id}/${event.action}`;
                this.router.navigate([url]);
                break;
        }
    }

    // ScrollTo

    onScroll(e: Event): void {
        this._showScroll = (this._getYPosition(e) > 180);
    }

    _getYPosition(e: Event): number {
        return (e.target as Element).scrollTop;
    }

    scrollTo(id: string) {
        const box = document.querySelector('.container-scroller');
        const targetElm = document.getElementById(id);
        this.scrollToElm(box, targetElm, 600);
    }

    scrollToElm(container: any, elm: any, duration: number){
        var pos = this.getRelativePos(elm);

        this._scrollTo(container, pos.top, duration);  // duration in seconds
    }

    getRelativePos(elm: any){
        const pPos: any = elm.parentNode.getBoundingClientRect(), // parent pos
            cPos: any = elm.getBoundingClientRect(), // target pos
            pos: any = {};

        pos.top    = cPos.top    - pPos.top + elm.parentNode.scrollTop + (pPos.bottom - pPos.top),
        pos.right  = cPos.right  - pPos.right,
        pos.bottom = cPos.bottom - pPos.bottom,
        pos.left   = cPos.left   - pPos.left;

        return pos;
    }
    
    _scrollTo(element: any, to: any, duration: number) {
        var start = element.scrollTop,
            change = to - start;

        element.scrollTop = start + change;
    }

    _onScrollToTop() {
        const _curPos = this.myScroll.nativeElement.scrollTop;
        this.myScroll.nativeElement.scrollTop = 0;
    }

    onAvatarError(event: any) {
        event.target.src = './assets/images/avatar.png'
    }
}
