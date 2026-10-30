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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';

/** Dati del rifiuto: oggetto e testo della comunicazione ai referenti. */
export interface WizardRifiuto {
    oggetto: string;
    testo: string;
}

/**
 * Form inline di rifiuto di una richiesta nei wizard di servizi e adesioni:
 * oggetto pre-compilato (modificabile) e motivo obbligatorio. Emette
 * `conferma` con i dati della comunicazione e `annulla`.
 */
@Component({
    selector: 'app-wizard-rifiuto-form',
    templateUrl: 'wizard-rifiuto-form.component.html',
    styleUrls: ['wizard-rifiuto-form.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, LnkButtonComponent]
})
export class WizardRifiutoFormComponent implements OnInit {
    static readonly Name = 'WizardRifiutoFormComponent';
    private static _seq = 0;

    readonly maxOggetto = 255;
    readonly maxTesto = 4000;
    readonly _idBase = `wizard-rifiuto-${++WizardRifiutoFormComponent._seq}`;

    /** Oggetto proposto. */
    @Input() oggetto: string = '';
    /** Stato a cui torna la richiesta (gia` tradotto), per la descrizione. */
    @Input() statoPrecedente: string = '';
    @Input() saving: boolean = false;
    @Input() errorMsg: string = '';

    @Output() conferma = new EventEmitter<WizardRifiuto>();
    @Output() annulla = new EventEmitter<void>();

    _formGroup: FormGroup = new FormGroup({});

    ngOnInit() {
        this._formGroup = new FormGroup({
            oggetto: new FormControl(this.oggetto, [Validators.required, Validators.maxLength(this.maxOggetto)]),
            testo: new FormControl('', [Validators.required, Validators.maxLength(this.maxTesto)])
        });
    }

    _hasError(name: string, error: string): boolean {
        const control = this._formGroup.get(name);
        return !!(control?.touched && control.errors?.[error]);
    }

    onSubmit() {
        this._formGroup.markAllAsTouched();
        if (this._formGroup.invalid || this.saving) { return; }
        const value = this._formGroup.getRawValue();
        this.conferma.emit({ oggetto: value.oggetto.trim(), testo: value.testo.trim() });
    }

    onCancel() {
        this.annulla.emit();
    }
}
