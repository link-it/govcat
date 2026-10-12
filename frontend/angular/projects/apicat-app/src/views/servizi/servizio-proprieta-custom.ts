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
 * Visibilita` di una proprieta` custom in base a `ruoli_abilitati` (come nelle adesioni):
 * assente -> visibile a tutti; lista vuota -> nessun ruolo abilitato; altrimenti serve almeno
 * un ruolo in comune con quelli dell'utente sul servizio.
 */
export function proprietaVisibilePerRuoli(proprieta: { ruoli_abilitati?: string[] | null }, ruoliUtente: string[]): boolean {
    if (!proprieta?.ruoli_abilitati) { return true; }
    return proprieta.ruoli_abilitati.some((ruolo: string) => (ruoliUtente || []).includes(ruolo));
}

/** Gruppi di proprieta` custom con i soli campi visibili; i gruppi rimasti vuoti vengono tolti. */
export function filtraGruppiPerRuoli<T extends { ruoli_abilitati?: string[] | null }>(gruppi: Record<string, T[]>, ruoliUtente: string[]): Record<string, T[]> {
    const _risultato: Record<string, T[]> = {};
    Object.entries(gruppi || {}).forEach(([gruppo, campi]) => {
        const _visibili = (campi || []).filter((campo: T) => proprietaVisibilePerRuoli(campo, ruoliUtente));
        if (_visibili.length > 0) { _risultato[gruppo] = _visibili; }
    });
    return _risultato;
}
