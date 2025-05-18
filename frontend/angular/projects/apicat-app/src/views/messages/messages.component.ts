import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { Page } from '../../models/page';

import { SearchBarFormComponent } from '@linkit/components';

@Component({
  selector: 'app-messages',
  templateUrl: 'messages.component.html',
  styleUrls: ['messages.component.scss'],
  standalone: false
})
export class MessagesComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'MessagesComponent';
  readonly model: string = 'messages';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  Tools = Tools;

  config: any;
  messagesConfig: any;

  messages: any[] = [];
  _page: Page = new Page({});
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

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [
    { field: 'creationDateFrom', label: 'APP.LABEL.Date', type: 'date', condition: 'gt', format: 'DD/MM/YYYY' },
    { field: 'creationDateTo', label: 'APP.LABEL.Date', type: 'date', condition: 'lt', format: 'DD/MM/YYYY' },
    { field: 'taxcode', label: 'APP.LABEL.Taxcode', type: 'string', condition: 'like' },
    { field: 'organization.legal_name', label: 'APP.LABEL.LegalName', type: 'string', condition: 'like' },
    { field: 'service.service_name', label: 'APP.LABEL.ServiceName', type: 'text', condition: 'like' }
  ];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Messages', url: '', type: 'title', iconBs: 'send' }
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
    this.configService.getConfig('messages').subscribe(
      (config: any) => {
        this.messagesConfig = config;
        this._translateConfig();
      }
    );
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
      setTimeout(() => {
        this._loadMessages();
      }, 100);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _translateConfig() {
    if (this.messagesConfig && this.messagesConfig.options) {
      Object.keys(this.messagesConfig.options).forEach((key: string) => {
        if (this.messagesConfig.options[key].label) {
          this.messagesConfig.options[key].label = this.translate.instant(this.messagesConfig.options[key].label);
        }
        if (this.messagesConfig.options[key].values) {
          Object.keys(this.messagesConfig.options[key].values).forEach((key2: string) => {
            this.messagesConfig.options[key].values[key2].label = this.translate.instant(this.messagesConfig.options[key].values[key2].label);
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
      creationDateFrom: new UntypedFormControl(''),
      creationDateTo: new UntypedFormControl(''),
      taxcode: new UntypedFormControl(''),
      'organization.legal_name': new UntypedFormControl(''),
      'service.service_name': new UntypedFormControl(''),
    });
  }

  _loadMessages(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    if (!url) { this.messages = []; }

    let aux: any;
    if (query)  aux = { params: this.utils._queryToHttpParams(query) };

    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {

        response ? this._page = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        if (response.items) {
          const _list: any = response.items.map((message: any) => {
            const metadataText = Tools.simpleItemFormatter(this.messagesConfig.simpleItem.metadata.text, message, this.messagesConfig.options || null);
            const metadataLabel = Tools.simpleItemFormatter(this.messagesConfig.simpleItem.metadata.label, message, this.messagesConfig.options || null);
            const element = {
              id: message.id,
              primaryText: Tools.simpleItemFormatter(this.messagesConfig.simpleItem.primaryText, message, this.messagesConfig.options || null, ' '),
              secondaryText: Tools.simpleItemFormatter(this.messagesConfig.simpleItem.secondaryText, message, this.messagesConfig.options || null, ' '),
              metadata: `${metadataText}<span class="me-2">&nbsp;</span>${metadataLabel}`,
              secondaryMetadata: Tools.simpleItemFormatter(this.messagesConfig.simpleItem.secondaryMetadata, message, this.messagesConfig.options || null, ' '),
              editMode: false,
              source: { ...message }
            };
            return element;
          });
          this.messages = (url) ? [...this.messages, ..._list] : [..._list];
          this._preventMultiCall = false;
        }
        Tools.ScrollTo(0);
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
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
      this._loadMessages(null, this._links.next.href);
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useRoute) {
      if (this.searchBarForm) {
        this.searchBarForm._pinLastSearch();
      }
      this.router.navigate(['messages', param.id]);
    } else {
      this._isEdit = true;
      this._editCurrent = param;
    }
  }

  _onCloseEdit() {
    this._isEdit = false;
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
    this._loadMessages(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadMessages(this._filterData);
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
