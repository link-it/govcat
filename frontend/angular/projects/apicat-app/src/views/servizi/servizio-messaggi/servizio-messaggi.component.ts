import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';
import { SearchBarFormComponent } from '@linkit/components'

import { Page } from '@app/models/page';

@Component({
  selector: 'app-servizio-messaggi',
  templateUrl: 'servizio-messaggi.component.html',
  styleUrls: ['servizio-messaggi.component.scss'],
  standalone: false
})
export class ServizioMessaggiComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioMessaggiComponent';
  readonly model: string = 'servizi';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  id: number = 0;

  Tools = Tools;

  config: any;
  messaggiConfig: any;

  service: any = null;
  servicecommunications: any[] = [];
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
  _useDialog : boolean = false;

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService
  ) {
    this.config = this.configService.getConfiguration();

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      // Change language
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        // this._initBreadcrumb();
        this.configService.getConfig('messaggi').subscribe(
          (config: any) => {
            this.messaggiConfig = config;
            this._translateConfig();
            this._loadServizio();
            this._loadServizioMessaggi();
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

  _translateConfig() {
    if (this.messaggiConfig && this.messaggiConfig.options) {
      Object.keys(this.messaggiConfig.options).forEach((key: string) => {
        if (this.messaggiConfig.options[key].label) {
          this.messaggiConfig.options[key].label = this.translate.instant(this.messaggiConfig.options[key].label);
        }
        if (this.messaggiConfig.options[key].values) {
          Object.keys(this.messaggiConfig.options[key].values).forEach((key2: string) => {
            this.messaggiConfig.options[key].values[key2].label = this.translate.instant(this.messaggiConfig.options[key].values[key2].label);
          });
        }
      });
    }
  }

  _initBreadcrumb() {
    this.breadcrumbs = [
      { label: 'APP.TITLE.Services', url: this.model, type: 'link', iconBs: 'grid-3x3-gap' },
      { label: `${this.id}`, url: `/${this.model}/${this.id}`, type: 'link' },
      { label: 'APP.SERVICES.TITLE.Messages', url: ``, type: 'link' }
    ];
  }

  _setErrorCommunications(error: boolean) {
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

  _loadServizio() {
    if (this.id) {
      this.service = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.service = response;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadServizioMessaggi(query: any = null, url: string = '') {
    this._setErrorCommunications(false);
    if (this.id) {
      if (!url) { this.servicecommunications = []; }
      this.apiService.getDetails(this.model, this.id, 'messaggi').subscribe({
        next: (response: any) => {

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _list: any = response.content.map((communication: any) => {
              const metadataText = Tools.simpleItemFormatter(this.messaggiConfig.simpleItem.metadata.text, communication, this.messaggiConfig.options || null);
              const metadataLabel = Tools.simpleItemFormatter(this.messaggiConfig.simpleItem.metadata.label, communication, this.messaggiConfig.options || null);
              const element = {
                id: communication.id,
                primaryText: Tools.simpleItemFormatter(this.messaggiConfig.simpleItem.primaryText, communication, this.messaggiConfig.options || null),
                secondaryText: Tools.simpleItemFormatter(this.messaggiConfig.simpleItem.secondaryText, communication, this.messaggiConfig.options || null, ' '),
                metadata: (metadataText || metadataLabel) ?`${metadataText}<span class="me-2">&nbsp;</span>${metadataLabel}` : '',
                secondaryMetadata: Tools.simpleItemFormatter(this.messaggiConfig.simpleItem.secondaryMetadata, communication, this.messaggiConfig.options || null, ' '),
                editMode: false,
                source: { ...communication }
              };
              return element;
            });
            this.servicecommunications = (url) ? [...this.servicecommunications, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          Tools.ScrollTo(0);
        },
        error: (error: any) => {
          this._setErrorCommunications(true);
          // Tools.OnError(error);
        }
      });
    }
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioMessaggi(null, this._links.next.href);
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
    this._loadServizioMessaggi(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioMessaggi(this._filterData);
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

  onActionMonitor(event: any) {
    switch (event.action) {
      case 'backview':
        const url = `/servizi/${this.service.id_servizio}/view`;
        this.router.navigate([url]);
        break;
      default:
        break;
    }
  }
}
