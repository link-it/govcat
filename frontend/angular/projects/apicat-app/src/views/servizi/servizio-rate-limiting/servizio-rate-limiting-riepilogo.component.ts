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
import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { HttpContext } from '@angular/common/http';
import { Observable, catchError, delay, forkJoin, of } from 'rxjs';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { DISABLE_GLOBAL_EXCEPTION_HANDLING } from '@app/lib/interceptors/error.interceptor';
import { LocaleNumberPipe } from '@app/pipes/locale-number.pipe';
import { PillTab, PillTabsComponent } from '@app/components/lnk-ui/pill-tabs/pill-tabs.component';
import {
    ItemRateLimitingFruitore, RATE_LIMITING_PERIODI, RATE_LIMITING_PERIODO_LABEL, RateLimitingAdesioneApi,
    RateLimitingPeriodo, RateLimitingRiepilogo, RateLimitingServizio, puoGestireRateLimiting
} from '../rate-limiting';
import { apiRiepilogoMock, fruitoriMock, riepilogoMock } from '../rate-limiting.mock';

/** Quote di un'API per un periodo, con i dati del riepilogo. */
export interface ColonnaRateLimiting extends RateLimitingRiepilogo {
    chiave: string;
    id_api: string;
}

/** API con rate limiting nell'ambiente: una tab del riepilogo. */
export interface ApiRateLimiting {
    id_api: string;
    nome: string;
    versione: number;
    colonne: ColonnaRateLimiting[];
}

const PAGE_SIZE = 20;
/** Pagine piu` grandi per caricare tutti i fruitori quando si filtra. */
const PAGE_SIZE_TUTTI = 100;
/** Ritardo delle pagine di fruitori di esempio (ms). */
const MOCK_RITARDO = 300;

/**
 * Riepilogo del rate limiting di un ambiente per chi gestisce il servizio: una tab per API con le
 * quote dichiarate (assegnata, residua, fruitori) e le quote dei fruitori per quell'API, modificabili.
 * L'avviso di sforamento si ricalcola durante la modifica (il backend non blocca mai il salvataggio).
 */
@Component({
    selector: 'app-servizio-rate-limiting-riepilogo',
    templateUrl: 'servizio-rate-limiting-riepilogo.component.html',
    styleUrls: ['servizio-rate-limiting-riepilogo.component.scss'],
    standalone: true,
    imports: [LocaleNumberPipe, CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, TooltipModule, PillTabsComponent]
})
export class ServizioRateLimitingRiepilogoComponent implements OnChanges, OnDestroy {
    private static _seq = 0;

    @Input() idServizio: string | null = null;
    @Input() ambiente: 'collaudo' | 'produzione' = 'collaudo';
    @Input() ruoli: string[] | null = null;
    /** Dati di esempio al posto di quote e fruitori reali; le modifiche restano locali. */
    @Input() mock: boolean = false;

    private _fruitoriMock: ItemRateLimitingFruitore[] | null = null;

    readonly _idBase = `rate-limiting-riepilogo-${++ServizioRateLimitingRiepilogoComponent._seq}`;

    _api: ApiRateLimiting[] = [];
    _apiSelezionata: ApiRateLimiting | null = null;
    /** Tab delle API (riferimento stabile), con un avviso sulle API con quote superate. */
    _tabs: PillTab[] = [];
    _fruitori: ItemRateLimitingFruitore[] = [];
    _fruitoriVisibili: ItemRateLimitingFruitore[] = [];
    _filtro: string = '';
    _totaleFruitori: number = 0;
    private _pagina: number = 0;
    private _caricamento: number = 0;
    /** Scarta le pagine di fruitori superate da un nuovo caricamento (riepilogo o caricamento completo). */
    private _versioneFruitori: number = 0;
    _loading: boolean = false;
    _loadingFruitori: boolean = false;
    _loadingTutti: boolean = false;

