import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { SearchBarFormComponent } from 'projects/components/src/lib/ui/search-bar-form/search-bar-form.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { FieldClass } from 'projects/components/src/public-api';

import { YesnoDialogBsComponent } from 'projects/components/src/lib/dialogs/yesno-dialog-bs/yesno-dialog-bs.component';

import { Page } from '@app/models/page';
import { Grant } from '@app/model/grant';

import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';
import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';

import * as _ from 'lodash';

@Component({
  selector: 'app-adesione-referenti',
  templateUrl: 'adesione-referenti.component.html',
  styleUrls: ['adesione-referenti.component.scss']
})
export class AdesioneReferentiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'AdesioneReferentiComponent';
  readonly model: string = 'adesioni';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: number = 0;

  Tools = Tools;

  config: any;
  referentiConfig: any;

  adesione: any = null;
  adesionereferenti: any[] = [];
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

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' },
    { label: '...', url: '', type: 'title' },
    { label: 'APP.TITLE.ServiceReferents', url: '', type: 'title' }
  ];

  _modalEditRef!: BsModalRef;
  _modalConfirmRef!: BsModalRef;

  _editFormGroup: FormGroup = new FormGroup({});

  minLengthTerm: number = 1;
  referenti$!: Observable<any[]>;
  referentiInput$ = new Subject<string>();
  referentiLoading: boolean = false;
  referentiFilter: string = '';

  anagrafiche: any = {};
  referentiTipo: any = null;

  _serviceBreadcrumbs: ServiceBreadcrumbsData|null = null;

  _updateMapper: string = '';

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
      if(!data.serviceBreadcrumbs)return;
      this._serviceBreadcrumbs = data.serviceBreadcrumbs;
      this._initBreadcrumb();
    });

    this.config = this.configService.getConfiguration();

    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.adesione = _state?.service || null;
    this._grant = _state?.grant || null;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.configService.getConfig('referenti').subscribe(
          (config: any) => {
            this.referentiConfig = config;
            if (!this.adesione) {
              this._loadAdesione();
            } else {
              console.log('grant', this._grant);
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._loadAdesioneReferenti();
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

  public onActionMonitor(event: any) {
    if(event.action == 'backview') {
      this.router.navigate(['../view'], { relativeTo: this.route });
    }
  }

  _initBreadcrumb() {
    const _organizzazione: string = this.adesione ? this.adesione.soggetto.organizzazione.nome : null;
    const _servizio: string = this.adesione ? this.adesione.servizio.nome : '';
    const _versione: string = this.adesione ? this.adesione.servizio.versione : '';
    const _idAdesione: string = this.adesione ? this.adesione.id_adesione : '';

    let title = this.adesione ? `${_organizzazione} - ${_servizio} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    let baseUrl = `/${this.model}`;

    if (this._serviceBreadcrumbs) {
      title = _organizzazione;
      baseUrl = `/servizi/${this._serviceBreadcrumbs.service.id_servizio}/${this.model}`;
    }

    this.breadcrumbs = [
      { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
      { label: title, url: `${baseUrl}/${_idAdesione}`, type: 'link' },
      { label: 'APP.TITLE.ServiceReferents', url: ``, type: 'link' }
    ];

    if(this._serviceBreadcrumbs){
      this.breadcrumbs.unshift(...this._serviceBreadcrumbs.breadcrumbs);
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

  __loadAdesione() {
    if (this.id) {
      this.adesione = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.adesione = response;
          this._initBreadcrumb();
          this._updateMapper = new Date().getTime().toString();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadAdesione() {
    if (this.id) {
      this.adesione = null;
      this._spin = true;
      this.apiService.getDetails(this.model, this.id, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant.ruoli;
          console.log('grant', this._grant);
          this.apiService.getDetails(this.model, this.id).subscribe({
            next: (response: any) => {
              this.adesione = response;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._spin = false;
              this._loadAdesioneReferenti();
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

  _loadAdesioneReferenti(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      this._spin = true;
      if (!url) { this.adesionereferenti = []; }
      this.apiService.getDetails(this.model, this.id, 'referenti').subscribe({
        next: (response: any) => {

          console.log('response: ', response)

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _itemRow = this.referentiConfig.itemRow;
            const _options = this.referentiConfig.options;
            const _list: any = response.content.map((referent: any) => {
              const metadataText = Tools.simpleItemFormatter(_itemRow.metadata.text, referent, _options || null);
              const metadataLabel = Tools.simpleItemFormatter(_itemRow.metadata.label, referent, _options || null);
              const element = {
                id: referent.id,
                primaryText: Tools.simpleItemFormatter(_itemRow.primaryText, referent, _options || null),
                secondaryText: Tools.simpleItemFormatter(_itemRow.secondaryText, referent, _options || null, ' '),
                metadata: (metadataText || metadataLabel) ? `${metadataText}<span class="me-2">&nbsp;</span>${metadataLabel}` : '',
                secondaryMetadata: Tools.simpleItemFormatter(_itemRow.secondaryMetadata, referent, _options || null, ' '),
                editMode: false,
                enableCollapse: true,
                source: { ...referent }
              };
              return element;
            });
            this.adesionereferenti = (url) ? [...this.adesionereferenti, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
          this._spin = false;
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          this._preventMultiCall = false;
          // Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _generateReferentFields(data: any) {
    return Tools.generateFields(this.referentiConfig.details, data).map((field: FieldClass) => {
      field.label = this.translate.instant(field.label);
      return field;
    });
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadAdesioneReferenti(null, this._links.next.href);
    }
  }

  _onNew() {
    if (this._useDialog) {
      this._addReferente();
    } else {
      this._editCurrent = null;
      this._isEdit = true;
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useDialog) {

    } else {
      this._editCurrent = param;
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
    this._loadAdesioneReferenti(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadAdesioneReferenti(this._filterData);
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

  _addReferente() {
    this.loadAnagrafiche();
    this._initReferentiSelect([]);
    this._initEditForm();

    this._modalEditRef = this.modalService.show(this.editTemplate, {
      ignoreBackdropClick: false,
      // class: 'modal-half'
    });
  }

  saveModal(body: any){
    this.apiService.postElementRelated(this.model, this.id, 'referenti', body).subscribe(
      (response: any) => {
        this._modalEditRef.hide();
        this._loadAdesioneReferenti();
      },
      (error: any) => {
        console.log('error', error);
      }
    );
  }

  closeModal(){
    this._modalEditRef.hide();
  }

  _deleteReferente(data: any) {
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
          this.apiService.deleteElementRelated(this.model, this.id, `referenti/${data.source.utente.id_utente}?tipo_referente=${data.source.tipo}`).subscribe(
            (response) => {
              this._loadAdesioneReferenti();
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

  _hasControlError(name: string) {
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  trackByFn(item: any) {
    return item.id;
  }

  _initReferentiSelect(defaultValue: any[] = []) {
    this.referenti$ = concat(
      of(defaultValue),
      this.referentiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.referentiLoading = true),
        switchMap((term: any) => {
          // return this.utilService.getUtenti(term, this.referentiFilter).pipe(
          let aux: any = null;
          this.referentiTipo == 'referente' ? aux = this.adesione.soggetto.organizzazione.id_organizzazione : aux = null;
          return this.utilService.getUtenti(term, this.referentiFilter, 'abilitato', aux).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.referentiLoading = false)
          )
        })
      )
    );
  }

  _onChangeTipoReferente(isReferent: boolean) {
    this.referentiFilter = isReferent ? 'referente_servizio,gestore' : '';
  }

  loadAnagrafiche() {
    this.anagrafiche['tipo-referente'] = [
      { nome: 'referente', filter: '' },
      { nome: 'referente_tecnico', filter: '' }
    ];
  }

  onChangeTipo(event: any) {
    this.referentiFilter = event?.filter || null;
    this.referentiTipo = event?.nome || null;
    this._editFormGroup.controls.id_utente.enable();
    this._initReferentiSelect([])
    this._editFormGroup.controls.id_utente.patchValue(null);
  }

  _canAddMapper = (): boolean => {
    const _cnm = this.authenticationService._getClassesNotModifiable('adesione', 'adesione', this.adesione?.stato);
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
      return _can && this._hasActions();
    }
    return this._hasActions();
  }

  _hasActions() {
    const _grant: any = this._grant || [];
    if (this.authenticationService.isGestore(_grant)) { return true; }
    if (this.adesione) {
      const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus('adesione', this.adesione.stato, 'stato_successivo', _grant);
      return _statoSuccessivo;
    }
    return false;
  }
}
