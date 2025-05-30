import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, Type } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { AuthenticationService } from '@app/services/authentication.service';
import { OpenAPIService } from '@app/services/openAPI.service';

import { EventType } from '@linkit/components';

import * as _ from 'lodash';
declare const saveAs: any;

export enum ProprietaType {
    Text = 'text',
    Select = 'select',
    File = 'file'
}

export interface Gruppo {
    gruppo: string,
    proprieta: Proprieta[]
}

export interface Proprieta {
    nome: string,
    valore: string,
    filename: string,
    content_type: string,
    uuid: string
}

export interface ApiGruppo {
    api?: string,
    gruppi: Gruppo[]
}

type FileType = {
    id: string;
    name: string;
    type: string;
    size: string;
    data: string;
    error: boolean;
};

@Component({
    selector: 'app-custom-properties',
    templateUrl: './custom-properties.component.html',
    styleUrls: ['./custom-properties.component.scss'],
    standalone: false
})
export class CustomPropertiesComponent implements OnInit, OnChanges {

    @Input() ambiente: string | null = null;
    @Input() id_adesione: string | null = null;
    @Input() stato_adesione: string = '';
    @Input() api: any = null;
    @Input() data: any[] | null = null;
    @Input() item: any = null;
    @Input() showGroupLabel: boolean = true;
    @Input() editable: boolean = true;

    @Output() onSave = new EventEmitter<any>();

    formGroup: FormGroup = new FormGroup({});

    _data: any[] | null = null;
    _item: any = null;

    _proprietaCustom: any[] = [];
    _proprietaCustomGrouped: any = null;

    _isNew: boolean = false;
    _isEdit: boolean = false;
    _spin: boolean = false;

    _error: boolean = false;
    _errorMsg: string = '';
    _errors: any[] = [];

    ProprietaType = ProprietaType;

    constructor(
        private formBuilder: FormBuilder,
        private eventsManagerService: EventsManagerService,
        private authenticationService: AuthenticationService,
        private apiService: OpenAPIService
    ) {}

    ngOnInit() {
    }
    
    ngOnChanges(changes: SimpleChanges): void {
        this._item = { ...this.item };
        this._data = Object.assign([], this.data);

        this._initProprietaCustom(this.data);
    }

    get f(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }

    cfg() {
        return this.formGroup.controls['proprieta_custom'] as FormGroup;
    }

    cfgc(key: string) {
        return this.cfg().controls[key] as FormControl;
    }

    _hasRequiredValidator(key: string) {
        return this.cfgc(key).hasValidator(Validators.required);
    }

    _hasControlCustomPropertiesError(name: string) {
        return (this.cfg().controls[name].errors && this.cfg().controls[name].touched);
    }

    _getCustomSelectLabelMapper = (cod: string, name: string, group: string) => {
        const _proprietaCustom = this.item.proprieta;
        const _pItem = _proprietaCustom.find((item: any) => item.nome === name);
        const _label = _pItem.valori.find((item: any) => item.nome === cod)?.etichetta;

        return _label || cod;
    }

    _resetProprietaCustom() {
        this.formGroup.removeControl('proprieta_custom');
        this._proprietaCustom = [];
        this._proprietaCustomGrouped = [];
    }

    _getProprietaCustomValue(field: any , data: ApiGruppo[] | null) {
        if (data) {
            let _apiGroup: ApiGruppo | undefined = undefined;
            if (this.api) {
                _apiGroup = data?.find((group: ApiGruppo) => {
                    return (group.api === this.api.id_api);
                });
            } else {
                _apiGroup = data?.find((group: ApiGruppo) => {
                    return (group.api === null) || (group.api === '') || (group.api === undefined);
                });
            }
            const _group: Gruppo | undefined = _apiGroup?.gruppi.find((group: Gruppo) => {
                return (group.gruppo === field.nome_gruppo);
            });
            const _proprieta = _group?.proprieta.find((p: Proprieta) => {
                return (p.nome === field.nome);
            });

            return _proprieta;
        }

        return null;
    }

