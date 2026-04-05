import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject, firstValueFrom } from 'rxjs';
import { FormControl } from '@angular/forms';
import { ServizioComponentiComponent } from './servizio-componenti.component';
import { Tools } from '@linkit/components';

describe('ServizioComponentiComponent', () => {
  let component: ServizioComponentiComponent;
  let savedConfigurazione: any;

  let mockRouteParamsSubject: Subject<any>;
  let mockRouteQueryParamsSubject: Subject<any>;

  let mockRoute: any;
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
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    putElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    canAdd: vi.fn().mockReturnValue(true),
  } as any;

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'TruncateRows').mockImplementation((s: string) => s);
    vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});

    mockRouteParamsSubject = new Subject<any>();
    mockRouteQueryParamsSubject = new Subject<any>();

    mockRoute = {
      params: mockRouteParamsSubject.asObservable(),
      queryParams: mockRouteQueryParamsSubject.asObservable(),
      parent: { params: of({ id: '1' }) },
    } as any;

    component = new ServizioComponentiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManager,
      mockApiService,
      mockUtils,
      mockAuthService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  // === Existing tests ===

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioComponentiComponent.Name).toBe('ServizioComponentiComponent');
  });

  it('should set model to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should read config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeTruthy();
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://localhost');
  });

  it('should have default sort values', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('should initialize breadcrumbs', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('_setErrorMessages should toggle error messages', () => {
    (component as any)._setErrorMessages(true);
    expect((component as any)._error).toBe(true);
    expect((component as any)._message).toBe('APP.MESSAGE.ERROR.Default');

    (component as any)._setErrorMessages(false);
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

  it('_timestampToMoment should return Date for truthy value', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    const result = component._timestampToMoment(0);
    expect(result).toBeNull();
  });

  it('_hasControlError should return falsy for unknown controls', () => {
    const result = component._hasControlError('nonexistent');
    expect(result).toBeFalsy();
  });

  it('f getter should return editFormGroup controls', () => {
    expect(component.f).toBeDefined();
  });

  it('_canAddMapper should return boolean', () => {
    const result = component._canAddMapper();
    expect(typeof result).toBe('boolean');
  });

  it('loadAnagrafiche should populate anagrafiche', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente']).toBeDefined();
    expect(component.anagrafiche['tipo-referente'].length).toBe(2);
  });

  // === 1. constructor ===

  describe('constructor', () => {
    it('should set _fromDashboard when queryParams from=dashboard', () => {
      // The constructor subscribes to queryParams; emit the value
      mockRouteQueryParamsSubject.next({ from: 'dashboard' });
      expect(component._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard when queryParams has no from', () => {
      mockRouteQueryParamsSubject.next({});
      expect(component._fromDashboard).toBe(false);
    });

    it('should set service and grant from navigation state', () => {
      const navState = {
        service: { id_servizio: 'svc1', nome: 'TestSvc', versione: '1' },
        grant: { ruoli: ['admin'] },
      };
      mockRouter.getCurrentNavigation.mockReturnValue({ extras: { state: navState } });

      const comp = new ServizioComponentiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager,
        mockApiService, mockUtils, mockAuthService
      );

      expect(comp.service).toEqual(navState.service);
      expect(comp._grant).toEqual(navState.grant);
    });

    it('should set service to null when no navigation state', () => {
      mockRouter.getCurrentNavigation.mockReturnValue(null);

      const comp = new ServizioComponentiComponent(
        mockRoute, mockRouter, mockModalService, mockTranslate,
        mockConfigService, mockTools, mockEventsManager,
        mockApiService, mockUtils, mockAuthService
      );

      expect(comp.service).toBeNull();
    });

    it('should call _initSearchForm in constructor', () => {
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup.get('type')).toBeTruthy();
    });
  });

  // === 2. ngOnInit ===

  describe('ngOnInit', () => {
    it('should set id from route params and load config', () => {
      const mockConfig = { details: [] };
      mockConfigService.getConfig.mockReturnValue(of(mockConfig));
      mockApiService.getDetails.mockReturnValue(of({}));

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '42' });

      expect(component.id).toBe('42');
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('componenti');
      expect(component.componentiConfig).toEqual(mockConfig);
    });

    it('should use cid over id when both present', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({}));

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '10', cid: '99' });

      expect(component.id).toBe('99');
    });

    it('should call _loadServizio when service is null', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = null;
      const spy = vi.spyOn(component as any, '_loadServizio').mockImplementation(() => {});

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '5' });

      expect(spy).toHaveBeenCalled();
    });

    it('should call _loadServizioComponenti when service is already set', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = {
        nome: 'Svc',
        versione: '1',
        stato: 'pubblicato',
        dominio: {
          soggetto_referente: {
            organizzazione: { esterna: true, id_organizzazione: 'org-123' },
          },
        },
      };
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '7' });

      expect(component._isDominioEsterno).toBe(true);
      expect(component._idDominioEsterno).toBe('org-123');
      expect(spy).toHaveBeenCalled();
    });

    it('should set _isDominioEsterno=false when dominio has no esterna', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.service = { nome: 'Svc', versione: '1', stato: 'ok', dominio: {} };
      vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.ngOnInit();
      mockRouteParamsSubject.next({ id: '7' });

      expect(component._isDominioEsterno).toBe(false);
      expect(component._idDominioEsterno).toBeNull();
    });

    it('should not do anything when id is not provided', () => {
      const spy = vi.spyOn(component as any, '_loadServizio');

      component.ngOnInit();
      mockRouteParamsSubject.next({});

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // === 3. _initBreadcrumb ===

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with service name and version', () => {
      component.service = { nome: 'TestSvc', versione: '2', stato: 'pubblicato' };
      component.id = 42;
      component._fromDashboard = false;

      component._initBreadcrumb();

      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[0].url).toBe('/servizi');
      expect(component.breadcrumbs[1].label).toBe('TestSvc v. 2');
      expect(component.breadcrumbs[1].url).toBe('/servizi/42');
      expect(component.breadcrumbs[2].label).toBe('APP.SERVICES.TITLE.ServiceComponents');
    });

    it('should set breadcrumbs with id when no service', () => {
      component.service = null;
      component.id = 99;
      component._fromDashboard = false;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('99');
    });

    it('should set breadcrumbs with New when no service and no id', () => {
      component.service = null;
      component.id = 0;
      component._fromDashboard = false;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('should set dashboard breadcrumbs when _fromDashboard is true', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      component.id = 10;
      component._fromDashboard = true;

      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should set tooltip from service stato', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'pubblicato' };
      component.id = 10;
      component._fromDashboard = false;

      component._initBreadcrumb();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
      expect(component.breadcrumbs[1].tooltip).toBe('APP.WORKFLOW.STATUS.pubblicato');
    });

    it('should set empty tooltip when no service', () => {
      component.service = null;
      component.id = 10;
      component._fromDashboard = false;

      component._initBreadcrumb();

      expect(component.breadcrumbs[1].tooltip).toBe('');
    });
  });

  // === 4. _loadServizio ===

  describe('_loadServizio', () => {
    it('should load grant then service on success', () => {
      const mockGrant = { ruoli: ['admin'] };
      const mockService = {
        nome: 'Svc', versione: '1', stato: 'ok',
        dominio: {
          soggetto_referente: {
            organizzazione: { esterna: true, id_organizzazione: 'ext-1' },
          },
        },
      };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService));

      component.id = 5;
      vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5, 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 5);
      expect(component._grant).toEqual(mockGrant);
      expect(component.service).toEqual(mockService);
      expect(component._isDominioEsterno).toBe(true);
      expect(component._idDominioEsterno).toBe('ext-1');
      expect(component._spin).toBe(false);
    });

    it('should call _initBreadcrumb and _loadServizioComponenti after loading', () => {
      const mockGrant = {};
      const mockService = { nome: 'S', versione: '1', stato: 'ok' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(mockGrant))
        .mockReturnValueOnce(of(mockService));

      component.id = 1;
      const breadcrumbSpy = vi.spyOn(component, '_initBreadcrumb');
      const loadSpy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component._loadServizio();

      expect(breadcrumbSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle service detail error', () => {
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
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

    it('should not load when id is 0', () => {
      component.id = 0;
      component._loadServizio();

      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // === 5. _loadServizioComponenti ===

  describe('_loadServizioComponenti', () => {
    const makeResponse = (content: any[], page: any = {}, links: any = null) => ({
      content,
      page,
      _links: links,
    });

    it('should reset list and load components on success', () => {
      const mockContent = [
        {
          id_servizio: 's1',
          idServizio: 'sid1',
          nome: 'Comp1',
          versione: '1',
          descrizione: 'Desc',
          stato: 'pubblicato',
          descrizione_sintetica: 'Short desc',
          visibilita: 'pubblico',
          immagine: 'logo.png',
          multi_adesione: true,
        },
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent, { totalElements: 1 })));

      component.id = 5;
      component._loadServizioComponenti();

      expect(component.servizioComponenti.length).toBe(1);
      expect(component.servizioComponenti[0].nome).toBe('Comp1');
      expect(component.servizioComponenti[0].versione).toBe('1');
      expect(component.servizioComponenti[0].stato).toBe('pubblicato');
      expect(component.servizioComponenti[0].multiplo).toBe(true);
      expect(component.servizioComponenti[0].logo).toBe('http://localhost/servizi/s1/immagine');
      expect(component._spin).toBe(false);
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should call TruncateRows for descrizione_sintetica', () => {
      const mockContent = [
        { id_servizio: 's1', idServizio: 'sid1', nome: 'C', descrizione_sintetica: 'A short description' },
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent)));

      component.id = 5;
      component._loadServizioComponenti();

      expect(Tools.TruncateRows).toHaveBeenCalledWith('A short description');
    });

    it('should handle visibilita defaulting to dominio when not set', () => {
      const mockContent = [
        { id_servizio: 's1', idServizio: 'sid1', nome: 'C', visibilita: null, dominio: null },
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent)));

      component.id = 5;
      component._loadServizioComponenti();

      expect(component.servizioComponenti[0].source.visibilita).toBe('dominio');
    });

    it('should use dominio.visibilita when service visibilita is null and dominio exists', () => {
      const mockContent = [
        { id_servizio: 's1', idServizio: 'sid1', nome: 'C', visibilita: null, dominio: { visibilita: 'privato' } },
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent)));

      component.id = 5;
      component._loadServizioComponenti();

      expect(component.servizioComponenti[0].source.visibilita).toBe('privato');
    });

    it('should set empty logo when no immagine', () => {
      const mockContent = [
        { id_servizio: 's1', idServizio: 'sid1', nome: 'C', immagine: null },
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent)));

      component.id = 5;
      component._loadServizioComponenti();

      expect(component.servizioComponenti[0].logo).toBe('');
    });

    it('should append results when url is provided', () => {
      component.id = 5;
      component.servizioComponenti = [{ nome: 'Existing' }];
      const mockContent = [
        { id_servizio: 's2', idServizio: 'sid2', nome: 'New' },
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent)));

      component._loadServizioComponenti(null, '/api/next');

      expect(component.servizioComponenti.length).toBe(2);
      expect(component.servizioComponenti[0].nome).toBe('Existing');
      expect(component.servizioComponenti[1].nome).toBe('New');
    });

    it('should clear list when url is empty', () => {
      component.id = 5;
      component.servizioComponenti = [{ nome: 'Old' }];
      const mockContent = [
        { id_servizio: 's1', idServizio: 'sid1', nome: 'Fresh' },
      ];
      mockApiService.getDetails.mockReturnValue(of(makeResponse(mockContent)));

      component._loadServizioComponenti();

      expect(component.servizioComponenti.length).toBe(1);
      expect(component.servizioComponenti[0].nome).toBe('Fresh');
    });

    it('should set _preventMultiCall to false after loading', () => {
      component.id = 5;
      component._preventMultiCall = true;
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id_servizio: 's1', idServizio: 'sid1', nome: 'C' }])));

      component._loadServizioComponenti();

      expect(component._preventMultiCall).toBe(false);
    });

    it('should handle error response', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));

      component.id = 5;
      component._loadServizioComponenti();

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._preventMultiCall).toBe(false);
    });

    it('should not load when id is 0', () => {
      component.id = 0;
      component._loadServizioComponenti();

      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set _links from response', () => {
      const links = { next: { href: '/api/next' } };
      mockApiService.getDetails.mockReturnValue(of(makeResponse([{ id_servizio: 's1', nome: 'C' }], {}, links)));

      component.id = 5;
      component._loadServizioComponenti();

      expect(component._links).toEqual(links);
    });

    it('should handle null response gracefully', () => {
      mockApiService.getDetails.mockReturnValue(of(null));

      component.id = 5;
      component._loadServizioComponenti();

      expect(component.servizioComponenti.length).toBe(0);
      expect(component._spin).toBe(false);
    });
  });

  // === 6. _generateComponentFields ===

  describe('_generateComponentFields', () => {
    it('should call Tools.generateFields and translate labels', () => {
      const mockFields = [
        { label: 'APP.LABEL.Name', value: 'test', type: 'text' },
        { label: 'APP.LABEL.Desc', value: 'desc', type: 'text' },
      ];
      vi.spyOn(Tools, 'generateFields').mockReturnValue(mockFields);
      component.componentiConfig = { details: [{ field: 'name' }] };

      const result = component._generateComponentFields({ name: 'test' });

      expect(Tools.generateFields).toHaveBeenCalledWith([{ field: 'name' }], { name: 'test' });
      expect(result.length).toBe(2);
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.Name');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.Desc');
    });
  });

  // === 7. __loadMoreData ===

  describe('__loadMoreData', () => {
    it('should call _loadServizioComponenti when next link exists', () => {
      component._links = { next: { href: '/api/componenti?page=2' } };
      component._preventMultiCall = false;
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.__loadMoreData();

      expect(component._preventMultiCall).toBe(true);
      expect(spy).toHaveBeenCalledWith(null, '/api/componenti?page=2');
    });

    it('should not call when _links is null', () => {
      component._links = null;
      component._preventMultiCall = false;
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.__loadMoreData();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call when no next link', () => {
      component._links = {};
      component._preventMultiCall = false;
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.__loadMoreData();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call when _preventMultiCall is true', () => {
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = true;
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.__loadMoreData();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // === 8. _onNew / _addServizio ===

  describe('_onNew / _addServizio', () => {
    it('_onNew should call _addServizio', () => {
      const spy = vi.spyOn(component as any, '_addServizio').mockImplementation(() => {});
      component._onNew();
      expect(spy).toHaveBeenCalled();
    });

    it('_addServizio should call loadAnagrafiche, _initComponentiSelect, _initEditForm, and show modal', () => {
      const loadAnagSpy = vi.spyOn(component, 'loadAnagrafiche');
      const initSelectSpy = vi.spyOn(component as any, '_initComponentiSelect').mockImplementation(() => {});
      const initFormSpy = vi.spyOn(component as any, '_initEditForm');

      // editTemplate must be defined for modal show
      component.editTemplate = {} as any;

      component._addServizio();

      expect(loadAnagSpy).toHaveBeenCalled();
      expect(initSelectSpy).toHaveBeenCalledWith([]);
      expect(initFormSpy).toHaveBeenCalled();
      expect(mockModalService.show).toHaveBeenCalledWith(component.editTemplate, { ignoreBackdropClick: false });
    });
  });

  // === 9. _onEdit ===

  describe('_onEdit', () => {
    it('should navigate to componenti detail', () => {
      component.service = { id_servizio: 'svc-10' };
      component._onEdit({}, { idServizio: 'comp-5' });

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', 'svc-10', 'componenti', 'comp-5'],
        { queryParamsHandling: 'preserve' }
      );
    });
  });

  // === 10. _onSearch, _resetForm, _onSubmit ===

  describe('_onSearch', () => {
    it('should set _filterData and call _loadServizioComponenti', () => {
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});
      const values = [{ field: 'type', value: 'api' }];

      component._onSearch(values);

      expect(component._filterData).toEqual(values);
      expect(spy).toHaveBeenCalledWith(values);
    });
  });

  describe('_resetForm', () => {
    it('should reset _filterData and reload', () => {
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});
      component._filterData = [{ field: 'x', value: 'y' }];

      component._resetForm();

      expect(component._filterData).toEqual([]);
      expect(spy).toHaveBeenCalledWith([]);
    });
  });

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when available', () => {
      const mockSearchBar = { _onSearch: vi.fn() };
      component.searchBarForm = mockSearchBar as any;

      component._onSubmit({});

      expect(mockSearchBar._onSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is undefined', () => {
      component.searchBarForm = undefined as any;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  // === 11. saveModal ===

  describe('saveModal', () => {
    it('should call putElementRelated and hide modal on success', () => {
      const hideFn = vi.fn();
      component._modalEditRef = { hide: hideFn } as any;
      mockApiService.putElementRelated.mockReturnValue(of({}));
      const spy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.id = 42;
      component.saveModal({ id_servizio: 'comp-1' });

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith('servizi', 42, 'componenti/comp-1', null);
      expect(hideFn).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('');
    });

    it('should set error on failure with details', () => {
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({ details: 'Component already exists' })));

      component.id = 42;
      component.saveModal({ id_servizio: 'comp-1' });

      expect(component._errorSave).toBe(true);
      expect(component._errorSaveMsg).toBe('Component already exists');
    });

    it('should use GetErrorMsg when no details in error', () => {
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({ status: 500 })));

      component.id = 42;
      component.saveModal({ id_servizio: 'comp-1' });

      expect(component._errorSave).toBe(true);
      expect(mockUtils.GetErrorMsg).toHaveBeenCalled();
      expect(component._errorSaveMsg).toBe('Error');
    });
  });

  // === 12. closeModal ===

  describe('closeModal', () => {
    it('should reset errors and hide modal', () => {
      const hideFn = vi.fn();
      component._modalEditRef = { hide: hideFn } as any;
      component._errorSave = true;
      component._errorSaveMsg = 'Some error';

      component.closeModal();

      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('');
      expect(hideFn).toHaveBeenCalled();
    });
  });

  // === 13. _deleteComponent ===

  describe('_deleteComponent', () => {
    it('should show confirm dialog and delete on confirmation', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() },
        hide: vi.fn(),
      });
      mockApiService.deleteElementRelated.mockReturnValue(of({}));
      const loadSpy = vi.spyOn(component as any, '_loadServizioComponenti').mockImplementation(() => {});

      component.id = 42;
      component._deleteComponent({ source: { id_servizio: 'comp-99' } });

      // Confirm the dialog
      onCloseSubject.next(true);

      expect(mockModalService.show).toHaveBeenCalled();
      expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith('servizi', 42, 'componenti/comp-99');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not delete when dialog is cancelled', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() },
        hide: vi.fn(),
      });

      component.id = 42;
      component._deleteComponent({ source: { id_servizio: 'comp-99' } });

      // Cancel the dialog
      onCloseSubject.next(false);

      expect(mockApiService.deleteElementRelated).not.toHaveBeenCalled();
    });

    it('should show error message when delete fails', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() },
        hide: vi.fn(),
      });
      mockApiService.deleteElementRelated.mockReturnValue(throwError(() => new Error('delete failed')));

      component.id = 42;
      component._deleteComponent({ source: { id_servizio: 'comp-99' } });

      onCloseSubject.next(true);

      expect(component._error).toBe(true);
      expect(Tools.showMessage).toHaveBeenCalledWith('APP.MESSAGE.ERROR.NoDeleteComponent', 'danger', true);
    });

    it('should pass correct initial state to dialog', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() },
        hide: vi.fn(),
      });

      component._deleteComponent({ source: { id_servizio: 'comp-1' } });

      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].ignoreBackdropClick).toBe(true);
      expect(callArgs[1].initialState.confirmColor).toBe('danger');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.Attention');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.MESSAGE.AreYouSure');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.BUTTON.Cancel');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.BUTTON.Confirm');
    });
  });

  // === 14. _initComponentiSelect ===

  describe('_initComponentiSelect', () => {
    it('should create componenti$ observable with defaults', () => {
      component._initComponentiSelect([{ id: 1, nome: 'Default' }]);
      expect(component.componenti$).toBeDefined();
    });

    it('should create componenti$ observable with empty defaults', () => {
      component._initComponentiSelect();
      expect(component.componenti$).toBeDefined();
    });

    it('should emit default value first', async () => {
      const defaults = [{ id: 1, nome: 'Init' }];
      component._initComponentiSelect(defaults);

      // Get the first emission (defaults)
      const val = await firstValueFrom(component.componenti$);
      expect(val).toEqual(defaults);
    });
  });

  // === 15. getData ===

  describe('getData', () => {
    it('should call getList with string term as q param', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }] }));

      let result: any;
      component.getData('servizi', 'search term').subscribe((r) => (result = r));

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', {
        params: { q: 'search term' },
      });
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should call getList with object term merged into params', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 2 }] }));

      let result: any;
      component.getData('servizi', { type: 'api' }, { package: false }).subscribe((r) => (result = r));

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', {
        params: { package: false, type: 'api' },
      });
      expect(result).toEqual([{ id: 2 }]);
    });

    it('should call getList with no term', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 3 }] }));

      let result: any;
      component.getData('servizi', null, { package: true }).subscribe((r) => (result = r));

      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', {
        params: { package: true },
      });
      expect(result).toEqual([{ id: 3 }]);
    });

    it('should handle Error in response', () => {
      mockApiService.getList.mockReturnValue(of({ Error: 'Something went wrong' }));

      let result: any;
      component.getData('servizi').subscribe({
        next: (r) => (result = r),
        error: () => {},
      });

      // When resp.Error exists, throwError is called but not returned,
      // so result is undefined because the map doesn't return anything for error case
      expect(result).toBeUndefined();
    });
  });

  // === 16. _onChangeTipoReferente ===

  describe('_onChangeTipoReferente', () => {
    it('should set componentiFilter when isReferent is true', () => {
      component._onChangeTipoReferente(true);
      expect(component.componentiFilter).toBe('referente_servizio,gestore,coordinatore');
    });

    it('should clear componentiFilter when isReferent is false', () => {
      component.componentiFilter = 'referente_servizio,gestore,coordinatore';
      component._onChangeTipoReferente(false);
      expect(component.componentiFilter).toBe('');
    });
  });

  // === 17. onChangeTipo ===

  describe('onChangeTipo', () => {
    it('should enable id_utente when tipo is not empty', () => {
      component._initEditForm();
      // Add tipo and id_utente controls to the form for this test
      component._editFormGroup.addControl('tipo', new FormControl('referente'));
      component._editFormGroup.addControl('id_utente', new FormControl({ value: null, disabled: true }));
      const initSelectSpy = vi.spyOn(component as any, '_initComponentiSelect').mockImplementation(() => {});

      component.onChangeTipo({ filter: 'referente_servizio,gestore' });

      expect(component.componentiFilter).toBe('referente_servizio,gestore');
      expect(component._editFormGroup.controls['id_utente'].enabled).toBe(true);
      expect(initSelectSpy).toHaveBeenCalled();
    });

    it('should disable id_utente when tipo is empty', () => {
      component._initEditForm();
      component._editFormGroup.addControl('tipo', new FormControl(''));
      component._editFormGroup.addControl('id_utente', new FormControl(null));
      const initSelectSpy = vi.spyOn(component as any, '_initComponentiSelect').mockImplementation(() => {});

      component.onChangeTipo({ filter: '' });

      expect(component._editFormGroup.controls['id_utente'].disabled).toBe(true);
      expect(initSelectSpy).toHaveBeenCalled();
    });
  });

  // === 18. onChangeComponent ===

  describe('onChangeComponent', () => {
    it('should reset error state', () => {
      component._errorSave = true;
      component._errorSaveMsg = 'Previous error';

      component.onChangeComponent({});

      expect(component._errorSave).toBe(false);
      expect(component._errorSaveMsg).toBe('');
    });
  });

  // === 19. _canAddMapper ===

  describe('_canAddMapper', () => {
    it('should return true when no classes are restricted', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthService._getClassesNotModifiable.mockReturnValue([]);

      expect(component._canAddMapper()).toBe(true);
    });

    it('should return true when only referente is restricted', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthService._getClassesNotModifiable.mockReturnValue(['referente']);

      // referente is in _cnm, so it won't push true for referente
      // referente_superiore is NOT in _cnm, so it pushes true
      // _lstPerm has 1 element: [true] => returns true
      expect(component._canAddMapper()).toBe(true);
    });

    it('should return true when only referente_superiore is restricted', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthService._getClassesNotModifiable.mockReturnValue(['referente_superiore']);

      expect(component._canAddMapper()).toBe(true);
    });

    it('should return false when both referente and referente_superiore are restricted', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthService._getClassesNotModifiable.mockReturnValue(['referente', 'referente_superiore']);

      expect(component._canAddMapper()).toBe(false);
    });

    it('should pass correct args to _getClassesNotModifiable', () => {
      component.service = { stato: 'bozza' };
      component._canAddMapper();

      expect(mockAuthService._getClassesNotModifiable).toHaveBeenCalledWith('servizio', 'servizio', 'bozza');
    });

    it('should handle null service stato', () => {
      component.service = null;
      component._canAddMapper();

      expect(mockAuthService._getClassesNotModifiable).toHaveBeenCalledWith('servizio', 'servizio', undefined);
    });
  });

  // === 20. onActionMonitor ===

  describe('onActionMonitor', () => {
    it('should navigate to backview url', () => {
      component.service = { id_servizio: 'svc-42' };
      component.onActionMonitor({ action: 'backview' });

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/servizi/svc-42/view'],
        { relativeTo: mockRoute }
      );
    });

    it('should do nothing for unknown action', () => {
      component.service = { id_servizio: 'svc-42' };
      component.onActionMonitor({ action: 'unknown' });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle default case (no action)', () => {
      component.service = { id_servizio: 'svc-42' };
      component.onActionMonitor({ action: 'something_else' });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // === 21. _initEditForm ===

  describe('_initEditForm', () => {
    it('should create form group with id_servizio control', () => {
      component._initEditForm();

      expect(component._editFormGroup).toBeDefined();
      expect(component._editFormGroup.controls['id_servizio']).toBeDefined();
    });

    it('should set id_servizio as required', () => {
      component._initEditForm();

      const control = component._editFormGroup.controls['id_servizio'];
      control.setValue(null);
      expect(control.valid).toBe(false);

      control.setValue('some-id');
      expect(control.valid).toBe(true);
    });
  });

  // === 22. _resetScroll ===

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with correct params', () => {
      component._resetScroll();

      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // === Additional coverage ===

  describe('_onResize', () => {
    it('should set desktop based on window width', () => {
      // window.innerWidth is typically available in test env
      component._onResize();
      // Just verify it does not throw and sets a boolean
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should update desktop flag', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('_onSort', () => {
    it('should not throw', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._onSort({ field: 'name', direction: 'asc' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('_initSearchForm', () => {
    it('should initialize _formGroup with type control', () => {
      (component as any)._initSearchForm();
      expect(component._formGroup.get('type')).toBeTruthy();
      expect(component._formGroup.get('type')!.value).toBe('');
    });
  });

  describe('_hasControlError with form setup', () => {
    it('should return true when control has errors and is touched', () => {
      component._initEditForm();
      const control = component._editFormGroup.controls['id_servizio'];
      control.markAsTouched();
      control.setValue(null);
      control.updateValueAndValidity();

      expect(component._hasControlError('id_servizio')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._initEditForm();
      const control = component._editFormGroup.controls['id_servizio'];
      control.markAsTouched();
      control.setValue('valid-value');
      control.updateValueAndValidity();

      expect(component._hasControlError('id_servizio')).toBe(false);
    });
  });
});
