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
import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';
import { EventsManagerService } from '@linkit/components';

import { EventType } from '@linkit/components';

import { Grant, RightsEnum } from '@app/model/grant';
import { StatoConfigurazioneEnum } from '../../adesione-configurazioni/adesione-configurazioni.component';
import { AmbienteEnum } from '@app/model/ambienteEnum';
import { Erogazioni } from '../../adesione-configurazioni/erogazioni';

import { CkeckProvider } from '@app/provider/check.provider';
import { ClassiEnum, DataStructure } from '@app/provider/check.provider';

@Component({
    selector: 'app-adesione-lista-erogazioni',
    templateUrl: './adesione-lista-erogazioni.component.html',
    styleUrls: ['./adesione-lista-erogazioni.component.scss'],
    standalone: false
})
export class AdesioneListaErogazioniComponent implements OnInit {

    @Input() id: number = 0;
    @Input() adesione: any = null;
    @Input() config: any = null;
    @Input() grant: Grant | null = null;
    @Input() environment: string = '';
    @Input() singleColumn: boolean = false;
    @Input() isEdit: boolean = false;
    @Input() otherClass: string = '';
    @Input() dataCheck: DataStructure = { esito: 'ok', errori: [] };
    @Input() nextState: any = null;

    completed: boolean = true;

    model: string = 'adesioni';

    adesioneErogazioni: any = null;

    spin: boolean = false;

    ClassiEnum = ClassiEnum;

    updateMapper: string = '';

    constructor(
        private modalService: BsModalService,
        private apiService: OpenAPIService,
        private authenticationService: AuthenticationService,
        private utils: UtilService,
        private eventsManagerService: EventsManagerService,
        private ckeckProvider: CkeckProvider
    ) { }

