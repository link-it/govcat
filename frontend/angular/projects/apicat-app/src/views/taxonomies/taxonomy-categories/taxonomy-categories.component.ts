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
import { AfterContentChecked, AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { SearchBarFormComponent } from '@linkit/components';

import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { Page} from '../../../models/page';
import { CardType } from 'projects/linkit/components/src/lib/ui/card/card.component';

@Component({
  selector: 'app-taxonomy-categories',
  templateUrl: 'taxonomy-categories.component.html',
  styleUrls: ['taxonomy-categories.component.scss'],
  standalone: false
})
export class TaxonomyCategoriesComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'TaxonomyCategoriesComponent';
  readonly model: string = 'categorie';

  @Input() id: number = 0;
  @Input() taxonomy: any;

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  Tools = Tools;

  config: any;
  categoriesConfig: any;
  
  categories: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _isNew: boolean = false;
  _isEdit: boolean = false;
  _editCurrent: any = null;
  _currentCategory: any = null;

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

  breadcrumbs: any[] = [];

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
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.taxonomy = _state?.taxonomy || null;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.categoriesConfig = config;
            if (!this.taxonomy) {
              this._loadTaxonomy();
            } else {
              this._initBreadcrumb();
            }
          }
        );
      }
    });
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
      setTimeout(() => {
        this._loadTaxonomyCategories();
      }, 100);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _title = this.taxonomy ? this.taxonomy.nome : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.Taxonomies', url: '/tassonomie', type: 'link' },
      { label: `${_title}`, url: `/tassonomie/${this.id}`, type: 'link' },
      { label: 'APP.TAXONOMIES.TITLE.Categories', url: ``, type: 'link' }
    ];
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
    this._formGroup = new UntypedFormGroup({
    });
  }

  _loadTaxonomy() {
    if (this.id) {
      this.taxonomy = null;
      this.apiService.getDetails('tassonomie', this.id).subscribe({
        next: (response: any) => {
          this.taxonomy = response;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadTaxonomyCategories(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    this._spin = true;
    this.apiService.getDetails('tassonomie', this.id, this.model).subscribe({
      next: (response: any) => {
        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;
        if (response.content) {
          let data: any[] = response.content;
          const _list: any = data.map((categoria: any) => {
            const element = {
              id: categoria.id_categoria,
              id_categoria: categoria.id_categoria,
              nome: categoria.nome,
              descrizione: categoria.descrizione || '',
              children: categoria.figli,
              figli: categoria.figli,
              countChildren: categoria.figli ? categoria.figli.length : 0,
              hasChildren: !!categoria.figli,
              tassonomia: categoria.tassonomia,
              servizi: categoria.servizi || null,
              source: { ...categoria },
              root: true
            };
            return element;
          });
          this.categories = (url) ? [...this.categories, ..._list] : [..._list];
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
      this._loadTaxonomyCategories(null, this._links.next.href);
    }
  }

  _onNew() {
    if (!this._useRoute) {
      this._editCategoria();
    }
  }

  _onEdit(event: any, data: any) {
    if (!this._useRoute) {
      this._editCategoria(data);
    }
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadTaxonomyCategories(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadTaxonomyCategories(this._filterData);
  }

  _onSort(event: any) {
    console.log(event);
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
        this._currentCategory = event.item;
        this._editCategoria();
        break;
      case 'edit':
        this._currentCategory = null;
        this._editCategoria(event.item);
      break;
      case 'remove':
        this._currentCategory = event.item;
        this._confirmDelection(event.item);
      break;
    }
  }

  _onCloseEdit(event: any) {
    this._isEdit = false;
    this._isNew = false;
    this._editCurrent = null;
    this._currentCategory = null;
  }

  get f(): { [key: string]: AbstractControl } {
    return this._editFormGroup.controls;
  }

  _initEditForm(data: any = null) {
    this._isEdit = true;
    const _nome = data ? data.nome : null;
    const _descrizione = data ? data.descrizione : null;
    this._editFormGroup = new FormGroup({
      // padre: new FormControl(_padre, []),
      nome: new FormControl(_nome, [Validators.required, Validators.maxLength(255)]),
      descrizione: new FormControl(_descrizione, [Validators.maxLength(255)])
    });
  }

  _editCategoria(data: any = null) {
    let _open: boolean = true;
    const _data: any = data || null;
    this._editCurrent = _data;
    this._isNew = (this._editCurrent === null);
    if (this._isNew) {
      this._initEditForm();
      this. _showDialog();
    } else {
      this.apiService.getDetails('tassonomie', this.id, `${this.model}/${this._editCurrent.id_categoria}`).subscribe(
        (response: any) => {
          this._data = response;
          this._initEditForm(response);
          this. _showDialog();
        },
        (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
          _open = false;
          Tools.showMessage(this._errorMsg, 'danger', true);
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
    const _body = this._prepareBodyCategoria(body);
    if (this._isNew) {
      _resultObject = this.apiService.postElementRelated('tassonomie', this.id, this.model, _body);
    } else {
      _resultObject = this.apiService.putElementRelated('tassonomie', this.id, `${this.model}/${this._editCurrent.id_categoria}`, _body);
    }
    _resultObject.subscribe(
      (response: any) => {
        this._saving = false;
        this._modalEditRef.hide();
        this._onCloseEdit(null);
        this._loadTaxonomyCategories();
      },
      (error: any) => {
        this._saving = false;
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
      }
    );
  }

  _prepareBodyCategoria(body: any) {
    let _immagine: any = {};

    // if (body.immagine && body.immagine.uuid) {
    //   _immagine.tipo_documento = 'uuid';
    //   _immagine.uuid = body.immagine.uuid;
    // } else {
    //   _immagine = body.immagine;
    // }

    let _padre = this._currentCategory?.id_categoria;
    if (this._editCurrent?.path_categoria) {
      _padre = this._editCurrent.path_categoria[this._editCurrent.path_categoria.length - 1].id_categoria;
    }

    const _newBody: any = {
      categoria_padre: _padre,
      label: body.nome || '',
      nome: body.nome || '',
      descrizione: body.descrizione || undefined,
      // immagine: _immagine
    };

    console.log('_prepareBodyCategoria', body, _newBody);
    return _newBody;
  }

  closeModal(){
    this._modalEditRef.hide();
    this._onCloseEdit(null);
  }

  _confirmDelection(data: any) {
    this.utils._confirmDelection(data, this.__deleteCategory.bind(this));
  }

  __deleteCategory(data: any) {
    this.__resetError();
    this._deleting = true;
    this.apiService.deleteElement(`tassonomie/${this.taxonomy.id_tassonomia}/${this.model}`, this._currentCategory.id_categoria).subscribe(
      (response) => {
        this._deleting = false;
        this._loadTaxonomyCategories();
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

  __resetError() {
    this._error = false;
    this._errorMsg = '';
  }
}
