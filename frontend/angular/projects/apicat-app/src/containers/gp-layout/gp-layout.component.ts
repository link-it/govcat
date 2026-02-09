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
import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterContentChecked, OnDestroy, HostBinding } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { OAuthService } from 'angular-oauth2-oidc';

import { Tools, ConfigService, Language, MenuAction, EventType, EventsManagerService, LocalStorageService, BreadcrumbService } from '@linkit/components';
import { AuthenticationService } from '@app/services/authentication.service';
import { OpenAPIService } from '@services/openAPI.service';
import { NotificationsCount, NotificationsService } from '@services/notifications.service';

import { AboutDialogComponent } from '@app/components/about-dialog/about-dialog.component';

import { INavData } from './gp-sidebar-nav';
import { GpSidebarNavHelper } from './gp-sidebar-nav.helper';
import { navItemsMainMenu, navItemsAdministratorMenu, navNotificationsMenu } from './_nav';

import { environment } from '@app/environments/environment';

import { Observable, of, firstValueFrom, forkJoin } from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
    selector: 'gp-layout',
    templateUrl: './gp-layout.component.html',
    styleUrls: ['./gp-layout.component.scss'],
    standalone: false
})
export class GpLayoutComponent implements OnInit, AfterContentChecked, OnDestroy {
    static readonly Name = 'GpLayoutComponent';
    @ViewChild('watermark', { read: ElementRef }) watermark!: ElementRef;

    @HostBinding('class.full-content') get fullContentClass(): boolean {
        return this.fullContent;
    }
    @HostBinding('class.page-full-scroll') get pageFullScrollClass(): boolean {
        return (this.fullScroll || !this.desktop) && !this.contentScroll;
    }
    @HostBinding('class.page-content-scroll') get pageContentScrollClass(): boolean {
        return (!this.fullScroll && this.desktop) || this.contentScroll;
    }

    fullContent: boolean = false;
    fullScroll: boolean = false;
    contentScroll: boolean = true;

    Tools = Tools;

    _session: any = null;
    username: string = '';
    loggedIn: boolean = false;
    login: boolean = false;
    loginLabel: string = 'Login';

    _config: any = null;
    _languages: Language[] = [];
    _language: string = '';
    __once: boolean = true;

    _menuActions: MenuAction[] = [];
    _menuAppActions: MenuAction[] = [];

    _spin = true;

    _sideBarOpened: boolean = false;
    _sideBarCollapsed: boolean = false;
    _sideBarCollapsedPinned: boolean = false;
    _openSideBar: boolean = false;

    navItems: INavData[] = [];

    desktop: boolean = false;
    tablet: boolean = false;
    mobile: boolean = false;

    _loginEnabled: boolean = false;
    _autologin: boolean = false;
    _anonymousAccess: boolean = false;
    _autoAuthDiscovery: boolean = true;

    _hasSideBar: boolean = false;
    _showUsername: boolean = false;
    _showHeaderBar: boolean = false;
    _showSupHeaderBar: boolean = false;
    _showFooterBar: boolean = false;
    _showFooterExpander: boolean = false;
    _supHeaderHeight: string = '0px';
    _footerHeight: string = '48px';
    _footerExpandedHeight: string = '48px';
    _footerExpandedOver: boolean = false;
    _expandedFooter: boolean = false;
    _forceMenuOpen: boolean = false;
    _showVersion: boolean = false;
    _showBuild: boolean = false;
    _showAbout: boolean = false;
    _showAboutMiniBox: boolean = true;
    _showNewsArea: boolean = true;

    _headerHtml: string = '';
    _footerHtml: string = '';
    _footerSmallHtml: string = '';

    _title: string = '';

    _urlSite: string = '';
    _contentLimited: boolean = true;
    _notSideBar: boolean = false;

    _api_url: string = '';

    _stopPropagation: boolean = false; // Fix contextMenu

    _showLanguagesMenu: boolean = true;
    _showNotificationsMenu: boolean = false;
    _showNotificationsBar: boolean = true;
    _enablePollingNotifications: boolean = true;
    _enableOpenInNewTab: boolean = false;

