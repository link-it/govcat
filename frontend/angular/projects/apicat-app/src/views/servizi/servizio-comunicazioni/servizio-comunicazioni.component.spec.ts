import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioComunicazioniComponent } from './servizio-comunicazioni.component';

describe('ServizioComunicazioniComponent', () => {
  let component: ServizioComunicazioniComponent;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) },
  } as any;
  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null),
  } as any;
  const mockRenderer = {} as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Layout: { enableOpenInNewTab: false },
        Services: { hideVersions: false },
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
    postElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob())),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canAdd: vi.fn().mockReturnValue(true),
    getUser: vi.fn().mockReturnValue({ id_utente: 'user-1' }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioComunicazioniComponent(
      mockRoute,
      mockRouter,
      mockRenderer,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockEventsManager,
      mockApiService,
      mockAuthService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioComunicazioniComponent.Name).toBe('ServizioComunicazioniComponent');
  });

  it('should set model to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should read config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeTruthy();
  });

  it('should initialize breadcrumbs', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('should have default sort values', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('should have targetOptionsServizio defined', () => {
    expect(component.targetOptionsServizio).toBeDefined();
    expect(component.targetOptionsServizio.length).toBe(4);
  });

  it('_setErrorCommunications should toggle error messages', () => {
    (component as any)._setErrorCommunications(true);
    expect((component as any)._error).toBe(true);
    expect((component as any)._message).toBe('APP.MESSAGE.ERROR.Default');

    (component as any)._setErrorCommunications(false);
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

  it('_toggleSender should toggle showSender', () => {
    component.showSender = false;
    component._toggleSender();
    expect(component.showSender).toBe(true);
    component._toggleSender();
    expect(component.showSender).toBe(false);
  });

  it('_timestampToMoment should return Date for truthy value', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    const result = component._timestampToMoment(0);
    expect(result).toBeNull();
  });

  it('mapGDateMessageVisible should return boolean', () => {
    const mDate = { format: vi.fn().mockReturnValue('01012026') };
    const mDateGroup = { format: vi.fn().mockReturnValue('31122025') };
    const result = component.mapGDateMessageVisible(mDate, mDateGroup);
    expect(typeof result).toBe('boolean');
  });

  it('_canAddMapper should return boolean', () => {
    const result = component._canAddMapper();
    expect(typeof result).toBe('boolean');
  });
});
