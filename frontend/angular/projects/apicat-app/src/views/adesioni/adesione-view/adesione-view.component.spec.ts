import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AdesioneViewComponent, Adesione } from './adesione-view.component';
import { Tools, MenuAction } from '@linkit/components';

// Mock global saveAs
(globalThis as any).saveAs = vi.fn();

function createMockAdesione(overrides: Partial<Adesione> = {}): Adesione {
  return {
    id_adesione: '100',
    id_logico: null,
    soggetto: {
      id_soggetto: 's1',
      nome: 'Soggetto Test',
      organizzazione: {
        id_organizzazione: 'org1', nome: 'Org Test', descrizione: '', codice_ente: 'CE1',
        codice_fiscale_soggetto: 'CF1', id_tipo_utente: 'tu1', referente: true, aderente: false, multi_soggetto: false,
      },
      referente: true,
      aderente: false,
    },
    servizio: {
      id_servizio: 'srv1', nome: 'Servizio Test', versione: '1',
      descrizione_sintetica: 'desc', visibilita: 'pubblico', stato: 'pubblicato',
      multi_adesione: false,
      dominio: {
        id_dominio: 'd1', nome: 'Dominio Test',
        soggetto_referente: { id_soggetto: 's2', nome: 'Sog Ref', descrizione: '', organizzazione: {} as any, referente: true, aderente: false },
        visibilita: 'pubblico', classi: [], descrizione: '',
      }
    },
    stato: 'bozza',
    data_creazione: '2026-01-01',
    data_ultimo_aggiornamento: '2026-01-02',
    utente_richiedente: { id_utente: 'u1', nome: 'Mario', cognome: 'Rossi', telefono_aziendale: '', email_aziendale: 'mario@test.it', username: 'mrossi', stato: 'attivo', ruolo: 'referente', classi_utente: [] },
    utente_ultimo_aggiornamento: { id_utente: 'u1', nome: 'Mario', cognome: 'Rossi', telefono_aziendale: '', email_aziendale: 'mario@test.it', username: 'mrossi', stato: 'attivo', ruolo: 'referente', classi_utente: [] },
    client_richiesti: [{ profilo: 'https' }],
    erogazioni_richieste: [],
    ...overrides
  };
}

