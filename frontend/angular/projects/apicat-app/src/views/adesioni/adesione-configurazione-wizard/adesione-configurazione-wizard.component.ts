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
import { Component, ElementRef, HostBinding, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { MarkdownModule } from 'ngx-markdown';

import { ConfigService, COMPONENTS_IMPORTS, EventsManagerService, Tools, EventType, FieldClass, MenuAction, YesnoDialogBsComponent } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MapperPipe } from '@app/lib/pipes/mapper.pipe';
import { WorkflowComponent } from '@app/components/workflow/workflow.component';
import { MonitorDropdwnComponent } from '@app/views/servizi/components/monitor-dropdown/monitor-dropdown.component';
import { ApiCustomPropertiesComponent } from '@app/components/api-custom-properties/api-custom-properties.component';
import { ErrorViewComponent } from '@app/components/error-view/error-view.component';
import { ErrorViewCardComponent } from '@app/components/error-view-card/error-view-card.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { NavigationService } from '@app/services/navigation.service';
import { UtilService } from '@app/services/utils.service';

import { ModalAddReferentComponent } from './modal-add-referent/modal-add-referent.component';
import { ReferenteAddFormComponent } from './referente-add-form/referente-add-form.component';
import { AdesioneListaClientsComponent } from './adesione-lista-clients/adesione-lista-clients.component';
import { AdesioneDialogMockPanelComponent } from './adesione-dialog-mock-panel/adesione-dialog-mock-panel.component';
import { AdesioneListaErogazioniComponent } from './adesione-lista-erogazioni/adesione-lista-erogazioni.component';
import { AdesioneFormComponent } from './adesione-form/adesione-form.component';
import { AdesioneStepBarComponent, StepBarVariant, StepWizardItem } from '../adesione-step-bar/adesione-step-bar.component';
import { AdesioneFasiBarComponent } from '../adesione-fasi-bar/adesione-fasi-bar.component';
import { AdesioneSubstepperComponent } from '../adesione-substepper/adesione-substepper.component';
import { StatoChipComponent } from '@app/components/vetrina';

import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';

import { forkJoin, interval, Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { Grant, RightsEnum } from '@app/model/grant';
import { AmbienteEnum } from '@app/model/ambienteEnum';
import { ReferentView, Referent } from '../adesione-view/adesione-view.component';

import * as _ from 'lodash';
import moment from 'moment/moment';
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
    /** Quando valorizzato, lega il disclaimer a un gruppo di
     *  custom properties (`nome_gruppo`). In tal caso il disclaimer
     *  viene reso accanto al gruppo nel wizard e NON nel banner
     *  ambientale del substepper. Richiede comunque `contesto`
     *  ('collaudo' | 'produzione'). */
    nome_gruppo?: string;
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
        ErrorViewCardComponent,
        AdesioneListaClientsComponent,
        AdesioneListaErogazioniComponent,
        AdesioneDialogMockPanelComponent,
        AdesioneFormComponent,
        AdesioneStepBarComponent,
        AdesioneFasiBarComponent,
        AdesioneSubstepperComponent,
        StatoChipComponent,
        ReferenteAddFormComponent,
        NotificationBarComponent,
        WorkflowComponent
    ]
})
export class AdesioneConfigurazioneWizardComponent implements OnInit, OnDestroy {

    static readonly Name = 'AdesioneConfigurazioneWizardComponent';
    readonly model: string = 'adesioni';

    /** Riferimenti ai listener registrati su `EventsManagerService`,
        deregistrati in `ngOnDestroy` per evitare leak (closure stale
        sul vecchio `this.id` ad ogni nuova navigazione del wizard). */
    private _wizardCheckUpdateListener?: (action: any) => void;
    private _profileUpdateListener?: (action: any) => void;

    /** Polling stato adesione durante l'auto-configurazione: se
     *  l'adesione e` in `in_configurazione_automatica_*` il batch
     *  GovWay puo` completare in pochi secondi. Polling breve con
     *  GET /adesioni/:id; se lo stato cambia, ricarica l'adesione
     *  completa e ferma il polling. Vedi `_maybeStartAutoConfigPolling`. */
    private static readonly _AUTO_CONFIG_STATES: string[] = [
        'in_configurazione_automatica_collaudo',
        'in_configurazione_automatica_produzione'
    ];
    private static readonly _AUTO_CONFIG_POLL_INTERVAL_MS = 3000;
    private _autoConfigPollingSub?: Subscription;
    /** Esposto al template per mostrare il dot pulsante affianco al
     *  chip stato durante il polling. */
    _pollingAutoConfig: boolean = false;

    // Sotto flag wizard_new_layout, attiva la host class `lnk-wizard` che
    // scopa i design-token Link.it definiti nella SCSS del componente.
    @HostBinding('class.lnk-wizard') get lnkWizardHostClass(): boolean {
        return this.wizardNewLayout;
    }

    @ViewChild("myScroll") myScroll!: ElementRef;

    /**
     * Issue 254 NEW LAYOUT (rev. 4.6): riferimento al `<app-adesione-form>`
     * renderizzato dentro `newLayoutFaseInfoTpl` (PhaseSection
     * "Informazioni generali"). Usato dal bottone "Modifica" del
     * `lnk-phase-section-hd` per togglare lato form l'edit mode esterno.
     */
    @ViewChild('infoFormRef') infoFormRef?: AdesioneFormComponent;
    
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
    /** Ruoli referente dell'utente esposti da `GET /profilo/ruoli`
        (es. ['referente_servizio', 'referente_dominio']). Usati da
        `canChangeStatoMapper` per abilitare il cambio stato. */
    _ruoliReferenteProfilo: string[] = [];
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

    /**
     * Voci appese IN FONDO al menu del `app-monitor-dropdown` (dopo
     * le voci interne del componente). Issue #212: contiene la voce
     * "Elimina adesione", aggiunta solo per il gestore.
     */
    _bottomActions: MenuAction[] = [];

    private readonly _DELETE_ADESIONE_ACTION = new MenuAction({
        type: 'menu',
        title: 'APP.TOOLTIP.DeleteAdesione',
        icon: 'trash',
        subTitle: '',
        action: 'delete_adesione',
        enabled: true,
        danger: true
    });

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
     * Override runtime del flag `wizard_new_layout`. Quando null si usa il
     * valore del config; quando boolean ha priorita' (toggle debug).
     */
    wizardNewLayoutOverride: boolean | null = null;

    /**
     * Flag frontend `wizard_new_layout` letto da `adesioni-config.json`.
     * Quando true il template del wizard rende la "section container"
     * con il nuovo layout (header esteso, banner, step-bar a 3 fasi,
     * card-fase, sub-stepper verticale). Quando false (default) si
     * mantiene il rendering classico — i due rami convivono per
     * permettere lo sviluppo incrementale senza regressioni.
     */
    get wizardNewLayout(): boolean {
        if (this.wizardNewLayoutOverride !== null) {
            return this.wizardNewLayoutOverride;
        }
        return !!this.config?.wizard_new_layout;
    }

