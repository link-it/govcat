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
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { LocalStorageService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { NotificationsCount, NotificationsService } from '@services/notifications.service';

import { SearchBarFormComponent } from '@linkit/components';

import { Page } from '@app/models/page';

import * as _ from 'lodash';

import { NotificationType, NotificationState, NotificationEntityType } from './notifications'
import { MenuSelectType } from './notifications'
import { NavigationService } from '@app/services/navigation.service';

import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-notifications',
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.scss'],
  standalone: false
})
export class NotificationsComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'NotificationsComponent';
  readonly model: string = 'notifiche';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  
  Tools = Tools;

  config: any;
  notificationsConfig: any;

  elements: any[] = [];
  _page: Page = new Page({});
  _links: any = {};
  _allElements: number = 0;

  fullScroll: boolean = true;

  _isEdit: boolean = false;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];
  _filterDataEmpty: boolean = true;

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

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
    // { field: 'nome', label: 'APP.LABEL.nome', icon: '' }
  ];

  searchFields: any[] = [
    { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' },
    { field: 'tipo_notifica', label: 'APP.LABEL.NotificationType', type: 'string', condition: 'egual' },
    { field: 'stato_notifica', label: 'APP.LABEL.NotificationState', type: 'string', condition: 'egual' },
    { field: 'tipo_entita_notifica', label: 'APP.LABEL.NotificationEntityType', type: 'string', condition: 'egual' },
    { field: 'id_entita_notifica', label: 'APP.LABEL.NotificationEntityId', type: 'string', condition: 'egual' },
  ];
  useCondition: boolean = false;

  notificationState = NotificationState;
  currentTab: string = NotificationState.Tutte;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Notifications', url: 'root', type: 'link', icon: 'inbox' }
  ];

  generalConfig: any = Tools.Configurazione;

  _col: number = 4;

  minLengthTerm = 1;

  _useNewSearchUI : boolean = false;

  _showBulkSelection: boolean = false;
  _showTooltip: boolean = false;

  public notificationTypes: MenuSelectType[] = [
    { value: NotificationType.Comunicazione, label: this.translate.instant('APP.NOTIFICATIONS.TYPE.Comunicazione') },
    { value: NotificationType.CambioStato, label: this.translate.instant('APP.NOTIFICATIONS.TYPE.CambioStato') }
  ];

  public notificationStates: MenuSelectType[] = [
    { value: NotificationState.Nuova, label: this.translate.instant('APP.NOTIFICATIONS.STATUS.Nuova') },
    { value: NotificationState.Letta, label: this.translate.instant('APP.NOTIFICATIONS.STATUS.Letta') },
    { value: NotificationState.Archiviata, label: this.translate.instant('APP.NOTIFICATIONS.STATUS.Archiviata') }
  ];

  _enablePollingNotifications: boolean = true;
  notificationsCount$!: Observable<NotificationsCount>;
  _lastCount: number = 0;
  _needRefresh: boolean = false;
  _firstCount: boolean = true;
  _timeRefresh: string|null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    private localStorageService: LocalStorageService,
    public apiService: OpenAPIService,
    public utilService: UtilService,
    public authenticationService: AuthenticationService,
    private notificationsService: NotificationsService,
    private navigationService: NavigationService
  ) {
    this.config = this.configService.getConfiguration();
    this._enablePollingNotifications = this.config.AppConfig.Layout.enablePollingNotifications || false;

    this.fullScroll = this.config.AppConfig.Layout.fullScroll || false;

    this.notificationsCount$ = this.notificationsService.getNotificationsCount();

    this._initSearchForm();

    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        const regex = /(\?|\&)([^=]+)\=([^&]+)/;
        let m = regex.exec(evt.url);
        if (m?.length === 4) {
          if (this._timeRefresh !== m[3]) {
            this._timeRefresh = m[3];
            this.refresh();
          }
        }
      }
    });
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.notificationsConfig = config;
      }
    );

    this._lastCount = this.notificationsService.getCurrentCount();

    this._startCounters();
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
      setTimeout(() => {
        this.clearSearch();
      }, 100);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _startCounters() {
    if (this._enablePollingNotifications) {
      this.notificationsCount$.pipe(
        // tap(() => console.log('data received'))
      ).subscribe(val => {
        if (!this._firstCount && val.count !== this._lastCount) {
          this._lastCount = val.count;
          this._needRefresh = true;
        }
        this._firstCount = false;
      });
    }
  }

  clearSearch() {
    this.searchBarForm._clearSearch(null);
    this._filterData = [];
    this._loadNotifications();
  }

  refresh() {
    this._needRefresh = false;
    this._loadNotifications(this._filterData);
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
    });
  }

  _loadNotifications(query: any = null, url: string = '') {
    
    this._setErrorMessages(false);

    if (!url) { this.elements = []; }
    
    let aux: any;
    if (this.currentTab === NotificationState.Tutte) {
      query = { ...query, stato_notifica: `${NotificationState.Nuova},${NotificationState.Letta}` };
    } else {
      query = { ...query, stato_notifica: this.currentTab };
    }
    if (query) { aux = { params: this.utilService._queryToHttpParams(query) }; }

    this._spin = true;
    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {

        response ? this._page = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        this._allElements = this._page.totalElements || 0;

        if (response && response.content) {
          const _list: any = response.content.map((notification: any, index: number) => {
            const _servizio = notification.entita.servizio;
            const _adesione = notification.entita.adesione;
            let descrizione = (notification.tipo.tipo === NotificationType.Comunicazione) ? notification.tipo.testo : this.translate.instant('APP.WORKFLOW.STATUS.'+notification.tipo.stato);
            let titolo = _servizio ? 'APP.TITLE.Service' : 'APP.TITLE.Adesione';
            titolo = this.translate.instant(titolo);
            if (_servizio) {
              titolo = `${titolo} ${_servizio.nome} v.${_servizio.versione}`;
            } else {
              titolo = `${titolo} ${_adesione.servizio.nome} v.${_adesione.servizio.versione} - ${_adesione.soggetto.nome}`;
            }
            const element = {
              id: notification.id_notifica || index,
              user_name: `${notification.mittente.nome} ${notification.mittente.cognome}`,
              user_gravatar: notification.mittente.email_aziendale || notification.mittente.email,
              titolo: titolo,
              descrizione: descrizione,
              unread: (notification.stato === NotificationState.Nuova),
              ...notification
            };
            return element;
          });
          this.elements = (url) ? [...this.elements, ..._list] : [..._list];
        }
        this._preventMultiCall = false;
        this._spin = false;
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
        this._spin = false;
        // Tools.OnError(error);
      }
    });
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadNotifications(null, this._links.next.href);
    }
  }

  _onEdit(event: any, param: any) {
    if (this.searchBarForm) {
      this.searchBarForm._pinLastSearch();
    }

    // Supporto per apertura in nuova scheda (Ctrl+Click, Cmd+Click, middle-click)
    const mouseEvent = this.navigationService.extractEvent(event);
    const data = this.navigationService.extractData(param) || param;

    const _notificaId = data.id_notifica;
    const _messageId = data.entita.id_entita;
    const _servizio = data.entita.servizio;
    const _adesione = data.entita.adesione;
    const _tipoUrl = (data.tipo.tipo === NotificationType.Comunicazione) ? `/comunicazioni?` : '?';

    const _useId: boolean = true;
    const _notificationB64 = btoa(encodeURI(JSON.stringify(data)));

    let _url = '';
    if (_servizio) {
      _url = `/servizi/${_servizio.id_servizio}${_tipoUrl}`;
      _url += _useId ? `notificationId=${_notificaId}&messageid=${_messageId}` : `notification=${_notificationB64}`;
    } else {
      _url = `/adesioni/${_adesione.id_adesione}${_tipoUrl}`;
      _url += _useId ? `notificationId=${_notificaId}&messageid=${_messageId}` : `notification=${_notificationB64}`;
    }

    if (this.navigationService.shouldOpenInNewTab(mouseEvent)) {
      mouseEvent?.preventDefault();
      mouseEvent?.stopPropagation();
      window.open(_url, '_blank');
    } else {
      this.router.navigateByUrl(_url);
    }
  }

  _onOpenInNewTab(event: any) {
    const data = this.navigationService.extractData(event);

    const _notificaId = data.id_notifica;
    const _messageId = data.entita.id_entita;
    const _servizio = data.entita.servizio;
    const _adesione = data.entita.adesione;
    const _tipoUrl = (data.tipo.tipo === NotificationType.Comunicazione) ? `/comunicazioni?` : '?';

    const _useId: boolean = true;
    const _notificationB64 = btoa(encodeURI(JSON.stringify(data)));

    let _url = '';
    if (_servizio) {
      _url = `/servizi/${_servizio.id_servizio}${_tipoUrl}`;
      _url += _useId ? `notificationId=${_notificaId}&messageid=${_messageId}` : `notification=${_notificationB64}`;
    } else {
      _url = `/adesioni/${_adesione.id_adesione}${_tipoUrl}`;
      _url += _useId ? `notificationId=${_notificaId}&messageid=${_messageId}` : `notification=${_notificationB64}`;
    }

    window.open(_url, '_blank');
  }

  markNotification(elem: any, stato: string, refresh: boolean = false) {
    const _body = {
      stato: stato
    }
    this.apiService.putElement('notifiche', elem.id_notifica, _body).subscribe({
      next: (response: any) => {
        if (refresh || (this.currentTab === NotificationState.Archiviata)) {
          this.refresh();
        } else {
          const idx = this.elements.findIndex((item: any) => item.id_notifica === response.id_notifica )
          console.log(this.elements[idx]);
          if (idx !== -1) {
            this.elements[idx] = {
              ...this.elements[idx],
              unread: (response.stato === NotificationState.Nuova)
            };
          }
        }
      },
      error: (error: any) => {
      }
    });
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadNotifications(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadNotifications(this._filterData);
  }

  _onSort(event: any) {
    console.log(event);
  }

  _setCurrentTab(value: string) {
    this.currentTab = value;
    this._onSearch(this._filterData);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _toggleCols() {
    this._col = this._col === 4 ? 6 : 4;
  }

  _isGestore() {
    return this.authenticationService.isGestore();
  }

  _isGestoreMapper = (): boolean => {
    return this.authenticationService.isGestore([]);
  }
}
