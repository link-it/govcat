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
    ItemRateLimitingFruitore, RATE_LIMITING_PERIODI, RateLimiting, RateLimitingAdesioneApi, RateLimitingAdesioneFinalita, RateLimitingFinalita,
    RateLimitingFinalitaEsito, RateLimitingRiepilogo, RateLimitingServizio, RateLimitingVerifica, RateLimitingVerificaPeriodo
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

/**
 * Finalita` PDND di esempio: una conforme, una condivisa e superata, una non trovata sulla PDND, una in
 * attesa della prima approvazione e una rifiutata (lette, ma senza una quota concessa da confrontare).
 */
const MOCK_FINALITA: Array<{ purpose_id: string; titolo?: string; caso: 'conforme' | 'superata' | 'non_trovata' | 'non_approvata' | 'rifiutata' }> = [
    { purpose_id: '7f3c2a10-5b1e-4c8d-9a64-0d2e5f8b1a01', titolo: 'Consultazione anagrafe comunale', caso: 'conforme' },
    { purpose_id: '7f3c2a10-5b1e-4c8d-9a64-0d2e5f8b1a02', titolo: 'Verifica della residenza', caso: 'superata' },
    { purpose_id: '7f3c2a10-5b1e-4c8d-9a64-0d2e5f8b1a03', caso: 'non_trovata' },
    { purpose_id: '7f3c2a10-5b1e-4c8d-9a64-0d2e5f8b1a04', titolo: 'Accesso ai dati catastali', caso: 'non_approvata' },
    { purpose_id: '7f3c2a10-5b1e-4c8d-9a64-0d2e5f8b1a05', titolo: 'Controllo delle autocertificazioni', caso: 'rifiutata' }
];

/** Quota richiesta dalla finalita` di esempio in attesa della prima approvazione. */
const MOCK_QUOTA_IN_ATTESA = 5000;

/**
 * Quota di ciascun fruitore rispetto al massimo per fruitore (o a un quarto della quota totale); 0 = nessuna quota.
 * `finalita`: indice in MOCK_FINALITA (solo adesioni autorizzate).
 */
const MOCK_FRUITORI: Array<{ soggetto: string; id_logico: string | null; stato: string; autorizzata: boolean; fattore: number; finalita?: number }> = [
    { soggetto: 'Comune di Vallefiorita', id_logico: 'VF-01', stato: 'pubblicato_collaudo', autorizzata: true, fattore: 1, finalita: 0 },
    { soggetto: 'Unione dei Comuni del Monte Alto', id_logico: null, stato: 'autorizzato_collaudo', autorizzata: true, fattore: 0.8, finalita: 1 },
    { soggetto: 'Azienda Sanitaria Locale Est', id_logico: 'ASL-EST', stato: 'richiesto_collaudo', autorizzata: false, fattore: 0.6 },
    { soggetto: 'Provincia di Montebello', id_logico: null, stato: 'pubblicato_collaudo', autorizzata: true, fattore: 1, finalita: 1 },
    { soggetto: 'Città Metropolitana di Rivabella', id_logico: 'CMR', stato: 'autorizzato_collaudo', autorizzata: true, fattore: 0, finalita: 2 },
    { soggetto: 'Consorzio Servizi Digitali', id_logico: 'CSD', stato: 'bozza', autorizzata: false, fattore: 0.5 },
    { soggetto: 'Comune di Pratoverde', id_logico: null, stato: 'bozza', autorizzata: false, fattore: 0 },
    { soggetto: 'Comune di Colleverde', id_logico: 'CV', stato: 'autorizzato_collaudo', autorizzata: true, fattore: 0, finalita: 3 },
    { soggetto: 'Comune di Acquachiara', id_logico: null, stato: 'autorizzato_collaudo', autorizzata: true, fattore: 0, finalita: 4 }
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
        _fruitori.push({ soggetto: `Comune di Esempio ${i + 1}`, id_logico: `CE-${i + 1}`, stato: 'bozza', autorizzata: false, fattore: 0 });
    }
    const _elenco = _fruitori.map((f, i) => ({
        id_adesione: `mock-adesione-${i + 1}`,
        id_logico: f.id_logico || undefined,
        soggetto: { nome: f.soggetto },
        stato: f.stato,
        autorizzata: f.autorizzata,
        rate_limiting: f.fattore ? api.flatMap((a) => a.quote.map((q: RateLimiting) => ({
            id_api: a.id_api, periodo: q.periodo, quota: _quotaFruitore(q, f.fattore)
        } as RateLimitingAdesioneApi))) : []
    }));
    assegnaFinalitaMock(_elenco);
    return _elenco;
}

