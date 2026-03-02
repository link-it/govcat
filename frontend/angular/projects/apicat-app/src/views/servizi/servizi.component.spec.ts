import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
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
});
