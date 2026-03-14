import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { Tools, EventType } from '@linkit/components';
import { ClientsComponent } from './clients.component';

describe('ClientsComponent', () => {
  let component: ClientsComponent;
  let savedConfigurazione: any;

  const mockRoute = { snapshot: { data: {} } } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn() } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;
  const mockNavigationService = {
    extractEvent: vi.fn(),
    extractData: vi.fn(),
    navigateWithEvent: vi.fn(),
    openInNewTab: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    Tools.ScrollTo = vi.fn();
    Tools.ScrollElement = vi.fn();
    Tools.StatiClientEnum = {};
    Tools.StatiClient = [];
    Tools.simpleItemFormatter = vi.fn().mockReturnValue('');
    component = new ClientsComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockTools, mockEventsManager,
      mockApiService, mockUtils, mockNavigationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ClientsComponent.Name).toBe('ClientsComponent');
  });

  it('should have model set to client', () => {
    expect(component.model).toBe('client');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._filterData).toEqual([]);
    expect(component._useRoute).toBe(true);
  });

  it('should have correct sort defaults', () => {
    expect(component.sortField).toBe('nome');
    expect(component.sortDirection).toBe('asc');
  });

  it('should have breadcrumbs with 2 entries', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Client');
  });

  it('should have searchFields with q, stato, auth_type, ambiente, id_soggetto, id_organizzazione', () => {
    expect(component.searchFields.length).toBe(6);
    const fieldNames = component.searchFields.map((f: any) => f.field);
    expect(fieldNames).toContain('q');
    expect(fieldNames).toContain('stato');
    expect(fieldNames).toContain('auth_type');
    expect(fieldNames).toContain('ambiente');
    expect(fieldNames).toContain('id_soggetto');
    expect(fieldNames).toContain('id_organizzazione');
  });

  it('should set error messages when error is true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should set no-results messages when error is false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should init search form with correct controls', () => {
    expect(component._formGroup).toBeTruthy();
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('stato')).toBeTruthy();
    expect(component._formGroup.get('auth_type')).toBeTruthy();
    expect(component._formGroup.get('ambiente')).toBeTruthy();
    expect(component._formGroup.get('id_soggetto')).toBeTruthy();
    expect(component._formGroup.get('id_organizzazione')).toBeTruthy();
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should reset scroll', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  it('should close edit state', () => {
    component._isEdit = true;
    component._onCloseEdit();
    expect(component._isEdit).toBe(false);
  });

  it('should update filterData on _onSearch', () => {
    const values = [{ field: 'q', value: 'test' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  it('should update sort on _onSort', () => {
    component._onSort({ sortField: 'stato', sortBy: 'desc' });
    expect(component.sortField).toBe('stato');
    expect(component.sortDirection).toBe('desc');
  });

  it('should track by id', () => {
    expect(component._trackBy(0, { id: 'abc' })).toBe('abc');
  });

  // --- ngOnInit tests ---

  it('ngOnInit should set _statiClient from Tools.StatiClient', () => {
    Tools.StatiClient = [{ id: 1, label: 'active' }];
    component.ngOnInit();
    expect(component._statiClient).toEqual([{ id: 1, label: 'active' }]);
  });

  it('ngOnInit should populate _authTypeEnum from Tools.Configurazione', () => {
    Tools.Configurazione = {
      servizio: { api: { auth_type: [{ type: 'https' }, { type: 'apikey' }] } }
    };
    component.ngOnInit();
    expect(component._authTypeEnum).toContain('https');
    expect(component._authTypeEnum).toContain('apikey');
  });

  it('ngOnInit should set _ambienteEnum', () => {
    component.ngOnInit();
    expect(component._ambienteEnum).toEqual(['collaudo', 'produzione']);
  });

  it('ngOnInit should subscribe to configService.getConfig', () => {
    const configData = { some: 'config' };
    mockConfigService.getConfig.mockReturnValue(of(configData));
    component.ngOnInit();
    expect(mockConfigService.getConfig).toHaveBeenCalledWith('client');
    expect(component.clientsConfig).toEqual(configData);
  });

  it('ngOnInit should register PROFILE_UPDATE event', () => {
    component.ngOnInit();
    expect(mockEventsManager.on).toHaveBeenCalledWith(EventType.PROFILE_UPDATE, expect.any(Function));
  });

  it('ngOnInit PROFILE_UPDATE callback should update _statiClient and _authTypeEnum', () => {
    component.ngOnInit();
    const profileCallback = mockEventsManager.on.mock.calls[0][1];

    Tools.StatiClient = [{ id: 2, label: 'inactive' }];
    Tools.Configurazione = {
      servizio: { api: { auth_type: [{ type: 'oauth2' }] } }
    };
    profileCallback({});
    expect(component._statiClient).toEqual([{ id: 2, label: 'inactive' }]);
    expect(component._authTypeEnum).toContain('oauth2');
  });

  it('ngOnInit should not fail when Tools.StatiClient is falsy', () => {
    (Tools as any).StatiClient = null;
    Tools.Configurazione = null;
    expect(() => component.ngOnInit()).not.toThrow();
    expect(component._statiClient).toEqual([]);
  });

  // --- ngAfterViewInit tests ---

  it('ngAfterViewInit should call _loadClients when searchBarForm is not set', () => {
    vi.useFakeTimers();
    component.searchBarForm = undefined as any;
    component.ngAfterViewInit();
    vi.advanceTimersByTime(150);
    expect(mockApiService.getList).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('ngAfterViewInit should call _loadClients when searchBarForm._isPinned returns false', () => {
    vi.useFakeTimers();
    component.searchBarForm = { _isPinned: vi.fn().mockReturnValue(false) } as any;
    component.ngAfterViewInit();
    vi.advanceTimersByTime(150);
    expect(mockApiService.getList).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('ngAfterViewInit should NOT call _loadClients when searchBarForm._isPinned returns true', () => {
    vi.useFakeTimers();
    component.searchBarForm = { _isPinned: vi.fn().mockReturnValue(true) } as any;
    mockApiService.getList.mockClear();
    component.ngAfterViewInit();
    vi.advanceTimersByTime(150);
    expect(mockApiService.getList).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  // --- ngAfterContentChecked ---

  it('ngAfterContentChecked should set desktop based on window width', () => {
    component.ngAfterContentChecked();
    // Just verify it runs without error; actual value depends on test runner window size
    expect(typeof component.desktop).toBe('boolean');
  });

  // --- _loadClients tests ---

  it('_loadClients should reset clients and call apiService.getList', () => {
    component.clients = [{ id: 1 }] as any;
    component._loadClients();
    expect(component.clients).toEqual([]);
    expect(mockApiService.getList).toHaveBeenCalledWith('client', expect.any(Object), '');
  });

  it('_loadClients should populate clients from response', () => {
    const response = {
      content: [
        {
          id_client: 10,
          soggetto: { id_soggetto: 5, nome: 'Soggetto1' },
          nome: 'Client1',
          stato: 'attivo'
        },
        {
          id_client: 20,
          soggetto: { id_soggetto: 6, nome: 'Soggetto2' },
          nome: 'Client2',
          stato: 'inattivo'
        }
      ],
      page: { totalElements: 2 },
      _links: { next: { href: '/next' } }
    };
    mockApiService.getList.mockReturnValue(of(response));
    component._loadClients();
    expect(component.clients.length).toBe(2);
    expect(component.clients[0].id).toBe(10);
    expect(component.clients[0].nome).toBe('Client1');
    expect(component.clients[0].stato).toBe('attivo');
    expect(component.clients[0].idSoggetto).toBe(5);
    expect(component.clients[0].nomeSoggetto).toBe('Soggetto1');
    expect(component.clients[1].id).toBe(20);
    expect(component._links).toEqual({ next: { href: '/next' } });
    expect(component._spin).toBe(false);
  });

  it('_loadClients with url should append to existing clients', () => {
    component.clients = [{ id: 1, nome: 'Existing' }] as any;
    const response = {
      content: [
        { id_client: 30, soggetto: { id_soggetto: 7, nome: 'Sog3' }, nome: 'Client3', stato: 'attivo' }
      ],
      page: { totalElements: 3 },
      _links: null
    };
    mockApiService.getList.mockReturnValue(of(response));
    component._loadClients(null, 'http://api/next');
    expect(component.clients.length).toBe(2); // existing 1 + new 1
    expect(component.clients[0].id).toBe(1);
    expect(component.clients[1].id).toBe(30);
  });

  it('_loadClients should set _spin false and call ScrollTo on success', () => {
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    component._loadClients();
    expect(component._spin).toBe(false);
    expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
  });

  it('_loadClients should handle error', () => {
    mockApiService.getList.mockReturnValue(throwError(() => new Error('fail')));
    component._loadClients();
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._spin).toBe(false);
    expect(component._preventMultiCall).toBe(false);
  });

  it('_loadClients should build query with sort params', () => {
    component.sortField = 'stato';
    component.sortDirection = 'desc';
    component._loadClients({ q: 'test' });
    expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'test', sort: 'stato,desc' })
    );
  });

  it('_loadClients should set _paging from response', () => {
    const response = {
      content: [],
      page: { totalElements: 100, size: 25 },
      _links: null
    };
    mockApiService.getList.mockReturnValue(of(response));
    component._loadClients();
    expect(component._paging.totalElements).toBe(100);
  });

  it('_loadClients should handle response with null _links', () => {
    const response = { content: [], page: {} };
    mockApiService.getList.mockReturnValue(of(response));
    component._loadClients();
    expect(component._links).toBeNull();
  });

  // --- __loadMoreData tests ---

  it('__loadMoreData should load more when _links.next exists and not preventMultiCall', () => {
    component._links = { next: { href: 'http://api/page2' } };
    component._preventMultiCall = false;
    vi.spyOn(component, '_loadClients').mockImplementation(() => {});
    component.__loadMoreData();
    expect(component._preventMultiCall).toBe(true);
    expect(component._loadClients).toHaveBeenCalledWith(null, 'http://api/page2');
  });

  it('__loadMoreData should NOT load when _preventMultiCall is true', () => {
    component._links = { next: { href: 'http://api/page2' } };
    component._preventMultiCall = true;
    mockApiService.getList.mockClear();
    component.__loadMoreData();
    expect(mockApiService.getList).not.toHaveBeenCalled();
  });

  it('__loadMoreData should NOT load when _links is null', () => {
    component._links = null;
    component._preventMultiCall = false;
    mockApiService.getList.mockClear();
    component.__loadMoreData();
    expect(mockApiService.getList).not.toHaveBeenCalled();
  });

  it('__loadMoreData should NOT load when _links.next is missing', () => {
    component._links = {};
    component._preventMultiCall = false;
    mockApiService.getList.mockClear();
    component.__loadMoreData();
    expect(mockApiService.getList).not.toHaveBeenCalled();
  });

  // --- _onNew tests ---

  it('_onNew should navigate when _useRoute is true', () => {
    component._useRoute = true;
    component._onNew();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['client', 'new']);
  });

  it('_onNew should set _isEdit when _useRoute is false', () => {
    component._useRoute = false;
    component._onNew();
    expect(component._isEdit).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // --- _onEdit tests ---

  it('_onEdit should navigate with event when _useRoute is true', () => {
    component._useRoute = true;
    component.searchBarForm = { _pinLastSearch: vi.fn() } as any;
    const mockEvent = { ctrlKey: false };
    const mockParam = { source: { id_client: 42 } };
    mockNavigationService.extractEvent.mockReturnValue(mockEvent);
    mockNavigationService.extractData.mockReturnValue(mockParam);

    component._onEdit(mockEvent, mockParam);

    expect(component.searchBarForm._pinLastSearch).toHaveBeenCalled();
    expect(mockNavigationService.extractEvent).toHaveBeenCalledWith(mockEvent);
    expect(mockNavigationService.extractData).toHaveBeenCalledWith(mockParam);
    expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(
      mockEvent, ['client', 42]
    );
  });

  it('_onEdit should use param directly when extractData returns null', () => {
    component._useRoute = true;
    component.searchBarForm = { _pinLastSearch: vi.fn() } as any;
    const mockParam = { source: { id_client: 55 } };
    mockNavigationService.extractEvent.mockReturnValue(undefined);
    mockNavigationService.extractData.mockReturnValue(null);

    component._onEdit({}, mockParam);

    expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(
      undefined, ['client', 55]
    );
  });

  it('_onEdit should set _isEdit and _editCurrent when _useRoute is false', () => {
    component._useRoute = false;
    const param = { id: 1, source: { id_client: 1 } };
    component._onEdit({}, param);
    expect(component._isEdit).toBe(true);
    expect(component._editCurrent).toBe(param);
  });

  it('_onEdit should not fail when searchBarForm is null and _useRoute is true', () => {
    component._useRoute = true;
    component.searchBarForm = null as any;
    const mockParam = { source: { id_client: 99 } };
    mockNavigationService.extractEvent.mockReturnValue(undefined);
    mockNavigationService.extractData.mockReturnValue(mockParam);

    expect(() => component._onEdit({}, mockParam)).not.toThrow();
    expect(mockNavigationService.navigateWithEvent).toHaveBeenCalled();
  });

  // --- _onOpenInNewTab tests ---

  it('_onOpenInNewTab should extract data and call openInNewTab', () => {
    const event = { data: { source: { id_client: 77 } } };
    mockNavigationService.extractData.mockReturnValue({ source: { id_client: 77 } });
    component._onOpenInNewTab(event);
    expect(mockNavigationService.extractData).toHaveBeenCalledWith(event);
    expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['client', 77]);
  });

  // --- _dummyAction test ---

  it('_dummyAction should log to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    component._dummyAction('evt', 'param');
    expect(spy).toHaveBeenCalledWith('evt', 'param');
    spy.mockRestore();
  });

  // --- _onSubmit tests ---

  it('_onSubmit should call searchBarForm._onSearch', () => {
    component.searchBarForm = { _onSearch: vi.fn() } as any;
    component._onSubmit({});
    expect(component.searchBarForm._onSearch).toHaveBeenCalled();
  });

  it('_onSubmit should not fail when searchBarForm is falsy', () => {
    component.searchBarForm = null as any;
    expect(() => component._onSubmit({})).not.toThrow();
  });

  // --- _onSearch tests ---

  it('_onSearch should set _filterData and load clients', () => {
    const values = [{ field: 'stato', value: 'attivo' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
    expect(mockApiService.getList).toHaveBeenCalled();
  });

  // --- _onSort tests ---

  it('_onSort should load clients with new sort', () => {
    mockApiService.getList.mockClear();
    component._onSort({ sortField: 'nome', sortBy: 'desc' });
    expect(component.sortField).toBe('nome');
    expect(component.sortDirection).toBe('desc');
    expect(mockApiService.getList).toHaveBeenCalled();
  });

  // --- _resetForm tests ---

  it('_resetForm should clear filterData and reload', () => {
    component._filterData = [{ field: 'q', value: 'hello' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
    expect(mockApiService.getList).toHaveBeenCalled();
  });

  // --- _timestampToMoment tests ---

  it('_timestampToMoment should return Date for truthy value', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBe(1609459200000);
  });

  it('_timestampToMoment should return null for 0', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('_timestampToMoment should return null for falsy value', () => {
    expect(component._timestampToMoment(null as any)).toBeNull();
  });

  // --- _onResize test ---

  it('_onResize should set desktop based on window width', () => {
    component._onResize();
    expect(typeof component.desktop).toBe('boolean');
  });

  // --- getSoggetti tests ---

  it('getSoggetti should call apiService.getList with term', () => {
    const mockResp = { content: [{ id: 1, nome: 'Sog1' }] };
    mockApiService.getList.mockReturnValue(of(mockResp));
    component._searchOrganizzazioneSelected = null;

    let result: any;
    component.getSoggetti('test').subscribe((r: any) => { result = r; });
    expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', { params: { q: 'test' } });
    expect(result).toEqual([{ id: 1, nome: 'Sog1' }]);
  });

  it('getSoggetti should include id_organizzazione when selected', () => {
    const mockResp = { content: [{ id: 2, nome: 'Sog2' }] };
    mockApiService.getList.mockReturnValue(of(mockResp));
    component._searchOrganizzazioneSelected = { id_organizzazione: 99 };

    let result: any;
    component.getSoggetti('term').subscribe((r: any) => { result = r; });
    expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', {
      params: { q: 'term', id_organizzazione: 99 }
    });
    expect(result).toEqual([{ id: 2, nome: 'Sog2' }]);
  });

  it('getSoggetti should handle Error in response', () => {
    const mockResp = { Error: 'something went wrong' };
    mockApiService.getList.mockReturnValue(of(mockResp));

    let result: any;
    component.getSoggetti('test').subscribe((r: any) => { result = r; });
    // throwError inside pipe is not returned, so result is undefined
    expect(result).toBeUndefined();
  });

  // --- getOrganizzazioni tests ---

  it('getOrganizzazioni should call apiService.getList with term', () => {
    const mockResp = { content: [{ id: 1, nome: 'Org1' }] };
    mockApiService.getList.mockReturnValue(of(mockResp));

    let result: any;
    component.getOrganizzazioni('org').subscribe((r: any) => { result = r; });
    expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: 'org' } });
    expect(result).toEqual([{ id: 1, nome: 'Org1' }]);
  });

  it('getOrganizzazioni should reinit soggetti select', () => {
    const mockResp = { content: [] };
    mockApiService.getList.mockReturnValue(of(mockResp));
    component.getOrganizzazioni('test');
    // soggetti$ should be reassigned (observable)
    expect(component.soggetti$).toBeTruthy();
  });

  it('getOrganizzazioni should handle Error in response', () => {
    const mockResp = { Error: 'fail' };
    mockApiService.getList.mockReturnValue(of(mockResp));

    let result: any;
    component.getOrganizzazioni('test').subscribe((r: any) => { result = r; });
    expect(result).toBeUndefined();
  });

  // --- onChangeSearchDropdwon tests ---

  it('onChangeSearchDropdwon with soggetto should set _searchSoggettoSelected', () => {
    vi.useFakeTimers();
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    const event = { id: 1, nome: 'Sog' };
    component.onChangeSearchDropdwon(event, 'soggetto');
    expect(component._searchSoggettoSelected).toEqual(event);
    vi.advanceTimersByTime(250);
    expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(false);
    vi.useRealTimers();
  });

  it('onChangeSearchDropdwon with organizzazione should set _searchOrganizzazioneSelected', () => {
    vi.useFakeTimers();
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    const event = { id: 2, nome: 'Org' };
    component.onChangeSearchDropdwon(event, 'organizzazione');
    expect(component._searchOrganizzazioneSelected).toEqual(event);
    vi.advanceTimersByTime(250);
    expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(false);
    vi.useRealTimers();
  });

  // --- onSelectedSearchDropdwon tests ---

  it('onSelectedSearchDropdwon should set notCloseForm and stop propagation', () => {
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    const mockEvt = { stopPropagation: vi.fn() };
    component.onSelectedSearchDropdwon(mockEvt);
    expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(true);
    expect(mockEvt.stopPropagation).toHaveBeenCalled();
  });

  // --- _initSoggettiSelect tests ---

  it('_initSoggettiSelect should set soggetti$ observable', () => {
    component._initSoggettiSelect([]);
    expect(component.soggetti$).toBeTruthy();
  });

  it('_initSoggettiSelect should accept default values', () => {
    component._initSoggettiSelect([{ id: 1, nome: 'Default' }]);
    expect(component.soggetti$).toBeTruthy();
  });

  // --- _initOrganizzazioniSelect tests ---

  it('_initOrganizzazioniSelect should set organizzazioni$ observable', () => {
    component._initOrganizzazioniSelect([]);
    expect(component.organizzazioni$).toBeTruthy();
  });

  it('_initOrganizzazioniSelect should accept default values', () => {
    component._initOrganizzazioniSelect([{ id: 1, nome: 'Org' }]);
    expect(component.organizzazioni$).toBeTruthy();
  });

  // --- constructor sets _useNewSearchUI ---

  it('constructor should set _useNewSearchUI to true', () => {
    expect(component._useNewSearchUI).toBe(true);
  });

  // --- _loadClients with preventMultiCall reset on success ---

  it('_loadClients should reset _preventMultiCall on success with content', () => {
    component._preventMultiCall = true;
    const response = {
      content: [{ id_client: 1, soggetto: { id_soggetto: 1, nome: 'S' }, nome: 'C', stato: 'a' }],
      page: {}
    };
    mockApiService.getList.mockReturnValue(of(response));
    component._loadClients();
    expect(component._preventMultiCall).toBe(false);
  });

  // --- _loadClients error resets _preventMultiCall ---

  it('_loadClients error should reset _preventMultiCall', () => {
    component._preventMultiCall = true;
    mockApiService.getList.mockReturnValue(throwError(() => new Error('err')));
    component._loadClients();
    expect(component._preventMultiCall).toBe(false);
  });

  // --- ngOnDestroy ---

  it('ngOnDestroy should not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
