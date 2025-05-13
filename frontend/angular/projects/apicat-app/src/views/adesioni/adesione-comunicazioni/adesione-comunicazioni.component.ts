import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { SearchBarFormComponent } from '@linkit/components';
import { SenderComponent } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';
import { AuthenticationService } from '@services/authentication.service';

import { Page } from '@app/models/page';
import { Messaggio } from './messaggio';

declare const saveAs: any;
import * as moment from 'moment';
import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';

@Component({
  selector: 'app-adesione-comunicazioni',
  templateUrl: 'adesione-comunicazioni.component.html',
  styleUrls: ['adesione-comunicazioni.component.scss'],
  standalone: false

})
export class AdesioneComunicazioniComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'AdesioneComunicazioniComponent';
  readonly model: string = 'adesioni';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('sender') sender!: SenderComponent;

  id: number = 0;

  Tools = Tools;

  config: any;
  communicationsConfig: any;

  adesione: any = null;
  adesioneCommunications: any[] = [];
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
  _spinSend: boolean = false;

  _useRoute : boolean = false;
  _useDialog : boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;
  showSender: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' },
    { label: '...', url: '', type: 'title' },
    { label: 'APP.TITLE.ServiceCommunications', url: '', type: 'title' }
  ];

  _form: any;
  
  mDateGroup: any = moment();

  _showAllegatoBoxed: boolean = true;

  _updateMapper: string = '';

  _notification: any = null;
  _notificationId: string = '';
  _notificationMessageId: string = '';

  _serviceBreadcrumbs: ServiceBreadcrumbsData|null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public authenticationService: AuthenticationService,
  ) {
    this.route.data.subscribe((data) => {
      if(!data.serviceBreadcrumbs)return;
      this._serviceBreadcrumbs = data.serviceBreadcrumbs;
      this._initBreadcrumb();
    });

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
        this.configService.getConfig('communications').subscribe(
          (config: any) => {
            this.communicationsConfig = config;
            this._loadAdesione();
            this._loadAdesioneComunicazioni();
          }
        );
      }
    });

    this.route.queryParams.subscribe((val) => { 
      this._notification = null;
      this._notificationId = '';
      this._notificationMessageId = '';
      if (val.notificationId && val.messageid) {
        this._notificationId = val.notificationId;
        this._notificationMessageId = val.messageid;
        setTimeout(() => {
          this.scrollToTop(this._notificationMessageId);
          this._highlightElem(this._notificationMessageId)
        }, 900);
      }
      if (val.notification) {
        const _notification = JSON.parse(decodeURI(atob(val.notification)));
        this._notification = _notification;
        this._notificationId = this._notification.id_notifica;
        this._notificationMessageId = this._notification.entita.id_entita;
        setTimeout(() => {
          this.scrollToTop(this._notificationMessageId);
          this._highlightElem(this._notificationMessageId)
        }, 900);
      }
    })
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _organizzazione: string = this.adesione ? this.adesione.soggetto.organizzazione.nome : null;
    const _servizio: string = this.adesione?.servizio?.nome;
    const _versione: string = this.adesione?.servizio?.versione;
    const _view = (localStorage.getItem('ADESIONI_VIEW') === 'TRUE') ? '/view' : '';

    let title = this.adesione ? `${_organizzazione} - ${_servizio} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    let baseUrl = `/${this.model}`;

    if (this._serviceBreadcrumbs) {
      title = _organizzazione;
      baseUrl = `/servizi/${this._serviceBreadcrumbs.service.id_servizio}/${this.model}`;
    }

    this.breadcrumbs = [
      { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
      { label: title, url: `${baseUrl}/${this.adesione?.id_adesione}${_view}`, type: 'link' },
      { label: 'APP.TITLE.ServiceCommunications', url: ``, type: 'link' }
    ];

    if(this._serviceBreadcrumbs){
      this.breadcrumbs.unshift(...this._serviceBreadcrumbs.breadcrumbs);
    }
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
    });
  }

  _loadAdesione() {
    if (this.id) {
      this.adesione = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.adesione = response;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadAdesioneComunicazioni(query: any = null, url: string = '') {
    this._setErrorCommunications(false);
    if (this.id) {
      this._spin = true;
      if (!url) { this.adesioneCommunications = []; }
      this.apiService.getDetails(this.model, this.id, 'comunicazioni').subscribe({
        next: (response: any) => {

          response ? this._paging = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            response.content.sort(Tools.SortBy(['data'], false, true));
            let _list: any = response.content.map((communication: any) => {
              const _mDate: any = moment(communication.data);
              const element = {
                source: { ...communication },
                id: communication.uuid,
                mDate: _mDate,
                gDate: this.mapGDateMessageVisible(_mDate, this.mDateGroup),
                date: _mDate.format('DD/MM/YYYY'),
                time: _mDate.format('HH:mm:ss'),
                mittente: typeof(communication.autore) === 'string'?(communication.autore || ''):(communication.autore?`${communication.autore.nome} ${communication.autore.cognome}`:'Anonimo'),
              };
              if (this.mDateGroup !== moment(communication.data)) {
                this.mDateGroup = moment(communication.data);
              }
              return element;
            });
            this.adesioneCommunications = (url) ? [...this.adesioneCommunications, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          this._spin = false;
          Tools.ScrollTo(0);
        },
        error: (error: any) => {
          this._setErrorCommunications(true);
          this._spin = false;
          // Tools.OnError(error);
        }
      });
    }
  }

  mapGDateMessageVisible(mDate: any, mDateGroup: any): boolean {
    const visible: boolean = (mDateGroup.format('DDMMYYYY') !== mDate.format('DDMMYYYY') && mDate.format('DDMMYYYY') !== moment().format('DDMMYYYY'));
    return visible;
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
        this._preventMultiCall = true;
        this._loadAdesioneComunicazioni(null, this._links.next.href);
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
    this._loadAdesioneComunicazioni(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadAdesioneComunicazioni(this._filterData);
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

  _isMime(message: any) {
    const _userId = this.authenticationService.getUser().id_utente;
    return (message.autore.id_utente === _userId);
  }

  _onSubmitMessage(event: any) {
    this._spinSend = true;
    this._form = { ...event.form };
    const props: Messaggio = new Messaggio();
    // new Message
    props.oggetto = `Adesione ${this.adesione.nome}`;
    props.testo = this._form.messaggio;
    const _allegati: any[] = []
    if (this._form.allegati) {
      this._form.allegati.map((item: any) => {
        _allegati.push({
          filename: item.file,
          estensione: item.type,
          content: item.data
        });
      });
    }
    props.allegati = _allegati;

    this.apiService.postElementRelated(this.model, this.id, 'messaggi', props).subscribe(
      (response: any) => {
        this._spinSend = false;
        this._loadAdesioneComunicazioni();
      },
      (error: any) => {
        Tools.OnError(error);
        this._spinSend = false;
      }
    );
  }

  __onDownload(message: any, attachment: any) {
    const _partial = `messaggi/${message.uuid}/allegati/${attachment.uuid}/download`;
    this.apiService.download(this.model, this.id, _partial).subscribe({
      next: (response: any) => {
        // const _ext = attachment.estensione.split('/')[1];
        let name: string = `${attachment.filename}`;
        saveAs(response.body, name);
      },
      error: (error: any) => {
        this._error = true;
        Tools.OnError(error);
      }
    });
  }

  _toggleSender() {
    this.showSender = !this.showSender;
  }

  _onCloseNotificationBar(event: any) {
    this.router.navigate(['adesioni', this.id, 'comunicazioni']);
  }

  __mapDateGroup(el: any): string {
    return (el.mDate.format('DDMMYYYY') !== moment().add(-1, 'days').format('DDMMYYYY')?el.date:'Ieri');
  }

  _highlightElem(id: string) {
    const targetElm = document.getElementById(id);
    if (targetElm) {
      this.renderer.addClass(targetElm, "highlight");
      setTimeout(() => {
        this.renderer.removeClass(targetElm, "highlight");
      }, 2000);
    }
  }

  scrollToTop(id: string) {
    setTimeout(() => {
      const scroller = document.getElementById('container-scroller');
      const div = document.getElementById(id);
      if (div && scroller) {
        scroller.scrollTo({
          top: div.offsetTop - scroller.offsetTop,
          behavior: 'smooth'
        });
      }
    }, 200);
  }
}
