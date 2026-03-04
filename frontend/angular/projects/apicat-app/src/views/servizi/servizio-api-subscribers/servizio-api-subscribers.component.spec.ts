import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { ServizioApiSubscribersComponent } from './servizio-api-subscribers.component';
import { Tools } from '@linkit/components';

describe('ServizioApiSubscribersComponent', () => {
  let component: ServizioApiSubscribersComponent;

  let mockRouteDataSubject: Subject<any>;
  let mockRouteParamsSubject: Subject<any>;
  let mockRouteQueryParamsSubject: Subject<any>;

  let mockRoute: any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
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

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getListPDND: vi.fn().mockReturnValue(of({ subscribers: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({})
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({})
  } as any;

  function createComponent() {
    return new ServizioApiSubscribersComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtils,
      mockAuthenticationService
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

    mockRouteDataSubject = new Subject<any>();
    mockRouteParamsSubject = new Subject<any>();
    mockRouteQueryParamsSubject = new Subject<any>();

    mockRoute = {
      data: mockRouteDataSubject.asObservable(),
      params: mockRouteParamsSubject.asObservable(),
      queryParams: mockRouteQueryParamsSubject.asObservable(),
      parent: { params: of({ id: '1' }) }
    } as any;

    component = createComponent();
  });

  // ==========================================
  // Existing tests (preserved)
  // ==========================================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiSubscribersComponent.Name).toBe('ServizioApiSubscribersComponent');
  });

  it('should have model set to api', () => {
    expect(component.model).toBe('api');
  });

  it('should read config from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.id).toBe(0);
    expect(component.sid).toBeNull();
    expect(component.environmentId).toBe('');
    expect(component.eserviceId).toBe('');
    expect(component.producerId).toBe('');
    expect(component.servizioapisubscribers).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    expect(component._hasTabCollaudo).toBe(false);
    expect(component._hasTabProduzione).toBe(false);
  });

  it('should set error messages on _setErrorMessages(true)', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should show choose environment message when no environmentId', () => {
    component.environmentId = '';
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
    expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
  });

  it('should show no results message when environmentId is set', () => {
    component.environmentId = 'collaudo';
    component._setErrorMessages(false);
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

  it('should set environmentId to collaudo on _showCollaudo', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
  });

  it('should set environmentId to produzione on _showProduzione', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
  });

  it('should return true for _isCollaudo when environmentId is collaudo', () => {
    component.environmentId = 'collaudo';
    expect(component._isCollaudo()).toBe(true);
    expect(component._isProduzione()).toBe(false);
  });

  it('should return true for _isProduzione when environmentId is produzione', () => {
    component.environmentId = 'produzione';
    expect(component._isProduzione()).toBe(true);
    expect(component._isCollaudo()).toBe(false);
  });

  it('should return false for _hasPDNDConfiguredMapper when no proprieta_custom', () => {
    component.servizioApi = null;
    expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
  });

  it('should set filterData on _onSearch', () => {
    const values = [{ field: 'q', value: 'test' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }] as any;
    component._resetForm();
    expect(component._filterData).toEqual([]);
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

  it('should not load subscribers if eserviceId or producerId are empty', () => {
    component.eserviceId = '';
    component.producerId = '';
    component.id = 10;
    component._loadServizioApiSubscribers();
    expect(mockApiService.getListPDND).not.toHaveBeenCalled();
  });

  // ==========================================
  // NEW TESTS
  // ==========================================

  // --- Constructor ---

  describe('constructor', () => {
    it('should set _componentBreadcrumbs from route data', () => {
      const breadcrumbsData = { service: { id_servizio: '5' }, breadcrumbs: [{ label: 'Parent' }] };
      mockRouteDataSubject.next({ componentBreadcrumbs: breadcrumbsData });
      expect(component._componentBreadcrumbs).toEqual(breadcrumbsData);
    });

    it('should not set _componentBreadcrumbs when route data has none', () => {
      mockRouteDataSubject.next({});
      expect(component._componentBreadcrumbs).toBeNull();
    });

    it('should call _initBreadcrumb when componentBreadcrumbs is available', () => {
      const spy = vi.spyOn(component, '_initBreadcrumb');
      const breadcrumbsData = { service: { id_servizio: '5' }, breadcrumbs: [{ label: 'Parent' }] };
      mockRouteDataSubject.next({ componentBreadcrumbs: breadcrumbsData });
      expect(spy).toHaveBeenCalled();
    });

    it('should set service from navigation extras state', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'TestService' }, grant: { role: 'admin' } } }
      });
      const comp = createComponent();
      expect(comp.service).toEqual({ nome: 'TestService' });
      expect(comp._grant).toEqual({ role: 'admin' });
    });

    it('should set service to null when no navigation state', () => {
      mockRouter.getCurrentNavigation.mockReturnValue(null);
      const comp = createComponent();
      expect(comp.service).toBeNull();
    });

    it('should set _fromDashboard from queryParams', () => {
      mockRouteQueryParamsSubject.next({ from: 'dashboard' });
      expect(component._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard for other queryParams', () => {
      mockRouteQueryParamsSubject.next({ from: 'other' });
      expect(component._fromDashboard).toBe(false);
    });

    it('should call _initBreadcrumb when from=dashboard', () => {
      const spy = vi.spyOn(component, '_initBreadcrumb');
      mockRouteQueryParamsSubject.next({ from: 'dashboard' });
      expect(spy).toHaveBeenCalled();
    });

    it('should set hideVersions true when config has it', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } }
      });
      const comp = createComponent();
      expect(comp.hideVersions).toBe(true);
    });

    it('should default hideVersions false when config is missing', () => {
      mockConfigService.getConfiguration.mockReturnValue({});
      const comp = createComponent();
      expect(comp.hideVersions).toBe(false);
    });

    it('should initialize _formGroup with search fields', () => {
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup.get('organizationTaxCode')).toBeTruthy();
      expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
      expect(component._formGroup.get('creationDateTo')).toBeTruthy();
    });
  });

  // --- ngOnInit ---

  describe('ngOnInit', () => {
    it('should subscribe to route params and set sid/id', () => {
      component.ngOnInit();
      mockRouteParamsSubject.next({ id: 'svc-1', aid: '20', id_ambiente: 'collaudo' });
      expect(component.sid).toBe('svc-1');
      expect(component.id).toBe('20');
      // environmentId gets overridden by _autoSelectTab when service loads
    });

    it('should use cid over id when cid is present', () => {
      component.ngOnInit();
      mockRouteParamsSubject.next({ id: 'svc-1', cid: 'cid-99', aid: '20' });
      expect(component.sid).toBe('cid-99');
    });

    it('should set environmentId initially from params (may be overridden by _autoSelectTab)', () => {
      // When id_ambiente is not in params, environmentId starts as ''
      // but _loadServizio -> _loadServizioApi -> _autoSelectTab may override it
      // We verify the params subscription sets it initially
      const configSubject = new Subject<any>();
      mockConfigService.getConfig.mockReturnValueOnce(configSubject.asObservable());
      component.ngOnInit();
      mockRouteParamsSubject.next({ id: 'svc-1', aid: '20' });
      // Before config resolves, environmentId should still be from params
      expect(component.environmentId).toBe('');
    });

    it('should call configService.getConfig(subscribers) when id is present', () => {
      component.ngOnInit();
      mockRouteParamsSubject.next({ id: 'svc-1', aid: '20' });
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('subscribers');
    });

    it('should call _loadServizio when service is null after config loads', () => {
      const spy = vi.spyOn(component, '_loadServizio');
      component.service = null;
      component.ngOnInit();
      mockRouteParamsSubject.next({ id: 'svc-1', aid: '20' });
      expect(spy).toHaveBeenCalled();
    });

    it('should call _initBreadcrumb and _autoSelectTab when service already exists', () => {
      component.service = { nome: 'Existing' };
      const breadcrumbSpy = vi.spyOn(component, '_initBreadcrumb');
      const autoSelectSpy = vi.spyOn(component, '_autoSelectTab');
      component.ngOnInit();
      mockRouteParamsSubject.next({ id: 'svc-1', aid: '20' });
      expect(breadcrumbSpy).toHaveBeenCalled();
      expect(autoSelectSpy).toHaveBeenCalled();
    });

    it('should set _updateMapper when service already exists', () => {
      component.service = { nome: 'Existing' };
      component._updateMapper = '';
      component.ngOnInit();
      mockRouteParamsSubject.next({ id: 'svc-1', aid: '20' });
      expect(component._updateMapper).not.toBe('');
    });

    it('should not do anything when _id is falsy', () => {
      const spy = vi.spyOn(component, '_loadServizio');
      component.ngOnInit();
      mockRouteParamsSubject.next({});
      expect(spy).not.toHaveBeenCalled();
    });

    it('should subscribe to queryParams and set producerIdCollaudo/Produzione', () => {
      component.ngOnInit();
      mockRouteQueryParamsSubject.next({ producerIdCollaudo: 'pc-1', producerIdProduzione: 'pp-2' });
      expect(component.producerIdCollaudo).toBe('pc-1');
      expect(component.producerIdProduzione).toBe('pp-2');
    });

    it('should default producerIds to empty when not present', () => {
      component.ngOnInit();
      mockRouteQueryParamsSubject.next({});
      expect(component.producerIdCollaudo).toBe('');
      expect(component.producerIdProduzione).toBe('');
    });

    it('should call _loadServizioApiSubscribers on queryParams change', () => {
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component.ngOnInit();
      mockRouteQueryParamsSubject.next({});
      expect(spy).toHaveBeenCalled();
    });
  });

  // --- ngAfterContentChecked ---

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // --- _onResize ---

  describe('_onResize', () => {
    it('should set desktop based on window.innerWidth', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // --- _initBreadcrumb ---

  describe('_initBreadcrumb', () => {
    it('should build breadcrumbs with service name and version', () => {
      component.service = { nome: 'TestSvc', versione: '1.0', stato: 'pubblicato' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(5);
      expect(component.breadcrumbs[1].label).toBe('TestSvc v. 1.0');
    });

    it('should hide version when hideVersions is true', () => {
      component.service = { nome: 'TestSvc', versione: '1.0', stato: 'pubblicato' };
      component.hideVersions = true;
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('TestSvc');
    });

    it('should use id when name/version not available', () => {
      component.service = null;
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('10');
    });

    it('should show ... when no service and no id', () => {
      component.service = null;
      component.sid = 'svc-1';
      component.id = 0 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('...');
    });

    it('should build API title from servizioApi', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.servizioApi = { nome: 'ApiName', versione: '2.0' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('ApiName v. 2.0');
    });

    it('should use id for API title when servizioApi is null', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.servizioApi = null;
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('10');
    });

    it('should use translate New when no servizioApi and no id', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.servizioApi = null;
      component.sid = 'svc-1';
      component.id = 0 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('APP.TITLE.New');
    });

    it('should set tooltip from service stato', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'pubblicato' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
    });

    it('should set breadcrumbs with componentBreadcrumbs prefix', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: [{ label: 'ParentBC', url: '/parent' }]
      } as any;
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      // unshift adds at beginning
      expect(component.breadcrumbs[0].label).toBe('ParentBC');
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
    });

    it('should use Components label when _componentBreadcrumbs', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: []
      } as any;
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Components');
      expect(component.breadcrumbs[0].iconBs).toBe('');
      expect(component.breadcrumbs[0].tooltip).toBe('APP.TOOLTIP.ComponentsList');
    });

    it('should always show version in title when _componentBreadcrumbs is set', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: []
      } as any;
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.hideVersions = true;
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      // When _componentBreadcrumbs, title always includes version
      expect(component.breadcrumbs[1].label).toBe('Svc v. 1.0');
    });

    it('should use componenti base URL when _componentBreadcrumbs', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: []
      } as any;
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].url).toContain('/servizi/5/componenti/');
    });

    it('should set dashboard breadcrumb when _fromDashboard and no componentBreadcrumbs', () => {
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should NOT set dashboard breadcrumb when _fromDashboard and componentBreadcrumbs present', () => {
      component._fromDashboard = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: [{ label: 'Parent' }]
      } as any;
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ok' };
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).not.toBe('APP.TITLE.Dashboard');
    });

    it('should set empty tooltip when no service', () => {
      component.service = null;
      component.sid = 'svc-1';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].tooltip).toBe('');
    });
  });

  // --- _initSearchForm ---

  describe('_initSearchForm', () => {
    it('should initialize form controls', () => {
      component._initSearchForm();
      expect(component._formGroup.get('organizationTaxCode')).toBeTruthy();
      expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
      expect(component._formGroup.get('creationDateTo')).toBeTruthy();
    });

    it('should have empty default values', () => {
      component._initSearchForm();
      expect(component._formGroup.get('organizationTaxCode')!.value).toBe('');
      expect(component._formGroup.get('creationDateFrom')!.value).toBe('');
      expect(component._formGroup.get('creationDateTo')!.value).toBe('');
    });
  });

  // --- _loadServizio ---

  describe('_loadServizio', () => {
    it('should not call API when sid is null', () => {
      component.sid = null;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call grant then service details when sid is set', () => {
      component.sid = 'svc-1';
      const grantResponse = { role: 'admin' };
      const serviceResponse = { nome: 'TestSvc', versione: '1.0', stato: 'ok' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResponse))
        .mockReturnValueOnce(of(serviceResponse));
      component._loadServizio();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'svc-1', 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'svc-1');
    });

    it('should set _grant from grant response', () => {
      component.sid = 'svc-1';
      const grantResponse = { role: 'admin' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResponse))
        .mockReturnValueOnce(of({ nome: 'Svc' }));
      component._loadServizio();
      expect(component._grant).toEqual({ role: 'admin' });
    });

    it('should set service from service details response', () => {
      component.sid = 'svc-1';
      const serviceResponse = { nome: 'TestSvc', versione: '1.0' };
      mockApiService.getDetails
        .mockReturnValueOnce(of({ role: 'admin' }))
        .mockReturnValueOnce(of(serviceResponse));
      component._loadServizio();
      expect(component.service).toEqual(serviceResponse);
    });

    it('should call _initBreadcrumb after service loads', () => {
      component.sid = 'svc-1';
      const spy = vi.spyOn(component, '_initBreadcrumb');
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'Svc' }));
      component._loadServizio();
      expect(spy).toHaveBeenCalled();
    });

    it('should set _updateMapper after service loads', () => {
      component.sid = 'svc-1';
      component._updateMapper = '';
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'Svc' }));
      component._loadServizio();
      expect(component._updateMapper).not.toBe('');
    });

    it('should set _spin false after service loads', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'Svc' }));
      component._loadServizio();
      expect(component._spin).toBe(false);
    });

    it('should call _loadServizioApi after service loads', () => {
      component.sid = 'svc-1';
      const spy = vi.spyOn(component, '_loadServizioApi');
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'Svc' }));
      component._loadServizio();
      expect(spy).toHaveBeenCalled();
    });

    it('should set service null and _spin true at start', () => {
      component.sid = 'svc-1';
      component.service = { nome: 'Old' };
      component._spin = false;
      // Use a Subject to control when the API responds
      const grantSubject = new Subject<any>();
      mockApiService.getDetails.mockReturnValueOnce(grantSubject.asObservable());
      component._loadServizio();
      expect(component.service).toBeNull();
      expect(component._spin).toBe(true);
    });

    it('should call Tools.OnError on grant error', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant fail')));
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should call Tools.OnError on service details error', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(throwError(() => new Error('service fail')));
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should set _spin false on service details error', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(throwError(() => new Error('service fail')));
      component._loadServizio();
      expect(component._spin).toBe(false);
    });
  });

  // --- _loadServizioApi ---

  describe('_loadServizioApi', () => {
    it('should not call API when id is falsy', () => {
      component.id = 0;
      component._loadServizioApi();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call getDetails for api model with id', () => {
      component.id = 10 as any;
      mockApiService.getDetails.mockReturnValueOnce(of({ nome: 'Api1', versione: '1.0' }));
      component._loadServizioApi();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('api', 10);
    });

    it('should set servizioApi from response', () => {
      component.id = 10 as any;
      const apiResponse = { nome: 'Api1', versione: '1.0' };
      mockApiService.getDetails.mockReturnValueOnce(of(apiResponse));
      component._loadServizioApi();
      expect(component.servizioApi).toEqual(apiResponse);
    });

    it('should call _initBreadcrumb after api loads', () => {
      component.id = 10 as any;
      const spy = vi.spyOn(component, '_initBreadcrumb');
      mockApiService.getDetails.mockReturnValueOnce(of({ nome: 'Api1' }));
      component._loadServizioApi();
      expect(spy).toHaveBeenCalled();
    });

    it('should call _autoSelectTab after api loads', () => {
      component.id = 10 as any;
      const spy = vi.spyOn(component, '_autoSelectTab');
      mockApiService.getDetails.mockReturnValueOnce(of({ nome: 'Api1' }));
      component._loadServizioApi();
      expect(spy).toHaveBeenCalled();
    });

    it('should set servizioApi null at start', () => {
      component.id = 10 as any;
      component.servizioApi = { nome: 'Old' };
      const apiSubject = new Subject<any>();
      mockApiService.getDetails.mockReturnValueOnce(apiSubject.asObservable());
      component._loadServizioApi();
      expect(component.servizioApi).toBeNull();
    });

    it('should call Tools.OnError on api details error', () => {
      component.id = 10 as any;
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('api fail')));
      component._loadServizioApi();
      expect(Tools.OnError).toHaveBeenCalled();
    });
  });

  // --- _getEService ---

  describe('_getEService', () => {
    it('should return empty string when servizioApi is null', () => {
      component.servizioApi = null;
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string when proprieta_custom is empty', () => {
      component.servizioApi = { proprieta_custom: [] };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should find eservice with new convention PDNDCollaudo_identificativo', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-123' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('eservice-123');
    });

    it('should find eservice with new convention PDNDProduzione_identificativo', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-prod-456' }]
        }]
      };
      expect(component._getEService('produzione')).toBe('eservice-prod-456');
    });

    it('should fallback to old convention PDNDCollaudo', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'old-eservice-123' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('old-eservice-123');
    });

    it('should fallback to old convention PDNDProduzione', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'old-eservice-prod' }]
        }]
      };
      expect(component._getEService('produzione')).toBe('old-eservice-prod');
    });

    it('should prefer new convention over old convention', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'new-eservice' }]
          },
          {
            gruppo: 'PDNDCollaudo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'old-eservice' }]
          }
        ]
      };
      expect(component._getEService('collaudo')).toBe('new-eservice');
    });

    it('should return empty when new convention group exists but property not found', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'other_property', valore: 'value' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty when new convention property valore is empty, and no old convention', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: '' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should fallback to old convention when new convention valore is empty', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: '' }]
          },
          {
            gruppo: 'PDNDCollaudo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'fallback-value' }]
          }
        ]
      };
      expect(component._getEService('collaudo')).toBe('fallback-value');
    });

    it('should return empty when proprieta_custom has no matching group', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'OtherGroup',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'value' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should handle null valore in property gracefully', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: null }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('');
    });
  });

  // --- _hasPDNDConfiguredMapper ---

  describe('_hasPDNDConfiguredMapper', () => {
    it('should return true when eservice found for collaudo', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'abc-123' }]
        }]
      };
      expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(true);
    });

    it('should return true when eservice found for produzione', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'prod-123' }]
        }]
      };
      expect(component._hasPDNDConfiguredMapper('produzione')).toBe(true);
    });

    it('should return false when no eservice found', () => {
      component.servizioApi = { proprieta_custom: [] };
      expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
    });
  });

  // --- _loadServizioApiSubscribers ---

  describe('_loadServizioApiSubscribers', () => {
    beforeEach(() => {
      component.id = 10 as any;
      component.eserviceId = 'eservice-1';
      component.producerId = 'producer-1';
      component.environmentId = 'collaudo';
    });

    it('should return early when eserviceId is empty', () => {
      component.eserviceId = '';
      component._loadServizioApiSubscribers();
      expect(mockApiService.getListPDND).not.toHaveBeenCalled();
    });

    it('should return early when producerId is empty', () => {
      component.producerId = '';
      component._loadServizioApiSubscribers();
      expect(mockApiService.getListPDND).not.toHaveBeenCalled();
    });

    it('should not call API when id is 0', () => {
      component.id = 0;
      component._loadServizioApiSubscribers();
      expect(mockApiService.getListPDND).not.toHaveBeenCalled();
    });

    it('should call getListPDND with environment/subscribers path', () => {
      mockApiService.getListPDND.mockReturnValueOnce(of({ subscribers: [], page: {} }));
      component._loadServizioApiSubscribers();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith('collaudo/subscribers', expect.anything(), '');
    });

    it('should set _spin true at start', () => {
      const subj = new Subject<any>();
      mockApiService.getListPDND.mockReturnValueOnce(subj.asObservable());
      component._spin = false;
      component._loadServizioApiSubscribers();
      expect(component._spin).toBe(true);
    });

    it('should reset servizioapisubscribers when no url', () => {
      component.servizioapisubscribers = [{ id: 'old' }] as any;
      mockApiService.getListPDND.mockReturnValueOnce(of({ subscribers: [], page: {} }));
      component._loadServizioApiSubscribers();
      expect(component.servizioapisubscribers).toEqual([]);
    });

    it('should reset _links when no url', () => {
      component._links = { next: { href: 'some' } };
      mockApiService.getListPDND.mockReturnValueOnce(of({ subscribers: [], page: {} }));
      component._loadServizioApiSubscribers();
      // After response, _links from response (or null)
    });

    it('should pass query with eserviceId and producerId', () => {
      mockApiService.getListPDND.mockReturnValueOnce(of({ subscribers: [], page: {} }));
      component._loadServizioApiSubscribers({ organizationTaxCode: 'abc' });
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({
          eserviceId: 'eservice-1',
          producerId: 'producer-1',
          organizationTaxCode: 'abc'
        })
      );
    });

    it('should map subscribers correctly', () => {
      const subscriberData = {
        subscribers: [
          {
            consumerId: 'consumer-1',
            externalId: { origin: 'IPA', id: '12345' },
            name: 'TestOrg'
          }
        ],
        page: { totalElements: 1 }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(subscriberData));
      component._loadServizioApiSubscribers();
      expect(component.servizioapisubscribers.length).toBe(1);
      expect(component.servizioapisubscribers[0].id).toBe('consumer-1');
      expect(component.servizioapisubscribers[0].editMode).toBe(false);
      expect(component.servizioapisubscribers[0].enableCollapse).toBe(true);
      expect(component.servizioapisubscribers[0].source.origin_external).toBe('IPA 12345');
    });

    it('should map multiple subscribers', () => {
      const subscriberData = {
        subscribers: [
          { consumerId: 'c-1', externalId: { origin: 'IPA', id: '1' }, name: 'Org1' },
          { consumerId: 'c-2', externalId: { origin: 'IPA', id: '2' }, name: 'Org2' },
          { consumerId: 'c-3', externalId: { origin: 'IPA', id: '3' }, name: 'Org3' }
        ],
        page: { totalElements: 3 }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(subscriberData));
      component._loadServizioApiSubscribers();
      expect(component.servizioapisubscribers.length).toBe(3);
    });

    it('should set _page from response', () => {
      const response = { subscribers: [], page: { totalElements: 42 } };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers();
      expect(component._page).toBeDefined();
    });

    it('should set _links from response', () => {
      const response = {
        subscribers: [],
        page: { totalElements: 0 },
        _links: { next: { href: 'http://next' } }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers();
      expect(component._links).toEqual({ next: { href: 'http://next' } });
    });

    it('should set _links to null when response has no _links', () => {
      const response = { subscribers: [], page: {} };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers();
      expect(component._links).toBeNull();
    });

    it('should set _allElements from page.totalElements', () => {
      const response = { subscribers: [], page: { totalElements: 42 } };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers();
      expect(component._allElements).toBe(42);
    });

    it('should set _allElements to 0 when page has no totalElements', () => {
      const response = { subscribers: [], page: {} };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers();
      expect(component._allElements).toBe(0);
    });

    it('should set _spin false after response', () => {
      mockApiService.getListPDND.mockReturnValueOnce(of({ subscribers: [], page: {} }));
      component._loadServizioApiSubscribers();
      expect(component._spin).toBe(false);
    });

    it('should reset _preventMultiCall after response with subscribers', () => {
      component._preventMultiCall = true;
      const response = {
        subscribers: [{ consumerId: 'c-1', externalId: { origin: 'O', id: '1' } }],
        page: { totalElements: 1 }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers();
      expect(component._preventMultiCall).toBe(false);
    });

    it('should append subscribers when url is provided (pagination)', () => {
      component.servizioapisubscribers = [{ id: 'existing', source: {} }] as any;
      const response = {
        subscribers: [{ consumerId: 'c-new', externalId: { origin: 'O', id: '1' } }],
        page: { totalElements: 2 }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers(null, 'http://next-page');
      // Should append, not replace
      expect(component.servizioapisubscribers.length).toBe(2);
      expect(component.servizioapisubscribers[0].id).toBe('existing');
      expect(component.servizioapisubscribers[1].id).toBe('c-new');
    });

    it('should replace subscribers when no url', () => {
      component.servizioapisubscribers = [{ id: 'existing', source: {} }] as any;
      const response = {
        subscribers: [{ consumerId: 'c-new', externalId: { origin: 'O', id: '1' } }],
        page: { totalElements: 1 }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(response));
      component._loadServizioApiSubscribers();
      expect(component.servizioapisubscribers.length).toBe(1);
      expect(component.servizioapisubscribers[0].id).toBe('c-new');
    });

    it('should not reset servizioapisubscribers when url is provided', () => {
      component.servizioapisubscribers = [{ id: 'existing' }] as any;
      const subj = new Subject<any>();
      mockApiService.getListPDND.mockReturnValueOnce(subj.asObservable());
      component._loadServizioApiSubscribers(null, 'http://next-page');
      // Before response, should NOT have been reset (url provided)
      expect(component.servizioapisubscribers.length).toBe(1);
    });

    it('should pass url directly to getListPDND', () => {
      mockApiService.getListPDND.mockReturnValueOnce(of({ subscribers: [], page: {} }));
      component._loadServizioApiSubscribers(null, 'http://next-page');
      expect(mockApiService.getListPDND).toHaveBeenCalledWith('collaudo/subscribers', undefined, 'http://next-page');
    });

    it('should handle error and set error messages', () => {
      mockApiService.getListPDND.mockReturnValueOnce(throwError(() => new Error('fail')));
      component._loadServizioApiSubscribers();
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    });

    it('should set _spin false on error', () => {
      mockApiService.getListPDND.mockReturnValueOnce(throwError(() => new Error('fail')));
      component._loadServizioApiSubscribers();
      expect(component._spin).toBe(false);
    });

    it('should reset _preventMultiCall on error', () => {
      component._preventMultiCall = true;
      mockApiService.getListPDND.mockReturnValueOnce(throwError(() => new Error('fail')));
      component._loadServizioApiSubscribers();
      expect(component._preventMultiCall).toBe(false);
    });

    it('should call _setErrorMessages(false) at start', () => {
      const spy = vi.spyOn(component, '_setErrorMessages');
      mockApiService.getListPDND.mockReturnValueOnce(of({ subscribers: [], page: {} }));
      component._loadServizioApiSubscribers();
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should handle null response gracefully', () => {
      mockApiService.getListPDND.mockReturnValueOnce(of(null));
      component._loadServizioApiSubscribers();
      expect(component._spin).toBe(false);
      expect(component._allElements).toBe(0);
    });

    it('should handle response with no subscribers key', () => {
      mockApiService.getListPDND.mockReturnValueOnce(of({ page: { totalElements: 0 } }));
      component._loadServizioApiSubscribers();
      expect(component.servizioapisubscribers).toEqual([]);
      expect(component._spin).toBe(false);
    });
  });

  // --- __loadMoreData ---

  describe('__loadMoreData', () => {
    it('should call _loadServizioApiSubscribers with next href when _links.next exists', () => {
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(spy).toHaveBeenCalledWith(null, 'http://next-page');
    });

    it('should set _preventMultiCall true before calling', () => {
      vi.spyOn(component, '_loadServizioApiSubscribers').mockImplementation(() => {});
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(component._preventMultiCall).toBe(true);
    });

    it('should not call when _preventMultiCall is true', () => {
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = true;
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call when _links is null', () => {
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component._links = null;
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call when _links.next is undefined', () => {
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component._links = {};
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call when _links.next is null', () => {
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component._links = { next: null };
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // --- _showCollaudo / _showProduzione ---

  describe('_showCollaudo', () => {
    it('should set environmentId to collaudo', () => {
      component.servizioApi = { proprieta_custom: [] };
      component._showCollaudo();
      expect(component.environmentId).toBe('collaudo');
    });

    it('should set eserviceId from _getEService for collaudo', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'col-es-1' }]
        }]
      };
      component._showCollaudo();
      expect(component.eserviceId).toBe('col-es-1');
    });

    it('should set producerId from producerIdCollaudo', () => {
      component.servizioApi = { proprieta_custom: [] };
      component.producerIdCollaudo = 'prod-col-1';
      component.producerIdProduzione = 'prod-prod-1';
      component._showCollaudo();
      expect(component.producerId).toBe('prod-col-1');
    });

    it('should call _loadServizioApiSubscribers with _filterData', () => {
      component.servizioApi = { proprieta_custom: [] };
      component._filterData = [{ field: 'test' }] as any;
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component._showCollaudo();
      expect(spy).toHaveBeenCalledWith([{ field: 'test' }]);
    });
  });

  describe('_showProduzione', () => {
    it('should set environmentId to produzione', () => {
      component.servizioApi = { proprieta_custom: [] };
      component._showProduzione();
      expect(component.environmentId).toBe('produzione');
    });

    it('should set eserviceId from _getEService for produzione', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'prod-es-1' }]
        }]
      };
      component._showProduzione();
      expect(component.eserviceId).toBe('prod-es-1');
    });

    it('should set producerId from producerIdProduzione', () => {
      component.servizioApi = { proprieta_custom: [] };
      component.producerIdCollaudo = 'prod-col-1';
      component.producerIdProduzione = 'prod-prod-1';
      component._showProduzione();
      expect(component.producerId).toBe('prod-prod-1');
    });

    it('should call _loadServizioApiSubscribers with _filterData', () => {
      component.servizioApi = { proprieta_custom: [] };
      component._filterData = [{ field: 'test' }] as any;
      const spy = vi.spyOn(component, '_loadServizioApiSubscribers');
      component._showProduzione();
      expect(spy).toHaveBeenCalledWith([{ field: 'test' }]);
    });
  });

  // --- _autoSelectTab ---

  describe('_autoSelectTab', () => {
    it('should set _hasTabCollaudo and _hasTabProduzione from _hasPDNDConfiguredMapper', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'col-1' }]
          },
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'prod-1' }]
          }
        ]
      };
      component._autoSelectTab();
      expect(component._hasTabCollaudo).toBe(true);
      expect(component._hasTabProduzione).toBe(true);
    });

    it('should auto-select collaudo when only collaudo is configured', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'col-1' }]
        }]
      };
      const spy = vi.spyOn(component, '_showCollaudo');
      component._autoSelectTab();
      expect(component._hasTabCollaudo).toBe(true);
      expect(component._hasTabProduzione).toBe(false);
      expect(spy).toHaveBeenCalled();
    });

    it('should auto-select produzione when only produzione is configured', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'prod-1' }]
        }]
      };
      const spy = vi.spyOn(component, '_showProduzione');
      component._autoSelectTab();
      expect(component._hasTabCollaudo).toBe(false);
      expect(component._hasTabProduzione).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('should not auto-select any tab when both are configured', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'col-1' }]
          },
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'prod-1' }]
          }
        ]
      };
      const collaudoSpy = vi.spyOn(component, '_showCollaudo');
      const produzioneSpy = vi.spyOn(component, '_showProduzione');
      component._autoSelectTab();
      expect(collaudoSpy).not.toHaveBeenCalled();
      expect(produzioneSpy).not.toHaveBeenCalled();
    });

    it('should call _showProduzione when neither is configured (collaudo false, so else branch)', () => {
      component.servizioApi = { proprieta_custom: [] };
      const spy = vi.spyOn(component, '_showProduzione');
      component._autoSelectTab();
      expect(component._hasTabCollaudo).toBe(false);
      expect(component._hasTabProduzione).toBe(false);
      expect(spy).toHaveBeenCalled();
    });
  });

  // --- _onSubmit ---

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      const mockSearchBarForm = { _onSearch: vi.fn() };
      component.searchBarForm = mockSearchBarForm as any;
      component._onSubmit({});
      expect(mockSearchBarForm._onSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // --- _onSort ---

  describe('_onSort', () => {
    it('should not throw on sort event', () => {
      expect(() => component._onSort({ field: 'date', direction: 'asc' })).not.toThrow();
    });
  });

  // --- _resetScroll ---

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // --- _setErrorMessages (additional cases) ---

  describe('_setErrorMessages additional', () => {
    it('should show ChooseEnvironment when error is false and environmentId is empty', () => {
      component.environmentId = '';
      component._setErrorMessages(false);
      expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
      expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
    });

    it('should show NoResults when error is false and environmentId is produzione', () => {
      component.environmentId = 'produzione';
      component._setErrorMessages(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // --- Edge cases / integration scenarios ---

  describe('integration scenarios', () => {
    it('should handle full _loadServizio chain from grant through api', () => {
      component.sid = 'svc-1';
      component.id = 10 as any;
      const grantResponse = { role: 'admin' };
      const serviceResponse = { nome: 'TestSvc', versione: '1.0', stato: 'ok' };
      const apiResponse = { nome: 'Api1', versione: '2.0', proprieta_custom: [] };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResponse))
        .mockReturnValueOnce(of(serviceResponse))
        .mockReturnValueOnce(of(apiResponse));
      component._loadServizio();
      expect(component._grant).toEqual(grantResponse);
      expect(component.service).toEqual(serviceResponse);
      expect(component.servizioApi).toEqual(apiResponse);
      expect(component._spin).toBe(false);
    });

    it('should properly chain _showCollaudo -> _loadServizioApiSubscribers -> response', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'es-col' }]
        }]
      };
      component.id = 10 as any;
      component.producerIdCollaudo = 'prod-col';
      const subscriberData = {
        subscribers: [{ consumerId: 'c-1', externalId: { origin: 'IPA', id: '99' } }],
        page: { totalElements: 1 }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(subscriberData));
      component._showCollaudo();
      expect(component.environmentId).toBe('collaudo');
      expect(component.eserviceId).toBe('es-col');
      expect(component.producerId).toBe('prod-col');
      expect(component.servizioapisubscribers.length).toBe(1);
    });

    it('should properly chain _showProduzione -> _loadServizioApiSubscribers -> response', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'es-prod' }]
        }]
      };
      component.id = 10 as any;
      component.producerIdProduzione = 'prod-prod';
      const subscriberData = {
        subscribers: [{ consumerId: 'c-2', externalId: { origin: 'IPA', id: '88' } }],
        page: { totalElements: 1 }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(subscriberData));
      component._showProduzione();
      expect(component.environmentId).toBe('produzione');
      expect(component.eserviceId).toBe('es-prod');
      expect(component.producerId).toBe('prod-prod');
      expect(component.servizioapisubscribers.length).toBe(1);
    });

    it('should handle pagination: initial load then load more', () => {
      component.id = 10 as any;
      component.eserviceId = 'es-1';
      component.producerId = 'p-1';
      component.environmentId = 'collaudo';

      // Initial load
      const firstPage = {
        subscribers: [{ consumerId: 'c-1', externalId: { origin: 'O', id: '1' } }],
        page: { totalElements: 2 },
        _links: { next: { href: 'http://page2' } }
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(firstPage));
      component._loadServizioApiSubscribers();
      expect(component.servizioapisubscribers.length).toBe(1);
      expect(component._links).toEqual({ next: { href: 'http://page2' } });

      // Load more
      const secondPage = {
        subscribers: [{ consumerId: 'c-2', externalId: { origin: 'O', id: '2' } }],
        page: { totalElements: 2 },
        _links: null
      };
      mockApiService.getListPDND.mockReturnValueOnce(of(secondPage));
      component.__loadMoreData();
      expect(component.servizioapisubscribers.length).toBe(2);
    });
  });

  // --- Additional default/edge values ---

  describe('additional defaults and edge cases', () => {
    it('should have default _preventMultiCall as false', () => {
      expect(component._preventMultiCall).toBe(false);
    });

    it('should have default desktop as false (or based on window)', () => {
      expect(typeof component.desktop).toBe('boolean');
    });

    it('should have default _useRoute as false', () => {
      expect(component._useRoute).toBe(false);
    });

    it('should have default _useDialog as true', () => {
      expect(component._useDialog).toBe(true);
    });

    it('should have default sortField as date', () => {
      expect(component.sortField).toBe('date');
    });

    it('should have default sortDirection as asc', () => {
      expect(component.sortDirection).toBe('asc');
    });

    it('should have default showHistory as true', () => {
      expect(component.showHistory).toBe(true);
    });

    it('should have default showSearch as true', () => {
      expect(component.showSearch).toBe(true);
    });

    it('should have default showSorting as true', () => {
      expect(component.showSorting).toBe(true);
    });

    it('should have default _errorSave as false', () => {
      expect(component._errorSave).toBe(false);
    });

    it('should have default _errorSaveMsg as false string', () => {
      expect(component._errorSaveMsg).toBe('false');
    });

    it('should have default _editCurrent as null', () => {
      expect(component._editCurrent).toBeNull();
    });

    it('should have default minLengthTerm as 1', () => {
      expect(component.minLengthTerm).toBe(1);
    });

    it('should have default anagrafiche as empty object', () => {
      expect(component.anagrafiche).toEqual({});
    });

    it('should have default _fromDashboard as false', () => {
      expect(component._fromDashboard).toBe(false);
    });

    it('should have producerIdCollaudo as empty string', () => {
      expect(component.producerIdCollaudo).toBe('');
    });

    it('should have producerIdProduzione as empty string', () => {
      expect(component.producerIdProduzione).toBe('');
    });

    it('should have _componentBreadcrumbs as null', () => {
      expect(component._componentBreadcrumbs).toBeNull();
    });

    it('should have default breadcrumbs with 5 items', () => {
      expect(component.breadcrumbs.length).toBe(5);
      expect(component.breadcrumbs[4].label).toBe('APP.TITLE.PDNDSubscribers');
    });
  });
});
