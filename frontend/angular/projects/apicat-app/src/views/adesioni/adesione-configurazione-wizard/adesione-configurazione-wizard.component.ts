import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';

import { EventType } from 'projects/tools/src/lib/classes/events';

import { ModalAddReferentComponent } from './modal-add-referent/modal-add-referent.component';

import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';

import { forkJoin, Observable } from 'rxjs';

import { Grant, RightsEnum } from '@app/model/grant';
import { AmbienteEnum } from '@app/model/ambienteEnum';
import { ReferentView, Referent } from '../adesione-view/adesione-view.component';
import { FieldClass } from 'projects/components/src/public-api';
import { MenuAction } from 'projects/components/src/lib/classes/menu-action';

import * as _ from 'lodash';
declare const saveAs: any;

import { CkeckProvider } from '@app/provider/check.provider';
import { ClassiEnum, DataStructure } from '@app/provider/check.provider';

export enum AccordionType {
    GENERAL_INFO = 'accordion-general-info',
    ACCORDION_REFERENTI = 'accordion-referenti',
    ACCORDION_COLLAUDO = 'accordion-collaudo',
    ACCORDION_PRODUZIONE = 'accordion-produzione'
}

@Component({
    selector: 'app-adesione-configurazione-wizard',
    templateUrl: './adesione-configurazione-wizard.component.html',
    styleUrls: ['./adesione-configurazione-wizard.component.scss']
})
export class AdesioneConfigurazioneWizardComponent implements OnInit {

    static readonly Name = 'AdesioneConfigurazioneWizardComponent';
    readonly model: string = 'adesioni';

    @ViewChild("myScroll") myScroll!: ElementRef;
    
    title: string = '';

    id: number = 0;

    Tools = Tools;

    appConfig: any;
    config: any;
    adesioniClientsConfig: any;
    adesioniErogazConfig: any;
    apiConfig: any;
    referentiConfig: any;

    generalConfig: any = Tools.Configurazione || null;

    isBozza: boolean = false;
    adesione: any = null;

    id_servizio: any = null;
    servizio: any = null;

    isEdit: boolean = false;

    spin: boolean = true;

    _message: string = 'APP.MESSAGE.NoReferent';
    _messageHelp: string = 'APP.MESSAGE.NoReferentHelp';

