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
import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { COMPONENTS_IMPORTS, ConfigService, Tools, EventsManagerService, SearchBarFormComponent, FieldClass, YesnoDialogBsComponent } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService, RUOLI_ORG_REFERENTE } from '@app/services/utils.service';

import { Page } from '@app/models/page';

import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dominio-referenti',
  templateUrl: 'dominio-referenti.component.html',
  styleUrls: ['dominio-referenti.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ...COMPONENTS_IMPORTS
  ]
})
export class DominioReferentiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'DominioReferentiComponent';
  readonly model: string = 'domini';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  id: number = 0;

  Tools = Tools;

  config: any;
  referentiConfig: any;

  dominio: any = null;
  dominioreferenti: any[] = [];
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

  /** True quando i referenti del dominio sono aperti nel contesto
      della pagina `organizzazione-manage` (route
      `/organizzazione-manage/:id/domini/:idDominio/referenti`).
      In tal caso il breadcrumb di ritorno punta a org-manage. */
  _fromOrgManage: boolean = false;
  _orgManageId: string | null = null;

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

  _isDominioEsterno: boolean = false;
  _idDominioEsterno: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
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
    // Contesto org-manage: la route e`
    // `/organizzazione-manage/:id/domini/:idDominio/referenti` con
    // param dominio `idDominio` (anziche` `id` come nella route
    // standard `/domini/:id/referenti`). Rilevato via URL.
    const url = this.router.url || '';
    this._fromOrgManage = url.includes('/organizzazione-manage/');
    if (this._fromOrgManage) {
      const m = url.match(/\/organizzazione-manage\/([^\/]+)/);
      this._orgManageId = m ? m[1] : null;
    }

    this.route.params.subscribe(params => {
      const dominioId = params['idDominio'] || params['id'];
      if (dominioId && dominioId !== 'new') {
        this.id = dominioId;
        this.configService.getConfig('referenti').subscribe(
          (config: any) => {
            this.referentiConfig = config;
            this._loadDominio();
            this._loadDominioReferenti();
          }
        );
      } else {

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
    const _title = this.dominio ? `${this.dominio.nome}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    if (this._fromOrgManage && this._orgManageId) {
      // Breadcrumb in contesto org-manage: torna alla pagina
      // organizzazione-manage (tab "domini") e alla card del dominio.
      this.breadcrumbs = [
        { label: '', url: '', type: 'title', iconBs: 'gear' },
        { label: 'APP.MENU.Organizations', url: `/organizzazioni`, type: 'link' },
        { label: 'APP.LABEL.Domain', url: `/organizzazione-manage/${this._orgManageId}?tab=domini`, type: 'link' },
        { label: `${_title}`, url: `/organizzazione-manage/${this._orgManageId}/domini/${this.id}`, type: 'link' },
        { label: 'APP.TITLE.ServiceReferents', url: ``, type: 'link' }
      ];
      return;
    }
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.LABEL.Domain', url: `/${this.model}`, type: 'link' },
      { label: `${_title}`, url: `/${this.model}/${this.id}`, type: 'link' },
      { label: 'APP.TITLE.ServiceReferents', url: ``, type: 'link' }
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
      organizationTaxCode: new UntypedFormControl(''),
      creationDateFrom: new UntypedFormControl(''),
      creationDateTo: new UntypedFormControl(''),
      fileName: new UntypedFormControl(''),
      status: new UntypedFormControl(''),
      type: new UntypedFormControl(''),
    });
  }

  _loadDominio() {
    if (this.id) {
      this._spin = true;
      this.dominio = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.dominio = response;
          this._isDominioEsterno = this.dominio?.soggetto_referente?.organizzazione?.intermediata || false;
          this._idDominioEsterno = this.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
          this._initBreadcrumb();
          this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _loadDominioReferenti(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      
      this._spin = true;

      if (!url) { this.dominioreferenti = []; this._links = null; }
      this.apiService.getDetails(this.model, this.id, 'referenti').subscribe({
        next: (response: any) => {
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
            this.dominioreferenti = (url) ? [...this.dominioreferenti, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
          this._spin = false;
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          this._preventMultiCall = false;
          Tools.OnError(error);
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
      this._loadDominioReferenti(null, this._links.next.href);
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
    this._loadDominioReferenti(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadDominioReferenti(this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  _onSort(event: any) {
    console.log(event);
  }

  onBreadcrumb(event: any) {
    // Allineato a dominio-details: gli URL del breadcrumb in
    // contesto org-manage contengono query param (es. `?tab=domini`)
    // che `router.navigate([url])` non parserizza; usare
    // `navigateByUrl` nativo.
    const url: string = event?.url || '';
    if (url.includes('?')) {
      this.router.navigateByUrl(url);
    } else {
      this.router.navigate([url]);
    }
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
        this._loadDominioReferenti();
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
          this.apiService.deleteElementRelated(this.model, this.id, `referenti/${data.source.utente.id_utente}?tipo_referente=${data.source.tipo}`)
            .subscribe({
              next: (response) => {
                this._loadDominioReferenti();
              },
              error: (error) => {
                this._error = true;
                const _message = this.translate.instant('APP.MESSAGE.ERROR.NoDeleteReferent');
                Tools.showMessage(_message, 'danger', true);
              }
            }
          );
        }
      }
    );
  }

  _hasControlError(name: string) {
    return !!(this.f[name] && this.f[name].errors && this.f[name].touched);
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
          // Issue #284: org del dominio sempre valorizzata e filtro per
          // ruolo_organizzazione (amm.org/operatore API). Niente piu` filtro
          // referente_tecnico.
          const aux: any = this._idDominioEsterno;
          return this.utilService.getUtenti(term, null, 'abilitato', aux, RUOLI_ORG_REFERENTE).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.referentiLoading = false)
          )
        })
      )
    );
  }

  loadAnagrafiche() {
    this.anagrafiche['tipo-referente'] = [
      { nome: 'referente', filter: 'utente_organizzazione,gestore,coordinatore' },
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
}
