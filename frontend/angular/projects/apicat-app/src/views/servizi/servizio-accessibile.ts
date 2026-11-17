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
 * Stato HTTP di un errore: l'interceptor degli errori lo rilancia senza `status`,
 * che resta nel corpo della risposta del backend (`error.status`).
 */
export function statoErrore(error: any): number | undefined {
    return error?.status ?? error?.error?.status;
}

/** Errore che indica un servizio inesistente o non visibile all'utente (404/403). */
export function servizioNonAccessibile(error: any): boolean {
    const _stato = statoErrore(error);
    return _stato === 404 || _stato === 403;
}
