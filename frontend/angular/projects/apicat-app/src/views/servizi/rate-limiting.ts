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
import { apiHasPdndProfile } from './pdnd-menu.util';

/** Periodi del rate limiting ammessi dal backend (gli stessi di GovWay). */
export type RateLimitingPeriodo = 'giorno' | 'ora' | 'minuto';

export const RATE_LIMITING_PERIODI: RateLimitingPeriodo[] = ['giorno', 'ora', 'minuto'];

export const RATE_LIMITING_PERIODO_LABEL: Record<RateLimitingPeriodo, string> = {
    giorno: 'APP.LABEL.Giorno',
    ora: 'APP.LABEL.Ora',
    minuto: 'APP.LABEL.Minuto'
};

/** Quota complessiva dichiarata dal servizio per un'API, un ambiente e un periodo. */
export interface RateLimiting {
    quota: number;
    periodo: RateLimitingPeriodo;
}

/** Quota assegnata al fruitore di un'adesione per un'API e un periodo. */
export interface RateLimitingAdesioneApi extends RateLimiting {
    id_api: string;
}

export interface RateLimitingAdesione {
    rate_limiting: RateLimitingAdesioneApi[];
}

/** Quota complessiva del servizio confrontata con la somma delle quote dei fruitori. */
export interface RateLimitingRiepilogo extends RateLimiting {
    quota_assegnata: number;
    quota_residua: number;
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

/** API con un profilo PDND (`pdnd_type` in configurazione): il periodo e` solo giornaliero. */
export function rateLimitingSoloGiornaliero(api: any, profili: any[]): boolean {
    return apiHasPdndProfile(api, profili);
}

export function puoGestireRateLimiting(ruoli: string[] | null | undefined): boolean {
    return (ruoli || []).some((r: string) => RUOLI_GESTIONE_RATE_LIMITING.includes(r));
}

/** Periodi ancora sceglibili per la riga `indice`: esclusi quelli usati dalle altre righe. */
export function periodiDisponibili(righe: Array<{ periodo?: string | null }>, indice: number): RateLimitingPeriodo[] {
    const _usati = righe.filter((_r, i: number) => i !== indice).map((r) => r?.periodo).filter(Boolean);
    return RATE_LIMITING_PERIODI.filter((p: RateLimitingPeriodo) => !_usati.includes(p));
}

/**
 * Quote da inviare a partire dalle righe del form: solo quelle con quota intera >= 1, con il
 * periodo indicato, ordinate per periodo. Per le API PDND solo la prima, giornaliera.
 */
export function quoteDaRighe(righe: Array<{ quota?: any; periodo?: any }>, soloGiornaliero: boolean): RateLimiting[] {
    return (righe || [])
        .map((r) => ({ quota: Number(r?.quota), periodo: (soloGiornaliero ? 'giorno' : r?.periodo) as RateLimitingPeriodo }))
        .filter((r) => Number.isInteger(r.quota) && r.quota >= 1 && RATE_LIMITING_PERIODI.includes(r.periodo))
        .filter((_r, i: number) => !soloGiornaliero || i === 0)
        .sort((a, b) => RATE_LIMITING_PERIODI.indexOf(a.periodo) - RATE_LIMITING_PERIODI.indexOf(b.periodo));
}
