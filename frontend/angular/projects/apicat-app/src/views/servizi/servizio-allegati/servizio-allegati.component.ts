import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';
import { SearchBarFormComponent } from '@linkit/components';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { AllegatiDialogComponent } from '@app/components/allegati-dialog/allegati-dialog.component';

import { Page } from '@app/models/page';
import { TipologiaAllegatoEnum } from '@app/model/tipologiaAllegatoEnum';
import { Grant } from '@app/model/grant';
import { EventType } from '@linkit/components';

declare const saveAs: any;

@Component({
  selector: 'app-servizio-allegati',
  templateUrl: 'servizio-allegati.component.html',
  styleUrls: ['servizio-allegati.component.scss'],
  standalone: false
})
export class ServizioAllegatiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioAllegatiComponent';
  readonly model: string = 'servizi';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: string | null = null;

  Tools = Tools;

  config: any;
  allegatiConfig: any;

  service: any = null;
  serviceAllegati: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _grant: Grant | null = null;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  _showLoading: boolean = true;
  desktop: boolean = false;

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
    { label: 'APP.SERVICES.TITLE.Allegati', url: '', type: 'link' }
  ];

  _modalConfirmRef!: BsModalRef;

  _downloading: boolean = false;
  _downloadings: boolean[] = [];
  _deleting: boolean = false;

  _tipoAllegato: string = '';
  _showAllAttachments: boolean = false;

  _updateMapper: string = '';

  _tipiAllegati: any[] = Tools.TipiAllegati;

  _tipiVisibilitaAllegato: any[] = [];

  _componentBreadcrumbs: ComponentBreadcrumbsData|null = null;

  modalAttachmentsRef!: BsModalRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    private apiService: OpenAPIService,
    private utils: UtilService,
    private authenticationService: AuthenticationService
  ) {
    this.route.data.subscribe((data) => {
      if (!data.componentBreadcrumbs) return;
      this._componentBreadcrumbs = data.componentBreadcrumbs;
      this._initBreadcrumb();
    });

    this.config = this.configService.getConfiguration();
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
        this.id = _id;
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
              this._loadServizioAllegati();    
            }
          }
        );
      }
    });

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (event: any) => {
      this._tipiVisibilitaAllegato = Tools.Configurazione?.servizio?.visibilita_allegati_consentite.filter((item: string) => {
        if ((item === 'gestore') && !this.authenticationService.isGestore(this._grant?.ruoli)) {
          return false;
        }
        return true;
      }).map((item: string) => {
        return { label: item, value: item };
      });
      this._initSearchForm();
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
    const _allegati = 'APP.SERVICES.TITLE.Allegati';

    let title = (_nome && _versione) ?`${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...';
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
    this._tipiVisibilitaAllegato?.forEach((item: any) =>{
      _enumVisibilita[item.label] = `APP.VISIBILITY.${item.value}`;
    });

    this.searchFields = [
      { field: 'q', label: 'APP.LABEL.filename', type: 'string', condition: 'like' },
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
              this._updateTipiAllegati();
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
      this._spin = this._showLoading;
      let aux: any;
      if (!url && this._showLoading) {
        this.serviceAllegati = [];
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
            const _list: any = response.content.map((allegato: any) => {
              const element = {
                id: allegato.uuid,
                editMode: false,
                source: { ...allegato }
              };
              return element;
            });
            this.serviceAllegati = (url) ? [...this.serviceAllegati, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
          this._spin = false;
          this._showLoading = true;
        },
        error: (error: any) => {
          this._spin = false;
          this._showLoading = true;
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
    this._editAllegato();
  }

  _onEdit(event: any, data: any) {
    if (this.searchBarForm) {
      this.searchBarForm._pinLastSearch();
    }
    this._editAllegato(data);
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
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadServizioAllegati(this._filterData);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _editAllegato(data: any = null) {
    const initialState = {
      model: this.model,
      id: this.id,
      current: data?.source,
      isEdit: data !== null,
      isNew: data === null,
      showAllAttachments: this._showAllAttachments,
      multiple: data === null
    };
    this.modalAttachmentsRef = this.modalService.show(AllegatiDialogComponent, {
        ignoreBackdropClick: true,
        initialState: initialState
    });
    this.modalAttachmentsRef.content.onClose.subscribe(
        (result: boolean) => {
          if (result) {
            this._loadServizioAllegati();
          }
        }
    );
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
        this._loadServizioAllegati();
      },
      (error) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._deleting = false;
      }
    );
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
  
  __resetError() {
    this._error = false;
    this._errorMsg = '';
  }

  _updateTipiAllegati() {
    this._tipiAllegati = Tools.TipiAllegati.filter((item: any) => {
      return this._canTypeAttachment(item.value);
    });
  }

  _canTypeAttachment(type: string) {
    return this.authenticationService.canTypeAttachment('servizio', this.service?.stato, type, this._grant?.ruoli);
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
  }
}
