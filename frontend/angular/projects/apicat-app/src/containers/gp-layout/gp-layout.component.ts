import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterContentChecked, OnDestroy, Input, HostBinding } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { OAuthService } from 'angular-oauth2-oidc';

import { Tools } from '@linkit/components';
import { ConfigService } from '@linkit/components';
import { Language } from '@linkit/components';
import { MenuAction } from '@linkit/components';
import { EventType } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { LocalStorageService } from '@linkit/components';
import { BreadcrumbService } from '@linkit/components';
import { AuthenticationService } from '@app/services/authentication.service';
import { OpenAPIService } from '@services/openAPI.service';
import { NotificationsCount, NotificationsService } from '@services/notifications.service';

import { AboutDialogComponent } from '@app/components/about-dialog/about-dialog.component';

import { INavData } from './gp-sidebar-nav';
import { GpSidebarNavHelper } from './gp-sidebar-nav.helper';
import { navItemsMainMenu, navItemsAdministratorMenu, navNotificationsMenu } from './_nav';

import { environment } from '@app/environments/environment';

import { Observable, of, firstValueFrom } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

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
    _showHeaderBar: boolean = false;
    _forceMenuOpen: boolean = false;
    _showVersion: boolean = false;
    _showBuild: boolean = false;
    _showAbout: boolean = false;
    _showAboutMiniBox: boolean = true;
    _showNewsArea: boolean = true;

    _title: string = '';

    _contentLimeted: boolean = true;
    _notSideBar: boolean = false;

    _api_url: string = '';

    _stopPropagation: boolean = false; // Fix contextMenu

    _showNotificationsMenu: boolean = false;
    _showNotificationsBar: boolean = true;
    _enablePollingNotifications: boolean = true;

    _counters: any = {
        notifications: 0
    };

    notificationsCount$!: Observable<NotificationsCount>;

    _hasDashboard: boolean = false;
    _showTaxonomies: boolean = false;

    _isAnonymous: boolean = true;

    version: string = environment.version;
    build: string = environment.build;
    backInfo: any = null;

    modalInfoRef!: BsModalRef;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private observer: BreakpointObserver,
        private translate: TranslateService,
        private modalService: BsModalService,
        private oauthService: OAuthService,
        private configService: ConfigService,
        private tools: Tools,
        private eventsManagerService: EventsManagerService,
        private localStorageService: LocalStorageService,
        private breadCrumbService: BreadcrumbService,
        private authenticationService: AuthenticationService,
        private apiService: OpenAPIService,
        private notificationsService: NotificationsService,
        public sidebarNavHelper: GpSidebarNavHelper,
    ) {
        this.localStorageService.setItem('PROFILE', false);

        console.log('Configurazione Remota gl-layout', Tools.Configurazione);

        this._config = this.configService.getConfiguration();
        this._loginEnabled = this._config.AppConfig.AUTH_SETTINGS.LOGIN_ENABLED || false;
        this._autologin = this._config.AppConfig.AUTH_SETTINGS.AUTOLOGIN || false;
        this._anonymousAccess = this._config.AppConfig.ANONYMOUS_ACCESS || false;
        this._autoAuthDiscovery = this._config.AppConfig.AUTH_SETTINGS.OAUTH?.AutoAuthDiscovery || false;
        this._showHeaderBar = this._config.AppConfig.Layout.showHeaderBar || false;
        this._forceMenuOpen = this._config.AppConfig.Layout.forceMenuOpen || false;
        this._showVersion = this._config.AppConfig.Layout.showVersion || false;
        this._showBuild = this._config.AppConfig.Layout.showBuild || false;
        this._showAbout = this._config.AppConfig.Layout.showAbout || false;
        this._showAboutMiniBox = this._config.AppConfig.Layout.showAboutMiniBox || false;
        this._showNewsArea = this._config.AppConfig.Layout.showNewsArea || false;
        this._showNotificationsMenu = this._config.AppConfig.Layout.showNotificationsMenu || false;
        this._showNotificationsBar = this._config.AppConfig.Layout.showNotificationsBar || false;
        this._enablePollingNotifications = this._config.AppConfig.Layout.enablePollingNotifications || false;
        this._title = this._config.AppConfig.Layout.Header.title;
        this._api_url = this._config.AppConfig.SITE;

        if (Tools.Configurazione) {
            const _dashboardRemoteConfig: any = this.authenticationService._getConfigModule('dashboard');
            this._hasDashboard = _dashboardRemoteConfig.abilitato || false;
            const _servizioRemoteConfig: any = this.authenticationService._getConfigModule('servizio');
            this._showTaxonomies = _servizioRemoteConfig.tassonomie_abilitate || false;
        }

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
            this._contentLimeted = Tools.CurrentApplication.menu.action === 'dashboard';
        }

        this.router.events.pipe(
            filter((event: any) => event instanceof NavigationEnd)
        ).subscribe(event => {
            // this._contentLimeted = true;
            // const root = this.router.routerState.snapshot.root;
        });

        this.initLanguages();
        this.initMenuActions();
        this.onResize();
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
            this._contentLimeted = !event;
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

        // setTimeout(async () => {}, 200);
        this.loadProfile();
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
    }

    loadProfile() {
        this._spin = true;
        this.apiService.getList('profilo').subscribe({
            next: (response: any) => {
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
            this._showNotificationsMenu = false;
            this._showNotificationsBar = false;
            this.loggedIn = false;
            this.login = this._loginEnabled;
            this.username = '';
        } else {
            this._enablePollingNotifications = this._config.AppConfig.Layout.enablePollingNotifications || false;
            this._showNotificationsMenu = this._config.AppConfig.Layout.showNotificationsMenu || false;
            this._showNotificationsBar = this._config.AppConfig.Layout.showNotificationsBar || false;
            this.notificationsCount$ = this.notificationsService.getNotificationsCount();
            this.loggedIn = (this._session.stato  === 'abilitato');
            this.login = (this._session.stato  === 'abilitato');
            this.username = (this._session?.utente?.email || this._session?.utente?.email_aziendale) || null;
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

    _onClickMenu(event: MouseEvent, item: INavData) {
        // Supporto apertura in nuova scheda con Ctrl+Click, Cmd+Click o middle-click
        const shouldOpenInNewTab = event.ctrlKey || event.metaKey || event.button === 1;
        if (shouldOpenInNewTab && item.url) {
            event.preventDefault();
            event.stopPropagation();
            // Gestisce sia url stringa che array di segmenti
            const url = Array.isArray(item.url) ? item.url.join('/') : item.url;
            window.open(url, '_blank');
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
        window.open(url, '_blank');
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
        // this._title = (Tools.CurrentApplication && Tools.CurrentApplication.menu) ? Tools.CurrentApplication.menu.title : this._config.AppConfig.Layout.Header.title;
        switch (event.menu.action) {
            case 'dashboard':
                this._contentLimeted = false;
                this.router.navigate([event.menu.url]);
                break
            default:
                this._contentLimeted = false;
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