    _initProprietaCustom(data: ApiGruppo[] | null) {
        this._resetProprietaCustom();

        let _group: any = {};
        this.formGroup = new FormGroup(_group);

        const _proprietaCustom = this.item.proprieta;
        _proprietaCustom.forEach((item: any) => {
            this._proprietaCustom.push({
                nome_gruppo: this.item.nome_gruppo,
                label_gruppo: this.item.label_gruppo,
                ...item
            });
        });
        this._proprietaCustomGrouped = _.groupBy(this._proprietaCustom, 'nome_gruppo');

        const mandatoryClasses = this.authenticationService._getClassesMandatory('adesione', 'adesione', this.stato_adesione);
        const genericoCustomPropertiesAreMandatory = mandatoryClasses.some((item: string) => item === 'generico');
        const collaudoCustomPropertiesAreMandatory = mandatoryClasses.some((item: string) => item === 'collaudo');
        const produzioneCustomPropertiesAreMandatory = mandatoryClasses.some((item: string) => item === 'produzione');

        if (this._proprietaCustom.length) {
            const _cpf: any = {};
            this._proprietaCustom.forEach((prop: any) => {
                const _validators = [];

                let required = false;

                if (this._item.classe_dato === 'generico' && genericoCustomPropertiesAreMandatory) {
                    required = prop.required;
                }

                if (this._item.classe_dato === 'collaudo' && collaudoCustomPropertiesAreMandatory) {
                    required = prop.required;
                }

                if (this._item.classe_dato === 'produzione' && produzioneCustomPropertiesAreMandatory) {
                    required = prop.required;
                }

                if (required) { _validators.push(Validators.required); }

                if (prop.regular_expression) { _validators.push(Validators.pattern(prop.regular_expression)); }
                // _cpf[prop.nome] = ['', [..._validators] ];
                const _proprieta = this._getProprietaCustomValue(prop, this._data);
                let _val: any = _proprieta ? _proprieta.valore : null;
                if (!_proprietaCustom?.length && (prop.tipo === ProprietaType.Select)) {
                    const _defaultItem = prop.valori.find((prop: any) => prop.default);
                    _val = _val || (_defaultItem?.nome || null);
                }
                if (_proprietaCustom?.length && (prop.tipo === ProprietaType.File)) {
                    _val = _proprieta || null;
                }
                _cpf[prop.nome] = [_val, [..._validators] ];
            });
            
            const _cpfg = this.formBuilder.group(_cpf)

            this.formGroup.addControl('proprieta_custom', _cpfg);
            this.formGroup.updateValueAndValidity();
        }
    }

    _onSubmit(values: any) {
        if (this._isEdit && this.formGroup.valid) {
            this._onUpdate(values);
        }
    }

    _onUpdate(body: any) {
        this.__resetError();
        const _body = this._prepareBodyUpdate(body);
        this._spin = true;
        this.apiService.putElementRelated('adesioni', this.id_adesione, `${this.ambiente}/configurazioni`, _body).subscribe(
            (response: any) => {
                this._isEdit = false;
                this.onSave.emit({ id_adesione: this.id_adesione, item: this.item,  response: response });
                this._spin = false;
                this.eventsManagerService.broadcast(EventType.WIZARD_CHECK_UPDATE, true);
            },
            (error: any) => {
                this._spin = false;
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
            }
        );
    }

    _prepareBodyUpdate(body: any) {
        const _newBody: any = {};
        _newBody.proprieta_custom = [];
        Object.keys(this._proprietaCustomGrouped).forEach(k => {
            const _apiGrouped: any = {
                gruppi: []
            };
            if (this.api) {
                _apiGrouped.api = this.api.id_api;
            }
            const _customGrouped: any = {
                gruppo: k,
                proprieta: []
            };
            this._proprietaCustomGrouped[k].forEach((item: any) => {
                if (body.proprieta_custom[item.nome]) {
                    if (item.tipo !== ProprietaType.File) {
                            _customGrouped.proprieta.push({
                            nome: item.nome,
                            valore: body.proprieta_custom[item.nome]
                        });
                    } else {
                        if (body.proprieta_custom[item.nome].data) {
                            _customGrouped.proprieta.push({
                                nome: item.nome,
                                valore: null,
                                filename: body.proprieta_custom[item.nome].file,
                                content: body.proprieta_custom[item.nome].data || null,
                                content_type: body.proprieta_custom[item.nome].type
                            });
                        } else {
                            const _proprieta = this._getProprietaCustomValue(item, this._data);
                            _customGrouped.proprieta.push({
                                nome: item.nome,
                                valore: null,
                                filename: _proprieta?.filename || null,
                                content_type: _proprieta?.content_type || null,
                                uuid: _proprieta?.uuid
                            });
                        }
                    }
                }
            });
            _apiGrouped.gruppi.push(_customGrouped);
            _newBody.proprieta_custom.push(_apiGrouped);
        });
        // console.log('_prepareBodyUpdate', _newBody);
        return _newBody;
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
    }

    _onCancelEdit() {
        this._isEdit = false;
        this._error = false;
        this._errorMsg = '';
        this._errors = [];
        this._initProprietaCustom(this._data);
    }

    _onEdit() {
        this._isEdit = true;
    }

    _onFileChange(value: any) {
        console.log('_onFileChange', value);
    }

    _downloading: boolean = false;

    _downloadFile(file: Proprieta) {
        this.__resetError();
        this._downloading = true;

        const _proprieta = this._getProprietaCustomValue(file, this._data);
        this.apiService.download(`adesioni/${this.id_adesione}/allegato`, _proprieta?.uuid, 'download').subscribe({
            next: (response: any) => {
                let filename: string = Tools.GetFilenameFromHeader(response);
                saveAs(response.body, filename);
                this._downloading = false;
            },
            error: (error: any) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._downloading = false;
            }
        });
    }
}
