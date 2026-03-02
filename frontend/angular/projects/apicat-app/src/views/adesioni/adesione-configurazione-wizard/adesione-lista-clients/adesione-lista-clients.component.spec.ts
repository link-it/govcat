import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AdesioneListaClientsComponent } from './adesione-lista-clients.component';

describe('AdesioneListaClientsComponent', () => {
  let component: AdesioneListaClientsComponent;

  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    putElement: vi.fn().mockReturnValue(of({})),
    saveElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
  } as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
  const mockCkeckProvider = {
    check: vi.fn().mockReturnValue(of({ esito: 'ok', errori: [] })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AdesioneListaClientsComponent(
      mockModalService, mockTranslate, mockApiService,
      mockAuthService, mockUtils, mockEventsManager, mockCkeckProvider
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.id).toBe(0);
    expect(component.adesione).toBeNull();
    expect(component.config).toBeNull();
    expect(component.grant).toBeNull();
    expect(component.environment).toBe('');
    expect(component.singleColumn).toBe(false);
    expect(component.isEdit).toBe(false);
  });
});
