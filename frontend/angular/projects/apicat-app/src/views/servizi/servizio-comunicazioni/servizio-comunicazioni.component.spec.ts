import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { ServizioComunicazioniComponent } from './servizio-comunicazioni.component';
import { Tools } from '@linkit/components';
import moment from 'moment';

describe('ServizioComunicazioniComponent', () => {
  let component: ServizioComunicazioniComponent;
  let savedConfigurazione: any;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) },
  } as any;
  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null),
  } as any;
  const mockRenderer = {
    addClass: vi.fn(),
    removeClass: vi.fn(),
  } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Layout: { enableOpenInNewTab: false },
        Services: { hideVersions: false },
      },
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn(), broadcast: vi.fn() } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob())),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canAdd: vi.fn().mockReturnValue(true),
    getUser: vi.fn().mockReturnValue({ id_utente: 'user-1' }),
  } as any;

  /** Helper to reset all mock implementations to defaults */
  function resetMockDefaults() {
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Layout: { enableOpenInNewTab: false },
        Services: { hideVersions: false },
      },
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockRouter.navigate.mockReset();
    mockApiService.getDetails.mockReturnValue(of({ ruoli: [], content: [], page: {} }));
    mockApiService.postElementRelated.mockReturnValue(of({}));
    mockApiService.download.mockReturnValue(of(new Blob()));
    mockTranslate.instant.mockImplementation((k: string) => k);
    mockAuthService.canAdd.mockReturnValue(true);
    mockAuthService.getUser.mockReturnValue({ id_utente: 'user-1' });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    resetMockDefaults();

    component = new ServizioComunicazioniComponent(
      mockRoute,
      mockRouter,
      mockRenderer,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManager,
      mockApiService,
      mockAuthService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioComunicazioniComponent.Name).toBe('ServizioComunicazioniComponent');
  });

  it('should set model to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should read config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeTruthy();
  });

  it('should initialize breadcrumbs', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('should have default sort values', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('should have targetOptionsServizio defined', () => {
    expect(component.targetOptionsServizio).toBeDefined();
    expect(component.targetOptionsServizio.length).toBe(4);
  });

  it('_setErrorCommunications should toggle error messages', () => {
    (component as any)._setErrorCommunications(true);
    expect((component as any)._error).toBe(true);
    expect((component as any)._message).toBe('APP.MESSAGE.ERROR.Default');

    (component as any)._setErrorCommunications(false);
    expect((component as any)._error).toBe(false);
    expect((component as any)._message).toBe('APP.MESSAGE.NoResults');
  });

  it('onBreadcrumb should navigate', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('_onCloseEdit should set _isEdit to false', () => {
    (component as any)._isEdit = true;
    component._onCloseEdit({});
    expect((component as any)._isEdit).toBe(false);
  });

  it('_toggleSender should toggle showSender', () => {
    component.showSender = false;
    component._toggleSender();
    expect(component.showSender).toBe(true);
    component._toggleSender();
    expect(component.showSender).toBe(false);
  });

  it('_timestampToMoment should return Date for truthy value', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    const result = component._timestampToMoment(0);
    expect(result).toBeNull();
  });

  it('mapGDateMessageVisible should return boolean', () => {
    const mDate = { format: vi.fn().mockReturnValue('01012026') };
    const mDateGroup = { format: vi.fn().mockReturnValue('31122025') };
    const result = component.mapGDateMessageVisible(mDate, mDateGroup);
    expect(typeof result).toBe('boolean');
  });

  it('_canAddMapper should return boolean', () => {
    const result = component._canAddMapper();
    expect(typeof result).toBe('boolean');
  });

  // =========================================================================
  // Constructor tests
  // =========================================================================

  describe('constructor', () => {
    it('should set _componentBreadcrumbs from route.data when componentBreadcrumbs is present', () => {
      const breadcrumbsData = {
        service: { id_servizio: '99' },
        breadcrumbs: [{ label: 'Parent', url: '/parent', type: 'link' }]
      };
      const routeWithData = {
        ...mockRoute,
        data: of({ componentBreadcrumbs: breadcrumbsData }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithData, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      expect(comp._componentBreadcrumbs).toEqual(breadcrumbsData);
    });

    it('should not set _componentBreadcrumbs when route.data has no componentBreadcrumbs', () => {
      const routeNoData = { ...mockRoute, data: of({}) };
      const comp = new ServizioComunicazioniComponent(
        routeNoData, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      expect(comp._componentBreadcrumbs).toBeNull();
    });

    it('should set hideVersions from config when true', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Layout: { enableOpenInNewTab: false },
          Services: { hideVersions: true },
        },
      });
      const comp = new ServizioComunicazioniComponent(
        mockRoute, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      expect(comp.hideVersions).toBe(true);
    });

    it('should set hideVersions to false when not in config', () => {
      expect(component.hideVersions).toBe(false);
    });

    it('should set service from router navigation state', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'TestService', versione: '1' }, grant: { ruoli: ['admin'] } } }
      });
      const comp = new ServizioComunicazioniComponent(
        mockRoute, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      expect(comp.service).toEqual({ nome: 'TestService', versione: '1' });
      expect(comp._grant).toEqual({ ruoli: ['admin'] });
    });

    it('should set service to null when no navigation state', () => {
      expect(component.service).toBeNull();
    });

    it('should set _fromDashboard=true when queryParams.from is dashboard', () => {
      const routeWithDashboard = {
        ...mockRoute,
        queryParams: of({ from: 'dashboard' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithDashboard, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      expect(comp._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard when queryParams.from is not dashboard', () => {
      const routeWithOther = {
        ...mockRoute,
        queryParams: of({ from: 'other' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithOther, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      expect(comp._fromDashboard).toBe(false);
    });

    it('should call _initSearchForm in constructor', () => {
      expect(component._formGroup).toBeDefined();
    });
  });

  // =========================================================================
  // ngOnInit tests
  // =========================================================================

  describe('ngOnInit', () => {
    it('should subscribe to route.params and load config when id is present', () => {
      component.ngOnInit();
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('communications');
    });

    it('should set id from params cid when cid is present', () => {
      const routeWithCid = {
        ...mockRoute,
        params: of({ id: '1', cid: '42' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithCid, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      comp.ngOnInit();
      expect(comp.id).toBe('42');
    });

    it('should not load when id is "new"', () => {
      const routeNew = {
        ...mockRoute,
        params: of({ id: 'new' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeNew, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      mockConfigService.getConfig.mockClear();
      comp.ngOnInit();
      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
    });

    it('should call _loadServizio when service is null', () => {
      const routeWithId = {
        ...mockRoute,
        params: of({ id: '5' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithId, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      comp.service = null;
      mockApiService.getDetails.mockClear();
      comp.ngOnInit();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '5', 'grant');
    });

    it('should call _loadServizioComunicazioni when service exists', () => {
      const routeWithId = {
        ...mockRoute,
        params: of({ id: '5' }),
      };
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'Svc', versione: '1' }, grant: { ruoli: ['referente'] } } }
      });
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      const comp = new ServizioComunicazioniComponent(
        routeWithId, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      mockApiService.getDetails.mockClear();
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      comp.ngOnInit();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '5', 'comunicazioni');
    });

    it('should set showSender true when grant has ruoli', () => {
      const routeWithId = {
        ...mockRoute,
        params: of({ id: '5' }),
      };
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'Svc', versione: '1' }, grant: { ruoli: ['admin'] } } }
      });
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      const comp = new ServizioComunicazioniComponent(
        routeWithId, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      comp.ngOnInit();
      expect(comp.showSender).toBe(true);
    });

    it('should set showSender false when grant has empty ruoli', () => {
      const routeWithId = {
        ...mockRoute,
        params: of({ id: '5' }),
      };
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'Svc', versione: '1' }, grant: { ruoli: [] } } }
      });
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      const comp = new ServizioComunicazioniComponent(
        routeWithId, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      comp.ngOnInit();
      expect(comp.showSender).toBe(false);
    });

    it('should handle queryParams with notificationId and messageid', () => {
      const routeWithNotif = {
        ...mockRoute,
        queryParams: of({ notificationId: 'nid-1', messageid: 'mid-1' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithNotif, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      // Spy before ngOnInit so the setTimeout callbacks use mocked versions
      vi.spyOn(comp, 'scrollToTop').mockImplementation(() => {});
      vi.spyOn(comp, '_highlightElem').mockImplementation(() => {});
      comp.ngOnInit();
      expect(comp._notificationId).toBe('nid-1');
      expect(comp._notificationMessageId).toBe('mid-1');
    });

    it('should handle queryParams with base64 notification', () => {
      const notifData = { id_notifica: 'nid-base64', entita: { id_entita: 'eid-base64' } };
      const b64 = btoa(encodeURI(JSON.stringify(notifData)));
      const routeWithB64Notif = {
        ...mockRoute,
        queryParams: of({ notification: b64 }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithB64Notif, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      vi.spyOn(comp, 'scrollToTop').mockImplementation(() => {});
      vi.spyOn(comp, '_highlightElem').mockImplementation(() => {});
      comp.ngOnInit();
      expect(comp._notification).toEqual(notifData);
      expect(comp._notificationId).toBe('nid-base64');
      expect(comp._notificationMessageId).toBe('eid-base64');
    });

    it('should reset notification fields when no notification params', () => {
      component._notification = { old: true };
      component._notificationId = 'old-id';
      component._notificationMessageId = 'old-mid';
      component.ngOnInit();
      expect(component._notification).toBeNull();
      expect(component._notificationId).toBe('');
      expect(component._notificationMessageId).toBe('');
    });
  });

  // =========================================================================
  // ngAfterContentChecked / ngOnDestroy / _onResize
  // =========================================================================

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window.innerWidth', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('_onResize', () => {
    it('should set desktop based on window width', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // =========================================================================
  // _initBreadcrumb tests
  // =========================================================================

  describe('_initBreadcrumb', () => {
    it('should build breadcrumbs with service name and version', () => {
      component.service = { nome: 'MyService', versione: '2', stato: 'pubblicato' };
      component.id = 10;
      component.hideVersions = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('MyService v. 2');
    });

    it('should build breadcrumbs with service name only when hideVersions is true', () => {
      component.service = { nome: 'MyService', versione: '2', stato: 'pubblicato' };
      component.id = 10;
      component.hideVersions = true;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('MyService');
    });

    it('should use id as fallback title when service is null and id is set', () => {
      component.service = null;
      component.id = 77;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('77');
    });

    it('should use translated New title when both service and id are falsy', () => {
      component.service = null;
      component.id = 0;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.New');
    });

    it('should build dashboard breadcrumbs when _fromDashboard is true', () => {
      component.service = { nome: 'MySvc', versione: '1', stato: 'bozza' };
      component.id = 5;
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should not use dashboard breadcrumbs when _componentBreadcrumbs is set even if _fromDashboard is true', () => {
      const cbData = {
        service: { id_servizio: '99' },
        breadcrumbs: [{ label: 'Services', url: '/servizi', type: 'link' }]
      } as any;
      component.service = { nome: 'MySvc', versione: '1', stato: 'bozza' };
      component.id = 5;
      component._fromDashboard = true;
      component._componentBreadcrumbs = cbData;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).not.toBe('APP.TITLE.Dashboard');
    });

    it('should use Components label when _componentBreadcrumbs is set', () => {
      const cbData = {
        service: { id_servizio: '99' },
        breadcrumbs: [{ label: 'Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' }, { label: 'SvcTitle', url: '/servizi/99', type: 'link' }]
      } as any;
      component.service = { nome: 'MySvc', versione: '1', stato: 'bozza' };
      component.id = 5;
      component._componentBreadcrumbs = cbData;
      component._fromDashboard = false;
      component._initBreadcrumb();
      const labelIndex = component.breadcrumbs.findIndex((b: any) => b.label === 'MySvc');
      expect(labelIndex).toBeGreaterThanOrEqual(0);
      const componentsLabel = component.breadcrumbs.find((b: any) => b.label === 'APP.TITLE.Components');
      expect(componentsLabel).toBeDefined();
    });

    it('should unshift _componentBreadcrumbs.breadcrumbs when in non-dashboard mode', () => {
      const cbData = {
        service: { id_servizio: '99' },
        breadcrumbs: [{ label: 'ParentBC', url: '/parent', type: 'link' }]
      } as any;
      component.service = { nome: 'MySvc', versione: '1', stato: 'bozza' };
      component.id = 5;
      component._componentBreadcrumbs = cbData;
      component._fromDashboard = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('ParentBC');
    });

    it('should include /view in url when localStorage SERVIZI_VIEW is TRUE', () => {
      localStorage.setItem('SERVIZI_VIEW', 'TRUE');
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.id = 5;
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].url).toContain('/view');
      localStorage.removeItem('SERVIZI_VIEW');
    });

    it('should NOT include /view in url when localStorage SERVIZI_VIEW is not TRUE', () => {
      localStorage.removeItem('SERVIZI_VIEW');
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.id = 5;
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].url).not.toContain('/view');
    });

    it('should set tooltip from service stato translation', () => {
      component.service = { nome: 'MySvc', versione: '1', stato: 'pubblicato' };
      component.id = 5;
      component._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
      expect(component.breadcrumbs[1].tooltip).toBe('APP.WORKFLOW.STATUS.pubblicato');
    });
  });

  // =========================================================================
  // _loadServizio tests
  // =========================================================================

  describe('_loadServizio', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should do nothing when id is 0', () => {
      mockApiService.getDetails.mockClear();
      component.id = 0;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load grant then service on success', () => {
      const mockGrant = { ruoli: ['referente_servizio'] };
      const mockService = { nome: 'Svc', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService))
        .mockReturnValueOnce(of({ content: [], page: {} }));
      component.id = 5;
      component._loadServizio();
      expect(component._grant).toEqual(mockGrant);
      expect(component.service).toEqual(mockService);
      expect(component.showSender).toBe(true);
      expect(component._spin).toBe(false);
    });

    it('should set showSender false when grant has empty ruoli', () => {
      const mockGrant = { ruoli: [] };
      const mockService = { nome: 'Svc', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService))
        .mockReturnValueOnce(of({ content: [], page: {} }));
      component.id = 5;
      component._loadServizio();
      expect(component.showSender).toBe(false);
    });

    it('should set showSender false when grant is null', () => {
      mockApiService.getDetails
        .mockReturnValueOnce(of(null))
        .mockReturnValueOnce(of({ nome: 'Svc', versione: '1', stato: 'bozza' }))
        .mockReturnValueOnce(of({ content: [], page: {} }));
      component.id = 5;
      component._loadServizio();
      expect(component.showSender).toBe(false);
    });

    it('should handle grant fetch error', () => {
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant error')));
      component.id = 5;
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should handle service fetch error after grant success', () => {
      const mockGrant = { ruoli: ['admin'] };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(throwError(() => new Error('service error')));
      component.id = 5;
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });

    it('should set _spin true then false during load', () => {
      const mockGrant = { ruoli: [] };
      const mockService = { nome: 'Svc', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService))
        .mockReturnValueOnce(of({ content: [], page: {} }));
      component.id = 5;
      component._loadServizio();
      expect(component._spin).toBe(false);
    });
  });

  // =========================================================================
  // _loadServizioComunicazioni tests
  // =========================================================================

  describe('_loadServizioComunicazioni', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should do nothing when id is 0', () => {
      mockApiService.getDetails.mockClear();
      component.id = 0;
      component._loadServizioComunicazioni();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should clear serviceCommunications and _links when url is empty', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.id = 5;
      component.serviceCommunications = [{ id: 1 }] as any;
      component._links = { next: { href: '/some/url' } };
      component._loadServizioComunicazioni(null, '');
      expect(component.serviceCommunications).toEqual([]);
    });

    it('should NOT clear serviceCommunications when url is provided', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.id = 5;
      component.serviceCommunications = [{ id: 'existing' }] as any;
      component._loadServizioComunicazioni(null, '/next/page');
      expect(component.serviceCommunications).toEqual([{ id: 'existing' }]);
    });

    it('should map content with string autore', () => {
      const response = {
        content: [
          { uuid: 'msg-1', data: '2026-01-15T10:00:00', autore: 'Mario Rossi' }
        ],
        page: { total: 1 },
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.serviceCommunications.length).toBe(1);
      expect(component.serviceCommunications[0].id).toBe('msg-1');
      expect(component.serviceCommunications[0].mittente).toBe('Mario Rossi');
      expect(component.serviceCommunications[0].date).toBeDefined();
      expect(component.serviceCommunications[0].time).toBeDefined();
    });

    it('should map content with object autore', () => {
      const response = {
        content: [
          { uuid: 'msg-2', data: '2026-01-15T10:00:00', autore: { nome: 'Luigi', cognome: 'Verdi' } }
        ],
        page: { total: 1 },
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.serviceCommunications[0].mittente).toBe('Luigi Verdi');
    });

    it('should map content with null autore to Anonimo', () => {
      const response = {
        content: [
          { uuid: 'msg-3', data: '2026-01-15T10:00:00', autore: null }
        ],
        page: { total: 1 },
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.serviceCommunications[0].mittente).toBe('Anonimo');
    });

    it('should map content with empty string autore to empty string', () => {
      const response = {
        content: [
          { uuid: 'msg-4', data: '2026-01-15T10:00:00', autore: '' }
        ],
        page: { total: 1 },
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.serviceCommunications[0].mittente).toBe('');
    });

    it('should set _paging and _links from response', () => {
      const response = {
        content: [],
        page: { total: 42 },
        _links: { next: { href: '/next' } },
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component._links).toEqual({ next: { href: '/next' } });
    });

    it('should append items when url is provided', () => {
      component.id = 5;
      component.serviceCommunications = [{ id: 'old-msg', mittente: 'Old' }] as any;
      const response = {
        content: [
          { uuid: 'new-msg', data: '2026-01-16T10:00:00', autore: 'Nuovo' }
        ],
        page: { total: 2 },
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component._loadServizioComunicazioni(null, '/next/page');
      expect(component.serviceCommunications.length).toBe(2);
      expect(component.serviceCommunications[0].id).toBe('old-msg');
      expect(component.serviceCommunications[1].id).toBe('new-msg');
    });

    it('should set _preventMultiCall to false after loading', () => {
      const response = {
        content: [
          { uuid: 'msg', data: '2026-01-16T10:00:00', autore: 'Test' }
        ],
        page: {},
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._preventMultiCall = true;
      component._loadServizioComunicazioni();
      expect(component._preventMultiCall).toBe(false);
    });

    it('should handle error', () => {
      mockApiService.getDetails.mockImplementation(() => throwError(() => new Error('comm error')));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._spin).toBe(false);
    });

    it('should handle null response gracefully', () => {
      mockApiService.getDetails.mockImplementation(() => of(null));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component._spin).toBe(false);
    });

    it('should handle response without content', () => {
      mockApiService.getDetails.mockImplementation(() => of({ page: { total: 0 }, _links: null }));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.serviceCommunications).toEqual([]);
      expect(component._spin).toBe(false);
    });

    it('should format date as DD/MM/YYYY and time as HH:mm:ss', () => {
      const response = {
        content: [
          { uuid: 'fmt', data: '2026-03-15T14:30:45', autore: 'Tester' }
        ],
        page: {},
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.serviceCommunications[0].date).toBe('15/03/2026');
      expect(component.serviceCommunications[0].time).toBe('14:30:45');
    });

    it('should store source in each mapped element', () => {
      const comm = { uuid: 'src-test', data: '2026-01-10T10:00:00', autore: 'Author', extra: 'data' };
      const response = { content: [comm], page: {}, _links: null };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.serviceCommunications[0].source).toEqual(comm);
    });

    it('should update mDateGroup as items are processed', () => {
      const response = {
        content: [
          { uuid: 'a', data: '2026-01-15T10:00:00', autore: 'A' },
          { uuid: 'b', data: '2026-01-16T10:00:00', autore: 'B' },
        ],
        page: {},
        _links: null,
      };
      mockApiService.getDetails.mockImplementation(() => of(response));
      component.id = 5;
      component._loadServizioComunicazioni();
      expect(component.mDateGroup).toBeDefined();
    });
  });

  // =========================================================================
  // mapGDateMessageVisible tests
  // =========================================================================

  describe('mapGDateMessageVisible', () => {
    it('should return true when dates differ and mDate is not today', () => {
      const todayStr = moment().format('DDMMYYYY');
      const mDate = { format: vi.fn().mockReturnValue('15012025') };
      const mDateGroup = { format: vi.fn().mockReturnValue('14012025') };
      const result = component.mapGDateMessageVisible(mDate, mDateGroup);
      if ('15012025' !== todayStr) {
        expect(result).toBe(true);
      }
    });

    it('should return false when both dates are the same', () => {
      const mDate = { format: vi.fn().mockReturnValue('15012026') };
      const mDateGroup = { format: vi.fn().mockReturnValue('15012026') };
      const result = component.mapGDateMessageVisible(mDate, mDateGroup);
      expect(result).toBe(false);
    });

    it('should return false when mDate is today', () => {
      const todayStr = moment().format('DDMMYYYY');
      const mDate = { format: vi.fn().mockReturnValue(todayStr) };
      const mDateGroup = { format: vi.fn().mockReturnValue('01012020') };
      const result = component.mapGDateMessageVisible(mDate, mDateGroup);
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // __loadMoreData tests
  // =========================================================================

  describe('__loadMoreData', () => {
    it('should call _loadServizioComunicazioni when _links.next exists and not preventMultiCall', () => {
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      component.id = 5;
      component._links = { next: { href: '/api/next?page=2' } };
      component._preventMultiCall = false;
      component.__loadMoreData();
      // _loadServizioComunicazioni sets _preventMultiCall back to false via _preventMultiCall = false in content mapping,
      // but first __loadMoreData sets it to true. With empty content, it stays as-is.
      // Verify through side effects: getDetails should have been called
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'comunicazioni');
    });

    it('should not load when _links is null', () => {
      mockApiService.getDetails.mockClear();
      component._links = null;
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not load when _links.next is null', () => {
      mockApiService.getDetails.mockClear();
      component._links = { next: null };
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not load when _preventMultiCall is true', () => {
      mockApiService.getDetails.mockClear();
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = true;
      component.__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _onEdit tests
  // =========================================================================

  describe('_onEdit', () => {
    it('should set _editCurrent and _isEdit when _useDialog is false', () => {
      component._useDialog = false;
      const param = { id: 'msg-1' };
      component._onEdit({}, param);
      expect(component._editCurrent).toBe(param);
      expect(component._isEdit).toBe(true);
    });

    it('should not set _editCurrent when _useDialog is true', () => {
      component._useDialog = true;
      const param = { id: 'msg-1' };
      component._onEdit({}, param);
      expect(component._editCurrent).toBeNull();
      expect(component._isEdit).toBe(false);
    });
  });

  // =========================================================================
  // _onSearch, _resetForm, _onSubmit tests
  // =========================================================================

  describe('_onSearch', () => {
    it('should set _filterData and call _loadServizioComunicazioni', () => {
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      component.id = 5;
      const values = [{ field: 'test', value: 'abc' }];
      component._onSearch(values);
      expect(component._filterData).toBe(values);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'comunicazioni');
    });
  });

  describe('_resetForm', () => {
    it('should reset _filterData and reload communications', () => {
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      component.id = 5;
      component._filterData = [{ field: 'old', value: 'data' }];
      component._resetForm();
      expect(component._filterData).toEqual([]);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'comunicazioni');
    });
  });

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch if searchBarForm exists', () => {
      const mockSearchBarForm = { _onSearch: vi.fn() };
      component.searchBarForm = mockSearchBarForm as any;
      component._onSubmit({});
      expect(mockSearchBarForm._onSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      (component as any).searchBarForm = undefined;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // =========================================================================
  // _onSubmitMessage tests
  // =========================================================================

  describe('_onSubmitMessage', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      component.service = { nome: 'TestService', versione: '1' };
      component.id = 5;
    });

    it('should post message with target on success', () => {
      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      const event = {
        form: {
          messaggio: 'Hello world',
          target: ['REFERENTI_SERVIZIO', 'ADERENTI'],
          includi_tecnici: true,
          allegati: null,
        }
      };
      component._onSubmitMessage(event);
      expect(mockApiService.postElementRelated).toHaveBeenCalledWith(
        'servizi', 5, 'messaggi',
        expect.objectContaining({
          oggetto: 'Servizio TestService',
          testo: 'Hello world',
          target: ['REFERENTI_SERVIZIO', 'ADERENTI'],
          includi_tecnici: true,
          allegati: [],
        })
      );
      expect(component._spinSend).toBe(false);
    });

    it('should post message without target when target is empty', () => {
      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      const event = {
        form: {
          messaggio: 'No target message',
          target: [],
          includi_tecnici: false,
          allegati: null,
        }
      };
      component._onSubmitMessage(event);
      expect(mockApiService.postElementRelated).toHaveBeenCalledWith(
        'servizi', 5, 'messaggi',
        expect.objectContaining({
          target: null,
        })
      );
    });

    it('should post message without target when target is null', () => {
      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      const event = {
        form: {
          messaggio: 'Null target',
          target: null,
          includi_tecnici: false,
          allegati: null,
        }
      };
      component._onSubmitMessage(event);
      expect(mockApiService.postElementRelated).toHaveBeenCalledWith(
        'servizi', 5, 'messaggi',
        expect.objectContaining({
          target: null,
        })
      );
    });

    it('should map allegati correctly', () => {
      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      const event = {
        form: {
          messaggio: 'With attachments',
          target: ['REFERENTI_SERVIZIO'],
          includi_tecnici: false,
          allegati: [
            { file: 'doc.pdf', type: 'application/pdf', data: 'base64data' },
            { file: 'img.png', type: 'image/png', data: 'imgdata' },
          ],
        }
      };
      component._onSubmitMessage(event);
      expect(mockApiService.postElementRelated).toHaveBeenCalledWith(
        'servizi', 5, 'messaggi',
        expect.objectContaining({
          allegati: [
            { filename: 'doc.pdf', estensione: 'application/pdf', content: 'base64data' },
            { filename: 'img.png', estensione: 'image/png', content: 'imgdata' },
          ],
        })
      );
    });

    it('should handle error on submit', () => {
      mockApiService.postElementRelated.mockReturnValue(throwError(() => new Error('submit error')));
      const event = {
        form: {
          messaggio: 'Fail',
          target: null,
          allegati: null,
        }
      };
      component._onSubmitMessage(event);
      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spinSend).toBe(false);
    });

    it('should set _spinSend true during submit', () => {
      const subj = new Subject();
      mockApiService.postElementRelated.mockReturnValue(subj.asObservable());
      const event = {
        form: {
          messaggio: 'Pending',
          target: null,
          allegati: null,
        }
      };
      component._onSubmitMessage(event);
      expect(component._spinSend).toBe(true);
      subj.next({});
      subj.complete();
    });

    it('should reload communications after successful submit', () => {
      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockImplementation(() => of({ content: [], page: {} }));
      const event = {
        form: {
          messaggio: 'Reload test',
          target: null,
          allegati: null,
        }
      };
      component._onSubmitMessage(event);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'comunicazioni');
    });
  });

  // =========================================================================
  // __onDownload tests
  // =========================================================================

  describe('__onDownload', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      (globalThis as any).saveAs = vi.fn();
    });

    afterEach(() => {
      delete (globalThis as any).saveAs;
    });

    it('should download and call saveAs on success', () => {
      const mockBody = new Blob(['test']);
      mockApiService.download.mockReturnValue(of({ body: mockBody }));
      component.id = 5;
      const message = { uuid: 'msg-uuid' };
      const attachment = { uuid: 'att-uuid', filename: 'report.pdf', estensione: 'application/pdf' };
      component.__onDownload(message, attachment);
      expect(mockApiService.download).toHaveBeenCalledWith('servizi', 5, 'messaggi/msg-uuid/allegati/att-uuid/download');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(mockBody, 'report.pdf');
    });

    it('should handle download error', () => {
      mockApiService.download.mockReturnValue(throwError(() => new Error('download error')));
      component.id = 5;
      const message = { uuid: 'msg-uuid' };
      const attachment = { uuid: 'att-uuid', filename: 'file.txt', estensione: 'text/plain' };
      component.__onDownload(message, attachment);
      expect(component._error).toBe(true);
      expect(Tools.OnError).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _toggleSender edge cases
  // =========================================================================

  describe('_toggleSender', () => {
    it('should toggle from true to false', () => {
      component.showSender = true;
      component._toggleSender();
      expect(component.showSender).toBe(false);
    });

    it('should toggle multiple times consistently', () => {
      component.showSender = false;
      component._toggleSender();
      component._toggleSender();
      component._toggleSender();
      expect(component.showSender).toBe(true);
    });
  });

  // =========================================================================
  // _onCloseNotificationBar tests
  // =========================================================================

  describe('_onCloseNotificationBar', () => {
    it('should navigate to servizi communications route', () => {
      component.id = 42;
      component._onCloseNotificationBar({});
      expect(mockRouter.navigate).toHaveBeenCalledWith(['servizi', 42, 'comunicazioni']);
    });
  });

  // =========================================================================
  // __mapDateGroup tests
  // =========================================================================

  describe('__mapDateGroup', () => {
    it('should return "Ieri" when date is yesterday', () => {
      const yesterday = moment().add(-1, 'days');
      const el = {
        mDate: yesterday,
        date: yesterday.format('DD/MM/YYYY'),
      };
      const result = component.__mapDateGroup(el);
      expect(result).toBe('Ieri');
    });

    it('should return formatted date when date is not yesterday', () => {
      const someDate = moment('2025-06-15');
      const el = {
        mDate: someDate,
        date: '15/06/2025',
      };
      const result = component.__mapDateGroup(el);
      expect(result).toBe('15/06/2025');
    });

    it('should return formatted date for today (not yesterday)', () => {
      const today = moment();
      const el = {
        mDate: today,
        date: today.format('DD/MM/YYYY'),
      };
      const result = component.__mapDateGroup(el);
      expect(result).toBe(today.format('DD/MM/YYYY'));
    });
  });

  // =========================================================================
  // _canAddMapper tests
  // =========================================================================

  describe('_canAddMapper', () => {
    it('should delegate to authenticationService.canAdd', () => {
      component.service = { nome: 'Svc', stato: 'bozza' };
      component._grant = { ruoli: ['admin'] } as any;
      mockAuthService.canAdd.mockReturnValue(true);
      expect(component._canAddMapper()).toBe(true);
      expect(mockAuthService.canAdd).toHaveBeenCalledWith('servizio', 'bozza', ['admin']);
    });

    it('should handle null service', () => {
      component.service = null;
      component._grant = { ruoli: ['admin'] } as any;
      mockAuthService.canAdd.mockReturnValue(false);
      expect(component._canAddMapper()).toBe(false);
      expect(mockAuthService.canAdd).toHaveBeenCalledWith('servizio', undefined, ['admin']);
    });

    it('should handle null grant', () => {
      component.service = { nome: 'Svc', stato: 'bozza' };
      component._grant = null;
      mockAuthService.canAdd.mockReturnValue(false);
      expect(component._canAddMapper()).toBe(false);
      expect(mockAuthService.canAdd).toHaveBeenCalledWith('servizio', 'bozza', undefined);
    });
  });

  // =========================================================================
  // _highlightElem tests
  // =========================================================================

  describe('_highlightElem', () => {
    it('should add and then remove highlight class when element is found', () => {
      vi.useFakeTimers();
      const mockElem = {} as HTMLElement;
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElem);
      component._highlightElem('test-id');
      expect(document.getElementById).toHaveBeenCalledWith('test-id');
      expect(mockRenderer.addClass).toHaveBeenCalledWith(mockElem, 'highlight');
      expect(mockRenderer.removeClass).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);
      expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockElem, 'highlight');
      vi.useRealTimers();
    });

    it('should not call renderer when element is not found', () => {
      vi.useFakeTimers();
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      component._highlightElem('missing-id');
      expect(mockRenderer.addClass).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2000);
      expect(mockRenderer.removeClass).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // scrollToTop tests
  // =========================================================================

  describe('scrollToTop', () => {
    it('should scroll to element when both scroller and target div exist', () => {
      vi.useFakeTimers();
      const mockScroller = { scrollTo: vi.fn(), offsetTop: 100 } as any;
      const mockDiv = { offsetTop: 500 } as any;
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'container-scroller') return mockScroller;
        if (id === 'target-id') return mockDiv;
        return null;
      });
      component.scrollToTop('target-id');
      vi.advanceTimersByTime(200);
      expect(mockScroller.scrollTo).toHaveBeenCalledWith({
        top: 400,
        behavior: 'smooth',
      });
      vi.useRealTimers();
    });

    it('should not throw when container-scroller is not found', () => {
      vi.useFakeTimers();
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      expect(() => {
        component.scrollToTop('some-id');
        vi.advanceTimersByTime(200);
      }).not.toThrow();
      vi.useRealTimers();
    });

    it('should not throw when target div is not found', () => {
      vi.useFakeTimers();
      const mockScroller = { scrollTo: vi.fn(), offsetTop: 0 } as any;
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'container-scroller') return mockScroller;
        return null;
      });
      expect(() => {
        component.scrollToTop('missing');
        vi.advanceTimersByTime(200);
      }).not.toThrow();
      expect(mockScroller.scrollTo).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // _isMime tests
  // =========================================================================

  describe('_isMime', () => {
    it('should return true when message autore matches current user', () => {
      mockAuthService.getUser.mockReturnValue({ id_utente: 'user-1' });
      const message = { autore: { id_utente: 'user-1' } };
      expect(component._isMime(message)).toBe(true);
    });

    it('should return false when message autore does not match current user', () => {
      mockAuthService.getUser.mockReturnValue({ id_utente: 'user-1' });
      const message = { autore: { id_utente: 'user-2' } };
      expect(component._isMime(message)).toBe(false);
    });

    it('should call authenticationService.getUser', () => {
      const message = { autore: { id_utente: 'any' } };
      mockAuthService.getUser.mockClear();
      component._isMime(message);
      expect(mockAuthService.getUser).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _initSearchForm tests
  // =========================================================================

  describe('_initSearchForm', () => {
    it('should create a new form group', () => {
      component._initSearchForm();
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup).toBeTruthy();
    });

    it('should create an empty form group', () => {
      component._initSearchForm();
      const controls = Object.keys(component._formGroup.controls);
      expect(controls.length).toBe(0);
    });
  });

  // =========================================================================
  // onBreadcrumb tests
  // =========================================================================

  describe('onBreadcrumb', () => {
    it('should navigate to event url preserving query params', () => {
      component.onBreadcrumb({ url: '/servizi/5/comunicazioni' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/5/comunicazioni'], { queryParamsHandling: 'preserve' });
    });

    it('should navigate to dashboard url', () => {
      component.onBreadcrumb({ url: '/dashboard' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], { queryParamsHandling: 'preserve' });
    });
  });

  // =========================================================================
  // _resetScroll tests
  // =========================================================================

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement', () => {
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // =========================================================================
  // _onSort tests
  // =========================================================================

  describe('_onSort', () => {
    it('should call console.log with the event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const event = { field: 'date', direction: 'desc' };
      component._onSort(event);
      expect(consoleSpy).toHaveBeenCalledWith(event);
      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // _setErrorCommunications edge cases
  // =========================================================================

  describe('_setErrorCommunications', () => {
    it('should set error messages when true', () => {
      component._setErrorCommunications(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set default messages when false', () => {
      component._setErrorCommunications(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // =========================================================================
  // _onCloseEdit tests
  // =========================================================================

  describe('_onCloseEdit', () => {
    it('should set _isEdit to false regardless of input', () => {
      component._isEdit = true;
      component._onCloseEdit(null);
      expect(component._isEdit).toBe(false);
    });
  });

  // =========================================================================
  // Full integration: constructor -> ngOnInit -> loadServizio -> loadComunicazioni
  // =========================================================================

  describe('full flow integration', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should load grant, service, then communications from ngOnInit when no navigation state', () => {
      const mockGrant = { ruoli: ['referente_servizio'] };
      const mockService = { nome: 'FullFlow', versione: '3', stato: 'pubblicato' };
      const mockComms = {
        content: [
          { uuid: 'c1', data: '2026-03-01T09:00:00', autore: { nome: 'John', cognome: 'Doe' } }
        ],
        page: { total: 1 },
        _links: null,
      };

      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService))
        .mockReturnValueOnce(of(mockComms));

      const routeWithId = {
        ...mockRoute,
        params: of({ id: '10' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithId, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      comp.ngOnInit();

      expect(comp._grant).toEqual(mockGrant);
      expect(comp.service).toEqual(mockService);
      expect(comp.showSender).toBe(true);
      expect(comp.serviceCommunications.length).toBe(1);
      expect(comp.serviceCommunications[0].mittente).toBe('John Doe');
    });

    it('should handle entire error flow gracefully', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('total failure')));

      const routeWithId = {
        ...mockRoute,
        params: of({ id: '10' }),
      };
      const comp = new ServizioComunicazioniComponent(
        routeWithId, mockRouter, mockRenderer, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockAuthService
      );
      comp.ngOnInit();

      expect(Tools.OnError).toHaveBeenCalled();
      expect(comp.service).toBeNull();
    });
  });
});
