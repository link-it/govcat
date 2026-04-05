import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { ServizioSpecificaComponent } from './servizio-specifica.component';
import { Tools } from '@linkit/components';

describe('ServizioSpecificaComponent', () => {
  let component: ServizioSpecificaComponent;
  let savedConfigurazione: any;

  const mockRoute = {
    params: of({ id: '1' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) },
  } as any;
  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null),
  } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Layout: { enableOpenInNewTab: false },
      },
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn(), broadcast: vi.fn() } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canTypeAttachment: vi.fn().mockReturnValue(true),
    canAdd: vi.fn().mockReturnValue(true),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob())),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((...args: any[]) => '');
    (globalThis as any).saveAs = vi.fn();
    component = new ServizioSpecificaComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManager,
      mockAuthService,
      mockApiService,
      mockUtils
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioSpecificaComponent.Name).toBe('ServizioSpecificaComponent');
  });

  it('should set model to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should read config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeTruthy();
  });

  it('should have default sort values', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
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

  it('_onCloseEdit should reset edit state', () => {
    (component as any)._isEdit = true;
    (component as any)._isNew = true;
    (component as any)._editCurrent = { id: 1 };
    component._onCloseEdit({});
    expect((component as any)._isEdit).toBe(false);
    expect((component as any)._isNew).toBe(false);
    expect((component as any)._editCurrent).toBeNull();
  });

  it('_timestampToMoment should return Date for truthy value', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    const result = component._timestampToMoment(0);
    expect(result).toBeNull();
  });

  it('_hasControlError should return falsy when no controls', () => {
    const result = component._hasControlError('nonexistent');
    expect(result).toBeFalsy();
  });

  it('f getter should return editFormGroup controls', () => {
    expect(component.f).toBeDefined();
  });

  // =====================================================================
  // Constructor tests
  // =====================================================================

  describe('constructor', () => {
    it('should set service and grant from router navigation state', () => {
      const navState = { service: { nome: 'TestSvc', versione: '1' }, grant: { ruoli: ['admin'] } };
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: { state: navState } });
      const comp = new ServizioSpecificaComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockAuthService, mockApiService, mockUtils
      );
      expect(comp.service).toEqual(navState.service);
      expect((comp as any)._grant).toEqual(navState.grant);
    });

    it('should set service to null when navigation state has no service', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: { state: {} } });
      const comp = new ServizioSpecificaComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockAuthService, mockApiService, mockUtils
      );
      expect(comp.service).toBeNull();
    });

    it('should set _fromDashboard when queryParams.from is dashboard', () => {
      const dashRoute = {
        params: of({ id: '1' }),
        queryParams: of({ from: 'dashboard' }),
        parent: { params: of({ id: '1' }) },
      } as any;
      const comp = new ServizioSpecificaComponent(
        dashRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockAuthService, mockApiService, mockUtils
      );
      expect((comp as any)._fromDashboard).toBe(true);
    });

    it('should NOT set _fromDashboard when queryParams.from is not dashboard', () => {
      expect((component as any)._fromDashboard).toBe(false);
    });

    it('should call _initSearchForm creating form group with expected controls', () => {
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup.get('organizationTaxCode')).toBeTruthy();
      expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
      expect(component._formGroup.get('creationDateTo')).toBeTruthy();
      expect(component._formGroup.get('fileName')).toBeTruthy();
      expect(component._formGroup.get('status')).toBeTruthy();
      expect(component._formGroup.get('type')).toBeTruthy();
    });
  });

  // =====================================================================
  // ngOnInit tests
  // =====================================================================

  describe('ngOnInit', () => {
    it('should call _loadServizio when service is null and id is present', () => {
      const allegatiConfig = {
        options: {},
        itemRow: { primaryText: [], secondaryText: [], metadata: { text: [], label: [] }, secondaryMetadata: [] },
      };
      mockConfigService.getConfig.mockReturnValue(of(allegatiConfig));
      component.service = null;
      const spy = vi.spyOn(component as any, '_loadServizio').mockImplementation(() => {});
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should call _loadServizioAllegati and _initBreadcrumb when service exists', () => {
      const allegatiConfig = {
        options: {},
        itemRow: { primaryText: [], secondaryText: [], metadata: { text: [], label: [] }, secondaryMetadata: [] },
      };
      mockConfigService.getConfig.mockReturnValue(of(allegatiConfig));
      component.service = { nome: 'MySvc', versione: '1', stato: 'pubblicato' };
      const spyLoad = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      const spyBreadcrumb = vi.spyOn(component as any, '_initBreadcrumb').mockImplementation(() => {});
      component.ngOnInit();
      expect(spyBreadcrumb).toHaveBeenCalled();
      expect(spyLoad).toHaveBeenCalled();
    });

    it('should set allegatiConfig and call _translateConfig', () => {
      const allegatiConfig = {
        options: { tipo: { label: 'TIPO_LABEL', values: { v1: { label: 'V1_LABEL' } } } },
        itemRow: { primaryText: [], secondaryText: [], metadata: { text: [], label: [] }, secondaryMetadata: [] },
      };
      mockConfigService.getConfig.mockReturnValue(of(allegatiConfig));
      component.service = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.ngOnInit();
      expect(component.allegatiConfig).toBe(allegatiConfig);
      expect(mockTranslate.instant).toHaveBeenCalledWith('TIPO_LABEL');
      expect(mockTranslate.instant).toHaveBeenCalledWith('V1_LABEL');
    });

    it('should not do anything when route params have no id', () => {
      const routeNoId = {
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) },
      } as any;
      const comp = new ServizioSpecificaComponent(
        routeNoId, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager, mockAuthService, mockApiService, mockUtils
      );
      const spy = vi.spyOn(comp as any, '_loadServizio');
      comp.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set _updateMapper when service exists', () => {
      const allegatiConfig = { options: {}, itemRow: { primaryText: [], secondaryText: [], metadata: { text: [], label: [] }, secondaryMetadata: [] } };
      mockConfigService.getConfig.mockReturnValue(of(allegatiConfig));
      component.service = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.ngOnInit();
      expect(component._updateMapper).toBeTruthy();
      expect(component._updateMapper.length).toBeGreaterThan(0);
    });
  });

  // =====================================================================
  // _translateConfig tests
  // =====================================================================

  describe('_translateConfig', () => {
    it('should translate labels in allegatiConfig options', () => {
      component.allegatiConfig = {
        options: {
          tipo: { label: 'LABEL_KEY' },
          altro: { label: 'OTHER_KEY', values: { a: { label: 'A_VAL' }, b: { label: 'B_VAL' } } },
        },
      };
      component._translateConfig();
      expect(mockTranslate.instant).toHaveBeenCalledWith('LABEL_KEY');
      expect(mockTranslate.instant).toHaveBeenCalledWith('OTHER_KEY');
      expect(mockTranslate.instant).toHaveBeenCalledWith('A_VAL');
      expect(mockTranslate.instant).toHaveBeenCalledWith('B_VAL');
    });

    it('should skip translation when no options present', () => {
      component.allegatiConfig = {};
      mockTranslate.instant.mockClear();
      component._translateConfig();
      // instant might have been called by other things, but not by _translateConfig
      // since allegatiConfig.options is undefined
      expect(mockTranslate.instant).not.toHaveBeenCalled();
    });

    it('should handle options without labels or values', () => {
      component.allegatiConfig = {
        options: {
          noLabel: {},
          onlyValues: { values: { x: { label: 'X_VAL' } } },
        },
      };
      component._translateConfig();
      expect(mockTranslate.instant).toHaveBeenCalledWith('X_VAL');
    });

    it('should do nothing if allegatiConfig is null', () => {
      component.allegatiConfig = null;
      mockTranslate.instant.mockClear();
      component._translateConfig();
      expect(mockTranslate.instant).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // _initBreadcrumb tests
  // =====================================================================

  describe('_initBreadcrumb', () => {
    it('should build breadcrumbs with service data', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.id = 42;
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[1].label).toBe('TestSvc v. 2');
      expect(component.breadcrumbs[1].url).toBe('/servizi/42');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
    });

    it('should build breadcrumbs without service using id', () => {
      component.service = null;
      component.id = 99;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('99');
    });

    it('should build breadcrumbs without service and without id', () => {
      component.service = null;
      component.id = 0;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('should set first breadcrumb to Dashboard when _fromDashboard is true', () => {
      (component as any)._fromDashboard = true;
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.id = 5;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should set third breadcrumb to AllegatiSpecifica', () => {
      component.service = null;
      component.id = 1;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.SERVICES.TITLE.AllegatiSpecifica');
    });
  });

  // =====================================================================
  // _loadServizio tests
  // =====================================================================

  describe('_loadServizio', () => {
    it('should load grant then service details on success', () => {
      const mockGrant = { ruoli: ['admin'] };
      const mockService = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService));
      component.id = 10;
      const spyLoadAllegati = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component._loadServizio();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10, 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10);
      expect((component as any)._grant).toEqual(mockGrant);
      expect(component.service).toEqual(mockService);
      expect(component._spin).toBe(false);
      expect(spyLoadAllegati).toHaveBeenCalled();
    });

    it('should call _initBreadcrumb and set _updateMapper after loading service', () => {
      const mockGrant = { ruoli: [] };
      const mockService = { nome: 'S', versione: '1', stato: 'bozza' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService));
      component.id = 5;
      vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      const spyBreadcrumb = vi.spyOn(component as any, '_initBreadcrumb');
      component._loadServizio();
      expect(spyBreadcrumb).toHaveBeenCalled();
      expect(component._updateMapper).toBeTruthy();
    });

    it('should handle service detail error', () => {
      const mockGrant = { ruoli: [] };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(throwError(() => new Error('service fail')));
      component.id = 10;
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });

    it('should handle grant error', () => {
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant fail')));
      component.id = 10;
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should not do anything when id is 0', () => {
      component.id = 0;
      mockApiService.getDetails.mockClear();
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // _loadServizioAllegati tests
  // =====================================================================

  describe('_loadServizioAllegati', () => {
    const allegatiConfig = {
      options: { tipo: { label: 'Tipo' } },
      itemRow: {
        primaryText: [{ field: 'filename', type: 'text' }],
        secondaryText: [{ field: 'estensione', type: 'text' }],
        metadata: { text: [{ field: 'size', type: 'text' }], label: [{ field: 'type', type: 'text' }] },
        secondaryMetadata: [{ field: 'created', type: 'text' }],
      },
    };

    beforeEach(() => {
      component.allegatiConfig = allegatiConfig;
      component.id = 1;
    });

    it('should load allegati and map content items', () => {
      const response = {
        page: { totalElements: 1 },
        _links: { next: { href: '/next' } },
        content: [
          { component_id: 'c1', filename: 'test.xml', estensione: 'xml', size: 100, type: 'specifica', created: 123 },
        ],
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 1, 'allegati', expect.any(Object));
      expect(component.serviceallegati.length).toBe(1);
      expect(component.serviceallegati[0].id).toBe('c1');
      expect(component.serviceallegati[0].source).toBeDefined();
      expect(Tools.simpleItemFormatter).toHaveBeenCalled();
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
      expect(component._spin).toBe(false);
      expect(component._preventMultiCall).toBe(false);
    });

    it('should reset serviceallegati when no url provided', () => {
      component.serviceallegati = [{ id: 'old' }];
      mockApiService.getDetails.mockReturnValue(of({ page: {}, content: [] }));
      component._loadServizioAllegati();
      // content is empty so nothing is mapped, but list was cleared
      expect(component.serviceallegati).toEqual([]);
    });

    it('should append items when url is provided', () => {
      component.serviceallegati = [{ id: 'existing', primaryText: '', secondaryText: '', metadata: '', secondaryMetadata: '', editMode: false, source: {} }];
      const response = {
        page: { totalElements: 2 },
        _links: null,
        content: [
          { component_id: 'c2', filename: 'b.xml' },
        ],
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati(null, '/api/next');
      expect(component.serviceallegati.length).toBe(2);
    });

    it('should handle error response', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      component._loadServizioAllegati();
      expect(component._spin).toBe(false);
      expect((component as any)._error).toBe(true);
      expect((component as any)._message).toBe('APP.MESSAGE.ERROR.Default');
    });

    it('should handle null response gracefully', () => {
      mockApiService.getDetails.mockReturnValue(of(null));
      component._loadServizioAllegati();
      expect(component._spin).toBe(false);
    });

    it('should not call api when id is 0', () => {
      component.id = 0;
      mockApiService.getDetails.mockClear();
      component._loadServizioAllegati();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set _links from response', () => {
      const response = {
        page: { totalElements: 1 },
        _links: { next: { href: '/next-page' } },
        content: [{ component_id: 'c1' }],
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati();
      expect(component._links).toEqual({ next: { href: '/next-page' } });
    });

    it('should build metadata string with both text and label', () => {
      (Tools.simpleItemFormatter as any).mockImplementation((...args: any[]) => {
        // Return different values based on what field array is passed
        const fields = args[0];
        if (fields === allegatiConfig.itemRow.metadata.text) return 'meta-text';
        if (fields === allegatiConfig.itemRow.metadata.label) return 'meta-label';
        return 'other';
      });
      const response = {
        page: {},
        content: [{ component_id: 'c1' }],
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati();
      expect(component.serviceallegati[0].metadata).toContain('meta-text');
      expect(component.serviceallegati[0].metadata).toContain('meta-label');
    });

    it('should set metadata to empty string when both text and label are empty', () => {
      (Tools.simpleItemFormatter as any).mockImplementation(() => '');
      const response = { page: {}, content: [{ component_id: 'c1' }] };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizioAllegati();
      expect(component.serviceallegati[0].metadata).toBe('');
    });
  });

  // =====================================================================
  // __loadMoreData tests
  // =====================================================================

  describe('__loadMoreData', () => {
    it('should call _loadServizioAllegati when _links.next exists and not prevented', () => {
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = false;
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.__loadMoreData();
      expect(spy).toHaveBeenCalledWith(null, '/api/next');
      expect(component._preventMultiCall).toBe(true);
    });

    it('should not call _loadServizioAllegati when _links is null', () => {
      component._links = null;
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioAllegati when _links.next is missing', () => {
      component._links = {};
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioAllegati when _preventMultiCall is true', () => {
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = true;
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // _onNew tests
  // =====================================================================

  describe('_onNew', () => {
    it('should call _editAllegato when _useDialog is true', () => {
      component._useDialog = true;
      const spy = vi.spyOn(component as any, '_editAllegato').mockImplementation(() => {});
      component._onNew();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call _editAllegato when _useDialog is false', () => {
      component._useDialog = false;
      const spy = vi.spyOn(component as any, '_editAllegato').mockImplementation(() => {});
      component._onNew();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // _onEdit tests
  // =====================================================================

  describe('_onEdit', () => {
    it('should call searchBarForm._pinLastSearch and _editAllegato when searchBarForm exists', () => {
      component._useDialog = true;
      const pinSpy = vi.fn();
      (component as any).searchBarForm = { _pinLastSearch: pinSpy };
      const editSpy = vi.spyOn(component as any, '_editAllegato').mockImplementation(() => {});
      const data = { source: { uuid: 'abc' } };
      component._onEdit({}, data);
      expect(pinSpy).toHaveBeenCalled();
      expect(editSpy).toHaveBeenCalledWith(data);
    });

    it('should call _editAllegato without calling _pinLastSearch when searchBarForm is not set', () => {
      component._useDialog = true;
      (component as any).searchBarForm = undefined;
      const editSpy = vi.spyOn(component as any, '_editAllegato').mockImplementation(() => {});
      const data = { source: { uuid: 'def' } };
      component._onEdit({}, data);
      expect(editSpy).toHaveBeenCalledWith(data);
    });

    it('should not call _editAllegato when _useDialog is false', () => {
      component._useDialog = false;
      const editSpy = vi.spyOn(component as any, '_editAllegato').mockImplementation(() => {});
      component._onEdit({}, {});
      expect(editSpy).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // _onSubmit tests
  // =====================================================================

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      const searchSpy = vi.fn();
      (component as any).searchBarForm = { _onSearch: searchSpy };
      component._onSubmit({});
      expect(searchSpy).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      (component as any).searchBarForm = undefined;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // =====================================================================
  // _onSearch tests
  // =====================================================================

  describe('_onSearch', () => {
    it('should set _filterData and call _loadServizioAllegati', () => {
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      const values = [{ field: 'fileName', value: 'test' }];
      component._onSearch(values);
      expect(component._filterData).toBe(values);
      expect(spy).toHaveBeenCalledWith(values);
    });
  });

  // =====================================================================
  // _resetForm tests
  // =====================================================================

  describe('_resetForm', () => {
    it('should reset _filterData to empty array and reload allegati', () => {
      component._filterData = [{ something: true }] as any;
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component._resetForm();
      expect(component._filterData).toEqual([]);
      expect(spy).toHaveBeenCalledWith([]);
    });
  });

  // =====================================================================
  // _editAllegato tests
  // =====================================================================

  describe('_editAllegato', () => {
    it('should open modal for new allegato (no data)', () => {
      (component as any).editTemplate = {};
      const spy = vi.spyOn(component as any, '_initEditForm');
      component._editAllegato();
      expect((component as any)._editCurrent).toBeNull();
      expect((component as any)._isNew).toBe(true);
      expect(spy).toHaveBeenCalled();
      expect(mockModalService.show).toHaveBeenCalledWith({}, expect.objectContaining({ ignoreBackdropClick: false }));
    });

    it('should not open modal for existing allegato (data with source)', () => {
      const data = { source: { uuid: 'existing-uuid' } };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._editAllegato(data);
      expect((component as any)._editCurrent).toEqual(data.source);
      expect((component as any)._isNew).toBe(false);
      expect(mockModalService.show).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should set _isNew to true when data is null', () => {
      (component as any).editTemplate = {};
      component._editAllegato(null);
      expect((component as any)._isNew).toBe(true);
    });

    it('should set _isNew to false when data has source', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      component._editAllegato({ source: { uuid: '123' } });
      expect((component as any)._isNew).toBe(false);
    });
  });

  // =====================================================================
  // saveModal tests
  // =====================================================================

  describe('saveModal', () => {
    beforeEach(() => {
      (component as any)._modalEditRef = { hide: vi.fn() };
    });

    it('should post for new allegato and reload on success', () => {
      (component as any)._isNew = true;
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      mockApiService.postElementRelated.mockReturnValue(of({ id: 1 }));
      component.saveModal({ filename: 'test.xml' });
      expect(mockApiService.postElementRelated).toHaveBeenCalledWith('servizi', component.id, 'allegati', { filename: 'test.xml' });
      expect((component as any)._saving).toBe(false);
      expect((component as any)._modalEditRef.hide).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('should put for existing allegato and reload on success', () => {
      (component as any)._isNew = false;
      const spy = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({ id: 1 }));
      component.saveModal({ filename: 'updated.xml' });
      expect(mockApiService.putElementRelated).toHaveBeenCalledWith('servizi', component.id, 'allegati', { filename: 'updated.xml' });
      expect((component as any)._saving).toBe(false);
      expect((component as any)._modalEditRef.hide).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle error on save', () => {
      (component as any)._isNew = true;
      mockApiService.postElementRelated.mockReturnValue(throwError(() => new Error('save fail')));
      component.saveModal({ filename: 'fail.xml' });
      expect((component as any)._saving).toBe(false);
      expect((component as any)._error).toBe(true);
      expect((component as any)._errorMsg).toBe('Error');
      expect(mockUtils.GetErrorMsg).toHaveBeenCalled();
    });

    it('should reset _error and _saving flags at start', () => {
      (component as any)._isNew = true;
      (component as any)._error = true;
      (component as any)._errorMsg = 'old error';
      mockApiService.postElementRelated.mockReturnValue(of({}));
      vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.saveModal({});
      // After success, _error remains false, _saving is false
      expect((component as any)._error).toBe(false);
      expect((component as any)._errorMsg).toBe('');
    });

    it('should call _onCloseEdit after successful save', () => {
      (component as any)._isNew = true;
      (component as any)._isEdit = true;
      mockApiService.postElementRelated.mockReturnValue(of({}));
      vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.saveModal({});
      expect((component as any)._isEdit).toBe(false);
      expect((component as any)._isNew).toBe(false);
      expect((component as any)._editCurrent).toBeNull();
    });
  });

  // =====================================================================
  // closeModal tests
  // =====================================================================

  describe('closeModal', () => {
    it('should hide modal and call _onCloseEdit', () => {
      (component as any)._modalEditRef = { hide: vi.fn() };
      (component as any)._isEdit = true;
      (component as any)._isNew = true;
      component.closeModal();
      expect((component as any)._modalEditRef.hide).toHaveBeenCalled();
      expect((component as any)._isEdit).toBe(false);
      expect((component as any)._isNew).toBe(false);
    });
  });

  // =====================================================================
  // _deleteAllegato tests
  // =====================================================================

  describe('_deleteAllegato', () => {
    it('should show confirmation dialog and delete on confirm', () => {
      const data = { source: { uuid: 'uuid-123' } };
      mockModalService.show.mockReturnValue({
        content: { onClose: of(true) },
        hide: vi.fn(),
      });
      const spyLoad = vi.spyOn(component as any, '_loadServizioAllegati').mockImplementation(() => {});
      component.id = 5;
      component._deleteAllegato(data);
      expect(mockModalService.show).toHaveBeenCalled();
      expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith('servizi', 5, 'allegati/uuid-123');
      expect(spyLoad).toHaveBeenCalled();
      expect((component as any)._deleting).toBe(false);
    });

    it('should not delete when confirm is false', () => {
      const data = { source: { uuid: 'uuid-456' } };
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn(),
      });
      component._deleteAllegato(data);
      expect(mockApiService.deleteElementRelated).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      const data = { source: { uuid: 'uuid-789' } };
      mockModalService.show.mockReturnValue({
        content: { onClose: of(true) },
        hide: vi.fn(),
      });
      mockApiService.deleteElementRelated.mockReturnValue(throwError(() => new Error('delete fail')));
      component.id = 5;
      component._deleteAllegato(data);
      expect((component as any)._error).toBe(true);
      expect((component as any)._errorMsg).toBe('Error');
      expect((component as any)._deleting).toBe(false);
    });

    it('should reset error flags before showing dialog', () => {
      (component as any)._error = true;
      (component as any)._errorMsg = 'old';
      const data = { source: { uuid: 'u1' } };
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn(),
      });
      component._deleteAllegato(data);
      expect((component as any)._error).toBe(false);
      expect((component as any)._errorMsg).toBe('');
    });

    it('should call translate.instant for dialog labels', () => {
      const data = { source: { uuid: 'u2' } };
      mockModalService.show.mockReturnValue({
        content: { onClose: of(false) },
        hide: vi.fn(),
      });
      component._deleteAllegato(data);
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.Attention');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.MESSAGE.AreYouSure');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.BUTTON.Cancel');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.BUTTON.Confirm');
    });
  });

  // =====================================================================
  // _downloadAllegato tests
  // =====================================================================

  describe('_downloadAllegato', () => {
    it('should download and call saveAs on success', () => {
      const blob = new Blob(['content']);
      const data = { source: { uuid: 'dl-uuid', filename: 'doc.pdf' } };
      mockApiService.download.mockReturnValue(of({ body: blob }));
      component.id = 3;
      component._downloadAllegato(data);
      expect(mockApiService.download).toHaveBeenCalledWith('servizi', 3, 'allegati/dl-uuid/download');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'doc.pdf');
      expect((component as any)._downloading).toBe(false);
    });

    it('should handle download error', () => {
      const data = { source: { uuid: 'dl-err', filename: 'fail.pdf' } };
      mockApiService.download.mockReturnValue(throwError(() => new Error('download fail')));
      component.id = 3;
      component._downloadAllegato(data);
      expect((component as any)._error).toBe(true);
      expect((component as any)._errorMsg).toBe('Error');
      expect((component as any)._downloading).toBe(false);
    });

    it('should reset error flags before downloading', () => {
      (component as any)._error = true;
      (component as any)._errorMsg = 'previous';
      const data = { source: { uuid: 'dl-uuid2', filename: 'x.xml' } };
      mockApiService.download.mockReturnValue(of({ body: new Blob() }));
      component.id = 1;
      component._downloadAllegato(data);
      expect((component as any)._error).toBe(false);
      expect((component as any)._errorMsg).toBe('');
    });

    it('should set _downloading to true during request', () => {
      const subj = new Subject();
      const data = { source: { uuid: 'dl-uuid3', filename: 'y.xml' } };
      mockApiService.download.mockReturnValue(subj.asObservable());
      component.id = 1;
      component._downloadAllegato(data);
      expect((component as any)._downloading).toBe(true);
      subj.next({ body: new Blob() });
      expect((component as any)._downloading).toBe(false);
    });
  });

  // =====================================================================
  // __descrittoreChange tests
  // =====================================================================

  describe('__descrittoreChange', () => {
    beforeEach(() => {
      // Initialize edit form to have controls
      component._initEditForm();
    });

    it('should patch filename, estensione and content controls', () => {
      const value = { file: 'newfile.wsdl', type: 'wsdl', data: 'base64data' };
      component.__descrittoreChange(value);
      expect(component._editFormGroup.get('filename')?.value).toBe('newfile.wsdl');
      expect(component._editFormGroup.get('estensione')?.value).toBe('wsdl');
      expect(component._editFormGroup.get('content')?.value).toBe('base64data');
    });

    it('should reset _error and _errorMsg', () => {
      (component as any)._error = true;
      (component as any)._errorMsg = 'some error';
      component.__descrittoreChange({ file: 'a', type: 'b', data: 'c' });
      expect((component as any)._error).toBe(false);
      expect((component as any)._errorMsg).toBe('');
    });

    it('should call updateValueAndValidity on the form group', () => {
      const spy = vi.spyOn(component._editFormGroup, 'updateValueAndValidity');
      component.__descrittoreChange({ file: 'a', type: 'b', data: 'c' });
      expect(spy).toHaveBeenCalled();
    });
  });

  // =====================================================================
  // _canTypeAttachmentMapper / _canAddMapper tests
  // =====================================================================

  describe('_canTypeAttachmentMapper', () => {
    it('should delegate to authenticationService.canTypeAttachment', () => {
      component.service = { stato: 'pubblicato' };
      (component as any)._grant = { ruoli: ['admin'] };
      component._canTypeAttachmentMapper('specifica');
      expect(mockAuthService.canTypeAttachment).toHaveBeenCalledWith('servizio', 'pubblicato', 'specifica', ['admin']);
    });

    it('should handle null service and grant gracefully', () => {
      component.service = null;
      (component as any)._grant = null;
      component._canTypeAttachmentMapper('generico');
      expect(mockAuthService.canTypeAttachment).toHaveBeenCalledWith('servizio', undefined, 'generico', undefined);
    });
  });

  describe('_canAddMapper', () => {
    it('should delegate to authenticationService.canAdd', () => {
      component.service = { stato: 'bozza' };
      (component as any)._grant = { ruoli: ['referente'] };
      component._canAddMapper();
      expect(mockAuthService.canAdd).toHaveBeenCalledWith('servizio', 'bozza', ['referente']);
    });

    it('should handle null service and grant', () => {
      component.service = null;
      (component as any)._grant = null;
      component._canAddMapper();
      expect(mockAuthService.canAdd).toHaveBeenCalledWith('servizio', undefined, undefined);
    });
  });

  // =====================================================================
  // onActionMonitor tests
  // =====================================================================

  describe('onActionMonitor', () => {
    it('should navigate to service view on backview action', () => {
      component.service = { id_servizio: 42 };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
    });

    it('should not navigate on unknown action', () => {
      component.onActionMonitor({ action: 'unknown' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle default case without throwing', () => {
      expect(() => component.onActionMonitor({ action: 'somethingelse' })).not.toThrow();
    });
  });

  // =====================================================================
  // _initEditForm tests
  // =====================================================================

  describe('_initEditForm', () => {
    it('should create form with null values when no data is provided', () => {
      component._initEditForm();
      expect((component as any)._isEdit).toBe(true);
      expect(component._editFormGroup.get('filename')?.value).toBeNull();
      expect(component._editFormGroup.get('estensione')?.value).toBeNull();
      expect(component._editFormGroup.get('descrizione')?.value).toBeNull();
      expect(component._editFormGroup.get('visibilita')?.value).toBeNull();
      expect(component._editFormGroup.get('tipologia')?.value).toBe('specifica');
    });

    it('should create form with provided data values', () => {
      const data = { fileName: 'test.xml', estensione: 'xml', descrizione: 'A desc', visibilita: 'pubblica' };
      component._initEditForm(data);
      expect(component._editFormGroup.get('filename')?.value).toBe('test.xml');
      expect(component._editFormGroup.get('estensione')?.value).toBe('xml');
      expect(component._editFormGroup.get('descrizione')?.value).toBe('A desc');
      expect(component._editFormGroup.get('visibilita')?.value).toBe('pubblica');
    });

    it('should set content as required when _isNew is true', () => {
      (component as any)._isNew = true;
      component._initEditForm();
      const contentCtrl = component._editFormGroup.get('content');
      // Set to null to trigger validation
      contentCtrl?.setValue(null);
      contentCtrl?.markAsTouched();
      contentCtrl?.updateValueAndValidity();
      expect(contentCtrl?.valid).toBe(false);
    });

    it('should not set content as required when _isNew is false', () => {
      (component as any)._isNew = false;
      component._initEditForm();
      const contentCtrl = component._editFormGroup.get('content');
      contentCtrl?.setValue(null);
      contentCtrl?.markAsTouched();
      contentCtrl?.updateValueAndValidity();
      expect(contentCtrl?.valid).toBe(true);
    });

    it('should set filename and estensione as required', () => {
      component._initEditForm();
      const filenameCtrl = component._editFormGroup.get('filename');
      const estensioneCtrl = component._editFormGroup.get('estensione');
      filenameCtrl?.setValue(null);
      filenameCtrl?.markAsTouched();
      estensioneCtrl?.setValue(null);
      estensioneCtrl?.markAsTouched();
      expect(filenameCtrl?.valid).toBe(false);
      expect(estensioneCtrl?.valid).toBe(false);
    });

    it('should set visibilita as required', () => {
      component._initEditForm();
      const visCtrl = component._editFormGroup.get('visibilita');
      visCtrl?.setValue(null);
      visCtrl?.markAsTouched();
      expect(visCtrl?.valid).toBe(false);
    });
  });

  // =====================================================================
  // _initSearchForm tests
  // =====================================================================

  describe('_initSearchForm', () => {
    it('should create form group with expected controls', () => {
      component._initSearchForm();
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup.get('organizationTaxCode')).toBeTruthy();
      expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
      expect(component._formGroup.get('creationDateTo')).toBeTruthy();
      expect(component._formGroup.get('fileName')).toBeTruthy();
      expect(component._formGroup.get('status')).toBeTruthy();
      expect(component._formGroup.get('type')).toBeTruthy();
    });

    it('should initialize all controls with empty string', () => {
      component._initSearchForm();
      expect(component._formGroup.get('organizationTaxCode')?.value).toBe('');
      expect(component._formGroup.get('creationDateFrom')?.value).toBe('');
      expect(component._formGroup.get('creationDateTo')?.value).toBe('');
      expect(component._formGroup.get('fileName')?.value).toBe('');
      expect(component._formGroup.get('status')?.value).toBe('');
      expect(component._formGroup.get('type')?.value).toBe('');
    });
  });

  // =====================================================================
  // _resetScroll tests
  // =====================================================================

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // =====================================================================
  // _onSort / _onResize / ngAfterContentChecked / ngOnDestroy tests
  // =====================================================================

  describe('_onSort', () => {
    it('should log the event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._onSort({ field: 'date', direction: 'desc' });
      expect(consoleSpy).toHaveBeenCalledWith({ field: 'date', direction: 'desc' });
      consoleSpy.mockRestore();
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // =====================================================================
  // _hasControlError with real controls
  // =====================================================================

  describe('_hasControlError with initialized form', () => {
    it('should return true when control has errors and is touched', () => {
      component._initEditForm();
      const ctrl = component._editFormGroup.get('filename');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      ctrl?.updateValueAndValidity();
      expect(component._hasControlError('filename')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._initEditForm({ fileName: 'valid.xml', estensione: 'xml', descrizione: '', visibilita: 'pubblica' });
      const ctrl = component._editFormGroup.get('filename');
      ctrl?.markAsTouched();
      expect(component._hasControlError('filename')).toBe(false);
    });

    it('should return false when control is untouched even with errors', () => {
      component._initEditForm();
      // filename is null (invalid) but untouched
      expect(component._hasControlError('filename')).toBe(false);
    });
  });
});
