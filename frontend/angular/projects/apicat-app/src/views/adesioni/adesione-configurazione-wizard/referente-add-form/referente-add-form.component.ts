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
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { COMPONENTS_IMPORTS } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

/**
 * Form inline per aggiungere un referente all'adesione (Issue 254
 * NEW LAYOUT, rev. 4.29). Sostituisce la `ModalAddReferentComponent`
 * (dialog) col rendering inline dentro il wizard nuovo layout.
 *
 * Inputs:
 *  - `id`: id_adesione (per costruire il path del POST);
 *  - `model`: modello backend (default `'adesioni'`, retro-compat);
 *  - `adesione`: oggetto adesione (serve per filtrare la search
 *    utenti dell'organizzazione del soggetto).
 *
 * Outputs:
 *  - `(saved)`: emesso al successo del POST `/<model>/<id>/referenti`;
 *  - `(close)`: emesso al click su "Annulla".
 *
 * Logica equivalente alla `ModalAddReferentComponent.searchReferente`
 * (filtro per `referente` -> utenti dell'organizzazione,
 * `referente_tecnico` -> utenti con flag).
 */
@Component({
    selector: 'app-referente-add-form',
    standalone: true,
    templateUrl: './referente-add-form.component.html',
    styleUrls: ['./referente-add-form.component.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
    ],
})
export class ReferenteAddFormComponent implements OnInit {

    @Input() id: number | string | null = null;
    @Input() adesione: any = null;
    @Input() model: string = 'adesioni';

    @Output() saved = new EventEmitter<any>();
    @Output() close = new EventEmitter<void>();

    /** FormGroup pubblico per il template (`[formGroup]`). */
    formGroup: FormGroup = new FormGroup({});

    /** Tipo correntemente selezionato (`referente` | `referente_tecnico`).
     *  Pilota il filtro della search utenti. */
    referentiTipo: string | null = null;

    /** Errore lato server post-save. */
    error: boolean = false;
    errorMsg: string = '';

    /** Stato di saving (per mostrare lo spinner sul bottone Salva). */
    saving: boolean = false;

    /** Anagrafica statica del dropdown "Ruolo". */
    readonly anagraficheTipo: { value: string; label: string }[] = [
        { label: 'APP.ROLE.referente', value: 'referente' },
        { label: 'APP.ROLE.referente_tecnico', value: 'referente_tecnico' },
    ];

    constructor(
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService,
    ) {}

    ngOnInit(): void {
        this.formGroup = new FormGroup({
            tipo: new FormControl(null, [Validators.required]),
            id_utente: new FormControl({ value: null, disabled: true }, [Validators.required]),
        });
    }

    get f(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }

    onChangeTipo(event: any): void {
        this.referentiTipo = event?.value || null;
        const idUtenteCtrl = this.formGroup.get('id_utente');
        if (this.referentiTipo) {
            idUtenteCtrl?.enable();
        } else {
            idUtenteCtrl?.disable();
        }
        idUtenteCtrl?.setValue(null);
    }

    /** Search service per il dropdown "Ruolo" (statico). */
    getSearchTipo() {
        return (_term: string) => of(this.anagraficheTipo);
    }

    /** Search service per il dropdown "Utente". Filtra per:
     *  - `referente`: utenti dell'organizzazione del soggetto;
     *  - `referente_tecnico`: utenti con flag `referente_tecnico`. */
    getSearchUtente() {
        return (term: string): Observable<any[]> => {
            if (!term) { return of([]); }
            const opts: any = { params: { q: term, stato: 'abilitato' } };
            if (this.referentiTipo === 'referente') {
                opts.params.id_organizzazione = this.adesione?.soggetto?.organizzazione?.id_organizzazione;
            } else {
                opts.params.referente_tecnico = true;
            }
            return this.apiService.getList('utenti', opts).pipe(
                map((resp: any) => {
                    if (resp?.Error || !resp?.content) { return []; }
                    return resp.content.map((u: any) => ({
                        label: `${u.nome} ${u.cognome}`,
                        value: u.id_utente,
                    }));
                })
            );
        };
    }

    onSubmit(): void {
        if (this.formGroup.invalid || this.saving) { return; }
        this.error = false;
        this.errorMsg = '';
        this.saving = true;
        const body = this.formGroup.getRawValue();
        this.apiService.postElementRelated(this.model, this.id as any, 'referenti', body).subscribe({
            next: (response: any) => {
                this.saving = false;
                this.saved.emit(response);
            },
            error: (err: any) => {
                this.saving = false;
                this.error = true;
                this.errorMsg = this.utils.GetErrorMsg(err);
            }
        });
    }

    onCancel(): void {
        this.close.emit();
    }
}