/** Quota giornaliera di un'adesione: somma delle quote giornaliere delle sue API (assente se non ne ha). */
function _quotaGiornaliera(quote: RateLimitingAdesioneApi[]): number | undefined {
    const _giorno = (quote || []).filter((q) => q.periodo === 'giorno');
    return _giorno.length ? _giorno.reduce((t, q) => t + q.quota, 0) : undefined;
}

function _esitoFinalita(finalita: RateLimitingFinalita, richiesta: number | undefined): RateLimitingFinalitaEsito {
    if (finalita.errore || finalita.quota == null) { return 'non_verificabile'; }
    if (richiesta === undefined) { return 'quota_assente'; }
    return richiesta > finalita.quota ? 'superiore' : (richiesta < finalita.quota ? 'inferiore' : 'conforme');
}

/**
 * Finalita` di esempio delle adesioni autorizzate, ricalcolate dalle loro quote giornaliere (anche dopo una
 * modifica): la conforme ha la quota del suo aderente, la condivisa una quota inferiore alla somma.
 */
export function assegnaFinalitaMock(fruitori: ItemRateLimitingFruitore[]): RateLimitingFinalita[] {
    const _indice = (f: ItemRateLimitingFruitore) => MOCK_FRUITORI[Number(f.id_adesione.replace('mock-adesione-', '')) - 1]?.finalita;
    const _elenco = MOCK_FINALITA.map((m, i) => {
        const _aderenti = fruitori.filter((f) => f.autorizzata && _indice(f) === i);
        const _quote = _aderenti.map((f) => _quotaGiornaliera(f.rate_limiting) || 0);
        const _assegnata = _quote.reduce((t, q) => t + q, 0);
        const _finalita: RateLimitingFinalita = { purpose_id: m.purpose_id, quota_assegnata: _assegnata, numero_adesioni: _aderenti.length, superata: false };
        if (m.caso === 'non_trovata') {
            _finalita.errore = 'non_trovata';
        } else if (m.caso === 'non_approvata' || m.caso === 'rifiutata') {
            _finalita.errore = m.caso;
            _finalita.titolo = m.titolo;
            _finalita.stato = m.caso === 'rifiutata' ? 'REJECTED' : 'WAITING_FOR_APPROVAL';
            if (m.caso === 'non_approvata') { _finalita.quota_in_attesa = MOCK_QUOTA_IN_ATTESA; }
        } else {
            _finalita.titolo = m.titolo;
            _finalita.stato = 'ACTIVE';
            _finalita.quota = m.caso === 'conforme' ? (_quote[0] || 1000) : Math.max(Math.round(_assegnata * 0.8), 1);
            if (m.caso === 'superata') { _finalita.quota_in_attesa = _assegnata; }
            _finalita.superata = _assegnata > _finalita.quota;
        }
        return _finalita;
    });
    fruitori.forEach((f) => {
        const _i = _indice(f);
        if (!f.autorizzata || _i === undefined) { f.finalita = []; return; }
        const _richiesta = _quotaGiornaliera(f.rate_limiting);
        f.finalita = [{ quota_richiesta: _richiesta, esito: _esitoFinalita(_elenco[_i], _richiesta), finalita: _elenco[_i] }];
    });
    return _elenco.filter((f) => f.numero_adesioni > 0);
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
        finalita: { [ambiente]: assegnaFinalitaMock(fruitori) },
        api: apiRiepilogoMock(riepilogo, ambiente).map((a) => {
            const _voci: RateLimitingRiepilogo[] = a.quote.map((q: RateLimiting) => {
                const _assegnate = fruitori
                    .map((f) => f.rate_limiting.find((r) => r.id_api === a.id_api && r.periodo === q.periodo)?.quota || 0)
                    .filter((v: number) => v > 0);
                const _assegnata = _assegnate.reduce((t: number, v: number) => t + v, 0);
                const _autorizzate = fruitori
                    .filter((f) => f.autorizzata)
                    .map((f) => f.rate_limiting.find((r) => r.id_api === a.id_api && r.periodo === q.periodo)?.quota || 0)
                    .filter((v: number) => v > 0);
                const _autorizzata = _autorizzate.reduce((t: number, v: number) => t + v, 0);
                const _voce: RateLimitingRiepilogo = {
                    ...q, quota_assegnata: _assegnata, numero_fruitori: _assegnate.length, superata: false,
                    quota_autorizzata: _autorizzata, numero_fruitori_autorizzati: _autorizzate.length
                };
                if (q.quota) {
                    _voce.quota_residua = q.quota - _assegnata;
                    _voce.quota_residua_autorizzata = q.quota - _autorizzata;
                    _voce.superata = _voce.quota_residua < 0;
                }
                return _voce;
            }).sort((x, y) => RATE_LIMITING_PERIODI.indexOf(x.periodo) - RATE_LIMITING_PERIODI.indexOf(y.periodo));
            return { id_api: a.id_api, nome: a.nome, versione: a.versione, collaudo: ambiente === 'collaudo' ? _voci : [], produzione: ambiente === 'produzione' ? _voci : [] };
        })
    };
}

