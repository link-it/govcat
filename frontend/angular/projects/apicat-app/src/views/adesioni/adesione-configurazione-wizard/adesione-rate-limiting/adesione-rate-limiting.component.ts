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
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { Grant, RightsEnum } from '@app/model/grant';
import { AmbienteEnum } from '@app/model/ambienteEnum';
import {
    RATE_LIMITING_PERIODI, RATE_LIMITING_PERIODO_LABEL, RUOLO_EROGATO_SOGGETTO_DOMINIO,
    RateLimiting, RateLimitingAdesione, RateLimitingAdesioneApi, RateLimitingPeriodo
} from '@app/views/servizi/rate-limiting';
import { apiMock, quoteMock } from '@app/views/servizi/rate-limiting.mock';
import { LocaleNumberPipe } from '@app/pipes/locale-number.pipe';

/** Quota richiesta dal fruitore per un'API e un periodo dichiarato dal servizio. */
export interface QuotaFruitore {
    chiave: string;
    periodo: RateLimitingPeriodo;
    /** Quota totale del servizio, se dichiarata. */
    totale: number | null;
    /** Quota massima per ciascun fruitore, se dichiarata. */
    massimo: number | null;
}

export interface ApiQuoteFruitore {
    id_api: string;
    nome: string;
    versione: number;
    quote: QuotaFruitore[];
}

/** Ruoli del grant dell'adesione di chi gestisce il servizio: modifica le quote in ogni stato tranne archiviato. */
const RUOLI_GESTIONE_SERVIZIO = ['gestore', 'referente_superiore', 'referente_tecnico_superiore'];

/**
 * Rate limiting richiesto dal fruitore in un ambiente: una quota per ogni API e periodo per cui il
 * servizio dichiara un rate limiting. Il salvataggio invia l'elenco completo dell'ambiente.
 */
@Component({
    selector: 'app-adesione-rate-limiting',
    templateUrl: 'adesione-rate-limiting.component.html',
    styleUrls: ['adesione-rate-limiting.component.scss'],
    standalone: true,
    imports: [LocaleNumberPipe, CommonModule, ReactiveFormsModule, TranslateModule, TooltipModule]
})
export class AdesioneRateLimitingComponent implements OnChanges {
    private static _seq = 0;

    @Input() adesione: any = null;
    @Input() environment: AmbienteEnum | 'collaudo' | 'produzione' = 'collaudo';
    @Input() grant: Grant | null = null;
    /** Dati di esempio al posto delle quote reali; il salvataggio resta locale. */
    @Input() mock: boolean = false;
    /** Quote dell'adesione salvate (per rifare la verifica del rate limiting). */
    @Output() salvato = new EventEmitter<void>();

    readonly _idBase = `adesione-rate-limiting-${++AdesioneRateLimitingComponent._seq}`;

    _api: ApiQuoteFruitore[] = [];
    _formGroup: FormGroup = new FormGroup({});
    _loading: boolean = false;
    _editing: boolean = false;
    _saving: boolean = false;
    _errorMsg: string = '';
    private _salvate: RateLimitingAdesioneApi[] = [];

