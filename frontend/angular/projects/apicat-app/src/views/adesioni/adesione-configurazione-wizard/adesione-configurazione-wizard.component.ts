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
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { MarkdownModule } from 'ngx-markdown';

import { ConfigService, COMPONENTS_IMPORTS, EventsManagerService, Tools, EventType, FieldClass, MenuAction } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MapperPipe } from '@app/lib/pipes/mapper.pipe';
import { WorkflowComponent } from '@app/components/workflow/workflow.component';
import { MonitorDropdwnComponent } from '@app/views/servizi/components/monitor-dropdown/monitor-dropdown.component';
import { ApiCustomPropertiesComponent } from '@app/components/api-custom-properties/api-custom-properties.component';
import { ErrorViewComponent } from '@app/components/error-view/error-view.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';

import { ModalAddReferentComponent } from './modal-add-referent/modal-add-referent.component';
import { AdesioneListaClientsComponent } from './adesione-lista-clients/adesione-lista-clients.component';
import { AdesioneDialogMockPanelComponent } from './adesione-dialog-mock-panel/adesione-dialog-mock-panel.component';
import { AdesioneListaErogazioniComponent } from './adesione-lista-erogazioni/adesione-lista-erogazioni.component';
import { AdesioneFormComponent } from './adesione-form/adesione-form.component';
import { AdesioneStepBarComponent, StepBarVariant, StepWizardItem } from '../adesione-step-bar/adesione-step-bar.component';

import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';

import { forkJoin, Observable } from 'rxjs';

import { Grant, RightsEnum } from '@app/model/grant';
import { AmbienteEnum } from '@app/model/ambienteEnum';
import { ReferentView, Referent } from '../adesione-view/adesione-view.component';

import * as _ from 'lodash';
declare const saveAs: any;

import { CkeckProvider, ClassiEnum, DataStructure } from '@app/provider/check.provider';
import { NotificationBarComponent } from '@app/views/notifications/notification-bar/notification-bar.component';

export enum AccordionType {
    GENERAL_INFO = 'accordion-general-info',
    ACCORDION_REFERENTI = 'accordion-referenti',
    ACCORDION_COLLAUDO = 'accordion-collaudo',
    ACCORDION_PRODUZIONE = 'accordion-produzione'
}

export type DisclaimerContesto = 'generale' | 'collaudo' | 'produzione';
export type DisclaimerSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface AdesioneDisclaimerLink {
    label?: string;
    title?: string;
    text?: string;
    url?: string;
    href?: string;
    rel?: string;
}

export interface AdesioneDisclaimer {
    disclaimer: string;
    contesto?: DisclaimerContesto;
    severity?: DisclaimerSeverity;
    links?: AdesioneDisclaimerLink[];
    profilo?: string;
}

