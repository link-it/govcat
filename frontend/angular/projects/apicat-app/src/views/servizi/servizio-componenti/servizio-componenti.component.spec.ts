import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioComponentiComponent } from './servizio-componenti.component';

describe('ServizioComponentiComponent', () => {
  let component: ServizioComponentiComponent;

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
    vi.clearAllMocks();
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
});
