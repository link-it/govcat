import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, EMPTY } from 'rxjs';
import { ServizioViewComponent } from './servizio-view.component';
import { Tools } from '@linkit/components';

describe('ServizioViewComponent', () => {
  let component: ServizioViewComponent;
  let savedConfigurazione: any;

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
    _getConfigModule: vi.fn().mockReturnValue({ api: { profili: [], proprieta_custom: [], token_policies: [] }, mostra_referenti: 'enabled' }),
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
    vi.useFakeTimers();
    savedConfigurazione = Tools.Configurazione;
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

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
    vi.useRealTimers();
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
    component.onResultCopyClipboard({ value: 'test-value' });
    expect(mockClipboard.copy).toHaveBeenCalledWith('test-value');
    expect(component._showMessageClipboard).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(component._showMessageClipboard).toBe(false);
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

  // ====================================================================
  // NEW TESTS
  // ====================================================================

  describe('ngOnInit', () => {
    it('should subscribe to route params and load config when sid is present', () => {
      const mockRouteWithSid = {
        data: of({}),
        params: of({ sid: '123' }),
        queryParams: of({})
      } as any;
      const configData = { editSingleColumn: true, swagger: { allowTryIt: true, showAuthorizeBtn: true } };
      mockConfigService.getConfig.mockReturnValue(of(configData));
      mockApiService.getDetails.mockReturnValue(of({}));
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      const comp = new ServizioViewComponent(
        mockRouteWithSid, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );
      comp.ngOnInit();

      expect(comp.id).toBe('123');
      expect(comp.config).toEqual(configData);
      expect(comp._singleColumn).toBe(true);
      expect(comp.allowTryIt).toBe(true);
      expect(comp.showAuthorizeBtn).toBe(true);
    });

    it('should not load when sid is absent', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockRouteNoSid = {
        data: of({}),
        params: of({ other: 'value' }),
        queryParams: of({})
      } as any;
      const comp = new ServizioViewComponent(
        mockRouteNoSid, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );
      comp.ngOnInit();

      expect(mockConfigService.getConfig).not.toHaveBeenCalledWith('servizi');
      consoleSpy.mockRestore();
    });

    it('should register PROFILE_UPDATE event handler that updates profili and proprieta_custom', () => {
      component.ngOnInit();

      expect(mockEventsManagerService.on).toHaveBeenCalled();
      const eventType = mockEventsManagerService.on.mock.calls[0][0];
      const handler = mockEventsManagerService.on.mock.calls[0][1];

      expect(eventType).toBe('PROFILE:UPDATE');

      // Set up Tools.Configurazione so the handler can read it
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'test' }],
            proprieta_custom: [{ nome_gruppo: 'grp1' }]
          }
        }
      };

      handler({});

      expect(component._profili).toEqual([{ codice_interno: 'test' }]);
      expect(component._proprieta_custom).toEqual([{ nome_gruppo: 'grp1' }]);
    });

    it('should set defaults for config without swagger section', () => {
      const mockRouteWithSid = {
        data: of({}),
        params: of({ sid: '1' }),
        queryParams: of({})
      } as any;
      mockConfigService.getConfig.mockReturnValue(of({ editSingleColumn: false }));
      mockApiService.getDetails.mockReturnValue(of({}));
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      const comp = new ServizioViewComponent(
        mockRouteWithSid, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );
      comp.ngOnInit();

      expect(comp.allowTryIt).toBe(false);
      expect(comp.showAuthorizeBtn).toBe(false);
    });
  });

  describe('_loadService', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should do nothing when id is null', () => {
      component.id = null;
      (component as any)._loadService();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load grant then service details on success', () => {
      component.id = 10;
      const grantData = { ruoli: ['referente'] };
      const serviceData = { nome: 'Svc', stato: 'pubblicato', adesione_disabilitata: true, utente_richiedente: {} };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(of(serviceData));

      // Stub loadCurrentData to prevent cascading calls
      const loadCurrentDataSpy = vi.spyOn(component, 'loadCurrentData').mockImplementation(() => {});

      (component as any)._loadService();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10, 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10);
      expect(component._grant).toEqual(grantData);
      expect(component.data).toEqual(serviceData);
      expect(component._spin).toBe(false);
      expect(loadCurrentDataSpy).toHaveBeenCalled();
    });

    it('should call _loadAdesioneData when not anonymous', () => {
      component.id = 10;
      const grantData = { ruoli: [] };
      const serviceData = { nome: 'Svc', stato: 'pubblicato', adesione_disabilitata: false };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(of(serviceData))
        .mockReturnValueOnce(of({ content: [] })); // ammissibili
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      mockAuthenticationService.isAnonymous.mockReturnValue(false);

      vi.spyOn(component, 'loadCurrentData').mockImplementation(() => {});

      (component as any)._loadService();

      // _loadAdesioneData uses forkJoin with getList('adesioni') and getDetails('servizi', id, 'ammissibili')
      expect(mockApiService.getList).toHaveBeenCalledWith('adesioni', expect.anything());
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 10, 'ammissibili');
      expect(component._adesioneDataReady).toBe(true);
    });

    it('should NOT call _loadAdesioneData when user is anonymous', () => {
      component.id = 10;
      const grantData = { ruoli: [] };
      const serviceData = { nome: 'Svc', stato: 'pubblicato', adesione_disabilitata: false };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(of(serviceData));
      mockAuthenticationService.isAnonymous.mockReturnValue(true);

      vi.spyOn(component, 'loadCurrentData').mockImplementation(() => {});

      (component as any)._loadService();

      expect(mockApiService.getList).not.toHaveBeenCalled();
      expect(component._adesioneDataReady).toBe(true);
    });

    it('should handle grant error', () => {
      component.id = 10;
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => ({ status: 500 })));

      (component as any)._loadService();

      expect(Tools.OnError).toHaveBeenCalledWith({ status: 500 });
      expect(component._spin).toBe(false);
    });

    it('should handle service details error after grant success', () => {
      component.id = 10;
      const grantData = { ruoli: [] };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(throwError(() => ({ status: 404 })));

      (component as any)._loadService();

      expect(component._grant).toEqual(grantData);
      expect(Tools.OnError).toHaveBeenCalledWith({ status: 404 });
      expect(component._spin).toBe(false);
    });

    it('should set data to null when spin=true (default)', () => {
      component.id = 10;
      component.data = { nome: 'old' };
      mockApiService.getDetails.mockReturnValue(EMPTY);

      (component as any)._loadService(true);

      expect(component.data).toBeNull();
      expect(component._spin).toBe(true);
    });

    it('should NOT set data to null when spin=false', () => {
      component.id = 10;
      component.data = { nome: 'old' };
      mockApiService.getDetails.mockReturnValue(EMPTY);

      (component as any)._loadService(false);

      expect(component.data).toEqual({ nome: 'old' });
      expect(component._spin).toBe(false);
    });
  });

  describe('_loadAdesioneData', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should do nothing when id is null', () => {
      component.id = null;
      (component as any)._loadAdesioneData();
      expect(mockApiService.getList).not.toHaveBeenCalled();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set _hasJoined to true and _ammissibili on success', () => {
      component.id = 5;
      const ammissibiliContent = [{ id_organizzazione: 'org1' }, { id_organizzazione: 'org2' }];
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }] }));
      mockApiService.getDetails.mockReturnValue(of({ content: ammissibiliContent }));

      (component as any)._loadAdesioneData();

      expect(component._hasJoined).toBe(true);
      expect(component._ammissibili).toEqual(ammissibiliContent);
      expect(component._adesioneDataReady).toBe(true);
      expect(component._updateData).toBeTruthy();
    });

    it('should set _hasJoined to false when joined content is empty', () => {
      component.id = 5;
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      (component as any)._loadAdesioneData();

      expect(component._hasJoined).toBe(false);
      expect(component._adesioneDataReady).toBe(true);
    });

    it('should handle error', () => {
      component.id = 5;
      mockApiService.getList.mockReturnValue(throwError(() => ({ status: 500 })));
      mockApiService.getDetails.mockReturnValue(throwError(() => ({ status: 500 })));

      (component as any)._loadAdesioneData();

      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._adesioneDataReady).toBe(true);
    });
  });

  describe('loadCurrentData', () => {
    it('should set richiedente and call loadReferenti and _loadServiceApi', () => {
      component.data = { utente_richiedente: { nome: 'Mario', cognome: 'Rossi' } };
      const loadReferentiSpy = vi.spyOn(component, 'loadReferenti').mockImplementation(() => {});
      const loadServiceApiSpy = vi.spyOn(component as any, '_loadServiceApi').mockImplementation(() => {});

      component.loadCurrentData();

      expect(component.richiedente).toEqual({ nome: 'Mario', cognome: 'Rossi' });
      expect(loadReferentiSpy).toHaveBeenCalled();
      expect(loadServiceApiSpy).toHaveBeenCalled();
    });
  });

  describe('loadReferenti', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should skip loading when _showReferents is false', () => {
      component._showReferents = false;
      component.loadReferenti();
      expect(component.referentiLoading).toBe(false);
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load and merge referents with deduplication on success', () => {
      component._showReferents = true;
      component.data = { dominio: { id_dominio: 'dom1' } };
      component.id = 10;
      component.config = { showDomainReferent: true, showTechnicalReferent: true };

      const serviceReferents = {
        content: [
          { utente: { id_utente: 'u1', nome: 'Mario', cognome: 'Rossi', email_aziendale: 'm@r.it', ruolo: 'referente_servizio' }, tipo: 'referente' },
          { utente: { id_utente: 'u2', nome: 'Luca', cognome: 'Bianchi', email_aziendale: 'l@b.it', ruolo: 'referente_tecnico' }, tipo: 'referente_tecnico' }
        ]
      };
      const domainReferents = {
        content: [
          { utente: { id_utente: 'u1', nome: 'Mario', cognome: 'Rossi', email_aziendale: 'm@r.it', ruolo: 'referente_dominio' }, tipo: 'referente' }
        ]
      };

      mockApiService.getDetails.mockImplementation((model: string, id: any, sub?: string) => {
        if (model === 'servizi' && sub === 'referenti') return of(serviceReferents);
        if (model === 'domini' && sub === 'referenti') return of(domainReferents);
        return of({});
      });

      component.loadReferenti();

      expect(component.referentiLoading).toBe(false);
      expect(component.referenti.length).toBeGreaterThan(0);

      // Check deduplication: u1 should appear once with multiple types
      const u1 = component.referenti.find(r => r.id === 'u1');
      expect(u1).toBeTruthy();
      expect(u1!.types.length).toBe(2); // referente_dominio + referente_servizio (or ruolo)
    });

    it('should filter out domain referents when showDomainReferent is false', () => {
      component._showReferents = true;
      component.data = { dominio: { id_dominio: 'dom1' } };
      component.id = 10;
      component.config = { showDomainReferent: false, showTechnicalReferent: true };

      const serviceReferents = {
        content: [
          { utente: { id_utente: 'u2', nome: 'Luca', cognome: 'Bianchi', email_aziendale: 'l@b.it', ruolo: 'referente_servizio' }, tipo: 'referente' }
        ]
      };
      const domainReferents = {
        content: [
          { utente: { id_utente: 'u1', nome: 'Mario', cognome: 'Rossi', email_aziendale: 'm@r.it', ruolo: 'referente_dominio' }, tipo: 'referente' }
        ]
      };

      mockApiService.getDetails.mockImplementation((model: string, id: any, sub?: string) => {
        if (model === 'servizi' && sub === 'referenti') return of(serviceReferents);
        if (model === 'domini' && sub === 'referenti') return of(domainReferents);
        return of({});
      });

      component.loadReferenti();

      // Domain referent should be filtered out
      const u1 = component.referenti.find(r => r.id === 'u1');
      expect(u1).toBeUndefined();
    });

    it('should filter out technical referents when showTechnicalReferent is false', () => {
      component._showReferents = true;
      component.data = { dominio: { id_dominio: 'dom1' } };
      component.id = 10;
      component.config = { showDomainReferent: false, showTechnicalReferent: false };

      const serviceReferents = {
        content: [
          { utente: { id_utente: 'u2', nome: 'Luca', cognome: 'Bianchi', email_aziendale: 'l@b.it', ruolo: '' }, tipo: 'referente_tecnico' }
        ]
      };
      const domainReferents = { content: [] };

      mockApiService.getDetails.mockImplementation((model: string, id: any, sub?: string) => {
        if (model === 'servizi' && sub === 'referenti') return of(serviceReferents);
        if (model === 'domini' && sub === 'referenti') return of(domainReferents);
        return of({});
      });

      component.loadReferenti();

      // Technical referent should be filtered out because showTechnicalReferent is false
      // tipo 'referente_tecnico' -> mapped to 'referente_tecnico_servizio' -> excluded
      expect(component.referenti.length).toBe(0);
    });

    it('should handle error in forkJoin', () => {
      component._showReferents = true;
      component.data = { dominio: { id_dominio: 'dom1' } };
      component.id = 10;
      component.config = { showDomainReferent: true, showTechnicalReferent: true };

      mockApiService.getDetails.mockImplementation(() => {
        return throwError(() => ({ status: 500 }));
      });

      component.loadReferenti();

      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
      expect(component.referentiLoading).toBe(false);
    });
  });

  describe('_loadServiceApi', () => {
    it('should load api config and then call _loadApis', () => {
      const apiConfig = { itemRowView: { secondaryText: [] }, options: {} };
      mockConfigService.getConfig.mockReturnValueOnce(of(apiConfig));
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      const loadApisSpy = vi.spyOn(component as any, '_loadApis').mockImplementation(() => {});

      (component as any)._loadServiceApi();

      expect(mockConfigService.getConfig).toHaveBeenCalledWith('api');
      expect(component.apiConfigCopy).toEqual(apiConfig);
      expect(component.apiConfig).toEqual(apiConfig);
      expect(loadApisSpy).toHaveBeenCalled();
    });
  });

  describe('_loadApis', () => {
    beforeEach(() => {
      component.id = 10;
      component._environmentId = 'collaudo';
      component._proprieta_custom = [];
      // Provide a valid apiConfigCopy
      component.apiConfigCopy = { itemRowView: { secondaryText: [] }, options: {} };
      component.apiConfig = { itemRowView: { secondaryText: [] }, options: {} };
    });

    it('should call forkJoin with dominio and aderente queries', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      (component as any)._loadApis();

      // Two calls to getList for dominio and aderente roles
      expect(mockApiService.getList).toHaveBeenCalledTimes(2);
      expect(component.serviceApiLoading).toBe(false);
      expect(component.serviceApiDominio).toEqual([]);
      expect(component.serviceApiAderente).toEqual([]);
    });

    it('should set _singleApi when only one dominio api and no aderente apis', () => {
      const apiDetail = {
        id_api: 'api1',
        nome: 'TestApi',
        versione: 1,
        descrizione: 'desc',
        codice_asset: 'ASSET1',
        ruolo: 'erogato_soggetto_dominio',
        proprieta_custom: [],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }]
      };
      mockApiService.getList
        .mockReturnValueOnce(of({ content: [apiDetail] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      expect(component._singleApi).toBe(true);
    });

    it('should set _singleApi to false when multiple dominio apis exist', () => {
      const api1 = { id_api: 'a1', proprieta_custom: [], gruppi_auth_type: [{ profilo: 'pdnd' }] };
      const api2 = { id_api: 'a2', proprieta_custom: [], gruppi_auth_type: [{ profilo: 'pdnd' }] };
      mockApiService.getList
        .mockReturnValueOnce(of({ content: [api1, api2] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      expect(component._singleApi).toBe(false);
    });

    it('should map custom properties for dominio APIs', () => {
      component._proprieta_custom = [{
        nome_gruppo: 'Gruppo1',
        label_gruppo: 'Label1',
        classe_dato: 'collaudo',
        proprieta: [{
          nome: 'prop1',
          etichetta: 'Prop 1',
          tipo: 'text' as const,
          required: false,
          vetrina: { label: 'Prop Label', template: 'Value: ${valore}' }
        }]
      }];

      const apiDetail = {
        id_api: 'api1',
        nome: 'TestApi',
        versione: 1,
        descrizione: 'desc',
        codice_asset: 'ASSET1',
        ruolo: 'erogato_soggetto_dominio',
        proprieta_custom: [{
          gruppo: 'Gruppo1',
          proprieta: [{ nome: 'prop1', valore: 'val1' }]
        }],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }]
      };

      mockApiService.getList
        .mockReturnValueOnce(of({ content: [apiDetail] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      expect(component.serviceApiDominio.length).toBe(1);
      expect(component.serviceApiDominio[0].prop1).toBe('Value: val1');
    });

    it('should use default label when multiple gruppi_auth_type exist', () => {
      const apiDetail = {
        id_api: 'api1',
        nome: 'TestApi',
        versione: 1,
        descrizione: 'desc',
        codice_asset: 'ASSET1',
        ruolo: 'erogato_soggetto_dominio',
        proprieta_custom: [],
        gruppi_auth_type: [
          { profilo: 'pdnd', resources: [], note: '' },
          { profilo: 'code_grant', resources: [], note: '' }
        ]
      };

      mockApiService.getList
        .mockReturnValueOnce(of({ content: [apiDetail] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      // With multiple gruppi_auth_type, tipProfiloValue = translate('APP.LABEL.Multipli')
      expect(component.serviceApiDominio[0].tipo_profilo).toContain('APP.LABEL.Profilo');
    });

    it('should handle forkJoin error', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      // Individual catchError in each observable catches individual errors, so forkJoin error is unlikely.
      // But we can test the outer error handler by making forkJoin fail
      mockApiService.getList.mockReturnValue(throwError(() => new Error('network')));

      (component as any)._loadApis();

      // The catchError inside each pipe should catch and return { content: [] }
      // so even if getList throws, it should not reach the outer error
      expect(component.serviceApiLoading).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should map aderente APIs', () => {
      const aderente = { id_api: 'a2', nome: 'AderenteApi', versione: 1, proprieta_custom: [] };
      mockApiService.getList
        .mockReturnValueOnce(of({ content: [] }))
        .mockReturnValueOnce(of({ content: [aderente] }));

      (component as any)._loadApis();

      expect(component.serviceApiAderente.length).toBe(1);
      expect(component.serviceApiAderente[0].id_api).toBe('a2');
      expect(component._singleApi).toBe(false);
    });
  });

  describe('_getProfiloLabelMapper', () => {
    it('should return etichetta when profilo is found', () => {
      component._profili = [
        { codice_interno: 'pdnd', etichetta: 'PDND Profile' },
        { codice_interno: 'code_grant', etichetta: 'Code Grant' }
      ];

      const result = (component as any)._getProfiloLabelMapper('pdnd');
      expect(result).toBe('PDND Profile');
    });

    it('should return the code itself when profilo is not found', () => {
      component._profili = [
        { codice_interno: 'pdnd', etichetta: 'PDND Profile' }
      ];

      const result = (component as any)._getProfiloLabelMapper('unknown_code');
      expect(result).toBe('unknown_code');
    });

    it('should return code when _profili is empty', () => {
      component._profili = [];

      const result = (component as any)._getProfiloLabelMapper('any');
      expect(result).toBe('any');
    });
  });

  describe('_getApiUrlMapper', () => {
    it('should return url with try_out mode when allowTryIt is true', () => {
      component.allowTryIt = true;
      component._environmentId = 'collaudo';
      const api = { id_api: 'api123' };

      const result = component._getApiUrlMapper(api);

      expect(result).toBe('http://localhost/api/api123/specifica/collaudo/download?mode=try_out');
    });

    it('should return url with visualizzazione mode when allowTryIt is false', () => {
      component.allowTryIt = false;
      component._environmentId = 'produzione';
      const api = { id_api: 'api456' };

      const result = component._getApiUrlMapper(api);

      expect(result).toBe('http://localhost/api/api456/specifica/produzione/download?mode=visualizzazione');
    });

    it('should return empty string when api is null', () => {
      const result = component._getApiUrlMapper(null);
      expect(result).toBe('');
    });

    it('should return empty string when api is undefined', () => {
      const result = component._getApiUrlMapper(undefined);
      expect(result).toBe('');
    });
  });

  describe('_downloadServizioExport', () => {
    it('should download and call saveAs on success', () => {
      component.id = 10;
      const mockResponse = {
        body: new Blob(['test']),
        headers: { get: vi.fn().mockReturnValue('attachment; filename="export.zip"') }
      };
      mockApiService.download.mockReturnValueOnce(of(mockResponse));
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('export.zip');
      (globalThis as any).saveAs = vi.fn();

      (component as any)._downloadServizioExport();

      expect(mockApiService.download).toHaveBeenCalledWith('servizi', 10, 'export');
      expect(Tools.GetFilenameFromHeader).toHaveBeenCalledWith(mockResponse);
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(mockResponse.body, 'export.zip');
      expect(component._downloading).toBe(false);
      expect(component._error).toBe(false);

      delete (globalThis as any).saveAs;
    });

    it('should set error state on failure', () => {
      component.id = 10;
      mockApiService.download.mockReturnValueOnce(throwError(() => ({ status: 500 })));
      mockUtilService.GetErrorMsg.mockReturnValue('Download failed');

      (component as any)._downloadServizioExport();

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Download failed');
      expect(component._downloading).toBe(false);
    });

    it('should set _downloading to true initially', () => {
      component.id = 10;
      mockApiService.download.mockReturnValue(EMPTY);

      (component as any)._downloadServizioExport();

      expect(component._downloading).toBe(true);
    });
  });

  describe('_onActionApi', () => {
    it('should download api spec and call saveAs on success', () => {
      component._environmentId = 'collaudo';
      const event = { id_api: 'api1' };
      const mockResponse = {
        body: new Blob(['spec']),
        headers: { get: vi.fn().mockReturnValue('attachment; filename="api.yaml"') }
      };
      mockApiService.download.mockReturnValueOnce(of(mockResponse));
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('api.yaml');
      (globalThis as any).saveAs = vi.fn();

      (component as any)._onActionApi(event);

      expect(mockApiService.download).toHaveBeenCalledWith('api', 'api1', 'specifica/collaudo/download?includi_doc_allegati=true');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(mockResponse.body, 'api.yaml');
      expect(component._downloading).toBe(false);

      delete (globalThis as any).saveAs;
    });

    it('should set error state on failure', () => {
      const event = { id_api: 'api1' };
      mockApiService.download.mockReturnValueOnce(throwError(() => ({ status: 403 })));
      mockUtilService.GetErrorMsg.mockReturnValue('Forbidden');

      (component as any)._onActionApi(event);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Forbidden');
      expect(component._downloading).toBe(false);
    });
  });

  describe('_onGenerateToken', () => {
    beforeEach(() => {
      vi.spyOn(Tools, 'Alert').mockImplementation(() => {});
    });

    it('should open ClientCredentialsDialogComponent for client_credentials type', () => {
      (component as any)._onGenerateToken('client_credentials');

      expect(mockUtilService._openGenerateTokenDialog).toHaveBeenCalled();
      const args = mockUtilService._openGenerateTokenDialog.mock.calls[0];
      // First arg is the component class - we just check it was called
      expect(args[0]).toBeDefined();
      expect(component.generateJwtOpened).toBe(true);
      expect(component.resultGenerazioneJwt).toBeNull();
      expect(component.resultGenerazioneJwtList).toEqual([]);
    });

    it('should open CodeGrantDialogComponent for code_grant type', () => {
      (component as any)._onGenerateToken('code_grant');
      expect(mockUtilService._openGenerateTokenDialog).toHaveBeenCalled();
    });

    it('should open AgidJwtDialogComponent for pdnd type', () => {
      (component as any)._onGenerateToken('pdnd');
      expect(mockUtilService._openGenerateTokenDialog).toHaveBeenCalled();
    });

    it('should open AgidJwtTrackingEvidenceDialogComponent for pdnd_audit type', () => {
      (component as any)._onGenerateToken('pdnd_audit');
      expect(mockUtilService._openGenerateTokenDialog).toHaveBeenCalled();
    });

    it('should open AgidJwtSignatureDialogComponent for pdnd_integrity type', () => {
      (component as any)._onGenerateToken('pdnd_integrity');
      expect(mockUtilService._openGenerateTokenDialog).toHaveBeenCalled();
    });

    it('should open AgidJwtSignatureTrackingEvidenceDialogComponent for pdnd_audit_integrity type', () => {
      (component as any)._onGenerateToken('pdnd_audit_integrity');
      expect(mockUtilService._openGenerateTokenDialog).toHaveBeenCalled();
    });

    it('should call Tools.Alert for unknown type (null component)', () => {
      (component as any)._onGenerateToken('unknown_type');

      expect(mockUtilService._openGenerateTokenDialog).not.toHaveBeenCalled();
      expect(Tools.Alert).toHaveBeenCalledWith('APP.AUTHENTICATION.MESSAGE.NoTokenGenerator');
    });

    it('should pass tokenPolicy and debug as initialState', () => {
      component.tokenPolicy = { tipo_policy: 'pdnd', codice_policy: 'pdnd_code' };

      (component as any)._onGenerateToken('client_credentials');

      const initialState = mockUtilService._openGenerateTokenDialog.mock.calls[0][1];
      expect(initialState.tokenPolicy).toEqual({ tipo_policy: 'pdnd', codice_policy: 'pdnd_code' });
      expect(typeof initialState.debug).toBe('boolean');
    });

    it('should handle callback with result data', () => {
      (component as any)._onGenerateToken('pdnd');

      const callback = mockUtilService._openGenerateTokenDialog.mock.calls[0][2];

      // Mock document.body.classList
      const origClassList = document.body.classList;
      const addSpy = vi.spyOn(document.body.classList, 'add').mockImplementation(() => {});

      callback({ result: { access_token: 'abc123', token_type: 'bearer' } });

      expect(component.generateJwtOpened).toBe(false);
      expect(addSpy).toHaveBeenCalledWith('modal-open');
      expect(component.resultGenerazioneJwt).toEqual({ access_token: 'abc123', token_type: 'bearer' });
      expect(component.resultGenerazioneJwtList).toEqual([
        { label: 'access_token', value: 'abc123' },
        { label: 'token_type', value: 'bearer' }
      ]);

      addSpy.mockRestore();
    });

    it('should handle callback with empty result object', () => {
      (component as any)._onGenerateToken('pdnd');
      const callback = mockUtilService._openGenerateTokenDialog.mock.calls[0][2];

      const addSpy = vi.spyOn(document.body.classList, 'add').mockImplementation(() => {});
      callback({ result: {} });

      expect(component.resultGenerazioneJwt).toBeNull();
      expect(component.resultGenerazioneJwtList).toEqual([]);
      addSpy.mockRestore();
    });

    it('should handle callback with null data', () => {
      (component as any)._onGenerateToken('pdnd');
      const callback = mockUtilService._openGenerateTokenDialog.mock.calls[0][2];

      const addSpy = vi.spyOn(document.body.classList, 'add').mockImplementation(() => {});
      callback(null);

      expect(component.generateJwtOpened).toBe(false);
      addSpy.mockRestore();
    });
  });

  describe('_canJoinMapper', () => {
    it('should return true when canJoin is true and not componente', () => {
      component.data = { stato: 'pubblicato', adesione_disabilitata: false, visibilita: 'pubblico' };
      mockAuthenticationService.canJoin.mockReturnValue(true);

      expect(component._canJoinMapper()).toBe(true);
    });

    it('should return false when canJoin but is componente', () => {
      component.data = { stato: 'pubblicato', adesione_disabilitata: false, visibilita: 'componente' };
      mockAuthenticationService.canJoin.mockReturnValue(true);

      expect(component._canJoinMapper()).toBe(false);
    });

    it('should return false when adesione_disabilitata', () => {
      component.data = { stato: 'pubblicato', adesione_disabilitata: true, visibilita: 'pubblico' };
      mockAuthenticationService.canJoin.mockReturnValue(true);

      expect(component._canJoinMapper()).toBe(false);
    });
  });

  describe('_canEditMapper', () => {
    it('should delegate to authenticationService.canEdit', () => {
      component.data = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canEdit.mockReturnValue(true);

      expect(component._canEditMapper()).toBe(true);
      expect(mockAuthenticationService.canEdit).toHaveBeenCalledWith('servizio', 'servizio', 'pubblicato', ['referente']);
    });

    it('should return false when canEdit returns false', () => {
      component.data = { stato: 'bozza' };
      component._grant = { ruoli: [], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canEdit.mockReturnValue(false);

      expect(component._canEditMapper()).toBe(false);
    });

    it('should pass null grant ruoli when _grant is null', () => {
      component.data = { stato: 'pubblicato' };
      component._grant = null;
      mockAuthenticationService.canEdit.mockReturnValue(false);

      component._canEditMapper();

      expect(mockAuthenticationService.canEdit).toHaveBeenCalledWith('servizio', 'servizio', 'pubblicato', undefined);
    });
  });

  describe('_canManagementMapper', () => {
    it('should return canManagement when not a package', () => {
      component.data = { stato: 'pubblicato', package: false };
      component._grant = { ruoli: ['referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canManagement.mockReturnValue(true);
      mockAuthenticationService.isGestore.mockReturnValue(false);

      expect(component._canManagementMapper()).toBe(true);
    });

    it('should return isGestore when is a package', () => {
      component.data = { stato: 'pubblicato', package: true };
      component._grant = { ruoli: ['gestore'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canManagement.mockReturnValue(true);
      mockAuthenticationService.isGestore.mockReturnValue(true);

      expect(component._canManagementMapper()).toBe(true);
    });

    it('should return false for package when not gestore', () => {
      component.data = { stato: 'pubblicato', package: true };
      component._grant = { ruoli: ['referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canManagement.mockReturnValue(true);
      mockAuthenticationService.isGestore.mockReturnValue(false);

      expect(component._canManagementMapper()).toBe(false);
    });
  });

  describe('_canMonitoraggioMapper', () => {
    it('should delegate to authenticationService.canMonitoraggio', () => {
      component._grant = { ruoli: ['gestore'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canMonitoraggio.mockReturnValue(true);

      expect(component._canMonitoraggioMapper()).toBe(true);
      expect(mockAuthenticationService.canMonitoraggio).toHaveBeenCalledWith(['gestore']);
    });

    it('should return false when canMonitoraggio returns false', () => {
      component._grant = { ruoli: [], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canMonitoraggio.mockReturnValue(false);

      expect(component._canMonitoraggioMapper()).toBe(false);
    });

    it('should pass undefined when _grant is null', () => {
      component._grant = null;
      mockAuthenticationService.canMonitoraggio.mockReturnValue(false);

      component._canMonitoraggioMapper();

      expect(mockAuthenticationService.canMonitoraggio).toHaveBeenCalledWith(undefined);
    });
  });

  describe('_canManagementComunicazioniMapper', () => {
    it('should return true when data exists and canManagementComunicazioni is true', () => {
      component.data = { stato: 'pubblicato' };
      component._grant = { ruoli: ['referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canManagementComunicazioni.mockReturnValue(true);

      expect(component._canManagementComunicazioniMapper()).toBe(true);
    });

    it('should return falsy when data is null', () => {
      component.data = null;
      component._grant = { ruoli: ['referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };

      expect(component._canManagementComunicazioniMapper()).toBeFalsy();
    });

    it('should return false when canManagementComunicazioni returns false', () => {
      component.data = { stato: 'bozza' };
      component._grant = { ruoli: [], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.canManagementComunicazioni.mockReturnValue(false);

      expect(component._canManagementComunicazioniMapper()).toBe(false);
    });
  });

  describe('_isGestoreMapper', () => {
    it('should return true when user is gestore', () => {
      component._grant = { ruoli: ['gestore'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.isGestore.mockReturnValue(true);

      expect(component._isGestoreMapper()).toBe(true);
      expect(mockAuthenticationService.isGestore).toHaveBeenCalledWith(['gestore']);
    });

    it('should return false when user is not gestore', () => {
      component._grant = { ruoli: ['referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };
      mockAuthenticationService.isGestore.mockReturnValue(false);

      expect(component._isGestoreMapper()).toBe(false);
    });

    it('should pass undefined when _grant is null', () => {
      component._grant = null;
      mockAuthenticationService.isGestore.mockReturnValue(false);

      component._isGestoreMapper();

      expect(mockAuthenticationService.isGestore).toHaveBeenCalledWith(undefined);
    });
  });

  describe('_isReferenteMapper', () => {
    it('should return true when referente is in grant ruoli', () => {
      component._grant = { ruoli: ['referente', 'gestore'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };

      expect(component._isReferenteMapper()).toBe(true);
    });

    it('should return false when referente is not in grant ruoli', () => {
      component._grant = { ruoli: ['gestore'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };

      expect(component._isReferenteMapper()).toBe(false);
    });

    it('should return false when _grant is null', () => {
      component._grant = null;
      // _.indexOf(undefined, 'referente') returns -1
      expect(component._isReferenteMapper()).toBe(false);
    });
  });

  describe('_isReferenteTecnicoAdesioneMapper', () => {
    it('should return true when referente_tecnico is in grant ruoli', () => {
      component._grant = { ruoli: ['referente_tecnico', 'referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };

      expect(component._isReferenteTecnicoAdesioneMapper()).toBe(true);
    });

    it('should return false when referente_tecnico is not in grant ruoli', () => {
      component._grant = { ruoli: ['referente'], identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura', collaudo: 'lettura', produzione: 'lettura' };

      expect(component._isReferenteTecnicoAdesioneMapper()).toBe(false);
    });

    it('should return false when _grant is null', () => {
      component._grant = null;

      expect(component._isReferenteTecnicoAdesioneMapper()).toBe(false);
    });
  });

  describe('_joinServizio', () => {
    it('should navigate to new adesione edit page', () => {
      component.id = 42;

      (component as any)._joinServizio();

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 42, 'adesioni', 'new', 'edit'], { web: true });
    });

    it('should pass mouse event when provided', () => {
      component.id = 42;
      const mockEvent = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;

      (component as any)._joinServizio(mockEvent);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 42, 'adesioni', 'new', 'edit'], { web: true });
    });
  });

  describe('_gotoAdesione', () => {
    it('should navigate to adesioni page with web flag', () => {
      component.id = 42;

      (component as any)._gotoAdesione();

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 42, 'adesioni'], { web: true });
    });

    it('should pass mouse event when provided', () => {
      component.id = 42;
      const mockEvent = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;

      (component as any)._gotoAdesione(mockEvent);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 42, 'adesioni'], { web: true });
    });
  });

  describe('_gotoAdesioni', () => {
    it('should navigate to adesioni page without web flag', () => {
      component.id = 42;

      (component as any)._gotoAdesioni();

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 42, 'adesioni']);
    });

    it('should pass mouse event when provided', () => {
      component.id = 42;
      const mockEvent = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;

      (component as any)._gotoAdesioni(mockEvent);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 42, 'adesioni']);
    });
  });

  describe('_openJoinServizioInNewTab', () => {
    it('should stop propagation and open join route in new tab', () => {
      component.id = 42;
      const mockEvent = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;

      (component as any)._openJoinServizioInNewTab(mockEvent);

      expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['servizi', 42, 'adesioni', 'new', 'edit']);
    });
  });

  describe('_openAdesioniInNewTab', () => {
    it('should stop propagation and open adesioni route in new tab', () => {
      component.id = 42;
      const mockEvent = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;

      (component as any)._openAdesioniInNewTab(mockEvent);

      expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['servizi', 42, 'adesioni']);
    });
  });

  describe('ngOnChanges', () => {
    it('should update id and call _loadAll when id changes', () => {
      const loadAllSpy = vi.spyOn(component as any, '_loadAll').mockImplementation(() => {});
      const changes = {
        id: { currentValue: 99, previousValue: 42, firstChange: false, isFirstChange: () => false }
      } as any;

      component.ngOnChanges(changes);

      expect(component.id).toBe(99);
      expect(loadAllSpy).toHaveBeenCalled();
    });

    it('should not do anything when id is not in changes', () => {
      const loadAllSpy = vi.spyOn(component as any, '_loadAll').mockImplementation(() => {});
      const changes = {
        someOtherProp: { currentValue: 'x', previousValue: 'y', firstChange: false, isFirstChange: () => false }
      } as any;

      component.ngOnChanges(changes);

      expect(loadAllSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop to true when window width >= 992', () => {
      // window.innerWidth is not easily mockable, but we can test the current behavior
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop to false when window width < 992', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(false);
    });

    it('should set desktop to true when window width === 992', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 992 });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(true);
    });
  });

  describe('_onShowApi', () => {
    beforeEach(() => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'pdnd', codice_token_policy: 'pdnd_policy' }],
            token_policies: [{ tipo_policy: 'pdnd', codice_policy: 'pdnd_policy' }]
          }
        }
      };
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {
          profili: [{ codice_interno: 'pdnd', codice_token_policy: 'pdnd_policy' }],
          token_policies: [{ tipo_policy: 'pdnd', codice_policy: 'pdnd_policy' }]
        }
      });
    });

    it('should set _currentApi and open modal for collaudo', () => {
      component._environmentId = 'collaudo';
      component.allowTryIt = true;
      component.openApiInfoTemplate = {} as any;
      mockModalService.show.mockReturnValue({ hide: vi.fn() });

      const apiData = {
        id_api: 'api1',
        nome: 'TestApi',
        versione: 1,
        descrizione: 'desc',
        codice_asset: 'ASSET',
        ruolo: 'erogato_soggetto_dominio',
        proprieta_custom: [],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }],
        configurazione_collaudo: { protocollo: 'rest', protocollo_dettaglio: 'openapi3', dati_erogazione: {} },
        configurazione_produzione: null
      } as any;

      (component as any)._onShowApi({}, apiData);

      expect(component._currentApi).toBe(apiData);
      expect(component._currentApiConfiguration).toEqual(apiData.configurazione_collaudo);
      expect(component.codiceTokenPolicy).toBe('pdnd_policy');
      expect(component.showJwtGenerator).toBe(true); // allowTryIt && collaudo != produzione
      expect(mockModalService.show).toHaveBeenCalled();
    });

    it('should set showJwtGenerator to false for produzione', () => {
      component._environmentId = 'produzione';
      component.allowTryIt = true;
      component.openApiInfoTemplate = {} as any;
      mockModalService.show.mockReturnValue({ hide: vi.fn() });

      const apiData = {
        id_api: 'api1',
        nome: 'TestApi',
        versione: 1,
        descrizione: 'desc',
        codice_asset: 'ASSET',
        ruolo: 'erogato_soggetto_dominio',
        proprieta_custom: [],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }],
        configurazione_collaudo: null,
        configurazione_produzione: { protocollo: 'rest', protocollo_dettaglio: 'openapi3', dati_erogazione: {} }
      } as any;

      (component as any)._onShowApi({}, apiData);

      expect(component._currentApiConfiguration).toEqual(apiData.configurazione_produzione);
      expect(component.showJwtGenerator).toBe(false); // produzione === 'produzione'
    });

    it('should reset resultGenerazioneJwt and resultGenerazioneJwtList', () => {
      component.resultGenerazioneJwt = { key: 'old' };
      component.resultGenerazioneJwtList = [{ label: 'old', value: 'data' }];
      component.openApiInfoTemplate = {} as any;
      mockModalService.show.mockReturnValue({ hide: vi.fn() });

      const apiData = {
        id_api: 'api1',
        nome: 'TestApi',
        versione: 1,
        descrizione: '',
        codice_asset: '',
        ruolo: '',
        proprieta_custom: [],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }],
        configurazione_collaudo: null,
        configurazione_produzione: null
      } as any;

      (component as any)._onShowApi({}, apiData);

      expect(component.resultGenerazioneJwt).toBeNull();
      expect(component.resultGenerazioneJwtList).toEqual([]);
    });

    it('should handle api without gruppi_auth_type', () => {
      component.openApiInfoTemplate = {} as any;
      mockModalService.show.mockReturnValue({ hide: vi.fn() });

      const apiData = {
        id_api: 'api1',
        nome: 'TestApi',
        versione: 1,
        descrizione: '',
        codice_asset: '',
        ruolo: '',
        proprieta_custom: [],
        gruppi_auth_type: null,
        configurazione_collaudo: null,
        configurazione_produzione: null
      } as any;

      (component as any)._onShowApi({}, apiData);

      // When gruppi_auth_type is null, apiProfilo = ''
      expect(component.codiceTokenPolicy).toBe('');
    });
  });

  describe('_openApiInfo', () => {
    it('should call modalService.show with correct config', () => {
      component.openApiInfoTemplate = { template: true } as any;
      const mockRef = { hide: vi.fn() };
      mockModalService.show.mockReturnValue(mockRef);

      (component as any)._openApiInfo();

      expect(mockModalService.show).toHaveBeenCalledWith(
        { template: true },
        {
          id: 'open-api-info',
          ignoreBackdropClick: false,
          class: 'modal-lg-custom modal-with-65 modal-fullscreen-sm-down'
        }
      );
      expect(component._modalInfoRef).toBe(mockRef);
    });
  });

  describe('_getTipoTokenPolicy', () => {
    it('should return tipo_policy when found', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {
          token_policies: [
            { codice_policy: 'pdnd_code', tipo_policy: 'pdnd' },
            { codice_policy: 'code_grant_code', tipo_policy: 'code_grant' }
          ]
        }
      });

      const result = (component as any)._getTipoTokenPolicy('pdnd_code');
      expect(result).toBe('pdnd');
    });

    it('should return empty string when not found', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {
          token_policies: [
            { codice_policy: 'pdnd_code', tipo_policy: 'pdnd' }
          ]
        }
      });

      const result = (component as any)._getTipoTokenPolicy('non_existent');
      expect(result).toBe('');
    });

    it('should return empty string when token_policies is undefined', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {}
      });

      const result = (component as any)._getTipoTokenPolicy('anything');
      expect(result).toBe('');
    });

    it('should return empty string when _getConfigModule returns null', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue(null);

      const result = (component as any)._getTipoTokenPolicy('anything');
      expect(result).toBe('');
    });
  });

  describe('_canDownloadDescriptorMapper', () => {
    it('should delegate to _canDownloadDescriptor', () => {
      component.data = { stato: 'pubblicato' };
      mockAuthenticationService.canJoin.mockReturnValue(true);

      expect(component._canDownloadDescriptorMapper()).toBe(true);
    });

    it('should return false when _canDownloadDescriptor returns false', () => {
      component.data = { stato: 'bozza' };
      mockAuthenticationService.canJoin.mockReturnValue(false);

      expect(component._canDownloadDescriptorMapper()).toBe(false);
    });
  });

  describe('_isAmmissibileMapper', () => {
    it('should delegate to _isAmmissibile', () => {
      mockAuthenticationService.getUser.mockReturnValue({ organizzazione: { id_organizzazione: 'org1' } });
      component._ammissibili = [{ id_organizzazione: 'org1' }] as any;

      expect(component._isAmmissibileMapper()).toBe(true);
    });
  });

  describe('_isAmmissibile edge cases', () => {
    it('should return false when user has no organizzazione', () => {
      mockAuthenticationService.getUser.mockReturnValue({ organizzazione: null });
      component._ammissibili = [{ id_organizzazione: 'org1' }] as any;

      expect((component as any)._isAmmissibile()).toBe(false);
    });

    it('should return false when ammissibili is empty', () => {
      mockAuthenticationService.getUser.mockReturnValue({ organizzazione: { id_organizzazione: 'org1' } });
      component._ammissibili = [] as any;

      expect((component as any)._isAmmissibile()).toBe(false);
    });

    it('should return false when getUser returns null', () => {
      mockAuthenticationService.getUser.mockReturnValue(null);
      component._ammissibili = [{ id_organizzazione: 'org1' }] as any;

      expect((component as any)._isAmmissibile()).toBe(false);
    });
  });

  describe('_getTitleProfiloNegoziazionMapper', () => {
    it('should return translated string with tipoTokenPolicy', () => {
      component.tipoTokenPolicy = 'pdnd';
      mockTranslate.instant.mockImplementation((key: string) => key);

      const result = component._getTitleProfiloNegoziazionMapper('any');

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.AUTHENTICATION.TITLE.NEGOTIATION.pdnd');
    });
  });

  describe('_initBreadcrumb edge cases', () => {
    it('should use translate for New when data and id are null', () => {
      component.data = null;
      component.id = null;
      mockTranslate.instant.mockImplementation((key: string) => key);

      (component as any)._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });
  });

  describe('onResultCopyClipboard edge case', () => {
    it('should use default value when item.value is falsy', () => {
      component.onResultCopyClipboard({ value: '' });
      expect(mockClipboard.copy).toHaveBeenCalledWith('--no value--');
    });

    it('should use default value when item.value is null', () => {
      component.onResultCopyClipboard({ value: null });
      expect(mockClipboard.copy).toHaveBeenCalledWith('--no value--');
    });
  });

  describe('scrollTo and helpers', () => {
    it('should call getRelativePos and _scrollTo in scrollToElm', () => {
      const mockContainer = { scrollTop: 0 };
      const mockElm = {
        parentNode: {
          getBoundingClientRect: () => ({ top: 0, right: 100, bottom: 100, left: 0 }),
          scrollTop: 50
        },
        getBoundingClientRect: () => ({ top: 50, right: 100, bottom: 150, left: 0 })
      };

      const scrollToSpy = vi.spyOn(component as any, '_scrollTo');
      component.scrollToElm(mockContainer, mockElm, 600);

      expect(scrollToSpy).toHaveBeenCalledWith(mockContainer, expect.any(Number), 600);
    });

    it('should calculate relative position in getRelativePos', () => {
      const mockElm = {
        parentNode: {
          getBoundingClientRect: () => ({ top: 10, right: 200, bottom: 110, left: 0 }),
          scrollTop: 50
        },
        getBoundingClientRect: () => ({ top: 60, right: 200, bottom: 160, left: 0 })
      };

      const pos = component.getRelativePos(mockElm);

      expect(pos.top).toBe(60 - 10 + 50 + (110 - 10)); // cPos.top - pPos.top + scrollTop + (pPos.bottom - pPos.top)
      expect(pos.right).toBe(0);
      expect(pos.bottom).toBe(50); // 160 - 110
      expect(pos.left).toBe(0);
    });

    it('should set scrollTop in _scrollTo', () => {
      const element = { scrollTop: 100 };
      (component as any)._scrollTo(element, 200, 600);

      expect(element.scrollTop).toBe(200); // start + (to - start) = 100 + (200 - 100) = 200
    });
  });

  describe('_onScrollToTop', () => {
    it('should reset scroll position to 0', () => {
      (component as any).myScroll = { nativeElement: { scrollTop: 500 } };

      (component as any)._onScrollToTop();

      expect((component as any).myScroll.nativeElement.scrollTop).toBe(0);
    });
  });

  describe('_getYPosition', () => {
    it('should return scrollTop from event target', () => {
      const event = { target: { scrollTop: 350 } } as any;
      const result = (component as any)._getYPosition(event);
      expect(result).toBe(350);
    });
  });

  describe('onActionMonitor with mouse event', () => {
    it('should pass mouseEvent for gestione action', () => {
      component.id = 42;
      const mouseEvt = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;
      component.onActionMonitor({ action: 'gestione', event: mouseEvt });
      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mouseEvt, ['servizi', 42]);
    });

    it('should pass mouseEvent for default action', () => {
      const origLocalStorage = globalThis.localStorage;
      (globalThis as any).localStorage = { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn() };
      component.id = 42;
      const mouseEvt = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;
      component.onActionMonitor({ action: 'comunicazioni', event: mouseEvt });
      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mouseEvt, ['servizi', 42, 'comunicazioni']);
      expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith('SERVIZI_VIEW', 'TRUE');
      (globalThis as any).localStorage = origLocalStorage;
    });
  });

  describe('_loadAll', () => {
    it('should call _loadService', () => {
      const spy = vi.spyOn(component as any, '_loadService').mockImplementation(() => {});

      (component as any)._loadAll();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('constructor with Tools.Configurazione', () => {
    it('should set _showReferents to true when configured as enabled', () => {
      Tools.Configurazione = {
        servizio: {
          mostra_referenti: 'enabled',
          api: { profili: [], proprieta_custom: [] }
        }
      };

      const comp = new ServizioViewComponent(
        mockRoute, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );

      expect(comp._showReferents).toBe(true);
    });

    it('should set _showReferents to false when not configured as enabled', () => {
      Tools.Configurazione = {
        servizio: {
          mostra_referenti: 'disabled',
          api: { profili: [], proprieta_custom: [] }
        }
      };

      const comp = new ServizioViewComponent(
        mockRoute, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );

      expect(comp._showReferents).toBe(false);
    });

    it('should set _profili and _proprieta_custom from configurazione', () => {
      Tools.Configurazione = {
        servizio: {
          mostra_referenti: 'enabled',
          api: {
            profili: [{ codice_interno: 'p1', etichetta: 'Profilo1' }],
            proprieta_custom: [{ nome_gruppo: 'g1' }]
          }
        }
      };

      const comp = new ServizioViewComponent(
        mockRoute, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );

      expect(comp._profili).toEqual([{ codice_interno: 'p1', etichetta: 'Profilo1' }]);
      expect(comp._proprieta_custom).toEqual([{ nome_gruppo: 'g1' }]);
    });

    it('should set _profili and _proprieta_custom to empty arrays when api is not present', () => {
      Tools.Configurazione = {
        servizio: {
          mostra_referenti: 'disabled'
        }
      };

      const comp = new ServizioViewComponent(
        mockRoute, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );

      expect(comp._profili).toEqual([]);
      expect(comp._proprieta_custom).toEqual([]);
    });

    it('should set enableOpenInNewTab from config Layout', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: { hideVersions: false },
          Layout: { enableOpenInNewTab: true }
        }
      });

      const comp = new ServizioViewComponent(
        mockRoute, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );

      expect(comp.enableOpenInNewTab).toBe(true);

      // Reset
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: { hideVersions: false },
          Layout: { enableOpenInNewTab: false }
        }
      });
    });

    it('should set hideVersions from config Services', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: { hideVersions: true },
          Layout: { enableOpenInNewTab: false }
        }
      });

      const comp = new ServizioViewComponent(
        mockRoute, mockRouter, mockClipboard, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManagerService, mockApiService,
        mockUtilService, mockAuthenticationService, mockNavigationService
      );

      expect(comp.hideVersions).toBe(true);

      // Reset
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: { hideVersions: false },
          Layout: { enableOpenInNewTab: false }
        }
      });
    });
  });

  describe('_loadApis with vetrina property value lookup', () => {
    beforeEach(() => {
      component.id = 10;
      component._environmentId = 'collaudo';
      component.apiConfigCopy = {
        itemRowView: { secondaryText: [] },
        options: {}
      };
      component.apiConfig = {
        itemRowView: { secondaryText: [] },
        options: {}
      };
    });

    it('should use etichetta from valori when matching', () => {
      component._proprieta_custom = [{
        nome_gruppo: 'Gruppo1',
        label_gruppo: 'Label1',
        classe_dato: 'collaudo',
        proprieta: [{
          nome: 'stato_prop',
          etichetta: 'Stato Prop',
          tipo: 'select' as const,
          required: false,
          valori: [
            { nome: 'attivo', etichetta: 'Attivo' },
            { nome: 'inattivo', etichetta: 'Inattivo' }
          ],
          vetrina: { label: 'Stato', template: '${valore}' }
        }]
      }];

      const apiDetail = {
        id_api: 'api1',
        proprieta_custom: [{
          gruppo: 'Gruppo1',
          proprieta: [{ nome: 'stato_prop', valore: 'attivo' }]
        }],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }]
      };

      mockApiService.getList
        .mockReturnValueOnce(of({ content: [apiDetail] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      expect(component.serviceApiDominio[0].stato_prop).toBe('Attivo');
    });

    it('should not duplicate secondaryText entries for same key', () => {
      component._proprieta_custom = [{
        nome_gruppo: 'Gruppo1',
        label_gruppo: 'Label1',
        classe_dato: 'collaudo',
        proprieta: [{
          nome: 'campo1',
          etichetta: 'Campo 1',
          tipo: 'text' as const,
          required: false,
          vetrina: { label: 'Campo', template: '${valore}' }
        }]
      }];

      // Pre-add the field to secondaryText
      component.apiConfigCopy = {
        itemRowView: { secondaryText: [{ field: 'campo1', type: 'label' }] },
        options: {}
      };

      const apiDetail = {
        id_api: 'api1',
        proprieta_custom: [{
          gruppo: 'Gruppo1',
          proprieta: [{ nome: 'campo1', valore: 'val' }]
        }],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }]
      };

      mockApiService.getList
        .mockReturnValueOnce(of({ content: [apiDetail] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      // The field already existed in apiConfigCopy, so after restoring apiConfig from apiConfigCopy,
      // it checks some and skips the unshift
      const matchingEntries = component.apiConfig.itemRowView.secondaryText.filter(
        (e: any) => e.field === 'campo1'
      );
      expect(matchingEntries.length).toBe(1);
    });

    it('should skip proprieta_custom that do not match vetrina properties', () => {
      component._proprieta_custom = [{
        nome_gruppo: 'Gruppo1',
        label_gruppo: 'Label1',
        classe_dato: 'collaudo',
        proprieta: [{
          nome: 'visible_prop',
          etichetta: 'Visible',
          tipo: 'text' as const,
          required: false,
          vetrina: { label: 'Vis', template: '${valore}' }
        }]
      }];

      const apiDetail = {
        id_api: 'api1',
        proprieta_custom: [{
          gruppo: 'Gruppo1',
          proprieta: [{ nome: 'other_prop', valore: 'val' }]
        }],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }]
      };

      mockApiService.getList
        .mockReturnValueOnce(of({ content: [apiDetail] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      // other_prop should NOT be added since it doesn't match a vetrina property
      expect(component.serviceApiDominio[0].other_prop).toBeUndefined();
      expect(component.serviceApiDominio[0].visible_prop).toBeUndefined();
    });

    it('should filter proprieta_custom by matching classe_dato and environmentId', () => {
      component._proprieta_custom = [
        {
          nome_gruppo: 'GruppoCollaudo',
          label_gruppo: 'Collaudo',
          classe_dato: 'collaudo',
          proprieta: [{
            nome: 'prop_coll',
            etichetta: 'Prop Coll',
            tipo: 'text' as const,
            required: false,
            vetrina: { label: 'PC', template: '${valore}' }
          }]
        },
        {
          nome_gruppo: 'GruppoProd',
          label_gruppo: 'Produzione',
          classe_dato: 'produzione',
          proprieta: [{
            nome: 'prop_prod',
            etichetta: 'Prop Prod',
            tipo: 'text' as const,
            required: false,
            vetrina: { label: 'PP', template: '${valore}' }
          }]
        }
      ];

      const apiDetail = {
        id_api: 'api1',
        proprieta_custom: [
          { gruppo: 'GruppoCollaudo', proprieta: [{ nome: 'prop_coll', valore: 'cv' }] },
          { gruppo: 'GruppoProd', proprieta: [{ nome: 'prop_prod', valore: 'pv' }] }
        ],
        gruppi_auth_type: [{ profilo: 'pdnd', resources: [], note: '' }]
      };

      mockApiService.getList
        .mockReturnValueOnce(of({ content: [apiDetail] }))
        .mockReturnValueOnce(of({ content: [] }));

      (component as any)._loadApis();

      // Only collaudo props should be visible since _environmentId = 'collaudo'
      expect(component.serviceApiDominio[0].prop_coll).toBe('cv');
      expect(component.serviceApiDominio[0].prop_prod).toBeUndefined();
    });
  });

  describe('gotoManagement with event', () => {
    it('should pass mouse event to navigateWithEvent', () => {
      component.id = 42;
      const mockEvent = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;
      component.gotoManagement(mockEvent);
      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(mockEvent, ['servizi', 42]);
    });
  });

  describe('_canDownloadDescriptor when canJoin returns false', () => {
    it('should return false', () => {
      component.data = { stato: 'bozza' };
      mockAuthenticationService.canJoin.mockReturnValue(false);
      expect(component._canDownloadDescriptor()).toBe(false);
    });
  });

  describe('onScroll at exact threshold', () => {
    it('should return false at exactly 180', () => {
      const mockEvent = { target: { scrollTop: 180 } } as any;
      component.onScroll(mockEvent);
      expect(component._showScroll).toBe(false);
    });

    it('should return true at 181', () => {
      const mockEvent = { target: { scrollTop: 181 } } as any;
      component.onScroll(mockEvent);
      expect(component._showScroll).toBe(true);
    });
  });
});
