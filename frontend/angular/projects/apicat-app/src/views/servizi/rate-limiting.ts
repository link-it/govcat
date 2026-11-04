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
/** Periodi del rate limiting ammessi dal backend (gli stessi di GovWay). */
export type RateLimitingPeriodo = 'giorno' | 'ora' | 'minuto';

export const RATE_LIMITING_PERIODI: RateLimitingPeriodo[] = ['giorno', 'ora', 'minuto'];

export const RATE_LIMITING_PERIODO_LABEL: Record<RateLimitingPeriodo, string> = {
    giorno: 'APP.LABEL.Giorno',
    ora: 'APP.LABEL.Ora',
    minuto: 'APP.LABEL.Minuto'
};

/** Quote dichiarate dal servizio per un'API, un ambiente e un periodo: totale e/o massima per fruitore. */
export interface RateLimiting {
    periodo: RateLimitingPeriodo;
    quota?: number;
    quota_fruitore?: number;
}

/** Quota assegnata al fruitore di un'adesione per un'API e un periodo. */
export interface RateLimitingAdesioneApi {
    id_api: string;
    periodo: RateLimitingPeriodo;
    quota: number;
}

export interface RateLimitingAdesione {
    rate_limiting: RateLimitingAdesioneApi[];
}

/** Quote del servizio confrontate con la somma delle quote dei fruitori (residua solo con la quota totale). */
export interface RateLimitingRiepilogo extends RateLimiting {
    quota_assegnata: number;
    quota_residua?: number;
    numero_fruitori: number;
    superata: boolean;
}

export interface RateLimitingServizioApi {
    id_api: string;
    nome: string;
    versione: number;
    collaudo: RateLimitingRiepilogo[];
    produzione: RateLimitingRiepilogo[];
}

export interface RateLimitingServizio {
    api: RateLimitingServizioApi[];
}

export interface ItemRateLimitingFruitore {
    id_adesione: string;
    id_logico?: string;
    soggetto: any;
    stato: string;
    rate_limiting: RateLimitingAdesioneApi[];
}

export const RUOLO_EROGATO_SOGGETTO_DOMINIO = 'erogato_soggetto_dominio';

/** Ruoli (grant del servizio) di chi gestisce il servizio e ne vede il riepilogo del rate limiting. */
export const RUOLI_GESTIONE_RATE_LIMITING = ['gestore', 'referente', 'referente_tecnico', 'referente_superiore', 'referente_tecnico_superiore'];

/** Il rate limiting si definisce solo sulle API erogate dal soggetto del dominio. */
export function rateLimitingApplicabile(api: any): boolean {
    return api?.ruolo === RUOLO_EROGATO_SOGGETTO_DOMINIO;
}

/** Quota prevista dalla regola dei profili: `ruoliAbilitati` null = tutti i ruoli. */
export interface RegolaQuota {
    required: boolean;
    ruoliAbilitati: string[] | null;
}

/** Regola del rate limiting di un'API; una quota null non e` prevista. */
export interface RegolaRateLimiting {
    periodi: RateLimitingPeriodo[];
    quotaTotale: RegolaQuota | null;
    quotaFruitore: RegolaQuota | null;
}

const REGOLA_DEFAULT = { periodi: RATE_LIMITING_PERIODI, quota_totale: { required: false } };

function _combinaQuote(quote: any[]): RegolaQuota | null {
    const _previste = quote.filter((q: any) => !!q);
    if (!_previste.length) { return null; }
    let _ruoli: string[] | null = null;
    _previste.filter((q: any) => Array.isArray(q.ruoli_abilitati)).forEach((q: any) => {
        _ruoli = _ruoli === null ? [...q.ruoli_abilitati] : (_ruoli as string[]).filter((r: string) => q.ruoli_abilitati.includes(r));
    });
    return { required: _previste.some((q: any) => q.required === true), ruoliAbilitati: _ruoli };
}

/**
 * Regola del rate limiting di un'API dai profili selezionati (`rate_limiting` dei profili in configurazione),
 * combinata come nel backend: periodi in intersezione, quota prevista e `required` se lo sono in almeno un
 * profilo, `ruoli_abilitati` in intersezione fra i profili che li indicano.
 */
