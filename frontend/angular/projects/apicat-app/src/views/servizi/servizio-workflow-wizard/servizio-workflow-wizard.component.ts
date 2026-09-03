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
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService } from 'ngx-bootstrap/modal';

import { ConfigService, MenuAction, Tools, COMPONENTS_IMPORTS } from '@linkit/components';
import { MonitorDropdwnComponent } from '../components/monitor-dropdown/monitor-dropdown.component';
import { AllegatiDialogComponent } from '@app/components/allegati-dialog/allegati-dialog.component';
import { ServizioAllegatoAddFormComponent } from './servizio-allegato-add-form/servizio-allegato-add-form.component';
import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';
import { ModalGroupChoiceComponent } from '@app/components/modal-group-choice/modal-group-choice.component';
import { TipologiaAllegatoEnum } from '@app/model/tipologiaAllegatoEnum';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Grant } from '@app/model/grant';
import { CommonModule } from '@angular/common';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { WorkflowComponent } from '@app/components/workflow/workflow.component';
import { ErrorViewComponent } from '@app/components/error-view/error-view.component';
import { HttpImgSrcPipe } from '@app/lib/pipes/http-img-src.pipe';
import { AdesioneFasiBarComponent } from '@app/views/adesioni/adesione-fasi-bar/adesione-fasi-bar.component';
import { AdesioneSubstepperComponent } from '@app/views/adesioni/adesione-substepper/adesione-substepper.component';
import { StepWizardItem } from '@app/views/adesioni/adesione-step-bar/adesione-step-bar.component';
import { ServizioInfoFormComponent } from './servizio-info-form/servizio-info-form.component';
import { ServizioReferenteAddFormComponent } from './servizio-referente-add-form/servizio-referente-add-form.component';
import { ServizioApiDetailsComponent } from '@app/views/servizi/servizio-api-details/servizio-api-details.component';
import { ServizioApiConfigurationComponent } from '@app/views/servizi/servizio-api-configuration/servizio-api-configuration.component';

import {
    STEP_WIZARD_SERVIZIO_FALLBACK,
    STEP_WIZARD_COLLAUDO_SERVIZIO,
    STEP_WIZARD_PRODUZIONE_SERVIZIO,
    WORKFLOW_STATI_SERVIZIO
} from './servizio-wizard.config';

declare const saveAs: any;

/**
 * Wizard a fasi del workflow servizio (Parte B, skeleton).
 *
 * Presenta il workflow del servizio (fasi Collaudo/Produzione) come step-bar,
 * riusando `AdesioneFasiBarComponent` (senza modificarlo) e l'esistente
 * `<ui-workflow>` per le transizioni di stato (`PUT /servizi/:id/stato`).
 * La configurazione delle fasi arriva da `Tools.Configurazione.servizio.step_wizard`
 * se presente, altrimenti dal MOCK frontend (`STEP_WIZARD_SERVIZIO_FALLBACK`).
 *
 * Isolato: nuova rotta `servizi/:id/wizard`, non sostituisce `servizio-details`.
 */
@Component({
    selector: 'app-servizio-workflow-wizard',
    templateUrl: 'servizio-workflow-wizard.component.html',
    styleUrls: ['servizio-workflow-wizard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ...COMPONENTS_IMPORTS,
        WorkflowComponent,
        ErrorViewComponent,
        AdesioneFasiBarComponent,
        AdesioneSubstepperComponent,
        ServizioInfoFormComponent,
        ServizioReferenteAddFormComponent,
        ServizioAllegatoAddFormComponent,
        LnkButtonComponent,
        ServizioApiDetailsComponent,
        ServizioApiConfigurationComponent,
        MonitorDropdwnComponent,
        HttpImgSrcPipe
    ]
})
export class ServizioWorkflowWizardComponent implements OnInit {
    static readonly Name = 'ServizioWorkflowWizardComponent';
    readonly model: string = 'servizi';

    Tools = Tools;

    id: string | null = null;
    data: any = null;
    config: any = null;
    generalConfig: any = Tools.Configurazione || null;
    _grant: Grant | null = null;

    _spin: boolean = true;
    _changingStatus: boolean = false;
    _updateData: string = '';

    _error: boolean = false;
    _errorMsg: string = '';
    _errors: any[] = [];

    stepWizard: StepWizardItem[] = [];
    stepWizardCollaudo: StepWizardItem[] = [];
    stepWizardProduzione: StepWizardItem[] = [];
    workflowStati: string[] = WORKFLOW_STATI_SERVIZIO;
    _selectedFase: string | null = null;

    // Sezioni collassabili della FASE 1 (parità wizard adesioni).
    _phaseSectionOpen: { [k: string]: boolean } = {
        info_generali: true,
        referenti: false,
        allegati: false,
        gruppi: false,
        // API e' ora una sezione di FASE 1 (accordion): parte chiusa.
        api: false
    };
    // Fase richiesta via query param (?fase=api), es. dopo la creazione.
    _requestedFase: string | null = null;

