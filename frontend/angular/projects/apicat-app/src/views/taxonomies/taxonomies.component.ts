import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { SearchGoogleFormComponent } from 'projects/components/src/lib/ui/search-google-form/search-google-form.component';

import { Page} from '../../models/page';

@Component({
  selector: 'app-taxonomies',
  templateUrl: 'taxonomies.component.html',
  styleUrls: ['taxonomies.component.scss']
})
export class TaxonomiesComponent implements OnInit, OnDestroy {
  static readonly Name = 'TaxonomiesComponent';
  readonly model: string = 'tassonomie';

  @ViewChild('searchGoogleForm') searchGoogleForm!: SearchGoogleFormComponent;

  config: any;
  taxonomiesConfig: any;

  taxonomies: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;

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

  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    { field: 'nome', label: 'APP.LABEL.nome', type: 'string', condition: 'like' }
  ];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Taxonomies', url: '', type: 'title', icon: '' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    private utils: UtilService
  ) {
    this.config = this.configService.getConfiguration();

    this._initSearchForm();
  }

  ngOnInit() {
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.taxonomiesConfig = config;
        // this._loadTaxonomies(this._filterData);
      }
    );
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchGoogleForm && this.searchGoogleForm._isPinned())) {
      setTimeout(() => {
        this.refresh();
      }, 100);
    }
  }

  refresh() {
    this._loadTaxonomies(this._filterData);
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
      nome: new UntypedFormControl('')
    });
  }

  _loadTaxonomies(query: any = null, url: string = '') {
    this._spin = true;
    let aux: any;
    this._setErrorMessages(false);
    
    if (!url) { 
      this.taxonomies = [];
      const sort: any = { sort: `${this.sortField},${this.sortDirection}` }
      query = { ...query, ...sort };
      aux = { params: this.utils._queryToHttpParams(query) };
    }

    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {

        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response.content) {
          const _list: any = response.content.map((tax: any) => {
            
            const element = {
              id: tax.id_tassonomia,
              editMode: false,
              enableCollapse: false,
              source: { ...tax }
            };
            return element;
          });

          this.taxonomies = (url) ? [...this.taxonomies, ..._list] : [..._list];
          this._preventMultiCall = false;

          this._spin = false;
        }
        Tools.ScrollTo(0);
        
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
        this._spin = false;
        Tools.OnError(error);
      }
    });
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadTaxonomies(null, this._links.next.href);
    }
  }

  _onEdit(event: any, param: any) {
    if (this.searchGoogleForm) {
      this.searchGoogleForm._pinLastSearch();
    }
    this.router.navigate([this.model, param.id]);
  }

  _onNew() {
    this.router.navigate([this.model, 'new']);
  }

  _onSubmit(form: any) {
    if (this.searchGoogleForm) {
      this.searchGoogleForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    if (Object.keys(this._filterData).some(x => (x !== null && x !== ''))) {
      this._loadTaxonomies(this._filterData);
    }
  }

  _resetForm() {
    this._filterData = [];
    this._loadTaxonomies(this._filterData);
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadTaxonomies(event);
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

  onChangeSearchDropdwon(event: any){
    setTimeout(() => {
      this.searchGoogleForm.setNotCloseForm(false)
    }, 200);
  }

  onSelectedSearchDropdwon($event: Event){
    this.searchGoogleForm.setNotCloseForm(true)
    $event.stopPropagation();
  }

  trackBySelectFn(item: any) {
    return item.id_client || item.id_servizio;
  }
}
