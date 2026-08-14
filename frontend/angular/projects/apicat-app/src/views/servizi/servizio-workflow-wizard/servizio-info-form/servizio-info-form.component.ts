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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService, Tools, COMPONENTS_IMPORTS } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Grant } from '@app/model/grant';
import { CommonModule } from '@angular/common';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MarkAsteriskDirective } from '@app/directives/mark-asterisk/mark-asterisk.directive';
import { DisablePermissionDirective } from '@app/directives/disable-permission/disable-permission.directive';
import { MarkdownModule } from 'ngx-markdown';
import { HttpImgSrcPipe } from '@app/lib/pipes/http-img-src.pipe';
import { MapperPipe } from '@app/lib/pipes/mapper.pipe';

import { concat, forkJoin, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs/operators';

/**
 * Form Informazioni Generali del servizio (view + edit) per la FASE 1 del
 * wizard workflow. Porta la logica del form generale di `servizio-details`
 * (senza il chrome di pagina) in un componente embeddabile: riceve il servizio
 * via `@Input`, ne mostra i dati e, in edit, ne consente la modifica
 * (`PUT /servizi/:id`) emettendo `saved`. Ingresso edit pilotabile dall'esterno
 * (`externalEditControl` + `toggleEdit()`), come `<app-adesione-form>`.
 */
@Component({
    selector: 'app-servizio-info-form',
    templateUrl: 'servizio-info-form.component.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        MarkAsteriskDirective,
        DisablePermissionDirective,
        MarkdownModule,
        HttpImgSrcPipe,
        MapperPipe
    ]
})
export class ServizioInfoFormComponent implements OnInit, OnChanges {
    static readonly Name = 'ServizioInfoFormComponent';
    readonly model: string = 'servizi';

    @Input() id: string | null = null;
    @Input() data: any = null;
    @Input() config: any = null;
    @Input() grant: Grant | null = null;
    @Input() editable: boolean = false;
    @Input() externalEditControl: boolean = false;

    @Output() saved: EventEmitter<any> = new EventEmitter<any>();

    Tools = Tools;

    isEdit: boolean = false;
    saving: boolean = false;
    _error: boolean = false;
    _errorMsg: string = '';
    _errors: any[] = [];
    _updateData: string = '';

    _formGroup: FormGroup = new FormGroup({});
    anagrafiche: any = {};
    generalConfig: any = Tools.Configurazione || null;
    apiUrl: string = '';
    _imagePlaceHolder: string = './assets/images/logo-placeholder.png';
    _maxImageSize: number = (Tools.Configurazione?.servizio?.max_image_size || 2) * 1024 * 1024;
    _showMarkdownPreview: boolean = false;
    minLengthTerm = 1;

    hasServiziApi: boolean = false;
    hasGenerico: boolean = false;
    _tipiServizio = [
        { label: 'API', value: 'API', enabled: true },
        { label: 'Generico', value: 'Generico', enabled: true }
    ];
    _tipiVisibilitaServizio: any[] = [];

    _hasMultiDominio: boolean = false;
    _multiDominioEmail: string | null = null;
    _hasFlagConsentiNonSottoscrivibile: boolean = false;
    _hasAdesioniMultiple: boolean = false;
    _isFruizione: boolean = false;
    _isDominioDeprecato: boolean = false;

    // create-only flags: in edit un servizio puo` gia` avere API/componenti
    hasApi: boolean = false;
    hasComponenti: boolean = false;

    domini$!: Observable<any[]>;
    dominiInput$ = new Subject<string>();
    dominiLoading: boolean = false;
    selectedDominio: any;

    organizzazioniInterne$!: Observable<any[]>;
    organizzazioniInterneInput$ = new Subject<string>();
    organizzazioniInterneLoading: boolean = false;
    selectedOrganizzazione: any;
    selectedSoggetto: any;