    /** True quando è aperto il form embedded di creazione API in FASE 1. */
    _createApiOpen: boolean = false;
    /** Id API aperta inline (embedded) in FASE 1, o null. */
    _editApiId: string | null = null;
    /** Pannello API inline aperto in modifica (true) o in sola lettura (false). */
    _editApiStartEdit: boolean = false;
    /** Id API di cui si stanno configurando i settaggi per ambiente inline. */
    _configApiId: string | null = null;
    /** Pannello settaggi per ambiente aperto in modifica (true) o sola lettura (false). */
    _configApiStartEdit: boolean = false;

    @ViewChild('infoFormRef') infoFormRef?: ServizioInfoFormComponent;

    apiUrl: string = '';
    hideVersions: boolean = false;
    _downloading: boolean = false;

    // Azioni della top-area (app-monitor-dropdown), come in servizio-details.
    _showExternalOtherActions: boolean = true;
    _otherActions: MenuAction[] = [
        new MenuAction({ type: 'menu', title: 'APP.MENU.JoinService', icon: 'display', subTitle: '', action: 'join_service', enabled: true }),
        new MenuAction({
            type: 'submenu', title: 'APP.MENU.eServiceDescriptor', icon: 'download', subTitle: '', action: 'download_service', enabled: true,
            submenus: [
                new MenuAction({ type: 'submenu', title: 'APP.MENU.DownloadeServiceDescriptorZip', icon: 'file-zip', subTitle: '', action: 'download_service', enabled: true }),
                new MenuAction({ type: 'menu', title: 'APP.MENU.DownloadeServiceDescriptorCsv', icon: 'filetype-csv', subTitle: '', action: 'download_service_extended', enabled: true })
            ]
        }),
        new MenuAction({ type: 'divider', title: '', enabled: true })
    ];

    // Referenti (gestione inline, pattern wizard adesioni).
    servizioReferenti: any[] = [];
    dominioReferenti: any[] = [];
    _referentGroupOpen: { [k: string]: boolean } = { servizio: true, dominio: false };
    _addReferentOpen: boolean = false;
    _idDominioEsterno: string | null = null;

    // Allegati (gestione inline; upload/edit via AllegatiDialogComponent).
    serviceAllegati: any[] = [];
    _allegatiConfig: any = null;
    _showAllAttachments: boolean = false;
    _downloadings: boolean[] = [];
    _addAllegatoOpen: boolean = false;

    // Gruppi (gestione inline; scelta via ModalGroupChoiceComponent).
    servizioGruppi: any[] = [];

