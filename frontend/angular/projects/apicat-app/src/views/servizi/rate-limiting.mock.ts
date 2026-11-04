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
import {
    ItemRateLimitingFruitore, RATE_LIMITING_PERIODI, RateLimiting, RateLimitingAdesioneApi, RateLimitingRiepilogo, RateLimitingServizio
} from './rate-limiting';

/**
 * Dati di esempio del rate limiting, per mostrare le sezioni senza dati reali
 * (`AppConfig.Services.rateLimitingMock` in app-config.json). Nessun salvataggio verso il backend.
 */

/** Numero di API mostrate con i dati di esempio: se il servizio ne ha meno si aggiungono API fittizie. */
export const RATE_LIMITING_MOCK_API = 3;

/** Quote di esempio dichiarate dal servizio, una combinazione diversa per ogni API. */
export const RATE_LIMITING_MOCK_QUOTE: RateLimiting[][] = [
    [{ periodo: 'giorno', quota: 10000, quota_fruitore: 3000 }, { periodo: 'ora', quota: 600, quota_fruitore: 150 }],
    [{ periodo: 'giorno', quota: 5000 }],
    [{ periodo: 'giorno', quota: 20000, quota_fruitore: 4000 }, { periodo: 'minuto', quota_fruitore: 20 }]
];

/** Quota di ciascun fruitore rispetto al massimo per fruitore (o a un quarto della quota totale); 0 = nessuna quota. */
const MOCK_FRUITORI = [
    { soggetto: 'Comune di Vallefiorita', id_logico: 'VF-01', stato: 'pubblicato_collaudo', fattore: 1 },
    { soggetto: 'Unione dei Comuni del Monte Alto', id_logico: null, stato: 'autorizzato_collaudo', fattore: 0.8 },
    { soggetto: 'Azienda Sanitaria Locale Est', id_logico: 'ASL-EST', stato: 'richiesto_collaudo', fattore: 0.6 },
    { soggetto: 'Provincia di Montebello', id_logico: null, stato: 'pubblicato_collaudo', fattore: 1 },
    { soggetto: 'Consorzio Servizi Digitali', id_logico: 'CSD', stato: 'bozza', fattore: 0.5 },
    { soggetto: 'Comune di Pratoverde', id_logico: null, stato: 'bozza', fattore: 0 }
];

/** Fruitori di esempio in tutto: oltre ai precedenti, adesioni senza quote (per mostrare la paginazione). */
export const RATE_LIMITING_MOCK_FRUITORI = 45;

export function rateLimitingMockAttivo(configurazione: any): boolean {
    return configurazione?.AppConfig?.Services?.rateLimitingMock === true;
}

/** Quote di esempio della `indice`-esima API, se l'API non ne dichiara. */
export function quoteMock(quote: RateLimiting[] | null | undefined, indice: number = 0): RateLimiting[] {
    if (quote && quote.length) { return quote; }
    return RATE_LIMITING_MOCK_QUOTE[indice % RATE_LIMITING_MOCK_QUOTE.length].map((q) => ({ ...q }));
}

/** API mostrate con i dati di esempio: le prime del servizio, completate con API fittizie. */
export function apiMock<T extends { id_api: string }>(api: T[]): Array<T | { id_api: string; nome: string; versione: number }> {
    const _api: Array<T | { id_api: string; nome: string; versione: number }> = (api || []).slice(0, RATE_LIMITING_MOCK_API);
    for (let i = _api.length; i < RATE_LIMITING_MOCK_API; i++) {
        _api.push({ id_api: `mock-api-${i + 1}`, nome: `API di esempio ${i + 1}`, versione: 1 });
    }
    return _api;
}

function _quotaFruitore(voce: RateLimiting, fattore: number): number {
    const _base = voce.quota_fruitore || Math.round((voce.quota || 0) / 4);
    return Math.round(_base * fattore);
}

/** Fruitori di esempio con le quote per le API indicate, secondo le quote di esempio di ciascuna. */
export function fruitoriMock(api: Array<{ id_api: string; quote: RateLimiting[] }>): ItemRateLimitingFruitore[] {
    const _fruitori = [...MOCK_FRUITORI];
    for (let i = _fruitori.length; i < RATE_LIMITING_MOCK_FRUITORI; i++) {
        _fruitori.push({ soggetto: `Comune di Esempio ${i + 1}`, id_logico: `CE-${i + 1}`, stato: 'bozza', fattore: 0 });
    }
    return _fruitori.map((f, i) => ({
        id_adesione: `mock-adesione-${i + 1}`,
        id_logico: f.id_logico || undefined,
        soggetto: { nome: f.soggetto },
        stato: f.stato,
        rate_limiting: f.fattore ? api.flatMap((a) => a.quote.map((q: RateLimiting) => ({
            id_api: a.id_api, periodo: q.periodo, quota: _quotaFruitore(q, f.fattore)
        } as RateLimitingAdesioneApi))) : []
    }));
}

/** API del riepilogo con le quote di esempio dell'ambiente (quelle reali se gia` dichiarate). */
export function apiRiepilogoMock(riepilogo: RateLimitingServizio | null, ambiente: 'collaudo' | 'produzione'): Array<{ id_api: string; nome: string; versione: number; quote: RateLimiting[] }> {
    return apiMock(riepilogo?.api || []).map((a: any, i: number) => ({
        id_api: a.id_api, nome: a.nome, versione: a.versione, quote: quoteMock(a[ambiente], i)
    }));
}

/** Riepilogo di un ambiente ricalcolato dalle quote del servizio e da quelle dei fruitori. */
export function riepilogoMock(riepilogo: RateLimitingServizio | null, fruitori: ItemRateLimitingFruitore[], ambiente: 'collaudo' | 'produzione'): RateLimitingServizio {
    return {
        api: apiRiepilogoMock(riepilogo, ambiente).map((a) => {
            const _voci: RateLimitingRiepilogo[] = a.quote.map((q: RateLimiting) => {
                const _assegnate = fruitori
                    .map((f) => f.rate_limiting.find((r) => r.id_api === a.id_api && r.periodo === q.periodo)?.quota || 0)
                    .filter((v: number) => v > 0);
                const _assegnata = _assegnate.reduce((t: number, v: number) => t + v, 0);
                const _voce: RateLimitingRiepilogo = { ...q, quota_assegnata: _assegnata, numero_fruitori: _assegnate.length, superata: false };
                if (q.quota) {
                    _voce.quota_residua = q.quota - _assegnata;
                    _voce.superata = _voce.quota_residua < 0;
                }
                return _voce;
            }).sort((x, y) => RATE_LIMITING_PERIODI.indexOf(x.periodo) - RATE_LIMITING_PERIODI.indexOf(y.periodo));
            return { id_api: a.id_api, nome: a.nome, versione: a.versione, collaudo: ambiente === 'collaudo' ? _voci : [], produzione: ambiente === 'produzione' ? _voci : [] };
        })
    };
}