    toggleWizardNewLayout(): void {
        const current = this.wizardNewLayout;
        this.wizardNewLayoutOverride = !current;
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4.8): fase attualmente selezionata dalla
     * step-bar 3-fasi (cliccabile come una tab). Il valore e` il `code`
     * dello step nel `stepWizard` config (`info_generali`, `collaudo`,
     * `produzione`) — coerente con la sorgente dati.
     *
     * Il body sotto la step-bar mostra il contenuto SOLO della fase
     * selezionata.
     * Inizializzata al primo carico sulla fase corrente del workflow
     * (vedi `_initSelectedFase` in `loadAdesione`).
     */
    _selectedFase: string = 'info_generali';

    /**
     * Inizializza/aggiorna `_selectedFase` allo step corrente del
     * `stepWizard` config: cerca lo step il cui array `stati_adesione`
     * contiene lo stato corrente dell'adesione. Fallback: primo step
     * (`info_generali`).
     */
    _initSelectedFase(): void {
        if (!this.stepWizard?.length) {
            this._selectedFase = 'info_generali';
            return;
        }
        const currentState = this.adesione?.stato;
        if (currentState) {
            // Regola speciale: `pubblicato_collaudo` e` terminale di
            // Collaudo ("configurato") ed e` anche il primo sub-step
            // ("in_compilazione") di Produzione. Selezioniamo
            // visivamente FASE 2 senza toccare `selectedStepCode` /
            // `activeSections` (resta il comportamento naturale
            // dello step-bar).
            if (currentState === 'pubblicato_collaudo' && this.stepWizard.some(s => s.code === 'collaudo')) {
                this._selectedFase = 'collaudo';
                return;
            }
            const found = this.stepWizard.find(s => s.stati_adesione?.includes(currentState));
            if (found) {
                this._selectedFase = found.code;
                return;
            }
        }
        this._selectedFase = this.stepWizard[0].code;
    }

    /**
     * Set della fase visualizzata. Triggerato dal click sulla
     * `<app-adesione-fasi-bar>`. Tutte le 3 fasi sono cliccabili (anche
     * `pending` delle fasi future), per poter visionare in anteprima
     * cosa contiene.
     */
    selectFase(faseCode: string): void {
        this._selectedFase = faseCode;
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4.3): override manuale di apertura
     * dei sub-step della timeline (collaudo / produzione). Chiave:
     * `${section}-${code}`. Se assente, vale il default basato sullo stato:
     * `active` -> aperto, `completed`/`locked` -> chiuso.
     */
    private _substepUserToggles = new Map<string, boolean>();

    /**
     * Apertura corrente di uno sub-step della timeline.
     *
     * Regole funzionali (rev. 4.3, da feedback utente 2026-05-05):
     *  - Step 1 `in_compilazione` ospita SEMPRE la lista client/endpoint:
     *    chiuso quando `completed`, aperto quando `active`. L'utente puo`
     *    sempre riaprirlo (es. per consultare i dati a workflow avanzato).
     *  - Step 2/3/4 (in_approvazione, in_configurazione, configurato):
     *    quando `active` mostrano "in attesa intervento del gestore" e
     *    sono aperti; quando `completed` chiusi; quando `locked` chiusi.
     */
    isSubstepOpen(section: string, sub: { code: string; state: string }): boolean {
        const key = `${section}-${sub.code}`;
        if (this._substepUserToggles.has(key)) {
            return this._substepUserToggles.get(key)!;
        }
        return sub.state === 'active';
    }

    /** Solo gli step `active` o `completed` sono collassabili (locked no). */
    isSubstepCollapsible(sub: { state: string }): boolean {
        return sub.state === 'active' || sub.state === 'completed';
    }

    /**
     * Toggla l'apertura di uno sub-step della timeline. Usato dalla riga
     * cliccabile e dal chevron. Effetto solo se collassabile.
     */
    toggleSubstep(section: string, sub: { code: string; state: string }): void {
        if (!this.isSubstepCollapsible(sub)) { return; }
        const key = `${section}-${sub.code}`;
        const current = this.isSubstepOpen(section, sub);
        this._substepUserToggles.set(key, !current);
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4.5 + 4.22 + 4.36): stato di apertura
     * dei 3 sub-gruppi referenti nel pannello FASE 01 (adesione /
     * servizio / dominio). Default: tutti chiusi (rev. 4.36) —
     * feedback utente, anche "Referenti adesione" parte chiuso per
     * uniformare il pannello e ridurre lo scroll iniziale; l'utente
     * apre on-demand cliccando l'header.
     */
    _referentGroupOpen: { adesione: boolean; servizio: boolean; dominio: boolean } = {
        adesione: false,
        servizio: false,
        dominio: false,
    };

    isReferentGroupOpen(key: 'adesione' | 'servizio' | 'dominio'): boolean {
        return !!this._referentGroupOpen[key];
    }

    toggleReferentGroup(key: 'adesione' | 'servizio' | 'dominio'): void {
        this._referentGroupOpen[key] = !this._referentGroupOpen[key];
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4.7): stato di apertura delle 2
     * PhaseSection di FASE 01 (Informazioni generali / Referenti).
     * Default entrambe aperte (coerente col design-code
     * `defaultOpen=true` di PhaseSection).
     */
    _phaseSectionOpen: { info_generali: boolean; referenti: boolean } = {
        info_generali: true,
        referenti: true,
    };

    isPhaseSectionOpen(key: 'info_generali' | 'referenti'): boolean {
        return !!this._phaseSectionOpen[key];
    }

    togglePhaseSection(key: 'info_generali' | 'referenti'): void {
        this._phaseSectionOpen[key] = !this._phaseSectionOpen[key];
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4): iniziali del referente per
     * l'avatar di `.approval-card` (es. "Jannik Sinner" -> "JS").
     *
     * Struttura dati (vedi `loadReferents` + `interface Referent` in
     * `adesione-view.component.ts`):
     *   referent = { id, source: { utente: { nome, cognome, ... }, tipo, ... } }
     *
     * Robusto a strutture parziali / null.
     */
    getReferentInitials(referent: any): string {
        const utente = referent?.source?.utente || referent?.utente || referent?.source || referent || {};
        const nome: string = (utente.nome || '').trim();
        const cognome: string = (utente.cognome || '').trim();
        const a = nome ? nome[0] : '';
        const b = cognome ? cognome[0] : '';
        const out = (a + b).toUpperCase();
        if (out) { return out; }
        // fallback: due lettere dall'email aziendale o dallo username
        const email: string = (utente.email_aziendale || utente.email || utente.username || '').trim();
        return email.slice(0, 2).toUpperCase();
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4): nome completo del referente
     * (`utente.nome utente.cognome`). Robusto a strutture parziali.
     */
    getReferentName(referent: any): string {
        const utente = referent?.source?.utente || referent?.utente || referent?.source || referent || {};
        const nome: string = (utente.nome || '').trim();
        const cognome: string = (utente.cognome || '').trim();
        const full = `${nome} ${cognome}`.trim();
        return full || (utente.email_aziendale || utente.email || utente.username || '');
    }

    getReferentSub(referent: any): string {
        const utente = referent?.source?.utente || referent?.utente || referent?.source || referent || {};
        const orgNames = (utente?.organizzazioni || [])
            .map((o: any) => o?.organizzazione?.nome)
            .filter(Boolean);
        if (orgNames.length > 0) {
            return orgNames.join(', ');
        }
        return utente?.organizzazione?.nome || utente?.email_aziendale || utente?.email || '';
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
            disclaimer: '## Certificati App2App\n\L\'ente mette a disposizione l\'infrastruttura PKI per l\'emissione di certificati su CA privata. Chi gestisce le chiavi private e si occupa dell\'installazione può seguire la guida al rilascio [link](https://www.dominio.it/Guida-rilascio-certificati.pdf), che illustra i passi necessari per la generazione del nuovo certificato. Per assistenza scrivere a email@dominio.it.\n\n### Common Name\n\nIl Common Name del certificato deve seguire il formato:\n\nEnteRichiedente_Progetto_PDND_COLLAUDO — per l\'ambiente di collaudo\n\nEnteRichiedente_Progetto_PDND — per la produzione\n\nAd esempio: Ente_LibriGratis_PDND_COLLAUDO / Ente_LibriGratis_PDND\n\n### Caricamento\n\nUna volta ottenuto il certificato, caricare la parte pubblica nell\'apposita sezione. Se si intende riutilizzare un certificato già configurato, selezionarlo dalla lista.',
            links: [
                { label: 'Documentazione', url: 'https://www.dominio.it/it/documentazione' }
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
            disclaimer: '## Certificato mTLS\n\L\'ente mette a disposizione l\'infrastruttura PKI per l\'emissione di certificati su CA privata. Chi gestisce le chiavi private e si occupa dell\'installazione può seguire la guida al rilascio (<a href="https://www.dominio.it//Guida-rilascio-certificati.pdf" target="_blank">Scarica</a>), che illustra i passi necessari per la generazione del nuovo certificato. Per assistenza scrivere a ra.pki@regione.toscana.it.\n\n### Common Name\n\nIl Common Name del certificato deve seguire il formato:\n\n- `EnteRichiedente_Progetto_PDND_COLLAUDO` — per l\'ambiente di collaudo\n\n- `EnteRichiedente_Progetto_PDND` — per la produzione\n\nAd esempio: `Ente_LibriGratis_PDND_COLLAUDO` / `Ente_LibriGratis_PDND`\n\n### Caricamento\n\nUna volta ottenuto il certificato, caricare la parte pubblica nell\'apposita sezione. Se si intende riutilizzare un certificato già configurato, selezionarlo dalla lista.'
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
        },
        // Disclaimer per gruppi di custom properties: legati al gruppo
        // via `nome_gruppo`, mostrati accanto al gruppo e NON nel
        // banner ambientale.
        {
            contesto: 'collaudo',
            severity: 'INFO',
            nome_gruppo: 'PDNDCollaudo',
            disclaimer: 'Compila gli identificativi PDND di collaudo prima di richiedere la configurazione.'
        },
        {
            contesto: 'produzione',
            severity: 'WARNING',
            nome_gruppo: 'PDNDProduzione',
            disclaimer: '**Produzione PDND**: i dati saranno usati dall\'authorization server reale. Verificare prima della pubblicazione.'
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
        private readonly ckeckProvider: CkeckProvider,
        private readonly navigationService: NavigationService
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
                // Carichiamo i ruoli referente dell'utente (`/profilo/ruoli`):
                // sono utilizzati da `canChangeStatoMapper` per abilitare il
                // cambio stato a referenti servizio/dominio. Fail-open: se
                // l'endpoint fallisce (es. gestore/coordinatore) usiamo array
                // vuoto e il check ricade sul solo `isGestore()`.
                const _ruoliProfilo: Observable<any> = this.apiService.getList('profilo/ruoli').pipe(
                    catchError(() => of({ ruolo: '', ruoli_referente: [] }))
                );

                const combined = forkJoin([_grant, _configClients, _configErogaz, _apiConfig, _referentiConfig, _ruoliProfilo]);
                combined.subscribe(result => {
                    this.grant = result[0];
                    this.adesioniClientsConfig = result[1];
                    this.adesioniErogazConfig = result[2];
                    this.apiConfig = result[3];
                    this.referentiConfig = result[4];
                    this._ruoliReferenteProfilo = (result[5]?.ruoli_referente as string[]) || [];

                    console.log('grant', this.grant);

                    this.loadAdesione(true);
                });
            }
        });

        // Salvo i riferimenti dei listener per poterli rimuovere in
        // `ngOnDestroy` (vedi `EventsManagerService.off(name, listener)`).
        // Senza unsubscribe, ad ogni navigazione su una nuova adesione
        // resta registrata una closure col vecchio `this.id` e i broadcast
        // successivi generano chiamate parallele a `/configurazioni` su
        // adesioni stale (404 in dev/test con DB rinfrescato).
        this._wizardCheckUpdateListener = (_action: any) => {
            this.loadCheckDati(this.adesione.id_adesione, this.getNextStateWorkflowName());
            this.loadConfigurazioni(AmbienteEnum.Collaudo);
            this.loadConfigurazioni(AmbienteEnum.Produzione);
            this._loadClientsCheck(AmbienteEnum.Collaudo);
            this._loadClientsCheck(AmbienteEnum.Produzione);
        };
        this.eventsManagerService.on(EventType.WIZARD_CHECK_UPDATE, this._wizardCheckUpdateListener);

        this._profileUpdateListener = (_action: any) => {
            this.generalConfig = Tools.Configurazione || null;
            this.updateMapper = Date.now().toString();
        };
        this.eventsManagerService.on(EventType.PROFILE_UPDATE, this._profileUpdateListener);

        // Ricarica i disclaimer quando l'utente cambia lingua nell'interfaccia
        this.translate.onLangChange.subscribe(() => {
            if (this.adesione) {
                this._loadDisclaimers();
            }
        });
    }

    ngOnDestroy(): void {
        if (this._wizardCheckUpdateListener) {
            this.eventsManagerService.off(EventType.WIZARD_CHECK_UPDATE, this._wizardCheckUpdateListener);
            this._wizardCheckUpdateListener = undefined;
        }
        if (this._profileUpdateListener) {
            this.eventsManagerService.off(EventType.PROFILE_UPDATE, this._profileUpdateListener);
            this._profileUpdateListener = undefined;
        }
        this._stopAutoConfigPolling();
    }

    /** Vero se l'adesione e` in uno stato di auto-configurazione e
     *  il batch non ha gia` segnalato un errore (`stato_configurazione_automatica === 'ko'`). */
    private _isAutoConfigInProgress(adesione: any): boolean {
        if (!adesione?.stato) { return false; }
        if (!AdesioneConfigurazioneWizardComponent._AUTO_CONFIG_STATES.includes(adesione.stato)) { return false; }
        if (adesione.stato_configurazione_automatica === 'ko') { return false; }
        return true;
    }

    /** Avvia il polling se l'adesione e` in auto-configurazione e
     *  non e` gia` attivo. Stop automatico quando lo stato cambia,
     *  quando il batch riporta `ko`, o all'unmount del wizard. */
    private _maybeStartAutoConfigPolling(): void {
        if (!this._isAutoConfigInProgress(this.adesione)) {
            this._stopAutoConfigPolling();
            return;
        }
        if (this._autoConfigPollingSub) { return; }
        const startStato = this.adesione.stato;
        this._pollingAutoConfig = true;
        this._autoConfigPollingSub = interval(AdesioneConfigurazioneWizardComponent._AUTO_CONFIG_POLL_INTERVAL_MS).pipe(
            switchMap(() => this.apiService.getDetails(this.model, this.id))
        ).subscribe({
            next: (response: any) => {
                const stateChanged = response?.stato && response.stato !== startStato;
                const isKo = response?.stato_configurazione_automatica === 'ko';
                if (stateChanged || isKo) {
                    this._stopAutoConfigPolling();
                    this.loadAdesione(false);
                }
            },
            error: () => {
                // 5xx/timeout transitori non interrompono il polling:
                // l'azione batch potrebbe essere ancora in corso.
            }
        });
    }

    private _stopAutoConfigPolling(): void {
        if (this._autoConfigPollingSub) {
            this._autoConfigPollingSub.unsubscribe();
            this._autoConfigPollingSub = undefined;
        }
        this._pollingAutoConfig = false;
    }

    _updateOtherActions() {
        const _canJoin = this.authenticationService.canJoin('adesione', this.adesione?.stato);
        const _isGestore = this.authenticationService.isGestore(this.grant?.ruoli);

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

        // Voci "in fondo" del dropdown: l'eliminazione adesione e'
        // sempre l'ultima voce e visibile solo per il gestore.
        // Divider di separazione dalle voci interne del componente.
        this._bottomActions = _isGestore
            ? [
                new MenuAction({ type: 'divider', enabled: true }),
                { ...this._DELETE_ADESIONE_ACTION }
            ]
            : [];
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
                    this._initSelectedFase();

                    this.loadCheckDati(this.adesione.id_adesione, this.getNextStateWorkflowName());

                    this.id_servizio = this.adesione.servizio.id_servizio;
                    this.loadServizio(this.id_servizio);
                    this.loadConfigurazioni(AmbienteEnum.Collaudo);
                    this.loadConfigurazioni(AmbienteEnum.Produzione);
                    this._loadClientsCheck(AmbienteEnum.Collaudo);
                    this._loadClientsCheck(AmbienteEnum.Produzione);
                    this.loadReferents();

                    this._initBreadcrumb();
                    this._updateOtherActions();

                    this.returnWeb = this.authenticationService.canJoin('adesione', this.adesione?.stato);

                    this.spin = false;

                    this.isEdit = this.canEditMapper();

                    this._maybeStartAutoConfigPolling();
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
        const _statoPrecedente: boolean = false;
        const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', this.grant?.ruoli);
        const _statiUlteriori: boolean = false;
        return (_statoPrecedente || _statoSuccessivo || _statiUlteriori);
    }

    /** Stato "archiviato" (riprodotto dal pattern di `ui-workflow`).
     *  Usato come destinazione del bottone Archivia nel substepper. */
    readonly _statoArchiviato = { nome: 'archiviato', ruoli_abilitati: [] };

    /**
     * Entry `cambi_stato[stato_attuale]` raw dal workflow config.
     * Usato dal substepper per renderizzare la lista di pulsanti
     * di cambio stato (stato_precedente / stato_successivo /
     * stati_ulteriori) sui sub-step attivi diversi da "in_compilazione".
     * Ritorna null se l'adesione e` archiviata o il workflow non
     * contiene un'entry per lo stato corrente.
     */
    getCambioStatoEntry(): any {
        if (!this.adesione) { return null; }
        const stato = this.adesione.stato;
        if (stato === Tools.StatoAdesione.ARCHIVIATO.Code) { return null; }
        const workflow = Tools.Configurazione?.adesione.workflow || null;
        if (!workflow?.cambi_stato) { return null; }
        const idx = workflow.cambi_stato.findIndex((it: any) => it.stato_attuale === stato);
        return (idx === -1) ? null : workflow.cambi_stato[idx];
    }

    /** Ruoli combinati: grant per-adesione + ruoli_referente del
     *  profilo. Allineato al pattern di `canEditMapper`. */
    private _combinedRuoli(): string[] {
        return [
            ...(this.grant?.ruoli || []),
            ...(this._ruoliReferenteProfilo || [])
        ];
    }

    /** Abilitazione di un'azione di cambio stato (mirror del mapper
     *  di `ui-workflow._isActionEnabledMapper`). */
    _isWorkflowActionEnabled = (type: string, statusName: string = ''): boolean => {
        if (!this.adesione) { return false; }
        // Vincolo: una adesione non puo` transizionare verso uno stato
        // di produzione se il servizio non e` `pubblicato_produzione`.
        const targetName = statusName || this.getCambioStatoEntry()?.stato_successivo?.nome || '';
        if (this._isProduzioneBloccata() && this._isStatoProduzione(targetName)) {
            return false;
        }
        return this.authenticationService.canChangeStatus(
            'adesione',
            this.adesione.stato,
            type,
            this._combinedRuoli(),
            statusName
        );
    }

    /** Vero quando l'adesione non puo` ancora andare in produzione
     *  perche` il servizio non e` `pubblicato_produzione`. Usato
     *  per disabilitare FASE 3 nella step-bar e per bloccare le
     *  transizioni workflow verso stati produzione. */
    _isProduzioneBloccata(): boolean {
        return this.adesione?.servizio?.stato !== 'pubblicato_produzione';
    }

    /** True se il nome stato adesione e` di fase produzione. */
    private _isStatoProduzione(statoNome: string): boolean {
        return !!statoNome && statoNome.includes('produzione');
    }

    /** Codici delle fasi da disabilitare nella `<app-adesione-fasi-bar>`. */
    getDisabledFasiCodes(): string[] {
        return this._isProduzioneBloccata() ? ['produzione'] : [];
    }

    /** Abilitazione dell'azione "Archivia". */
    _canArchiviareAdesione = (): boolean => {
        if (!this.adesione) { return false; }
        return this.authenticationService.canArchiviare(
            'adesione',
            this.adesione.stato,
            this._combinedRuoli()
        );
    }

    /** Vero se almeno una azione di cambio stato e` abilitata per
     *  lo stato corrente. Pilota la visibilita` del pannello azioni
     *  nel substepper. Considera solo `stato_successivo` e
     *  `stati_ulteriori` (stato_precedente/archivia non mostrati
     *  inline nel substepper). */
    _hasAnyWorkflowAction(): boolean {
        const entry = this.getCambioStatoEntry();
        if (!entry) { return false; }
        if (entry.stato_successivo && this._isWorkflowActionEnabled('stato_successivo')) { return true; }
        if (entry.stati_ulteriori?.length) {
            for (const s of entry.stati_ulteriori) {
                if (this._isWorkflowActionEnabled('stati_ulteriori', s.nome)) { return true; }
            }
        }
        return false;
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

    // ------------------------------------------------------------------
    // Helpers per il nuovo header esteso (Issue 254 NEW LAYOUT)
    // ------------------------------------------------------------------

    /** Solo nome servizio (senza versione) per il titolo grande dell'header. */
    get headerTitle(): string {
        return this.adesione?.servizio?.nome || this.id || '';
    }

    /** Stringa "v.<versione>" se presente, vuota altrimenti. */
    get headerVersion(): string {
        const v = this.adesione?.servizio?.versione;
        return v ? `v.${v}` : '';
    }

    /** "Aggiornato N minuti fa" basato su `data_ultimo_aggiornamento`. */
    get headerUpdatedAt(): string {
        const ts = this.adesione?.data_ultimo_aggiornamento;
        if (!ts) { return ''; }
        const m = moment(ts);
        if (!m.isValid()) { return ''; }
        return this.translate.instant('APP.LABEL.UpdatedRelative', { time: m.fromNow() });
    }

    /**
     * Lista dei nomi dei referenti "principali" dell'adesione (tipo
     * `referente`). Se nessuno, fallback su `utente_richiedente`.
     */
    get headerOwnerNames(): string[] {
        const fullName = (u: any): string => `${u?.nome || ''} ${u?.cognome || ''}`.trim();
        const principali = (this.referents || [])
            .filter((r: any) => r?.source?.tipo === 'referente')
            .map((r: any) => fullName(r?.source?.utente))
            .filter((n: string) => !!n);
        if (principali.length > 0) {
            this._headerOwnerIsRichiedente = false;
            return principali;
        }
        // `utente_richiedente` e' tipizzato come `string` nel model
        // generato da OpenAPI ma a runtime e' un oggetto User completo
        // (nome/cognome/email/...) — vedi `adesione-form` e
        // `adesione-details`. Quindi compongo nome+cognome qui.
        const richiedente: any = this.adesione?.utente_richiedente;
        if (richiedente && typeof richiedente === 'object') {
            const full = fullName(richiedente);
            if (full) {
                this._headerOwnerIsRichiedente = true;
                return [full];
            }
        } else if (typeof richiedente === 'string') {
            this._headerOwnerIsRichiedente = true;
            return [richiedente];
        }
        this._headerOwnerIsRichiedente = false;
        return [];
    }

    /** True quando `headerOwnerNames` ha fatto fallback su
     *  `utente_richiedente` (nessun referente di tipo `referente`):
     *  la label nel meta-header diventa "Richiedente" invece di
     *  "Referente". */
    _headerOwnerIsRichiedente: boolean = false;

    get _headerOwnerLabelKey(): string {
        if (this._headerOwnerIsRichiedente) { return 'APP.LABEL.Richiedente'; }
        return this.headerOwnerNames.length > 1 ? 'APP.LABEL.OwnerPlural' : 'APP.LABEL.Owner';
    }

    /** Naviga alla vetrina pubblica del servizio
     *  (`/servizi/:id_servizio/view`, read-only). Stessa scelta di
     *  `adesione-view.onGoToService`: la rotta `/view` e`
     *  accessibile anche a chi non ha grant sul servizio,
     *  mentre `/servizi/:id` (gestione) reindirizza a `gruppi`
     *  per utenti privi di ruolo. */
    onGoToService(event?: MouseEvent): void {
        const idServizio = this.adesione?.servizio?.id_servizio;
        if (!idServizio) { return; }
        const idAdesione = this.adesione?.id_adesione;
        const queryParams = idAdesione
            ? { fromAdesione: idAdesione, fromAdesioneMode: 'wizard' }
            : undefined;
        this.navigationService.navigateWithEvent(event, ['/servizi', idServizio, 'view'], queryParams);
    }

    /** Organizzazione del soggetto dell'adesione (stessa fonte usata
     * dal breadcrumb). */
    get headerAdesioneOrganization(): string {
        return this.adesione?.soggetto?.organizzazione?.nome || '';
    }

    /** Chiavi delle 3 fasi macro del nuovo layout, tipizzate per il template. */
    readonly faseKeys: ('info' | 'collaudo' | 'produzione')[] = ['info', 'collaudo', 'produzione'];

    // Issue 254 NEW LAYOUT (rev. 4.16): rimosso `apiDocLink` getter
    // (era hardcoded a `/servizi/{id_servizio}`). I link del banner
    // stato sono ora ricavati direttamente da `item.links` del
    // disclaimer (vedi `bannerStatoNewTpl` nel template).

    // ------------------------------------------------------------------
    // Step-bar 3 fasi (Issue 254 NEW LAYOUT)
    // ------------------------------------------------------------------

    /**
     * Stato della "fase macro" del nuovo layout:
     * - `completed`: tutte le sezioni della fase risultano complete;
     * - `active`: lo stato corrente dell'adesione vive in questa fase;
     * - `pending`: la fase non e' ancora stata raggiunta.
     *
     * Mappa al runtime esistente: `info` aggrega `info_generali +
     * referenti`, `collaudo` e `produzione` rispondono al sezione
     * omonima.
     */
    getFaseStatus(fase: 'info' | 'collaudo' | 'produzione'): 'completed' | 'active' | 'pending' {
        if (fase === 'info') {
            const infoOk = this.isSectionCompleted('info_generali') && this.isSectionCompleted('referenti');
            if (infoOk) { return 'completed'; }
            // "Fase passata": adesione in una fase successiva del workflow
            // (raro per FASE 01, ma normale per Collaudo quando l'adesione
            // e` in Produzione). Vedi `_isSectionPast()` per la regola.
            if (this._isSectionPast('info_generali') && this._isSectionPast('referenti')) {
                return 'completed';
            }
            return this.isSectionActive('info_generali') || this.isSectionActive('referenti') ? 'active' : 'pending';
        }
        // Collaudo/Produzione: una fase e` "conclusa" SOLO quando possiamo
        // PROVARE che il workflow ha raggiunto/superato l'ultimo sub-step
        // interno (es. `pubblicato_collaudo` per collaudo). Stati come
        // `richiesto_*`, `autorizzato_*`, `in_configurazione_*` hanno i
        // dati gia` completi ma richiedono azione esterna
        // (gestore/responsabile) -> chip "Azione richiesta", non "conclusa".
        //
        // Implementazione strict (no fallback true difensivo): se non
        // possiamo verificare il workflow (config mancante, stato non
        // mappato in wfStati), `workflowReachedFinal` resta false e la
        // fase NON viene marcata "completed" — meglio mostrare "active"
        // che mentire all'utente.
        // Fase conclusa quando il workflow ha raggiunto/superato l'ultimo
        // sub-step della sezione (verifica strict via wfStati) oppure quando
        // la step-bar principale segnala la sezione come passata (fallback
        // per wfStati non riconosciuti, es. adesione in produzione e sezione
        // collaudo storica). Indipendente dal check-dati del next state, che
        // potrebbe risultare KO per transizioni successive (es. archiviazione)
        // non piu` rilevanti per la fase.
        if (this._workflowReachedSectionFinal(fase) || this._isSectionPast(fase)) {
            return 'completed';
        }
        return this.isSectionActive(fase) ? 'active' : 'pending';
    }

    /**
     * Strict variant di `_isInternalStepFinal`: ritorna `true` SOLO
     * quando possiamo verificare che lo stato corrente dell'adesione
     * coincide con o segue l'ultimo `stati_adesione` dell'ultimo
     * sub-step della sezione. Nessun fallback difensivo `true`: se
     * config / stato non sono mappati, ritorna `false` (la fase NON
     * verra` mostrata come conclusa per default).
     */
    private _workflowReachedSectionFinal(section: 'collaudo' | 'produzione'): boolean {
        const steps = this.getStepWizardSezione(section);
        if (!steps.length) { return false; }
        const currentStato = this.adesione?.stato;
        if (!currentStato) { return false; }

        // Fallback "terminal reached" — non dipende da `workflowStati`:
        // se lo stato corrente coincide con l'ULTIMO stato dell'ultimo
        // sub-step della sezione (es. `pubblicato_produzione` per
        // "configurato" di Produzione) la fase e` conclusa anche se la
        // config remota `adesione.workflow.stati` non riporta lo stato
        // (es. BE non allineato col FE sui nuovi stati).
        const lastStep = steps[steps.length - 1];
        const lastStates = lastStep?.stati_adesione || [];
        const terminalState = lastStates.length > 0 ? lastStates[lastStates.length - 1] : null;
        if (terminalState !== null && currentStato === terminalState) {
            return true;
        }

        const wfStati = this.workflowStati;
        if (!wfStati.length) { return false; }
        const currentIdx = wfStati.indexOf(currentStato);
        if (currentIdx === -1) { return false; }
        let maxStepIdx = -1;
        for (const step of steps) {
            for (const st of step.stati_adesione || []) {
                const idx = wfStati.indexOf(st);
                if (idx > maxStepIdx) { maxStepIdx = idx; }
            }
        }
        if (maxStepIdx === -1) { return false; }
        return currentIdx >= maxStepIdx;
    }

    /**
     * Counter "X/Y" dei sub-step di una sezione (collaudo/produzione)
     * basato sull'ordine dello workflow.
     *
     * Regole (allineate al `_buildItems()` di `<app-adesione-substepper>`):
     *  - "past phase": currentState posizionato nel workflow DOPO tutti
     *    gli stati della sezione -> tutti gli step done (es. Collaudo
     *    quando l'adesione e` gia` in Produzione);
     *  - "terminal reached": currentState e` l'ULTIMO stato dell'ULTIMO
     *    step (es. `pubblicato_collaudo` per Collaudo step `configurato`)
     *    -> tutti gli step done (rev. 4.23);
     *  - altrimenti: count degli step la cui ultima `stati_adesione`
     *    PRECEDE STRETTAMENTE lo stato corrente.
     *
     * Restituisce `null` per sezioni che non hanno step interni.
     */
    getSezioneCounter(section: string): { done: number; total: number } | null {
        if (section !== 'collaudo' && section !== 'produzione') { return null; }
        const steps = this.getStepWizardSezione(section);
        if (!steps?.length) { return null; }
        const total = steps.length;
        const wfStati = this.workflowStati;
        const currentStato = this.adesione?.stato;
        if (!wfStati?.length || !currentStato) { return { done: 0, total }; }
        const currentIdx = wfStati.indexOf(currentStato);
        if (currentIdx === -1) { return { done: 0, total }; }

        // Past phase: lo stato corrente e` posizionato nel workflow
        // dopo TUTTI gli stati di questa sezione.
        let maxStepStateIdx = -1;
        for (const step of steps) {
            for (const st of step.stati_adesione || []) {
                const idx = wfStati.indexOf(st);
                if (idx > maxStepStateIdx) { maxStepStateIdx = idx; }
            }
        }
        if (maxStepStateIdx !== -1 && currentIdx > maxStepStateIdx) {
            return { done: total, total };
        }

        // Terminal reached: lo stato corrente coincide con l'ultimo
        // `stati_adesione` dell'ultimo step della sezione (e.g.,
        // `pubblicato_collaudo` per "configurato" di Collaudo).
        const lastStep = steps[steps.length - 1];
        const lastStates = lastStep?.stati_adesione || [];
        const terminalState = lastStates.length > 0 ? lastStates[lastStates.length - 1] : null;
        if (terminalState !== null && currentStato === terminalState) {
            return { done: total, total };
        }

        // Caso comune: count step "passati" (ultima `stati_adesione`
        // precedente strettamente lo stato corrente).
        let done = 0;
        for (const step of steps) {
            const indices = (step.stati_adesione || [])
                .map(st => wfStati.indexOf(st))
                .filter(i => i !== -1);
            if (!indices.length) { continue; }
            const lastIdx = Math.max(...indices);
            if (lastIdx < currentIdx) { done++; }
        }
        return { done, total };
    }

    /**
     * Stato dei sub-step di una sezione (collaudo/produzione) per il
     * sub-stepper verticale del nuovo layout. Ogni step e' classificato:
     * - `completed`: tutti gli stati associati allo step sono PRECEDENTI
     *   allo stato corrente dell'adesione;
     * - `active`: lo stato corrente cade nel range degli stati dello step;
     * - `locked`: lo step e' futuro rispetto allo stato corrente.
     */
    getSezioneStepStates(section: 'collaudo' | 'produzione'): Array<{
        index: number;
        code: string;
        descrizione: string;
        state: 'completed' | 'active' | 'locked';
    }> {
        const steps = this.getStepWizardSezione(section);
        if (!steps?.length) { return []; }
        const wfStati = this.workflowStati;
        const currentStato = this.adesione?.stato;
        const currentIdx = (wfStati?.length && currentStato) ? wfStati.indexOf(currentStato) : -1;
        return steps.map((step, i) => {
            const indices = (step.stati_adesione || [])
                .map(st => wfStati.indexOf(st))
                .filter(idx => idx !== -1);
            let state: 'completed' | 'active' | 'locked' = 'locked';
            if (indices.length > 0 && currentIdx !== -1) {
                const lastIdx = Math.max(...indices);
                const firstIdx = Math.min(...indices);
                if (lastIdx < currentIdx) {
                    state = 'completed';
                } else if (currentIdx >= firstIdx && currentIdx <= lastIdx) {
                    state = 'active';
                }
            }
            return { index: i + 1, code: step.code, descrizione: step.descrizione, state };
        });
    }

    /**
     * Stato badge per l'header della card-fase del nuovo layout:
     * - `completed`: verde "Completato";
     * - `action`: rosso "Azione richiesta" (sezione attiva non completata);
     * - `locked`: grigio "Bloccato" (sezione disabilitata o futura);
     * - `null`: nessun badge (sezione attiva senza richieste).
     */
    getSezioneBadge(section: string): 'completed' | 'action' | 'locked' | null {
        if (this.isSectionCompleted(section)) { return 'completed'; }
        if (this.isSectionDisabled(section) || !this.isSectionActive(section)) { return 'locked'; }
        return 'action';
    }

    /** Etichetta numerica "FASE 01/02/03" per le card del nuovo layout. */
    getFaseNumberLabel(fase: 'info' | 'collaudo' | 'produzione'): string {
        switch (fase) {
            case 'info': return '01';
            case 'collaudo': return '02';
            case 'produzione': return '03';
        }
    }

    /** Chiave i18n per il titolo della card-fase. */
    getFaseTitleKey(fase: 'info' | 'collaudo' | 'produzione'): string {
        switch (fase) {
            case 'info': return 'APP.ADESIONI.LABEL.FaseInfoTitle';
            case 'collaudo': return 'APP.ADESIONI.LABEL.FaseCollaudoTitle';
            case 'produzione': return 'APP.ADESIONI.LABEL.FaseProduzioneTitle';
        }
    }

    /** Classe CSS della card banner stato (Issue 254 NEW LAYOUT) per
     * severity. Allineata al sistema esistente `getDisclaimerAlertClass`
     * ma con aspetto card invece che alert. */
    getDisclaimerBannerClass(severity?: DisclaimerSeverity): string {
        switch (severity) {
            case 'ERROR': return 'banner-stato-danger';
            case 'WARNING': return 'banner-stato-warning';
            case 'INFO':
            default: return 'banner-stato-info';
        }
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4): variant class per `.lnk-banner` del
     * design-code in funzione della severity del disclaimer:
     *  - INFO/SUCCESS -> '' (default brand-soft, azzurro);
     *  - WARNING      -> 'is-warn' (warn-soft, giallo);
     *  - ERROR        -> 'is-err' (err-soft, rosso).
     */
    getDisclaimerLnkBannerVariantClass(severity?: DisclaimerSeverity): string {
        switch (severity) {
            case 'ERROR': return 'is-err';
            case 'WARNING': return 'is-warn';
            case 'INFO':
            default: return '';
        }
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
            title = `${title} (${this.adesione.id_logico})`;
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

    /**
     * Vero se l'utente puo' cambiare lo stato dell'adesione via
     * `<ui-workflow>` (azioni del workflow). Oltre al gestore,
     * abilitati i referenti (servizio/dominio, tecnici e non)
     * valutati sui ruoli referente del profilo utente
     * (`GET /profilo/ruoli` → `ruoli_referente`, caricato in init).
     */
    canChangeStatoMapper = (update: string): boolean => {
        if (this.authenticationService.isGestore()) { return true; }
        const referentiRoles = [
            'referente_servizio',
            'referente_tecnico_servizio',
            'referente_dominio',
            'referente_tecnico_dominio'
        ];
        return this._ruoliReferenteProfilo.some((r: string) => referentiRoles.includes(r));
    }

    /**
     * Conferma e cancellazione adesione tramite `DELETE /adesioni/{id}`.
     * Visibile solo al gestore (Issue #212).
     */
    _confirmDeleteAdesione(): void {
        const initialState = {
            title: this.translate.instant('APP.TITLE.Attention'),
            messages: [ this.translate.instant('APP.MESSAGE.AreYouSure') ],
            cancelText: this.translate.instant('APP.BUTTON.Cancel'),
            confirmText: this.translate.instant('APP.BUTTON.Confirm'),
            confirmColor: 'danger'
        };
        const ref: BsModalRef = this.modalService.show(YesnoDialogBsComponent, {
            ignoreBackdropClick: true,
            initialState
        });
        ref.content.onClose.subscribe((response: any) => {
            if (!response) { return; }
            this.apiService.deleteElement(this.model, this.adesione.id_adesione).subscribe({
                next: () => {
                    // Ripristina il contesto di navigazione: se l'utente
                    // e` arrivato dalla lista adesioni di un servizio,
                    // torna a quella; altrimenti alla lista globale.
                    const target = this.serviceBreadcrumbs
                        ? ['/servizi', this.serviceBreadcrumbs.service.id_servizio, this.model]
                        : [this.model];
                    this.router.navigate(target);
                },
                error: (error: any) => {
                    Tools.OnError(error);
                }
            });
        });
    }

    toggleEdit() {
        this.updateMapper = Date.now().toString();
        this.openAccordion(this._findFirstAccordionError() || '', this.isEdit);
        this.isEdit = !this.isEdit;
    }

    /**
     * "Modifica" inline sull'header della card "Informazioni generali"
     * (Issue 254 NEW LAYOUT, mock 2 — rev. 4.6).
     *
     * Comportamento:
     *  - Se siamo nel nuovo layout, deleghiamo al `<app-adesione-form>`
     *    (riferimento via `@ViewChild('infoFormRef')`): chiama il
     *    metodo pubblico `onEdit(null)` che inizializza la form e mette
     *    `isEdit=true`. I campi del form si abilitano. Il bottone esterno
     *    in `lnk-phase-section-hd` cambia testo "Modifica" -> "Annulla"
     *    via getter `isInfoFormEditing`.
     *  - Se non c'e` riferimento al form (legacy / non ancora pronto),
     *    fallback alla logica originale (toggle `this.isEdit` wizard-wide
     *    + apertura accordion `general-info`).
     */
    enterEditModeForInfoGenerali() {
        if (this.infoFormRef && !this.infoFormRef.isEdit) {
            this.infoFormRef.onEdit(null);
            return;
        }
        if (this.infoFormRef && this.infoFormRef.isEdit) {
            // toggle: se gia` editing, esce dall'edit
            this.infoFormRef.onCancelEdit();
            return;
        }
        // Fallback (form non ancora montato): apertura accordion legacy.
        this.openAccordion('general-info', false);
        if (!this.isEdit && this.canEditMapper()) {
            this.isEdit = true;
            this.updateMapper = Date.now().toString();
        }
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4.6): true se il `<app-adesione-form>` di
     * Informazioni generali e` in edit mode (campi abilitati). Pilota il
     * cambio testo del bottone "Modifica" -> "Annulla".
     */
    get isInfoFormEditing(): boolean {
        return !!this.infoFormRef?.isEdit;
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
            // Stato di completezza dei dati: oggettivo, non dipende dal ruolo.
            // Anche un referente che non puo' cambiare stato deve vedere
            // l'alert quando il check-dati BE riporta esito != 'ok'.
            return 0;
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
            // Vedi nota in `getStatusCompleteMapper`: alert oggettivo,
            // indipendente dai permessi di cambio stato.
            return 0;
        }
    }

    isSottotipoCompletedMapper = (update: boolean, environment: string, tipo: string, identificativo: string): boolean => {
        return this.ckeckProvider.isSottotipoCompleted(this.dataStructureResults, environment, tipo, identificativo);
    }

    /**
     * Vero se almeno un gruppo di custom properties della sezione
     * ha dati obbligatori non compilati (icon-toggle rosso nel
     * wizard). Quando true, il sub-step "In compilazione" del
     * substepper viene forzato a `active` anche se lo stato
     * workflow e` gia` oltre, cosi` l'utente puo` tornare a
     * compilare i dati mancanti.
     */
    _hasIncompleteCustomProperties(section: 'collaudo' | 'produzione'): boolean {
        const ambiente = section === 'collaudo' ? AmbienteEnum.Collaudo : AmbienteEnum.Produzione;
        const groups: any[] = this.proprietaCustomFiltered?.[ambiente] || [];
        return groups.some((g: any) =>
            !this.isSottotipoCompletedMapper(false, ambiente, ClassiEnum.CONFIGURAZIONE_GRUPPO, g.nome_gruppo)
        );
    }

    /**
     * Mappa ambiente -> true se almeno un client e` non configurato
     * (popolata da `_loadClientsCheck`). Necessaria perche` il
     * check-dati BE in certi stati (es. `in_configurazione_collaudo`)
     * non segnala il CLIENT come obbligatorio anche quando il
     * gestore ha ancora un client "non configurato" da gestire.
     */
    private _hasNonConfiguredClientsByEnv: { [env: string]: boolean } = {};

    /**
     * Carica i client dell'ambiente per popolare
     * `_hasNonConfiguredClientsByEnv`. Stesso endpoint usato dal
     * componente figlio `<app-adesione-lista-clients>`.
     */
    private _loadClientsCheck(environmentId: string): void {
        if (!this.id) { return; }
        this.apiService.getDetails(this.model, this.id, environmentId + '/client').subscribe({
            next: (response: any) => {
                const associati = response?.content || [];
                const richiesti = this.adesione?.client_richiesti || [];
                const hasNotConfigured = richiesti.some((req: any) => {
                    const found = associati.find((c: any) => c.profilo === req.profilo);
                    return !found || found.stato !== 'configurato';
                });
                this._hasNonConfiguredClientsByEnv[environmentId] = hasNotConfigured;
                this.updateMapper = Date.now().toString();
            },
            error: () => {
                this._hasNonConfiguredClientsByEnv[environmentId] = false;
            }
        });
    }

    /**
     * Vero se la sezione ha client ancora da configurare. Il
     * gestore vede sempre il segnale (puo` intervenire in prima
     * persona). Per altri ruoli il segnale si attiva solo quando
     * il workflow dello stato corrente dichiara
     * `<section>_configurato` come dato obbligatorio per il
     * prossimo cambio stato: significa che senza client
     * configurato la transizione non potra` avvenire, quindi
     * la fase "In compilazione" va marcata rossa.
     */
    _hasIncompleteClients(section: 'collaudo' | 'produzione'): boolean {
        const ambiente = section === 'collaudo' ? AmbienteEnum.Collaudo : AmbienteEnum.Produzione;
        const hasNotConfigured = !!this._hasNonConfiguredClientsByEnv[ambiente];
        if (!hasNotConfigured) { return false; }
        if (this.authenticationService.isGestore(this.grant?.ruoli)) { return true; }
        return this._workflowRequiresClientConfigured(section);
    }

    /**
     * Vero se i `dati_obbligatori` del cambio stato corrente
     * includono `<section>_configurato` (es. `collaudo_configurato`
     * per `section=collaudo`). Indica che il workflow esige il
     * client configurato come precondizione per il prossimo stato.
     */
    private _workflowRequiresClientConfigured(section: 'collaudo' | 'produzione'): boolean {
        const stato = this.adesione?.stato;
        if (!stato) { return false; }
        const mandatory: string[] = this.authenticationService._getClassesMandatory('adesione', '', stato) || [];
        const key = section === 'collaudo' ? 'collaudo_configurato' : 'produzione_configurato';
        return mandatory.includes(key);
    }

    /**
     * Vero se il sub-step e` "naturalmente attivo" — il suo
     * `stati_adesione` contiene lo stato corrente dell'adesione.
     * Usato per evitare di renderizzare CTA workflow duplicati
     * nel sub-step forzato attivo (vedi `forceActiveCodes`).
     */
    _isSubstepNaturallyActive(section: 'collaudo' | 'produzione', code: string): boolean {
        const steps = this.getStepWizardSezione(section);
        const sub = steps.find(s => s.code === code);
        return !!sub?.stati_adesione?.includes(this.adesione?.stato);
    }

    /**
     * Lista di sub-step `code` da forzare a stato `active` nel
     * substepper della sezione. `in_compilazione` viene forzato
     * quando ci sono custom properties obbligatorie incomplete
     * oppure client non ancora configurati.
     */
    getForceActiveSubsteps(section: 'collaudo' | 'produzione'): string[] {
        const needsAttention = this._hasIncompleteCustomProperties(section)
            || this._hasIncompleteClients(section);
        return needsAttention ? ['in_compilazione'] : [];
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

    /**
     * Issue 254 NEW LAYOUT (rev. 4.29): wrapper del legacy
     * `addReferenteModal` che ora apre il pannello inline
     * `<app-referente-add-form>`. Il nome resta per back-compat col
     * template del vecchio layout.
     */
    addReferenteModal(event: any) {
        event?.stopPropagation?.();
        event?.preventDefault?.();
        if (this.wizardNewLayout) {
            this.openInlineAddReferent();
            return;
        }
        // Legacy: dialog
        const initialState = {
            title: 'APP.TITLE.AddReferent',
            id: this.id,
            adesione: this.adesione
        };
        this.modalAddReferentRef = this.modalService.show(ModalAddReferentComponent, {
            ignoreBackdropClick: true,
            initialState: initialState
        });
        this.modalAddReferentRef.content.onClose.subscribe(
            (_result: any) => { this.loadReferents(); }
        );
    }

    /**
     * Issue 254 NEW LAYOUT (rev. 4.29): stato di apertura del
     * pannello inline `<app-referente-add-form>` dentro la
     * `lnk-ref-group` "Referenti adesione". La logica del form
     * (search utenti, validators, save) e` interamente nel
     * componente standalone.
     */
    _addReferentOpen: boolean = false;

    openInlineAddReferent(): void {
        // Assicuriamo che il sub-gruppo "Referenti adesione" sia aperto
        // quando si chiede di aggiungere un referente.
        this._referentGroupOpen.adesione = true;
        this._addReferentOpen = true;
    }

    closeInlineAddReferent(): void {
        this._addReferentOpen = false;
    }

    /** Triggered dal `<app-referente-add-form>` al successo del POST. */
    onReferentAdded(): void {
        this._addReferentOpen = false;
        this.loadReferents();
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
        // Combina il grant per-adesione con i `ruoli_referente` del
        // profilo: il grant BE puo` non riportare i referenti contestuali
        // (es. `referente_tecnico_servizio`) ma il profilo si`.
        const ruoli = [
            ...(this.grant?.ruoli || []),
            ...(this._ruoliReferenteProfilo || [])
        ];
        return this.authenticationService.canEdit('adesione', 'adesione', this.adesione?.stato, ruoli);
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

    /**
     * Auto-dismiss del banner `app-error-view-card` (errori
     * workflow / cambio stato) quando l'utente compie un'azione
     * con intent "voglio andare avanti":
     * - `pointerdown`: click/touch reale dell'utente su un
     *   elemento del wizard (button "Modifica", riga di edit
     *   inline, label/checkbox, ecc.). NON usiamo `focusin`
     *   perche` veniva sparato anche dal cleanup di focus dei
     *   dialog di conferma (modal close -> focus redirect),
     *   chiudendo il banner immediatamente dopo la sua comparsa.
     * - `input`: digitazione/toggle in un campo della form di
     *   edit gia` aperta. Coerente con "modifica un campo".
     * Filtro `closest('app-error-view-card, ui-error-view')`:
     * gli eventi originati DENTRO la card di errore (es. click
     * sul suo close button) sono gestiti dal suo `(onClose)`
     * dedicato, non li trasformiamo in auto-dismiss.
     * Guard `if (this._error)`: evita reset spuri quando il
     * banner non e` mostrato (la maggior parte del tempo).
     */
    // @HostListener('pointerdown', ['$event'])
    @HostListener('input', ['$event'])
    onUserIntent(event: Event): void {
        if (!this._error) { return; }
        const target = event.target as HTMLElement | null;
        if (target?.closest?.('app-error-view-card, ui-error-view')) { return; }
        this.resetError();
    }

    onWorkflowAction(event: any = null) {
        this.resetError();

        // Se l'utente aveva navigato in una fase diversa da quella
        // corrente dello stato dell'adesione, riportiamo la selezione
        // alla fase coerente con lo stato prima del cambio: cosi`
        // dopo la transizione la UI mostra sempre il contesto giusto
        // senza richiedere navigazione manuale.
        this._initSelectedFase();

        if (!event) {
            event = { action: 'change', status: this.getStateWorkflow() };
        }
        this.utils.__confirmCambioStatoServizio(event, this.adesione, this._changeStatus.bind(this));
    }
    
    _changeStatus(event: any, service: any) {
        this.isEdit = false;
        this.updateMapper = Date.now().toString();
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
                // Bump `updateMapper` per forzare il ricalcolo delle
                // pipe `mapper:isModifiableMapper` nel template: senza
                // questo le matite di edit (custom properties) restano
                // nascoste (cached al valore `false` settato sopra a
                // inizio _changeStatus).
                this.updateMapper = Date.now().toString();
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
        if(event.action == 'delete_adesione') {
            this._confirmDeleteAdesione();
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
                this.updateMapper = Date.now().toString();
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
            stati_adesione: ['bozza', 'richiesto_collaudo', 'autorizzato_collaudo', 'in_configurazione_collaudo', 'in_configurazione_manuale_collaudo', 'in_configurazione_automatica_collaudo'],
            sezioni_attive: ['collaudo']
        },
        {
            code: 'produzione',
            descrizione: 'Produzione',
            stati_adesione: ['pubblicato_collaudo', 'richiesto_produzione', 'autorizzato_produzione', 'in_configurazione_produzione', 'in_configurazione_produzione_senza_collaudo', 'in_configurazione_manuale_produzione', 'in_configurazione_automatica_produzione', 'pubblicato_produzione'],
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
        { code: 'in_configurazione', descrizione: 'In Configurazione', stati_adesione: ['autorizzato_collaudo', 'in_configurazione_collaudo', 'in_configurazione_manuale_collaudo', 'in_configurazione_automatica_collaudo'] },
        { code: 'configurato',       descrizione: 'Configurato',       stati_adesione: ['pubblicato_collaudo'] }
    ];

    /**
     * Fallback frontend per `adesione.step_wizard_produzione`.
     * Mantenere allineato con `src/main/plugin/plugin/configurazione.json`.
     */
    private static readonly _STEP_WIZARD_PRODUZIONE_FALLBACK: StepWizardItem[] = [
        { code: 'in_compilazione',   descrizione: 'In Compilazione',   stati_adesione: ['pubblicato_collaudo'] },
        { code: 'in_approvazione',   descrizione: 'In Approvazione',   stati_adesione: ['richiesto_produzione'] },
        { code: 'in_configurazione', descrizione: 'In Configurazione', stati_adesione: ['autorizzato_produzione', 'in_configurazione_produzione', 'in_configurazione_produzione_senza_collaudo', 'in_configurazione_manuale_produzione', 'in_configurazione_automatica_produzione'] },
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
     * Vero quando il sub-step `in_compilazione` di una sezione
     * (collaudo/produzione) risulta superato. Replica la logica
     * di `AdesioneSubstepperComponent._buildItems`: trova
     * l'indice del sub-step che contiene lo stato corrente nel
     * proprio `stati_adesione` (`realIndex`) e considera
     * "completed" tutti i sub-step con indice < realIndex.
     *
     * Vantaggio: NON dipende da `workflowStati` (la cui
     * derivazione puo` divergere dal BE), ma solo dalle
     * `stati_adesione` di ciascun sub-step — stessa source che
     * usa il substepper visivo per dire "In Compilazione
     * Completato".
     */
    isInCompilazioneCompleted(section: 'collaudo' | 'produzione'): boolean {
        const steps = this.getStepWizardSezione(section);
        if (!steps.length) { return false; }
        const currentStato = this.adesione?.stato;
        if (!currentStato) { return false; }
        const inCompilazioneIdx = steps.findIndex(s => s.code === 'in_compilazione');
        if (inCompilazioneIdx === -1) { return false; }
        const realIndex = steps.findIndex(s => s.stati_adesione?.includes(currentStato));
        if (realIndex === -1) {
            // "Past phase": stato corrente oltre tutti i sub-step
            // (es. Collaudo quando adesione e` in Produzione).
            // Tutti i sub-step diventano `completed`, incluso
            // `in_compilazione`. Allineato a `_buildItems`
            // del substepper.
            const wfStati = this.workflowStati;
            if (wfStati.length === 0) { return false; }
            const currentIdx = wfStati.indexOf(currentStato);
            if (currentIdx === -1) { return false; }
            let maxStepStateIdx = -1;
            for (const step of steps) {
                for (const st of step.stati_adesione || []) {
                    const idx = wfStati.indexOf(st);
                    if (idx > maxStepStateIdx) { maxStepStateIdx = idx; }
                }
            }
            return maxStepStateIdx !== -1 && currentIdx > maxStepStateIdx;
        }
        return inCompilazioneIdx < realIndex;
    }

    /**
     * Vero se la sezione (collaudo/produzione) ha una step-bar interna e lo
     * step corrente ha raggiunto o superato l'ultimo step della bar. Le altre
     * sezioni non hanno step-bar interna: la condizione non si applica e
     * ritorna true così la regola di apertura segue la sola logica di
     * completamento dati.
     */
    private _isInternalStepFinal(section: string): boolean {
        if (section !== 'collaudo' && section !== 'produzione') return true;
        const steps = this.getStepWizardSezione(section);
        if (!steps.length) return true;
        const wfStati = this.workflowStati;
        const currentStato = this.adesione?.stato;
        if (!wfStati.length || !currentStato) return true;
        const currentIdx = wfStati.indexOf(currentStato);
        if (currentIdx === -1) return true;
        let maxStepIdx = -1;
        for (const step of steps) {
            for (const st of step.stati_adesione || []) {
                const idx = wfStati.indexOf(st);
                if (idx > maxStepIdx) maxStepIdx = idx;
            }
        }
        if (maxStepIdx === -1) return true;
        return currentIdx >= maxStepIdx;
    }

    /**
     * Un accordion è aperto di default quando la sezione è attiva per lo step
     * corrente e NON ancora completata. Le sezioni completate (verde) o non
     * applicabili (grigio) restano chiuse — l'icona di stato su lnk-icon-toggle
     * ne evidenzia già lo stato. La regola si applica sia in modalità
     * `wizard_show_all_sections` on che off (in off le sezioni non attive sono
     * comunque nascoste, quindi la condizione aggiuntiva non è necessaria).
     *
     * Eccezione step-bar interna (collaudo/produzione): se la step-bar di
     * sezione non ha ancora raggiunto lo step finale, l'accordion resta
     * aperto anche se i dati risultano completi — il workflow di sezione non
     * è concluso e l'utente deve poterne vedere il contenuto.
     */
    isSectionOpenByDefault(section: string): boolean {
        if (!this.isSectionActive(section)) return false;
        if (!this._isInternalStepFinal(section)) return true;
        return !this.isSectionCompleted(section);
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
                profilo: d.profilo,
                nome_gruppo: d.nome_gruppo
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
    // specifica riga client (matching per profilo); quelli con
    // `nome_gruppo` vengono mostrati accanto al gruppo di custom
    // properties corrispondente. In entrambi i casi devono essere
    // esclusi dal banner ambientale per evitare doppia visualizzazione.
    get disclaimersGenerali(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('generale').filter(d => !d.profilo && !d.nome_gruppo);
    }

    get disclaimersCollaudo(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('collaudo').filter(d => !d.profilo && !d.nome_gruppo);
    }

    get disclaimersProduzione(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('produzione').filter(d => !d.profilo && !d.nome_gruppo);
    }

    /**
     * Disclaimer legati a un gruppo di custom properties: filtra per
     * contesto (ambiente) + `nome_gruppo`. Quando `nome_gruppo` e`
     * valorizzato il disclaimer e` di gruppo a prescindere da
     * eventuale `profilo` (che resta come informazione
     * diagnostica/contestuale BE-side). Usato nel wizard per
     * renderizzare un blocco markdown accanto a ogni
     * `<app-api-custom-properties>` quando esistono disclaimer
     * specifici per quel gruppo.
     */
    getDisclaimersByGruppo(contesto: DisclaimerContesto, nomeGruppo: string): AdesioneDisclaimer[] {
        if (!nomeGruppo) { return []; }
        return this.getDisclaimersByContesto(contesto).filter(d => d.nome_gruppo === nomeGruppo);
    }

    // Usati come @Input delle liste client: disclaimer con `profilo`
    // ma SENZA `nome_gruppo` (quando entrambi presenti vincono i
    // gruppi). La lista filtrera' poi per profilo del client.
    get clientDisclaimersCollaudo(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('collaudo').filter(d => !!d.profilo && !d.nome_gruppo);
    }

    get clientDisclaimersProduzione(): AdesioneDisclaimer[] {
        return this.getDisclaimersByContesto('produzione').filter(d => !!d.profilo && !d.nome_gruppo);
    }
}
