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
import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { SearchBarFormComponent } from '@linkit/components';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import { NavigationService } from '@app/services/navigation.service';
import { Page} from '../../models/page';

import * as moment from 'moment';

@Component({
  selector: 'app-soggetti',
  templateUrl: 'soggetti.component.html',
  styleUrls: ['soggetti.component.scss'],
  standalone: false
})
export class SoggettiComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'SoggettiComponent';
  readonly model: string = 'soggetti';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  Tools = Tools;

  config: any;
  soggettiConfig: any;

  soggetti: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;

  showHistory: boolean = false;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'nome';
  sortDirection: string = 'asc';
  sortFields: any[] = [
    { field: 'nome', label: 'APP.LABEL.Name', icon: '' }
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

  simpleSearch: boolean = false;
  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    // { field: 'id_organizzazione', label: 'APP.SOGGETTI.LABEL.Organization', type: 'text', condition: 'equal', callBack: (param: any): string => { return this._getOrganizzazioneSelectedName(param); } }
    { field: 'id_organizzazione', label: 'APP.SOGGETTI.LABEL.Organization', type: 'text', condition: 'equal', params: { resource: 'organizzazioni', field: 'nome' } },
    { field: 'referente', label: 'APP.LABEL.referente', type: 'enum', condition: 'equal', enumValues: this._enabledEnum },
    { field: 'aderente', label: 'APP.LABEL.aderente', type: 'enum', condition: 'equal', enumValues: this._enabledEnum }
  ];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Subjects', url: '', type: 'title', icon: '' }
  ];


  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;

  _searchOrganizzazioneSelected: any = null;

  minLengthTerm = 1;

  _useNewSearchUI : boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    private utils: UtilService,
    private navigationService: NavigationService
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
        this.soggettiConfig = config;
        this._initOrganizzazioniSelect([]);
        // this._loadSoggetti(this._filterData);
      }
    );
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
      setTimeout(() => {
        this._loadSoggetti();
      }, 100);
    }
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
      q: new UntypedFormControl(''),
      id_organizzazione: new UntypedFormControl(''),
      referente: new UntypedFormControl(''),
      aderente: new UntypedFormControl(''),
    });
  }

  _loadSoggetti(query: any = null, url: string = '') {
    this._spin = true;

    let aux:any = null;
    this._setErrorMessages(false);

    if (!url) { 
      this.soggetti = [];
      const sort: any = { sort: `${this.sortField},${this.sortDirection}` }
      query = { ...query, ...sort };
      aux = { params: this.utils._queryToHttpParams(query) };
    }

    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {
        
        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response.content) {
          const _list: any = response.content.map((soggetto: any) => {
            const element = {
              id: soggetto.id,
              editMode: false,
              source: { ...soggetto },
            };
            return element;
          });
          this.soggetti = (url) ? [...this.soggetti, ..._list] : [..._list];
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

  _trackBy(index: any, item: any) {
    return item.id;
  }

  _onNew() {
    if (this._useRoute) {
      this.router.navigate([this.model, 'new']);
    } else {
      this._isEdit = true;
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useRoute) {
      if (this.searchBarForm) {
        this.searchBarForm._pinLastSearch();
      }
      // Supporto per apertura in nuova scheda (Ctrl+Click, Cmd+Click, middle-click)
      const mouseEvent = this.navigationService.extractEvent(event);
      const data = this.navigationService.extractData(param) || param;
      const route = [this.model, data.source.id_soggetto];
      this.navigationService.navigateWithEvent(mouseEvent, route);
    } else {
      this._isEdit = true;
      this._editCurrent = param;
    }
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
    this._loadSoggetti(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadSoggetti(this._filterData);
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadSoggetti(this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  onChangeSearchDropdwon(event: any){
    this._searchOrganizzazioneSelected = event;
    setTimeout(() => {
      this.searchBarForm.setNotCloseForm(false)
    }, 200);
  }

  onSelectedSearchDropdwon($event: Event){
    this.searchBarForm.setNotCloseForm(true)
    $event.stopPropagation();
  }

  _initOrganizzazioniSelect(defaultValue: any[] = []) {
    this.organizzazioni$ = concat(
      of(defaultValue),
      this.organizzazioniInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.organizzazioniLoading = true),
        switchMap((term: any) => {
          return this.getOrganizzazioni(term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.organizzazioniLoading = false)
          )
        })
      )
    );
  }

  getOrganizzazioni(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
    return this.apiService.getList('organizzazioni', _options)
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

  trackBySelectFn(item: any) {
    return item.id_client || item.id_servizio;
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadSoggetti(null, this._links.next.href);
    }
  }
}