describe('AdesioneViewComponent', () => {
  let component: AdesioneViewComponent;

  const mockRouter = { navigate: vi.fn(), navigateByUrl: vi.fn(), url: '/adesioni/1/view', createUrlTree: vi.fn().mockReturnValue({}), serializeUrl: vi.fn().mockReturnValue('/adesioni/1') } as any;
  const mockLocation = { back: vi.fn(), prepareExternalUrl: vi.fn((u: string) => u) } as any;
  const mockRoute = { params: of({ id: '1' }), data: of({}) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    download: vi.fn().mockReturnValue(of({ body: new Blob() })),
  } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    isGestore: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    canDownloadSchedaAdesione: vi.fn().mockReturnValue(false),
    _getConfigModule: vi.fn().mockReturnValue({ api: { auth_type: [] } }),
    _isDatoSempreModificabile: vi.fn().mockReturnValue(false),
  } as any;
  const mockNavigationService = {
    getState: vi.fn().mockReturnValue(null),
    saveState: vi.fn(),
    shouldOpenInNewTab: vi.fn().mockReturnValue(false),
    openInNewTab: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    Tools.Configurazione = {
      adesione: { workflow: { stati: [] }, mostra_referenti: 'enabled', mostra_richiedente: 'enabled' },
      servizio: { adesioni_multiple: [], api: { profili: [{ codice_interno: 'https', etichetta: 'HTTPS', auth_type: 'https' }] } },
    };
    component = new AdesioneViewComponent(
      mockRouter, mockLocation, mockRoute, mockTranslate,
      mockApiService, mockConfigService, mockAuthService, mockNavigationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
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

  // --- _showReferents / _showRichiedente from Tools.Configurazione ---

  it('should set _showReferents to true when mostra_referenti is enabled', () => {
    expect(component._showReferents).toBe(true);
  });

  it('should set _showReferents to false when mostra_referenti is not enabled', () => {
    Tools.Configurazione = {
      adesione: { mostra_referenti: 'disabled', mostra_richiedente: 'enabled' },
      servizio: { api: { profili: [] } },
    };
    const comp = new AdesioneViewComponent(
      mockRouter, mockLocation, mockRoute, mockTranslate,
      mockApiService, mockConfigService, mockAuthService, mockNavigationService
    );
    expect(comp._showReferents).toBe(false);
  });

  it('should set _showRichiedente based on configuration', () => {
    expect(component._showRichiedente).toBe(true);
  });

  // --- _initBreadcrumb ---

  it('_initBreadcrumb should set breadcrumbs with adesione info', () => {
    component.adesione = createMockAdesione();
    (component as any)._initBreadcrumb();

    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
    expect(component.breadcrumbs[0].url).toBe('/adesioni/');
    expect(component.breadcrumbs[1].label).toContain('Org Test');
    expect(component.breadcrumbs[1].label).toContain('Servizio Test');
  });

  it('_initBreadcrumb should use id when adesione is null', () => {
    component.adesione = null;
    component.id = 42;
    (component as any)._initBreadcrumb();

    expect(component.breadcrumbs[1].label).toBe('42');
  });

  it('_initBreadcrumb should use translate New when no adesione and no id', () => {
    component.adesione = null;
    component.id = null;
    (component as any)._initBreadcrumb();

    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
  });

  it('_initBreadcrumb should include id_logico in title when present', () => {
    component.adesione = createMockAdesione({ id_logico: 'ADH-001' });
    (component as any)._initBreadcrumb();

    expect(component.breadcrumbs[1].label).toContain('ADH-001');
    expect(component.breadcrumbs[1].label).toContain('Org Test');
  });

  it('_initBreadcrumb should prepend service breadcrumbs when _serviceBreadcrumbs is set', () => {
    component.adesione = createMockAdesione();
    (component as any)._serviceBreadcrumbs = {
      service: { id_servizio: 'srv1' },
      breadcrumbs: [
        { label: 'Services', url: '/servizi', type: 'link' },
        { label: 'Service Name', url: '/servizi/srv1', type: 'link' },
      ]
    };
    (component as any)._initBreadcrumb();

    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[0].label).toBe('Services');
    expect(component.breadcrumbs[1].label).toBe('Service Name');
    expect(component.breadcrumbs[2].url).toContain('/servizi/srv1/adesioni/');
  });

  // --- loadAdesione ---

  it('loadAdesione should load grant then adesione details', () => {
    const mockGrant = { ruoli: ['referente'] };
    const mockAdesione = createMockAdesione();
    mockApiService.getDetails
      .mockReturnValueOnce(of(mockGrant))   // grant
      .mockReturnValueOnce(of(mockAdesione)) // adesione
      .mockReturnValueOnce(of({ content: [] })) // referenti
      .mockReturnValueOnce(of({ content: [] })) // referentiDominio
      .mockReturnValueOnce(of({ content: [] })) // referentiServizio
      .mockReturnValue(of({ content: [] }));     // erogazioni / client

    (component as any).loadAdesione(true);

    expect(component.grant).toEqual(mockGrant);
    expect(component.adesione).toEqual(mockAdesione);
    expect(component._spin).toBe(false);
  });

  it('loadAdesione should set _spin false on grant error', () => {
    mockApiService.getDetails.mockReturnValue(throwError(() => new Error('Grant error')));

    (component as any).loadAdesione(true);

    expect(component._spin).toBe(false);
    expect(Tools.OnError).toHaveBeenCalled();
  });

  it('loadAdesione should set _spin false on adesione error', () => {
    mockApiService.getDetails
      .mockReturnValueOnce(of({ ruoli: [] }))
      .mockReturnValueOnce(throwError(() => new Error('Adesione error')));

    (component as any).loadAdesione(true);

    expect(component._spin).toBe(false);
    expect(Tools.OnError).toHaveBeenCalled();
  });

  it('loadAdesione should set environment to produzione when adesione stato includes produzione', () => {
    const mockAdesione = createMockAdesione({ stato: 'pubblicato_produzione' });
    mockApiService.getDetails
      .mockReturnValueOnce(of({ ruoli: [] }))
      .mockReturnValueOnce(of(mockAdesione))
      .mockReturnValue(of({ content: [] }));

    (component as any).loadAdesione(false);

    expect(component.environment).toBe('produzione');
  });

  // --- loadReferents ---

  it('loadReferents should set referentiLoading false when _showReferents is false', () => {
    component._showReferents = false;
    component.referentiLoading = true;

    (component as any).loadReferents();

    expect(component.referentiLoading).toBe(false);
  });

  it('loadReferents should load and merge referents from multiple sources', () => {
    component._showReferents = true;
    component.adesione = createMockAdesione();

    mockApiService.getDetails
      .mockReturnValueOnce(of({
        content: [{ utente: { id_utente: 'u1', nome: 'Mario', cognome: 'Rossi', email_aziendale: 'mario@test.it', ruolo: 'referente' }, tipo: 'referente' }]
      }))
      .mockReturnValueOnce(of({
        content: [{ utente: { id_utente: 'u2', nome: 'Luigi', cognome: 'Verdi', email_aziendale: 'luigi@test.it', ruolo: 'referente' }, tipo: 'referente' }]
      }))
      .mockReturnValueOnce(of({
        content: [{ utente: { id_utente: 'u3', nome: 'Anna', cognome: 'Bianchi', email_aziendale: 'anna@test.it', ruolo: 'referente_servizio' }, tipo: 'referente' }]
      }));

    (component as any).loadReferents();

    expect(component.referentiLoading).toBe(false);
    expect(component.referents.length).toBeGreaterThan(0);
  });

  it('loadReferents should handle error and set referentiLoading false', () => {
    component._showReferents = true;
    component.adesione = createMockAdesione();

    mockApiService.getDetails.mockReturnValue(throwError(() => new Error('Referent error')));

    (component as any).loadReferents();

    expect(component.referentiLoading).toBe(false);
    expect(Tools.OnError).toHaveBeenCalled();
  });

  // --- onBreadcrumb ---

  it('onBreadcrumb should navigate to the given url', () => {
    component.onBreadcrumb({ url: '/adesioni' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni']);
  });

  // --- onScroll ---

  it('onScroll should set _showScroll true when scrollTop > 180', () => {
    const event = { target: { scrollTop: 200 } } as any;
    component.onScroll(event);
    expect(component._showScroll).toBe(true);
  });

  it('onScroll should set _showScroll false when scrollTop <= 180', () => {
    component._showScroll = true;
    const event = { target: { scrollTop: 100 } } as any;
    component.onScroll(event);
    expect(component._showScroll).toBe(false);
  });

  // --- getLogoMapper ---

  it('getLogoMapper should return service image URL when immagine is true', () => {
    component.adesione = createMockAdesione();
    component.adesione.servizio.immagine = true;

    const result = component.getLogoMapper();
    expect(result).toBe('http://localhost/servizi/srv1/immagine');
  });

  it('getLogoMapper should return default logo when immagine is falsy', () => {
    component.adesione = createMockAdesione();
    component.adesione.servizio.immagine = undefined;

    const result = component.getLogoMapper();
    expect(result).toBe('./assets/images/logo-servizio.png');
  });

  // --- canDownloadSchedaAdesioneMapper ---

  it('canDownloadSchedaAdesioneMapper should return false when adesione is null', () => {
    component.adesione = null;
    expect(component.canDownloadSchedaAdesioneMapper()).toBe(false);
  });

  it('canDownloadSchedaAdesioneMapper should delegate to authenticationService', () => {
    component.adesione = createMockAdesione({ stato: 'pubblicato_collaudo' });
    mockAuthService.canDownloadSchedaAdesione.mockReturnValue(true);

    expect(component.canDownloadSchedaAdesioneMapper()).toBe(true);
    expect(mockAuthService.canDownloadSchedaAdesione).toHaveBeenCalledWith('pubblicato_collaudo');
  });

  // --- onProductionClick / onTestClick ---

  it('onProductionClick should set environment to produzione', () => {
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));
    component.onProductionClick();
    expect(component.environment).toBe('produzione');
  });

  it('onTestClick should set environment to collaudo', () => {
    component.environment = 'produzione';
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));
    component.onTestClick();
    expect(component.environment).toBe('collaudo');
  });

  // --- updateOtherAction ---

  it('updateOtherAction should add configura action when stato is not final', () => {
    component.adesione = createMockAdesione({ stato: 'bozza' });
    component.grant = { ruoli: [] } as any;

    component.updateOtherAction();

    expect(component._otherActions.length).toBeGreaterThanOrEqual(2);
    expect(component._otherActions[0].action).toBe('configura');
  });

  it('updateOtherAction should add configura action for gestore even on final stato', () => {
    component.adesione = createMockAdesione({ stato: 'pubblicato_produzione' });
    component.grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);

    component.updateOtherAction();

    expect(component._otherActions.length).toBeGreaterThanOrEqual(2);
  });

  it('updateOtherAction should set empty actions for non-gestore on final stato', () => {
    component.adesione = createMockAdesione({ stato: 'pubblicato_produzione' });
    component.grant = { ruoli: [] } as any;
    mockAuthService.isGestore.mockReturnValue(false);

    component.updateOtherAction();

    expect(component._otherActions.length).toBe(0);
  });

  // --- onActionMonitor ---

  it('onActionMonitor configura should call configureAdesione', () => {
    vi.spyOn(component, 'configureAdesione').mockImplementation(() => {});
    component.onActionMonitor({ action: 'configura' });
    expect(component.configureAdesione).toHaveBeenCalled();
  });

  it('onActionMonitor gestione should navigate relative to parent', () => {
    component.onActionMonitor({ action: 'gestione' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['..'], expect.anything());
  });

  it('onActionMonitor comunicazioni should navigate to comunicazioni and set localStorage', () => {
    component.onActionMonitor({ action: 'comunicazioni' });
    expect(localStorage.getItem('ADESIONI_VIEW')).toBe('TRUE');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['..', 'comunicazioni'], expect.anything());
  });

  // --- configureAdesione ---

  it('configureAdesione should navigate to parent when useEditWizard is true', () => {
    component.config = { useEditWizard: true };
    component.configureAdesione();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['..'], expect.anything());
  });

  it('configureAdesione should navigate to configurazione when useEditWizard is false', () => {
    component.config = { useEditWizard: false };
    component.configureAdesione();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['..', 'configurazione'], expect.anything());
  });

  // --- download ---

  it('download should not proceed when certificate is undefined', () => {
    component.download({} as any, undefined);
    expect(mockApiService.download).not.toHaveBeenCalled();
  });

  it('download should call apiService.download with correct partial path', () => {
    component.environment = 'collaudo';
    component.id = 10;
    const cert = { uuid: 'cert-uuid', content_type: 'application/x-pkcs12', filename: 'cert.p12' };

    component.download({} as any, cert);

    expect(mockApiService.download).toHaveBeenCalledWith('adesioni', 10, 'collaudo/client/cert-uuid/download');
  });

  // --- onEnvironmentChange ---

  it('onEnvironmentChange should clear apis and authModes and reload', () => {
    component.apis = [{ name: 'test' } as any];
    component.authModes = [{ name: 'test' } as any];
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));

    (component as any).onEnvironmentChange();

    expect(component.apis).toEqual([]);
    expect(component.authModes).toEqual([]);
  });

  // --- onAvatarError ---

  it('onAvatarError should set target src to default avatar', () => {
    const event = { target: { src: '' } };
    component.onAvatarError(event);
    expect(event.target.src).toBe('./assets/images/avatar.png');
  });

  // --- canViewClientId (private but tested through behavior) ---

  it('canViewClientId should return true for pdnd auth type', () => {
    expect((component as any).canViewClientId('pdnd')).toBe(true);
  });

  it('canViewClientId should return false for https auth type', () => {
    expect((component as any).canViewClientId('https')).toBe(false);
  });

  it('canViewClientId should return false for undefined', () => {
    expect((component as any).canViewClientId(undefined)).toBe(false);
  });

  // --- canDownloadAuthCertificate ---

  it('canDownloadAuthCertificate should return true for https', () => {
    expect((component as any).canDownloadAuthCertificate('https')).toBe(true);
  });

  it('canDownloadAuthCertificate should return false for pdnd', () => {
    expect((component as any).canDownloadAuthCertificate('pdnd')).toBe(false);
  });

  // --- canDownloadSignCertificate ---

  it('canDownloadSignCertificate should return true for sign types', () => {
    expect((component as any).canDownloadSignCertificate('sign')).toBe(true);
    expect((component as any).canDownloadSignCertificate('https_sign')).toBe(true);
  });

  it('canDownloadSignCertificate should return false for https only', () => {
    expect((component as any).canDownloadSignCertificate('https')).toBe(false);
  });

  // --- canViewOAuthCode ---

  it('canViewOAuthCode should return true for oauth_authorization_code', () => {
    expect((component as any).canViewOAuthCode('oauth_authorization_code')).toBe(true);
  });

  it('canViewOAuthCode should return false for other types', () => {
    expect((component as any).canViewOAuthCode('pdnd')).toBe(false);
  });

  // --- getLabelClientId ---

  it('getLabelClientId should return PDND label for pdnd auth types', () => {
    expect((component as any).getLabelClientId('pdnd')).toBe('APP.CLIENT.LABEL.ClientIdPDND');
    expect((component as any).getLabelClientId('https_pdnd')).toBe('APP.CLIENT.LABEL.ClientIdPDND');
  });

  it('getLabelClientId should return default label for other auth types', () => {
    expect((component as any).getLabelClientId('https')).toBe('APP.CLIENT.LABEL.ClientId');
  });

  it('getLabelClientId should return default label for undefined', () => {
    expect((component as any).getLabelClientId(undefined)).toBe('APP.CLIENT.LABEL.ClientId');
  });

  // --- downloadSchedaAdesione ---

  it('downloadSchedaAdesione should call apiService.download when id is set', () => {
    component.id = 5;
    mockApiService.download.mockReturnValue(of({ body: new Blob() }));

    component.downloadSchedaAdesione();

    expect(mockApiService.download).toHaveBeenCalledWith('adesioni', 5, 'export');
    expect(component._downloading).toBe(false);
  });

  it('downloadSchedaAdesione should not call apiService.download when id is null', () => {
    component.id = null;

    component.downloadSchedaAdesione();

    expect(mockApiService.download).not.toHaveBeenCalled();
  });

  it('downloadSchedaAdesione should call Tools.OnError on error', () => {
    component.id = 5;
    mockApiService.download.mockReturnValue(throwError(() => new Error('Download error')));

    component.downloadSchedaAdesione();

    expect(Tools.OnError).toHaveBeenCalled();
  });

  // --- ngOnInit ---

  it('ngOnInit should load adesione when route params contain id', () => {
    const spy = vi.spyOn(component as any, 'loadAdesione').mockImplementation(() => {});
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(true);
    expect(component.id).toBe('1');
  });

  it('ngOnInit should subscribe to configService.getConfig', () => {
    vi.spyOn(component as any, 'loadAdesione').mockImplementation(() => {});
    component.ngOnInit();
    expect(mockConfigService.getConfig).toHaveBeenCalledWith('adesioni');
  });
});