    _counters: any = {
        notifications: 0
    };

    notificationsCount$!: Observable<NotificationsCount>;

    _hasDashboard: boolean = false;
    _showTaxonomies: boolean = false;

    _isAnonymous: boolean = true;

    // Scrollbar options
    _scrollbarHidden: boolean = false;
    _scrollbarHideOnIdle: boolean = false;
    private _scrollbarTimeout: any = null;
    private _scrollbarHideDelay: number = 1000;

    version: string = environment.version;
    build: string = environment.build;
    backInfo: any = null;

    modalInfoRef!: BsModalRef;

    constructor(
        private readonly router: Router,
        private readonly location: Location,
        private readonly translate: TranslateService,
        private readonly modalService: BsModalService,
        private readonly oauthService: OAuthService,
        private readonly configService: ConfigService,
        private readonly eventsManagerService: EventsManagerService,
        private readonly localStorageService: LocalStorageService,
        private readonly breadCrumbService: BreadcrumbService,
        private readonly authenticationService: AuthenticationService,
        private readonly apiService: OpenAPIService,
        private readonly notificationsService: NotificationsService,
        public sidebarNavHelper: GpSidebarNavHelper,
    ) {
        this.localStorageService.setItem('PROFILE', false);

        console.log('Configurazione Remota gl-layout', Tools.Configurazione);

        this._config = this.configService.getConfiguration();
        this._urlSite = this._config.AppConfig.SITE || '';
        this._contentLimited = this._config.AppConfig.Layout.contentLimited || false;
        this._loginEnabled = this._config.AppConfig.AUTH_SETTINGS.LOGIN_ENABLED || false;
        this._autologin = this._config.AppConfig.AUTH_SETTINGS.AUTOLOGIN || false;
        this._anonymousAccess = this._config.AppConfig.ANONYMOUS_ACCESS || false;
        this._autoAuthDiscovery = this._config.AppConfig.AUTH_SETTINGS.OAUTH?.AutoAuthDiscovery || false;

        this._hasSideBar = this._config.AppConfig.Layout.hasSideBar || false;
        this._showUsername = this._config.AppConfig.Layout.showUsername || false;
        this._showHeaderBar = this._config.AppConfig.Layout.showHeaderBar || false;
        this._showSupHeaderBar = this._config.AppConfig.Layout.showSupHeaderBar || false;
        this._showFooterBar = this._config.AppConfig.Layout.showFooterBar || false;
        this._showFooterExpander = this._config.AppConfig.Layout.showFooterExpander || false;
        this._supHeaderHeight = this._config.AppConfig.Layout.supHeaderHeight || '0px';
        this._footerHeight = this._config.AppConfig.Layout.footerHeight || '48px';
        this._footerExpandedHeight = this._config.AppConfig.Layout.footerExpandedHeight || '48px';
        this._footerExpandedOver = this._config.AppConfig.Layout.footerExpandedOver || false;
        this._forceMenuOpen = this._config.AppConfig.Layout.forceMenuOpen || false;
        
        this._showVersion = this._config.AppConfig.Layout.showVersion || false;
        this._showBuild = this._config.AppConfig.Layout.showBuild || false;
        this._showAbout = this._config.AppConfig.Layout.showAbout || false;
        this._showAboutMiniBox = this._config.AppConfig.Layout.showAboutMiniBox || false;
        this._showNewsArea = this._config.AppConfig.Layout.showNewsArea || false;

        this._showLanguagesMenu = this._config.AppConfig.Layout.showLanguagesMenu || false;
        this._showNotificationsMenu = this._config.AppConfig.Layout.showNotificationsMenu || false;
        this._showNotificationsBar = this._config.AppConfig.Layout.showNotificationsBar || false;
        this._enablePollingNotifications = this._config.AppConfig.Layout.enablePollingNotifications || false;
        this._enableOpenInNewTab = this._config.AppConfig.Layout.enableOpenInNewTab || false;
        this._title = this._config.AppConfig.Layout.Header.title;
        this._api_url = this._config.AppConfig.SITE;

        let offset = 0;
        if (this._showSupHeaderBar) {
            offset += Number.parseInt(this._supHeaderHeight, 10);
        }
        if (this._showHeaderBar) {
            offset += 48;
        }
        if (this._showFooterBar) {
            offset += Number.parseInt(this._footerHeight, 10);
        }
        document.documentElement.style.setProperty('--header-offset', `${offset}px`);
        document.documentElement.style.setProperty('--header-height', this._showHeaderBar ? '48px' : '0px');
        document.documentElement.style.setProperty('--content-wrapper-top', this._showHeaderBar ? '48px' : '0px');

        document.documentElement.style.setProperty('--sup-header-height', this._showSupHeaderBar ? this._supHeaderHeight : '0px');
        
        document.documentElement.style.setProperty('--footer-height', this._showFooterBar ? this._footerHeight : '0px');
        document.documentElement.style.setProperty('--footer-expanded-height', this._showFooterBar ? this._footerExpandedHeight : '0px');
        document.documentElement.style.setProperty('--content-wrapper-bottom', this._showFooterBar ? this._footerHeight : '0px');
        
        document.documentElement.style.setProperty('--footer-offset', this._showFooterBar ? '48px' : '0px');

        if (Tools.Configurazione) {
            const _dashboardRemoteConfig: any = this.authenticationService._getConfigModule('dashboard');
            this._hasDashboard = _dashboardRemoteConfig.abilitato || false;
            const _servizioRemoteConfig: any = this.authenticationService._getConfigModule('servizio');
            this._showTaxonomies = _servizioRemoteConfig.tassonomie_abilitate || false;
        }

        // Scrollbar options
        this._scrollbarHidden = this._config.AppConfig?.Scrollbar?.hidden || false;
        this._scrollbarHideOnIdle = this._config.AppConfig?.Scrollbar?.hideOnIdle || false;

        if (this._showBuild) {
            this.version = `${this.version} (${this.build})`;
        }

        if (!this._showHeaderBar) {
            document.documentElement.style.setProperty('--header-height', this._showHeaderBar ? '48px' : '0px');
            document.documentElement.style.setProperty('--content-wrapper-top', this._showHeaderBar ? '48px' : '0px');
        }

        if (this._config.NavMenu && this._config.NavMenu.length > 0) {
            this.navItems = this._config.NavMenu;
        } else {
            this.navItems = [...navItemsMainMenu ];
            if (this._showNotificationsMenu) {
                this.navItems = [...this.navItems, ...navNotificationsMenu ];
            }
        }

        this._session = this.authenticationService.getCurrentSession();
        this.setHeaderBar(this._isAnonymous);

        if (Tools.CurrentApplication && Tools.CurrentApplication.menu) {
            this._contentLimited = Tools.CurrentApplication.menu.action === 'dashboard';
        }

        this.router.events.pipe(
                filter((event: any) => event instanceof NavigationEnd)
            ).subscribe(event => {
                this._contentLimited = this._config.AppConfig.Layout.contentLimited || false;
            });

        this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
            this._loadHeaderFooter();
            this.initMenuActions();
        });
    
        this.initLanguages();
        this.initMenuActions();
        this.onResize();

        this._loadHeaderFooter();
    }

    @HostListener('window:resize')
    onResize() {
        this.desktop = (window.innerWidth >= 1200);
        this.tablet = (window.innerWidth < 1200 && window.innerWidth >= 768);
        this.mobile = (window.innerWidth < 768);

        if (this.desktop) {
            this._sideBarCollapsed = this._sideBarCollapsedPinned ? true : false;
            this._sideBarOpened = true;
            this._openSideBar = false;
        }
        if (this.tablet) {
            this._sideBarCollapsed = true;
            this._sideBarOpened = false;
            this._openSideBar = false;
        }
        if (this.mobile) {
            this._sideBarCollapsed = false;
            this._sideBarOpened = false;
        }
    }

    @HostListener('window:keydown', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (event.key === 'l' && event.ctrlKey) {
            this._contentLimited = !this._contentLimited;
        }
    }

    async ngOnInit() {
        if (!Tools.Configurazione) {
            console.log('1 - GpLayout loading RemoteConfig');
            await this.loadRemoteConfig();
            console.log('3 - GpLayout Configurazione Remota', Tools.Configurazione);
        }

        console.log('4 - loadProfile');
        this.eventsManagerService.on(EventType.NAVBAR_OPEN, (event: any) => {
            this.__openSideBar();
        });

        this.eventsManagerService.on(EventType.LAYOUT_FULLWIDTH, (event: any) => {
            console.log(EventType.LAYOUT_FULLWIDTH, event);
            this._contentLimited = !event;
        });

        setTimeout(() => {
            if (this._sideBarOpened && !this.desktop && !this.mobile) {
                this.__toggelCollapse();
            }
        });

        if (this._autoAuthDiscovery && !this._anonymousAccess) {
            this.oauthService.initCodeFlow();
            this.oauthService.setupAutomaticSilentRefresh();
        }

        this.loadProfile();

        // Init scrollbar options
        this._initScrollbarOptions();
    }

    private _initScrollbarOptions(): void {
        // Scrollbar completamente nascosta (priorità su hideOnIdle)
        if (this._scrollbarHidden) {
            document.body.classList.add('scrollbar-hidden');
            return;
        }

        // Scrollbar nascosta quando inattivo
        if (this._scrollbarHideOnIdle) {
            document.body.classList.add('scrollbar-hide-on-idle');

            // Bind event handlers
            this._onMouseMoveHandler = this._onMouseMoveHandler.bind(this);
            this._onScrollHandler = this._onScrollHandler.bind(this);

            document.addEventListener('mousemove', this._onMouseMoveHandler);
            document.addEventListener('scroll', this._onScrollHandler, true);
        }
    }

    private _onMouseMoveHandler(): void {
        this._showScrollbar();
    }

    private _onScrollHandler(): void {
        this._showScrollbar();
    }

    private _showScrollbar(): void {
        document.body.classList.add('scrollbar-visible');

        if (this._scrollbarTimeout) {
            clearTimeout(this._scrollbarTimeout);
        }

        this._scrollbarTimeout = setTimeout(() => {
            document.body.classList.remove('scrollbar-visible');
        }, this._scrollbarHideDelay);
    }

    async loadRemoteConfig() {
        try {
            const remoteConfig: any = await firstValueFrom(this.apiService.getList(`configurazione`));
            Tools.Configurazione = remoteConfig;
            this.configService._generateCustomFieldLabel(Tools.Configurazione);

            const _dashboardRemoteConfig: any = this.authenticationService._getConfigModule('dashboard');
            this._hasDashboard = _dashboardRemoteConfig.abilitato || false;
            const _servizioRemoteConfig: any = this.authenticationService._getConfigModule('servizio');
            this._showTaxonomies = _servizioRemoteConfig.tassonomie_abilitate || false;

            console.log('2 - GpLayout Configurazione loaded');
        } catch (error) {
            console.error('2 - Errore loadRemoteConfig', error);
        }
    }

    ngAfterContentChecked() {
        if (this._config.AppConfig.Watermark) {
            this.__once = false;
            this._watermark();
        }

        const _location = this.localStorageService.getItem('LOCATION');
        if (_location && !this._stopPropagation) {
            this.localStorageService.remove('LOCATION');
            this.router.navigate([_location]);
        }
    }

    ngOnDestroy() {
        // Cleanup scrollbar options
        if (this._scrollbarHidden) {
            document.body.classList.remove('scrollbar-hidden');
        }
        if (this._scrollbarHideOnIdle) {
            document.removeEventListener('mousemove', this._onMouseMoveHandler);
            document.removeEventListener('scroll', this._onScrollHandler, true);
            document.body.classList.remove('scrollbar-hide-on-idle', 'scrollbar-visible');
            if (this._scrollbarTimeout) {
                clearTimeout(this._scrollbarTimeout);
            }
        }
    }

    loadProfile() {
        this._spin = true;
        this.apiService.getList('profilo').subscribe({
            next: (response: any) => {
                // Controlla se e' richiesta la registrazione (first-login)
                if (response.stato === 'registrazione_richiesta') {
                    this.authenticationService.setCurrentSession(response);
                    this._spin = false;
                    this.router.navigate(['/auth/registrazione']);
                    return;
                }

                this.authenticationService.setCurrentSession(response);
                this._session = this.authenticationService.reloadSession();
                if (_.isEmpty(this._session.settings) || !this._session.settings.version) {
                    this.authenticationService.saveSettings(null);
                }
                this._isAnonymous = this.authenticationService.isAnonymous();

                this.setHeaderBar(this._isAnonymous);
                this.initMainMenu();
                this.initMenuActions();

                this.localStorageService.setItem('PROFILE', true);
                this.eventsManagerService.broadcast(EventType.PROFILE_UPDATE, { data: this._session });

                this._spin = false;
            },
            error: (error: any) => {
                this.eventsManagerService.broadcast(EventType.PROFILE_UPDATE, { data: null });
                console.log('loadProfile error', error);
                this._spin = false;
            }
        });
    }

    setHeaderBar(anonymous: boolean = false) {
        this.loginLabel = this.translate.instant('APP.BUTTON.Login');
        if (anonymous) {
            this._enablePollingNotifications = false;
            this._showLanguagesMenu = this._config.AppConfig.Layout.showLanguagesMenu || false;
            this._showNotificationsMenu = false;
            this._showNotificationsBar = false;
            this.loggedIn = false;
            this.login = this._loginEnabled;
            this.username = '';
        } else {
            this._enablePollingNotifications = this._config.AppConfig.Layout.enablePollingNotifications || false;
            this._showLanguagesMenu = this._config.AppConfig.Layout.showLanguagesMenu || false;
            this._showNotificationsMenu = false;
            this._showNotificationsBar = this._config.AppConfig.Layout.showNotificationsBar || false;
            this.notificationsCount$ = this.notificationsService.getNotificationsCount();
            this.loggedIn = (this._session !== null);
            this.login = (this._session !== null);
            this.username = this._session?.utente?.username || '';
            this._startCounters();
        }
    }

    _startCounters() {
        if (this._enablePollingNotifications) {
            this.notificationsCount$.pipe(
                // tap(() => console.log('data received'))
            ).subscribe(val => this._counters.notifications = val.count);
        }
    }

    prepareNavigation() {
        let newItems = [ ...navItemsMainMenu ];
        const servizio = this.authenticationService._getConfigModule('servizio');
        const hasServiziApi = servizio?.api?.abilitato || false;
        const hasGenerico = servizio?.generico?.abilitato || false;
        if (hasServiziApi && hasGenerico) {
            newItems = [...navItemsMainMenu ];
        } else {
            const navServiziItem =   {
                title: true,
                label: 'APP.MENU.Services',
                path: hasServiziApi ? 'servizi' : 'servizi-generici',
                url: hasServiziApi ? '/servizi' : '/servizi-generici',
                iconBs: 'grid-3x3-gap',
                permission: 'SERVICES',
                attributes: { disabled: false }
            };
            newItems[0] = navServiziItem;
        }
        return newItems;
    }

    initMainMenu() {
        this.navItems = this.prepareNavigation();
        if (this.authenticationService.isGestore()) {
            if (this._showNotificationsMenu) {
                this.navItems = [...this.navItems, ...navNotificationsMenu ];
            }
            this.navItems = [...this.navItems, ... navItemsAdministratorMenu];
        } else if (this.authenticationService.isCoordinatore()) {
            const _navItemsAdministratorMenu: INavData[] = [];
            if (this.authenticationService.hasMenuAmministrazione()) {
                navItemsAdministratorMenu.forEach((item: INavData) => {
                    if (item.divider) {
                        _navItemsAdministratorMenu.push(item);
                    } else if (item.title) {
                        const _children: INavData[] = [];
                        (item.children || []).forEach((child: INavData) => {
                            const menu = child.path || '';
                            if (this.authenticationService.verificacanPermessiMenuAmministrazione(menu).canRead) {
                                _children.push(child);
                            }
                        });
                        _navItemsAdministratorMenu.push({ ...item, children: _children });
                    } else {
                        const menu = item.path || '';
                        if (this.authenticationService.verificacanPermessiMenuAmministrazione(menu).canRead) {
                            _navItemsAdministratorMenu.push(item);
                        }
                    }
                });
            }
            this.navItems = [...this.navItems, ... _navItemsAdministratorMenu];
        }
    }

    initMenuActions() {
        const _user = this.authenticationService.getUserName();

        this._menuActions = [
            // new MenuAction({
            //   title: this.translate.instant('APP.MENU.Settings'),
            //   icon: 'gear',
            //   subTitle: '',
            //   action: 'settings'
            // }),
            new MenuAction({
                title: _user,
                icon: 'person',
                subTitle: '',
                action: 'profile'
            })
        ];
        if (!this._autologin) {
            this._menuActions.push(
                new MenuAction({
                    title: this.translate.instant('APP.MENU.Logout'),
                    action: 'logout'
                })
            );
        }
    }

    initLanguages() {
        try {
            const _languages = this._config.AppConfig.Languages;
            const _defaultLanguage = this._config.AppConfig.DefaultLanguage;
            const _codeLangs = (_languages.length != 0) ? [] : ['it'];
            let _currentLanguage: Language = new Language({
                language: 'Italiano',
                alpha2Code: 'it',
                alpha3Code: 'ita'
            });
            const browserLang = this.translate.getBrowserLang();

            _languages.forEach((lingua: any) => {
                const _l: Language = new Language(lingua);
                this._languages.push(_l);
                _codeLangs.push(lingua.alpha2Code);
                if ((_defaultLanguage == _l.alpha2Code) || (_defaultLanguage == 'browser' && browserLang == _l.alpha2Code)) {
                    _currentLanguage = _l;
                }
            });

            this.translate.addLangs(_codeLangs);
            this._language = _currentLanguage.alpha3Code;
            if (this.translate.currentLang !== _currentLanguage.alpha2Code) {
                this._doTranslate();
            }
            this.translate.use(_currentLanguage.alpha2Code);

        } catch (e) {
            console.log('Verificare configurazione lingue');
        }
    }

    get _applicationTitle(): string {
        return this._title; // this.translate.instant('APP.TITLE.AppTitle')
    }

    _onChangeLanguage(event: any) {
        if (event.language.alpha2Code !== this.translate.currentLang) {
            Tools.WaitForResponse();
            this._language = event.language.alpha3Code;
            this.translate.use(event.language.alpha2Code);
        }
    }

    _doTranslate() {}

    __toggelCollapse() {
        this._sideBarCollapsed = !this._sideBarCollapsed;
        this._sideBarCollapsedPinned = this._sideBarCollapsed;
        this._sideBarOpened = !this._sideBarCollapsed
        window.dispatchEvent(new Event('resize'));
    }

    __openSideBar() {
        this._openSideBar = true;
        window.dispatchEvent(new Event('resize'));
    }

    __closeSideBar() {
        this._openSideBar = false;
        window.dispatchEvent(new Event('resize'));
    }

    /**
     * Apre il menu item in una nuova scheda (chiamato dall'icona)
     */
    _openMenuInNewTab(event: MouseEvent, item: INavData) {
        event.preventDefault();
        event.stopPropagation();
        if (item.url) {
            const url = Array.isArray(item.url) ? item.url.join('/') : item.url;
            // prepareExternalUrl aggiunge il baseHref (es. /apicat-app/) all'URL
            const fullUrl = this.location.prepareExternalUrl(url);
            window.open(fullUrl, '_blank');
        }
    }

    _onClickMenu(event: MouseEvent, item: INavData) {
        // Supporto apertura in nuova scheda con Ctrl+Click, Cmd+Click o middle-click
        const shouldOpenInNewTab = event.ctrlKey || event.metaKey || event.button === 1;
        if (shouldOpenInNewTab && item.url) {
            event.preventDefault();
            event.stopPropagation();
            // Gestisce sia url stringa che array di segmenti
            const url = Array.isArray(item.url) ? item.url.join('/') : item.url;
            // prepareExternalUrl aggiunge il baseHref (es. /apicat-app/) all'URL
            const fullUrl = this.location.prepareExternalUrl(url);
            window.open(fullUrl, '_blank');
            return;
        }

        if (item.url === '/servizi') {
            this.breadCrumbService.clearBreadcrumbs();
            this.eventsManagerService.broadcast(EventType.BREADCRUMBS_RESET, { currIdGruppoPadre: '', gruppoPadreNull: true, groupsBreadcrumbs: [] });
        }

        if (this._stopPropagation) { this._stopPropagation = false; return; }
        if (!this._forceMenuOpen) {
            if (!this.desktop && !this.mobile) {
                this._sideBarCollapsed = true;
                this._sideBarOpened = false;
                this._openSideBar = false;
            }

            if (this.mobile && item.title && item.children && item.children.length > 0) {
                // Expand the menu
                this._sideBarCollapsed = false;
                this._sideBarOpened = true;
                this._openSideBar = true;
                this._expandMenu(item);
            } else {
                this.router.navigate([item.url]);
                if (this.mobile) {
                this._sideBarCollapsed = true;
                this._sideBarOpened = false;
                this._openSideBar = false;
                this._resetExpandMenu();
                }
        }
        } else {
            // Expand the menu
            if (!this.desktop && !this.mobile) {
                this._sideBarCollapsed = true;
                this._sideBarOpened = false;
                this._openSideBar = false;
            }
            item.expanded = false;
            this.router.navigate([item.url]);
            if (this.mobile) {
                this._sideBarCollapsed = true;
                this._sideBarOpened = false;
                this._openSideBar = false;
            }
        }
    }

    _onContextualMenu(event: any) {
        this._stopPropagation = true;
        event.event.stopPropagation();
        // Apre direttamente l'URL del menu item in una nuova scheda
        // Gestisce sia url stringa che array di segmenti
        const url = Array.isArray(event.item.url) ? event.item.url.join('/') : event.item.url;
        // prepareExternalUrl aggiunge il baseHref (es. /apicat-app/) all'URL
        const fullUrl = this.location.prepareExternalUrl(url);
        window.open(fullUrl, '_blank');
        setTimeout(() => {
            this._stopPropagation = false;
        }, 1000);
    }

    _onMenuHeaderAction(event: any) {
        this._title = this._config.AppConfig.Layout.Header.title;
        switch (event.menu.action) {
            case 'login':
                this.router.navigate(['/auth/login']);
                break
            case 'notifications':
                this.router.navigate(['/notifications']); // , { queryParams: { 'refresh': Date.now() } }
                break
            case 'profile':
                this.router.navigate(['/profile']);
                break
            case 'settings':
                this.router.navigate(['/settings']);
                break
            case 'logout':
                this.router.navigate(['/auth/login']);
                break
            default:
                break;
        }
    }

    _onMenuAppHeaderAction(event: any) {
        Tools.CurrentApplication = event;
        switch (event.menu.action) {
            case 'dashboard':
                this._contentLimited = false;
                this.router.navigate([event.menu.url]);
                break
            default:
                this._contentLimited = false;
                this.router.navigate(['/application']);
                break;
        }
    }

    showInfo() {
        if (this._showAbout) {
            // Close sidebar on mobile when opening About dialog
            if (this.mobile) {
                this._sideBarCollapsed = true;
                this._sideBarOpened = false;
                this._openSideBar = false;
            }

            const initialState = {
                version: this.version,
                build: this.build,
                backInfo: this.backInfo
            };

            this.modalInfoRef = this.modalService.show(AboutDialogComponent, {
                ignoreBackdropClick: false,
                class: 'modal-lg modal-fullscreen-sm-down',
                initialState: initialState
            });
            this.modalInfoRef.content.onClose.subscribe(
                (response: any) => {
                    // console.log('showInfo response', response);
                }
            );
        }
    }

    _hasPermission(menu: any) {
        return this.authenticationService.hasPermission(menu.permission, 'view');
    }

    _expandMenu(item: INavData) {
        if (item.children) {
            item.expanded = !item.expanded;
        }
    }

    _resetExpandMenu() {
        this.navItems.forEach((item: INavData) => {
        item.expanded = false;
        });
    }

    @HostListener('click', ['$event'])
    onClick(e: any) {
        if (e.target.id !== 'footerExpander' && this._expandedFooter) {
            if (this._footerExpandedOver) {
                this._expandedFooter = false;
            } else {
                document.documentElement.style.setProperty('--footer-height', this._expandedFooter ? this._footerExpandedHeight : this._footerHeight);
                document.documentElement.style.setProperty('--content-wrapper-bottom', this._expandedFooter ? this._footerExpandedHeight : this._footerHeight);
            }
        }
    }

    _toggleExpandFooter(event: any) {
        event.stopPropagation();
        this._expandedFooter = !this._expandedFooter;
        if (!this._footerExpandedOver) {
            document.documentElement.style.setProperty('--footer-height', this._expandedFooter ? this._footerExpandedHeight : this._footerHeight);
            document.documentElement.style.setProperty('--content-wrapper-bottom', this._expandedFooter ? this._footerExpandedHeight : this._footerHeight);
        }
    }

    _loadHeaderFooter() {
        if (this._showFooterBar || this._showHeaderBar) {
            this._loadStyle('./assets/pages/css/styles.css');
            this._loadStyle('./assets/pages/css/custom_styles.css', 'custom-css');
            this._loadScript('./assets/pages/js/scripts.js');

            const reqs: Observable<any>[] = [];  
            const folder = `pages/${this.translate.currentLang}`;
            reqs.push( this.configService.getPage('header', folder).pipe(catchError((err) => { return of(''); })) );
            reqs.push( this.configService.getPage('footer-small', folder).pipe(catchError((err) => { return of(''); })) );
            reqs.push( this.configService.getPage('footer', folder) .pipe( catchError((err) => { return of(''); })) );
            forkJoin(reqs).subscribe(
                (results: Array<any>) => {
                    const header = results[0].replace(/##SITE_URL##/g, this._urlSite);
                    this._headerHtml = header;
                    this._footerSmallHtml = results[1];
                    this._footerHtml = results[2];
                },
                (error: any) => {
                    console.log('_loadHeaderFooter forkJoin error', error);
                }
            );
        }
    }

    _loadStyle(styleName: string, id: string = 'footer-css') {
        const head = document.getElementsByTagName('head')[0];

        let cssLink = document.getElementById(id) as HTMLLinkElement;
        if (cssLink) {
            cssLink.href = styleName;
        } else {
            const style = document.createElement('link');
            style.id = id;
            style.rel = 'stylesheet';
            style.href = `${styleName}`;

            head.appendChild(style);
        }
    }

    _loadScript(scriptName: string, id: string = 'footer-script') {
        const head = document.getElementsByTagName('head')[0];

        let jsLink = document.getElementById(id) as HTMLLinkElement;
        if (jsLink) {
            jsLink.href = scriptName;
        } else {
            const script = document.createElement('script');
            script.id = id;
            script.type = 'text/javascript';
            script.src = `${scriptName}`;
        
            head.appendChild(script);
        }
    }

    _showMenu = (menu: any): boolean => {
        let _show: boolean = true;
        if (menu.path === 'adesioni') {
            _show = !this._isAnonymous;
        }
        if (menu.path === 'dashboard') {
            _show = this._hasDashboard;
        }
        if (menu.path === 'tassonomie') {
            _show = this._showTaxonomies;
        }
        return _show;
    }
    // (menu | mapper:_showMenu)

    /**
     * Internal watermark text rotation
     */
    protected _watermark() {
        if (this.watermark) {
            this.__once = true;
            const watermark = this.watermark.nativeElement;
            const span = watermark.querySelector('span');
            span.style.transform = 'rotate(-' + Math.atan((watermark.clientHeight / watermark.clientWidth)) * 180 / Math.PI + 'deg)';
        }
    }
}
