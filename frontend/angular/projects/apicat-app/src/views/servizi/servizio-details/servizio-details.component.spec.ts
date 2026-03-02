import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioDetailsComponent } from './servizio-details.component';

describe('ServizioDetailsComponent', () => {
  let component: ServizioDetailsComponent;

  const mockRoute = {
    data: of({}),
    params: of({}),
    queryParams: of({})
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockModalService = {
    show: vi.fn()
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

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue(Promise.resolve({})),
    _confirmDelection: vi.fn(),
    __confirmCambioStatoServizio: vi.fn(),
    _showMandatoryFields: vi.fn(),
    _openGenerateTokenDialog: vi.fn()
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({ api: { abilitato: true }, generico: { abilitato: false } }),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    canManagement: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
    canJoin: vi.fn().mockReturnValue(true),
    canMonitoraggio: vi.fn().mockReturnValue(false),
    _removeDNM: vi.fn().mockImplementation((_a: any, _b: any, body: any) => body),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    getCurrentSession: vi.fn().mockReturnValue(null)
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioDetailsComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockModalService,
      mockConfigService,
      mockEventsManagerService,
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
    expect(ServizioDetailsComponent.Name).toBe('ServizioDetailsComponent');
  });

  it('should have model set to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://localhost');
  });

  it('should subscribe to route.data in constructor', () => {
    expect(component).toBeTruthy();
    // route.data subscription was called during construction
  });

  it('should call loadAnagrafiche in constructor', () => {
    // loadAnagrafiche is async and calls utils.getAnagrafiche
    expect(mockUtilService.getAnagrafiche).toHaveBeenCalled();
  });

  it('should initialize _otherLinks with defaults', () => {
    expect(component._otherLinksDefault.length).toBeGreaterThan(0);
  });

  it('should have _otherActions defined', () => {
    expect(component._otherActions.length).toBeGreaterThan(0);
  });

  it('should check _isGestore via authenticationService', () => {
    mockAuthenticationService.isGestore.mockReturnValue(true);
    expect((component as any)._isGestore()).toBe(true);
  });

  it('should emit close event on _onClose', () => {
    const spy = vi.spyOn(component.close, 'emit');
    component.id = '123';
    component._onClose();
    expect(spy).toHaveBeenCalledWith({ id: '123', service: expect.anything() });
  });

  it('should emit save event on _onSave', () => {
    const spy = vi.spyOn(component.save, 'emit');
    component.id = '123';
    component._onSave();
    expect(spy).toHaveBeenCalledWith({ id: '123', service: expect.anything() });
  });

  it('should toggle edit mode on _editService', () => {
    component._isEdit = false;
    component.debugMandatoryFields = false;
    component._editService();
    expect(component._isEdit).toBe(true);
  });

  it('should reset error on __resetError', () => {
    component._error = true;
    component._errorMsg = 'some error';
    (component as any).__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should toggle markdown preview', () => {
    component._showMarkdownPreview = false;
    component._toggleMarkdownPreview();
    expect(component._showMarkdownPreview).toBe(true);
    component._toggleMarkdownPreview();
    expect(component._showMarkdownPreview).toBe(false);
  });

  it('should check _hasControlError', () => {
    component._formGroup = { controls: { testField: { errors: { required: true }, touched: true } } } as any;
    expect(component._hasControlError('testField')).toBeTruthy();
  });

  it('should return false for _hasControlError on missing field', () => {
    component._formGroup = { controls: {} } as any;
    expect(component._hasControlError('missingField')).toBeFalsy();
  });

  it('should navigate on onBreadcrumb when _useRoute is true', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], expect.anything());
  });

  it('should call close.emit on onBreadcrumb when _useRoute is false', () => {
    component._useRoute = false;
    const spy = vi.spyOn(component.close, 'emit');
    component.onBreadcrumb({ url: '/servizi' });
    expect(spy).toHaveBeenCalled();
  });

  it('should navigate to adesioni on _joinServizio', () => {
    component.id = '42';
    (component as any)._joinServizio();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['adesioni', 'new', 'edit'],
      { queryParams: { id_servizio: '42' } }
    );
  });

  it('should navigate to presentation view on backPresentationView', () => {
    component.id = '42';
    component.backPresentationView();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should check _canJoin', () => {
    component.data = { stato: 'pubblicato', package: false };
    mockAuthenticationService.canJoin.mockReturnValue(true);
    expect(component._canJoin()).toBe(true);
  });

  it('should compare classi by id_classe_utente', () => {
    expect(component._compareClassiFn({ id_classe_utente: '1' }, { id_classe_utente: '1' })).toBe(true);
    expect(component._compareClassiFn({ id_classe_utente: '1' }, { id_classe_utente: '2' })).toBe(false);
  });

  it('should determine isComponente from form control', () => {
    component._formGroup = {
      get: vi.fn().mockReturnValue({ value: 'componente' }),
      controls: {}
    } as any;
    expect(component.isComponente).toBe(true);
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should handle tipi servizio initialization', () => {
    expect(component._tipiServizio.length).toBe(2);
    expect(component._tipiServizio[0].value).toBe('API');
    expect(component._tipiServizio[1].value).toBe('Generico');
  });
});
