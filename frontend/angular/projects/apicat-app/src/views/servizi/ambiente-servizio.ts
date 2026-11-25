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

export type AmbienteServizio = 'collaudo' | 'produzione';

/** Query param con l'ambiente scelto, condiviso fra vetrina e monitoraggio. */
export const QUERY_PARAM_AMBIENTE = 'ambiente';

/** Stati in cui il servizio è configurato e pubblicato in produzione. */
const STATI_PRODUZIONE: string[] = ['pubblicato_produzione', 'pubblicato_produzione_senza_collaudo'];

/** Stati del collaudo: il servizio ha il collaudo anche con `skip_collaudo`. */
const STATI_COLLAUDO: string[] = ['richiesto_collaudo', 'autorizzato_collaudo', 'in_configurazione_collaudo', 'pubblicato_collaudo'];

/** Servizio senza collaudo: c'è solo la produzione. */
export function collaudoSaltato(servizio: any): boolean {
    return !!servizio?.skip_collaudo && !STATI_COLLAUDO.includes(servizio?.stato);
}

/**
 * Ambiente da mostrare: quello richiesto se valido, altrimenti la produzione per i servizi
 * pubblicati in produzione e il collaudo negli altri casi. Senza collaudo vale solo la produzione.
 */
export function ambienteServizio(servizio: any, richiesto?: string | null): AmbienteServizio {
    if (collaudoSaltato(servizio)) { return 'produzione'; }
    if (richiesto === 'collaudo' || richiesto === 'produzione') { return richiesto; }
    return STATI_PRODUZIONE.includes(servizio?.stato) ? 'produzione' : 'collaudo';
}