    constructor(
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService,
        private readonly authenticationService: AuthenticationService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['adesione'] || changes['environment']) && this.adesione?.id_adesione) {
            this.carica();
        }
    }

    /** Modificabile dall'aderente con i dati dell'ambiente modificabili, da chi gestisce il servizio tranne in archiviato. */
    get _canEdit(): boolean {
        if (!this.adesione || this.adesione.stato === 'archiviato') { return false; }
        const _ruoli = this.grant?.ruoli || [];
        if (this.authenticationService.isGestore(_ruoli) || _ruoli.some((r: string) => RUOLI_GESTIONE_SERVIZIO.includes(r))) { return true; }
        return (this.environment === 'produzione' ? this.grant?.produzione : this.grant?.collaudo) === RightsEnum.Scrittura;
    }

    carica() {
        const _idServizio = this.adesione?.servizio?.id_servizio;
        if (!_idServizio) { return; }
        this._loading = true;
        this._errorMsg = '';
        const _params = this.utils._queryToHttpParams({ id_servizio: _idServizio, ruolo: RUOLO_EROGATO_SOGGETTO_DOMINIO, size: 100 });
        const _api$ = this.apiService.getList('api', { params: _params }).pipe(
            map((resp: any) => resp?.content || []),
            switchMap((lista: any[]) => lista.length
                ? forkJoin(lista.map((a: any) => this.apiService.getDetails('api', a.id_api).pipe(catchError(() => of(null)))))
                : of([])),
            catchError(() => of([]))
        );
        const _quote$ = this.apiService.getDetails('adesioni', this.adesione.id_adesione, `${this.environment}/rate-limiting`).pipe(
            map((resp: any) => (resp as RateLimitingAdesione)?.rate_limiting || []),
            catchError(() => of([]))
        );
        forkJoin({ api: _api$, quote: _quote$ }).subscribe(({ api, quote }) => {
            this._salvate = quote;
            this._api = this._componi(this.mock ? this._conQuoteMock(api as any[]) : api as any[]);
            this._initForm();
            this._loading = false;
        });
    }

    /** Dati di esempio: piu` API (completate con API fittizie), con quote del servizio per quelle che non ne dichiarano. */
    private _conQuoteMock(dettagli: any[]): any[] {
        const _configurazione = this.environment === 'produzione' ? 'configurazione_produzione' : 'configurazione_collaudo';
        return apiMock((dettagli || []).filter(Boolean)).map((a: any, i: number) =>
            ({ ...a, [_configurazione]: { ...(a[_configurazione] || {}), rate_limiting: quoteMock(a[_configurazione]?.rate_limiting, i) } }));
    }

    private _componi(dettagli: any[]): ApiQuoteFruitore[] {
        const _configurazione = this.environment === 'produzione' ? 'configurazione_produzione' : 'configurazione_collaudo';
        return (dettagli || [])
            .filter((a: any) => a && (a[_configurazione]?.rate_limiting || []).length)
            .map((a: any) => ({
                id_api: a.id_api,
                nome: a.nome,
                versione: a.versione,
                quote: [...a[_configurazione].rate_limiting]
                    .sort((x: RateLimiting, y: RateLimiting) => RATE_LIMITING_PERIODI.indexOf(x.periodo) - RATE_LIMITING_PERIODI.indexOf(y.periodo))
                    .map((q: RateLimiting) => ({ chiave: `${a.id_api}|${q.periodo}`, periodo: q.periodo, totale: q.quota ?? null, massimo: q.quota_fruitore ?? null }))
            }));
    }

    private _initForm() {
        const _controlli: { [k: string]: FormControl } = {};
        this._api.forEach((a: ApiQuoteFruitore) => a.quote.forEach((q: QuotaFruitore) => {
            const _salvata = this._salvate.find((s: RateLimitingAdesioneApi) => s.id_api === a.id_api && s.periodo === q.periodo);
            const _validators = [Validators.min(1), Validators.pattern('^[0-9]+$')];
            if (q.massimo) { _validators.push(Validators.max(q.massimo)); }
            _controlli[q.chiave] = new FormControl<number | null>(_salvata?.quota ?? null, _validators);
        }));
        this._formGroup = new FormGroup(_controlli);
    }

    _quotaSalvata(idApi: string, periodo: RateLimitingPeriodo): number | null {
        return this._salvate.find((s: RateLimitingAdesioneApi) => s.id_api === idApi && s.periodo === periodo)?.quota ?? null;
    }

    _label(periodo: RateLimitingPeriodo): string {
        return RATE_LIMITING_PERIODO_LABEL[periodo] || periodo;
    }

    _errore(chiave: string): boolean {
        const _ctrl = this._formGroup.get(chiave);
        return !!(_ctrl?.invalid && (_ctrl.dirty || _ctrl.touched));
    }

    _oltreMassimo(chiave: string): boolean {
        return !!this._formGroup.get(chiave)?.hasError('max');
    }

    modifica() {
        this._initForm();
        this._errorMsg = '';
        this._editing = true;
    }

    annulla() {
        this._editing = false;
        this._errorMsg = '';
        this._initForm();
    }

    /** Elenco completo delle quote dell'ambiente: i campi vuoti non assegnano quota. */
    _quoteDaInviare(): RateLimitingAdesioneApi[] {
        const _valori = this._formGroup.getRawValue();
        const _quote: RateLimitingAdesioneApi[] = [];
        this._api.forEach((a: ApiQuoteFruitore) => a.quote.forEach((q: QuotaFruitore) => {
            const _valore = Number(_valori[q.chiave]);
            if (_valori[q.chiave] !== null && _valori[q.chiave] !== '' && Number.isInteger(_valore) && _valore >= 1) {
                _quote.push({ id_api: a.id_api, quota: _valore, periodo: q.periodo });
            }
        }));
        return _quote;
    }

    salva() {
        this._formGroup.markAllAsTouched();
        if (this._formGroup.invalid || this._saving || !this.adesione?.id_adesione) { return; }
        this._saving = true;
        this._errorMsg = '';
        const _body: RateLimitingAdesione = { rate_limiting: this._quoteDaInviare() };
        if (this.mock) {
            this._saving = false;
            this._salvate = _body.rate_limiting;
            this._editing = false;
            this._initForm();
            this.salvato.emit();
            return;
        }
        this.apiService.putElementRelated('adesioni', this.adesione.id_adesione, `${this.environment}/rate-limiting`, _body).subscribe({
            next: (resp: any) => {
                this._saving = false;
                this._salvate = (resp as RateLimitingAdesione)?.rate_limiting || _body.rate_limiting;
                this._editing = false;
                this._initForm();
                this.salvato.emit();
            },
            error: (error: any) => {
                this._saving = false;
                this._errorMsg = this.utils.GetErrorMsg(error);
            }
        });
    }
}
