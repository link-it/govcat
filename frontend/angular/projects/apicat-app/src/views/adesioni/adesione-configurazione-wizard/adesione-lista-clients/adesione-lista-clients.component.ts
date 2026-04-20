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
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { MarkdownModule } from 'ngx-markdown';

import { COMPONENTS_IMPORTS, EventsManagerService, Tools, EventType } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MapperPipe } from '@app/lib/pipes/mapper.pipe';
import { ModalEditClientComponent, ModalEditClientInput, ModalEditClientLayout } from './modal-edit-client/modal-edit-client.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService, Certificato } from '@app/services/utils.service';

import { Grant, RightsEnum } from '@app/model/grant';
import { TipoClientEnum, SelectedClientEnum, StatoConfigurazioneEnum } from '../../adesione-configurazioni/adesione-configurazioni.component';
import { AmbienteEnum } from '@app/model/ambienteEnum';

import { PeriodEnum, Datispecifici, DatiSpecItem, CommonName, DoubleCert } from '../../adesione-configurazioni/datispecifici';

import { EMPTY, Observable, Subject, of } from 'rxjs';
import { concatMap, expand, map, reduce, takeUntil, tap } from 'rxjs/operators';

import {
    AuthType,
    CertificateMode,
    ClientDialogInput,
    CredentialsMode,
    FormConfig,
    Scenario,
    authIsPdndVariant,
    authRequiresCertAuth,
    authRequiresCertSign,
    authRequiresClientId,
    authRequiresOauthUrls,
    authRequiresUsername,
    computeFormConfig
} from './client-dialog-state';

declare const saveAs: any;
import * as _ from 'lodash';

import { CkeckProvider, ClassiEnum, DataStructure } from '@app/provider/check.provider';

@Component({
    selector: 'app-adesione-lista-clients',
    templateUrl: './adesione-lista-clients.component.html',
    styleUrls: ['./adesione-lista-clients.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        MapperPipe,
        TooltipModule,
        NgSelectModule,
        MarkdownModule,
        ModalEditClientComponent
    ]
})
export class AdesioneListaClientsComponent implements OnInit, OnDestroy {

    private readonly _destroy$ = new Subject<void>();

    @Input() id: number = 0;
    @Input() adesione: any = null;
    @Input() config: any = null;
    @Input() grant: Grant | null = null;
    @Input() environment: string = '';
    @Input() singleColumn: boolean = false;
    @Input() isEdit: boolean = false;
    @Input() otherClass: string = '';
    @Input() dataCheck: DataStructure = { esito: 'ok', errori: [] };
    @Input() nextState: any = null;
    @Input() disclaimers: any[] = [];
    
    completed: boolean = true;

    model: string = 'adesioni';

    adesioneClients: any = null;

    spin: boolean = false;

    ClassiEnum = ClassiEnum;

    updateMapper: string = '';

    SelectedClientEnum = SelectedClientEnum;

    debugMandatoryFields: boolean = false;

    constructor(
        private readonly modalService: BsModalService,
        private readonly translate: TranslateService,
        private readonly apiService: OpenAPIService,
        private readonly authenticationService: AuthenticationService,
        private readonly utils: UtilService,
        private readonly eventsManagerService: EventsManagerService,
        private readonly ckeckProvider: CkeckProvider
    ) { }

