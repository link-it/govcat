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
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { COMPONENTS_IMPORTS, Tools, ConfigService, SearchBarFormComponent, EventsManagerService } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { TassonomiaTokenComponent } from '@app/components/token/tassonomia-token.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { ModalCategoryChoiceComponent } from '@app/components/modal-category-choice/modal-category-choice.component';
import { ModalGroupChoiceComponent } from '@app/components/modal-group-choice/modal-group-choice.component';

import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import { TipoServizioEnum } from '@app/model/tipoServizioEnum';

@Component({
    selector: 'app-servizi-search-form',
    templateUrl: './servizi-search-form.component.html',
    styleUrls: ['./servizi-search-form.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        TassonomiaTokenComponent
    ]
})
export class ServiziSearchFormComponent implements OnInit {

    @Input() historyStore: string = 'dashboard-servizi';
    @Input() hideVersions: boolean = false;

    @Output() search = new EventEmitter<any>();

    @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

    Tools = Tools;

    _formGroup: FormGroup = new FormGroup({});

    _tipiVisibilitaServizio: {value: string, label: string}[] = [
        ...Tools.TipiVisibilitaServizio
    ];
    _tipiVisibilitaServizioEnum: any = { ...Tools.VisibilitaServizioEnum };

    searchFields: any[] = [
        { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'text', condition: 'like' },
        { field: 'visibilita', label: 'APP.LABEL.visibilita', type: 'enum', condition: 'equal', enumValues: { ...Tools.VisibilitaServizioEnum } },
        { field: 'id_dominio', label: 'APP.LABEL.id_dominio', type: 'text', condition: 'equal', params: { resource: 'domini', field: 'nome', urlParam: '?id_dominio=' } },
        { field: 'id_api', label: 'APP.LABEL.id_api', type: 'text', condition: 'equal', params: { resource: 'api', field: '{nome} v.{versione} ({servizio.dominio.nome})' } },
        { field: 'profilo', label: 'APP.LABEL.Profilo', type: 'text', condition: 'contain', callBack: (value: any) => {
            if (Array.isArray(value)) {
                return value.map((v: string) => {
                    const p = this.profili.find((item: any) => item.codice_interno === v);
                    return p ? p.etichetta : v;
                }).join(', ');
            }
            const p = this.profili.find((item: any) => item.codice_interno === value);
            return p ? p.etichetta : value;
        }},
        { field: 'tag', label: 'APP.LABEL.tags', type: 'text', condition: 'contain' },
        { field: 'categoria', label: 'APP.LABEL.categoria', type: 'multiple', condition: 'equal', related: 'categoriaLabel' },
        { field: 'categoriaLabel', label: 'APP.LABEL.categoria', type: 'related', condition: 'equal', params: { resource: 'tassonomie', path: 'categorie', field: 'nome' }, options: { hide: true } },
        { field: 'id_gruppo_padre', label: 'APP.LABEL.gruppo', type: 'text', condition: 'equal', params: { resource: 'gruppi', path: '', field: 'nome' } },
        { field: 'id_gruppo_padre_label', label: 'APP.LABEL.gruppo', type: 'related', condition: 'equal', options: { hide: true } },
    ];

    useCondition: boolean = false;

    _showTaxonomies: boolean = false;

    minLengthTerm = 1;

    servizioApis$!: Observable<any[]>;
    servizioApisInput$ = new Subject<string>();
    servizioApisLoading: boolean = false;

    _searchApiSelected: any = null;

    tags$!: Observable<any[]>;
    tagsInput$ = new Subject<string>();
    tagsLoading: boolean = false;

    profili: any[] = [];

    domini$!: Observable<any[]>;
    dominiInput$ = new Subject<string>();
    dominiLoading: boolean = false;
    selectedDominio: any;

    modalChoiceRef!: BsModalRef;

    _listaCategorie: any[] = [];

    tipo_servizio: string = TipoServizioEnum.API;

    constructor(
        private readonly modalService: BsModalService,
        private readonly configService: ConfigService,
        public apiService: OpenAPIService,
        public authenticationService: AuthenticationService,
        private readonly eventsManagerService: EventsManagerService
    ) {}

    ngOnInit() {
        const appConfig = this.configService.getConfiguration();
        this.hideVersions = appConfig?.AppConfig?.Services?.hideVersions || this.hideVersions;

        const servizio = this.authenticationService._getConfigModule('servizio');
        this._showTaxonomies = servizio?.tassonomie_abilitate || false;

        if (this._isGestore()) {
            this._tipiVisibilitaServizio = [ ...this._tipiVisibilitaServizio, { value: 'componente', label: 'componente'} ];
            this._tipiVisibilitaServizioEnum = { ...this._tipiVisibilitaServizioEnum, 'componente': 'componente' };
            const _index = this.searchFields.findIndex((s: any) => s.field === 'visibilita');
            if (_index > -1) {
                this.searchFields[_index].enumValues = this._tipiVisibilitaServizioEnum;
            }
        }

        this._initSearchForm();
        this._initProfili();

        this._initServizioApiSelect([]);
        this._initTagsSelect([]);
        this._initDominiSelect([]);
    }