    // API del servizio (erogazione per ambiente collaudo/produzione).
    servizioApiList: any[] = [];
    /** True dopo il primo caricamento della lista API (evita di disabilitare
     *  Collaudo prima di conoscere il numero di API). */
    _apiListLoaded: boolean = false;

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
        { label: '...', url: '', type: 'link' }
    ];

    constructor(
        public route: ActivatedRoute,
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly configService: ConfigService,
        private readonly modalService: BsModalService,
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService,
        private readonly authenticationService: AuthenticationService
    ) {
        this.apiUrl = this.configService.getConfiguration()?.AppConfig?.GOVAPI?.HOST || '';
        this.hideVersions = this.configService.getConfiguration()?.AppConfig?.Services?.hideVersions || false;
    }

    ngOnInit() {
        this.route.queryParams.subscribe((qp) => {
            this._requestedFase = qp['fase'] || null;
        });
        this.route.params.subscribe((params) => {
            this.id = params['id'];
            this._loadStepWizard();
            this.configService.getConfig('allegati').subscribe((cfg: any) => {
                this._allegatiConfig = cfg;
                this._showAllAttachments = cfg?.showAllAttachments || false;
            });
            this.configService.getConfig(this.model).subscribe((config: any) => {
                this.config = config;
                this._loadService();
            });
        });
    }

    /** Carica la config delle fasi: remota se presente, altrimenti MOCK FE. */
    private _loadStepWizard() {
        const cfg = Tools.Configurazione?.servizio || {};
        const _pick = (remote: any, fallback: StepWizardItem[]) =>
            (Array.isArray(remote) && remote.length) ? remote : fallback;
        this.stepWizard = _pick(cfg.step_wizard, STEP_WIZARD_SERVIZIO_FALLBACK);
        this.stepWizardCollaudo = _pick(cfg.step_wizard_collaudo, STEP_WIZARD_COLLAUDO_SERVIZIO);
        this.stepWizardProduzione = _pick(cfg.step_wizard_produzione, STEP_WIZARD_PRODUZIONE_SERVIZIO);
    }

    private _loadService() {
        if (!this.id) { return; }
        this._spin = true;
        this.apiService.getDetails('servizi', this.id, 'grant').subscribe({
            next: (grant: any) => {
                this._grant = grant;
                this.apiService.getDetails(this.model, this.id).subscribe({
                    next: (response: any) => {
                        this.data = response;
                        this._idDominioEsterno = this.data?.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
                        this._adjustStepWizardTerminal();
                        this._initSelectedFase();
                        this._initBreadcrumb();
                        this._updateOtherActions();
                        this.loadReferenti();
                        this.loadAllegati();
                        this.loadGruppi();
                        this.loadServizioApi();
                        this._spin = false;
                    },
                    error: (error: any) => { Tools.OnError(error); this._spin = false; }
                });
            },
            error: (error: any) => { Tools.OnError(error); this._spin = false; }
        });
    }

    /**
     * La fasi-bar promuove la fase a "conclusa" solo se lo stato corrente coincide
     * con l'ultimo stato della fase. La produzione ha due stati terminali
     * (con e senza collaudo): riordino l'array mettendo per ultimo quello applicabile
     * a questo servizio in base a skip_collaudo.
     */
    private _adjustStepWizardTerminal() {
        const terminal = this.data?.skip_collaudo ? 'pubblicato_produzione_senza_collaudo' : 'pubblicato_produzione';
        this.stepWizard = this.stepWizard.map((step) => {
            if (step.code !== 'produzione' || !step.stati_adesione?.includes(terminal)) { return step; }
            const stati = step.stati_adesione.filter((s: string) => s !== terminal);
            stati.push(terminal);
            return { ...step, stati_adesione: stati };
        });
    }

    /** Imposta la fase visualizzata su quella corrente del workflow. */
    private _initSelectedFase() {
        // `?fase=api` (dopo la creazione): le API sono ora una sezione di FASE 1,
        // quindi seleziono info_generali e apro la sezione API.
        if (this._requestedFase === 'api') {
            this._requestedFase = null;
            this._selectedFase = 'info_generali';
            this._phaseSectionOpen = { ...this._phaseSectionOpen };
            Object.keys(this._phaseSectionOpen).forEach((k) => (this._phaseSectionOpen[k] = false));
            this._phaseSectionOpen['api'] = true;
            return;
        }
        // Fase richiesta esplicitamente (es. da un link diretto).
        if (this._requestedFase && this.stepWizard.some((s) => s.code === this._requestedFase)) {
            this._selectedFase = this._requestedFase;
            this._requestedFase = null;
            return;
        }
        const stato = this.data?.stato;
        const fase = this.stepWizard.find((s) => s.stati_adesione?.includes(stato));
        this._selectedFase = fase ? fase.code : (this.stepWizard[0]?.code || null);
    }

    /** Fase attualmente visualizzata (selezione utente o fase corrente). */
    get activeFase(): StepWizardItem | null {
        return this.stepWizard.find((s) => s.code === this._selectedFase) || null;
    }

    selectFase(code: string) {
        // Cambiando fase, chiudo i pannelli inline aperti: la sezione API di
        // Collaudo/Produzione è un unico blocco condiviso, quindi lasciare aperto
        // un pannello (config/vista/modifica) mostrerebbe l'ambiente precedente
        // (componente non ricreato) → collaudo e produzione con la stessa form.
        if (this._selectedFase !== code) {
            this._configApiId = null;
            this._configApiStartEdit = false;
            this._editApiId = null;
            this._editApiStartEdit = false;
            this._createApiOpen = false;
        }
        this._selectedFase = code;
    }

    /** Sotto-step della fase attualmente visualizzata (vuoto per
     *  `info_generali`, che non ha timeline). */
    get subStepsForActiveFase(): StepWizardItem[] {
        switch (this._selectedFase) {
            case 'collaudo': return this.stepWizardCollaudo;
            case 'produzione': return this.stepWizardProduzione;
            default: return [];
        }
    }

    /** Titolo della procedura sopra la timeline della fase attiva. */
    get procedureTitle(): string {
        const key = this._selectedFase === 'produzione'
            ? 'APP.SERVICES.WIZARD.ProcedureProduzione'
            : 'APP.SERVICES.WIZARD.ProcedureCollaudo';
        return this.translate.instant(key);
    }

    /** Link rapidi alle sezioni del servizio (fase Informazioni Generali). */
    get sezioniLinks(): Array<{ route: string; label: string; icon: string }> {
        const _isPackage = this.data?.package || false;
        const _tassonomie = this.authenticationService._getConfigModule('servizio')?.tassonomie_abilitate || false;
        const links = [
            { route: _isPackage ? 'componenti' : 'api', label: _isPackage ? 'APP.SERVICES.TITLE.ComponentsInformations' : 'APP.SERVICES.TITLE.ApiInformations', icon: 'bi bi-code-slash' },
            { route: 'allegati', label: 'APP.SERVICES.TITLE.Attachments', icon: 'bi bi-file-earmark-text' },
            { route: 'referenti', label: 'APP.SERVICES.TITLE.ShowReferents', icon: 'bi bi-people' },
            { route: 'gruppi', label: 'APP.SERVICES.TITLE.ShowGroups', icon: 'bi bi-folder' }
        ];
        if (_tassonomie) {
            links.push({ route: 'categorie', label: 'APP.SERVICES.TITLE.ShowCategories', icon: 'bi bi-tags' });
        }
        return links;
    }

    openSection(route: string) {
        this.router.navigate([this.model, this.id, route]);
    }

    /** Convivenza: torna alla vista classica del servizio (servizio-details),
     *  ora su rotta dedicata `:id/classic` (il default `:id` e' il wizard). */
    openClassic() {
        this.router.navigate([this.model, this.id, 'classic']);
    }

    // -------------------------------------------------------------------------
    // FASE 1 — sezioni collassabili + form Informazioni Generali
    // -------------------------------------------------------------------------

    isPhaseSectionOpen(key: string): boolean {
        return !!this._phaseSectionOpen[key];
    }

    /** Accordion esclusivo: apre la sezione richiesta e chiude le altre. */
    togglePhaseSection(key: string) {
        const willOpen = !this._phaseSectionOpen[key];
        Object.keys(this._phaseSectionOpen).forEach((k) => (this._phaseSectionOpen[k] = false));
        this._phaseSectionOpen[key] = willOpen;
    }

    /** Barra "vai a": apre la sezione (esclusiva) e ci scorre sopra. */
    goToSection(key: string) {
        Object.keys(this._phaseSectionOpen).forEach((k) => (this._phaseSectionOpen[k] = false));
        this._phaseSectionOpen[key] = true;
        setTimeout(() => {
            const el = document.getElementById('phase-section-' + key);
            if (!el) { return; }
            // Scrolla SOLO il contenitore .container-scroller: scrollIntoView
            // propagherebbe lo scroll alla finestra, nascondendo breadcrumb/head-bar.
            const scroller = el.closest('.container-scroller') as HTMLElement | null;
            if (scroller) {
                const nav = scroller.querySelector('.lnk-section-nav') as HTMLElement | null;
                const offset = (nav?.offsetHeight || 48) + 12;
                const top = scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset;
                scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            } else if (typeof el.scrollIntoView === 'function') {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    }

    /** Permesso di modifica delle informazioni generali. */
    canEditInfo(): boolean {
        return this.authenticationService.canEdit('servizio', 'servizio', this.data?.stato, this._grant?.ruoli);
    }

    get isInfoFormEditing(): boolean {
        return !!this.infoFormRef?.isEdit;
    }

    /** Ingresso/uscita edit del form info, pilotato dal bottone di sezione. */
    enterEditModeForInfoGenerali() {
        this.infoFormRef?.toggleEdit();
    }

    /** Dopo il salvataggio del form info, aggiorna i dati del servizio. */
    onInfoSaved(event: any) {
        if (event?.data) {
            this.data = { ...event.data };
            this._idDominioEsterno = this.data?.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
            this._initSelectedFase();
            this.loadReferenti();
        }
    }

    // -------------------------------------------------------------------------
    // FASE 1 — Referenti (gestione inline)
    // -------------------------------------------------------------------------

    loadReferenti() {
        if (!this.id) { return; }
        this.apiService.getDetails(this.model, this.id, 'referenti').subscribe({
            next: (resp: any) => { this.servizioReferenti = resp?.content || []; },
            error: () => { this.servizioReferenti = []; }
        });
        const idDominio = this.data?.dominio?.id_dominio;
        if (idDominio) {
            this.apiService.getDetails('domini', idDominio, 'referenti').subscribe({
                next: (resp: any) => { this.dominioReferenti = resp?.content || []; },
                error: () => { this.dominioReferenti = []; }
            });
        }
    }

    isReferentGroupOpen(key: string): boolean {
        return !!this._referentGroupOpen[key];
    }

    toggleReferentGroup(key: string) {
        this._referentGroupOpen[key] = !this._referentGroupOpen[key];
    }

    /** Permesso di aggiungere/rimuovere referenti (analogo servizio-referenti). */
    canAddReferente(): boolean {
        const _ruoli: any = this._grant?.ruoli || [];
        if (this.authenticationService._isDatoSempreModificabile('servizio', 'referenti', _ruoli)) { return true; }
        const _cnm = this.authenticationService._getClassesNotModifiable('servizio', 'servizio', this.data?.stato) || [];
        return _cnm.indexOf('referente') === -1 && _cnm.indexOf('referente_superiore') === -1;
    }

    openAddReferente() {
        if (!this._referentGroupOpen['servizio']) { this._referentGroupOpen['servizio'] = true; }
        this._addReferentOpen = true;
    }

    closeAddReferente() {
        this._addReferentOpen = false;
    }

    onReferentAdded() {
        this._addReferentOpen = false;
        this.loadReferenti();
    }

    confirmDeleteReferente(ref: any) {
        this.utils._confirmDelection(ref, () => this._deleteReferente(ref));
    }

    private _deleteReferente(ref: any) {
        const idUtente = ref?.utente?.id_utente;
        const tipo = ref?.tipo;
        this.apiService.deleteElementRelated(this.model, this.id, `referenti/${idUtente}?tipo_referente=${tipo}`).subscribe({
            next: () => { this.loadReferenti(); },
            error: () => {
                Tools.showMessage(this.translate.instant('APP.MESSAGE.ERROR.NoDeleteReferent'), 'danger', true);
            }
        });
    }

    getReferentName(ref: any): string {
        return [ref?.utente?.nome, ref?.utente?.cognome].filter(Boolean).join(' ') || (ref?.utente?.id_utente || '-');
    }

    getReferentEmail(ref: any): string {
        return ref?.utente?.email_aziendale || ref?.utente?.email || '';
    }

    getReferentInitials(ref: any): string {
        const n = (ref?.utente?.nome || '').charAt(0);
        const c = (ref?.utente?.cognome || '').charAt(0);
        return (n + c).toUpperCase() || '?';
    }

    // -------------------------------------------------------------------------
    // FASE 1 — Allegati (gestione inline; upload via AllegatiDialogComponent)
    // -------------------------------------------------------------------------

    loadAllegati() {
        if (!this.id) { return; }
        let query: any = { sort: 'documento.filename,asc' };
        if (!this._showAllAttachments) {
            query = { ...query, tipologia_allegato: TipologiaAllegatoEnum.Generico };
        }
        const aux = { params: this.utils._queryToHttpParams({ ...query }) };
        this.apiService.getDetails(this.model, this.id, 'allegati', aux).subscribe({
            next: (resp: any) => { this.serviceAllegati = resp?.content || []; },
            error: () => { this.serviceAllegati = []; }
        });
    }

    canAddAllegato(): boolean {
        return this.authenticationService.canAdd('servizio', this.data?.stato, this._grant?.ruoli);
    }

    canEditAllegato(): boolean {
        return this.authenticationService.canEdit('servizio', 'allegati', this.data?.stato, this._grant?.ruoli);
    }

    /** Aggiunta allegato tramite form INLINE (non più dialog). */
    openAddAllegato() {
        this._addAllegatoOpen = true;
    }

    closeAddAllegato() {
        this._addAllegatoOpen = false;
    }

    onAllegatoAdded() {
        this._addAllegatoOpen = false;
        this.loadAllegati();
    }

    /** Modifica di un allegato ESISTENTE: resta via dialog (richiede uuid). */
    openAllegatoDialog(allegato: any = null) {
        const initialState = {
            model: this.model,
            id: this.id,
            current: allegato || null,
            isEdit: allegato !== null,
            isNew: allegato === null,
            showAllAttachments: this._showAllAttachments,
            multiple: allegato === null
        };
        const ref = this.modalService.show(AllegatiDialogComponent, { ignoreBackdropClick: true, initialState });
        ref.content?.onClose?.subscribe((result: boolean) => {
            if (result) { this.loadAllegati(); }
        });
    }

    confirmDeleteAllegato(allegato: any) {
        this.utils._confirmDelection(allegato, () => this._deleteAllegato(allegato));
    }

    private _deleteAllegato(allegato: any) {
        this.apiService.deleteElementRelated(this.model, this.id, `allegati/${allegato.uuid}`).subscribe({
            next: () => { this.loadAllegati(); },
            error: (error: any) => { Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true); }
        });
    }

    downloadAllegato(allegato: any, index: number = -1) {
        this._downloadings[index] = true;
        this.apiService.download(this.model, this.id, `allegati/${allegato.uuid}/download`).subscribe({
            next: (response: any) => {
                saveAs(response.body, `${allegato.filename}`);
                this._downloadings[index] = false;
            },
            error: (error: any) => {
                this._downloadings[index] = false;
                Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true);
            }
        });
    }

    // -------------------------------------------------------------------------
    // FASE 1 — Allegati DI UNA API (pannello inline show/hide per riga API)
    // -------------------------------------------------------------------------

    /** id_api della riga con il pannello allegati aperto (uno per volta). */
    _apiAllegatiOpenId: string | null = null;
    _apiAllegatiList: any[] = [];
    _apiAllegatiAddOpen: boolean = false;
    _apiAllegatiDownloadings: boolean[] = [];
    /** Conteggio allegati per id_api (per il badge accanto alla graffetta). */
    _apiAllegatiCount: { [idApi: string]: number } = {};

    /** Carica il conteggio allegati per ogni API della lista (badge graffetta). */
    private _loadApiAllegatiCounts() {
        (this.servizioApiList || []).forEach((api: any) => {
            let query: any = {};
            if (!this._showAllAttachments) { query = { tipologia_allegato: TipologiaAllegatoEnum.Generico }; }
            const aux = { params: this.utils._queryToHttpParams({ ...query }) };
            this.apiService.getDetails('api', api.id_api, 'allegati', aux).subscribe({
                next: (resp: any) => { this._apiAllegatiCount[api.id_api] = resp?.content?.length || 0; },
                error: () => { this._apiAllegatiCount[api.id_api] = 0; }
            });
        });
    }

    toggleApiAllegati(api: any) {
        if (this._apiAllegatiOpenId === api.id_api) {
            this._apiAllegatiOpenId = null;
            this._apiAllegatiAddOpen = false;
            return;
        }
        this._apiAllegatiOpenId = api.id_api;
        this._apiAllegatiAddOpen = false;
        this.loadApiAllegati(api.id_api);
    }

    loadApiAllegati(idApi: string) {
        this._apiAllegatiList = [];
        let query: any = { sort: 'documento.filename,asc' };
        if (!this._showAllAttachments) {
            query = { ...query, tipologia_allegato: TipologiaAllegatoEnum.Generico };
        }
        const aux = { params: this.utils._queryToHttpParams({ ...query }) };
        this.apiService.getDetails('api', idApi, 'allegati', aux).subscribe({
            next: (resp: any) => {
                this._apiAllegatiList = resp?.content || [];
                this._apiAllegatiCount[idApi] = this._apiAllegatiList.length;
            },
            error: () => { this._apiAllegatiList = []; }
        });
    }

    openAddApiAllegato() { this._apiAllegatiAddOpen = true; }
    closeAddApiAllegato() { this._apiAllegatiAddOpen = false; }
    onApiAllegatoAdded(api: any) { this._apiAllegatiAddOpen = false; this.loadApiAllegati(api.id_api); }

    confirmDeleteApiAllegato(api: any, allegato: any) {
        this.utils._confirmDelection(allegato, () => this._deleteApiAllegato(api, allegato));
    }

    private _deleteApiAllegato(api: any, allegato: any) {
        this.apiService.deleteElementRelated('api', api.id_api, `allegati/${allegato.uuid}`).subscribe({
            next: () => { this.loadApiAllegati(api.id_api); },
            error: (error: any) => { Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true); }
        });
    }

    downloadApiAllegato(api: any, allegato: any, index: number = -1) {
        this._apiAllegatiDownloadings[index] = true;
        this.apiService.download('api', api.id_api, `allegati/${allegato.uuid}/download`).subscribe({
            next: (response: any) => {
                saveAs(response.body, `${allegato.filename}`);
                this._apiAllegatiDownloadings[index] = false;
            },
            error: (error: any) => {
                this._apiAllegatiDownloadings[index] = false;
                Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true);
            }
        });
    }

    // -------------------------------------------------------------------------
    // FASE 1 — Gruppi (gestione inline; scelta via ModalGroupChoiceComponent)
    // -------------------------------------------------------------------------

    loadGruppi() {
        if (!this.id) { return; }
        this.apiService.getDetails(this.model, this.id, 'gruppi').subscribe({
            next: (resp: any) => { this.servizioGruppi = resp?.content || []; },
            error: () => { this.servizioGruppi = []; }
        });
    }

    /** Permesso di gestione gruppi (analogo servizio-gruppi). */
    canManageGruppi(): boolean {
        const _cnm = this.authenticationService._getClassesNotModifiable('servizio', 'servizio', this.data?.stato) || [];
        return _cnm.indexOf('referente') === -1 && _cnm.indexOf('referente_superiore') === -1;
    }

    gruppoLogo(g: any): string {
        return g?.immagine ? `${this.apiUrl}/gruppi/${g.id_gruppo}/immagine` : '';
    }

    openAddGruppo() {
        const initialState = { gruppi: [], selected: [], notSelectable: this.servizioGruppi };
        const ref = this.modalService.show(ModalGroupChoiceComponent, { ignoreBackdropClick: true, initialState });
        ref.content?.onClose?.subscribe((result: any) => {
            const idGruppo = result?.[0]?.id_gruppo;
            if (!idGruppo) { return; }
            this.apiService.postElementRelated(this.model, this.id, `gruppi/${idGruppo}`, {}).subscribe({
                next: () => { this.loadGruppi(); },
                error: (error: any) => { Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true); }
            });
        });
    }

    confirmDeleteGruppo(g: any) {
        this.utils._confirmDelection(g, () => this._deleteGruppo(g));
    }

    private _deleteGruppo(g: any) {
        this.apiService.deleteElementRelated(this.model, this.id, `gruppi/${g.id_gruppo}`).subscribe({
            next: () => { this.loadGruppi(); },
            error: (error: any) => { Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true); }
        });
    }

    // -------------------------------------------------------------------------
    // Elimina servizio (parità con la vista classica): visibile solo se
    // `data.eliminabile`. Conferma -> DELETE /servizi/:id -> torna alla lista.
    // -------------------------------------------------------------------------

    confirmDeleteServizio() {
        this.utils._confirmDelection(this.data, () => this._deleteServizio());
    }

    private _deleteServizio() {
        this.apiService.deleteElement(this.model, this.data.id_servizio).subscribe({
            next: () => { this.router.navigate([this.model]); },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = this.utils.GetErrorMsg(error);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Collaudo/Produzione — API del servizio (erogazione per ambiente)
    // -------------------------------------------------------------------------

    /** Carica le API del servizio (ruoli erogato_soggetto_dominio/aderente). */
    loadServizioApi() {
        if (!this.id) { return; }
        const ruoli = ['erogato_soggetto_dominio', 'erogato_soggetto_aderente'];
        const reqs = ruoli.map((ruolo) => {
            const params = this.utils._queryToHttpParams({ id_servizio: this.id, ruolo });
            return this.apiService.getList('api', { params }).pipe(catchError(() => of({ content: [] })));
        });
        forkJoin(reqs).subscribe({
            next: (results: any[]) => {
                const merged = results.reduce((acc: any[], r: any) => acc.concat(r?.content || []), []);
                const seen = new Set<any>();
                this.servizioApiList = merged.filter((a: any) => {
                    if (seen.has(a.id_api)) { return false; }
                    seen.add(a.id_api);
                    return true;
                });
                this._apiListLoaded = true;
                this._enforceApiRequiredForCollaudo();
                this._maybeAutoOpenCreateApi();
                this._loadApiAllegatiCounts();
            },
            error: () => { this.servizioApiList = []; this._apiListLoaded = true; this._enforceApiRequiredForCollaudo(); this._maybeAutoOpenCreateApi(); }
        });
    }

    /** Con 0 API il Collaudo/Produzione è bloccato: se la fase selezionata è una
     *  di quelle, riporta la vista a FASE 1 (Informazioni generali). */
    private _enforceApiRequiredForCollaudo() {
        if ((this.servizioApiList?.length || 0) === 0 &&
            (this._selectedFase === 'collaudo' || this._selectedFase === 'produzione')) {
            this._selectedFase = 'info_generali';
            // Porta l'utente sulla sezione API per inserire la prima API.
            Object.keys(this._phaseSectionOpen).forEach((k) => (this._phaseSectionOpen[k] = false));
            this._phaseSectionOpen['api'] = true;
        }
    }

    /** Con 0 API e la sezione API aperta, apre già la form di creazione della
     *  prima API (flussi guidati: post-creazione `?fase=api` o riapertura bozza). */
    private _maybeAutoOpenCreateApi() {
        if ((this.servizioApiList?.length || 0) === 0 &&
            this._phaseSectionOpen['api'] &&
            this.canAddApi() && !this._createApiOpen && !this._editApiId) {
            this._createApiOpen = true;
        }
    }

    /** Ambiente della fase visualizzata (collaudo/produzione), o null. */
    get currentAmbiente(): string | null {
        return (this._selectedFase === 'collaudo' || this._selectedFase === 'produzione') ? this._selectedFase : null;
    }

    /** True se l'API ha una configurazione per l'ambiente della fase attiva. */
    apiHasConfig(api: any): boolean {
        if (this.currentAmbiente === 'collaudo') { return !!api?.configurazione_collaudo; }
        if (this.currentAmbiente === 'produzione') { return !!api?.configurazione_produzione; }
        return false;
    }

    apiProfilo(api: any): string {
        const g = api?.gruppi_auth_type;
        if (Array.isArray(g) && g.length) {
            return g.length === 1 ? g[0].profilo : this.translate.instant('APP.LABEL.Multipli');
        }
        return '';
    }

    openApiConfig(api: any) {
        const amb = this.currentAmbiente || 'collaudo';
        this.router.navigate([this.model, this.id, 'api', api.id_api, 'configuration', amb]);
    }

    /** Settaggi per ambiente dell'API inline (embedded config) in modifica. */
    openApiSettings(api: any) {
        this._configApiStartEdit = true;
        this._configApiId = api.id_api;
    }

    /** Settaggi per ambiente dell'API inline in sola lettura. */
    openApiSettingsView(api: any) {
        this._configApiStartEdit = false;
        this._configApiId = api.id_api;
    }

    closeApiSettings() {
        this._configApiId = null;
        this._configApiStartEdit = false;
    }

    onApiSettingsSaved(_event: any) {
        this._configApiId = null;
        this._configApiStartEdit = false;
        this.loadServizioApi();
    }


    // -------------------------------------------------------------------------
    // FASE 1 — API: creazione inline (embed ServizioApiDetailsComponent)
    // -------------------------------------------------------------------------

    canAddApi(): boolean {
        return this.authenticationService.canAdd('servizio', this.data?.stato, this._grant?.ruoli);
    }

    canEditApi(): boolean {
        return this.authenticationService.canEdit('servizio', 'api', this.data?.stato, this._grant?.ruoli);
    }

    openCreateApi() {
        this._phaseSectionOpen['api'] = true;
        this._editApiId = null;
        this._createApiOpen = true;
    }

    closeCreateApi() {
        this._createApiOpen = false;
    }

    /** Vista sola lettura delle informazioni generali di un'API (embedded). */
    openApiView(api: any) {
        this._phaseSectionOpen['api'] = true;
        this._createApiOpen = false;
        this._editApiStartEdit = false;
        this._editApiId = api.id_api;
    }

    /** Modifica delle informazioni generali di un'API (embedded, in edit). */
    openEditApi(api: any) {
        this._phaseSectionOpen['api'] = true;
        this._createApiOpen = false;
        this._editApiStartEdit = true;
        this._editApiId = api.id_api;
    }

    closeEditApi() {
        this._editApiId = null;
        this._editApiStartEdit = false;
    }

    onApiSaved(_event: any) {
        this._createApiOpen = false;
        this._editApiId = null;
        this._editApiStartEdit = false;
        this.loadServizioApi();
    }

    /** Etichetta tradotta della visibilita` del servizio per il riepilogo info. */
    _visibilitaLabel(): string {
        const v = this.data?.visibilita;
        if (!v) { return this.translate.instant('APP.VISIBILITY.EreditataDominio'); }
        const key = 'APP.VISIBILITY.' + v;
        const t = this.translate.instant(key);
        return (t && t !== key) ? t : v;
    }

    /** Fase "collaudo" saltata quando il servizio ha `skip_collaudo`. */
    getSkippedFasiCodes(): string[] {
        return this.data?.skip_collaudo ? ['collaudo'] : [];
    }

    /** Produzione bloccata finché il servizio non è pubblicato in collaudo,
     *  tranne nel percorso `skip_collaudo` (produzione raggiungibile da bozza). */
    getDisabledFasiCodes(): string[] {
        // Finché il servizio non ha almeno una API non si può passare a Collaudo
        // (né a Produzione): la pubblicazione richiede almeno un'API.
        if (this._apiListLoaded && (this.servizioApiList?.length || 0) === 0) {
            return ['collaudo', 'produzione'];
        }
        if (this.data?.skip_collaudo) { return []; }
        const curIdx = this.workflowStati.indexOf(this.data?.stato);
        const pubCollaudoIdx = this.workflowStati.indexOf('pubblicato_collaudo');
        if (curIdx !== -1 && pubCollaudoIdx !== -1 && curIdx < pubCollaudoIdx) {
            return ['produzione'];
        }
        return [];
    }

    onWorkflowAction(event: any) {
        this.__resetError();
        this.utils.__confirmCambioStatoServizio(event, this.data, this._changeStatus.bind(this));
    }

    _changeStatus(event: any, _service: any) {
        this._changingStatus = true;
        const _url: string = `${this.model}/${this.id}/stato`;
        const _body: any = { stato: event.status.nome };
        this.apiService.saveElement(_url, _body).subscribe({
            next: (response: any) => {
                this.data = { ...response };
                this._changingStatus = false;
                this._initSelectedFase();
                const _status: string = this.translate.instant('APP.WORKFLOW.STATUS.' + this.data.stato);
                const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusSuccess', { status: _status });
                Tools.showMessage(_msg, 'success', true);
                this._updateData = new Date().getTime().toString();
            },
            error: (error: any) => {
                this._changingStatus = false;
                this._error = true;
                this._errorMsg = Tools.WorkflowErrorMsg(error);
                this._errors = Tools.filtraErroriComplessi(error.error?.errori);
                Tools.showMessage(this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusError', { status: this.translate.instant('APP.WORKFLOW.STATUS.' + event.status.nome) }), 'danger', true);
                this._updateData = new Date().getTime().toString();
            }
        });
    }

    private _initBreadcrumb() {
        const _nome: string = this.data?.nome || `${this.id}`;
        const _versione: string = this.data?.versione;
        const title = (_nome && _versione) ? `${_nome} v. ${_versione}` : _nome;
        this.breadcrumbs = [
            { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
            { label: title, url: '', type: 'link' }
        ];
    }

    onBreadcrumb(event: any) {
        if (event?.url) { this.router.navigate([event.url]); }
    }

    // -------------------------------------------------------------------------
    // Top-area — azioni (app-monitor-dropdown), come in servizio-details
    // -------------------------------------------------------------------------

    _canJoin(): boolean {
        const _usePackage = this.data?.package || false;
        return this.authenticationService.canJoin('servizio', this.data?.stato, _usePackage);
    }

    _canMonitoraggioMapper = (): boolean => {
        return this.authenticationService.canMonitoraggio(this._grant?.ruoli);
    }

    /** Abilita/disabilita le azioni in base ai permessi (come servizio-details). */
    _updateOtherActions() {
        const _isGestore = this.authenticationService.isGestore();
        const _canJoin = this._canJoin();
        this._otherActions = this._otherActions.map((item: any) => {
            let _enabled = true;
            switch (item.action) {
                case 'join_service':
                case 'download_service':
                    _enabled = _canJoin;
                    break;
                default:
                    if (item.type === 'divider') { _enabled = _canJoin; }
            }
            let _subMenus: any[] = [];
            if (item.submenus) {
                _subMenus = item.submenus.map((subItem: any) => {
                    let _subEnabled = true;
                    if (subItem.action === 'download_service_extended') { _subEnabled = _isGestore; }
                    return { ...subItem, enabled: _subEnabled };
                });
            }
            const _item = { ...item, enabled: _enabled };
            if (_subMenus.length > 0) { _item.submenus = _subMenus; }
            return _item;
        });
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
                this.router.navigate([`/servizi/${this.data.id_servizio}/view`]);
                break;
            default:
                url = `/servizi/${this.data.id_servizio}/${event.action}`;
                this.router.navigate([url], { queryParamsHandling: 'preserve' });
                break;
        }
    }

    _joinServizio() {
        this.router.navigate(['adesioni', 'new', 'edit'], { queryParams: { id_servizio: this.id } });
    }

    _downloadServizioExport() {
        this._downloading = true;
        this.apiService.download(this.model, this.id, `export`).subscribe({
            next: (response: any) => {
                saveAs(response.body, Tools.GetFilenameFromHeader(response));
                this._downloading = false;
            },
            error: (error: any) => {
                this._downloading = false;
                Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true);
            }
        });
    }

    _downloadServizioEstesoExport() {
        this._downloading = true;
        const aux = this.utils._queryToHttpParams({ id_servizio: [this.id] });
        this.apiService.download(`${this.model}-export`, null, undefined, aux).subscribe({
            next: (response: any) => {
                saveAs(response.body, Tools.GetFilenameFromHeader(response));
                this._downloading = false;
            },
            error: (error: any) => {
                this._downloading = false;
                Tools.showMessage(this.utils.GetErrorMsg(error), 'danger', true);
            }
        });
    }

    _backToDetails() {
        this.router.navigate([this.model, this.id]);
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
    }
}
