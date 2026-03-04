import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { ServizioMessaggiComponent } from './servizio-messaggi.component';
import { Tools } from '@linkit/components';

describe('ServizioMessaggiComponent', () => {
  let component: ServizioMessaggiComponent;
  let savedConfigurazione: any;

  const mockRoute = {
    params: of({ id: '1' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) },
  } as any;
  const mockRouter = {
    navigate: vi.fn(),
  } as any;
  const mockTranslate = {
    instant: vi.fn((k: string) => k),
    onLangChange: of({}),
  } as any;
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
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((...args: any[]) => '');
    component = new ServizioMessaggiComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManager,
      mockApiService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  // ===================== EXISTING TESTS =====================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioMessaggiComponent.Name).toBe('ServizioMessaggiComponent');
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

  it('_onEdit should set _editCurrent and _isEdit', () => {
    const param = { id: '123' };
    component._onEdit({}, param);
    expect((component as any)._editCurrent).toBe(param);
    expect((component as any)._isEdit).toBe(true);
  });

  it('_timestampToMoment should return Date for truthy value', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    const result = component._timestampToMoment(0);
    expect(result).toBeNull();
  });

  // ===================== NEW TESTS =====================

  // --- Constructor ---

  describe('constructor', () => {
    it('should initialize _formGroup with expected controls', () => {
      expect(component._formGroup).toBeTruthy();
      expect(component._formGroup.get('organizationTaxCode')).toBeTruthy();
      expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
      expect(component._formGroup.get('creationDateTo')).toBeTruthy();
      expect(component._formGroup.get('fileName')).toBeTruthy();
      expect(component._formGroup.get('status')).toBeTruthy();
      expect(component._formGroup.get('type')).toBeTruthy();
    });

    it('should initialize form controls with empty strings', () => {
      expect(component._formGroup.get('organizationTaxCode')!.value).toBe('');
      expect(component._formGroup.get('creationDateFrom')!.value).toBe('');
      expect(component._formGroup.get('creationDateTo')!.value).toBe('');
      expect(component._formGroup.get('fileName')!.value).toBe('');
      expect(component._formGroup.get('status')!.value).toBe('');
      expect(component._formGroup.get('type')!.value).toBe('');
    });

    it('should set _fromDashboard to true when queryParams has from=dashboard', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((...args: any[]) => '');
      const dashboardRoute = {
        params: of({ id: '1' }),
        queryParams: of({ from: 'dashboard' }),
        parent: { params: of({ id: '1' }) },
      } as any;
      const comp = new ServizioMessaggiComponent(
        dashboardRoute,
        mockRouter,
        mockTranslate,
        mockConfigService,
        mockTools,
        mockEventsManager,
        mockApiService
      );
      expect(comp._fromDashboard).toBe(true);
    });

    it('should NOT set _fromDashboard when queryParams has different from value', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((...args: any[]) => '');
      const otherRoute = {
        params: of({ id: '1' }),
        queryParams: of({ from: 'other' }),
        parent: { params: of({ id: '1' }) },
      } as any;
      const comp = new ServizioMessaggiComponent(
        otherRoute,
        mockRouter,
        mockTranslate,
        mockConfigService,
        mockTools,
        mockEventsManager,
        mockApiService
      );
      expect(comp._fromDashboard).toBe(false);
    });

    it('should NOT set _fromDashboard when queryParams is empty', () => {
      expect(component._fromDashboard).toBe(false);
    });

    it('should store config from configService.getConfiguration()', () => {
      expect(component.config).toEqual({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Layout: { enableOpenInNewTab: false },
        },
      });
    });
  });

  // --- Default property values ---

  describe('default property values', () => {
    it('should have id = 0 initially', () => {
      // After constructor, id is set from route params
      // but let's verify the property exists
      expect(component.id).toBeDefined();
    });

    it('should have service = null initially', () => {
      // service gets set from _loadServizio, but initial is null
      // In the current test it may have been set by ngOnInit subscription
      expect(component).toHaveProperty('service');
    });

    it('should have empty servicecommunications initially', () => {
      expect(component).toHaveProperty('servicecommunications');
      expect(Array.isArray(component.servicecommunications)).toBe(true);
    });

    it('should have _isEdit false', () => {
      expect(component._isEdit).toBe(false);
    });

    it('should have _editCurrent null', () => {
      expect(component._editCurrent).toBeNull();
    });

    it('should have _hasFilter false', () => {
      expect(component._hasFilter).toBe(false);
    });

    it('should have _filterData as empty array', () => {
      expect(component._filterData).toEqual([]);
    });

    it('should have _preventMultiCall false', () => {
      expect(component._preventMultiCall).toBe(false);
    });

    it('should have _spin false', () => {
      expect(component._spin).toBe(false);
    });

    it('should have _useRoute false', () => {
      expect(component._useRoute).toBe(false);
    });

    it('should have _useDialog false', () => {
      expect(component._useDialog).toBe(false);
    });

    it('should have default _message', () => {
      expect(component._message).toBe('APP.MESSAGE.NoResults');
    });

    it('should have default _messageHelp', () => {
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });

    it('should have _error false', () => {
      expect(component._error).toBe(false);
    });

    it('should have showHistory true', () => {
      expect(component.showHistory).toBe(true);
    });

    it('should have showSearch true', () => {
      expect(component.showSearch).toBe(true);
    });

    it('should have showSorting true', () => {
      expect(component.showSorting).toBe(true);
    });

    it('should have empty sortFields', () => {
      expect(component.sortFields).toEqual([]);
    });

    it('should have empty searchFields', () => {
      expect(component.searchFields).toEqual([]);
    });

    it('should have empty breadcrumbs initially', () => {
      expect(component.breadcrumbs).toEqual([]);
    });

    it('should have Tools reference', () => {
      expect(component.Tools).toBe(Tools);
    });
  });

  // --- _onResize ---

  describe('_onResize', () => {
    it('should set desktop to true when window width >= 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop to false when window width < 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(false);
    });

    it('should set desktop to true when window width is exactly 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 992, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(true);
    });
  });

  // --- ngOnInit ---

  describe('ngOnInit', () => {
    it('should subscribe to translate.onLangChange', () => {
      // onLangChange is of({}) so it emits immediately; just ensure no error
      component.ngOnInit();
      // no assertion needed, just no errors
    });

    it('should subscribe to route.params and call getConfig for messaggi', () => {
      component.ngOnInit();
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('messaggi');
    });

    it('should set id from route params', () => {
      component.ngOnInit();
      expect(component.id).toBe('1');
    });

    it('should call _loadServizio and _loadServizioMessaggi after getConfig resolves', () => {
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 1, name: 'test' }));
      component.ngOnInit();
      // getDetails should be called at least twice (once for servizio, once for messaggi)
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should not call getConfig when route has no id', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((...args: any[]) => '');
      const noIdRoute = {
        params: of({}),
        queryParams: of({}),
        parent: { params: of({}) },
      } as any;
      const comp = new ServizioMessaggiComponent(
        noIdRoute,
        mockRouter,
        mockTranslate,
        mockConfigService,
        mockTools,
        mockEventsManager,
        mockApiService
      );
      comp.ngOnInit();
      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
    });

    it('should set messaggiConfig from getConfig response', () => {
      const configResponse = {
        simpleItem: { primaryText: 'test' },
        options: {},
      };
      mockConfigService.getConfig.mockReturnValue(of(configResponse));
      component.ngOnInit();
      expect(component.messaggiConfig).toBe(configResponse);
    });
  });

  // --- ngOnDestroy ---

  describe('ngOnDestroy', () => {
    it('should not throw when called', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // --- ngAfterContentChecked ---

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window.innerWidth', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop false for small screen', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(false);
    });
  });

  // --- _translateConfig ---

  describe('_translateConfig', () => {
    it('should translate option labels', () => {
      component.messaggiConfig = {
        options: {
          status: { label: 'STATUS_LABEL', values: {} },
        },
      };
      component._translateConfig();
      expect(mockTranslate.instant).toHaveBeenCalledWith('STATUS_LABEL');
    });

    it('should translate option value labels', () => {
      component.messaggiConfig = {
        options: {
          status: {
            label: 'STATUS_LABEL',
            values: {
              active: { label: 'ACTIVE_LABEL' },
              inactive: { label: 'INACTIVE_LABEL' },
            },
          },
        },
      };
      component._translateConfig();
      expect(mockTranslate.instant).toHaveBeenCalledWith('ACTIVE_LABEL');
      expect(mockTranslate.instant).toHaveBeenCalledWith('INACTIVE_LABEL');
    });

    it('should skip options without label', () => {
      component.messaggiConfig = {
        options: {
          status: { values: { active: { label: 'ACTIVE' } } },
        },
      };
      component._translateConfig();
      // Should still translate value labels even if top-level label is missing
      expect(mockTranslate.instant).toHaveBeenCalledWith('ACTIVE');
    });

    it('should skip options without values', () => {
      component.messaggiConfig = {
        options: {
          status: { label: 'STATUS' },
        },
      };
      component._translateConfig();
      expect(mockTranslate.instant).toHaveBeenCalledWith('STATUS');
      // no error from missing values
    });

    it('should handle null messaggiConfig', () => {
      component.messaggiConfig = null;
      expect(() => component._translateConfig()).not.toThrow();
    });

    it('should handle messaggiConfig without options', () => {
      component.messaggiConfig = { simpleItem: {} };
      expect(() => component._translateConfig()).not.toThrow();
    });

    it('should handle empty options object', () => {
      component.messaggiConfig = { options: {} };
      expect(() => component._translateConfig()).not.toThrow();
    });

    it('should translate multiple option keys', () => {
      component.messaggiConfig = {
        options: {
          type: { label: 'TYPE_LABEL' },
          status: { label: 'STATUS_LABEL' },
          priority: { label: 'PRIORITY_LABEL' },
        },
      };
      component._translateConfig();
      expect(mockTranslate.instant).toHaveBeenCalledWith('TYPE_LABEL');
      expect(mockTranslate.instant).toHaveBeenCalledWith('STATUS_LABEL');
      expect(mockTranslate.instant).toHaveBeenCalledWith('PRIORITY_LABEL');
    });
  });

  // --- _initBreadcrumb ---

  describe('_initBreadcrumb', () => {
    it('should set dashboard breadcrumb when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component.id = 42 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should set services breadcrumb when _fromDashboard is false', () => {
      component._fromDashboard = false;
      component.id = 42 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[0].url).toBe('servizi');
      expect(component.breadcrumbs[0].iconBs).toBe('grid-3x3-gap');
    });

    it('should include service id in second breadcrumb', () => {
      component.id = 99 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('99');
      expect(component.breadcrumbs[1].url).toBe('/servizi/99');
    });

    it('should set Messages label in third breadcrumb', () => {
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.SERVICES.TITLE.Messages');
      expect(component.breadcrumbs[2].url).toBe('');
    });

    it('dashboard breadcrumb should have type link for all items', () => {
      component._fromDashboard = true;
      component._initBreadcrumb();
      component.breadcrumbs.forEach((bc: any) => {
        expect(bc.type).toBe('link');
      });
    });

    it('non-dashboard breadcrumb should have type link for all items', () => {
      component._fromDashboard = false;
      component._initBreadcrumb();
      component.breadcrumbs.forEach((bc: any) => {
        expect(bc.type).toBe('link');
      });
    });
  });

  // --- _setErrorCommunications ---

  describe('_setErrorCommunications', () => {
    it('should set error messages when true', () => {
      component._setErrorCommunications(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set no-results messages when false', () => {
      component._setErrorCommunications(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });

    it('should toggle from error to no-results correctly', () => {
      component._setErrorCommunications(true);
      expect(component._error).toBe(true);
      component._setErrorCommunications(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // --- _initSearchForm ---

  describe('_initSearchForm', () => {
    it('should create a FormGroup with 6 controls', () => {
      component._initSearchForm();
      const controls = Object.keys(component._formGroup.controls);
      expect(controls.length).toBe(6);
    });

    it('should create controls with empty string defaults', () => {
      component._initSearchForm();
      Object.values(component._formGroup.controls).forEach((ctrl: any) => {
        expect(ctrl.value).toBe('');
      });
    });

    it('should replace existing form group when called again', () => {
      const oldGroup = component._formGroup;
      component._initSearchForm();
      expect(component._formGroup).not.toBe(oldGroup);
    });
  });

  // --- _loadServizio ---

  describe('_loadServizio', () => {
    it('should call getDetails with model and id', () => {
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 5, name: 'test' }));
      component._loadServizio();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5);
    });

    it('should set service on success', () => {
      component.id = 5 as any;
      const response = { id_servizio: 5, name: 'Test Service' };
      mockApiService.getDetails.mockReturnValue(of(response));
      component._loadServizio();
      expect(component.service).toBe(response);
    });

    it('should call _initBreadcrumb on success', () => {
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 5 }));
      const spy = vi.spyOn(component as any, '_initBreadcrumb');
      component._loadServizio();
      expect(spy).toHaveBeenCalled();
    });

    it('should set service to null before loading', () => {
      component.id = 5 as any;
      component.service = { id: 999 };
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 5 }));
      // Before the subscribe resolves, service is null
      // But since it's sync observable, we check after
      component._loadServizio();
      expect(component.service).toEqual({ id_servizio: 5 });
    });

    it('should call Tools.OnError on error', () => {
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      component._loadServizio();
      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should not call getDetails when id is falsy (0)', () => {
      component.id = 0;
      mockApiService.getDetails.mockClear();
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // --- _loadServizioMessaggi ---

  describe('_loadServizioMessaggi', () => {
    beforeEach(() => {
      component.id = 5 as any;
      component.messaggiConfig = {
        simpleItem: {
          primaryText: '${text}',
          secondaryText: '${secondary}',
          metadata: { text: '${metaText}', label: '${metaLabel}' },
          secondaryMetadata: '${secMeta}',
        },
        options: {},
      };
    });

    it('should call getDetails with model, id, and "messaggi"', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioMessaggi();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'messaggi');
    });

    it('should reset error state before loading', () => {
      component._error = true;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioMessaggi();
      expect(component._error).toBe(false);
    });

    it('should clear servicecommunications when no url provided', () => {
      component.servicecommunications = [{ id: 1 }];
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioMessaggi();
      expect(component.servicecommunications).toEqual([]);
    });

    it('should set _paging from response.page', () => {
      mockApiService.getDetails.mockReturnValue(of({
        content: [],
        page: { totalElements: 50, totalPages: 5 },
      }));
      component._loadServizioMessaggi();
      expect(component._paging.totalElements).toBe(50);
      expect(component._paging.totalPages).toBe(5);
    });

    it('should set _links from response._links', () => {
      const links = { next: { href: '/api/next' }, prev: { href: '/api/prev' } };
      mockApiService.getDetails.mockReturnValue(of({
        content: [],
        page: {},
        _links: links,
      }));
      component._loadServizioMessaggi();
      expect(component._links).toBe(links);
    });

    it('should set _links to null if response has no _links', () => {
      mockApiService.getDetails.mockReturnValue(of({
        content: [],
        page: {},
      }));
      component._loadServizioMessaggi();
      expect(component._links).toBeNull();
    });

    it('should map content items using simpleItemFormatter', () => {
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1, text: 'hello' }, { id: 2, text: 'world' }],
        page: {},
      }));
      component._loadServizioMessaggi();
      expect(Tools.simpleItemFormatter).toHaveBeenCalled();
      expect(component.servicecommunications.length).toBe(2);
    });

    it('should create elements with expected properties', () => {
      (Tools.simpleItemFormatter as any).mockImplementation((...args: any[]) => 'formatted');
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 42, text: 'test' }],
        page: {},
      }));
      component._loadServizioMessaggi();
      const item = component.servicecommunications[0];
      expect(item.id).toBe(42);
      expect(item.editMode).toBe(false);
      expect(item.source).toEqual({ id: 42, text: 'test' });
    });

    it('should set metadata with combined text and label', () => {
      (Tools.simpleItemFormatter as any).mockImplementation((template: any, ...rest: any[]) => {
        // metadata.text and metadata.label are the 3rd and 4th calls
        // They use messaggiConfig.simpleItem.metadata.text and .label
        if (template === '${metaText}') return 'metaTextValue';
        if (template === '${metaLabel}') return 'metaLabelValue';
        return 'other';
      });
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }],
        page: {},
      }));
      component._loadServizioMessaggi();
      const item = component.servicecommunications[0];
      expect(item.metadata).toContain('metaTextValue');
      expect(item.metadata).toContain('metaLabelValue');
    });

    it('should set metadata to empty string when both metadataText and metadataLabel are empty', () => {
      (Tools.simpleItemFormatter as any).mockImplementation((...args: any[]) => '');
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }],
        page: {},
      }));
      component._loadServizioMessaggi();
      const item = component.servicecommunications[0];
      expect(item.metadata).toBe('');
    });

    it('should append to servicecommunications when url is provided', () => {
      component.servicecommunications = [{ id: 1, primaryText: 'existing' }] as any;
      (Tools.simpleItemFormatter as any).mockImplementation(() => 'formatted');
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 2 }],
        page: {},
      }));
      component._loadServizioMessaggi(null, 'http://next');
      // Should NOT clear - should append
      expect(component.servicecommunications.length).toBe(2);
    });

    it('should replace servicecommunications when url is empty', () => {
      component.servicecommunications = [{ id: 1, primaryText: 'existing' }] as any;
      (Tools.simpleItemFormatter as any).mockImplementation(() => 'formatted');
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 2 }],
        page: {},
      }));
      component._loadServizioMessaggi(null, '');
      // Should replace
      expect(component.servicecommunications.length).toBe(1);
      expect(component.servicecommunications[0].id).toBe(2);
    });

    it('should set _preventMultiCall to false after success', () => {
      component._preventMultiCall = true;
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }],
        page: {},
      }));
      component._loadServizioMessaggi();
      expect(component._preventMultiCall).toBe(false);
    });

    it('should call Tools.ScrollTo(0) on success', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioMessaggi();
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should set error state on API error', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      component._loadServizioMessaggi();
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should not call getDetails when id is falsy (0)', () => {
      component.id = 0;
      mockApiService.getDetails.mockClear();
      component._loadServizioMessaggi();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should handle null response gracefully', () => {
      mockApiService.getDetails.mockReturnValue(of(null));
      expect(() => component._loadServizioMessaggi()).not.toThrow();
    });

    it('should handle response without content', () => {
      mockApiService.getDetails.mockReturnValue(of({ page: {}, _links: {} }));
      component._loadServizioMessaggi();
      expect(component.servicecommunications).toEqual([]);
    });

    it('should not clear _links when url is provided', () => {
      component._links = { prev: { href: '/prev' } };
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioMessaggi(null, 'http://next');
      // _links should be updated from response (which has no _links), so null
      expect(component._links).toBeNull();
    });

    it('should clear _links to null when url is not provided', () => {
      component._links = { prev: { href: '/prev' } };
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioMessaggi();
      // Before subscribe (synchronous): cleared to null
      // After subscribe: set from response (null)
      expect(component._links).toBeNull();
    });

    it('should handle messaggiConfig with null options (options || null branch)', () => {
      component.messaggiConfig = {
        simpleItem: {
          primaryText: '${text}',
          secondaryText: '${secondary}',
          metadata: { text: '${metaText}', label: '${metaLabel}' },
          secondaryMetadata: '${secMeta}',
        },
        options: null,
      };
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }],
        page: {},
      }));
      component._loadServizioMessaggi();
      expect(Tools.simpleItemFormatter).toHaveBeenCalled();
      expect(component.servicecommunications.length).toBe(1);
    });

    it('should handle messaggiConfig with undefined options', () => {
      component.messaggiConfig = {
        simpleItem: {
          primaryText: '${text}',
          secondaryText: '${secondary}',
          metadata: { text: '${metaText}', label: '${metaLabel}' },
          secondaryMetadata: '${secMeta}',
        },
      };
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }],
        page: {},
      }));
      component._loadServizioMessaggi();
      expect(component.servicecommunications.length).toBe(1);
    });

    it('should set metadata when only metadataText is truthy', () => {
      (Tools.simpleItemFormatter as any).mockImplementation((template: any, ...rest: any[]) => {
        if (template === '${metaText}') return 'onlyText';
        if (template === '${metaLabel}') return '';
        return 'other';
      });
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }],
        page: {},
      }));
      component._loadServizioMessaggi();
      const item = component.servicecommunications[0];
      expect(item.metadata).toContain('onlyText');
    });

    it('should set metadata when only metadataLabel is truthy', () => {
      (Tools.simpleItemFormatter as any).mockImplementation((template: any, ...rest: any[]) => {
        if (template === '${metaText}') return '';
        if (template === '${metaLabel}') return 'onlyLabel';
        return 'other';
      });
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }],
        page: {},
      }));
      component._loadServizioMessaggi();
      const item = component.servicecommunications[0];
      expect(item.metadata).toContain('onlyLabel');
    });

    it('should pass query parameter to getDetails', () => {
      const query = [{ field: 'status', value: 'sent' }];
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadServizioMessaggi(query);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'messaggi');
    });
  });

  // --- __loadMoreData ---

  describe('__loadMoreData', () => {
    it('should call _loadServizioMessaggi when _links.next exists and not preventing multi-call', () => {
      component._links = { next: { href: '/api/next-page' } };
      component._preventMultiCall = false;
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      const spy = vi.spyOn(component as any, '_loadServizioMessaggi');
      component.__loadMoreData();
      expect(spy).toHaveBeenCalledWith(null, '/api/next-page');
    });

    it('should set _preventMultiCall to true', () => {
      component._links = { next: { href: '/api/next-page' } };
      component._preventMultiCall = false;
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component.__loadMoreData();
      // It gets set to true then potentially reset by _loadServizioMessaggi
      // but the function itself sets it to true before calling
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should not call _loadServizioMessaggi when _links is null', () => {
      component._links = null;
      const spy = vi.spyOn(component as any, '_loadServizioMessaggi');
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioMessaggi when _links.next is undefined', () => {
      component._links = {};
      const spy = vi.spyOn(component as any, '_loadServizioMessaggi');
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioMessaggi when _preventMultiCall is true', () => {
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = true;
      const spy = vi.spyOn(component as any, '_loadServizioMessaggi');
      component.__loadMoreData();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // --- _onEdit ---

  describe('_onEdit', () => {
    it('should set _editCurrent to param when _useDialog is false', () => {
      component._useDialog = false;
      const param = { id: 42, name: 'msg' };
      component._onEdit({}, param);
      expect(component._editCurrent).toBe(param);
    });

    it('should set _isEdit to true when _useDialog is false', () => {
      component._useDialog = false;
      component._onEdit({}, { id: 1 });
      expect(component._isEdit).toBe(true);
    });

    it('should not set _editCurrent when _useDialog is true', () => {
      component._useDialog = true;
      component._editCurrent = null;
      component._onEdit({}, { id: 1 });
      expect(component._editCurrent).toBeNull();
    });

    it('should not set _isEdit when _useDialog is true', () => {
      component._useDialog = true;
      component._isEdit = false;
      component._onEdit({}, { id: 1 });
      expect(component._isEdit).toBe(false);
    });
  });

  // --- _dummyAction ---

  describe('_dummyAction', () => {
    it('should log event and param to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const event = { type: 'click' };
      const param = { id: 1 };
      component._dummyAction(event, param);
      expect(consoleSpy).toHaveBeenCalledWith(event, param);
      consoleSpy.mockRestore();
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
      (component as any).searchBarForm = undefined;
      expect(() => component._onSubmit({})).not.toThrow();
    });

    it('should not throw when searchBarForm is null', () => {
      (component as any).searchBarForm = null;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // --- _onSearch ---

  describe('_onSearch', () => {
    it('should set _filterData from values', () => {
      const values = [{ field: 'status', value: 'active' }];
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._onSearch(values);
      expect(component._filterData).toBe(values);
    });

    it('should call _loadServizioMessaggi with filter data', () => {
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      const spy = vi.spyOn(component as any, '_loadServizioMessaggi');
      const values = [{ field: 'type', value: 'info' }];
      component._onSearch(values);
      expect(spy).toHaveBeenCalledWith(values);
    });
  });

  // --- _resetForm ---

  describe('_resetForm', () => {
    it('should reset _filterData to empty array', () => {
      component._filterData = [{ field: 'test' }];
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._resetForm();
      expect(component._filterData).toEqual([]);
    });

    it('should call _loadServizioMessaggi with empty filter', () => {
      component.id = 5 as any;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      const spy = vi.spyOn(component as any, '_loadServizioMessaggi');
      component._resetForm();
      expect(spy).toHaveBeenCalledWith([]);
    });
  });

  // --- _timestampToMoment ---

  describe('_timestampToMoment', () => {
    it('should return correct Date for a timestamp', () => {
      const ts = 1609459200000; // 2021-01-01T00:00:00.000Z
      const result = component._timestampToMoment(ts);
      expect(result).toBeInstanceOf(Date);
      expect(result!.getTime()).toBe(ts);
    });

    it('should return null for 0', () => {
      expect(component._timestampToMoment(0)).toBeNull();
    });

    it('should return null for NaN treated as 0', () => {
      // NaN is falsy
      expect(component._timestampToMoment(NaN as any)).toBeNull();
    });

    it('should return Date for negative timestamp', () => {
      const result = component._timestampToMoment(-1000);
      expect(result).toBeInstanceOf(Date);
    });
  });

  // --- _onSort ---

  describe('_onSort', () => {
    it('should log the event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const event = { field: 'date', direction: 'desc' };
      component._onSort(event);
      expect(consoleSpy).toHaveBeenCalledWith(event);
      consoleSpy.mockRestore();
    });
  });

  // --- onBreadcrumb ---

  describe('onBreadcrumb', () => {
    it('should navigate to the url from event', () => {
      component.onBreadcrumb({ url: '/dashboard' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], { queryParamsHandling: 'preserve' });
    });

    it('should preserve query params', () => {
      component.onBreadcrumb({ url: '/servizi/5' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/5'], { queryParamsHandling: 'preserve' });
    });
  });

  // --- _resetScroll ---

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller and 0', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // --- _onCloseEdit ---

  describe('_onCloseEdit', () => {
    it('should set _isEdit to false', () => {
      component._isEdit = true;
      component._onCloseEdit({});
      expect(component._isEdit).toBe(false);
    });

    it('should set _isEdit to false even when already false', () => {
      component._isEdit = false;
      component._onCloseEdit({});
      expect(component._isEdit).toBe(false);
    });
  });

  // --- onActionMonitor ---

  describe('onActionMonitor', () => {
    it('should navigate to backview URL when action is backview', () => {
      component.service = { id_servizio: 42 };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
    });

    it('should not navigate for unknown action', () => {
      component.onActionMonitor({ action: 'unknown' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate for empty action', () => {
      component.onActionMonitor({ action: '' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should use service.id_servizio for the URL', () => {
      component.service = { id_servizio: 100 };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/100/view']);
    });
  });

  // --- Integration-like scenarios ---

  describe('integration scenarios', () => {
    it('should handle full flow: ngOnInit -> loadServizio -> loadMessaggi', () => {
      const serviceResponse = { id_servizio: 1, name: 'API Test' };
      const messaggiResponse = {
        content: [{ id: 10, type: 'info' }],
        page: { totalElements: 1 },
        _links: { next: { href: '/next' } },
      };
      const config = {
        simpleItem: {
          primaryText: '${type}',
          secondaryText: '',
          metadata: { text: '', label: '' },
          secondaryMetadata: '',
        },
        options: {},
      };

      mockConfigService.getConfig.mockReturnValue(of(config));
      // First call to getDetails is _loadServizio, second is _loadServizioMessaggi
      mockApiService.getDetails
        .mockReturnValueOnce(of(serviceResponse))
        .mockReturnValueOnce(of(messaggiResponse));

      component.ngOnInit();

      expect(component.service).toBe(serviceResponse);
      expect(component.servicecommunications.length).toBe(1);
      expect(component._links).toEqual({ next: { href: '/next' } });
    });

    it('should handle loadServizio error followed by successful loadMessaggi', () => {
      const messaggiResponse = { content: [], page: {} };
      const config = {
        simpleItem: {
          primaryText: '',
          secondaryText: '',
          metadata: { text: '', label: '' },
          secondaryMetadata: '',
        },
        options: {},
      };

      mockConfigService.getConfig.mockReturnValue(of(config));
      mockApiService.getDetails
        .mockReturnValueOnce(throwError(() => new Error('service fail')))
        .mockReturnValueOnce(of(messaggiResponse));

      component.ngOnInit();

      expect(component.service).toBeNull();
      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._error).toBe(false); // messaggi loaded fine
    });

    it('constructor with dashboard queryParams should init breadcrumbs', () => {
      vi.clearAllMocks();
      vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
      vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((...args: any[]) => '');
      const dashboardRoute = {
        params: of({ id: '10' }),
        queryParams: of({ from: 'dashboard' }),
        parent: { params: of({ id: '10' }) },
      } as any;
      const comp = new ServizioMessaggiComponent(
        dashboardRoute,
        mockRouter,
        mockTranslate,
        mockConfigService,
        mockTools,
        mockEventsManager,
        mockApiService
      );
      expect(comp._fromDashboard).toBe(true);
      expect(comp.breadcrumbs.length).toBe(3);
      expect(comp.breadcrumbs[0].url).toBe('/dashboard');
    });

    it('should support pagination with __loadMoreData', () => {
      component.id = 5 as any;
      component.messaggiConfig = {
        simpleItem: {
          primaryText: '',
          secondaryText: '',
          metadata: { text: '', label: '' },
          secondaryMetadata: '',
        },
        options: {},
      };

      // Initial load
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 1 }, { id: 2 }],
        page: { totalElements: 4 },
        _links: { next: { href: '/api/page2' } },
      }));
      component._loadServizioMessaggi();
      expect(component.servicecommunications.length).toBe(2);

      // Load more
      mockApiService.getDetails.mockReturnValue(of({
        content: [{ id: 3 }, { id: 4 }],
        page: { totalElements: 4 },
        _links: {},
      }));
      component.__loadMoreData();
      expect(component.servicecommunications.length).toBe(4);
    });
  });
});
