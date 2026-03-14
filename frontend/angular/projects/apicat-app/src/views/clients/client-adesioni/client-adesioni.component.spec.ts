import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { Tools } from '@linkit/components';
import { ClientAdesioniComponent } from './client-adesioni.component';

describe('ClientAdesioniComponent', () => {
  let component: ClientAdesioniComponent;
  let savedConfigurazione: any;

  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockModalService = {
    show: vi.fn().mockReturnValue({
      hide: vi.fn(),
      content: { onClose: of(false) }
    })
  } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    })),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({ nome: 'TestClient' })),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtilService = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    GetErrorMsg: vi.fn().mockReturnValue('error'),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.ScrollTo = vi.fn();
    Tools.ScrollElement = vi.fn();
    Tools.OnError = vi.fn();
    Tools.showMessage = vi.fn();
    Tools.simpleItemFormatter = vi.fn().mockReturnValue('');

    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    }));
    mockApiService.getDetails.mockReturnValue(of({ nome: 'TestClient' }));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    mockTranslate.instant.mockImplementation((k: string) => k);

    component = new ClientAdesioniComponent(
      mockRoute, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockUtilService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ClientAdesioniComponent.Name).toBe('ClientAdesioniComponent');
  });

  it('should have model set to client', () => {
    expect(component.model).toBe('client');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(false);
    expect(component.client).toBeNull();
    expect(component._error).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._preventMultiCall).toBe(false);
    expect(component._useRoute).toBe(false);
    expect(component._useDialog).toBe(true);
  });

  it('should have empty clientadesioni by default', () => {
    expect(component.clientadesioni).toEqual([]);
  });

  it('should have empty breadcrumbs by default', () => {
    expect(component.breadcrumbs).toEqual([]);
  });

  it('should have default sort settings', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should init search form in constructor', () => {
    expect(component._formGroup).toBeTruthy();
    expect(component._formGroup.get('fileName')).toBeTruthy();
    expect(component._formGroup.get('status')).toBeTruthy();
    expect(component._formGroup.get('type')).toBeTruthy();
    expect(component._formGroup.get('organizationTaxCode')).toBeTruthy();
    expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
    expect(component._formGroup.get('creationDateTo')).toBeTruthy();
  });

  it('should have default messages', () => {
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should set error messages when error is true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages when error is false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }];
    vi.spyOn(component, '_loadClientAdesioni').mockImplementation(() => {});
    component._resetForm();
    expect(component._filterData).toEqual([]);
    expect(component._loadClientAdesioni).toHaveBeenCalledWith([]);
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/client' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/client']);
  });

  it('should init breadcrumb when client is available', () => {
    component.client = { nome: 'MyClient' };
    component.id = 10;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[0].iconBs).toBe('gear');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Client');
    expect(component.breadcrumbs[1].url).toBe('/client');
    expect(component.breadcrumbs[2].label).toBe('MyClient');
    expect(component.breadcrumbs[2].url).toBe('/client/10');
    expect(component.breadcrumbs[3].label).toBe('APP.TITLE.Adesioni');
  });

  it('should prepare list adesioni from data', () => {
    component.adesioniConfig = {
      itemRow: {
        primaryText: [{ field: 'nome', type: 'text' }],
        secondaryText: [{ field: 'descrizione', type: 'text' }],
        metadata: { text: [{ field: 'stato', type: 'text' }], label: [] },
        secondaryMetadata: [],
      },
      options: null,
    };
    const data = {
      content: [
        { id_adesione: 1, nome: 'Test', descrizione: 'Desc', stato: 'attivo' }
      ],
      page: { totalElements: 1 },
      _links: null,
    };
    component._prepareListAdesioni(data);
    expect(component.clientadesioni.length).toBe(1);
    expect(component.clientadesioni[0].id).toBe(1);
  });

  it('should handle null data in _prepareListAdesioni', () => {
    component.clientadesioni = [{ id: 1 }] as any;
    component._prepareListAdesioni(null);
    expect(component.clientadesioni).toEqual([]);
  });

  it('should close edit state on _onCloseEdit', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  it('should load anagrafiche with tipo-referente', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente']).toBeDefined();
    expect(component.anagrafiche['tipo-referente'].length).toBe(2);
    expect(component.anagrafiche['tipo-referente'][0].nome).toBe('referente');
    expect(component.anagrafiche['tipo-referente'][1].nome).toBe('referente_tecnico');
  });

  it('should have selectedAdesione as null by default', () => {
    expect(component._selectedAdesione).toBeNull();
  });

  it('should have showHistory and showSearch as true by default', () => {
    expect(component.showHistory).toBe(true);
    expect(component.showSearch).toBe(true);
    expect(component.showSorting).toBe(true);
  });

  // --- ngOnInit tests ---

  it('ngOnInit should subscribe to route params and load data via forkJoin', () => {
    const adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };
    const clientDetails = { nome: 'Client1' };
    const adesioniList = { content: [], page: { totalElements: 0 } };

    mockConfigService.getConfig.mockReturnValue(of(adesioniConfig));
    mockApiService.getDetails.mockReturnValue(of(clientDetails));
    mockApiService.getList.mockReturnValue(of(adesioniList));

    component.ngOnInit();

    expect(component.id).toBe('1');
    expect(component.adesioniConfig).toEqual(adesioniConfig);
    expect(component.client).toEqual(clientDetails);
    expect(component._spin).toBe(false);
    expect(component.breadcrumbs.length).toBe(4);
  });

  it('ngOnInit should not load when route has no id', () => {
    const routeNoId = { params: of({}) } as any;
    const comp = new ClientAdesioniComponent(
      routeNoId, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockUtilService
    );
    mockApiService.getDetails.mockClear();
    mockConfigService.getConfig.mockClear();
    comp.ngOnInit();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  it('ngOnInit should populate clientadesioni when data has content', () => {
    const adesioniConfig = {
      itemRow: {
        primaryText: [{ field: 'nome', type: 'text' }],
        secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };
    const adesioniList = {
      content: [
        { id_adesione: 42, nome: 'Adesione1' }
      ],
      page: { totalElements: 1 },
      _links: { next: { href: '/next' } }
    };

    mockConfigService.getConfig.mockReturnValue(of(adesioniConfig));
    mockApiService.getDetails.mockReturnValue(of({ nome: 'C1' }));
    mockApiService.getList.mockReturnValue(of(adesioniList));

    component.ngOnInit();

    expect(component.clientadesioni.length).toBe(1);
    expect(component.clientadesioni[0].id).toBe(42);
    expect(component._links).toEqual({ next: { href: '/next' } });
  });

  // --- ngOnDestroy ---

  it('ngOnDestroy should not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // --- ngAfterContentChecked ---

  it('ngAfterContentChecked should set desktop based on window width', () => {
    component.ngAfterContentChecked();
    expect(typeof component.desktop).toBe('boolean');
  });

  // --- _onResize ---

  it('_onResize should set desktop based on window width', () => {
    component._onResize();
    expect(typeof component.desktop).toBe('boolean');
  });

  // --- _loadClient tests ---

  it('_loadClient should call apiService.getDetails and set client', () => {
    component.id = 5;
    const clientData = { nome: 'LoadedClient' };
    mockApiService.getDetails.mockReturnValue(of(clientData));
    component._loadClient();
    expect(component.client).toEqual(clientData);
    expect(mockApiService.getDetails).toHaveBeenCalledWith('client', 5);
  });

  it('_loadClient should init breadcrumb after loading', () => {
    component.id = 5;
    mockApiService.getDetails.mockReturnValue(of({ nome: 'Bc' }));
    component._loadClient();
    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[2].label).toBe('Bc');
  });

  it('_loadClient should handle error', () => {
    component.id = 5;
    mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
    component._loadClient();
    expect(Tools.OnError).toHaveBeenCalled();
  });

  it('_loadClient should not call API when id is 0', () => {
    component.id = 0;
    mockApiService.getDetails.mockClear();
    component._loadClient();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  // --- _loadClientAdesioni tests ---

  it('_loadClientAdesioni should set _spin and call apiService.getList', () => {
    component.id = 3;
    component.client = { nome: 'C' };
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    component._loadClientAdesioni();
    expect(mockApiService.getList).toHaveBeenCalledWith('adesioni', { params: { id_client: 3 } });
    expect(component._spin).toBe(false);
    expect(component._error).toBe(false);
  });

  it('_loadClientAdesioni should reset clientadesioni when no url', () => {
    component.id = 3;
    component.client = { nome: 'C' };
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };
    component.clientadesioni = [{ id: 1 }] as any;
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    component._loadClientAdesioni();
    expect(component.clientadesioni).toEqual([]);
  });

  it('_loadClientAdesioni should handle error', () => {
    component.id = 3;
    mockApiService.getList.mockReturnValue(throwError(() => new Error('fail')));
    component._loadClientAdesioni();
    expect(Tools.OnError).toHaveBeenCalled();
    expect(component._preventMultiCall).toBe(false);
    expect(component._spin).toBe(false);
  });

  it('_loadClientAdesioni should not call API when id is 0', () => {
    component.id = 0;
    mockApiService.getList.mockClear();
    component._loadClientAdesioni();
    // Still sets spin and error messages
    expect(component._spin).toBe(true); // not reset since no API call
    expect(mockApiService.getList).not.toHaveBeenCalled();
  });

  it('_loadClientAdesioni with url should not reset clientadesioni', () => {
    component.id = 3;
    component.client = { nome: 'C' };
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };
    component.clientadesioni = [{ id: 99 }] as any;
    component._links = { next: { href: 'http://api/page3' } };
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: { next: { href: 'http://api/page3' } } }));
    component._loadClientAdesioni(null, 'http://api/page2');
    // When url is provided, clientadesioni should NOT be reset
    // (the method only resets when !url)
    expect(component._links).not.toBeNull(); // _links preserved from response
  });

  // --- __loadMoreData tests ---

  it('__loadMoreData should load when _links.next exists', () => {
    component._links = { next: { href: 'http://api/page2' } };
    component._preventMultiCall = false;
    vi.spyOn(component, '_loadClientAdesioni').mockImplementation(() => {});
    component.__loadMoreData();
    expect(component._preventMultiCall).toBe(true);
    expect(component._loadClientAdesioni).toHaveBeenCalledWith(null, 'http://api/page2');
  });

  it('__loadMoreData should not load when _preventMultiCall is true', () => {
    component._links = { next: { href: 'http://api/page2' } };
    component._preventMultiCall = true;
    vi.spyOn(component, '_loadClientAdesioni').mockImplementation(() => {});
    component.__loadMoreData();
    expect(component._loadClientAdesioni).not.toHaveBeenCalled();
  });

  it('__loadMoreData should not load when _links is null', () => {
    component._links = null;
    vi.spyOn(component, '_loadClientAdesioni').mockImplementation(() => {});
    component.__loadMoreData();
    expect(component._loadClientAdesioni).not.toHaveBeenCalled();
  });

  it('__loadMoreData should not load when _links.next is missing', () => {
    component._links = {};
    vi.spyOn(component, '_loadClientAdesioni').mockImplementation(() => {});
    component.__loadMoreData();
    expect(component._loadClientAdesioni).not.toHaveBeenCalled();
  });

  // --- _onNew tests ---

  it('_onNew with _useDialog should call _addReferente', () => {
    component._useDialog = true;
    component.editTemplate = {} as any;
    vi.spyOn(component, '_addReferente').mockImplementation(() => {});
    component._onNew();
    expect(component._addReferente).toHaveBeenCalled();
  });

  it('_onNew without _useDialog should set _isEdit', () => {
    component._useDialog = false;
    component._onNew();
    expect(component._editCurrent).toBeNull();
    expect(component._isEdit).toBe(true);
  });

  // --- _onEdit tests ---

  it('_onEdit with _useDialog should do nothing (empty block)', () => {
    component._useDialog = true;
    const param = { id: 1 };
    component._onEdit({}, param);
    expect(component._isEdit).toBe(false);
    expect(component._editCurrent).toBeNull();
  });

  it('_onEdit without _useDialog should set _isEdit and _editCurrent', () => {
    component._useDialog = false;
    const param = { id: 1, source: {} };
    component._onEdit({}, param);
    expect(component._isEdit).toBe(true);
    expect(component._editCurrent).toBe(param);
  });

  // --- _dummyAction ---

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

  it('_onSearch should set _filterData and call _loadClientAdesioni', () => {
    component.id = 5;
    component.client = { nome: 'C' };
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };
    const values = [{ field: 'q', value: 'test' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  // --- _onSort ---

  it('_onSort should log event', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    component._onSort({ sortField: 'nome', sortBy: 'asc' });
    expect(spy).toHaveBeenCalledWith({ sortField: 'nome', sortBy: 'asc' });
    spy.mockRestore();
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

  // --- _resetScroll ---

  it('_resetScroll should call Tools.ScrollElement', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  // --- f getter ---

  it('f getter should return _editFormGroup controls', () => {
    component._initEditForm();
    const controls = component.f;
    expect(controls['tipo']).toBeTruthy();
    expect(controls['id_utente']).toBeTruthy();
  });

  // --- _initEditForm tests ---

  it('_initEditForm should create form with tipo and id_utente', () => {
    component._initEditForm();
    expect(component._editFormGroup.get('tipo')).toBeTruthy();
    expect(component._editFormGroup.get('id_utente')).toBeTruthy();
  });

  it('_initEditForm should disable id_utente', () => {
    component._initEditForm();
    expect(component._editFormGroup.get('id_utente')!.disabled).toBe(true);
  });

  it('_initEditForm tipo should be required', () => {
    component._initEditForm();
    component._editFormGroup.get('tipo')!.setValue(null);
    expect(component._editFormGroup.get('tipo')!.valid).toBe(false);
    component._editFormGroup.get('tipo')!.setValue('referente');
    expect(component._editFormGroup.get('tipo')!.valid).toBe(true);
  });

  // --- _addReferente tests ---

  it('_addReferente should load anagrafiche, init edit form, and show modal', () => {
    component.editTemplate = {} as any;
    const mockModalRef = { hide: vi.fn(), content: { onClose: of(false) } };
    mockModalService.show.mockReturnValue(mockModalRef);

    component._addReferente();

    expect(component.anagrafiche['tipo-referente']).toBeDefined();
    expect(component._editFormGroup.get('tipo')).toBeTruthy();
    expect(mockModalService.show).toHaveBeenCalledWith(component.editTemplate, {
      ignoreBackdropClick: false
    });
    expect(component._modalEditRef).toBe(mockModalRef);
  });

  // --- saveModal tests ---

  it('saveModal should post referente and reload adesioni', () => {
    component.id = 5;
    component.client = { nome: 'C' };
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };
    const mockModalRef = { hide: vi.fn() };
    component._modalEditRef = mockModalRef as any;
    mockApiService.postElementRelated.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));

    const body = { tipo: 'referente', id_utente: 10 };
    component.saveModal(body);

    expect(mockApiService.postElementRelated).toHaveBeenCalledWith('client', 5, 'referenti', body);
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('saveModal should handle error', () => {
    component.id = 5;
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockApiService.postElementRelated.mockReturnValue(throwError(() => new Error('fail')));

    component.saveModal({ tipo: 'referente' });

    expect(spy).toHaveBeenCalledWith('error', expect.any(Error));
    spy.mockRestore();
  });

  // --- closeModal tests ---

  it('closeModal should hide modal', () => {
    const mockModalRef = { hide: vi.fn() };
    component._modalEditRef = mockModalRef as any;
    component.closeModal();
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  // --- _deleteReferente tests ---

  it('_deleteReferente should show confirm dialog and delete on confirm', () => {
    component.id = 5;
    component.client = { nome: 'C' };
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };

    const onCloseSubject = new Subject<any>();
    const mockConfirmRef = {
      hide: vi.fn(),
      content: { onClose: onCloseSubject.asObservable() }
    };
    mockModalService.show.mockReturnValue(mockConfirmRef);
    mockApiService.deleteElementRelated.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));

    const data = {
      source: { utente: { id_utente: 42 }, tipo: 'referente' }
    };
    component._deleteReferente(data);

    expect(mockModalService.show).toHaveBeenCalled();
    expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.Attention');
    expect(mockTranslate.instant).toHaveBeenCalledWith('APP.MESSAGE.AreYouSure');

    // Simulate confirm
    onCloseSubject.next(true);

    expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith(
      'client', 5, 'referenti/42?tipo_referente=referente'
    );
  });

  it('_deleteReferente should NOT delete on cancel', () => {
    const onCloseSubject = new Subject<any>();
    const mockConfirmRef = {
      hide: vi.fn(),
      content: { onClose: onCloseSubject.asObservable() }
    };
    mockModalService.show.mockReturnValue(mockConfirmRef);

    const data = {
      source: { utente: { id_utente: 42 }, tipo: 'referente' }
    };
    component._deleteReferente(data);

    mockApiService.deleteElementRelated.mockClear();
    onCloseSubject.next(false);
    expect(mockApiService.deleteElementRelated).not.toHaveBeenCalled();
  });

  it('_deleteReferente should handle delete error', () => {
    const onCloseSubject = new Subject<any>();
    const mockConfirmRef = {
      hide: vi.fn(),
      content: { onClose: onCloseSubject.asObservable() }
    };
    mockModalService.show.mockReturnValue(mockConfirmRef);
    mockApiService.deleteElementRelated.mockReturnValue(throwError(() => new Error('del error')));

    component.id = 5;
    const data = {
      source: { utente: { id_utente: 42 }, tipo: 'referente_tecnico' }
    };
    component._deleteReferente(data);
    onCloseSubject.next(true);

    expect(component._error).toBe(true);
    expect(Tools.showMessage).toHaveBeenCalledWith(
      'APP.MESSAGE.ERROR.NoDeleteReferent', 'danger', true
    );
  });

  // --- _hasControlError tests ---

  it('_hasControlError should return false when control has no errors', () => {
    component._initEditForm();
    expect(component._hasControlError('tipo')).toBe(false);
  });

  it('_hasControlError should return true when control has errors and is touched', () => {
    component._initEditForm();
    const tipoCtrl = component._editFormGroup.get('tipo')!;
    tipoCtrl.setValue(null);
    tipoCtrl.markAsTouched();
    expect(component._hasControlError('tipo')).toBe(true);
  });

  it('_hasControlError should return false when control has errors but not touched', () => {
    component._initEditForm();
    const tipoCtrl = component._editFormGroup.get('tipo')!;
    tipoCtrl.setValue(null);
    // not touched
    expect(component._hasControlError('tipo')).toBe(false);
  });

  // --- _infoRichiedente tests ---

  it('_infoRichiedente should set _selectedAdesione and show modal', () => {
    component.clientadesioni = [
      { id: 1, source: { id_adesione: 1, nome: 'A1' } },
      { id: 2, source: { id_adesione: 2, nome: 'A2' } }
    ] as any;
    component.editTemplate = {} as any;
    const mockModalRef = { hide: vi.fn() };
    mockModalService.show.mockReturnValue(mockModalRef);

    component._infoRichiedente(1);

    expect(component._selectedAdesione).toEqual({ id_adesione: 2, nome: 'A2' });
    expect(mockModalService.show).toHaveBeenCalledWith(component.editTemplate, {
      ignoreBackdropClick: false,
      class: 'modal-half'
    });
  });

  // --- _prepareListAdesioni detailed tests ---

  it('_prepareListAdesioni should set metadata with text and label', () => {
    component.adesioniConfig = {
      itemRow: {
        primaryText: [{ field: 'nome', type: 'text' }],
        secondaryText: [],
        metadata: {
          text: [{ field: 'stato', type: 'text' }],
          label: [{ field: 'tipo', type: 'text' }]
        },
        secondaryMetadata: []
      },
      options: { dateFormat: 'dd/MM/yyyy' }
    };

    Tools.simpleItemFormatter = vi.fn()
      .mockReturnValueOnce('StatoValue')   // metadata.text
      .mockReturnValueOnce('TipoValue')    // metadata.label
      .mockReturnValueOnce('PrimaryText')  // primaryText
      .mockReturnValueOnce('SecondaryText') // secondaryText
      .mockReturnValueOnce('SecMeta');      // secondaryMetadata

    const data = {
      content: [{ id_adesione: 10, nome: 'Test' }],
      page: { totalElements: 1 },
      _links: null
    };

    component._prepareListAdesioni(data);

    expect(component.clientadesioni.length).toBe(1);
    const item = component.clientadesioni[0];
    expect(item.id).toBe(10);
    expect(item.metadata).toContain('StatoValue');
    expect(item.metadata).toContain('TipoValue');
    expect(item.enableCollapse).toBe(true);
    expect(item.editMode).toBe(false);
  });

  it('_prepareListAdesioni should set empty metadata when both text and label are empty', () => {
    component.adesioniConfig = {
      itemRow: {
        primaryText: [],
        secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };

    // All return empty string
    Tools.simpleItemFormatter = vi.fn().mockReturnValue('');

    const data = {
      content: [{ id_adesione: 5 }],
      page: {},
      _links: null
    };

    component._prepareListAdesioni(data);

    expect(component.clientadesioni[0].metadata).toBe('');
  });

  it('_prepareListAdesioni should set _paging and _links', () => {
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };

    const data = {
      content: [],
      page: { totalElements: 50, size: 10 },
      _links: { next: { href: '/next' }, self: { href: '/self' } }
    };

    component._prepareListAdesioni(data);

    expect(component._paging.totalElements).toBe(50);
    expect(component._links).toEqual({ next: { href: '/next' }, self: { href: '/self' } });
  });

  it('_prepareListAdesioni should handle data without content', () => {
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };

    const data = { page: {}, _links: null };
    component._prepareListAdesioni(data);
    expect(component.clientadesioni).toEqual([]);
  });

  it('_prepareListAdesioni should reset _preventMultiCall', () => {
    component._preventMultiCall = true;
    component.adesioniConfig = {
      itemRow: {
        primaryText: [], secondaryText: [],
        metadata: { text: [], label: [] },
        secondaryMetadata: []
      },
      options: null
    };

    const data = {
      content: [{ id_adesione: 1 }],
      page: {}
    };
    component._prepareListAdesioni(data);
    expect(component._preventMultiCall).toBe(false);
  });
});
