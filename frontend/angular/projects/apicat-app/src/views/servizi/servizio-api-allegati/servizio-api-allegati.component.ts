import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from '@services/openAPI.service';
import { SearchGoogleFormComponent } from 'projects/components/src/lib/ui/search-google-form/search-google-form.component';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';
// import { AllegatoComponent } from 'projects/components/src/lib/ui/allegato/allegato.component';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Page } from '@app/models/page';
import { TipologiaAllegatoEnum } from '@app/model/tipologiaAllegatoEnum';
import { Grant } from '@app/model/grant';

declare const saveAs: any;

@Component({
  selector: 'app-servizio-api-allegati',
  templateUrl: 'servizio-api-allegati.component.html',
  styleUrls: ['servizio-api-allegati.component.scss']
})
export class ServizioApiAllegatiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioAllegatiComponent';
  readonly model: string = 'api';

  @ViewChild('searchGoogleForm') searchGoogleForm!: SearchGoogleFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: string | null = null;
  sid: string | null = null;

  Tools = Tools;

  config: any;
  allegatiConfig: any;

  service: any = null;
  servizioApi: any = null;
  servizioApiAllegati: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _grant: Grant | null = null;

  _isNew: boolean = false;
  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  _showLoading: boolean = true;
  desktop: boolean = false;

  _useRoute : boolean = false;
  _useDialog : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;
  _errorMsg: string = '';

  showHistory: boolean = false;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'documento.filename';
  sortDirection: string = 'asc';
  sortFields: any[] = [
    { field: 'documento.filename', label: 'APP.LABEL.filename', icon: '' }
  ];

  simpleSearch: boolean = false;
  searchFields: any[] = [];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.SERVICES.TITLE.API', url: '', type: 'link' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.SERVICES.TITLE.Allegati', url: '', type: 'link' }
  ];

  _modalEditRef!: BsModalRef;
  _modalConfirmRef!: BsModalRef;

  _editFormGroup: FormGroup = new FormGroup({});
  _descrittoreCtrl: FormControl = new FormControl('', [Validators.required]);
  _newDescrittore = false;

  _multiple: boolean = true;
  _allegatiCtrl: FormControl = new FormControl('');
  _files: any [] = [];

  minLengthTerm: number = 1;
  referenti$!: Observable<any[]>;
  referentiInput$ = new Subject<string>();
  referentiLoading: boolean = false;
  referentiFilter: string = '';

  _saving: boolean = false;
  _downloading: boolean = false;
  _downloadings: boolean[] = [];
  _deleting: boolean = false;

  _tipoAllegato: string = '';
  _showAllAttachments: boolean = false;

  _updateMapper: string = '';

  _tipiAllegati: any[] = Tools.TipiAllegati;

  _tipiVisibilitaAllegato: any[] = [];

  _useNewSearchUI : boolean = false;

  _componentBreadcrumbs: ComponentBreadcrumbsData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    public utils: UtilService,
    public authenticationService: AuthenticationService
  ) {
    this.route.data.subscribe((data) => {
      if (!data.componentBreadcrumbs) return;
      this._componentBreadcrumbs = data.componentBreadcrumbs;
      this._initBreadcrumb();
    });

    this.config = this.configService.getConfiguration();
    this._useNewSearchUI = true; // this.config.AppConfig.Search.newLayout || false;
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;
    this._grant = _state?.grant;

    this._tipiVisibilitaAllegato = Tools.Configurazione?.servizio?.visibilita_allegati_consentite.filter((item: string) => {
      if ((item === 'gestore') && !this.authenticationService.isGestore(this._grant?.ruoli)) {
        return false;
      }
      return true;
    }).map((item: string) => {
      return { label: item, value: item };
    });
  
    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    const _segments =  this.router.url.split('/');
    const _segment =  _segments[_segments.length - 1];
    this._tipoAllegato = (_segment === 'allegati') ? TipologiaAllegatoEnum.Generico : TipologiaAllegatoEnum.Specifica;

    this.route.params.subscribe(params => {
      let _id = params['id'];
      const _cid = params['cid'];
      if (_cid) { _id = _cid; }
      if (_id) {
        this.sid = _id;
        this.id = params['aid'];
        this.configService.getConfig('allegati').subscribe(
          (config: any) => {
            this.allegatiConfig = config;
            this._showAllAttachments = config.showAllAttachments || false;

            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateTipiAllegati();
              this._updateMapper = new Date().getTime().toString();
              this._loadServizioApiAllegati();
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

  _initBreadcrumb() {
    const _nome: string = this.service ? this.service.nome : null;
    const _versione: string = this.service ? this.service.versione : null;
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _api = this.servizioApi;
    const _titleAPI = _api ? `${_api.nome} v. ${_api.versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _allegati = (this._tipoAllegato === TipologiaAllegatoEnum.Generico) ? 'APP.SERVICES.TITLE.Allegati': 'APP.SERVICES.TITLE.Allegati';

    let title = (_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...';
    let baseUrl = `/servizi`;

    if (this._componentBreadcrumbs) {
      title = (_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...';
      baseUrl = `/servizi/${this._componentBreadcrumbs.service.id_servizio}/componenti`;
    }

    const _mainLabel = this._componentBreadcrumbs ? 'APP.TITLE.Components' : 'APP.TITLE.Services';
    const _mainTooltip = this._componentBreadcrumbs ? 'APP.TOOLTIP.ComponentsList' : '';
    const _mainIcon = this._componentBreadcrumbs ? '' : 'grid-3x3-gap';

    this.breadcrumbs = [
      { label: _mainLabel, url: `${baseUrl}/`, type: 'link', iconBs: _mainIcon, tooltip: _mainTooltip },
      { label: `${title}`, url: `${baseUrl}/${this.sid}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.SERVICES.TITLE.API', url: `${baseUrl}/${this.sid}/api`, type: 'link', tooltip: 'APP.TOOLTIP.ApiList' },
      { label: `${_titleAPI}`, url: `${baseUrl}/${this.sid}/api/${this.id}`, type: 'link', tooltip: '' },
      { label: _allegati, url: ``, type: 'link' }
    ];

    if(this._componentBreadcrumbs){
      this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
    }
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
    const _enumAllegati: any = {};
    Tools.TipiAllegati.forEach((item: any) =>{
      _enumAllegati[item.label] = `APP.ALLEGATI.TIPI.${item.value}`;
    });
    const _enumVisibilita: any = {};
    this._tipiVisibilitaAllegato.forEach((item: any) =>{
      _enumVisibilita[item.label] = `APP.VISIBILITY.${item.value}`;
    });

    this.searchFields = [
      { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
      { field: 'tipologia_allegato', label: 'APP.LABEL.TipoAllegatoRuolo', type: 'enum', condition: 'equal', enumValues: _enumAllegati },
      { field: 'visibilita_allegato', label: 'APP.LABEL.visibilita', type: 'enum', condition: 'equal', enumValues: _enumVisibilita }
    ];

    this._formGroup = new UntypedFormGroup({
      q: new UntypedFormControl(''),
      tipologia_allegato: new UntypedFormControl(''),
      visibilita_allegato: new UntypedFormControl('')
    });
  }

  _loadServizio() {
    if (this.sid) {
      this.service = null;
      this._spin = true;
      this.apiService.getDetails('servizi', this.sid, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;
          this.apiService.getDetails('servizi', this.sid).subscribe({
            next: (response: any) => {
              this.service = response;
              this._loadServizioApi();
              this._updateTipiAllegati();
              this._updateMapper = new Date().getTime().toString();
              this._spin = false;
              this._loadServizioApiAllegati();
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

  _loadServizioApi() {
    if (this.id) {
      this.servizioApi = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.servizioApi = response;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadServizioApiAllegati(query: any = null, url: string = '') {
    this._setErrorApi(false);
    if (this.id) {
      this._spin = this._showLoading;
      let aux: any;
      if (!url && this._showLoading) {
        this.servizioApiAllegati = [];
        const sort: any = { sort: `${this.sortField},${this.sortDirection}`}
        query = { ...query, ...sort };
      }
      if (!this._showAllAttachments) {
        query = { ...query, tipologia_allegato: this._tipoAllegato }
      }
      aux = { params: this.utils._queryToHttpParams({ ...query }) };
      this.apiService.getDetails(this.model, this.id, 'allegati', aux).subscribe({
        next: (response: any) => {

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _list: any = response.content.map((api: any) => {
              const element = {
                id: api.component_id,
                editMode: false,
                source: { ...api }
              };
              return element;
            });
            this.servizioApiAllegati = (url) ? [...this.servizioApiAllegati, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
          this._spin = false;
          this._showLoading = true;
        },
        error: (error: any) => {
          this._spin = false;
          this._showLoading = true;
          // this._setErrorApi(true);
        }
      });
    }
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioApiAllegati(null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useDialog) {
      this._editAllegato();
    }
  }

  _onEdit(event: any, data: any) {
    if (this._useDialog) {
      if (this.searchGoogleForm) {
        this.searchGoogleForm._pinLastSearch();
      }
      this._editAllegato(data);
    }
  }

  _onSubmit(form: any) {
    if (this.searchGoogleForm) {
      this.searchGoogleForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadServizioApiAllegati(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioApiAllegati(this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadServizioApiAllegati(this._filterData);
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
    this._files = [];
    const _uuid = data ? data.uuid : null;
    const _filename = data ? data.filename : null;
    const _estensione = data ? data.estensione : null;
    const _descrizione = data ? data.descrizione : null;
    const _visibilita = data ? data.visibilita : null;
    const _tipologia = data ? data.tipologia : (this._showAllAttachments ? null : TipologiaAllegatoEnum.Generico);
    this._editFormGroup = new FormGroup({
      uuid: new FormControl(_uuid, _uuid ? [Validators.required] : []),
      filename: new FormControl(_filename, this._multiple ? [] : [Validators.required]),
      estensione: new FormControl(_estensione, (this._multiple || _uuid) ? [] : [Validators.required]),
      descrizione: new FormControl(_descrizione, []),
      visibilita: new FormControl(_visibilita, [Validators.required]),
      tipologia: new FormControl(_tipologia, [Validators.required]),
      content: new FormControl(null, (this._isNew && !this._multiple && !_uuid) ? [Validators.required] : []),
      files: new FormControl(null, this._multiple ? [Validators.required] : [])
    });
    this._descrittoreCtrl.setValue(data);
    this._newDescrittore = false;
  }

  _editAllegato(data: any = null) {
    let _open: boolean = true;
    const _data: any = data ? data.source : null;
    this._editCurrent = _data;
    this._isEdit = _data ? !!_data.uuid : false;
    this._multiple = !this._isEdit;
    this._isNew = (this._editCurrent === null);
    if (this._isNew) {
      this._initEditForm();
    } else {
      this._initEditForm(_data);
    }

    if (_open) {
      this._modalEditRef = this.modalService.show(this.editTemplate, {
        ignoreBackdropClick: true,
        // class: 'modal-half'
      });
    }
  }

  saveModal(body: any) {
    const _allegati: any[] = [];
    let _dataUpdate: any = null;
    this.__resetError();
    this._saving = true;
    this._showLoading = false;
    if (!this._showAllAttachments) { body.tipologia = this._tipoAllegato; }
    let _resultObject: Observable<any>;

    if (this._isNew) {
      if (this._multiple) {
        body.files.forEach((file: any) => {
          _allegati.push({
            tipologia: body.tipologia,
            visibilita: body.visibilita,
            descrizione: body.descrizione,
            filename: file.filename,
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

      if (this._newDescrittore) {
        _dataUpdate.content = {
          tipo_documento: 'nuovo',
          filename: body.filename,
          content_type: body.estensione,
          content: body.content
        };
      }

      _resultObject = this.apiService.putElementRelated(this.model, this.id, `allegati/${body.uuid}`, _dataUpdate);
    }

    _resultObject.subscribe(
      (response: any) => {
        this._saving = false;
        this._modalEditRef.hide();
        this._onCloseEdit(null);
        this._loadServizioApiAllegati();
      },
      (error: any) => {
        this._saving = false;
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
      }
    );
  }

  closeModal(){
    this._saving = false;
    this._error = false;
    this._modalEditRef.hide();
    this._onCloseEdit(null);
  }

  _confirmDelection(data: any) {
    this.utils._confirmDelection(data, this.__deleteAllegato.bind(this));
  }

  __deleteAllegato(data: any) {
    const _data = data.source;
    this.__resetError();
    this._deleting = true;
    this._showLoading = false;
    const _partial = `allegati/${_data.uuid}`;
    this.apiService.deleteElementRelated(this.model, this.id, _partial).subscribe(
      (response) => {
        this._deleting = false;
        this._loadServizioApiAllegati();
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

  _downloadAllegato(data: any, index: number = -1) {
    const _data = data.source;
    this.__resetError();
    if (index === -1) {
      this._downloading = true;
    } else {
      this._downloadings[index] = true;
    }
    const _partial = `allegati/${_data.uuid}/download`;
    this.apiService.download(this.model, this.id, _partial).subscribe({
      next: (response: any) => {
        // const _ext = _data.content_type ? _data.content_type.split('/')[1] : 'txt';
        // let name: string = `${_data.filename}.${_ext}`;
        let name: string = `${_data.filename}`;
        saveAs(response.body, name);
        if (index === -1) {
          this._downloading = false;
        } else {
          this._downloadings[index] = false;
        }
      },
      error: (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        if (index === -1) {
          this._downloading = false;
        } else {
          this._downloadings[index] = false;
        }
      }
    });
}
  
  __descrittoreChange(value: any) {
    const controls = this._editFormGroup.controls;
    if (this._multiple) {
      if (value && value.data) {
        this._files.push({
          filename: value.file,
          estensione: value.type,
          content: value.data
        });
        controls.files.setValue(this._files);
        // if (this._files.length === 1) {
        //   controls.filename.patchValue(value.file);
        //   controls.estensione.patchValue(value.type);
        //   controls.content.patchValue(value.data);
        //   controls.fileName.setValidators([Validators.required]);
        // } else {
          controls.filename.patchValue(null);
          controls.estensione.patchValue(null);
          controls.content.patchValue(null);
          controls.filename.clearValidators();
        // }
        this._descrittoreCtrl.setValue('');
        this._editFormGroup.updateValueAndValidity();
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
      this._editFormGroup.updateValueAndValidity();
      this._newDescrittore = true;
    }
    this.__resetError();
  }

  __resetError() {
    this._error = false;
    this._errorMsg = '';
  }

  _removeFile(index: number) {
    this._files.splice(index, 1);
    const controls = this._editFormGroup.controls;
    controls.files.setValue(this._files);
  }

  _toggleMultiple() {
    const controls = this._editFormGroup.controls;
    this._multiple = !this._multiple;
    controls.estensione.patchValue(null);
    controls.descrizione.patchValue(null);
    controls.visibilita.patchValue(null);
    controls.tipologia.patchValue(null);
    controls.content.patchValue(null);
    controls.uuid.patchValue(null);
    controls.files.patchValue(null);
    this._editFormGroup.updateValueAndValidity();
  }

  _updateTipiAllegati() {
    this._tipiAllegati = Tools.TipiAllegati.filter((item: any) => {
      return this._canTypeAttachment(item.value);
    });
  }

  _canTypeAttachment(type: string) {
    return this.authenticationService.canTypeAttachment('servizio', this.service.stato, type, this._grant?.ruoli);
  }

  _canTypeAttachmentMapper = (type: string): boolean => {
    return this.authenticationService.canTypeAttachment('servizio', this.service?.stato, type, this._grant?.ruoli);
  }

  _canAddMapper = (): boolean => {
    return this.authenticationService.canAdd('servizio', this.service?.stato, this._grant?.ruoli);
  }

  _canEditMapper = (): boolean => {
    return this.authenticationService.canEdit('servizio', 'allegati', this.service?.stato, this._grant?.ruoli);
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
  }}