    /** Fondo della tabella dei fruitori: quando e` visibile si carica la pagina successiva. */
    private _sentinellaEl: HTMLElement | null = null;
    private _observer: IntersectionObserver | null = null;

    @ViewChild('sentinella') set _sentinella(el: ElementRef<HTMLElement> | undefined) {
        const _nuovo = el?.nativeElement || null;
        if (_nuovo === this._sentinellaEl) { return; }
        this._observer?.disconnect();
        this._observer = null;
        this._sentinellaEl = _nuovo;
        if (_nuovo && typeof IntersectionObserver !== 'undefined') {
            this._observer = new IntersectionObserver((entries) => {
                if (entries.some((e) => e.isIntersecting)) { this.caricaAltri(); }
            });
            this._observer.observe(_nuovo);
        }
    }

    /** Adesione in modifica e quote in modifica dell'API selezionata (chiave `id_api|periodo`). */
    _inModifica: string | null = null;
    _formGroup: FormGroup = new FormGroup({});
    _saving: boolean = false;
    _errorMsg: string = '';

    constructor(
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService
    ) {}

    get _visibile(): boolean {
        return puoGestireRateLimiting(this.ruoli);
    }

    /** Quote dell'API selezionata. */
    get _colonne(): ColonnaRateLimiting[] {
        return this._apiSelezionata?.colonne || [];
    }

