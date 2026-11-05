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
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { Observable, Subject, Subscription, catchError, debounceTime, delay, distinctUntilChanged, of } from 'rxjs';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { LocaleNumberPipe } from '@app/pipes/locale-number.pipe';
import {
    ItemRateLimitingFruitore, RATE_LIMITING_PERIODO_LABEL, RateLimitingAdesioneApi, RateLimitingPeriodo
} from '../rate-limiting';

/** Colonna della tabella dei fruitori: un periodo di un'API. */
export interface ColonnaFruitori {
    chiave: string;
    id_api: string;
    periodo: RateLimitingPeriodo;
    quota_fruitore?: number;
}

/** Quote di un fruitore in modifica (chiave `id_api|periodo`), per ricalcolare il riepilogo. */
export interface ModificaFruitore {
    fruitore: ItemRateLimitingFruitore;
    valori: Record<string, number | null>;
}

const PAGE_SIZE = 20;
/** Attesa dopo l'ultima battuta prima di cercare (ms). */
const RICERCA_DEBOUNCE = 300;
/** Ritardo delle pagine di fruitori di esempio (ms). */
const MOCK_RITARDO = 300;

/** Fruitori per stato di autorizzazione nell'ambiente (parametro `autorizzate`). */
export type StatoFruitori = 'tutte' | 'autorizzate' | 'attesa';

/** Valore della quota: intero >= 1, altrimenti nessuna quota. */
export function valoreQuota(valore: any): number | null {
    const _n = Number(valore);
    return (valore !== null && valore !== undefined && valore !== '' && Number.isInteger(_n) && _n >= 1) ? _n : null;
}

/**
 * Quote dei fruitori del servizio per le colonne indicate (periodi di un'API): elenco paginato con
 * caricamento allo scorrimento, ricerca e filtro per stato di autorizzazione lato server e, se
 * modificabile, modifica delle quote di un fruitore alla volta.
 */
@Component({
    selector: 'app-rate-limiting-fruitori',
    templateUrl: 'rate-limiting-fruitori.component.html',
    styleUrls: ['rate-limiting-fruitori.component.scss'],
    standalone: true,
    imports: [LocaleNumberPipe, CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, TooltipModule]
})
export class RateLimitingFruitoriComponent implements OnChanges, OnDestroy {

    @Input() idServizio: string | null = null;
    @Input() ambiente: 'collaudo' | 'produzione' = 'collaudo';
    @Input() colonne: ColonnaFruitori[] = [];
    /** Nome dell'API delle colonne, per le etichette accessibili. */
    @Input() nomeApi: string = '';
    @Input() modificabile: boolean = false;
    /** Adesione da evidenziare nell'elenco (es. quella in verifica). */
    @Input() evidenzia: string | null = null;
    /** Adesione mostrata a parte, sopra l'elenco, ed esclusa dall'elenco (es. quella in verifica). */
    @Input() corrente: ItemRateLimitingFruitore | null = null;
    /** Dati di esempio al posto dei fruitori reali; le modifiche restano locali. */
    @Input() mock: boolean = false;
    @Input() fruitoriMock: ItemRateLimitingFruitore[] | null = null;

    @Output() modificaChange = new EventEmitter<ModificaFruitore | null>();
    @Output() salvato = new EventEmitter<void>();

    _fruitori: ItemRateLimitingFruitore[] = [];
    /** Testo della ricerca (parametro `q`, applicato dopo una breve attesa). */
    _filtro: string = '';
    private _q: string = '';
    private readonly _ricerca$ = new Subject<string>();
    private readonly _ricercaSub: Subscription;
    _stato: StatoFruitori = 'tutte';
    readonly _stati: StatoFruitori[] = ['tutte', 'autorizzate', 'attesa'];
    _totaleFruitori: number = 0;
    /** Adesioni delle pagine caricate escluse dall'elenco perche` mostrate a parte. */
    private _esclusi: number = 0;
    private _pagina: number = 0;
    /** Scarta le pagine superate da un nuovo caricamento. */
    private _versione: number = 0;
    _loadingFruitori: boolean = false;
    _caricato: boolean = false;

