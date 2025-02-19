import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { SearchBarFormComponent } from 'projects/components/src/lib/ui/search-bar-form/search-bar-form.component';

import { Page} from '../../models/page';

@Component({
  selector: 'app-classi-utente',
  templateUrl: 'classi-utente.component.html',
  styleUrls: ['classi-utente.component.scss']
})
export class ClassiUtenteComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ClassiUtenteComponent';
  readonly model: string = 'classi-utente';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  config: any;
  classiUtenteConfig: any;

  classiUtente: any[] = [];
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

  simpleSearch: boolean = true;
  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.nome', type: 'string', condition: 'like' }
  ];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.UserClasses', url: '', type: 'title', icon: '' }
  ];

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

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.classiUtenteConfig = config;
        this._loadClassiUtente();
      }
    );
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
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
      q: new UntypedFormControl('')
    });
  }

  _loadClassiUtente(query: any = null, url: string = '') {
    let aux: any;
    this._setErrorMessages(false);

    if (!url) { 
      this.classiUtente = [];
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
          const _list: any = response.content.map((item: any) => {
            
            const element = {
              id: item.id_classe_utente,
              editMode: false,
              enableCollapse: false,
              source: { ...item }
            };
            return element;
          });

          this.classiUtente = (url) ? [...this.classiUtente, ..._list] : [..._list];
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
      this._loadClassiUtente(null, this._links.next.href);
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

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    if (Object.keys(this._filterData).some(x => (x !== null && x !== ''))) {
      this._loadClassiUtente(this._filterData);
    }
  }

  _resetForm() {
    this._filterData = [];
    this._loadClassiUtente(this._filterData);
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadClassiUtente(event);
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
