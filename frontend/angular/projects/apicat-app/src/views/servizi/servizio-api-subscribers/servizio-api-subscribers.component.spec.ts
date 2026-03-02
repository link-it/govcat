import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioApiSubscribersComponent } from './servizio-api-subscribers.component';

describe('ServizioApiSubscribersComponent', () => {
  let component: ServizioApiSubscribersComponent;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1', aid: '10' }),
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

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getListPDND: vi.fn().mockReturnValue(of({ subscribers: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({})
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({})
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioApiSubscribersComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtils,
      mockAuthenticationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiSubscribersComponent.Name).toBe('ServizioApiSubscribersComponent');
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
    expect(component.sid).toBeNull();
    expect(component.environmentId).toBe('');
    expect(component.eserviceId).toBe('');
    expect(component.producerId).toBe('');
    expect(component.servizioapisubscribers).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    expect(component._hasTabCollaudo).toBe(false);
    expect(component._hasTabProduzione).toBe(false);
  });

  it('should set error messages on _setErrorMessages(true)', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should show choose environment message when no environmentId', () => {
    component.environmentId = '';
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
    expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
  });

  it('should show no results message when environmentId is set', () => {
    component.environmentId = 'collaudo';
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
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

  it('should set environmentId to collaudo on _showCollaudo', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
  });

  it('should set environmentId to produzione on _showProduzione', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
  });

  it('should return true for _isCollaudo when environmentId is collaudo', () => {
    component.environmentId = 'collaudo';
    expect(component._isCollaudo()).toBe(true);
    expect(component._isProduzione()).toBe(false);
  });

  it('should return true for _isProduzione when environmentId is produzione', () => {
    component.environmentId = 'produzione';
    expect(component._isProduzione()).toBe(true);
    expect(component._isCollaudo()).toBe(false);
  });

  it('should return false for _hasPDNDConfiguredMapper when no proprieta_custom', () => {
    component.servizioApi = null;
    expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
  });

  it('should set filterData on _onSearch', () => {
    const values = [{ field: 'q', value: 'test' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }] as any;
    component._resetForm();
    expect(component._filterData).toEqual([]);
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

  it('should not load subscribers if eserviceId or producerId are empty', () => {
    component.eserviceId = '';
    component.producerId = '';
    component.id = 10;
    component._loadServizioApiSubscribers();
    expect(mockApiService.getListPDND).not.toHaveBeenCalled();
  });
});
