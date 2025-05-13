import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { SearchGoogleFormComponent } from '@linkit/components';

import { Page } from '../../models/page';

@Component({
  selector: 'app-organizzazioni',
  templateUrl: 'organizzazioni.component.html',
  styleUrls: ['organizzazioni.component.scss'],
  standalone: false

})
export class OrganizzazioniComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'OrganizzazioniComponent';
  readonly model: string = 'organizzazioni';

  @ViewChild('searchGoogleForm') searchGoogleForm!: SearchGoogleFormComponent;

  config: any;
  organizzazioniConfig: any;

  organizzazioni: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _isEdit: boolean = false;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';

  _error: boolean = false;

  showHistory: boolean = false;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'nome';
  sortDirection: string = 'asc';
  sortFields: any[] = [
    { field: 'nome', label: 'APP.LABEL.nome', icon: '' }
  ];

  yesNoList: any = [
    { value: true, label: 'APP.BOOLEAN.Yes' },
    { value: false, label: 'APP.BOOLEAN.No' }
  ];
  _enabledEnum: any = {};
  _tempEnable = this.yesNoList.map((item: any) => {
    this._enabledEnum =  { ...this._enabledEnum, [item.value]: item.label};
    return item;
  });

  simpleSearch: boolean = true;
  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.nome', type: 'string', condition: 'like' },
    { field: 'referente', label: 'APP.LABEL.referente', type: 'enum', condition: 'equal', enumValues: this._enabledEnum },
    { field: 'aderente', label: 'APP.LABEL.aderente', type: 'enum', condition: 'equal', enumValues: this._enabledEnum },
    { field: 'esterna', label: 'APP.LABEL.esterna', type: 'enum', condition: 'equal', enumValues: this._enabledEnum },
    // { field: 'soggetto_aderente', label: 'APP.LABEL.soggetto_aderente', type: 'enum', condition: 'equal', enumValues: this._enabledEnum },
  ];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Organizations', url: '', type: 'title', icon: '' }
  ];

  _useNewSearchUI : boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    private utils: UtilService
  ) {
    this.config = this.configService.getConfiguration();
    this._useNewSearchUI = true; // this.config.AppConfig.Search.newLayout || false;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.organizzazioniConfig = config;
        this._translateConfig();
        this._loadOrganizzazioni();
      }
    );
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _translateConfig() {
    if (this.organizzazioniConfig && this.organizzazioniConfig.options) {
      Object.keys(this.organizzazioniConfig.options).forEach((key: string) => {
        if (this.organizzazioniConfig.options[key].label) {
          this.organizzazioniConfig.options[key].label = this.translate.instant(this.organizzazioniConfig.options[key].label);
        }
        if (this.organizzazioniConfig.options[key].values) {
          Object.keys(this.organizzazioniConfig.options[key].values).forEach((key2: string) => {
            this.organizzazioniConfig.options[key].values[key2].label = this.translate.instant(this.organizzazioniConfig.options[key].values[key2].label);
          });
        }
      });
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
      q: new UntypedFormControl(''),
      referente: new UntypedFormControl(''),
      aderente: new UntypedFormControl(''),
      esterna: new UntypedFormControl(''),
      // soggetto_aderente: new UntypedFormControl('')
    });
  }

  _loadOrganizzazioni(query: any = null, url: string = '') {
    let aux: any;
    this._setErrorMessages(false);

    if (!url) { 
      this.organizzazioni = [];
      const sort: any = { sort: `${this.sortField},${this.sortDirection}` }
      query = { ...query, ...sort };
      aux = { params: this.utils._queryToHttpParams(query) };
    }

    this._spin = true;
    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {

        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response.content) {
          const _list: any = response.content.map((org: any) => {
            const element = {
              id: org.id_organizzazione,
              editMode: false,
              enableCollapse: false,
              source: { ...org }
            };
            return element;
          });

          this.organizzazioni = (url) ? [...this.organizzazioni, ..._list] : [..._list];
          this._preventMultiCall = false;

          this._spin = false;
        }
        Tools.ScrollTo(0);
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
        this._spin = false;
        // Tools.OnError(error);
      }
    });
  }

  _trackBy(index: any, item: any) {
    return item.id;
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadOrganizzazioni(null, this._links.next.href);
    }
  }

  _onEdit(event: any, param: any) {
    this.router.navigate([this.model, param.id]);
  }

  _onNew() {
    this.router.navigate([this.model, 'new']);
  }

  _onCloseEdit() {
    this._isEdit = false;
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  _onSubmit(form: any) {
    if (this.searchGoogleForm) {
      this.searchGoogleForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadOrganizzazioni(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadOrganizzazioni(this._filterData);
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadOrganizzazioni(this._filterData);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _sortToHttpParams(sort: any) : HttpParams {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('sort', `${sort.sortField}` + ',' + `${sort.sortBy}`);
    return httpParams; 
  }
}