    ngOnDestroy(): void {
        this._observer?.disconnect();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['idServizio'] || changes['ambiente'] || changes['ruoli']) && this.idServizio && this._visibile) {
            this.carica();
        }
    }

    carica() {
        if (!this.idServizio) { return; }
        const _corrente = ++this._caricamento;
        this._loading = true;
        this._inModifica = null;
        const _options = { context: new HttpContext().set(DISABLE_GLOBAL_EXCEPTION_HANDLING, true) };
        this.apiService.getDetails('servizi', this.idServizio, 'rate-limiting', _options).pipe(
            catchError(() => of({ api: [] }))
        ).subscribe((resp: any) => {
            if (_corrente !== this._caricamento) { return; }
            if (this.mock) {
                this._fruitoriMock ??= fruitoriMock(apiRiepilogoMock(resp, this.ambiente));
                resp = riepilogoMock(resp, this._fruitoriMock, this.ambiente);
            }
            const _selezionata = this._apiSelezionata?.id_api;
            this._api = this._componi(resp as RateLimitingServizio);
            this._apiSelezionata = this._api.find((a) => a.id_api === _selezionata) || this._api[0] || null;
            this._tabs = this._api.map((a) => ({
                key: a.id_api,
                label: `${a.nome} v${a.versione}`,
                badge: this._apiSuperata(a) ? { icon: 'bi-exclamation-triangle-fill', ariaLabel: 'APP.SERVICES.RATE_LIMITING.Superata', tone: 'warning' } : undefined
            }));
            this._loading = false;
            this._fruitori = [];
            this._fruitoriVisibili = [];
            this._pagina = 0;
            this._versioneFruitori++;
            this._loadingTutti = false;
            if (this._api.length) { this._caricaFruitori(); }
        });
    }

    private _componi(riepilogo: RateLimitingServizio): ApiRateLimiting[] {
        return (riepilogo?.api || [])
            .map((api) => ({
                id_api: api.id_api,
                nome: api.nome,
                versione: api.versione,
                colonne: [...(api[this.ambiente] || [])]
                    .sort((a, b) => RATE_LIMITING_PERIODI.indexOf(a.periodo) - RATE_LIMITING_PERIODI.indexOf(b.periodo))
                    .map((r: RateLimitingRiepilogo) => ({ ...r, chiave: `${api.id_api}|${r.periodo}`, id_api: api.id_api }))
            }))
            .filter((a) => a.colonne.length > 0);
    }

    seleziona(idApi: string) {
        if (this._apiSelezionata?.id_api === idApi) { return; }
        this._apiSelezionata = this._api.find((a) => a.id_api === idApi) || null;
        this.annulla();
    }

    private _richiestaFruitori(page: number, size: number): Observable<any> {
        if (this.mock && this._fruitoriMock) {
            // Pagina di esempio con un breve ritardo, come una risposta del backend
            const _contenuto = this._fruitoriMock.slice(page * size, (page + 1) * size);
            return of({ content: _contenuto, page: { totalElements: this._fruitoriMock.length } }).pipe(delay(MOCK_RITARDO));
        }
        const _params = this.utils._queryToHttpParams({ ambiente: this.ambiente, page, size });
        return this.apiService.getDetails('servizi', this.idServizio, 'rate-limiting/fruitori', { params: _params }).pipe(
            catchError(() => of({ content: [], page: { totalElements: 0 } }))
        );
    }

    private _caricaFruitori() {
        if (!this.idServizio) { return; }
        const _versione = this._versioneFruitori;
        this._loadingFruitori = true;
        this._richiestaFruitori(this._pagina, PAGE_SIZE).subscribe((resp: any) => {
            if (_versione !== this._versioneFruitori) { return; }
            this._fruitori = [...this._fruitori, ...(resp?.content || [])];
            this._totaleFruitori = resp?.page?.totalElements ?? this._fruitori.length;
            this._loadingFruitori = false;
            this._applicaFiltro();
            setTimeout(() => this._ricontrollaSentinella());
        });
    }

    get _altriFruitori(): boolean {
        return this._fruitori.length < this._totaleFruitori;
    }

    caricaAltri() {
        if (this._loadingFruitori || this._loadingTutti || !this._altriFruitori) { return; }
        this._pagina++;
        this._caricaFruitori();
    }

    /**
     * Dopo una pagina la sentinella puo` essere ancora visibile (righe che non riempiono la tabella):
     * osservandola di nuovo l'observer ne notifica subito lo stato e, se serve, carica la successiva.
     */
    private _ricontrollaSentinella() {
        if (!this._observer || !this._sentinellaEl) { return; }
        this._observer.unobserve(this._sentinellaEl);
        this._observer.observe(this._sentinellaEl);
    }

    /** Alla prima ricerca si caricano tutti i fruitori, cosi` il filtro li considera tutti. */
    _onFiltro() {
        if (this._filtro.trim() && this._altriFruitori) { this._caricaTutti(); }
        this._applicaFiltro();
    }

    private _caricaTutti() {
        if (this._loadingTutti || !this.idServizio) { return; }
        const _versione = ++this._versioneFruitori;
        const _pagine = Math.max(1, Math.ceil(this._totaleFruitori / PAGE_SIZE_TUTTI));
        this._loadingTutti = true;
        this._loadingFruitori = false;
        forkJoin(Array.from({ length: _pagine }, (_v, i) => this._richiestaFruitori(i, PAGE_SIZE_TUTTI))).subscribe((pagine: any[]) => {
            if (_versione !== this._versioneFruitori) { return; }
            this._fruitori = pagine.flatMap((p: any) => p?.content || []);
            this._totaleFruitori = this._fruitori.length;
            this._loadingTutti = false;
            this._applicaFiltro();
        });
    }

    /** Filtro sui fruitori caricati, per nome del soggetto o identificativo logico. */
    _applicaFiltro() {
        const _testo = (this._filtro || '').trim().toLowerCase();
        this._fruitoriVisibili = _testo
            ? this._fruitori.filter((f) => `${f.soggetto?.nome || ''} ${f.id_logico || ''}`.toLowerCase().includes(_testo))
            : this._fruitori;
    }

    _label(periodo: RateLimitingPeriodo): string {
        return RATE_LIMITING_PERIODO_LABEL[periodo] || periodo;
    }

    _quota(fruitore: ItemRateLimitingFruitore, colonna: ColonnaRateLimiting): number | null {
        return (fruitore.rate_limiting || []).find((q) => q.id_api === colonna.id_api && q.periodo === colonna.periodo)?.quota ?? null;
    }

    modifica(fruitore: ItemRateLimitingFruitore) {
        const _controlli: { [k: string]: FormControl } = {};
        this._colonne.forEach((c) => {
            const _validators = [Validators.min(1), Validators.pattern('^[0-9]+$')];
            if (c.quota_fruitore) { _validators.push(Validators.max(c.quota_fruitore)); }
            _controlli[c.chiave] = new FormControl<number | null>(this._quota(fruitore, c), _validators);
        });
        this._formGroup = new FormGroup(_controlli);
        this._inModifica = fruitore.id_adesione;
        this._errorMsg = '';
    }

    annulla() {
        this._inModifica = null;
        this._errorMsg = '';
    }

    private _valore(chiave: string): number | null {
        const _v = this._formGroup.get(chiave)?.value;
        const _n = Number(_v);
        return (_v !== null && _v !== '' && Number.isInteger(_n) && _n >= 1) ? _n : null;
    }

    /** Quota assegnata della colonna tenendo conto della modifica in corso. */
    _assegnata(colonna: ColonnaRateLimiting): number {
        if (!this._inModifica || colonna.id_api !== this._apiSelezionata?.id_api) { return colonna.quota_assegnata; }
        const _fruitore = this._fruitori.find((f) => f.id_adesione === this._inModifica);
        const _prima = _fruitore ? (this._quota(_fruitore, colonna) || 0) : 0;
        return colonna.quota_assegnata - _prima + (this._valore(colonna.chiave) || 0);
    }

    /** Residua solo se il servizio dichiara la quota totale. */
    _residua(colonna: ColonnaRateLimiting): number | null {
        return colonna.quota ? colonna.quota - this._assegnata(colonna) : null;
    }

    _superata(colonna: ColonnaRateLimiting): boolean {
        const _residua = this._residua(colonna);
        return _residua !== null && _residua < 0;
    }

    _apiSuperata(api: ApiRateLimiting): boolean {
        return api.colonne.some((c) => this._superata(c));
    }

    _errore(chiave: string): boolean {
        const _ctrl = this._formGroup.get(chiave);
        return !!(_ctrl?.invalid && (_ctrl.dirty || _ctrl.touched));
    }

    /** Elenco completo delle quote dell'adesione nell'ambiente: quelle dell'API selezionata dal form, le altre invariate. */
    _quoteDaInviare(fruitore: ItemRateLimitingFruitore): RateLimitingAdesioneApi[] {
        const _chiavi = this._colonne.map((c) => c.chiave);
        const _altre = (fruitore.rate_limiting || []).filter((q) => !_chiavi.includes(`${q.id_api}|${q.periodo}`));
        const _modificate: RateLimitingAdesioneApi[] = [];
        this._colonne.forEach((c) => {
            const _v = this._valore(c.chiave);
            if (_v) { _modificate.push({ id_api: c.id_api, quota: _v, periodo: c.periodo }); }
        });
        return [..._altre, ..._modificate];
    }

    salva(fruitore: ItemRateLimitingFruitore) {
        this._formGroup.markAllAsTouched();
        if (this._formGroup.invalid || this._saving) { return; }
        this._saving = true;
        this._errorMsg = '';
        const _body = { rate_limiting: this._quoteDaInviare(fruitore) };
        if (this.mock) {
            fruitore.rate_limiting = _body.rate_limiting;
            this._saving = false;
            this.carica();
            return;
        }
        this.apiService.putElementRelated('adesioni', fruitore.id_adesione, `${this.ambiente}/rate-limiting`, _body).subscribe({
            next: () => {
                this._saving = false;
                this.carica();
            },
            error: (error: any) => {
                this._saving = false;
                this._errorMsg = this.utils.GetErrorMsg(error);
            }
        });
    }
}
