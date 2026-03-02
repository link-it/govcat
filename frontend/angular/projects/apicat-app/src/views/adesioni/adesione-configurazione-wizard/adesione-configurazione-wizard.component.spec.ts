import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AdesioneConfigurazioneWizardComponent } from './adesione-configurazione-wizard.component';

describe('AdesioneConfigurazioneWizardComponent', () => {
  let component: AdesioneConfigurazioneWizardComponent;

  const mockRoute = { params: of({ id: '1' }), data: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
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
  const mockCkeckProvider = {
    check: vi.fn().mockReturnValue(of({ esito: 'ok', errori: [] })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AdesioneConfigurazioneWizardComponent(
      mockRoute, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockEventsManager, mockApiService,
      mockAuthService, mockUtils, mockCkeckProvider
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneConfigurazioneWizardComponent.Name).toBe('AdesioneConfigurazioneWizardComponent');
  });

  it('should have model set to adesioni', () => {
    expect(component.model).toBe('adesioni');
  });
});
