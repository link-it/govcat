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

/** Opzione della select che sostituisce il flag `fruizione` (servizio intermediato). */
export interface OpzioneIntermediazione {
    value: boolean;
    label: string;
    params: any;
    help: string;
}

/** Organizzazione di contesto (`fruizione=false`) oppure organizzazione esterna (`fruizione=true`). */
export function opzioniIntermediazione(nomeOrganizzazione: string | null | undefined): OpzioneIntermediazione[] {
    return [
        {
            value: false,
            label: nomeOrganizzazione ? 'APP.SERVICES.INTERMEDIAZIONE.Interna' : 'APP.SERVICES.INTERMEDIAZIONE.InternaSenzaNome',
            params: { organizzazione: nomeOrganizzazione },
            help: 'fruizione_interna'
        },
        {
            value: true,
            label: 'APP.SERVICES.INTERMEDIAZIONE.Esterna',
            params: {},
            help: 'fruizione_esterna'
        }
    ];
}

/** Opzione corrispondente al valore di `fruizione`. */
export function opzioneIntermediazione(opzioni: OpzioneIntermediazione[], fruizione: any): OpzioneIntermediazione {
    return opzioni.find((opzione: OpzioneIntermediazione) => opzione.value === !!fruizione) || opzioni[0];
}
