import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { ServizioApiPdndInformationsComponent } from './servizio-api-pdnd-informations.component';
import { Tools } from '@linkit/components';

describe('ServizioApiPdndInformationsComponent', () => {
  let component: ServizioApiPdndInformationsComponent;

  let routeData$: Subject<any>;
  let routeParams$: Subject<any>;
  let routeQueryParams$: Subject<any>;

  let mockRoute: any;
  let mockRouter: any;
  let mockTranslate: any;
  let mockConfigService: any;
  let mockTools: any;
  let mockApiService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    routeData$ = new Subject<any>();
    routeParams$ = new Subject<any>();
    routeQueryParams$ = new Subject<any>();

    mockRoute = {
      data: routeData$.asObservable(),
      params: routeParams$.asObservable(),
      queryParams: routeQueryParams$.asObservable(),
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
      getConfig: vi.fn().mockReturnValue(of({}))
    } as any;

    mockTools = {} as any;

    mockApiService = {
      getDetails: vi.fn().mockReturnValue(of({})),
      getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
      getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
      saveElement: vi.fn().mockReturnValue(of({})),
      putElement: vi.fn().mockReturnValue(of({})),
      deleteElement: vi.fn().mockReturnValue(of({}))
    } as any;

    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

    component = new ServizioApiPdndInformationsComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== BASIC / STATIC ==========

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiPdndInformationsComponent.Name).toBe('ServizioApiPdndInformationsComponent');
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
    expect(component._spin).toBe(true);
    expect(component._useRoute).toBe(false);
    expect(component._hasTabCollaudo).toBe(false);
    expect(component._hasTabProduzione).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
    expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
  });

  // ========== CONSTRUCTOR ==========

  describe('constructor', () => {
    it('should set service and grant from router navigation state', () => {
      const navState = {
        extras: {
          state: {
            service: { nome: 'TestService', versione: '1.0' },
            grant: { canWrite: true }
          }
        }
      };
      mockRouter.getCurrentNavigation.mockReturnValue(navState);

      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );

      expect(comp.service).toEqual({ nome: 'TestService', versione: '1.0' });
      expect(comp._grant).toEqual({ canWrite: true });
    });

    it('should set service to null when navigation state has no service', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: { state: {} } });

      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );

      expect(comp.service).toBeNull();
    });

    it('should set service to null when getCurrentNavigation returns null', () => {
      mockRouter.getCurrentNavigation.mockReturnValue(null);

      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );

      expect(comp.service).toBeNull();
    });

    it('should set hideVersions to true when config says so', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } }
      });

      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );

      expect(comp.hideVersions).toBe(true);
    });

    it('should default hideVersions to false when config is missing', () => {
      mockConfigService.getConfiguration.mockReturnValue({});

      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );

      expect(comp.hideVersions).toBe(false);
    });

    it('should subscribe to route.data and set componentBreadcrumbs', () => {
      const breadcrumbsData = {
        componentBreadcrumbs: {
          service: { id_servizio: 'svc-1' },
          breadcrumbs: [{ label: 'Parent', url: '/parent' }]
        }
      };

      routeData$.next(breadcrumbsData);

      expect(component._componentBreadcrumbs).toEqual(breadcrumbsData.componentBreadcrumbs);
    });

    it('should not set componentBreadcrumbs when route.data has no componentBreadcrumbs', () => {
      component._componentBreadcrumbs = null;
      routeData$.next({});
      expect(component._componentBreadcrumbs).toBeNull();
    });

    it('should call _initBreadcrumb when route.data has componentBreadcrumbs', () => {
      (component as any)._initBreadcrumb = vi.fn();

      routeData$.next({
        componentBreadcrumbs: {
          service: { id_servizio: 'svc-1' },
          breadcrumbs: [{ label: 'Root', url: '/' }]
        }
      });

      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });

    it('should set _fromDashboard and call _initBreadcrumb when queryParams.from is dashboard', () => {
      (component as any)._initBreadcrumb = vi.fn();

      routeQueryParams$.next({ from: 'dashboard' });

      expect(component._fromDashboard).toBe(true);
      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });

    it('should not set _fromDashboard when queryParams.from is not dashboard', () => {
      routeQueryParams$.next({ from: 'other' });
      expect(component._fromDashboard).toBe(false);
    });

    it('should not set _fromDashboard when queryParams is empty', () => {
      routeQueryParams$.next({});
      expect(component._fromDashboard).toBe(false);
    });
  });

  // ========== ngOnInit ==========

  describe('ngOnInit', () => {
    it('should subscribe to route.params and set sid, id, environmentId', () => {
      (component as any)._loadServizio = vi.fn();
      component.ngOnInit();

      routeParams$.next({ id: 'svc-1', aid: 42, id_ambiente: 'collaudo' });

      expect(component.sid).toBe('svc-1');
      expect(component.id).toBe(42);
      expect(component.environmentId).toBe('collaudo');
    });

    it('should use cid over id when cid is present in params', () => {
      (component as any)._loadServizio = vi.fn();
      component.ngOnInit();

      routeParams$.next({ id: 'svc-1', cid: 'comp-1', aid: 42 });

      expect(component.sid).toBe('comp-1');
    });

    it('should default environmentId to empty string when id_ambiente not present', () => {
      (component as any)._loadServizio = vi.fn();
      component.ngOnInit();

      routeParams$.next({ id: 'svc-1', aid: 42 });

      expect(component.environmentId).toBe('');
    });

    it('should call _loadServizio when service is null', () => {
      (component as any)._loadServizio = vi.fn();
      component.service = null;
      component.ngOnInit();

      routeParams$.next({ id: 'svc-1', aid: 42 });

      expect((component as any)._loadServizio).toHaveBeenCalled();
    });

    it('should call _initBreadcrumb and _autoSelectTab when service already exists', () => {
      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._autoSelectTab = vi.fn();
      component.service = { nome: 'TestService', versione: '1.0' };
      component.ngOnInit();

      routeParams$.next({ id: 'svc-1', aid: 42 });

      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
      expect((component as any)._autoSelectTab).toHaveBeenCalled();
    });

    it('should not call _loadServizio or _initBreadcrumb when id is missing', () => {
      (component as any)._loadServizio = vi.fn();
      (component as any)._initBreadcrumb = vi.fn();
      component.ngOnInit();

      routeParams$.next({});

      expect((component as any)._loadServizio).not.toHaveBeenCalled();
      expect((component as any)._initBreadcrumb).not.toHaveBeenCalled();
    });

    it('should subscribe to queryParams and set producerIdCollaudo and producerIdProduzione', () => {
      component.ngOnInit();

      routeQueryParams$.next({ producerIdCollaudo: 'prod-c', producerIdProduzione: 'prod-p' });

      expect(component.producerIdCollaudo).toBe('prod-c');
      expect(component.producerIdProduzione).toBe('prod-p');
    });

    it('should default producerIdCollaudo and producerIdProduzione to empty when not present', () => {
      component.ngOnInit();

      routeQueryParams$.next({});

      expect(component.producerIdCollaudo).toBe('');
      expect(component.producerIdProduzione).toBe('');
    });
  });

  // ========== ngAfterContentChecked ==========

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window.innerWidth', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // ========== _onResize ==========

  describe('_onResize', () => {
    it('should set desktop to true when innerWidth >= 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop to false when innerWidth < 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(false);
    });

    it('should set desktop to true when innerWidth is exactly 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 992, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(true);
    });
  });

  // ========== onBreadcrumb ==========

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  // ========== _showCollaudo ==========

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
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'collaudo-eservice-123' }]
        }]
      };
      component._showCollaudo();
      expect(component.eserviceId).toBe('collaudo-eservice-123');
    });

    it('should set eserviceId to empty when no collaudo eservice configured', () => {
      component.servizioApi = { proprieta_custom: [] };
      component._showCollaudo();
      expect(component.eserviceId).toBe('');
    });
  });

  // ========== _showProduzione ==========

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
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'prod-eservice-456' }]
        }]
      };
      component._showProduzione();
      expect(component.eserviceId).toBe('prod-eservice-456');
    });

    it('should set eserviceId to empty when no produzione eservice configured', () => {
      component.servizioApi = { proprieta_custom: [] };
      component._showProduzione();
      expect(component.eserviceId).toBe('');
    });
  });

  // ========== _isCollaudo / _isProduzione ==========

  describe('_isCollaudo / _isProduzione', () => {
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

    it('should return false for both when environmentId is empty', () => {
      component.environmentId = '';
      expect(component._isCollaudo()).toBe(false);
      expect(component._isProduzione()).toBe(false);
    });

    it('should return false for both when environmentId is arbitrary string', () => {
      component.environmentId = 'staging';
      expect(component._isCollaudo()).toBe(false);
      expect(component._isProduzione()).toBe(false);
    });
  });

  // ========== _hasPDNDConfiguredMapper ==========

  describe('_hasPDNDConfiguredMapper', () => {
    it('should return false when servizioApi is null', () => {
      component.servizioApi = null;
      expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
    });

    it('should return false when proprieta_custom is empty', () => {
      component.servizioApi = { proprieta_custom: [] };
      expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
    });

    it('should return true when collaudo eservice is configured (new convention)', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'some-id' }]
        }]
      };
      expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(true);
    });

    it('should return true when produzione eservice is configured (new convention)', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'some-id' }]
        }]
      };
      expect(component._hasPDNDConfiguredMapper('produzione')).toBe(true);
    });

    it('should return true when collaudo eservice is configured (old convention)', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'old-id' }]
        }]
      };
      expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(true);
    });

    it('should return true when produzione eservice is configured (old convention)', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'old-id' }]
        }]
      };
      expect(component._hasPDNDConfiguredMapper('produzione')).toBe(true);
    });

    it('should return false when eservice valore is empty', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: '' }]
        }]
      };
      expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
    });
  });

  // ========== _getEService ==========

  describe('_getEService', () => {
    it('should return eservice id from new convention for collaudo', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-123' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('eservice-123');
    });

    it('should return eservice id from new convention for produzione', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-prod-1' }]
        }]
      };
      expect(component._getEService('produzione')).toBe('eservice-prod-1');
    });

    it('should fallback to old convention for collaudo when new convention not found', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-old' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('eservice-old');
    });

    it('should fallback to old convention for produzione when new convention not found', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-old-prod' }]
        }]
      };
      expect(component._getEService('produzione')).toBe('eservice-old-prod');
    });

    it('should prefer new convention over old convention when both exist', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'new-value' }]
          },
          {
            gruppo: 'PDNDCollaudo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'old-value' }]
          }
        ]
      };
      expect(component._getEService('collaudo')).toBe('new-value');
    });

    it('should fallback to old convention when new convention has empty valore', () => {
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

    it('should return empty string when proprieta_custom is empty', () => {
      component.servizioApi = { proprieta_custom: [] };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string when servizioApi is null', () => {
      component.servizioApi = null;
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string when servizioApi has no proprieta_custom', () => {
      component.servizioApi = {};
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string when gruppo exists but property nome does not match', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'other_property', valore: 'some-value' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string when gruppo exists but proprieta is empty', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: []
        }]
      };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string when new convention has no matching property and old convention does not exist', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'wrong_property', valore: 'value' }]
        }]
      };
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should handle new convention found but valore undefined', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDProduzione_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd' }]
        }]
      };
      expect(component._getEService('produzione')).toBe('');
    });
  });

  // ========== _setLoading ==========

  describe('_setLoading', () => {
    it('should set _spin to true after timeout', () => {
      vi.useFakeTimers();
      component._setLoading(true);
      vi.advanceTimersByTime(30);
      expect(component._spin).toBe(true);
      vi.useRealTimers();
    });

    it('should set _spin to false after timeout', () => {
      vi.useFakeTimers();
      component._setLoading(false);
      vi.advanceTimersByTime(30);
      expect(component._spin).toBe(false);
      vi.useRealTimers();
    });

    it('should not set _spin before timeout completes', () => {
      vi.useFakeTimers();
      component._spin = true;
      component._setLoading(false);
      vi.advanceTimersByTime(10); // less than 20ms
      expect(component._spin).toBe(true); // not yet changed
      vi.advanceTimersByTime(20);
      expect(component._spin).toBe(false);
      vi.useRealTimers();
    });
  });

  // ========== onActionMonitor ==========

  describe('onActionMonitor', () => {
    it('should navigate to service view on backview action', () => {
      component.service = { id_servizio: '42' };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
    });

    it('should not navigate on unknown action', () => {
      mockRouter.navigate.mockClear();
      component.onActionMonitor({ action: 'unknown' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate on empty action', () => {
      mockRouter.navigate.mockClear();
      component.onActionMonitor({ action: '' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ========== _initBreadcrumb ==========

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with service nome and versione', () => {
      component.service = { nome: 'MyService', versione: '2.0', stato: 'PUBLISHED' };
      component.sid = 'svc-1';
      component.id = 10;
      component.servizioApi = null;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[0].iconBs).toBe('grid-3x3-gap');
      expect(component.breadcrumbs[1].label).toBe('MyService v. 2.0');
      expect(component.breadcrumbs[2].label).toBe('APP.SERVICES.TITLE.API');
      expect(component.breadcrumbs[3].label).toBe('10');
      expect(component.breadcrumbs[4].label).toBe('APP.TITLE.PDNDInformations');
    });

    it('should hide version when hideVersions is true (no componentBreadcrumbs)', () => {
      component.hideVersions = true;
      component.service = { nome: 'MyService', versione: '2.0', stato: 'PUBLISHED' };
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('MyService');
    });

    it('should always show version when componentBreadcrumbs is present (ignoring hideVersions)', () => {
      component.hideVersions = true;
      component.service = { nome: 'MyService', versione: '2.0', stato: 'PUBLISHED' };
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = {
        service: { id_servizio: 'parent-1' },
        breadcrumbs: [{ label: 'Root', url: '/root' }]
      } as any;

      component._initBreadcrumb();

      // With componentBreadcrumbs, title always includes version
      expect(component.breadcrumbs).toContainEqual(expect.objectContaining({ label: 'MyService v. 2.0' }));
    });

    it('should set title as id when service has no nome/versione', () => {
      component.service = null;
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('10');
    });

    it('should set title as ... when no service and no id', () => {
      component.service = null;
      component.sid = 'svc-1';
      component.id = 0;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('...');
    });

    it('should set API title with servizioApi nome and versione', () => {
      component.service = { nome: 'MyService', versione: '1.0', stato: 'PUBLISHED' };
      component.sid = 'svc-1';
      component.id = 10;
      component.servizioApi = { nome: 'MyApi', versione: '3.0' };
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[3].label).toBe('MyApi v. 3.0');
    });

    it('should set API title as id when servizioApi is null and id is set', () => {
      component.service = { nome: 'MyService', versione: '1.0', stato: 'PUBLISHED' };
      component.sid = 'svc-1';
      component.id = 10;
      component.servizioApi = null;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[3].label).toBe('10');
    });

    it('should set API title as translated "New" when servizioApi is null and id is 0', () => {
      component.service = { nome: 'MyService', versione: '1.0', stato: 'PUBLISHED' };
      component.sid = 'svc-1';
      component.id = 0;
      component.servizioApi = null;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.New');
      expect(component.breadcrumbs[3].label).toBe('APP.TITLE.New');
    });

    it('should translate service status tooltip', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'PUBLISHED' };
      component.sid = 'svc-1';
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.PUBLISHED');
    });

    it('should use /servizi base url when no componentBreadcrumbs', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ACTIVE' };
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].url).toBe('/servizi/');
      expect(component.breadcrumbs[1].url).toBe('/servizi/svc-1');
      expect(component.breadcrumbs[2].url).toBe('/servizi/svc-1/api');
      expect(component.breadcrumbs[3].url).toBe('/servizi/svc-1/api/10');
    });

    it('should use componenti base url when componentBreadcrumbs present', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ACTIVE' };
      component.sid = 'comp-1';
      component.id = 10;
      component._componentBreadcrumbs = {
        service: { id_servizio: 'parent-svc' },
        breadcrumbs: [{ label: 'Root', url: '/root' }]
      } as any;

      component._initBreadcrumb();

      const baseUrl = '/servizi/parent-svc/componenti';
      // breadcrumbs[0] is the unshifted one from componentBreadcrumbs
      // so the component's own breadcrumbs start at index 1
      expect(component.breadcrumbs[1].url).toBe(`${baseUrl}/`);
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
    });

    it('should unshift componentBreadcrumbs.breadcrumbs into breadcrumbs', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ACTIVE' };
      component.sid = 'comp-1';
      component.id = 10;
      component._componentBreadcrumbs = {
        service: { id_servizio: 'parent-svc' },
        breadcrumbs: [
          { label: 'Parent1', url: '/p1' },
          { label: 'Parent2', url: '/p2' }
        ]
      } as any;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('Parent1');
      expect(component.breadcrumbs[1].label).toBe('Parent2');
      expect(component.breadcrumbs.length).toBe(7); // 2 prepended + 5 own
    });

    it('should set main label to Components and clear icon when componentBreadcrumbs present', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ACTIVE' };
      component.sid = 'comp-1';
      component.id = 10;
      component._componentBreadcrumbs = {
        service: { id_servizio: 'parent-svc' },
        breadcrumbs: []
      } as any;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Components');
      expect(component.breadcrumbs[0].iconBs).toBe('');
      expect(component.breadcrumbs[0].tooltip).toBe('APP.TOOLTIP.ComponentsList');
    });

    it('should override first breadcrumb with dashboard when _fromDashboard is true and no componentBreadcrumbs', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ACTIVE' };
      component.sid = 'svc-1';
      component.id = 10;
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should NOT override breadcrumb with dashboard when _fromDashboard is true but componentBreadcrumbs present', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'ACTIVE' };
      component.sid = 'comp-1';
      component.id = 10;
      component._fromDashboard = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: 'parent-svc' },
        breadcrumbs: [{ label: 'Root', url: '/root' }]
      } as any;

      component._initBreadcrumb();

      // The first item is from componentBreadcrumbs, not the dashboard override
      expect(component.breadcrumbs[0].label).toBe('Root');
    });

    it('should set tooltip for service breadcrumb', () => {
      component.service = { nome: 'Svc', versione: '1.0', stato: 'DRAFT' };
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].tooltip).toBe('APP.WORKFLOW.STATUS.DRAFT');
    });

    it('should set empty tooltip when service is null', () => {
      component.service = null;
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].tooltip).toBe('');
    });
  });

  // ========== _loadServizio ==========

  describe('_loadServizio', () => {
    it('should not call API when sid is null', () => {
      component.sid = null;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set service to null and _spin to true at start', () => {
      component.sid = 'svc-1';
      component.service = { nome: 'old' };
      mockApiService.getDetails.mockReturnValue(of({}));

      component._loadServizio();

      // service is reset during the call but then set to the response
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should call getDetails for grant first, then for service details', () => {
      component.sid = 'svc-1';
      const grantResponse = { canWrite: true };
      const serviceResponse = { nome: 'TestService', versione: '1.0' };

      let callCount = 0;
      mockApiService.getDetails.mockImplementation((model: string, id: string, sub?: string) => {
        callCount++;
        if (sub === 'grant') return of(grantResponse);
        return of(serviceResponse);
      });

      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._loadServizioApi = vi.fn();

      component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'svc-1', 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'svc-1');
      expect(component._grant).toEqual(grantResponse);
      expect(component.service).toEqual(serviceResponse);
    });

    it('should call _initBreadcrumb and _loadServizioApi on success', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails.mockImplementation((model: string, id: string, sub?: string) => {
        if (sub === 'grant') return of({ canWrite: true });
        return of({ nome: 'Svc', versione: '1.0' });
      });

      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._loadServizioApi = vi.fn();

      component._loadServizio();

      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
      expect((component as any)._loadServizioApi).toHaveBeenCalled();
    });

    it('should set _spin to false after successful service load', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails.mockImplementation((model: string, id: string, sub?: string) => {
        if (sub === 'grant') return of({});
        return of({ nome: 'Svc' });
      });

      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._loadServizioApi = vi.fn();

      component._loadServizio();

      expect(component._spin).toBe(false);
    });

    it('should call Tools.OnError and set _spin to false when service details call fails', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails.mockImplementation((model: string, id: string, sub?: string) => {
        if (sub === 'grant') return of({});
        return throwError(() => new Error('service details error'));
      });

      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });

    it('should call Tools.OnError when grant call fails', () => {
      component.sid = 'svc-1';
      mockApiService.getDetails.mockImplementation((model: string, id: string, sub?: string) => {
        if (sub === 'grant') return throwError(() => new Error('grant error'));
        return of({});
      });

      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should not call service details when grant call fails', () => {
      component.sid = 'svc-1';
      let serviceDetailsCalled = false;
      mockApiService.getDetails.mockImplementation((model: string, id: string, sub?: string) => {
        if (sub === 'grant') return throwError(() => new Error('grant error'));
        serviceDetailsCalled = true;
        return of({});
      });

      component._loadServizio();

      expect(serviceDetailsCalled).toBe(false);
    });
  });

  // ========== _loadServizioApi ==========

  describe('_loadServizioApi', () => {
    it('should not call API when id is falsy (0)', () => {
      component.id = 0;
      component._loadServizioApi();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call getDetails with model "api" and id', () => {
      component.id = 42;
      mockApiService.getDetails.mockReturnValue(of({ nome: 'Api1', versione: '1.0' }));
      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._autoSelectTab = vi.fn();

      component._loadServizioApi();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('api', 42);
    });

    it('should set servizioApi on success', () => {
      component.id = 42;
      const apiResponse = { nome: 'Api1', versione: '1.0', proprieta_custom: [] };
      mockApiService.getDetails.mockReturnValue(of(apiResponse));
      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._autoSelectTab = vi.fn();

      component._loadServizioApi();

      expect(component.servizioApi).toEqual(apiResponse);
    });

    it('should call _initBreadcrumb and _autoSelectTab on success', () => {
      component.id = 42;
      mockApiService.getDetails.mockReturnValue(of({ nome: 'Api1' }));
      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._autoSelectTab = vi.fn();

      component._loadServizioApi();

      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
      expect((component as any)._autoSelectTab).toHaveBeenCalled();
    });

    it('should set servizioApi to null before loading', () => {
      component.id = 42;
      component.servizioApi = { nome: 'old' };

      let servizioApiDuringCall: any = 'not-set';
      mockApiService.getDetails.mockImplementation(() => {
        servizioApiDuringCall = component.servizioApi;
        return of({ nome: 'new' });
      });
      (component as any)._initBreadcrumb = vi.fn();
      (component as any)._autoSelectTab = vi.fn();

      component._loadServizioApi();

      expect(servizioApiDuringCall).toBeNull();
    });

    it('should call Tools.OnError when API call fails', () => {
      component.id = 42;
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('api error')));

      component._loadServizioApi();

      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should not set servizioApi when API call fails', () => {
      component.id = 42;
      component.servizioApi = null;
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));

      component._loadServizioApi();

      expect(component.servizioApi).toBeNull();
    });
  });

  // ========== _autoSelectTab ==========

  describe('_autoSelectTab', () => {
    it('should not auto-select when both tabs are configured', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'c-id' }]
          },
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'p-id' }]
          }
        ]
      };

      component._autoSelectTab();

      expect(component._hasTabCollaudo).toBe(true);
      expect(component._hasTabProduzione).toBe(true);
      // Neither auto-selected — environmentId stays empty
      expect(component.environmentId).toBe('');
    });

    it('should auto-select collaudo when only collaudo is configured', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'c-id' }]
          }
        ]
      };

      component._autoSelectTab();

      expect(component._hasTabCollaudo).toBe(true);
      expect(component._hasTabProduzione).toBe(false);
      expect(component.environmentId).toBe('collaudo');
      expect(component.eserviceId).toBe('c-id');
    });

    it('should auto-select produzione when only produzione is configured', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'p-id' }]
          }
        ]
      };

      component._autoSelectTab();

      expect(component._hasTabCollaudo).toBe(false);
      expect(component._hasTabProduzione).toBe(true);
      expect(component.environmentId).toBe('produzione');
      expect(component.eserviceId).toBe('p-id');
    });

    it('should call _showProduzione when neither tab is configured (collaudo is false)', () => {
      component.servizioApi = { proprieta_custom: [] };

      component._autoSelectTab();

      expect(component._hasTabCollaudo).toBe(false);
      expect(component._hasTabProduzione).toBe(false);
      // When neither configured and _hasTabCollaudo is false, _showProduzione is called
      expect(component.environmentId).toBe('produzione');
    });
  });

  // ========== hideVersions config ==========

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should set hideVersions to true when config says so', () => {
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { Services: { hideVersions: true } }
    });
    const comp = new ServizioApiPdndInformationsComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
    );
    expect(comp.hideVersions).toBe(true);
  });

  // ========== _autoSelectTab with no PDND ==========

  it('should _autoSelectTab when servizioApi has no PDND', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._autoSelectTab();
    expect(component._hasTabCollaudo).toBe(false);
    expect(component._hasTabProduzione).toBe(false);
  });

  // ========== Integration-style tests ==========

  describe('integration: constructor + ngOnInit flow', () => {
    it('should load servizio and api when params emitted and no service in state', () => {
      const grantResponse = { canWrite: true };
      const serviceResponse = { nome: 'IntService', versione: '1.0', stato: 'ACTIVE' };
      const apiResponse = {
        nome: 'IntApi', versione: '2.0',
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'int-eservice' }]
        }]
      };

      mockApiService.getDetails.mockImplementation((model: string, id: any, sub?: string) => {
        if (model === 'servizi' && sub === 'grant') return of(grantResponse);
        if (model === 'servizi') return of(serviceResponse);
        if (model === 'api') return of(apiResponse);
        return of({});
      });

      component.ngOnInit();
      routeParams$.next({ id: 'svc-1', aid: 42 });

      expect(component.service).toEqual(serviceResponse);
      expect(component._grant).toEqual(grantResponse);
      expect(component.servizioApi).toEqual(apiResponse);
      expect(component._hasTabCollaudo).toBe(true);
    });

    it('should handle full flow with cid parameter', () => {
      mockApiService.getDetails.mockImplementation((model: string, id: any, sub?: string) => {
        if (sub === 'grant') return of({});
        if (model === 'servizi') return of({ nome: 'CompService', versione: '1.0', stato: 'ACTIVE' });
        if (model === 'api') return of({ nome: 'CompApi', versione: '1.0', proprieta_custom: [] });
        return of({});
      });

      component.ngOnInit();
      routeParams$.next({ id: 'svc-1', cid: 'comp-1', aid: 5 });

      expect(component.sid).toBe('comp-1');
      expect(component.id).toBe(5);
      expect(component.service).toEqual({ nome: 'CompService', versione: '1.0', stato: 'ACTIVE' });
    });

    it('should set producerIds from queryParams during ngOnInit', () => {
      component.ngOnInit();
      routeQueryParams$.next({ producerIdCollaudo: 'pc-1', producerIdProduzione: 'pp-1' });

      expect(component.producerIdCollaudo).toBe('pc-1');
      expect(component.producerIdProduzione).toBe('pp-1');
    });

    it('should handle dashboard queryParam in constructor and params in ngOnInit', () => {
      mockApiService.getDetails.mockImplementation((model: string, id: any, sub?: string) => {
        if (sub === 'grant') return of({});
        if (model === 'servizi') return of({ nome: 'DashSvc', versione: '1.0', stato: 'ACTIVE' });
        if (model === 'api') return of({ nome: 'DashApi', versione: '1.0', proprieta_custom: [] });
        return of({});
      });

      // Dashboard queryParam triggers in constructor
      routeQueryParams$.next({ from: 'dashboard' });
      expect(component._fromDashboard).toBe(true);

      // Params trigger in ngOnInit
      component.ngOnInit();
      routeParams$.next({ id: 'svc-dash', aid: 99 });

      expect(component.service).toEqual({ nome: 'DashSvc', versione: '1.0', stato: 'ACTIVE' });

      // Breadcrumbs should have dashboard override
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
    });

    it('should use existing service (skip _loadServizio) when service is in navigation state', () => {
      const navState = {
        extras: {
          state: {
            service: { nome: 'NavService', versione: '3.0', stato: 'DRAFT' },
            grant: { canWrite: false }
          }
        }
      };
      mockRouter.getCurrentNavigation.mockReturnValue(navState);

      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );

      // Service already set from navigation state
      expect(comp.service).toEqual({ nome: 'NavService', versione: '3.0', stato: 'DRAFT' });

      comp.servizioApi = { proprieta_custom: [] };
      comp.ngOnInit();
      routeParams$.next({ id: 'svc-nav', aid: 7 });

      // Should NOT have called getDetails for servizi because service exists
      expect(mockApiService.getDetails).not.toHaveBeenCalledWith('servizi', 'svc-nav', 'grant');
      expect(mockApiService.getDetails).not.toHaveBeenCalledWith('servizi', 'svc-nav');
    });
  });

  // ========== Edge cases ==========

  describe('edge cases', () => {
    it('should handle null config gracefully', () => {
      mockConfigService.getConfiguration.mockReturnValue(null);
      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );
      expect(comp.hideVersions).toBe(false);
    });

    it('should handle config without AppConfig', () => {
      mockConfigService.getConfiguration.mockReturnValue({});
      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );
      expect(comp.hideVersions).toBe(false);
    });

    it('should handle config without Services', () => {
      mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
      const comp = new ServizioApiPdndInformationsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService, mockTools, mockApiService
      );
      expect(comp.hideVersions).toBe(false);
    });

    it('should handle _loadServizio with empty sid string', () => {
      component.sid = '';
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should handle multiple route.data emissions', () => {
      const breadcrumbs1 = {
        componentBreadcrumbs: {
          service: { id_servizio: 'svc-a' },
          breadcrumbs: [{ label: 'A' }]
        }
      };
      const breadcrumbs2 = {
        componentBreadcrumbs: {
          service: { id_servizio: 'svc-b' },
          breadcrumbs: [{ label: 'B' }]
        }
      };

      routeData$.next(breadcrumbs1);
      expect(component._componentBreadcrumbs?.service.id_servizio).toBe('svc-a');

      routeData$.next(breadcrumbs2);
      expect(component._componentBreadcrumbs?.service.id_servizio).toBe('svc-b');
    });

    it('should handle _getEService with proprieta_custom containing unrelated groups', () => {
      component.servizioApi = {
        proprieta_custom: [
          { gruppo: 'UnrelatedGroup', proprieta: [{ nome: 'some_prop', valore: 'val' }] },
          { gruppo: 'AnotherGroup', proprieta: [{ nome: 'other_prop', valore: 'val2' }] }
        ]
      };
      expect(component._getEService('collaudo')).toBe('');
      expect(component._getEService('produzione')).toBe('');
    });

    it('should handle _getEService when proprieta_custom has null/undefined elements gracefully', () => {
      component.servizioApi = {
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: null }]
          }
        ]
      };
      // valore is null, fallback to '' via || ''
      expect(component._getEService('produzione')).toBe('');
    });

    it('should handle breadcrumbs with no service nome but with versione', () => {
      component.service = { versione: '1.0', stato: 'ACTIVE' };
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      // nome is undefined, so nome && versione is falsy, title falls to id
      expect(component.breadcrumbs[1].label).toBe('10');
    });

    it('should handle breadcrumbs with service nome but no versione', () => {
      component.service = { nome: 'Svc', stato: 'ACTIVE' };
      component.sid = 'svc-1';
      component.id = 10;
      component._componentBreadcrumbs = null;

      component._initBreadcrumb();

      // versione is undefined, so nome && versione is falsy, title falls to id
      expect(component.breadcrumbs[1].label).toBe('10');
    });
  });
});
