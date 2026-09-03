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
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService } from 'ngx-bootstrap/modal';

import { ConfigService, Tools, COMPONENTS_IMPORTS } from '@linkit/components';
import { ModalGroupChoiceComponent } from '@app/components/modal-group-choice/modal-group-choice.component';
import { ServizioAllegatoAddFormComponent } from '../servizio-workflow-wizard/servizio-allegato-add-form/servizio-allegato-add-form.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService, RUOLI_ORG_REFERENTE } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { ServizioCreate, Soggetto } from '../servizio-details/servizioCreate';
import { ServizioWizardDraft, emptyServizioWizardDraft, cascadeCreateServizio, cascadeHasErrors, CascadeResult, AllegatoDraft } from '../servizio-workflow-wizard/servizio-wizard-draft';
import { WizardFasiBarComponent } from '@app/components/wizard/wizard-fasi-bar/wizard-fasi-bar.component';
import { StepWizardItem } from '@app/components/wizard/wizard-step-bar/wizard-step-bar.component';

import { concat, forkJoin, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MarkAsteriskDirective } from '@app/directives/mark-asterisk/mark-asterisk.directive';
import { ErrorViewComponent } from '@app/components/error-view/error-view.component';
import { MarkdownModule } from 'ngx-markdown';
import { MapperPipe } from '@app/lib/pipes/mapper.pipe';

/**
 * Step del wizard di creazione (compilazione client-side). A differenza
 * delle fasi di workflow (collaudo/produzione) del servizio, questi step
 * suddividono soltanto la compilazione del form di creazione.
 */
interface WizardStep {
    code: string;
    /** Nomi dei controlli del form appartenenti allo step, usati per la
     *  validazione progressiva (blocco su "Avanti"). */
    controls: string[];
    /** Predicato di visibilita` dello step (es. referenti nascosti se
     *  package, opzioni adesione solo per gestore). */
    visible: () => boolean;
}

@Component({
    selector: 'app-servizio-create-wizard',
    templateUrl: 'servizio-create-wizard.component.html',
    styleUrls: ['servizio-create-wizard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        MarkAsteriskDirective,
        ErrorViewComponent,
        MarkdownModule,
        MapperPipe,
        WizardFasiBarComponent,
        ServizioAllegatoAddFormComponent
    ]
})
export class ServizioCreateWizardComponent implements OnInit {
    static readonly Name = 'ServizioCreateWizardComponent';
    readonly model: string = 'servizi';

    Tools = Tools;

    // In creazione tutti i campi sono editabili e non c'e` grant caricato.
    readonly _isNew: boolean = true;
    readonly _isEdit: boolean = true;
    _grant: any = null;
    _updateData: string = '';

    _formGroup: FormGroup = new FormGroup({});
    _dataCreate: ServizioCreate = new ServizioCreate({});
    data: any = null;
    config: any = null;
    appConfig: any;
    apiUrl: string = '';
    anagrafiche: any = {};

    _spin: boolean = true;
    _submitting: boolean = false;

    _error: boolean = false;
    _errorMsg: string = '';
    _errors: any[] = [];

    // Evolutiva: draft del wizard (servizio + sotto-risorse) per il salvataggio
    // a cascata. Le sotto-risorse vengono raccolte in draftMode e persistite
    // dopo la POST del servizio.
    _draft: ServizioWizardDraft = emptyServizioWizardDraft();
    // Gruppi selezionati in creazione (oggetti gruppo per il display; gli id
    // finiscono in `_draft.gruppi` al submit).
    _selectedGruppi: any[] = [];
    // Allegati raccolti in creazione (draftMode base64); confluiscono in
    // `_draft.allegati` al submit e vengono inviati a cascata.
    _selectedAllegati: AllegatoDraft[] = [];
    _addAllegatoOpen: boolean = false;
    // Riepilogo (best-effort): servizio creato ma sotto-risorse non salvate.
    _cascadeWarnings: { step: string; count: number }[] = [];
    _cascadeIdServizio: string | null = null;

    // Barra fasi (statica) in cima alla creazione, stile nuova adesione:
    // FASE 1 (Informazioni generali) attiva = creazione; API/Collaudo/Produzione
    // in attesa (lucchetto). Label da `APP.SERVICES.WIZARD.PHASE.<code>`.
    readonly _fasiBarSteps: StepWizardItem[] = [
        { code: 'info_generali', descrizione: 'Informazioni Generali', stati_adesione: ['creazione'] },
        { code: 'collaudo', descrizione: 'Collaudo', stati_adesione: [] },
        { code: 'produzione', descrizione: 'Produzione', stati_adesione: [] }
    ];
    readonly _fasiCurrent = 'creazione';
    _showFasiBar: boolean = true;

    // Etichette dei campi che bloccano l'avanzamento allo step successivo.
    _stepErrorLabels: string[] = [];

