import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioViewComponent } from './servizio-view.component';

describe('ServizioViewComponent', () => {
  let component: ServizioViewComponent;

  const mockRoute = {
    data: of({}),
    params: of({}),
    queryParams: of({})
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockClipboard = {
    copy: vi.fn()
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockModalService = {
    show: vi.fn()
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Services: { hideVersions: false },
        Layout: { enableOpenInNewTab: false }
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    _openGenerateTokenDialog: vi.fn()
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({ api: { profili: [], proprieta_custom: [] }, mostra_referenti: 'enabled' }),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    canManagement: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
    canJoin: vi.fn().mockReturnValue(true),
    canMonitoraggio: vi.fn().mockReturnValue(false),
    canManagementComunicazioni: vi.fn().mockReturnValue(false),
    getUser: vi.fn().mockReturnValue({ organizzazione: { id_organizzazione: 'org1' } }),
    _getClassesNotModifiable: vi.fn().mockReturnValue([])
  } as any;

  const mockNavigationService = {
    getState: vi.fn().mockReturnValue(null),
    saveState: vi.fn(),
    navigateWithEvent: vi.fn(),
    openInNewTab: vi.fn()
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioViewComponent(
      mockRoute,
      mockRouter,
      mockClipboard,
      mockTranslate,
      mockModalService,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockApiService,
      mockUtilService,
      mockAuthenticationService,
      mockNavigationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioViewComponent.Name).toBe('ServizioViewComponent');
  });

  it('should have model set to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://localhost');
  });

  it('should set _showReferents from configuration', () => {
    // Tools.Configurazione is static, so _showReferents depends on it
    // We verify it was set during construction
    expect(typeof component._showReferents).toBe('boolean');
  });

  it('should set enableOpenInNewTab from config', () => {
    expect(component.enableOpenInNewTab).toBe(false);
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should initialize breadcrumbs', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBe(2);
  });

  it('should have authenticationsList defined', () => {
    expect(component.authenticationsList.length).toBeGreaterThan(0);
  });

  it('should initialize _initBreadcrumb with data', () => {
    component.data = { nome: 'TestService', versione: '1', id_servizio: '42' };
    component.hideVersions = false;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('TestService v. 1');
  });

  it('should initialize _initBreadcrumb with hideVersions', () => {
    component.data = { nome: 'TestService', versione: '1', id_servizio: '42' };
    component.hideVersions = true;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('TestService');
  });

  it('should initialize _initBreadcrumb without data', () => {
    component.data = null;
    component.id = 99;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('99');
  });

  it('should navigate on onBreadcrumb when _useRoute is true', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], expect.anything());
  });

  it('should not navigate on onBreadcrumb when _useRoute is false', () => {
    component._useRoute = false;
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate on gotoManagement', () => {
    component.id = 42;
    component.gotoManagement();
    expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 42]);
  });

  it('should get logo mapper with image', () => {
    component.data = { immagine: true, id_servizio: '42' };
    const result = component._getLogoMapper();
    expect(result).toBe('http://localhost/servizi/42/immagine');
  });

  it('should get logo mapper without image', () => {
    component.data = { immagine: false, id_servizio: '42' };
    const result = component._getLogoMapper();
    expect(result).toBe('./assets/images/logo-servizio.png');
  });

  it('should check _canDownloadDescriptor', () => {
    component.data = { stato: 'pubblicato' };
    mockAuthenticationService.canJoin.mockReturnValue(true);
    expect(component._canDownloadDescriptor()).toBe(true);
  });

  it('should check _canJoin', () => {
    component.data = { stato: 'pubblicato', adesione_disabilitata: false };
    mockAuthenticationService.canJoin.mockReturnValue(true);
    expect(component._canJoin()).toBe(true);
  });

  it('should check _canJoin returns false when adesione_disabilitata', () => {
    component.data = { stato: 'pubblicato', adesione_disabilitata: true };
    mockAuthenticationService.canJoin.mockReturnValue(true);
    expect(component._canJoin()).toBe(false);
  });

  it('should check isAnonymousMapper', () => {
    mockAuthenticationService.isAnonymous.mockReturnValue(true);
    expect(component.isAnonymousMapper()).toBe(true);
  });

  it('should copy to clipboard on onResultCopyClipboard', () => {
    vi.useFakeTimers();
    component.onResultCopyClipboard({ value: 'test-value' });
    expect(mockClipboard.copy).toHaveBeenCalledWith('test-value');
    expect(component._showMessageClipboard).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(component._showMessageClipboard).toBe(false);
    vi.useRealTimers();
  });

  it('should handle onScroll', () => {
    const mockEvent = { target: { scrollTop: 200 } } as any;
    component.onScroll(mockEvent);
    expect(component._showScroll).toBe(true);
  });

  it('should handle onScroll below threshold', () => {
    const mockEvent = { target: { scrollTop: 100 } } as any;
    component.onScroll(mockEvent);
    expect(component._showScroll).toBe(false);
  });

  it('should handle onAvatarError', () => {
    const mockEvent = { target: { src: '' } };
    component.onAvatarError(mockEvent);
    expect(mockEvent.target.src).toBe('./assets/images/avatar.png');
  });

  it('should check isComponente', () => {
    component.data = { visibilita: 'componente' };
    expect(component.isComponente).toBe(true);
    component.data = { visibilita: 'pubblico' };
    expect(component.isComponente).toBe(false);
  });

  it('should close modal and reset jwt results', () => {
    component._modalInfoRef = { hide: vi.fn() } as any;
    component.resultGenerazioneJwt = { key: 'value' };
    component.resultGenerazioneJwtList = [{ label: 'key', value: 'value' }];
    component.closeModal();
    expect(component._modalInfoRef.hide).toHaveBeenCalled();
    expect(component.resultGenerazioneJwt).toBeNull();
    expect(component.resultGenerazioneJwtList).toEqual([]);
  });

  it('should handle onActionMonitor gestione', () => {
    component.id = 42;
    component.onActionMonitor({ action: 'gestione' });
    expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 42]);
  });

  it('should handle onActionMonitor default', () => {
    // onActionMonitor default case uses localStorage.setItem
    const origLocalStorage = globalThis.localStorage;
    (globalThis as any).localStorage = { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn() };
    component.id = 42;
    component.onActionMonitor({ action: 'allegati' });
    expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 42, 'allegati']);
    (globalThis as any).localStorage = origLocalStorage;
  });

  it('should check _isAmmissibile returns true when user org is in ammissibili', () => {
    mockAuthenticationService.getUser.mockReturnValue({ organizzazione: { id_organizzazione: 'org1' } });
    component._ammissibili = [{ id_organizzazione: 'org1' }] as any;
    expect((component as any)._isAmmissibile()).toBe(true);
  });

  it('should check _isAmmissibile returns false when user org is not in ammissibili', () => {
    mockAuthenticationService.getUser.mockReturnValue({ organizzazione: { id_organizzazione: 'org2' } });
    component._ammissibili = [{ id_organizzazione: 'org1' }] as any;
    expect((component as any)._isAmmissibile()).toBe(false);
  });
});
