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
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpContext } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { DISABLE_GLOBAL_EXCEPTION_HANDLING } from '@app/lib/interceptors/error.interceptor';
import {
    ItemRateLimitingFruitore, RATE_LIMITING_PERIODI, RATE_LIMITING_PERIODO_LABEL, RateLimitingAdesioneApi,
    RateLimitingPeriodo, RateLimitingRiepilogo, RateLimitingServizio, puoGestireRateLimiting
} from '../../rate-limiting';

/** Colonna del riepilogo: un'API e un periodo con quota complessiva dichiarata. */
export interface ColonnaRateLimiting extends RateLimitingRiepilogo {
    chiave: string;
    id_api: string;
    nome: string;
    versione: number;
}

const PAGE_SIZE = 20;

/**
 * Riepilogo del rate limiting di un ambiente per chi gestisce il servizio: per ogni API e periodo
 * quota complessiva, assegnata, residua e fruitori; quote dei fruitori modificabili, con l'avviso
 * di sforamento ricalcolato durante la modifica (il backend non blocca mai il salvataggio).
 */
@Component({
    selector: 'app-servizio-rate-limiting-riepilogo',
    templateUrl: 'servizio-rate-limiting-riepilogo.component.html',
    styleUrls: ['servizio-rate-limiting-riepilogo.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule]
})
export class ServizioRateLimitingRiepilogoComponent implements OnChanges {
    private static _seq = 0;

    @Input() idServizio: string | null = null;
    @Input() ambiente: 'collaudo' | 'produzione' = 'collaudo';
    @Input() ruoli: string[] | null = null;

    readonly _idBase = `rate-limiting-riepilogo-${++ServizioRateLimitingRiepilogoComponent._seq}`;

    _colonne: ColonnaRateLimiting[] = [];
    _fruitori: ItemRateLimitingFruitore[] = [];
    _totaleFruitori: number = 0;
    private _pagina: number = 0;
    private _caricamento: number = 0;
    _loading: boolean = false;
    _loadingFruitori: boolean = false;

    /** Adesione in modifica e quote in modifica (chiave `id_api|periodo`). */
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
            this._colonne = this._componi(resp as RateLimitingServizio);
            this._loading = false;
            this._fruitori = [];
            this._pagina = 0;
            if (this._colonne.length) { this._caricaFruitori(); }
        });
    }

    private _componi(riepilogo: RateLimitingServizio): ColonnaRateLimiting[] {
        const _colonne: ColonnaRateLimiting[] = [];
        (riepilogo?.api || []).forEach((api) => {
            [...(api[this.ambiente] || [])]
                .sort((a, b) => RATE_LIMITING_PERIODI.indexOf(a.periodo) - RATE_LIMITING_PERIODI.indexOf(b.periodo))
                .forEach((r: RateLimitingRiepilogo) => _colonne.push({ ...r, chiave: `${api.id_api}|${r.periodo}`, id_api: api.id_api, nome: api.nome, versione: api.versione }));
        });
        return _colonne;
    }

    private _caricaFruitori() {
        if (!this.idServizio) { return; }
        const _corrente = this._caricamento;
        this._loadingFruitori = true;
        const _params = this.utils._queryToHttpParams({ ambiente: this.ambiente, page: this._pagina, size: PAGE_SIZE });
        this.apiService.getDetails('servizi', this.idServizio, 'rate-limiting/fruitori', { params: _params }).pipe(
            catchError(() => of({ content: [], page: { totalElements: 0 } }))
        ).subscribe((resp: any) => {
            if (_corrente !== this._caricamento) { return; }
            this._fruitori = [...this._fruitori, ...(resp?.content || [])];
            this._totaleFruitori = resp?.page?.totalElements ?? this._fruitori.length;
            this._loadingFruitori = false;
        });
    }

    get _altriFruitori(): boolean {
        return this._fruitori.length < this._totaleFruitori;
    }

    caricaAltri() {
        if (this._loadingFruitori || !this._altriFruitori) { return; }
        this._pagina++;
        this._caricaFruitori();
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
            _controlli[c.chiave] = new FormControl<number | null>(this._quota(fruitore, c), [Validators.min(1), Validators.pattern('^[0-9]+$')]);
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
        if (!this._inModifica) { return colonna.quota_assegnata; }
        const _fruitore = this._fruitori.find((f) => f.id_adesione === this._inModifica);
        const _prima = _fruitore ? (this._quota(_fruitore, colonna) || 0) : 0;
        return colonna.quota_assegnata - _prima + (this._valore(colonna.chiave) || 0);
    }

    _residua(colonna: ColonnaRateLimiting): number {
        return colonna.quota - this._assegnata(colonna);
    }

    _superata(colonna: ColonnaRateLimiting): boolean {
        return this._residua(colonna) < 0;
    }

    _errore(chiave: string): boolean {
        const _ctrl = this._formGroup.get(chiave);
        return !!(_ctrl?.invalid && (_ctrl.dirty || _ctrl.touched));
    }

    /** Elenco completo delle quote dell'adesione nell'ambiente: quelle delle colonne dal form, le altre invariate. */
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
