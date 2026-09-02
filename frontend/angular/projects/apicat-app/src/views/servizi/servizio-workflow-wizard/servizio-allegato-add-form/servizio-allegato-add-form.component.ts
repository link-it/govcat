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

import { Tools, COMPONENTS_IMPORTS } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MarkAsteriskDirective } from '@app/directives/mark-asterisk/mark-asterisk.directive';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Grant } from '@app/model/grant';
import { TipologiaAllegatoEnum } from '@app/model/tipologiaAllegatoEnum';

/**
 * Form INLINE di aggiunta allegato del servizio (stessa logica della
 * `AllegatiDialogComponent`, ma senza modale). Emette `saved` dopo l'inserimento
 * e `close` su annulla.
 *
 * In `draftMode` (creazione: servizio non ancora esistente) NON effettua la POST
 * ma emette il payload `{ allegati }` che il wizard accumula per la cascata.
 * Altrimenti effettua `POST /servizi/:id/allegati` (array).
 */
@Component({
    selector: 'app-servizio-allegato-add-form',
    templateUrl: 'servizio-allegato-add-form.component.html',
    styleUrls: ['servizio-allegato-add-form.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        MarkAsteriskDirective
    ]
})
export class ServizioAllegatoAddFormComponent implements OnInit {
    static readonly Name = 'ServizioAllegatoAddFormComponent';

    @Input() model: string = 'servizi';
    @Input() id: string | null = null;
    @Input() grant: Grant | null = null;
    /** Se true (creazione) emette il payload invece di postare. */
    @Input() draftMode: boolean = false;
    /** Mostra il selettore di tipologia (altrimenti forzata a Generico). */
    @Input() showAllAttachments: boolean = true;
    /** Consente il caricamento di più file in un solo inserimento. */
    @Input() multiple: boolean = true;

    @Output() saved = new EventEmitter<any>();
    @Output() close = new EventEmitter<void>();

    editFormGroup: FormGroup = new FormGroup({});
    descrittoreCtrl: FormControl = new FormControl('', [Validators.required]);
    files: any[] = [];

    tipiAllegati: any[] = Tools.TipiAllegati;
    tipiVisibilitaAllegato: any[] = [];

    saving: boolean = false;
    error: boolean = false;
    errorMsg: string = '';

    constructor(
        private readonly apiService: OpenAPIService,
        private readonly authenticationService: AuthenticationService
    ) { }

    ngOnInit() {
        this.tipiVisibilitaAllegato = Tools.Configurazione?.servizio?.visibilita_allegati_consentite
            .filter((item: string) => !((item === 'gestore') && !this.authenticationService.isGestore(this.grant?.ruoli)))
            .map((item: string) => ({ label: item, value: item }));
        this.initForm();
    }

    get f(): { [key: string]: AbstractControl } {
        return this.editFormGroup.controls;
    }

    initForm() {
        this.files = [];
        const _tipologia = this.showAllAttachments ? null : TipologiaAllegatoEnum.Generico;
        this.editFormGroup = new FormGroup({
            filename: new FormControl(null, this.multiple ? [] : [Validators.required]),
            estensione: new FormControl(null, this.multiple ? [] : [Validators.required]),
            descrizione: new FormControl(null, []),
            visibilita: new FormControl(null, [Validators.required]),
            tipologia: new FormControl(_tipologia, [Validators.required]),
            content: new FormControl(null, (!this.multiple) ? [Validators.required] : []),
            files: new FormControl(null, this.multiple ? [Validators.required] : [])
        });
        this.descrittoreCtrl.setValue(null);
    }

    hasControlError(name: string) {
        return (this.f[name] && this.f[name].errors && this.f[name].touched);
    }

    descrittoreChange(value: any) {
        const controls = this.editFormGroup.controls;
        if (this.multiple) {
            if (value && value.data) {
                this.files.push({ filename: value.file, estensione: value.type, content: value.data });
                controls.files.setValue(this.files);
                if (this.files.length === 1) {
                    controls.filename.patchValue(value.file);
                    controls.filename.setValidators(Validators.required);
                    controls.estensione.patchValue(value.type);
                    controls.content.patchValue(value.data);
                } else {
                    controls.filename.patchValue(null);
                    controls.filename.clearValidators();
                    controls.estensione.patchValue(null);
                    controls.content.patchValue(null);
                }
                this.descrittoreCtrl.setValue('');
            }
        } else {
            controls.filename.setValidators(Validators.required);
            controls.estensione.setValidators(Validators.required);
            controls.content.setValidators(Validators.required);
            controls.filename.patchValue(value.file || value.filename);
            controls.estensione.patchValue(value.type || value.estensione);
            controls.content.patchValue(value.data || null);
        }
        controls.filename.updateValueAndValidity();
        controls.estensione.updateValueAndValidity();
        controls.content.updateValueAndValidity();
        this.editFormGroup.updateValueAndValidity();
        this.resetError();
    }

    removeFile(index: number) {
        this.files.splice(index, 1);
        const controls = this.editFormGroup.controls;
        controls.files.setValue(this.files);
        if (this.files.length === 1) {
            controls.filename.patchValue(this.files[0].filename);
            controls.filename.setValidators(Validators.required);
            controls.estensione.patchValue(this.files[0].estensione);
            controls.content.patchValue(this.files[0].content);
        } else {
            controls.filename.patchValue(null);
            controls.filename.clearValidators();
            controls.estensione.patchValue(null);
            controls.content.patchValue(null);
        }
        this.resetError();
    }

    save(body: any) {
        this.resetError();
        if (!this.showAllAttachments) { body.tipologia = Tools.Allegati?.GENERICO?.Code ?? TipologiaAllegatoEnum.Generico; }
        const _allegati: any[] = [];
        if (this.multiple) {
            const _fileCount = (body.files || []).length;
            (body.files || []).forEach((file: any) => {
                _allegati.push({
                    tipologia: body.tipologia,
                    visibilita: body.visibilita,
                    descrizione: body.descrizione,
                    filename: _fileCount > 1 ? file.filename : body.filename,
                    content_type: file.estensione,
                    content: file.content
                });
            });
        } else {
            _allegati.push({
                tipologia: body.tipologia,
                visibilita: body.visibilita,
                descrizione: body.descrizione,
                filename: body.filename,
                content_type: body.estensione,
                content: body.content
            });
        }

        if (this.draftMode) {
            this.saved.emit({ allegati: _allegati });
            return;
        }

        this.saving = true;
        this.apiService.postElementRelated(this.model, this.id, 'allegati', _allegati).subscribe({
            next: () => { this.saving = false; this.saved.emit(true); },
            error: (error: any) => { this.saving = false; this.error = true; this.errorMsg = Tools.GetErrorMsg(error); }
        });
    }

    cancel() {
        this.close.emit();
    }

    resetError() {
        this.error = false;
        this.errorMsg = '';
    }
}
