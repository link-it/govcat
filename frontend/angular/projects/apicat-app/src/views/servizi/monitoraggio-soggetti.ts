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

/**
 * Soggetti dei path del monitoraggio di un servizio:
 * - `{ambiente}/erogazioni/{soggetto}/...`: il soggetto erogatore, cioè il referente del dominio;
 * - `{ambiente}/fruizioni/{soggetto}/{provider}/...`: il soggetto interno che fruisce (referente del dominio)
 *   e, per le fruizioni, l'ente erogatore remoto del servizio.
 */

export type TipoMonitoraggio = 'erogazioni' | 'fruizioni';

/** Erogazione per le API erogate dal soggetto del dominio di un servizio non di fruizione, altrimenti fruizione. */
export function tipoMonitoraggio(api: any, servizio: any): TipoMonitoraggio {
    return (api?.ruolo === 'erogato_soggetto_dominio' && !servizio?.fruizione) ? 'erogazioni' : 'fruizioni';
}

/** Soggetto interno del path: erogatore per le erogazioni, fruitore per le fruizioni. */
export function soggettoMonitoraggio(servizio: any): string {
    return servizio?.dominio?.soggetto_referente?.nome || '';
}

/** Ente erogatore remoto di un servizio di fruizione (provider delle verifiche). */
export function erogatoreFruizione(servizio: any): string {
    return servizio?.fruizione ? (servizio?.soggetto_erogatore?.nome || '') : '';
}
