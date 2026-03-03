import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
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
    component = new ServiziComponent(
      mockRouter,
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
      mockRouter,
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
});
