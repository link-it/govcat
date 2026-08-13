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
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService, Tools, COMPONENTS_IMPORTS } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Grant } from '@app/model/grant';
import { CommonModule } from '@angular/common';

import { WorkflowComponent } from '@app/components/workflow/workflow.component';
import { ErrorViewComponent } from '@app/components/error-view/error-view.component';
import { AdesioneFasiBarComponent } from '@app/views/adesioni/adesione-fasi-bar/adesione-fasi-bar.component';
import { AdesioneSubstepperComponent } from '@app/views/adesioni/adesione-substepper/adesione-substepper.component';
import { StepWizardItem } from '@app/views/adesioni/adesione-step-bar/adesione-step-bar.component';

import {
    STEP_WIZARD_SERVIZIO_FALLBACK,
    STEP_WIZARD_COLLAUDO_SERVIZIO,
    STEP_WIZARD_PRODUZIONE_SERVIZIO,
    WORKFLOW_STATI_SERVIZIO
} from './servizio-wizard.config';

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
        AdesioneSubstepperComponent
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

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
        { label: '...', url: '', type: 'link' }
    ];

    constructor(
        public route: ActivatedRoute,
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly configService: ConfigService,
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService,
        private readonly authenticationService: AuthenticationService
    ) {}

    ngOnInit() {
        this.route.params.subscribe((params) => {
            this.id = params['id'];
            this._loadStepWizard();
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
                        this._initSelectedFase();
                        this._initBreadcrumb();
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

    /** Skeleton: nessuna fase esplicitamente bloccata (tutte navigabili in
     *  anteprima). L'eventuale blocco (es. produzione prima della pubblicazione
     *  in collaudo) sara` definito con il contenuto delle fasi. */
    getDisabledFasiCodes(): string[] {
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
