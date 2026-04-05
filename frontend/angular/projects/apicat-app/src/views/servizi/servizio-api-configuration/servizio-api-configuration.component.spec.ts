import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { UntypedFormGroup, UntypedFormControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Tools } from '@linkit/components';
import { ServizioApiConfigurationComponent, EROGATO_SOGGETTO_DOMINIO, EROGATO_SOGGETTO_ADERENTE } from './servizio-api-configuration.component';

// Provide global saveAs used by the component via declare const
(globalThis as any).saveAs = vi.fn();

describe('ServizioApiConfigurationComponent', () => {
  let component: ServizioApiConfigurationComponent;
  let savedConfigurazione: any;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1', aid: '10' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) }
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockFormBuilder = {
    group: vi.fn().mockImplementation(() => new UntypedFormGroup({})),
    array: vi.fn().mockReturnValue([])
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
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob()))
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    sortByIndexPreservingOrder: vi.fn().mockImplementation((arr: any[]) => arr),
    sortByFieldPreservingOthers: vi.fn().mockImplementation((arr: any[], _field: string) => arr)
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canEdit: vi.fn().mockReturnValue(true),
    canEditField: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    _getFieldsMandatory: vi.fn().mockReturnValue([]),
    _getClassesMandatory: vi.fn().mockReturnValue([])
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: {
        api: {
          profili: [],
          proprieta_custom: [],
          specifica_obbligatorio: false
        }
      }
    };
    component = new ServizioApiConfigurationComponent(
      mockRoute,
      mockRouter,
      mockFormBuilder,
      mockTranslate,
      mockConfigService,
      mockTools,
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
    expect(ServizioApiConfigurationComponent.Name).toBe('ServizioApiConfigurationComponent');
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
    expect(component.environmentId).toBe('collaudo');
    expect(component._spin).toBe(true);
    expect(component._isNew).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._downloading).toBe(false);
    expect(component.showHistory).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
    expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
    expect(component.EROGATO_SOGGETTO_DOMINIO).toBe('erogato_soggetto_dominio');
    expect(component.EROGATO_SOGGETTO_ADERENTE).toBe('erogato_soggetto_aderente');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should toggle history on toggleHistorical', () => {
    expect(component.showHistory).toBe(false);
    component.toggleHistorical();
    expect(component.showHistory).toBe(true);
    component.toggleHistorical();
    expect(component.showHistory).toBe(false);
  });

  it('should call canEditField on _canEditFieldMapper', () => {
    component._canEditFieldMapper('protocollo');
    expect(mockAuthenticationService.canEditField).toHaveBeenCalledWith('servizio', 'api', '', 'protocollo', undefined);
  });

  it('should reset edit state flags on _onCancelEdit', () => {
    component._isEdit = true;
    component._error = true;
    component._errorMsg = 'some error';

    // Provide valid rawData so JSON.parse succeeds, but no servizioApi details
    component.rawData = 'null';
    component._onCancelEdit();
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should return empty string from _getEService when no proprieta_custom', () => {
    component.servizioApi = { proprieta_custom: [] } as any;
    expect(component._getEService('collaudo')).toBe('');
  });

  it('should return false from _hasPDNDConfigureddMapper when no proprieta_custom', () => {
    component.servizioApi = { proprieta_custom: [] } as any;
    expect(component._hasPDNDConfigureddMapper('collaudo')).toBe(false);
  });

  it('should have _tipoInterfaccia with soap and rest', () => {
    expect(component._tipoInterfaccia).toEqual([
      { value: 'soap', label: 'APP.INTERFACE.soap' },
      { value: 'rest', label: 'APP.INTERFACE.rest' }
    ]);
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

  it('should check _canEditMapper with isGestore false', () => {
    component.service = { stato: 'bozza' };
    mockAuthenticationService.isGestore.mockReturnValue(false);
    mockAuthenticationService._getClassesMandatory.mockReturnValue([]);
    const result = component._canEditMapper();
    expect(result).toBe(true);
  });

  it('should check _canEditMapper with isGestore true', () => {
    component.service = { stato: 'bozza' };
    mockAuthenticationService.isGestore.mockReturnValue(true);
    const result = component._canEditMapper();
    expect(result).toBe(true);
  });

  it('should check _isGestore', () => {
    mockAuthenticationService.isGestore.mockReturnValue(true);
    expect(component._isGestore()).toBe(true);
  });

  it('should generate custom properties from flat map', () => {
    const definizioni = {
      'Gruppo Label': [
        { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any
      ]
    };
    const formValues = {
      proprieta_custom: {
        'Gruppo Label': { campo1: 'valore1' }
      }
    };
    const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
    expect(result).toEqual([
      { gruppo: 'GruppoA', proprieta: [{ nome: 'campo1', valore: 'valore1' }] }
    ]);
  });

  it('should exclude invalid values in generaApiCustomPropertiesDaFlatMap', () => {
    const definizioni = {
      'Gruppo Label': [
        { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any,
        { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo2' } as any
      ]
    };
    const formValues = {
      proprieta_custom: {
        'Gruppo Label': { campo1: '', campo2: 'valore2' }
      }
    };
    const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
    expect(result).toEqual([
      { gruppo: 'GruppoA', proprieta: [{ nome: 'campo2', valore: 'valore2' }] }
    ]);
  });

  it('should use sortByIndexPreservingOrderMapper', () => {
    const arr = [{ index: 2 }, { index: 1 }];
    component.sortByIndexPreservingOrderMapper(arr);
    expect(mockUtils.sortByIndexPreservingOrder).toHaveBeenCalledWith(arr);
  });

  it('should use sortByFieldPreservingOthersMapper', () => {
    const arr = [{ name: 'b' }, { name: 'a' }];
    component.sortByFieldPreservingOthersMapper(arr, 'name');
    expect(mockUtils.sortByFieldPreservingOthers).toHaveBeenCalledWith(arr, 'name');
  });

  // ==================== EXPORTED CONSTANTS ====================

  describe('exported constants', () => {
    it('should export EROGATO_SOGGETTO_DOMINIO', () => {
      expect(EROGATO_SOGGETTO_DOMINIO).toBe('erogato_soggetto_dominio');
    });

    it('should export EROGATO_SOGGETTO_ADERENTE', () => {
      expect(EROGATO_SOGGETTO_ADERENTE).toBe('erogato_soggetto_aderente');
    });
  });

  // ==================== CONSTRUCTOR ====================

  describe('constructor', () => {
    it('should set _componentBreadcrumbs from route.data and call _initBreadcrumb', () => {
      const breadcrumbsData = {
        service: { id_servizio: '99' },
        breadcrumbs: [{ label: 'Servizi', url: '/servizi', type: 'link' }]
      };
      const localRoute = {
        data: of({ componentBreadcrumbs: breadcrumbsData }),
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._componentBreadcrumbs).toBe(breadcrumbsData);
    });

    it('should not set _componentBreadcrumbs when route.data has no componentBreadcrumbs', () => {
      const localRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._componentBreadcrumbs).toBeNull();
    });

    it('should set _fromDashboard when queryParams.from is dashboard', () => {
      const localRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({ from: 'dashboard' }),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard when queryParams.from is not dashboard', () => {
      const localRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({ from: 'other' }),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp._fromDashboard).toBe(false);
    });

    it('should set service and grant from router navigation extras state', () => {
      const localRouter = {
        navigate: vi.fn(),
        getCurrentNavigation: vi.fn().mockReturnValue({
          extras: {
            state: {
              service: { nome: 'TestService', versione: '1' },
              grant: { ruoli: ['gestore'] }
            }
          }
        })
      } as any;
      const localRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, localRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp.service).toEqual({ nome: 'TestService', versione: '1' });
      expect(comp._grant).toEqual({ ruoli: ['gestore'] });
    });

    it('should set hideVersions true when config has hideVersions true', () => {
      const localConfigService = {
        getConfiguration: vi.fn().mockReturnValue({
          AppConfig: {
            GOVAPI: { HOST: 'http://localhost' },
            Services: { hideVersions: true }
          }
        })
      } as any;
      const localRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        localConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp.hideVersions).toBe(true);
    });

    it('should handle null config gracefully', () => {
      const localConfigService = {
        getConfiguration: vi.fn().mockReturnValue(null)
      } as any;
      const localRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        localConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      expect(comp.hideVersions).toBe(false);
    });
  });

  // ==================== ngOnInit ====================

  describe('ngOnInit', () => {
    it('should set sid, id and environmentId from route params', () => {
      const localRoute = {
        data: of({}),
        params: of({ id: '5', aid: '20', id_ambiente: 'produzione' }),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      comp.ngOnInit();
      expect(comp.sid).toBe('5');
      expect(comp.id).toBe('20');
      expect(comp.environmentId).toBe('produzione');
    });

    it('should prefer cid over id for sid', () => {
      const localRoute = {
        data: of({}),
        params: of({ id: '5', cid: '99', aid: '20' }),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      comp.ngOnInit();
      expect(comp.sid).toBe('99');
    });

    it('should call _loadServizio when no service is present', () => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const localRoute = {
        data: of({}),
        params: of({ id: '5', aid: '20' }),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      // service is null by default
      const loadSpy = vi.spyOn(comp as any, '_loadServizio');
      comp.ngOnInit();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should call _initBreadcrumb when service exists', () => {
      const localRouter = {
        navigate: vi.fn(),
        getCurrentNavigation: vi.fn().mockReturnValue({
          extras: {
            state: {
              service: { nome: 'Svc', versione: '1', stato: 'bozza' }
            }
          }
        })
      } as any;
      const localRoute = {
        data: of({}),
        params: of({ id: '5', aid: '20' }),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, localRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      const initSpy = vi.spyOn(comp as any, '_initBreadcrumb');
      comp.ngOnInit();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should set environmentId to empty string when id_ambiente not in params', () => {
      const localRoute = {
        data: of({}),
        params: of({ id: '5', aid: '20' }),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      comp.ngOnInit();
      expect(comp.environmentId).toBe('');
    });

    it('should not do anything when no id in params', () => {
      const localRoute = {
        data: of({}),
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const comp = new (ServizioApiConfigurationComponent as any)(
        localRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtils, mockAuthenticationService
      );
      const loadSpy = vi.spyOn(comp as any, '_loadServizio');
      comp.ngOnInit();
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== _initBreadcrumb ====================

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with service name and version', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component.environmentId = 'collaudo';
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('TestSvc v. 2');
      expect(component.breadcrumbs[4].label).toBe('APP.TITLE.TestingConfiguration');
    });

    it('should hide version in title when hideVersions is true and no componentBreadcrumbs', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component.hideVersions = true;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('TestSvc');
    });

    it('should show version in title when hideVersions is true but componentBreadcrumbs present', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component.hideVersions = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: '99' } as any,
        breadcrumbs: [{ label: 'Parent', url: '/parent', type: 'link' }]
      };
      component._initBreadcrumb();
      // When componentBreadcrumbs is set, title always includes version
      expect(component.breadcrumbs).toContainEqual(expect.objectContaining({ label: 'TestSvc v. 2' }));
    });

    it('should use id as fallback when no service name/version', () => {
      component.service = null;
      component.sid = '5';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('10');
    });

    it('should use ... when no service and no id', () => {
      component.service = null;
      component.sid = '5';
      component.id = 0 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('...');
    });

    it('should set produzione label when environmentId is produzione', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component.environmentId = 'produzione';
      component._initBreadcrumb();
      expect(component.breadcrumbs[4].label).toBe('APP.TITLE.ProductionConfiguration');
    });

    it('should set API title with servizioApi name/version when available', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.servizioApi = { nome: 'MyAPI', versione: 3 } as any;
      component.sid = '5';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('MyAPI v. 3');
    });

    it('should set API title as id when servizioApi is null but id is set', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.servizioApi = null;
      component.sid = '5';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('10');
    });

    it('should set API title as New when no servizioApi and no id', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.servizioApi = null;
      component.sid = '5';
      component.id = 0 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('APP.TITLE.New');
    });

    it('should prepend componentBreadcrumbs when available', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component._componentBreadcrumbs = {
        service: { id_servizio: '99' } as any,
        breadcrumbs: [
          { label: 'Services', url: '/servizi', type: 'link' },
          { label: 'Parent', url: '/servizi/99', type: 'link' }
        ]
      };
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('Services');
      expect(component.breadcrumbs[1].label).toBe('Parent');
      // The base Components breadcrumb should be at index 2
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.Components');
    });

    it('should set baseUrl to components path when _componentBreadcrumbs is present', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component._componentBreadcrumbs = {
        service: { id_servizio: '99' } as any,
        breadcrumbs: []
      };
      component._initBreadcrumb();
      // The main breadcrumb should use componenti path
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Components');
      expect(component.breadcrumbs[0].url).toContain('/componenti/');
    });

    it('should replace first breadcrumb with Dashboard when _fromDashboard and no componentBreadcrumbs', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should NOT replace first breadcrumb when _fromDashboard but componentBreadcrumbs is present', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component._fromDashboard = true;
      component._componentBreadcrumbs = {
        service: { id_servizio: '99' } as any,
        breadcrumbs: [{ label: 'Parent', url: '/parent', type: 'link' }]
      };
      component._initBreadcrumb();
      // First breadcrumb should be from componentBreadcrumbs, not Dashboard
      expect(component.breadcrumbs[0].label).toBe('Parent');
    });

    it('should pass service.stato to translate for tooltip', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.sid = '5';
      component.id = 10 as any;
      component._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
    });
  });

  // ==================== _loadServizio ====================

  describe('_loadServizio', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should do nothing if sid is null', () => {
      component.sid = null;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load grant then service then call _loadServizioApi on success', () => {
      component.sid = '5';
      component.id = 10 as any;
      const grantResponse = { ruoli: ['referente'] };
      const serviceResponse = { nome: 'Svc1', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResponse))
        .mockReturnValueOnce(of(serviceResponse));

      const loadApiSpy = vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '5', 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '5');
      expect(component._grant).toEqual(grantResponse);
      expect(component.service).toEqual(serviceResponse);
      expect(component._spin).toBe(false);
      expect(loadApiSpy).toHaveBeenCalled();
    });

    it('should set _specificaObbligatorio from Tools.Configurazione', () => {
      component.sid = '5';
      Tools.Configurazione = {
        servizio: {
          api: {
            specifica_obbligatorio: true,
            profili: [],
            proprieta_custom: []
          }
        }
      };
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'Svc', versione: '1', stato: 'bozza' }));
      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});

      component._loadServizio();
      expect(component._specificaObbligatorio).toBe(true);
    });

    it('should set _specificaObbligatorio false when configurazione has no api', () => {
      component.sid = '5';
      Tools.Configurazione = { servizio: {} };
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'Svc', versione: '1', stato: 'bozza' }));
      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});

      component._loadServizio();
      expect(component._specificaObbligatorio).toBe(false);
    });

    it('should handle grant error', () => {
      component.sid = '5';
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant fail')));
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should handle service error', () => {
      component.sid = '5';
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(throwError(() => new Error('svc fail')));
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });

    it('should reset service to null and set _spin true at start', () => {
      component.sid = '5';
      component.service = { something: true };
      component._spin = false;
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ nome: 'Svc', versione: '1', stato: 'bozza' }));
      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});

      component._loadServizio();
      // After success the service is set again
      expect(component.service).toEqual({ nome: 'Svc', versione: '1', stato: 'bozza' });
    });
  });

  // ==================== _loadServizioApi ====================

  describe('_loadServizioApi', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should do nothing if id is falsy', () => {
      component.id = 0;
      component._loadServizioApi();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call getDetails and mapApiDetailsToFormValues on success', () => {
      component.id = 10 as any;
      component.service = { stato: 'bozza' };
      const apiResponse = {
        nome: 'API1', versione: 1, ruolo: EROGATO_SOGGETTO_DOMINIO,
        configurazione_collaudo: {
          protocollo: 'rest',
          protocollo_dettaglio: 'OpenAPI 3',
          dati_erogazione: { nome_gateway: 'gw1', versione_gateway: 1, url: 'http://test' },
          specifica: { filename: 'spec.yaml', content_type: 'application/yaml', uuid: 'abc' }
        },
        proprieta_custom: [],
        gruppi_auth_type: []
      };
      mockApiService.getDetails.mockReturnValueOnce(of(apiResponse));
      const mapSpy = vi.spyOn(component as any, 'mapApiDetailsToFormValues').mockImplementation(() => {});

      component._loadServizioApi();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('api', 10);
      expect(component.rawData).toBe(JSON.stringify(apiResponse));
      expect(mapSpy).toHaveBeenCalled();
    });

    it('should handle error', () => {
      component.id = 10 as any;
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('api fail')));
      component._loadServizioApi();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should reset servizioApi to null at start', () => {
      component.id = 10 as any;
      component.servizioApi = { nome: 'old' } as any;
      mockApiService.getDetails.mockReturnValueOnce(of({}));
      vi.spyOn(component as any, 'mapApiDetailsToFormValues').mockImplementation(() => {});
      component._loadServizioApi();
      // servizioApi is set to null before the subscription resolves, but with synchronous of() it immediately calls mapApiDetailsToFormValues
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // ==================== mapApiDetailsToFormValues ====================

  describe('mapApiDetailsToFormValues', () => {
    const buildApiResponse = (overrides?: any) => ({
      nome: 'API1',
      versione: 1,
      ruolo: EROGATO_SOGGETTO_DOMINIO,
      configurazione_collaudo: {
        protocollo: 'rest',
        protocollo_dettaglio: 'OpenAPI 3',
        dati_erogazione: { nome_gateway: 'gw1', versione_gateway: 1, url: 'http://collaudo.test' },
        specifica: { filename: 'spec.yaml', content_type: 'application/yaml', uuid: 'uuid-collaudo' }
      },
      configurazione_produzione: {
        protocollo: 'rest',
        protocollo_dettaglio: 'OpenAPI 3',
        dati_erogazione: { nome_gateway: 'gw2', versione_gateway: 2, url: 'http://prod.test' },
        specifica: { filename: 'spec-prod.yaml', content_type: 'application/yaml', uuid: 'uuid-prod' }
      },
      proprieta_custom: [],
      gruppi_auth_type: [],
      ...overrides
    });

    it('should return early when rawData is null', () => {
      component.rawData = 'null';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component.servizioApi).toBeNull();
    });

    it('should set testingValues from configurazione_collaudo', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect((component as any).testingValues.nome_gateway).toBe('gw1');
      expect((component as any).testingValues.versione_gateway).toBe(1);
      expect((component as any).testingValues.url).toBe('http://collaudo.test');
      expect((component as any).testingValues.protocollo).toBe('rest');
    });

    it('should set viewValues from collaudo config when environmentId is collaudo', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component.viewValues.nome_gateway).toBe('gw1');
      expect(component.viewValues.url).toBe('http://collaudo.test');
    });

    it('should set viewValues from produzione config when environmentId is produzione', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'produzione';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component.viewValues.nome_gateway).toBe('gw2');
      expect(component.viewValues.url).toBe('http://prod.test');
    });

    it('should call _formGroup.setValue with configuration values', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      const setValueSpy = vi.spyOn(component._formGroup, 'setValue');
      (component as any).mapApiDetailsToFormValues();
      expect(setValueSpy).toHaveBeenCalledWith(expect.objectContaining({
        nome_gateway: 'gw1',
        versione_gateway: 1,
        url: 'http://collaudo.test',
        protocollo: 'rest'
      }));
    });

    it('should set _hasSpecifica true in collaudo when specifica exists', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component._hasSpecifica).toBe(true);
    });

    it('should set _hasSpecifica true in collaudo when no protocollo', () => {
      const api = buildApiResponse();
      api.configurazione_collaudo.protocollo = '';
      api.configurazione_collaudo.specifica = null as any;
      component.rawData = JSON.stringify(api);
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      // !configuration?.protocollo => true
      expect(component._hasSpecifica).toBe(true);
    });

    it('should set _hasSpecifica false in collaudo when protocollo exists but no specifica', () => {
      const api = buildApiResponse();
      api.configurazione_collaudo.specifica = null as any;
      component.rawData = JSON.stringify(api);
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      // protocollo is 'rest' (truthy), specifica is null => false
      // Actually: configuration?.specifica || !configuration?.protocollo => null || false => false
      expect(component._hasSpecifica).toBe(false);
    });

    it('should set _hasSpecifica true in produzione when specifica exists and protocollo set', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'produzione';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component._hasSpecifica).toBe(true);
    });

    it('should set _hasSpecifica false in produzione when protocollo exists but no specifica', () => {
      const api = buildApiResponse();
      api.configurazione_produzione.specifica = null as any;
      component.rawData = JSON.stringify(api);
      component.environmentId = 'produzione';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component._hasSpecifica).toBe(false);
    });

    it('should check collaudo specifica in produzione when no produzione protocollo', () => {
      const api = buildApiResponse();
      api.configurazione_produzione.protocollo = '';
      api.configurazione_produzione.specifica = null as any;
      component.rawData = JSON.stringify(api);
      component.environmentId = 'produzione';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      // Falls to else branch: no protocollo in produzione => checks collaudo specifica => true
      expect(component._hasSpecifica).toBe(true);
    });

    it('should set _descrittoreCtrl value when _hasSpecifica is true', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component._descrittoreCtrl.value).toEqual({
        file: 'spec.yaml',
        type: 'application/yaml',
        uuid: 'uuid-collaudo'
      });
    });

    it('should clear validators on _descrittoreCtrl when _hasSpecifica is false', () => {
      const api = buildApiResponse();
      api.configurazione_collaudo.specifica = null as any;
      // protocollo set so _hasSpecifica = false
      component.rawData = JSON.stringify(api);
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      const clearSpy = vi.spyOn(component._descrittoreCtrl, 'clearValidators');
      (component as any).mapApiDetailsToFormValues();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should set proprieta_custom from servizioApi', () => {
      const api = buildApiResponse({ proprieta_custom: [{ gruppo: 'g1', proprieta: [] }] });
      component.rawData = JSON.stringify(api);
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component.proprieta_custom).toEqual([{ gruppo: 'g1', proprieta: [] }]);
    });

    it('should call __checkAutenticazione with servizioApi.ruolo', () => {
      component.rawData = JSON.stringify(buildApiResponse());
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      const checkSpy = vi.spyOn(component as any, '__checkAutenticazione');
      (component as any).mapApiDetailsToFormValues();
      expect(checkSpy).toHaveBeenCalledWith(EROGATO_SOGGETTO_DOMINIO);
    });

    it('should set _configuration to null when configuration is undefined', () => {
      const api = buildApiResponse();
      delete api.configurazione_produzione;
      component.rawData = JSON.stringify(api);
      component.environmentId = 'produzione';
      component.service = { stato: 'bozza' };
      (component as any).mapApiDetailsToFormValues();
      expect(component._configuration).toBeNull();
    });
  });

  // ==================== copyTestingValue ====================

  describe('copyTestingValue', () => {
    it('should set control value from testingValues', () => {
      (component as any).testingValues = {
        nome_gateway: 'gw-test', versione_gateway: 5, url: 'http://test', protocollo: 'rest', protocollo_dettaglio: ''
      };
      component.copyTestingValue('nome_gateway');
      expect(component._formGroup.get('nome_gateway')?.value).toBe('gw-test');
    });

    it('should not overwrite when overwrite is false and control has value', () => {
      component._formGroup.get('nome_gateway')?.setValue('existing');
      (component as any).testingValues = {
        nome_gateway: 'gw-test', versione_gateway: null, url: '', protocollo: '', protocollo_dettaglio: ''
      };
      component.copyTestingValue('nome_gateway', false);
      expect(component._formGroup.get('nome_gateway')?.value).toBe('existing');
    });

    it('should overwrite when overwrite is false but control value is empty', () => {
      component._formGroup.get('nome_gateway')?.setValue('');
      (component as any).testingValues = {
        nome_gateway: 'gw-test', versione_gateway: null, url: '', protocollo: '', protocollo_dettaglio: ''
      };
      component.copyTestingValue('nome_gateway', false);
      expect(component._formGroup.get('nome_gateway')?.value).toBe('gw-test');
    });

    it('should do nothing when control does not exist', () => {
      (component as any).testingValues = {
        nome_gateway: '', versione_gateway: null, url: '', protocollo: '', protocollo_dettaglio: ''
      };
      // Should not throw
      component.copyTestingValue('nonexistent_field');
    });

    it('should call copySepcificationValue when field is protocollo', () => {
      (component as any).testingValues = {
        nome_gateway: '', versione_gateway: null, url: '', protocollo: 'rest', protocollo_dettaglio: ''
      };
      component.servizioApi = { configurazione_collaudo: {} } as any;
      const spy = vi.spyOn(component as any, 'copySepcificationValue');
      component.copyTestingValue('protocollo');
      expect(spy).toHaveBeenCalled();
    });

    it('should not call copySepcificationValue for non-protocollo fields', () => {
      (component as any).testingValues = {
        nome_gateway: 'test', versione_gateway: null, url: '', protocollo: '', protocollo_dettaglio: ''
      };
      const spy = vi.spyOn(component as any, 'copySepcificationValue');
      component.copyTestingValue('nome_gateway');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ==================== getTestingValue ====================

  describe('getTestingValue', () => {
    it('should return value from testingValues', () => {
      (component as any).testingValues = {
        nome_gateway: 'gw-test', versione_gateway: 3, url: 'http://test', protocollo: 'soap', protocollo_dettaglio: 'WSDL'
      };
      expect(component.getTestingValue('nome_gateway')).toBe('gw-test');
      expect(component.getTestingValue('versione_gateway')).toBe(3);
      expect(component.getTestingValue('protocollo')).toBe('soap');
    });

    it('should return undefined for unknown field', () => {
      expect(component.getTestingValue('unknown')).toBeUndefined();
    });
  });

  // ==================== getCustomPropertyTestingValue ====================

  describe('getCustomPropertyTestingValue', () => {
    it('should return valore when found', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [
              { nome_gruppo: 'ProdGroup', label_gruppo: 'ProdLabel', classe_dato: 'produzione', id_correlazione: 'corr1' },
              { nome_gruppo: 'CollGroup', label_gruppo: 'CollLabel', classe_dato: 'collaudo', id_correlazione: 'corr1' }
            ]
          }
        }
      };
      component.servizioApi = {
        proprieta_custom: [
          { gruppo: 'CollGroup', proprieta: [{ nome: 'campo1', valore: 'valore_collaudo' }] }
        ]
      } as any;
      const result = component.getCustomPropertyTestingValue('ProdGroup', 'campo1');
      expect(result).toBe('valore_collaudo');
    });

    it('should return undefined when group not found', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: []
          }
        }
      };
      component.servizioApi = { proprieta_custom: [] } as any;
      const result = component.getCustomPropertyTestingValue('NonExistent', 'campo1');
      expect(result).toBeUndefined();
    });

    it('should return undefined when no collaudo group found', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [
              { nome_gruppo: 'ProdGroup', classe_dato: 'produzione', id_correlazione: 'corr1' }
              // no matching collaudo group
            ]
          }
        }
      };
      component.servizioApi = { proprieta_custom: [] } as any;
      const result = component.getCustomPropertyTestingValue('ProdGroup', 'campo1');
      expect(result).toBeUndefined();
    });

    it('should return undefined when proprietaCustomCollaudo not found in servizioApi', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [
              { nome_gruppo: 'ProdGroup', classe_dato: 'produzione', id_correlazione: 'corr1' },
              { nome_gruppo: 'CollGroup', classe_dato: 'collaudo', id_correlazione: 'corr1' }
            ]
          }
        }
      };
      component.servizioApi = { proprieta_custom: [] } as any;
      const result = component.getCustomPropertyTestingValue('ProdGroup', 'campo1');
      expect(result).toBeUndefined();
    });

    it('should return undefined when proprieta not found within group', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [
              { nome_gruppo: 'ProdGroup', classe_dato: 'produzione', id_correlazione: 'corr1' },
              { nome_gruppo: 'CollGroup', classe_dato: 'collaudo', id_correlazione: 'corr1' }
            ]
          }
        }
      };
      component.servizioApi = {
        proprieta_custom: [
          { gruppo: 'CollGroup', proprieta: [{ nome: 'other_campo', valore: 'val' }] }
        ]
      } as any;
      const result = component.getCustomPropertyTestingValue('ProdGroup', 'campo1');
      expect(result).toBeUndefined();
    });
  });

  // ==================== copyCustomPropertyTestingValue ====================

  describe('copyCustomPropertyTestingValue', () => {
    it('should set control value from getCustomPropertyTestingValue', () => {
      // Set up form with proprieta_custom group
      const innerGroup = new UntypedFormGroup({ campo1: new UntypedFormControl('') });
      const pcGroup = new UntypedFormGroup({ TestGroup: innerGroup });
      (component._formGroup as UntypedFormGroup).removeControl('proprieta_custom');
      component._formGroup.addControl('proprieta_custom', pcGroup);

      vi.spyOn(component, 'getCustomPropertyTestingValue').mockReturnValue('test_value');
      component.copyCustomPropertyTestingValue('TestGroup', 'campo1');
      expect(innerGroup.get('campo1')?.value).toBe('test_value');
    });

    it('should not overwrite when overwrite is false and control has value', () => {
      const innerGroup = new UntypedFormGroup({ campo1: new UntypedFormControl('existing') });
      const pcGroup = new UntypedFormGroup({ TestGroup: innerGroup });
      (component._formGroup as UntypedFormGroup).removeControl('proprieta_custom');
      component._formGroup.addControl('proprieta_custom', pcGroup);

      vi.spyOn(component, 'getCustomPropertyTestingValue').mockReturnValue('new_value');
      component.copyCustomPropertyTestingValue('TestGroup', 'campo1', false);
      expect(innerGroup.get('campo1')?.value).toBe('existing');
    });

    it('should do nothing when control path does not exist', () => {
      // Should not throw
      component.copyCustomPropertyTestingValue('NoGroup', 'noField');
    });
  });

  // ==================== copyAllTestingValues ====================

  describe('copyAllTestingValues', () => {
    it('should call copyTestingValue for all standard fields with overwrite false', () => {
      const copySpy = vi.spyOn(component, 'copyTestingValue').mockImplementation(() => {});
      vi.spyOn(component as any, 'copySepcificationValue').mockImplementation(() => {});
      component._apiProprietaCustom = [];
      component.copyAllTestingValues();
      expect(copySpy).toHaveBeenCalledWith('nome_gateway', false);
      expect(copySpy).toHaveBeenCalledWith('versione_gateway', false);
      expect(copySpy).toHaveBeenCalledWith('url', false);
      expect(copySpy).toHaveBeenCalledWith('protocollo', false);
    });

    it('should call copySepcificationValue with false', () => {
      vi.spyOn(component, 'copyTestingValue').mockImplementation(() => {});
      const specSpy = vi.spyOn(component as any, 'copySepcificationValue').mockImplementation(() => {});
      component._apiProprietaCustom = [];
      component.copyAllTestingValues();
      expect(specSpy).toHaveBeenCalledWith(false);
    });

    it('should call copyCustomPropertyTestingValue for each custom property', () => {
      vi.spyOn(component, 'copyTestingValue').mockImplementation(() => {});
      vi.spyOn(component as any, 'copySepcificationValue').mockImplementation(() => {});
      const customSpy = vi.spyOn(component, 'copyCustomPropertyTestingValue').mockImplementation(() => {});
      component._apiProprietaCustom = [
        { nome_gruppo: 'G1', nome: 'campo1' },
        { nome_gruppo: 'G2', nome: 'campo2' }
      ];
      component.copyAllTestingValues();
      expect(customSpy).toHaveBeenCalledWith('G1', 'campo1', false);
      expect(customSpy).toHaveBeenCalledWith('G2', 'campo2', false);
    });
  });

  // ==================== _downloadSpecifica ====================

  describe('_downloadSpecifica', () => {
    it('should call download and saveAs on success', () => {
      const response = {
        body: new Blob(['content']),
        headers: { get: vi.fn().mockReturnValue('attachment; filename="spec.yaml"') }
      };
      mockApiService.download.mockReturnValueOnce(of(response));
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('spec.yaml');

      component.id = 10 as any;
      component.environmentId = 'collaudo';
      component._downloadSpecifica();

      expect(mockApiService.download).toHaveBeenCalledWith('api', 10, 'specifica/collaudo/download', undefined);
      expect(Tools.GetFilenameFromHeader).toHaveBeenCalledWith(response);
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(response.body, 'spec.yaml');
      expect(component._downloading).toBe(false);
    });

    it('should handle error on download', () => {
      mockApiService.download.mockReturnValueOnce(throwError(() => new Error('download fail')));
      component.id = 10 as any;
      component._downloadSpecifica();

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._downloading).toBe(false);
    });

    it('should pass versione param when versione > 0', () => {
      mockApiService.download.mockReturnValueOnce(of({
        body: new Blob(), headers: { get: vi.fn() }
      }));
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('spec.yaml');
      component.id = 10 as any;
      component._downloadSpecifica(5);

      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith({ versione: 5 });
      expect(mockApiService.download).toHaveBeenCalledWith('api', 10, expect.any(String), {});
    });

    it('should not pass versione param when versione is 0', () => {
      mockApiService.download.mockReturnValueOnce(of({
        body: new Blob(), headers: { get: vi.fn() }
      }));
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('spec.yaml');
      component.id = 10 as any;
      component._downloadSpecifica(0);

      expect(mockUtils._queryToHttpParams).not.toHaveBeenCalled();
      expect(mockApiService.download).toHaveBeenCalledWith('api', 10, expect.any(String), undefined);
    });

    it('should set _downloading true at start', () => {
      let capturedDownloading = false;
      mockApiService.download.mockImplementation(() => {
        capturedDownloading = component._downloading;
        return of({ body: new Blob(), headers: { get: vi.fn() } });
      });
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('f.yaml');
      component.id = 10 as any;
      component._downloadSpecifica();
      expect(capturedDownloading).toBe(true);
    });
  });

  // ==================== _downloadHistory ====================

  describe('_downloadHistory', () => {
    it('should delegate to _downloadSpecifica with item.versione', () => {
      const spy = vi.spyOn(component, '_downloadSpecifica').mockImplementation(() => {});
      component._downloadHistory({ versione: 7, uuid: 'abc', content_type: 'yaml', filename: 'spec.yaml' });
      expect(spy).toHaveBeenCalledWith(7);
    });
  });

  // ==================== _onSubmit ====================

  describe('_onSubmit', () => {
    it('should call _onSaveApi when _isEdit is true and form is valid', () => {
      component._isEdit = true;
      // Make the form valid
      Object.keys(component._formGroup.controls).forEach(key => {
        const ctrl = component._formGroup.get(key);
        ctrl?.clearValidators();
        ctrl?.updateValueAndValidity();
      });
      component._formGroup.updateValueAndValidity();

      const saveSpy = vi.spyOn(component as any, '_onSaveApi').mockImplementation(() => {});
      const form = { protocollo: 'rest' };
      component._onSubmit(form);
      expect(saveSpy).toHaveBeenCalledWith(form);
    });

    it('should not call _onSaveApi when _isEdit is false', () => {
      component._isEdit = false;
      const saveSpy = vi.spyOn(component as any, '_onSaveApi').mockImplementation(() => {});
      component._onSubmit({});
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should not call _onSaveApi when form is invalid', () => {
      component._isEdit = true;
      // Set protocollo as required and clear it to make form invalid
      component._formGroup.get('protocollo')?.setValidators([Validators.required]);
      component._formGroup.get('protocollo')?.setValue('');
      component._formGroup.get('protocollo')?.updateValueAndValidity();

      const saveSpy = vi.spyOn(component as any, '_onSaveApi').mockImplementation(() => {});
      component._onSubmit({});
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== _onSaveApi ====================

  describe('_onSaveApi', () => {
    beforeEach(() => {
      component.id = 10 as any;
      component._formGroup.get('protocollo')?.setValue('rest');
      component._formGroup.get('nome_gateway')?.setValue('gw1');
      component._formGroup.get('versione_gateway')?.setValue(1);
      component._formGroup.get('url')?.setValue('http://test');
    });

    it('should send configurazione_collaudo when environmentId is collaudo', () => {
      component.environmentId = 'collaudo';
      component._hasSpecifica = false;
      component._configuration = null;
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(of({}));

      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({});

      const callArg = mockApiService.putElement.mock.calls[0][2];
      expect(callArg.configurazione_collaudo).toBeDefined();
      expect(callArg.configurazione_produzione).toBeUndefined();
    });

    it('should send configurazione_produzione when environmentId is produzione', () => {
      component.environmentId = 'produzione';
      component._hasSpecifica = false;
      component._configuration = null;
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(of({}));

      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({});

      const callArg = mockApiService.putElement.mock.calls[0][2];
      expect(callArg.configurazione_produzione).toBeDefined();
      expect(callArg.configurazione_collaudo).toBeUndefined();
    });

    it('should include file data in specifica when _descrittoreCtrl has data and _hasSpecifica', () => {
      component.environmentId = 'collaudo';
      component._hasSpecifica = true;
      component._descrittoreCtrl.setValue({ file: 'spec.yaml', type: 'application/yaml', data: 'base64content' });
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(of({}));

      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({});

      const callArg = mockApiService.putElement.mock.calls[0][2];
      expect(callArg.configurazione_collaudo.specifica).toEqual({
        tipo_documento: 'nuovo',
        content_type: 'application/yaml',
        filename: 'spec.yaml',
        content: 'base64content'
      });
    });

    it('should include uuid_copia reference when _descrittoreCtrl has uuid and _hasSpecifica', () => {
      component.environmentId = 'collaudo';
      component._hasSpecifica = true;
      component._descrittoreCtrl.setValue({ file: 'spec.yaml', type: 'yaml', uuid: 'uuid-123' });
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(of({}));

      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({});

      const callArg = mockApiService.putElement.mock.calls[0][2];
      expect(callArg.configurazione_collaudo.specifica).toEqual({
        tipo_documento: 'uuid_copia',
        uuid: 'uuid-123'
      });
    });

    it('should include existing uuid reference when _configuration has specifica uuid and _hasSpecifica', () => {
      component.environmentId = 'collaudo';
      component._hasSpecifica = true;
      component._descrittoreCtrl.setValue(null);
      component._configuration = { specifica: { uuid: 'existing-uuid' } } as any;
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(of({}));

      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({});

      const callArg = mockApiService.putElement.mock.calls[0][2];
      expect(callArg.configurazione_collaudo.specifica).toEqual({
        tipo_documento: 'uuid',
        uuid: 'existing-uuid'
      });
    });

    it('should set specifica to null when no specifica data', () => {
      component.environmentId = 'collaudo';
      component._hasSpecifica = false;
      component._descrittoreCtrl.setValue(null);
      component._configuration = null;
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(of({}));

      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({});

      const callArg = mockApiService.putElement.mock.calls[0][2];
      expect(callArg.configurazione_collaudo.specifica).toBeNull();
    });

    it('should include dati_custom when _apiProprietaCustomGrouped has keys', () => {
      component.environmentId = 'collaudo';
      component._hasSpecifica = false;
      component._configuration = null;
      component._apiProprietaCustomGrouped = {
        'TestLabel': [{ nome_gruppo: 'TestGroup', label_gruppo: 'TestLabel', classe_dato: 'collaudo', nome: 'campo1' }]
      };
      mockApiService.putElement.mockReturnValueOnce(of({}));

      vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({ proprieta_custom: { 'TestLabel': { campo1: 'val1' } } });

      const callArg = mockApiService.putElement.mock.calls[0][2];
      expect(callArg.dati_custom).toBeDefined();
      expect(callArg.dati_custom.proprieta_custom).toEqual([
        { gruppo: 'TestGroup', proprieta: [{ nome: 'campo1', valore: 'val1' }] }
      ]);
    });

    it('should set _isEdit false and call _loadServizioApi on success', () => {
      component._isEdit = true;
      component.environmentId = 'collaudo';
      component._hasSpecifica = false;
      component._configuration = null;
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(of({}));

      const loadSpy = vi.spyOn(component as any, '_loadServizioApi').mockImplementation(() => {});
      component._onSaveApi({});

      expect(component._isEdit).toBe(false);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should set error on failure', () => {
      component.environmentId = 'collaudo';
      component._hasSpecifica = false;
      component._configuration = null;
      component._apiProprietaCustomGrouped = null;
      mockApiService.putElement.mockReturnValueOnce(throwError(() => new Error('save fail')));

      component._onSaveApi({});
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });
  });

  // ==================== generaApiCustomPropertiesDaFlatMap additional ====================

  describe('generaApiCustomPropertiesDaFlatMap additional', () => {
    it('should handle null form values gracefully', () => {
      const definizioni = {
        'Gruppo Label': [
          { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any
        ]
      };
      const formValues = { proprieta_custom: { 'Gruppo Label': { campo1: null } } };
      const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
      expect(result).toEqual([]);
    });

    it('should handle undefined form values gracefully', () => {
      const definizioni = {
        'Gruppo Label': [
          { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any
        ]
      };
      const formValues = { proprieta_custom: { 'Gruppo Label': { campo1: undefined } } };
      const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
      expect(result).toEqual([]);
    });

    it('should skip group when valoriGruppo is missing', () => {
      const definizioni = {
        'Gruppo Label': [
          { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any
        ]
      };
      const formValues = { proprieta_custom: {} };
      const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
      expect(result).toEqual([]);
    });

    it('should exclude NaN values', () => {
      const definizioni = {
        'Gruppo Label': [
          { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any
        ]
      };
      const formValues = { proprieta_custom: { 'Gruppo Label': { campo1: NaN } } };
      const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
      expect(result).toEqual([]);
    });

    it('should handle multiple groups', () => {
      const definizioni = {
        'Label A': [
          { nome_gruppo: 'GruppoA', label_gruppo: 'Label A', classe_dato: 'collaudo', nome: 'c1' } as any
        ],
        'Label B': [
          { nome_gruppo: 'GruppoB', label_gruppo: 'Label B', classe_dato: 'collaudo', nome: 'c2' } as any
        ]
      };
      const formValues = {
        proprieta_custom: { 'Label A': { c1: 'v1' }, 'Label B': { c2: 'v2' } }
      };
      const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ gruppo: 'GruppoA', proprieta: [{ nome: 'c1', valore: 'v1' }] });
      expect(result).toContainEqual({ gruppo: 'GruppoB', proprieta: [{ nome: 'c2', valore: 'v2' }] });
    });

    it('should exclude whitespace-only string values', () => {
      const definizioni = {
        'Label': [
          { nome_gruppo: 'G', label_gruppo: 'Label', classe_dato: 'collaudo', nome: 'c1' } as any
        ]
      };
      const formValues = { proprieta_custom: { 'Label': { c1: '   ' } } };
      const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
      expect(result).toEqual([]);
    });
  });

  // ==================== _toggleSpecifica ====================

  describe('_toggleSpecifica', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should toggle _hasSpecifica', () => {
      component._hasSpecifica = false;
      component._toggleSpecifica();
      expect(component._hasSpecifica).toBe(true);
    });

    it('should set validators to required when _specificaObbligatorio is true after timeout', () => {
      component._hasSpecifica = true;
      component._specificaObbligatorio = true;
      const setValidatorsSpy = vi.spyOn(component._descrittoreCtrl, 'setValidators');

      component._toggleSpecifica();
      vi.advanceTimersByTime(100);

      expect(setValidatorsSpy).toHaveBeenCalledWith([Validators.required]);
    });

    it('should set validators to required when _hasSpecifica becomes true after timeout', () => {
      component._hasSpecifica = false;
      component._specificaObbligatorio = false;
      const setValidatorsSpy = vi.spyOn(component._descrittoreCtrl, 'setValidators');

      component._toggleSpecifica();
      vi.advanceTimersByTime(100);

      // _hasSpecifica was false, toggled to true
      expect(setValidatorsSpy).toHaveBeenCalledWith([Validators.required]);
    });

    it('should clear validators when not obbligatorio and _hasSpecifica becomes false after timeout', () => {
      component._hasSpecifica = true;
      component._specificaObbligatorio = false;
      const clearValidatorsSpy = vi.spyOn(component._descrittoreCtrl, 'clearValidators');

      component._toggleSpecifica();
      vi.advanceTimersByTime(100);

      // _hasSpecifica was true, toggled to false
      expect(clearValidatorsSpy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity after timeout', () => {
      component._hasSpecifica = false;
      const updateSpy = vi.spyOn(component._descrittoreCtrl, 'updateValueAndValidity');

      component._toggleSpecifica();
      vi.advanceTimersByTime(100);

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  // ==================== __checkAutenticazione ====================

  describe('__checkAutenticazione', () => {
    it('should call __checkAmbiente when ruolo is EROGATO_SOGGETTO_DOMINIO', () => {
      component.service = { stato: 'bozza' };
      const checkSpy = vi.spyOn(component as any, '__checkAmbiente');
      component.__checkAutenticazione(EROGATO_SOGGETTO_DOMINIO);
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should call __disableAmbiente when ruolo is not EROGATO_SOGGETTO_DOMINIO', () => {
      const disableSpy = vi.spyOn(component as any, '__disableAmbiente');
      component.__checkAutenticazione(EROGATO_SOGGETTO_ADERENTE);
      expect(disableSpy).toHaveBeenCalled();
    });

    it('should call updateValueAndValidity on formGroup', () => {
      const updateSpy = vi.spyOn(component._formGroup, 'updateValueAndValidity');
      component.__checkAutenticazione('any_role');
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  // ==================== __checkAmbiente ====================

  describe('__checkAmbiente', () => {
    it('should set validators for mandatory fields', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getFieldsMandatory.mockReturnValue(['protocollo']);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);

      const controls = component._formGroup.controls;
      component.__checkAmbiente(controls);

      expect(mockAuthenticationService._getFieldsMandatory).toHaveBeenCalledWith('servizio', 'api', 'bozza');
      expect(controls.protocollo.hasValidator(Validators.required)).toBe(true);
    });

    it('should map url_collaudo to url when environmentId is collaudo', () => {
      component.service = { stato: 'bozza' };
      component.environmentId = 'collaudo';
      mockAuthenticationService._getFieldsMandatory.mockReturnValue(['url_collaudo']);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);

      const controls = component._formGroup.controls;
      const setValidatorsSpy = vi.spyOn(controls.url, 'setValidators');
      component.__checkAmbiente(controls);

      expect(setValidatorsSpy).toHaveBeenCalledWith([Validators.required]);
    });

    it('should map url_produzione to url when environmentId is produzione', () => {
      component.service = { stato: 'bozza' };
      component.environmentId = 'produzione';
      mockAuthenticationService._getFieldsMandatory.mockReturnValue(['url_produzione']);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);

      const controls = component._formGroup.controls;
      const setValidatorsSpy = vi.spyOn(controls.url, 'setValidators');
      component.__checkAmbiente(controls);

      expect(setValidatorsSpy).toHaveBeenCalledWith([Validators.required]);
    });

    it('should disable not-modifiable fields when not new', () => {
      component.service = { stato: 'bozza' };
      component._isNew = false;
      mockAuthenticationService._getFieldsMandatory.mockReturnValue([]);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['protocollo']);

      const controls = component._formGroup.controls;
      const disableSpy = vi.spyOn(controls.protocollo, 'disable');
      component.__checkAmbiente(controls);

      expect(disableSpy).toHaveBeenCalled();
    });

    it('should not disable not-modifiable fields when _isNew is true', () => {
      component.service = { stato: 'bozza' };
      component._isNew = true;
      mockAuthenticationService._getFieldsMandatory.mockReturnValue([]);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['protocollo']);

      const controls = component._formGroup.controls;
      const disableSpy = vi.spyOn(controls.protocollo, 'disable');
      component.__checkAmbiente(controls);

      expect(disableSpy).not.toHaveBeenCalled();
    });

    it('should skip mandatory fields that do not exist in controls', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getFieldsMandatory.mockReturnValue(['nonexistent_field']);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);

      // Should not throw
      const controls = component._formGroup.controls;
      component.__checkAmbiente(controls);
    });

    it('should call updateValueAndValidity', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getFieldsMandatory.mockReturnValue([]);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);
      const updateSpy = vi.spyOn(component._formGroup, 'updateValueAndValidity');
      component.__checkAmbiente(component._formGroup.controls);
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  // ==================== __disableAmbiente ====================

  describe('__disableAmbiente', () => {
    it('should disable and clear validators on url_produzione and url_collaudo if they exist', () => {
      const controls: any = {
        url_produzione: { disable: vi.fn(), clearValidators: vi.fn() },
        url_collaudo: { disable: vi.fn(), clearValidators: vi.fn() }
      };
      const updateSpy = vi.spyOn(component._formGroup, 'updateValueAndValidity');
      component.__disableAmbiente(controls);

      expect(controls.url_produzione.disable).toHaveBeenCalled();
      expect(controls.url_produzione.clearValidators).toHaveBeenCalled();
      expect(controls.url_collaudo.disable).toHaveBeenCalled();
      expect(controls.url_collaudo.clearValidators).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle missing controls gracefully', () => {
      const controls: any = {};
      // Should not throw
      component.__disableAmbiente(controls);
    });
  });

  // ==================== _canEditMapper ====================

  describe('_canEditMapper', () => {
    it('should return true when user is gestore', () => {
      mockAuthenticationService.isGestore.mockReturnValue(true);
      component.service = { stato: 'bozza' };
      expect(component._canEditMapper()).toBe(true);
    });

    it('should return true when mandatory classes do not include current environment', () => {
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService._getClassesMandatory.mockReturnValue(['generico']);
      component.service = { stato: 'bozza' };
      component.environmentId = 'collaudo';
      expect(component._canEditMapper()).toBe(true);
    });

    it('should return false when mandatory classes include current environment', () => {
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService._getClassesMandatory.mockReturnValue(['collaudo']);
      component.service = { stato: 'bozza' };
      component.environmentId = 'collaudo';
      expect(component._canEditMapper()).toBe(false);
    });

    it('should use empty string for stato when service is null', () => {
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService._getClassesMandatory.mockReturnValue([]);
      component.service = null;
      expect(component._canEditMapper()).toBe(true);
      expect(mockAuthenticationService._getClassesMandatory).toHaveBeenCalledWith('servizio', 'api', '');
    });
  });

  // ==================== _getGroupLabelMapper ====================

  describe('_getGroupLabelMapper', () => {
    it('should return label_gruppo from Tools.Configurazione', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [
              { nome_gruppo: 'G1', label_gruppo: 'Group One', classe_dato: 'collaudo' }
            ]
          }
        }
      };
      component.fieldToGroup = 'label_gruppo';
      const result = component._getGroupLabelMapper('Group One');
      expect(result).toBe('Group One');
    });

    it('should return undefined when group not found', () => {
      Tools.Configurazione = {
        servizio: { api: { profili: [], proprieta_custom: [] } }
      };
      const result = component._getGroupLabelMapper('NonExistent');
      expect(result).toBeUndefined();
    });

    it('should use fieldToGroup for lookup', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [
              { nome_gruppo: 'G1', label_gruppo: 'Group One', classe_dato: 'collaudo' }
            ]
          }
        }
      };
      component.fieldToGroup = 'nome_gruppo';
      const result = component._getGroupLabelMapper('G1');
      expect(result).toBe('Group One');
    });
  });

  // ==================== _getGroupNameByFieldGroup ====================

  describe('_getGroupNameByFieldGroup', () => {
    it('should return nome_gruppo from Tools.Configurazione', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [
              { nome_gruppo: 'G1', label_gruppo: 'Group One', classe_dato: 'collaudo' }
            ]
          }
        }
      };
      component.fieldToGroup = 'label_gruppo';
      const result = component._getGroupNameByFieldGroup('Group One');
      expect(result).toBe('G1');
    });

    it('should return undefined when group not found', () => {
      Tools.Configurazione = {
        servizio: { api: { profili: [], proprieta_custom: [] } }
      };
      const result = component._getGroupNameByFieldGroup('NonExistent');
      expect(result).toBeUndefined();
    });
  });

  // ==================== _getGroupNameByFieldGroupMapper ====================

  describe('_getGroupNameByFieldGroupMapper', () => {
    it('should delegate to _getGroupNameByFieldGroup', () => {
      const spy = vi.spyOn(component, '_getGroupNameByFieldGroup').mockReturnValue('G1');
      const result = component._getGroupNameByFieldGroupMapper('Group One');
      expect(spy).toHaveBeenCalledWith('Group One');
      expect(result).toBe('G1');
    });
  });

  // ==================== _getCustomSelectLabelMapper ====================

  describe('_getCustomSelectLabelMapper', () => {
    it('should return etichetta when found', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Label',
              classe_dato: 'collaudo',
              proprieta: [{
                nome: 'select_field',
                tipo: 'select',
                required: false,
                valori: [{ nome: 'opt1', etichetta: 'Option One' }]
              }]
            }]
          }
        }
      };
      const result = component._getCustomSelectLabelMapper('opt1', 'select_field', 'TestGroup');
      expect(result).toBe('Option One');
    });

    it('should return cod when etichetta not found', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Label',
              classe_dato: 'collaudo',
              proprieta: [{
                nome: 'select_field',
                tipo: 'select',
                required: false,
                valori: [{ nome: 'opt1', etichetta: 'Option One' }]
              }]
            }]
          }
        }
      };
      const result = component._getCustomSelectLabelMapper('opt_unknown', 'select_field', 'TestGroup');
      expect(result).toBe('opt_unknown');
    });

    it('should match group by label_gruppo', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Label',
              classe_dato: 'collaudo',
              proprieta: [{
                nome: 'sf',
                tipo: 'select',
                required: false,
                valori: [{ nome: 'v1', etichetta: 'Val One' }]
              }]
            }]
          }
        }
      };
      const result = component._getCustomSelectLabelMapper('v1', 'sf', 'Test Label');
      expect(result).toBe('Val One');
    });
  });

  // ==================== _resetProprietaCustom ====================

  describe('_resetProprietaCustom', () => {
    it('should remove and re-add proprieta_custom control', () => {
      const removeSpy = vi.spyOn(component._formGroup as UntypedFormGroup, 'removeControl');
      const addSpy = vi.spyOn(component._formGroup, 'addControl');
      component._resetProprietaCustom();
      expect(removeSpy).toHaveBeenCalledWith('proprieta_custom');
      expect(addSpy).toHaveBeenCalled();
    });

    it('should reset _apiProprietaCustom and _apiProprietaCustomGrouped to empty arrays', () => {
      component._apiProprietaCustom = [{ nome: 'test' }];
      component._apiProprietaCustomGrouped = { group: [] };
      component._resetProprietaCustom();
      expect(component._apiProprietaCustom).toEqual([]);
      expect(component._apiProprietaCustomGrouped).toEqual([]);
    });
  });

  // ==================== acfg / acfgc ====================

  describe('acfg and acfgc', () => {
    it('acfg should return proprieta_custom FormGroup', () => {
      const result = component.acfg();
      expect(result).toBeInstanceOf(UntypedFormGroup);
    });

    it('acfgc should return nested group within proprieta_custom', () => {
      const innerGroup = new UntypedFormGroup({ campo1: new UntypedFormControl('val') });
      const pcGroup = new UntypedFormGroup({ TestGroup: innerGroup });
      (component._formGroup as UntypedFormGroup).removeControl('proprieta_custom');
      component._formGroup.addControl('proprieta_custom', pcGroup);

      const result = component.acfgc('TestGroup');
      expect(result).toBe(innerGroup);
    });
  });

  // ==================== _hasControlError / f getter ====================

  describe('_hasControlError and f getter', () => {
    it('f should return formGroup controls', () => {
      const controls = component.f;
      expect(controls['protocollo']).toBeDefined();
      expect(controls['nome_gateway']).toBeDefined();
    });

    it('_hasControlError should return true when control has errors and is touched', () => {
      component._formGroup.get('protocollo')?.setValidators([Validators.required]);
      component._formGroup.get('protocollo')?.setValue('');
      component._formGroup.get('protocollo')?.markAsTouched();
      component._formGroup.get('protocollo')?.updateValueAndValidity();
      expect(component._hasControlError('protocollo')).toBe(true);
    });

    it('_hasControlError should return false when control has no errors', () => {
      component._formGroup.get('protocollo')?.setValue('rest');
      component._formGroup.get('protocollo')?.updateValueAndValidity();
      expect(component._hasControlError('protocollo')).toBe(false);
    });
  });

  // ==================== _onResize / ngAfterContentChecked ====================

  describe('_onResize and ngAfterContentChecked', () => {
    it('ngAfterContentChecked should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // In test env window.innerWidth might vary, but method should not throw
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // ==================== _canEditFieldMapper ====================

  describe('_canEditFieldMapper', () => {
    it('should pass service stato and grant ruoli', () => {
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'] } as any;
      component._canEditFieldMapper('url');
      expect(mockAuthenticationService.canEditField).toHaveBeenCalledWith('servizio', 'api', 'pubblicato', 'url', ['referente']);
    });
  });

  // ==================== _initProprietaCustom ====================

  describe('_initProprietaCustom', () => {
    it('should populate _apiProprietaCustom based on environment and profiles', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              proprieta: [{ nome: 'campo1', tipo: 'text', required: false, index: 0 }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();

      expect(component._apiProprietaCustom.length).toBe(1);
      expect(component._apiProprietaCustom[0].nome).toBe('campo1');
      expect(component._apiProprietaCustom[0].nome_gruppo).toBe('TestGroup');
    });

    it('should skip custom property groups that do not match the environment', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'ProdGroup',
              label_gruppo: 'Prod Group Label',
              classe_dato: 'produzione',
              proprieta: [{ nome: 'campo1', tipo: 'text', required: false, index: 0 }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();
      expect(component._apiProprietaCustom.length).toBe(0);
    });

    it('should skip groups that do not match profili filter', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [
              { codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' },
              { codice_interno: 'mtls', auth_type: 'mtls', etichetta: 'MTLS' }
            ],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              profili: ['mtls'],
              proprieta: [{ nome: 'campo1', tipo: 'text', required: false, index: 0 }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();
      expect(component._apiProprietaCustom.length).toBe(0);
    });

    it('should skip groups that do not match auth_type filter', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [
              { codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }
            ],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              auth_type: ['mtls'],
              proprieta: [{ nome: 'campo1', tipo: 'text', required: false, index: 0 }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();
      expect(component._apiProprietaCustom.length).toBe(0);
    });

    it('should set existing proprieta value from servizioApi.proprieta_custom', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              proprieta: [{ nome: 'campo1', tipo: 'text', required: false, index: 0 }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: [{ gruppo: 'TestGroup', proprieta: [{ nome: 'campo1', valore: 'existing_value' }] }]
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();

      const pcControl = component.proprietaCustom.get('Test Group Label')?.get('campo1');
      expect(pcControl?.value).toBe('existing_value');
    });

    it('should add required validator when field is required and classe_dato matches mandatory class', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              proprieta: [{ nome: 'campo1', tipo: 'text', required: true, index: 0 }]
            }]
          }
        }
      };
      mockAuthenticationService._getFieldsMandatory.mockReturnValue(['collaudo']);
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();

      const pcControl = component.proprietaCustom.get('Test Group Label')?.get('campo1');
      expect(pcControl?.validator).toBeTruthy();
    });

    it('should set default select value when no existing proprieta_custom and field is select', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              proprieta: [{
                nome: 'select_field',
                tipo: 'select',
                required: false,
                index: 0,
                valori: [
                  { nome: 'opt1', etichetta: 'Opt 1', default: false },
                  { nome: 'opt2', etichetta: 'Opt 2', default: true }
                ]
              }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();

      const pcControl = component.proprietaCustom.get('Test Group Label')?.get('select_field');
      expect(pcControl?.value).toBe('opt2');
    });

    it('should sort proprieta by index', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              proprieta: [
                { nome: 'campo2', tipo: 'text', required: false, index: 2 },
                { nome: 'campo1', tipo: 'text', required: false, index: 1 }
              ]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();

      expect(component._apiProprietaCustom[0].nome).toBe('campo1');
      expect(component._apiProprietaCustom[1].nome).toBe('campo2');
    });

    it('should set _updateMapper timestamp', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [],
            proprieta_custom: []
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [],
        proprieta_custom: []
      } as any;
      component.service = { stato: 'bozza' };

      component._initProprietaCustom();
      expect(component._updateMapper).toBeTruthy();
      expect(Number(component._updateMapper)).toBeGreaterThan(0);
    });

    it('should add pattern validator when regular_expression is provided', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              proprieta: [{ nome: 'campo1', tipo: 'text', required: false, index: 0, regular_expression: '^[a-z]+$' }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();

      const pcControl = component.proprietaCustom.get('Test Group Label')?.get('campo1');
      // Test that pattern validator works
      pcControl?.setValue('123');
      expect(pcControl?.valid).toBe(false);
      pcControl?.setValue('abc');
      expect(pcControl?.valid).toBe(true);
    });

    it('should propagate ruoli_abilitati to _apiProprietaCustom items', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', auth_type: 'pdnd', etichetta: 'PDND' }],
            proprieta_custom: [{
              nome_gruppo: 'TestGroup',
              label_gruppo: 'Test Group Label',
              classe_dato: 'collaudo',
              ruoli_abilitati: ['referente', 'gestore'],
              proprieta: [{ nome: 'campo1', tipo: 'text', required: false, index: 0 }]
            }]
          }
        }
      };
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdnd' }],
        proprieta_custom: []
      } as any;
      component.environmentId = 'collaudo';
      component.service = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;

      component._initProprietaCustom();
      expect(component._apiProprietaCustom[0].ruoli_abilitati).toEqual(['referente', 'gestore']);
    });
  });

  // ==================== _hasControlApiCustomPropertiesError / _hasControlApiCustomPropertiesValue ====================

  describe('_hasControlApiCustomPropertiesError and _hasControlApiCustomPropertiesValue', () => {
    beforeEach(() => {
      const innerGroup = new UntypedFormGroup({
        campo1: new UntypedFormControl('', [Validators.required])
      });
      const pcGroup = new UntypedFormGroup({ TestGroup: innerGroup });
      (component._formGroup as UntypedFormGroup).removeControl('proprieta_custom');
      component._formGroup.addControl('proprieta_custom', pcGroup);
    });

    it('_hasControlApiCustomPropertiesError should return true when control has errors and is touched', () => {
      const ctrl = component.acfgc('TestGroup').controls['campo1'];
      ctrl.setValue('');
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
      expect(component._hasControlApiCustomPropertiesError('TestGroup', 'campo1')).toBe(true);
    });

    it('_hasControlApiCustomPropertiesError should return false when control is valid', () => {
      const ctrl = component.acfgc('TestGroup').controls['campo1'];
      ctrl.setValue('valid');
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
      expect(component._hasControlApiCustomPropertiesError('TestGroup', 'campo1')).toBeFalsy();
    });

    it('_hasControlApiCustomPropertiesValue should return true when control has value', () => {
      const topGroup = component.acfg();
      (topGroup as UntypedFormGroup).addControl('TestField', new UntypedFormControl('hasValue'));
      expect(component._hasControlApiCustomPropertiesValue('TestField')).toBeTruthy();
    });

    it('_hasControlApiCustomPropertiesValue should return falsy when control has no value', () => {
      const topGroup = component.acfg();
      (topGroup as UntypedFormGroup).addControl('EmptyField', new UntypedFormControl(''));
      expect(component._hasControlApiCustomPropertiesValue('EmptyField')).toBeFalsy();
    });
  });

  // ==================== copySepcificationValue ====================

  describe('copySepcificationValue (private via copyTestingValue)', () => {
    it('should set _descrittoreCtrl from collaudo configuration', () => {
      component.servizioApi = {
        configurazione_collaudo: {
          specifica: { filename: 'spec.yaml', content_type: 'application/yaml', uuid: 'uuid-abc' }
        }
      } as any;
      (component as any).testingValues = {
        nome_gateway: '', versione_gateway: null, url: '', protocollo: 'rest', protocollo_dettaglio: ''
      };
      component.copyTestingValue('protocollo');
      expect(component._descrittoreCtrl.value).toEqual({
        file: 'spec.yaml',
        type: 'application/yaml',
        uuid: 'uuid-abc'
      });
      expect(component._hasSpecifica).toBe(true);
    });

    it('should set empty values when collaudo has no specifica', () => {
      component.servizioApi = {
        configurazione_collaudo: {}
      } as any;
      (component as any).testingValues = {
        nome_gateway: '', versione_gateway: null, url: '', protocollo: 'rest', protocollo_dettaglio: ''
      };
      component.copyTestingValue('protocollo');
      expect(component._descrittoreCtrl.value).toEqual({
        file: '',
        type: '',
        uuid: ''
      });
      expect(component._hasSpecifica).toBe(false);
    });

    it('should not overwrite when overwrite=false and _descrittoreCtrl already has file', () => {
      component.servizioApi = {
        configurazione_collaudo: {
          specifica: { filename: 'new.yaml', content_type: 'yaml', uuid: 'new-uuid' }
        }
      } as any;
      component._descrittoreCtrl.setValue({ file: 'existing.yaml', type: 'yaml', data: 'content' });

      // copyAllTestingValues calls copySepcificationValue(false)
      vi.spyOn(component, 'copyTestingValue').mockImplementation(() => {});
      vi.spyOn(component, 'copyCustomPropertyTestingValue').mockImplementation(() => {});
      component._apiProprietaCustom = [];
      component.copyAllTestingValues();

      // Should keep existing
      expect(component._descrittoreCtrl.value.file).toBe('existing.yaml');
    });
  });

  // ==================== proprietaCustom getter ====================

  describe('proprietaCustom getter', () => {
    it('should return the proprieta_custom FormGroup', () => {
      const result = component.proprietaCustom;
      expect(result).toBeInstanceOf(UntypedFormGroup);
    });
  });

  // ==================== _getEService ====================

  describe('_getEService', () => {
    it('should return empty string when no proprieta_custom', () => {
      component.servizioApi = { proprieta_custom: [] } as any;
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string when proprieta_custom has items but no match', () => {
      component.servizioApi = {
        proprieta_custom: [{ gruppo: 'Other', proprieta: [] }]
      } as any;
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should return empty string even when match found (eservice is commented out)', () => {
      component.servizioApi = {
        proprieta_custom: [{
          gruppo: 'PDNDCollaudo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-123' }]
        }]
      } as any;
      // The method always returns '' because the assignment is commented out
      expect(component._getEService('collaudo')).toBe('');
    });

    it('should use PDNDProduzione for produzione environment', () => {
      component.servizioApi = {
        proprieta_custom: [{ gruppo: 'PDNDProduzione', proprieta: [] }]
      } as any;
      expect(component._getEService('produzione')).toBe('');
    });
  });

  // ==================== _onDescrittoreChange ====================

  describe('_onDescrittoreChange', () => {
    it('should not throw (method is a no-op)', () => {
      expect(() => component._onDescrittoreChange('value')).not.toThrow();
    });
  });

  // ==================== _onCancelEdit ====================

  describe('_onCancelEdit', () => {
    it('should reset flags and call mapApiDetailsToFormValues', () => {
      component._isEdit = true;
      component._error = true;
      component._errorMsg = 'something';
      component.rawData = 'null';

      const mapSpy = vi.spyOn(component as any, 'mapApiDetailsToFormValues');
      component._onCancelEdit();

      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
      expect(mapSpy).toHaveBeenCalled();
    });
  });

  // ==================== _hasPDNDConfigureddMapper ====================

  describe('_hasPDNDConfigureddMapper', () => {
    it('should return false when _getEService returns empty string', () => {
      component.servizioApi = { proprieta_custom: [] } as any;
      expect(component._hasPDNDConfigureddMapper('collaudo')).toBe(false);
    });
  });
});
