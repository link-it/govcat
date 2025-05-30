import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { SearchBarFormComponent } from '@linkit/components'
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { FieldClass } from '@linkit/components';

import { YesnoDialogBsComponent } from '@linkit/components';

import { Page } from '@app/models/page';
import { Grant } from '@app/model/grant';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
  selector: 'app-servizio-componenti',
  templateUrl: 'servizio-componenti.component.html',
  styleUrls: ['servizio-componenti.component.scss'],
  standalone: false
})
export class ServizioComponentiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioComponentiComponent';
  readonly model: string = 'servizi';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: number = 0;

  Tools = Tools;

  config: any;
  componentiConfig: any;

  service: any = null;
  servizioComponenti: any[] = [];
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
    { label: 'APP.TITLE.Components', url: '', type: 'link' },
  ];

  _modalEditRef!: BsModalRef;
  _modalConfirmRef!: BsModalRef;

  _editFormGroup: FormGroup = new FormGroup({});

  minLengthTerm: number = 1;
  componenti$!: Observable<any[]>;
  componentiInput$ = new Subject<string>();
  componentiLoading: boolean = false;
  componentiFilter: string = '';

  anagrafiche: any = {};

  _updateMapper: string = '';

  _isDominioEsterno: boolean = false;
  _idDominioEsterno: string | null = null;

  api_url: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    public utilService: UtilService,
    public authenticationService: AuthenticationService
  ) {
    this.config = this.configService.getConfiguration();
    this.api_url = this.config.AppConfig.GOVAPI.HOST;

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
        // this._initBreadcrumb();
        this.configService.getConfig('componenti').subscribe(
          (config: any) => {
            this.componentiConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._isDominioEsterno = this.service.dominio?.soggetto_referente?.organizzazione?.esterna || false;
              this._idDominioEsterno = this.service.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._loadServizioComponenti();
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
    const _title = this.service ? this.service.nome + ' v. ' + this.service.versione : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    this.breadcrumbs = [
      { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
      { label: `${_title}`, url: `/${this.model}/${this.id}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.SERVICES.TITLE.ServiceComponents', url: ``, type: 'link' }
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
      type: new UntypedFormControl('')
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
              this._isDominioEsterno = this.service.dominio?.soggetto_referente?.organizzazione?.esterna || false;
              this._idDominioEsterno = this.service.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._spin = false;
              this._loadServizioComponenti();
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

  _loadServizioComponenti(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      this._spin = true;
      if (!url) { this.servizioComponenti = []; }  
      this.apiService.getDetails(this.model, this.id, 'componenti').subscribe({
        next: (response: any) => {

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _list: any = response.content.map((service: any) => {
              const _meta: string[] = [];
              if (service.descrizione_sintetica) {
                _meta.push(Tools.TruncateRows(service.descrizione_sintetica));
              }
  
              let _visibilita = service.visibilita || 'dominio';
              if (!service.visibilita && service.dominio) {
                _visibilita = service.visibilita ? service.visibilita : `${service.dominio.visibilita}`;
              }
              service.visibilita = _visibilita;
                const element = {
                id: service.idServizio,
                editMode: false,
                enableCollapse: true,
                source: { ...service, visibilita: _visibilita, logo: service.immagine ? `${this.api_url}/servizi/${service.id_servizio}/immagine`: '' },
                idServizio: service.id_servizio,
                nome: service.nome,
                versione: service.versione || '',  
                logo: service.immagine ? `${this.api_url}/servizi/${service.id_servizio}/immagine`: '',
                descrizione: service.descrizione || '',
                stato: service.stato || '',
                multiplo: service.multi_adesione || false,
                };
              return element;
            });
            this.servizioComponenti = (url) ? [...this.servizioComponenti, ..._list] : [..._list];
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

  _generateComponentFields(data: any) {
    return Tools.generateFields(this.componentiConfig.details, data).map((field: FieldClass) => {
      field.label = this.translate.instant(field.label);
      return field;
    });
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioComponenti(null, this._links.next.href);
    }
  }

  _onNew() {
    this._addServizio();
  }

  _onEdit(event: any, param: any) {
    this.router.navigate(['servizi', this.service.id_servizio, 'componenti', param.idServizio]);
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadServizioComponenti(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioComponenti(this._filterData);
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
      id_servizio: new FormControl(null, [Validators.required])
    });
  }

  _addServizio() {
    this.loadAnagrafiche();
    this._initComponentiSelect([]);
    this._initEditForm();

    this._modalEditRef = this.modalService.show(this.editTemplate, {
      ignoreBackdropClick: false,
      // class: 'modal-half'
    });
  }

  saveModal(body: any){
    this._errorSave = false;
    this._errorSaveMsg = '';
    this.apiService.putElementRelated(this.model, this.id, `componenti/${body.id_servizio}`, null).subscribe(
      (response: any) => {
        this._modalEditRef.hide();
        this._loadServizioComponenti();
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

  _deleteComponent(data: any) {
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
          this.apiService.deleteElementRelated(this.model, this.id, `componenti/${data.source.id_servizio}`).subscribe(
            (response) => {
              this._loadServizioComponenti();
            },
            (error) => {
              this._error = true;
              const _message = this.translate.instant('APP.MESSAGE.ERROR.NoDeleteComponent');
              Tools.showMessage(_message, 'danger', true);
            }
          );
        }
      }
    );
  }

  _hasControlError(name: string) {
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  trackByFn(item: any) {
    return item.id;
  }

  _initComponentiSelect(defaultValue: any[] = []) {
    this.componenti$ = concat(
      of(defaultValue),
      this.componentiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.componentiLoading = true),
        switchMap((term: any) => {
          return this.getData('servizi', term, { package: false }).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.componentiLoading = false)
          )
        })
      )
    );
  }

  getData(model: string, term: any = null, params: any = {}, sort: string = 'id', sort_direction: string = 'desc'): Observable<any> {
    let _options: any = { params: params };
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
          throwError(resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          });
          return _items;
        }
      })
      );
  }

  _onChangeTipoReferente(isReferent: boolean) {
    this.componentiFilter = isReferent ? 'referente_servizio,gestore,coordinatore' : '';
  }

  loadAnagrafiche() {
    this.anagrafiche['tipo-referente'] = [
      { nome: 'referente', filter: 'referente_servizio,gestore,coordinatore' },
      { nome: 'referente_tecnico', filter: '' }
    ];
  }

  onChangeTipo(event: any) {
    this.componentiFilter = event.filter;
    const tipoReferente = this._editFormGroup.controls.tipo.value; 
    (tipoReferente !== '') ? this._editFormGroup.controls.id_utente.enable() : this._editFormGroup.controls.id_utente.disable();
    this._initComponentiSelect()
    this._editFormGroup.controls.id_utente.patchValue(null);
  }

  onChangeComponent(event: any) {
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
        this.router.navigate([url], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }
}
