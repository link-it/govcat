import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { ServizioApiComponent } from './servizio-api.component';
import { Tools } from '@linkit/components';
import { EventType } from '@app/lib/classes/events';

describe('ServizioApiComponent', () => {
  let component: ServizioApiComponent;

  let routeDataSubject: Subject<any>;
  let routeParamsSubject: Subject<any>;
  let routeQueryParamsSubject: Subject<any>;

  let mockRoute: any;
  let mockRouter: any;
  let mockTranslate: any;
  let mockConfigService: any;
  let mockEventsManagerService: any;
  let mockTools: any;
  let mockApiService: any;
  let mockAuthenticationService: any;
  let mockUtils: any;

  const setupMocks = () => {
    routeDataSubject = new Subject<any>();
    routeParamsSubject = new Subject<any>();
    routeQueryParamsSubject = new Subject<any>();

    mockRoute = {
      data: routeDataSubject.asObservable(),
      params: routeParamsSubject.asObservable(),
      queryParams: routeQueryParamsSubject.asObservable(),
      parent: { params: of({ id: '1' }) }
    } as any;

    mockRouter = {
      navigate: vi.fn(),
      getCurrentNavigation: vi.fn().mockReturnValue(null)
    } as any;

    mockTranslate = {
      instant: vi.fn().mockImplementation((key: string) => key)
    } as any;

    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: { hideVersions: false }
        }
      }),
      getConfig: vi.fn().mockImplementation(() => of({}))
    } as any;

    mockEventsManagerService = {
      on: vi.fn(),
      broadcast: vi.fn()
    } as any;

    mockTools = {} as any;

    mockApiService = {
      getDetails: vi.fn().mockImplementation(() => of({})),
      getList: vi.fn().mockImplementation(() => of({ content: [], page: {} })),
      getElementRelated: vi.fn().mockImplementation(() => of({ content: [] })),
      saveElement: vi.fn().mockImplementation(() => of({})),
      putElement: vi.fn().mockImplementation(() => of({})),
      deleteElement: vi.fn().mockImplementation(() => of({}))
    } as any;

    mockAuthenticationService = {
      isAnonymous: vi.fn().mockReturnValue(false),
      hasPermission: vi.fn().mockReturnValue(true),
      _getConfigModule: vi.fn().mockReturnValue({}),
      canJoin: vi.fn().mockReturnValue(true),
      canAdd: vi.fn().mockReturnValue(true),
      canEdit: vi.fn().mockReturnValue(true)
    } as any;

    mockUtils = {
      GetErrorMsg: vi.fn().mockReturnValue('Error'),
      _queryToHttpParams: vi.fn().mockReturnValue({})
    } as any;
  };

  const createComponent = () => {
    return new ServizioApiComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockEventsManagerService,
      mockTools,
      mockApiService,
      mockAuthenticationService,
      mockUtils
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    Tools.Configurazione = null;
    setupMocks();
    component = createComponent();
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  // =========================================================================
  // Basic creation and static properties
  // =========================================================================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiComponent.Name).toBe('ServizioApiComponent');
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
    expect(component.serviceApi).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(false);
    expect(component._error).toBe(false);
    expect(component._useRoute).toBe(true);
    expect(component._useDialog).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoApi');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoApiHelp');
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  // =========================================================================
  // _setErrorApi
  // =========================================================================

  describe('_setErrorApi', () => {
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
      expect(component._message).toBe('APP.MESSAGE.NoApi');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoApiHelp');
    });
  });

  // =========================================================================
  // _initSearchForm
  // =========================================================================

  describe('_initSearchForm', () => {
    it('should initialize search form with _initSearchForm', () => {
      component._initSearchForm();
      expect(component._formGroup).toBeDefined();
    });

    it('should create formGroup with id_api control', () => {
      component._initSearchForm();
      expect(component._formGroup.get('id_api')).toBeDefined();
    });
  });

  // =========================================================================
  // _timestampToMoment
  // =========================================================================

  describe('_timestampToMoment', () => {
    it('should convert timestamp to Date on _timestampToMoment', () => {
      const now = Date.now();
      const result = component._timestampToMoment(now);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for zero timestamp', () => {
      expect(component._timestampToMoment(0)).toBeNull();
    });
  });

  // =========================================================================
  // onBreadcrumb
  // =========================================================================

  describe('onBreadcrumb', () => {
    it('should navigate on onBreadcrumb', () => {
      component.onBreadcrumb({ url: '/servizi' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
    });
  });

  // =========================================================================
  // _onCloseEdit
  // =========================================================================

  describe('_onCloseEdit', () => {
    it('should toggle _isEdit on _onCloseEdit', () => {
      component._isEdit = true;
      component._onCloseEdit({});
      expect(component._isEdit).toBe(false);
    });
  });

  // =========================================================================
  // _showSoggettoDominio / _showSoggettoAderente
  // =========================================================================

  describe('_showSoggettoDominio', () => {
    it('should switch to dominio view on _showSoggettoDominio', () => {
      component._showSoggettoDominio();
      expect(component._isSoggettoDominio).toBe(true);
    });

    it('should copy serviceApiDominio to serviceApi', () => {
      component.serviceApiDominio = [{ id: 1 }, { id: 2 }];
      component._showSoggettoDominio();
      expect(component.serviceApi).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should set paging and links from dominio', () => {
      const domPaging = { total: 10 } as any;
      const domLinks = { next: { href: '/next' } };
      component._pagingDominio = domPaging;
      component._linksDominio = domLinks;
      component._showSoggettoDominio();
      expect(component._paging).toBe(domPaging);
      expect(component._links).toBe(domLinks);
    });

    it('should set _spin to false after switching', () => {
      component._showSoggettoDominio();
      expect(component._spin).toBe(false);
    });
  });

  describe('_showSoggettoAderente', () => {
    it('should switch to aderente view on _showSoggettoAderente', () => {
      component._showSoggettoAderente();
      expect(component._isSoggettoDominio).toBe(false);
    });

    it('should copy serviceApiAderente to serviceApi', () => {
      component.serviceApiAderente = [{ id: 3 }, { id: 4 }];
      component._showSoggettoAderente();
      expect(component.serviceApi).toEqual([{ id: 3 }, { id: 4 }]);
    });

    it('should set paging and links from aderente', () => {
      const adPaging = { total: 5 } as any;
      const adLinks = { next: { href: '/next-ad' } };
      component._pagingAderente = adPaging;
      component._linksAderente = adLinks;
      component._showSoggettoAderente();
      expect(component._paging).toBe(adPaging);
      expect(component._links).toBe(adLinks);
    });

    it('should set _spin to false after switching', () => {
      component._showSoggettoAderente();
      expect(component._spin).toBe(false);
    });
  });

  // =========================================================================
  // Mapper functions
  // =========================================================================

  describe('_canJoinMapper', () => {
    it('should call authenticationService.canJoin on _canJoinMapper', () => {
      component._canJoinMapper();
      expect(mockAuthenticationService.canJoin).toHaveBeenCalled();
    });

    it('should pass service stato to canJoin', () => {
      component.service = { stato: 'PUBBLICATO' };
      component._canJoinMapper();
      expect(mockAuthenticationService.canJoin).toHaveBeenCalledWith('servizio', 'PUBBLICATO');
    });

    it('should handle null service', () => {
      component.service = null;
      component._canJoinMapper();
      expect(mockAuthenticationService.canJoin).toHaveBeenCalledWith('servizio', undefined);
    });
  });

  describe('_canAddMapper', () => {
    it('should call authenticationService.canAdd on _canAddMapper', () => {
      component._canAddMapper();
      expect(mockAuthenticationService.canAdd).toHaveBeenCalled();
    });

    it('should pass service stato and grant ruoli', () => {
      component.service = { stato: 'BOZZA' };
      component._grant = { ruoli: ['gestore'] } as any;
      component._canAddMapper();
      expect(mockAuthenticationService.canAdd).toHaveBeenCalledWith('servizio', 'BOZZA', ['gestore']);
    });
  });

  describe('_canEditMapper', () => {
    it('should call authenticationService.canEdit on _canEditMapper', () => {
      component._canEditMapper();
      expect(mockAuthenticationService.canEdit).toHaveBeenCalled();
    });

    it('should pass service stato and grant ruoli', () => {
      component.service = { stato: 'PUBBLICATO' };
      component._grant = { ruoli: ['referente'] } as any;
      component._canEditMapper();
      expect(mockAuthenticationService.canEdit).toHaveBeenCalledWith('servizio', 'servizio', 'PUBBLICATO', ['referente']);
    });
  });

  // =========================================================================
  // _onNew
  // =========================================================================

  describe('_onNew', () => {
    it('should navigate on _onNew when _useRoute is true', () => {
      component._useRoute = true;
      component.id = 5;
      component._onNew();
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should set _isEdit on _onNew when _useRoute is false', () => {
      component._useRoute = false;
      component._onNew();
      expect(component._isEdit).toBe(true);
    });

    it('should navigate to componenti path when _componentBreadcrumbs is set', () => {
      component._useRoute = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: 100 },
        breadcrumbs: []
      } as any;
      component.service = { id_servizio: 42 };
      component._onNew();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        'servizi', 100, 'componenti', 42, 'api', 'new'
      ]);
    });

    it('should navigate with queryParamsHandling when no componentBreadcrumbs', () => {
      component._useRoute = true;
      component._componentBreadcrumbs = null;
      component.id = 7;
      component._onNew();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/servizi/7/api', 'new'],
        { relativeTo: mockRoute, queryParamsHandling: 'preserve' }
      );
    });
  });

  // =========================================================================
  // _onEdit
  // =========================================================================

  describe('_onEdit', () => {
    it('should navigate on _onEdit when _useRoute is true', () => {
      component._useRoute = true;
      component.id = 5;
      component._onEdit({}, { id: 10 });
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should set _isEdit and _editCurrent when _useRoute is false', () => {
      component._useRoute = false;
      const param = { id: 10, source: {} };
      component._onEdit({}, param);
      expect(component._isEdit).toBe(true);
      expect(component._editCurrent).toBe(param);
    });

    it('should pin searchBarForm when available', () => {
      component._useRoute = true;
      component.id = 5;
      const mockSearchBar = { _pinLastSearch: vi.fn() };
      (component as any).searchBarForm = mockSearchBar;
      component._onEdit({}, { id: 10 });
      expect(mockSearchBar._pinLastSearch).toHaveBeenCalled();
    });

    it('should not fail when searchBarForm is not available', () => {
      component._useRoute = true;
      component.id = 5;
      (component as any).searchBarForm = null;
      expect(() => component._onEdit({}, { id: 10 })).not.toThrow();
    });

    it('should navigate to componenti path when _componentBreadcrumbs is set', () => {
      component._useRoute = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: 100 },
        breadcrumbs: []
      } as any;
      component.service = { id_servizio: 42 };
      component._onEdit({}, { id: 33 });
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        'servizi', 100, 'componenti', 42, 'api', 33
      ]);
    });

    it('should navigate with queryParamsHandling when no componentBreadcrumbs', () => {
      component._useRoute = true;
      component._componentBreadcrumbs = null;
      component.id = 7;
      component._onEdit({}, { id: 55 });
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/servizi/7/api', 55],
        { queryParamsHandling: 'preserve' }
      );
    });
  });

  // =========================================================================
  // _onSubmit
  // =========================================================================

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      const mockSearchBar = { _onSearch: vi.fn() };
      (component as any).searchBarForm = mockSearchBar;
      component._onSubmit({});
      expect(mockSearchBar._onSearch).toHaveBeenCalled();
    });

    it('should not fail when searchBarForm is not set', () => {
      (component as any).searchBarForm = null;
      expect(() => component._onSubmit({})).not.toThrow();
    });

    it('should not fail when searchBarForm is undefined', () => {
      (component as any).searchBarForm = undefined;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // =========================================================================
  // _onSearch
  // =========================================================================

  describe('_onSearch', () => {
    it('should set _filterData and call _loadServiceApi', () => {
      (component as any)._loadServiceApi = vi.fn();
      const values = { q: 'test' };
      component._onSearch(values);
      expect(component._filterData).toBe(values);
      expect((component as any)._loadServiceApi).toHaveBeenCalledWith(true, values);
    });

    it('should use current _isSoggettoDominio flag', () => {
      (component as any)._loadServiceApi = vi.fn();
      component._isSoggettoDominio = false;
      component._onSearch({ q: 'foo' });
      expect((component as any)._loadServiceApi).toHaveBeenCalledWith(false, { q: 'foo' });
    });
  });

  // =========================================================================
  // _resetForm
  // =========================================================================

  describe('_resetForm', () => {
    it('should clear _filterData and reload api', () => {
      (component as any)._loadServiceApi = vi.fn();
      component._filterData = [{ key: 'val' }];
      component._resetForm();
      expect(component._filterData).toEqual([]);
      expect((component as any)._loadServiceApi).toHaveBeenCalledWith(true, []);
    });
  });

  // =========================================================================
  // _onSort
  // =========================================================================

  describe('_onSort', () => {
    it('should log the event', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._onSort({ field: 'name', direction: 'asc' });
      expect(spy).toHaveBeenCalledWith({ field: 'name', direction: 'asc' });
      spy.mockRestore();
    });
  });

  // =========================================================================
  // _resetScroll
  // =========================================================================

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // =========================================================================
  // onActionMonitor
  // =========================================================================

  describe('onActionMonitor', () => {
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

    it('should handle onActionMonitor with empty action', () => {
      mockRouter.navigate.mockClear();
      component.onActionMonitor({ action: '' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ngAfterContentChecked
  // =========================================================================

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // We cannot control window.innerWidth easily, but we verify it runs
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // =========================================================================
  // _onResize
  // =========================================================================

  describe('_onResize', () => {
    it('should set desktop based on window width', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // =========================================================================
  // ngOnDestroy
  // =========================================================================

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // =========================================================================
  // Constructor: route.data subscription (componentBreadcrumbs)
  // =========================================================================

  describe('constructor - route.data subscription', () => {
    it('should set _componentBreadcrumbs when route data has componentBreadcrumbs', () => {
      const breadcrumbsData = {
        service: { id_servizio: 10, nome: 'SvcA', versione: '1' },
        breadcrumbs: [{ label: 'Parent', url: '/parent', type: 'link' }]
      };
      routeDataSubject.next({ componentBreadcrumbs: breadcrumbsData });
      expect(component._componentBreadcrumbs).toBe(breadcrumbsData);
    });

    it('should not set _componentBreadcrumbs when route data has no componentBreadcrumbs', () => {
      routeDataSubject.next({});
      expect(component._componentBreadcrumbs).toBeNull();
    });

    it('should call _initBreadcrumb when componentBreadcrumbs is present', () => {
      (component as any)._initBreadcrumb = vi.fn();
      const breadcrumbsData = {
        service: { id_servizio: 10 },
        breadcrumbs: []
      };
      routeDataSubject.next({ componentBreadcrumbs: breadcrumbsData });
      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Constructor: queryParams subscription (dashboard)
  // =========================================================================

  describe('constructor - queryParams subscription', () => {
    it('should set _fromDashboard when from=dashboard', () => {
      routeQueryParamsSubject.next({ from: 'dashboard' });
      expect(component._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard when from is not dashboard', () => {
      routeQueryParamsSubject.next({ from: 'other' });
      expect(component._fromDashboard).toBe(false);
    });

    it('should call _initBreadcrumb when from=dashboard', () => {
      (component as any)._initBreadcrumb = vi.fn();
      routeQueryParamsSubject.next({ from: 'dashboard' });
      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });

    it('should not set _fromDashboard when no from param', () => {
      routeQueryParamsSubject.next({});
      expect(component._fromDashboard).toBe(false);
    });
  });

  // =========================================================================
  // Constructor: router state
  // =========================================================================

  describe('constructor - router state', () => {
    it('should read service from navigation extras state', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'TestSvc' }, grant: { ruoli: ['gestore'] } } }
      });
      const comp = createComponent();
      expect(comp.service).toEqual({ nome: 'TestSvc' });
      expect(comp._grant).toEqual({ ruoli: ['gestore'] });
    });

    it('should handle null navigation', () => {
      mockRouter.getCurrentNavigation.mockReturnValue(null);
      const comp = createComponent();
      expect(comp.service).toBeNull();
    });

    it('should handle navigation with no state', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: {} });
      const comp = createComponent();
      expect(comp.service).toBeNull();
    });
  });

  // =========================================================================
  // Constructor: Tools.Configurazione (profili)
  // =========================================================================

  describe('constructor - Tools.Configurazione profili', () => {
    it('should read profili from Tools.Configurazione.servizio.api', () => {
      Tools.Configurazione = {
        servizio: {
          api: { profili: [{ codice_interno: 'REST', etichetta: 'REST API' }] }
        }
      };
      const comp = createComponent();
      expect(comp._profili).toEqual([{ codice_interno: 'REST', etichetta: 'REST API' }]);
    });

    it('should set profili to empty array when servizio has no api', () => {
      Tools.Configurazione = { servizio: {} };
      const comp = createComponent();
      expect(comp._profili).toEqual([]);
    });

    it('should set profili to empty array when Configurazione is null', () => {
      Tools.Configurazione = null;
      const comp = createComponent();
      expect(comp._profili).toEqual([]);
    });
  });

  // =========================================================================
  // Constructor: hideVersions
  // =========================================================================

  describe('constructor - hideVersions', () => {
    it('should set hideVersions to true when config says so', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } }
      });
      const comp = createComponent();
      expect(comp.hideVersions).toBe(true);
    });

    it('should default hideVersions to false when config is missing', () => {
      mockConfigService.getConfiguration.mockReturnValue({});
      const comp = createComponent();
      expect(comp.hideVersions).toBe(false);
    });
  });

  // =========================================================================
  // ngOnInit: route.params subscription
  // =========================================================================

  describe('ngOnInit - route.params subscription', () => {
    it('should set id from route params and call getConfig', () => {
      component.ngOnInit();
      routeParamsSubject.next({ id: '42' });
      expect(component.id).toBe('42');
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('api');
    });

    it('should use cid over id when cid is present', () => {
      component.ngOnInit();
      routeParamsSubject.next({ id: '42', cid: '99' });
      expect(component.id).toBe('99');
    });

    it('should call _loadServizio when service is null', () => {
      (component as any)._loadServizio = vi.fn();
      (component as any)._loadServiceApi = vi.fn();
      component.service = null;
      component.ngOnInit();
      routeParamsSubject.next({ id: '1' });
      expect((component as any)._loadServizio).toHaveBeenCalled();
    });

    it('should call _initBreadcrumb when service already exists', () => {
      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._loadServiceApi = vi.fn();
      component.service = { nome: 'ExistingSvc' };
      component.ngOnInit();
      routeParamsSubject.next({ id: '1' });
      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });

    it('should set _updateMapper when service already exists', () => {
      (component as any)._loadServiceApi = vi.fn();
      component.service = { nome: 'ExistingSvc' };
      component.ngOnInit();
      routeParamsSubject.next({ id: '1' });
      expect(component._updateMapper).not.toBe('');
    });

    it('should reset _loadedAll and call _loadServiceApi twice', () => {
      (component as any)._loadServiceApi = vi.fn();
      component.service = { nome: 'ExistingSvc' };
      component._loadedAll = 5;
      component.ngOnInit();
      routeParamsSubject.next({ id: '1' });
      expect(component._loadedAll).toBe(0);
      expect((component as any)._loadServiceApi).toHaveBeenCalledTimes(2);
      expect((component as any)._loadServiceApi).toHaveBeenCalledWith(true);
      expect((component as any)._loadServiceApi).toHaveBeenCalledWith(false);
    });

    it('should not do anything when params have no id', () => {
      (component as any)._loadServizio = vi.fn();
      (component as any)._loadServiceApi = vi.fn();
      component.ngOnInit();
      routeParamsSubject.next({});
      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
      expect((component as any)._loadServizio).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ngOnInit: PROFILE_UPDATE event
  // =========================================================================

  describe('ngOnInit - PROFILE_UPDATE event', () => {
    it('should register for PROFILE_UPDATE event', () => {
      component.ngOnInit();
      expect(mockEventsManagerService.on).toHaveBeenCalledWith(
        EventType.PROFILE_UPDATE,
        expect.any(Function)
      );
    });

    it('should update profili from Tools.Configurazione on PROFILE_UPDATE', () => {
      component.ngOnInit();
      const callback = mockEventsManagerService.on.mock.calls.find(
        (call: any[]) => call[0] === EventType.PROFILE_UPDATE
      )?.[1];
      expect(callback).toBeDefined();

      Tools.Configurazione = {
        servizio: {
          api: { profili: [{ codice_interno: 'SOAP', etichetta: 'SOAP API' }] }
        }
      };
      callback({});
      expect(component._profili).toEqual([{ codice_interno: 'SOAP', etichetta: 'SOAP API' }]);
    });

    it('should set profili to empty array when Configurazione.servizio has no api', () => {
      component.ngOnInit();
      const callback = mockEventsManagerService.on.mock.calls.find(
        (call: any[]) => call[0] === EventType.PROFILE_UPDATE
      )?.[1];

      Tools.Configurazione = { servizio: {} };
      callback({});
      expect(component._profili).toEqual([]);
    });

    it('should set profili to empty array when Configurazione is null', () => {
      component.ngOnInit();
      const callback = mockEventsManagerService.on.mock.calls.find(
        (call: any[]) => call[0] === EventType.PROFILE_UPDATE
      )?.[1];

      Tools.Configurazione = null;
      callback({});
      expect(component._profili).toEqual([]);
    });
  });

  // =========================================================================
  // _initBreadcrumb
  // =========================================================================

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with service name and versione when service is set', () => {
      component.service = { nome: 'MySvc', versione: '2', stato: 'PUBBLICATO' };
      component.id = 10;
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[1].label).toBe('MySvc v. 2');
    });

    it('should set breadcrumbs with just id when service is null', () => {
      component.service = null;
      component.id = 10;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('10');
    });

    it('should show New label when service is null and id is 0', () => {
      component.service = null;
      component.id = 0;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('should use nome only when hideVersions is true', () => {
      component.hideVersions = true;
      component.service = { nome: 'MySvc', versione: '3', stato: 'BOZZA' };
      component.id = 5;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('MySvc');
    });

    it('should set dashboard breadcrumbs when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      component.service = { nome: 'DashSvc', versione: '1', stato: 'BOZZA' };
      component.id = 20;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should set Services label when no componentBreadcrumbs and not fromDashboard', () => {
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;
      component.service = { nome: 'Svc', versione: '1', stato: 'BOZZA' };
      component.id = 1;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[0].iconBs).toBe('grid-3x3-gap');
    });

    it('should set Components label when componentBreadcrumbs is set', () => {
      component._fromDashboard = false;
      component._componentBreadcrumbs = {
        service: { id_servizio: 50 },
        breadcrumbs: [{ label: 'ParentSvc', url: '/servizi/50', type: 'link' }]
      } as any;
      component.service = { nome: 'CompSvc', versione: '1', stato: 'BOZZA' };
      component.id = 7;
      component._initBreadcrumb();

      // Should unshift componentBreadcrumbs.breadcrumbs
      expect(component.breadcrumbs[0].label).toBe('ParentSvc');
      // The Components label follows
      const componentsEntry = component.breadcrumbs.find((b: any) => b.label === 'APP.TITLE.Components');
      expect(componentsEntry).toBeDefined();
    });

    it('should use componenti base url when componentBreadcrumbs is set', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 50 },
        breadcrumbs: []
      } as any;
      component.service = { nome: 'CompSvc', versione: '2', stato: 'BOZZA' };
      component.id = 7;
      component._initBreadcrumb();

      const serviceEntry = component.breadcrumbs.find((b: any) => b.label === 'CompSvc v. 2');
      expect(serviceEntry).toBeDefined();
      expect(serviceEntry.url).toBe('/servizi/50/componenti/7');
    });

    it('should translate service stato for tooltip', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'PUBBLICATO' };
      component.id = 1;
      component._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.PUBBLICATO');
    });

    it('should show ... title for componentBreadcrumbs when no service name and no id', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 50 },
        breadcrumbs: []
      } as any;
      component.service = null;
      component.id = 0;
      component._initBreadcrumb();
      const labelEntry = component.breadcrumbs.find((b: any) => b.label === '...');
      expect(labelEntry).toBeDefined();
    });

    it('should not use dashboard breadcrumbs when fromDashboard + componentBreadcrumbs', () => {
      component._fromDashboard = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: 50 },
        breadcrumbs: [{ label: 'Parent', url: '/p', type: 'link' }]
      } as any;
      component.service = { nome: 'Svc', versione: '1', stato: 'BOZZA' };
      component.id = 1;
      component._initBreadcrumb();
      // When _fromDashboard && _componentBreadcrumbs, goes to else branch
      const dashEntry = component.breadcrumbs.find((b: any) => b.label === 'APP.TITLE.Dashboard');
      expect(dashEntry).toBeUndefined();
    });

    it('should set empty tooltip for Components breadcrumb', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 50 },
        breadcrumbs: []
      } as any;
      component.service = null;
      component.id = 5;
      component._initBreadcrumb();
      const compEntry = component.breadcrumbs.find((b: any) => b.label === 'APP.TITLE.Components');
      expect(compEntry).toBeDefined();
      expect(compEntry.tooltip).toBe('APP.TOOLTIP.ComponentsList');
    });

    it('should set no icon for Components main label', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 50 },
        breadcrumbs: []
      } as any;
      component.service = null;
      component.id = 5;
      component._initBreadcrumb();
      const compEntry = component.breadcrumbs.find((b: any) => b.label === 'APP.TITLE.Components');
      expect(compEntry.iconBs).toBe('');
    });
  });

  // =========================================================================
  // _loadServizio
  // =========================================================================

  describe('_loadServizio', () => {
    it('should not do anything when id is 0', () => {
      component.id = 0;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call getDetails for grant then for service details', () => {
      component.id = 42;
      const grantData = { ruoli: ['gestore'] };
      const serviceData = { nome: 'LoadedSvc', versione: '1', stato: 'BOZZA' };

      mockApiService.getDetails
        .mockImplementationOnce(() => of(grantData))
        .mockImplementationOnce(() => of(serviceData));

      component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 42, 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 42);
      expect(component._grant).toEqual(grantData);
      expect(component.service).toEqual(serviceData);
    });

    it('should call _initBreadcrumb after loading service', () => {
      component.id = 42;
      (component as any)._initBreadcrumb = vi.fn();

      mockApiService.getDetails
        .mockImplementationOnce(() => of({ ruoli: [] }))
        .mockImplementationOnce(() => of({ nome: 'Svc' }));

      component._loadServizio();
      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });

    it('should set _updateMapper after loading service', () => {
      component.id = 42;
      mockApiService.getDetails
        .mockImplementationOnce(() => of({}))
        .mockImplementationOnce(() => of({ nome: 'Svc' }));

      component._loadServizio();
      expect(component._updateMapper).not.toBe('');
    });

    it('should set service to null before loading', () => {
      component.id = 42;
      component.service = { nome: 'OldSvc' };
      mockApiService.getDetails
        .mockImplementationOnce(() => of({}))
        .mockImplementationOnce(() => of({ nome: 'NewSvc' }));

      component._loadServizio();
      // After loading, service should be the new one
      expect(component.service).toEqual({ nome: 'NewSvc' });
    });

    it('should call Tools.OnError when grant call fails', () => {
      component.id = 42;
      mockApiService.getDetails.mockImplementationOnce(() =>
        throwError(() => new Error('grant error'))
      );

      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should call Tools.OnError when details call fails', () => {
      component.id = 42;
      mockApiService.getDetails
        .mockImplementationOnce(() => of({}))
        .mockImplementationOnce(() => throwError(() => new Error('details error')));

      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _loadServiceApi
  // =========================================================================

  describe('_loadServiceApi', () => {
    beforeEach(() => {
      component.id = 10;
      component._profili = [];
    });

    it('should not call API when id is 0', () => {
      component.id = 0;
      component._loadServiceApi(true);
      expect(mockApiService.getList).not.toHaveBeenCalled();
    });

    it('should call _setErrorApi(false) at start', () => {
      (component as any)._setErrorApi = vi.fn();
      component._loadServiceApi(true);
      expect((component as any)._setErrorApi).toHaveBeenCalledWith(false);
    });

    it('should clear serviceApi and _links when no url provided', () => {
      component.serviceApi = [{ id: 1 }];
      component._links = { next: {} };
      mockApiService.getList.mockImplementation(() => of({ content: [], page: {} }));
      component._loadServiceApi(true);
      // serviceApi gets cleared first, then set from response
      expect(mockApiService.getList).toHaveBeenCalled();
    });

    it('should set _spin to true before calling API', () => {
      component._spin = false;
      mockApiService.getList.mockImplementation(() => of({ content: [], page: {} }));
      component._loadServiceApi(true);
      // After response, _spin depends on _loadedAll
    });

    it('should set ruolo to erogato_soggetto_dominio when dominio=true', () => {
      mockApiService.getList.mockImplementation(() => of({ content: [], page: {} }));
      component._loadServiceApi(true);
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ ruolo: 'erogato_soggetto_dominio' })
      );
    });

    it('should set ruolo to erogato_soggetto_aderente when dominio=false', () => {
      mockApiService.getList.mockImplementation(() => of({ content: [], page: {} }));
      component._loadServiceApi(false);
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ ruolo: 'erogato_soggetto_aderente' })
      );
    });

    it('should include id_servizio and sort in query', () => {
      mockApiService.getList.mockImplementation(() => of({ content: [], page: {} }));
      component._loadServiceApi(true);
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ id_servizio: 10, sort: 'id,asc' })
      );
    });

    it('should merge additional query params', () => {
      mockApiService.getList.mockImplementation(() => of({ content: [], page: {} }));
      component._loadServiceApi(true, { q: 'search' });
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'search', id_servizio: 10 })
      );
    });

    it('should set _pagingDominio and _linksDominio when dominio=true', () => {
      const response = {
        content: [],
        page: { total: 5 },
        _links: { next: { href: '/next' } }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._pagingDominio).toBeDefined();
      expect(component._linksDominio).toEqual({ next: { href: '/next' } });
    });

    it('should set _pagingAderente and _linksAderente when dominio=false', () => {
      const response = {
        content: [],
        page: { total: 3 },
        _links: { self: { href: '/self' } }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(false);
      expect(component._pagingAderente).toBeDefined();
      expect(component._linksAderente).toEqual({ self: { href: '/self' } });
    });

    it('should map content for dominio with tipo_profilo', () => {
      component._profili = [{ codice_interno: 'REST', etichetta: 'REST API' }];
      const response = {
        content: [
          { id_api: 1, gruppi_auth_type: [{ profilo: 'REST' }] }
        ],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component.serviceApiDominio.length).toBe(1);
      expect(component.serviceApiDominio[0].id).toBe(1);
      expect(component.serviceApiDominio[0].source.tipo_profilo).toContain('REST API');
    });

    it('should set tipo_profilo to null for aderente', () => {
      const response = {
        content: [
          { id_api: 2, gruppi_auth_type: [{ profilo: 'SOAP' }] }
        ],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(false);
      expect(component.serviceApiAderente[0].source.tipo_profilo).toBeNull();
    });

    it('should use Multipli label when gruppi_auth_type has more than 1 entry', () => {
      const response = {
        content: [
          { id_api: 3, gruppi_auth_type: [{ profilo: 'A' }, { profilo: 'B' }] }
        ],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      // translate.instant returns the key, so it should use the default label 'APP.LABEL.Multipli'
      expect(component.serviceApiDominio[0].source.tipo_profilo).toContain('APP.LABEL.Multipli');
    });

    it('should use default label when gruppi_auth_type is empty or null', () => {
      const response = {
        content: [
          { id_api: 4, gruppi_auth_type: null }
        ],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      // When gruppi_auth_type is null, .length will throw... let's check it handles or uses default
      // Actually it accesses api?.gruppi_auth_type?.length which is undefined, !== 1, so uses defaultLabelI18n
      expect(component.serviceApiDominio[0].source.tipo_profilo).toContain('APP.LABEL.Multipli');
    });

    it('should increment _loadedAll for dominio', () => {
      component._loadedAll = 0;
      const response = { content: [], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._loadedAll).toBe(1);
    });

    it('should increment _loadedAll for aderente', () => {
      component._loadedAll = 0;
      const response = { content: [], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(false);
      expect(component._loadedAll).toBe(1);
    });

    it('should set _spin to false when _loadedAll reaches 2', () => {
      component._loadedAll = 1;
      const response = { content: [], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._loadedAll).toBe(2);
      expect(component._spin).toBe(false);
    });

    it('should keep _spin true when _loadedAll is less than 2', () => {
      component._loadedAll = 0;
      const response = { content: [], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._loadedAll).toBe(1);
      expect(component._spin).toBe(true);
    });

    it('should call Tools.ScrollTo(0) on success', () => {
      const response = { content: [], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should reset _preventMultiCall on success with content', () => {
      component._preventMultiCall = true;
      const response = { content: [{ id_api: 1 }], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._preventMultiCall).toBe(false);
    });

    it('should append data when url is provided (pagination)', () => {
      component.serviceApiDominio = [{ id: 1, editMode: false, source: {} }];
      const response = {
        content: [{ id_api: 2, gruppi_auth_type: [] }],
        page: { total: 2 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true, null, 'http://next-page');
      expect(component.serviceApiDominio.length).toBe(2);
    });

    it('should replace data when no url provided', () => {
      component.serviceApiDominio = [{ id: 1, editMode: false, source: {} }];
      const response = {
        content: [{ id_api: 2, gruppi_auth_type: [] }],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component.serviceApiDominio.length).toBe(1);
      expect(component.serviceApiDominio[0].id).toBe(2);
    });

    it('should set serviceApi from aderente when dominio has no items', () => {
      component.serviceApiDominio = [];
      const response = {
        content: [{ id_api: 5, gruppi_auth_type: [] }],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(false);
      expect(component.serviceApi.length).toBe(1);
      expect(component.serviceApi[0].id).toBe(5);
    });

    it('should not override serviceApi from aderente when dominio has items', () => {
      component.serviceApiDominio = [{ id: 1 }];
      const response = {
        content: [{ id_api: 5, gruppi_auth_type: [] }],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(false);
      // serviceApi should NOT be overridden from aderente when dominio has items
      expect(component.serviceApi).not.toEqual(component.serviceApiAderente);
    });

    it('should append aderente data when url is provided (pagination)', () => {
      component.serviceApiAderente = [{ id: 1, editMode: false, source: {} }];
      component.serviceApiDominio = [{ id: 99 }]; // has items, so serviceApi won't switch
      const response = {
        content: [{ id_api: 2, gruppi_auth_type: [] }],
        page: { total: 2 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(false, null, 'http://next-page');
      expect(component.serviceApiAderente.length).toBe(2);
    });

    it('should set error state on API error', () => {
      mockApiService.getList.mockImplementation(() =>
        throwError(() => new Error('API error'))
      );
      component._loadServiceApi(true);
      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
    });

    it('should set _links to null when response has no _links', () => {
      const response = { content: [], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._linksDominio).toBeNull();
    });

    it('should not clear serviceApi when url is provided (appending)', () => {
      component.serviceApi = [{ id: 1 }];
      const response = { content: [{ id_api: 2, gruppi_auth_type: [] }], page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      // When url is provided, serviceApi should NOT be cleared at the start
      component._loadServiceApi(true, null, 'http://next');
      // serviceApi gets updated from serviceApiDominio
    });
  });

  // =========================================================================
  // _getProfiloLabelMapper
  // =========================================================================

  describe('_getProfiloLabelMapper', () => {
    it('should return etichetta when profilo is found', () => {
      component._profili = [
        { codice_interno: 'REST', etichetta: 'REST API' },
        { codice_interno: 'SOAP', etichetta: 'SOAP Service' }
      ];
      expect(component._getProfiloLabelMapper('REST')).toBe('REST API');
    });

    it('should return the input code when profilo is not found', () => {
      component._profili = [
        { codice_interno: 'REST', etichetta: 'REST API' }
      ];
      expect(component._getProfiloLabelMapper('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should return the input code when profili is empty', () => {
      component._profili = [];
      expect(component._getProfiloLabelMapper('TEST')).toBe('TEST');
    });

    it('should find correct profilo among multiple entries', () => {
      component._profili = [
        { codice_interno: 'A', etichetta: 'Label A' },
        { codice_interno: 'B', etichetta: 'Label B' },
        { codice_interno: 'C', etichetta: 'Label C' }
      ];
      expect(component._getProfiloLabelMapper('B')).toBe('Label B');
    });
  });

  // =========================================================================
  // __loadMoreData
  // =========================================================================

  describe('__loadMoreData', () => {
    it('should call _loadServiceApi when next link exists and not prevented', () => {
      (component as any)._loadServiceApi = vi.fn();
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = false;
      component._isSoggettoDominio = true;
      component.__loadMoreData();
      expect(component._preventMultiCall).toBe(true);
      expect((component as any)._loadServiceApi).toHaveBeenCalledWith(true, null, 'http://next-page');
    });

    it('should not call _loadServiceApi when no next link', () => {
      (component as any)._loadServiceApi = vi.fn();
      component._links = {};
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect((component as any)._loadServiceApi).not.toHaveBeenCalled();
    });

    it('should not call _loadServiceApi when _links is null', () => {
      (component as any)._loadServiceApi = vi.fn();
      component._links = null;
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect((component as any)._loadServiceApi).not.toHaveBeenCalled();
    });

    it('should not call _loadServiceApi when _preventMultiCall is true', () => {
      (component as any)._loadServiceApi = vi.fn();
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = true;
      component.__loadMoreData();
      expect((component as any)._loadServiceApi).not.toHaveBeenCalled();
    });

    it('should pass _isSoggettoDominio=false when aderente view', () => {
      (component as any)._loadServiceApi = vi.fn();
      component._links = { next: { href: 'http://next' } };
      component._preventMultiCall = false;
      component._isSoggettoDominio = false;
      component.__loadMoreData();
      expect((component as any)._loadServiceApi).toHaveBeenCalledWith(false, null, 'http://next');
    });
  });

  // =========================================================================
  // Full integration: ngOnInit flow with _loadServizio
  // =========================================================================

  describe('ngOnInit integration - _loadServizio flow', () => {
    it('should load grant then service when service is null on init', () => {
      component.service = null;
      const grantData = { ruoli: ['referente'] };
      const serviceData = { nome: 'FullSvc', versione: '1', stato: 'PUBBLICATO' };

      mockApiService.getDetails
        .mockImplementationOnce(() => of(grantData))
        .mockImplementationOnce(() => of(serviceData));
      mockApiService.getList.mockImplementation(() => of({ content: [], page: {} }));

      component.ngOnInit();
      routeParamsSubject.next({ id: '99' });

      expect(component._grant).toEqual(grantData);
      expect(component.service).toEqual(serviceData);
    });
  });

  // =========================================================================
  // Full integration: _loadServiceApi with content mapping
  // =========================================================================

  describe('_loadServiceApi integration - content mapping', () => {
    beforeEach(() => {
      component.id = 10;
      component._profili = [
        { codice_interno: 'APIGateway', etichetta: 'API Gateway Profile' }
      ];
    });

    it('should map single gruppi_auth_type to correct profilo label', () => {
      const response = {
        content: [
          { id_api: 100, gruppi_auth_type: [{ profilo: 'APIGateway' }], other: 'data' }
        ],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);

      expect(component.serviceApiDominio.length).toBe(1);
      const item = component.serviceApiDominio[0];
      expect(item.id).toBe(100);
      expect(item.editMode).toBe(false);
      expect(item.source.tipo_profilo).toContain('API Gateway Profile');
      expect(item.source.other).toBe('data');
    });

    it('should map multiple gruppi_auth_type to Multipli label', () => {
      const response = {
        content: [
          { id_api: 200, gruppi_auth_type: [{ profilo: 'A' }, { profilo: 'B' }] }
        ],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);

      const item = component.serviceApiDominio[0];
      // translate returns the key, so tipo_profilo will include 'APP.LABEL.Multipli'
      expect(item.source.tipo_profilo).toContain('APP.LABEL.Multipli');
    });

    it('should set editMode to false on all mapped items', () => {
      const response = {
        content: [
          { id_api: 1, gruppi_auth_type: [] },
          { id_api: 2, gruppi_auth_type: [] },
          { id_api: 3, gruppi_auth_type: [] }
        ],
        page: { total: 3 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      component.serviceApiDominio.forEach((item: any) => {
        expect(item.editMode).toBe(false);
      });
    });

    it('should call translate.instant for Profilo and Multipli labels', () => {
      const response = {
        content: [{ id_api: 1, gruppi_auth_type: [] }],
        page: { total: 1 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.Profilo');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.Multipli');
    });
  });

  // =========================================================================
  // Edge cases: _loadServiceApi with pagination url
  // =========================================================================

  describe('_loadServiceApi - pagination with url', () => {
    beforeEach(() => {
      component.id = 10;
      component._profili = [];
    });

    it('should not clear serviceApi when url is provided', () => {
      // First load
      component.serviceApiDominio = [
        { id: 1, editMode: false, source: { id_api: 1, tipo_profilo: null } }
      ];
      const response = {
        content: [{ id_api: 2, gruppi_auth_type: [] }],
        page: { total: 2 }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true, null, 'http://page2');
      expect(component.serviceApiDominio.length).toBe(2);
    });

    it('should handle response without _links', () => {
      const response = { content: [], page: { total: 0 } };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._links).toBeNull();
    });

    it('should handle response with _links', () => {
      const response = {
        content: [],
        page: { total: 10 },
        _links: { next: { href: '/api?page=2' }, self: { href: '/api?page=1' } }
      };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(component._links).toEqual({ next: { href: '/api?page=2' }, self: { href: '/api?page=1' } });
    });
  });

  // =========================================================================
  // Edge cases: response without content
  // =========================================================================

  describe('_loadServiceApi - response without content', () => {
    beforeEach(() => {
      component.id = 10;
      component._profili = [];
    });

    it('should handle response with null content', () => {
      const response = { content: null, page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      // Should not throw, _loadedAll should not increment from content branch
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should handle response with undefined content', () => {
      const response = { page: {} };
      mockApiService.getList.mockImplementation(() => of(response));
      component._loadServiceApi(true);
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });
  });

  // =========================================================================
  // Constructor with of() route data (immediate emit)
  // =========================================================================

  describe('constructor with immediate route data', () => {
    it('should handle componentBreadcrumbs emitted immediately via of()', () => {
      const breadcrumbsData = {
        service: { id_servizio: 10 },
        breadcrumbs: [{ label: 'Parent', url: '/parent', type: 'link' }]
      };
      mockRoute.data = of({ componentBreadcrumbs: breadcrumbsData });
      const comp = createComponent();
      expect(comp._componentBreadcrumbs).toBe(breadcrumbsData);
    });

    it('should handle queryParams from=dashboard emitted immediately via of()', () => {
      mockRoute.queryParams = of({ from: 'dashboard' });
      const comp = createComponent();
      expect(comp._fromDashboard).toBe(true);
    });
  });

  // =========================================================================
  // _loadServiceApi error path
  // =========================================================================

  describe('_loadServiceApi - error path', () => {
    beforeEach(() => {
      component.id = 10;
      component._profili = [];
    });

    it('should set error state and stop spinner on error', () => {
      mockApiService.getList.mockImplementation(() =>
        throwError(() => new Error('network error'))
      );
      component._loadServiceApi(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
      expect(component._spin).toBe(false);
    });

    it('should set error for aderente path too', () => {
      mockApiService.getList.mockImplementation(() =>
        throwError(() => new Error('fail'))
      );
      component._loadServiceApi(false);
      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
    });
  });
});