    _inModifica: string | null = null;
    _formGroup: FormGroup = new FormGroup({});
    private _formSub: Subscription | null = null;
    _saving: boolean = false;
    _errorMsg: string = '';

    /** Fondo della tabella: quando e` visibile si carica la pagina successiva. */
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

    constructor(
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService
    ) {
        this._ricercaSub = this._ricerca$.pipe(debounceTime(RICERCA_DEBOUNCE), distinctUntilChanged()).subscribe((q: string) => {
            this._q = q;
            this.ricarica();
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['idServizio'] || changes['ambiente'] || changes['mock'] || changes['fruitoriMock'] || changes['corrente']) {
            this.ricarica();
        } else if (changes['colonne']) {
            this.annulla();
        }
    }

    ngOnDestroy(): void {
        this._observer?.disconnect();
        this._formSub?.unsubscribe();
        this._ricercaSub.unsubscribe();
    }

    ricarica() {
        this._versione++;
        this._fruitori = [];
        this._pagina = 0;
        this._totaleFruitori = 0;
        this._esclusi = 0;
        this._caricato = false;
        this.annulla();
        if (this.idServizio && (!this.mock || this.fruitoriMock)) { this._caricaFruitori(); }
    }

    /** Valore del parametro `autorizzate` (stringa: i parametri falsi non verrebbero inviati). */
    private get _autorizzate(): string | undefined {
        return this._stato === 'tutte' ? undefined : String(this._stato === 'autorizzate');
    }

    private _richiesta(page: number, size: number): Observable<any> {
        if (this.mock && this.fruitoriMock) {
            // Pagina di esempio con un breve ritardo, come una risposta del backend
            const _q = this._q.trim().toLowerCase();
            const _filtrati = this.fruitoriMock.filter((f) =>
                (this._stato === 'tutte' || !!f.autorizzata === (this._stato === 'autorizzate'))
                && (!_q || `${f.soggetto?.nome || ''} ${f.id_logico || ''}`.toLowerCase().includes(_q)));
            const _contenuto = _filtrati.slice(page * size, (page + 1) * size);
            return of({ content: _contenuto, page: { totalElements: _filtrati.length } }).pipe(delay(MOCK_RITARDO));
        }
        const _params = this.utils._queryToHttpParams({
            ambiente: this.ambiente, autorizzate: this._autorizzate, q: this._q.trim() || undefined, page, size
        });
        return this.apiService.getDetails('servizi', this.idServizio, 'rate-limiting/fruitori', { params: _params }).pipe(
            catchError(() => of({ content: [], page: { totalElements: 0 } }))
        );
    }

    private _caricaFruitori() {
        const _versione = this._versione;
        this._loadingFruitori = true;
        this._richiesta(this._pagina, PAGE_SIZE).subscribe((resp: any) => {
            if (_versione !== this._versione) { return; }
            const _contenuto: ItemRateLimitingFruitore[] = resp?.content || [];
            const _visibili = this.corrente ? _contenuto.filter((f) => f.id_adesione !== this.corrente!.id_adesione) : _contenuto;
            this._esclusi += _contenuto.length - _visibili.length;
            this._fruitori = [...this._fruitori, ..._visibili];
            this._totaleFruitori = resp?.page?.totalElements ?? (this._fruitori.length + this._esclusi);
            this._loadingFruitori = false;
            this._caricato = true;
            setTimeout(() => this._ricontrollaSentinella());
        });
    }

    get _altriFruitori(): boolean {
        return this._fruitori.length + this._esclusi < this._totaleFruitori;
    }

    /** Fruitori dell'elenco, senza l'adesione mostrata a parte. */
    get _numeroFruitori(): number {
        return Math.max(this._totaleFruitori - this._esclusi, 0);
    }

    caricaAltri() {
        if (this._loadingFruitori || !this._altriFruitori) { return; }
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

    /** Ricerca lato server: si riparte dalla prima pagina dopo una breve attesa. */
    _onFiltro() {
        this._ricerca$.next(this._filtro || '');
    }

    _onStato(stato: StatoFruitori) {
        if (stato === this._stato) { return; }
        this._stato = stato;
        this.ricarica();
    }

    /** Filtri attivi: l'elenco vuoto significa "nessun risultato", non "nessun fruitore". */
    get _filtriAttivi(): boolean {
        return !!this._q.trim() || this._stato !== 'tutte';
    }

    _label(periodo: RateLimitingPeriodo): string {
        return RATE_LIMITING_PERIODO_LABEL[periodo] || periodo;
    }

    _quota(fruitore: ItemRateLimitingFruitore, colonna: ColonnaFruitori): number | null {
        return (fruitore.rate_limiting || []).find((q) => q.id_api === colonna.id_api && q.periodo === colonna.periodo)?.quota ?? null;
    }

    modifica(fruitore: ItemRateLimitingFruitore) {
        if (!this.modificabile) { return; }
        const _controlli: { [k: string]: FormControl } = {};
        this.colonne.forEach((c) => {
            const _validators = [Validators.min(1), Validators.pattern('^[0-9]+$')];
            if (c.quota_fruitore) { _validators.push(Validators.max(c.quota_fruitore)); }
            _controlli[c.chiave] = new FormControl<number | null>(this._quota(fruitore, c), _validators);
        });
        this._formSub?.unsubscribe();
        this._formGroup = new FormGroup(_controlli);
        this._inModifica = fruitore.id_adesione;
        this._errorMsg = '';
        this._formSub = this._formGroup.valueChanges.subscribe(() => this._emettiModifica(fruitore));
        this._emettiModifica(fruitore);
    }

    private _emettiModifica(fruitore: ItemRateLimitingFruitore) {
        const _valori: Record<string, number | null> = {};
        this.colonne.forEach((c) => { _valori[c.chiave] = valoreQuota(this._formGroup.get(c.chiave)?.value); });
        this.modificaChange.emit({ fruitore, valori: _valori });
    }

    annulla() {
        this._formSub?.unsubscribe();
        this._formSub = null;
        const _eraInModifica = !!this._inModifica;
        this._inModifica = null;
        this._errorMsg = '';
        if (_eraInModifica) { this.modificaChange.emit(null); }
    }

    _errore(chiave: string): boolean {
        const _ctrl = this._formGroup.get(chiave);
        return !!(_ctrl?.invalid && (_ctrl.dirty || _ctrl.touched));
    }

    /** Elenco completo delle quote dell'adesione nell'ambiente: quelle delle colonne dal form, le altre invariate. */
    _quoteDaInviare(fruitore: ItemRateLimitingFruitore): RateLimitingAdesioneApi[] {
        const _chiavi = this.colonne.map((c) => c.chiave);
        const _altre = (fruitore.rate_limiting || []).filter((q) => !_chiavi.includes(`${q.id_api}|${q.periodo}`));
        const _modificate: RateLimitingAdesioneApi[] = [];
        this.colonne.forEach((c) => {
            const _v = valoreQuota(this._formGroup.get(c.chiave)?.value);
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
            this._dopoSalvataggio();
            return;
        }
        this.apiService.putElementRelated('adesioni', fruitore.id_adesione, `${this.ambiente}/rate-limiting`, _body).subscribe({
            next: () => {
                this._saving = false;
                this._dopoSalvataggio();
            },
            error: (error: any) => {
                this._saving = false;
                this._errorMsg = this.utils.GetErrorMsg(error);
            }
        });
    }

    private _dopoSalvataggio() {
        this.annulla();
        this.salvato.emit();
        this.ricarica();
    }
}