    ngOnInit() {
        this.initData();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.dataCheck) {
            this.dataCheck = changes.dataCheck.currentValue;
            this.updateMapper = new Date().getTime().toString();
        }
    }

    initData() {
        this.initTipiCertificato('');
        this.loadAdesioneClients(this.environment);
    }

    initTipiCertificato(auth_type: string) {
        this._tipiCertificato = [];

        const authTypes: any = this.authenticationService._getConfigModule('servizio')?.api?.auth_type || [];

        const certificato: Certificato | null = this.utils.getCertificatoByAuthType(authTypes, auth_type);
        if (certificato) {
            // Nota: l'originale settava `_isRichiesto_csr` qui con semantica
            // "csr_modulo supportato dall'auth type" — conflitto con la flag
            // "user ha selezionato richiesto_csr". Ora che la flag e' stata
            // rimossa, `csr_modulo` e' implicitamente codificato nei
            // `_tipiCertificato` ritornati da `getTipiCertificatoAttivi`.
            this._tipiCertificato = this.utils.getTipiCertificatoAttivi(certificato).map((c: string) => { return { nome: c, valore: c }; });
        }
    }

    private loadAdesioneClients(environment: string, ignoreSpin: boolean = false) {
        const _configGenerale = Tools.Configurazione;

        if (this.id) {
            this.spin = ignoreSpin ? false : true;
            if (!ignoreSpin) { this.adesioneClients = []; }
            this.apiService.getDetails(this.model, this.id, environment + '/client').subscribe({
                next: (response: any) => {
                    const _clientsArr: any = [];
                    // clclo sui client_richiesti per sottoscrivere l'adesione
                    _.uniqWith(this.adesione.client_richiesti, _.isEqual).map((item: any) => {

                        // guardo la configurazione (da general config) per il profilo item.profilo
                        const _temp_profilo: any = _configGenerale.servizio.api.profili.find((pro: any) => { return pro.codice_interno === item.profilo });
                        
                        // guardo se IP è da richiedere oppure no
                        const _temp_auth_type_info: any = _configGenerale.servizio.api.auth_type.find((pro: any) => { return pro.type === _temp_profilo.auth_type });

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
                                if (this.authenticationService.isGestore(this.grant?.ruoli)) {
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
                    });

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

                    this.adesioneClients = [ ..._list ];

                    this.adesioneClients.map((el: any) => {
                        if (el.source.stato != StatoConfigurazioneEnum.CONFIGURATO) {
                            el.id_client = null;
                            el.source.id_client = null;
                        }
                    });

                    this.spin = false;
                },
                error: () => {
                    this.spin = false;
                }
            });
        }
    }

    isStatusPubblicatoCollaudodMapper = (_update: string, stato: string): boolean => {
        return stato === 'pubblicato_produzione';
    }

    getSottotipoGroupCompletedMapper = (update: string, tipo: string): number => {
        // Caso 1: Skip collaudo attivo e ambiente è Collaudo - mostra grigio (non applicabile)
        if (this.environment === AmbienteEnum.Collaudo && this.adesione?.skip_collaudo) {
            return 2; // grigio - non applicabile
        }

        // Caso 2: Siamo in fase di collaudo e ambiente è Produzione - mostra grigio (non ancora applicabile)
        if (this.environment === AmbienteEnum.Produzione && this._isInCollaudoPhase()) {
            return 2; // grigio - non ancora applicabile
        }

        if (this.isSottotipoGroupCompletedMapper(update, tipo)) {
            return this.nextState?.dati_non_applicabili?.includes(this.environment) ? 2 : 1;
        } else {
            return this._hasCambioStato() ? 0 : 1;
        }
    }

    /**
     * Verifica se l'adesione è nella fase di collaudo (cioè non ancora passata alla produzione)
     */
    _isInCollaudoPhase(): boolean {
        const collaudoStates = [
            'bozza',
            'richiesto_collaudo',
            'autorizzato_collaudo',
            'in_configurazione_collaudo',
            'in_configurazione_automatica_collaudo',
            'in_configurazione_manuale_collaudo'
        ];
        return !this.adesione?.skip_collaudo && collaudoStates.includes(this.adesione?.stato);
    }

    isSottotipoGroupCompletedMapper = (_update: string, tipo: string): boolean => {
        return this.ckeckProvider.isSottotipoGroupCompleted(this.dataCheck, this.environment, tipo);
    }

    isSottotipoCompletedMapper = (_update: string, tipo: string, identificativo: string): boolean => {
        return this._hasCambioStato() ? this.ckeckProvider.isSottotipoCompleted(this.dataCheck, this.environment, tipo, identificativo) : true;
    }

    _isGestoreMapper = (): boolean => {
        return this.authenticationService.isGestore(this.grant?.ruoli);
    }
    
    _isConfiguratoMapper = (item: any): boolean => {
        let _isConfigurato = (item.source.stato === StatoConfigurazioneEnum.CONFIGURATO);
        const _isNomeProposto = item?.source?.nome_proposto ? true : false;
        if (_isNomeProposto) {
            _isConfigurato = false;
        }
        return _isConfigurato;
    }

    /**
     * Disclaimer (lista) da mostrare sotto la riga del client: filtra
     * gli `disclaimers` (gia' filtrati per contesto = ambiente dal
     * parent) per quelli con `profilo` coincidente col profilo del
     * client corrente. I disclaimer senza `profilo` non si riferiscono
     * a uno specifico client e vengono scartati.
     */
    _clientDisclaimers = (item: any = null): any[] => {
        if (!item || !this.disclaimers?.length) return [];
        const profiloClient: string = item?.source?.profilo || item?.source?.codice_interno;
        if (!profiloClient) return [];
        return this.disclaimers.filter(d => d?.profilo && d.profilo === profiloClient);
    }

    _getDisclaimerIconClass(severity?: string): string {
        switch (severity) {
            case 'ERROR': return 'bi bi-x-circle text-danger';
            case 'WARNING': return 'bi bi-exclamation-triangle text-warning';
            case 'INFO':
            default: return 'bi bi-info-circle text-info';
        }
    }

    _getDisclaimerLinkHref(link: any): string {
        return link?.url || link?.href || '';
    }

    _getDisclaimerLinkLabel(link: any): string {
        return link?.label || link?.title || link?.text || link?.url || link?.href || '';
    }

    _isModifiableMapper = (_item: any = null): boolean => {
        if (this.grant) {
            if ((this.environment === AmbienteEnum.Collaudo) && (this.grant.collaudo === RightsEnum.Scrittura)) {
                return true;
            }
            if ((this.environment === AmbienteEnum.Produzione) && (this.grant.produzione === RightsEnum.Scrittura)) {
                return true;
            }
        }
        return false;
    }

    _hasCambioStato() {
        if (this.authenticationService.isGestore(this.grant?.ruoli)) { return true; }
        const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', this.grant?.ruoli);
        return _statoSuccessivo;
    }

    onEdit(client: any) {
        this._onEditClient(client);
    }

    confirmDissociaClient(data: any) {
        const initialState = {
            title: this.translate.instant('APP.TITLE.Attention'),
            cancelText: this.translate.instant('APP.BUTTON.Cancel'),
            confirmText: this.translate.instant('APP.BUTTON.Confirm'),
            confirmColor: 'danger'
        };
        this.utils._confirmDialog('APP.CLIENT.MESSAGES.DeassociateClient', data, this._dissociaClient.bind(this), initialState);
    }

    _getProfilo(client: any) : string {
        return client.source.codice_interno;
    }

    _dissociaClient(item: any) {
        const codice_interno_profilo = this._getProfilo(item);
        const _url: any = `${this.adesione.id_adesione}/${this.environment}/client/${codice_interno_profilo}`;

        this.apiService.deleteElement(this.model, _url).subscribe({
            next: () => {
                this.loadAdesioneClients(this.environment);
                this.eventsManagerService.broadcast(EventType.WIZARD_CHECK_UPDATE, true);
            },
            error: (error: any) => {
                Tools.OnError(error);
            }
        });
    }

    // Modal Edit

    _generalConfig: any = Tools.Configurazione;

    @ViewChild('editClients') editClients!: any;

    adesioneConfigClients: any[] = [];

    _isConfigClients: boolean = true;

    client: any = null;
    loadingDialog: boolean = false;

    _currClient: any = null;
    _currDatiSpecifici: any = null;

    // Fase 4.4 (Issue #237): rimosse 16 boolean flag orfane
    // (`_isFornito*`, `_isRichiesto_*`, `_is{AuthType}`). Erano ormai
    // solo set-and-forget: template e logica TS leggono tutto da
    // `formConfig` / FormControl.
    _ip_richiesto: boolean = false;
    _show_erogazione_ip_fruizione: boolean = false;
    _show_erogazione_rate_limiting: boolean = false;
    _show_erogazione_finalita: boolean = false;
    _show_nome_proposto: boolean = false;
    _show_client_form: boolean = true;

    _tipiCertificato: any[] = [];

    _certificato_csr_firma: any = {};
    _certificato_fornito_firma: any = {};
    _modulo_richiesta_csr_firma: any = {};
    _modulo_richiesta_csr_firma_ceritifato: any = {};

    _certificato_csr: any = {};
    _certificato_fornito: any = {};
    _modulo_richiesta_csr: any = {};

    _arr_clients_riuso: any[] = [];

    _auth_type: any = null;
    _tipo_client: any = null;

    _codice_interno_profilo: any = null;

    _certificato_cn: any = {};
    _certificato_cn_firma: any = {};

    _modalEditRef!: BsModalRef;
    _modalConfirmRef!: BsModalRef;

    _editFormGroupClients: FormGroup = new FormGroup({});
    _descrittoreCtrl: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr_modulo: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_firma: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr_firma: FormControl = new FormControl('', [Validators.required]);
    _descrittoreCtrl_csr_modulo_firma: FormControl = new FormControl('', [Validators.required]);

    _id_client_riuso: any = null;

    _currentServiceClient: string = '';

    isEditClient = false;

    _saving: boolean = false;
    _error: boolean = false;
    _errorMsg: string = '';

    _message = 'APP.MESSAGE.ChooseEnvironment';
    _messageHelp = 'APP.MESSAGE.ChooseEnvironmentHelp';

    _downloading: boolean = false;

    ratePeriods: any[] = [
        {'value': PeriodEnum.Giorno, 'label': 'APP.LABEL.Giorno'},
        {'value': PeriodEnum.Ora, 'label': 'APP.LABEL.Ora'},
        {'value': PeriodEnum.Minuti, 'label': 'APP.LABEL.Minuto'}
    ];

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

    closeModal(){
        this._arr_clients_riuso = [];
        this._modalEditRef.hide();
        this.isEditClient = false;
    }

    _resetError() {
        this._error = false;
        this._errorMsg = '';
    }

    _onEditClient(client: any) {
        this._resetError();

        this.initTipiCertificato(client.auth_type);

        this.client = client;

        this._ip_richiesto = client.ip_richiesto;
        this._auth_type = client.auth_type
        this._codice_interno_profilo = client.source.codice_interno;

        this._checkAndSetAuthTypeCase(this._auth_type);

        this.onChangeTipoCertificato(null);
        this.onChangeTipoCertificatoFirma(null);

        const _modalConfig: any = {
            ignoreBackdropClick: true,
            class: this._modalClassFor(this._dialogLayout)
        };

        const _isNotConfigurato = (client.source.stato === StatoConfigurazioneEnum.NONCONFIGURATO);
        const _isNomeProposto = !!client?.source?.nome_proposto;
        this._show_nome_proposto = _isNomeProposto;

        const isNewBranch = !client.id_client || _isNotConfigurato || _isNomeProposto;
        this.isEditClient = !isNewBranch;

        const ambiente: string = this.environment;
        const organizzazione: string = this.adesione?.soggetto?.organizzazione?.id_organizzazione || '';

        // Fase 2 (Issue #237): carichiamo i dati in sequenza prima di aprire la
        // modale, cosi' spariscono i setTimeout(200) e la race con la paginazione
        // di _loadClientsRiuso$.
        const clientDetails$: Observable<any> = isNewBranch
            ? of(_isNomeProposto ? { ...client } : {})
            : this.apiService.getDetails('client', client.id_client);

        clientDetails$.pipe(
            tap((detailsData: any) => {
                if (isNewBranch) {
                    this._currClient = _isNomeProposto ? { ...client } : {};
                } else {
                    this._currClient = { ...detailsData };
                }
            }),
            concatMap(() => this._loadCredenziali$(this._auth_type, organizzazione, ambiente)),
            takeUntil(this._destroy$)
        ).subscribe({
            next: () => {
                const initData = isNewBranch ? this._currClient.source : this._currClient;
                this._initEditFormClients(initData);
                this._modalEditRef = this.modalService.show(this.editClients, _modalConfig);
            },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = this.utils.GetErrorMsg(error);
            }
        });
    }

    get f(): { [key: string]: AbstractControl } {
        return this._editFormGroupClients.controls;
    }

    get fRate(): { [key: string]: AbstractControl } {
        return (this._editFormGroupClients.get('rate_limiting') as FormGroup).controls;
    }

    _hasControlError(name: string) {
        return !!(this.f[name] && this.f[name].errors && this.f[name].touched);
    }

    _initEditFormClients(data: any) {

        this._resetCertificatesAll();
        this._resetDescrittoriAll()

        this._checkAndSetAuthTypeCase(this._auth_type);

        this._currDatiSpecifici = data?.dati_specifici || null;
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

        // Fase 2 (Issue #237): _arr_clients_riuso e' gia' stato popolato in
        // _onEditClient prima di chiamare _initEditFormClients. Non serve piu'
        // ricaricare qui ed evitiamo la race condition che richiedeva setTimeout.

        if (data) {
            _credenziali = data.id_client;
            _nome = data.nome;
        } else {
            _credenziali = this._arr_clients_riuso[0]?.id_client;
            _nome = this._arr_clients_riuso[0]?.nome;
        }

        this._currentServiceClient = _credenziali;

        if (data?.dati_specifici) {
            // Fase 4.4: le 6 flag `_isFornito*`/`_isRichiesto_*` sono state
            // rimosse. Il mode certificato e' ora derivato dal FormControl
            // `tipo_certificato[_firma]` via `_currentCertAuthMode`/`_currentCertSignMode`.
            _tipo_certificato = data.dati_specifici.certificato_autenticazione?.tipo_certificato;
            _tipo_certificato_firma = data.dati_specifici.certificato_firma?.tipo_certificato;
        }

        if (data?.source?.stato === StatoConfigurazioneEnum.NONCONFIGURATO) {
            this._certificato_csr = null;
            this._modulo_richiesta_csr = null;
            this._certificato_fornito = null;
        } else {

            // Fase 4.2 (Issue #237): si legge dal `_tipo_certificato` locale
            // appena calcolato invece che dalle flag `_isFornito*` equivalenti.
            if (_tipo_certificato === 'fornito') {
                this._certificato_fornito = data?.dati_specifici?.certificato_autenticazione?.certificato || null;
            }

            if (_tipo_certificato === 'richiesto_cn') {
                _cn = data?.dati_specifici?.certificato_autenticazione?.cn || null;
            }

            if (_tipo_certificato === 'richiesto_csr') {
                this._certificato_csr = data?.dati_specifici?.certificato_autenticazione?.richiesta || null;
                this._modulo_richiesta_csr = data?.dati_specifici?.certificato_autenticazione?.modulo_richiesta || null;
            }

            if (_tipo_certificato_firma === 'fornito') {
                this._certificato_fornito_firma = data?.dati_specifici?.certificato_firma?.certificato || null;
            }

            if (_tipo_certificato_firma === 'richiesto_cn') {
                _cn_firma = data?.dati_specifici?.certificato_firma?.cn || null;
            }

            if (_tipo_certificato_firma === 'richiesto_csr') {
                this._certificato_csr_firma = data?.dati_specifici?.certificato_firma?.richiesta || null;
                this._modulo_richiesta_csr_firma = data?.dati_specifici?.certificato_firma?.modulo_richiesta || null;
                this._modulo_richiesta_csr_firma_ceritifato = data?.dati_specifici?.certificato_firma?.certificato || null;
            }

            // Fase 4.0 (Issue #237): lettura del dati_specifici guidata dai
            // predicati di client-dialog-state invece che dalle 27+ flag.
            const _authType: AuthType = this._auth_type as AuthType;

            if (authRequiresUsername(_authType)) {
                _username = data?.dati_specifici?.username || null;
            }

            if (authRequiresClientId(_authType) || authRequiresOauthUrls(_authType)) {
                _client_id = data?.dati_specifici?.client_id || null;
            }

            if (authRequiresOauthUrls(_authType)) {
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

        // Fase 4.0 (Issue #237): validator setup guidato dai predicati
        // invece che dalle 27+ flag booleane.
        const authTypeTyped: AuthType = this._auth_type as AuthType;

        if (authIsPdndVariant(authTypeTyped)) {
            controls.client_id.setValidators(Validators.required);
            controls.client_id.updateValueAndValidity();
        } else {
            controls.client_id.clearValidators();
            controls.client_id.updateValueAndValidity();
        }

        if (authRequiresCertSign(authTypeTyped)) {
            controls.tipo_certificato_firma.setValidators(Validators.required);
            controls.tipo_certificato_firma.updateValueAndValidity();
        }

        // Auth type che richiedono SOLO il cert di firma (niente cert auth):
        // sign, sign_pdnd. Abilita il selettore firma e libera il cert auth.
        if (authRequiresCertSign(authTypeTyped) && !authRequiresCertAuth(authTypeTyped)) {
            controls.tipo_certificato_firma.enable();
            controls.tipo_certificato.clearValidators();
        }

        if (authRequiresOauthUrls(authTypeTyped)) {
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

        // Fase 2 (Issue #237): `_arr_clients_riuso` e' gia' popolato a questo
        // punto (caricato in _onEditClient prima dell'init), quindi possiamo
        // eseguire sincrono senza il vecchio setTimeout(100).
        const _ctrl = this._editFormGroupClients.controls;
        if (this._arr_clients_riuso.length === 1) {
            _ctrl['credenziali'].patchValue(this._arr_clients_riuso[0].id_client);
            _ctrl['credenziali'].updateValueAndValidity();
            this._editFormGroupClients.updateValueAndValidity();
            this.onChangeCredenziali(this._arr_clients_riuso[0].id_client);
        } else {
            this.onChangeCredenziali(_credenziali);
        }

        if (!this._isModifiableMapper(data)) {
            this._disableAllFields(controls);
        }

        this._editFormGroupClients.updateValueAndValidity();

        if (this.debugMandatoryFields) { this.utils._showMandatoryFields(this._editFormGroupClients); }
    }

    /**
     * Fase 2 (Issue #237): restituisce un Observable che, una volta completato,
     * garantisce che `_arr_clients_riuso` sia popolato. Il chiamante puo' quindi
     * sequenziare con `concatMap` e aprire la modale solo a dati disponibili.
     */
    _loadCredenziali$(auth_type: string = '', organizzazione: string = '', ambiente: string = ''): Observable<any[]> {
        this._arr_clients_riuso = [];

        if (organizzazione === '') {
            this._arr_clients_riuso.push({ 'nome': 'Nuove credenziali', 'id_client': null });
            return of(this._arr_clients_riuso);
        }

        if (this._generalConfig.adesione.visualizza_elenco_client_esistenti) {
            return this._loadClientsRiuso$(auth_type, organizzazione, ambiente).pipe(
                tap((clients: any[]) => {
                    this._arr_clients_riuso = clients;
                    this._postProcessClientsList();
                }),
                map(() => this._arr_clients_riuso)
            );
        }

        this._arr_clients_riuso.push({ 'nome': this.translate.instant('APP.ADESIONI.LABEL.NuoveCredenziali'), 'id_client': SelectedClientEnum.NuovoCliente });
        this._arr_clients_riuso.push({ 'nome': this.translate.instant('APP.ADESIONI.LABEL.UsaClientEsistente'), 'id_client': SelectedClientEnum.UsaClientEsistente });

        if (this.authenticationService.isGestore()) {
            return this._loadClientsRiuso$(auth_type, organizzazione, ambiente).pipe(
                tap((clients: any[]) => {
                    this._arr_clients_riuso = clients;
                    this._postProcessClientsList();
                }),
                map(() => this._arr_clients_riuso)
            );
        }

        return of(this._arr_clients_riuso);
    }

    /**
     * Fase 2 (Issue #237): versione Observable di _loadClientsRiuso, senza
     * side-effect interno. La paginazione viene completata dentro la pipe,
     * il consumatore riceve l'array completo in un unico emit finale.
     */
    _loadClientsRiuso$(auth_type: string = '', organizzazione: string = '', ambiente: string = ''): Observable<any[]> {
        const size = 100;
        const baseOptions: any = {
            params: {
                size,
                page: 0,
                auth_type,
                id_organizzazione: organizzazione,
                ambiente,
                stato: StatoConfigurazioneEnum.CONFIGURATO
            }
        };

        return this.apiService.getList('client', baseOptions).pipe(
            expand((response: any) => {
                const { number, totalPages } = response.page;
                if (number + 1 < totalPages) {
                    return this.apiService.getList('client', {
                        ...baseOptions,
                        params: { ...baseOptions.params, page: number + 1 }
                    });
                }
                return EMPTY;
            }),
            map((res: any) => res.content),
            reduce((acc, curr) => acc.concat(curr), [] as any[])
        );
    }

    /**
     * Aggiunge "Nuove credenziali" in testa alla lista se non e' obbligatorio
     * il riuso (o se la lista e' vuota). L'auto-select del credenziale
     * di default e' ora gestito da _initEditFormClients (riga ~708).
     */
    private _postProcessClientsList() {
        const obbligatorio: boolean = this._generalConfig.adesione.riuso_client_obbligatorio;
        if (this._arr_clients_riuso.length === 0 || !obbligatorio) {
            this._arr_clients_riuso.unshift({
                nome: this.translate.instant('APP.ADESIONI.LABEL.NuoveCredenziali'),
                id_client: SelectedClientEnum.NuovoCliente
            });
        }
    }

    _downloadsEnabled() {
        return this._currentServiceClient === this._editFormGroupClients.get('credenziali')?.value;
    }

    _disableAllFields(data: any) {
        Object.keys(data).forEach((key) => {
            data[key].disable()      
        });
    }

    // Fase 4.4: rimosso `_checkTipoCertificato` (dead code: mai chiamato in
    // questo componente, presente solo come residuo dell'originale
    // `adesione-configurazioni.component.ts`). I test su questo metodo
    // erano gia' stati marcati obsoleti.

    /**
     * Fase 4.4 (Issue #237): il metodo imposta ora SOLO i flag
     * `_show_erogazione_*` a partire dalla configurazione
     * dell'auth_type (sezione `servizio.api.auth_type`). Lo switch
     * che settava le 12 flag `_is{AuthType}` e' stato rimosso
     * (le flag sono state eliminate).
     *
     * Il nome del metodo e' storico; la chiamata viene mantenuta
     * nei 3 call site per preservare il side-effect sui show flag.
     */
    _checkAndSetAuthTypeCase(auth_type: any = null) {
        const authTypes: any = this.authenticationService._getConfigModule('servizio').api.auth_type;
        const configAuthType = authTypes.find((x: any) => x.type == auth_type);
        if (configAuthType) {
            this._show_erogazione_ip_fruizione = configAuthType.indirizzi_ip || false;
            this._show_erogazione_rate_limiting = configAuthType.rate_limiting || false;
            this._show_erogazione_finalita = configAuthType.finalita || false;
        }
    }

    onChangeTipoCertificato(event: any) {
        const controls = this._editFormGroupClients.controls;

        if (Object.keys(controls).length > 0) {
            this._resetUploadCertificateComponents(controls);
        }

        // Fase 4.4: rimosse le scritture alle flag `_isFornito/_isRichiesto_*`,
        // ora orfane. Il mode certificato e' letto dal FormControl
        // `tipo_certificato` via `_currentCertAuthMode`.
        if (event) {
            switch (event.nome) {
                case 'fornito':
                    controls?.content?.setValidators(Validators.required);
                    controls?.content?.updateValueAndValidity();

                    this._certificato_fornito = this._currDatiSpecifici?.certificato?.certificato || null;
                    this._certificato_csr = null;
                    this._modulo_richiesta_csr = null;
                    break;
                case 'richiesto_cn':
                    controls?.cn?.setValidators(Validators.required);
                    controls?.cn?.updateValueAndValidity();

                    this._certificato_fornito =  null;
                    this._certificato_csr = null;
                    this._modulo_richiesta_csr = null;
                    break;
                case 'richiesto_csr':
                    controls?.content?.setValidators(Validators.required);
                    controls?.content?.updateValueAndValidity();
                    controls?.content_csr?.setValidators(Validators.required);
                    controls?.content_csr?.updateValueAndValidity();

                    this._certificato_fornito = null;
                    this._certificato_csr = this._currDatiSpecifici?.certificato?.richiesta || null;
                    this._modulo_richiesta_csr = this._currDatiSpecifici?.certificato?.modulo_richiesta || null;
                    break;
                default:
                    this._certificato_fornito =  null;
                    this._certificato_csr = null;
                    this._modulo_richiesta_csr = null;
                    break;
            }
        } else {
            this._resetCertificates();
        }

        // ================================
        this._editFormGroupClients.updateValueAndValidity()
        // ================================
    }

    updateAllValidators(type: SelectedClientEnum) {
        const controls = this._editFormGroupClients.controls;

        switch (type) {
            case SelectedClientEnum.NuovoCliente:
            case SelectedClientEnum.Default:

                // controls.nome_proposto.patchValue(null);
                controls.nome_proposto.clearValidators();

                // Fase 4.1: predicati vs flag anche in updateAllValidators.
                const _at: AuthType = this._auth_type as AuthType;
                if (authIsPdndVariant(_at)) {
                    controls.client_id.setValidators(Validators.required);
                    controls.client_id.updateValueAndValidity();
                } else {
                    controls.client_id.clearValidators();
                    controls.client_id.updateValueAndValidity();
                }

                if (authRequiresCertSign(_at)) {
                    controls.tipo_certificato_firma.setValidators(Validators.required);
                    controls.tipo_certificato_firma.updateValueAndValidity();
                }
                // sign, sign_pdnd (sign cert SOLO, senza auth cert).
                if (authRequiresCertSign(_at) && !authRequiresCertAuth(_at)) {
                    controls.tipo_certificato_firma.enable()
                    controls.tipo_certificato.clearValidators();
                }

                if (authRequiresOauthUrls(_at)) {
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

    /**
     * Fase 3g Issue #237: handler dei toggle-button del selettore credenziali.
     * Setta il valore del FormControl `credenziali` e delega a
     * `onChangeCredenziali` la gestione dei branch scenario-based.
     */
    _onSelectCredenzialiOption(value: SelectedClientEnum) {
        const ctrl = this._editFormGroupClients?.controls?.['credenziali'];
        if (!ctrl) return;
        ctrl.patchValue(value);
        ctrl.updateValueAndValidity();
        this.onChangeCredenziali(value);
    }

    onChangeCredenziali(selected_client_id: any) {
        this._certificato_cn = null;
        this._certificato_cn_firma = null;

        const controls = this._editFormGroupClients.controls;

        // Fase 4.1 (Issue #237): i predicati puri di client-dialog-state
        // sostituiscono la lettura delle 27+ flag booleane anche in
        // onChangeCredenziali. `authType` e' l'auth type corrente.
        const authType: AuthType = this._auth_type as AuthType;

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
            
                    if (authRequiresCertAuth(authType)) {
                        controls.tipo_certificato.setValidators(Validators.required);
                        controls.tipo_certificato.enable();
                    }

                    // Auth types che richiedono ENTRAMBI i certificati (auth + firma):
                    // `_isHttpsSign || _isHttpsPdndSign` == `requiresCertSign && requiresCertAuth`.
                    if (authRequiresCertSign(authType) && authRequiresCertAuth(authType)) {
                        controls.tipo_certificato_firma.setValidators(Validators.required);
                        controls.tipo_certificato_firma.enable();
                    }

                    controls.url_redirezione.patchValue(null);
                    controls.url_esposizione.patchValue(null);
                    controls.help_desk.patchValue(null);
                    controls.nome_applicazione_portale.patchValue(null);

                    if (authRequiresOauthUrls(authType)) {
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

                    this._id_client_riuso = _aux?.id_client || null;
                    controls.client_id.patchValue(this._id_client_riuso);

                    if (authRequiresCertAuth(authType)) {
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

                    if (authRequiresCertSign(authType)) {
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

                    // Nota: il check originale escludeva `sign_pdnd` rispetto al
                    // set completo di auth type che usano `client_id`. Sembra un
                    // bug: `sign_pdnd` richiede client_id (vedi
                    // `authRequiresClientId`). La sostituzione con i predicati
                    // allinea anche questo caso al resto.
                    if (authRequiresClientId(authType) || authRequiresOauthUrls(authType)) {
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

                    controls.tipo_certificato.updateValueAndValidity();
                    controls.tipo_certificato_firma.updateValueAndValidity();
                    this._editFormGroupClients.updateValueAndValidity();
                    // ==========================

                    controls.url_redirezione.patchValue(_aux?.dati_specifici?.url_redirezione);
                    controls.url_esposizione.patchValue(_aux?.dati_specifici?.url_esposizione);
                    controls.help_desk.patchValue(_aux?.dati_specifici?.help_desk);
                    controls.nome_applicazione_portale.patchValue(_aux?.dati_specifici?.nome_applicazione_portale);

                    if (authRequiresOauthUrls(authType)) {
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
            controls.nome.updateValueAndValidity();

            controls.nome.disable();
            controls.tipo_certificato.clearValidators();

            if (authRequiresOauthUrls(authType)) {
                controls.url_redirezione.disable();
                controls.url_redirezione.updateValueAndValidity();
                controls.url_esposizione.disable();
                controls.url_esposizione.updateValueAndValidity();
                controls.help_desk.disable();
                controls.help_desk.updateValueAndValidity();
                controls.nome_applicazione_portale.disable();
                controls.nome_applicazione_portale.updateValueAndValidity();
            }
            
            controls.descrizione.disable();
            controls.descrizione.updateValueAndValidity();
            controls.ip_fruizione.disable();
            controls.ip_fruizione.updateValueAndValidity();
            controls.rate_limiting.disable();
            controls.rate_limiting.updateValueAndValidity();
            controls.finalita.disable();
            controls.finalita.updateValueAndValidity()
        }
        
        controls.tipo_certificato.updateValueAndValidity();
        controls.tipo_certificato_firma.updateValueAndValidity();

        if (this.debugMandatoryFields) { this.utils._showMandatoryFields(this._editFormGroupClients); }
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

    _resetDescrittori() {
        this._descrittoreCtrl.setValue('');
        this._descrittoreCtrl_csr.setValue('');
        this._descrittoreCtrl_csr_modulo.setValue('');
        this._descrittoreCtrl.updateValueAndValidity();
        this._descrittoreCtrl_csr.updateValueAndValidity();
        this._descrittoreCtrl_csr_modulo.updateValueAndValidity();
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

        if (Object.keys(controls).length > 0) {
            this._resetUploadCertificateComponentsFirma(controls);
        }
        
        // Fase 4.4: rimosse le scritture alle flag `_isFornito_firma/_isRichiesto_*_firma`,
        // ora orfane. Il mode certificato firma e' letto dal FormControl
        // `tipo_certificato_firma` via `_currentCertSignMode`.
        if (event) {
            switch (event.nome) {
                case 'fornito':
                    controls?.content_firma?.setValidators(Validators.required);
                    controls?.content_firma?.updateValueAndValidity();

                    this._certificato_fornito_firma = this._currDatiSpecifici?.certificato?.certificato || null;
                    this._certificato_csr_firma = null;
                    this._modulo_richiesta_csr_firma = null;
                    break;
                case 'richiesto_cn':
                    controls?.cn_firma?.setValidators(Validators.required);
                    controls?.cn_firma?.updateValueAndValidity();

                    this._certificato_fornito_firma =  null;
                    this._certificato_csr_firma = null;
                    this._modulo_richiesta_csr_firma = null;
                    break;
                case 'richiesto_csr':
                    controls?.content_firma?.setValidators(Validators.required);
                    controls?.content_firma?.updateValueAndValidity();
                    controls?.content_csr_firma?.setValidators(Validators.required);
                    controls?.content_csr_firma?.updateValueAndValidity();

                    this._certificato_fornito_firma = null;
                    this._certificato_csr_firma = this._currDatiSpecifici?.certificato?.richiesta || null;
                    this._modulo_richiesta_csr_firma = this._currDatiSpecifici?.certificato?.modulo_richiesta || null;
                    break;
                default:
                    this._certificato_fornito_firma =  null;
                    this._certificato_csr_firma = null;
                    this._modulo_richiesta_csr_firma = null;
                    this._modulo_richiesta_csr_firma_ceritifato = null;
                    break;
            }
        } else {
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
        this._resetError();
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
        this._resetError();
    }

    _downloadAllegato(data: any) {
        this._downloading = true;

        let _ambiente: string = this.environment;
        
        const _partial = `${_ambiente}/client/${data.uuid}/download`;
        this.apiService.download(this.model, this.id, _partial).subscribe({
            next: (response: any) => {
                let name: string = `${data.filename}`;
                saveAs(response.body, name);
                this._downloading = false;
            },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = this.utils.GetErrorMsg(error);
                this._downloading = false;
            }
        });
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

    _onSaveModalClient(body: any){
        this._saving = true;

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

        const _tipoCert: any = this._editFormGroupClients.getRawValue().tipo_certificato;
        const _tipoCertFirma: any = this._editFormGroupClients.getRawValue().tipo_certificato_firma;
        const _cn: any = this._editFormGroupClients.getRawValue().cn;
        const _cn_firma: any = this._editFormGroupClients.getRawValue().cn_firma;
        const _client_id: any = this._editFormGroupClients.getRawValue().client_id || null;
        const _nome: any = this._editFormGroupClients.getRawValue().nome;

        this.utils._removeEmpty(_body)

        delete _body.credenziali;

        _body.ambiente = this.environment;

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
        
        this.utils._removeEmpty(_payload)

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
            this.utils._removeEmpty(temp_cert);
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
            this.utils._removeEmpty(temp_cert);
            this.utils._removeEmpty(temp_cert_modulo);
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
            this.utils._removeEmpty(temp_cert);
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
            this.utils._removeEmpty(temp_cert);
            this.utils._removeEmpty(temp_cert_modulo);
            _datiSpecifici.certificato_firma = temp_doubleCert;
        }

        // Fase 4.2 (Issue #237): predicati vs flag anche nel payload builder.
        const _authType: AuthType = this._auth_type as AuthType;

        // `authRequiresClientId` copre pdnd/https_pdnd/https_pdnd_sign/sign_pdnd
        // + oauth_client_credentials. `authRequiresOauthUrls` aggiunge
        // oauth_authorization_code. Unione = stesso set dell'originale.
        if (authRequiresClientId(_authType) || authRequiresOauthUrls(_authType)) {
            _datiSpecifici.client_id = _client_id;
        }

        if (authRequiresOauthUrls(_authType)) {
            _datiSpecifici.url_redirezione = this._editFormGroupClients.getRawValue().url_redirezione;
            _datiSpecifici.url_esposizione = this._editFormGroupClients.getRawValue().url_esposizione;
            _datiSpecifici.help_desk = this._editFormGroupClients.getRawValue().help_desk;
            _datiSpecifici.nome_applicazione_portale = this._editFormGroupClients.getRawValue().nome_applicazione_portale;
        }

        if (this._currClient?.id_client) {
            // se è presente id_client ==> devo fare una modifica ad un client esistente
            const id_adesione: string = this.adesione.id_adesione;
            const ambiente: string = this.environment;
            const profilo: string = this._codice_interno_profilo;
            const path: string = `${ambiente}` + '/client/' + `${profilo}`;

            _payload.id_soggetto = this._currClient.soggetto.id_soggetto;
            _payload.ambiente = this.environment;
            _payload.nome = _nome || this._currClient.nome,
            _payload.dati_specifici = _datiSpecifici;

            this.apiService.putElementRelated('adesioni', id_adesione, path, _payload).subscribe({
                next: () => {
                    this.loadAdesioneClients(this.environment);
                    this.eventsManagerService.broadcast(EventType.WIZARD_CHECK_UPDATE, true);
                    this.closeModal();
                    this._saving = false;
                },
                error: (error: any) => {
                    this._error = true;
                    this._errorMsg = this.utils.GetErrorMsg(error);
                    this._saving = false;
                }
            });
        } else {
        // se NON è presente id_client ==> devo registrare un nuovo client

            const id_adesione: string = this.adesione.id_adesione;
            const ambiente: string = this.environment;
            const profilo: string = this._codice_interno_profilo;
            const path: string = `${ambiente}` + '/client/' + `${profilo}`;

            _payload.ambiente = this.environment;
            _payload.nome = _nome;
            _payload.dati_specifici = _datiSpecifici;

            this.apiService.putElementRelated('adesioni', id_adesione, path, _payload).subscribe({
                next: () => {
                    this.loadAdesioneClients(this.environment);
                    this.eventsManagerService.broadcast(EventType.WIZARD_CHECK_UPDATE, true);
                    this._saving = false;
                    this.closeModal();
                },
                error: (error: any) => {
                    this._error = true;
                    this._errorMsg = this.utils.GetErrorMsg(error);
                    this._saving = false;
                }
            });
        }
    }

    // =========================================================================
    // Fase 3 (Issue #237): FormConfig derivato dallo stato corrente.
    //
    // Questi getter leggono le 27+ flag/variabili esistenti e le traducono
    // nella `FormConfig` calcolata dalla funzione pura `computeFormConfig`.
    // In questa fase il template continua a leggere dalle flag originali;
    // i getter esistono per agganciare gradualmente la UI al nuovo modello.
    // Ogni incongruenza fra flag-based e FormConfig-based va trattata come
    // bug e fixata prima di migrare il relativo campo nel template.
    // =========================================================================

    /** Mappa le flag booleane esistenti al tipo `AuthType` tipizzato. */
    private _currentAuthType(): AuthType {
        const t = (this._auth_type || '') as AuthType;
        return t;
    }

    /** Ricava lo scenario corrente dal combinato di flag esistenti. */
    private _currentScenario(): Scenario {
        if (!this._isModifiable()) return { kind: 'readonly' };
        if (this._show_nome_proposto && this._tipo_client === TipoClientEnum.Proposto) return { kind: 'proposed' };
        if (this.isEditClient) return { kind: 'edit' };
        if (this._tipo_client === TipoClientEnum.Riferito && this._currClient?.id_client) {
            return { kind: 'referenced', referencedClientId: this._currClient.id_client };
        }
        return { kind: 'new' };
    }

    /**
     * Fase 4.2: sorgente di verita' per il mode del certificato e' il
     * FormControl `tipo_certificato`, non le 3 flag booleane. Cosi'
     * `formConfig` e' sempre coerente con la selezione utente anche se
     * qualche metodo si scorda di aggiornare le flag.
     */
    private _currentCertAuthMode(): CertificateMode {
        return this._certModeFromValue(this._editFormGroupClients?.controls?.['tipo_certificato']?.value);
    }

    /** Idem per il certificato firma. */
    private _currentCertSignMode(): CertificateMode {
        return this._certModeFromValue(this._editFormGroupClients?.controls?.['tipo_certificato_firma']?.value);
    }

    private _certModeFromValue(value: any): CertificateMode {
        switch (value) {
            case 'fornito': return { kind: 'fornito' };
            case 'richiesto_cn': return { kind: 'richiesto_cn' };
            case 'richiesto_csr': return { kind: 'richiesto_csr' };
            default: return { kind: 'none' };
        }
    }

    /** Modalita' di presentazione del selettore credenziali. */
    private _currentCredentialsMode(): CredentialsMode {
        return this._generalConfig?.adesione?.visualizza_elenco_client_esistenti ? 'dropdown' : 'toggle';
    }

    /**
     * L'utente puo' modificare i dati della dialog? Deriva dalla grant
     * sull'ambiente corrente (stessa regola di `_isModifiableMapper`).
     */
    private _isModifiable(): boolean {
        if (!this.grant) return false;
        if (this.environment === AmbienteEnum.Collaudo) return this.grant.collaudo === RightsEnum.Scrittura;
        if (this.environment === AmbienteEnum.Produzione) return this.grant.produzione === RightsEnum.Scrittura;
        return false;
    }

    /** Input completo per `computeFormConfig`. */
    private _computeDialogInput(): ClientDialogInput {
        return {
            scenario: this._currentScenario(),
            authType: this._currentAuthType(),
            certAuth: this._currentCertAuthMode(),
            certSign: this._currentCertSignMode(),
            isModifiable: this._isModifiable(),
            credentialsMode: this._currentCredentialsMode(),
            riusoObbligatorio: !!this._generalConfig?.adesione?.riuso_client_obbligatorio,
            clientsRiusoCount: this._arr_clients_riuso?.filter((c: any) =>
                c.id_client !== SelectedClientEnum.NuovoCliente
                && c.id_client !== SelectedClientEnum.UsaClientEsistente
            ).length || 0,
            showIpFruizione: !!this._show_erogazione_ip_fruizione,
            showRateLimiting: !!this._show_erogazione_rate_limiting,
            showFinalita: !!this._show_erogazione_finalita,
        };
    }

    /** FormConfig derivata: sorgente di verita' per la UI nella Fase 3+. */
    get formConfig(): FormConfig {
        return computeFormConfig(this._computeDialogInput());
    }

    /**
     * Fase 6.2 (Issue #237): input oggetto per `<app-modal-edit-client>`.
     * Composto a partire dallo stato corrente del parent; il getter viene
     * rivalutato a ogni change-detection cycle del parent.
     */
    get modalInput(): ModalEditClientInput {
        return {
            formGroup: this._editFormGroupClients,
            formConfig: this.formConfig,
            clientsRiuso: this._arr_clients_riuso,
            tipiCertificato: this._tipiCertificato,
            saving: this._saving,
            error: this._error,
            errorMsg: this._errorMsg,
            certificatoFornito: this._certificato_fornito,
            certificatoCN: this._certificato_cn,
            certificatoCSR: this._certificato_csr,
            moduloRichiestaCSR: this._modulo_richiesta_csr,
            certificatoFornitoFirma: this._certificato_fornito_firma,
            certificatoCNFirma: this._certificato_cn_firma,
            certificatoCSRFirma: this._certificato_csr_firma,
            moduloRichiestaCSRFirma: this._modulo_richiesta_csr_firma,
            moduloRichiestaCSRFirmaCertificato: this._modulo_richiesta_csr_firma_ceritifato,
            ipRichiesto: this._ip_richiesto,
            isEditClient: this.isEditClient,
            currentServiceClient: this._currentServiceClient,
            adesioneId: this.adesione?.id_adesione,
            environment: this.environment,
            authType: this._auth_type,
            codiceInternoProfilo: this._codice_interno_profilo,
            client: this.client,
            descrittoreCtrl: this._descrittoreCtrl,
            descrittoreCtrlCsr: this._descrittoreCtrl_csr,
            descrittoreCtrlCsrModulo: this._descrittoreCtrl_csr_modulo,
            descrittoreCtrlFirma: this._descrittoreCtrl_firma,
            descrittoreCtrlCsrFirma: this._descrittoreCtrl_csr_firma,
            descrittoreCtrlCsrModuloFirma: this._descrittoreCtrl_csr_modulo_firma,
            ratePeriods: this.ratePeriods,
        };
    }

    /**
     * Adapter per gli Output `descriptorChange`/`descriptorChangeFirma`
     * del nuovo componente, che emettono `{ value, type }`. Mappati
     * sui vecchi metodi `__descrittoreChange[_Firma](value, isCsr?)`.
     */
    _onDescriptorChange(event: { value: any; type: string }): void {
        this.__descrittoreChange(event.value, event.type === 'csr');
    }
    _onDescriptorChangeFirma(event: { value: any; type: string }): void {
        this.__descrittoreChangeFirma(event.value, event.type === 'csr');
    }

    // =========================================================================
    // Layout verticale/orizzontale della dialog (Issue #237).
    // =========================================================================

    private readonly _DIALOG_LAYOUT_KEY = 'govcat.adesione.dialogLayout';

    /** Layout corrente della dialog, persistito in localStorage. */
    _dialogLayout: ModalEditClientLayout = this._readDialogLayoutPref();

    private _readDialogLayoutPref(): ModalEditClientLayout {
        try {
            const v = localStorage?.getItem?.(this._DIALOG_LAYOUT_KEY);
            return v === 'horizontal' ? 'horizontal' : 'vertical';
        } catch {
            return 'vertical';
        }
    }

    /**
     * Classe ngx-bootstrap da applicare al `.modal-dialog` per layout.
     *
     * - `modal-edit-client-horizontal`: classe globale definita in
     *   `styles.scss` che forza `max-width: min(95vw, 1100px)` via
     *   `--bs-modal-width`. Usata al posto di `modal-xl` perche' quella
     *   scatta solo sopra viewport 1200px (Bootstrap xl breakpoint),
     *   lasciando il modal a 500px nella fascia 992–1199px proprio
     *   dove vorremmo 2 colonne.
     * - `modal-half-`: classe storica per il layout verticale (di fatto
     *   no-op, il modal resta alla larghezza default ~500px).
     *
     * Non usiamo `modal-dialog-scrollable` perche' forza
     * `height: calc(100% - 2rem)` sul dialog, spingendo il footer in
     * fondo al viewport anche con poco contenuto.
     */
    private _modalClassFor(layout: ModalEditClientLayout): string {
        return layout === 'horizontal' ? 'modal-edit-client-horizontal' : 'modal-half-';
    }

    /**
     * Handler dell'Output `layoutChange` del `ModalEditClientComponent`:
     * aggiorna lo stato, persiste la preferenza, e allarga/stringe il
     * modal dialog a runtime tramite `BsModalRef.setClass`.
     */
    _onDialogLayoutChange(layout: ModalEditClientLayout): void {
        this._dialogLayout = layout;
        try { localStorage?.setItem?.(this._DIALOG_LAYOUT_KEY, layout); } catch { /* silent */ }
        if (this._modalEditRef) {
            this._modalEditRef.setClass(this._modalClassFor(layout));
        }
    }
}
