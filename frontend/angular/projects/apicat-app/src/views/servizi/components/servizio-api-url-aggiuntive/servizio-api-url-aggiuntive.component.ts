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
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
    MAX_URL_AGGIUNTIVE,
    RigaUrlAggiuntiva,
    UrlInvocazioneAggiuntiva,
    creaRigaUrlAggiuntiva
} from '../../servizio-api-url-aggiuntive';

/** Editor (e vista in sola lettura) delle URL di invocazione aggiuntive di un'API. */
@Component({
    selector: 'app-servizio-api-url-aggiuntive',
    templateUrl: 'servizio-api-url-aggiuntive.component.html',
    styleUrls: ['servizio-api-url-aggiuntive.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule]
})
export class ServizioApiUrlAggiuntiveComponent implements OnChanges {
    @Input() urlArray: FormArray<RigaUrlAggiuntiva> | null = null;
    @Input() isEdit: boolean = false;
    @Input() editable: boolean = true;
    @Input() items: UrlInvocazioneAggiuntiva[] | null = null;

    readonly MAX = MAX_URL_AGGIUNTIVE;

    // Sezione avanzata: chiusa finche' l'utente non la apre
    _aperto: boolean = false;

    ngOnChanges(): void {
        if (!this.urlArray) { return; }
        // Disabilitato: escluso dal valore del form, quindi non inviato (lista invariata lato BE)
        if (this.editable && this.urlArray.disabled) {
            this.urlArray.enable();
        } else if (!this.editable && this.urlArray.enabled) {
            this.urlArray.disable();
        }
    }

    get _righe(): RigaUrlAggiuntiva[] {
        return this.urlArray?.controls || [];
    }

    get _canAdd(): boolean {
        return this.editable && this._righe.length < this.MAX;
    }

    _aggiungi() {
        if (!this.urlArray || !this._canAdd) { return; }
        this.urlArray.push(creaRigaUrlAggiuntiva());
        this.urlArray.markAsDirty();
    }

    _rimuovi(index: number) {
        if (!this.urlArray) { return; }
        this.urlArray.removeAt(index);
        this.urlArray.markAsDirty();
    }

    _sposta(index: number, delta: number) {
        if (!this.urlArray) { return; }
        const _dest = index + delta;
        if (_dest < 0 || _dest >= this._righe.length) { return; }
        const _riga = this.urlArray.at(index);
        this.urlArray.removeAt(index, { emitEvent: false });
        this.urlArray.insert(_dest, _riga);
        this.urlArray.markAsDirty();
    }

    _isDuplicata(index: number): boolean {
        return (this.urlArray?.errors?.['etichettaDuplicata'] || []).includes(index);
    }

    _hasError(riga: RigaUrlAggiuntiva, campo: string): boolean {
        const _ctrl = riga.get(campo);
        return !!_ctrl && _ctrl.invalid && (_ctrl.dirty || _ctrl.touched);
    }

    _etichettaInvalida(riga: RigaUrlAggiuntiva, index: number): boolean {
        return this._hasError(riga, 'etichetta') || this._isDuplicata(index);
    }
}
