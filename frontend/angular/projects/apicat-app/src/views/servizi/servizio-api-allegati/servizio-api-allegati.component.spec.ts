import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { Tools } from '@linkit/components';
import { ServizioApiAllegatiComponent } from './servizio-api-allegati.component';

describe('ServizioApiAllegatiComponent', () => {
  let component: ServizioApiAllegatiComponent;
  let savedConfigurazione: any;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1', aid: '10' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) }
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null),
    url: '/servizi/1/api/10/allegati'
  } as any;

  const mockModalService = {
    show: vi.fn().mockReturnValue({
      content: { onClose: of(false) }
    })
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Services: { hideVersions: false }
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob()))
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    _confirmDelection: vi.fn()
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canAdd: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
    canTypeAttachment: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false)
  } as any;

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = null;
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    (globalThis as any).saveAs = vi.fn();
    component = new ServizioApiAllegatiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockApiService,
      mockUtils,
      mockAuthenticationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiAllegatiComponent.Name).toBe('ServizioAllegatiComponent');
  });

  it('should have model set to api', () => {
    expect(component.model).toBe('api');
  });

  it('should read config from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component.sid).toBeNull();
    expect(component.servizioApiAllegati).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component._isNew).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(true);
    expect(component._error).toBe(false);
    expect(component._downloading).toBe(false);
    expect(component._deleting).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should set error messages on _setErrorApi(true)', () => {
    component._setErrorApi(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages on _setErrorApi(false)', () => {
    component._setErrorApi(true);
    component._setErrorApi(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should convert timestamp to Date on _timestampToMoment', () => {
    const now = Date.now();
    const result = component._timestampToMoment(now);
    expect(result).toBeInstanceOf(Date);
  });

  it('should return null for zero timestamp', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should update sort on _onSort', () => {
    component._onSort({ sortField: 'nome', sortBy: 'desc' });
    expect(component.sortField).toBe('nome');
    expect(component.sortDirection).toBe('desc');
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }] as any;
    component.id = '10';
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should set filterData on _onSearch', () => {
    const values = [{ field: 'q', value: 'test' }];
    component.id = '10';
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  it('should reset error on __resetError', () => {
    component._error = true;
    component._errorMsg = 'some error';
    (component as any).__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should call authenticationService.canAdd on _canAddMapper', () => {
    component._canAddMapper();
    expect(mockAuthenticationService.canAdd).toHaveBeenCalled();
  });

  it('should call authenticationService.canEdit on _canEditMapper', () => {
    component._canEditMapper();
    expect(mockAuthenticationService.canEdit).toHaveBeenCalled();
  });

  it('should call authenticationService.canTypeAttachment on _canTypeAttachmentMapper', () => {
    component._canTypeAttachmentMapper('Generico');
    expect(mockAuthenticationService.canTypeAttachment).toHaveBeenCalled();
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should handle onActionMonitor unknown action', () => {
    mockRouter.navigate.mockClear();
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should have sort fields defined', () => {
    expect(component.sortFields).toEqual([
      { field: 'documento.filename', label: 'APP.LABEL.filename', icon: '' }
    ]);
  });

  // ========== Constructor tests ==========

  describe('constructor', () => {
    it('should set service and grant from router navigation state', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const navState = { service: { nome: 'test', versione: '1' }, grant: { ruoli: ['referente'] } };
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: { state: navState } });
      const comp = new ServizioApiAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp.service).toEqual(navState.service);
      expect(comp._grant).toEqual(navState.grant);
      mockRouter.getCurrentNavigation.mockReturnValue(null);
    });

    it('should set _componentBreadcrumbs from route data', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const breadcrumbData = { service: { id_servizio: '5' }, breadcrumbs: [{ label: 'Test' }] };
      const routeWithData = {
        data: of({ componentBreadcrumbs: breadcrumbData }),
        params: of({ id: '1', aid: '10' }),
        queryParams: of({}),
        parent: { params: of({ id: '1' }) }
      };
      const comp = new ServizioApiAllegatiComponent(
        routeWithData as any, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._componentBreadcrumbs).toEqual(breadcrumbData);
    });

    it('should not set _componentBreadcrumbs if route data has no componentBreadcrumbs', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const routeNoData = {
        data: of({}),
        params: of({ id: '1', aid: '10' }),
        queryParams: of({}),
        parent: { params: of({ id: '1' }) }
      };
      const comp = new ServizioApiAllegatiComponent(
        routeNoData as any, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._componentBreadcrumbs).toBeNull();
    });

    it('should set hideVersions true when config has hideVersions true', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } }
      });
      const comp = new ServizioApiAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp.hideVersions).toBe(true);
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { GOVAPI: { HOST: 'http://localhost' }, Services: { hideVersions: false } }
      });
    });

    it('should set _fromDashboard when queryParams has from=dashboard', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const routeWithDash = {
        data: of({}),
        params: of({ id: '1', aid: '10' }),
        queryParams: of({ from: 'dashboard' }),
        parent: { params: of({ id: '1' }) }
      };
      const comp = new ServizioApiAllegatiComponent(
        routeWithDash as any, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._fromDashboard).toBe(true);
    });

    it('should build _tipiVisibilitaAllegato from Configurazione filtering gestore for non-gestore users', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblico', 'gestore', 'aderente']
        }
      };
      mockAuthenticationService.isGestore.mockReturnValue(false);
      const comp = new ServizioApiAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._tipiVisibilitaAllegato).toEqual([
        { label: 'pubblico', value: 'pubblico' },
        { label: 'aderente', value: 'aderente' }
      ]);
    });

    it('should include gestore in _tipiVisibilitaAllegato when user is gestore', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblico', 'gestore', 'aderente']
        }
      };
      mockAuthenticationService.isGestore.mockReturnValue(true);
      const comp = new ServizioApiAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._tipiVisibilitaAllegato).toEqual([
        { label: 'pubblico', value: 'pubblico' },
        { label: 'gestore', value: 'gestore' },
        { label: 'aderente', value: 'aderente' }
      ]);
    });

    it('should handle null Configurazione in constructor', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      Tools.Configurazione = null;
      const comp = new ServizioApiAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._tipiVisibilitaAllegato).toBeUndefined();
    });

    it('should handle null navigation extras state', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: {} });
      const comp = new ServizioApiAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp.service).toBeNull();
      expect(comp._grant).toBeUndefined();
      mockRouter.getCurrentNavigation.mockReturnValue(null);
    });
  });

  // ========== ngOnInit tests ==========

  describe('ngOnInit', () => {
    it('should set _tipoAllegato to generico when URL ends with allegati', () => {
      mockRouter.url = '/servizi/1/api/10/allegati';
      component.ngOnInit();
      expect(component._tipoAllegato).toBe('generico');
    });

    it('should set _tipoAllegato to specifica when URL does not end with allegati', () => {
      mockRouter.url = '/servizi/1/api/10/specifica';
      component.ngOnInit();
      expect(component._tipoAllegato).toBe('specifica');
    });

    it('should subscribe to route params and set sid and id', () => {
      const paramsRoute = {
        data: of({}),
        params: of({ id: 'svc1', aid: 'api1' }),
        queryParams: of({}),
        parent: { params: of({ id: 'svc1' }) }
      } as any;
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const comp = new ServizioApiAllegatiComponent(
        paramsRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      comp.ngOnInit();
      expect(comp.sid).toBe('svc1');
      expect(comp.id).toBe('api1');
    });

    it('should use cid param as sid when cid is present', () => {
      const paramsRoute = {
        data: of({}),
        params: of({ id: 'svc1', cid: 'comp1', aid: 'api1' }),
        queryParams: of({}),
        parent: { params: of({ id: 'svc1' }) }
      } as any;
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const comp = new ServizioApiAllegatiComponent(
        paramsRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      comp.ngOnInit();
      expect(comp.sid).toBe('comp1');
    });

    it('should call _loadServizio when service is null', () => {
      component.service = null;
      mockApiService.getDetails.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should call _loadServizioApiAllegati when service is already set', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const navState = { service: { nome: 'svc', versione: '1', stato: 'pubblicato' }, grant: { ruoli: [] } };
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: { state: navState } });
      const comp = new ServizioApiAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      mockRouter.getCurrentNavigation.mockReturnValue(null);
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      comp.ngOnInit();
      // Should call getDetails for allegati (not for servizi since service is set)
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should subscribe to eventsManagerService PROFILE_UPDATE', () => {
      component.ngOnInit();
      expect(mockEventsManagerService.on).toHaveBeenCalled();
    });

    it('should set showAllAttachments from allegati config', () => {
      mockConfigService.getConfig.mockReturnValue(of({ showAllAttachments: true }));
      component.service = null;
      mockApiService.getDetails.mockReturnValue(of({}));
      component.ngOnInit();
      expect(component._showAllAttachments).toBe(true);
      mockConfigService.getConfig.mockReturnValue(of({}));
    });

    it('should not load when id is falsy', () => {
      const paramsRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const comp = new ServizioApiAllegatiComponent(
        paramsRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtils, mockAuthenticationService
      );
      mockApiService.getDetails.mockClear();
      comp.ngOnInit();
      // getDetails should not be called for allegati when there's no id
      expect(comp.sid).toBeNull();
    });
  });

  // ========== ngAfterContentChecked tests ==========

  describe('ngAfterContentChecked', () => {
    it('should set desktop to true when window width >= 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop to false when window width < 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(false);
    });
  });

  // ========== ngOnDestroy tests ==========

  describe('ngOnDestroy', () => {
    it('should exist and be callable', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // ========== _onResize tests ==========

  describe('_onResize', () => {
    it('should set desktop true when window >= 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop false when window < 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(false);
    });

    it('should set desktop true when window is exactly 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 992, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(true);
    });
  });

  // ========== _initBreadcrumb tests ==========

  describe('_initBreadcrumb', () => {
    it('should build breadcrumbs with service name and version', () => {
      component.service = { nome: 'MyService', versione: '2.0', stato: 'pubblicato' };
      component.servizioApi = { nome: 'MyApi', versione: '1.0' };
      component.sid = 'svc1';
      component.id = 'api1';
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(5);
      expect(component.breadcrumbs[1].label).toBe('MyService v. 2.0');
      expect(component.breadcrumbs[3].label).toBe('MyApi v. 1.0');
    });

    it('should hide version in breadcrumb when hideVersions is true', () => {
      component.service = { nome: 'MyService', versione: '2.0', stato: 'pubblicato' };
      component.hideVersions = true;
      component.sid = 'svc1';
      component.id = 'api1';
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('MyService');
    });

    it('should use id as fallback when service is null', () => {
      component.service = null;
      component.sid = 'svc1';
      component.id = 'api1';
      component._initBreadcrumb();
      // When service is null, title falls back to this.id (the API id)
      expect(component.breadcrumbs[1].label).toBe('api1');
    });

    it('should show ... when service is null and id is null', () => {
      component.service = null;
      component.sid = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('...');
    });

    it('should show API id as title when servizioApi is null but id exists', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.servizioApi = null;
      component.sid = 'svc1';
      component.id = 'api1';
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('api1');
    });

    it('should show New when servizioApi is null and id is null', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.servizioApi = null;
      component.sid = 'svc1';
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('APP.TITLE.New');
    });

    it('should set first breadcrumb to Dashboard when _fromDashboard is true', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.sid = 'svc1';
      component.id = 'api1';
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should NOT override first breadcrumb to Dashboard when _componentBreadcrumbs is set', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.sid = 'svc1';
      component.id = 'api1';
      component._fromDashboard = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: [{ label: 'Parent', url: '/parent', type: 'link' }]
      } as any;
      component._initBreadcrumb();
      // Should not be Dashboard because _componentBreadcrumbs is set
      expect(component.breadcrumbs[0].label).toBe('Parent');
    });

    it('should prepend componentBreadcrumbs when _componentBreadcrumbs is set', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.sid = 'svc1';
      component.id = 'api1';
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: [{ label: 'Comp1', url: '/comp1', type: 'link' }, { label: 'Comp2', url: '/comp2', type: 'link' }]
      } as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('Comp1');
      expect(component.breadcrumbs[1].label).toBe('Comp2');
      // The Components breadcrumb
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.Components');
    });

    it('should use Components label and componenti URL when _componentBreadcrumbs is set', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.sid = 'svc1';
      component.id = 'api1';
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: []
      } as any;
      component._initBreadcrumb();
      const mainBc = component.breadcrumbs[0];
      expect(mainBc.label).toBe('APP.TITLE.Components');
      expect(mainBc.url).toContain('componenti');
    });

    it('should always show version in breadcrumb title when _componentBreadcrumbs is set', () => {
      component.service = { nome: 'Svc', versione: '2', stato: 'bozza' };
      component.sid = 'svc1';
      component.id = 'api1';
      component.hideVersions = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: []
      } as any;
      component._initBreadcrumb();
      // With _componentBreadcrumbs, title always includes version
      const titleBc = component.breadcrumbs[1];
      expect(titleBc.label).toBe('Svc v. 2');
    });

    it('should call translate.instant for tooltip', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      component.sid = 'svc1';
      component.id = 'api1';
      component._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
    });
  });

  // ========== _initSearchForm tests ==========

  describe('_initSearchForm', () => {
    it('should create searchFields with 3 entries', () => {
      component._initSearchForm();
      expect(component.searchFields.length).toBe(3);
      expect(component.searchFields[0].field).toBe('q');
      expect(component.searchFields[1].field).toBe('tipologia_allegato');
      expect(component.searchFields[2].field).toBe('visibilita_allegato');
    });

    it('should create _formGroup with expected controls', () => {
      component._initSearchForm();
      expect(component._formGroup.get('q')).toBeTruthy();
      expect(component._formGroup.get('tipologia_allegato')).toBeTruthy();
      expect(component._formGroup.get('visibilita_allegato')).toBeTruthy();
    });

    it('should build enumValues for tipologia_allegato from Tools.TipiAllegati', () => {
      const savedTipi = Tools.TipiAllegati;
      (Tools as any).TipiAllegati = [
        { label: 'Generico', value: 'generico' },
        { label: 'Specifica', value: 'specifica' }
      ];
      component._initSearchForm();
      const tipoField = component.searchFields.find((f: any) => f.field === 'tipologia_allegato');
      expect(tipoField.enumValues).toEqual({
        'Generico': 'APP.ALLEGATI.TIPI.generico',
        'Specifica': 'APP.ALLEGATI.TIPI.specifica'
      });
      (Tools as any).TipiAllegati = savedTipi;
    });

    it('should build enumValues for visibilita_allegato from _tipiVisibilitaAllegato', () => {
      component._tipiVisibilitaAllegato = [
        { label: 'pubblico', value: 'pubblico' },
        { label: 'aderente', value: 'aderente' }
      ];
      component._initSearchForm();
      const visField = component.searchFields.find((f: any) => f.field === 'visibilita_allegato');
      expect(visField.enumValues).toEqual({
        'pubblico': 'APP.VISIBILITY.pubblico',
        'aderente': 'APP.VISIBILITY.aderente'
      });
    });

    it('should handle empty _tipiVisibilitaAllegato', () => {
      component._tipiVisibilitaAllegato = [];
      component._initSearchForm();
      const visField = component.searchFields.find((f: any) => f.field === 'visibilita_allegato');
      expect(visField.enumValues).toEqual({});
    });

    it('should handle undefined _tipiVisibilitaAllegato', () => {
      component._tipiVisibilitaAllegato = undefined as any;
      component._initSearchForm();
      const visField = component.searchFields.find((f: any) => f.field === 'visibilita_allegato');
      expect(visField.enumValues).toEqual({});
    });
  });

  // ========== _loadServizio tests ==========

  describe('_loadServizio', () => {
    it('should load service when sid is set', () => {
      component.sid = 'svc1';
      component.id = 'api1';
      const grantResponse = { ruoli: ['referente'] };
      const serviceResponse = { nome: 'Test', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResponse))
        .mockReturnValueOnce(of(serviceResponse))
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ content: [], page: {} }));
      (component as any)._loadServizio();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'svc1', 'grant');
      expect(component._grant).toEqual(grantResponse);
      expect(component.service).toEqual(serviceResponse);
      expect(component._spin).toBe(false);
    });

    it('should not load when sid is null', () => {
      component.sid = null;
      mockApiService.getDetails.mockClear();
      (component as any)._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should handle grant error', () => {
      component.sid = 'svc1';
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant fail')));
      (component as any)._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should handle service details error', () => {
      component.sid = 'svc1';
      const grantResponse = { ruoli: ['referente'] };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResponse))
        .mockReturnValueOnce(throwError(() => new Error('details fail')));
      (component as any)._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });

    it('should set _spin true at start and false at end', () => {
      component.sid = 'svc1';
      component.id = 'api1';
      const grantResponse = { ruoli: [] };
      const serviceResponse = { nome: 'T', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResponse))
        .mockReturnValueOnce(of(serviceResponse))
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ content: [], page: {} }));
      (component as any)._loadServizio();
      expect(component._spin).toBe(false);
    });

    it('should set service to null before loading', () => {
      component.sid = 'svc1';
      component.service = { nome: 'old' };
      mockApiService.getDetails.mockReturnValueOnce(of({})).mockReturnValue(of({}));
      (component as any)._loadServizio();
      // After successful load, service is set from response
      expect(component.service).toBeDefined();
    });
  });

  // ========== _loadServizioApi tests ==========

  describe('_loadServizioApi', () => {
    it('should load api details when id is set', () => {
      component.id = 'api1';
      const apiResponse = { nome: 'MyApi', versione: '1.0' };
      mockApiService.getDetails.mockReturnValue(of(apiResponse));
      (component as any)._loadServizioApi();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('api', 'api1');
      expect(component.servizioApi).toEqual(apiResponse);
    });

    it('should not load when id is null', () => {
      component.id = null;
      mockApiService.getDetails.mockClear();
      (component as any)._loadServizioApi();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should handle api details error', () => {
      component.id = 'api1';
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('api fail')));
      (component as any)._loadServizioApi();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should set servizioApi to null before loading', () => {
      component.id = 'api1';
      component.servizioApi = { nome: 'old' };
      mockApiService.getDetails.mockReturnValue(of({ nome: 'new' }));
      (component as any)._loadServizioApi();
      expect(component.servizioApi).toEqual({ nome: 'new' });
    });

    it('should call _initBreadcrumb after loading api', () => {
      component.id = 'api1';
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.sid = 'svc1';
      const apiResponse = { nome: 'Api', versione: '2' };
      mockApiService.getDetails.mockReturnValue(of(apiResponse));
      (component as any)._loadServizioApi();
      expect(component.servizioApi).toEqual(apiResponse);
      // breadcrumbs should reflect api name
      expect(component.breadcrumbs.some((b: any) => b.label.includes('Api'))).toBe(true);
    });
  });

  // ========== _loadServizioApiAllegati tests ==========

  describe('_loadServizioApiAllegati', () => {
    beforeEach(() => {
      component.id = 'api1';
    });

    it('should not load when id is null', () => {
      component.id = null;
      mockApiService.getDetails.mockClear();
      component._showLoading = true;
      (component as any)._loadServizioApiAllegati();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load allegati and map content to servizioApiAllegati', () => {
      const response = {
        content: [
          { uuid: 'a1', filename: 'doc.pdf' },
          { uuid: 'a2', filename: 'img.png' }
        ],
        page: { totalElements: 2 },
        _links: { next: null }
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioApiAllegati();
      expect(component.servizioApiAllegati.length).toBe(2);
      expect(component.servizioApiAllegati[0].id).toBe('a1');
      expect(component.servizioApiAllegati[0].source.uuid).toBe('a1');
      expect(component.servizioApiAllegati[1].id).toBe('a2');
    });

    it('should clear servizioApiAllegati when _showLoading and no url', () => {
      component.servizioApiAllegati = [{ id: 'old' }] as any;
      component._showLoading = true;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._loadServizioApiAllegati();
      expect(component.servizioApiAllegati).toEqual([]);
    });

    it('should append data when url is provided (infinite scroll)', () => {
      component.servizioApiAllegati = [{ id: 'existing', editMode: false, source: { uuid: 'existing' } }];
      const response = {
        content: [{ uuid: 'new1', filename: 'new.pdf' }],
        page: { totalElements: 2 },
        _links: {}
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioApiAllegati(null, 'http://next-page');
      expect(component.servizioApiAllegati.length).toBe(2);
      expect(component.servizioApiAllegati[0].id).toBe('existing');
      expect(component.servizioApiAllegati[1].id).toBe('new1');
    });

    it('should set _paging from response', () => {
      const response = {
        content: [],
        page: { totalElements: 10, size: 20, number: 0, totalPages: 1 },
        _links: {}
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioApiAllegati();
      expect(component._paging).toBeDefined();
    });

    it('should set _links from response', () => {
      const response = {
        content: [],
        page: {},
        _links: { next: { href: 'http://next' } }
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioApiAllegati();
      expect(component._links).toEqual({ next: { href: 'http://next' } });
    });

    it('should handle null response', () => {
      mockApiService.getDetails.mockReturnValue(of(null));
      (component as any)._loadServizioApiAllegati();
      expect(component._spin).toBe(false);
    });

    it('should handle response without content', () => {
      mockApiService.getDetails.mockReturnValue(of({ page: {}, _links: {} }));
      (component as any)._loadServizioApiAllegati();
      expect(component._spin).toBe(false);
    });

    it('should call ScrollTo(0) on success', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._loadServizioApiAllegati();
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should set _spin false and _showLoading true on success', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._loadServizioApiAllegati();
      expect(component._spin).toBe(false);
      expect(component._showLoading).toBe(true);
    });

    it('should set _spin false and _showLoading true on error', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      (component as any)._loadServizioApiAllegati();
      expect(component._spin).toBe(false);
      expect(component._showLoading).toBe(true);
    });

    it('should add tipologia_allegato to query when _showAllAttachments is false', () => {
      component._showAllAttachments = false;
      component._tipoAllegato = 'generico';
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._loadServizioApiAllegati();
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ tipologia_allegato: 'generico' })
      );
    });

    it('should NOT add tipologia_allegato to query when _showAllAttachments is true', () => {
      component._showAllAttachments = true;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._loadServizioApiAllegati();
      const callArgs = mockUtils._queryToHttpParams.mock.calls[0][0];
      expect(callArgs.tipologia_allegato).toBeUndefined();
    });

    it('should include sort in query when _showLoading and no url', () => {
      component._showLoading = true;
      component.sortField = 'documento.filename';
      component.sortDirection = 'asc';
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._loadServizioApiAllegati();
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'documento.filename,asc' })
      );
    });

    it('should reset _preventMultiCall on successful content load', () => {
      component._preventMultiCall = true;
      const response = {
        content: [{ uuid: 'a1' }],
        page: {},
        _links: {}
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioApiAllegati();
      expect(component._preventMultiCall).toBe(false);
    });

    it('should call _setErrorApi(false) at start', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._error = true;
      (component as any)._loadServizioApiAllegati();
      expect(component._error).toBe(false);
    });

    it('should merge query with sort params', () => {
      component._showLoading = true;
      const query = { q: 'test' };
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._loadServizioApiAllegati(query);
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'test', sort: expect.any(String) })
      );
    });

    it('should handle response with null _links', () => {
      const response = { content: [], page: {} };
      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioApiAllegati();
      expect(component._links).toBeNull();
    });
  });

  // ========== __loadMoreData tests ==========

  describe('__loadMoreData', () => {
    it('should load more data when _links.next exists and not preventMultiCall', () => {
      component.id = 'api1';
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = false;
      mockApiService.getDetails.mockReturnValue(of({ content: [{ uuid: 'x1' }], page: {} }));
      (component as any).__loadMoreData();
      // _preventMultiCall is set to true then reset to false when response has content
      expect(component._preventMultiCall).toBe(false);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should not load when _preventMultiCall is true', () => {
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = true;
      mockApiService.getDetails.mockClear();
      (component as any).__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not load when _links is null', () => {
      component._links = null;
      component._preventMultiCall = false;
      mockApiService.getDetails.mockClear();
      (component as any).__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not load when _links.next is null', () => {
      component._links = { next: null };
      component._preventMultiCall = false;
      mockApiService.getDetails.mockClear();
      (component as any).__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // ========== _onNew tests ==========

  describe('_onNew', () => {
    it('should call _editAllegato with no args (new allegato)', () => {
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });
      component._onNew();
      expect(mockModalService.show).toHaveBeenCalled();
      const initialState = mockModalService.show.mock.calls[0][1].initialState;
      expect(initialState.isNew).toBe(true);
      expect(initialState.isEdit).toBe(false);
      expect(initialState.current).toBeUndefined();
      expect(initialState.multiple).toBe(true);
    });
  });

  // ========== _onEdit tests ==========

  describe('_onEdit', () => {
    it('should call _editAllegato with data (edit allegato)', () => {
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });
      const data = { source: { uuid: 'a1', filename: 'doc.pdf' } };
      component._onEdit({}, data);
      expect(mockModalService.show).toHaveBeenCalled();
      const initialState = mockModalService.show.mock.calls[0][1].initialState;
      expect(initialState.isNew).toBe(false);
      expect(initialState.isEdit).toBe(true);
      expect(initialState.current).toEqual(data.source);
      expect(initialState.multiple).toBe(false);
    });

    it('should call searchBarForm._pinLastSearch if searchBarForm exists', () => {
      component.searchBarForm = { _pinLastSearch: vi.fn() } as any;
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });
      const data = { source: { uuid: 'a1' } };
      component._onEdit({}, data);
      expect(component.searchBarForm._pinLastSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });
      expect(() => component._onEdit({}, { source: {} })).not.toThrow();
    });
  });

  // ========== _onSubmit tests ==========

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch if searchBarForm exists', () => {
      component.searchBarForm = { _onSearch: vi.fn() } as any;
      component._onSubmit({});
      expect(component.searchBarForm._onSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // ========== _onSearch tests (additional) ==========

  describe('_onSearch (additional)', () => {
    it('should call _loadServizioApiAllegati with filter values', () => {
      component.id = 'api1';
      const values = [{ field: 'q', value: 'search' }];
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._onSearch(values);
      expect(component._filterData).toEqual(values);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // ========== _resetForm tests (additional) ==========

  describe('_resetForm (additional)', () => {
    it('should call _loadServizioApiAllegati with empty filter', () => {
      component.id = 'api1';
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._resetForm();
      expect(component._filterData).toEqual([]);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // ========== _onSort tests (additional) ==========

  describe('_onSort (additional)', () => {
    it('should call _loadServizioApiAllegati after setting sort', () => {
      component.id = 'api1';
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._onSort({ sortField: 'nome', sortBy: 'desc' });
      expect(component.sortField).toBe('nome');
      expect(component.sortDirection).toBe('desc');
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // ========== _resetScroll tests ==========

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // ========== _editAllegato tests ==========

  describe('_editAllegato', () => {
    it('should open modal with correct initialState for new allegato', () => {
      component.id = 'api1';
      component._showAllAttachments = false;
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });
      (component as any)._editAllegato();
      expect(mockModalService.show).toHaveBeenCalled();
      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].ignoreBackdropClick).toBe(true);
      const initialState = callArgs[1].initialState;
      expect(initialState.model).toBe('api');
      expect(initialState.id).toBe('api1');
      expect(initialState.current).toBeUndefined();
      expect(initialState.isNew).toBe(true);
      expect(initialState.isEdit).toBe(false);
      expect(initialState.showAllAttachments).toBe(false);
      expect(initialState.multiple).toBe(true);
    });

    it('should open modal with correct initialState for edit allegato', () => {
      component.id = 'api1';
      component._showAllAttachments = true;
      const data = { source: { uuid: 'a1', filename: 'test.pdf' } };
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });
      (component as any)._editAllegato(data);
      const initialState = mockModalService.show.mock.calls[0][1].initialState;
      expect(initialState.current).toEqual(data.source);
      expect(initialState.isNew).toBe(false);
      expect(initialState.isEdit).toBe(true);
      expect(initialState.showAllAttachments).toBe(true);
      expect(initialState.multiple).toBe(false);
    });

    it('should reload allegati when modal onClose emits true', () => {
      component.id = 'api1';
      mockModalService.show.mockReturnValue({
        content: { onClose: of(true) },
        hide: vi.fn()
      });
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any)._editAllegato();
      // getDetails should be called for reload
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should NOT reload allegati when modal onClose emits false', () => {
      component.id = 'api1';
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });
      mockApiService.getDetails.mockClear();
      (component as any)._editAllegato();
      // getDetails should NOT be called for reload when result is false
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // ========== _confirmDelection tests ==========

  describe('_confirmDelection', () => {
    it('should call utils._confirmDelection with data and callback', () => {
      const data = { source: { uuid: 'a1' } };
      component._confirmDelection(data);
      expect(mockUtils._confirmDelection).toHaveBeenCalledWith(data, expect.any(Function));
    });

    it('should bind __deleteAllegato as callback', () => {
      const data = { source: { uuid: 'a1' } };
      component._confirmDelection(data);
      const callback = mockUtils._confirmDelection.mock.calls[0][1];
      expect(typeof callback).toBe('function');
    });
  });

  // ========== __deleteAllegato tests ==========

  describe('__deleteAllegato', () => {
    it('should delete allegato and reload on success', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1' } };
      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any).__deleteAllegato(data);
      expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith('api', 'api1', 'allegati/a1');
      expect(component._deleting).toBe(false);
    });

    it('should set _deleting true during delete', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1' } };
      const subject = new Subject();
      mockApiService.deleteElementRelated.mockReturnValue(subject.asObservable());
      (component as any).__deleteAllegato(data);
      expect(component._deleting).toBe(true);
      subject.next({});
      subject.complete();
      expect(component._deleting).toBe(false);
    });

    it('should set _showLoading false before delete', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1' } };
      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any).__deleteAllegato(data);
      // _showLoading was set false, then after reload it's set true
      expect(component._showLoading).toBe(true);
    });

    it('should handle delete error', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1' } };
      mockApiService.deleteElementRelated.mockReturnValue(throwError(() => new Error('delete fail')));
      (component as any).__deleteAllegato(data);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._deleting).toBe(false);
    });

    it('should call __resetError before delete', () => {
      component.id = 'api1';
      component._error = true;
      component._errorMsg = 'old error';
      const data = { source: { uuid: 'a1' } };
      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      (component as any).__deleteAllegato(data);
      // After __resetError, _error is false (unless a new error occurs)
      // After successful delete, _error should remain false
      expect(component._error).toBe(false);
    });
  });

  // ========== _downloadAllegato tests ==========

  describe('_downloadAllegato', () => {
    it('should download allegato and call saveAs on success', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1', filename: 'doc.pdf' } };
      const blob = new Blob(['test']);
      mockApiService.download.mockReturnValue(of({ body: blob }));
      component._downloadAllegato(data);
      expect(mockApiService.download).toHaveBeenCalledWith('api', 'api1', 'allegati/a1/download');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'doc.pdf');
      expect(component._downloading).toBe(false);
    });

    it('should set _downloading true during download (index === -1)', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1', filename: 'doc.pdf' } };
      const subject = new Subject<any>();
      mockApiService.download.mockReturnValue(subject.asObservable());
      component._downloadAllegato(data);
      expect(component._downloading).toBe(true);
      subject.next({ body: new Blob() });
      subject.complete();
      expect(component._downloading).toBe(false);
    });

    it('should set _downloadings[index] true during download with index', () => {
      component.id = 'api1';
      component._downloadings = [false, false, false];
      const data = { source: { uuid: 'a1', filename: 'doc.pdf' } };
      const subject = new Subject<any>();
      mockApiService.download.mockReturnValue(subject.asObservable());
      component._downloadAllegato(data, 1);
      expect(component._downloadings[1]).toBe(true);
      expect(component._downloading).toBe(false);
      subject.next({ body: new Blob() });
      subject.complete();
      expect(component._downloadings[1]).toBe(false);
    });

    it('should handle download error with index === -1', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1', filename: 'doc.pdf' } };
      mockApiService.download.mockReturnValue(throwError(() => new Error('download fail')));
      component._downloadAllegato(data);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._downloading).toBe(false);
    });

    it('should handle download error with specific index', () => {
      component.id = 'api1';
      component._downloadings = [false, false, false];
      const data = { source: { uuid: 'a1', filename: 'doc.pdf' } };
      mockApiService.download.mockReturnValue(throwError(() => new Error('download fail')));
      component._downloadAllegato(data, 2);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._downloadings[2]).toBe(false);
      expect(component._downloading).toBe(false);
    });

    it('should call __resetError before download', () => {
      component.id = 'api1';
      component._error = true;
      component._errorMsg = 'old';
      const data = { source: { uuid: 'a1', filename: 'f.pdf' } };
      mockApiService.download.mockReturnValue(of({ body: new Blob() }));
      component._downloadAllegato(data);
      // After successful download, error should be reset
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });

    it('should use filename from source data', () => {
      component.id = 'api1';
      const data = { source: { uuid: 'a1', filename: 'my-special-doc.xlsx' } };
      mockApiService.download.mockReturnValue(of({ body: new Blob() }));
      component._downloadAllegato(data);
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(expect.anything(), 'my-special-doc.xlsx');
    });
  });

  // ========== _updateTipiAllegati tests ==========

  describe('_updateTipiAllegati', () => {
    it('should filter TipiAllegati based on canTypeAttachment', () => {
      const savedTipi = Tools.TipiAllegati;
      (Tools as any).TipiAllegati = [
        { label: 'Generico', value: 'generico' },
        { label: 'Specifica', value: 'specifica' }
      ];
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'] } as any;
      mockAuthenticationService.canTypeAttachment
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      component._updateTipiAllegati();
      expect(component._tipiAllegati.length).toBe(1);
      expect(component._tipiAllegati[0].value).toBe('generico');
      (Tools as any).TipiAllegati = savedTipi;
    });

    it('should include all types when all allowed', () => {
      const savedTipi = Tools.TipiAllegati;
      (Tools as any).TipiAllegati = [
        { label: 'Generico', value: 'generico' },
        { label: 'Specifica', value: 'specifica' }
      ];
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;
      mockAuthenticationService.canTypeAttachment.mockReturnValue(true);
      component._updateTipiAllegati();
      expect(component._tipiAllegati.length).toBe(2);
      (Tools as any).TipiAllegati = savedTipi;
    });

    it('should return empty when no types allowed', () => {
      const savedTipi = Tools.TipiAllegati;
      (Tools as any).TipiAllegati = [
        { label: 'Generico', value: 'generico' },
        { label: 'Specifica', value: 'specifica' }
      ];
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: [] } as any;
      mockAuthenticationService.canTypeAttachment.mockReturnValue(false);
      component._updateTipiAllegati();
      expect(component._tipiAllegati.length).toBe(0);
      (Tools as any).TipiAllegati = savedTipi;
    });
  });

  // ========== _canTypeAttachment tests ==========

  describe('_canTypeAttachment', () => {
    it('should call authenticationService.canTypeAttachment with correct params', () => {
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'] } as any;
      (component as any)._canTypeAttachment('generico');
      expect(mockAuthenticationService.canTypeAttachment).toHaveBeenCalledWith(
        'servizio', 'pubblicato', 'generico', ['referente']
      );
    });
  });

  // ========== _canTypeAttachmentMapper tests (additional) ==========

  describe('_canTypeAttachmentMapper (additional)', () => {
    it('should pass service stato and grant ruoli', () => {
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['admin'] } as any;
      component._canTypeAttachmentMapper('specifica');
      expect(mockAuthenticationService.canTypeAttachment).toHaveBeenCalledWith(
        'servizio', 'bozza', 'specifica', ['admin']
      );
    });

    it('should handle null service', () => {
      component.service = null;
      component._grant = { ruoli: [] } as any;
      component._canTypeAttachmentMapper('generico');
      expect(mockAuthenticationService.canTypeAttachment).toHaveBeenCalledWith(
        'servizio', undefined, 'generico', []
      );
    });
  });

  // ========== _canAddMapper tests (additional) ==========

  describe('_canAddMapper (additional)', () => {
    it('should pass service stato and grant ruoli', () => {
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'] } as any;
      component._canAddMapper();
      expect(mockAuthenticationService.canAdd).toHaveBeenCalledWith(
        'servizio', 'pubblicato', ['referente']
      );
    });

    it('should handle null service', () => {
      component.service = null;
      component._grant = null;
      component._canAddMapper();
      expect(mockAuthenticationService.canAdd).toHaveBeenCalledWith(
        'servizio', undefined, undefined
      );
    });
  });

  // ========== _canEditMapper tests (additional) ==========

  describe('_canEditMapper (additional)', () => {
    it('should pass service stato and grant ruoli', () => {
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'] } as any;
      component._canEditMapper();
      expect(mockAuthenticationService.canEdit).toHaveBeenCalledWith(
        'servizio', 'allegati', 'pubblicato', ['referente']
      );
    });

    it('should handle null service', () => {
      component.service = null;
      component._grant = null;
      component._canEditMapper();
      expect(mockAuthenticationService.canEdit).toHaveBeenCalledWith(
        'servizio', 'allegati', undefined, undefined
      );
    });
  });

  // ========== onActionMonitor tests (additional) ==========

  describe('onActionMonitor (additional)', () => {
    it('should navigate to the correct backview URL', () => {
      component.service = { id_servizio: '100' };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/100/view']);
    });

    it('should not navigate for empty action', () => {
      mockRouter.navigate.mockClear();
      component.onActionMonitor({ action: '' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ========== PROFILE_UPDATE event handling ==========

  describe('PROFILE_UPDATE event handling', () => {
    it('should register PROFILE_UPDATE handler in ngOnInit', () => {
      component.ngOnInit();
      const calls = mockEventsManagerService.on.mock.calls;
      const profileUpdateCall = calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(profileUpdateCall).toBeDefined();
    });

    it('should update _tipiVisibilitaAllegato on PROFILE_UPDATE event in ngOnInit', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblico', 'aderente']
        }
      };
      mockAuthenticationService.isGestore.mockReturnValue(false);
      component.ngOnInit();
      // Find the PROFILE:UPDATE callback from ngOnInit and invoke it
      const calls = mockEventsManagerService.on.mock.calls;
      const profileUpdateCall = calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(profileUpdateCall).toBeDefined();
      if (profileUpdateCall) {
        profileUpdateCall[1]({});
      }
      expect(component._tipiVisibilitaAllegato).toEqual([
        { label: 'pubblico', value: 'pubblico' },
        { label: 'aderente', value: 'aderente' }
      ]);
    });

    it('should filter gestore from visibilita on PROFILE_UPDATE when not gestore (ngOnInit handler)', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblico', 'gestore', 'aderente']
        }
      };
      mockAuthenticationService.isGestore.mockReturnValue(false);
      component.ngOnInit();
      const calls = mockEventsManagerService.on.mock.calls;
      const profileUpdateCall = calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(profileUpdateCall).toBeDefined();
      profileUpdateCall![1]({});
      expect(component._tipiVisibilitaAllegato).toEqual([
        { label: 'pubblico', value: 'pubblico' },
        { label: 'aderente', value: 'aderente' }
      ]);
    });

    it('should include gestore in visibilita on PROFILE_UPDATE when user is gestore (ngOnInit handler)', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblico', 'gestore']
        }
      };
      mockAuthenticationService.isGestore.mockReturnValue(true);
      component.ngOnInit();
      const calls = mockEventsManagerService.on.mock.calls;
      const profileUpdateCall = calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(profileUpdateCall).toBeDefined();
      profileUpdateCall![1]({});
      expect(component._tipiVisibilitaAllegato).toEqual([
        { label: 'pubblico', value: 'pubblico' },
        { label: 'gestore', value: 'gestore' }
      ]);
    });

    it('should call _initSearchForm after updating visibilita on PROFILE_UPDATE (ngOnInit)', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblico']
        }
      };
      component.ngOnInit();
      const calls = mockEventsManagerService.on.mock.calls;
      const profileUpdateCall = calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(profileUpdateCall).toBeDefined();
      profileUpdateCall![1]({});
      // searchFields should be rebuilt
      expect(component.searchFields.length).toBe(3);
    });

    it('should register PROFILE_UPDATE handler in _initBreadcrumb and invoke it', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblico', 'gestore', 'aderente']
        }
      };
      mockAuthenticationService.isGestore.mockReturnValue(false);
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.sid = 'svc1';
      component.id = 'api1';
      mockEventsManagerService.on.mockClear();
      component._initBreadcrumb();
      const calls = mockEventsManagerService.on.mock.calls;
      const profileUpdateCall = calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(profileUpdateCall).toBeDefined();
      profileUpdateCall![1]({});
      // gestore should be filtered out
      expect(component._tipiVisibilitaAllegato).toEqual([
        { label: 'pubblico', value: 'pubblico' },
        { label: 'aderente', value: 'aderente' }
      ]);
    });

    it('should include gestore in _initBreadcrumb PROFILE_UPDATE handler when user is gestore', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['gestore']
        }
      };
      mockAuthenticationService.isGestore.mockReturnValue(true);
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.sid = 'svc1';
      component.id = 'api1';
      mockEventsManagerService.on.mockClear();
      component._initBreadcrumb();
      const calls = mockEventsManagerService.on.mock.calls;
      const profileUpdateCall = calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(profileUpdateCall).toBeDefined();
      profileUpdateCall![1]({});
      expect(component._tipiVisibilitaAllegato).toEqual([
        { label: 'gestore', value: 'gestore' }
      ]);
    });
  });

  // ========== _setErrorApi / __resetError edge cases ==========

  describe('_setErrorApi edge cases', () => {
    it('should toggle error state correctly multiple times', () => {
      component._setErrorApi(true);
      expect(component._error).toBe(true);
      component._setErrorApi(true);
      expect(component._error).toBe(true);
      component._setErrorApi(false);
      expect(component._error).toBe(false);
      component._setErrorApi(false);
      expect(component._error).toBe(false);
    });
  });

  // ========== _timestampToMoment edge cases ==========

  describe('_timestampToMoment edge cases', () => {
    it('should handle negative timestamp', () => {
      const result = component._timestampToMoment(-1);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle very large timestamp', () => {
      const result = component._timestampToMoment(9999999999999);
      expect(result).toBeInstanceOf(Date);
    });
  });

  // ========== default properties tests ==========

  describe('default properties', () => {
    it('should have showHistory false', () => {
      expect(component.showHistory).toBe(false);
    });

    it('should have showSearch true', () => {
      expect(component.showSearch).toBe(true);
    });

    it('should have showSorting true', () => {
      expect(component.showSorting).toBe(true);
    });

    it('should have default sortField', () => {
      expect(component.sortField).toBe('documento.filename');
    });

    it('should have default sortDirection', () => {
      expect(component.sortDirection).toBe('asc');
    });

    it('should have simpleSearch false', () => {
      expect(component.simpleSearch).toBe(false);
    });

    it('should have useCondition false', () => {
      expect(component.useCondition).toBe(false);
    });

    it('should have _preventMultiCall false', () => {
      expect(component._preventMultiCall).toBe(false);
    });

    it('should have _showLoading true', () => {
      expect(component._showLoading).toBe(true);
    });

    it('should have _tipoAllegato as empty string by default', () => {
      // It's set to '' initially, then overridden in ngOnInit
      expect(typeof component._tipoAllegato).toBe('string');
    });

    it('should have _showAllAttachments false by default', () => {
      expect(component._showAllAttachments).toBe(false);
    });

    it('should have _fromDashboard false by default', () => {
      expect(component._fromDashboard).toBe(false);
    });

    it('should have _errorMsg as empty string', () => {
      expect(component._errorMsg).toBe('');
    });

    it('should have _editCurrent null', () => {
      expect(component._editCurrent).toBeNull();
    });

    it('should have _grant null by default (no navigation state)', () => {
      // When getCurrentNavigation returns null, _grant stays undefined
      expect(component._grant).toBeUndefined();
    });

    it('should have breadcrumbs with 5 default entries', () => {
      expect(component.breadcrumbs.length).toBe(5);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[4].label).toBe('APP.SERVICES.TITLE.Allegati');
    });

    it('should have Tools reference', () => {
      expect(component.Tools).toBe(Tools);
    });

    it('should have _paging as Page instance', () => {
      expect(component._paging).toBeDefined();
    });

    it('should have searchFields as empty array initially (set later by _initSearchForm)', () => {
      // _initSearchForm is called in constructor, so searchFields should be populated
      expect(component.searchFields.length).toBe(3);
    });
  });
});
