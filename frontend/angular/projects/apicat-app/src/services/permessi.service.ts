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
import { Injectable } from '@angular/core';

export type PermessiMenu = {
    [chiaveMenu: string]: {
        lettura: string[];
        scrittura: string[];
    };
};

@Injectable({
    providedIn: 'root'
})
export class PermessiService {

    constructor() {}

    verificaPermessi(
        ruoliUtente: string[],
        menu: string,
        permessi: PermessiMenu
    ): { canRead: boolean; canWrite: boolean } {
        const permessiMenu = permessi[menu];

        if (!permessiMenu) {
            return this.getFallbackPermessi(ruoliUtente, permessi);
        }

        const canRead = ruoliUtente.some(ruolo => permessiMenu.lettura.includes(ruolo));
        const canWrite = ruoliUtente.some(ruolo => permessiMenu.scrittura.includes(ruolo));

        return { canRead, canWrite };
    }

    getFallbackPermessi(
        ruoliUtente: string[],
        permessi: PermessiMenu
    ): { canRead: boolean; canWrite: boolean } {
        const permessiMenu = permessi['generale'];

        if (permessiMenu) {
            const canRead = ruoliUtente.some(ruolo => permessiMenu.lettura.includes(ruolo));
            const canWrite = ruoliUtente.some(ruolo => permessiMenu.scrittura.includes(ruolo));

            return { canRead, canWrite };
        }
        return {
            canRead: false,
            canWrite: false
        };
    }
}
