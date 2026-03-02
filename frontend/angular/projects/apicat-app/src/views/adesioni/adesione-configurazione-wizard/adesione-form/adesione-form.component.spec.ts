import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AdesioneFormComponent } from './adesione-form.component';

describe('AdesioneFormComponent', () => {
  let component: AdesioneFormComponent;

  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockFb = { group: vi.fn().mockReturnValue({ controls: {}, get: vi.fn(), patchValue: vi.fn(), reset: vi.fn() }) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    getUser: vi.fn().mockReturnValue({ ruolo: 'referente_servizio' }),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getAnagrafiche: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AdesioneFormComponent(
      mockRoute, mockRouter, mockFb, mockTranslate,
      mockApiService, mockAuthService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.id).toBe(0);
    expect(component.adesione).toBeNull();
    expect(component.servizio).toBeNull();
    expect(component.config).toBeNull();
    expect(component.grant).toBeNull();
    expect(component.editable).toBe(false);
  });
});
