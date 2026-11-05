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
import { TranslateModule } from '@ngx-translate/core';
import { HttpContext } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { OpenAPIService } from '@app/services/openAPI.service';
import { DISABLE_GLOBAL_EXCEPTION_HANDLING } from '@app/lib/interceptors/error.interceptor';
import { LocaleNumberPipe } from '@app/pipes/locale-number.pipe';
import { PillTab, PillTabsComponent } from '@app/components/lnk-ui/pill-tabs/pill-tabs.component';
import {
    ItemRateLimitingFruitore, RATE_LIMITING_PERIODI, RATE_LIMITING_PERIODO_LABEL, RateLimitingPeriodo, RateLimitingRiepilogo,
    RateLimitingServizio, puoGestireRateLimiting
} from '../rate-limiting';
import { apiRiepilogoMock, fruitoriMock, riepilogoMock } from '../rate-limiting.mock';
import { ModificaFruitore, RateLimitingFruitoriComponent } from './rate-limiting-fruitori.component';

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
    imports: [LocaleNumberPipe, CommonModule, TranslateModule, PillTabsComponent, RateLimitingFruitoriComponent]
})
export class ServizioRateLimitingRiepilogoComponent implements OnChanges {

    @Input() idServizio: string | null = null;
    @Input() ambiente: 'collaudo' | 'produzione' = 'collaudo';
    @Input() ruoli: string[] | null = null;
    /** Dati di esempio al posto di quote e fruitori reali; le modifiche restano locali. */
    @Input() mock: boolean = false;

    _fruitoriMock: ItemRateLimitingFruitore[] | null = null;

    _api: ApiRateLimiting[] = [];
    _apiSelezionata: ApiRateLimiting | null = null;
    /** Tab delle API (riferimento stabile), con un avviso sulle API con quote superate. */
    _tabs: PillTab[] = [];
    private _caricamento: number = 0;
    _loading: boolean = false;

    /** Quote del fruitore in modifica, per ricalcolare assegnata e residua. */
    _modifica: ModificaFruitore | null = null;

    constructor(private readonly apiService: OpenAPIService) {}

    get _visibile(): boolean {
        return puoGestireRateLimiting(this.ruoli);
    }

    /** Quote dell'API selezionata. */
    get _colonne(): ColonnaRateLimiting[] {
        return this._apiSelezionata?.colonne || [];
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
        this._modifica = null;
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
        this._modifica = null;
    }

    _onModifica(modifica: ModificaFruitore | null) {
        this._modifica = modifica;
    }

    _label(periodo: RateLimitingPeriodo): string {
        return RATE_LIMITING_PERIODO_LABEL[periodo] || periodo;
    }

    /** Quota assegnata della colonna tenendo conto della modifica in corso. */
    _assegnata(colonna: ColonnaRateLimiting): number {
        if (!this._modifica || !(colonna.chiave in this._modifica.valori)) { return colonna.quota_assegnata; }
        const _prima = (this._modifica.fruitore.rate_limiting || [])
            .find((q) => q.id_api === colonna.id_api && q.periodo === colonna.periodo)?.quota || 0;
        return colonna.quota_assegnata - _prima + (this._modifica.valori[colonna.chiave] || 0);
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
}