    changingStatus: boolean = false;
    _error: boolean = false;
    _errorMsg: string = '';
    _errors: any[] = [];
    _fromStatus: string = '';
    _toStatus: string = '';

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' },
        { label: '...', url: '', type: 'title' },
        // { label: 'APP.TITLE.SubscriptionConfiguration', url: '', type: 'title' }
    ];

    serviceBreadcrumbs: ServiceBreadcrumbsData|null = null;

    grant: Grant | null = null;
    updateMapper: string = '';

    isDominioEsterno: boolean = false;
    idDominioEsterno: string | null = null;
    idSoggettoDominioEsterno: string | null = null;

    singleColumn: boolean = true;
    showGroupLabel: boolean = false;

    AmbienteEnum = AmbienteEnum;

    downloading: boolean = false;

    _otherActions: MenuAction[] = [
        new MenuAction({
            type: 'menu',
            title: 'APP.ADESIONI.LABEL.DownloadScheda',
            icon: 'download',
            subTitle: '',
            action: 'download_scheda',
            enabled: true
        }),
        new MenuAction({
            type: 'divider',
            title: '',
            enabled: true
        })
    ];

    ClassiEnum = ClassiEnum;

    returnWeb: boolean = false;

    saveSkipCollaudo: boolean = false;
    dataStructureResults: DataStructure = { esito: 'ok' };

    loadingCheckDati: boolean = false;

    accordionTypeList: { [key: string]: string } = {
        [AccordionType.GENERAL_INFO]: ClassiEnum.GENERALE,
        [AccordionType.ACCORDION_REFERENTI]: ClassiEnum.REFERENTI,
        [AccordionType.ACCORDION_COLLAUDO]: ClassiEnum.COLLAUDO,
        [AccordionType.ACCORDION_PRODUZIONE]: ClassiEnum.PRODUZIONE
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private translate: TranslateService,
        private modalService: BsModalService,
        private configService: ConfigService,
        private eventsManagerService: EventsManagerService,
        private apiService: OpenAPIService,
        private authenticationService: AuthenticationService,
        private utils: UtilService,
        private ckeckProvider: CkeckProvider,
    ) {
        this.route.data.subscribe((data) => {
            if (!data.serviceBreadcrumbs) return;
            this.serviceBreadcrumbs = data.serviceBreadcrumbs;
            this._initBreadcrumb();
        });

        this.appConfig = this.configService.getConfiguration();

        this.configService.getConfig(this.model).subscribe(
            (config: any) => {
                this.config = config;
            }
        );
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.id = params['id'];

                const _grant: Observable<any> = this.apiService.getDetails(this.model, this.id, 'grant');
                const _configClients: Observable<any> = this.configService.getConfig('adesioniClients');
                const _configErogaz: Observable<any> = this.configService.getConfig('adesioniErogaz');
                const _apiConfig: Observable<any> = this.configService.getConfig('api');
                const _referentiConfig: Observable<any> = this.configService.getConfig('referenti');

                const combined = forkJoin([_grant, _configClients, _configErogaz, _apiConfig, _referentiConfig]);
                combined.subscribe(result => {                    
                    this.grant = result[0];
                    this.adesioniClientsConfig = result[1];
                    this.adesioniErogazConfig = result[2];
                    this.apiConfig = result[3];
                    this.referentiConfig = result[4];

                    console.log('grant', this.grant);

                    this.loadAdesione(true);
                });
            }
        });

        this.eventsManagerService.on(EventType.WIZARD_CHECK_UPDATE, (action: any) => {
            console.log('EventsManager', EventType.WIZARD_CHECK_UPDATE, action);
            this.loadCheckDati(this.adesione.id_adesione, this.getNextStateWorkflowName());
            this.loadConfigurazioni(AmbienteEnum.Collaudo);
            this.loadConfigurazioni(AmbienteEnum.Produzione);
        })

        this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
            this.generalConfig = Tools.Configurazione || null;
            console.log('Configurazione Remota', Tools.Configurazione);
            this.updateMapper = new Date().getTime().toString();
        });
    }

    _updateOtherActions() {
        const _canJoin = this.authenticationService.canJoin('adesione', this.adesione?.stato);
    
        const _otherActions = this._otherActions.map((item: any) => {
            let _enabled = true;
            switch (item.action) {
                case 'download_scheda':
                    _enabled = _canJoin;
                    break;
                default:
                    if (item.type === 'divider') {
                        _enabled = _canJoin;
                    }
            }
            return { ...item, enabled: _enabled };
        });
        this._otherActions = Object.assign([], _otherActions);
    }
    

    private loadAdesione(spin: boolean = true) {
        if (this.id) {
            this.spin = spin;
            if (spin) { this.adesione = null; }

            this.apiService.getDetails(this.model, this.id).subscribe({
                next: (response: any) => {
                    this.adesione = response;
                    console.log('adesione', this.adesione);
                    this.title = this._geServicetTitle();

                    this.isBozza = (this.adesione.stato == 'bozza');

                    this.loadCheckDati(this.adesione.id_adesione, this.getNextStateWorkflowName());

                    this.id_servizio = this.adesione.servizio.id_servizio;
                    this.loadServizio(this.id_servizio);
                    this.loadConfigurazioni(AmbienteEnum.Collaudo);
                    this.loadConfigurazioni(AmbienteEnum.Produzione);
                    this.loadReferents();
                    
                    this._initBreadcrumb();
                    this._updateOtherActions();

                    this.returnWeb = this.adesione.stato.includes('pubblicato_produzione');

                    this.spin = false;

                    // this.toggleEdit();
                },
                error: (error: any) => {
                    Tools.OnError(error);
                    this.spin = false;
                }
            });
        }
    }

    getStateWorkflow() {
        const statoAdesione = this.adesione.stato;
        const workflow = Tools.Configurazione?.adesione.workflow || null;
        const index = workflow ? workflow.cambi_stato.findIndex((item: any) => item.stato_attuale === statoAdesione) : -1;
        const currentState = (index !== -1) ? workflow.cambi_stato[index] : null;
        if (statoAdesione === Tools.StatoAdesione.BOZZA.Code && this.adesione.skip_collaudo) {
            const stati_ulteriori = currentState?.stati_ulteriori;
            if (stati_ulteriori?.length > 0) {
                return stati_ulteriori[0];
            }
        }
        return currentState;
    }

    hasNextStateWorkflow() {
        const currentState = this.getStateWorkflow();
        return currentState?.stato_successivo || currentState.nome;
    }

    getNextStateWorkflow() {
        const currentState = this.getStateWorkflow();
        if (currentState) {
            const stato = currentState.stato_successivo.nome;
            const workflow = Tools.Configurazione?.adesione.workflow || null;
            const index = workflow ? workflow.cambi_stato.findIndex((item: any) => item.stato_attuale === stato) : -1;
            return (index !== -1) ? workflow.cambi_stato[index] : null;
        }
        return null;
    }

    getNextStateWorkflowName() {
        const currentState = this.getStateWorkflow();
        if (currentState) {
            return currentState.stato_successivo?.nome || currentState.nome;
        }
        return 'nessun_cambio_stato';
    }

    _hasCambioStato() {
        if (this.authenticationService.isGestore(this.grant?.ruoli)) { return true; }
        const _statoPrecedetene: boolean = false; // this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stato_precedente', this.grant?.ruoli);
        const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', this.grant?.ruoli);
        const _statiUlteriori: boolean = false; // this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stati_ulteriori', this.grant?.ruoli);
        return (_statoPrecedetene || _statoSuccessivo || _statiUlteriori);
    }
    
    private loadServizio(id: string | null, disable = false) {
        this.apiService.getDetails('servizi', id).subscribe((respponse: any) => {
            this.servizio = respponse;

            this.isDominioEsterno = this.servizio.dominio?.soggetto_referente?.organizzazione?.esterna || false;
            this.idDominioEsterno = this.servizio.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
            this.idSoggettoDominioEsterno = this.servizio.dominio?.soggetto_referente?.id_soggetto || null;
        });
    }

    onBreadcrumb(event: any) {
        this.router.navigate([event.url]);
    }

    _geServicetTitle() {
        const _servizio: string = this.adesione ? this.adesione.servizio.nome : '';
        const _versione: string = this.adesione ? this.adesione.servizio.versione : '';

        return this.adesione ? `${_servizio} v. ${_versione}` : this.id ? `${this.id}` : '<no-title>';
    }

    _initBreadcrumb() {
        const _organizzazione: string = this.adesione ? this.adesione.soggetto?.organizzazione.nome : null;
        const _servizio: string = this.adesione ? this.adesione.servizio?.nome : '';
        const _versione: string = this.adesione ? this.adesione.servizio?.versione : '';
        const _adesione: string = this.adesione ? this.adesione.id_adesione : '';
        const _toolTipAdesione = this.adesione ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.adesione.stato) : '';

        let title = this.adesione ? `${_organizzazione} - ${_servizio} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
        let baseUrl = `/${this.model}`;

        if (this.serviceBreadcrumbs) {
            title = _organizzazione;
            baseUrl = `/servizi/${this.serviceBreadcrumbs.service.id_servizio}/${this.model}`;
        }

        if (this.config?.useEditWizard) {
            this.breadcrumbs = [
                { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
                { label: title, url: '', type: 'link' },
            ];
        } else {
            this.breadcrumbs = [
                { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
                { label: title, url: `${baseUrl}/${_adesione}/view`, type: 'link', tooltip: _toolTipAdesione },
                { label: 'APP.TITLE.SubscriptionConfiguration', url: ``, type: 'link' }
            ];
        }

        if (this.serviceBreadcrumbs){
            this.breadcrumbs.unshift(...this.serviceBreadcrumbs.breadcrumbs);
        }
    }

    backAdesione() {
        this.router.navigate([`/${this.model}/${this.id}/view`]);
    }

    isModifiableMapper = (update: string, environmentId: string): boolean => {
        if (this.grant) {
            if ((environmentId === AmbienteEnum.Collaudo) && (this.grant.collaudo === RightsEnum.Scrittura)) {
                return this.isEdit;
            }
            if ((environmentId === AmbienteEnum.Produzione) && (this.grant.produzione === RightsEnum.Scrittura)) {
                return this.isEdit;
            }
        }
        return false;
    }

    isGestoredMapper = (update: string): boolean => {
        const _grant: any = this.grant || [];
        return this.authenticationService.isGestore(_grant);
    }

    toggleEdit() {
        this.updateMapper = new Date().getTime().toString();
        this.openAccordion(this._findFirstAccordionError() || '', this.isEdit);
        this.isEdit = !this.isEdit;
    }

    _findFirstAccordionError(): string | undefined {
        const accordionId = Object.keys(this.accordionTypeList).find((key: any) => {
            return !this.isCompletedMapper(false, this.accordionTypeList[key]);
        })
        return accordionId;
    }

    loadCheckDati(id: string, stato: string) {
        this.dataStructureResults = { esito: 'ok' };
        if (this.hasNextStateWorkflow()) {
            this.loadingCheckDati = true;
            this.apiService.getDetails(this.model, id, `check-dati/${stato}`).subscribe({
                next: (response: any) => {
                    console.log('checkDati', response);
                    this.dataStructureResults = response;
                    this.loadingCheckDati = false;
                },
                error: (error: any) => {
                    this.loadingCheckDati = false;
                    console.log('checkDati error', error);
                }
            });
        }
    }

    getStatusCompleteMapper = (update: boolean, className: string): number => {
        if (this.isCompletedMapper(update, className)) {
            const next = this.getNextStateWorkflow();
            console.log('next', className, next.dati_non_applicabili);
            return next?.dati_non_applicabili?.includes(className) ? 2 : 1;
        } else {
            return 0;
        }
    }

    isCompletedMapper = (update: boolean, className: string): boolean => {
        const data = this.dataStructureResults;
        return data.esito === 'ok' || this.ckeckProvider.getObjectByDato(data, className) === undefined;
    }

    isSottotipoGroupCompletedMapper = (update: boolean, environment: string, tipo: string): boolean => {
        return this.ckeckProvider.isSottotipoGroupCompleted(this.dataStructureResults, environment, tipo);
    }

    getStatusSottotipoCompleteMapper = (update: boolean, environment: string, tipo: string, identificativo: string): number => {
        if (this.isSottotipoCompletedMapper(update, environment, tipo, identificativo)) {
            const next = this.getNextStateWorkflow();
            return next?.dati_non_applicabili?.includes(environment) ? 2 : 1;
        } else {
            return 0;
        }
    }

    isSottotipoCompletedMapper = (update: boolean, environment: string, tipo: string, identificativo: string): boolean => {
        return this.ckeckProvider.isSottotipoCompleted(this.dataStructureResults, environment, tipo, identificativo);
    }

    configurazioni: any = {
        [AmbienteEnum.Collaudo]: [],
        [AmbienteEnum.Produzione]: []
    };
    proprietaCustomFiltered: any = {
        [AmbienteEnum.Collaudo]: [],
        [AmbienteEnum.Produzione]: []
    };

    loadConfigurazioni(environmentId: string) {
        const proprietaCustom = this.authenticationService._getConfigModule('adesione').proprieta_custom;
        if (this.id) {
            this.apiService.getDetails(this.model, this.id, environmentId + '/configurazioni').subscribe({
                next: (response: any) => {
                    this.configurazioni[environmentId] = response.content;
                    const _adesioneAuthType: string[] = this.adesione.client_richiesti.map((item: any) => item.auth_type);
                    const _adesioneProfili: string[] = this.adesione.client_richiesti.map((item: any) => item.profilo);
                    this.proprietaCustomFiltered[environmentId] = proprietaCustom.filter((item: any) => {
                        const _hasAuthType = item.auth_type ? _.intersection(_adesioneAuthType, item.auth_type).length > 0 : true;
                        const _hasProfilo = item.profili ? _.intersection(_adesioneProfili, item.profili).length > 0 : true;
                        const _hasClasseDato = (item.classe_dato.includes(environmentId));
                        const _ruoli = this.grant?.ruoli || [];
                        const _hasRuolo = item.ruoli_abilitati ? _.intersection(_ruoli, item.ruoli_abilitati).length > 0 : true;
                        return _hasClasseDato && _hasProfilo && _hasAuthType && _hasRuolo;
                    });
                },
                error: (error: any) => {
                    Tools.OnError(error);
                }
            });
        }
    }

    public referents: any[] = [];
    public referentiLoading: boolean = true;
    private modalAddReferentRef!: BsModalRef;

    private loadReferents() {
        this.referentiLoading = true;
        forkJoin({
            referenti: this.apiService.getDetails(this.model, this.id, 'referenti'),
        }).subscribe({
            next: (response: any) => {
                const referents: Referent[] = response.referenti.content.map((item: any) => ({ ...item, tipo: `${item.tipo}` }));

                const reduceReferents = (acc: ReferentView[], cur: Referent) => {
                    const index = acc.findIndex((item: ReferentView) => item.id === cur.utente.id_utente);
                    if (index === -1) {
                        acc.push({
                            id: cur.utente.id_utente,
                            email: cur.utente.email_aziendale,
                            name: `${cur.utente.nome} ${cur.utente.cognome}`,
                            types: [cur.tipo != 'referente' || !cur.utente.ruolo ? cur.tipo : cur.utente.ruolo]
                        });
                    } else {
                        acc[index].types.push(cur.tipo);
                    }
                    return acc;
                };

                const _itemRow = this.referentiConfig.itemRow;
                const _options = this.referentiConfig.options;
                const _list: any = referents.map((referent: any) => {
                    const metadataText = Tools.simpleItemFormatter(_itemRow.metadata.text, referent, _options || null);
                    const metadataLabel = Tools.simpleItemFormatter(_itemRow.metadata.label, referent, _options || null);
                    const element = {
                        id: referent.id,
                        primaryText: Tools.simpleItemFormatter(_itemRow.primaryText, referent, _options || null),
                        secondaryText: Tools.simpleItemFormatter(_itemRow.secondaryText, referent, _options || null, ' '),
                        metadata: (metadataText || metadataLabel) ? `${metadataText}<span class="me-2">&nbsp;</span>${metadataLabel}` : '',
                        secondaryMetadata: Tools.simpleItemFormatter(_itemRow.secondaryMetadata, referent, _options || null, ' '),
                        editMode: false,
                        enableCollapse: true,
                        source: { ...referent }
                    };
                    return element;
                });

                this.referents = [ ..._list ];

                this.referentiLoading = false;
            },
            error: (error: any) => {
                Tools.OnError(error);
                this.referentiLoading = false;
            }
        });
    }

    addReferenteModal(event: any) {
        event.stopPropagation();
        event.preventDefault();
        const initialState = {
            title: 'APP.TITLE.AddReferent',
            id: this.id,
            adesione: this.adesione
        };
        this.modalAddReferentRef = this.modalService.show(ModalAddReferentComponent, {
            ignoreBackdropClick: true,
            // class: 'modal-lg-custom',
            initialState: initialState
        });
        this.modalAddReferentRef.content.onClose.subscribe(
            (result: any) => {
                console.log(result);
                this.loadReferents();
            }
        );
    }

    _generateReferentFields(data: any) {
        return Tools.generateFields(this.referentiConfig.details, data).map((field: FieldClass) => {
            field.label = this.translate.instant(field.label);
            return field;
        });
    }

    confirmDeleteReferente(data: any) {
        const initialState = {
            title: this.translate.instant('APP.TITLE.Attention'),
            cancelText: this.translate.instant('APP.BUTTON.Cancel'),
            confirmText: this.translate.instant('APP.BUTTON.Confirm'),
            confirmColor: 'danger'
        };
        this.utils._confirmDialog('APP.MESSAGE.AreYouSure', data, this._deleteReferente.bind(this), initialState);
    }

    private _deleteReferente(data: any) {
        this.apiService.deleteElementRelated(this.model, this.id, `referenti/${data.source.utente.id_utente}?tipo_referente=${data.source.tipo}`)
            .subscribe({
                next: (response: any) => {
                    this.loadReferents();
                },
                error: (error: any) => {
                    // this._error = true;
                    const _message = this.translate.instant('APP.MESSAGE.ERROR.NoDeleteReferent');
                    Tools.showMessage(_message, 'danger', true);
                }
            });
    }

    canAddMapper = (): boolean => {
        const _cnm = this.authenticationService._getClassesNotModifiable('adesione', 'adesione', this.adesione?.stato);
        const _lstPerm = [];
        if (_.indexOf(_cnm, 'referente') === -1) {
            _lstPerm.push(true);
        }
        if (_.indexOf(_cnm, 'referente_superiore') === -1) {
            _lstPerm.push(true);
        }
        if (_lstPerm.length) {
            let _can = true;
            _lstPerm.forEach((value: boolean) => {
                _can = _can && value;
            });
            return _can && this.hasActions();
        }
        return this.hasActions();
    }

    canEditMapper = (): boolean => {
        return this.authenticationService.canEdit('adesione', 'adesione', this.adesione?.stato, this.grant?.ruoli);
    }

    hasActions() {
        const _grant: any = this.grant || [];
        if (this.authenticationService.isGestore(_grant)) { return true; }
        if (this.adesione) {
            const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', _grant);
            return _statoSuccessivo;
        }
        return false;
    }

    resetError() {
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
    }

    onWorkflowAction(event: any = null) {
        this.resetError();

        if (!event) {
            event = { action: 'change', status: this.getStateWorkflow() };
        }
        this.utils.__confirmCambioStatoServizio(event, this.adesione, this._changeStatus.bind(this));
    }
    
    _changeStatus(event: any, service: any) {
        this.isEdit = false;
        this.updateMapper = new Date().getTime().toString();
        this.openAccordion(this._findFirstAccordionError() || '', true);

        this.changingStatus = true;
        const newStatus = event.status?.stato_successivo?.nome || event.status?.nome;
        const _url: string = `${this.model}/${this.id}/stato`;
        const _body: any = {
            stato: newStatus
        };
        this.apiService.saveElement(_url, _body).subscribe(
            (response: any) => {
                this.adesione = response; // new Service({ ...response });
                this.changingStatus = false;

                this.loadAdesione(true);
            },
            (error: any) => {
                this._error = true;
                this._errorMsg = Tools.WorkflowErrorMsg(error);
                this._errors = error.error.errori || [];
                this._fromStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + this.adesione.stato);
                this._toStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + newStatus);
                const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusError', {status: this._toStatus});
                Tools.showMessage(_msg, 'danger', true);
                this.changingStatus = false;
            },
        );
    }

    openAccordion(id: string, open: boolean = true) {
        const element = document.getElementById(`${id}`);
        if (element) {
            const header = element.querySelector('.accordion-button');
            const collapse = element.querySelector('.accordion-collapse');

            if (open) {
                header?.classList.add('collapsed');
                collapse?.classList.remove('show');
            } else {
                header?.classList.remove('collapsed');
                collapse?.classList.add('show');
            }

            // header?.classList.toggle('collapsed');
            // collapse?.classList.toggle('show');
        }

        this.utils.scrollTo(id);
    }

    public onActionMonitor(event: any) {
        if(event.action == 'backview') {
            this.router.navigate(['view'], { relativeTo: this.route });
        }
        if(event.action == 'download_scheda') {
            this._downloadSchedaAdesione();
        }
        if(event.action == 'comunicazioni') {
            this.router.navigate(['comunicazioni'], { relativeTo: this.route });
        }
    }

    _downloadSchedaAdesione() {
        if (this.id) {
            this.downloading = true;

            const _partial = `export`;
            this.apiService.download(this.model, this.id, _partial).subscribe({
                next: (response: any) => {
                    // const _ext = data.filename.split('/')[1];
                    // let name: string = `${data.filename}.${_ext}`;
                    let name: string = `SchedaAdesione.pdf`;
                    saveAs(response.body, name);
                    this.downloading = false;
                },
                error: (error: any) => {
                    this._error = true;
                    this._errorMsg = Tools.GetErrorMsg(error);
                    this.downloading = false;
                }
            });
        }
    }

    get showSkipCollaudo(): boolean {
        return this.isBozza && this.adesione.servizio.skip_collaudo;
    };

    toggleSkipCollaudo() {
        this.saveSkipCollaudo = true;

        const body: any = {
            identificativo: {
                id_logico: this.adesione?.id_logico || null,
                id_soggetto: this.adesione?.soggetto?.id_soggetto || null,
                id_servizio: this.adesione?.servizio?.id_servizio || null,
                skip_collaudo: !this.adesione.skip_collaudo
            }
        };

        body.identificativo = this.utils._removeEmpty(body.identificativo);

        this.apiService.putElement(this.model, this.id, body).subscribe({
            next: (response: any) => {
                this.adesione.skip_collaudo = !this.adesione.skip_collaudo;
                this.updateMapper = new Date().getTime().toString();
                this.loadCheckDati(this.adesione.id_adesione, this.getNextStateWorkflowName());
                this.saveSkipCollaudo = false;
            },
            error: (error: any) => {
                this.saveSkipCollaudo = false;
            }
        });
    }
}