    ngOnInit() {
        this.loadAdesioneErogazioni(this.environment);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.dataCheck) {
            this.dataCheck = changes.dataCheck.currentValue;
            this.updateMapper = new Date().getTime().toString();
        }
    }

    private loadAdesioneErogazioni(environment: string, ignoreSpin: boolean = false) {
        // this._setErrorMessages(false);
        if (this.id) {
            this.spin = ignoreSpin ? false : true;
            if (!ignoreSpin) { this.adesioneErogazioni = []; }
            this.apiService.getDetails(this.model, this.id, environment + '/erogazioni').subscribe({
                next: (response: any) => {
                    const _erogazioniArr: any = [];

                    // clclo sulle erogaz_richieste per sottoscrivere l'adesione
                    this.adesione.erogazioni_richieste.map((item: any) => {

                        //verifico se tra i client già associati all'adesione, ce una erogazione definita per l'elemento corrente (item)
                        const _erogazioneAssociata: any = response.content.find((el: any) => {return item.api.id_api === el.api.id_api});
                        
                        const _element: any = {
                            codice_asset: null,
                            descrizione: null,
                            id_api: null,
                            nome: null,
                            protocollo: null,
                            protocollo_dettaglio: null,
                            ruolo: null,
                            versione: null,
                            stato: null,
                            specifica: {
                                content_type: null,
                                filename: null,
                                uuid: null
                            },
                            id_erogazione: null,
                            indirizzi_ip: null,
                            url: null
                        }

                        if (_erogazioneAssociata) {
                            _element.codice_asset = _erogazioneAssociata.api.codice_asset,
                            _element.id_api = _erogazioneAssociata.api.id_api,
                            _element.nome = _erogazioneAssociata.api.nome,
                            _element.protocollo = _erogazioneAssociata.api.protocollo,
                            _element.protocollo_dettaglio = _erogazioneAssociata.api.protocollo_dettaglio,
                            _element.ruolo = _erogazioneAssociata.api.ruolo,
                            _element.versione = _erogazioneAssociata.api.versione,
                            _element.stato = StatoConfigurazioneEnum.CONFIGURATO,
                            _element.specifica = _erogazioneAssociata.api.specifica
                            _element.id_erogazione = _erogazioneAssociata.api.id_api
                            _element.indirizzi_ip = _erogazioneAssociata.indirizzi_ip
                            _element.url = _erogazioneAssociata.url
                        } else {
                            _element.codice_asset = item.api?.codice_asset,
                            _element.id_api = item.api?.id_api,
                            _element.nome = item.api?.nome,
                            _element.protocollo = item.api?.protocollo,
                            _element.protocollo_dettaglio = item.api?.protocollo_dettaglio,
                            _element.ruolo = item.api?.ruolo,
                            _element.versione = item.api?.versione,
                            _element.stato = StatoConfigurazioneEnum.NONCONFIGURATO,
                            _element.id_erogazione = item.api?.id_api
                            _element.indirizzi_ip = item.api?.indirizzi_ip
                            _element.url = item.api?.url
                        }

                        _erogazioniArr.push(_element)
                    })

                    const _list: any = _erogazioniArr.map((erogazioni: any) => {
                        const element = {
                            id_api: erogazioni.id_api,
                            nome: erogazioni.nome,
                            stato: erogazioni.stato,
                            versione: erogazioni.versione,
                            id_erogazione: erogazioni.id_erogazione,
                            indirizzi_ip: erogazioni.indirizzi_ip,
                            url: erogazioni.url,
                            editMode: false,
                            enableCollapse: false,
                            source: { ...erogazioni }
                        };
                        return element;
                    });
                    this.adesioneErogazioni = [ ..._list ];

                    this.spin = false;
                },
                error: (error: any) => {
                    // this._setErrorMessages(true);
                    this.spin = false;
                }
            });
        }
    }

    isStatusPubblicatoCollaudodMapper = (update: string, stato: string): boolean => {
        return stato === 'pubblicato_produzione';
    }

    getSottotipoGroupCompletedMapper = (update: string, tipo: string): number => {
        if (this.isSottotipoGroupCompletedMapper(update, tipo)) {
            return this.nextState?.dati_non_applicabili?.includes(this.environment) ? 2 : 1;
        } else {
            return this._hasCambioStato() ? 0 : 1;
        }
    }

    isSottotipoGroupCompletedMapper = (update: string, tipo: string): boolean => {
        const result = this.ckeckProvider.isSottotipoGroupCompleted(this.dataCheck, this.environment, tipo);
        return result;
    }

    isSottotipoCompletedMapper = (update: string, tipo: string, identificativo: string): boolean => {
        const result = this.ckeckProvider.isSottotipoCompleted(this.dataCheck, this.environment, tipo, identificativo);
        return result;
    }

    _isModifiableMapper = (item: any = null): boolean => {
        if (this.grant) {
            if ((this.environment === AmbienteEnum.Collaudo) && (this.grant.collaudo === RightsEnum.Scrittura)) {
                return true;
            }
            if ((this.environment === AmbienteEnum.Produzione) && (this.grant.produzione === RightsEnum.Scrittura)) {
                return true;
            }
        }
        return false;
    }

    _hasCambioStato() {
        if (this.authenticationService.isGestore(this.grant?.ruoli)) { return true; }
        const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', this.grant?.ruoli);
        return _statoSuccessivo;
    }

    onEdit(erogaz: any) {
        this._onEditAdesioneErogaz(erogaz);
    }

    // Modal Edit

    @ViewChild('editErogazioni') editErogazioni!: any;
    
    _modalEditRef!: BsModalRef;
    _modalConfirmRef!: BsModalRef;

    adesioniErogazConfig: any;

    id_erogazione: any = null;

    adesioneConfigClients: any[] = [];
    adesioneConfigErogazioni: any[] = [];

    _editFormGroupErogazioni: FormGroup = new FormGroup({});
    
    erogaz: any = null;
    
    isEditErogazione = false;

    _saving: boolean = false;
    _error: boolean = false;
    _errorMsg: string = '';

    _message = 'APP.MESSAGE.ChooseEnvironment';
    _messageHelp = 'APP.MESSAGE.ChooseEnvironmentHelp';

    closeModal(){
        this._modalEditRef.hide();
        this.isEditErogazione = false;
    }

    _resetError() {
        this._error = false;
        this._errorMsg = '';
    }

    _onEditAdesioneErogaz(erogaz: any) {
        this._resetError();

        this.erogaz = erogaz;
        this.id_erogazione = erogaz.id_erogazione;
        this._initEditFormErogazioni(erogaz)

        const _modalConfig: any = {
            ignoreBackdropClick: false,
            class: 'modal-half-'
        };
        
        this._modalEditRef = this.modalService.show(this.editErogazioni, _modalConfig);
    }

    get fe(): { [key: string]: AbstractControl } {
        return this._editFormGroupErogazioni.controls;
    };

    _initEditFormErogazioni(data: any) {
        
        const _indirizzi_ip: any = data.indirizzi_ip || null;
        const _nome: string = data.nome;
        const _versione: string = data.versione;
        const _url: string = data.url || null;
        
        this._editFormGroupErogazioni = new FormGroup({
            nome: new FormControl({value: _nome, disabled: true}),
            versione: new FormControl({value: _versione, disabled: true}),
            url: new FormControl(_url, [Validators.required]),
            indirizzi_ip: new FormControl(_indirizzi_ip),
        });

        if (!this._isModifiableMapper(data)) {
            this._disableAllFields(this._editFormGroupErogazioni.controls);
        }
    }

    _disableAllFields(data: any) {
        Object.keys(data).forEach((key) => {
            data[key].disable()      
        });
    }

    _onSaveModalErogazioni(body: any) {
        this._saving = true;

        const id_adesione: string = this.adesione.id_adesione;
        const ambiente: string = this.environment; // this._collaudo ? 'collaudo' : 'produzione';
        const id_erogazione: string = this.id_erogazione;
        const path: string = `${ambiente}` + '/erogazioni/' + `${id_erogazione}`;

        let _payload: Erogazioni = {
            url : body.url,
            indirizzi_ip : body.indirizzi_ip
        };

        this.utils._removeEmpty(_payload);

        console.log('PUT for UPDATING: ', _payload, path);

        this.apiService.putElementRelated('adesioni', id_adesione, path, _payload).subscribe({
            next: (response: any) => {
                this.loadAdesioneErogazioni(this.environment);
                this.eventsManagerService.broadcast(EventType.WIZARD_CHECK_UPDATE, true);
                this._saving = false;
                this.closeModal();
            },

            error: (error: any) => {
                this._error = true;
                this._errorMsg = this.utils.GetErrorMsg(error);
                this._saving = false;
            }
        });
    }

}
