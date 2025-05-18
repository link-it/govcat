import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '@app/services/authentication.service';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { Tools } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';

import { Observable, Subject } from 'rxjs';

import { TipologiaAllegatoEnum } from '@app/model/tipologiaAllegatoEnum';
import { Grant } from '@app/model/grant';

@Component({
    selector: 'app-allegati-dialog',
    templateUrl: './allegati-dialog.component.html',
    styleUrls: ['./allegati-dialog.component.scss'],
    standalone: false
})
export class AllegatiDialogComponent implements OnInit {

    onClose!: Subject<any>;

    model: string = '';
    id: string | null = null;
    isNew: boolean = false;
    current: any = null;
    grant: Grant | null = null;

    isEdit: boolean = false;

    editFormGroup: FormGroup = new FormGroup({});
    descrittoreCtrl: FormControl = new FormControl('', [Validators.required]);
    newDescrittore = false;

    multiple: boolean = true;
    files: any [] = [];

    minLengthTerm: number = 1;
    referenti$!: Observable<any[]>;
    referentiInput$ = new Subject<string>();
    referentiLoading: boolean = false;
    referentiFilter: string = '';

    saving: boolean = false;

    tipoAllegato: string = '';
    showAllAttachments: boolean = false;

    tipiAllegati: any[] = Tools.TipiAllegati;

    tipiVisibilitaAllegato: any[] = [];
    
    error: boolean = false;
    errorMsg: string = '';

    showLoading: boolean = true;

    constructor (
        private bsModalRef: BsModalRef,
        private apiService: OpenAPIService,
        private authenticationService: AuthenticationService
    ) {
        this.tipiVisibilitaAllegato = Tools.Configurazione?.servizio?.visibilita_allegati_consentite.filter((item: string) => {
            if ((item === 'gestore') && !this.authenticationService.isGestore(this.grant?.ruoli)) {
                return false;
            }
            return true;
        }).map((item: string) => {
            return { label: item, value: item };
        });
    }

    ngOnInit() {
        this.onClose = new Subject();

        if (this.isNew) {
            this.initEditForm();
        } else {
            this.initEditForm(this.current);
        }
    }

    get f(): { [key: string]: AbstractControl } {
        return this.editFormGroup.controls;
    }
    
    initEditForm(data: any = null) {
        this.files = [];
        const _uuid = data ? data.uuid : null;
        const _filename = data ? data.filename : null;
        const _estensione = data ? data.estensione : null;
        const _descrizione = data ? data.descrizione : null;
        const _visibilita = data ? data.visibilita : null;
        const _tipologia = data ? data.tipologia : (this.showAllAttachments ? null : TipologiaAllegatoEnum.Generico);
        this.editFormGroup = new FormGroup({
            uuid: new FormControl(_uuid, _uuid ? [Validators.required] : []),
            filename: new FormControl(_filename, this.multiple ? [] : [Validators.required]),
            estensione: new FormControl(_estensione, (this.multiple || _uuid) ? [] : [Validators.required]),
            descrizione: new FormControl(_descrizione, []),
            visibilita: new FormControl(_visibilita, [Validators.required]),
            tipologia: new FormControl(_tipologia, [Validators.required]),
            content: new FormControl(null, (this.isNew && !this.multiple && !_uuid) ? [Validators.required] : []),
            files: new FormControl(null, this.multiple ? [Validators.required] : [])
        });
        this.descrittoreCtrl.setValue(data);
        this.newDescrittore = false;
    }

    hasControlError(name: string) {
        return (this.f[name] && this.f[name].errors && this.f[name].touched);
    }

    saveModal(body: any) {
        const _allegati: any[] = [];
        let _dataUpdate: any = null;
        this.resetError();
        this.saving = true;
        this.showLoading = false;
        if (!this.showAllAttachments) { body.tipologia = this.tipoAllegato; }
        let _resultObject: Observable<any>;
    
        if (this.isNew) {
            if (this.multiple) {
                const _fileCount = body.files.length;
                body.files.forEach((file: any) => {
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
            _resultObject = this.apiService.postElementRelated(this.model, this.id, 'allegati', _allegati);
        } else {
            _dataUpdate = {
                tipologia: body.tipologia,
                visibilita: body.visibilita,
                descrizione: body.descrizione,
                filename: body.filename,
                content: {
                    tipo_documento: 'uuid',
                    uuid: body.uuid,
                    filename: body.filename,
                    content_type: body.estensione
                }
            };
    
            if (this.newDescrittore) {
                _dataUpdate.content = {
                    tipo_documento: 'nuovo',
                    filename: body.filename,
                    content_type: body.estensione,
                    content: body.content
                };
            }
    
            _resultObject = this.apiService.putElementRelated(this.model, this.id, `allegati/${body.uuid}`, _dataUpdate);
        }
    
        _resultObject.subscribe({
            next: (response: any) => {
                this.saving = false;
                this.closeModal(true);
            },
            error: (error: any) => {
                this.saving = false;
                this.error = true;
                this.errorMsg = Tools.GetErrorMsg(error);
            }
        });
    }
    
    closeModal(updated: boolean = false) {
        this.saving = false;
        this.error = false;
        this.onClose.next(updated);
        this.bsModalRef.hide();
    }

    resetError() {
        this.error = false;
        this.errorMsg = '';
    }

    descrittoreChange(value: any) {
        const controls = this.editFormGroup.controls;
        if (this.multiple) {
            if (value && value.data) {
                this.files.push({
                    filename: value.file,
                    estensione: value.type,
                    content: value.data
                });
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
                    controls.content.patchValue(null);
                }
                this.descrittoreCtrl.setValue('');
            }
        } else {
            controls.uuid.clearValidators();
            controls.filename.setValidators(Validators.required);
            controls.estensione.setValidators(Validators.required);
            controls.content.setValidators(Validators.required);
            
            controls.filename.patchValue(value.file || value.filename);
            controls.estensione.patchValue(value.type || value.estensione);
            controls.content.patchValue(value.data || null);
            // controls.uuid.patchValue(value.uuid || null);
            this.newDescrittore = true;
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
        switch (this.files.length) {
            case 1:
                controls.filename.patchValue(this.files[0].filename);
                controls.filename.setValidators(Validators.required);
                controls.estensione.patchValue(this.files[0].estensione);
                controls.content.patchValue(this.files[0].content);
                break;
            default:
                controls.filename.patchValue(null);
                controls.filename.clearValidators();
                controls.estensione.patchValue(null);
                controls.content.patchValue(null);
                controls.content.patchValue(null);
                break;
        }
        this.resetError();
    }

    toggleMultiple() {
        const controls = this.editFormGroup.controls;
        this.multiple = !this.multiple;
        controls.estensione.patchValue(null);
        controls.descrizione.patchValue(null);
        controls.visibilita.patchValue(null);
        controls.tipologia.patchValue(null);
        controls.content.patchValue(null);
        controls.uuid.patchValue(null);
        controls.files.patchValue(null);
        this.editFormGroup.updateValueAndValidity();
    }

}