    _initSearchForm() {
        this._formGroup = new FormGroup({
            q: new FormControl(''),
            type: new FormControl(''),
            referente: new FormControl(''),
            id_dominio: new FormControl(''),
            id_gruppo: new FormControl(''),
            visibilita: new FormControl(''),
            categoria: new FormControl(''),
            categoriaLabel: new FormControl(''),
            profilo: new FormControl(''),
            tag: new FormControl(''),
            in_attesa: new FormControl(''),
            miei_servizi: new FormControl(''),
            id_api: new FormControl(''),
            id_servizio: new FormControl(''),
            id_gruppo_padre: new FormControl(''),
            id_gruppo_padre_label: new FormControl(''),
        });
    }

    _initProfili() {
        const _srv: any = Tools.Configurazione?.servizio || null;
        if (_srv) {
            this.profili = (this.tipo_servizio === TipoServizioEnum.API) ? (_srv.api?.profili || []) : (_srv.generico?.profili || []);
        }
    }

    _initServizioApiSelect(defaultValue: any[] = []) {
        this.servizioApis$ = concat(
            of(defaultValue),
            this.servizioApisInput$.pipe(
                filter(res => {
                    return res !== null && res.length >= this.minLengthTerm
                }),
                distinctUntilChanged(),
                debounceTime(500),
                tap(() => this.servizioApisLoading = true),
                switchMap((term: any) => {
                    return this.getData('api', term).pipe(
                        catchError(() => of([])),
                        tap(() => this.servizioApisLoading = false)
                    )
                })
            )
        );
    }

