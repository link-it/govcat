import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY, of } from 'rxjs';
import { ServizioCategorieComponent } from './servizio-categorie.component';

describe('ServizioCategorieComponent', () => {
  let component: ServizioCategorieComponent;

  const mockRoute = {
    data: of({}),
    params: of({}),
    queryParams: of({})
  } as any;

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
    getConfig: vi.fn().mockReturnValue(of({}))
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
});