    _disabled_id_soggetto: any = null;
    _hideSoggettoDropdown: boolean = true;
    _hideSoggettoInfo: boolean = true;
    _elencoSoggetti: any[] = [];

    richiedente: any = null;
    utenteUltimaModifica: any = null;

    constructor(
        private readonly translate: TranslateService,
        private readonly configService: ConfigService,
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService,
        private readonly authenticationService: AuthenticationService
    ) {
        this.apiUrl = this.configService.getConfiguration()?.AppConfig?.GOVAPI?.HOST || '';
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
        this._buildVisibilitaOptions();
        if (this.data) { this._prepareView(); }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.data && this.data && !this.isEdit) {
            this._buildVisibilitaOptions();
            this._prepareView();
        }
    }

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

    _isGestore() {
        return this.authenticationService.isGestore(this.grant?.ruoli);
    }

    _isGestoreMapper = (): boolean => this._isGestore();

    _canEditMapper = (): boolean => {
        return this.authenticationService.canEdit('servizio', 'servizio', this.data?.stato, this.grant?.ruoli);
    }

    _canSetFruizioneMapper = (): boolean => {
        if (this._isGestore()) { return true; }
        const _orgReferente = !!this.authenticationService.getCurrentOrganization()?.referente;
        return _orgReferente && (
            this.authenticationService.isAmministratoreOrganizzazione() ||
            this.authenticationService.isOperatoreApi()
        );
    }

    private _buildVisibilitaOptions() {
        this._tipiVisibilitaServizio = [
            { label: 'EreditataDominio', value: null },
            ...Tools.TipiVisibilitaServizio
        ];
        if (this._isGestore()) {
            this._tipiVisibilitaServizio = [...this._tipiVisibilitaServizio, { value: 'componente', label: 'componente' }];
        }
    }

    /** Prepara lo stato di sola-lettura + inizializza il form dai dati. */
    private _prepareView() {
        this._isDominioDeprecato = this.data?.dominio?.deprecato || false;
        this._isFruizione = this.data?.fruizione || false;
        this.richiedente = this.data?.utente_richiedente;
        this.utenteUltimaModifica = this.data?.utente_ultima_modifica;
        this._initForm();
        this._initDominiSelect(this.data?.dominio ? [this.data.dominio] : []);
        this._initOrganizzazioniInterneSelect(
            this.data?.soggetto_erogatore?.organizzazione ? [this.data.soggetto_erogatore.organizzazione] : []
        );
        this._loadCurrentSoggetti();
    }

    private _initForm() {
        const data = this.data || {};
        const _group: any = {
            tipo: new FormControl(data.tipo || null, []),
            nome: new FormControl(data.nome || null, [Validators.required, Validators.maxLength(255)]),
            versione: new FormControl(data.versione || '', [Validators.required, Validators.pattern('^[1-9][0-9]*$')]),
            id_dominio: new FormControl(data.dominio?.id_dominio || null, [Validators.required]),
            visibilita: new FormControl(data.visibilita ?? null, []),
            classi: new FormControl(this._normalizeClassi(data.classi), []),
            package: new FormControl({ value: data.package || false, disabled: true }, []),
            fruizione: new FormControl(data.fruizione || false, []),
            id_organizzazione_interna: new FormControl({ value: data.soggetto_erogatore?.organizzazione?.id_organizzazione || null, disabled: true }, []),
            id_soggetto_erogatore: new FormControl(data.soggetto_erogatore?.id_soggetto || null, []),
            descrizione_sintetica: new FormControl(data.descrizione_sintetica || null, [Validators.required, Validators.maxLength(255)]),
            descrizione: new FormControl(data.descrizione || null, [Validators.maxLength(4000)]),
            tags: new FormControl(data.tags || [], []),
            termini_ricerca: new FormControl(data.termini_ricerca || null, [Validators.maxLength(255)]),
            note: new FormControl(data.note || null, [Validators.maxLength(1000)]),
            immagine: new FormControl(null, []),
            adesione_disabilitata: new FormControl(data.adesione_disabilitata || false, []),
            multi_adesione: new FormControl({ value: data.multi_adesione || false, disabled: true }, []),
            skip_collaudo: new FormControl(data.skip_collaudo || false, [])
        };
        this._formGroup = new FormGroup(_group);

        this._applyClassiValidator();
        this._applyFruizioneValidators(this._isFruizione);
        this.enableDisableControlAdesioneConsentita();
        this._enableDisableSkipCollaudo(this.data?.dominio);
        // in view (o edit) il dominio non e` modificabile qui se deprecato/fruizione o non gestore
        if (!this._isGestore() && (this._isDominioDeprecato || this._isFruizione)) {
            this._formGroup.get('id_dominio')?.disable();
        }
    }

    private _normalizeClassi(classi: any[]): any[] {
        return (classi || []).map((c: any) => (typeof c === 'object' ? c.id_classe_utente : c));
    }

    private _applyClassiValidator() {
        const ctrl = this._formGroup.get('classi');
        if (this._isVisibilita('riservato')) {
            ctrl?.setValidators(Validators.required);
        } else {
            ctrl?.clearValidators();
        }
        ctrl?.updateValueAndValidity();
    }

    private _applyFruizioneValidators(isFruizione: boolean) {
        this._formGroup.get('id_organizzazione_interna')?.setValidators(isFruizione ? [Validators.required] : null);
        this._formGroup.get('id_organizzazione_interna')?.updateValueAndValidity();
        this._formGroup.get('id_soggetto_erogatore')?.setValidators(isFruizione ? [Validators.required] : null);
        this._formGroup.get('id_soggetto_erogatore')?.updateValueAndValidity();
    }

    async loadAnagrafiche() {
        this.anagrafiche = await this.utils.getAnagrafiche(['classi-utente', 'tags']);
    }

    // -------------------------------------------------------------------------
    // Edit toggle
    // -------------------------------------------------------------------------

    toggleEdit() {
        if (this.isEdit) { this.onCancelEdit(); } else { this.onEdit(); }
    }

    onEdit() {
        this.__resetError();
        this.isEdit = true;
        this.selectedOrganizzazione = this.data?.soggetto_erogatore?.organizzazione ?? null;
        this._prepareView();
    }

    onCancelEdit() {
        this.isEdit = false;
        this._showMarkdownPreview = false;
        this.__resetError();
        this._prepareView();
    }

    // -------------------------------------------------------------------------
    // Handlers campi
    // -------------------------------------------------------------------------

    _onChangeDominio(event: any) {
        this.selectedDominio = event;
        this._enableDisableSkipCollaudo(this.selectedDominio);
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
        this.enableDisableControlAdesioneConsentita();
    }

    _onChangeFruizione(event: any) {
        this._isFruizione = event.target.checked;
        if (!this._isFruizione) {
            this._formGroup.get('id_organizzazione_interna')?.setValue(null);
            this._formGroup.get('id_soggetto_erogatore')?.setValue(null);
        }
        this._applyFruizioneValidators(this._isFruizione);
    }

    onChangeSelect(event: any, param: string) {
        if (param === 'organizzazione') {
            this.selectedOrganizzazione = event;
            this._checkSoggetto(event);
        }
        if (param === 'soggetto') { this.selectedSoggetto = event; }
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
            this._formGroup.get('skip_collaudo')?.disable();
        }
    }

    _onImageLoaded(event: any) {
        if (event) {
            const _split = event.split(',');
            const _type = _split[0].split(';')[0].replace('data:', '');
            const _content = _split[1];
            this._formGroup.get('immagine')?.setValue({ content_type: _type, content: _content, tipo_documento: 'nuovo' });
        } else {
            this._formGroup.get('immagine')?.setValue(null);
        }
    }

    _compareClassiFn(item: any, selected: any) {
        return item.id_classe_utente === selected;
    }

    _toggleMarkdownPreview() {
        this._showMarkdownPreview = !this._showMarkdownPreview;
    }

    _userFullName(user: any): string {
        return [user?.nome, user?.cognome].filter(Boolean).join(' ');
    }

    _visibilitaLabel(): string {
        const v = this.data?.visibilita;
        if (!v) { return this.translate.instant('APP.VISIBILITY.EreditataDominio'); }
        const key = 'APP.VISIBILITY.' + v;
        const t = this.translate.instant(key);
        return (t && t !== key) ? t : v;
    }

    _getLogoMapper = (data: any): string => {
        return data?.immagine ? `${this.apiUrl}/servizi/${data.id_servizio}/immagine` : this._imagePlaceHolder;
    }

    // -------------------------------------------------------------------------
    // Select data-loading (domini / organizzazioni / soggetti)
    // -------------------------------------------------------------------------

    getDomini(term: string | null = null): Observable<any> {
        const _options: any = term ? { params: { q: term } } : { params: {} };
        if (!this.authenticationService.isGestore()) { _options.params.deprecato = false; }
        return this.apiService.getList('domini', _options).pipe(
            map((resp) => resp.Error ? [] : resp.content.map((item: any) => item))
        );
    }

    getOrganizzazioni(term: string | null): Observable<any> {
        const _params: any = {};
        if (term) { _params.q = term; }
        const _referenti$ = this.apiService.getList('organizzazioni/all', { params: { ..._params, referente: true } });
        const _intermediate$ = this.apiService.getList('organizzazioni/all', { params: { ..._params, intermediata: true } });
        return forkJoin([_referenti$, _intermediate$]).pipe(
            map(([_r1, _r2]: any[]) => {
                const _merged = [...(_r1?.content || []), ...(_r2?.content || [])];
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
            map((resp) => resp.Error ? [] : resp.content.map((item: any) => item))
        );
    }

    _initDominiSelect(defaultValue: any[] = []) {
        this.domini$ = concat(
            of(defaultValue),
            this.dominiInput$.pipe(
                startWith(''), distinctUntilChanged(), debounceTime(300),
                tap(() => this.dominiLoading = true),
                switchMap((term: any) => this.getDomini(term).pipe(catchError(() => of([])), tap(() => this.dominiLoading = false)))
            )
        );
    }

    _initOrganizzazioniInterneSelect(defaultValue: any[] = []) {
        this.organizzazioniInterne$ = concat(
            of(defaultValue),
            this.organizzazioniInterneInput$.pipe(
                startWith(''), distinctUntilChanged(), debounceTime(300),
                tap(() => this.organizzazioniInterneLoading = true),
                switchMap((term: any) => this.getOrganizzazioni(term).pipe(catchError(() => of([])), tap(() => this.organizzazioniInterneLoading = false)))
            )
        );
    }

    /** Init soggetto erogatore in view/edit (analogo a servizio-details.loadCurrentData). */
    private _loadCurrentSoggetti() {
        this.selectedOrganizzazione = this.data?.soggetto_erogatore?.organizzazione ?? null;
        if (!this._isFruizione) { return; }
        this.getSoggetti(null, true).subscribe({
            next: (result) => {
                if (result.length === 1) {
                    this._hideSoggettoDropdown = true;
                    this._hideSoggettoInfo = true;
                    this._formGroup.controls['id_soggetto_erogatore'].patchValue(result[0].id_soggetto);
                } else {
                    const _hasChoice = result.length > 1;
                    this._hideSoggettoDropdown = !_hasChoice;
                    this._hideSoggettoInfo = !_hasChoice;
                    this._elencoSoggetti = [...result];
                    this._formGroup.controls['id_soggetto_erogatore'].patchValue(this.data?.soggetto_erogatore?.id_soggetto);
                }
                this._formGroup.updateValueAndValidity();
            },
            error: (err) => console.log(err)
        });
    }

    _checkSoggetto(event: any) {
        if (event) {
            const _referente = !this.selectedOrganizzazione?.intermediata;
            this.getSoggetti(null, _referente).subscribe({
                next: (result) => {
                    const controls = this._formGroup.controls;
                    if (result.length === 1) {
                        this._hideSoggettoDropdown = true;
                        controls['id_soggetto_erogatore'].patchValue(result[0].id_soggetto);
                        controls['id_soggetto_erogatore'].disable();
                        this._disabled_id_soggetto = result[0].id_soggetto;
                    } else {
                        const _hasChoice = result.length > 1;
                        this._elencoSoggetti = [...result];
                        controls['id_soggetto_erogatore'].enable();
                        controls['id_soggetto_erogatore'].updateValueAndValidity();
                        this._disabled_id_soggetto = null;
                        this._hideSoggettoDropdown = !_hasChoice;
                    }
                    this._formGroup.updateValueAndValidity();
                },
                error: (err) => console.log(err)
            });
        } else {
            const controls = this._formGroup.controls;
            controls['id_soggetto_erogatore'].patchValue(null);
            this._elencoSoggetti = [];
            this._hideSoggettoDropdown = true;
            this._formGroup.updateValueAndValidity();
        }
    }

    // -------------------------------------------------------------------------
    // Submit
    // -------------------------------------------------------------------------

    onSubmit() {
        this._formGroup.markAllAsTouched();
        if (this._formGroup.invalid) {
            this._error = true;
            this._errorMsg = this.translate.instant('APP.MESSAGE.VALIDATION.FormInvalid');
            return;
        }
        if (this.saving) { return; }
        this.__resetError();
        const body = this._prepareBodyUpdateServizio(this._formGroup.getRawValue());
        this.saving = true;
        this.apiService.putElement(this.model, this.id, body).subscribe({
            next: (response: any) => {
                this.saving = false;
                this.isEdit = false;
                this._showMarkdownPreview = false;
                if (response) { this.data = response; }
                HttpImgSrcPipe.invalidateCache(`/servizi/${this.id}/immagine`);
                this._updateData = new Date().getTime().toString();
                this.saved.emit({ id: this.id, data: response });
            },
            error: (error: any) => {
                this.saving = false;
                this._error = true;
                this._errorMsg = this.utils.GetErrorMsg(error);
                this._errors = Tools.filtraErroriComplessi(error.error?.errori);
            }
        });
    }

    private _prepareBodyUpdateServizio(body: any) {
        const _tags: any[] = body.tags || [];
        const _tassonomie: any[] = this.data?.tassonomie || [];
        const _classi: any[] = (body.classi || []).map((item: any) => (typeof item === 'object' ? item.id_classe_utente : item));
        let _immagine: any = body.immagine;
        if (!_immagine) {
            _immagine = this.data?.immagine?.uuid ? { tipo_documento: 'uuid', uuid: this.data.immagine.uuid } : (this.data?.immagine || {});
        }

        const _newBody: any = {
            identificativo: {
                tipo: body.tipo,
                nome: body.nome,
                versione: body.versione,
                id_dominio: body.id_dominio,
                visibilita: (body.visibilita === 'null') ? null : body.visibilita,
                multi_adesione: body.multi_adesione,
                classi: _classi,
                adesione_disabilitata: body.adesione_disabilitata || false,
                id_soggetto_erogatore: body.id_soggetto_erogatore || null,
                package: body.package || false,
                skip_collaudo: body.skip_collaudo || false,
                fruizione: body.fruizione || false
            },
            dati_generici: {
                descrizione: body.descrizione || null,
                descrizione_sintetica: body.descrizione_sintetica || null,
                immagine: _immagine,
                tags: _tags,
                tassonomie: _tassonomie,
                termini_ricerca: body.termini_ricerca || null,
                note: body.note || null
            }
        };
        return this.authenticationService._removeDNM('servizio', this.data?.stato, _newBody, this.grant?.ruoli);
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
    }
}
