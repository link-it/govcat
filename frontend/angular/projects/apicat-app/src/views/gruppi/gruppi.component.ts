import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { SearchBarFormComponent } from 'projects/components/src/lib/ui/search-bar-form/search-bar-form.component';

import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { CardType } from 'projects/components/src/lib/ui/card/card.component';
import { Page} from '../../models/page';

@Component({
    selector: 'app-gruppi',
    templateUrl: 'gruppi.component.html',
    styleUrls: ['gruppi.component.scss']
})
export class GruppiComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
    static readonly Name = 'GruppiComponent';
    readonly model: string = 'gruppi'; // <<==== parametro di routing per la _loadXXXXX

    @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
    @ViewChild('editTemplate') editTemplate!: any;

    Tools = Tools;

    config: any;
    gruppiConfig: any;

    gruppi: any[] = [];
    _paging: Page = new Page({});
    _links: any = {};

    _isNew: boolean = false;
    _isEdit: boolean = false;
    _editCurrent: any = null;
    _currentGroup: any = null;

    _hasFilter: boolean = false;
    _formGroup: UntypedFormGroup = new UntypedFormGroup({});
    _filterData: any[] = [];

    _preventMultiCall: boolean = false;

    _spin: boolean = true;
    desktop: boolean = false;

    _useRoute : boolean = false;

    _message: string = 'APP.MESSAGE.NoResults';
    _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
    _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
    _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

    _error: boolean = false;
    _errorMsg: string = '';

    showHistory: boolean = true;
    showSearch: boolean = true;
    showSorting: boolean = true;

    sortField: string = 'date';
    sortDirection: string = 'asc';
    sortFields: any[] = [];

    searchFields: any[] = [
        // { field: 'creationDateFrom', label: 'APP.LABEL.Date', type: 'date', condition: 'gt', format: 'DD/MM/YYYY' },
        // { field: 'creationDateTo', label: 'APP.LABEL.Date', type: 'date', condition: 'lt', format: 'DD/MM/YYYY' },
    ];

    breadcrumbs: any[] = [
        { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
        { label: 'APP.TITLE.Groups', url: '', type: 'title', icon: '' }
    ];

    listMode: boolean = false;
    CardType = CardType;

    apiUrl: string = '';
    _imagePlaceHolder: string = './assets/images/logo-placeholder.png';

    _modalEditRef!: BsModalRef;
    _modalConfirmRef!: BsModalRef;

    _editFormGroup: FormGroup = new FormGroup({});
    _data: any = null;

    _saving: boolean = false;
    _deleting: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private modalService: BsModalService,
        private translate: TranslateService,
        private configService: ConfigService,
        public tools: Tools,
        private eventsManagerService: EventsManagerService,
        public apiService: OpenAPIService,
        public utils: UtilService
    ) {
        this.config = this.configService.getConfiguration();
        this.apiUrl = this.config.AppConfig.GOVAPI.HOST;

        this._initSearchForm();
    }

    @HostListener('window:resize') _onResize() {
        this.desktop = (window.innerWidth >= 992);
    }

    ngOnInit() {
        this.configService.getConfig(this.model).subscribe(
            (config: any) => {
                this.gruppiConfig = config;
                this.listMode = this.gruppiConfig.defaultView !== 'list'; // list | card
            }
        );
    }

    ngOnDestroy() {}

    ngAfterViewInit() {
        if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
            setTimeout(() => {
                this._loadGruppi();
            }, 100);
        }
    }

    ngAfterContentChecked(): void {
        this.desktop = (window.innerWidth >= 992);
    }

    _setErrorMessages(error: boolean) {
        this._error = error;
        if (this._error) {
            this._message = 'APP.MESSAGE.ERROR.Default';
            this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
        } else {
            this._message = 'APP.MESSAGE.NoResults';
            this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
        }
    }

    _initSearchForm() {
        this._formGroup = new UntypedFormGroup({});
    }

    _loadGruppi(query: any = null, url: string = '') {
        this._setErrorMessages(false);

        // if (!url) { this.gruppi = []; }
        
        let aux: any;
        query = { ...query, gruppo_padre_null: true };
        aux = { params: this.utils._queryToHttpParams(query) };

        this._spin = true;
        this.apiService.getList(this.model, aux, url).subscribe({
            next: (response: any) => {

                response ? this._paging = new Page(response.page) : null;
                response ? this._links = response._links || null : null;

                if (response.content) {
                    const _list: any = response.content.map((gruppo: any) => {
                        const element = {
                            id: gruppo.id_gruppo,
                            id_gruppo: gruppo.id_gruppo,
                            nome: gruppo.nome,
                            logo: gruppo.immagine || '',
                            immagine: gruppo.immagine || '',
                            descrizione: gruppo.descrizione || '',
                            descrizione_sintetica: gruppo.descrizione_sintetica || '',
                            children: gruppo.figli,
                            figli: gruppo.figli,
                            hasChildren: !!gruppo.figli,
                            source: { ...gruppo },
                        };
                        return element;
                    });
                    this.gruppi = (url) ? [...this.gruppi, ..._list] : [..._list];
                    this._preventMultiCall = false;
                }
                this._spin = false;
                Tools.ScrollTo(0);
            },
            error: (error: any) => {
                this._spin = false;
                this._preventMultiCall = false;
                this._setErrorMessages(true);
            }
        });
    }

    __loadMoreData() {
        if (this._links && this._links.next && !this._preventMultiCall) {
            this._preventMultiCall = true;
            this._loadGruppi(null, this._links.next.href);
        }
    }

    _onNew() {
        if (!this._useRoute) {
            this._editGruppo();
        }
    }

    _onEdit(event: any, data: any) {
        if (!this._useRoute) {
            this._editGruppo(data);
        }
    }

    _dummyAction(event: any, param: any) {
        console.log(event, param);
    }

    _onSubmit(form: any) {
        if (this.searchBarForm) {
            this.searchBarForm._onSearch();
        }
    }

    _onSearch(values: any) {
        this._filterData = values;
        this._loadGruppi(this._filterData);
    }

    _resetForm() {
        this._filterData = [];
        this._loadGruppi(this._filterData);
    }

    _onSort(event: any) {
        console.log(event);
    }

    _timestampToMoment(value: number) {
        return value ? new Date(value) : null;
    }

    onBreadcrumb(event: any) {
        this.router.navigate([event.url]);
    }

    _resetScroll() {
        Tools.ScrollElement('container-scroller', 0);
    }

    onOpen(event: any) {
        console.log('onOpen', event);
    }

    onAction(event: any) {
        switch(event.action) {
            case 'add':
                this._currentGroup = event.item;
                this._editGruppo();
                break;
            case 'edit':
                this._currentGroup = null;
                this._editGruppo(event.item);
            break;
            case 'remove':
                this._currentGroup = event.item;
                this._confirmDelection(event.item);
            break;
        }
    }

    _onCloseEdit(event: any) {
        this._isEdit = false;
        this._isNew = false;
        this._editCurrent = null;
        this._currentGroup = null;
    }

    get f(): { [key: string]: AbstractControl } {
        return this._editFormGroup.controls;
    }

    _initEditForm(data: any = null) {
        this._isEdit = true;
        // const _padre = this._currentGroup ? this._currentGroup.id_gruppo : null;
        const _nome = data ? data.nome : null;
        const _tipo = data ? data.tipo : 'API';
        const _descrizione = data ? data.descrizione : null;
        const _descrizione_sintetica = data ? data.descrizione_sintetica : null;
        this._editFormGroup = new FormGroup({
            // padre: new FormControl(_padre, []),
            nome: new FormControl(_nome, [Validators.required, Validators.maxLength(255)]),
            tipo: new FormControl(_tipo, [Validators.required, Validators.maxLength(255)]),
            descrizione: new FormControl(_descrizione, [Validators.maxLength(255)]),
            descrizione_sintetica: new FormControl(_descrizione_sintetica, [Validators.maxLength(255)]),
            immagine: new FormControl(data?.immagine, []),
        });
    }

    _editGruppo(data: any = null) {
        let _open: boolean = true;
        const _data: any = data || null;
        this._editCurrent = _data;
        this._data = _data;
        this._isNew = (this._editCurrent === null);
        if (this._isNew) {
            this._initEditForm();
            this._showDialog();
        } else {
            this.apiService.getDetails(this.model, this._editCurrent.id_gruppo).subscribe(
                (response: any) => {
                    this._data = response;
                    this._initEditForm(response);
                    this._showDialog();
                },
                (error: any) => {
                    this._error = true;
                    this._errorMsg = Tools.GetErrorMsg(error);
                    _open = false;
                }
            );
        }
    }

    _showDialog() {
        this.__resetError();
        this._modalEditRef = this.modalService.show(this.editTemplate, {
            ignoreBackdropClick: false,
            // class: 'modal-half'
        });
    }

    saveModal(body: any) {
        this.__resetError();
        this._saving = true;
        let _resultObject: Observable<any>;
        const _body = this._prepareBodyGruppo(body);
        if (this._isNew) {
            _resultObject = this.apiService.postElement(this.model, _body);
        } else {
            _resultObject = this.apiService.putElement(this.model, this._editCurrent.id_gruppo, _body);
        }
        _resultObject.subscribe(
            (response: any) => {
                this._saving = false;
                this._modalEditRef.hide();
                this._onCloseEdit(null);
                this._loadGruppi();
            },
            (error: any) => {
                this._saving = false;
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
            }
        );
    }

    _prepareBodyGruppo(body: any) {
        let _immagine: any = {};

        if (body.immagine && body.immagine.uuid) {
            _immagine.tipo_documento = 'uuid';
            _immagine.uuid = body.immagine.uuid;
        } else {
            _immagine = body.immagine;
        }

        let _padre = this._currentGroup?.id_gruppo;
        if (this._editCurrent?.path_gruppo) {
            _padre = this._editCurrent.path_gruppo[this._editCurrent.path_gruppo.length - 1].id_gruppo;
        }

        const _newBody: any = {
            padre: _padre,
            nome: body.nome || '',
            tipo: body.tipo || '',
            descrizione_sintetica: body.descrizione_sintetica || undefined,
            descrizione: body.descrizione || undefined,
            immagine: _immagine
        };

        return _newBody;
    }

    closeModal(){
        this._modalEditRef.hide();
        this._onCloseEdit(null);
    }

    _confirmDelection(data: any) {
        this.utils._confirmDelection(data, this.__deleteGruppo.bind(this));
    }

    __deleteGruppo(data: any) {
        this.__resetError();
        this._deleting = true;
        this.apiService.deleteElement(this.model, this._currentGroup.id_gruppo).subscribe(
            (response) => {
                this._deleting = false;
                this._loadGruppi();
            },
            (error) => {
                this._error = true;
                this._errorMsg = Tools.GetErrorMsg(error);
                this._deleting = false;
            }
        );
    }

    _hasControlError(name: string) {
        return (this.f[name] && this.f[name].errors && this.f[name].touched);
    }

    _onImageLoaded(event: any) {
        if (event) {
            var _split = event.split(',');
            var _type = _split[0].split(';')[0].replace('data:', '');
            var _content = _split[1];
        
            const _immagine: any = {
                content_type: _type,
                content: _content
            };
            if (!this._isNew) {
                _immagine.tipo_documento = 'nuovo';
            }
            this._editFormGroup.get('immagine')?.setValue(_immagine);
        } else {
            this._editFormGroup.get('immagine')?.setValue(null);
        }
    }

    __resetError() {
        this._error = false;
        this._errorMsg = '';
    }

    _getLogoMapper = (data: any): string => {
        return data.immagine ? `${this.apiUrl}/gruppi/${data.id_gruppo}/immagine`: '';
    }
}