    // Mappa control -> chiave i18n dell'etichetta (per il messaggio di blocco).
    _controlLabels: { [k: string]: string } = {
        tipo: 'APP.LABEL.tipo',
        nome: 'APP.LABEL.nome',
        versione: 'APP.LABEL.versione',
        id_dominio: 'APP.LABEL.id_dominio',
        visibilita: 'APP.LABEL.VisibilitaServizio',
        classi: 'APP.LABEL.classi',
        id_organizzazione_interna: 'APP.LABEL.EnteErogatore',
        id_soggetto_erogatore: 'APP.LABEL.SoggettoErogatore',
        referente: 'APP.LABEL.referente',
        referente_tecnico: 'APP.LABEL.referente_tecnico',
        descrizione_sintetica: 'APP.LABEL.DescrizioneSintetica',
        descrizione: 'APP.LABEL.DocumentazioneTecnica',
        termini_ricerca: 'APP.LABEL.termini_ricerca',
        note: 'APP.LABEL.note'
    };

    _showMarkdownPreview: boolean = false;

    _imagePlaceHolder: string = './assets/images/logo-placeholder.png';
    _maxImageSize: number = (Tools.Configurazione?.servizio?.max_image_size || 2) * 1024 * 1024;

    minLengthTerm = 1;
    generalConfig: any = Tools.Configurazione || null;

    hasServiziApi: boolean = false;
    hasGenerico: boolean = false;
    _hasMultiDominio: boolean = false;
    _multiDominioEmail: string | null = null;
    _hasFlagConsentiNonSottoscrivibile: boolean = false;
    _hasAdesioniMultiple: boolean = false;

    _isFruizione: boolean = false;
    showReferenti: boolean = true;

    // create-only: nessuna API/componente ancora associata
    hasApi: boolean = false;
    hasComponenti: boolean = false;

    _tipiVisibilitaServizio: any[] = [
        { label: 'EreditataDominio ', value: null },
        ...Tools.TipiVisibilitaServizio
    ];

    _tipiServizio = [
        { label: 'API', value: 'API', enabled: true },
        { label: 'Generico', value: 'Generico', enabled: true }
    ];

    // Select con typeahead (stessa logica del form classico)
    domini$!: Observable<any[]>;
    dominiInput$ = new Subject<string>();
    dominiLoading: boolean = false;
    selectedDominio: any;

    referenti$!: Observable<any[]>;
    referentiInput$ = new Subject<string>();
    referentiLoading: boolean = false;

    referentiTecnici$!: Observable<any[]>;
    referentiTecniciInput$ = new Subject<string>();
    referentiTecniciLoading: boolean = false;

    // Oggetti utente selezionati (per mostrare i nomi nel riepilogo).
    selectedReferente: any = null;
    selectedReferenteTecnico: any = null;

    organizzazioniInterne$!: Observable<any[]>;
    organizzazioniInterneInput$ = new Subject<string>();
    organizzazioniInterneLoading: boolean = false;
    selectedOrganizzazione: any;
    selectedSoggetto: any;