    _initTagsSelect(defaultValue: any[] = []) {
        this.tags$ = concat(
            of(defaultValue),
            this.tagsInput$.pipe(
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300),
                tap(() => this.tagsLoading = true),
                switchMap((term: any) => {
                    return this.getData('tags', term).pipe(
                        catchError(() => of([])),
                        tap(() => this.tagsLoading = false)
                    )
                })
            )
        );
    }

    _initDominiSelect(defaultValue: any[] = []) {
        this.domini$ = concat(
            of(defaultValue),
            this.dominiInput$.pipe(
                filter(res => {
                    return res !== null && res.length >= this.minLengthTerm
                }),
                distinctUntilChanged(),
                debounceTime(500),
                tap(() => this.dominiLoading = true),
                switchMap((term: any) => {
                    return this.getData('domini', term).pipe(
                        catchError(() => of([])),
                        tap(() => this.dominiLoading = false)
                    )
                })
            )
        );
    }

    getData(model: string, term: any = null, sort: string = 'id', sort_direction: string = 'desc'): Observable<any> {
        let _options: any = { params: { } };
        if (term) {
            if (typeof term === 'string' ) {
                _options.params =  { ..._options.params, q: term };
            }
            if (typeof term === 'object' ) {
                _options.params =  { ..._options.params, ...term };
            }
        }

        return this.apiService.getList(model, _options)
            .pipe(map(resp => {
                if (resp.Error) {
                    throw resp.Error;
                } else {
                    const _items = (resp.content || resp).map((item: any) => {
                        if (model === 'api') {
                            if (item.configurazione_collaudo?.dati_erogazione?.nome_gateway || item.configurazione_produzione?.dati_erogazione?.nome_gateway) {
                                item.descrizione = `${item.configurazione_collaudo?.dati_erogazione?.nome_gateway ?? '-'} | ${item.configurazione_produzione?.dati_erogazione?.nome_gateway ?? '-'}`;
                            }
                        }
                        return item;
                    });
                    return _items;
                }
            })
        );
    }

    onSelectedSearchDropdwon($event: Event){
        this.searchBarForm.setNotCloseForm(true)
        $event.stopPropagation();
    }

    onChangeSearchDropdwon(event: any){
        this._searchApiSelected = event;
        setTimeout(() => {
            this.searchBarForm.setNotCloseForm(false)
        }, 200);
    }

    openChoiceGroupModal(event: any) {
        this.searchBarForm.setNotCloseForm(true)
        event.stopPropagation();

        const initialState = {
            gruppi: [],
            selected: [],
            notSelectable: [],
        };
        this.modalChoiceRef = this.modalService.show(ModalGroupChoiceComponent, {
            ignoreBackdropClick: true,
            initialState: initialState
        });
        this.modalChoiceRef.content.onClose.subscribe(
            (result: any) => {
                this._formGroup.patchValue({
                    id_gruppo_padre: result[0].id_gruppo,
                    id_gruppo_padre_label: result[0].nome
                })
            }
        );
    }

    clearGroup($event: any) {
        this._formGroup.patchValue({
            id_gruppo_padre: null,
            id_gruppo_padre_label: null
        })
    }

    openChoiceCategoriesModal(event: any) {
        this.searchBarForm.setNotCloseForm(true)
        event.stopPropagation();

        const initialState = {
            title: 'APP.TITLE.SelectCategory',
            categorie: [],
            selected: [],
            notSelectable: this._listaCategorie
        };
        this.modalChoiceRef = this.modalService.show(ModalCategoryChoiceComponent, {
            ignoreBackdropClick: true,
            initialState: initialState
        });
        this.modalChoiceRef.content.onClose.subscribe(
            (result: any) => {
                let _categoria = '';
                let _categoriaLabel = '';
                let _idTassonomia = '';
                let _nomeTassonomia = '';
                let _idCategoria = result.id_categoria;
                let _nomeCategoria = result.nome;
                if (result.tassonomia) {
                    _idTassonomia = result.tassonomia.id_tassonomia;
                    _nomeTassonomia = result.tassonomia.nome;
                    _nomeCategoria = result.nome;
                    _idCategoria = result.id_categoria;
                    _categoria = `${_idTassonomia}|${_idCategoria}`;
                    _categoriaLabel = `${result.nome}`;
                } else {
                    _idTassonomia = result.source.tassonomia.id_tassonomia;
                    _nomeTassonomia = result.source.tassonomia.nome;
                    _idCategoria = result.source.id_categoria;
                    _nomeCategoria = result.source.nome;
                    _categoria = `${_idTassonomia}|${_idCategoria}`;
                    _categoriaLabel = `${_nomeCategoria}`;
                }

                if (!this.hasCategory(_idCategoria)) {
                    this._listaCategorie.push({
                        id_tassonomia: _idTassonomia,
                        nome_tassonomia: _nomeTassonomia,
                        id_categoria: _idCategoria,
                        nome_categoria: _nomeCategoria,
                    });
                    const _categorie = this._listaCategorie.map((item: any) => `${item.id_tassonomia}|${item.id_categoria}` ).join(',');
                    const _categorieLabels = this._listaCategorie.map((item: any) => `${item.nome_tassonomia}|${item.nome_categoria}` ).join(',');
                    this._formGroup.get('categoria')?.setValue(_categorie);
                    this._formGroup.get('categoriaLabel')?.setValue(_categorieLabels);
                } else {
                    console.log('Categoria esistente', _idCategoria);
                }
            }
        );
    }

    hasCategory(idCategoria: string) {
        return this._listaCategorie.findIndex(item => item.id_categoria === idCategoria) !== -1;
    }

    onDeleteCategory(event: any) {
        event.event.stopImmediatePropagation();

        this._listaCategorie = this._listaCategorie.filter(item => item.id_categoria !== event.data.id_categoria);
        const _categorie = this._listaCategorie.map((item: any) => `${item.id_tassonomia}|${item.id_categoria}` ).join(',');
        const _categorieLabels = this._listaCategorie.map((item: any) => `${item.nome_tassonomia}|${item.nome_categoria}` ).join(',');
        this._formGroup.get('categoria')?.setValue(_categorie);
        this._formGroup.get('categoriaLabel')?.setValue(_categorieLabels);
    }

    updateCategoryInput() {
        this._listaCategorie = [];

        const _categoria = this._formGroup.get('categoria')?.value;
        const __categoriaLabel = this._formGroup.get('categoriaLabel')?.value;

        if (_categoria && __categoriaLabel) {
            const _categorieList = _categoria.split(',');
            const _categorieLabelsList = __categoriaLabel.split(',');

            for (let index = 0; index < _categorieList.length; index++) {
                const _splitValue = _categorieList[index].split('|');
                const _splitLabel = _categorieLabelsList[index].split('|');
                this._listaCategorie.push({
                    id_tassonomia: _splitValue[0],
                    nome_tassonomia: _splitLabel[0],
                    id_categoria: _splitValue[1],
                    nome_categoria: _splitLabel[1],
                });
            }
        }
    }

    _onSubmit(form: any) {
        if (this.searchBarForm) {
            this.searchBarForm._onSearch();
        }
    }

    get f(): { [key: string]: AbstractControl } {
        return this._formGroup.controls;
    }

    _onSearch(values: any) {
        if (values.id_gruppo_padre_label) {
            delete values.id_gruppo_padre_label;
        }
        let _filterData = values;
        if (_filterData.categoria ) {
            const _split = _filterData.categoria.split('|');
            _filterData = { ..._filterData, categoria: _split[1] };
        } else {
            _filterData = { ..._filterData, categoriaLabel: '' };
            this._formGroup.get('categoriaLabel')?.setValue('');
        }
        this.updateCategoryInput();

        this.search.emit(_filterData);
    }

    _isGestore() {
        return this.authenticationService.isGestore();
    }

    _isAnonymous() {
        return this.authenticationService.isAnonymous();
    }
}
