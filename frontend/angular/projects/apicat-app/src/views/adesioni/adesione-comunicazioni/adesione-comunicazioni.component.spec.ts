import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AdesioneComunicazioniComponent } from './adesione-comunicazioni.component';

describe('AdesioneComunicazioniComponent', () => {
  let component: AdesioneComunicazioniComponent;

  const mockRoute = { params: of({ id: 'ade-1' }), parent: { params: of({ id: 'ade-1' }) }, data: of({}) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockRenderer = {} as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Layout: { enableOpenInNewTab: false } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AdesioneComunicazioniComponent(
      mockRoute, mockRouter, mockRenderer, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockAuthService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneComunicazioniComponent.Name).toBe('AdesioneComunicazioniComponent');
  });
});
