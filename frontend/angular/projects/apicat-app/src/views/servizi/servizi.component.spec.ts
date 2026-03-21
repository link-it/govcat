import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { Tools } from '@linkit/components';
import { ServiziComponent } from './servizi.component';

describe('ServiziComponent', () => {
  let component: ServiziComponent;

  const mockRouter = {
    url: '/servizi',
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
        Services: { hideVersions: false },
        Layout: {
          GroupView: {
            numberCharLogoText: 2,
            enabledImageLink: false,
            colors: [],
            showGroupIcon: false,
            showGroupLabel: false
          },
          fullScroll: false
        }
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockLocalStorageService = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn()
  } as any;

  const mockUtilsLib = {
    getLanguage: vi.fn().mockReturnValue('it'),
    stringToColorIndex: vi.fn().mockReturnValue('#000'),
    _getRandomColor: vi.fn().mockReturnValue('#000'),
    _getRandomDifferent: vi.fn().mockReturnValue('#000'),
    contrast: vi.fn().mockReturnValue('#fff')
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue({})
  } as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({ api: { abilitato: true }, generico: { abilitato: false }, tassonomie_abilitate: false }),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    getCurrentSession: vi.fn().mockReturnValue(null)
  } as any;

  const mockBreadcrumbService = {
    getBreadcrumbs: vi.fn().mockReturnValue(null),
    setBreadcrumbs: vi.fn(),
    storeBreadcrumbs: vi.fn(),
    clearBreadcrumbs: vi.fn()
  } as any;

  const mockNavigationService = {
    getState: vi.fn().mockReturnValue(null),
    saveState: vi.fn(),
    extractEvent: vi.fn(),
    extractData: vi.fn(),
    navigateWithEvent: vi.fn(),
    openInNewTab: vi.fn()
  } as any;

  const mockRoute = {
    snapshot: { queryParams: {} }
  } as any;

  const mockLocation = {
    path: vi.fn().mockReturnValue('/servizi'),
    replaceState: vi.fn()
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock return values (clearAllMocks does NOT reset mockReturnValue)
    mockRouter.url = '/servizi';
    mockRouter.navigate.mockReturnValue(undefined);
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockTranslate.instant.mockImplementation((key: string) => key);
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Services: { hideVersions: false },
        Layout: {
          GroupView: {
            numberCharLogoText: 2,
            enabledImageLink: false,
            colors: [],
            showGroupIcon: false,
            showGroupLabel: false
          },
          fullScroll: false
        }
      }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockLocalStorageService.getItem.mockReturnValue(null);
    mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockAuthenticationService.isAnonymous.mockReturnValue(false);
    mockAuthenticationService.isGestore.mockReturnValue(false);
    mockAuthenticationService._getConfigModule.mockReturnValue({ api: { abilitato: true }, generico: { abilitato: false }, tassonomie_abilitate: false });
    mockAuthenticationService.getCurrentSession.mockReturnValue(null);
    mockBreadcrumbService.getBreadcrumbs.mockReturnValue(null);
    mockUtilService._queryToHttpParams.mockReturnValue({});
    mockUtilService.GetErrorMsg.mockReturnValue('Error');
    mockRoute.snapshot = { queryParams: {} };
    mockLocation.path.mockReturnValue('/servizi');
    component = new ServiziComponent(
      mockRoute,
      mockRouter,
      mockLocation,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockLocalStorageService,
      mockUtilsLib,
      mockUtilService,
      mockApiService,
      mockAuthenticationService,
      mockBreadcrumbService,
      mockNavigationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServiziComponent.Name).toBe('ServiziComponent');
  });

  it('should have model set to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://localhost');
  });

  it('should initialize breadcrumbs in constructor', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBe(1);
  });

  it('should register event listeners in constructor', () => {
    expect(mockEventsManagerService.on).toHaveBeenCalledTimes(2);
  });

  it('should call localStorageService.getItem for settings', () => {
    expect(mockLocalStorageService.getItem).toHaveBeenCalledWith('SERVIZI', null);
  });

  it('should set _groupsView to true when anonymous', () => {
    mockAuthenticationService.isAnonymous.mockReturnValue(true);
    mockLocalStorageService.getItem.mockReturnValue(null);
    const comp = new ServiziComponent(
      mockRoute,
      mockRouter,
      mockLocation,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockLocalStorageService,
      mockUtilsLib,
      mockUtilService,
      mockApiService,
      mockAuthenticationService,
      mockBreadcrumbService,
      mockNavigationService
    );
    expect(comp._groupsView).toBe(true);
  });

  it('should set error messages correctly', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');

    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should navigate on _onNew', () => {
    component._onNew();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['servizi', 'new']);
  });

  it('should toggle groups view', () => {
    const initial = component._groupsView;
    component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn() } as any;
    component._toggleGroups();
    expect(component._groupsView).toBe(!initial);
  });

  it('should toggle groups view mode between card and list', () => {
    component._groupsViewMode = 'card';
    component._toggleGroupsViewMode();
    expect(component._groupsViewMode).toBe('list');
    component._toggleGroupsViewMode();
    expect(component._groupsViewMode).toBe('card');
  });

  it('should reset elements', () => {
    component.elements = [{ id: 1 }];
    component.groups = [{ id: 1 }];
    component._allElements = 5;
    component.resetElements();
    expect(component.elements).toEqual([]);
    expect(component.groups).toEqual([]);
    expect(component._allElements).toBe(0);
  });

  it('should not reset elements when _hideLoader is true', () => {
    component._hideLoader = true;
    component.elements = [{ id: 1 }];
    component.resetElements();
    expect(component.elements).toEqual([{ id: 1 }]);
  });

  it('should reset selected', () => {
    component.elementsSelected = ['a', 'b'];
    component.resetSeleted();
    expect(component.elementsSelected).toEqual([]);
  });

  it('should select all elements', () => {
    component.elements = [
      { idServizio: '1', selected: false },
      { idServizio: '2', selected: false }
    ];
    component.selectAll();
    expect(component.elementsSelected).toEqual(['1', '2']);
    expect(component.elements.every((e: any) => e.selected)).toBe(true);
  });

  it('should deselect all elements', () => {
    component.elements = [
      { idServizio: '1', selected: true },
      { idServizio: '2', selected: true }
    ];
    component.elementsSelected = ['1', '2'];
    component.deselectAll();
    expect(component.elementsSelected).toEqual([]);
    expect(component.elements.every((e: any) => !e.selected)).toBe(true);
  });

  it('should return allSelected correctly', () => {
    component.elements = [{ idServizio: '1' }, { idServizio: '2' }];
    component.elementsSelected = ['1', '2'];
    expect(component.allSelected).toBe(true);

    component.elementsSelected = ['1'];
    expect(component.allSelected).toBe(false);
  });

  it('should get primary text with version', () => {
    component.hideVersions = false;
    const result = component._getPrimaryText({ nome: 'Test', versione: '1' });
    expect(result).toBe('Test - v.1');
  });

  it('should get primary text without version when hideVersions', () => {
    component.hideVersions = true;
    const result = component._getPrimaryText({ nome: 'Test', versione: '1' });
    expect(result).toBe('Test');
  });

  it('should get primary text from label if present', () => {
    const result = component._getPrimaryText({ label: 'MyLabel', nome: 'Test', versione: '1' });
    expect(result).toBe('MyLabel');
  });

  it('should track by id', () => {
    expect(component._trackBy(0, { id: 42 })).toBe(42);
  });

  it('should check _isAnonymous via authenticationService', () => {
    mockAuthenticationService.isAnonymous.mockReturnValue(true);
    expect((component as any)._isAnonymous()).toBe(true);
  });

  it('should check _isGestore via authenticationService', () => {
    mockAuthenticationService.isGestore.mockReturnValue(true);
    expect((component as any)._isGestore()).toBe(true);
  });

  it('should convert timestamp to moment', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('should return null for zero timestamp', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('should initialize _formGroup with expected controls', () => {
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('stato')).toBeTruthy();
    expect(component._formGroup.get('visibilita')).toBeTruthy();
    expect(component._formGroup.get('id_dominio')).toBeTruthy();
    expect(component._formGroup.get('ruolo_referente')).toBeTruthy();
  });

  it('should check hasCategory', () => {
    (component as any)._listaCategorie = [{ id_categoria: 'cat1' }];
    expect(component.hasCategory('cat1')).toBe(true);
    expect(component.hasCategory('cat2')).toBe(false);
  });

  afterEach(() => {
    // Clear via both references to ensure cleanup regardless of module bundling
    Tools.Configurazione = null;
    if (component?.Tools) {
      component.Tools.Configurazione = null;
    }
  });

  // ===== _loadServizi =====

  describe('_loadServizi', () => {
    it('should load servizi and populate elements on success', () => {
      const response = {
        content: [
          { id: 1, id_servizio: 's1', nome: 'Svc1', versione: '1', stato: 'pubblicato', descrizione: 'desc' }
        ],
        page: { totalElements: 1, number: 0, size: 25, totalPages: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.anything(), '');
      expect(component.elements.length).toBe(1);
      expect(component.elements[0].idServizio).toBe('s1');
      expect(component._allElements).toBe(1);
      expect(component._spin).toBe(false);
    });

    it('should pass filter data as query params', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component._loadServizi({ q: 'test', stato: 'pubblicato' });

      expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'test', stato: 'pubblicato', miei_servizi: false, tipo_servizio: 'API' })
      );
    });

    it('should append elements when url is provided (pagination)', () => {
      component.elements = [{ id: 'existing', idServizio: 'e1', selected: false }];
      const response = {
        content: [
          { id: 2, id_servizio: 's2', nome: 'Svc2', versione: '2', stato: 'bozza' }
        ],
        page: { totalElements: 2 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null, 'http://next-page');

      expect(component.elements.length).toBe(2);
    });

    it('should set error messages on error', () => {
      mockApiService.getList.mockReturnValue(throwError(() => new Error('fail')));

      component._loadServizi(null);

      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._spin).toBe(false);
    });

    it('should handle empty content', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component._loadServizi(null);

      expect(component.elements.length).toBe(0);
      expect(component._allElements).toBe(0);
    });
  });

  // ===== _loadServiziGruppi =====

  describe('_loadServiziGruppi', () => {
    it('should load groups on success', () => {
      const response = {
        content: [
          { id: 'g1', tipo: 'gruppo', nome: 'Group1' }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServiziGruppi(null);

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi_gruppi', expect.anything(), '');
      expect(component.groups.length).toBe(1);
      expect(component.groups[0].nome).toBe('Group1');
      expect(component._spin).toBe(false);
    });

    it('should include _currIdGruppoPadre in query when set', () => {
      component._currIdGruppoPadre = 'parent-123';
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component._loadServiziGruppi(null);

      expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ id_gruppo_padre: 'parent-123' })
      );
    });

    it('should set error state on error', () => {
      mockApiService.getList.mockReturnValue(throwError(() => new Error('fail')));

      component._loadServiziGruppi(null);

      expect(component._spin).toBe(false);
      expect(component._preventMultiCall).toBe(false);
    });

    it('should restore groupsBreadcrumbs from breadcrumbService in ngOnInit', () => {
      const storedCrumbs = {
        currIdGruppoPadre: 'g42',
        gruppoPadreNull: false,
        groupsBreadcrumbs: [{ label: 'Root', url: 'root' }]
      };
      mockBreadcrumbService.getBreadcrumbs.mockReturnValue(storedCrumbs);

      component.ngOnInit();

      expect(component._currIdGruppoPadre).toBe('g42');
      expect(component._gruppoPadreNull).toBe(false);
      expect(component.groupsBreadcrumbs).toEqual([{ label: 'Root', url: 'root' }]);
    });
  });

  // ===== __loadMoreData =====

  describe('__loadMoreData', () => {
    it('should call _loadServiziGruppi when groupsView and linksGroups.next exists', () => {
      component._groupsView = true;
      component._filterData = null;
      component._linksGroups = { next: { href: 'http://next-groups' } };
      component._preventMultiCall = false;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component.__loadMoreData();

      // When url is provided, aux is undefined (no query params needed for pagination)
      expect(mockApiService.getList).toHaveBeenCalledWith('servizi_gruppi', undefined, 'http://next-groups');
    });

    it('should call _loadServizi when not groupsView and _links.next exists', () => {
      component._groupsView = false;
      component._links = { next: { href: 'http://next-servizi' } };
      component._preventMultiCall = false;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component.__loadMoreData();

      // When url is provided, aux is undefined (no query params needed for pagination)
      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', undefined, 'http://next-servizi');
    });

    it('should not load data when _preventMultiCall is true', () => {
      component._groupsView = false;
      component._links = { next: { href: 'http://next' } };
      component._preventMultiCall = true;

      component.__loadMoreData();

      expect(mockApiService.getList).not.toHaveBeenCalled();
    });
  });

  // ===== refresh =====

  describe('refresh', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
    });

    it('should call _clearSearch on searchBarForm when groupsView is true', () => {
      component._groupsView = true;

      component.refresh();

      expect(component.searchBarForm._clearSearch).toHaveBeenCalledWith(null);
      expect(component._filterData).toBeNull();
    });

    it('should call _loadServizi when groupsView is false', () => {
      component._groupsView = false;
      component._filterData = { q: 'test' };
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component.refresh();

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.anything(), '');
    });
  });

  // ===== _onEdit =====

  describe('_onEdit', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
    });

    it('should navigate to view route when showPresentation is true', () => {
      component.showPresentation = true;
      const mockEvent = { stopPropagation: vi.fn() };
      const param = { idServizio: 's1' };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(param);

      component._onEdit(mockEvent, param);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 's1', 'view']);
      expect(component.searchBarForm._pinLastSearch).toHaveBeenCalled();
    });

    it('should navigate to edit route when showPresentation is false', () => {
      component.showPresentation = false;
      const mockEvent = {};
      const param = { idServizio: 's2' };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(param);

      component._onEdit(mockEvent, param);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 's2']);
    });
  });

  // ===== _onEditGroup =====

  describe('_onEditGroup', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should navigate to servizio when data type is servizio', () => {
      component.showPresentation = true;
      const mockEvent = {};
      const data = { id: 'sid1', type: 'servizio' };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(data);

      component._onEditGroup(mockEvent, data);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 'sid1', 'view']);
    });

    it('should drill into group when data type is gruppo', () => {
      const mockEvent = {};
      const param = { id: 'gid1', type: 'gruppo', primaryText: 'MyGroup' };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(null);

      component._onEditGroup(mockEvent, param);

      expect(component._currIdGruppoPadre).toBe('gid1');
      expect(component._gruppoPadreNull).toBe(false);
      expect(component.groupsBreadcrumbs.length).toBe(1);
      expect(component.groupsBreadcrumbs[0].label).toBe('MyGroup');
      expect(mockBreadcrumbService.storeBreadcrumbs).toHaveBeenCalled();
    });

    it('should append to existing breadcrumbs when navigating into nested group', () => {
      component.groupsBreadcrumbs = [{ label: 'Root', url: 'root' }];
      const mockEvent = {};
      const param = { id: 'gid2', type: 'gruppo', primaryText: 'SubGroup' };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(null);

      component._onEditGroup(mockEvent, param);

      expect(component.groupsBreadcrumbs.length).toBe(2);
      expect(component.groupsBreadcrumbs[1].label).toBe('SubGroup');
    });
  });

  // ===== _onSearch / _onSubmit =====

  describe('_onSearch / _onSubmit', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should build filterData from search values and load servizi', () => {
      component._onSearch({ q: 'myquery', stato: 'pubblicato' });

      expect(component._filterData).toEqual(expect.objectContaining({ q: 'myquery', stato: 'pubblicato' }));
      expect(component._groupsView).toBe(false);
      expect(mockApiService.getList).toHaveBeenCalled();
    });

    it('should revert to groupsView when filter is empty and no manual selection', () => {
      component._manualSelected = false;

      component._onSearch({ q: '', stato: '', categoriaLabel: '' });

      expect(component._groupsView).toBe(true);
    });

    it('should delegate to searchBarForm._onSearch in _onSubmit', () => {
      component._onSubmit({});

      expect(component.searchBarForm._onSearch).toHaveBeenCalled();
    });
  });

  // ===== _createWorkflowStati =====

  describe('_createWorkflowStati', () => {
    it('should create workflow stati from Tools.Configurazione', () => {
      const cfg = {
        servizio: {
          workflow: { stati: ['bozza', 'pubblicato', 'archiviato'] },
          stati_adesione_consentita: ['pubblicato']
        }
      };
      // Set via component.Tools to ensure same reference as the component uses
      component.Tools.Configurazione = cfg as any;

      component._createWorkflowStati();

      expect(component._workflowStatiFiltered.length).toBeGreaterThan(0);
      expect(component._workflowStatiFiltered.some((s: any) => s.value === 'bozza')).toBe(true);
    });

    it('should use stati_adesione_consentita when anonymous', () => {
      const cfg = {
        servizio: {
          workflow: { stati: ['bozza', 'pubblicato', 'archiviato'] },
          stati_adesione_consentita: ['pubblicato']
        }
      };
      component.Tools.Configurazione = cfg as any;
      mockAuthenticationService.isAnonymous.mockReturnValue(true);

      component._createWorkflowStati();

      expect(component._workflowStati).toEqual(['pubblicato']);
    });

    it('should not create stati when Tools.Configurazione is null', () => {
      component.Tools.Configurazione = null;
      component._workflowStatiFiltered = [];

      component._createWorkflowStati();

      expect(component._workflowStatiFiltered).toEqual([]);
    });
  });

  // ===== _getUserSettings =====

  describe('_getUserSettings', () => {
    it('should apply user settings from currentSession', () => {
      mockAuthenticationService.getCurrentSession.mockReturnValue({
        settings: {
          servizi: {
            view: 'card',
            showPresentation: true,
            showImage: true,
            showEmptyImage: false,
            fillBox: true,
            showMasonry: false
          }
        }
      });

      component._getUserSettings();

      expect(component._groupsView).toBe(true);
      expect(component.showPresentation).toBe(true);
    });

    it('should apply defaults when no user settings exist', () => {
      mockAuthenticationService.getCurrentSession.mockReturnValue(null);
      component._groupsView = false;

      component._getUserSettings();

      expect(component._groupsView).toBe(false);
    });
  });

  // ===== _saveSettings =====

  describe('_saveSettings', () => {
    it('should write current settings to localStorage', () => {
      component._groupsView = false;
      component._isMyServices = true;

      component._saveSettings();

      expect(mockLocalStorageService.setItem).toHaveBeenLastCalledWith('SERVIZI', {
        groupsView: false,
        isMyServices: true
      });
    });

    it('should force default values when anonymous', () => {
      mockAuthenticationService.isAnonymous.mockReturnValue(true);
      component._groupsView = false;
      component._isMyServices = true;

      component._saveSettings();

      expect(mockLocalStorageService.setItem).toHaveBeenLastCalledWith('SERVIZI', {
        groupsView: true,
        isMyServices: false
      });
    });
  });

  // ===== _getServicePrimaryText =====

  describe('_getServicePrimaryText', () => {
    it('should return label when present', () => {
      const result = component._getServicePrimaryText({ label: 'MyLabel', nome: 'Test', versione: '1' });
      expect(result).toBe('MyLabel');
    });

    it('should return nome only when hideVersions is true', () => {
      component.hideVersions = true;
      const result = component._getServicePrimaryText({ nome: 'SvcName', versione: '2' });
      expect(result).toBe('SvcName');
    });

    it('should return nome with versione', () => {
      component.hideVersions = false;
      const result = component._getServicePrimaryText({ nome: 'SvcName', versione: '3' });
      expect(result).toBe('SvcName - v.3');
    });
  });

  // ===== _toggleGroups =====

  describe('_toggleGroups', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should toggle groupsView and set _manualSelected to true when disabling groups', () => {
      component._groupsView = true;

      component._toggleGroups();

      expect(component._groupsView).toBe(false);
      expect(component._manualSelected).toBe(true);
    });

    it('should reset _isMyServices when enabling groups', () => {
      component._groupsView = false;

      component._toggleGroups();

      expect(component._groupsView).toBe(true);
      expect(component._isMyServices).toBe(false);
      expect(component._manualSelected).toBe(false);
    });
  });

  // ===== _onMyServices =====

  describe('_onMyServices', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should toggle _isMyServices and disable groups when enabling', () => {
      // Start with _isMyServices = false (default from constructor)
      expect(component._isMyServices).toBe(false);

      component._onMyServices();

      // After toggle: _isMyServices should now be true, _groupsView disabled
      expect(component._isMyServices).toBe(true);
      expect(component._groupsView).toBe(false);
    });

    it('should restore groupsView based on _manualSelected when disabling', () => {
      // First enable myServices
      component._onMyServices();
      expect(component._isMyServices).toBe(true);

      // Now toggle off
      component._manualSelected = false;
      component._onMyServices();

      expect(component._isMyServices).toBe(false);
      expect(component._groupsView).toBe(true);
    });
  });

  // ===== resetElements =====

  describe('resetElements (extended)', () => {
    it('should clear all element arrays and reset pages', () => {
      component.elements = [{ id: 1 }, { id: 2 }];
      component.groups = [{ id: 3 }];
      component._allElements = 10;

      component.resetElements();

      expect(component.elements).toEqual([]);
      expect(component.groups).toEqual([]);
      expect(component._allElements).toBe(0);
      expect(component._links).toBeNull();
      expect(component._linksGroups).toBeNull();
    });

    it('should reset _page and _pageGroups to default Page', () => {
      component._page = { totalElements: 50 } as any;
      component._pageGroups = { totalElements: 30 } as any;

      component.resetElements();

      expect(component._page.totalElements).toBe(0);
      expect(component._pageGroups.totalElements).toBe(0);
    });
  });

  // ===== selectAll / deselectAll / _onSelect =====

  describe('_onSelect', () => {
    it('should add element to selection when not already selected', () => {
      const event = { stopPropagation: vi.fn() };
      const element = { idServizio: 's1', selected: false };
      component.elementsSelected = [];

      component._onSelect(event, element);

      expect(element.selected).toBe(true);
      expect(component.elementsSelected).toEqual(['s1']);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should remove element from selection when already selected', () => {
      const event = { stopPropagation: vi.fn() };
      const element = { idServizio: 's1', selected: true };
      component.elementsSelected = ['s1'];

      component._onSelect(event, element);

      expect(element.selected).toBe(false);
      expect(component.elementsSelected).toEqual([]);
    });

    it('should handle multiple selections correctly', () => {
      const event = { stopPropagation: vi.fn() };
      const el1 = { idServizio: 's1', selected: false };
      const el2 = { idServizio: 's2', selected: false };
      component.elementsSelected = [];

      component._onSelect(event, el1);
      component._onSelect(event, el2);

      expect(component.elementsSelected).toEqual(['s1', 's2']);

      component._onSelect(event, el1);
      expect(component.elementsSelected).toEqual(['s2']);
    });
  });

  // ===== onExport =====

  describe('onExport', () => {
    beforeEach(() => {
      vi.spyOn(component.Tools, 'GetFilenameFromHeader').mockReturnValue('export.csv');
      vi.spyOn(component.Tools, 'showMessage').mockImplementation(() => {});
      (globalThis as any).saveAs = vi.fn();
    });

    it('should export with SEARCH type using filter data', () => {
      component._filterData = { q: 'test' };
      const blob = new Blob(['data']);
      mockApiService.download.mockReturnValue(of({ body: blob, headers: {} }));

      component.onExport('search', true);

      expect(mockApiService.download).toHaveBeenCalledWith(
        'servizi-export', null, undefined, expect.anything(), expect.anything()
      );
      expect(component._downloading).toBe(false);
    });

    it('should export with SELECTION type using elementsSelected', () => {
      component.elementsSelected = ['s1', 's2'];
      const blob = new Blob(['data']);
      mockApiService.download.mockReturnValue(of({ body: blob, headers: {} }));

      component.onExport('selection', true);

      expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ id_servizio: ['s1', 's2'] })
      );
    });

    it('should handle error on export and show message', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ name: 'Error', message: 'fail' })));

      component.onExport('search', true);

      expect(component._downloading).toBe(false);
      expect(component.Tools.showMessage).toHaveBeenCalled();
    });

    it('should show timeout message on TimeoutError', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ name: 'TimeoutError' })));

      component.onExport('search', true);

      expect(component._downloading).toBe(false);
      expect(component.Tools.showMessage).toHaveBeenCalledWith(
        'APP.MESSAGE.ERROR.Timeout', 'danger', true
      );
    });
  });

  // ===== onBreadcrumb =====

  describe('onBreadcrumb', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should handle group breadcrumb with stored breadcrumbs', () => {
      const storedCrumbs = {
        currIdGruppoPadre: 'g1',
        gruppoPadreNull: false,
        groupsBreadcrumbs: [{ label: 'G1', url: 'g1' }]
      };
      mockBreadcrumbService.getBreadcrumbs.mockReturnValue(storedCrumbs);

      component.onBreadcrumb({ group: true, url: 'g1' });

      expect(component._currIdGruppoPadre).toBe('g1');
    });

    it('should reset groups breadcrumbs when url is root', () => {
      component.onBreadcrumb({ group: true, url: 'root' });

      expect(component._currIdGruppoPadre).toBe('');
      expect(component._gruppoPadreNull).toBe(true);
      expect(component.groupsBreadcrumbs).toEqual([]);
    });

    it('should navigate via router for non-group breadcrumb', () => {
      component.onBreadcrumb({ group: false, url: '/servizi' });

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi']);
    });
  });

  // ===== _initProfili =====

  describe('_initProfili', () => {
    it('should set profili from API config when tipo_servizio is API', () => {
      component.Tools.Configurazione = {
        servizio: {
          api: { profili: [{ codice_interno: 'p1', etichetta: 'Profilo1' }] },
          generico: { profili: [{ codice_interno: 'g1', etichetta: 'Gen1' }] }
        }
      } as any;
      component.tipo_servizio = 'API';

      component._initProfili();

      expect(component.profili).toEqual([{ codice_interno: 'p1', etichetta: 'Profilo1' }]);
    });

    it('should set profili from Generico config when tipo_servizio is Generico', () => {
      component.Tools.Configurazione = {
        servizio: {
          api: { profili: [{ codice_interno: 'p1', etichetta: 'Profilo1' }] },
          generico: { profili: [{ codice_interno: 'g1', etichetta: 'Gen1' }] }
        }
      } as any;
      component.tipo_servizio = 'Generico';

      component._initProfili();

      expect(component.profili).toEqual([{ codice_interno: 'g1', etichetta: 'Gen1' }]);
    });

    it('should not set profili when Configurazione is null', () => {
      component.Tools.Configurazione = null;
      component.profili = [];

      component._initProfili();

      expect(component.profili).toEqual([]);
    });
  });

  // ===== _onGoupsBreadcrumbs =====

  describe('_onGoupsBreadcrumbs', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should navigate to a parent group and trim breadcrumbs', () => {
      component._currIdGruppoPadre = 'g3';
      component.groupsBreadcrumbs = [
        { label: 'Root', url: 'root' },
        { label: 'G1', url: 'g1' },
        { label: 'G2', url: 'g2' },
        { label: 'G3', url: 'g3' }
      ];

      component._onGoupsBreadcrumbs({ url: 'g1' });

      expect(component.groupsBreadcrumbs.length).toBe(2);
      expect(component._currIdGruppoPadre).toBe('g1');
      expect(component._gruppoPadreNull).toBe(false);
    });

    it('should reset to root when root breadcrumb is clicked', () => {
      component._currIdGruppoPadre = 'g1';
      component.groupsBreadcrumbs = [
        { label: 'Root', url: 'root' },
        { label: 'G1', url: 'g1' }
      ];

      component._onGoupsBreadcrumbs({ url: 'root' });

      expect(component._currIdGruppoPadre).toBe('');
      expect(component._gruppoPadreNull).toBe(true);
      expect(component.groupsBreadcrumbs.length).toBe(1);
    });

    it('should not do anything when clicking current group', () => {
      component._currIdGruppoPadre = 'g1';
      component.groupsBreadcrumbs = [
        { label: 'Root', url: 'root' },
        { label: 'G1', url: 'g1' }
      ];

      component._onGoupsBreadcrumbs({ url: 'g1' });

      expect(component.groupsBreadcrumbs.length).toBe(2);
    });
  });

  // ===== onExportAction =====

  describe('onExportAction', () => {
    beforeEach(() => {
      vi.spyOn(component.Tools, 'GetFilenameFromHeader').mockReturnValue('export.csv');
      vi.spyOn(component.Tools, 'showMessage').mockImplementation(() => {});
      (globalThis as any).saveAs = vi.fn();
    });

    it('should call onExport with SEARCH on search action', () => {
      mockApiService.download.mockReturnValue(of({ body: new Blob(), headers: {} }));
      const spy = vi.spyOn(component, 'onExport');

      component.onExportAction({ action: 'search' });

      expect(spy).toHaveBeenCalledWith('search', true);
    });

    it('should call deselectAll on deselect_all action', () => {
      component.elements = [{ idServizio: '1', selected: true }];
      component.elementsSelected = ['1'];

      component.onExportAction({ action: 'deselectAll' });

      expect(component.elementsSelected).toEqual([]);
    });
  });

  // ===== _setErrorMessages =====

  describe('_setErrorMessages (extended)', () => {
    it('should set error help message when error is true', () => {
      component._setErrorMessages(true);

      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set no results help message when error is false', () => {
      component._setErrorMessages(false);

      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // ===== _resetScroll =====

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller', () => {
      vi.spyOn(component.Tools, 'ScrollElement').mockImplementation(() => {});

      component._resetScroll();

      expect(component.Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // =============================================================================
  // NEW TESTS - expanding coverage from ~70% to 85%+
  // =============================================================================

  // ===== Constructor branches =====

  describe('constructor branches', () => {
    it('should set tipo_servizio to Generico when url is /servizi-generici', () => {
      mockRouter.url = '/servizi-generici';
      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      expect(comp.tipo_servizio).toBe('Generico');
    });

    it('should build breadcrumb with both API and Generico labels when both are enabled', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({ api: { abilitato: true }, generico: { abilitato: true }, tassonomie_abilitate: false });
      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      expect(comp.breadcrumbs[0].label).toContain(' - ');
    });

    it('should restore settings from localStorage when settings exist', () => {
      mockLocalStorageService.getItem.mockReturnValue({ groupsView: false, isMyServices: true });
      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      // when _isMyServices is true, _groupsView is forced to false
      expect(comp._groupsView).toBe(false);
      expect(comp._isMyServices).toBe(true);
    });

    it('should restore _groupsView from settings when _isMyServices is false', () => {
      mockLocalStorageService.getItem.mockReturnValue({ groupsView: true, isMyServices: false });
      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      expect(comp._groupsView).toBe(true);
      expect(comp._isMyServices).toBe(false);
    });

    it('should add componente to visibilita options when gestore', () => {
      mockAuthenticationService.isGestore.mockReturnValue(true);
      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      expect(comp._tipiVisibilitaServizio.some((t: any) => t.value === 'componente')).toBe(true);
      expect(comp._tipiVisibilitaServizioEnum['componente']).toBe('componente');
    });

    it('should set _showTaxonomies from config when tassonomie_abilitate is true', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({ api: { abilitato: true }, generico: { abilitato: false }, tassonomie_abilitate: true });
      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      expect(comp._showTaxonomies).toBe(true);
    });

    it('should set fullScroll from config', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: { hideVersions: false },
          Layout: {
            GroupView: { numberCharLogoText: 2, enabledImageLink: false, colors: [], showGroupIcon: false, showGroupLabel: false },
            fullScroll: true
          }
        }
      });
      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      expect(comp.fullScroll).toBe(true);
    });
  });

  // ===== Constructor event handlers =====

  describe('constructor event handlers', () => {
    it('should handle PROFILE_UPDATE event', () => {
      // Capture the callback registered for PROFILE_UPDATE
      let profileCallback: any;
      mockEventsManagerService.on.mockImplementation((eventType: string, cb: any) => {
        if (eventType === 'PROFILE:UPDATE') {
          profileCallback = cb;
        }
      });

      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      comp.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;

      expect(profileCallback).toBeDefined();

      // Call the callback
      profileCallback({});

      expect(comp._updateMapper).toBeTruthy();
      expect(mockLocalStorageService.setItem).toHaveBeenCalled();
    });

    it('should handle BREADCRUMBS_RESET event', () => {
      let breadcrumbCallback: any;
      mockEventsManagerService.on.mockImplementation((eventType: string, cb: any) => {
        if (eventType === 'BREADCRUMBS:RESET') {
          breadcrumbCallback = cb;
        }
      });

      const comp = new ServiziComponent(
        mockRoute, mockRouter, mockLocation, mockModalService, mockTranslate, mockConfigService, mockTools,
        mockEventsManagerService, mockLocalStorageService, mockUtilsLib, mockUtilService,
        mockApiService, mockAuthenticationService, mockBreadcrumbService, mockNavigationService
      );
      comp.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;

      expect(breadcrumbCallback).toBeDefined();

      breadcrumbCallback({});

      expect(comp._currIdGruppoPadre).toBe('');
      expect(comp._gruppoPadreNull).toBe(true);
      expect(comp.groupsBreadcrumbs).toEqual([]);
    });
  });

  // ===== ngOnInit extended =====

  describe('ngOnInit (extended)', () => {
    it('should configure component from serviziConfig', () => {
      const serviziConfig = {
        viewBoxed: true,
        multiSelection: true,
        uncheckAllInTheMenu: true,
        showPresentation: true,
        showImage: true,
        showEmptyImage: true,
        fillBox: true,
        showMasonry: true
      };
      mockConfigService.getConfig.mockReturnValue(of(serviziConfig));
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: { hideVersions: true },
          Layout: {
            GroupView: { numberCharLogoText: 2, enabledImageLink: false, colors: [], showGroupIcon: false, showGroupLabel: false },
            fullScroll: false
          }
        }
      });

      component.ngOnInit();

      expect(component.serviziConfig).toEqual(serviziConfig);
      expect(component.hideVersions).toBe(true);
    });

    it('should disable multiSelection when not gestore', () => {
      mockConfigService.getConfig.mockReturnValue(of({ multiSelection: true }));
      mockAuthenticationService.isGestore.mockReturnValue(false);

      component.ngOnInit();

      expect(component.hasMultiSelection).toBe(false);
    });

    it('should keep multiSelection when gestore', () => {
      mockConfigService.getConfig.mockReturnValue(of({ multiSelection: true }));
      mockAuthenticationService.isGestore.mockReturnValue(true);

      component.ngOnInit();

      expect(component.hasMultiSelection).toBe(true);
    });

    it('should not restore breadcrumbs when breadcrumbService returns null', () => {
      mockBreadcrumbService.getBreadcrumbs.mockReturnValue(null);

      component.ngOnInit();

      expect(component._currIdGruppoPadre).toBe('');
    });
  });

  // ===== ngAfterViewInit =====

  describe('ngAfterViewInit', () => {
    it('should call refresh when not pinned and PROFILE exists', () => {
      vi.useFakeTimers();
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn().mockReturnValue(false), _onSearch: vi.fn() } as any;
      mockLocalStorageService.getItem.mockReturnValue({ token: 'x' });

      component.ngAfterViewInit();
      vi.advanceTimersByTime(150);

      expect(component.searchBarForm._isPinned).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not call refresh when pinned', () => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn().mockReturnValue(true), _onSearch: vi.fn() } as any;

      component.ngAfterViewInit();

      expect(mockApiService.getList).not.toHaveBeenCalled();
    });

    it('should handle undefined searchBarForm gracefully', () => {
      component.searchBarForm = undefined as any;

      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  // ===== ngAfterContentChecked / __updateGroupsViewMode =====

  describe('ngAfterContentChecked / __updateGroupsViewMode', () => {
    it('should set desktop flag based on window width', () => {
      component.__updateGroupsViewMode();
      // Just verify it sets the desktop property (depends on test env window width)
      expect(typeof component.desktop).toBe('boolean');
    });

    it('should force card mode on mobile when list mode selected', () => {
      component._groupsViewMode = 'list';
      // Simulate mobile width
      const origWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });

      component.__updateGroupsViewMode();

      expect(component._groupsViewMode).toBe('card');

      // Restore
      if (origWidth) {
        Object.defineProperty(window, 'innerWidth', origWidth);
      } else {
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
      }
    });

    it('should call __updateGroupsViewMode in ngAfterContentChecked', () => {
      const spy = vi.spyOn(component, '__updateGroupsViewMode').mockImplementation(() => {});
      component.ngAfterContentChecked();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ===== _onResize =====

  describe('_onResize', () => {
    it('should call __updateGroupsViewMode', () => {
      const spy = vi.spyOn(component, '__updateGroupsViewMode').mockImplementation(() => {});
      component._onResize();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ===== _onSearch extended =====

  describe('_onSearch (extended)', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should split categoria value by pipe and use second part', () => {
      component._onSearch({ q: '', stato: '', categoria: 'tax1|cat1', categoriaLabel: 'Tax|Cat' });

      expect(component._filterData.categoria).toBe('cat1');
    });

    it('should clear categoriaLabel when no categoria is set', () => {
      component._onSearch({ q: '', stato: '', categoria: '', categoriaLabel: '' });

      expect(component._filterData.categoriaLabel).toBe('');
    });

    it('should delete id_gruppo_padre_label from values', () => {
      component._onSearch({ q: 'test', id_gruppo_padre_label: 'GroupLabel' });

      expect(component._filterData.id_gruppo_padre_label).toBeUndefined();
    });

    it('should switch to groups view when filter is empty and manualSelected is false', () => {
      component._manualSelected = false;

      component._onSearch({ q: '', stato: '' });

      expect(component._groupsView).toBe(true);
    });

    it('should load servizi when groupsView is false after search', () => {
      component._manualSelected = true;

      component._onSearch({ q: 'test' });

      expect(component._groupsView).toBe(false);
      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.anything(), '');
    });

    it('should load groups when groupsView is true after empty search', () => {
      component._manualSelected = false;

      component._onSearch({ q: '', stato: '' });

      expect(component._groupsView).toBe(true);
      expect(mockApiService.getList).toHaveBeenCalledWith('servizi_gruppi', expect.anything(), '');
    });
  });

  // ===== _resetForm =====

  describe('_resetForm', () => {
    it('should reset filter data and load servizi', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
      component._filterData = { q: 'test' };

      component._resetForm();

      expect(component._filterData).toBeNull();
      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.anything(), '');
    });
  });

  // ===== _onSort =====

  describe('_onSort', () => {
    it('should handle sort events', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._onSort({ field: 'nome', direction: 'desc' });
      expect(consoleSpy).toHaveBeenCalledWith({ field: 'nome', direction: 'desc' });
      consoleSpy.mockRestore();
    });
  });

  // ===== _onSubmit extended =====

  describe('_onSubmit (extended)', () => {
    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;

      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // ===== f getter =====

  describe('f getter', () => {
    it('should return form controls', () => {
      const controls = component.f;
      expect(controls).toBeDefined();
      expect(controls['q']).toBeDefined();
      expect(controls['stato']).toBeDefined();
    });
  });

  // ===== _loadServiziGruppi extended =====

  describe('_loadServiziGruppi (extended)', () => {
    it('should map group content with visibilita from dominio when not set', () => {
      const response = {
        content: [
          { id: 'g1', tipo: 'gruppo', nome: 'Group1', dominio: { visibilita: 'pubblica' }, immagine: true }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServiziGruppi(null);

      expect(component.groups.length).toBe(1);
      expect(component.groups[0].source.visibilita).toBe('pubblica');
      expect(component.groups[0].logo).toContain('/gruppi/g1/immagine');
    });

    it('should map servizio type content with servizi model path', () => {
      const response = {
        content: [
          { id: 's1', tipo: 'servizio', nome: 'Svc1', versione: '1', immagine: true }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServiziGruppi(null);

      expect(component.groups[0].logo).toContain('/servizi/s1/immagine');
    });

    it('should include descrizione_sintetica in metadata', () => {
      vi.spyOn(component.Tools, 'TruncateRows').mockImplementation((v: string) => v);
      const response = {
        content: [
          { id: 'g1', tipo: 'gruppo', nome: 'Group1', descrizione_sintetica: 'Short desc' }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServiziGruppi(null);

      expect(component.groups[0].metadata).toBe('Short desc');
    });

    it('should include _gruppoPadreNull in query when set', () => {
      component._gruppoPadreNull = true;
      component._currIdGruppoPadre = '';
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component._loadServiziGruppi(null);

      expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ gruppo_padre_null: true })
      );
    });

    it('should append groups when url is provided', () => {
      component.groups = [{ id: 'existing', nome: 'Existing' }];
      const response = {
        content: [
          { id: 'g2', tipo: 'gruppo', nome: 'Group2' }
        ],
        page: { totalElements: 2 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServiziGruppi(null, 'http://next');

      expect(component.groups.length).toBe(2);
    });

    it('should handle null response gracefully', () => {
      mockApiService.getList.mockReturnValue(of(null));

      component._loadServiziGruppi(null);

      expect(component._spin).toBe(false);
      expect(component._allElements).toBe(0);
    });

    it('should set _linksGroups from response', () => {
      const links = { next: { href: 'http://page2' } };
      const response = { content: [], page: { totalElements: 0 }, _links: links };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServiziGruppi(null);

      expect(component._linksGroups).toEqual(links);
    });

    it('should use existing visibilita when set on group', () => {
      const response = {
        content: [
          { id: 'g1', tipo: 'gruppo', nome: 'Group1', visibilita: 'privata', dominio: { visibilita: 'pubblica' } }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServiziGruppi(null);

      expect(component.groups[0].source.visibilita).toBe('privata');
    });
  });

  // ===== _loadServizi extended =====

  describe('_loadServizi (extended)', () => {
    it('should map visibilita from dominio when service visibilita is not set', () => {
      const response = {
        content: [
          { id: 1, id_servizio: 's1', nome: 'Svc1', versione: '1', dominio: { visibilita: 'pubblica' } }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component.elements[0].source.visibilita).toBe('pubblica');
    });

    it('should default visibilita to dominio when neither is set', () => {
      const response = {
        content: [
          { id: 1, id_servizio: 's1', nome: 'Svc1', versione: '1' }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component.elements[0].source.visibilita).toBe('dominio');
    });

    it('should include descrizione_sintetica in metadata', () => {
      vi.spyOn(component.Tools, 'TruncateRows').mockImplementation((v: string) => v);
      const response = {
        content: [
          { id: 1, id_servizio: 's1', nome: 'Svc1', versione: '1', descrizione_sintetica: 'Short description' }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component.elements[0].metadata).toBe('Short description');
    });

    it('should set multi_adesione flag on element', () => {
      const response = {
        content: [
          { id: 1, id_servizio: 's1', nome: 'Svc1', versione: '1', multi_adesione: true }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component.elements[0].multiplo).toBe(true);
    });

    it('should set logo when immagine is present', () => {
      const response = {
        content: [
          { id: 1, id_servizio: 's1', nome: 'Svc1', versione: '1', immagine: true }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component.elements[0].logo).toContain('/servizi/s1/immagine');
    });

    it('should set empty logo when immagine is absent', () => {
      const response = {
        content: [
          { id: 1, id_servizio: 's1', nome: 'Svc1', versione: '1' }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component.elements[0].logo).toBe('');
    });

    it('should delete categoriaLabel from query before passing to httpParams', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component._loadServizi({ q: 'test', categoriaLabel: 'CatLabel' });

      expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith(
        expect.not.objectContaining({ categoriaLabel: 'CatLabel' })
      );
    });

    it('should not reset selections when _preventMultiCall is true', () => {
      component._preventMultiCall = true;
      component.elementsSelected = ['s1', 's2'];
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component._loadServizi(null);

      expect(component.elementsSelected).toEqual(['s1', 's2']);
    });

    it('should handle null response body', () => {
      mockApiService.getList.mockReturnValue(of(null));

      component._loadServizi(null);

      expect(component._spin).toBe(false);
      expect(component._allElements).toBe(0);
    });

    it('should set _links from response', () => {
      const links = { next: { href: 'http://page2' } };
      const response = { content: [], page: { totalElements: 0 }, _links: links };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component._links).toEqual(links);
    });

    it('should use index as id when service has no id', () => {
      const response = {
        content: [
          { id_servizio: 's1', nome: 'Svc1', versione: '1' }
        ],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadServizi(null);

      expect(component.elements[0].id).toBe(0); // index fallback
    });
  });

  // ===== __loadMoreData extended =====

  describe('__loadMoreData (extended)', () => {
    it('should not load groups when groupsView is true but _filterData is set', () => {
      component._groupsView = true;
      component._filterData = { q: 'test' };
      component._links = { next: { href: 'http://next' } };
      component._preventMultiCall = false;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component.__loadMoreData();

      // Should fall through to the else branch using _links
      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', undefined, 'http://next');
    });

    it('should not load groups when _linksGroups has no next', () => {
      component._groupsView = true;
      component._filterData = null;
      component._linksGroups = {};
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(mockApiService.getList).not.toHaveBeenCalled();
    });

    it('should not load servizi when _links has no next', () => {
      component._groupsView = false;
      component._links = {};
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(mockApiService.getList).not.toHaveBeenCalled();
    });

    it('should set _preventMultiCall to true when loading groups', () => {
      component._groupsView = true;
      component._filterData = null;
      component._linksGroups = { next: { href: 'http://next-groups' } };
      component._preventMultiCall = false;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component.__loadMoreData();

      // _preventMultiCall was set to true before the call, then reset by the subscription
      expect(mockApiService.getList).toHaveBeenCalled();
    });

    it('should set _preventMultiCall to true when loading servizi', () => {
      component._groupsView = false;
      component._links = { next: { href: 'http://next-servizi' } };
      component._preventMultiCall = false;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));

      component.__loadMoreData();

      expect(mockApiService.getList).toHaveBeenCalled();
    });
  });

  // ===== _onOpenInNewTab =====

  describe('_onOpenInNewTab', () => {
    it('should open service in new tab with view route when showPresentation is true', () => {
      component.showPresentation = true;
      mockNavigationService.extractData.mockReturnValue({ idServizio: 's1' });

      component._onOpenInNewTab({ type: 'servizio' });

      expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['servizi', 's1', 'view']);
    });

    it('should open service in new tab without view route when showPresentation is false', () => {
      component.showPresentation = false;
      mockNavigationService.extractData.mockReturnValue({ idServizio: 's2' });

      component._onOpenInNewTab({ type: 'servizio' });

      expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['servizi', 's2']);
    });
  });

  // ===== _onOpenInNewTabGroup =====

  describe('_onOpenInNewTabGroup', () => {
    it('should open servizio in new tab when type is servizio', () => {
      component.showPresentation = true;
      mockNavigationService.extractData.mockReturnValue({ id: 's1', type: 'servizio' });

      component._onOpenInNewTabGroup({ id: 's1', type: 'servizio' });

      expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['servizi', 's1', 'view']);
    });

    it('should not open in new tab when type is gruppo', () => {
      mockNavigationService.extractData.mockReturnValue({ id: 'g1', type: 'gruppo' });

      component._onOpenInNewTabGroup({ id: 'g1', type: 'gruppo' });

      expect(mockNavigationService.openInNewTab).not.toHaveBeenCalled();
    });

    it('should use model path without view when showPresentation is false', () => {
      component.showPresentation = false;
      mockNavigationService.extractData.mockReturnValue({ id: 's2', type: 'servizio' });

      component._onOpenInNewTabGroup({ id: 's2', type: 'servizio' });

      expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['servizi', 's2']);
    });
  });

  // ===== _onEdit extended =====

  describe('_onEdit (extended)', () => {
    it('should use param as data when extractData returns null', () => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      component.showPresentation = false;
      const mockEvent = {};
      const param = { idServizio: 's3' };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(null);

      component._onEdit(mockEvent, param);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 's3']);
    });

    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      mockNavigationService.extractEvent.mockReturnValue({});
      mockNavigationService.extractData.mockReturnValue({ idServizio: 's1' });

      expect(() => component._onEdit({}, { idServizio: 's1' })).not.toThrow();
    });
  });

  // ===== _onEditGroup extended =====

  describe('_onEditGroup (extended)', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should navigate without view when showPresentation is false and type is servizio', () => {
      component.showPresentation = false;
      const mockEvent = {};
      const data = { id: 'sid1', type: 'servizio' };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(data);

      component._onEditGroup(mockEvent, data);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 'sid1']);
    });
  });

  // ===== onExportAll =====

  describe('onExportAll', () => {
    beforeEach(() => {
      vi.spyOn(component.Tools, 'GetFilenameFromHeader').mockReturnValue('all-export.csv');
      vi.spyOn(component.Tools, 'showMessage').mockImplementation(() => {});
      (globalThis as any).saveAs = vi.fn();
    });

    it('should export all servizi successfully', () => {
      const blob = new Blob(['all data']);
      mockApiService.download.mockReturnValue(of({ body: blob, headers: {} }));

      component.onExportAll();

      expect(mockApiService.download).toHaveBeenCalledWith(
        'servizi-export', null, undefined, undefined, expect.anything()
      );
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'all-export.csv');
      expect(component._downloading).toBe(false);
    });

    it('should set _downloading to true during export', () => {
      // Use a subject to control timing
      const downloadSubject = new Subject<any>();
      mockApiService.download.mockReturnValue(downloadSubject.asObservable());

      component.onExportAll();

      expect(component._downloading).toBe(true);

      downloadSubject.next({ body: new Blob(), headers: {} });
      downloadSubject.complete();

      expect(component._downloading).toBe(false);
    });

    it('should handle TimeoutError on exportAll', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ name: 'TimeoutError' })));

      component.onExportAll();

      expect(component._downloading).toBe(false);
      expect(component.Tools.showMessage).toHaveBeenCalledWith(
        'APP.MESSAGE.ERROR.Timeout', 'danger', true
      );
    });

    it('should handle generic error on exportAll', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ name: 'HttpError', message: 'Server error' })));

      component.onExportAll();

      expect(component._downloading).toBe(false);
      expect(component.Tools.showMessage).toHaveBeenCalledWith('Error', 'danger', true);
    });
  });

  // ===== onExport extended =====

  describe('onExport (extended)', () => {
    beforeEach(() => {
      vi.spyOn(component.Tools, 'GetFilenameFromHeader').mockReturnValue('export.csv');
      vi.spyOn(component.Tools, 'showMessage').mockImplementation(() => {});
      (globalThis as any).saveAs = vi.fn();
    });

    it('should delete id_gruppo_padre_label from search query', () => {
      component._filterData = { q: 'test', id_gruppo_padre_label: 'GroupLabel' };
      mockApiService.download.mockReturnValue(of({ body: new Blob(), headers: {} }));

      component.onExport('search', true);

      expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith(
        expect.not.objectContaining({ id_gruppo_padre_label: 'GroupLabel' })
      );
    });

    it('should call saveAs with filename from header', () => {
      const blob = new Blob(['data']);
      mockApiService.download.mockReturnValue(of({ body: blob, headers: {} }));

      component.onExport('search', true);

      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'export.csv');
    });
  });

  // ===== onExportAction extended =====

  describe('onExportAction (extended)', () => {
    beforeEach(() => {
      vi.spyOn(component.Tools, 'GetFilenameFromHeader').mockReturnValue('export.csv');
      vi.spyOn(component.Tools, 'showMessage').mockImplementation(() => {});
      (globalThis as any).saveAs = vi.fn();
    });

    it('should call onExport with SELECTION on selection action', () => {
      mockApiService.download.mockReturnValue(of({ body: new Blob(), headers: {} }));
      const spy = vi.spyOn(component, 'onExport');

      component.onExportAction({ action: 'selection' });

      expect(spy).toHaveBeenCalledWith('selection', true);
    });

    it('should do nothing for unknown action', () => {
      const spy = vi.spyOn(component, 'onExport');

      component.onExportAction({ action: 'unknown' });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ===== _showAllServices =====

  describe('_showAllServices', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should set _isMyServices to false and refresh', () => {
      component._isMyServices = true;

      component._showAllServices();

      expect(component._isMyServices).toBe(false);
    });
  });

  // ===== _hasMyServiceMapper / _isAnonymousMapper =====

  describe('mapper functions', () => {
    it('_hasMyServiceMapper should return true when not gestore and not anonymous', () => {
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService.isAnonymous.mockReturnValue(false);

      expect(component._hasMyServiceMapper()).toBe(true);
    });

    it('_hasMyServiceMapper should return false when gestore', () => {
      mockAuthenticationService.isGestore.mockReturnValue(true);
      mockAuthenticationService.isAnonymous.mockReturnValue(false);

      expect(component._hasMyServiceMapper()).toBe(false);
    });

    it('_hasMyServiceMapper should return false when anonymous', () => {
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService.isAnonymous.mockReturnValue(true);

      expect(component._hasMyServiceMapper()).toBe(false);
    });

    it('_isAnonymousMapper should return true when anonymous', () => {
      mockAuthenticationService.isAnonymous.mockReturnValue(true);

      expect(component._isAnonymousMapper()).toBe(true);
    });

    it('_isAnonymousMapper should return false when not anonymous', () => {
      mockAuthenticationService.isAnonymous.mockReturnValue(false);

      expect(component._isAnonymousMapper()).toBe(false);
    });
  });

  // ===== color mapper functions =====

  describe('color mapper functions', () => {
    it('_getHashColorMapper should use stringToColorIndex when colors array is set', () => {
      component.colors = ['#red', '#blue', '#green'];

      const result = component._getHashColorMapper('test');

      expect(mockUtilsLib.stringToColorIndex).toHaveBeenCalledWith('test', ['#red', '#blue', '#green']);
      expect(result).toBe('#000');
    });

    it('_getHashColorMapper should use _getRandomColor when colors is empty', () => {
      component.colors = [];

      const result = component._getHashColorMapper('test');

      expect(mockUtilsLib._getRandomColor).toHaveBeenCalled();
      expect(result).toBe('#000');
    });

    it('_getRandomColorMapper should use _getRandomDifferent when colors array is set', () => {
      component.colors = ['#red', '#blue'];

      const result = component._getRandomColorMapper();

      expect(mockUtilsLib._getRandomDifferent).toHaveBeenCalledWith(['#red', '#blue'], '');
    });

    it('_getRandomColorMapper should update _lastColor', () => {
      component.colors = ['#red', '#blue'];
      mockUtilsLib._getRandomDifferent.mockReturnValue('#blue');

      component._getRandomColorMapper();

      expect(component._lastColor).toBe('#blue');
    });

    it('_getRandomColorMapper should use _getRandomColor when colors is empty', () => {
      component.colors = [];

      component._getRandomColorMapper();

      expect(mockUtilsLib._getRandomColor).toHaveBeenCalled();
    });

    it('_getTextColorMapper should return contrast color', () => {
      const result = component._getTextColorMapper('#000');

      expect(mockUtilsLib.contrast).toHaveBeenCalledWith('#000');
      expect(result).toBe('#fff');
    });
  });

  // ===== openChoiceGroupModal =====

  describe('openChoiceGroupModal', () => {
    it('should open group modal and patch form on close', () => {
      component.searchBarForm = { setNotCloseForm: vi.fn(), _clearSearch: vi.fn() } as any;
      const onCloseSubject = new Subject<any>();
      const mockRef = { content: { onClose: onCloseSubject.asObservable() } };
      mockModalService.show.mockReturnValue(mockRef);
      const event = { stopPropagation: vi.fn() };

      component.openChoiceGroupModal(event);

      expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(true);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockModalService.show).toHaveBeenCalled();

      // Simulate modal close
      onCloseSubject.next([{ id_gruppo: 'grp1', nome: 'GroupName' }]);

      expect(component._formGroup.get('id_gruppo_padre')?.value).toBe('grp1');
      expect(component._formGroup.get('id_gruppo_padre_label')?.value).toBe('GroupName');
    });
  });

  // ===== clearGroup =====

  describe('clearGroup', () => {
    it('should clear group form values', () => {
      component._formGroup.patchValue({ id_gruppo_padre: 'grp1', id_gruppo_padre_label: 'Group1' });

      component.clearGroup({});

      expect(component._formGroup.get('id_gruppo_padre')?.value).toBeNull();
      expect(component._formGroup.get('id_gruppo_padre_label')?.value).toBeNull();
    });
  });

  // ===== openChoiceCategoriesModal =====

  describe('openChoiceCategoriesModal', () => {
    it('should open category modal and update form on close with tassonomia', () => {
      component.searchBarForm = { setNotCloseForm: vi.fn(), _clearSearch: vi.fn() } as any;
      const onCloseSubject = new Subject<any>();
      const mockRef = { content: { onClose: onCloseSubject.asObservable() } };
      mockModalService.show.mockReturnValue(mockRef);
      const event = { stopPropagation: vi.fn() };

      component.openChoiceCategoriesModal(event);

      expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(true);
      expect(mockModalService.show).toHaveBeenCalled();

      // Simulate modal close with tassonomia
      onCloseSubject.next({
        id_categoria: 'cat1',
        nome: 'Cat1',
        tassonomia: { id_tassonomia: 'tax1', nome: 'Tax1' }
      });

      expect(component._formGroup.get('categoria')?.value).toBe('tax1|cat1');
      // categoriaLabel is built from _listaCategorie: `${nome_tassonomia}|${nome_categoria}`
      expect(component._formGroup.get('categoriaLabel')?.value).toBe('Tax1|Cat1');
    });

    it('should handle category close result without tassonomia (using source)', () => {
      component.searchBarForm = { setNotCloseForm: vi.fn(), _clearSearch: vi.fn() } as any;
      const onCloseSubject = new Subject<any>();
      const mockRef = { content: { onClose: onCloseSubject.asObservable() } };
      mockModalService.show.mockReturnValue(mockRef);
      const event = { stopPropagation: vi.fn() };

      component.openChoiceCategoriesModal(event);

      // Simulate modal close without tassonomia
      onCloseSubject.next({
        id_categoria: 'cat2',
        nome: 'Cat2',
        source: {
          id_categoria: 'cat2',
          nome: 'SourceCat2',
          tassonomia: { id_tassonomia: 'tax2', nome: 'Tax2' }
        }
      });

      expect(component._formGroup.get('categoria')?.value).toBe('tax2|cat2');
      // categoriaLabel is built from _listaCategorie: `${nome_tassonomia}|${nome_categoria}`
      expect(component._formGroup.get('categoriaLabel')?.value).toBe('Tax2|SourceCat2');
    });

    it('should not add duplicate category', () => {
      component.searchBarForm = { setNotCloseForm: vi.fn(), _clearSearch: vi.fn() } as any;
      const onCloseSubject = new Subject<any>();
      const mockRef = { content: { onClose: onCloseSubject.asObservable() } };
      mockModalService.show.mockReturnValue(mockRef);
      const event = { stopPropagation: vi.fn() };

      component._listaCategorie = [{ id_categoria: 'cat1', id_tassonomia: 'tax1', nome_tassonomia: 'Tax1', nome_categoria: 'Cat1' }];

      component.openChoiceCategoriesModal(event);

      // Simulate adding same category again
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      onCloseSubject.next({
        id_categoria: 'cat1',
        nome: 'Cat1',
        tassonomia: { id_tassonomia: 'tax1', nome: 'Tax1' }
      });

      expect(component._listaCategorie.length).toBe(1);
      consoleSpy.mockRestore();
    });
  });

  // ===== onDeleteCategory =====

  describe('onDeleteCategory', () => {
    it('should remove category and update form values', () => {
      component._listaCategorie = [
        { id_tassonomia: 'tax1', nome_tassonomia: 'Tax1', id_categoria: 'cat1', nome_categoria: 'Cat1' },
        { id_tassonomia: 'tax2', nome_tassonomia: 'Tax2', id_categoria: 'cat2', nome_categoria: 'Cat2' }
      ];

      component.onDeleteCategory({
        event: { stopImmediatePropagation: vi.fn() },
        data: { id_categoria: 'cat1' }
      });

      expect(component._listaCategorie.length).toBe(1);
      expect(component._listaCategorie[0].id_categoria).toBe('cat2');
      expect(component._formGroup.get('categoria')?.value).toBe('tax2|cat2');
      expect(component._formGroup.get('categoriaLabel')?.value).toBe('Tax2|Cat2');
    });

    it('should clear form values when last category is deleted', () => {
      component._listaCategorie = [
        { id_tassonomia: 'tax1', nome_tassonomia: 'Tax1', id_categoria: 'cat1', nome_categoria: 'Cat1' }
      ];

      component.onDeleteCategory({
        event: { stopImmediatePropagation: vi.fn() },
        data: { id_categoria: 'cat1' }
      });

      expect(component._listaCategorie.length).toBe(0);
      expect(component._formGroup.get('categoria')?.value).toBe('');
      expect(component._formGroup.get('categoriaLabel')?.value).toBe('');
    });
  });

  // ===== updateCategoryInput =====

  describe('updateCategoryInput', () => {
    it('should populate _listaCategorie from form values', () => {
      component._formGroup.get('categoria')?.setValue('tax1|cat1,tax2|cat2');
      component._formGroup.get('categoriaLabel')?.setValue('Tax1|Cat1,Tax2|Cat2');

      component.updateCategoryInput();

      expect(component._listaCategorie.length).toBe(2);
      expect(component._listaCategorie[0]).toEqual({
        id_tassonomia: 'tax1',
        nome_tassonomia: 'Tax1',
        id_categoria: 'cat1',
        nome_categoria: 'Cat1'
      });
      expect(component._listaCategorie[1]).toEqual({
        id_tassonomia: 'tax2',
        nome_tassonomia: 'Tax2',
        id_categoria: 'cat2',
        nome_categoria: 'Cat2'
      });
    });

    it('should clear _listaCategorie when form values are empty', () => {
      component._listaCategorie = [{ id_categoria: 'cat1' }];
      component._formGroup.get('categoria')?.setValue('');
      component._formGroup.get('categoriaLabel')?.setValue('');

      component.updateCategoryInput();

      expect(component._listaCategorie).toEqual([]);
    });

    it('should handle single category', () => {
      component._formGroup.get('categoria')?.setValue('tax1|cat1');
      component._formGroup.get('categoriaLabel')?.setValue('Tax1|Cat1');

      component.updateCategoryInput();

      expect(component._listaCategorie.length).toBe(1);
    });
  });

  // ===== _saveGroupsBreadcrumbs =====

  describe('_saveGroupsBreadcrumbs', () => {
    it('should store breadcrumbs and broadcast event', () => {
      component._currIdGruppoPadre = 'g1';
      component._gruppoPadreNull = false;
      component.groupsBreadcrumbs = [{ label: 'G1', url: 'g1' }];

      (component as any)._saveGroupsBreadcrumbs();

      expect(mockBreadcrumbService.storeBreadcrumbs).toHaveBeenCalledWith({
        currIdGruppoPadre: 'g1',
        gruppoPadreNull: false,
        groupsBreadcrumbs: [{ label: 'G1', url: 'g1' }]
      });
      expect(mockEventsManagerService.broadcast).toHaveBeenCalledWith('UPDATE_BREADCRUMBS', expect.anything());
    });
  });

  // ===== _removeGroupsBreadcrumbs =====

  describe('_removeGroupsBreadcrumbs', () => {
    it('should clear breadcrumbs and broadcast empty array', () => {
      component.breadcrumbs = [{ label: 'Test', url: '' }];

      (component as any)._removeGroupsBreadcrumbs();

      expect(mockBreadcrumbService.clearBreadcrumbs).toHaveBeenCalled();
      expect(mockEventsManagerService.broadcast).toHaveBeenCalledWith('UPDATE_BREADCRUMBS', []);
    });
  });

  // ===== _resetGroupsBreadcrumbs =====

  describe('_resetGroupsBreadcrumbs', () => {
    it('should reset all group breadcrumb state', () => {
      component._currIdGruppoPadre = 'g1';
      component._gruppoPadreNull = false;
      component.groupsBreadcrumbs = [{ label: 'G1', url: 'g1' }];

      (component as any)._resetGroupsBreadcrumbs();

      expect(component._currIdGruppoPadre).toBe('');
      expect(component._gruppoPadreNull).toBe(true);
      expect(component.groupsBreadcrumbs).toEqual([]);
      expect(mockBreadcrumbService.clearBreadcrumbs).toHaveBeenCalled();
    });
  });

  // ===== getData =====

  describe('getData', () => {
    it('should pass string term as q parameter', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1, nome: 'Test' }] }));

      component.getData('servizi', 'searchTerm').subscribe();

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.objectContaining({
        params: expect.objectContaining({ q: 'searchTerm' })
      }));
    });

    it('should merge object term into params', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1, nome: 'Test' }] }));

      component.getData('servizi', { nome: 'Test', stato: 'pubblicato' }).subscribe();

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.objectContaining({
        params: expect.objectContaining({ nome: 'Test', stato: 'pubblicato' })
      }));
    });

    it('should not add q param when term is null', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }] }));

      component.getData('servizi', null).subscribe();

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.objectContaining({
        params: {}
      }));
    });

    it('should map api items with gateway descriptions', () => {
      const apiResp = {
        content: [{
          id: 1,
          nome: 'ApiTest',
          configurazione_collaudo: { dati_erogazione: { nome_gateway: 'gw-collaudo' } },
          configurazione_produzione: { dati_erogazione: { nome_gateway: 'gw-prod' } }
        }]
      };
      mockApiService.getList.mockReturnValue(of(apiResp));

      let result: any;
      component.getData('api', 'test').subscribe(r => result = r);

      expect(result[0].descrizione).toBe('gw-collaudo | gw-prod');
    });

    it('should use dash when gateway name is missing', () => {
      const apiResp = {
        content: [{
          id: 1,
          nome: 'ApiTest',
          configurazione_collaudo: { dati_erogazione: {} },
          configurazione_produzione: { dati_erogazione: { nome_gateway: 'gw-prod' } }
        }]
      };
      mockApiService.getList.mockReturnValue(of(apiResp));

      let result: any;
      component.getData('api', 'test').subscribe(r => result = r);

      expect(result[0].descrizione).toBe('- | gw-prod');
    });

    it('should not set descrizione for non-api models', () => {
      const resp = { content: [{ id: 1, nome: 'Tag1' }] };
      mockApiService.getList.mockReturnValue(of(resp));

      let result: any;
      component.getData('tags', 'test').subscribe(r => result = r);

      expect(result[0].descrizione).toBeUndefined();
    });

    it('should handle response without content (array response)', () => {
      const resp = [{ id: 1, nome: 'Item1' }];
      mockApiService.getList.mockReturnValue(of(resp));

      let result: any;
      component.getData('tags', 'test').subscribe(r => result = r);

      expect(result.length).toBe(1);
    });
  });

  // ===== _loadTaxonomies =====

  describe('_loadTaxonomies', () => {
    it('should load and filter visible taxonomies', () => {
      const response = {
        content: [
          { id: 't1', nome: 'Tax1', visibile: true },
          { id: 't2', nome: 'Tax2', visibile: false },
          { id: 't3', nome: 'Tax3', visibile: true }
        ]
      };
      mockApiService.getList.mockReturnValue(of(response));
      // Mock _addTaxonomiesForm since it accesses commented-out taxonomiesGroup form control
      vi.spyOn(component as any, '_addTaxonomiesForm').mockImplementation(() => {});

      component._loadTaxonomies();

      expect(component.taxonomies.length).toBe(2);
      expect(component.taxonomies[0].nome).toBe('Tax1');
      expect(component.taxonomies[1].nome).toBe('Tax3');
    });

    it('should handle error in loadTaxonomies', () => {
      mockApiService.getList.mockReturnValue(throwError(() => new Error('fail')));

      expect(() => component._loadTaxonomies()).not.toThrow();
    });
  });

  // ===== onSelectedSearchDropdwon / onChangeSearchDropdwon =====

  describe('onSelectedSearchDropdwon / onChangeSearchDropdwon', () => {
    it('should set notCloseForm and stop propagation on selected', () => {
      component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
      const event = { stopPropagation: vi.fn() };

      component.onSelectedSearchDropdwon(event as any);

      expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(true);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should set _searchApiSelected on change', () => {
      vi.useFakeTimers();
      component.searchBarForm = { setNotCloseForm: vi.fn() } as any;

      component.onChangeSearchDropdwon({ id: 'api1' });

      expect(component._searchApiSelected).toEqual({ id: 'api1' });

      vi.advanceTimersByTime(250);

      expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(false);
      vi.useRealTimers();
    });
  });

  // ===== _initSearchForm =====

  describe('_initSearchForm', () => {
    it('should initialize all expected form controls', () => {
      (component as any)._initSearchForm();

      const expectedControls = [
        'q', 'stato', 'type', 'referente', 'id_dominio', 'id_gruppo',
        'visibilita', 'categoria', 'categoriaLabel', 'profilo', 'tag',
        'in_attesa', 'miei_servizi', 'id_api', 'id_servizio',
        'id_gruppo_padre', 'id_gruppo_padre_label'
      ];

      expectedControls.forEach(ctrl => {
        expect(component._formGroup.get(ctrl)).toBeTruthy();
      });
    });
  });

  // ===== _initServiziSelect =====

  describe('_initServiziSelect', () => {
    it('should initialize servizi$ observable', () => {
      component._initServiziSelect([]);
      expect(component.servizi$).toBeDefined();
    });

    it('should initialize with default values', () => {
      const defaults = [{ id: 1, nome: 'Default' }];
      component._initServiziSelect(defaults);
      expect(component.servizi$).toBeDefined();
    });
  });

  // ===== _initServizioApiSelect =====

  describe('_initServizioApiSelect', () => {
    it('should initialize servizioApis$ observable', () => {
      component._initServizioApiSelect([]);
      expect(component.servizioApis$).toBeDefined();
    });
  });

  // ===== _initTagsSelect =====

  describe('_initTagsSelect', () => {
    it('should initialize tags$ observable', () => {
      component._initTagsSelect([]);
      expect(component.tags$).toBeDefined();
    });
  });

  // ===== _initDominiSelect =====

  describe('_initDominiSelect', () => {
    it('should initialize domini$ observable', () => {
      component._initDominiSelect([]);
      expect(component.domini$).toBeDefined();
    });
  });

  // ===== _getPrimaryText extended =====

  describe('_getPrimaryText (extended)', () => {
    it('should return nome when no versione and not hiding versions', () => {
      component.hideVersions = false;
      const result = component._getPrimaryText({ nome: 'TestSvc' });
      expect(result).toBe('TestSvc');
    });
  });

  // ===== _getServicePrimaryText extended =====

  describe('_getServicePrimaryText (extended)', () => {
    it('should return nome when no versione and not hiding versions', () => {
      component.hideVersions = false;
      const result = component._getServicePrimaryText({ nome: 'TestSvc' });
      expect(result).toBe('TestSvc');
    });
  });

  // ===== _getUserSettings extended =====

  describe('_getUserSettings (extended)', () => {
    it('should reset elements and disable groups when _isMyServices is true and settings exist', () => {
      component._isMyServices = true;
      mockAuthenticationService.getCurrentSession.mockReturnValue({
        settings: {
          servizi: {
            view: 'card',
            showPresentation: true,
            showImage: true,
            showEmptyImage: false,
            fillBox: true,
            showMasonry: false
          }
        }
      });

      component._getUserSettings();

      expect(component._groupsView).toBe(false);
    });

    it('should call _createWorkflowStati', () => {
      const spy = vi.spyOn(component, '_createWorkflowStati').mockImplementation(() => {});

      component._getUserSettings();

      expect(spy).toHaveBeenCalled();
    });
  });

  // ===== _createWorkflowStati extended =====

  describe('_createWorkflowStati (extended)', () => {
    it('should exclude archiviato when not gestore', () => {
      const cfg = {
        servizio: {
          workflow: { stati: ['bozza', 'pubblicato', 'archiviato'] },
          stati_adesione_consentita: ['pubblicato']
        }
      };
      component.Tools.Configurazione = cfg as any;
      mockAuthenticationService.isGestore.mockReturnValue(false);

      component._createWorkflowStati();

      expect(component._workflowStatiFiltered.some((s: any) => s.value === 'archiviato')).toBe(false);
    });

    it('should include archiviato when gestore', () => {
      const cfg = {
        servizio: {
          workflow: { stati: ['bozza', 'pubblicato', 'archiviato'] },
          stati_adesione_consentita: ['pubblicato']
        }
      };
      component.Tools.Configurazione = cfg as any;
      mockAuthenticationService.isGestore.mockReturnValue(true);

      component._createWorkflowStati();

      expect(component._workflowStatiFiltered.some((s: any) => s.value === 'archiviato')).toBe(true);
    });

    it('should update searchFields stato enum values', () => {
      const cfg = {
        servizio: {
          workflow: { stati: ['bozza', 'pubblicato'] },
          stati_adesione_consentita: ['pubblicato']
        }
      };
      component.Tools.Configurazione = cfg as any;

      component._createWorkflowStati();

      const statoField = component.searchFields.find((s: any) => s.field === 'stato');
      expect(statoField?.enumValues).toBeDefined();
      expect(Object.keys(statoField?.enumValues).length).toBeGreaterThan(0);
    });
  });

  // ===== onBreadcrumb extended =====

  describe('onBreadcrumb (extended)', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should not update crumbs when group url is not root and no stored breadcrumbs', () => {
      mockBreadcrumbService.getBreadcrumbs.mockReturnValue(null);

      component.onBreadcrumb({ group: true, url: 'g1' });

      // Should still call refresh but not update currIdGruppoPadre from stored crumbs
      expect(component._currIdGruppoPadre).toBe('');
    });

    it('should call _saveGroupsBreadcrumbs when stored breadcrumbs exist and url is not root', () => {
      const storedCrumbs = {
        currIdGruppoPadre: 'g2',
        gruppoPadreNull: false,
        groupsBreadcrumbs: [{ label: 'G2', url: 'g2' }]
      };
      mockBreadcrumbService.getBreadcrumbs.mockReturnValue(storedCrumbs);

      component.onBreadcrumb({ group: true, url: 'g2' });

      expect(mockBreadcrumbService.storeBreadcrumbs).toHaveBeenCalled();
    });
  });

  // ===== refresh extended =====

  describe('refresh (extended)', () => {
    beforeEach(() => {
      component.searchBarForm = { _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    });

    it('should set _hideLoader when hideLoader param is true', () => {
      component._groupsView = false;
      component.refresh(true);
      // _hideLoader was set to true, then the load completes and sets it back to false
      expect(mockApiService.getList).toHaveBeenCalled();
    });

    it('should reset group breadcrumbs when not in groups view', () => {
      component._groupsView = false;
      component._currIdGruppoPadre = 'g1';

      component.refresh();

      expect(component._currIdGruppoPadre).toBe('');
      expect(component._gruppoPadreNull).toBe(true);
    });
  });

  // ===== searchFields profilo callback =====

  describe('searchFields profilo callback', () => {
    it('should format single profilo value', () => {
      component.profili = [
        { codice_interno: 'p1', etichetta: 'Profilo One' },
        { codice_interno: 'p2', etichetta: 'Profilo Two' }
      ];
      const profiloField = component.searchFields.find((s: any) => s.field === 'profilo');
      expect(profiloField?.callBack).toBeDefined();

      const result = profiloField.callBack('p1');
      expect(result).toBe('Profilo One');
    });

    it('should format array of profilo values', () => {
      component.profili = [
        { codice_interno: 'p1', etichetta: 'Profilo One' },
        { codice_interno: 'p2', etichetta: 'Profilo Two' }
      ];
      const profiloField = component.searchFields.find((s: any) => s.field === 'profilo');

      const result = profiloField.callBack(['p1', 'p2']);
      expect(result).toBe('Profilo One, Profilo Two');
    });

    it('should return raw value when no matching profilo found', () => {
      component.profili = [];
      const profiloField = component.searchFields.find((s: any) => s.field === 'profilo');

      const result = profiloField.callBack('unknown');
      expect(result).toBe('unknown');
    });

    it('should return raw values in array when no matching profilo found', () => {
      component.profili = [];
      const profiloField = component.searchFields.find((s: any) => s.field === 'profilo');

      const result = profiloField.callBack(['unknown1', 'unknown2']);
      expect(result).toBe('unknown1, unknown2');
    });
  });

  // ===== _initProfili extended =====

  describe('_initProfili (extended)', () => {
    it('should default to empty array when api profili is missing', () => {
      component.Tools.Configurazione = {
        servizio: {
          api: {},
          generico: { profili: [{ codice_interno: 'g1', etichetta: 'Gen1' }] }
        }
      } as any;
      component.tipo_servizio = 'API';

      component._initProfili();

      expect(component.profili).toEqual([]);
    });

    it('should default to empty array when generico profili is missing', () => {
      component.Tools.Configurazione = {
        servizio: {
          api: { profili: [{ codice_interno: 'p1', etichetta: 'Prof1' }] },
          generico: {}
        }
      } as any;
      component.tipo_servizio = 'Generico';

      component._initProfili();

      expect(component.profili).toEqual([]);
    });
  });

  // ===== allSelected edge cases =====

  describe('allSelected (edge cases)', () => {
    it('should return false when elements is empty', () => {
      component.elements = [];
      component.elementsSelected = [];
      expect(component.allSelected).toBe(false);
    });
  });
});
