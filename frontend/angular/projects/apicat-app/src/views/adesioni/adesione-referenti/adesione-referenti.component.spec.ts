import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AdesioneReferentiComponent } from './adesione-referenti.component';

describe('AdesioneReferentiComponent', () => {
  let component: AdesioneReferentiComponent;

  const mockRoute = { params: of({ id: 'ade-1' }), parent: { params: of({ id: 'ade-1' }) }, data: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AdesioneReferentiComponent(
      mockRoute, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockUtilService, mockAuthService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneReferentiComponent.Name).toBe('AdesioneReferentiComponent');
  });
});
