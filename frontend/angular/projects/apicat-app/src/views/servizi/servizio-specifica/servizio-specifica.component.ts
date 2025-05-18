import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';
import { SearchBarFormComponent } from '@linkit/components';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';

import { YesnoDialogBsComponent } from '@linkit/components';

import { Page } from '@app/models/page';
import { TipologiaAllegatoEnum } from '@app/model/tipologiaAllegatoEnum';
import { Grant } from '@app/model/grant';

import { Observable, Subject } from 'rxjs';
import { HttpParams } from '@angular/common/http';

declare const saveAs: any;

@Component({
  selector: 'app-servizio-specifica',
  templateUrl: 'servizio-specifica.component.html',
  styleUrls: ['servizio-specifica.component.scss'],
  standalone: false
})
export class ServizioSpecificaComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioSpecificaComponent';
  readonly model: string = 'servizi';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: number = 0;

  Tools = Tools;

  config: any;
  allegatiConfig: any;

  service: any = null;
  serviceallegati: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _grant: Grant | null = null;

  _isNew: boolean = false;
  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = false;
  desktop: boolean = false;

  _useRoute : boolean = true;
  _useDialog : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;
  _errorMsg: string = '';

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
  _descrittoreCtrl: FormControl = new FormControl('', [Validators.required]);

  minLengthTerm: number = 1;
  referenti$!: Observable<any[]>;
  referentiInput$ = new Subject<string>();
  referentiLoading: boolean = false;
  referentiFilter: string = '';

  _saving: boolean = false;
  _downloading: boolean = false;
  _deleting: boolean = false;

  _updateMapper: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    private authenticationService: AuthenticationService,
    public apiService: OpenAPIService,
    private utils: UtilService
  ) {
    this.config = this.configService.getConfiguration();
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
        this.configService.getConfig('allegati-specifica').subscribe(
          (config: any) => {
            this.allegatiConfig = config;
            this._translateConfig();
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._loadServizioAllegati();
            }
          }
        );
      }
    });
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _translateConfig() {
    if (this.allegatiConfig && this.allegatiConfig.options) {
      Object.keys(this.allegatiConfig.options).forEach((key: string) => {
        if (this.allegatiConfig.options[key].label) {
          this.allegatiConfig.options[key].label = this.translate.instant(this.allegatiConfig.options[key].label);
        }
        if (this.allegatiConfig.options[key].values) {
          Object.keys(this.allegatiConfig.options[key].values).forEach((key2: string) => {
            this.allegatiConfig.options[key].values[key2].label = this.translate.instant(this.allegatiConfig.options[key].values[key2].label);
          });
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.service ? this.service.nome + ' v. ' + this.service.versione : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    this.breadcrumbs = [
      { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
      { label: `${_title}`, url: `/${this.model}/${this.id}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.SERVICES.TITLE.AllegatiSpecifica', url: ``, type: 'link' }
    ];
  }

  _setErrorApi(error: boolean) {
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
      this.apiService.getDetails(this.model, this.id, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;
          this.apiService.getDetails(this.model, this.id).subscribe({
            next: (response: any) => {
              this.service = response;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._spin = false;
              this._loadServizioAllegati();    
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

  _loadServizioAllegati(query: any = null, url: string = '') {
    this._setErrorApi(false);
    if (this.id) {
      this._spin = true;
      if (!url) { this.serviceallegati = []; }
      let aux: any = { params: this.utils._queryToHttpParams({ ...query, tipologia_allegato: TipologiaAllegatoEnum.Specifica }) };
      this.apiService.getDetails(this.model, this.id, 'allegati', aux).subscribe({
        next: (response: any) => {

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _itemRow = this.allegatiConfig.itemRow;
            const _options = this.allegatiConfig.options;
            const _list: any = response.content.map((api: any) => {
              const metadataText = Tools.simpleItemFormatter(_itemRow.metadata.text, api, _options || null);
              const metadataLabel = Tools.simpleItemFormatter(_itemRow.metadata.label, api, _options || null);
              const element = {
                id: api.component_id,
                primaryText: Tools.simpleItemFormatter(_itemRow.primaryText, api, _options || null),
                secondaryText: Tools.simpleItemFormatter(_itemRow.secondaryText, api, _options || null, ' '),
                metadata: (metadataText || metadataLabel) ?`${metadataText}<span class="me-2">&nbsp;</span>${metadataLabel}` : '',
                secondaryMetadata: Tools.simpleItemFormatter(_itemRow.secondaryMetadata, api, _options || null, ' '),
                editMode: false,
                source: { ...api }
              };
              return element;
            });
            this.serviceallegati = (url) ? [...this.serviceallegati, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
          this._spin = false;
        },
        error: (error: any) => {
          this._spin = false;
          this._setErrorApi(true);
          // Tools.OnError(error);
        }
      });
    }
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioAllegati(null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useDialog) {
      this._editAllegato();
    }
  }

  _onEdit(event: any, data: any) {
    if (this._useDialog) {
      if (this.searchBarForm) {
        this.searchBarForm._pinLastSearch();
      }
      this._editAllegato(data);
    }
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadServizioAllegati(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioAllegati(this._filterData);
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
    this._isNew = false;
    this._editCurrent = null;
  }

  get f(): { [key: string]: AbstractControl } {
    return this._editFormGroup.controls;
  }

  _initEditForm(data: any = null) {
    this._isEdit = true;
    const _filename = data ? data.fileName : null;
    const _estensione = data ? data.estensione : null;
    const _descrizione = data ? data.descrizione : null;
    const _visibilita = data ? data.visibilita : null;
    const _tipologia = TipologiaAllegatoEnum.Specifica;
    this._editFormGroup = new FormGroup({
      filename: new FormControl(_filename, [Validators.required]),
      estensione: new FormControl(_estensione, [Validators.required]),
      descrizione: new FormControl(_descrizione, []),
      visibilita: new FormControl(_visibilita, [Validators.required]),
      tipologia: new FormControl(_tipologia, []),
      content: new FormControl(null, this._isNew ? [Validators.required] : [])
    });
  }

  _editAllegato(data: any = null) {
    let _open: boolean = true;
    const _data: any = data ? data.source : null;
    this._editCurrent = _data;
    this._isNew = (this._editCurrent === null);
    if (this._isNew) {
      this._initEditForm();
    } else {
      const _partial = `allegati/${_data.uuid}`;
      console.log(`Non esiste la GET "${this.model}/${this.id}/${_partial}"`);
      _open = false;
      // this.apiService.getDetails(this.model, this.id, _partial).subscribe(
      //   (response: any) => {
      //     this._initEditForm(response);
      //   },
      //   (error: any) => {
      //     this._error = true;
      //     this._errorMsg = Tools.GetErrorMsg(error);
      //   }
      // );
    }

    if (_open) {
      this._modalEditRef = this.modalService.show(this.editTemplate, {
        ignoreBackdropClick: false,
        // class: 'modal-half'
      });
    }
  }

  saveModal(body: any) {
    this._error = false;
    this._errorMsg = '';
    this._saving = true;
    let _resultObject: Observable<any>;
    if (this._isNew) {
      _resultObject = this.apiService.postElementRelated(this.model, this.id, 'allegati', body);
    } else {
      _resultObject = this.apiService.putElementRelated(this.model, this.id, 'allegati', body);
    }
    _resultObject.subscribe(
      (response: any) => {
        this._saving = false;
        this._modalEditRef.hide();
        this._onCloseEdit(null);
        this._loadServizioAllegati();
      },
      (error: any) => {
        this._saving = false;
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
      }
    );
  }

  closeModal(){
    this._modalEditRef.hide();
    this._onCloseEdit(null);
  }

  _deleteAllegato(data: any) {
    const _data = data.source;
    this._error = false;
    this._errorMsg = '';
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
          this._deleting = true;
          const _partial = `allegati/${_data.uuid}`;
          this.apiService.deleteElementRelated(this.model, this.id, _partial).subscribe(
            (response) => {
              this._deleting = false;
              this._loadServizioAllegati();
            },
            (error) => {
              this._error = true;
              this._errorMsg = Tools.GetErrorMsg(error);
              this._deleting = false;
            }
          );
        }
      }
    );
  }

  _hasControlError(name: string) {
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  _downloadAllegato(data: any) {
    const _data = data.source;
    this._error = false;
    this._errorMsg = '';
    this._downloading = true;
    const _partial = `allegati/${_data.uuid}/download`;
    this.apiService.download(this.model, this.id, _partial).subscribe({
      next: (response: any) => {
        // const _ext = _data.content_type ? _data.content_type.split('/')[1] : 'txt';
        // let name: string = `${_data.filename}.${_ext}`;
        let name: string = `${_data.filename}`;
        saveAs(response.body, name);
        this._downloading = false;
      },
      error: (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._downloading = false;
      }
    });
  }
  
  __descrittoreChange(value: any) {
    const controls = this._editFormGroup.controls;
    controls.filename.patchValue(value.file);
    controls.estensione.patchValue(value.type);
    controls.estensione.patchValue(value.type);
    controls.content.patchValue(value.data);
    this._editFormGroup.updateValueAndValidity();
    this._error = false;
    this._errorMsg = '';
  }

  _canTypeAttachmentMapper = (type: string): boolean => {
    return this.authenticationService.canTypeAttachment('servizio', this.service?.stato, type, this._grant?.ruoli);
  }

  _canAddMapper = (): boolean => {
    return this.authenticationService.canAdd('servizio', this.service?.stato, this._grant?.ruoli);
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
