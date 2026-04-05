import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { ServizioAllegatiComponent } from './servizio-allegati.component';
import { Tools } from '@linkit/components';

describe('ServizioAllegatiComponent', () => {
  let component: ServizioAllegatiComponent;
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
    url: '/servizi/1/allegati',
  } as any;
  const mockModalService = { show: vi.fn() } as any;
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
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob())),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    _confirmDelection: vi.fn(),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    isGestore: vi.fn().mockReturnValue(false),
    canTypeAttachment: vi.fn().mockReturnValue(true),
    canAdd: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: {
        visibilita_allegati_consentite: ['pubblica', 'dominio'],
      },
    };
    component = new ServizioAllegatiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManager,
      mockApiService,
      mockUtils,
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
    expect(ServizioAllegatiComponent.Name).toBe('ServizioAllegatiComponent');
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

  it('should set default sort field and direction', () => {
    expect(component.sortField).toBe('documento.filename');
    expect(component.sortDirection).toBe('asc');
  });

  it('should have searchFields after init', () => {
    expect(component.searchFields).toBeDefined();
    expect(Array.isArray(component.searchFields)).toBe(true);
  });

  it('should set _tipiVisibilitaAllegato from Configurazione', () => {
    expect(component._tipiVisibilitaAllegato).toBeDefined();
    expect(component._tipiVisibilitaAllegato.length).toBe(2);
  });

  it('_setErrorApi should toggle error messages', () => {
    component._setErrorApi(true);
    expect((component as any)._error).toBe(true);
    expect((component as any)._message).toBe('APP.MESSAGE.ERROR.Default');

    component._setErrorApi(false);
    expect((component as any)._error).toBe(false);
    expect((component as any)._message).toBe('APP.MESSAGE.NoResults');
  });

  it('onBreadcrumb should navigate', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
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
      const comp = new ServizioAllegatiComponent(
        routeWithData, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      expect(comp._componentBreadcrumbs).toEqual(breadcrumbsData);
    });

    it('should not set _componentBreadcrumbs when route.data has no componentBreadcrumbs', () => {
      const routeNoData = { ...mockRoute, data: of({}) };
      const comp = new ServizioAllegatiComponent(
        routeNoData, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      expect(comp._componentBreadcrumbs).toBeNull();
    });

    it('should filter out gestore from _tipiVisibilitaAllegato when user is not gestore', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblica', 'gestore', 'dominio'],
        },
      };
      mockAuthService.isGestore.mockReturnValue(false);
      const comp = new ServizioAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      expect(comp._tipiVisibilitaAllegato.length).toBe(2);
      expect(comp._tipiVisibilitaAllegato.find((i: any) => i.value === 'gestore')).toBeUndefined();
    });

    it('should include gestore in _tipiVisibilitaAllegato when user is gestore', () => {
      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblica', 'gestore', 'dominio'],
        },
      };
      mockAuthService.isGestore.mockReturnValue(true);
      const comp = new ServizioAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      expect(comp._tipiVisibilitaAllegato.length).toBe(3);
      expect(comp._tipiVisibilitaAllegato.find((i: any) => i.value === 'gestore')).toBeDefined();
    });

    it('should set _fromDashboard=true when queryParams.from is dashboard', () => {
      const routeWithDashboard = {
        ...mockRoute,
        queryParams: of({ from: 'dashboard' }),
      };
      const comp = new ServizioAllegatiComponent(
        routeWithDashboard, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      expect(comp._fromDashboard).toBe(true);
    });

    it('should keep _fromDashboard=false when queryParams.from is not dashboard', () => {
      expect(component._fromDashboard).toBe(false);
    });

    it('should read service and grant from router navigation state', () => {
      const navState = { service: { nome: 'TestSrv' }, grant: { ruoli: ['referente'] } };
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: { state: navState } });
      const comp = new ServizioAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      expect(comp.service).toEqual({ nome: 'TestSrv' });
      expect(comp._grant).toEqual({ ruoli: ['referente'] });
    });

    it('should set hideVersions from config', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } },
      });
      const comp = new ServizioAllegatiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      expect(comp.hideVersions).toBe(true);
      // Restore mock to prevent leaking to subsequent tests
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Layout: { enableOpenInNewTab: false },
          Services: { hideVersions: false },
        },
      });
    });
  });

  // =========================================================================
  // ngOnInit tests
  // =========================================================================

  describe('ngOnInit', () => {
    it('should set _tipoAllegato to generico when url ends with allegati', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      mockRouter.url = '/servizi/1/allegati';
      component.ngOnInit();
      expect(component._tipoAllegato).toBe('generico');
    });

    it('should set _tipoAllegato to specifica when url ends with specifica', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      mockRouter.url = '/servizi/1/specifica';
      component.ngOnInit();
      expect(component._tipoAllegato).toBe('specifica');
    });

    it('should use cid param when both id and cid are present', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      const routeWithCid = {
        ...mockRoute,
        params: of({ id: '1', cid: '42' }),
      };
      const comp = new ServizioAllegatiComponent(
        routeWithCid, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      comp.ngOnInit();
      expect(comp.id).toBe('42');
    });

    it('should call _loadServizio when no service is present', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      component.service = null;
      mockConfigService.getConfig.mockReturnValue(of({ showAllAttachments: false }));
      mockApiService.getDetails.mockReturnValue(of({}));
      component.ngOnInit();
      // _loadServizio calls getDetails for grant then for service
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should call _loadServizioAllegati when service is present', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.service = { nome: 'Test', versione: '1', stato: 'bozza' };
      mockConfigService.getConfig.mockReturnValue(of({ showAllAttachments: false }));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.ngOnInit();
      // getDetails called for allegati
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should register PROFILE_UPDATE handler via eventsManagerService.on', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.ngOnInit();
      expect(mockEventsManager.on).toHaveBeenCalledWith('PROFILE:UPDATE', expect.any(Function));
    });

    it('PROFILE_UPDATE handler should update _tipiVisibilitaAllegato and call _initSearchForm', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.ngOnInit();
      // Retrieve the handler registered for PROFILE_UPDATE
      const onCall = mockEventsManager.on.mock.calls.find((c: any) => c[0] === 'PROFILE:UPDATE');
      expect(onCall).toBeDefined();
      const handler = onCall[1];

      Tools.Configurazione = {
        servizio: {
          visibilita_allegati_consentite: ['pubblica', 'gestore', 'dominio'],
        },
      };
      mockAuthService.isGestore.mockReturnValue(true);
      handler({});
      expect(component._tipiVisibilitaAllegato.length).toBe(3);
      expect(component.searchFields.length).toBe(3);
    });

    it('should set _showAllAttachments from allegatiConfig', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.service = { nome: 'Test', versione: '1', stato: 'bozza' };
      mockConfigService.getConfig.mockReturnValue(of({ showAllAttachments: true }));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.ngOnInit();
      expect(component._showAllAttachments).toBe(true);
    });

    it('should not proceed when params have no id', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      const routeNoId = { ...mockRoute, params: of({}) };
      const comp = new ServizioAllegatiComponent(
        routeNoId, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockApiService,
        mockUtils, mockAuthService
      );
      vi.clearAllMocks();
      comp.ngOnInit();
      // getConfig should not be called because id is falsy
      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _initBreadcrumb tests
  // =========================================================================

  describe('_initBreadcrumb', () => {
    it('should use service nome and versione in breadcrumbs when available', () => {
      component.service = { nome: 'API Test', versione: '2', stato: 'pubblicato' };
      component.id = '5';
      component.hideVersions = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('API Test v. 2');
    });

    it('should use just nome when hideVersions is true', () => {
      component.service = { nome: 'API Test', versione: '2', stato: 'pubblicato' };
      component.id = '5';
      component.hideVersions = true;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('API Test');
    });

    it('should use id when service is null', () => {
      component.service = null;
      component.id = '99';
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('99');
    });

    it('should use ... when both service and id are null', () => {
      component.service = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('...');
    });

    it('should show Dashboard breadcrumb when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component.service = { nome: 'S', versione: '1', stato: 'bozza' };
      component.id = '5';
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should show Services label when no _componentBreadcrumbs and not from dashboard', () => {
      component._fromDashboard = false;
      component._componentBreadcrumbs = null;
      component.service = { nome: 'S', versione: '1', stato: 'bozza' };
      component.id = '5';
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[0].iconBs).toBe('grid-3x3-gap');
    });

    it('should show Components label and prepend breadcrumbs with _componentBreadcrumbs', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: '10' },
        breadcrumbs: [{ label: 'Service Parent', url: '/servizi/10', type: 'link' }]
      } as any;
      component._fromDashboard = false;
      component.service = { nome: 'Comp', versione: '1', stato: 'bozza' };
      component.id = '7';
      component._initBreadcrumb();
      // The first entry is from componentBreadcrumbs.breadcrumbs (unshifted)
      expect(component.breadcrumbs[0].label).toBe('Service Parent');
      // Then Components
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
      expect(component.breadcrumbs[1].url).toBe('/servizi/10/componenti/');
    });

    it('should use nome v. versione format for componentBreadcrumbs even with hideVersions', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: '10' },
        breadcrumbs: []
      } as any;
      component.hideVersions = true;
      component.service = { nome: 'CName', versione: '3', stato: 'bozza' };
      component.id = '7';
      component._initBreadcrumb();
      // componentBreadcrumbs ignores hideVersions
      expect(component.breadcrumbs.find((b: any) => b.label === 'CName v. 3')).toBeDefined();
    });

    it('should use else branch when _fromDashboard is true but _componentBreadcrumbs is also set', () => {
      // The condition is _fromDashboard && !_componentBreadcrumbs, so both true => else branch
      component._fromDashboard = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: '10' },
        breadcrumbs: [{ label: 'Parent', url: '/p', type: 'link' }]
      } as any;
      component.service = { nome: 'S', versione: '1', stato: 'bozza' };
      component.id = '5';
      component._initBreadcrumb();
      // _componentBreadcrumbs.breadcrumbs are unshifted, so Parent is first
      expect(component.breadcrumbs[0].label).toBe('Parent');
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
    });
  });

  // =========================================================================
  // _loadServizio tests
  // =========================================================================

  describe('_loadServizio', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should load grant then service on success', () => {
      component.id = '10';
      const grantData = { ruoli: ['referente'] };
      const serviceData = { nome: 'MySrv', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(of(serviceData));
      component._loadServizio();
      expect(component._grant).toEqual(grantData);
      expect(component.service).toEqual(serviceData);
      expect(component._spin).toBe(false);
    });

    it('should call Tools.OnError when grant request fails', () => {
      component.id = '10';
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant fail')));
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should call Tools.OnError when service request fails', () => {
      component.id = '10';
      const grantData = { ruoli: ['referente'] };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(throwError(() => new Error('service fail')));
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });

    it('should do nothing when id is null', () => {
      component.id = null;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set service to null and _spin to true at start', () => {
      component.id = '10';
      component.service = { old: true };
      mockApiService.getDetails.mockReturnValue(of({}));
      // spy before call to capture intermediate state
      let capturedService: any;
      let capturedSpin: any;
      mockApiService.getDetails.mockImplementationOnce(() => {
        capturedService = component.service;
        capturedSpin = component._spin;
        return of({});
      });
      component._loadServizio();
      expect(capturedService).toBeNull();
      expect(capturedSpin).toBe(true);
    });
  });

  // =========================================================================
  // _loadServizioAllegati tests
  // =========================================================================

  describe('_loadServizioAllegati', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.id = '5';
    });

    it('should map response content to serviceAllegati', () => {
      const response = {
        content: [
          { uuid: 'a1', filename: 'file1.pdf' },
          { uuid: 'a2', filename: 'file2.pdf' },
        ],
        page: { totalElements: 2 },
        _links: { next: null },
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati();
      expect(component.serviceAllegati.length).toBe(2);
      expect(component.serviceAllegati[0].id).toBe('a1');
      expect(component.serviceAllegati[0].source.uuid).toBe('a1');
      expect(component.serviceAllegati[1].id).toBe('a2');
    });

    it('should set _error on api failure', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      component._loadServizioAllegati();
      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
      expect(component._showLoading).toBe(true);
    });

    it('should append items when url param is provided', () => {
      component.serviceAllegati = [{ id: 'existing', editMode: false, source: {} }];
      const response = {
        content: [{ uuid: 'new1', filename: 'new.pdf' }],
        page: {},
        _links: {},
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati(null, 'http://next-page');
      expect(component.serviceAllegati.length).toBe(2);
      expect(component.serviceAllegati[0].id).toBe('existing');
      expect(component.serviceAllegati[1].id).toBe('new1');
    });

    it('should replace items when no url param', () => {
      component.serviceAllegati = [{ id: 'old', editMode: false, source: {} }];
      const response = {
        content: [{ uuid: 'new1', filename: 'new.pdf' }],
        page: {},
        _links: {},
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati();
      expect(component.serviceAllegati.length).toBe(1);
      expect(component.serviceAllegati[0].id).toBe('new1');
    });

    it('should add tipologia_allegato to query when _showAllAttachments is false', () => {
      component._showAllAttachments = false;
      component._tipoAllegato = 'generico';
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioAllegati();
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ tipologia_allegato: 'generico' })
      );
    });

    it('should not add tipologia_allegato when _showAllAttachments is true', () => {
      component._showAllAttachments = true;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioAllegati();
      const call = mockUtils._queryToHttpParams.mock.calls[0][0];
      expect(call.tipologia_allegato).toBeUndefined();
    });

    it('should not set _spin when _showLoading is false', () => {
      component._showLoading = false;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioAllegati();
      // _spin = this._showLoading => false
      // After response _spin is set to false again
      expect(component._spin).toBe(false);
    });

    it('should do nothing when id is null', () => {
      component.id = null;
      component._loadServizioAllegati();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set _preventMultiCall to false after success', () => {
      component._preventMultiCall = true;
      mockApiService.getDetails.mockReturnValue(of({ content: [{ uuid: 'x' }], page: {} }));
      component._loadServizioAllegati();
      expect(component._preventMultiCall).toBe(false);
    });

    it('should call Tools.ScrollTo(0) after success', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioAllegati();
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should reset _showLoading to true after success', () => {
      component._showLoading = false;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioAllegati();
      expect(component._showLoading).toBe(true);
    });

    it('should reset _showLoading to true after error', () => {
      component._showLoading = false;
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      component._loadServizioAllegati();
      expect(component._showLoading).toBe(true);
    });

    it('should handle null response gracefully', () => {
      mockApiService.getDetails.mockReturnValue(of(null));
      component._loadServizioAllegati();
      expect(component._spin).toBe(false);
    });
  });

  // =========================================================================
  // __loadMoreData tests
  // =========================================================================

  describe('__loadMoreData', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.id = '5';
    });

    it('should call _loadServizioAllegati when _links.next exists and _preventMultiCall is false', () => {
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = false;
      // _loadServizioAllegati sets _preventMultiCall back to false on success,
      // so we verify the api call was made instead
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.__loadMoreData();
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should not call _loadServizioAllegati when _links.next is absent', () => {
      component._links = {};
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioAllegati when _preventMultiCall is true', () => {
      component._links = { next: { href: 'http://next-page' } };
      component._preventMultiCall = true;
      component.__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not call when _links is null', () => {
      component._links = null;
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _onNew tests
  // =========================================================================

  describe('_onNew', () => {
    it('should call _editAllegato with no arguments (new attachment)', () => {
      const spy = vi.spyOn(component, '_editAllegato' as any).mockImplementation(() => {});
      component._onNew();
      expect(spy).toHaveBeenCalledWith();
    });
  });

  // =========================================================================
  // _onEdit tests
  // =========================================================================

  describe('_onEdit', () => {
    it('should call searchBarForm._pinLastSearch and _editAllegato when searchBarForm exists', () => {
      const mockPinLastSearch = vi.fn();
      component.searchBarForm = { _pinLastSearch: mockPinLastSearch } as any;
      const spy = vi.spyOn(component, '_editAllegato' as any).mockImplementation(() => {});
      const data = { id: '1' };
      component._onEdit({}, data);
      expect(mockPinLastSearch).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(data);
    });

    it('should call _editAllegato without calling _pinLastSearch when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      const spy = vi.spyOn(component, '_editAllegato' as any).mockImplementation(() => {});
      const data = { id: '2' };
      component._onEdit({}, data);
      expect(spy).toHaveBeenCalledWith(data);
    });
  });

  // =========================================================================
  // _onSubmit tests
  // =========================================================================

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      const mockOnSearch = vi.fn();
      component.searchBarForm = { _onSearch: mockOnSearch } as any;
      component._onSubmit({});
      expect(mockOnSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // =========================================================================
  // _onSearch tests
  // =========================================================================

  describe('_onSearch', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.id = '5';
    });

    it('should set _filterData and call _loadServizioAllegati', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      const filterValues = [{ field: 'q', value: 'test' }];
      component._onSearch(filterValues);
      expect(component._filterData).toBe(filterValues);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _resetForm tests
  // =========================================================================

  describe('_resetForm', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.id = '5';
    });

    it('should reset _filterData to empty array and reload', () => {
      component._filterData = [{ field: 'q', value: 'old' }];
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._resetForm();
      expect(component._filterData).toEqual([]);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _onSort tests
  // =========================================================================

  describe('_onSort', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.id = '5';
    });

    it('should set sortField and sortDirection and reload', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._onSort({ sortField: 'documento.tipo', sortBy: 'desc' });
      expect(component.sortField).toBe('documento.tipo');
      expect(component.sortDirection).toBe('desc');
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _editAllegato tests
  // =========================================================================

  describe('_editAllegato', () => {
    it('should open modal for new attachment (data=null)', () => {
      const onCloseSub = new Subject<boolean>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() },
        hide: vi.fn(),
      });
      component.id = '5';
      component._editAllegato();
      expect(mockModalService.show).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          ignoreBackdropClick: true,
          initialState: expect.objectContaining({
            isNew: true,
            isEdit: false,
            current: undefined,
            multiple: true,
          }),
        })
      );
    });

    it('should open modal for editing existing attachment', () => {
      const onCloseSub = new Subject<boolean>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() },
        hide: vi.fn(),
      });
      component.id = '5';
      const data = { source: { uuid: 'abc', filename: 'test.pdf' } };
      component._editAllegato(data);
      expect(mockModalService.show).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          initialState: expect.objectContaining({
            isNew: false,
            isEdit: true,
            current: data.source,
            multiple: false,
          }),
        })
      );
    });

    it('should reload allegati when modal onClose emits true', () => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      const onCloseSub = new Subject<boolean>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() },
        hide: vi.fn(),
      });
      component.id = '5';
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._editAllegato();
      vi.clearAllMocks();
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      onCloseSub.next(true);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should not reload when modal onClose emits false', () => {
      const onCloseSub = new Subject<boolean>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() },
        hide: vi.fn(),
      });
      component.id = '5';
      component._editAllegato();
      vi.clearAllMocks();
      onCloseSub.next(false);
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _confirmDelection tests
  // =========================================================================

  describe('_confirmDelection', () => {
    it('should delegate to utils._confirmDelection', () => {
      const data = { source: { uuid: 'abc' } };
      component._confirmDelection(data);
      expect(mockUtils._confirmDelection).toHaveBeenCalledWith(data, expect.any(Function));
    });
  });

  // =========================================================================
  // __deleteAllegato tests
  // =========================================================================

  describe('__deleteAllegato', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      component.id = '5';
    });

    it('should delete successfully and reload', () => {
      const data = { source: { uuid: 'del1' } };
      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.__deleteAllegato(data);
      expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith('servizi', '5', 'allegati/del1');
      expect(component._deleting).toBe(false);
    });

    it('should set error on delete failure', () => {
      const data = { source: { uuid: 'del2' } };
      mockApiService.deleteElementRelated.mockReturnValue(throwError(() => new Error('delete fail')));
      component.__deleteAllegato(data);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._deleting).toBe(false);
    });

    it('should set _showLoading to false and _deleting to true initially', () => {
      const data = { source: { uuid: 'del3' } };
      let capturedDeleting: boolean | undefined;
      let capturedShowLoading: boolean | undefined;
      mockApiService.deleteElementRelated.mockImplementation(() => {
        capturedDeleting = component._deleting;
        capturedShowLoading = component._showLoading;
        return of({});
      });
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.__deleteAllegato(data);
      expect(capturedDeleting).toBe(true);
      expect(capturedShowLoading).toBe(false);
    });

    it('should call __resetError before deleting', () => {
      const data = { source: { uuid: 'del4' } };
      component._error = true;
      component._errorMsg = 'old error';
      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      // __resetError is called first, clearing error state
      let errorDuringCall: boolean | undefined;
      mockApiService.deleteElementRelated.mockImplementation(() => {
        errorDuringCall = component._error;
        return of({});
      });
      component.__deleteAllegato(data);
      expect(errorDuringCall).toBe(false);
    });
  });

  // =========================================================================
  // _downloadAllegato tests
  // =========================================================================

  describe('_downloadAllegato', () => {
    beforeEach(() => {
      (globalThis as any).saveAs = vi.fn();
      component.id = '5';
    });

    afterEach(() => {
      delete (globalThis as any).saveAs;
    });

    it('should download successfully with index=-1 (global downloading)', () => {
      const responseBody = new Blob(['data']);
      mockApiService.download.mockReturnValue(of({ body: responseBody }));
      const data = { source: { uuid: 'dl1', filename: 'report.pdf' } };
      component._downloadAllegato(data);
      expect(mockApiService.download).toHaveBeenCalledWith('servizi', '5', 'allegati/dl1/download');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(responseBody, 'report.pdf');
      expect(component._downloading).toBe(false);
    });

    it('should download successfully with index>=0 (per-item downloading)', () => {
      const responseBody = new Blob(['data']);
      mockApiService.download.mockReturnValue(of({ body: responseBody }));
      const data = { source: { uuid: 'dl2', filename: 'spec.pdf' } };
      component._downloadAllegato(data, 2);
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(responseBody, 'spec.pdf');
      expect(component._downloadings[2]).toBe(false);
    });

    it('should set _downloading=true while in progress with index=-1', () => {
      let capturedDownloading: boolean | undefined;
      mockApiService.download.mockImplementation(() => {
        capturedDownloading = component._downloading;
        return of({ body: new Blob() });
      });
      const data = { source: { uuid: 'dl3', filename: 'f.pdf' } };
      component._downloadAllegato(data);
      expect(capturedDownloading).toBe(true);
    });

    it('should set _downloadings[index]=true while in progress with index>=0', () => {
      let capturedFlag: boolean | undefined;
      mockApiService.download.mockImplementation(() => {
        capturedFlag = component._downloadings[1];
        return of({ body: new Blob() });
      });
      const data = { source: { uuid: 'dl4', filename: 'f.pdf' } };
      component._downloadAllegato(data, 1);
      expect(capturedFlag).toBe(true);
    });

    it('should set error on download failure with index=-1', () => {
      mockApiService.download.mockReturnValue(throwError(() => new Error('dl fail')));
      const data = { source: { uuid: 'dl5', filename: 'f.pdf' } };
      component._downloadAllegato(data);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._downloading).toBe(false);
    });

    it('should set error on download failure with index>=0', () => {
      mockApiService.download.mockReturnValue(throwError(() => new Error('dl fail')));
      const data = { source: { uuid: 'dl6', filename: 'f.pdf' } };
      component._downloadAllegato(data, 3);
      expect(component._error).toBe(true);
      expect(component._downloadings[3]).toBe(false);
    });

    it('should call __resetError before downloading', () => {
      component._error = true;
      component._errorMsg = 'old';
      mockApiService.download.mockReturnValue(of({ body: new Blob() }));
      const data = { source: { uuid: 'dl7', filename: 'f.pdf' } };
      component._downloadAllegato(data);
      // After success, error is still reset
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });
  });

  // =========================================================================
  // __resetError tests
  // =========================================================================

  describe('__resetError', () => {
    it('should reset _error and _errorMsg', () => {
      component._error = true;
      component._errorMsg = 'some error';
      component.__resetError();
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });
  });

  // =========================================================================
  // _updateTipiAllegati tests
  // =========================================================================

  describe('_updateTipiAllegati', () => {
    it('should filter TipiAllegati based on canTypeAttachment', () => {
      const savedTipi = Tools.TipiAllegati;
      (Tools as any).TipiAllegati = [
        { label: 'generico', value: 'generico' },
        { label: 'specifica', value: 'specifica' },
        { label: 'specifica_collaudo', value: 'specifica_collaudo' },
      ];
      mockAuthService.canTypeAttachment
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      component._updateTipiAllegati();
      expect(component._tipiAllegati.length).toBe(2);
      expect(component._tipiAllegati[0].value).toBe('generico');
      expect(component._tipiAllegati[1].value).toBe('specifica_collaudo');
      (Tools as any).TipiAllegati = savedTipi;
    });
  });

  // =========================================================================
  // _canTypeAttachment, _canTypeAttachmentMapper, _canAddMapper, _canEditMapper
  // =========================================================================

  describe('canTypeAttachment / canAddMapper / canEditMapper', () => {
    it('_canTypeAttachment should delegate to authenticationService.canTypeAttachment', () => {
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'] } as any;
      mockAuthService.canTypeAttachment.mockReturnValue(true);
      const result = component._canTypeAttachment('generico');
      expect(mockAuthService.canTypeAttachment).toHaveBeenCalledWith('servizio', 'pubblicato', 'generico', ['referente']);
      expect(result).toBe(true);
    });

    it('_canTypeAttachmentMapper should delegate to authenticationService.canTypeAttachment', () => {
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['gestore'] } as any;
      mockAuthService.canTypeAttachment.mockReturnValue(false);
      const result = component._canTypeAttachmentMapper('specifica');
      expect(mockAuthService.canTypeAttachment).toHaveBeenCalledWith('servizio', 'bozza', 'specifica', ['gestore']);
      expect(result).toBe(false);
    });

    it('_canAddMapper should delegate to authenticationService.canAdd', () => {
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'] } as any;
      mockAuthService.canAdd.mockReturnValue(true);
      const result = component._canAddMapper();
      expect(mockAuthService.canAdd).toHaveBeenCalledWith('servizio', 'pubblicato', ['referente']);
      expect(result).toBe(true);
    });

    it('_canEditMapper should delegate to authenticationService.canEdit', () => {
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['gestore'] } as any;
      mockAuthService.canEdit.mockReturnValue(false);
      const result = component._canEditMapper();
      expect(mockAuthService.canEdit).toHaveBeenCalledWith('servizio', 'allegati', 'bozza', ['gestore']);
      expect(result).toBe(false);
    });

    it('_canTypeAttachment should handle null service and grant', () => {
      component.service = null;
      component._grant = null;
      component._canTypeAttachment('generico');
      expect(mockAuthService.canTypeAttachment).toHaveBeenCalledWith('servizio', undefined, 'generico', undefined);
    });
  });

  // =========================================================================
  // onActionMonitor tests
  // =========================================================================

  describe('onActionMonitor', () => {
    it('should navigate to service view on backview action', () => {
      component.service = { id_servizio: '42' };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
    });

    it('should do nothing on unknown action', () => {
      component.service = { id_servizio: '42' };
      component.onActionMonitor({ action: 'unknown' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
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
  // _timestampToMoment tests
  // =========================================================================

  describe('_timestampToMoment', () => {
    it('should return a Date for truthy value', () => {
      const ts = 1609459200000; // 2021-01-01T00:00:00.000Z
      const result = component._timestampToMoment(ts);
      expect(result).toBeInstanceOf(Date);
      expect(result!.getTime()).toBe(ts);
    });

    it('should return null for falsy value (0)', () => {
      expect(component._timestampToMoment(0)).toBeNull();
    });

    it('should return null for NaN treated as falsy', () => {
      expect(component._timestampToMoment(NaN)).toBeNull();
    });
  });

  // =========================================================================
  // _initSearchForm tests
  // =========================================================================

  describe('_initSearchForm', () => {
    it('should create searchFields with 3 entries', () => {
      component._initSearchForm();
      expect(component.searchFields.length).toBe(3);
      expect(component.searchFields[0].field).toBe('q');
      expect(component.searchFields[1].field).toBe('tipologia_allegato');
      expect(component.searchFields[2].field).toBe('visibilita_allegato');
    });

    it('should create _formGroup with correct controls', () => {
      component._initSearchForm();
      expect(component._formGroup.get('q')).toBeDefined();
      expect(component._formGroup.get('tipologia_allegato')).toBeDefined();
      expect(component._formGroup.get('visibilita_allegato')).toBeDefined();
    });

    it('should build enumValues for tipologia_allegato from Tools.TipiAllegati', () => {
      const savedTipi = Tools.TipiAllegati;
      (Tools as any).TipiAllegati = [
        { label: 'generico', value: 'generico' },
        { label: 'specifica', value: 'specifica' },
      ];
      component._initSearchForm();
      const tipoField = component.searchFields.find((f: any) => f.field === 'tipologia_allegato');
      expect(tipoField.enumValues).toEqual({
        generico: 'APP.ALLEGATI.TIPI.generico',
        specifica: 'APP.ALLEGATI.TIPI.specifica',
      });
      (Tools as any).TipiAllegati = savedTipi;
    });

    it('should build enumValues for visibilita_allegato from _tipiVisibilitaAllegato', () => {
      component._tipiVisibilitaAllegato = [
        { label: 'pubblica', value: 'pubblica' },
        { label: 'dominio', value: 'dominio' },
      ];
      component._initSearchForm();
      const visField = component.searchFields.find((f: any) => f.field === 'visibilita_allegato');
      expect(visField.enumValues).toEqual({
        pubblica: 'APP.VISIBILITY.pubblica',
        dominio: 'APP.VISIBILITY.dominio',
      });
    });

    it('should handle empty _tipiVisibilitaAllegato gracefully', () => {
      component._tipiVisibilitaAllegato = [];
      component._initSearchForm();
      const visField = component.searchFields.find((f: any) => f.field === 'visibilita_allegato');
      expect(visField.enumValues).toEqual({});
    });
  });

  // =========================================================================
  // ngAfterContentChecked tests
  // =========================================================================

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // =========================================================================
  // ngOnDestroy tests
  // =========================================================================

  describe('ngOnDestroy', () => {
    it('should be callable without errors', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // =========================================================================
  // _onResize tests
  // =========================================================================

  describe('_onResize', () => {
    it('should update desktop property', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });
});
