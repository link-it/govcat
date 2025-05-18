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
import { ModalGroupChoiceComponent } from '@app/components/modal-group-choice/modal-group-choice.component';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Page } from '@app/models/page';
import { Grant } from '@app/model/grant';

import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
  selector: 'app-servizio-gruppi',
  templateUrl: 'servizio-gruppi.component.html',
  styleUrls: ['servizio-gruppi.component.scss'],
  standalone: false
})
export class ServizioGruppiComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'ServizioGruppiComponent';
  readonly model: string = 'servizi';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: number = 0;

  Tools = Tools;

  config: any;
  gruppiConfig: any;

  apiUrl: string = '';
  _imagePlaceHolder: string = './assets/images/logo-placeholder.png';

  service: any = null;
  servizioGruppi: any[] = [];
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

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.TITLE.ServiceGroups', url: '', type: 'link' },
  ];

  _modalEditRef!: BsModalRef;
  _modalConfirmRef!: BsModalRef;

  _editFormGroup: FormGroup = new FormGroup({});

  minLengthTerm: number = 1;
  gruppi$!: Observable<any[]>;
  gruppiInput$ = new Subject<string>();
  gruppiLoading: boolean = false;
  gruppiFilter: string = '';

  anagrafiche: any = {};

  _updateMapper: string = '';

  modalChoiceRef!: BsModalRef;

  _componentBreadcrumbs: ComponentBreadcrumbsData|null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public utilService: UtilService,
    public authenticationService: AuthenticationService
  ) {
    this.route.data.subscribe((data) => {
      if (!data.componentBreadcrumbs) return;
      this._componentBreadcrumbs = data.componentBreadcrumbs;
      this._initBreadcrumb();
    });

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
      let _id = params['id'];
      const _cid = params['cid'];
      if (_cid) { _id = _cid; }
      if (_id) {
        this.id = _id;
        this.configService.getConfig('gruppi').subscribe(
          (config: any) => {
            this.gruppiConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._loadServizioGruppi();
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
    const _nome: string = this.service ? this.service.nome : null;
    const _versione: string = this.service ? this.service.versione : null;
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';

    let title = (_nome && _versione) ?`${_nome} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    let baseUrl = `/${this.model}`;

    if (this._componentBreadcrumbs) {
      title = (_nome && _versione) ? `${_nome} v. ${_versione}` : '...';
      baseUrl = `/servizi/${this._componentBreadcrumbs.service.id_servizio}/componenti`;
    }

    const _mainLabel = this._componentBreadcrumbs ? 'APP.TITLE.Components' : 'APP.TITLE.Services';
    const _mainTooltip = this._componentBreadcrumbs ? 'APP.TOOLTIP.ComponentsList' : '';
    const _mainIcon = this._componentBreadcrumbs ? '' : 'grid-3x3-gap';

    this.breadcrumbs = [
      { label: _mainLabel, url: `${baseUrl}/`, type: 'link', iconBs: _mainIcon, tooltip: _mainTooltip },
      { label: `${title}`, url: `${baseUrl}/${this.id}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.TITLE.ServiceGroups', url: ``, type: 'link' }
    ];

    if(this._componentBreadcrumbs){
      this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
    }
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
              this._loadServizioGruppi();
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

  _loadServizioGruppi(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      this._spin = true;
      if (!url) { this.servizioGruppi = []; }  
      this.apiService.getDetails(this.model, this.id, 'gruppi').subscribe({
        next: (response: any) => {

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _list: any = response.content.map((gruppo: any) => {
              const _logo = gruppo.immagine ? `${this.apiUrl}/gruppi/${gruppo.id_gruppo}/immagine` : '';
              const element = {
                id: gruppo.id_gruppo,
                id_gruppo: gruppo.id_gruppo,
                nome: gruppo.nome,
                logo: _logo,
                immagine: gruppo.immagine || null,
                descrizione: gruppo.descrizione || '',
                descrizione_sintetica: gruppo.descrizione_sintetica || '',
                children: gruppo.figli,
                figli: gruppo.figli,
                hasChildren: !!gruppo.figli,
                enableCollapse: false,
                source: { ...gruppo, logo: _logo },
              };
              return element;
            });
            this.servizioGruppi = (url) ? [...this.servizioGruppi, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
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
    return Tools.generateFields(this.gruppiConfig.details, data).map((field: FieldClass) => {
      field.label = this.translate.instant(field.label);
      return field;
    });
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioGruppi(null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useDialog) {
      this._addGruppo();
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
    this._loadServizioGruppi(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioGruppi(this._filterData);
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

  _addGruppo() {
    this.openChoiceGroupModal();
  }

  saveModal(body: any){
    this._errorSave = false;
    this._errorSaveMsg = '';    
    this.apiService.postElementRelated(this.model, this.id, 'gruppi', body).subscribe(
      (response: any) => {
        this._modalEditRef.hide();
        this._loadServizioGruppi();
      },
      (error: any) => {
        this._errorSave = true;
        this._errorSaveMsg = error.details || Tools.GetErrorMsg(error);
        console.log('error', error);
      }
    );
  }

  closeModal() {
    this._errorSave = false;
    this._errorSaveMsg = '';    
    this._modalEditRef.hide();
  }

  _deleteGruppo(data: any) {
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
          this.apiService.deleteElementRelated(this.model, this.id, `gruppi/${data.id_gruppo}`).subscribe(
            (response) => {
              this._loadServizioGruppi();
            },
            (error) => {
              this._error = true;
              const _message = this.translate.instant('APP.MESSAGE.ERROR.NoDeleteReferent');
              Tools.showMessage(_message, 'danger', true);
            }
          );
        }
      }
    );
  }

  openChoiceGroupModal() {
    const initialState = {
      gruppi: [],
      selected: [],
      notSelectable: this.servizioGruppi,
    };
    this.modalChoiceRef = this.modalService.show(ModalGroupChoiceComponent, {
      ignoreBackdropClick: true,
      // class: 'modal-lg-custom',
      initialState: initialState
    });
    this.modalChoiceRef.content.onClose.subscribe(
      (result: any) => {
        const _id_gruppo = result[0].id_gruppo;
        this.apiService.postElementRelated(this.model, this.id, `gruppi/${result[0].id_gruppo}`, {}).subscribe(
          (response) => {
            this._loadServizioGruppi();
          },
          (error) => {
            this._error = true;
            const _message = this.translate.instant('APP.MESSAGE.ERROR.NoDeleteGruppi');
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

  _initGruppiSelect(defaultValue: any[] = []) {
    this.gruppi$ = concat(
      of(defaultValue),
      this.gruppiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.gruppiLoading = true),
        switchMap((term: any) => {
          return this.utilService.getUtenti(term, this.gruppiFilter).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.gruppiLoading = false)
          )
        })
      )
    );
  }

  _onChangeTipoReferente(isReferent: boolean) {
    this.gruppiFilter = isReferent ? 'referente_servizio,gestore' : '';
  }

  loadAnagrafiche() {
    this.anagrafiche['tipo-referente'] = [
      { nome: 'referente', filter: 'referente_servizio,gestore' },
      { nome: 'referente_tecnico', filter: '' }
    ];
  }

  onChangeTipo(event: any) {
    this.gruppiFilter = event.filter;
    const tipoReferente = this._editFormGroup.controls.tipo.value; 
    (tipoReferente !== '') ? this._editFormGroup.controls.id_utente.enable() : this._editFormGroup.controls.id_utente.disable();
    this._initGruppiSelect()
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
