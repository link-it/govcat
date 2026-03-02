import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { ServizioApiAllegatiComponent } from './servizio-api-allegati.component';

describe('ServizioApiAllegatiComponent', () => {
  let component: ServizioApiAllegatiComponent;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1', aid: '10' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) }
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null),
    url: '/servizi/1/api/10/allegati'
  } as any;

  const mockModalService = {
    show: vi.fn().mockReturnValue({
      content: { onClose: of(false) }
    })
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

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob()))
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    _confirmDelection: vi.fn()
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canAdd: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
    canTypeAttachment: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false)
  } as any;

  beforeEach(() => {
    Tools.Configurazione = null;
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    component = new ServizioApiAllegatiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockApiService,
      mockUtils,
      mockAuthenticationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiAllegatiComponent.Name).toBe('ServizioAllegatiComponent');
  });

  it('should have model set to api', () => {
    expect(component.model).toBe('api');
  });

  it('should read config from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component.sid).toBeNull();
    expect(component.servizioApiAllegati).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component._isNew).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(true);
    expect(component._error).toBe(false);
    expect(component._downloading).toBe(false);
    expect(component._deleting).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
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

  it('should update sort on _onSort', () => {
    component._onSort({ sortField: 'nome', sortBy: 'desc' });
    expect(component.sortField).toBe('nome');
    expect(component.sortDirection).toBe('desc');
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }] as any;
    component.id = '10';
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should set filterData on _onSearch', () => {
    const values = [{ field: 'q', value: 'test' }];
    component.id = '10';
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  it('should reset error on __resetError', () => {
    component._error = true;
    component._errorMsg = 'some error';
    (component as any).__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should call authenticationService.canAdd on _canAddMapper', () => {
    component._canAddMapper();
    expect(mockAuthenticationService.canAdd).toHaveBeenCalled();
  });

  it('should call authenticationService.canEdit on _canEditMapper', () => {
    component._canEditMapper();
    expect(mockAuthenticationService.canEdit).toHaveBeenCalled();
  });

  it('should call authenticationService.canTypeAttachment on _canTypeAttachmentMapper', () => {
    component._canTypeAttachmentMapper('Generico');
    expect(mockAuthenticationService.canTypeAttachment).toHaveBeenCalled();
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

  it('should have sort fields defined', () => {
    expect(component.sortFields).toEqual([
      { field: 'documento.filename', label: 'APP.LABEL.filename', icon: '' }
    ]);
  });
});