/** Fruitori di esempio coerenti con la verifica di esempio (stesse API e quote). */
export function fruitoriVerificaMock(api: Array<{ id_api: string; nome: string; versione: number }>): ItemRateLimitingFruitore[] {
    return fruitoriMock(apiMock(api || []).map((a, i) => ({ id_api: a.id_api, quote: quoteMock(null, i) })));
}

/**
 * Verifica di esempio di un'adesione da autorizzare: autorizzate e in attesa sono i fruitori di esempio,
 * la richiesta dell'adesione e` la quota salvata o, se assente, una quota di esempio.
 */
export function verificaMock(api: Array<{ id_api: string; nome: string; versione: number }>, richieste: RateLimitingAdesioneApi[] = []): RateLimitingVerifica {
    const _api = apiMock(api || []);
    const _fruitori = fruitoriVerificaMock(api);
    const _somma = (idApi: string, periodo: string, autorizzate: boolean) => {
        const _quote = _fruitori
            .filter((f) => !!f.autorizzata === autorizzate)
            .map((f) => f.rate_limiting.find((r) => r.id_api === idApi && r.periodo === periodo)?.quota || 0)
            .filter((v: number) => v > 0);
        return { quota: _quote.reduce((t: number, v: number) => t + v, 0), numero: _quote.length };
    };
    const _verifica: RateLimitingVerifica = {
        rientra: true,
        api: _api.map((a, i) => ({
            id_api: a.id_api,
            nome: a.nome,
            versione: a.versione,
            rate_limiting: quoteMock(null, i).map((q: RateLimiting) => {
                const _autorizzate = _somma(a.id_api, q.periodo, true);
                const _attesa = _somma(a.id_api, q.periodo, false);
                const _richiesta = richieste.find((r) => r.id_api === a.id_api && r.periodo === q.periodo)?.quota
                    ?? _quotaFruitore(q, 0.9);
                const _voce: RateLimitingVerificaPeriodo = {
                    ...q,
                    quota_richiesta: _richiesta || undefined,
                    quota_autorizzata: _autorizzate.quota,
                    numero_fruitori_autorizzati: _autorizzate.numero,
                    quota_in_attesa: _attesa.quota,
                    numero_fruitori_in_attesa: _attesa.numero,
                    sfora: false
                };
                if (q.quota) {
                    _voce.quota_residua = q.quota - _autorizzate.quota;
                    _voce.sfora = !!_richiesta && _richiesta > _voce.quota_residua;
                }
                return _voce;
            }).sort((x, y) => RATE_LIMITING_PERIODI.indexOf(x.periodo) - RATE_LIMITING_PERIODI.indexOf(y.periodo))
        }))
    };
    _verifica.rientra = !_verifica.api.some((a) => a.rate_limiting.some((v) => v.sfora));
    _verifica.finalita = _finalitaVerificaMock(_verifica, _fruitori);
    return _verifica;
}

/** Finalita` dell'adesione in verifica: la condivisa di esempio, con la quota giornaliera richiesta. */
function _finalitaVerificaMock(verifica: RateLimitingVerifica, fruitori: ItemRateLimitingFruitore[]): RateLimitingAdesioneFinalita[] {
    const _condivisa = fruitori.flatMap((f) => f.finalita || []).find((x) => x.finalita.purpose_id === MOCK_FINALITA[1].purpose_id)?.finalita;
    if (!_condivisa) { return []; }
    const _richiesta = _quotaGiornaliera(verifica.api.flatMap((a) => a.rate_limiting
        .filter((v) => v.quota_richiesta)
        .map((v) => ({ id_api: a.id_api, periodo: v.periodo, quota: v.quota_richiesta as number }))));
    const _assegnata = _condivisa.quota_assegnata + (_richiesta || 0);
    const _finalita: RateLimitingFinalita = {
        ..._condivisa, quota_assegnata: _assegnata, numero_adesioni: _condivisa.numero_adesioni + 1,
        superata: _condivisa.quota != null && _assegnata > _condivisa.quota
    };
    return [{ quota_richiesta: _richiesta, esito: _esitoFinalita(_finalita, _richiesta), finalita: _finalita }];
}
