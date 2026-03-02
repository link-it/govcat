import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { AdesioniComponent } from './adesioni.component';
import { Tools } from '@linkit/components';

describe('AdesioniComponent', () => {
  let component: AdesioniComponent;

  const mockRoute = { params: of({}), queryParams: of({}), data: of({}) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = {
    instant: vi.fn((k: string) => k),
    onLangChange: of({}),
  } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Services: { hideVersions: false } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue({}),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
  } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockNavigationService = {
    getState: vi.fn().mockReturnValue(null),
    saveState: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.Configurazione = {
      adesione: { workflow: { stati: [] } },
      servizio: { adesioni_multiple: [] },
    };
    component = new AdesioniComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockEventsManager, mockApiService,
      mockUtils, mockAuthService, mockModalService, mockNavigationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioniComponent.Name).toBe('AdesioniComponent');
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBeGreaterThanOrEqual(1);
  });

  it('should initialize config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });
});