export function regolaRateLimiting(gruppiAuthType: Array<{ profilo?: string }> | null | undefined, profili: any[]): RegolaRateLimiting {
    const _codici = (gruppiAuthType || []).map((g) => g?.profilo).filter(Boolean);
    const _regole = (profili || [])
        .filter((p: any) => _codici.includes(p?.codice_interno))
        .map((p: any) => p.rate_limiting || REGOLA_DEFAULT);
    if (!_regole.length) { _regole.push(REGOLA_DEFAULT); }
    return {
        periodi: RATE_LIMITING_PERIODI.filter((p: RateLimitingPeriodo) => _regole.every((r: any) => (r.periodi || []).includes(p))),
        quotaTotale: _combinaQuote(_regole.map((r: any) => r.quota_totale)),
        quotaFruitore: _combinaQuote(_regole.map((r: any) => r.quota_fruitore))
    };
}

/** Quota modificabile con i ruoli dell'utente sul servizio (stessa semantica dei gruppi di proprieta` custom). */
export function quotaModificabile(quota: RegolaQuota | null, ruoli: string[] | null | undefined): boolean {
    if (!quota) { return false; }
    return quota.ruoliAbilitati === null || (ruoli || []).some((r: string) => (quota.ruoliAbilitati as string[]).includes(r));
}

export function puoGestireRateLimiting(ruoli: string[] | null | undefined): boolean {
    return (ruoli || []).some((r: string) => RUOLI_GESTIONE_RATE_LIMITING.includes(r));
}

/** Periodi ancora sceglibili per la riga `indice`: esclusi quelli usati dalle altre righe. */
export function periodiDisponibili(righe: Array<{ periodo?: string | null }>, indice: number): RateLimitingPeriodo[] {
    const _usati = righe.filter((_r, i: number) => i !== indice).map((r) => r?.periodo).filter(Boolean);
    return RATE_LIMITING_PERIODI.filter((p: RateLimitingPeriodo) => !_usati.includes(p));
}

function _quotaValida(valore: any): number | undefined {
    const _n = Number(valore);
    return (valore !== null && valore !== '' && valore !== undefined && Number.isInteger(_n) && _n >= 1) ? _n : undefined;
}

/**
 * Quote da inviare a partire dalle righe del form: solo i periodi e le quote ammessi dalla regola,
 * con almeno una quota valida, ordinati per periodo.
 */
export function quoteDaRighe(righe: Array<{ periodo?: any; quota?: any; quota_fruitore?: any }>, regola: RegolaRateLimiting): RateLimiting[] {
    return (righe || [])
        .filter((r) => regola.periodi.includes(r?.periodo))
        .map((r) => {
            const _voce: RateLimiting = { periodo: r.periodo };
            const _quota = regola.quotaTotale ? _quotaValida(r.quota) : undefined;
            const _fruitore = regola.quotaFruitore ? _quotaValida(r.quota_fruitore) : undefined;
            if (_quota !== undefined) { _voce.quota = _quota; }
            if (_fruitore !== undefined) { _voce.quota_fruitore = _fruitore; }
            return _voce;
        })
        .filter((r) => r.quota !== undefined || r.quota_fruitore !== undefined)
        .sort((a, b) => RATE_LIMITING_PERIODI.indexOf(a.periodo) - RATE_LIMITING_PERIODI.indexOf(b.periodo));
}

/**
 * Adegua le quote salvate a una nuova regola (es. dopo un cambio di profilo): toglie i periodi non
 * ammessi e le quote non previste. `modificate` indica se e` cambiato qualcosa.
 */
export function adeguaQuote(quote: RateLimiting[], regola: RegolaRateLimiting): { quote: RateLimiting[]; modificate: boolean } {
    let _modificate = false;
    const _adeguate: RateLimiting[] = [];
    (quote || []).forEach((q: RateLimiting) => {
        if (!regola.periodi.includes(q.periodo)) { _modificate = true; return; }
        const _voce: RateLimiting = { periodo: q.periodo };
        if (q.quota != null) { if (regola.quotaTotale) { _voce.quota = q.quota; } else { _modificate = true; } }
        if (q.quota_fruitore != null) { if (regola.quotaFruitore) { _voce.quota_fruitore = q.quota_fruitore; } else { _modificate = true; } }
        if (_voce.quota != null || _voce.quota_fruitore != null) { _adeguate.push(_voce); } else { _modificate = true; }
    });
    return { quote: _adeguate, modificate: _modificate };
}
