import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { SearchBarFormComponent } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { FieldClass } from '@linkit/components';

import { YesnoDialogBsComponent } from '@linkit/components';

import { Page } from '@app/models/page';

import { concat, Observable, of, Subject, forkJoin } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-client-adesioni',
  templateUrl: 'client-adesioni.component.html',
  styleUrls: ['client-adesioni.component.scss'],
  standalone: false
})
export class ClientAdesioniComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ClientAdesioniComponent';
  readonly model: string = 'client';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: number = 0;

  Tools = Tools;

  config: any;
  adesioniConfig: any;

  client: any = null;
  clientadesioni: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

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

  breadcrumbs: any[] = [];

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

  _selectedAdesione: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public utilService: UtilService
  ) {
    this.config = this.configService.getConfiguration();

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];

        const _configAux: Observable<any> = this.configService.getConfig('adesioni')
        const _loadClientAux: Observable<any> = this.apiService.getDetails(this.model, this.id)
        const _options: any = { params: { id_client: this.id } };
        const _loadClientAdesioniAux: Observable<any> = this.apiService.getList('adesioni', _options);
        
        this._spin = true;
        const combined = forkJoin([_configAux, _loadClientAux, _loadClientAdesioniAux]);
        combined.subscribe(result => {
          this.adesioniConfig = result[0];
          this.client = result[1];
          this._prepareListAdesioni(result[2])
          this._initBreadcrumb();
          this._spin = false;
        });
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
    const _title:string = this.client.nome;
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.Client', url: '/client', type: 'link' },
      { label: `${_title}`, url: `/${this.model}/${this.id}`, type: 'link' },
      { label: 'APP.TITLE.Adesioni', url: ``, type: 'link' }
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

  _loadClient() {
    if (this.id) {
      this.client = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.client = response;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadClientAdesioni(query: any = null, url: string = '') {
    this._spin = true;
    this._setErrorMessages(false);

    if (this.id) {
      
      if (!url) { this.clientadesioni = []; }
      const _options: any = { params: { id_client: this.id } };
      this.apiService.getList('adesioni', _options).subscribe({
        next: (response: any) => {

          this._prepareListAdesioni(response);

          this._initBreadcrumb();
          this._spin = false;
        },
        error: (error: any) => {
          // this._setErrorMessages(true);
          this._preventMultiCall = false;
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadClientAdesioni(null, this._links.next.href);
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
    this._loadClientAdesioni(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadClientAdesioni(this._filterData);
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
    // this._initReferentiSelect([]);
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
        this._loadClientAdesioni();
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
              this._loadClientAdesioni();
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

  loadAnagrafiche() {
    this.anagrafiche['tipo-referente'] = [
      { nome: 'referente', filter: '' },
      { nome: 'referente_tecnico', filter: '' }
    ];
  }

  _infoRichiedente(index: any) {
    const _modalConfig: any = {
      ignoreBackdropClick: false,
      class: 'modal-half'
    };
    this._selectedAdesione = this.clientadesioni[index].source;
    this._modalEditRef = this.modalService.show(this.editTemplate, _modalConfig);
  }



  _prepareListAdesioni(data: any) {
    console.log('response: ', data)

    this.clientadesioni = [];

    data ? this._paging = new Page(data.page) : null;
    data ? this._links = data._links || null : null;

    if (data && data.content) {
      const _itemRow = this.adesioniConfig.itemRow;
      const _options = this.adesioniConfig.options;
      const _list: any = data.content.map((referent: any, index: number) => {
        // this.apiService.getDetails('organizzazioni', referent.soggetto.organizzazione.id_organizzazione).subscribe(
        //     (res) => {console.log('***', res)},
        //     (err) => console.log(err)
        //   )
        const metadataText = Tools.simpleItemFormatter(_itemRow.metadata.text, referent, _options || null);
        const metadataLabel = Tools.simpleItemFormatter(_itemRow.metadata.label, referent, _options || null);
        const element = {
          id: referent.id_adesione,
          primaryText: Tools.simpleItemFormatter(_itemRow.primaryText, referent, _options || null),
          secondaryText: Tools.simpleItemFormatter(_itemRow.secondaryText, referent, _options || null, ' '),
          metadata: (metadataText || metadataLabel) ? `${metadataText}<span class="me-2">&nbsp;</span>${metadataLabel}` : '',
          secondaryMetadata: Tools.simpleItemFormatter(_itemRow.secondaryMetadata, referent, _options || null, ' '),
          editMode: false,
          enableCollapse: true,
          source: { ...referent },
        };
        return element;
      });
      this.clientadesioni = [..._list];
      this._preventMultiCall = false;
    }
  }

  // onChangeTipo(event: any) {
  //   this.referentiFilter = event?.filter || null;
  //   this.referentiTipo = event?.nome || null;
  //   this._editFormGroup.controls.id_utente.enable();
  //   this._initReferentiSelect([])
  //   this._editFormGroup.controls.id_utente.patchValue(null);
  // }
}
