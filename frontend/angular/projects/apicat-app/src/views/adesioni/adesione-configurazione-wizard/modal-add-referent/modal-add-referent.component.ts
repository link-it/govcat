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
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { of, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
    selector: 'app-modal-add-referent',
    templateUrl: './modal-add-referent.component.html',
    styleUrls: ['./modal-add-referent.component.scss'],
    standalone: false
})
export class ModalAddReferentComponent implements OnInit {

    model: string = 'adesioni';
    id: number | null = null;
    adesione: any = null;

    title: string = 'APP.TITLE.AddReferent';

    referentiFilter: string = '';

    anagrafiche: any = {};
    referentiTipo: any = null;

    editFormGroup: FormGroup = new FormGroup({});

    onClose: Subject<any> = new Subject();

    constructor(
        private bsModalRef: BsModalRef,
        private translate: TranslateService,
        private apiService: OpenAPIService,
        private utilService: UtilService
    ) { }


    ngOnInit() {
        this.loadAnagrafiche();
        this.initEditForm();
    }

    get f(): { [key: string]: AbstractControl } {
        return this.editFormGroup.controls;
    }

    initEditForm() {
        this.editFormGroup = new FormGroup({
            tipo: new FormControl(null, [Validators.required]),
            id_utente: new FormControl(null, [Validators.required])
        });
        this.editFormGroup.controls.id_utente.disable();
    }

    closeModal(confirm: boolean = false) {
        this.onClose.next(confirm);
        this.bsModalRef.hide();
    }

    saveModal(body: any){
        this.apiService.postElementRelated(this.model, this.id, 'referenti', body).subscribe(
            (response: any) => {
                this.closeModal(true);
            },
            (error: any) => {
                console.log('error', error);
            }
        );
    }

    _hasControlError(name: string) {
        return (this.f[name] && this.f[name].errors && this.f[name].touched);
    }
    
    trackByFn(item: any) {
        return item.id;
    }

    onChangeTipoReferente(event: any) {
        this.referentiTipo = event.value;
        this.referentiFilter = (this.referentiTipo === 'referente') ? 'referente_servizio,gestore,coordinatore' : '';
    }

    loadAnagrafiche() {
        this.anagrafiche['tipo-referente'] = [
            { label: 'APP.ROLE.referente', value: 'referente' },
            { label: 'APP.ROLE.referente_tecnico', value: 'referente_tecnico' }
        ];
    }

    getSearchTipo() {
        return this.searchTipo.bind(this);
    }

    private searchTipo(term: string) {
        return of(this.anagrafiche['tipo-referente']);
    }

    getSearchReferente() {
        return this.searchReferente.bind(this);
    }

    private searchReferente(term: string) {
        if (!term) {
            return of([]);
        }

        const _options: any = { params: { q: term } };
        // _options.params.ruolo = this.referentiFilter;
        _options.params.stato = 'abilitato';
        if (this.referentiTipo === 'referente') {
            _options.params.id_organizzazione = this.adesione.soggetto.organizzazione.id_organizzazione;
        } else {
            _options.params.referente_tecnico = true;
        }
    
        return this.apiService.getList('utenti', _options)
            .pipe(map(resp => {
                    if (resp.Error) {
                        return [];
                    } else {
                        const _items = resp.content.map((item: any) => {
                            return {
                                label: `${item.nome} ${item.cognome}`,
                                value: item.id_utente
                            };
                        });
                        return _items;
                    }
                })
            );
    }

}
