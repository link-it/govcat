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
