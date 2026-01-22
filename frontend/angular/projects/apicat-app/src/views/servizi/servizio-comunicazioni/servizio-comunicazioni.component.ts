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
import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { SearchBarFormComponent } from '@linkit/components';
import { SenderComponent } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';
import { AuthenticationService } from '@services/authentication.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Page } from '@app/models/page';
import { Messaggio } from './messaggio';
import { Grant } from '@app/model/grant';

declare const saveAs: any;
import * as moment from 'moment';

@Component({
  selector: 'app-servizio-comunicazioni',
  templateUrl: 'servizio-comunicazioni.component.html',
  styleUrls: ['servizio-comunicazioni.component.scss'],
  standalone: false
})
export class ServizioComunicazioniComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServizioComunicazioniComponent';
  readonly model: string = 'servizi';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('sender') sender!: SenderComponent;

  id: number = 0;

  Tools = Tools;

  config: any;
  communicationsConfig: any;

  service: any = null;
  serviceCommunications: any[] = [];
  _paging: Page = new Page({});
  _links: any = {};

  _grant: Grant | null = null;

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
  showSender: boolean = false;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.TITLE.ServiceCommunications', url: '', type: 'link' }
  ];

  _form: any;
  
  mDateGroup: any = moment();

  _showAllegatoBoxed: boolean = true;
  
  _updateMapper: string = '';
  
  _notification: any = null;
  _notificationId: string = '';
  _notificationMessageId: string = '';

  _componentBreadcrumbs: ComponentBreadcrumbsData|null = null;

  hideVersions: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    public authenticationService: AuthenticationService,
  ) {
    this.route.data.subscribe((data) => {
      if (!data.componentBreadcrumbs) return;
      this._componentBreadcrumbs = data.componentBreadcrumbs;
      this._initBreadcrumb();
    });

    this.config = this.configService.getConfiguration();
    this.hideVersions = this.config?.AppConfig?.Services?.hideVersions || false;
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;
    this._grant = _state?.grant;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let _id = params['id'];
      const _cid = params['cid'];
      if (_cid) { _id = _cid; }
      if (_id && _id !== 'new') {
        this.id = _id;
        this.configService.getConfig('communications').subscribe(
          (config: any) => {
            this.communicationsConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this.showSender = this._grant ? (this._grant.ruoli.length > 0) : false;// this.authenticationService.canAdd('servizio', this.service.stato, this._grant);
              this._loadServizioComunicazioni();    
            }
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
    const _nome: string = this.service ? this.service.nome : null;
    const _versione: string = this.service ? this.service.versione : null;
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _view = (localStorage.getItem('SERVIZI_VIEW') === 'TRUE') ? '/view' : '';
    
    let title = this.service ? (this.hideVersions ? `${_nome}` : `${_nome} v. ${_versione}`) : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    let baseUrl = `/${this.model}`;

    if (this._componentBreadcrumbs) {
      title = _nome;
      baseUrl = `/servizi/${this._componentBreadcrumbs.service.id_servizio}/componenti`;
    }

    const _mainLabel = this._componentBreadcrumbs ? 'APP.TITLE.Components' : 'APP.TITLE.Services';
    const _mainTooltip = this._componentBreadcrumbs ? 'APP.TOOLTIP.ComponentsList' : '';
    const _mainIcon = this._componentBreadcrumbs ? '' : 'grid-3x3-gap';

    this.breadcrumbs = [
      { label: _mainLabel, url: `${baseUrl}/`, type: 'link', iconBs: _mainIcon, tooltip: _mainTooltip },
      { label: `${title}`, url: `${baseUrl}/${this.id}${_view}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.TITLE.ServiceCommunications', url: ``, type: 'link' }
    ];

    if(this._componentBreadcrumbs){
      this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
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

  _loadServizio() {
    if (this.id) {
      this.service = null;
      this._spin = true;
      this.apiService.getDetails(this.model, this.id, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;
          this.apiService.getDetails(this.model, this.id).subscribe({
            next: (response: any) => {
              this.service = response;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this.showSender = this._grant ? (this._grant.ruoli.length > 0) : false;// this.authenticationService.canAdd('servizio', this.service.stato, this._grant);
              this._spin = false;
              this._loadServizioComunicazioni();    
            },
            error: (error: any) => {
              Tools.OnError(error);
              this._spin = false;
            }
          });
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadServizioComunicazioni(query: any = null, url: string = '') {
    this._setErrorCommunications(false);
    if (this.id) {
      this._spin = true;
      if (!url) { this.serviceCommunications = []; }
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
            this.serviceCommunications = (url) ? [...this.serviceCommunications, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          this._spin = false;
          // Tools.ScrollTo(0);
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
      this._loadServizioComunicazioni(null, this._links.next.href);
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
    this._loadServizioComunicazioni(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioComunicazioni(this._filterData);
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
    props.oggetto = `Servizio ${this.service.nome}`;
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
        this._loadServizioComunicazioni();
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
    this.router.navigate(['servizi', this.id, 'comunicazioni']);
  }

  __mapDateGroup(el: any): string {
    return (el.mDate.format('DDMMYYYY') !== moment().add(-1, 'days').format('DDMMYYYY')?el.date:'Ieri');
  }

  _canAddMapper = (): boolean => {
    return this.authenticationService.canAdd('servizio', this.service?.stato, this._grant?.ruoli);
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
