import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, EMPTY } from 'rxjs';
import { GpLayoutComponent } from './gp-layout.component';
import { Tools } from '@linkit/components';

describe('GpLayoutComponent', () => {
  let component: GpLayoutComponent;
  let savedConfigurazione: any;

  // Mocks
  let mockRouter: any;
  let mockLocation: any;
  let mockTranslate: any;
  let mockModalService: any;
  let mockOauthService: any;
  let mockConfigService: any;
  let mockEventsManagerService: any;
  let mockLocalStorageService: any;
  let mockBreadCrumbService: any;
  let mockAuthenticationService: any;
  let mockApiService: any;
  let mockNotificationsService: any;
  let mockDashboardService: any;
  let mockSidebarNavHelper: any;

  const mockConfig = {
    AppConfig: {
      SITE: 'http://localhost',
      Layout: {
        contentLimited: false,
        hasSideBar: true,
        showUsername: true,
        showHeaderBar: true,
        showSupHeaderBar: false,
        showFooterBar: false,
        showFooterExpander: false,
        supHeaderHeight: '0px',
        footerHeight: '48px',
        footerExpandedHeight: '48px',
        footerExpandedOver: false,
        forceMenuOpen: false,
        showVersion: false,
        showBuild: false,
        showAbout: false,
        showAboutMiniBox: false,
        showNewsArea: false,
        showLanguagesMenu: true,
        showNotificationsMenu: false,
        showNotificationsBar: false,
        enablePollingNotifications: false,
        enableOpenInNewTab: false,
        Header: { title: 'GovCat' },
        dashboard: { enabled: false, hideNotificationMenu: false }
      },
      AUTH_SETTINGS: {
        LOGIN_ENABLED: true,
        AUTOLOGIN: false,
        OAUTH: { AutoAuthDiscovery: false }
      },
      ANONYMOUS_ACCESS: false,
      Watermark: false,
      Languages: [
        { language: 'Italiano', alpha2Code: 'it', alpha3Code: 'ita' }
      ],
      DefaultLanguage: 'it',
      Scrollbar: { hidden: false, hideOnIdle: false }
    },
    NavMenu: []
  };

  beforeEach(() => {
    vi.useFakeTimers();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: {
        api: { auth_type: [], abilitato: true },
        generico: { abilitato: false },
        tassonomie_abilitate: false
      },
      dashboard: { abilitato: false },
      monitoraggio: { abilitato: false }
    };

    const routerEvents$ = new Subject<any>();
    mockRouter = {
      events: routerEvents$.asObservable(),
      navigate: vi.fn(),
      url: '/'
    };
    mockLocation = {
      prepareExternalUrl: vi.fn((url: string) => `/apicat-app${url}`)
    };
    mockTranslate = {
      instant: vi.fn((key: string) => key),
      onLangChange: new Subject<any>(),
      addLangs: vi.fn(),
      use: vi.fn(),
      currentLang: 'it',
      getBrowserLang: vi.fn().mockReturnValue('it')
    };
    mockModalService = {
      show: vi.fn().mockReturnValue({ content: { onClose: EMPTY } })
    };
    mockOauthService = {
      initCodeFlow: vi.fn(),
      setupAutomaticSilentRefresh: vi.fn()
    };
    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue(mockConfig),
      getConfig: vi.fn().mockReturnValue(of({})),
      getPage: vi.fn().mockReturnValue(of('')),
      _generateCustomFieldLabel: vi.fn()
    };
    mockEventsManagerService = {
      on: vi.fn(),
      broadcast: vi.fn(),
      off: vi.fn()
    };
    mockLocalStorageService = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      remove: vi.fn()
    };
    mockBreadCrumbService = {
      clearBreadcrumbs: vi.fn()
    };
    mockAuthenticationService = {
      getCurrentSession: vi.fn().mockReturnValue(null),
      setCurrentSession: vi.fn(),
      reloadSession: vi.fn().mockReturnValue({ settings: { version: '1.0' }, utente: { username: 'admin' } }),
      isAnonymous: vi.fn().mockReturnValue(true),
      isGestore: vi.fn().mockReturnValue(false),
      isCoordinatore: vi.fn().mockReturnValue(false),
      getRole: vi.fn().mockReturnValue(null),
      getUserName: vi.fn().mockReturnValue('admin'),
      hasPermission: vi.fn().mockReturnValue(true),
      hasMenuAmministrazione: vi.fn().mockReturnValue(false),
      verificacanPermessiMenuAmministrazione: vi.fn().mockReturnValue({ canRead: true }),
      _getConfigModule: vi.fn((module: string) => {
        if (module === 'dashboard') return { abilitato: false };
        if (module === 'servizio') return { tassonomie_abilitate: false, api: { abilitato: true, auth_type: [] }, generico: { abilitato: false } };
        if (module === 'monitoraggio') return { abilitato: false };
        return {};
      }),
      saveSettings: vi.fn()
    };
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [] })),
      getDetails: vi.fn().mockReturnValue(of({}))
    };
    mockNotificationsService = {
      getNotificationsCount: vi.fn().mockReturnValue(of({ count: 0 }))
    };
    mockDashboardService = {
      getDashboardCount: vi.fn().mockReturnValue(of(0))
    };
    mockSidebarNavHelper = {
      itemType: vi.fn(),
      isTitle: vi.fn(),
      isDivider: vi.fn(),
      isMenu: vi.fn(),
      hasIcon: vi.fn(),
      hasIconBs: vi.fn(),
      hasChildren: vi.fn()
    };

    component = new GpLayoutComponent(
      mockRouter as any,
      mockLocation as any,
      mockTranslate as any,
      mockModalService as any,
      mockOauthService as any,
      mockConfigService as any,
      mockEventsManagerService as any,
      mockLocalStorageService as any,
      mockBreadCrumbService as any,
      mockAuthenticationService as any,
      mockApiService as any,
      mockNotificationsService as any,
      mockDashboardService as any,
      mockSidebarNavHelper as any
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(GpLayoutComponent.Name).toBe('GpLayoutComponent');
  });

  it('should set PROFILE to false in localStorageService', () => {
    expect(mockLocalStorageService.setItem).toHaveBeenCalledWith('PROFILE', false);
  });

  it('should read config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect((component as any)._config).toBe(mockConfig);
  });

  it('should set _urlSite from config', () => {
    expect(component._api_url).toBe('http://localhost');
  });

  it('should set _title from config header', () => {
    expect(component._title).toBe('GovCat');
  });

  it('should set _loginEnabled from config', () => {
    expect(component._loginEnabled).toBe(true);
  });

  it('should set _autologin from config', () => {
    expect(component._autologin).toBe(false);
  });

  it('should have _isAnonymous true by default', () => {
    expect(component._isAnonymous).toBe(true);
  });

  it('should initialize languages', () => {
    expect(mockTranslate.addLangs).toHaveBeenCalled();
    expect(mockTranslate.use).toHaveBeenCalledWith('it');
  });

  it('should call initMenuActions', () => {
    expect(component._menuActions.length).toBeGreaterThan(0);
  });

  it('should set navItems from config or defaults', () => {
    expect(component.navItems).toBeDefined();
    expect(component.navItems.length).toBeGreaterThan(0);
  });

  it('should add logout action when autologin is false', () => {
    const logoutAction = component._menuActions.find((a: any) => a.action === 'logout');
    expect(logoutAction).toBeDefined();
  });

  describe('setHeaderBar', () => {
    it('should set anonymous mode when anonymous is true', () => {
      component.setHeaderBar(true);
      expect(component._enablePollingNotifications).toBe(false);
      expect(component._showNotificationsMenu).toBe(false);
      expect(component._showNotificationsBar).toBe(false);
      expect(component.loggedIn).toBe(false);
      expect(component.username).toBe('');
    });

    it('should set logged mode when anonymous is false', () => {
      (component as any)._session = { utente: { username: 'testuser' } };
      component.setHeaderBar(false);
      expect(component.loggedIn).toBe(true);
      expect(component.username).toBe('testuser');
    });
  });

  describe('_onMenuHeaderAction', () => {
    it('should navigate to login on login action', () => {
      component._onMenuHeaderAction({ menu: { action: 'login' } });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should navigate to notifications on notifications action', () => {
      component._onMenuHeaderAction({ menu: { action: 'notifications' } });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
    });

    it('should navigate to profile on profile action', () => {
      component._onMenuHeaderAction({ menu: { action: 'profile' } });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should navigate to settings on settings action', () => {
      component._onMenuHeaderAction({ menu: { action: 'settings' } });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('should navigate to login on logout action', () => {
      component._onMenuHeaderAction({ menu: { action: 'logout' } });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('__toggelCollapse', () => {
    it('should toggle sidebar collapsed state', () => {
      component._sideBarCollapsed = false;
      component.__toggelCollapse();
      expect(component._sideBarCollapsed).toBe(true);
      expect(component._sideBarCollapsedPinned).toBe(true);
      expect(component._sideBarOpened).toBe(false);
    });
  });

  describe('__openSideBar / __closeSideBar', () => {
    it('should open sidebar', () => {
      component.__openSideBar();
      expect(component._openSideBar).toBe(true);
    });

    it('should close sidebar', () => {
      component._openSideBar = true;
      component.__closeSideBar();
      expect(component._openSideBar).toBe(false);
    });
  });

  describe('_showMenu', () => {
    it('should hide adesioni for anonymous users', () => {
      component._isAnonymous = true;
      expect(component._showMenu({ path: 'adesioni' })).toBe(false);
    });

    it('should show adesioni for logged users', () => {
      component._isAnonymous = false;
      expect(component._showMenu({ path: 'adesioni' })).toBe(true);
    });

    it('should hide dashboard when not enabled', () => {
      component._isAnonymous = false;
      component._dashboardEnabled = false;
      expect(component._showMenu({ path: 'dashboard' })).toBe(false);
    });

    it('should show dashboard when enabled and logged in', () => {
      component._isAnonymous = false;
      component._dashboardEnabled = true;
      expect(component._showMenu({ path: 'dashboard' })).toBe(true);
    });

    it('should hide monitoraggio when not has dashboard', () => {
      component._hasDashboard = false;
      expect(component._showMenu({ path: 'monitoraggio' })).toBe(false);
    });

    it('should show monitoraggio when has dashboard', () => {
      component._hasDashboard = true;
      expect(component._showMenu({ path: 'monitoraggio' })).toBe(true);
    });

    it('should hide tassonomie when not enabled', () => {
      component._showTaxonomies = false;
      expect(component._showMenu({ path: 'tassonomie' })).toBe(false);
    });

    it('should show other menu items by default', () => {
      expect(component._showMenu({ path: 'servizi' })).toBe(true);
    });
  });

  describe('keyEvent', () => {
    it('should toggle _contentLimited on Ctrl+L', () => {
      const initial = component._contentLimited;
      component.keyEvent({ key: 'l', ctrlKey: true } as any);
      expect(component._contentLimited).toBe(!initial);
    });

    it('should not toggle on non-Ctrl+L', () => {
      const initial = component._contentLimited;
      component.keyEvent({ key: 'l', ctrlKey: false } as any);
      expect(component._contentLimited).toBe(initial);
    });
  });

  describe('_toggleExpandFooter', () => {
    it('should toggle _expandedFooter', () => {
      const event = { stopPropagation: vi.fn() };
      component._expandedFooter = false;
      component._toggleExpandFooter(event);
      expect(component._expandedFooter).toBe(true);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('_hasPermission', () => {
    it('should delegate to authenticationService', () => {
      component._hasPermission({ permission: 'ADMIN' });
      expect(mockAuthenticationService.hasPermission).toHaveBeenCalledWith('ADMIN', 'view');
    });
  });

  describe('_expandMenu', () => {
    it('should toggle expanded on items with children', () => {
      const item: any = { children: [{}], expanded: false };
      component._expandMenu(item);
      expect(item.expanded).toBe(true);
      component._expandMenu(item);
      expect(item.expanded).toBe(false);
    });

    it('should not toggle if no children', () => {
      const item: any = { expanded: false };
      component._expandMenu(item);
      expect(item.expanded).toBe(false);
    });
  });

  describe('_resetExpandMenu', () => {
    it('should set expanded false on all navItems', () => {
      component.navItems = [
        { expanded: true, label: 'a' },
        { expanded: true, label: 'b' }
      ];
      component._resetExpandMenu();
      expect(component.navItems.every((item: any) => item.expanded === false)).toBe(true);
    });
  });

  describe('_onChangeLanguage', () => {
    it('should change language when different', () => {
      mockTranslate.currentLang = 'it';
      component._onChangeLanguage({ language: { alpha2Code: 'en', alpha3Code: 'eng' } });
      expect(mockTranslate.use).toHaveBeenCalledWith('en');
      expect(component._language).toBe('eng');
    });

    it('should not change language when same', () => {
      mockTranslate.currentLang = 'it';
      const callCount = mockTranslate.use.mock.calls.length;
      component._onChangeLanguage({ language: { alpha2Code: 'it', alpha3Code: 'ita' } });
      // use is called once in constructor for init, should not be called again
      expect(mockTranslate.use.mock.calls.length).toBe(callCount);
    });
  });

  describe('fullContentClass / pageFullScrollClass / pageContentScrollClass', () => {
    it('should return fullContent value', () => {
      component.fullContent = true;
      expect(component.fullContentClass).toBe(true);
    });

    it('should compute pageFullScrollClass', () => {
      component.fullScroll = true;
      component.desktop = true;
      component.contentScroll = false;
      expect(component.pageFullScrollClass).toBe(true);
    });

    it('should compute pageContentScrollClass', () => {
      component.fullScroll = false;
      component.desktop = true;
      component.contentScroll = false;
      expect(component.pageContentScrollClass).toBe(true);
    });
  });

  describe('_applicationTitle', () => {
    it('should return the title from config', () => {
      expect(component._applicationTitle).toBe('GovCat');
    });
  });

  describe('showInfo', () => {
    it('should open modal if _showAbout is true', () => {
      component._showAbout = true;
      component.showInfo();
      expect(mockModalService.show).toHaveBeenCalled();
    });

    it('should not open modal if _showAbout is false', () => {
      component._showAbout = false;
      mockModalService.show.mockClear();
      component.showInfo();
      expect(mockModalService.show).not.toHaveBeenCalled();
    });
  });

  describe('mostra_versione remote config', () => {
    it('should set hideVersions=false when mostra_versione is enabled', () => {
      // Re-create with mostra_versione in servizio config
      mockAuthenticationService._getConfigModule = vi.fn((module: string) => {
        if (module === 'dashboard') return { abilitato: false };
        if (module === 'servizio') return { tassonomie_abilitate: false, mostra_versione: 'enabled', api: { abilitato: true, auth_type: [] }, generico: { abilitato: false } };
        if (module === 'monitoraggio') return { abilitato: false };
        return {};
      });
      component = new GpLayoutComponent(
        mockRouter as any, mockLocation as any, mockTranslate as any,
        mockModalService as any, mockOauthService as any, mockConfigService as any,
        mockEventsManagerService as any, mockLocalStorageService as any,
        mockBreadCrumbService as any, mockAuthenticationService as any,
        mockApiService as any, mockNotificationsService as any,
        mockDashboardService as any, mockSidebarNavHelper as any
      );
      expect((mockConfig.AppConfig as any).Services?.hideVersions).toBe(false);
    });

    it('should set hideVersions=true when mostra_versione is not enabled', () => {
      mockAuthenticationService._getConfigModule = vi.fn((module: string) => {
        if (module === 'dashboard') return { abilitato: false };
        if (module === 'servizio') return { tassonomie_abilitate: false, mostra_versione: 'disabled', api: { abilitato: true, auth_type: [] }, generico: { abilitato: false } };
        if (module === 'monitoraggio') return { abilitato: false };
        return {};
      });
      component = new GpLayoutComponent(
        mockRouter as any, mockLocation as any, mockTranslate as any,
        mockModalService as any, mockOauthService as any, mockConfigService as any,
        mockEventsManagerService as any, mockLocalStorageService as any,
        mockBreadCrumbService as any, mockAuthenticationService as any,
        mockApiService as any, mockNotificationsService as any,
        mockDashboardService as any, mockSidebarNavHelper as any
      );
      expect((mockConfig.AppConfig as any).Services?.hideVersions).toBe(true);
    });

    it('should not set hideVersions when mostra_versione is absent', () => {
      // Default mock has no mostra_versione - Services should not be created
      delete (mockConfig.AppConfig as any).Services;
      component = new GpLayoutComponent(
        mockRouter as any, mockLocation as any, mockTranslate as any,
        mockModalService as any, mockOauthService as any, mockConfigService as any,
        mockEventsManagerService as any, mockLocalStorageService as any,
        mockBreadCrumbService as any, mockAuthenticationService as any,
        mockApiService as any, mockNotificationsService as any,
        mockDashboardService as any, mockSidebarNavHelper as any
      );
      expect((mockConfig.AppConfig as any).Services).toBeUndefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
