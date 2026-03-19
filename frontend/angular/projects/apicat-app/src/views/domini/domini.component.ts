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
import { AfterContentChecked, AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

import { ConfigService, Tools, EventsManagerService, SearchBarFormComponent, EventType, COMPONENTS_IMPORTS } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { NavigationService } from '@app/services/navigation.service';
import { Page } from '../../models/page';

import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { NgSelectModule } from '@ng-select/ng-select';
import { AutoFillScrollDirective } from '@app/lib/directives/auto-fill-scroll.directive';
import { HasPermissionDirective } from '@app/directives/has-permission/has-permission.directive';

@Component({
  selector: 'app-domini',
  templateUrl: 'domini.component.html',
  styleUrls: ['domini.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ...COMPONENTS_IMPORTS,
    HasPermissionDirective,
    InfiniteScrollDirective,
    NgSelectModule,
    AutoFillScrollDirective
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DominiComponent implements OnInit, AfterViewInit, AfterContentChecked {
  static readonly Name = 'DominiComponent';
  readonly model: string = 'domini'; // <<==== parametro di routing per la _loadXXXXX

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  Tools = Tools;

  config: any;
  dominiConfig: any;

  domini: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = true;
  _formGroup: FormGroup = new FormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  generalConfig: any = Tools.Configurazione || null;
  _canAddDomain: boolean = false;

  _useRoute : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;

  showHistory: boolean = false;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  selectLimit: number = 20;

  _useNewSearchUI : boolean = true;

  _tipiVisibilitaServizio: {value: string, label: string}[] = [
    ...Tools.TipiVisibilitaServizio
  ];
  _tipiVisibilitaServizioEnum: any = { ...Tools.VisibilitaServizioEnum };

  simpleSearch: boolean = false;
  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    { field: 'id_soggetto', label: 'APP.LABEL.soggetto', type: 'text', condition: 'equal', params: { resource: 'soggetti', field: 'nome' } },
    { field: 'visibilita', label: 'APP.LABEL.visibilita', type: 'enum', condition: 'equal', enumValues: this._tipiVisibilitaServizioEnum },
  ];
  useCondition: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Domains', url: '', type: 'title', icon: '' }
  ];

  minLengthTerm: number = 1;

  soggetti$!: Observable<any[]>;
  soggettiInput$ = new Subject<string>();
  soggettiLoading: boolean = false;

  constructor(
    private readonly router: Router,
    private readonly configService: ConfigService,
    public tools: Tools,
    private readonly eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    private readonly utils: UtilService,
    private readonly navigationService: NavigationService
  ) {}

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.config = this.configService.getConfiguration();
    this._initSearchForm();

    this._canAddDomain = this.generalConfig?.dominio.multi_dominio || false;
    
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.dominiConfig = config;
      }
    );

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
      this.generalConfig = Tools.Configurazione || null;
      this._canAddDomain = this.generalConfig?.dominio.multi_dominio || false;
      console.log('Configurazione Remota', Tools.Configurazione);
    });
  }

  ngAfterViewInit() {
    if (!(this.searchBarForm?._isPinned())) {
      setTimeout(() => {
        this._loadDomini();
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
    this._formGroup = new FormGroup({
      q: new FormControl(''),
      id_soggetto: new FormControl(null),
      visibilita: new FormControl('')
    });

    this._initSoggettiSelect([]);
  }

  _loadDomini(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    if (!url) { this.domini = []; this._links = null; }
    
    let aux: any;
    if (query)  aux = { params: this.utils._queryToHttpParams(query) };

    this._spin = true;
    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {
        
        response ? this._paging = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response.content) {
          const _list: any = response.content.map((dominio: any) => {
  
            const element = {
              id: dominio.id_dominio,
              editMode: false,
              enableCollapse: false,
              source: { ...dominio },
            };
            return element;

          });
          this.domini = (url) ? [...this.domini, ..._list] : [..._list];
          this._preventMultiCall = false;
          this._spin = false;
        }
        Tools.ScrollTo(0);
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
        // Tools.OnError(error);
        this._spin = false;
      }
    });
  }

  _trackBy(index: any, item: any) {
    return item.id;
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadDomini(null, this._links.next.href);
    }
  }

  _initSoggettiSelect(defaultValue: any[] = []) {
    this.soggetti$ = concat(
      of(defaultValue),
      this.soggettiInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.soggettiLoading = true),
        switchMap((term: any) => {
          return this.apiService.getData('soggetti', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.soggettiLoading = false)
          )
        })
      )
    );
  }

  onSelectedSearchDropdwon($event: Event){
    this.searchBarForm.setNotCloseForm(true)
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
      const route = [this.model, data.id];
      this.navigationService.navigateWithEvent(mouseEvent, route);
    } else {
      this._isEdit = true;
      this._editCurrent = param;
    }
  }

  _onOpenInNewTab(event: any) {
    const data = this.navigationService.extractData(event);
    const route = [this.model, data.id];
    this.navigationService.openInNewTab(route);
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
      this._loadDomini(this._filterData);
    }
  }

  _resetForm() {
    this._filterData = [];
    this._loadDomini(this._filterData);
  }

  _onSort(event: any) {
    console.log(event);
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
}
