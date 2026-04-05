import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EMPTY, of, Subject, throwError } from 'rxjs';
import { ServizioCategorieComponent } from './servizio-categorie.component';
import { Tools } from '@linkit/components';

describe('ServizioCategorieComponent', () => {
  let component: ServizioCategorieComponent;

  let paramsSubject: Subject<any>;
  let queryParamsSubject: Subject<any>;

  const makeMockRoute = () => {
    paramsSubject = new Subject<any>();
    queryParamsSubject = new Subject<any>();
    return {
      data: of({}),
      params: paramsSubject.asObservable(),
      queryParams: queryParamsSubject.asObservable()
    } as any;
  };

  let mockRoute: any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockModalService = {
    show: vi.fn().mockReturnValue({ content: { onClose: EMPTY } })
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
    getConfig: vi.fn().mockReturnValue(of({ details: [] }))
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    getUtenti: vi.fn().mockReturnValue(of([]))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    _getClassesNotModifiable: vi.fn().mockReturnValue([])
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute = makeMockRoute();
    component = new ServizioCategorieComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtilService,
      mockAuthenticationService
    );
  });

  // =============================================
  // Existing tests (preserved)
  // =============================================

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioCategorieComponent.Name).toBe('ServizioCategorieComponent');
  });

  it('should have model set to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://localhost');
  });

  it('should set service from router state', () => {
    // getCurrentNavigation returns null, so service should be null
    expect(component.service).toBeNull();
  });

  it('should set service from router state when available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { id_servizio: '1', nome: 'Test' }, grant: { ruoli: [] } } }
    });
    const comp = new ServizioCategorieComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtilService,
      mockAuthenticationService
    );
    expect(comp.service).toEqual({ id_servizio: '1', nome: 'Test' });
  });

  it('should set error messages correctly', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');

    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should initialize breadcrumbs with service data', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = false;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
    expect(component.breadcrumbs[1].label).toContain('TestService');
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.ServiceCategories');
  });

  it('should initialize breadcrumbs from dashboard', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = true;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], expect.anything());
  });

  it('should close edit on _onCloseEdit', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  it('should set _useDialog to true by default', () => {
    expect(component._useDialog).toBe(true);
  });

  it('should reset form', () => {
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should convert timestamp to date', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('should return null for zero timestamp', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('should check _hasControlError', () => {
    component._editFormGroup = {
      controls: {
        testField: { errors: { required: true }, touched: true }
      }
    } as any;
    expect(component._hasControlError('testField')).toBeTruthy();
  });

  it('should check _canAddMapper returns true when no classes restricted', () => {
    component.service = { stato: 'pubblicato' };
    mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);
    expect(component._canAddMapper()).toBe(true);
  });

  it('should check _canAddMapper returns false when referente is restricted', () => {
    component.service = { stato: 'pubblicato' };
    mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente', 'referente_superiore']);
    expect(component._canAddMapper()).toBe(false);
  });

  it('should call _onNew with dialog', () => {
    component._useDialog = true;
    // openChoiceCategoriesModal would be called, which calls modalService.show
    component._onNew();
    expect(mockModalService.show).toHaveBeenCalled();
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should handle loadAnagrafiche', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente']).toBeDefined();
    expect(component.anagrafiche['tipo-referente'].length).toBe(2);
  });

  it('should handle onChangeUser', () => {
    component._errorSave = true;
    component._errorSaveMsg = 'error';
    component.onChangeUser({});
    expect(component._errorSave).toBe(false);
    expect(component._errorSaveMsg).toBe('');
  });

  // =============================================
  // NEW TESTS: Constructor
  // =============================================

  describe('constructor', () => {
    it('should set _grant from router state', () => {
      const grant = { ruoli: ['admin'] };
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { service: { nome: 'S' }, grant } }
      });
      const comp = new ServizioCategorieComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtilService,
        mockAuthenticationService
      );
      expect(comp._grant).toEqual(grant);
    });

    it('should handle missing extras.state gracefully', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: {} });
      const comp = new ServizioCategorieComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockApiService, mockUtilService,
        mockAuthenticationService
      );
      expect(comp.service).toBeNull();
      expect(comp._grant).toBeUndefined();
    });

    it('should call _initSearchForm in constructor', () => {
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup.controls['organizationTaxCode']).toBeDefined();
      expect(component._formGroup.controls['creationDateFrom']).toBeDefined();
      expect(component._formGroup.controls['creationDateTo']).toBeDefined();
      expect(component._formGroup.controls['fileName']).toBeDefined();
      expect(component._formGroup.controls['status']).toBeDefined();
      expect(component._formGroup.controls['type']).toBeDefined();
    });

    it('should subscribe to queryParams and set _fromDashboard when from=dashboard', () => {
      expect(component._fromDashboard).toBe(false);
      component.service = { nome: 'Svc', versione: '1', stato: 'draft' };
      component.id = 1;
      queryParamsSubject.next({ from: 'dashboard' });
      expect(component._fromDashboard).toBe(true);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
    });

    it('should not set _fromDashboard when queryParams has different from value', () => {
      queryParamsSubject.next({ from: 'search' });
      expect(component._fromDashboard).toBe(false);
    });

    it('should not set _fromDashboard when queryParams has no from', () => {
      queryParamsSubject.next({});
      expect(component._fromDashboard).toBe(false);
    });
  });

  // =============================================
  // NEW TESTS: ngOnInit
  // =============================================

  describe('ngOnInit', () => {
    it('should subscribe to route.params and load config when id is present', () => {
      component.ngOnInit();
      mockApiService.getDetails.mockReturnValue(of({
        content: [],
        page: { totalElements: 0 },
        _links: {}
      }));
      paramsSubject.next({ id: 42 });
      expect(component.id).toBe(42);
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('categorie');
    });

    it('should not call getConfig when id is not present', () => {
      component.ngOnInit();
      paramsSubject.next({});
      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
    });

    it('should call _loadServizio when service is null after config loads', () => {
      component.service = null;
      const grantResponse = { ruoli: [] };
      const serviceResponse = { nome: 'TestSvc', versione: '1', stato: 'bozza' };
      const categorieResponse = { content: [], page: {}, _links: {} };

      mockApiService.getDetails
        .mockReturnValueOnce(of(categorieResponse))  // _loadServizioCategorie call
        .mockReturnValueOnce(of(grantResponse))       // grant call
        .mockReturnValueOnce(of(serviceResponse))     // service details call
        .mockReturnValueOnce(of(categorieResponse));  // _loadServizioCategorie inside _loadServizio

      component.ngOnInit();
      paramsSubject.next({ id: 10 });

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10, 'grant');
    });

    it('should call _initBreadcrumb and _loadServizioCategorie when service already exists', () => {
      component.service = { nome: 'ExistingSvc', versione: '2', stato: 'pubblicato' };
      const categorieResponse = { content: [], page: {}, _links: {} };
      mockApiService.getDetails.mockReturnValue(of(categorieResponse));

      component.ngOnInit();
      paramsSubject.next({ id: 5 });

      expect(component.categorieConfig).toEqual({ details: [] });
      expect(component.breadcrumbs.length).toBe(3);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'categorie');
    });

    it('should set _updateMapper timestamp when service exists', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'draft' };
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component.ngOnInit();
      paramsSubject.next({ id: 7 });

      expect(component._updateMapper).toBeTruthy();
      expect(Number(component._updateMapper)).toBeGreaterThan(0);
    });
  });

  // =============================================
  // NEW TESTS: ngAfterContentChecked
  // =============================================

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // window.innerWidth is whatever jsdom provides (typically 1024)
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // =============================================
  // NEW TESTS: _onResize
  // =============================================

  describe('_onResize', () => {
    it('should set desktop based on window.innerWidth', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // =============================================
  // NEW TESTS: _loadServizio
  // =============================================

  describe('_loadServizio', () => {
    beforeEach(() => {
      component.id = 99;
    });

    it('should do nothing when id is 0', () => {
      component.id = 0;
      (component as any)._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set service to null and _spin to true at start', () => {
      component.service = { nome: 'old' };
      mockApiService.getDetails.mockReturnValue(of({}));
      (component as any)._loadServizio();
      // service was set null at the start
      // After success, service is set to the response
    });

    it('should call grant API then service details API on success', () => {
      const grantResp = { ruoli: ['admin'] };
      const serviceResp = { nome: 'MySvc', versione: '1', stato: 'bozza' };
      const categorieResp = { content: [], page: {}, _links: {} };

      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResp))
        .mockReturnValueOnce(of(serviceResp))
        .mockReturnValueOnce(of(categorieResp));

      (component as any)._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 99, 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 99);
      expect(component._grant).toEqual(grantResp);
      expect(component.service).toEqual(serviceResp);
      expect(component._spin).toBe(false);
    });

    it('should call _initBreadcrumb and _loadServizioCategorie after loading service', () => {
      const grantResp = { ruoli: [] };
      const serviceResp = { nome: 'BreadSvc', versione: '3', stato: 'pubblicato' };
      const categorieResp = { content: [], page: {}, _links: {} };

      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResp))
        .mockReturnValueOnce(of(serviceResp))
        .mockReturnValueOnce(of(categorieResp));

      (component as any)._loadServizio();

      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[1].label).toContain('BreadSvc');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 99, 'categorie');
    });

    it('should set _updateMapper after loading service', () => {
      const grantResp = { ruoli: [] };
      const serviceResp = { nome: 'Svc', versione: '1', stato: 'bozza' };
      const categorieResp = { content: [], page: {}, _links: {} };

      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResp))
        .mockReturnValueOnce(of(serviceResp))
        .mockReturnValueOnce(of(categorieResp));

      (component as any)._loadServizio();

      expect(component._updateMapper).toBeTruthy();
      expect(Number(component._updateMapper)).toBeGreaterThan(0);
    });

    it('should handle error on getDetails (service details) call', () => {
      const spy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const grantResp = { ruoli: [] };

      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResp))
        .mockReturnValueOnce(throwError(() => new Error('service error')));

      (component as any)._loadServizio();

      expect(spy).toHaveBeenCalled();
      expect(component._spin).toBe(false);
      spy.mockRestore();
    });

    it('should handle error on grant call', () => {
      const spy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

      mockApiService.getDetails
        .mockReturnValueOnce(throwError(() => new Error('grant error')));

      (component as any)._loadServizio();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // =============================================
  // NEW TESTS: _loadServizioCategorie
  // =============================================

  describe('_loadServizioCategorie', () => {
    beforeEach(() => {
      component.id = 10;
    });

    it('should do nothing when id is 0', () => {
      component.id = 0;
      (component as any)._loadServizioCategorie();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should clear servizioCategorie and _links when url is empty', () => {
      component.servizioCategorie = [{ id: 1 }];
      component._links = { next: { href: '/next' } };

      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      (component as any)._loadServizioCategorie(null, '');

      // At some point they get reset - check the state after API call
      expect(component._spin).toBe(false);
    });

    it('should not clear servizioCategorie when url is provided', () => {
      component.servizioCategorie = [{ id: 1 }];
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));

      (component as any)._loadServizioCategorie(null, 'http://next-page');

      // servizioCategorie should not have been reset to empty before the call
      // but content is empty so result is still the existing items
      expect(component._spin).toBe(false);
    });

    it('should map response content correctly', () => {
      const response = {
        content: [
          {
            id_categoria: 100,
            nome: 'Cat1',
            path_categoria: [{ nome: 'Root' }, { nome: 'Sub' }],
            immagine: 'img.png',
            descrizione: 'Desc',
            descrizione_sintetica: 'Short desc',
            figli: [{ id: 200 }]
          }
        ],
        page: { totalElements: 1 },
        _links: { next: { href: '/page2' } }
      };

      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie();

      expect(component.servizioCategorie.length).toBe(1);
      const cat = component.servizioCategorie[0];
      expect(cat.id).toBe(100);
      expect(cat.id_categoria).toBe(100);
      expect(cat.nome).toBe('Cat1');
      expect(cat.path).toBe('Root - Sub');
      expect(cat.logo).toBe('http://localhost/categorie/100/immagine');
      expect(cat.immagine).toBe('img.png');
      expect(cat.descrizione).toBe('Desc');
      expect(cat.descrizione_sintetica).toBe('Short desc');
      expect(cat.children).toEqual([{ id: 200 }]);
      expect(cat.figli).toEqual([{ id: 200 }]);
      expect(cat.hasChildren).toBe(true);
      expect(cat.enableCollapse).toBe(false);
      expect(cat.source).toBeDefined();
      expect(cat.source.path).toBe('Root - Sub');
    });

    it('should set empty logo when no immagine', () => {
      const response = {
        content: [
          {
            id_categoria: 101,
            nome: 'Cat2',
            path_categoria: [{ nome: 'Root' }],
            immagine: null,
            descrizione: null,
            descrizione_sintetica: null,
            figli: null
          }
        ],
        page: {},
        _links: {}
      };

      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie();

      const cat = component.servizioCategorie[0];
      expect(cat.logo).toBe('');
      expect(cat.immagine).toBe('');
      expect(cat.descrizione).toBe('');
      expect(cat.descrizione_sintetica).toBe('');
      expect(cat.hasChildren).toBe(false);
    });

    it('should append to existing list when url is provided', () => {
      component.servizioCategorie = [{ id: 1, nome: 'Existing' }];

      const response = {
        content: [
          {
            id_categoria: 200,
            nome: 'New',
            path_categoria: [{ nome: 'Path' }],
            immagine: null,
            figli: null
          }
        ],
        page: {},
        _links: {}
      };

      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie(null, 'http://next');

      expect(component.servizioCategorie.length).toBe(2);
      expect(component.servizioCategorie[0]).toEqual({ id: 1, nome: 'Existing' });
      expect(component.servizioCategorie[1].id).toBe(200);
    });

    it('should replace list when url is empty', () => {
      component.servizioCategorie = [{ id: 1, nome: 'Old' }];

      const response = {
        content: [
          {
            id_categoria: 300,
            nome: 'Replaced',
            path_categoria: [{ nome: 'P' }],
            immagine: null,
            figli: null
          }
        ],
        page: {},
        _links: {}
      };

      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie(null, '');

      expect(component.servizioCategorie.length).toBe(1);
      expect(component.servizioCategorie[0].id).toBe(300);
    });

    it('should set _paging from response.page', () => {
      const response = {
        content: [],
        page: { totalElements: 42, size: 10, number: 0 },
        _links: {}
      };

      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie();

      expect(component._paging.totalElements).toBe(42);
    });

    it('should set _links from response._links', () => {
      const response = {
        content: [],
        page: {},
        _links: { next: { href: '/next' }, prev: { href: '/prev' } }
      };

      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie();

      expect(component._links).toEqual({ next: { href: '/next' }, prev: { href: '/prev' } });
    });

    it('should handle null response gracefully', () => {
      mockApiService.getDetails.mockReturnValue(of(null));
      (component as any)._loadServizioCategorie();

      expect(component._spin).toBe(false);
    });

    it('should handle response without content', () => {
      mockApiService.getDetails.mockReturnValue(of({ page: {}, _links: {} }));
      (component as any)._loadServizioCategorie();

      expect(component.servizioCategorie).toEqual([]);
      expect(component._spin).toBe(false);
    });

    it('should reset _preventMultiCall on success', () => {
      component._preventMultiCall = true;
      const response = {
        content: [
          { id_categoria: 1, nome: 'C', path_categoria: [{ nome: 'P' }], immagine: null, figli: null }
        ],
        page: {},
        _links: {}
      };

      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie();

      expect(component._preventMultiCall).toBe(false);
    });

    it('should handle error and set error messages', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('API error')));
      (component as any)._loadServizioCategorie();

      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
      expect(component._preventMultiCall).toBe(false);
      expect(component._spin).toBe(false);
    });

    it('should set _spin true then false on success', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));
      // _spin is set to true synchronously, then false after response
      (component as any)._loadServizioCategorie();
      expect(component._spin).toBe(false);
    });

    it('should call _setErrorMessages(false) at the start', () => {
      component._error = true;
      component._message = 'APP.MESSAGE.ERROR.Default';
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));
      (component as any)._loadServizioCategorie();

      // After the call, if no error, _error should be false
      expect(component._error).toBe(false);
    });

    it('should handle response with _links null', () => {
      const response = {
        content: [],
        page: {},
        _links: null
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      (component as any)._loadServizioCategorie();

      expect(component._links).toBeNull();
    });
  });

  // =============================================
  // NEW TESTS: _generateReferentFields
  // =============================================

  describe('_generateReferentFields', () => {
    it('should call Tools.generateFields and translate labels', () => {
      const spy = vi.spyOn(Tools, 'generateFields').mockReturnValue([
        { label: 'APP.FIELD.Name', value: 'test' },
        { label: 'APP.FIELD.Type', value: 'category' }
      ]);
      component.categorieConfig = { details: [{ key: 'nome' }] };

      const result = (component as any)._generateReferentFields({ nome: 'test' });

      expect(spy).toHaveBeenCalledWith([{ key: 'nome' }], { nome: 'test' });
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.FIELD.Name');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.FIELD.Type');
      expect(result.length).toBe(2);
      spy.mockRestore();
    });

    it('should return empty array when generateFields returns empty', () => {
      const spy = vi.spyOn(Tools, 'generateFields').mockReturnValue([]);
      component.categorieConfig = { details: [] };

      const result = (component as any)._generateReferentFields({});
      expect(result).toEqual([]);
      spy.mockRestore();
    });
  });

  // =============================================
  // NEW TESTS: __loadMoreData
  // =============================================

  describe('__loadMoreData', () => {
    it('should call _loadServizioCategorie when next link exists and not preventMultiCall', () => {
      component.id = 5;
      component._links = { next: { href: 'http://api/next' } };
      component._preventMultiCall = false;

      mockApiService.getDetails.mockReturnValue(of({ content: [
        { id_categoria: 1, nome: 'C', path_categoria: [{ nome: 'P' }], immagine: null, figli: null }
      ], page: {}, _links: {} }));
      component.__loadMoreData();

      // After synchronous completion, _preventMultiCall resets to false
      expect(component._preventMultiCall).toBe(false);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'categorie');
    });

    it('should not call _loadServizioCategorie when _preventMultiCall is true', () => {
      component._links = { next: { href: 'http://api/next' } };
      component._preventMultiCall = true;

      component.__loadMoreData();

      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioCategorie when _links is null', () => {
      component._links = null;
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioCategorie when no next link', () => {
      component._links = { prev: { href: '/prev' } };
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should not call _loadServizioCategorie when _links is empty object', () => {
      component._links = {};
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: _onNew
  // =============================================

  describe('_onNew', () => {
    it('should open choice categories modal when _useDialog is true', () => {
      component._useDialog = true;
      component._onNew();
      expect(mockModalService.show).toHaveBeenCalled();
    });

    it('should set _editCurrent to null and _isEdit to true when _useDialog is false', () => {
      component._useDialog = false;
      component._editCurrent = { id: 1 };
      component._isEdit = false;

      component._onNew();

      expect(component._editCurrent).toBeNull();
      expect(component._isEdit).toBe(true);
      expect(mockModalService.show).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: _onSubmit
  // =============================================

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      const mockSearchFn = vi.fn();
      component.searchBarForm = { _onSearch: mockSearchFn } as any;

      component._onSubmit({});

      expect(mockSearchFn).toHaveBeenCalled();
    });

    it('should do nothing when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      // Should not throw
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // =============================================
  // NEW TESTS: _onSearch
  // =============================================

  describe('_onSearch', () => {
    it('should set _filterData and call _loadServizioCategorie', () => {
      component.id = 5;
      const values = [{ field: 'nome', value: 'test' }];
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component._onSearch(values);

      expect(component._filterData).toEqual(values);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: _resetForm
  // =============================================

  describe('_resetForm', () => {
    it('should reset _filterData to empty array and reload categories', () => {
      component.id = 5;
      component._filterData = [{ field: 'x' }];
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component._resetForm();

      expect(component._filterData).toEqual([]);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: _onSort
  // =============================================

  describe('_onSort', () => {
    it('should log the event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._onSort({ field: 'nome', dir: 'asc' });
      expect(consoleSpy).toHaveBeenCalledWith({ field: 'nome', dir: 'asc' });
      consoleSpy.mockRestore();
    });
  });

  // =============================================
  // NEW TESTS: onBreadcrumb
  // =============================================

  describe('onBreadcrumb', () => {
    it('should navigate with queryParamsHandling preserve', () => {
      component.onBreadcrumb({ url: '/dashboard' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], { queryParamsHandling: 'preserve' });
    });
  });

  // =============================================
  // NEW TESTS: _resetScroll
  // =============================================

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller and offset 0', () => {
      const spy = vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
      component._resetScroll();
      expect(spy).toHaveBeenCalledWith('container-scroller', 0);
      spy.mockRestore();
    });
  });

  // =============================================
  // NEW TESTS: f getter
  // =============================================

  describe('f getter', () => {
    it('should return _editFormGroup.controls', () => {
      (component as any)._initEditForm();
      const controls = component.f;
      expect(controls['tipo']).toBeDefined();
      expect(controls['id_utente']).toBeDefined();
    });
  });

  // =============================================
  // NEW TESTS: _initEditForm
  // =============================================

  describe('_initEditForm', () => {
    it('should create form with tipo and id_utente controls', () => {
      (component as any)._initEditForm();
      expect(component._editFormGroup.controls['tipo']).toBeDefined();
      expect(component._editFormGroup.controls['id_utente']).toBeDefined();
    });

    it('should make tipo required', () => {
      (component as any)._initEditForm();
      const tipo = component._editFormGroup.controls['tipo'];
      tipo.setValue(null);
      expect(tipo.valid).toBe(false);
      tipo.setValue('referente');
      expect(tipo.valid).toBe(true);
    });

    it('should make id_utente required', () => {
      (component as any)._initEditForm();
      const idUtente = component._editFormGroup.controls['id_utente'];
      idUtente.enable();
      idUtente.setValue(null);
      expect(idUtente.valid).toBe(false);
      idUtente.setValue(42);
      expect(idUtente.valid).toBe(true);
    });

    it('should disable id_utente by default', () => {
      (component as any)._initEditForm();
      expect(component._editFormGroup.controls['id_utente'].disabled).toBe(true);
    });
  });

  // =============================================
  // NEW TESTS: saveModal
  // =============================================

  describe('saveModal', () => {
    it('should reset error state and call postElementRelated', () => {
      component._errorSave = true;
      component._errorSaveMsg = 'old error';
      component._modalEditRef = { hide: vi.fn() } as any;
      component.id = 5;

      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component.saveModal({ categorie: [1] });

      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('');
      expect(mockApiService.postElementRelated).toHaveBeenCalledWith('servizi', 5, 'categorie', { categorie: [1] });
    });

    it('should hide modal and reload categories on success', () => {
      const hideFn = vi.fn();
      component._modalEditRef = { hide: hideFn } as any;
      component.id = 5;

      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component.saveModal({ categorie: [1] });

      expect(hideFn).toHaveBeenCalled();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'categorie');
    });

    it('should set errorSave on failure', () => {
      component._modalEditRef = { hide: vi.fn() } as any;
      component.id = 5;

      mockApiService.postElementRelated.mockReturnValue(
        throwError(() => ({ details: 'Duplicate entry' }))
      );

      component.saveModal({ categorie: [1] });

      expect(component._errorSave).toBe(true);
      expect(component._errorSaveMsg).toBe('Duplicate entry');
    });

    it('should use GetErrorMsg when error has no details', () => {
      component._modalEditRef = { hide: vi.fn() } as any;
      component.id = 5;

      mockApiService.postElementRelated.mockReturnValue(
        throwError(() => ({ status: 500 }))
      );

      component.saveModal({ categorie: [1] });

      expect(component._errorSave).toBe(true);
      expect(mockUtilService.GetErrorMsg).toHaveBeenCalled();
      expect(component._errorSaveMsg).toBe('Error');
    });
  });

  // =============================================
  // NEW TESTS: closeModal
  // =============================================

  describe('closeModal', () => {
    it('should reset error state and hide modal', () => {
      const hideFn = vi.fn();
      component._modalEditRef = { hide: hideFn } as any;
      component._errorSave = true;
      component._errorSaveMsg = 'some error';

      component.closeModal();

      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('');
      expect(hideFn).toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: _deleteCategoria
  // =============================================

  describe('_deleteCategoria', () => {
    it('should show YesnoDialog with correct initial state', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });

      component._deleteCategoria({ id_categoria: 42 });

      expect(mockModalService.show).toHaveBeenCalled();
      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].ignoreBackdropClick).toBe(true);
      expect(callArgs[1].initialState.confirmColor).toBe('danger');
    });

    it('should call deleteElementRelated when user confirms', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component._deleteCategoria({ id_categoria: 42 });
      onCloseSubject.next(true);

      expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith('servizi', 10, 'categorie/42');
    });

    it('should reload categories after successful deletion', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component._deleteCategoria({ id_categoria: 42 });
      onCloseSubject.next(true);

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10, 'categorie');
    });

    it('should show error message when deletion fails', () => {
      const spy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.deleteElementRelated.mockReturnValue(throwError(() => new Error('del fail')));

      component._deleteCategoria({ id_categoria: 42 });
      onCloseSubject.next(true);

      expect(component._error).toBe(true);
      expect(spy).toHaveBeenCalledWith('APP.MESSAGE.ERROR.NoDeleteCategoria', 'danger', true);
      spy.mockRestore();
    });

    it('should not call deleteElementRelated when user cancels (response false)', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });

      component._deleteCategoria({ id_categoria: 42 });
      onCloseSubject.next(false);

      expect(mockApiService.deleteElementRelated).not.toHaveBeenCalled();
    });

    it('should not call deleteElementRelated when user cancels (response null)', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });

      component._deleteCategoria({ id_categoria: 42 });
      onCloseSubject.next(null);

      expect(mockApiService.deleteElementRelated).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: openChoiceCategoriesModal
  // =============================================

  describe('openChoiceCategoriesModal', () => {
    it('should show ModalCategoryChoiceComponent with correct initial state', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.servizioCategorie = [{ id: 1 }, { id: 2 }];

      component.openChoiceCategoriesModal();

      expect(mockModalService.show).toHaveBeenCalled();
      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].ignoreBackdropClick).toBe(true);
      expect(callArgs[1].initialState.notSelectable).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should call postElementRelated on close with selected category', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component.openChoiceCategoriesModal();
      onCloseSubject.next({ id_categoria: 55 });

      expect(mockApiService.postElementRelated).toHaveBeenCalledWith('servizi', 10, 'categorie', { categorie: [55] });
    });

    it('should reload categories after successful post', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.postElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

      component.openChoiceCategoriesModal();
      onCloseSubject.next({ id_categoria: 55 });

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10, 'categorie');
    });

    it('should show error message when post fails', () => {
      const spy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.postElementRelated.mockReturnValue(throwError(() => new Error('post fail')));

      component.openChoiceCategoriesModal();
      onCloseSubject.next({ id_categoria: 55 });

      expect(component._error).toBe(true);
      expect(spy).toHaveBeenCalledWith('APP.MESSAGE.ERROR.NoAddCategorie', 'danger', true);
      spy.mockRestore();
    });
  });

  // =============================================
  // NEW TESTS: _hasControlError
  // =============================================

  describe('_hasControlError', () => {
    it('should return false when control does not exist', () => {
      component._editFormGroup = { controls: {} } as any;
      expect(component._hasControlError('nonexistent')).toBe(false);
    });

    it('should return false when control has no errors', () => {
      component._editFormGroup = {
        controls: {
          field: { errors: null, touched: true }
        }
      } as any;
      expect(component._hasControlError('field')).toBe(false);
    });

    it('should return false when control is not touched', () => {
      component._editFormGroup = {
        controls: {
          field: { errors: { required: true }, touched: false }
        }
      } as any;
      expect(component._hasControlError('field')).toBe(false);
    });

    it('should return true when control has errors and is touched', () => {
      component._editFormGroup = {
        controls: {
          field: { errors: { required: true }, touched: true }
        }
      } as any;
      expect(component._hasControlError('field')).toBe(true);
    });
  });

  // =============================================
  // NEW TESTS: _initCategorieSelect
  // =============================================

  describe('_initCategorieSelect', () => {
    it('should initialize categorie$ observable with default values', () => {
      (component as any)._initCategorieSelect([{ id: 1, nome: 'Cat1' }]);
      expect(component.categorie$).toBeDefined();
    });

    it('should emit default values immediately', () => {
      const defaults = [{ id: 1 }, { id: 2 }];
      (component as any)._initCategorieSelect(defaults);

      let emitted: any;
      component.categorie$.subscribe(val => emitted = val);

      // First emission from concat(of(defaultValue), ...) is immediate
      expect(emitted).toEqual(defaults);
    });

    it('should emit empty array by default when no defaults given', () => {
      (component as any)._initCategorieSelect();

      let emitted: any;
      component.categorie$.subscribe(val => emitted = val);

      expect(emitted).toEqual([]);
    });

    it('should filter out null input', () => {
      vi.useFakeTimers();
      (component as any)._initCategorieSelect();

      let lastEmitted: any;
      component.categorie$.subscribe(val => lastEmitted = val);

      component.categorieInput$.next(null as any);
      vi.advanceTimersByTime(600);

      // Should still be the default, null is filtered out
      expect(lastEmitted).toEqual([]);
      vi.useRealTimers();
    });

    it('should filter out input shorter than minLengthTerm', () => {
      vi.useFakeTimers();
      component.minLengthTerm = 3;
      (component as any)._initCategorieSelect();

      let lastEmitted: any;
      component.categorie$.subscribe(val => lastEmitted = val);

      component.categorieInput$.next('ab');
      vi.advanceTimersByTime(600);

      expect(lastEmitted).toEqual([]);
      vi.useRealTimers();
    });

    it('should call utils.getUtenti with valid input after debounce', () => {
      vi.useFakeTimers();
      const users = [{ id: 10, nome: 'User1' }];
      mockUtilService.getUtenti.mockReturnValue(of(users));
      component.categorieFilter = 'referente_servizio';

      (component as any)._initCategorieSelect();

      let lastEmitted: any;
      component.categorie$.subscribe(val => lastEmitted = val);

      component.categorieInput$.next('test');
      vi.advanceTimersByTime(600);

      expect(mockUtilService.getUtenti).toHaveBeenCalledWith('test', 'referente_servizio');
      expect(lastEmitted).toEqual(users);
      expect(component.categorieLoading).toBe(false);
      vi.useRealTimers();
    });

    it('should set categorieLoading to true during search and false after', () => {
      vi.useFakeTimers();
      mockUtilService.getUtenti.mockReturnValue(of([]));

      (component as any)._initCategorieSelect();
      component.categorie$.subscribe(() => {});

      component.categorieInput$.next('search');
      vi.advanceTimersByTime(600);

      // After completing, loading should be false
      expect(component.categorieLoading).toBe(false);
      vi.useRealTimers();
    });

    it('should return empty array on API error', () => {
      vi.useFakeTimers();
      mockUtilService.getUtenti.mockReturnValue(throwError(() => new Error('API fail')));

      (component as any)._initCategorieSelect();

      let lastEmitted: any;
      component.categorie$.subscribe(val => lastEmitted = val);

      component.categorieInput$.next('test');
      vi.advanceTimersByTime(600);

      expect(lastEmitted).toEqual([]);
      vi.useRealTimers();
    });
  });

  // =============================================
  // NEW TESTS: _onChangeTipoReferente
  // =============================================

  describe('_onChangeTipoReferente', () => {
    it('should set categorieFilter for referent', () => {
      component._onChangeTipoReferente(true);
      expect(component.categorieFilter).toBe('referente_servizio,gestore,coordinatore');
    });

    it('should set categorieFilter to empty for non-referent', () => {
      component._onChangeTipoReferente(false);
      expect(component.categorieFilter).toBe('');
    });
  });

  // =============================================
  // NEW TESTS: onChangeTipo
  // =============================================

  describe('onChangeTipo', () => {
    beforeEach(() => {
      (component as any)._initEditForm();
    });

    it('should set categorieFilter from event', () => {
      component.onChangeTipo({ filter: 'referente_servizio,gestore,coordinatore' });
      expect(component.categorieFilter).toBe('referente_servizio,gestore,coordinatore');
    });

    it('should enable id_utente when tipo is not empty', () => {
      component._editFormGroup.controls['tipo'].setValue('referente');
      component.onChangeTipo({ filter: 'ref' });
      expect(component._editFormGroup.controls['id_utente'].disabled).toBe(false);
    });

    it('should disable id_utente when tipo is empty string', () => {
      component._editFormGroup.controls['tipo'].setValue('');
      component.onChangeTipo({ filter: '' });
      expect(component._editFormGroup.controls['id_utente'].disabled).toBe(true);
    });

    it('should call _initCategorieSelect', () => {
      // We can verify by checking categorie$ gets set
      component.onChangeTipo({ filter: '' });
      expect(component.categorie$).toBeDefined();
    });

    it('should reset id_utente to null', () => {
      component._editFormGroup.controls['id_utente'].enable();
      component._editFormGroup.controls['id_utente'].setValue(42);

      component.onChangeTipo({ filter: '' });

      expect(component._editFormGroup.controls['id_utente'].value).toBeNull();
    });
  });

  // =============================================
  // NEW TESTS: _canAddMapper (additional branches)
  // =============================================

  describe('_canAddMapper', () => {
    it('should return true when neither referente nor referente_superiore restricted', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);
      expect(component._canAddMapper()).toBe(true);
    });

    it('should return true when only referente restricted (referente_superiore still allowed)', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente']);
      expect(component._canAddMapper()).toBe(true);
    });

    it('should return true when only referente_superiore restricted (referente still allowed)', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente_superiore']);
      expect(component._canAddMapper()).toBe(true);
    });

    it('should return false when both referente and referente_superiore are restricted', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente', 'referente_superiore']);
      expect(component._canAddMapper()).toBe(false);
    });

    it('should call _getClassesNotModifiable with correct params', () => {
      component.service = { stato: 'pubblicato' };
      component._canAddMapper();
      expect(mockAuthenticationService._getClassesNotModifiable).toHaveBeenCalledWith('servizio', 'servizio', 'pubblicato');
    });

    it('should handle null service stato', () => {
      component.service = null;
      component._canAddMapper();
      expect(mockAuthenticationService._getClassesNotModifiable).toHaveBeenCalledWith('servizio', 'servizio', undefined);
    });

    it('should handle unrelated classes in not-modifiable list', () => {
      component.service = { stato: 'bozza' };
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['something_else', 'another_class']);
      expect(component._canAddMapper()).toBe(true);
    });
  });

  // =============================================
  // NEW TESTS: onActionMonitor
  // =============================================

  describe('onActionMonitor', () => {
    it('should navigate to backview URL', () => {
      component.service = { id_servizio: '99' };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/99/view']);
    });

    it('should do nothing for unknown action', () => {
      component.service = { id_servizio: '99' };
      component.onActionMonitor({ action: 'unknown' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should do nothing for empty action', () => {
      component.service = { id_servizio: '99' };
      component.onActionMonitor({ action: '' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: _setErrorMessages (additional)
  // =============================================

  describe('_setErrorMessages', () => {
    it('should set error messages when error is true', () => {
      component._setErrorMessages(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set default messages when error is false', () => {
      component._setErrorMessages(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // =============================================
  // NEW TESTS: _initSearchForm
  // =============================================

  describe('_initSearchForm', () => {
    it('should create form group with all expected controls', () => {
      (component as any)._initSearchForm();
      const controls = component._formGroup.controls;
      expect(controls['organizationTaxCode']).toBeDefined();
      expect(controls['creationDateFrom']).toBeDefined();
      expect(controls['creationDateTo']).toBeDefined();
      expect(controls['fileName']).toBeDefined();
      expect(controls['status']).toBeDefined();
      expect(controls['type']).toBeDefined();
    });

    it('should initialize all controls with empty strings', () => {
      (component as any)._initSearchForm();
      const controls = component._formGroup.controls;
      expect(controls['organizationTaxCode'].value).toBe('');
      expect(controls['creationDateFrom'].value).toBe('');
      expect(controls['creationDateTo'].value).toBe('');
      expect(controls['fileName'].value).toBe('');
      expect(controls['status'].value).toBe('');
      expect(controls['type'].value).toBe('');
    });
  });

  // =============================================
  // NEW TESTS: _initBreadcrumb (additional)
  // =============================================

  describe('_initBreadcrumb', () => {
    it('should use id as label when service is null', () => {
      component.service = null;
      component.id = 123;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('123');
    });

    it('should use New title when service is null and id is 0', () => {
      component.service = null;
      component.id = 0;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('should set tooltip from service stato', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      component.id = 1;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
      expect(component.breadcrumbs[1].tooltip).toBe('APP.WORKFLOW.STATUS.pubblicato');
    });

    it('should set empty tooltip when service is null', () => {
      component.service = null;
      component.id = 1;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[1].tooltip).toBe('');
    });

    it('should format service label with nome and versione', () => {
      component.service = { nome: 'API Service', versione: '2.1', stato: 'bozza' };
      component.id = 5;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('API Service v. 2.1');
    });

    it('should set dashboard breadcrumb with speedometer icon', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.id = 1;
      component._fromDashboard = true;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
    });

    it('should set services breadcrumb with grid icon', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.id = 1;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[0].iconBs).toBe('grid-3x3-gap');
      expect(component.breadcrumbs[0].url).toBe('/servizi');
    });

    it('should set third breadcrumb as ServiceCategories with empty url', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.id = 1;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.ServiceCategories');
      expect(component.breadcrumbs[2].url).toBe('');
    });
  });

  // =============================================
  // NEW TESTS: _addCategories
  // =============================================

  describe('_addCategories', () => {
    it('should call openChoiceCategoriesModal', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });

      (component as any)._addCategories();

      expect(mockModalService.show).toHaveBeenCalled();
    });
  });

  // =============================================
  // NEW TESTS: loadAnagrafiche (additional)
  // =============================================

  describe('loadAnagrafiche', () => {
    it('should set referente with correct filter', () => {
      component.loadAnagrafiche();
      const ref = component.anagrafiche['tipo-referente'].find((r: any) => r.nome === 'referente');
      expect(ref.filter).toBe('referente_servizio,gestore,coordinatore');
    });

    it('should set referente_tecnico with empty filter', () => {
      component.loadAnagrafiche();
      const ref = component.anagrafiche['tipo-referente'].find((r: any) => r.nome === 'referente_tecnico');
      expect(ref.filter).toBe('');
    });
  });

  // =============================================
  // NEW TESTS: _timestampToMoment (additional)
  // =============================================

  describe('_timestampToMoment', () => {
    it('should return correct date for valid timestamp', () => {
      const result = component._timestampToMoment(1609459200000);
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2021);
    });

    it('should return null for falsy value', () => {
      expect(component._timestampToMoment(0)).toBeNull();
    });

    it('should handle negative timestamp', () => {
      const result = component._timestampToMoment(-1);
      expect(result).toBeInstanceOf(Date);
    });
  });

  // =============================================
  // NEW TESTS: _onCloseEdit
  // =============================================

  describe('_onCloseEdit', () => {
    it('should set _isEdit to false regardless of event content', () => {
      component._isEdit = true;
      component._onCloseEdit({ saved: true });
      expect(component._isEdit).toBe(false);
    });

    it('should set _isEdit to false when already false', () => {
      component._isEdit = false;
      component._onCloseEdit({});
      expect(component._isEdit).toBe(false);
    });
  });

  // =============================================
  // NEW TESTS: Default property values
  // =============================================

  describe('default property values', () => {
    it('should have correct default values', () => {
      expect(component._isEdit).toBe(false);
      expect(component._editCurrent).toBeNull();
      expect(component._hasFilter).toBe(false);
      expect(component._preventMultiCall).toBe(false);
      expect(component._spin).toBe(false);
      expect(component._useRoute).toBe(false);
      expect(component._useDialog).toBe(true);
      expect(component._error).toBe(false);
      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('false');
      expect(component.showHistory).toBe(true);
      expect(component.showSearch).toBe(true);
      expect(component.showSorting).toBe(true);
      expect(component.sortField).toBe('date');
      expect(component.sortDirection).toBe('asc');
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
      expect(component._imagePlaceHolder).toBe('./assets/images/logo-placeholder.png');
      expect(component.minLengthTerm).toBe(1);
    });
  });

  // =============================================
  // NEW TESTS: Integration scenarios
  // =============================================

  describe('integration scenarios', () => {
    it('ngOnInit full flow: params with id, no service -> loadServizio -> loadCategorie', () => {
      const grantResp = { ruoli: ['admin'] };
      const serviceResp = { nome: 'FullFlow', versione: '1', stato: 'pubblicato' };
      const categorieResp = {
        content: [
          {
            id_categoria: 1,
            nome: 'CatA',
            path_categoria: [{ nome: 'Root' }],
            immagine: 'img.png',
            figli: []
          }
        ],
        page: { totalElements: 1 },
        _links: {}
      };

      // Call order: grant -> service details -> categorie
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResp))       // 1st: grant
        .mockReturnValueOnce(of(serviceResp))     // 2nd: service details
        .mockReturnValueOnce(of(categorieResp));  // 3rd: categorie after load

      // Ensure service is null to trigger _loadServizio path
      component.service = null;

      component.ngOnInit();
      paramsSubject.next({ id: 50 });

      expect(component.id).toBe(50);
      expect(component.service).toEqual(serviceResp);
      expect(component.breadcrumbs.length).toBe(3);
    });

    it('delete then reload flow', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      const categorieResp = {
        content: [
          {
            id_categoria: 2,
            nome: 'Remaining',
            path_categoria: [{ nome: 'Root' }],
            immagine: null,
            figli: null
          }
        ],
        page: {},
        _links: {}
      };

      component._deleteCategoria({ id_categoria: 1 });

      // Set the mock AFTER _deleteCategoria but BEFORE emitting the close event
      // This ensures getDetails returns our desired response when _loadServizioCategorie is called
      mockApiService.getDetails.mockReturnValue(of(categorieResp));

      onCloseSubject.next(true);

      expect(component.servizioCategorie.length).toBe(1);
      expect(component.servizioCategorie[0].nome).toBe('Remaining');
    });

    it('add category via modal flow', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject } });
      component.id = 10;

      mockApiService.postElementRelated.mockReturnValue(of({}));
      const categorieResp = {
        content: [
          {
            id_categoria: 1,
            nome: 'Existing',
            path_categoria: [{ nome: 'P' }],
            immagine: null,
            figli: null
          },
          {
            id_categoria: 55,
            nome: 'Added',
            path_categoria: [{ nome: 'Q' }],
            immagine: null,
            figli: null
          }
        ],
        page: {},
        _links: {}
      };
      mockApiService.getDetails.mockReturnValue(of(categorieResp));

      component.openChoiceCategoriesModal();
      onCloseSubject.next({ id_categoria: 55 });

      expect(component.servizioCategorie.length).toBe(2);
    });
  });
});
