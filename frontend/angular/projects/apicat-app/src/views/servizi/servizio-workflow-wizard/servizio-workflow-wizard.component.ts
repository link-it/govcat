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

import { ConfigService, Tools, COMPONENTS_IMPORTS } from '@linkit/components';
import { AllegatiDialogComponent } from '@app/components/allegati-dialog/allegati-dialog.component';
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
        ServizioApiDetailsComponent,
        ServizioApiConfigurationComponent,
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
        api: false
    };

    /** True quando è aperto il form embedded di creazione API in FASE 1. */
    _createApiOpen: boolean = false;
    /** Id API in modifica generale inline (embedded), o null. */
    _editApiId: string | null = null;
    /** Id API di cui si stanno configurando i settaggi per ambiente inline. */
    _configApiId: string | null = null;

    @ViewChild('infoFormRef') infoFormRef?: ServizioInfoFormComponent;

    apiUrl: string = '';

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

    // Gruppi (gestione inline; scelta via ModalGroupChoiceComponent).
    servizioGruppi: any[] = [];

    // API del servizio (erogazione per ambiente collaudo/produzione).
    servizioApiList: any[] = [];

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
    }

    ngOnInit() {
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
                        this._initSelectedFase();
                        this._initBreadcrumb();
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

    /** Imposta la fase visualizzata su quella corrente del workflow. */
    private _initSelectedFase() {
        const stato = this.data?.stato;
        const fase = this.stepWizard.find((s) => s.stati_adesione?.includes(stato));
        this._selectedFase = fase ? fase.code : (this.stepWizard[0]?.code || null);
    }

    /** Fase attualmente visualizzata (selezione utente o fase corrente). */
    get activeFase(): StepWizardItem | null {
        return this.stepWizard.find((s) => s.code === this._selectedFase) || null;
    }

    selectFase(code: string) {
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

    // -------------------------------------------------------------------------
    // FASE 1 — sezioni collassabili + form Informazioni Generali
    // -------------------------------------------------------------------------

    isPhaseSectionOpen(key: string): boolean {
        return !!this._phaseSectionOpen[key];
    }

    togglePhaseSection(key: string) {
        this._phaseSectionOpen[key] = !this._phaseSectionOpen[key];
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
            },
            error: () => { this.servizioApiList = []; }
        });
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

    /** Settaggi per ambiente dell'API inline (embedded config). */
    openApiSettings(api: any) {
        this._configApiId = api.id_api;
    }

    closeApiSettings() {
        this._configApiId = null;
    }

    onApiSettingsSaved(_event: any) {
        this._configApiId = null;
        this.loadServizioApi();
    }

    openApiDetail(api: any) {
        this.router.navigate([this.model, this.id, 'api', api.id_api]);
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

    /** Modifica delle informazioni generali di un'API (embedded, in edit). */
    openEditApi(api: any) {
        this._phaseSectionOpen['api'] = true;
        this._createApiOpen = false;
        this._editApiId = api.id_api;
    }

    closeEditApi() {
        this._editApiId = null;
    }

    onApiSaved(_event: any) {
        this._createApiOpen = false;
        this._editApiId = null;
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

    _backToDetails() {
        this.router.navigate([this.model, this.id]);
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
    }
}
