import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { VerificheComponent, ViewType } from './verifiche.component';
import { Tools } from '@linkit/components';

describe('VerificheComponent', () => {
  let component: VerificheComponent;
  let savedConfigurazione: any;

  let routeParamsSubject: Subject<any>;
  let routeQueryParamsSubject: Subject<any>;

  const mockRoute = {
    params: of({}),
    queryParams: of({})
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getMonitor: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({
      api: { profili: [] }
    })
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({})
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;

    routeParamsSubject = new Subject<any>();
    routeQueryParamsSubject = new Subject<any>();
    mockRoute.params = routeParamsSubject.asObservable();
    mockRoute.queryParams = routeQueryParamsSubject.asObservable();

    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((key: string) => key);
    mockApiService.getDetails.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [] }));

    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});

    // Default: use simple of({}) for route so constructor doesn't block
    mockRoute.queryParams = of({});
    mockRoute.params = of({});

    component = new VerificheComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockAuthenticationService,
      mockUtilService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(VerificheComponent.Name).toBe('VerificheComponent');
  });

  it('should have model set to verifiche', () => {
    expect(component.model).toBe('verifiche');
  });

  it('should have default property values', () => {
    expect(component.environmentId).toBe('collaudo');
    expect(component.viewType).toBe(ViewType.All);
    expect(component.period).toEqual({});
    expect(component.service).toBeNull();
    expect(component.serviceApi).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component.desktop).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._preventMultiCall).toBe(false);
    expect(component._twoCol).toBe(false);
    expect(component._fromDashboard).toBe(false);
    expect(component.data).toEqual([]);
    expect(component.adhesions).toEqual([]);
  });

  it('should expose ViewType enum', () => {
    expect(component.ViewType).toBe(ViewType);
  });

  it('should set config from configService in constructor', () => {
    expect(component.config).toEqual({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://localhost');
  });

  it('should set service to null when getCurrentNavigation returns null', () => {
    expect(component.service).toBeNull();
  });

  it('should set service from navigation state if available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { nome: 'TestService' } } }
    });
    const comp = new VerificheComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockTools, mockApiService, mockAuthenticationService, mockUtilService
    );
    expect(comp.service).toEqual({ nome: 'TestService' });
  });

  it('should set _fromDashboard when queryParams has from=dashboard', () => {
    mockRoute.queryParams = of({ from: 'dashboard' });
    const comp = new VerificheComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockTools, mockApiService, mockAuthenticationService, mockUtilService
    );
    expect(comp._fromDashboard).toBe(true);
  });

  it('should not set _fromDashboard when queryParams has no from=dashboard', () => {
    mockRoute.queryParams = of({ from: 'other' });
    const comp = new VerificheComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockTools, mockApiService, mockAuthenticationService, mockUtilService
    );
    expect(comp._fromDashboard).toBe(false);
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
  });

  it('should set error messages on _setErrorMessages true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages on _setErrorMessages false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.SelectStatistic');
    expect(component._messageHelp).toBe('APP.MESSAGE.SelectVerifichelp');
  });

  it('should return true for _isCollaudo when environmentId is collaudo', () => {
    component.environmentId = 'collaudo';
    expect(component._isCollaudo()).toBe(true);
  });

  it('should return false for _isCollaudo when environmentId is produzione', () => {
    component.environmentId = 'produzione';
    expect(component._isCollaudo()).toBe(false);
  });

  it('should switch to collaudo on _showCollaudo', () => {
    component.environmentId = 'produzione';
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
  });

  it('should switch to produzione on _showProduzione', () => {
    component.environmentId = 'collaudo';
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should return true for _isViewTypeAll when viewType is All', () => {
    component.viewType = ViewType.All;
    expect(component._isViewTypeAll()).toBe(true);
  });

  it('should return false for _isViewTypeAll when viewType is not All', () => {
    component.viewType = ViewType.Certificati;
    expect(component._isViewTypeAll()).toBe(false);
  });

  it('should return true for _isViewTypeEventi for EventiConnection', () => {
    component.viewType = ViewType.EventiConnection;
    expect(component._isViewTypeEventi()).toBe(true);
  });

  it('should return true for _isViewTypeEventi for EventiRead', () => {
    component.viewType = ViewType.EventiRead;
    expect(component._isViewTypeEventi()).toBe(true);
  });

  it('should return false for _isViewTypeEventi for All', () => {
    component.viewType = ViewType.All;
    expect(component._isViewTypeEventi()).toBe(false);
  });

  it('should return true for _isViewTypeViolazioni when Violazioni', () => {
    component.viewType = ViewType.Violazioni;
    expect(component._isViewTypeViolazioni()).toBe(true);
  });

  it('should return false for _isViewTypeViolazioni when not Violazioni', () => {
    component.viewType = ViewType.All;
    expect(component._isViewTypeViolazioni()).toBe(false);
  });

  it('should return correct icon for _getIconTypeEventiConnettivita', () => {
    component.viewType = ViewType.Violazioni;
    expect(component._getIconTypeEventiConnettivita()).toBe('triangle');

    component.viewType = ViewType.EventiConnection;
    expect(component._getIconTypeEventiConnettivita()).toBe('clock');

    component.viewType = ViewType.EventiRead;
    expect(component._getIconTypeEventiConnettivita()).toBe('clock');

    component.viewType = ViewType.All;
    expect(component._getIconTypeEventiConnettivita()).toBe('hdd-network');
  });

  it('should return correct title for _getTitleTypeEventiConnettivita', () => {
    component.viewType = ViewType.Violazioni;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.ViolazioniPolicyRateLimiting');

    component.viewType = ViewType.EventiConnection;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.EventiConnectionTimeout');

    component.viewType = ViewType.EventiRead;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.EventiReadTimeout');

    component.viewType = ViewType.All;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.Connettivita');
  });

  it('should return true for _isErogatoSoggettoDominioMapper with matching role', () => {
    expect(component._isErogatoSoggettoDominioMapper({ ruolo: 'erogato_soggetto_dominio' })).toBe(true);
  });

  it('should return false for _isErogatoSoggettoDominioMapper with non-matching role', () => {
    expect(component._isErogatoSoggettoDominioMapper({ ruolo: 'erogato_soggetto_aderente' })).toBe(false);
  });

  it('should return erogazioni for _tipoVerificaMapper with erogato_soggetto_dominio and no soggetto_interno', () => {
    component.service = { dominio: { soggetto_referente: { nome: 'test' } } };
    expect(component._tipoVerificaMapper({ ruolo: 'erogato_soggetto_dominio' })).toBe('erogazioni');
  });

  it('should return fruizioni for _tipoVerificaMapper with erogato_soggetto_dominio and soggetto_interno', () => {
    component.service = { soggetto_interno: { nome: 'test' } };
    expect(component._tipoVerificaMapper({ ruolo: 'erogato_soggetto_dominio' })).toBe('fruizioni');
  });

  it('should return fruizioni for _tipoVerificaMapper with other roles', () => {
    expect(component._tipoVerificaMapper({ ruolo: 'erogato_soggetto_aderente' })).toBe('fruizioni');
  });

  // ======== NEW TESTS FOR COVERAGE ========

  describe('ngOnInit with viewType All', () => {
    it('should subscribe to route params and load config and service when id is present', () => {
      const routeParams = new Subject<any>();
      mockRoute.params = routeParams.asObservable();
      mockRoute.queryParams = of({});

      mockConfigService.getConfig.mockReturnValue(of({ twoCol: true }));
      mockApiService.getDetails.mockReturnValue(of({
        nome: 'TestService', versione: '1.0', stato: 'pubblicato',
        dominio: { soggetto_referente: { nome: 'Sogg1' } }
      }));
      mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));

      const comp = new VerificheComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockAuthenticationService, mockUtilService
      );
      comp.viewType = ViewType.All;
      comp.ngOnInit();

      routeParams.next({ id: '42', id_ambiente: 'produzione' });

      expect(comp.id).toBe('42');
      expect(comp.environmentId).toBe('produzione');
      expect(comp.verificheConfig).toEqual({ twoCol: true });
      expect(comp._twoCol).toBe(true);
    });

    it('should use default environmentId collaudo when id_ambiente not in params', () => {
      const routeParams = new Subject<any>();
      mockRoute.params = routeParams.asObservable();
      mockRoute.queryParams = of({});

      mockConfigService.getConfig.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ nome: 'Svc', versione: '1' }));
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      const comp = new VerificheComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockAuthenticationService, mockUtilService
      );
      comp.viewType = ViewType.All;
      comp.ngOnInit();

      routeParams.next({ id: '10' });

      expect(comp.environmentId).toBe('collaudo');
    });

    it('should init breadcrumb instead of loading when service already exists from navigation', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'NavService', versione: '2.0', stato: 'bozza' } } }
      });

      const routeParams = new Subject<any>();
      mockRoute.params = routeParams.asObservable();
      mockRoute.queryParams = of({});

      mockConfigService.getConfig.mockReturnValue(of({ twoCol: false }));

      const comp = new VerificheComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockAuthenticationService, mockUtilService
      );
      comp.viewType = ViewType.All;
      comp.ngOnInit();

      routeParams.next({ id: '5' });

      // Service was set from navigation, so _loadServizio should NOT have been called
      // (service is kept from navigation state, breadcrumbs are initialized)
      expect(comp.service).toEqual({ nome: 'NavService', versione: '2.0', stato: 'bozza' });
      expect(comp.breadcrumbs.length).toBe(3);
    });

    it('should not proceed when route params have no id', () => {
      const routeParams = new Subject<any>();
      mockRoute.params = routeParams.asObservable();
      mockRoute.queryParams = of({});

      const comp = new VerificheComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockAuthenticationService, mockUtilService
      );
      comp.viewType = ViewType.All;
      comp.ngOnInit();

      routeParams.next({});

      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit with viewType not All', () => {
    it('should load config and service directly without route params', () => {
      mockRoute.params = of({});
      mockRoute.queryParams = of({});

      mockConfigService.getConfig.mockReturnValue(of({ twoCol: true }));
      mockApiService.getDetails.mockReturnValue(of({ nome: 'Svc', versione: '1' }));
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      const comp = new VerificheComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockAuthenticationService, mockUtilService
      );
      comp.viewType = ViewType.Certificati;
      comp.id = 99;
      comp.ngOnInit();

      expect(mockConfigService.getConfig).toHaveBeenCalledWith('verifiche');
      expect(comp.verificheConfig).toEqual({ twoCol: true });
      expect(comp._twoCol).toBe(true);
    });
  });

  describe('ngOnChanges', () => {
    it('should set _viewType to Connettivita for Violazioni', () => {
      component.ngOnChanges({
        viewType: { currentValue: ViewType.Violazioni, previousValue: ViewType.All, firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component._viewType).toBe(ViewType.Connettivita);
    });

    it('should set _viewType to Connettivita for EventiConnection', () => {
      component.ngOnChanges({
        viewType: { currentValue: ViewType.EventiConnection, previousValue: ViewType.All, firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component._viewType).toBe(ViewType.Connettivita);
    });

    it('should set _viewType to Connettivita for EventiRead', () => {
      component.ngOnChanges({
        viewType: { currentValue: ViewType.EventiRead, previousValue: ViewType.All, firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component._viewType).toBe(ViewType.Connettivita);
    });

    it('should set _viewType to same value for default case (e.g. All)', () => {
      component.ngOnChanges({
        viewType: { currentValue: ViewType.All, previousValue: ViewType.Certificati, firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component._viewType).toBe(ViewType.All);
    });

    it('should set _viewType to Certificati for Certificati', () => {
      component.ngOnChanges({
        viewType: { currentValue: ViewType.Certificati, previousValue: ViewType.All, firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component._viewType).toBe(ViewType.Certificati);
    });

    it('should not change _viewType when no viewType change', () => {
      component._viewType = ViewType.All;
      component.ngOnChanges({} as any);
      expect(component._viewType).toBe(ViewType.All);
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // Just verify it runs without error and sets desktop
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngOnDestroy', () => {
    it('should be callable', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('_onResize', () => {
    it('should set desktop based on window width', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('_initBreadcrumb', () => {
    it('should create breadcrumbs with service name and version when service exists', () => {
      component.service = { nome: 'MyService', versione: '3.0', stato: 'pubblicato' };
      component.id = 10;
      component._fromDashboard = false;
      component._initBreadcrumb();

      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[1].label).toBe('MyService v. 3.0');
      expect(component.breadcrumbs[1].tooltip).toBe('APP.WORKFLOW.STATUS.pubblicato');
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.Checks');
    });

    it('should create breadcrumbs with id when no service and id exists', () => {
      component.service = null;
      component.id = 42;
      component._fromDashboard = false;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('42');
    });

    it('should create breadcrumbs with New title when no service and no id', () => {
      component.service = null;
      component.id = undefined as any;
      component._fromDashboard = false;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('should create dashboard breadcrumbs when _fromDashboard is true', () => {
      component.service = { nome: 'DashSvc', versione: '1.0', stato: 'bozza' };
      component.id = 5;
      component._fromDashboard = true;
      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should use /view suffix in URL when SERVIZI_VIEW is TRUE in localStorage', () => {
      localStorage.setItem('SERVIZI_VIEW', 'TRUE');

      component.service = { nome: 'Svc', versione: '1', stato: 'draft' };
      component.id = 7;
      component._fromDashboard = false;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].url).toBe('/servizi/7/view');

      localStorage.removeItem('SERVIZI_VIEW');
    });

    it('should NOT use /view suffix when SERVIZI_VIEW is not TRUE', () => {
      localStorage.setItem('SERVIZI_VIEW', 'FALSE');

      component.service = { nome: 'Svc', versione: '1', stato: 'draft' };
      component.id = 7;
      component._fromDashboard = false;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].url).toBe('/servizi/7');

      localStorage.removeItem('SERVIZI_VIEW');
    });
  });

  describe('_loadServizio', () => {
    it('should load service details and adhesions when id is set', async () => {
      component.id = 10;
      const serviceData = { nome: 'LoadedSvc', versione: '2.0', stato: 'pubblicato' };
      mockApiService.getDetails.mockReturnValue(of(serviceData));
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }], page: {} }));

      await component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10);
      expect(component.service).toEqual(serviceData);
      expect(component.breadcrumbs.length).toBe(3);
    });

    it('should not load when id is not set', async () => {
      component.id = undefined as any;
      await component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call Tools.OnError on failure', async () => {
      component.id = 10;
      const error = new Error('Network error');
      mockApiService.getDetails.mockReturnValue({
        toPromise: () => Promise.reject(error)
      });

      await component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalledWith(error);
    });

    it('should not set service if getDetails returns falsy', async () => {
      component.id = 10;
      mockApiService.getDetails.mockReturnValue(of(null));

      await component._loadServizio();

      expect(component.service).toBeNull();
    });
  });

  describe('_loadServiceApi', () => {
    it('should load api list for the service', () => {
      component.id = 10;
      const apiContent = [
        { id_api: 1, nome: 'API1' },
        { id_api: 2, nome: 'API2' }
      ];
      mockApiService.getList.mockReturnValue(of({
        content: apiContent,
        page: { totalElements: 2 },
        _links: { next: '/api?page=2' }
      }));

      component._loadServiceApi(false);

      expect(component.serviceApi.length).toBe(2);
      expect(component.serviceApi[0].id).toBe(1);
      expect(component.serviceApi[1].id).toBe(2);
      expect(component._spin).toBe(false);
      expect(component._preventMultiCall).toBe(false);
    });

    it('should reset serviceApi when url is empty', () => {
      component.id = 10;
      component.serviceApi = [{ id: 99 }];
      mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));

      component._loadServiceApi(false, null, '');

      expect(component.serviceApi).toEqual([]);
    });

    it('should append to serviceApi when url is provided', () => {
      component.id = 10;
      component.serviceApi = [{ id: 1, id_api: 1 }];
      mockApiService.getList.mockReturnValue(of({
        content: [{ id_api: 2, nome: 'API2' }],
        page: {}
      }));

      component._loadServiceApi(false, null, '/api?page=2');

      expect(component.serviceApi.length).toBe(2);
    });

    it('should handle error from api list', () => {
      component.id = 10;
      mockApiService.getList.mockReturnValue(throwError(() => new Error('API error')));

      component._loadServiceApi(false);

      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
    });

    it('should not load when id is not set', () => {
      component.id = undefined as any;
      component._loadServiceApi(false);
      expect(mockApiService.getList).not.toHaveBeenCalled();
    });

    it('should handle response without content', () => {
      component.id = 10;
      mockApiService.getList.mockReturnValue(of({}));

      component._loadServiceApi(false);

      expect(component.serviceApi).toEqual([]);
      expect(component._spin).toBe(false);
    });

    it('should handle null response', () => {
      component.id = 10;
      mockApiService.getList.mockReturnValue(of(null));

      component._loadServiceApi(false);

      expect(component._spin).toBe(false);
    });

    it('should pass query params including id_servizio', () => {
      component.id = 15;
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      component._loadServiceApi(false, { filter: 'test' });

      expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ id_servizio: 15, sort: 'id,asc', filter: 'test' })
      );
    });

    it('should clear error messages before loading', () => {
      component.id = 10;
      component._error = true;
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      component._loadServiceApi(false);

      // _setErrorMessages(false) is called first
      expect(component._message).toBe('APP.MESSAGE.SelectStatistic');
    });
  });

  describe('loadAdhesions', () => {
    it('should load adhesions for a given service id', () => {
      const adhesionContent = [{ id: 1, nome: 'Adesione1' }];
      mockApiService.getList.mockReturnValue(of({ content: adhesionContent }));

      (component as any).loadAdhesions('10');

      expect(mockApiService.getList).toHaveBeenCalledWith('adesioni', { params: { id_servizio: '10' } });
      expect(component.adhesions).toEqual(adhesionContent);
    });

    it('should call Tools.OnError on adhesion load failure', () => {
      mockApiService.getList.mockReturnValue(throwError(() => new Error('Adhesion error')));

      (component as any).loadAdhesions('10');

      expect(Tools.OnError).toHaveBeenCalled();
    });
  });

  describe('onSelect', () => {
    it('should be callable without error', () => {
      expect(() => component.onSelect({ id: 1 })).not.toThrow();
    });
  });

  describe('onResize', () => {
    it('should be callable without error', () => {
      expect(() => component.onResize({ target: { innerWidth: 800 } })).not.toThrow();
    });
  });

  describe('_hasIdentificativoeServicePDND', () => {
    it('should return true when proprieta_custom contains identificativo_eservice_pdnd', () => {
      const api = {
        proprieta_custom: [
          { nome: 'identificativo_eservice_pdnd', valore: '123' }
        ]
      };
      expect(component._hasIdentificativoeServicePDND(api)).toBe(true);
    });

    it('should return false when proprieta_custom does not contain identificativo_eservice_pdnd', () => {
      const api = {
        proprieta_custom: [
          { nome: 'other_prop', valore: 'abc' }
        ]
      };
      expect(component._hasIdentificativoeServicePDND(api)).toBe(false);
    });

    it('should return false when proprieta_custom is empty', () => {
      const api = { proprieta_custom: [] };
      expect(component._hasIdentificativoeServicePDND(api)).toBe(false);
    });

    it('should return false when proprieta_custom is undefined', () => {
      const api = {};
      expect(component._hasIdentificativoeServicePDND(api)).toBe(false);
    });
  });

  describe('_hasPDNDAuthType', () => {
    it('should return true when api has PDND auth type in profili', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {
          profili: [
            { codice_interno: 'profile1', auth_type: ['pdnd', 'basic'] }
          ]
        }
      });

      const api = {
        dati_erogazione: {
          gruppi_auth_type: [
            { profilo: 'profile1' }
          ]
        }
      };

      expect(component._hasPDNDAuthType(api)).toBe(true);
    });

    it('should return false when api has no PDND auth type in profili', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {
          profili: [
            { codice_interno: 'profile1', auth_type: ['basic', 'oauth'] }
          ]
        }
      });

      const api = {
        dati_erogazione: {
          gruppi_auth_type: [
            { profilo: 'profile1' }
          ]
        }
      };

      expect(component._hasPDNDAuthType(api)).toBe(false);
    });
  });

  describe('_isSoggettoPDND', () => {
    it('should return true when soggetto_referente is in PDND list', () => {
      component.service = {
        dominio: { soggetto_referente: { nome: 'SoggettoPDND' } }
      };
      mockAuthenticationService._getConfigModule.mockReturnValue([
        { nome_soggetto: 'SoggettoPDND' }
      ]);

      expect(component._isSoggettoPDND()).toBe(true);
    });

    it('should return false when soggetto_referente is not in PDND list', () => {
      component.service = {
        dominio: { soggetto_referente: { nome: 'OtherSoggetto' } }
      };
      mockAuthenticationService._getConfigModule.mockReturnValue([
        { nome_soggetto: 'SoggettoPDND' }
      ]);

      expect(component._isSoggettoPDND()).toBe(false);
    });

    it('should return false when service has no dominio', () => {
      component.service = {};
      mockAuthenticationService._getConfigModule.mockReturnValue([
        { nome_soggetto: 'SoggettoPDND' }
      ]);

      expect(component._isSoggettoPDND()).toBe(false);
    });

    it('should return false when PDND config returns empty array', () => {
      component.service = {
        dominio: { soggetto_referente: { nome: 'Test' } }
      };
      mockAuthenticationService._getConfigModule.mockReturnValue([]);

      expect(component._isSoggettoPDND()).toBe(false);
    });
  });

  describe('_hasIdentificativoeServicePDNDMapper', () => {
    it('should delegate to _isSoggettoPDND', () => {
      component.service = {
        dominio: { soggetto_referente: { nome: 'PDND' } }
      };
      mockAuthenticationService._getConfigModule.mockReturnValue([
        { nome_soggetto: 'PDND' }
      ]);

      expect(component._hasIdentificativoeServicePDNDMapper({})).toBe(true);
    });
  });

  describe('ViewType enum', () => {
    it('should have correct values', () => {
      expect(ViewType.All).toBe('all');
      expect(ViewType.Certificati).toBe('certificati');
      expect(ViewType.Connettivita).toBe('connettivita');
      expect(ViewType.Violazioni).toBe('violazioni');
      expect(ViewType.EventiConnection).toBe('eventi-connection');
      expect(ViewType.EventiRead).toBe('eventi-read');
    });
  });

  describe('_getIconTypeEventiConnettivita for Connettivita', () => {
    it('should return hdd-network for Connettivita viewType', () => {
      component.viewType = ViewType.Connettivita;
      expect(component._getIconTypeEventiConnettivita()).toBe('hdd-network');
    });

    it('should return hdd-network for Certificati viewType', () => {
      component.viewType = ViewType.Certificati;
      expect(component._getIconTypeEventiConnettivita()).toBe('hdd-network');
    });
  });

  describe('_getTitleTypeEventiConnettivita for Connettivita', () => {
    it('should return Connettivita for Connettivita viewType', () => {
      component.viewType = ViewType.Connettivita;
      expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.Connettivita');
    });
  });
});
