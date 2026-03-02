import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioApiComponent } from './servizio-api.component';

describe('ServizioApiComponent', () => {
  let component: ServizioApiComponent;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) }
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
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

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canJoin: vi.fn().mockReturnValue(true),
    canAdd: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true)
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({})
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioApiComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockEventsManagerService,
      mockTools,
      mockApiService,
      mockAuthenticationService,
      mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiComponent.Name).toBe('ServizioApiComponent');
  });

  it('should have model set to api', () => {
    expect(component.model).toBe('api');
  });

  it('should read config from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.id).toBe(0);
    expect(component.serviceApi).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(false);
    expect(component._error).toBe(false);
    expect(component._useRoute).toBe(true);
    expect(component._useDialog).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoApi');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoApiHelp');
  });

  it('should set error messages on _setErrorApi(true)', () => {
    component._setErrorApi(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages on _setErrorApi(false)', () => {
    component._setErrorApi(true);
    component._setErrorApi(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoApi');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoApiHelp');
  });

  it('should initialize search form with _initSearchForm', () => {
    component._initSearchForm();
    expect(component._formGroup).toBeDefined();
  });

  it('should convert timestamp to Date on _timestampToMoment', () => {
    const now = Date.now();
    const result = component._timestampToMoment(now);
    expect(result).toBeInstanceOf(Date);
  });

  it('should return null for zero timestamp', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should toggle _isEdit on _onCloseEdit', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  it('should switch to dominio view on _showSoggettoDominio', () => {
    component._showSoggettoDominio();
    expect(component._isSoggettoDominio).toBe(true);
  });

  it('should switch to aderente view on _showSoggettoAderente', () => {
    component._showSoggettoAderente();
    expect(component._isSoggettoDominio).toBe(false);
  });

  it('should call authenticationService.canJoin on _canJoinMapper', () => {
    component._canJoinMapper();
    expect(mockAuthenticationService.canJoin).toHaveBeenCalled();
  });

  it('should call authenticationService.canAdd on _canAddMapper', () => {
    component._canAddMapper();
    expect(mockAuthenticationService.canAdd).toHaveBeenCalled();
  });

  it('should call authenticationService.canEdit on _canEditMapper', () => {
    component._canEditMapper();
    expect(mockAuthenticationService.canEdit).toHaveBeenCalled();
  });

  it('should navigate on _onNew when _useRoute is true', () => {
    component._useRoute = true;
    component.id = 5;
    component._onNew();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should set _isEdit on _onNew when _useRoute is false', () => {
    component._useRoute = false;
    component._onNew();
    expect(component._isEdit).toBe(true);
  });

  it('should navigate on _onEdit when _useRoute is true', () => {
    component._useRoute = true;
    component.id = 5;
    component._onEdit({}, { id: 10 });
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should handle onActionMonitor unknown action', () => {
    mockRouter.navigate.mockClear();
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });
});