    _disabled_id_soggetto: any = null;
    _hideSoggettoDropdown: boolean = true;
    _elencoSoggetti: any[] = [];

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
        { label: 'APP.SERVICES.WIZARD.Title', url: '', type: 'link' }
    ];

    // Definizione degli step del wizard di compilazione.
    _steps: WizardStep[] = [
        { code: 'identita', controls: ['tipo', 'nome', 'versione', 'id_dominio'], visible: () => true },
        { code: 'classificazione', controls: ['visibilita', 'classi', 'package', 'fruizione', 'id_organizzazione_interna', 'id_soggetto_erogatore'], visible: () => true },
        { code: 'referenti', controls: ['referente', 'referente_tecnico'], visible: () => this.showReferenti },
        { code: 'descrizione', controls: ['descrizione_sintetica', 'descrizione', 'tags', 'termini_ricerca', 'note'], visible: () => true },
        { code: 'adesione', controls: ['adesione_disabilitata', 'multi_adesione', 'skip_collaudo'], visible: () => this._isGestore() },
        { code: 'gruppi', controls: [], visible: () => true },
        { code: 'riepilogo', controls: [], visible: () => true }
    ];
    _currentStepCode: string = 'identita';

    constructor(
        public route: ActivatedRoute,
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly configService: ConfigService,
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService,
        private readonly authenticationService: AuthenticationService,
        private readonly modalService: BsModalService
    ) {
        this.appConfig = this.configService.getConfiguration();
        this.apiUrl = this.appConfig.AppConfig.GOVAPI.HOST;

        const servizio = this.authenticationService._getConfigModule('servizio');
        this.hasServiziApi = servizio?.api?.abilitato || false;
        this.hasGenerico = servizio?.generico?.abilitato || false;
        this._tipiServizio.forEach((ts: any) => {
            ts.enabled = (ts.value === 'API' && this.hasServiziApi) || (ts.value === 'Generico' && this.hasGenerico);
        });

        this._hasMultiDominio = Tools.Configurazione?.dominio?.multi_dominio || false;
        this._multiDominioEmail = Tools.Configurazione?.dominio?.multi_dominio?.email || null;
        this._hasFlagConsentiNonSottoscrivibile = Tools.Configurazione?.servizio?.consenti_non_sottoscrivibile || false;
        this._hasAdesioniMultiple = Tools.Configurazione?.servizio?.adesioni_multiple || false;
    }

    ngOnInit() {
        this.loadAnagrafiche();

        if (this._isGestore()) {
            this._tipiVisibilitaServizio = [...this._tipiVisibilitaServizio, { value: 'componente', label: 'componente' }];
        }

        this.configService.getConfig(this.model).subscribe((config: any) => {
            this.config = config;
            this.data = this._dataCreate;
            this._initForm({ ...this._dataCreate });
            this._initDominiSelect([]);
            this._initReferentiSelect([]);
            this._initReferentiTecniciSelect([]);
            this._initOrganizzazioniInterneSelect([]);
            // In multi-dominio, disabilita i referenti finche` non viene selezionato un dominio
            if (this._hasMultiDominio) {
                this._formGroup.get('referente')?.disable();
                this._formGroup.get('referente_tecnico')?.disable();
            }
            this._spin = false;
        });
    }

    // -------------------------------------------------------------------------
    // Navigazione step
    // -------------------------------------------------------------------------

    get visibleSteps(): WizardStep[] {
        return this._steps.filter((s) => s.visible());
    }

    get currentStepIndex(): number {
        return this.visibleSteps.findIndex((s) => s.code === this._currentStepCode);
    }

    get isFirstStep(): boolean {
        return this.currentStepIndex <= 0;
    }

    get isLastStep(): boolean {
        return this.currentStepIndex === this.visibleSteps.length - 1;
    }

    isStepDone(code: string): boolean {
        const idx = this.visibleSteps.findIndex((s) => s.code === code);
        if (idx === -1 || idx >= this.currentStepIndex) { return false; }
        return this._isStepComplete(this.visibleSteps[idx]);
    }

    isStepCurrent(code: string): boolean {
        return code === this._currentStepCode;
    }

    /** Uno step e` cliccabile se e` quello corrente, uno precedente, oppure
     *  uno successivo raggiungibile (tutti gli step precedenti completi). */
    _isStepClickable(code: string): boolean {
        const target = this.visibleSteps.findIndex((s) => s.code === code);
        if (target === -1) { return false; }
        if (target <= this.currentStepIndex) { return true; }
        return this._canReachStep(target);
    }

    /** True se tutti gli step con indice < targetIndex sono completi. */
    private _canReachStep(targetIndex: number): boolean {
        for (let i = 0; i < targetIndex; i++) {
            if (!this._isStepComplete(this.visibleSteps[i])) { return false; }
        }
        return true;
    }

    /** Uno step e` "completo" se tutti i suoi controlli (con le regole di
     *  skip) sono validi. Base per abilitare il salto agli step successivi. */
    _isStepComplete(step: WizardStep): boolean {
        return step.controls.every((name) => {
            if (name === 'id_dominio' && !this._hasMultiDominio) { return true; }
            const ctrl = this._formGroup.get(name);
            if (!ctrl || ctrl.disabled) { return true; }
            return ctrl.valid;
        });
    }

    _goToStep(code: string) {
        const steps = this.visibleSteps;
        const target = steps.findIndex((s) => s.code === code);
        if (target === -1 || target === this.currentStepIndex) { return; }

        // Indietro: sempre consentito.
        if (target < this.currentStepIndex) {
            this.__resetError();
            this._showMarkdownPreview = false;
            this._currentStepCode = code;
            return;
        }

        // Avanti: tutti gli step dallo corrente fino a target-1 devono essere
        // validi. Al primo incompleto ci si ferma mostrandone gli errori.
        for (let i = this.currentStepIndex; i < target; i++) {
            if (!this._validateStep(steps[i])) {
                this._showMarkdownPreview = false;
                this._currentStepCode = steps[i].code;
                return;
            }
        }
        this.__resetError();
        this._showMarkdownPreview = false;
        this._currentStepCode = code;
    }

    /** Azione del pulsante primario: avanti o, sull'ultimo step, submit. */
    _onPrimaryAction() {
        if (this.isLastStep) {
            this._onSubmit();
        } else {
            this.next();
        }
    }

    next() {
        if (!this._validateCurrentStep()) { return; }
        const steps = this.visibleSteps;
        const idx = this.currentStepIndex;
        if (idx < steps.length - 1) {
            this.__resetError();
            this._showMarkdownPreview = false;
            this._currentStepCode = steps[idx + 1].code;
        }
    }

    back() {
        const steps = this.visibleSteps;
        const idx = this.currentStepIndex;
        if (idx > 0) {
            this.__resetError();
            this._showMarkdownPreview = false;
            this._currentStepCode = steps[idx - 1].code;
        }
    }

    private _validateCurrentStep(): boolean {
        return this._validateStep(this.visibleSteps[this.currentStepIndex]);
    }

    /**
     * Marca i controlli dello step come touched, ne verifica la validita` e
     * popola `_stepErrorLabels` con le etichette dei campi non validi (per il
     * messaggio di blocco visibile). Ritorna true se lo step e` valido.
     */
    private _validateStep(step: WizardStep | undefined): boolean {
        this._stepErrorLabels = [];
        if (!step) { return true; }
        step.controls.forEach((name) => {
            // `id_dominio` e` obbligatorio ma, senza multi-dominio, e` nascosto
            // e valorizzato dal dominio di default: non deve bloccare in modo
            // invisibile lo step.
            if (name === 'id_dominio' && !this._hasMultiDominio) { return; }
            const ctrl = this._formGroup.get(name);
            if (!ctrl || ctrl.disabled) { return; }
            ctrl.markAsTouched();
            ctrl.updateValueAndValidity();
            if (ctrl.invalid) {
                const key = this._controlLabels[name];
                this._stepErrorLabels.push(key ? this.translate.instant(key) : name);
            }
        });
        return this._stepErrorLabels.length === 0;
    }

    // -------------------------------------------------------------------------
    // Form (variante create di ServizioDetailsComponent)
    // -------------------------------------------------------------------------

    get f(): { [key: string]: AbstractControl } {
        return this._formGroup.controls;
    }

    _hasControlError(name: string) {
        return !!(this.f[name]?.errors && this.f[name]?.touched);
    }

    _isVisibilita(type: string) {
        return this.f['visibilita']?.value === type;
    }

    get isComponente() {
        return this._formGroup.get('visibilita')?.value === 'componente' || false;
    }

    _isReferenteRequired(): boolean {
        const _cambioStato = this.authenticationService._getWorkflowCambiStato('servizio', 'bozza');
        return !!_cambioStato?.dati_obbligatori?.includes('referenti');
    }

    _initForm(data: any = null) {
        if (!data) { return; }
        const _group: any = {};
        Object.keys(data).forEach((key) => {
            let value: any = '';
            let boolValue = false;
            switch (key) {
                case 'referente':
                    value = data[key] ? data[key] : null;
                    _group[key] = new FormControl(value, this._isReferenteRequired() ? [Validators.required] : []);
                    break;
                case 'versione':
                    value = data[key] ? data[key] : '';
                    _group[key] = new FormControl(value, [Validators.required, Validators.pattern('^[1-9][0-9]*$')]);
                    break;
                case 'nome':
                case 'descrizione_sintetica':
                    value = data[key] ? data[key] : null;
                    _group[key] = new FormControl(value, [Validators.required, Validators.maxLength(255)]);
                    break;
                case 'descrizione':
                    value = data[key] ? data[key] : null;
                    _group[key] = new FormControl(value, [Validators.maxLength(4000)]);
                    break;
                case 'note':
                    value = data[key] ? data[key] : null;
                    _group[key] = new FormControl(value, [Validators.maxLength(1000)]);
                    break;
                case 'termini_ricerca':
                    value = data[key] ? data[key] : null;
                    _group[key] = new FormControl(value, [Validators.maxLength(255)]);
                    break;
                case 'multi_adesione':
                    value = data[key] ? data[key] : false;
                    _group[key] = new FormControl({ value: value, disabled: true }, [Validators.required]);
                    break;
                case 'id_dominio':
                    value = data['dominio'] ? data['dominio'].id_dominio : this.generalConfig?.dominio?.dominio_default;
                    _group[key] = new FormControl(value, [Validators.required]);
                    break;
                case 'classi':
                    value = data[key] ? data[key] : [];
                    _group[key] = new FormControl(value, []);
                    break;
                case 'skip_collaudo':
                    value = data[key] ? data[key] : false;
                    _group[key] = new FormControl(value, []);
                    break;
                case 'adesione_disabilitata':
                case 'fruizione':
                    boolValue = data[key] ? data[key] : false;
                    _group[key] = new FormControl(boolValue, []);
                    break;
                default:
                    value = data[key] ? data[key] : null;
                    _group[key] = new FormControl(value, []);
                    break;
            }
        });
        this._formGroup = new FormGroup(_group);

        const controls: any = this._formGroup.controls;
        if (this._isVisibilita('riservato')) {
            controls.classi.setValidators(Validators.required);
        } else {
            controls.classi.clearValidators();
        }
        controls.classi.updateValueAndValidity();

        this.updateTipiVisibilitaServizio();
        this.enableDisableControlPackage();
        this.enableDisableControlAdesioneConsentita();
        // skip_collaudo abilitato solo con dominio compatibile: in creazione,
        // finche` non si seleziona un dominio, resta disabilitato.
        this._formGroup.get('skip_collaudo')?.disable();
    }

    updateTipiVisibilitaServizio() {
        const _origTipiVisibilitaServizio = [
            { label: 'EreditataDominio', value: null },
            ...Tools.TipiVisibilitaServizio
        ];
        const _isPackage = this._formGroup.get('package')?.value || false;
        if (_isPackage) {
            this._tipiVisibilitaServizio = [..._origTipiVisibilitaServizio];
        } else if (this._isGestore()) {
            this._tipiVisibilitaServizio = [..._origTipiVisibilitaServizio, { value: 'componente', label: 'componente' }];
        }
    }

    enableDisableControlPackage() {
        if (this.hasApi || this.hasComponenti) {
            this._formGroup.get('package')?.disable();
        } else if (this.isComponente) {
            this._formGroup.get('package')?.disable();
        } else {
            this._formGroup.get('package')?.enable();
        }
        this._formGroup.get('package')?.updateValueAndValidity();
    }

    enableDisableControlAdesioneConsentita() {
        if (this.isComponente) {
            this._formGroup.get('adesione_disabilitata')?.setValue(false);
            this._formGroup.get('adesione_disabilitata')?.disable();
        } else {
            this._formGroup.get('adesione_disabilitata')?.enable();
        }
        this._formGroup.get('adesione_disabilitata')?.updateValueAndValidity();
    }

    _enableDisableSkipCollaudo(dominio: any) {
        if (dominio?.skip_collaudo) {
            if (this.data?.vincola_skip_collaudo) {
                this._formGroup.get('skip_collaudo')?.disable();
            } else {
                this._formGroup.get('skip_collaudo')?.enable();
            }
        } else {
            this._formGroup.get('skip_collaudo')?.setValue(false);
            this._formGroup.get('skip_collaudo')?.disable();
        }
    }

    // -------------------------------------------------------------------------
    // Handlers campi
    // -------------------------------------------------------------------------

    _onChangeType(_event: any) {}

    _onChangeDominio(event: any) {
        this.selectedDominio = event;
        this._enableDisableSkipCollaudo(this.selectedDominio);
        this._formGroup.get('referente')?.setValue(null);
        this._formGroup.get('referente_tecnico')?.setValue(null);
        this.selectedReferente = null;
        this.selectedReferenteTecnico = null;
        if (this.selectedDominio) {
            this._formGroup.get('referente')?.enable();
            this._formGroup.get('referente_tecnico')?.enable();
        } else {
            this._formGroup.get('referente')?.disable();
            this._formGroup.get('referente_tecnico')?.disable();
        }
        this._initReferentiSelect([]);
        this._initReferentiTecniciSelect([]);
    }

    _onChangeVisibilita(event: any) {
        const controls: any = this._formGroup.controls;
        controls.classi.reset();
        if (event.target.value === 'riservato') {
            controls.classi.setValidators(Validators.required);
        } else {
            controls.classi.setValue([]);
            controls.classi.clearValidators();
        }
        controls.classi.updateValueAndValidity();
        this.enableDisableControlPackage();
        this.enableDisableControlAdesioneConsentita();
    }

    _onChangeFruizione(event: any) {
        this._isFruizione = event.target.checked;
        if (!this._isFruizione) {
            this._formGroup.get('id_organizzazione_interna')?.setValue(null);
            this._formGroup.get('id_soggetto_erogatore')?.setValue(null);
        }
        this._formGroup.get('id_organizzazione_interna')?.setValidators(this._isFruizione ? [Validators.required] : null);
        this._formGroup.get('id_organizzazione_interna')?.updateValueAndValidity();
        this._formGroup.get('id_soggetto_erogatore')?.setValidators(this._isFruizione ? [Validators.required] : null);
        this._formGroup.get('id_soggetto_erogatore')?.updateValueAndValidity();
    }

    _onChangePackage(_event: any) {
        const controls: any = this._formGroup.controls;
        if (controls.package.value) {
            controls.referente.clearValidators();
            controls.referente.setValue(null);
            controls.referente.updateValueAndValidity();
            this.showReferenti = false;
        } else {
            controls.referente.setValidators(Validators.required);
            controls.referente.updateValueAndValidity();
            this.showReferenti = true;
        }
        this.updateTipiVisibilitaServizio();
        controls.visibilita.setValue(null);
    }

    onChangeSelect(event: any, param: string) {
        if (param === 'organizzazione') {
            this.selectedOrganizzazione = event;
            this._checkSoggetto(event);
        }
        if (param === 'soggetto') { this.selectedSoggetto = event; }
    }

    onChangeReferente(event: any) { this.selectedReferente = event || null; }
    onChangeReferenteTecnico(event: any) { this.selectedReferenteTecnico = event || null; }

    _checkSoggetto(event: any) {
        if (event) {
            const _referente = !this.selectedOrganizzazione?.intermediata;
            this.getSoggetti(null, _referente).subscribe({
                next: (result) => {
                    const controls = this._formGroup.controls;
                    if (result.length === 1) {
                        this._hideSoggettoDropdown = true;
                        const aux: Soggetto = {
                            aderente: result[0].aderente,
                            id_soggetto: result[0].id_soggetto,
                            nome: result[0].nome,
                            organizzazione: result[0].organizzazione,
                            referente: result[0].referente,
                        };
                        controls.id_soggetto_erogatore.patchValue(aux.id_soggetto);
                        controls.id_soggetto_erogatore.disable();
                        this._disabled_id_soggetto = aux.id_soggetto;
                    } else {
                        const _hasChoice = result.length > 1;
                        this._elencoSoggetti = [...result];
                        controls.id_soggetto_erogatore.enable();
                        controls.id_soggetto_erogatore.updateValueAndValidity();
                        this._disabled_id_soggetto = null;
                        this._hideSoggettoDropdown = !_hasChoice;
                    }
                    this._formGroup.updateValueAndValidity();
                },
                error: (err) => console.log(err)
            });
        } else {
            const controls = this._formGroup.controls;
            controls.id_soggetto_erogatore.patchValue(null);
            this._formGroup.updateValueAndValidity();
            this._elencoSoggetti = [];
            this._hideSoggettoDropdown = true;
        }
    }

    _onImageLoaded(event: any) {
        if (event) {
            const _split = event.split(',');
            const _type = _split[0].split(';')[0].replace('data:', '');
            const _content = _split[1];
            this._formGroup.get('immagine')?.setValue({ content_type: _type, content: _content });
        } else {
            this._formGroup.get('immagine')?.setValue(null);
        }
    }

    /** True se nel form e` presente un'immagine caricata (con contenuto base64). */
    get _hasImmagine(): boolean {
        const img = this.f['immagine']?.value;
        return !!(img && img.content);
    }

    /** Ricostruisce il data URL dell'immagine dal valore del control, per
     *  ripristinare la preview di `app-photo-base64` quando lo step viene
     *  ricreato tornando indietro nel wizard. */
    get _immagineDataUrl(): string {
        const img = this.f['immagine']?.value;
        if (img && img.content && img.content_type) {
            return `data:${img.content_type};base64,${img.content}`;
        }
        return '';
    }

    _compareClassiFn(item: any, selected: any) {
        return item.id_classe_utente === selected.id_classe_utente;
    }

    _toggleMarkdownPreview() {
        this._showMarkdownPreview = !this._showMarkdownPreview;
    }

    _userFullName(user: any): string {
        return [user?.nome, user?.cognome].filter(Boolean).join(' ');
    }

    // -------------------------------------------------------------------------
    // Select data-loading (identico al form classico)
    // -------------------------------------------------------------------------

    getDomini(term: string | null = null): Observable<any> {
        const _options: any = term ? { params: { q: term } } : { params: {} };
        if (!this.authenticationService.isGestore()) {
            _options.params.deprecato = false;
        }
        return this.apiService.getList('domini', _options).pipe(
            map((resp) => {
                if (resp.Error) { throwError(() => resp.Error); return []; }
                return resp.content.map((item: any) => item);
            })
        );
    }

    getUtenti(term: string | null = null, role: string | null = null, stato: string = 'abilitato', ruoliOrganizzazione: string[] = []): Observable<any> {
        const _options: any = { params: {} };
        if (term) { _options.params.q = term; }
        if (role) { _options.params.ruolo = role; }
        if (stato) { _options.params.stato = stato; }

        const _idOrgDominio = this.selectedDominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
        if (ruoliOrganizzazione?.length) {
            if (_idOrgDominio) {
                _options.params.id_organizzazione = _idOrgDominio;
                _options.params.ruolo_organizzazione = ruoliOrganizzazione;
            }
        } else if (!this._isFruizione && _idOrgDominio) {
            _options.params.id_organizzazione = _idOrgDominio;
        }

        return this.apiService.getList('utenti', _options).pipe(
            map((resp) => {
                if (resp.Error) { throwError(() => resp.Error); return []; }
                return resp.content.map((item: any) => {
                    item.nome_completo = `${item.nome} ${item.cognome}`;
                    return item;
                });
            })
        );
    }

    getOrganizzazioni(term: string | null): Observable<any> {
        const _params: any = {};
        if (term) { _params.q = term; }
        const _referenti$ = this.apiService.getList('organizzazioni/all', { params: { ..._params, referente: true } });
        const _intermediate$ = this.apiService.getList('organizzazioni/all', { params: { ..._params, intermediata: true } });
        return forkJoin([_referenti$, _intermediate$]).pipe(
            map(([_resp1, _resp2]: any[]) => {
                const _merged = [...(_resp1?.content || []), ...(_resp2?.content || [])];
                const _seen = new Set<any>();
                return _merged.filter((org: any) => {
                    if (_seen.has(org.id_organizzazione)) { return false; }
                    _seen.add(org.id_organizzazione);
                    return true;
                });
            })
        );
    }

    getSoggetti(term: string | null = null, referente: boolean = false): Observable<any> {
        let _options: any;
        if (this.selectedOrganizzazione?.id_organizzazione) {
            _options = { params: { id_organizzazione: this.selectedOrganizzazione?.id_organizzazione } };
        } else {
            _options = { params: { q: term } };
        }
        if (referente) { _options.params.referente = referente; }
        return this.apiService.getList('soggetti', _options).pipe(
            map((resp) => {
                if (resp.Error) { throwError(() => resp.Error); return []; }
                return resp.content.map((item: any) => item);
            })
        );
    }

    _initDominiSelect(defaultValue: any[] = []) {
        this.domini$ = concat(
            of(defaultValue),
            this.dominiInput$.pipe(
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.dominiLoading = true),
                switchMap((term: any) => this.getDomini(term).pipe(
                    catchError(() => of([])),
                    tap(() => this.dominiLoading = false)
                ))
            )
        );
    }

    _initReferentiSelect(defaultValue: any[] = []) {
        this.referenti$ = concat(
            of(defaultValue),
            this.referentiInput$.pipe(
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.referentiLoading = true),
                switchMap((term: any) => {
                    if (this._hasMultiDominio && !this.selectedDominio) {
                        this.referentiLoading = false;
                        return of([]);
                    }
                    return this.getUtenti(term, null, 'abilitato', RUOLI_ORG_REFERENTE).pipe(
                        catchError(() => of([])),
                        tap(() => this.referentiLoading = false)
                    );
                })
            )
        );
    }

    _initReferentiTecniciSelect(defaultValue: any[] = []) {
        this.referentiTecnici$ = concat(
            of(defaultValue),
            this.referentiTecniciInput$.pipe(
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.referentiTecniciLoading = true),
                switchMap((term: any) => {
                    if (this._hasMultiDominio && !this.selectedDominio) {
                        this.referentiTecniciLoading = false;
                        return of([]);
                    }
                    return this.getUtenti(term, null, 'abilitato', RUOLI_ORG_REFERENTE).pipe(
                        catchError(() => of([])),
                        tap(() => this.referentiTecniciLoading = false)
                    );
                })
            )
        );
    }

    _initOrganizzazioniInterneSelect(defaultValue: any[] = []) {
        this.organizzazioniInterne$ = concat(
            of(defaultValue),
            this.organizzazioniInterneInput$.pipe(
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.organizzazioniInterneLoading = true),
                switchMap((term: any) => this.getOrganizzazioni(term).pipe(
                    catchError(() => of([])),
                    tap(() => this.organizzazioniInterneLoading = false)
                ))
            )
        );
    }

    async loadAnagrafiche() {
        const tables: any[] = ['classi-utente', 'gruppi', 'tags', 'tassonomie'];
        this.anagrafiche = await this.utils.getAnagrafiche(tables);
    }

    // -------------------------------------------------------------------------
    // Submit
    // -------------------------------------------------------------------------

    _prepareBodySaveServizio(body: any) {
        const _classi: any[] = body.classi || [];
        const _newBody: any = {
            tipo: body.tipo || null,
            nome: body.nome || null,
            versione: body.versione || '1',
            id_dominio: body.id_dominio || this.generalConfig.dominio.dominio_default,
            descrizione_sintetica: body.descrizione_sintetica || null,
            descrizione: body.descrizione || null,
            termini_ricerca: body.termini_ricerca || null,
            multi_adesione: body.multi_adesione || false,
            visibilita: (body.visibilita === 'null') ? null : body.visibilita,
            classi: _classi,
            note: body.note || null,
            immagine: body.immagine,
            adesione_disabilitata: body.adesione_disabilitata || false,
            id_soggetto_erogatore: body.id_soggetto_erogatore || null,
            package: body.package || false,
            skip_collaudo: body.skip_collaudo || false,
            fruizione: body.fruizione || false,
        };

        if (!body.package) {
            _newBody.referenti = [];
            if (body.referente) {
                _newBody.referenti.push({ id_utente: body.referente, tipo: 'referente' });
            }
            if (body.referente_tecnico) {
                _newBody.referenti.push({ id_utente: body.referente_tecnico, tipo: 'referente_tecnico' });
            }
        }

        if (body.tags && Array.isArray(body.tags)) {
            _newBody.tags = body.tags;
        }
        _newBody.taxonomies = [];

        return _newBody;
    }

    _onSubmit() {
        // Rivalida l'intero form come rete di sicurezza.
        this._formGroup.markAllAsTouched();
        if (this._formGroup.invalid) {
            this._error = true;
            this._errorMsg = this.translate.instant('APP.MESSAGE.VALIDATION.FormInvalid');
            // Riporta l'utente al primo step con errori.
            const firstInvalid = this.visibleSteps.find((s) => s.controls.some((c) => this._formGroup.get(c)?.invalid));
            if (firstInvalid) { this._currentStepCode = firstInvalid.code; }
            return;
        }

        this.__resetError();
        const _body = this._prepareBodySaveServizio(this._formGroup.getRawValue());
        // Evolutiva: salvataggio a cascata (best-effort) sul draft: servizio +
        // gruppi + allegati (raccolti in draftMode). Le API restano FASE 2 sul
        // servizio reale.
        this._draft = {
            ...emptyServizioWizardDraft(),
            servizio: _body,
            gruppi: this._selectedGruppi.map((g) => g.id_gruppo),
            allegati: this._selectedAllegati
        };
        this._submitting = true;
        cascadeCreateServizio(this.apiService, this._draft).subscribe({
            next: (result: CascadeResult) => {
                this._submitting = false;
                if (!result.idServizio) {
                    // Servizio non creato: errore bloccante.
                    const srvErr: any = result.items.find((i) => i.step === 'servizio')?.error;
                    this._error = true;
                    this._errorMsg = srvErr ? this.utils.GetErrorMsg(srvErr) : this.translate.instant('APP.MESSAGE.ERROR.Default');
                    this._errors = Tools.filtraErroriComplessi(srvErr?.error?.errori);
                    return;
                }
                if (cascadeHasErrors(result)) {
                    // Best-effort: il servizio e' creato ma alcune sotto-risorse no.
                    // Non navighiamo subito: mostriamo un riepilogo non bloccante e
                    // lasciamo all'utente il proseguimento verso il servizio.
                    this._cascadeIdServizio = result.idServizio;
                    this._cascadeWarnings = this._buildCascadeWarnings(result);
                    return;
                }
                // Opzione A: servizio creato (bozza) -> dettaglio (ora wizard),
                // posizionato sulla FASE 2 API dove l'utente inserisce le API.
                this.router.navigate([this.model, result.idServizio], { replaceUrl: true, queryParams: { fase: 'api' } });
            }
        });
    }

    /** Raggruppa le sotto-risorse fallite della cascata per tipo, con conteggio. */
    private _buildCascadeWarnings(result: CascadeResult): { step: string; count: number }[] {
        const byStep = new Map<string, number>();
        result.items.filter((i) => !i.ok).forEach((i) => byStep.set(i.step, (byStep.get(i.step) || 0) + 1));
        return Array.from(byStep.entries()).map(([step, count]) => ({ step, count }));
    }

    /** Prosegue verso il servizio creato (FASE 2 API) dopo il riepilogo avvisi. */
    _proceedAfterWarnings() {
        if (!this._cascadeIdServizio) { return; }
        this.router.navigate([this.model, this._cascadeIdServizio], { replaceUrl: true, queryParams: { fase: 'api' } });
    }

    // -------------------------------------------------------------------------
    // Evolutiva — Gruppi (raccolti in creazione, salvati in cascata)
    // -------------------------------------------------------------------------

    gruppoLogo(g: any): string {
        return g?.immagine ? `${this.apiUrl}/gruppi/${g.id_gruppo}/immagine` : '';
    }

    openAddGruppo() {
        const initialState = { gruppi: [], selected: [], notSelectable: this._selectedGruppi };
        const ref = this.modalService.show(ModalGroupChoiceComponent, { ignoreBackdropClick: true, initialState });
        ref.content?.onClose?.subscribe((result: any) => {
            const g = result?.[0];
            if (!g?.id_gruppo) { return; }
            if (this._selectedGruppi.some((x) => x.id_gruppo === g.id_gruppo)) { return; }
            this._selectedGruppi = [...this._selectedGruppi, g];
        });
    }

    removeGruppo(g: any) {
        this._selectedGruppi = this._selectedGruppi.filter((x) => x.id_gruppo !== g.id_gruppo);
    }

    // -------------------------------------------------------------------------
    // Evolutiva — Allegati (raccolti in creazione via dialog in draftMode)
    // -------------------------------------------------------------------------

    /** Apre la form INLINE di aggiunta allegato (draftMode). */
    openAddAllegato() {
        this._addAllegatoOpen = true;
    }

    closeAddAllegato() {
        this._addAllegatoOpen = false;
    }

    /** La form inline (draftMode) emette `{ allegati }`: li accumulo nel draft. */
    onAllegatoAdded(result: any) {
        const nuovi: AllegatoDraft[] = result?.allegati || [];
        if (nuovi.length) { this._selectedAllegati = [...this._selectedAllegati, ...nuovi]; }
        this._addAllegatoOpen = false;
    }

    removeAllegato(index: number) {
        this._selectedAllegati = this._selectedAllegati.filter((_, i) => i !== index);
    }

    _onCancel() {
        this.router.navigate([this.model]);
    }

    onBreadcrumb(event: any) {
        if (event?.url) {
            this.router.navigate([event.url]);
        }
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
        this._stepErrorLabels = [];
    }

    // -------------------------------------------------------------------------
    // Permessi / mappers
    // -------------------------------------------------------------------------

    _isGestore() {
        return this.authenticationService.isGestore();
    }

    _isGestoreMapper = (): boolean => {
        return this.authenticationService.isGestore(this._grant?.ruoli);
    }

    _canSetFruizioneMapper = (): boolean => {
        if (this.authenticationService.isGestore(this._grant?.ruoli)) { return true; }
        const _orgReferente = !!this.authenticationService.getCurrentOrganization()?.referente;
        return _orgReferente && (
            this.authenticationService.isAmministratoreOrganizzazione() ||
            this.authenticationService.isOperatoreApi()
        );
    }

    // Etichette step per la summary
    _stepLabel(code: string): string {
        return this.translate.instant('APP.SERVICES.WIZARD.STEP.' + code);
    }

    // -------------------------------------------------------------------------
    // Riepilogo — risoluzione valori leggibili
    // -------------------------------------------------------------------------

    _summaryText(name: string): string {
        const v = this.f[name]?.value;
        return (v !== null && v !== undefined && v !== '') ? v : '-';
    }

    _summaryBool(name: string): string {
        return this.translate.instant(this.f[name]?.value ? 'APP.BOOLEAN.Yes' : 'APP.BOOLEAN.No');
    }

    _summaryDominio(): string {
        if (this.selectedDominio) {
            const org = this.selectedDominio.soggetto_referente?.organizzazione?.nome;
            return (org ? org + ' - ' : '') + (this.selectedDominio.nome || '');
        }
        return this.f['id_dominio']?.value || '-';
    }

    _summaryVisibilita(): string {
        const v = this.f['visibilita']?.value;
        if (!v || v === 'null') {
            return this.translate.instant('APP.VISIBILITY.EreditataDominio');
        }
        const key = 'APP.VISIBILITY.' + v;
        const t = this.translate.instant(key);
        return (t && t !== key) ? t : v;
    }

    _summaryClassi(): string {
        const ids: any[] = this.f['classi']?.value || [];
        if (!ids.length) { return '-'; }
        const all: any[] = this.anagrafiche['classi-utente'] || [];
        return ids.map((id: any) => {
            const key = (typeof id === 'object') ? id?.id_classe_utente : id;
            const found = all.find((c: any) => c.id_classe_utente === key);
            return found ? found.nome : key;
        }).join(', ');
    }

    _summaryReferente(): string {
        return this._userFullName(this.selectedReferente) || '-';
    }

    _summaryReferenteTecnico(): string {
        return this._userFullName(this.selectedReferenteTecnico) || '-';
    }

    _summaryOrganizzazione(): string {
        return this.selectedOrganizzazione?.nome || '-';
    }

    _summarySoggetto(): string {
        const id = this.f['id_soggetto_erogatore']?.value;
        if (!id) { return '-'; }
        const found = (this._elencoSoggetti || []).find((s: any) => String(s.id_soggetto) === String(id));
        return found ? found.nome : (this.selectedSoggetto?.nome || String(id));
    }

    _summaryTags(): string {
        const t: any[] = this.f['tags']?.value || [];
        return t.length ? t.join(', ') : '-';
    }

    get _summaryHasImage(): boolean {
        return !!this.f['immagine']?.value;
    }
}
