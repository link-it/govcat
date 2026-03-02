import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { AdesioneDetailsComponent } from './adesione-details.component';

describe('AdesioneDetailsComponent', () => {
  let component: AdesioneDetailsComponent;

  const mockRoute = { params: of({ id: 'new' }), data: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), navigateByUrl: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Services: { hideVersions: false }, GOVAPI: { HOST: 'http://localhost' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob())),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getAnagrafiche: vi.fn().mockReturnValue({}),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    isGestore: vi.fn().mockReturnValue(false),
    isCoordinatore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    hasPermission: vi.fn().mockReturnValue(true),
    getUser: vi.fn().mockReturnValue({ ruolo: 'referente_servizio' }),
    _getConfigModule: vi.fn().mockReturnValue({}),
    getCurrentSession: vi.fn().mockReturnValue({}),
  } as any;
  const mockLocation = { back: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AdesioneDetailsComponent(
      mockRoute, mockRouter, mockTranslate,
      mockModalService, mockConfigService, mockTools,
      mockEventsManager, mockApiService, mockUtils,
      mockAuthService, mockLocation
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneDetailsComponent.Name).toBe('AdesioneDetailsComponent');
  });

  it('should have model set to adesioni', () => {
    expect(component.model).toBe('adesioni');
  });

  it('should have default state', () => {
    expect(component.id).toBeNull();
    expect(component.adesione).toBeNull();
    expect(component.config).toBeNull();
  });

  it('should have close and save outputs', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  it('should initialize appConfig from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });
});
