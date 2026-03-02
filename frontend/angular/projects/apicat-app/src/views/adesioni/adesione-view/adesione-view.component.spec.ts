import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AdesioneViewComponent } from './adesione-view.component';

describe('AdesioneViewComponent', () => {
  let component: AdesioneViewComponent;

  const mockRouter = { navigate: vi.fn(), navigateByUrl: vi.fn() } as any;
  const mockLocation = { back: vi.fn() } as any;
  const mockRoute = { params: of({ id: '1' }), data: of({}) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
  } as any;
  const mockNavigationService = {
    getState: vi.fn().mockReturnValue(null),
    saveState: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AdesioneViewComponent(
      mockRouter, mockLocation, mockRoute, mockTranslate,
      mockApiService, mockConfigService, mockAuthService, mockNavigationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have model set to adesioni', () => {
    expect((component as any).model).toBe('adesioni');
  });

  it('should initialize apiUrl from config', () => {
    expect((component as any).apiUrl).toBe('http://localhost');
  });
});