@Component({
    selector: 'app-adesione-configurazione-wizard',
    templateUrl: './adesione-configurazione-wizard.component.html',
    styleUrls: ['./adesione-configurazione-wizard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        MapperPipe,
        TooltipModule,
        MarkdownModule,
        MonitorDropdwnComponent,
        ApiCustomPropertiesComponent,
        ErrorViewComponent,
        AdesioneListaClientsComponent,
        AdesioneListaErogazioniComponent,
        AdesioneDialogMockPanelComponent,
        AdesioneFormComponent,
        AdesioneStepBarComponent,
        NotificationBarComponent,
        WorkflowComponent
    ]
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

    _fromDashboard: boolean = false;
    _dashboardSection: string = '';
    _notification: any = null;
    _notificationId: string = '';
    _notificationMessageId: string = '';

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

    // Configurazione step_wizard (da `adesione.step_wizard` in configurazione.json)
    stepWizard: StepWizardItem[] = [];
    // Step-bar interne di sezione, da `adesione.step_wizard_collaudo` e
    // `adesione.step_wizard_produzione` in configurazione.json. Aggregate in
    // un'unica mappa per comodità di accesso dal template
    // (`getStepWizardSezione(...)`). Liste vuote se la config remota non le
    // definisce e i fallback frontend non sono attivi.
    stepWizardSezione: { [sezione: string]: StepWizardItem[] } = { collaudo: [], produzione: [] };
    // Sezioni attive per lo step corrente (es. ['info_generali', 'referenti', 'collaudo'])
    activeSections: string[] = [];
    /**
     * Override dello step corrente usato dalla step-bar interattiva: se null,
     * le sezioni attive derivano dallo stato reale dell'adesione; se valorizzato,
     * le sezioni attive sono quelle dello step selezionato (tipicamente uno
     * step precedente cliccato dall'utente per tornare a rivedere la
     * configurazione di una fase passata).
     */
    selectedStepCode: string | null = null;

    /**
     * Override runtime del flag `wizard_show_all_sections` usato per la demo.
     * Quando null il comportamento segue il valore del config; quando è
     * boolean ha priorità sul config ed è modificabile via toggle in UI.
     */
    wizardShowAllSectionsOverride: boolean | null = null;

    /**
     * Flag frontend `wizard_show_all_sections` letto da `adesioni-config.json`.
     * Quando true tutte le sezioni del wizard sono sempre visibili: quelle NON
     * attive vengono disabilitate e mostrate chiuse, quelle attive vengono
     * aperte di default. Quando false si mantiene il comportamento classico:
     * solo le sezioni attive per lo step corrente sono visibili (chiuse di
     * default). Il getter si basa su `this.config` che viene caricato in
     * modo asincrono in constructor: finché non è pronto, il comportamento
     * è quello retro-compatibile (flag assente → false). Se è impostato
     * `wizardShowAllSectionsOverride` (toggle debug) questo ha la precedenza.
     */
    get wizardShowAllSections(): boolean {
        if (this.wizardShowAllSectionsOverride !== null) {
            return this.wizardShowAllSectionsOverride;
        }
        return !!this.config?.wizard_show_all_sections;
    }

    toggleWizardShowAllSections(): void {
        // Alla prima pressione inizializziamo l'override al valore correntemente
        // applicato e poi lo invertiamo, così il toggle è sempre coerente.
        const current = this.wizardShowAllSections;
        this.wizardShowAllSectionsOverride = !current;
    }

    /**
     * Master flag che abilita/disabilita i toggle di debug sul wizard
     * (show-all-sections e show-state-badges). Letto dal config frontend
     * `wizard_debug_switches`. Quando false gli switch non vengono renderizzati
     * e il wizard usa i valori di default dei relativi flag.
     */
    get debugSwitchesEnabled(): boolean {
        return !!this.config?.wizard_debug_switches;
    }

    /**
     * Override runtime del flag `showStateBadges` passato alla step-bar.
     * Quando null si usa il default del componente (false → badge nascosti).
     */
    showStateBadgesOverride: boolean | null = null;

    get showStateBadges(): boolean {
        return this.showStateBadgesOverride !== null ? this.showStateBadgesOverride : false;
    }

    toggleShowStateBadges(): void {
        this.showStateBadgesOverride = !this.showStateBadges;
    }

    /** Variante grafica della step-bar ('circles' | 'chevron'). */
    stepBarVariant: StepBarVariant = 'chevron';

    toggleStepBarVariant(): void {
        this.stepBarVariant = this.stepBarVariant === 'circles' ? 'chevron' : 'circles';
    }

    /** Preset colori dark per la step-bar (override runtime via CSS vars). */
    stepBarDarkMode: boolean = false;
    circlesLabelRight: boolean = true;
    stepBarDarkVars: Record<string, string> = {
        '--step-bar-bg': '#1e1e2e',
        '--step-completed-bg': '#89b4fa',
        '--step-completed-color': '#1e1e2e',
        '--step-current-bg': '#313244',
        '--step-current-color': '#cdd6f4',
        '--step-pending-bg': '#11111b',
        '--step-pending-color': '#6c7086',
        '--step-preview-bg': '#2a2a3c',
        '--step-preview-color': '#b4befe',
        '--step-real-bg': '#1e3a2a',
        '--step-real-color': '#a6e3a1'
    };

    toggleStepBarDarkMode(): void {
        this.stepBarDarkMode = !this.stepBarDarkMode;
    }

    // Disclaimer caricati dall'API `/adesioni/{id}/disclaimers`
    disclaimers: AdesioneDisclaimer[] = [];
    disclaimersLoading: boolean = false;

    // Abilitare solo per test locali dei disclaimer con contesti/severity diverse
    disclaimersUseMock: boolean = false;
    private readonly DISCLAIMERS_MOCK: AdesioneDisclaimer[] = [
        {
            contesto: 'generale',
            severity: 'INFO',
            disclaimer: '## Adesione PDND in bozza\nL\'adesione utilizza il profilo **PDND**. Prima di procedere, assicurarsi di aver completato la registrazione sulla piattaforma PDND e di disporre di un e-service attivo.',
            links: [
                { label: 'Documentazione PDND', url: 'https://www.pagopa.it/it/cittadini/pdnd' }
            ]
        },
        {
            contesto: 'generale',
            severity: 'WARNING',
            disclaimer: '**Attenzione**: questa adesione richiede approvazione da parte del gestore prima della pubblicazione in produzione.'
        },
        {
            contesto: 'collaudo',
            severity: 'INFO',
            disclaimer: 'Nell\'ambiente di **collaudo** puoi effettuare test senza impatto sui dati di produzione.'
        },
        {
            contesto: 'collaudo',
            severity: 'WARNING',
            disclaimer: 'I certificati di collaudo hanno validita\' limitata: rinnovarli prima della scadenza.',
            links: [
                { label: 'Guida rinnovo certificati', url: 'https://example.com/certificati' }
            ]
        },
        {
            contesto: 'produzione',
            severity: 'INFO',
            disclaimer: 'Configurazione **produzione** attiva. Le modifiche avranno effetto immediato sui client reali.'
        },
        {
            contesto: 'produzione',
            severity: 'WARNING',
            disclaimer: 'Verificare la configurazione PDND in produzione: richieste errate possono comportare la sospensione del servizio.'
        }
    ];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly modalService: BsModalService,
        private readonly configService: ConfigService,
        private readonly eventsManagerService: EventsManagerService,
        private readonly apiService: OpenAPIService,
        private readonly authenticationService: AuthenticationService,
        private readonly utils: UtilService,
        private readonly ckeckProvider: CkeckProvider
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

        this.route.queryParams.subscribe((val) => {
            this._notification = null;
            this._notificationId = '';
            this._notificationMessageId = '';
            if (val.from === 'dashboard') {
                this._fromDashboard = true;
                this._dashboardSection = val.section || '';
                this._initBreadcrumb();
            }
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
        });
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
            this.loadCheckDati(this.adesione.id_adesione, this.getNextStateWorkflowName());
            this.loadConfigurazioni(AmbienteEnum.Collaudo);
            this.loadConfigurazioni(AmbienteEnum.Produzione);
        })

        this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
            this.generalConfig = Tools.Configurazione || null;
            this.updateMapper = new Date().getTime().toString();
        });

        // Ricarica i disclaimer quando l'utente cambia lingua nell'interfaccia
        this.translate.onLangChange.subscribe(() => {
            if (this.adesione) {
                this._loadDisclaimers();
            }
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
                    this.adesione.id_logico = response.id_logico;
                    this.title = this._geServicetTitle();

                    this.isBozza = (this.adesione.stato == 'bozza');

                    // Dopo un ricaricamento (tipicamente post cambio stato) resettiamo
                    // l'eventuale override dello step scelto dalla step-bar, così la UI
                    // torna a seguire lo stato reale dell'adesione.
                    this.selectedStepCode = null;

                    this._loadStepWizardConfig();
                    this._computeActiveSections();
                    this._loadDisclaimers();

                    this.loadCheckDati(this.adesione.id_adesione, this.getNextStateWorkflowName());

                    this.id_servizio = this.adesione.servizio.id_servizio;
                    this.loadServizio(this.id_servizio);
                    this.loadConfigurazioni(AmbienteEnum.Collaudo);
                    this.loadConfigurazioni(AmbienteEnum.Produzione);
                    this.loadReferents();

                    this._initBreadcrumb();
                    this._updateOtherActions();

                    this.returnWeb = this.authenticationService.canJoin('adesione', this.adesione?.stato);

                    this.spin = false;

                    this.isEdit = this.canEditMapper();
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
        if (statoAdesione === Tools.StatoAdesione.ARCHIVIATO.Code) {
            return {
                stato_attuale: statoAdesione,
                stato_successivo: null,
                stati_ulteriori: []
            };
        }
        const index = workflow ? workflow.cambi_stato.findIndex((item: any) => item.stato_attuale === statoAdesione) : -1;
        const currentState = (index === -1) ? null : workflow.cambi_stato[index];
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
        return currentState?.stato_successivo || currentState?.nome;
    }

    getNextStateWorkflow() {
        const currentState = this.getStateWorkflow();
        if (currentState) {
            const stato = currentState.stato_successivo?.nome || currentState.nome;
            const workflow = Tools.Configurazione?.adesione.workflow || null;
            const index = workflow ? workflow.cambi_stato.findIndex((item: any) => item.stato_attuale === stato) : -1;
            return (index === -1) ? null : workflow.cambi_stato[index];
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
        const _statoPrecedetene: boolean = false;
        const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', this.grant?.ruoli);
        const _statiUlteriori: boolean = false;
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
        if (event.params) {
            this.router.navigate([event.url], { queryParams: event.params });
        } else {
            this.router.navigate([event.url]);
        }
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

        if (this.adesione?.id_logico) {
            title = `${this.adesione.id_logico} (${_organizzazione})`;
        }

        const _dashboardParams = this._dashboardSection ? { section: this._dashboardSection } : null;
        if (this._fromDashboard && !this.serviceBreadcrumbs) {
            if (this.config?.useEditWizard) {
                this.breadcrumbs = [
                    { label: 'APP.TITLE.Dashboard', url: '/dashboard', type: 'link', iconBs: 'speedometer2', params: _dashboardParams },
                    { label: title, url: '', type: 'link' },
                ];
            } else {
                this.breadcrumbs = [
                    { label: 'APP.TITLE.Dashboard', url: '/dashboard', type: 'link', iconBs: 'speedometer2', params: _dashboardParams },
                    { label: title, url: `/${this.model}/${_adesione}/view`, type: 'link', tooltip: _toolTipAdesione },
                    { label: 'APP.TITLE.SubscriptionConfiguration', url: ``, type: 'link' }
                ];
            }
        } else if (this.config?.useEditWizard) {
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

        if (this.serviceBreadcrumbs) {
            this.breadcrumbs.unshift(...this.serviceBreadcrumbs.breadcrumbs);
        }
    }

    _onCloseNotificationBar(event: any) {
        this.router.navigate([this.model, this.id]);
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

    isStatusPubblicatoCollaudodMapper = (update: boolean, stato: string): boolean => {
        return stato === 'pubblicato_produzione';
    }

    getStatusCompleteMapper = (update: boolean, className: string): number => {
        // Caso 1: Skip collaudo attivo - la sezione Collaudo deve essere grigia (non applicabile)
        if (className === AmbienteEnum.Collaudo && this.adesione?.skip_collaudo) {
            return 2; // grigio - non applicabile
        }

        // Caso 2: Siamo in fase di collaudo - la sezione Produzione deve essere grigia (non ancora applicabile)
        if (className === AmbienteEnum.Produzione && this._isInCollaudoPhase()) {
            return 2; // grigio - non ancora applicabile
        }

        if (this.isCompletedMapper(update, className)) {
            const next = this.getNextStateWorkflow();
            return next?.dati_non_applicabili?.includes(className) ? 2 : 1;
        } else {
            return this._hasCambioStato() ? 0 : 1;
        }
    }

    /**
     * Verifica se l'adesione è nella fase di collaudo (cioè non ancora passata alla produzione)
     * Usato per mostrare la sezione Produzione in grigio quando non è ancora il momento di configurarla
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
        // Se skip_collaudo è attivo, non siamo nella fase di collaudo
        // (il flusso salta direttamente alla produzione)
        return !this.adesione?.skip_collaudo && collaudoStates.includes(this.adesione?.stato);
    }

    isCompletedMapper = (update: boolean, className: string): boolean => {
        const data = this.dataStructureResults;
        return data.esito === 'ok' || this.ckeckProvider.getObjectByDato(data, className) === undefined;
    }

    isSottotipoGroupCompletedMapper = (update: boolean, environment: string, tipo: string): boolean => {
        return this.ckeckProvider.isSottotipoGroupCompleted(this.dataStructureResults, environment, tipo);
    }

    getStatusSottotipoCompleteMapper = (update: boolean, environment: string, tipo: string, identificativo: string): number => {
        // Caso 1: Skip collaudo attivo e ambiente è Collaudo - mostra grigio (non applicabile)
        if (environment === AmbienteEnum.Collaudo && this.adesione?.skip_collaudo) {
            return 2; // grigio - non applicabile
        }

        // Caso 2: Siamo in fase di collaudo e ambiente è Produzione - mostra grigio (non ancora applicabile)
        if (environment === AmbienteEnum.Produzione && this._isInCollaudoPhase()) {
            return 2; // grigio - non ancora applicabile
        }

        if (this.isSottotipoCompletedMapper(update, environment, tipo, identificativo)) {
            const next = this.getNextStateWorkflow();
            return next?.dati_non_applicabili?.includes(environment) ? 2 : 1;
        } else {
            return this._hasCambioStato() ? 0 : 1;
        }
    }

    isSottotipoCompletedMapper = (update: boolean, environment: string, tipo: string, identificativo: string): boolean => {
        return this._hasCambioStato() ? this.ckeckProvider.isSottotipoCompleted(this.dataStructureResults, environment, tipo, identificativo) : true;
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
        const proprietaCustom = this.authenticationService._getConfigModule('adesione').proprieta_custom || [];
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
    public serviceReferents: any[] = [];
    public domainReferents: any[] = [];
    public referentiLoading: boolean = true;
    private _referentsLoadCount: number = 0;
    private modalAddReferentRef!: BsModalRef;

    private loadReferents() {
        this.referentiLoading = true;
        this._referentsLoadCount++;
        forkJoin({
            referenti: this.apiService.getDetails(this.model, this.id, 'referenti'),
            referentiDominio: this.apiService.getDetails('domini', this.adesione?.servizio.dominio.id_dominio, 'referenti'),
            referentiServizio: this.apiService.getDetails('servizi', this.adesione?.servizio.id_servizio, 'referenti')
        }).subscribe({
            next: (response: any) => {
                const referents: Referent[] = response.referenti.content.map((item: any) => ({ ...item, tipo: `${item.tipo}` }));
                const serviceReferents: Referent[] = response.referentiServizio.content.map((item: any) => ({ ...item, tipo: `${item.tipo}_servizio` }));
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

                const _lc = this._referentsLoadCount;
                let _list: any = referents.map((referent: any, index: number) => {
                    const element = {
                        id: `${referent.utente?.id_utente || index}_${referent.tipo}_${_lc}`,
                        editMode: false,
                        enableCollapse: true,
                        source: { ...referent }
                    };
                    return element;
                });
                this.referents = [ ..._list ];

                _list = serviceReferents.map((referent: any, index: number) => {
                    const element = {
                        id: `${referent.utente?.id_utente || index}_${referent.tipo}_${_lc}`,
                        editMode: false,
                        enableCollapse: true,
                        source: { ...referent }
                    };
                    return element;
                });
                this.serviceReferents = [ ..._list ];

                _list = domainReferents.map((referent: any, index: number) => {
                    const element = {
                        id: `${referent.utente?.id_utente || index}_${referent.tipo}_${_lc}`,
                        editMode: false,
                        enableCollapse: true,
                        source: { ...referent }
                    };
                    return element;
                });
                this.domainReferents = [ ..._list ];

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
                    const _message = this.translate.instant('APP.MESSAGE.ERROR.NoDeleteReferent');
                    Tools.showMessage(_message, 'danger', true);
                }
            });
    }

    canAddMapper = (): boolean => {
        const _grant: any = this.grant?.ruoli || [];
        if (this.authenticationService._isDatoSempreModificabile('adesione', 'referenti', _grant)) {
            return true;
        }
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
        this.apiService.saveElement(_url, _body).subscribe({
            next: (response: any) => {
                this.adesione = response;
                this.changingStatus = false;

                this.loadAdesione(true);
            },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = Tools.WorkflowErrorMsg(error);
                this._errors = (error.error.errori || []).filter((e: any) => Object.keys(e).length > 0);
                this._fromStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + this.adesione.stato);
                this._toStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + newStatus);
                const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusError', {status: this._toStatus});
                Tools.showMessage(_msg, 'danger', true);
                this.changingStatus = false;
                this.isEdit = this.canEditMapper();
            },
        });
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
                    let name: string = `SchedaAdesione.pdf`;
                    saveAs(response.body, name);
                    this.downloading = false;
                },
                error: (error: any) => {
                    this._error = true;
                    this._errorMsg = this.utils.GetErrorMsg(error);
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

    /**
     * Fallback frontend per `adesione.step_wizard` quando la configurazione
     * remota non lo fornisce (transitorio, utile per test locali senza
     * modificare il `configurazione.json` installato).
     * Mantenere allineato con `src/main/plugin/plugin/configurazione.json`.
     */
    private static readonly _STEP_WIZARD_FALLBACK: StepWizardItem[] = [
        {
            code: 'info_generali',
            descrizione: 'Informazioni Generali e Referenti',
            stati_adesione: [],
            sezioni_attive: ['info_generali', 'referenti']
        },
        {
            code: 'collaudo',
            descrizione: 'Collaudo',
            stati_adesione: ['bozza', 'richiesto_collaudo', 'autorizzato_collaudo', 'in_configurazione_manuale_collaudo', 'in_configurazione_automatica_collaudo'],
            sezioni_attive: ['collaudo']
        },
        {
            code: 'produzione',
            descrizione: 'Produzione',
            stati_adesione: ['pubblicato_collaudo', 'richiesto_produzione', 'autorizzato_produzione', 'in_configurazione_manuale_produzione', 'in_configurazione_automatica_produzione', 'pubblicato_produzione'],
            sezioni_attive: ['produzione']
        }
    ];

    /**
     * Fallback frontend per `adesione.step_wizard_collaudo`.
     * Mantenere allineato con `src/main/plugin/plugin/configurazione.json`.
     */
    private static readonly _STEP_WIZARD_COLLAUDO_FALLBACK: StepWizardItem[] = [
        { code: 'in_compilazione',   descrizione: 'In Compilazione',   stati_adesione: ['bozza'] },
        { code: 'in_approvazione',   descrizione: 'In Approvazione',   stati_adesione: ['richiesto_collaudo'] },
        { code: 'in_configurazione', descrizione: 'In Configurazione', stati_adesione: ['autorizzato_collaudo', 'in_configurazione_manuale_collaudo', 'in_configurazione_automatica_collaudo'] },
        { code: 'configurato',       descrizione: 'Configurato',       stati_adesione: ['pubblicato_collaudo'] }
    ];

    /**
     * Fallback frontend per `adesione.step_wizard_produzione`.
     * Mantenere allineato con `src/main/plugin/plugin/configurazione.json`.
     */
    private static readonly _STEP_WIZARD_PRODUZIONE_FALLBACK: StepWizardItem[] = [
        { code: 'in_compilazione',   descrizione: 'In Compilazione',   stati_adesione: ['pubblicato_collaudo'] },
        { code: 'in_approvazione',   descrizione: 'In Approvazione',   stati_adesione: ['richiesto_produzione'] },
        { code: 'in_configurazione', descrizione: 'In Configurazione', stati_adesione: ['autorizzato_produzione', 'in_configurazione_manuale_produzione', 'in_configurazione_automatica_produzione'] },
        { code: 'configurato',       descrizione: 'Configurato',       stati_adesione: ['pubblicato_produzione'] }
    ];

    /**
     * Carica le configurazioni step-bar dal `configurazione.json`:
     * - `step_wizard` (principale, stato → sezioni attive)
     * - `step_wizard_collaudo` (step-bar interna della sezione collaudo)
     * - `step_wizard_produzione` (step-bar interna della sezione produzione)
     *
     * Per ciascuna chiave, se la config remota non la fornisce (o la
     * fornisce vuota) si ricade sui fallback frontend transitori
     * (`_STEP_WIZARD_FALLBACK`, `_STEP_WIZARD_COLLAUDO_FALLBACK`,
     * `_STEP_WIZARD_PRODUZIONE_FALLBACK`). I fallback consentono di
     * testare/modificare le step-bar senza toccare il plugin backend e vanno
     * rimossi quando il BE pubblica le chiavi aggiornate.
     *
     * FORZATURA TEMPORANEA: `_FORCE_STEP_WIZARD_FALLBACK = true` fa
     * ignorare del tutto la config remota e usare i fallback frontend per
     * tutte e tre le chiavi. Utile quando il BE installato serve ancora la
     * vecchia struttura `step_wizard` (code: adesione_creata / configurato_*).
     * Rimettere a `false` (o rimuovere il flag e il fallback) appena il BE
     * è aggiornato.
     */
    private static readonly _FORCE_STEP_WIZARD_FALLBACK = true;

    private _loadStepWizardConfig(): void {
        const forceFallback = AdesioneConfigurazioneWizardComponent._FORCE_STEP_WIZARD_FALLBACK;
        const adesioneConfig: any = forceFallback ? {} : (Tools.Configurazione?.adesione || {});

        const remoteSteps = adesioneConfig.step_wizard;
        this.stepWizard = (Array.isArray(remoteSteps) && remoteSteps.length > 0)
            ? remoteSteps
            : AdesioneConfigurazioneWizardComponent._STEP_WIZARD_FALLBACK;

        const remoteCollaudo = adesioneConfig.step_wizard_collaudo;
        const remoteProduzione = adesioneConfig.step_wizard_produzione;
        this.stepWizardSezione = {
            collaudo: (Array.isArray(remoteCollaudo) && remoteCollaudo.length > 0)
                ? remoteCollaudo
                : AdesioneConfigurazioneWizardComponent._STEP_WIZARD_COLLAUDO_FALLBACK,
            produzione: (Array.isArray(remoteProduzione) && remoteProduzione.length > 0)
                ? remoteProduzione
                : AdesioneConfigurazioneWizardComponent._STEP_WIZARD_PRODUZIONE_FALLBACK
        };
    }

    /**
     * Restituisce gli step della step-bar interna per la sezione richiesta.
     * Usato dal template per renderizzare la step-bar interna dentro gli
     * accordion Collaudo e Produzione.
     */
    getStepWizardSezione(sezione: 'collaudo' | 'produzione'): StepWizardItem[] {
        return this.stepWizardSezione?.[sezione] || [];
    }

    /**
     * Elenco ordinato cronologicamente degli stati dell'adesione, passato
     * alle step-bar per abilitare il rilevamento "oltre-fase" (vedi
     * `AdesioneStepBarComponent.workflowStati`). Preferisce
     * `adesione.workflow.stati` dalla config remota; in mancanza, deriva
     * l'ordine concatenando gli `stati_adesione` della step-bar principale.
     */
    get workflowStati(): string[] {
        const fromConfig = Tools.Configurazione?.adesione?.workflow?.stati;
        if (Array.isArray(fromConfig) && fromConfig.length > 0) {
            return fromConfig;
        }
        const derived: string[] = [];
        for (const step of this.stepWizard) {
            for (const st of step.stati_adesione || []) {
                if (!derived.includes(st)) derived.push(st);
            }
        }
        return derived;
    }

    /**
     * Calcola le sezioni attive in base allo step corrente del `step_wizard`.
     * Se l'utente ha selezionato un step precedente dalla step-bar interattiva
     * (`selectedStepCode`), si usa lo step corrispondente; altrimenti si
     * deriva dallo stato reale dell'adesione.
     * Una sezione (info_generali, referenti, collaudo, produzione) è visibile
     * se presente in `sezioni_attive` dello step selezionato.
     * Se non viene trovato nessuno step corrispondente (config mancante o stato
     * non mappato) tutte le sezioni restano visibili per retro-compatibilità.
     */
    private _computeActiveSections(): void {
        if (!this.stepWizard.length || !this.adesione?.stato) {
            this.activeSections = ['info_generali', 'referenti', 'collaudo', 'produzione'];
            return;
        }
        let selected: StepWizardItem | undefined;
        if (this.selectedStepCode) {
            selected = this.stepWizard.find(s => s.code === this.selectedStepCode);
        }
        selected ??= this.stepWizard.find(s => s.stati_adesione?.includes(this.adesione.stato));
        this.activeSections = selected?.sezioni_attive
            ? [...selected.sezioni_attive]
            : ['info_generali', 'referenti', 'collaudo', 'produzione'];
    }

    /**
     * Handler del click su uno step della step-bar. Aggiorna l'override
     * `selectedStepCode` e ricalcola le sezioni attive. Se l'utente clicca
     * sullo step che corrisponde allo stato reale, l'override viene resettato
     * così la UI torna a seguire automaticamente lo stato dell'adesione.
     */
    onStepBarClick(code: string): void {
        const realStep = this.stepWizard.find(s => s.stati_adesione?.includes(this.adesione?.stato));
        if (realStep?.code === code) {
            this.selectedStepCode = null;
        } else {
            this.selectedStepCode = code;
        }
        this._computeActiveSections();
    }

    isSectionActive(section: string): boolean {
        return this.activeSections.includes(section);
    }

    /**
     * Una sezione è visibile se attiva per lo step corrente oppure se il flag
     * `wizard_show_all_sections` è attivo (in quel caso tutte le sezioni sono
     * sempre visibili, quelle non attive appaiono disabilitate).
     */
    isSectionVisible(section: string): boolean {
        return this.wizardShowAllSections || this.isSectionActive(section);
    }

    /**
     * Una sezione è disabilitata solo in modalità `wizard_show_all_sections`
     * quando NON è tra le sezioni attive per lo step corrente. In modalità
     * classica (flag off) le sezioni non attive sono semplicemente nascoste.
     */
    isSectionDisabled(section: string): boolean {
        return this.wizardShowAllSections && !this.isSectionActive(section);
    }

    /**
     * Mappa sezione → identificativo classe/ambiente usato dal check-dati per
     * valutare lo stato di completamento (valori di `ClassiEnum` / `AmbienteEnum`).
     */
    private readonly _sectionClassMap: Record<string, string> = {
        info_generali: ClassiEnum.GENERALE,
        referenti: ClassiEnum.REFERENTI,
        collaudo: AmbienteEnum.Collaudo,
        produzione: AmbienteEnum.Produzione
    };

    /**
     * Una sezione è considerata "completata" (e quindi l'accordion resta chiuso)
     * quando `getStatusCompleteMapper` ritorna 1 (verde, dati OK) oppure 2
     * (grigio, non applicabile per lo step corrente, es. collaudo con skip o
     * produzione durante la fase di collaudo). Lo stato 0 (serve intervento)
     * lascia l'accordion aperto.
     */
    isSectionCompleted(section: string): boolean {
        const className = this._sectionClassMap[section];
        if (!className) return false;
        const status = this.getStatusCompleteMapper(false, className);
        return status === 1 || status === 2;
    }

    /**
     * Un accordion è aperto di default quando la sezione è attiva per lo step
     * corrente e NON ancora completata. Le sezioni completate (verde) o non
     * applicabili (grigio) restano chiuse — l'icona di stato su lnk-icon-toggle
     * ne evidenzia già lo stato. La regola si applica sia in modalità
     * `wizard_show_all_sections` on che off (in off le sezioni non attive sono
     * comunque nascoste, quindi la condizione aggiuntiva non è necessaria).
     */
    isSectionOpenByDefault(section: string): boolean {
        return this.isSectionActive(section) && !this.isSectionCompleted(section);
    }

    /**
     * Vero se la sezione corrisponde a una fase FUTURA dell'adesione,
     * cioe' non e' ancora raggiungibile con lo stato corrente.
     *
     * Per `produzione` si usa la config remota `adesione.stati_scheda_adesione`
     * (lista degli stati in cui la scheda produzione e' disponibile).
     * Per le altre sezioni si deduce dalla step-bar principale: la sezione
     * e' futura se lo step corrente dell'adesione precede il piu' piccolo
     * indice di step che include la sezione in `sezioni_attive`.
     */
    private _isSectionFuture(section: string): boolean {
        if (section === 'produzione') {
            const statiSchedaAdesione: string[] = this.generalConfig?.adesione?.stati_scheda_adesione ?? [];
            if (statiSchedaAdesione.length > 0) {
                return !statiSchedaAdesione.includes(this.adesione?.stato);
            }
        }
        const currentMainIdx = this._currentMainStepIndex();
        if (currentMainIdx === -1) return false;
        const minIdx = this._minMainStepIndexForSection(section);
        return minIdx !== -1 && currentMainIdx < minIdx;
    }

    /**
     * Vero se la sezione corrisponde a una fase PASSATA dell'adesione:
     * lo step corrente dell'adesione e' successivo all'ultimo step del
     * main step_wizard che include la sezione in `sezioni_attive`.
     * Esempio: sezione Collaudo quando l'adesione e' in produzione.
     */
    private _isSectionPast(section: string): boolean {
        const currentMainIdx = this._currentMainStepIndex();
        if (currentMainIdx === -1) return false;
        const maxIdx = this._maxMainStepIndexForSection(section);
        return maxIdx !== -1 && currentMainIdx > maxIdx;
    }

    private _currentMainStepIndex(): number {
        if (!this.adesione?.stato || !this.stepWizard?.length) return -1;
        return this.stepWizard.findIndex(s => s.stati_adesione?.includes(this.adesione.stato));
    }

    private _minMainStepIndexForSection(section: string): number {
        let min = -1;
        for (let i = 0; i < (this.stepWizard?.length || 0); i++) {
            if (this.stepWizard[i].sezioni_attive?.includes(section)) {
                if (min === -1 || i < min) min = i;
            }
        }
        return min;
    }

    private _maxMainStepIndexForSection(section: string): number {
        let max = -1;
        for (let i = 0; i < (this.stepWizard?.length || 0); i++) {
            if (this.stepWizard[i].sezioni_attive?.includes(section)) {
                if (i > max) max = i;
            }
        }
        return max;
    }

    /**
     * Ritorna stato semantico + chiave i18n del messaggio di supporto per
     * ogni sezione accordion del wizard. Se non c'e' hint applicabile
     * ritorna null.
     *
     * Priorita' di valutazione (coerente con lo stato dell'adesione):
     * 1. `past` → sezione di una fase gia' conclusa. Usa stile `completed`
     *    con chiave i18n dedicata (fase passata, nessuna azione possibile).
     * 2. `future` → sezione non ancora raggiungibile (stato precedente alla
     *    fase). Usa stile `disabled`.
     * 3. `completed` → sezione attiva e completata (check-dati ok o non
     *    applicabile).
     * 4. `action` → sezione attiva ma con dati mancanti o da sistemare.
     * 5. `null` → nessun hint (sezione non attiva ne' rilevante).
     */
    getSectionHint(section: string): { state: 'disabled' | 'completed' | 'action'; key: string } | null {
        // 1. Past: la fase della sezione e' gia' conclusa
        if (this._isSectionPast(section)) {
            return { state: 'completed', key: 'APP.ADESIONI.LABEL.HintSectionPast' };
        }

        // 2. Future: sezione non ancora disponibile
        if (this._isSectionFuture(section)) {
            let key: string;
            switch (section) {
                case 'referenti':
                    key = 'APP.ADESIONI.LABEL.HintSectionReferentiDisabled'; break;
                case 'produzione':
                    key = 'APP.ADESIONI.LABEL.HintSectionProduzioneDisabled'; break;
                case 'collaudo':
                case 'info_generali':
                default:
                    key = 'APP.ADESIONI.LABEL.HintSectionCollaudoDisabled'; break;
            }
            return { state: 'disabled', key };
        }

        // 3. Completed: fase corrente e configurazione OK
        if (this.isSectionCompleted(section)) {
            return { state: 'completed', key: 'APP.ADESIONI.LABEL.HintSectionCompleted' };
        }

        // 4. Active ma richiede intervento
        if (this.isSectionActive(section)) {
            return { state: 'action', key: 'APP.ADESIONI.LABEL.HintSectionActionRequired' };
        }

        return null;
    }

    /**
     * Scarica i disclaimer dinamici dall'endpoint `/adesioni/{id}/disclaimers`
     * passando il `language_code` corrente. La risposta viene normalizzata in un
     * array di stringhe markdown per essere renderizzate con `<markdown>`.
     */
    private _loadDisclaimers(): void {
        if (!this.id) return;
        if (this.disclaimersUseMock) {
            this.disclaimers = [...this.DISCLAIMERS_MOCK];
            this.disclaimersLoading = false;
            return;
        }
        const languageCode = this.translate.currentLang || this.translate.getDefaultLang() || 'it';
        this.disclaimersLoading = true;
        this.apiService.getDetails(this.model, this.id, 'disclaimers', { params: { language_code: languageCode } }).subscribe({
            next: (response: any) => {
                this.disclaimers = this._normalizeDisclaimers(response);
                this.disclaimersLoading = false;
            },
            error: () => {
                // Fallback silente: assenza di disclaimer non è un errore bloccante
                this.disclaimers = [];
                this.disclaimersLoading = false;
            }
        });
    }

    private _normalizeDisclaimers(response: any): AdesioneDisclaimer[] {
        if (!Array.isArray(response)) return [];
        return response
            .filter((d: any) => d && typeof d.disclaimer === 'string' && d.disclaimer.length > 0)
            .map((d: any) => ({
                disclaimer: d.disclaimer,
                contesto: d.contesto,
                severity: d.severity,
                links: Array.isArray(d.links) ? d.links : [],
                profilo: d.profilo
            }));
    }

    getDisclaimerAlertClass(severity?: DisclaimerSeverity): string {
        switch (severity) {
            case 'ERROR': return 'alert-danger';
            case 'WARNING': return 'alert-warning';
            case 'INFO':
            default: return 'alert-info';
        }
    }

    getDisclaimerIconClass(severity?: DisclaimerSeverity): string {
        switch (severity) {
            case 'ERROR': return 'bi bi-x-circle';
            case 'WARNING': return 'bi bi-exclamation-triangle';
            case 'INFO':
            default: return 'bi bi-info-circle';
        }
    }

    getDisclaimerLinkHref(link: AdesioneDisclaimerLink): string {
        return link?.url || link?.href || '';
    }

    getDisclaimerLinkLabel(link: AdesioneDisclaimerLink): string {
        return link?.label || link?.title || link?.text || link?.url || link?.href || '';
    }

    getDisclaimersByContesto(contesto: DisclaimerContesto): AdesioneDisclaimer[] {
        return (this.disclaimers || []).filter(d => (d.contesto || 'generale') === contesto);
    }

    // I disclaimer con `profilo` sono destinati al rendering sotto la
    // specifica riga client (matching per profilo) e NON devono comparire
    // anche nel banner generale della sezione di contesto.
    get disclaimersGenerali(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('generale').filter(d => !d.profilo);
    }

    get disclaimersCollaudo(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('collaudo').filter(d => !d.profilo);
    }

    get disclaimersProduzione(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('produzione').filter(d => !d.profilo);
    }

    // Usati come @Input delle liste client: solo i disclaimer con `profilo`
    // per contesto = ambiente; la lista filtrera' poi per profilo del client.
    get clientDisclaimersCollaudo(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('collaudo').filter(d => !!d.profilo);
    }

    get clientDisclaimersProduzione(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('produzione').filter(d => !!d.profilo);
    }
}
