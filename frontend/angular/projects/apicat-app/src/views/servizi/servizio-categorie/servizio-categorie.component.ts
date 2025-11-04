import { AfterContentChecked, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { SearchBarFormComponent } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { FieldClass } from '@linkit/components';

import { YesnoDialogBsComponent } from '@linkit/components';
import { ModalCategoryChoiceComponent } from '@app/components/modal-category-choice/modal-category-choice.component';

import { Page } from '@app/models/page';
import { Grant } from '@app/model/grant';

import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
  selector: 'app-servizio-categorie',
  templateUrl: 'servizio-categorie.component.html',
  styleUrls: ['servizio-categorie.component.scss'],
  standalone: false
})
export class ServizioCategorieComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'ServizioCategorieComponent';
  readonly model: string = 'servizi';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  id: number = 0;

  Tools = Tools;

  config: any;
  categorieConfig: any;

  apiUrl: string = '';
  _imagePlaceHolder: string = './assets/images/logo-placeholder.png';

  service: any = null;
  servizioCategorie: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _grant: Grant | null = null;

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = false;
  desktop: boolean = false;

  _useRoute : boolean = false;
  _useDialog : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;

  _errorSave: boolean = false;
  _errorSaveMsg: string = 'false';

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [];

  breadcrumbs: any[] = [];

  _modalEditRef!: BsModalRef;
  _modalConfirmRef!: BsModalRef;

  _editFormGroup: FormGroup = new FormGroup({});

  minLengthTerm: number = 1;
  categorie$!: Observable<any[]>;
  categorieInput$ = new Subject<string>();
  categorieLoading: boolean = false;
  categorieFilter: string = '';

  anagrafiche: any = {};

  _updateMapper: string = '';

  modalChoiceRef!: BsModalRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public utils: UtilService,
    public authenticationService: AuthenticationService
  ) {
    this.config = this.configService.getConfiguration();
    this.apiUrl = this.config.AppConfig.GOVAPI.HOST;

    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;
    this._grant = _state?.grant;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        // this._initBreadcrumb();
        this.configService.getConfig('categorie').subscribe(
          (config: any) => {
            this.categorieConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._loadServizioCategorie();
            }
          }
        );
      }
    });
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _title = this.service ? this.service.nome + ' v. ' + this.service.versione : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    this.breadcrumbs = [
      { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
      { label: `${_title}`, url: `/${this.model}/${this.id}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.TITLE.ServiceCategories', url: ``, type: 'link' }
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
      "organization.taxCode": new UntypedFormControl(''),
      creationDateFrom: new UntypedFormControl(''),
      creationDateTo: new UntypedFormControl(''),
      fileName: new UntypedFormControl(''),
      status: new UntypedFormControl(''),
      type: new UntypedFormControl(''),
    });
  }

  _loadServizio() {
    if (this.id) {
      this.service = null;
      this._spin = true;
      this.apiService.getDetails('servizi', this.id, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;
          this.apiService.getDetails('servizi', this.id).subscribe({
            next: (response: any) => {
              this.service = response;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._spin = false;
              this._loadServizioCategorie();
            },
            error: (error: any) => {
              Tools.OnError(error);
              this._spin = false;
            }
          });
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadServizioCategorie(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      this._spin = true;
      if (!url) { this.servizioCategorie = []; }  
      this.apiService.getDetails(this.model, this.id, 'categorie').subscribe({
        next: (response: any) => {

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _list: any = response.content.map((categoria: any) => {
              const _path = categoria.path_categoria.map((item: any) => item.nome).join(' - ');
              const element = {
                id: categoria.id_categoria,
                id_categoria: categoria.id_categoria,
                nome: categoria.nome,
                path: _path,
                logo: categoria.immagine ? `${this.apiUrl}/categorie/${categoria.id_categoria}/immagine`: '',
                immagine: categoria.immagine || '',
                descrizione: categoria.descrizione || '',
                descrizione_sintetica: categoria.descrizione_sintetica || '',
                children: categoria.figli,
                figli: categoria.figli,
                hasChildren: !!categoria.figli,
                enableCollapse: false,
                source: { ...categoria, path: _path },
              };
              return element;
            });
            this.servizioCategorie = (url) ? [...this.servizioCategorie, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          this._spin = false;
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          this._preventMultiCall = false;
              this._spin = false;
          // Tools.OnError(error);
        }
      });
    }
  }

  _generateReferentFields(data: any) {
    return Tools.generateFields(this.categorieConfig.details, data).map((field: FieldClass) => {
      field.label = this.translate.instant(field.label);
      return field;
    });
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioCategorie(null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useDialog) {
      this._addCategories();
    } else {
      this._editCurrent = null;
      this._isEdit = true;
    }
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadServizioCategorie(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioCategorie(this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
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

  _onCloseEdit(event: any) {
    this._isEdit = false;
  }

  get f(): { [key: string]: AbstractControl } {
    return this._editFormGroup.controls;
  }

  _initEditForm() {
    this._editFormGroup = new FormGroup({
      tipo: new FormControl(null, [Validators.required]),
      id_utente: new FormControl(null, [Validators.required])
    });
    this._editFormGroup.controls.id_utente.disable();
  }

  _addCategories() {
    this.openChoiceCategoriesModal();
  }

  saveModal(body: any){
    this._errorSave = false;
    this._errorSaveMsg = '';
    this.apiService.postElementRelated(this.model, this.id, 'categorie', body).subscribe(
      (response: any) => {
        this._modalEditRef.hide();
        this._loadServizioCategorie();
      },
      (error: any) => {
        this._errorSave = true;
        this._errorSaveMsg = error.details || this.utils.GetErrorMsg(error);
        console.log('error', error);
      }
    );
  }

  closeModal() {
    this._errorSave = false;
    this._errorSaveMsg = '';    
    this._modalEditRef.hide();
  }

  _deleteCategoria(data: any) {
    const initialState = {
      title: this.translate.instant('APP.TITLE.Attention'),
      messages: [
        this.translate.instant('APP.MESSAGE.AreYouSure')
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.BUTTON.Confirm'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          this.apiService.deleteElementRelated(this.model, this.id, `categorie/${data.id_categoria}`).subscribe(
            (response) => {
              this._loadServizioCategorie();
            },
            (error) => {
              this._error = true;
              const _message = this.translate.instant('APP.MESSAGE.ERROR.NoDeleteCategoria');
              Tools.showMessage(_message, 'danger', true);
            }
          );
        }
      }
    );
  }

  openChoiceCategoriesModal() {
    const initialState = {
      categorie: [],
      selected: [],
      notSelectable: this.servizioCategorie,
    };
    this.modalChoiceRef = this.modalService.show(ModalCategoryChoiceComponent, {
      ignoreBackdropClick: true,
      // class: 'modal-lg-custom',
      initialState: initialState
    });
    this.modalChoiceRef.content.onClose.subscribe(
      (result: any) => {
        const _id_categoria = result.id_categoria;
        const _body = { categorie: [ _id_categoria ] };
        this.apiService.postElementRelated(this.model, this.id, `categorie`, _body)
          .subscribe(
            (response) => {
              this._loadServizioCategorie();
            },
            (error) => {
              this._error = true;
              const _message = this.translate.instant('APP.MESSAGE.ERROR.NoAddCategorie');
              Tools.showMessage(_message, 'danger', true);
            }
          );
      }
    );
  }

  _hasControlError(name: string) {
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  trackByFn(item: any) {
    return item.id;
  }

  _initCategorieSelect(defaultValue: any[] = []) {
    this.categorie$ = concat(
      of(defaultValue),
      this.categorieInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.categorieLoading = true),
        switchMap((term: any) => {
          return this.utils.getUtenti(term, this.categorieFilter).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.categorieLoading = false)
          )
        })
      )
    );
  }

  _onChangeTipoReferente(isReferent: boolean) {
    this.categorieFilter = isReferent ? 'referente_servizio,gestore,coordinatore' : '';
  }

  loadAnagrafiche() {
    this.anagrafiche['tipo-referente'] = [
      { nome: 'referente', filter: 'referente_servizio,gestore,coordinatore' },
      { nome: 'referente_tecnico', filter: '' }
    ];
  }

  onChangeTipo(event: any) {
    this.categorieFilter = event.filter;
    const tipoReferente = this._editFormGroup.controls.tipo.value; 
    (tipoReferente !== '') ? this._editFormGroup.controls.id_utente.enable() : this._editFormGroup.controls.id_utente.disable();
    this._initCategorieSelect()
    this._editFormGroup.controls.id_utente.patchValue(null);
  }

  onChangeUser(event: any) {
    this._errorSave = false;
    this._errorSaveMsg = '';
  }

  _canAddMapper = (): boolean => {
    const _cnm = this.authenticationService._getClassesNotModifiable('servizio', 'servizio', this.service?.stato);
    const _lstPerm = [];
    if (_.indexOf(_cnm, 'referente') === -1) {
      _lstPerm.push(true);
    }
    if (_.indexOf(_cnm, 'referente_superiore') === -1) {
      _lstPerm.push(true);
    }
    if (_lstPerm.length) {
      let _can = true;
      _lstPerm.forEach((value: boolean) => {
        _can = _can && value;
      });
      return _can;
    }
    return false;
  }

  onActionMonitor(event: any) {
    switch (event.action) {
      case 'backview':
        const url = `/servizi/${this.service.id_servizio}/view`;
        this.router.navigate([url]);
        break;
      default:
        break;
    }
  }
}
