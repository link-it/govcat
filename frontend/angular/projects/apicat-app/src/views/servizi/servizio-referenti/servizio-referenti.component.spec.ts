import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { ServizioReferentiComponent, TabType } from './servizio-referenti.component';
import { Tools } from '@linkit/components';

describe('ServizioReferentiComponent', () => {
  let component: ServizioReferentiComponent;

  let mockRouteDataSubject: Subject<any>;
  let mockRouteParamsSubject: Subject<any>;
  let mockRouteQueryParamsSubject: Subject<any>;

  let mockRoute: any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockModalService = {
    show: vi.fn()
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
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    getUtenti: vi.fn().mockReturnValue(of([]))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    _getClassesNotModifiable: vi.fn().mockReturnValue([])
  } as any;

  let _loadDominioReferentiSpy: any;
  let _loadServizioReferentiSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
    vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((tpl: any, data: any) => tpl || '');
    vi.spyOn(Tools, 'generateFields').mockReturnValue([]);

    // Spy on prototype methods to prevent unhandled errors from _loadDominioReferenti
    // Tests that need the real implementation can call .mockRestore() on these spies
    _loadDominioReferentiSpy = vi.spyOn(ServizioReferentiComponent.prototype, '_loadDominioReferenti' as any).mockImplementation(() => {});
    _loadServizioReferentiSpy = vi.spyOn(ServizioReferentiComponent.prototype, '_loadServizioReferenti' as any).mockImplementation(() => {});

    mockRouteDataSubject = new Subject<any>();
    mockRouteParamsSubject = new Subject<any>();
    mockRouteQueryParamsSubject = new Subject<any>();

    mockRoute = {
      data: mockRouteDataSubject.asObservable(),
      params: mockRouteParamsSubject.asObservable(),
      queryParams: mockRouteQueryParamsSubject.asObservable()
    } as any;

    component = new ServizioReferentiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockApiService,
      mockUtilService,
      mockAuthenticationService
    );
  });

  // No afterEach restoreAllMocks needed - vi.clearAllMocks() in beforeEach is sufficient

  // === Existing tests ===

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioReferentiComponent.Name).toBe('ServizioReferentiComponent');
  });

  it('should have model set to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should set config from configService', () => {
    expect(component.config).toBeDefined();
    expect(component.config.AppConfig.GOVAPI.HOST).toBe('http://localhost');
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should set service from router state', () => {
    expect(component.service).toBeNull();
  });

  it('should set service from router state when available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { id_servizio: '1', nome: 'Test' }, grant: { ruoli: [] } } }
    });
    const comp = new ServizioReferentiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockApiService,
      mockUtilService,
      mockAuthenticationService
    );
    expect(comp.service).toEqual({ id_servizio: '1', nome: 'Test' });
    expect(comp._grant).toEqual({ ruoli: [] });
  });

  it('should subscribe to route.data in constructor', () => {
    // No componentBreadcrumbs in data, so _componentBreadcrumbs should be null
    expect(component._componentBreadcrumbs).toBeNull();
  });

  it('should set error messages correctly', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');

    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoReferent');
  });

  it('should initialize breadcrumbs with service data', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = false;
    component._componentBreadcrumbs = null;
    component.hideVersions = false;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
    expect(component.breadcrumbs[1].label).toBe('TestService v. 1');
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.ServiceReferents');
  });

  it('should initialize breadcrumbs with hideVersions', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = false;
    component._componentBreadcrumbs = null;
    component.hideVersions = true;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('TestService');
  });

  it('should initialize breadcrumbs from dashboard', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = true;
    component._componentBreadcrumbs = null;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], expect.anything());
  });

  it('should close edit on _onCloseEdit', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  it('should set current tab', () => {
    component.setCurrTab('DOMINIO');
    expect(component.currTab).toBe('DOMINIO');
    component.setCurrTab('REFERENTI');
    expect(component.currTab).toBe('REFERENTI');
  });

  it('should default to REFERENTI tab', () => {
    expect(component.currTab).toBe('REFERENTI');
  });

  it('should reset form', () => {
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should convert timestamp to date', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('should return null for zero timestamp', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('should check _hasControlError', () => {
    component._editFormGroup = {
      controls: {
        testField: { errors: { required: true }, touched: true }
      }
    } as any;
    expect(component._hasControlError('testField')).toBeTruthy();
  });

  it('should return false for missing field in _hasControlError', () => {
    component._editFormGroup = { controls: {} } as any;
    expect(component._hasControlError('missingField')).toBeFalsy();
  });

  it('should init edit form with disabled id_utente', () => {
    component._initEditForm();
    expect(component._editFormGroup.controls.tipo).toBeDefined();
    expect(component._editFormGroup.controls.id_utente).toBeDefined();
    expect(component._editFormGroup.controls.id_utente.disabled).toBe(true);
  });

  it('should check _canAddMapper returns true when no classes restricted', () => {
    component.service = { stato: 'pubblicato' };
    mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);
    expect(component._canAddMapper()).toBe(true);
  });

  it('should check _canAddMapper returns false when both classes restricted', () => {
    component.service = { stato: 'pubblicato' };
    mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente', 'referente_superiore']);
    expect(component._canAddMapper()).toBe(false);
  });

  it('should handle loadAnagrafiche', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente']).toBeDefined();
    expect(component.anagrafiche['tipo-referente'].length).toBe(2);
    expect(component.anagrafiche['tipo-referente'][0].nome).toBe('referente');
    expect(component.anagrafiche['tipo-referente'][1].nome).toBe('referente_tecnico');
  });

  it('should handle onChangeTipo', () => {
    component._initEditForm();
    component.onChangeTipo({ nome: 'referente', filter: 'referente_servizio,gestore,coordinatore' });
    expect(component.tipoReferente).toBe('referente');
    expect(component.referentiFilter).toBe('referente_servizio,gestore,coordinatore');
    expect(component._editFormGroup.controls.id_utente.enabled).toBe(true);
  });

  it('should handle onChangeUser', () => {
    component._errorSave = true;
    component._errorSaveMsg = 'error';
    component.onChangeUser({});
    expect(component._errorSave).toBe(false);
    expect(component._errorSaveMsg).toBe('');
  });

  it('should handle _onChangeTipoReferente', () => {
    component._onChangeTipoReferente(true);
    expect(component.referentiFilter).toBe('referente_servizio,gestore,coordinatore');
    component._onChangeTipoReferente(false);
    expect(component.referentiFilter).toBe('');
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should initialize _formGroup with q control', () => {
    expect(component._formGroup.get('q')).toBeTruthy();
  });

  it('should handle closeModal', () => {
    component._modalEditRef = { hide: vi.fn() } as any;
    component._errorSave = true;
    component._errorSaveMsg = 'error';
    component.closeModal();
    expect(component._errorSave).toBe(false);
    expect(component._errorSaveMsg).toBe('');
    expect(component._modalEditRef.hide).toHaveBeenCalled();
  });

  // ===== NEW TESTS =====

  // === TabType enum ===

  describe('TabType enum', () => {
    it('should have REFERENTI value', () => {
      expect(TabType.REFERENTI).toBe('REFERENTI');
    });

    it('should have DOMINIO value', () => {
      expect(TabType.DOMINIO).toBe('DOMINIO');
    });

    it('should expose TabType on instance', () => {
      expect(component.TabType).toBe(TabType);
    });
  });

  // === constructor ===

  describe('constructor', () => {
    it('should set _componentBreadcrumbs from route data when present', () => {
      const breadcrumbsData = {
        service: { id_servizio: 'svc1' },
        breadcrumbs: [{ label: 'Parent', url: '/parent' }]
      };
      mockRouteDataSubject.next({ componentBreadcrumbs: breadcrumbsData });
      expect(component._componentBreadcrumbs).toEqual(breadcrumbsData);
    });

    it('should not set _componentBreadcrumbs when route data has no componentBreadcrumbs', () => {
      mockRouteDataSubject.next({});
      expect(component._componentBreadcrumbs).toBeNull();
    });

    it('should set _fromDashboard when queryParams from=dashboard', () => {
      mockRouteQueryParamsSubject.next({ from: 'dashboard' });
      expect(component._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard when queryParams has no from', () => {
      mockRouteQueryParamsSubject.next({});
      expect(component._fromDashboard).toBe(false);
    });

    it('should set hideVersions=true when config says so', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } }
      });
      const comp = new ServizioReferentiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtilService, mockAuthenticationService
      );
      expect(comp.hideVersions).toBe(true);
    });

    it('should handle null config gracefully', () => {
      mockConfigService.getConfiguration.mockReturnValue(null);
      const comp = new ServizioReferentiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManagerService,
        mockApiService, mockUtilService, mockAuthenticationService
      );
      expect(comp.hideVersions).toBe(false);
    });

    it('should call _initSearchForm and set _formGroup', () => {
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup.get('q')).toBeTruthy();
    });
  });

  // === ngOnInit ===

  describe('ngOnInit', () => {
    it('should set id from route params and load config', () => {
      const mockConfig = { details: [], itemRow: {} };
      mockConfigService.getConfig.mockReturnValue(of(mockConfig));
      (component as any)._loadServizio = vi.fn();

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '42' });

      expect(component.id).toBe('42');
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('referenti');
      expect(component.referentiConfig).toEqual(mockConfig);
    });

    it('should use cid over id when both present', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      (component as any)._loadServizio = vi.fn();

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '10', cid: '99' });

      expect(component.id).toBe('99');
    });

    it('should call _loadServizio when service is null', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = null;
      const mockFn = vi.fn();
      (component as any)._loadServizio = mockFn;

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '5' });

      expect(mockFn).toHaveBeenCalled();
    });

    it('should call _loadServizioReferenti and _loadDominioReferenti when service is already set', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = {
        nome: 'Svc', versione: '1', stato: 'pubblicato',
        dominio: {
          soggetto_referente: {
            organizzazione: { esterna: true, id_organizzazione: 'org-123' }
          }
        }
      };
      const mockRef = vi.fn();
      const mockDom = vi.fn();
      (component as any)._loadServizioReferenti = mockRef;
      (component as any)._loadDominioReferenti = mockDom;

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '7' });

      expect(component._isDominioEsterno).toBe(true);
      expect(component._idDominioEsterno).toBe('org-123');
      expect(mockRef).toHaveBeenCalled();
      expect(mockDom).toHaveBeenCalled();
    });

    it('should set _isDominioEsterno=false when dominio has no esterna', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = { nome: 'Svc', versione: '1', stato: 'ok', dominio: {} };
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '7' });

      expect(component._isDominioEsterno).toBe(false);
      expect(component._idDominioEsterno).toBeNull();
    });

    it('should not do anything when id is not provided', () => {
      const mockFn = vi.fn();
      (component as any)._loadServizio = mockFn;

      component.ngOnInit();
      mockRouteParamsSubject.next({});

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should set _updateMapper when service is available', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = { nome: 'Svc', versione: '1', stato: 'ok', dominio: {} };
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '7' });

      expect(component._updateMapper).toBeTruthy();
      expect(component._updateMapper.length).toBeGreaterThan(0);
    });

    it('should call _initBreadcrumb when service is available', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = { nome: 'Svc', versione: '1', stato: 'ok', dominio: {} };
      const mockBreadcrumb = vi.fn();
      (component as any)._initBreadcrumb = mockBreadcrumb;
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '7' });

      expect(mockBreadcrumb).toHaveBeenCalled();
    });
  });

  // === _initBreadcrumb ===

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with id when no service', () => {
      component.service = null;
      component.id = 99;
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('99');
    });

    it('should set breadcrumbs with New when no service and no id', () => {
      component.service = null;
      component.id = 0;
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('should set tooltip from service stato', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      component.id = 10;
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
      expect(component.breadcrumbs[1].tooltip).toBe('APP.WORKFLOW.STATUS.pubblicato');
    });

    it('should set empty tooltip when no service', () => {
      component.service = null;
      component.id = 10;
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].tooltip).toBe('');
    });

    it('should use componentBreadcrumbs when present', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 'svc1' },
        breadcrumbs: [{ label: 'APP.TITLE.Services', url: '/servizi/', type: 'link' }]
      } as any;
      component.service = { nome: 'Comp1', versione: '2', stato: 'bozza' };
      component.id = 10;
      component._fromDashboard = false;

      component._initBreadcrumb();

      // The title should always include version when _componentBreadcrumbs is set
      expect(component.breadcrumbs.some((b: any) => b.label === 'Comp1 v. 2')).toBe(true);
      // Should have Components label
      expect(component.breadcrumbs.some((b: any) => b.label === 'APP.TITLE.Components')).toBe(true);
      // Breadcrumbs from _componentBreadcrumbs are prepended
      expect(component.breadcrumbs.length).toBeGreaterThan(3);
    });

    it('should use "..." when _componentBreadcrumbs but no service name/version', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 'svc1' },
        breadcrumbs: []
      } as any;
      component.service = null;
      component.id = 10;
      component._fromDashboard = false;

      component._initBreadcrumb();

      expect(component.breadcrumbs.some((b: any) => b.label === '...')).toBe(true);
    });

    it('should set baseUrl to componenti path when _componentBreadcrumbs is set', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 'svc1' },
        breadcrumbs: []
      } as any;
      component.service = { nome: 'Comp', versione: '1', stato: 'ok' };
      component.id = 10;
      component._fromDashboard = false;

      component._initBreadcrumb();

      const compBreadcrumb = component.breadcrumbs.find((b: any) => b.label === 'Comp v. 1');
      expect(compBreadcrumb.url).toBe('/servizi/svc1/componenti/10');
    });

    it('should not use dashboard layout when _fromDashboard but _componentBreadcrumbs is set', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 'svc1' },
        breadcrumbs: [{ label: 'Parent' }]
      } as any;
      component.service = { nome: 'Comp', versione: '1', stato: 'ok' };
      component.id = 10;
      component._fromDashboard = true;

      component._initBreadcrumb();

      // Should NOT have Dashboard as first item since _componentBreadcrumbs takes precedence
      expect(component.breadcrumbs[0].label).not.toBe('APP.TITLE.Dashboard');
    });

    it('should set dashboard breadcrumbs with correct url and icon', () => {
      component.service = { nome: 'TestSvc', versione: '1', stato: 'bozza' };
      component.id = 15;
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
      expect(component.breadcrumbs[1].url).toBe('/servizi/15');
    });

    it('should set main icon to grid-3x3-gap when no componentBreadcrumbs', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'ok' };
      component.id = 10;
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].iconBs).toBe('grid-3x3-gap');
    });

    it('should set empty icon when componentBreadcrumbs', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: 'svc1' },
        breadcrumbs: []
      } as any;
      component.service = { nome: 'Comp', versione: '1', stato: 'ok' };
      component.id = 10;
      component._fromDashboard = false;

      component._initBreadcrumb();

      const compLabel = component.breadcrumbs.find((b: any) => b.label === 'APP.TITLE.Components');
      expect(compLabel.iconBs).toBe('');
    });
  });

  // === _setErrorMessages ===

  describe('_setErrorMessages', () => {
    it('should set error help message on error=true', () => {
      component._setErrorMessages(true);
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set no-referent help message on error=false', () => {
      component._setErrorMessages(false);
      expect(component._messageHelp).toBe('APP.MESSAGE.NoReferentHelp');
    });
  });

  // === ngAfterContentChecked ===

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // Just verify it runs without error and sets a boolean
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // === _onResize ===

  describe('_onResize', () => {
    it('should set desktop based on window width', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // === _loadServizio ===

  describe('_loadServizio', () => {
    it('should not load when id is 0', () => {
      component.id = 0;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load grant then service on success', () => {
      const mockGrant = { ruoli: ['admin'] };
      const mockService = {
        nome: 'Svc', versione: '1', stato: 'ok',
        dominio: {
          id_dominio: 'dom1',
          soggetto_referente: {
            organizzazione: { esterna: true, id_organizzazione: 'ext-1' }
          }
        }
      };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService));

      component.id = 5;
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5);
      expect(component._grant).toEqual(mockGrant);
      expect(component.service).toEqual(mockService);
      expect(component._isDominioEsterno).toBe(true);
      expect(component._idDominioEsterno).toBe('ext-1');
    });

    it('should call _initBreadcrumb and _loadServizioReferenti after loading', () => {
      const mockGrant = {};
      const mockService = { nome: 'S', versione: '1', stato: 'ok', dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService));

      component.id = 1;
      const mockBreadcrumb = vi.fn();
      (component as any)._initBreadcrumb = mockBreadcrumb;
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component._loadServizio();

      expect(mockBreadcrumb).toHaveBeenCalled();
      expect((component as any)._loadServizioReferenti).toHaveBeenCalled();
      expect((component as any)._loadDominioReferenti).toHaveBeenCalled();
    });

    it('should handle error and call Tools.OnError', () => {
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(throwError(() => new Error('service fail')));
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component.id = 10;
      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should handle grant error', () => {
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant fail')));
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component.id = 10;
      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should set service to null and increment _spin before loading', () => {
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'S', versione: '1', stato: 'ok', dominio: { id_dominio: 'dom1' } }));

      component.id = 5;
      component.service = { old: true };
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component._loadServizio();

      // After completing, _spin should be decremented back
      expect(component._spin).toBe(0);
      expect(component.service).toBeTruthy();
    });

    it('should set _updateMapper after loading service', () => {
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'S', versione: '1', stato: 'ok', dominio: { id_dominio: 'dom1' } }));

      component.id = 1;
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component._loadServizio();

      expect(component._updateMapper).toBeTruthy();
    });

    it('should set _isDominioEsterno=false when org has no esterna property', () => {
      const mockService = { nome: 'S', versione: '1', stato: 'ok', dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of(mockService));

      component.id = 1;
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component._loadServizio();

      expect(component._isDominioEsterno).toBe(false);
      expect(component._idDominioEsterno).toBeNull();
    });
  });

  // === _loadServizioReferenti ===

  describe('_loadServizioReferenti', () => {
    const referentiConfig = {
      itemRow: {
        primaryText: '${utente.nome}',
        secondaryText: '${utente.cognome}',
        metadata: { text: '${tipo}', label: '${ruolo}' },
        secondaryMetadata: '${email}'
      },
      options: {},
      details: []
    };

    beforeEach(() => {
      // Restore the real _loadServizioReferenti for these tests
      _loadServizioReferentiSpy.mockRestore();
      component.referentiConfig = referentiConfig;
    });

    const makeResponse = (content: any[], page: any = {}, links: any = null) => ({
      content,
      page,
      _links: links
    });

    it('should reset list and load referenti on success', () => {
      const mockContent = [
        { id: 1, utente: { nome: 'Mario', cognome: 'Rossi' }, tipo: 'referente' }
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent, { totalElements: 1 })));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component.servizioReferenti.length).toBe(1);
      expect(component._spin).toBe(0);
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should not load when id is 0', () => {
      component.id = 0;
      component._loadServizioReferenti();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should clear list when url is empty', () => {
      component.id = 5;
      component.servizioReferenti = [{ id: 'old' }];
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component._loadServizioReferenti();

      expect(component.servizioReferenti.length).toBe(1);
    });

    it('should append results when url is provided', () => {
      component.id = 5;
      component.servizioReferenti = [{ id: 'existing' }];
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 2 }])));

      component._loadServizioReferenti(null, '/api/next');

      expect(component.servizioReferenti.length).toBe(2);
    });

    it('should set _links from response', () => {
      const links = { next: { href: '/api/next' } };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }], {}, links)));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component._links).toEqual(links);
    });

    it('should set _links to null when response has no _links', () => {
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }], {}, null)));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component._links).toBeNull();
    });

    it('should set _paging from response page', () => {
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }], { totalElements: 10, number: 0, size: 20 })));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component._paging).toBeDefined();
    });

    it('should set _preventMultiCall to false after loading', () => {
      component.id = 5;
      component._preventMultiCall = true;
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component._loadServizioReferenti();

      expect(component._preventMultiCall).toBe(false);
    });

    it('should handle error response', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component._spin).toBe(0);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._preventMultiCall).toBe(false);
    });

    it('should handle null response gracefully', () => {
      mockApiService.getDetails.mockReturnValue(of(null));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component.servizioReferenti.length).toBe(0);
      expect(component._spin).toBe(0);
    });

    it('should handle response with no content', () => {
      mockApiService.getDetails.mockReturnValue(of({ page: { totalElements: 0 }, _links: null }));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component.servizioReferenti.length).toBe(0);
    });

    it('should call _setErrorMessages(false) at start', () => {
      const spy = vi.spyOn(component, '_setErrorMessages');
      mockApiService.getDetails.mockReturnValue(of(makeResponse([])));

      component.id = 5;
      component._loadServizioReferenti();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should set metadata when both metadataText and metadataLabel are present', () => {
      (Tools.simpleItemFormatter as any).mockImplementation((tpl: any) => {
        if (tpl === '${tipo}') return 'referente';
        if (tpl === '${ruolo}') return 'admin';
        return tpl || '';
      });

      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component.servizioReferenti[0].metadata).toContain('referente');
      expect(component.servizioReferenti[0].metadata).toContain('admin');
    });

    it('should set empty metadata when both text and label are empty', () => {
      (Tools.simpleItemFormatter as any).mockImplementation(() => '');

      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component.servizioReferenti[0].metadata).toBe('');
    });

    it('should set editMode=false and enableCollapse=true on each element', () => {
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }, { id: 2 }])));

      component.id = 5;
      component._loadServizioReferenti();

      component.servizioReferenti.forEach((el: any) => {
        expect(el.editMode).toBe(false);
        expect(el.enableCollapse).toBe(true);
      });
    });

    it('should call simpleItemFormatter with correct params', () => {
      const mockContent = [{ id: 1, utente: { nome: 'Mario' }, tipo: 'referente' }];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent)));

      component.id = 5;
      component._loadServizioReferenti();

      expect(Tools.simpleItemFormatter).toHaveBeenCalled();
    });

    it('should clear list and _links when url is empty string', () => {
      component.id = 5;
      component.servizioReferenti = [{ id: 'old' }];
      component._links = { some: 'link' };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component._loadServizioReferenti(null, '');

      expect(component.servizioReferenti.length).toBe(1);
    });

    it('should not clear list when url is provided', () => {
      component.id = 5;
      component.servizioReferenti = [{ id: 'existing' }];
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 2 }])));

      component._loadServizioReferenti(null, '/api/next');

      expect(component.servizioReferenti[0].id).toBe('existing');
    });

    it('should copy source with spread operator', () => {
      const originalReferent = { id: 1, utente: { nome: 'Mario' }, tipo: 'referente' };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([originalReferent])));

      component.id = 5;
      component._loadServizioReferenti();

      // Source should be a copy (not the same reference)
      expect(component.servizioReferenti[0].source).toEqual(originalReferent);
      expect(component.servizioReferenti[0].source).not.toBe(originalReferent);
    });
  });

  // === _loadDominioReferenti ===

  describe('_loadDominioReferenti', () => {
    const referentiConfig = {
      itemRow: {
        primaryText: '${utente.nome}',
        secondaryText: '${utente.cognome}',
        metadata: { text: '${tipo}', label: '${ruolo}' },
        secondaryMetadata: '${email}'
      },
      options: {},
      details: []
    };

    beforeEach(() => {
      // Restore the real _loadDominioReferenti for these tests
      _loadDominioReferentiSpy.mockRestore();
      component.referentiConfig = referentiConfig;
    });

    const makeResponse = (content: any[], page: any = {}, links: any = null) => ({
      content,
      page,
      _links: links
    });

    it('should not load when service has no dominio.id_dominio', () => {
      component.service = { dominio: {} };
      component._loadDominioReferenti();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not load when service is null', () => {
      component.service = null;
      component._loadDominioReferenti();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load dominio referenti on success', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }], { totalElements: 1 })));

      component._loadDominioReferenti();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('domini', 'dom1', 'referenti');
      expect(component.dominioReferenti.length).toBe(1);
      expect(component._spin).toBe(0);
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should clear list when url is empty', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      component.dominioReferenti = [{ id: 'old' }];
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component._loadDominioReferenti();

      expect(component.dominioReferenti.length).toBe(1);
    });

    it('should append results when url is provided', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      component.dominioReferenti = [{ id: 'existing' }];
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 2 }])));

      component._loadDominioReferenti(null, '/api/next');

      expect(component.dominioReferenti.length).toBe(2);
    });

    it('should set _linksDomain from response', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      const links = { next: { href: '/api/dom/next' } };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }], {}, links)));

      component._loadDominioReferenti();

      expect(component._linksDomain).toEqual(links);
    });

    it('should set _pagingDomain from response page', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([], { totalElements: 5 })));

      component._loadDominioReferenti();

      expect(component._pagingDomain).toBeDefined();
    });

    it('should handle error response', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));

      component._loadDominioReferenti();

      expect(component._error).toBe(true);
      expect(component._spin).toBe(0);
      expect(component._preventMultiCall).toBe(false);
    });

    it('should handle null response gracefully', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails.mockReturnValue(of(null));

      component._loadDominioReferenti();

      expect(component.dominioReferenti.length).toBe(0);
    });

    it('should handle response with no content', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails.mockReturnValue(of({ page: {}, _links: null }));

      component._loadDominioReferenti();

      expect(component.dominioReferenti.length).toBe(0);
    });

    it('should set _preventMultiCall to false after loading', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      component._preventMultiCall = true;
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component._loadDominioReferenti();

      expect(component._preventMultiCall).toBe(false);
    });

    it('should call _setErrorMessages(false) at start', () => {
      const spy = vi.spyOn(component, '_setErrorMessages');
      component.service = { dominio: { id_dominio: 'dom1' } };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([])));

      component._loadDominioReferenti();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should set metadata correctly', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      (Tools.simpleItemFormatter as any).mockImplementation((tpl: any) => {
        if (tpl === '${tipo}') return 'referente';
        if (tpl === '${ruolo}') return 'admin';
        return tpl || '';
      });
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component._loadDominioReferenti();

      expect(component.dominioReferenti[0].metadata).toContain('referente');
    });

    it('should set empty metadata when text and label are empty', () => {
      component.service = { dominio: { id_dominio: 'dom1' } };
      (Tools.simpleItemFormatter as any).mockImplementation(() => '');
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id: 1 }])));

      component._loadDominioReferenti();

      expect(component.dominioReferenti[0].metadata).toBe('');
    });
  });

  // === _generateReferentFields ===

  describe('_generateReferentFields', () => {
    it('should call Tools.generateFields and translate labels', () => {
      const mockFields = [
        { label: 'APP.LABEL.Name', value: 'test', type: 'text' },
        { label: 'APP.LABEL.Desc', value: 'desc', type: 'text' }
      ];
      (Tools.generateFields as any).mockReturnValue(mockFields);
      component.referentiConfig = { details: [{ field: 'name' }] };

      const result = component._generateReferentFields({ name: 'test' });

      expect(Tools.generateFields).toHaveBeenCalledWith([{ field: 'name' }], { name: 'test' });
      expect(result.length).toBe(2);
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.Name');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.Desc');
    });

    it('should return empty array when no fields', () => {
      (Tools.generateFields as any).mockReturnValue([]);
      component.referentiConfig = { details: [] };

      const result = component._generateReferentFields({});

      expect(result).toEqual([]);
    });
  });

  // === __loadMoreData ===

  describe('__loadMoreData', () => {
    it('should call _loadServizioReferenti when REFERENTI tab and next link exists', () => {
      component.currTab = TabType.REFERENTI;
      component._links = { next: { href: '/api/referenti?page=2' } };
      component._preventMultiCall = false;
      const mockFn = vi.fn();
      (component as any)._loadServizioReferenti = mockFn;

      component.__loadMoreData();

      expect(component._preventMultiCall).toBe(true);
      expect(mockFn).toHaveBeenCalledWith(null, '/api/referenti?page=2');
    });

    it('should not call when REFERENTI tab but _links is null', () => {
      component.currTab = TabType.REFERENTI;
      component._links = null;
      component._preventMultiCall = false;
      const mockFn = vi.fn();
      (component as any)._loadServizioReferenti = mockFn;

      component.__loadMoreData();

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should not call when REFERENTI tab but no next link', () => {
      component.currTab = TabType.REFERENTI;
      component._links = {};
      component._preventMultiCall = false;
      const mockFn = vi.fn();
      (component as any)._loadServizioReferenti = mockFn;

      component.__loadMoreData();

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should not call when REFERENTI tab but _preventMultiCall is true', () => {
      component.currTab = TabType.REFERENTI;
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = true;
      const mockFn = vi.fn();
      (component as any)._loadServizioReferenti = mockFn;

      component.__loadMoreData();

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should call _loadDominioReferenti when DOMINIO tab and next link exists', () => {
      component.currTab = TabType.DOMINIO;
      component._linksDomain = { next: { href: '/api/domini?page=2' } };
      component._preventMultiCall = false;
      const mockFn = vi.fn();
      (component as any)._loadDominioReferenti = mockFn;

      component.__loadMoreData();

      expect(component._preventMultiCall).toBe(true);
      expect(mockFn).toHaveBeenCalledWith(null, '/api/domini?page=2');
    });

    it('should not call when DOMINIO tab but _linksDomain is null', () => {
      component.currTab = TabType.DOMINIO;
      component._linksDomain = null;
      component._preventMultiCall = false;
      const mockFn = vi.fn();
      (component as any)._loadDominioReferenti = mockFn;

      component.__loadMoreData();

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should not call when DOMINIO tab but no next link', () => {
      component.currTab = TabType.DOMINIO;
      component._linksDomain = {};
      component._preventMultiCall = false;
      const mockFn = vi.fn();
      (component as any)._loadDominioReferenti = mockFn;

      component.__loadMoreData();

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should not call when DOMINIO tab but _preventMultiCall is true', () => {
      component.currTab = TabType.DOMINIO;
      component._linksDomain = { next: { href: '/api/next' } };
      component._preventMultiCall = true;
      const mockFn = vi.fn();
      (component as any)._loadDominioReferenti = mockFn;

      component.__loadMoreData();

      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  // === _onNew ===

  describe('_onNew', () => {
    it('should call _addReferente when _useDialog is true', () => {
      component._useDialog = true;
      const mockFn = vi.fn();
      (component as any)._addReferente = mockFn;

      component._onNew();

      expect(mockFn).toHaveBeenCalled();
    });

    it('should set _editCurrent to null and _isEdit to true when _useDialog is false', () => {
      component._useDialog = false;

      component._onNew();

      expect(component._editCurrent).toBeNull();
      expect(component._isEdit).toBe(true);
    });
  });

  // === _onEdit ===

  describe('_onEdit', () => {
    it('should call _addReferente when _useDialog is true', () => {
      component._useDialog = true;
      const mockFn = vi.fn();
      (component as any)._addReferente = mockFn;

      component._onEdit({}, { id: 1 });

      expect(mockFn).toHaveBeenCalled();
    });

    it('should set _editCurrent and _isEdit when _useDialog is false', () => {
      component._useDialog = false;
      const param = { id: 1, name: 'Test' };

      component._onEdit({}, param);

      expect(component._editCurrent).toEqual(param);
      expect(component._isEdit).toBe(true);
    });
  });

  // === _onSubmit ===

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      component.searchBarForm = { _onSearch: vi.fn() } as any;

      component._onSubmit({});

      expect(component.searchBarForm._onSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;

      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // === _onSearch ===

  describe('_onSearch', () => {
    it('should set _filterData and call _loadServizioReferenti', () => {
      const mockFn = vi.fn();
      (component as any)._loadServizioReferenti = mockFn;
      const values = [{ key: 'q', value: 'test' }];

      component._onSearch(values);

      expect(component._filterData).toEqual(values);
      expect(mockFn).toHaveBeenCalledWith(values);
    });
  });

  // === _resetForm ===

  describe('_resetForm', () => {
    it('should clear _filterData and reload referenti', () => {
      const mockFn = vi.fn();
      (component as any)._loadServizioReferenti = mockFn;
      component._filterData = [{ key: 'q', value: 'test' }];

      component._resetForm();

      expect(component._filterData).toEqual([]);
      expect(mockFn).toHaveBeenCalledWith([]);
    });
  });

  // === _onSort ===

  describe('_onSort', () => {
    it('should log the event (no-op)', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      component._onSort({ field: 'name', direction: 'asc' });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // === _resetScroll ===

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement', () => {
      component._resetScroll();

      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // === f getter ===

  describe('f getter', () => {
    it('should return editFormGroup controls', () => {
      component._initEditForm();
      const controls = component.f;
      expect(controls.tipo).toBeDefined();
      expect(controls.id_utente).toBeDefined();
    });
  });

  // === _initEditForm ===

  describe('_initEditForm', () => {
    it('should create form with tipo and id_utente controls', () => {
      component._initEditForm();

      expect(component._editFormGroup.controls.tipo).toBeDefined();
      expect(component._editFormGroup.controls.id_utente).toBeDefined();
    });

    it('should set tipo as required', () => {
      component._initEditForm();

      component._editFormGroup.controls.tipo.setValue(null);
      expect(component._editFormGroup.controls.tipo.valid).toBe(false);

      component._editFormGroup.controls.tipo.setValue('referente');
      expect(component._editFormGroup.controls.tipo.valid).toBe(true);
    });

    it('should set id_utente as required', () => {
      component._initEditForm();

      // Enable it first to test validation
      component._editFormGroup.controls.id_utente.enable();
      component._editFormGroup.controls.id_utente.setValue(null);
      expect(component._editFormGroup.controls.id_utente.valid).toBe(false);

      component._editFormGroup.controls.id_utente.setValue('user1');
      expect(component._editFormGroup.controls.id_utente.valid).toBe(true);
    });
  });

  // === _addReferente ===

  describe('_addReferente', () => {
    it('should call loadAnagrafiche, _initReferentiSelect, _initEditForm and show modal', () => {
      const loadAnagSpy = vi.fn();
      const initSelectSpy = vi.fn();
      const initFormSpy = vi.fn();
      (component as any).loadAnagrafiche = loadAnagSpy;
      (component as any)._initReferentiSelect = initSelectSpy;
      (component as any)._initEditForm = initFormSpy;

      component.editTemplate = {} as any;

      component._addReferente();

      expect(loadAnagSpy).toHaveBeenCalled();
      expect(initSelectSpy).toHaveBeenCalledWith([]);
      expect(initFormSpy).toHaveBeenCalled();
      expect(mockModalService.show).toHaveBeenCalledWith({}, { ignoreBackdropClick: false });
    });

    it('should store modal reference', () => {
      const mockModalRef = { hide: vi.fn(), content: {} };
      mockModalService.show.mockReturnValue(mockModalRef);
      (component as any)._initReferentiSelect = vi.fn();

      component.editTemplate = {} as any;
      component._addReferente();

      expect(component._modalEditRef).toBe(mockModalRef);
    });
  });

  // === saveModal ===

  describe('saveModal', () => {
    it('should post and hide modal on success, then reload referenti', () => {
      const mockHide = vi.fn();
      component._modalEditRef = { hide: mockHide } as any;
      const reloadFn = vi.fn();
      (component as any)._loadServizioReferenti = reloadFn;
      mockApiService.postElementRelated.mockReturnValue(of({}));

      component.id = 5;
      const body = { tipo: 'referente', id_utente: 'u1' };
      component.saveModal(body);

      expect(mockApiService.postElementRelated).toHaveBeenCalledWith('servizi', 5, 'referenti', body);
      expect(mockHide).toHaveBeenCalled();
      expect(reloadFn).toHaveBeenCalled();
      expect(component._errorSave).toBe(false);
    });

    it('should set error on failure with details', () => {
      mockApiService.postElementRelated.mockReturnValue(throwError(() => ({ details: 'Specific error' })));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      component.saveModal({ tipo: 'referente', id_utente: 'u1' });

      expect(component._errorSave).toBe(true);
      expect(component._errorSaveMsg).toBe('Specific error');
      consoleSpy.mockRestore();
    });

    it('should set error on failure without details, using utils.GetErrorMsg', () => {
      mockApiService.postElementRelated.mockReturnValue(throwError(() => new Error('fail')));
      mockUtilService.GetErrorMsg.mockReturnValue('Util Error Message');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      component.saveModal({ tipo: 'referente', id_utente: 'u1' });

      expect(component._errorSave).toBe(true);
      expect(component._errorSaveMsg).toBe('Util Error Message');
      consoleSpy.mockRestore();
    });

    it('should reset error flags before posting', () => {
      component._errorSave = true;
      component._errorSaveMsg = 'old error';
      mockApiService.postElementRelated.mockReturnValue(of({}));
      component._modalEditRef = { hide: vi.fn() } as any;
      (component as any)._loadServizioReferenti = vi.fn();

      component.saveModal({ tipo: 'referente', id_utente: 'u1' });

      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('');
    });
  });

  // === _deleteReferente ===

  describe('_deleteReferente', () => {
    it('should show confirmation dialog', () => {
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });

      component._deleteReferente({ source: { utente: { id_utente: 'u1' }, tipo: 'referente' } });

      expect(mockModalService.show).toHaveBeenCalled();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.Attention');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.MESSAGE.AreYouSure');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.BUTTON.Cancel');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.BUTTON.Confirm');
    });

    it('should delete on confirm and reload referenti', () => {
      mockModalService.show.mockReturnValue({
        content: { onClose: of(true) },
        hide: vi.fn()
      });
      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      const reloadFn = vi.fn();
      (component as any)._loadServizioReferenti = reloadFn;

      component.id = 5;
      component._deleteReferente({ source: { utente: { id_utente: 'u1' }, tipo: 'referente' } });

      expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith(
        'servizi', 5, 'referenti/u1?tipo_referente=referente'
      );
      expect(reloadFn).toHaveBeenCalled();
    });

    it('should not delete when user cancels', () => {
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });

      component._deleteReferente({ source: { utente: { id_utente: 'u1' }, tipo: 'referente' } });

      expect(mockApiService.deleteElementRelated).not.toHaveBeenCalled();
    });

    it('should show error message on delete failure', () => {
      mockModalService.show.mockReturnValue({
        content: { onClose: of(true) },
        hide: vi.fn()
      });
      mockApiService.deleteElementRelated.mockReturnValue(throwError(() => new Error('fail')));

      component.id = 5;
      component._deleteReferente({ source: { utente: { id_utente: 'u1' }, tipo: 'referente' } });

      expect(component._error).toBe(true);
      expect(Tools.showMessage).toHaveBeenCalledWith('APP.MESSAGE.ERROR.NoDeleteReferent', 'danger', true);
    });

    it('should store modal reference', () => {
      const mockRef = { content: { onClose: of(false) }, hide: vi.fn() };
      mockModalService.show.mockReturnValue(mockRef);

      component._deleteReferente({ source: { utente: { id_utente: 'u1' }, tipo: 'referente' } });

      expect(component._modalConfirmRef).toBe(mockRef);
    });

    it('should pass correct initialState to modal', () => {
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn()
      });

      component._deleteReferente({ source: { utente: { id_utente: 'u1' }, tipo: 'referente' } });

      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].ignoreBackdropClick).toBe(true);
      expect(callArgs[1].initialState).toBeDefined();
      expect(callArgs[1].initialState.confirmColor).toBe('danger');
    });
  });

  // === _hasControlError ===

  describe('_hasControlError (additional)', () => {
    it('should return false when control has no errors', () => {
      component._editFormGroup = {
        controls: {
          testField: { errors: null, touched: true }
        }
      } as any;
      expect(component._hasControlError('testField')).toBeFalsy();
    });

    it('should return false when control is not touched', () => {
      component._editFormGroup = {
        controls: {
          testField: { errors: { required: true }, touched: false }
        }
      } as any;
      expect(component._hasControlError('testField')).toBeFalsy();
    });
  });

  // === _initReferentiSelect ===

  describe('_initReferentiSelect', () => {
    it('should initialize referenti$ observable with default values', async () => {
      component._initReferentiSelect([{ id: 'user1', name: 'Test' }]);

      expect(component.referenti$).toBeDefined();
      const result = await firstValueFrom(component.referenti$);
      expect(result).toEqual([{ id: 'user1', name: 'Test' }]);
    });

    it('should initialize referenti$ with empty default', async () => {
      component._initReferentiSelect([]);

      const result = await firstValueFrom(component.referenti$);
      expect(result).toEqual([]);
    });

    it('should set referenti$ observable', () => {
      component._initReferentiSelect();

      expect(component.referenti$).toBeDefined();
    });

    it('should filter out null values from referentiInput$', async () => {
      vi.useFakeTimers();
      component._initReferentiSelect([]);

      const results: any[] = [];
      component.referenti$.subscribe(val => results.push(val));

      // First emission is the default value
      expect(results.length).toBe(1);

      // Emit null - should be filtered out
      component.referentiInput$.next(null as any);
      vi.advanceTimersByTime(600);

      expect(results.length).toBe(1); // still only the default
      vi.useRealTimers();
    });

    it('should filter out short values below minLengthTerm', async () => {
      vi.useFakeTimers();
      component.minLengthTerm = 3;
      component._initReferentiSelect([]);

      const results: any[] = [];
      component.referenti$.subscribe(val => results.push(val));

      // Emit short string
      component.referentiInput$.next('ab');
      vi.advanceTimersByTime(600);

      expect(results.length).toBe(1); // only default
      vi.useRealTimers();
    });

    it('should call getUtenti when valid term is emitted', async () => {
      vi.useFakeTimers();
      mockUtilService.getUtenti.mockReturnValue(of([{ id: 'u1', nome: 'Mario' }]));
      component._isDominioEsterno = false;
      component._idDominioEsterno = 'org1';
      component.tipoReferente = 'referente';
      component.referentiFilter = 'referente_servizio';

      component._initReferentiSelect([]);

      const results: any[] = [];
      component.referenti$.subscribe(val => results.push(val));

      component.referentiInput$.next('Mario');
      vi.advanceTimersByTime(600);

      expect(mockUtilService.getUtenti).toHaveBeenCalledWith('Mario', 'referente_servizio', 'abilitato', 'org1', false);
      expect(results.length).toBe(2); // default + search result
      expect(results[1]).toEqual([{ id: 'u1', nome: 'Mario' }]);
      expect(component.referentiLoading).toBe(false);
      vi.useRealTimers();
    });

    it('should pass null as organizzazione when _isDominioEsterno is true', async () => {
      vi.useFakeTimers();
      mockUtilService.getUtenti.mockReturnValue(of([]));
      component._isDominioEsterno = true;
      component._idDominioEsterno = 'org1';
      component.tipoReferente = 'referente_tecnico';

      component._initReferentiSelect([]);
      component.referenti$.subscribe(() => {});

      component.referentiInput$.next('test');
      vi.advanceTimersByTime(600);

      expect(mockUtilService.getUtenti).toHaveBeenCalledWith('test', '', 'abilitato', null, true);
      vi.useRealTimers();
    });

    it('should handle getUtenti error gracefully', async () => {
      vi.useFakeTimers();
      mockUtilService.getUtenti.mockReturnValue(throwError(() => new Error('fail')));

      component._initReferentiSelect([]);

      const results: any[] = [];
      component.referenti$.subscribe(val => results.push(val));

      component.referentiInput$.next('error');
      vi.advanceTimersByTime(600);

      // Should return empty array on error
      expect(results.length).toBe(2);
      expect(results[1]).toEqual([]);
      vi.useRealTimers();
    });

    it('should set referentiLoading to true before search', async () => {
      vi.useFakeTimers();
      let loadingDuringCall = false;
      mockUtilService.getUtenti.mockImplementation(() => {
        loadingDuringCall = component.referentiLoading;
        return of([]);
      });

      component._initReferentiSelect([]);
      component.referenti$.subscribe(() => {});

      component.referentiInput$.next('search');
      vi.advanceTimersByTime(600);

      expect(loadingDuringCall).toBe(true);
      expect(component.referentiLoading).toBe(false); // reset after
      vi.useRealTimers();
    });
  });

  // === onChangeTipo ===

  describe('onChangeTipo (additional)', () => {
    it('should disable id_utente when tipo is empty string', () => {
      component._initEditForm();
      component._editFormGroup.controls.tipo.setValue('');

      component.onChangeTipo({ nome: '', filter: '' });

      expect(component._editFormGroup.controls.id_utente.disabled).toBe(true);
    });

    it('should enable id_utente when tipo is non-empty', () => {
      component._initEditForm();
      component._editFormGroup.controls.tipo.setValue('referente_tecnico');

      component.onChangeTipo({ nome: 'referente_tecnico', filter: '' });

      expect(component._editFormGroup.controls.id_utente.enabled).toBe(true);
    });

    it('should clear id_utente value', () => {
      component._initEditForm();
      component._editFormGroup.controls.id_utente.enable();
      component._editFormGroup.controls.id_utente.setValue('user1');

      component.onChangeTipo({ nome: 'referente', filter: 'referente_servizio,gestore,coordinatore' });

      expect(component._editFormGroup.controls.id_utente.value).toBeNull();
    });

    it('should call _initReferentiSelect', () => {
      component._initEditForm();
      const mockFn = vi.fn();
      (component as any)._initReferentiSelect = mockFn;

      component.onChangeTipo({ nome: 'referente', filter: 'filter' });

      expect(mockFn).toHaveBeenCalled();
    });
  });

  // === _canAddMapper ===

  describe('_canAddMapper (additional)', () => {
    it('should return true when only referente restricted', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente']);
      // referente is restricted => no push for referente
      // referente_superiore is NOT restricted => push true
      // _lstPerm = [true] => result = true
      expect(component._canAddMapper()).toBe(true);
    });

    it('should return true when only referente_superiore restricted', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente_superiore']);
      // referente NOT restricted => push true
      // referente_superiore restricted => no push
      // _lstPerm = [true] => result = true
      expect(component._canAddMapper()).toBe(true);
    });

    it('should call _getClassesNotModifiable with correct params', () => {
      component.service = { stato: 'bozza' };
      component._canAddMapper();
      expect(mockAuthenticationService._getClassesNotModifiable).toHaveBeenCalledWith('servizio', 'servizio', 'bozza');
    });

    it('should handle null service stato', () => {
      component.service = null;
      expect(() => component._canAddMapper()).not.toThrow();
    });
  });

  // === onActionMonitor ===

  describe('onActionMonitor (additional)', () => {
    it('should not navigate for unknown actions', () => {
      component.service = { id_servizio: '42' };
      component.onActionMonitor({ action: 'unknown' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // === onBreadcrumb ===

  describe('onBreadcrumb', () => {
    it('should navigate with queryParamsHandling preserve', () => {
      component.onBreadcrumb({ url: '/test/path' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/test/path'], { queryParamsHandling: 'preserve' });
    });
  });

  // === _onCloseEdit ===

  describe('_onCloseEdit', () => {
    it('should set _isEdit to false regardless of event', () => {
      component._isEdit = true;
      component._onCloseEdit(null);
      expect(component._isEdit).toBe(false);
    });
  });

  // === Default property values ===

  describe('default property values', () => {
    it('should have default _spin of 0', () => {
      expect(component._spin).toBe(0);
    });

    it('should have default _isEdit of false', () => {
      expect(component._isEdit).toBe(false);
    });

    it('should have default _hasFilter of false', () => {
      expect(component._hasFilter).toBe(false);
    });

    it('should have default _preventMultiCall of false', () => {
      expect(component._preventMultiCall).toBe(false);
    });

    it('should have default _error of false', () => {
      expect(component._error).toBe(false);
    });

    it('should have default _errorSave of false', () => {
      expect(component._errorSave).toBe(false);
    });

    it('should have default _useRoute of false', () => {
      expect(component._useRoute).toBe(false);
    });

    it('should have default _useDialog of true', () => {
      expect(component._useDialog).toBe(true);
    });

    it('should have default message strings', () => {
      expect(component._message).toBe('APP.MESSAGE.NoReferent');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoReferentHelp');
    });

    it('should have default showHistory, showSearch, showSorting as true', () => {
      expect(component.showHistory).toBe(true);
      expect(component.showSearch).toBe(true);
      expect(component.showSorting).toBe(true);
    });

    it('should have default sortField and sortDirection', () => {
      expect(component.sortField).toBe('date');
      expect(component.sortDirection).toBe('asc');
    });

    it('should have empty arrays for sortFields and searchFields', () => {
      expect(component.sortFields).toEqual([]);
      expect(component.searchFields).toEqual([]);
    });

    it('should have default minLengthTerm of 1', () => {
      expect(component.minLengthTerm).toBe(1);
    });

    it('should have default tipoReferente and referentiFilter as empty', () => {
      expect(component.tipoReferente).toBe('');
      expect(component.referentiFilter).toBe('');
    });

    it('should have empty anagrafiche object', () => {
      expect(component.anagrafiche).toEqual({});
    });

    it('should have default _isDominioEsterno as false', () => {
      expect(component._isDominioEsterno).toBe(false);
    });

    it('should have default _idDominioEsterno as null', () => {
      expect(component._idDominioEsterno).toBeNull();
    });

    it('should have default _fromDashboard as false', () => {
      expect(component._fromDashboard).toBe(false);
    });

    it('should have default breadcrumbs', () => {
      expect(component.breadcrumbs).toBeDefined();
      expect(component.breadcrumbs.length).toBe(3);
    });

    it('should have default _editCurrent as null', () => {
      expect(component._editCurrent).toBeNull();
    });

    it('should have empty servizioReferenti and dominioReferenti', () => {
      expect(component.servizioReferenti).toEqual([]);
      expect(component.dominioReferenti).toEqual([]);
    });

    it('should have _errorSaveMsg as false string', () => {
      expect(component._errorSaveMsg).toBe('false');
    });

    it('should have _updateMapper as empty string', () => {
      expect(component._updateMapper).toBe('');
    });

    it('should have referentiInput$ as Subject', () => {
      expect(component.referentiInput$).toBeDefined();
    });

    it('should have referentiLoading as false', () => {
      expect(component.referentiLoading).toBe(false);
    });
  });

  // === _initSearchForm ===

  describe('_initSearchForm', () => {
    it('should create form with q control', () => {
      (component as any)._initSearchForm();
      expect(component._formGroup.get('q')).toBeTruthy();
      expect(component._formGroup.get('q')!.value).toBe('');
    });
  });

  // === _timestampToMoment ===

  describe('_timestampToMoment (additional)', () => {
    it('should return correct date for valid timestamp', () => {
      const result = component._timestampToMoment(1609459200000);
      expect(result!.getFullYear()).toBe(2021);
    });

    it('should return null for undefined-like value (NaN treated as truthy)', () => {
      // NaN is falsy, so it should return null
      expect(component._timestampToMoment(NaN)).toBeNull();
    });
  });

  // === closeModal ===

  describe('closeModal (additional)', () => {
    it('should reset error state and hide modal', () => {
      const mockHide = vi.fn();
      component._modalEditRef = { hide: mockHide } as any;
      component._errorSave = true;
      component._errorSaveMsg = 'some error';

      component.closeModal();

      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('');
      expect(mockHide).toHaveBeenCalled();
    });
  });

  // === loadAnagrafiche ===

  describe('loadAnagrafiche (additional)', () => {
    it('should set referente with correct filter', () => {
      component.loadAnagrafiche();
      expect(component.anagrafiche['tipo-referente'][0].filter).toBe('referente_servizio,gestore,coordinatore');
    });

    it('should set referente_tecnico with empty filter', () => {
      component.loadAnagrafiche();
      expect(component.anagrafiche['tipo-referente'][1].filter).toBe('');
    });
  });

  // === setCurrTab ===

  describe('setCurrTab', () => {
    it('should accept any string', () => {
      component.setCurrTab('CUSTOM');
      expect(component.currTab).toBe('CUSTOM');
    });
  });

  // === Edge cases for constructor route subscriptions ===

  describe('constructor route subscriptions', () => {
    it('should call _initBreadcrumb when componentBreadcrumbs data arrives', () => {
      const mockFn = vi.fn();
      (component as any)._initBreadcrumb = mockFn;
      const breadcrumbsData = {
        service: { id_servizio: 'svc1' },
        breadcrumbs: []
      };
      mockRouteDataSubject.next({ componentBreadcrumbs: breadcrumbsData });
      expect(mockFn).toHaveBeenCalled();
    });

    it('should call _initBreadcrumb when from=dashboard in queryParams', () => {
      const mockFn = vi.fn();
      (component as any)._initBreadcrumb = mockFn;
      mockRouteQueryParamsSubject.next({ from: 'dashboard' });
      expect(mockFn).toHaveBeenCalled();
    });

    it('should not call _initBreadcrumb when queryParams has no from', () => {
      const mockFn = vi.fn();
      (component as any)._initBreadcrumb = mockFn;
      mockRouteQueryParamsSubject.next({});
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  // === _onChangeTipoReferente ===

  describe('_onChangeTipoReferente (additional)', () => {
    it('should set specific filter string for referent=true', () => {
      component._onChangeTipoReferente(true);
      expect(component.referentiFilter).toBe('referente_servizio,gestore,coordinatore');
    });

    it('should set empty string for referent=false', () => {
      component._onChangeTipoReferente(false);
      expect(component.referentiFilter).toBe('');
    });
  });

  // === Integration: _loadServizio chain ===

  describe('_loadServizio integration', () => {
    it('should handle dominio with esterna=false', () => {
      const mockService = {
        nome: 'Svc', versione: '1', stato: 'ok',
        dominio: {
          id_dominio: 'dom1',
          soggetto_referente: {
            organizzazione: { esterna: false, id_organizzazione: 'org1' }
          }
        }
      };
      mockApiService.getDetails
        .mockReturnValueOnce(of({ ruoli: [] }))
        .mockReturnValueOnce(of(mockService));

      component.id = 1;
      (component as any)._loadServizioReferenti = vi.fn();
      (component as any)._loadDominioReferenti = vi.fn();

      component._loadServizio();

      expect(component._isDominioEsterno).toBe(false);
      expect(component._idDominioEsterno).toBe('org1');
    });
  });

  // === Multiple referenti mapping ===

  describe('_loadServizioReferenti multiple items', () => {
    const referentiConfig = {
      itemRow: {
        primaryText: '${nome}',
        secondaryText: '${cognome}',
        metadata: { text: '${tipo}', label: '' },
        secondaryMetadata: ''
      },
      options: {}
    };

    it('should map multiple referenti correctly', () => {
      // Restore real _loadServizioReferenti for this test
      _loadServizioReferentiSpy.mockRestore();
      component.referentiConfig = referentiConfig;
      const mockContent = [
        { id: 1, nome: 'Mario', cognome: 'Rossi', tipo: 'referente' },
        { id: 2, nome: 'Luigi', cognome: 'Verdi', tipo: 'referente_tecnico' },
        { id: 3, nome: 'Anna', cognome: 'Bianchi', tipo: 'referente' }
      ];
      mockApiService.getDetails.mockReturnValue(of({ content: mockContent, page: { totalElements: 3 }, _links: null }));

      component.id = 5;
      component._loadServizioReferenti();

      expect(component.servizioReferenti.length).toBe(3);
      expect(component.servizioReferenti[0].id).toBe(1);
      expect(component.servizioReferenti[1].id).toBe(2);
      expect(component.servizioReferenti[2].id).toBe(3);
    });
  });
});
