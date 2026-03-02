import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioSpecificaComponent } from './servizio-specifica.component';

describe('ServizioSpecificaComponent', () => {
  let component: ServizioSpecificaComponent;

  const mockRoute = {
    params: of({ id: '1' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) },
  } as any;
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
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canTypeAttachment: vi.fn().mockReturnValue(true),
    canAdd: vi.fn().mockReturnValue(true),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob())),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioSpecificaComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManager,
      mockAuthService,
      mockApiService,
      mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioSpecificaComponent.Name).toBe('ServizioSpecificaComponent');
  });

  it('should set model to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should read config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeTruthy();
  });

  it('should have default sort values', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('_setErrorApi should toggle error messages', () => {
    component._setErrorApi(true);
    expect((component as any)._error).toBe(true);
    expect((component as any)._message).toBe('APP.MESSAGE.ERROR.Default');

    component._setErrorApi(false);
    expect((component as any)._error).toBe(false);
    expect((component as any)._message).toBe('APP.MESSAGE.NoResults');
  });

  it('onBreadcrumb should navigate', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('_onCloseEdit should reset edit state', () => {
    (component as any)._isEdit = true;
    (component as any)._isNew = true;
    (component as any)._editCurrent = { id: 1 };
    component._onCloseEdit({});
    expect((component as any)._isEdit).toBe(false);
    expect((component as any)._isNew).toBe(false);
    expect((component as any)._editCurrent).toBeNull();
  });

  it('_timestampToMoment should return Date for truthy value', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    const result = component._timestampToMoment(0);
    expect(result).toBeNull();
  });

  it('_hasControlError should return falsy when no controls', () => {
    const result = component._hasControlError('nonexistent');
    expect(result).toBeFalsy();
  });

  it('f getter should return editFormGroup controls', () => {
    expect(component.f).toBeDefined();
  });
});
