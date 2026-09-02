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
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { COMPONENTS_IMPORTS } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService, RUOLI_ORG_REFERENTE } from '@app/services/utils.service';

import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';

/**
 * Form inline di aggiunta referente del servizio (pattern
 * `<app-referente-add-form>` delle adesioni). Emette `saved` dopo il
 * `POST /servizi/:id/referenti` e `close` su annulla.
 */
@Component({
    selector: 'app-servizio-referente-add-form',
    templateUrl: 'servizio-referente-add-form.component.html',
    styleUrls: ['servizio-referente-add-form.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS
    ]
})
export class ServizioReferenteAddFormComponent implements OnInit {
    static readonly Name = 'ServizioReferenteAddFormComponent';

    @Input() id: string | number | null = null;
    /** Id organizzazione del dominio (referente) per filtrare gli utenti. */
    @Input() idOrganizzazione: string | null = null;
    @Input() model: string = 'servizi';

    @Output() saved = new EventEmitter<any>();
    @Output() close = new EventEmitter<void>();

    _formGroup: FormGroup = new FormGroup({});
    saving: boolean = false;
    _error: boolean = false;
    _errorMsg: string = '';

    minLengthTerm: number = 1;
    referenti$!: Observable<any[]>;
    referentiInput$ = new Subject<string>();
    referentiLoading: boolean = false;

    tipiReferente = [
        { value: 'referente', label: 'APP.ROLE.referente' },
        { value: 'referente_tecnico', label: 'APP.ROLE.referente_tecnico' }
    ];

    constructor(
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService
    ) {}

    ngOnInit() {
        this._formGroup = new FormGroup({
            tipo: new FormControl(null, [Validators.required]),
            id_utente: new FormControl({ value: null, disabled: true }, [Validators.required])
        });
        this._initReferentiSelect([]);
    }

    get f(): { [key: string]: AbstractControl } {
        return this._formGroup.controls;
    }

    _hasControlError(name: string) {
        return !!(this.f[name]?.errors && this.f[name]?.touched);
    }

    onChangeTipo(_event: any) {
        const tipo = this._formGroup.get('tipo')?.value;
        if (tipo) {
            this._formGroup.get('id_utente')?.enable();
        } else {
            this._formGroup.get('id_utente')?.disable();
        }
        this._formGroup.get('id_utente')?.patchValue(null);
        this._initReferentiSelect([]);
    }

    _initReferentiSelect(defaultValue: any[] = []) {
        this.referenti$ = concat(
            of(defaultValue),
            this.referentiInput$.pipe(
                filter((res) => res !== null && res.length >= this.minLengthTerm),
                distinctUntilChanged(),
                debounceTime(400),
                tap(() => this.referentiLoading = true),
                switchMap((term: any) => this.utils.getUtenti(term, null, 'abilitato', this.idOrganizzazione, RUOLI_ORG_REFERENTE).pipe(
                    catchError(() => of([])),
                    tap(() => this.referentiLoading = false)
                ))
            )
        );
    }

    onSubmit() {
        this._formGroup.markAllAsTouched();
        if (this._formGroup.invalid || this.saving) { return; }
        this._error = false;
        this._errorMsg = '';
        const body = {
            tipo: this._formGroup.get('tipo')?.value,
            id_utente: this._formGroup.get('id_utente')?.value
        };
        this.saving = true;
        this.apiService.postElementRelated(this.model, this.id, 'referenti', body).subscribe({
            next: (response: any) => {
                this.saving = false;
                this.saved.emit(response);
            },
            error: (error: any) => {
                this.saving = false;
                this._error = true;
                this._errorMsg = error?.details || this.utils.GetErrorMsg(error);
            }
        });
    }

    onCancel() {
        this.close.emit();
    }
}
