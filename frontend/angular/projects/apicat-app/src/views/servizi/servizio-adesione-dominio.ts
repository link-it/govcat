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
import { AbstractControl, FormGroup } from '@angular/forms';

/** Opzioni di adesione: per ciascuna indica se e' imposta (o bloccata) dal dominio. */
export interface AdesioneDominio {
    multi: boolean;
    disabilitata: boolean;
}

export const ADESIONE_DOMINIO_LIBERA: AdesioneDominio = { multi: false, disabilitata: false };

/** Opzioni che il dominio impone ai propri servizi; "adesione disabilitata" conta solo se la configurazione la consente. */
export function adesioneImpostaDalDominio(dominio: any, consentiNonSottoscrivibile: boolean): AdesioneDominio {
    return {
        multi: !!dominio?.multi_adesione,
        disabilitata: consentiNonSottoscrivibile && !!dominio?.adesione_disabilitata
    };
}

/** Controlli bloccati: quelli imposti e, se i due flag si escludono, anche l'opposto. */
export function adesioneBloccataDalDominio(imposta: AdesioneDominio, esclusivi: boolean): AdesioneDominio {
    return {
        multi: imposta.multi || (esclusivi && imposta.disabilitata),
        disabilitata: imposta.disabilitata || (esclusivi && imposta.multi)
    };
}

/** Imposta i valori richiesti dal dominio e disabilita i controlli bloccati (senza emettere eventi). */
export function applicaAdesioneDominio(form: FormGroup, imposta: AdesioneDominio, esclusivi: boolean): void {
    const bloccata = adesioneBloccataDalDominio(imposta, esclusivi);
    const _applica = (control: AbstractControl | null, bloccato: boolean, valore: boolean) => {
        if (!control || !bloccato) { return; }
        control.setValue(valore, { emitEvent: false });
        control.disable({ emitEvent: false });
    };
    _applica(form.get('multi_adesione'), bloccata.multi, imposta.multi);
    _applica(form.get('adesione_disabilitata'), bloccata.disabilitata, imposta.disabilitata);
}
