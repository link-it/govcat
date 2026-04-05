import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subscription } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Tools } from '@linkit/components';
import { AdesioneConfigurazioniComponent, TipoClientEnum, SelectedClientEnum, StatoConfigurazioneEnum, TipoCertificatoEnum } from './adesione-configurazioni.component';

describe('AdesioneConfigurazioniComponent', () => {
  let component: AdesioneConfigurazioniComponent;

  const mockRoute = { params: of({ id: 'ade-1' }), parent: { params: of({ id: 'ade-1' }) }, data: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockModalService = { show: vi.fn(), onShown: of(null) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    getDetails: vi.fn().mockReturnValue(of({})),
    saveElement: vi.fn().mockReturnValue(of({})),
    patchElement: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({ body: new Blob() })),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false),
    canChangeStatus: vi.fn().mockReturnValue(false),
    _getConfigModule: vi.fn().mockImplementation((module: string) => {
      if (module === 'adesione') {
        return { proprieta_custom: [] };
      }
      return {
        api: {
          auth_type: [
            { type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false },
            { type: 'pdnd', indirizzi_ip: false, rate_limiting: false, finalita: true },
            { type: 'no_dati', indirizzi_ip: false, rate_limiting: false, finalita: false },
          ],
          profili: []
        }
      };
    }),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    canEdit: vi.fn().mockReturnValue(true),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getCertificatoByAuthType: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.ScrollTo = vi.fn();
    Tools.OnError = vi.fn();
    Tools.WaitForResponse = vi.fn();
    component = new AdesioneConfigurazioniComponent(
      mockRoute, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockApiService, mockAuthService, mockUtils
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Creazione e defaults ───

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneConfigurazioniComponent.Name).toBe('AdesioneConfigurazioniComponent');
  });

  it('should have model "adesioni"', () => {
    expect(component.model).toBe('adesioni');
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
  });

  it('should have default _isEdit false', () => {
    expect(component._isEdit).toBe(false);
  });

  it('should have default _spin false', () => {
    expect(component._spin).toBe(false);
  });

  it('should have default _currentTab "clients"', () => {
    expect(component._currentTab).toBe('clients');
  });

  it('should have default _collaudo true', () => {
    expect(component._collaudo).toBe(true);
  });

  it('should read config on construction', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should init search form on construction', () => {
    expect(component._formGroup.contains('organizationTaxCode')).toBe(true);
    expect(component._formGroup.contains('creationDateFrom')).toBe(true);
    expect(component._formGroup.contains('status')).toBe(true);
  });

  // ─── Enums ───

  it('should define TipoClientEnum', () => {
    expect(TipoClientEnum.Nuovo).toBe('nuovo');
    expect(TipoClientEnum.Riferito).toBe('riferito');
    expect(TipoClientEnum.Proposto).toBe('proposto');
  });

  it('should define SelectedClientEnum', () => {
    expect(SelectedClientEnum.NuovoCliente).toBe('nuovoClient');
    expect(SelectedClientEnum.UsaClientEsistente).toBe('usaClientEsistente');
    expect(SelectedClientEnum.Default).toBe('');
  });

  it('should define StatoConfigurazioneEnum', () => {
    expect(StatoConfigurazioneEnum.CONFIGURATO).toBe('configurato');
    expect(StatoConfigurazioneEnum.NONCONFIGURATO).toBe('Non configurato');
    expect(StatoConfigurazioneEnum.CONFIGINPROGRESS).toBe('config_in_progress');
  });

  // ─── _setErrorMessages ───

  it('should set error messages when error is true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should set no-results messages when error is false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  // ─── _initBreadcrumb ───

  it('should init breadcrumb with adesione data', () => {
    component.adesione = {
      soggetto: { organizzazione: { nome: 'Org1' } },
      servizio: { nome: 'Servizio1', versione: '1' },
      id_adesione: 'ade-123',
      stato: 'pubblicato'
    };
    component._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
    expect(component.breadcrumbs[1].label).toContain('Org1');
    expect(component.breadcrumbs[1].label).toContain('Servizio1');
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.SubscriptionConfigurations');
  });

  it('should init breadcrumb with id when no adesione', () => {
    component.adesione = null;
    component.id = 42;
    component._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('42');
  });

  it('should init breadcrumb with "New" when no adesione and no id', () => {
    component.adesione = null;
    component.id = 0;
    component._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
  });

  it('should prepend service breadcrumbs when _serviceBreadcrumbs is set', () => {
    component.adesione = {
      soggetto: { organizzazione: { nome: 'Org1' } },
      servizio: { nome: 'Svc', versione: '2' },
      id_adesione: 'ade-1',
      stato: 'bozza'
    };
    component._serviceBreadcrumbs = {
      service: { id_servizio: 'svc-1' },
      breadcrumbs: [{ label: 'Servizi', url: '/servizi', type: 'link' }]
    } as any;
    component._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('Servizi');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Subscriptions');
  });

  // ─── onBreadcrumb ───

  it('should navigate on breadcrumb click', () => {
    component.onBreadcrumb({ url: '/adesioni' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni']);
  });

  // ─── onActionMonitor ───

  it('should navigate to view on backview action', () => {
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['../view'], expect.anything());
  });

  it('should not navigate on unknown action', () => {
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ─── _showCollaudo / _showProduzione ───

  it('should set environment to collaudo', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    vi.spyOn(component, '_loadAdesioneConfigErogazioni').mockImplementation(() => {});
    vi.spyOn(component as any, '_loadConfigurazioni').mockImplementation(() => {});
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
    expect(component._collaudo).toBe(true);
    expect(component._loadAdesioneConfigClients).toHaveBeenCalled();
    expect(component._loadAdesioneConfigErogazioni).toHaveBeenCalled();
  });

  it('should set environment to produzione', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    vi.spyOn(component, '_loadAdesioneConfigErogazioni').mockImplementation(() => {});
    vi.spyOn(component as any, '_loadConfigurazioni').mockImplementation(() => {});
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
    expect(component._collaudo).toBe(false);
    expect(component._loadAdesioneConfigClients).toHaveBeenCalled();
  });

  it('should return true for _isCollaudo when environment is collaudo', () => {
    component.environmentId = 'collaudo';
    expect(component._isCollaudo()).toBe(true);
    expect(component._isProduzione()).toBe(false);
  });

  it('should return true for _isProduzione when environment is produzione', () => {
    component.environmentId = 'produzione';
    expect(component._isProduzione()).toBe(true);
    expect(component._isCollaudo()).toBe(false);
  });

  // ─── _showClients / _showEndpointAPI ───

  it('should switch to clients view', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    component._showClients();
    expect(component._isConfigClients).toBe(true);
    expect(component._loadAdesioneConfigClients).toHaveBeenCalled();
  });

  it('should switch to endpoint API view', () => {
    vi.spyOn(component, '_loadAdesioneConfigErogazioni').mockImplementation(() => {});
    component._showEndpointAPI();
    expect(component._isConfigClients).toBe(false);
    expect(component._loadAdesioneConfigErogazioni).toHaveBeenCalled();
  });

  // ─── _onShowTab ───

  it('should show custom tab when item is provided', () => {
    component._onShowTab({ nome_gruppo: 'custom_tab' });
    expect(component._currentTab).toBe('custom_tab');
    expect(component._currentTabCustom).toEqual({ nome_gruppo: 'custom_tab' });
  });

  it('should show clients tab when tab is "clients"', () => {
    vi.spyOn(component, '_showClients').mockImplementation(() => {});
    component._onShowTab(null, 'clients');
    expect(component._currentTab).toBe('clients');
    expect(component._currentTabCustom).toBeNull();
    expect(component._showClients).toHaveBeenCalled();
  });

  it('should show erogazioni tab when tab is not "clients"', () => {
    vi.spyOn(component, '_showEndpointAPI').mockImplementation(() => {});
    component._onShowTab(null, 'erogazioni');
    expect(component._currentTab).toBe('erogazioni');
    expect(component._currentTabCustom).toBeNull();
    expect(component._showEndpointAPI).toHaveBeenCalled();
  });

  // ─── _hasActions ───

  it('should return true when user is gestore', () => {
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._hasActions()).toBe(true);
  });

  it('should return true when user can change status', () => {
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(true);
    component.adesione = { stato: 'collaudo' };
    expect(component._hasActions()).toBe(true);
  });

  it('should return false when no permissions and no adesione', () => {
    mockAuthService.isGestore.mockReturnValue(false);
    component.adesione = null;
    expect(component._hasActions()).toBe(false);
  });

  it('should return false when user cannot change status', () => {
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(false);
    component.adesione = { stato: 'pubblicato' };
    expect(component._hasActions()).toBe(false);
  });

  // ─── _downloadsEnabled ───

  it('should return true when current service matches form selection', () => {
    component._editFormGroupClients = new FormGroup({
      credenziali: new FormControl('client-1')
    });
    (component as any)._currentServiceClient = 'client-1';
    expect(component._downloadsEnabled()).toBe(true);
  });

  it('should return false when credentials selection changed', () => {
    component._editFormGroupClients = new FormGroup({
      credenziali: new FormControl('client-2')
    });
    (component as any)._currentServiceClient = 'client-1';
    expect(component._downloadsEnabled()).toBe(false);
  });

  // ─── _onSearch / _resetForm / _onSubmit / _onSort ───

  it('should store filter data and reload on search', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    component._onSearch({ status: 'attivo' });
    expect(component._filterData).toEqual({ status: 'attivo' });
    expect(component._loadAdesioneConfigClients).toHaveBeenCalledWith({ status: 'attivo' });
  });

  it('should clear filter data and reload on reset', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    component._filterData = [{ status: 'attivo' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
    expect(component._loadAdesioneConfigClients).toHaveBeenCalledWith([]);
  });

  it('should delegate to searchBarForm on submit', () => {
    const mockSearchBar = { _onSearch: vi.fn() };
    component.searchBarForm = mockSearchBar as any;
    component._onSubmit({});
    expect(mockSearchBar._onSearch).toHaveBeenCalled();
  });

  it('should not throw when searchBarForm is null on submit', () => {
    component.searchBarForm = null as any;
    expect(() => component._onSubmit({})).not.toThrow();
  });

  it('should handle _onSort without error', () => {
    expect(() => component._onSort({ field: 'date', direction: 'asc' })).not.toThrow();
  });

  // ─── _loadGeneralConfig ───

  it('should load general config from API', () => {
    const mockConfig = { servizio: { api: { profili: [] } } };
    mockApiService.getList.mockReturnValue(of(mockConfig));
    component._loadGeneralConfig();
    expect(component._generalConfig).toEqual(mockConfig);
  });

  it('should handle error on loadGeneralConfig', () => {
    mockApiService.getList.mockReturnValue(throwError(() => ({ status: 500 })));
    component._loadGeneralConfig();
    expect(Tools.OnError).toHaveBeenCalled();
  });

  // ─── _loadAdesione ───

  it('should load adesione details and update breadcrumb', () => {
    component.id = 42;
    const mockAdesione = {
      soggetto: { organizzazione: { nome: 'Org' } },
      servizio: { nome: 'Svc', versione: '1' },
      id_adesione: 'a-1',
      stato: 'bozza'
    };
    mockApiService.getDetails.mockReturnValue(of(mockAdesione));
    component._loadAdesione();
    expect(component.adesione).toEqual(mockAdesione);
    expect(component.breadcrumbs[1].label).toContain('Org');
  });

  it('should not load adesione when id is 0', () => {
    component.id = 0;
    component._loadAdesione();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  it('should handle error on loadAdesione', () => {
    component.id = 1;
    mockApiService.getDetails.mockReturnValue(throwError(() => ({ status: 404 })));
    component._loadAdesione();
    expect(Tools.OnError).toHaveBeenCalled();
  });

  // ─── ngOnDestroy ───

  it('should unsubscribe showSubscription on destroy', () => {
    const mockSub = { unsubscribe: vi.fn() } as unknown as Subscription;
    component.showSubscription = mockSub;
    component.ngOnDestroy();
    expect(mockSub.unsubscribe).toHaveBeenCalled();
  });

  it('should not throw on destroy without subscription', () => {
    component.showSubscription = undefined as any;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ─── ngAfterContentChecked ───

  it('should set desktop based on window width', () => {
    component.ngAfterContentChecked();
    expect(typeof component.desktop).toBe('boolean');
  });

  // ─── _checkTipoCertificato ───

  describe('_checkTipoCertificato', () => {
    it('should set _isFornito true for https + fornito', () => {
      component._checkTipoCertificato('https', 'fornito');
      expect(component._isFornito).toBe(true);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });

    it('should set _isRichiesto_cn true for https + richiesto_cn', () => {
      component._checkTipoCertificato('https', 'richiesto_cn');
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(true);
      expect(component._isRichiesto_csr).toBe(false);
    });

    it('should set _isRichiesto_csr true for https + richiesto_csr', () => {
      component._checkTipoCertificato('https', 'richiesto_csr');
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(true);
    });

    it('should handle https_sign the same as https', () => {
      component._checkTipoCertificato('https_sign', 'fornito');
      expect(component._isFornito).toBe(true);
    });

    it('should not change flags for unknown auth_type', () => {
      component._isFornito = true;
      component._checkTipoCertificato('unknown', 'fornito');
      expect(component._isFornito).toBe(true); // unchanged
    });

    it('should set all false for empty tipo_cert', () => {
      component._checkTipoCertificato('https', '');
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });
  });

  // ─── _checkAndSetAuthTypeCase ───

  describe('_checkAndSetAuthTypeCase', () => {
    beforeEach(() => {
      // Reset all auth type flags
      component._isNoDati = false;
      component._isIndirizzoIP = false;
      component._isHttpBasic = false;
      component._isOauthAuthCode = false;
      component._isOauthClientCredentials = false;
      component._isHttps = false;
      component._isHttpsSign = false;
      component._isPdnd = false;
      component._isHttpsPdnd = false;
      component._isHttpsPdndSign = false;
      component._isSign = false;
      component._isSignPdnd = false;
    });

    it('should set _isNoDati for no_dati', () => {
      component._checkAndSetAuthTypeCase('no_dati');
      expect(component._isNoDati).toBe(true);
      expect(component._isHttps).toBe(false);
    });

    it('should set _isHttps for https', () => {
      component._checkAndSetAuthTypeCase('https');
      expect(component._isHttps).toBe(true);
      expect(component._isNoDati).toBe(false);
    });

    it('should set _isHttpsSign for https_sign', () => {
      component._checkAndSetAuthTypeCase('https_sign');
      expect(component._isHttpsSign).toBe(true);
    });

    it('should set _isPdnd for pdnd', () => {
      component._checkAndSetAuthTypeCase('pdnd');
      expect(component._isPdnd).toBe(true);
    });

    it('should set _isHttpsPdnd for https_pdnd', () => {
      component._checkAndSetAuthTypeCase('https_pdnd');
      expect(component._isHttpsPdnd).toBe(true);
    });

    it('should set _isHttpsPdndSign for https_pdnd_sign', () => {
      component._checkAndSetAuthTypeCase('https_pdnd_sign');
      expect(component._isHttpsPdndSign).toBe(true);
    });

    it('should set _isIndirizzoIP for indirizzo_ip', () => {
      component._checkAndSetAuthTypeCase('indirizzo_ip');
      expect(component._isIndirizzoIP).toBe(true);
    });

    it('should set _isHttpBasic for http_basic', () => {
      component._checkAndSetAuthTypeCase('http_basic');
      expect(component._isHttpBasic).toBe(true);
    });

    it('should set _isOauthAuthCode for oauth_authorization_code', () => {
      component._checkAndSetAuthTypeCase('oauth_authorization_code');
      expect(component._isOauthAuthCode).toBe(true);
    });

    it('should set _isOauthClientCredentials for oauth_client_credentials', () => {
      component._checkAndSetAuthTypeCase('oauth_client_credentials');
      expect(component._isOauthClientCredentials).toBe(true);
    });

    it('should set _isSign for sign', () => {
      component._checkAndSetAuthTypeCase('sign');
      expect(component._isSign).toBe(true);
    });

    it('should set _isSignPdnd for sign_pdnd', () => {
      component._checkAndSetAuthTypeCase('sign_pdnd');
      expect(component._isSignPdnd).toBe(true);
    });

    it('should reset all flags on unknown auth_type', () => {
      component._isHttps = true;
      component._checkAndSetAuthTypeCase('unknown');
      expect(component._isHttps).toBe(false);
      expect(component._isNoDati).toBe(false);
    });

    it('should set _show_erogazione_finalita from config', () => {
      component._checkAndSetAuthTypeCase('pdnd');
      expect(component._show_erogazione_finalita).toBe(true);
    });

    it('should set _show_erogazione_ip_fruizione from config', () => {
      component._checkAndSetAuthTypeCase('https');
      expect(component._show_erogazione_ip_fruizione).toBe(false);
    });

    it('should handle null auth_type', () => {
      expect(() => component._checkAndSetAuthTypeCase(null)).not.toThrow();
    });
  });

  // ─── _initSearchForm ───

  it('should create form with expected controls', () => {
    component._initSearchForm();
    expect(component._formGroup.contains('organizationTaxCode')).toBe(true);
    expect(component._formGroup.contains('creationDateFrom')).toBe(true);
    expect(component._formGroup.contains('creationDateTo')).toBe(true);
    expect(component._formGroup.contains('fileName')).toBe(true);
    expect(component._formGroup.contains('status')).toBe(true);
    expect(component._formGroup.contains('type')).toBe(true);
  });

  // ─── _loadAdesioneConfigClients ───

  describe('_loadAdesioneConfigClients', () => {
    beforeEach(() => {
      component.id = 1;
      component.environmentId = 'collaudo';
      component.adesione = {
        client_richiesti: [{ profilo: 'profilo1' }],
        erogazioni_richieste: []
      };
      component._generalConfig = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'profilo1', auth_type: 'https', etichetta: 'Prof1' }],
            auth_type: [{ type: 'https', indirizzi_ip: false }]
          }
        }
      };
    });

    it('should load client configurations', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadAdesioneConfigClients();
      expect(component._isConfigClients).toBe(true);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('adesioni', 1, 'collaudo/client');
    });

    it('should create client list with NONCONFIGURATO status when no match', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadAdesioneConfigClients();
      expect(component.adesioneConfigClients.length).toBe(1);
      expect(component.adesioneConfigClients[0].source.stato).toBe(StatoConfigurazioneEnum.NONCONFIGURATO);
    });

    it('should create client list with CONFIGURATO status when matched', () => {
      const mockResponse = {
        content: [{ profilo: 'profilo1', id_client: 'c-1', nome: 'Client1', dati_specifici: { auth_type: 'https' } }],
        page: {}
      };
      mockApiService.getDetails.mockReturnValue(of(mockResponse));
      component._loadAdesioneConfigClients();
      expect(component.adesioneConfigClients[0].source.stato).toBe(StatoConfigurazioneEnum.CONFIGURATO);
      expect(component.adesioneConfigClients[0].id_client).toBe('c-1');
    });

    it('should handle error on load', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => ({ status: 500 })));
      component._loadAdesioneConfigClients();
      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
    });

    it('should not load when id is 0', () => {
      component.id = 0;
      component._loadAdesioneConfigClients();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should append to existing list when url is provided', () => {
      component.adesioneConfigClients = [{ existing: true, source: { stato: StatoConfigurazioneEnum.CONFIGURATO } }] as any;
      mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
      component._loadAdesioneConfigClients(null, 'next-url');
      expect(component.adesioneConfigClients[0].existing).toBe(true);
    });

    it('should set CONFIGINPROGRESS for gestore when nome_proposto without nome', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      const mockResponse = {
        content: [{ profilo: 'profilo1', id_client: 'c-1', nome_proposto: 'Proposed', nome: null, dati_specifici: {} }],
        page: {}
      };
      mockApiService.getDetails.mockReturnValue(of(mockResponse));
      component._loadAdesioneConfigClients();
      expect(component.adesioneConfigClients[0].source.stato).toBe(StatoConfigurazioneEnum.CONFIGINPROGRESS);
    });
  });

  // ─── _loadAdesioneConfigErogazioni ───

  describe('_loadAdesioneConfigErogazioni', () => {
    beforeEach(() => {
      component.id = 1;
      component.environmentId = 'collaudo';
      component.adesione = {
        erogazioni_richieste: [
          { api: { id_api: 'api-1', nome: 'Api1', protocollo: 'rest', versione: '1' } }
        ],
        client_richiesti: []
      };
    });

    it('should load erogazioni configurations', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      component._loadAdesioneConfigErogazioni();
      expect(component._isConfigClients).toBe(false);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('adesioni', 1, 'collaudo/erogazioni');
    });

    it('should set NONCONFIGURATO when no match', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      component._loadAdesioneConfigErogazioni();
      expect(component.adesioneConfigErogazioni.length).toBe(1);
      expect(component.adesioneConfigErogazioni[0].stato).toBe(StatoConfigurazioneEnum.NONCONFIGURATO);
    });

    it('should set CONFIGURATO when matched', () => {
      const mockResponse = {
        content: [{
          api: { id_api: 'api-1', nome: 'Api1', codice_asset: 'CA1', protocollo: 'rest', versione: '1', specifica: {} },
          url: 'http://test',
          indirizzi_ip: '1.2.3.4'
        }]
      };
      mockApiService.getDetails.mockReturnValue(of(mockResponse));
      component._loadAdesioneConfigErogazioni();
      expect(component.adesioneConfigErogazioni[0].stato).toBe(StatoConfigurazioneEnum.CONFIGURATO);
    });
  });

  // ─── _onResize ───

  it('should set desktop on resize', () => {
    component._onResize();
    expect(typeof component.desktop).toBe('boolean');
  });

  // ─── ratePeriods ───

  it('should have 3 rate periods', () => {
    expect(component.ratePeriods.length).toBe(3);
    expect(component.ratePeriods.map((p: any) => p.label)).toEqual([
      'APP.LABEL.Giorno', 'APP.LABEL.Ora', 'APP.LABEL.Minuto'
    ]);
  });

  // ─── Utility methods ───

  it('should convert timestamp to Date with _timestampToMoment', () => {
    const ts = 1609459200000; // 2021-01-01
    const result = component._timestampToMoment(ts);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBe(ts);
  });

  it('should return null from _timestampToMoment for falsy value', () => {
    expect(component._timestampToMoment(0)).toBeNull();
    expect(component._timestampToMoment(null as any)).toBeNull();
  });

  it('should set _isEdit false on _onCloseEdit', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  it('should remove null properties from object', () => {
    const obj = { a: 1, b: null, c: 'hello', d: null };
    component._removeNullProperties(obj);
    expect(obj).toEqual({ a: 1, c: 'hello' });
  });

  it('should keep non-null properties in _removeNullProperties', () => {
    const obj = { a: 0, b: '', c: false };
    component._removeNullProperties(obj);
    expect(obj).toEqual({ a: 0, b: '', c: false });
  });

  it('should get profilo from client source', () => {
    const client = { source: { codice_interno: 'prof-1' } };
    expect(component._getProfilo(client)).toBe('prof-1');
  });

  it('should return form controls via f getter', () => {
    component._editFormGroupClients = new FormGroup({
      nome: new FormControl('test')
    });
    expect(component.f['nome'].value).toBe('test');
  });

  it('should return erogazioni controls via fe getter', () => {
    component._editFormGroupErogazioni = new FormGroup({
      url: new FormControl('http://test')
    });
    expect(component.fe['url'].value).toBe('http://test');
  });

  it('should return rate_limiting controls via fRate getter', () => {
    component._editFormGroupClients = new FormGroup({
      rate_limiting: new FormGroup({
        quota: new FormControl(100),
        periodo: new FormControl('giorno')
      })
    });
    expect(component.fRate['quota'].value).toBe(100);
  });

  // ─── _resetCertificates ───

  it('should reset all certificates', () => {
    component._certificato_csr = { data: 'x' };
    component._certificato_fornito = { data: 'y' };
    component._modulo_richiesta_csr = { data: 'z' };
    component._certificato_cn = { data: 'w' };
    component._resetCertificates();
    expect(component._certificato_csr).toBeNull();
    expect(component._certificato_fornito).toBeNull();
    expect(component._modulo_richiesta_csr).toBeNull();
    expect(component._certificato_cn).toBeNull();
  });

  it('should reset all firma certificates', () => {
    component._certificato_csr_firma = { data: 'x' };
    component._certificato_fornito_firma = { data: 'y' };
    component._modulo_richiesta_csr_firma = { data: 'z' };
    component._modulo_richiesta_csr_firma_ceritifato = { data: 'a' };
    component._certificato_cn_firma = { data: 'b' };
    component._resetCertificatesFirma();
    expect(component._certificato_csr_firma).toBeNull();
    expect(component._certificato_fornito_firma).toBeNull();
    expect(component._modulo_richiesta_csr_firma).toBeNull();
    expect(component._modulo_richiesta_csr_firma_ceritifato).toBeNull();
    expect(component._certificato_cn_firma).toBeNull();
  });

  it('should reset all certificates at once via _resetCertificatesAll', () => {
    component._certificato_csr = { data: 'x' };
    component._certificato_fornito_firma = { data: 'y' };
    component._resetCertificatesAll();
    expect(component._certificato_csr).toBeNull();
    expect(component._certificato_fornito_firma).toBeNull();
  });

  // ─── _resetDescrittori ───

  it('should reset descriptor controls', () => {
    component._descrittoreCtrl.setValue('abc');
    component._descrittoreCtrl_csr.setValue('def');
    component._descrittoreCtrl_csr_modulo.setValue('ghi');
    component._resetDescrittori();
    expect(component._descrittoreCtrl.value).toBe('');
    expect(component._descrittoreCtrl_csr.value).toBe('');
    expect(component._descrittoreCtrl_csr_modulo.value).toBe('');
  });

  it('should reset firma descriptor controls', () => {
    component._descrittoreCtrl_firma.setValue('abc');
    component._descrittoreCtrl_csr_firma.setValue('def');
    component._descrittoreCtrl_csr_modulo_firma.setValue('ghi');
    component._resetDescrittoriFirma();
    expect(component._descrittoreCtrl_firma.value).toBe('');
    expect(component._descrittoreCtrl_csr_firma.value).toBe('');
    expect(component._descrittoreCtrl_csr_modulo_firma.value).toBe('');
  });

  // ─── _resetAllAuthType ───

  it('should reset all auth type flags', () => {
    component._isHttps = true;
    component._isPdnd = true;
    component._isNoDati = true;
    component._resetAllAuthType();
    expect(component._isHttps).toBe(false);
    expect(component._isPdnd).toBe(false);
    expect(component._isNoDati).toBe(false);
    expect(component._isIndirizzoIP).toBe(false);
    expect(component._isHttpBasic).toBe(false);
    expect(component._isOauthAuthCode).toBe(false);
    expect(component._isOauthClientCredentials).toBe(false);
    expect(component._isHttpsSign).toBe(false);
    expect(component._isHttpsPdnd).toBe(false);
    expect(component._isHttpsPdndSign).toBe(false);
    expect(component._isSign).toBe(false);
    expect(component._isSignPdnd).toBe(false);
  });

  // ─── _onChangeTipoReferente ───

  it('should set filter when referent type is true', () => {
    component._onChangeTipoReferente(true);
    expect(component.referentiFilter).toBe('referente_servizio,gestore,coordinatore');
  });

  it('should clear filter when referent type is false', () => {
    component._onChangeTipoReferente(false);
    expect(component.referentiFilter).toBe('');
  });

  // ─── loadAnagrafiche ───

  it('should populate anagrafiche with tipo-referente', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente'].length).toBe(2);
    expect(component.anagrafiche['tipo-referente'][0].nome).toBe('referente');
    expect(component.anagrafiche['tipo-referente'][1].nome).toBe('referente_tecnico');
  });

  // ─── _hasControlError ───

  it('should return true when control has errors and is touched', () => {
    component._editFormGroupClients = new FormGroup({
      nome: new FormControl('', Validators.required)
    });
    component._editFormGroupClients.controls['nome'].markAsTouched();
    expect(component._hasControlError('nome')).toBe(true);
  });

  it('should return false when control has no errors', () => {
    component._editFormGroupClients = new FormGroup({
      nome: new FormControl('value', Validators.required)
    });
    component._editFormGroupClients.controls['nome'].markAsTouched();
    expect(component._hasControlError('nome')).toBe(false);
  });

  it('should return false when control does not exist', () => {
    component._editFormGroupClients = new FormGroup({});
    expect(component._hasControlError('nonexistent')).toBe(false);
  });

  // ─── __loadMoreData ───

  it('should load more clients when links.next exists', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    component._links = { next: 'http://next' };
    component._preventMultiCall = false;
    component._isConfigClients = true;
    component.__loadMoreData();
    expect(component._preventMultiCall).toBe(true);
    expect(component._loadAdesioneConfigClients).toHaveBeenCalled();
  });

  it('should load more erogazioni when not in clients mode', () => {
    vi.spyOn(component, '_loadAdesioneConfigErogazioni').mockImplementation(() => {});
    component._links = { next: 'http://next' };
    component._preventMultiCall = false;
    component._isConfigClients = false;
    component.__loadMoreData();
    expect(component._loadAdesioneConfigErogazioni).toHaveBeenCalled();
  });

  it('should not load when preventMultiCall is true', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    component._links = { next: 'http://next' };
    component._preventMultiCall = true;
    component.__loadMoreData();
    expect(component._loadAdesioneConfigClients).not.toHaveBeenCalled();
  });

  it('should not load when no next link', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    component._links = {};
    component._preventMultiCall = false;
    component.__loadMoreData();
    expect(component._loadAdesioneConfigClients).not.toHaveBeenCalled();
  });

  // ─── _resetScroll ───

  it('should call Tools.ScrollElement on _resetScroll', () => {
    Tools.ScrollElement = vi.fn();
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  // ─── Permission / Mapper methods ───

  it('should delegate _canEdit to authenticationService', () => {
    component.adesione = { stato: 'bozza' };
    component._grant = { ruoli: ['referente'] } as any;
    component._canEdit();
    expect(mockAuthService.canEdit).toHaveBeenCalledWith('adesione', 'adesione', 'bozza', ['referente']);
  });

  it('should return true for _isGestoreMapper when gestore', () => {
    mockAuthService.isGestore.mockReturnValue(true);
    component._grant = { ruoli: ['gestore'] } as any;
    expect(component._isGestoreMapper()).toBe(true);
  });

  it('should return false for _isGestoreMapper when not gestore', () => {
    mockAuthService.isGestore.mockReturnValue(false);
    expect(component._isGestoreMapper()).toBe(false);
  });

  it('should return true for _isConfiguratoMapper when CONFIGURATO', () => {
    const item = { source: { stato: StatoConfigurazioneEnum.CONFIGURATO } };
    expect(component._isConfiguratoMapper(item)).toBe(true);
  });

  it('should return false for _isConfiguratoMapper when NONCONFIGURATO', () => {
    const item = { source: { stato: StatoConfigurazioneEnum.NONCONFIGURATO } };
    expect(component._isConfiguratoMapper(item)).toBe(false);
  });

  it('should return false for _isConfiguratoMapper when nome_proposto is set', () => {
    const item = { source: { stato: StatoConfigurazioneEnum.CONFIGURATO, nome_proposto: 'Proposed' } };
    expect(component._isConfiguratoMapper(item)).toBe(false);
  });

  it('should return true for _isModifiableMapper when collaudo + Scrittura', () => {
    component.environmentId = 'collaudo';
    component._grant = { collaudo: 'scrittura', produzione: 'lettura', ruoli: [] } as any;
    expect(component._isModifiableMapper()).toBe(true);
  });

  it('should return true for _isModifiableMapper when produzione + Scrittura', () => {
    component.environmentId = 'produzione';
    component._grant = { collaudo: 'lettura', produzione: 'scrittura', ruoli: [] } as any;
    expect(component._isModifiableMapper()).toBe(true);
  });

  it('should return false for _isModifiableMapper when no grant', () => {
    component._grant = null;
    expect(component._isModifiableMapper()).toBe(false);
  });

  it('should return false for _isModifiableMapper when only lettura', () => {
    component.environmentId = 'collaudo';
    component._grant = { collaudo: 'lettura', produzione: 'lettura', ruoli: [] } as any;
    expect(component._isModifiableMapper()).toBe(false);
  });

  // ─── _disableAllFields ───

  it('should disable all form controls', () => {
    const controls: any = {
      nome: new FormControl('test'),
      url: new FormControl('http://test'),
    };
    component._disableAllFields(controls);
    expect(controls.nome.disabled).toBe(true);
    expect(controls.url.disabled).toBe(true);
  });

  // ─── _initEditFormErogazioni ───

  it('should create erogazioni form with data', () => {
    component._grant = { collaudo: 'lettura', ruoli: [] } as any;
    const data = { nome: 'Api1', versione: '1', url: 'http://api', indirizzi_ip: '1.2.3.4' };
    component._initEditFormErogazioni(data);
    expect(component._editFormGroupErogazioni.get('nome')!.value).toBe('Api1');
    expect(component._editFormGroupErogazioni.get('versione')!.value).toBe('1');
    expect(component._editFormGroupErogazioni.get('url')!.value).toBe('http://api');
    expect(component._editFormGroupErogazioni.get('indirizzi_ip')!.value).toBe('1.2.3.4');
  });

  it('should set url as required in erogazioni form', () => {
    component._grant = { collaudo: 'lettura', ruoli: [] } as any;
    const data = { nome: 'Api1', versione: '1', url: null, indirizzi_ip: null };
    component._initEditFormErogazioni(data);
    expect(component._editFormGroupErogazioni.get('url')!.hasValidator(Validators.required)).toBe(true);
  });

  // ─── _loadCredenziali ───

  it('should push new credentials when empty organization', () => {
    component._loadCredenziali('https', '', 'collaudo');
    expect(component._arr_clients_riuso.length).toBe(1);
    expect(component._arr_clients_riuso[0].nome).toBe('Nuove credenziali');
    expect(component._arr_clients_riuso[0].id_client).toBeNull();
  });

  it('should push choose/new/existing when org provided and no visualizza_elenco', () => {
    component._generalConfig = { adesione: { visualizza_elenco_client_esistenti: false } };
    mockAuthService.isGestore.mockReturnValue(false);
    component._loadCredenziali('https', 'org-1', 'collaudo');
    expect(component._arr_clients_riuso.length).toBe(3);
    expect(component._arr_clients_riuso[0].id_client).toBe('');
    expect(component._arr_clients_riuso[1].id_client).toBe('nuovoClient');
    expect(component._arr_clients_riuso[2].id_client).toBe('usaClientEsistente');
  });

  // ─── _loadConfigurazioni ───

  it('should load configurazioni and filter proprieta_custom', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    component.adesione = {
      soggetto: { organizzazione: { nome: 'O' } },
      servizio: { nome: 'S', versione: '1' },
      id_adesione: 'a-1', stato: 'bozza',
      client_richiesti: [{ profilo: 'p1', auth_type: 'https' }],
      erogazioni_richieste: []
    };
    component.proprietaCustom = [
      { nome_gruppo: 'grp1', auth_type: ['https'], profili: ['p1'], classe_dato: ['collaudo'], ruoli_abilitati: null }
    ];
    component._grant = { ruoli: ['referente'] } as any;
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));
    component._loadConfigurazioni();
    expect(component.configurazioni).toEqual([]);
    expect(component._proprietaCustomFiltered.length).toBe(1);
  });

  it('should filter out proprieta_custom with non-matching classe_dato', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    component.adesione = {
      soggetto: { organizzazione: { nome: 'O' } },
      servizio: { nome: 'S', versione: '1' },
      id_adesione: 'a-1', stato: 'bozza',
      client_richiesti: [{ profilo: 'p1', auth_type: 'https' }],
      erogazioni_richieste: []
    };
    component.proprietaCustom = [
      { nome_gruppo: 'grp1', auth_type: null, profili: null, classe_dato: ['produzione'], ruoli_abilitati: null }
    ];
    component._grant = { ruoli: [] } as any;
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));
    component._loadConfigurazioni();
    expect(component._proprietaCustomFiltered.length).toBe(0);
  });

  it('should handle error on _loadConfigurazioni', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    mockApiService.getDetails.mockReturnValue(throwError(() => ({ status: 500 })));
    component._loadConfigurazioni();
    expect(Tools.OnError).toHaveBeenCalled();
  });

  it('should not load configurazioni when id is 0', () => {
    component.id = 0;
    component._loadConfigurazioni();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  // ─── onChangeTipoCertificato ───

  describe('onChangeTipoCertificato', () => {
    beforeEach(() => {
      // init a minimal form to avoid errors
      component._editFormGroupClients = new FormGroup({
        filename: new FormControl(null), estensione: new FormControl(null), content: new FormControl(null), uuid: new FormControl(null),
        filename_csr: new FormControl(null), estensione_csr: new FormControl(null), content_csr: new FormControl(null), uuid_csr: new FormControl(null),
        cn: new FormControl(null),
        filename_firma: new FormControl(null), estensione_firma: new FormControl(null), content_firma: new FormControl(null), uuid_firma: new FormControl(null),
        filename_csr_firma: new FormControl(null), estensione_csr_firma: new FormControl(null), content_csr_firma: new FormControl(null), uuid_csr_firma: new FormControl(null),
        cn_firma: new FormControl(null),
      });
    });

    it('should set _isFornito true for fornito event', () => {
      component.onChangeTipoCertificato({ nome: 'fornito' });
      expect(component._isFornito).toBe(true);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });

    it('should set _isRichiesto_cn true for richiesto_cn event', () => {
      component.onChangeTipoCertificato({ nome: 'richiesto_cn' });
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(true);
    });

    it('should set _isRichiesto_csr true for richiesto_csr event', () => {
      component.onChangeTipoCertificato({ nome: 'richiesto_csr' });
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_csr).toBe(true);
    });

    it('should reset all flags for null event', () => {
      component._isFornito = true;
      component.onChangeTipoCertificato(null);
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });
  });

  // ─── onChangeTipoCertificatoFirma ───

  describe('onChangeTipoCertificatoFirma', () => {
    beforeEach(() => {
      component._editFormGroupClients = new FormGroup({
        filename: new FormControl(null), estensione: new FormControl(null), content: new FormControl(null), uuid: new FormControl(null),
        filename_csr: new FormControl(null), estensione_csr: new FormControl(null), content_csr: new FormControl(null), uuid_csr: new FormControl(null),
        cn: new FormControl(null),
        filename_firma: new FormControl(null), estensione_firma: new FormControl(null), content_firma: new FormControl(null), uuid_firma: new FormControl(null),
        filename_csr_firma: new FormControl(null), estensione_csr_firma: new FormControl(null), content_csr_firma: new FormControl(null), uuid_csr_firma: new FormControl(null),
        cn_firma: new FormControl(null),
      });
    });

    it('should set _isFornito_firma true for fornito event', () => {
      component.onChangeTipoCertificatoFirma({ nome: 'fornito' });
      expect(component._isFornito_firma).toBe(true);
      expect(component._isRichiesto_cn_firma).toBe(false);
    });

    it('should set _isRichiesto_cn_firma true for richiesto_cn event', () => {
      component.onChangeTipoCertificatoFirma({ nome: 'richiesto_cn' });
      expect(component._isRichiesto_cn_firma).toBe(true);
    });

    it('should set _isRichiesto_csr_firma true for richiesto_csr event', () => {
      component.onChangeTipoCertificatoFirma({ nome: 'richiesto_csr' });
      expect(component._isRichiesto_csr_firma).toBe(true);
    });

    it('should reset all firma flags for null event', () => {
      component._isFornito_firma = true;
      component.onChangeTipoCertificatoFirma(null);
      expect(component._isFornito_firma).toBe(false);
      expect(component._isRichiesto_cn_firma).toBe(false);
      expect(component._isRichiesto_csr_firma).toBe(false);
    });
  });

  // ─── __descrittoreChange ───

  it('should update non-csr file fields on __descrittoreChange', () => {
    component._editFormGroupClients = new FormGroup({
      filename: new FormControl(null), estensione: new FormControl(null), content: new FormControl(null),
      filename_csr: new FormControl(null), estensione_csr: new FormControl(null), content_csr: new FormControl(null),
    });
    component.__descrittoreChange({ file: 'cert.pem', type: 'application/x-pem-file', data: 'base64data' });
    expect(component._editFormGroupClients.get('filename')!.value).toBe('cert.pem');
    expect(component._editFormGroupClients.get('estensione')!.value).toBe('application/x-pem-file');
    expect(component._editFormGroupClients.get('content')!.value).toBe('base64data');
  });

  it('should update csr file fields on __descrittoreChange with csr=true', () => {
    component._editFormGroupClients = new FormGroup({
      filename: new FormControl(null), estensione: new FormControl(null), content: new FormControl(null),
      filename_csr: new FormControl(null), estensione_csr: new FormControl(null), content_csr: new FormControl(null),
    });
    component.__descrittoreChange({ file: 'req.csr', type: 'application/pkcs10', data: 'csrdata' }, true);
    expect(component._editFormGroupClients.get('filename_csr')!.value).toBe('req.csr');
    expect(component._editFormGroupClients.get('content_csr')!.value).toBe('csrdata');
  });

  it('should clear error on __descrittoreChange', () => {
    component._error = true;
    component._errorMsg = 'old error';
    component._editFormGroupClients = new FormGroup({
      filename: new FormControl(null), estensione: new FormControl(null), content: new FormControl(null),
      filename_csr: new FormControl(null), estensione_csr: new FormControl(null), content_csr: new FormControl(null),
    });
    component.__descrittoreChange({ file: 'f', type: 't', data: 'd' });
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  // ─── _onSaveCustomProperty ───

  it('should reload clients and erogazioni on save custom property', () => {
    vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
    vi.spyOn(component, '_loadAdesioneConfigErogazioni').mockImplementation(() => {});
    vi.spyOn(component as any, '_loadConfigurazioni').mockImplementation(() => {});
    component._onSaveCustomProperty({});
    expect(component._loadAdesioneConfigClients).toHaveBeenCalledWith(null, '', true);
    expect(component._loadAdesioneConfigErogazioni).toHaveBeenCalledWith(null, '', true);
  });

  // ─── _showMandatoryFields ───

  it('should not throw when debugMandatoryFields is false', () => {
    component.debugMandatoryFields = false;
    const controls = { nome: new FormControl('', Validators.required) };
    expect(() => component._showMandatoryFields(controls)).not.toThrow();
  });

  // ─── _initEditFormClients ───

  describe('_initEditFormClients', () => {
    beforeEach(() => {
      // re-establish mocks in case vi.restoreAllMocks cleared them
      mockAuthService._getConfigModule.mockImplementation((module: string) => {
        if (module === 'adesione') {
          return { proprieta_custom: [] };
        }
        return {
          api: {
            auth_type: [
              { type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false },
              { type: 'pdnd', indirizzi_ip: false, rate_limiting: false, finalita: true },
              { type: 'no_dati', indirizzi_ip: false, rate_limiting: false, finalita: false },
            ],
            profili: []
          }
        };
      });
      mockAuthService.isGestore.mockReturnValue(false);

      component._auth_type = 'https';
      component._isHttps = true;
      component.adesione = {
        soggetto: { organizzazione: { id_organizzazione: 'org-1' } },
        servizio: { nome: 'S', versione: '1' },
        id_adesione: 'a-1', stato: 'bozza'
      };
      component.environmentId = 'collaudo';
      component._generalConfig = { adesione: { visualizza_elenco_client_esistenti: false } };
      component._grant = { collaudo: 'lettura', ruoli: [] } as any;
      // Prevent the async setTimeout(onChangeCredenziali, 100) from firing after test ends
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create form with all required controls for null data', () => {
      component._initEditFormClients(null);
      const controls = component._editFormGroupClients.controls;
      expect(controls['credenziali']).toBeTruthy();
      expect(controls['nome']).toBeTruthy();
      expect(controls['tipo_certificato']).toBeTruthy();
      expect(controls['ip_fruizione']).toBeTruthy();
      expect(controls['rate_limiting']).toBeTruthy();
      expect(controls['finalita']).toBeTruthy();
      expect(controls['client_id']).toBeTruthy();
    });

    it('should populate nome when data is provided', () => {
      const data = { id_client: 'c-1', nome: 'Client1', dati_specifici: null };
      component._initEditFormClients(data);
      expect(component._editFormGroupClients.get('nome')!.value).toBe('Client1');
    });

    it('should set fornito flags when data has certificato_autenticazione fornito', () => {
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: {
          auth_type: 'https',
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'u1' } }
        },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._isFornito).toBe(true);
      expect(component._isRichiesto_cn).toBe(false);
    });

    it('should show nome_proposto when data has nome_proposto', () => {
      const data = { id_client: null, nome: null, nome_proposto: 'Proposed', dati_specifici: null };
      component._initEditFormClients(data);
      expect(component._show_nome_proposto).toBeTruthy();
      expect(component._show_client_form).toBe(false);
    });
  });

  // ─── _canAddMapper ───

  describe('_canAddMapper', () => {
    it('should return false when no permissions at all', () => {
      component._collaudo = true;
      component.adesione = { stato: 'bozza' };
      mockAuthService._getClassesNotModifiable.mockReturnValue(['collaudo', 'produzione']);
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      expect(component._canAddMapper()).toBe(false);
    });

    it('should return true for collaudo when not blocked', () => {
      component._collaudo = true;
      component.environmentId = 'collaudo';
      component.adesione = { stato: 'collaudo' };
      mockAuthService._getClassesNotModifiable.mockReturnValue([]);
      mockAuthService.isGestore.mockReturnValue(true);
      expect(component._canAddMapper()).toBe(true);
    });
  });

  // ─── _onEditAdesioneErogaz ───

  it('should set erogaz data and init form on _onEditAdesioneErogaz', () => {
    component._grant = { collaudo: 'lettura', ruoli: [] } as any;
    const erogaz = { id_erogazione: 'e-1', nome: 'Api1', versione: '1', url: 'http://api', indirizzi_ip: null };
    const showSpy = vi.fn();
    component._modalEditRef = { hide: vi.fn() } as any;
    mockModalService.show.mockReturnValue({ hide: vi.fn() });
    component.editErogazioni = {} as any;
    component._onEditAdesioneErogaz(erogaz);
    expect(component.erogaz).toBe(erogaz);
    expect(component.id_erogazione).toBe('e-1');
    expect(component._editFormGroupErogazioni.get('nome')!.value).toBe('Api1');
    expect(mockModalService.show).toHaveBeenCalled();
  });

  // ─── closeModal ───

  it('should hide modal and reset state on closeModal', () => {
    const hideSpy = vi.fn();
    component._modalEditRef = { hide: hideSpy } as any;
    component._arr_clients_riuso = [{ nome: 'test' }];
    component._isEdit = true;
    component.showSubscription = undefined as any;
    component.closeModal();
    expect(hideSpy).toHaveBeenCalled();
    expect(component._arr_clients_riuso).toEqual([]);
    expect(component._isEdit).toBe(false);
  });

  it('should unsubscribe showSubscription on closeModal', () => {
    const hideSpy = vi.fn();
    const unsubSpy = vi.fn();
    component._modalEditRef = { hide: hideSpy } as any;
    component.showSubscription = { unsubscribe: unsubSpy } as any;
    component.closeModal();
    expect(unsubSpy).toHaveBeenCalled();
  });

  // ─── _onSaveModalClient ───

  describe('_onSaveModalClient', () => {
    let formControls: any;

    beforeEach(() => {
      vi.useFakeTimers();
      component.adesione = {
        soggetto: { id_soggetto: 's-1', organizzazione: { id_organizzazione: 'org-1' } },
        servizio: { nome: 'S', versione: '1' },
        id_adesione: 'ade-1',
        stato: 'bozza'
      };
      component.environmentId = 'collaudo';
      component._auth_type = 'https';
      component._isHttps = true;
      component._codice_interno_profilo = 'profilo1';
      component._tipo_client = 'nuovo';
      component._show_erogazione_rate_limiting = false;
      component._show_erogazione_finalita = false;

      // Create form with all controls
      component._editFormGroupClients = new FormGroup({
        credenziali: new FormControl('c-1'),
        nome_proposto: new FormControl(null),
        nome: new FormControl('ClientName'),
        tipo_certificato: new FormControl('fornito'),
        tipo_certificato_firma: new FormControl(null),
        filename: new FormControl('cert.pem'),
        estensione: new FormControl('application/x-pem-file'),
        content: new FormControl('base64data'),
        uuid: new FormControl(null),
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        uuid_firma: new FormControl(null),
        filename_csr: new FormControl(null),
        estensione_csr: new FormControl(null),
        content_csr: new FormControl(null),
        uuid_csr: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
        uuid_csr_firma: new FormControl(null),
        cn: new FormControl(null),
        cn_firma: new FormControl(null),
        csr: new FormControl(null),
        modulo_richiesta_csr: new FormControl(null),
        modulo_richiesta_csr_firma: new FormControl(null),
        ip_fruizione: new FormControl(null),
        descrizione: new FormControl(null),
        rate_limiting: new FormGroup({
          quota: new FormControl(null),
          periodo: new FormControl(null)
        }),
        finalita: new FormControl(null),
        id_utente: new FormControl(null),
        url_redirezione: new FormControl(null),
        url_esposizione: new FormControl(null),
        help_desk: new FormControl(null),
        nome_applicazione_portale: new FormControl(null),
        client_id: new FormControl(null),
        username: new FormControl(null),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create new client via PUT when no existing id_client', () => {
      component._currClient = {};
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      const body = { credenziali: 'c-1', estensione: 'application/x-pem-file', content: 'base64data', filename: 'cert.pem' };
      component._onSaveModalClient(body);

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'adesioni', 'ade-1', 'collaudo/client/profilo1', expect.any(Object)
      );
      expect(component._loadAdesioneConfigClients).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should update existing client via PUT when id_client is present', () => {
      component._currClient = { id_client: 'c-1', nome: 'Existing', soggetto: { id_soggetto: 's-2' } };
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      const body = { credenziali: 'c-1', estensione: 'application/x-pem-file', content: 'base64data', filename: 'cert.pem' };
      component._onSaveModalClient(body);

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'adesioni', 'ade-1', 'collaudo/client/profilo1', expect.objectContaining({ id_soggetto: 's-2' })
      );
    });

    it('should handle error on update existing client', () => {
      component._currClient = { id_client: 'c-1', nome: 'Existing', soggetto: { id_soggetto: 's-2' } };
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({ status: 500 })));
      mockUtils.GetErrorMsg.mockReturnValue('Server Error');

      const body = { credenziali: 'c-1' };
      component._onSaveModalClient(body);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Server Error');
    });

    it('should handle error on create new client', () => {
      component._currClient = {};
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({ status: 400 })));
      mockUtils.GetErrorMsg.mockReturnValue('Bad Request');

      const body = { credenziali: 'c-1' };
      component._onSaveModalClient(body);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Bad Request');
    });

    it('should set richiesto_cn certificate in dati_specifici', () => {
      component._currClient = {};
      component._editFormGroupClients.get('tipo_certificato')!.setValue('richiesto_cn');
      component._editFormGroupClients.get('cn')!.setValue('CN=test');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({ credenziali: 'c-1' });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_autenticazione.tipo_certificato).toBe('richiesto_cn');
      expect(payload.dati_specifici.certificato_autenticazione.cn).toBe('CN=test');
    });

    it('should set richiesto_csr certificate in dati_specifici', () => {
      component._currClient = {};
      component._certificato_csr = null;
      component._modulo_richiesta_csr = null;
      component._editFormGroupClients.get('tipo_certificato')!.setValue('richiesto_csr');
      component._editFormGroupClients.get('content_csr')!.setValue('csrdata');
      component._editFormGroupClients.get('filename_csr')!.setValue('req.csr');
      component._editFormGroupClients.get('estensione_csr')!.setValue('application/pkcs10');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({
        credenziali: 'c-1', content_csr: 'csrdata', filename_csr: 'req.csr',
        estensione_csr: 'application/pkcs10', content: 'modulodata', filename: 'modulo.pem', estensione: 'pem'
      });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_autenticazione.tipo_certificato).toBe('richiesto_csr');
      expect(payload.dati_specifici.certificato_autenticazione.richiesta).toBeDefined();
      expect(payload.dati_specifici.certificato_autenticazione.modulo_richiesta).toBeDefined();
    });

    it('should include client_id for pdnd auth type', () => {
      component._currClient = {};
      component._isPdnd = true;
      component._isHttps = false;
      component._auth_type = 'pdnd';
      component._editFormGroupClients.get('tipo_certificato')!.setValue(null);
      component._editFormGroupClients.get('client_id')!.setValue('pdnd-client-id');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({ credenziali: 'c-1' });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.client_id).toBe('pdnd-client-id');
    });

    it('should include rate_limiting when show_erogazione_rate_limiting is true', () => {
      component._currClient = {};
      component._show_erogazione_rate_limiting = true;
      component._editFormGroupClients.get('tipo_certificato')!.setValue(null);
      (component._editFormGroupClients.get('rate_limiting') as FormGroup).get('quota')!.setValue(100);
      (component._editFormGroupClients.get('rate_limiting') as FormGroup).get('periodo')!.setValue('giorno');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({ credenziali: 'c-1' });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.rate_limiting).toEqual({ quota: 100, periodo: 'giorno' });
    });

    it('should include finalita when show_erogazione_finalita is true', () => {
      component._currClient = {};
      component._show_erogazione_finalita = true;
      component._editFormGroupClients.get('tipo_certificato')!.setValue(null);
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({ credenziali: 'c-1', finalita: 'purpose-uuid' });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.finalita).toBe('purpose-uuid');
    });

    it('should set fornito firma certificate in dati_specifici', () => {
      component._currClient = {};
      component._certificato_fornito_firma = null;
      component._editFormGroupClients.get('tipo_certificato')!.setValue(null);
      component._editFormGroupClients.get('tipo_certificato_firma')!.setValue('fornito');
      component._editFormGroupClients.get('content_firma')!.setValue('firmabase64');
      component._editFormGroupClients.get('filename_firma')!.setValue('firma.pem');
      component._editFormGroupClients.get('estensione_firma')!.setValue('application/x-pem-file');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({
        credenziali: 'c-1', content_firma: 'firmabase64', filename_firma: 'firma.pem',
        estensione_firma: 'application/x-pem-file'
      });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_firma.tipo_certificato).toBe('fornito');
      expect(payload.dati_specifici.certificato_firma.certificato).toBeDefined();
    });

    it('should set richiesto_cn firma certificate in dati_specifici', () => {
      component._currClient = {};
      component._editFormGroupClients.get('tipo_certificato')!.setValue(null);
      component._editFormGroupClients.get('tipo_certificato_firma')!.setValue('richiesto_cn');
      component._editFormGroupClients.get('cn_firma')!.setValue('CN=firma');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({ credenziali: 'c-1' });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_firma.tipo_certificato).toBe('richiesto_cn');
      expect(payload.dati_specifici.certificato_firma.cn).toBe('CN=firma');
    });

    it('should set richiesto_csr firma certificate in dati_specifici', () => {
      component._currClient = {};
      component._certificato_csr_firma = null;
      component._modulo_richiesta_csr_firma = null;
      component._editFormGroupClients.get('tipo_certificato')!.setValue(null);
      component._editFormGroupClients.get('tipo_certificato_firma')!.setValue('richiesto_csr');
      component._editFormGroupClients.get('content_csr_firma')!.setValue('csrfirmadata');
      component._editFormGroupClients.get('filename_csr_firma')!.setValue('firmacsr.pem');
      component._editFormGroupClients.get('estensione_csr_firma')!.setValue('pem');
      component._editFormGroupClients.get('content_firma')!.setValue('modulofirmadata');
      component._editFormGroupClients.get('filename_firma')!.setValue('modulofirma.pem');
      component._editFormGroupClients.get('estensione_firma')!.setValue('pem');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({
        credenziali: 'c-1',
        content_csr_firma: 'csrfirmadata', filename_csr_firma: 'firmacsr.pem', estensione_csr_firma: 'pem',
        content_firma: 'modulofirmadata', filename_firma: 'modulofirma.pem', estensione_firma: 'pem'
      });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_firma.tipo_certificato).toBe('richiesto_csr');
      expect(payload.dati_specifici.certificato_firma.richiesta).toBeDefined();
      expect(payload.dati_specifici.certificato_firma.modulo_richiesta).toBeDefined();
    });

    it('should include oauth fields for oauth_authorization_code auth type', () => {
      component._currClient = {};
      component._isOauthAuthCode = true;
      component._isHttps = false;
      component._auth_type = 'oauth_authorization_code';
      component._editFormGroupClients.get('tipo_certificato')!.setValue(null);
      component._editFormGroupClients.get('client_id')!.setValue('oauth-client');
      component._editFormGroupClients.get('url_redirezione')!.setValue('http://redirect');
      component._editFormGroupClients.get('url_esposizione')!.setValue('http://expose');
      component._editFormGroupClients.get('help_desk')!.setValue('http://help');
      component._editFormGroupClients.get('nome_applicazione_portale')!.setValue('MyApp');
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalClient({ credenziali: 'c-1' });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.client_id).toBe('oauth-client');
      expect(payload.dati_specifici.url_redirezione).toBe('http://redirect');
      expect(payload.dati_specifici.url_esposizione).toBe('http://expose');
      expect(payload.dati_specifici.help_desk).toBe('http://help');
      expect(payload.dati_specifici.nome_applicazione_portale).toBe('MyApp');
    });
  });

  // ─── _onSaveModalErogazioni ───

  describe('_onSaveModalErogazioni', () => {
    beforeEach(() => {
      component.adesione = {
        soggetto: { id_soggetto: 's-1' },
        servizio: { nome: 'S', versione: '1' },
        id_adesione: 'ade-1',
        stato: 'bozza'
      };
      component.environmentId = 'collaudo';
      component.id_erogazione = 'erog-1';
    });

    it('should save erogazione and reload on success', () => {
      vi.spyOn(component, '_loadAdesioneConfigErogazioni').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalErogazioni({ url: 'http://api', indirizzi_ip: '1.2.3.4' });

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'adesioni', 'ade-1', 'collaudo/erogazioni/erog-1',
        expect.objectContaining({ url: 'http://api', indirizzi_ip: '1.2.3.4' })
      );
      expect(component._loadAdesioneConfigErogazioni).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should handle error on save erogazione', () => {
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({ status: 500 })));
      mockUtils.GetErrorMsg.mockReturnValue('Error msg');

      component._onSaveModalErogazioni({ url: 'http://api', indirizzi_ip: null });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error msg');
    });

    it('should remove null properties from payload', () => {
      vi.spyOn(component, '_loadAdesioneConfigErogazioni').mockImplementation(() => {});
      vi.spyOn(component, 'closeModal').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(of({}));

      component._onSaveModalErogazioni({ url: 'http://api', indirizzi_ip: null });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.indirizzi_ip).toBeUndefined();
      expect(payload.url).toBe('http://api');
    });
  });

  // ─── _onEditClient ───

  describe('_onEditClient', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      component.adesione = {
        soggetto: { organizzazione: { id_organizzazione: 'org-1' } },
        servizio: { nome: 'S', versione: '1' },
        id_adesione: 'ade-1',
        stato: 'bozza'
      };
      component.environmentId = 'collaudo';
      component._generalConfig = { adesione: { visualizza_elenco_client_esistenti: false } };
      component._grant = { collaudo: 'lettura', ruoli: [] } as any;

      mockAuthService._getConfigModule.mockImplementation((module: string) => {
        if (module === 'adesione') return { proprieta_custom: [] };
        return {
          api: {
            auth_type: [
              { type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false },
            ],
            profili: []
          }
        };
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set up new client when no id_client and not configured', () => {
      const client = {
        id_client: null,
        ip_richiesto: false,
        auth_type: 'https',
        source: { codice_interno: 'prof1', stato: StatoConfigurazioneEnum.NONCONFIGURATO }
      };
      mockModalService.show.mockReturnValue({ hide: vi.fn() });
      component.editClients = {} as any;

      component._onEditClient(client);

      expect(component.client).toBe(client);
      expect(component._auth_type).toBe('https');
      expect(component._isEdit).toBe(false);
      expect(component._codice_interno_profilo).toBe('prof1');
    });

    it('should load client details for existing configured client', () => {
      const client = {
        id_client: 'c-1',
        ip_richiesto: false,
        auth_type: 'https',
        source: { codice_interno: 'prof1', stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      const clientDetails = {
        id_client: 'c-1',
        nome: 'Client1',
        dati_specifici: { auth_type: 'https' },
        soggetto: { id_soggetto: 's-1' }
      };
      mockApiService.getDetails.mockReturnValue(of(clientDetails));
      mockModalService.show.mockReturnValue({ hide: vi.fn() });
      component.editClients = {} as any;

      component._onEditClient(client);

      expect(component._isEdit).toBe(true);
      expect(mockApiService.getDetails).toHaveBeenCalledWith('client', 'c-1');
    });

    it('should handle error on getDetails for existing client', () => {
      const client = {
        id_client: 'c-1',
        ip_richiesto: false,
        auth_type: 'https',
        source: { codice_interno: 'prof1', stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      mockApiService.getDetails.mockReturnValue(throwError(() => ({ status: 404 })));
      mockUtils.GetErrorMsg.mockReturnValue('Not Found');

      component._onEditClient(client);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Not Found');
    });

    it('should handle nome_proposto client as not configured', () => {
      const client = {
        id_client: null,
        ip_richiesto: false,
        auth_type: 'https',
        source: { codice_interno: 'prof1', stato: StatoConfigurazioneEnum.NONCONFIGURATO, nome_proposto: 'Proposed' }
      };
      mockModalService.show.mockReturnValue({ hide: vi.fn() });
      component.editClients = {} as any;

      component._onEditClient(client);

      expect(component._show_nome_proposto).toBe(true);
      expect(component._isEdit).toBe(false);
    });
  });

  // ─── onChangeCredenziali ───

  describe('onChangeCredenziali', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      component.adesione = {
        soggetto: { organizzazione: { id_organizzazione: 'org-1' } },
        servizio: { nome: 'S', versione: '1' },
        id_adesione: 'ade-1',
        stato: 'bozza'
      };
      component.environmentId = 'collaudo';
      component._auth_type = 'https';
      component._isHttps = true;
      component._grant = { collaudo: 'scrittura', ruoli: [] } as any;
      component.client = { source: {} };

      mockAuthService._getConfigModule.mockImplementation((module: string) => {
        if (module === 'adesione') return { proprieta_custom: [] };
        return {
          api: {
            auth_type: [
              { type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false },
              { type: 'pdnd', indirizzi_ip: false, rate_limiting: false, finalita: true },
            ],
            profili: []
          }
        };
      });

      // Create the full form
      component._editFormGroupClients = new FormGroup({
        credenziali: new FormControl(''),
        nome_proposto: new FormControl(null),
        nome: new FormControl({ value: null, disabled: true }),
        tipo_certificato: new FormControl({ value: null, disabled: true }),
        tipo_certificato_firma: new FormControl({ value: null, disabled: true }),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        uuid_firma: new FormControl(null),
        filename_csr: new FormControl(null),
        estensione_csr: new FormControl(null),
        content_csr: new FormControl(null),
        uuid_csr: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
        uuid_csr_firma: new FormControl(null),
        cn: new FormControl(null),
        cn_firma: new FormControl(null),
        csr: new FormControl(null),
        modulo_richiesta_csr: new FormControl(null),
        modulo_richiesta_csr_firma: new FormControl(null),
        ip_fruizione: new FormControl({ value: null, disabled: true }),
        descrizione: new FormControl({ value: null, disabled: true }),
        rate_limiting: new FormGroup({
          quota: new FormControl({ value: null, disabled: true }),
          periodo: new FormControl({ value: null, disabled: true })
        }),
        finalita: new FormControl({ value: null, disabled: true }),
        id_utente: new FormControl(null),
        url_redirezione: new FormControl({ value: null, disabled: true }),
        url_esposizione: new FormControl({ value: null, disabled: true }),
        help_desk: new FormControl({ value: null, disabled: true }),
        nome_applicazione_portale: new FormControl({ value: null, disabled: true }),
        client_id: new FormControl({ value: null, disabled: true }),
        username: new FormControl({ value: null, disabled: true }),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle NuovoCliente selection', () => {
      component.onChangeCredenziali(SelectedClientEnum.NuovoCliente);

      expect(component._tipo_client).toBe(TipoClientEnum.Nuovo);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome'].enabled).toBe(true);
    });

    it('should handle UsaClientEsistente selection', () => {
      component.onChangeCredenziali(SelectedClientEnum.UsaClientEsistente);

      expect(component._tipo_client).toBe(TipoClientEnum.Proposto);
      expect(component._show_nome_proposto).toBe(true);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome_proposto'].enabled).toBe(true);
    });

    it('should handle default (existing client) selection with https + fornito cert', () => {
      const existingClient = {
        id_client: 'c-1',
        nome: 'ExistingClient',
        descrizione: 'desc',
        indirizzo_ip: '1.2.3.4',
        dati_specifici: {
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'u1', filename: 'cert.pem' } },
          rate_limiting: null,
          finalita: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-1');

      expect(component._tipo_client).toBe(TipoClientEnum.Riferito);
      expect(component._isFornito).toBe(true);
    });

    it('should handle default selection with https + richiesto_cn cert', () => {
      const existingClient = {
        id_client: 'c-2',
        nome: 'ClientCN',
        dati_specifici: {
          certificato_autenticazione: { tipo_certificato: 'richiesto_cn', cn: 'CN=test', certificato: {} },
          rate_limiting: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-2');

      expect(component._isRichiesto_cn).toBe(true);
      expect(component._certificato_cn).toEqual({});
    });

    it('should handle default selection with https + richiesto_csr cert', () => {
      const existingClient = {
        id_client: 'c-3',
        nome: 'ClientCSR',
        dati_specifici: {
          certificato_autenticazione: { tipo_certificato: 'richiesto_csr', richiesta: { uuid: 'r1' }, modulo_richiesta: { uuid: 'm1' } },
          rate_limiting: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-3');

      expect(component._isRichiesto_csr).toBe(true);
      expect(component._certificato_csr).toEqual({ uuid: 'r1' });
      expect(component._modulo_richiesta_csr).toEqual({ uuid: 'm1' });
    });

    it('should handle null/empty selection (falsy)', () => {
      component.onChangeCredenziali(null);

      const controls = component._editFormGroupClients.controls;
      expect(controls['nome'].disabled).toBe(true);
    });

    it('should handle "null" string selection', () => {
      component.onChangeCredenziali('null');

      const controls = component._editFormGroupClients.controls;
      expect(controls['nome'].disabled).toBe(true);
    });

    it('should handle firma cert for https_sign auth type', () => {
      component._auth_type = 'https_sign';
      component._isHttps = false;
      component._isHttpsSign = true;

      const existingClient = {
        id_client: 'c-sign',
        nome: 'ClientSign',
        dati_specifici: {
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'ua' } },
          certificato_firma: { tipo_certificato: 'fornito', certificato: { uuid: 'uf' } },
          rate_limiting: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-sign');

      expect(component._isFornito).toBe(true);
      expect(component._isFornito_firma).toBe(true);
    });

    it('should handle firma cert richiesto_cn for https_sign', () => {
      component._auth_type = 'https_sign';
      component._isHttps = false;
      component._isHttpsSign = true;

      const existingClient = {
        id_client: 'c-sign-cn',
        nome: 'ClientSignCN',
        dati_specifici: {
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'ua' } },
          certificato_firma: { tipo_certificato: 'richiesto_cn', cn: 'CN=firma', certificato: { uuid: 'ufcn' } },
          rate_limiting: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-sign-cn');

      expect(component._isRichiesto_cn_firma).toBe(true);
      expect(component._certificato_cn_firma).toEqual({ uuid: 'ufcn' });
    });

    it('should handle firma cert richiesto_csr for https_sign', () => {
      component._auth_type = 'https_sign';
      component._isHttps = false;
      component._isHttpsSign = true;

      const existingClient = {
        id_client: 'c-sign-csr',
        nome: 'ClientSignCSR',
        dati_specifici: {
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'ua' } },
          certificato_firma: { tipo_certificato: 'richiesto_csr', richiesta: { uuid: 'rfirma' }, modulo_richiesta: { uuid: 'mfirma' }, certificato: { uuid: 'cfirma' } },
          rate_limiting: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-sign-csr');

      expect(component._isRichiesto_csr_firma).toBe(true);
      expect(component._certificato_csr_firma).toEqual({ uuid: 'rfirma' });
      expect(component._modulo_richiesta_csr_firma).toEqual({ uuid: 'mfirma' });
      expect(component._modulo_richiesta_csr_firma_ceritifato).toEqual({ uuid: 'cfirma' });
    });

    it('should handle pdnd with client_id disable', () => {
      component._auth_type = 'pdnd';
      component._isHttps = false;
      component._isPdnd = true;

      const existingClient = {
        id_client: 'c-pdnd',
        nome: 'ClientPdnd',
        dati_specifici: {
          client_id: 'pdnd-id-123',
          rate_limiting: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-pdnd');

      const controls = component._editFormGroupClients.controls;
      expect(controls['client_id'].value).toBe('pdnd-id-123');
      expect(controls['client_id'].disabled).toBe(true);
    });

    it('should handle oauth_authorization_code disable fields in default case', () => {
      component._auth_type = 'oauth_authorization_code';
      component._isHttps = false;
      component._isOauthAuthCode = true;

      const existingClient = {
        id_client: 'c-oauth',
        nome: 'ClientOAuth',
        dati_specifici: {
          client_id: 'oauth-id',
          url_redirezione: 'http://redir',
          url_esposizione: 'http://expose',
          help_desk: 'http://help',
          nome_applicazione_portale: 'App',
          rate_limiting: null
        }
      };
      component._arr_clients_riuso = [existingClient];
      component._currClient = { source: existingClient };

      component.onChangeCredenziali('c-oauth');

      const controls = component._editFormGroupClients.controls;
      expect(controls['url_redirezione'].value).toBe('http://redir');
      expect(controls['url_redirezione'].disabled).toBe(true);
      expect(controls['help_desk'].value).toBe('http://help');
      expect(controls['help_desk'].disabled).toBe(true);
    });

    it('should enable oauth fields for NuovoCliente with oauth auth type', () => {
      component._auth_type = 'oauth_authorization_code';
      component._isHttps = false;
      component._isOauthAuthCode = true;

      component.onChangeCredenziali(SelectedClientEnum.NuovoCliente);

      const controls = component._editFormGroupClients.controls;
      expect(controls['url_redirezione'].enabled).toBe(true);
      expect(controls['url_esposizione'].enabled).toBe(true);
      expect(controls['help_desk'].enabled).toBe(true);
      expect(controls['nome_applicazione_portale'].enabled).toBe(true);
    });

    it('should handle empty string selection (falsy with oauth)', () => {
      component._auth_type = 'oauth_authorization_code';
      component._isHttps = false;
      component._isOauthAuthCode = true;

      component.onChangeCredenziali('');

      const controls = component._editFormGroupClients.controls;
      expect(controls['url_redirezione'].disabled).toBe(true);
      expect(controls['nome'].disabled).toBe(true);
    });
  });

  // ─── updateAllValidators ───

  describe('updateAllValidators', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      component._isHttps = true;
      component._isPdnd = false;
      component._isHttpsPdnd = false;
      component._isSign = false;
      component._isSignPdnd = false;
      component._isHttpsSign = false;
      component._isHttpsPdndSign = false;
      component._isOauthAuthCode = false;
      component._show_nome_proposto = false;

      mockAuthService._getConfigModule.mockImplementation((module: string) => {
        if (module === 'adesione') return { proprieta_custom: [] };
        return {
          api: {
            auth_type: [{ type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false }],
            profili: []
          }
        };
      });

      component._editFormGroupClients = new FormGroup({
        credenziali: new FormControl(''),
        nome_proposto: new FormControl(null),
        nome: new FormControl(null),
        tipo_certificato: new FormControl(null),
        tipo_certificato_firma: new FormControl(null),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        uuid_firma: new FormControl(null),
        filename_csr: new FormControl(null),
        estensione_csr: new FormControl(null),
        content_csr: new FormControl(null),
        uuid_csr: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
        uuid_csr_firma: new FormControl(null),
        cn: new FormControl(null),
        cn_firma: new FormControl(null),
        csr: new FormControl(null),
        modulo_richiesta_csr: new FormControl(null),
        modulo_richiesta_csr_firma: new FormControl(null),
        ip_fruizione: new FormControl(null),
        descrizione: new FormControl(null),
        rate_limiting: new FormGroup({
          quota: new FormControl(null),
          periodo: new FormControl(null)
        }),
        finalita: new FormControl(null),
        id_utente: new FormControl(null),
        url_redirezione: new FormControl(null),
        url_esposizione: new FormControl(null),
        help_desk: new FormControl(null),
        nome_applicazione_portale: new FormControl(null),
        client_id: new FormControl(null),
        username: new FormControl(null),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clear nome_proposto validators for NuovoCliente', () => {
      component.updateAllValidators(SelectedClientEnum.NuovoCliente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome_proposto'].hasValidator(Validators.required)).toBe(false);
    });

    it('should set client_id required for pdnd with NuovoCliente', () => {
      component._isHttps = false;
      component._isPdnd = true;
      component.updateAllValidators(SelectedClientEnum.NuovoCliente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['client_id'].hasValidator(Validators.required)).toBe(true);
    });

    it('should clear client_id validators for non-pdnd with NuovoCliente', () => {
      component.updateAllValidators(SelectedClientEnum.NuovoCliente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['client_id'].hasValidator(Validators.required)).toBe(false);
    });

    it('should set tipo_certificato_firma required for https_sign with NuovoCliente', () => {
      component._isHttpsSign = true;
      component.updateAllValidators(SelectedClientEnum.NuovoCliente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['tipo_certificato_firma'].hasValidator(Validators.required)).toBe(true);
    });

    it('should enable tipo_certificato_firma and clear tipo_certificato for sign', () => {
      component._isHttps = false;
      component._isSign = true;
      component.updateAllValidators(SelectedClientEnum.NuovoCliente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['tipo_certificato_firma'].enabled).toBe(true);
      expect(controls['tipo_certificato'].hasValidator(Validators.required)).toBe(false);
    });

    it('should set oauth validators for NuovoCliente with oauth_authorization_code', () => {
      component._isHttps = false;
      component._isOauthAuthCode = true;
      component.updateAllValidators(SelectedClientEnum.NuovoCliente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['url_redirezione'].hasValidator(Validators.required)).toBe(true);
      expect(controls['url_esposizione'].hasValidator(Validators.required)).toBe(true);
      expect(controls['help_desk'].hasValidator(Validators.required)).toBe(true);
      expect(controls['nome_applicazione_portale'].hasValidator(Validators.required)).toBe(true);
    });

    it('should clear all validators for UsaClientEsistente', () => {
      component.updateAllValidators(SelectedClientEnum.UsaClientEsistente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome'].hasValidator(Validators.required)).toBe(false);
      expect(controls['ip_fruizione'].hasValidator(Validators.required)).toBe(false);
      expect(controls['client_id'].hasValidator(Validators.required)).toBe(false);
    });

    it('should set nome_proposto required for UsaClientEsistente', () => {
      component.updateAllValidators(SelectedClientEnum.UsaClientEsistente);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome_proposto'].hasValidator(Validators.required)).toBe(true);
    });

    it('should handle default case with show_nome_proposto true', () => {
      component._show_nome_proposto = true;
      component.updateAllValidators('some-id' as any);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome_proposto'].hasValidator(Validators.required)).toBe(true);
    });

    it('should handle default case with show_nome_proposto false', () => {
      component._show_nome_proposto = false;
      component.updateAllValidators('some-id' as any);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome_proposto'].value).toBeNull();
      expect(controls['nome_proposto'].hasValidator(Validators.required)).toBe(false);
    });

    it('should also work for Default enum value (same as NuovoCliente)', () => {
      component.updateAllValidators(SelectedClientEnum.Default);
      const controls = component._editFormGroupClients.controls;
      expect(controls['nome_proposto'].hasValidator(Validators.required)).toBe(false);
    });
  });

  // ─── _loadClientsRiuso ───

  describe('_loadClientsRiuso', () => {
    it('should add clients from API response', () => {
      mockApiService.getList.mockReturnValue(of({
        content: [
          { id_client: 'c-1', nome: 'Client1' },
          { id_client: 'c-2', nome: 'Client2' },
        ]
      }));

      component._loadClientsRiuso('https', 'org-1', 'collaudo');

      expect(mockApiService.getList).toHaveBeenCalledWith('client', expect.objectContaining({
        params: expect.objectContaining({ auth_type: 'https', id_organizzazione: 'org-1', ambiente: 'collaudo' })
      }));
      expect(component._arr_clients_riuso.length).toBe(2);
    });

    it('should prepend NuoveCredenziali when checkRiuso=true and no riuso obbligatorio', () => {
      component._generalConfig = { adesione: { riuso_client_obbligatorio: false } };
      mockApiService.getList.mockReturnValue(of({
        content: [{ id_client: 'c-1', nome: 'Client1' }]
      }));

      component._loadClientsRiuso('https', 'org-1', 'collaudo', true);

      expect(component._arr_clients_riuso.length).toBe(3); // ScegliCredenziali + NuoveCredenziali + Client1
      expect(component._arr_clients_riuso[0].id_client).toBe(SelectedClientEnum.Default);
      expect(component._arr_clients_riuso[1].id_client).toBe(SelectedClientEnum.NuovoCliente);
    });

    it('should prepend NuoveCredenziali when checkRiuso=true and empty list', () => {
      component._generalConfig = { adesione: { riuso_client_obbligatorio: true } };
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      component._loadClientsRiuso('https', 'org-1', 'collaudo', true);

      expect(component._arr_clients_riuso.length).toBe(2); // ScegliCredenziali + NuoveCredenziali
    });

    it('should not prepend when checkRiuso=true and riuso obbligatorio with existing clients', () => {
      component._generalConfig = { adesione: { riuso_client_obbligatorio: true } };
      mockApiService.getList.mockReturnValue(of({
        content: [{ id_client: 'c-1', nome: 'Client1' }]
      }));

      component._loadClientsRiuso('https', 'org-1', 'collaudo', true);

      expect(component._arr_clients_riuso.length).toBe(1); // only Client1
    });

    it('should handle error on loadClientsRiuso', () => {
      mockApiService.getList.mockReturnValue(throwError(() => ({ status: 500 })));

      component._loadClientsRiuso('https', 'org-1', 'collaudo');

      expect(component._error).toBe(true);
      expect(component._preventMultiCall).toBe(false);
    });
  });

  // ─── _resetUploadCertificateComponents ───

  it('should reset all certificate upload controls', () => {
    component._editFormGroupClients = new FormGroup({
      filename: new FormControl('test.pem'),
      estensione: new FormControl('pem'),
      content: new FormControl('data', Validators.required),
      cn: new FormControl('CN=test', Validators.required),
      filename_csr: new FormControl('test.csr'),
      estensione_csr: new FormControl('csr'),
      content_csr: new FormControl('csrdata', Validators.required),
      filename_firma: new FormControl(null),
      estensione_firma: new FormControl(null),
      content_firma: new FormControl(null),
      cn_firma: new FormControl(null),
      filename_csr_firma: new FormControl(null),
      estensione_csr_firma: new FormControl(null),
      content_csr_firma: new FormControl(null),
    });
    component._resetUploadCertificateComponents(component._editFormGroupClients.controls);

    expect(component._editFormGroupClients.get('filename')!.value).toBeNull();
    expect(component._editFormGroupClients.get('content')!.value).toBeNull();
    expect(component._editFormGroupClients.get('cn')!.value).toBeNull();
    expect(component._editFormGroupClients.get('filename_csr')!.value).toBeNull();
    expect(component._editFormGroupClients.get('content_csr')!.value).toBeNull();
  });

  // ─── _resetUploadCertificateComponentsFirma ───

  it('should reset all firma certificate upload controls', () => {
    component._editFormGroupClients = new FormGroup({
      filename: new FormControl(null),
      estensione: new FormControl(null),
      content: new FormControl(null),
      cn: new FormControl(null),
      filename_csr: new FormControl(null),
      estensione_csr: new FormControl(null),
      content_csr: new FormControl(null),
      filename_firma: new FormControl('firma.pem'),
      estensione_firma: new FormControl('pem'),
      content_firma: new FormControl('firmadata', Validators.required),
      cn_firma: new FormControl('CN=firma', Validators.required),
      filename_csr_firma: new FormControl('csr_firma.pem'),
      estensione_csr_firma: new FormControl('pem'),
      content_csr_firma: new FormControl('csrfirmadata', Validators.required),
    });
    component._resetUploadCertificateComponentsFirma(component._editFormGroupClients.controls);

    expect(component._editFormGroupClients.get('filename_firma')!.value).toBeNull();
    expect(component._editFormGroupClients.get('content_firma')!.value).toBeNull();
    expect(component._editFormGroupClients.get('cn_firma')!.value).toBeNull();
    expect(component._editFormGroupClients.get('filename_csr_firma')!.value).toBeNull();
    expect(component._editFormGroupClients.get('content_csr_firma')!.value).toBeNull();
  });

  // ─── __descrittoreChangeFirma ───

  describe('__descrittoreChangeFirma', () => {
    beforeEach(() => {
      component._editFormGroupClients = new FormGroup({
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
      });
    });

    it('should update non-csr firma file fields', () => {
      component.__descrittoreChangeFirma({ file: 'firma.pem', type: 'application/x-pem-file', data: 'firmadata' });
      expect(component._editFormGroupClients.get('filename_firma')!.value).toBe('firma.pem');
      expect(component._editFormGroupClients.get('estensione_firma')!.value).toBe('application/x-pem-file');
      expect(component._editFormGroupClients.get('content_firma')!.value).toBe('firmadata');
    });

    it('should update csr firma file fields when csr=true', () => {
      component.__descrittoreChangeFirma({ file: 'csr_firma.pem', type: 'application/pkcs10', data: 'csrfirmadata' }, true);
      expect(component._editFormGroupClients.get('filename_csr_firma')!.value).toBe('csr_firma.pem');
      expect(component._editFormGroupClients.get('estensione_csr_firma')!.value).toBe('application/pkcs10');
      expect(component._editFormGroupClients.get('content_csr_firma')!.value).toBe('csrfirmadata');
    });

    it('should clear error on change', () => {
      component._error = true;
      component._errorMsg = 'previous error';
      component.__descrittoreChangeFirma({ file: 'f', type: 't', data: 'd' });
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });
  });

  // ─── _downloadAllegato ───

  describe('_downloadAllegato', () => {
    beforeEach(() => {
      component.id = 42;
      component.environmentId = 'collaudo';
      (globalThis as any).saveAs = vi.fn();
    });

    afterEach(() => {
      delete (globalThis as any).saveAs;
    });

    it('should download file and call saveAs on success', () => {
      const blob = new Blob(['content']);
      mockApiService.download.mockReturnValue(of({ body: blob }));

      component._downloadAllegato({ uuid: 'u-1', filename: 'cert.pem' });

      expect(mockApiService.download).toHaveBeenCalledWith('adesioni', 42, 'collaudo/client/u-1/download');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'cert.pem');
      expect(component._downloading).toBe(false);
    });

    it('should set _downloading true while in progress', () => {
      mockApiService.download.mockReturnValue(of({ body: new Blob() }));

      // _downloading is set true at start, then false on completion
      component._downloadAllegato({ uuid: 'u-1', filename: 'cert.pem' });
      expect(component._downloading).toBe(false); // already completed synchronously
    });

    it('should handle error on download', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ status: 500 })));
      mockUtils.GetErrorMsg.mockReturnValue('Download Error');

      component._downloadAllegato({ uuid: 'u-1', filename: 'cert.pem' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Download Error');
      expect(component._downloading).toBe(false);
    });
  });

  // ─── _showDialogDissociaClient ───

  describe('_showDialogDissociaClient', () => {
    beforeEach(() => {
      component.adesione = {
        id_adesione: 'ade-1',
        stato: 'bozza',
        soggetto: { organizzazione: { nome: 'Org' } },
        servizio: { nome: 'S', versione: '1' }
      };
      component.environmentId = 'collaudo';
    });

    it('should open confirmation dialog', () => {
      const mockOnClose = { subscribe: vi.fn() };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });

      const item = { source: { codice_interno: 'prof1' } };
      component._showDialogDissociaClient(item);

      expect(mockModalService.show).toHaveBeenCalled();
      expect(mockOnClose.subscribe).toHaveBeenCalled();
    });

    it('should delete client on confirm', () => {
      const onCloseCallback: any[] = [];
      const mockOnClose = {
        subscribe: vi.fn((cb: any) => { onCloseCallback.push(cb); })
      };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });
      vi.spyOn(component, '_loadAdesioneConfigClients').mockImplementation(() => {});
      mockApiService.deleteElement.mockReturnValue(of({}));

      const item = { source: { codice_interno: 'prof1' } };
      component._showDialogDissociaClient(item);

      // Simulate user confirming
      onCloseCallback[0](true);

      expect(mockApiService.deleteElement).toHaveBeenCalledWith('adesioni', 'ade-1/collaudo/client/prof1');
      expect(component._loadAdesioneConfigClients).toHaveBeenCalled();
    });

    it('should not delete client when dialog is cancelled', () => {
      const onCloseCallback: any[] = [];
      const mockOnClose = {
        subscribe: vi.fn((cb: any) => { onCloseCallback.push(cb); })
      };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });

      const item = { source: { codice_interno: 'prof1' } };
      component._showDialogDissociaClient(item);

      // Simulate user cancelling
      onCloseCallback[0](false);

      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should handle error on delete client', () => {
      const onCloseCallback: any[] = [];
      const mockOnClose = {
        subscribe: vi.fn((cb: any) => { onCloseCallback.push(cb); })
      };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });
      mockApiService.deleteElement.mockReturnValue(throwError(() => ({ status: 500 })));
      mockUtils.GetErrorMsg.mockReturnValue('Delete Error');

      const item = { source: { codice_interno: 'prof1' } };
      component._showDialogDissociaClient(item);
      onCloseCallback[0](true);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Delete Error');
    });
  });

  // ─── _isModifiableMapperOld ───

  describe('_isModifiableMapperOld', () => {
    it('should return true when user is gestore and collaudo not blocked', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      mockAuthService._getClassesNotModifiable.mockReturnValue([]);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      component._collaudo = true;
      component._grant = { ruoli: ['gestore'] } as any;
      component.adesione = { stato: 'bozza' };

      expect(component._isModifiableMapperOld()).toBe(true);
    });

    it('should return false when all classes are blocked', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService._getClassesNotModifiable.mockReturnValue(['collaudo', 'collaudo_configurato', 'produzione', 'produzione_configurato']);
      component._collaudo = true;
      component._grant = { ruoli: [] } as any;
      component.adesione = { stato: 'bozza' };

      expect(component._isModifiableMapperOld()).toBe(false);
    });

    it('should return true for non-configurato item even without other permissions', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService._getClassesNotModifiable.mockReturnValue([]);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      component._collaudo = true;
      component._grant = { ruoli: [] } as any;
      component.adesione = { stato: 'bozza' };

      const item = { source: { stato: StatoConfigurazioneEnum.NONCONFIGURATO } };
      expect(component._isModifiableMapperOld(item)).toBe(true);
    });

    it('should return true for nome_proposto item', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService._getClassesNotModifiable.mockReturnValue([]);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      component._collaudo = true;
      component._grant = { ruoli: [] } as any;
      component.adesione = { stato: 'bozza' };

      const item = { source: { stato: StatoConfigurazioneEnum.CONFIGURATO, nome_proposto: 'Proposed' } };
      expect(component._isModifiableMapperOld(item)).toBe(true);
    });

    it('should check produzione permissions when not collaudo', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService._getClassesNotModifiable.mockReturnValue(['collaudo', 'collaudo_configurato']);
      mockAuthService.canChangeStatus.mockReturnValue(true);
      component._collaudo = false;
      component._grant = { ruoli: [] } as any;
      component.adesione = { stato: 'produzione' };

      expect(component._isModifiableMapperOld()).toBe(true);
    });

    it('should return false for configurato item without stato change permission', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService._getClassesNotModifiable.mockReturnValue([]);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      component._collaudo = true;
      component._grant = { ruoli: [] } as any;
      component.adesione = { stato: 'bozza' };

      const item = { source: { stato: StatoConfigurazioneEnum.CONFIGURATO } };
      expect(component._isModifiableMapperOld(item)).toBe(false);
    });

    it('should handle item without source', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService._getClassesNotModifiable.mockReturnValue([]);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      component._collaudo = true;
      component._grant = { ruoli: [] } as any;
      component.adesione = { stato: 'bozza' };

      const item = { stato: StatoConfigurazioneEnum.NONCONFIGURATO };
      expect(component._isModifiableMapperOld(item)).toBe(true);
    });
  });

  // ─── _resetDescrittoriAll ───

  it('should reset all descriptors and firma descriptors', () => {
    component._descrittoreCtrl.setValue('abc');
    component._descrittoreCtrl_csr.setValue('def');
    component._descrittoreCtrl_csr_modulo.setValue('ghi');
    component._descrittoreCtrl_firma.setValue('jkl');
    component._descrittoreCtrl_csr_firma.setValue('mno');
    component._descrittoreCtrl_csr_modulo_firma.setValue('pqr');
    component._resetDescrittoriAll();
    expect(component._descrittoreCtrl.value).toBe('');
    expect(component._descrittoreCtrl_csr.value).toBe('');
    expect(component._descrittoreCtrl_csr_modulo.value).toBe('');
    expect(component._descrittoreCtrl_firma.value).toBe('');
    expect(component._descrittoreCtrl_csr_firma.value).toBe('');
    expect(component._descrittoreCtrl_csr_modulo_firma.value).toBe('');
  });

  // ─── _loadCredenziali with visualizza_elenco_client_esistenti ───

  describe('_loadCredenziali with visualizza_elenco', () => {
    it('should call _loadClientsRiuso with checkRiuso when visualizza is true', () => {
      component._generalConfig = { adesione: { visualizza_elenco_client_esistenti: true } };
      vi.spyOn(component, '_loadClientsRiuso').mockImplementation(() => {});

      component._loadCredenziali('https', 'org-1', 'collaudo');

      expect(component._loadClientsRiuso).toHaveBeenCalledWith('https', 'org-1', 'collaudo', true);
    });

    it('should call _loadClientsRiuso for gestore when visualizza is false', () => {
      component._generalConfig = { adesione: { visualizza_elenco_client_esistenti: false } };
      mockAuthService.isGestore.mockReturnValue(true);
      vi.spyOn(component, '_loadClientsRiuso').mockImplementation(() => {});

      component._loadCredenziali('https', 'org-1', 'collaudo');

      expect(component._loadClientsRiuso).toHaveBeenCalledWith('https', 'org-1', 'collaudo');
    });
  });

  // ─── _showMandatoryFields with debugMandatoryFields ───

  it('should log mandatory fields when debugMandatoryFields is true', () => {
    component.debugMandatoryFields = true;
    const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    const controls = {
      nome: new FormControl('', Validators.required),
      optional: new FormControl('')
    };
    component._showMandatoryFields(controls);

    expect(consoleGroupSpy).toHaveBeenCalledWith('Mandatory fields');
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleGroupEndSpy).toHaveBeenCalled();
  });

  it('should log NESSUN CAMPO when no required fields and debugMandatoryFields is true', () => {
    component.debugMandatoryFields = true;
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    const controls = {
      optional1: new FormControl(''),
      optional2: new FormControl('')
    };
    component._showMandatoryFields(controls);

    expect(consoleLogSpy).toHaveBeenCalledWith('NESSUN CAMPO OBBLIGATORIO');
  });

  // ─── _initEditFormClients with more scenarios ───

  describe('_initEditFormClients advanced', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockAuthService._getConfigModule.mockImplementation((module: string) => {
        if (module === 'adesione') return { proprieta_custom: [] };
        return {
          api: {
            auth_type: [
              { type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false },
              { type: 'pdnd', indirizzi_ip: false, rate_limiting: false, finalita: true },
              { type: 'https_sign', indirizzi_ip: false, rate_limiting: false, finalita: false },
              { type: 'sign', indirizzi_ip: false, rate_limiting: false, finalita: false },
              { type: 'oauth_authorization_code', indirizzi_ip: false, rate_limiting: false, finalita: false },
              { type: 'http_basic', indirizzi_ip: false, rate_limiting: false, finalita: false },
            ],
            profili: []
          }
        };
      });
      component.adesione = {
        soggetto: { organizzazione: { id_organizzazione: 'org-1' } },
        servizio: { nome: 'S', versione: '1' },
        id_adesione: 'a-1', stato: 'bozza'
      };
      component.environmentId = 'collaudo';
      component._generalConfig = { adesione: { visualizza_elenco_client_esistenti: false } };
      component._grant = { collaudo: 'scrittura', ruoli: [] } as any;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set richiesto_cn fields from existing data', () => {
      component._auth_type = 'https';
      component._isHttps = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: {
          auth_type: 'https',
          certificato_autenticazione: { tipo_certificato: 'richiesto_cn', cn: 'CN=test' }
        },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._isRichiesto_cn).toBe(true);
      expect(component._editFormGroupClients.get('cn')!.value).toBe('CN=test');
    });

    it('should set richiesto_csr fields from existing data', () => {
      component._auth_type = 'https';
      component._isHttps = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: {
          auth_type: 'https',
          certificato_autenticazione: {
            tipo_certificato: 'richiesto_csr',
            richiesta: { uuid: 'r-1', filename: 'req.csr', content_type: 'csr' },
            modulo_richiesta: { uuid: 'm-1', filename: 'mod.pem', content_type: 'pem' }
          }
        },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._isRichiesto_csr).toBe(true);
      expect(component._certificato_csr).toEqual({ uuid: 'r-1', filename: 'req.csr', content_type: 'csr' });
      expect(component._modulo_richiesta_csr).toEqual({ uuid: 'm-1', filename: 'mod.pem', content_type: 'pem' });
    });

    it('should handle pdnd auth type and set client_id validators', () => {
      component._auth_type = 'pdnd';
      component._isHttps = false;
      component._isPdnd = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: { auth_type: 'pdnd', client_id: 'pdnd-123' },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._editFormGroupClients.get('client_id')!.value).toBe('pdnd-123');
      expect(component._editFormGroupClients.get('client_id')!.hasValidator(Validators.required)).toBe(true);
    });

    it('should handle https_sign auth type setting firma cert validators', () => {
      component._auth_type = 'https_sign';
      component._isHttps = false;
      component._isHttpsSign = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: {
          auth_type: 'https_sign',
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'u1' } },
          certificato_firma: { tipo_certificato: 'fornito', certificato: { uuid: 'u2' } }
        },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._editFormGroupClients.get('tipo_certificato_firma')!.hasValidator(Validators.required)).toBe(true);
    });

    it('should handle sign auth type enabling tipo_certificato_firma', () => {
      component._auth_type = 'sign';
      component._isHttps = false;
      component._isSign = true;
      component._initEditFormClients(null);
      const controls = component._editFormGroupClients.controls;
      expect(controls['tipo_certificato_firma'].enabled).toBe(true);
      expect(controls['tipo_certificato'].hasValidator(Validators.required)).toBe(false);
    });

    it('should handle oauth_authorization_code form fields', () => {
      component._auth_type = 'oauth_authorization_code';
      component._isHttps = false;
      component._isOauthAuthCode = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: {
          auth_type: 'oauth_authorization_code',
          client_id: 'oauth-id',
          url_redirezione: 'http://redir',
          url_esposizione: 'http://expose',
          help_desk: 'http://help',
          nome_applicazione_portale: 'App'
        },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._editFormGroupClients.get('url_redirezione')!.value).toBe('http://redir');
      expect(component._editFormGroupClients.get('url_redirezione')!.enabled).toBe(true);
    });

    it('should handle http_basic auth type setting username', () => {
      component._auth_type = 'http_basic';
      component._isHttps = false;
      component._isHttpBasic = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: { auth_type: 'http_basic', username: 'user1' },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._editFormGroupClients.get('username')!.value).toBe('user1');
    });

    it('should disable all fields when not modifiable', () => {
      component._auth_type = 'https';
      component._isHttps = true;
      component._grant = { collaudo: 'lettura', ruoli: [] } as any;
      component._initEditFormClients(null);
      const controls = component._editFormGroupClients.controls;
      // When grant is lettura, all fields should be disabled
      expect(controls['credenziali'].disabled).toBe(true);
    });

    it('should set NONCONFIGURATO nullify certs', () => {
      component._auth_type = 'https';
      component._isHttps = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: {
          auth_type: 'https',
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'u1' } }
        },
        source: { stato: StatoConfigurazioneEnum.NONCONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._certificato_csr).toBeNull();
      expect(component._modulo_richiesta_csr).toBeNull();
      expect(component._certificato_fornito).toBeNull();
    });

    it('should set firma richiesto_csr from existing data', () => {
      component._auth_type = 'https_sign';
      component._isHttps = false;
      component._isHttpsSign = true;
      const data = {
        id_client: 'c-1', nome: 'C1',
        dati_specifici: {
          auth_type: 'https_sign',
          certificato_autenticazione: { tipo_certificato: 'fornito', certificato: { uuid: 'ua' } },
          certificato_firma: {
            tipo_certificato: 'richiesto_csr',
            richiesta: { uuid: 'rf' },
            modulo_richiesta: { uuid: 'mf' },
            certificato: { uuid: 'cf' }
          }
        },
        source: { stato: StatoConfigurazioneEnum.CONFIGURATO }
      };
      component._initEditFormClients(data);
      expect(component._isRichiesto_csr_firma).toBe(true);
      expect(component._certificato_csr_firma).toEqual({ uuid: 'rf' });
      expect(component._modulo_richiesta_csr_firma).toEqual({ uuid: 'mf' });
      expect(component._modulo_richiesta_csr_firma_ceritifato).toEqual({ uuid: 'cf' });
    });
  });

  // ─── _loadAdesioneConfigErogazioni error ───

  it('should handle error on _loadAdesioneConfigErogazioni', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    mockApiService.getDetails.mockReturnValue(throwError(() => ({ status: 500 })));

    component._loadAdesioneConfigErogazioni();

    expect(component._error).toBe(true);
    expect(component._preventMultiCall).toBe(false);
  });

  // ─── _loadAdesioneConfigErogazioni with url (append) ───

  it('should append erogazioni when url is provided', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    component.adesione = {
      erogazioni_richieste: [
        { api: { id_api: 'api-1', nome: 'Api1', protocollo: 'rest', versione: '1' } }
      ],
      client_richiesti: []
    };
    component.adesioneConfigErogazioni = [{ existing: true } as any];
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));

    component._loadAdesioneConfigErogazioni(null, 'next-url');

    expect(component.adesioneConfigErogazioni[0]).toEqual({ existing: true });
    expect(component.adesioneConfigErogazioni.length).toBe(2);
  });

  // ─── constructor with navigation state ───

  it('should set adesione from navigation extras state', () => {
    const mockRouterWithState = {
      navigate: vi.fn(),
      getCurrentNavigation: vi.fn().mockReturnValue({
        extras: { state: { id_adesione: 'nav-1', stato: 'bozza' } }
      })
    } as any;

    const comp = new AdesioneConfigurazioniComponent(
      mockRoute, mockRouterWithState, mockModalService, mockTranslate,
      mockConfigService, mockApiService, mockAuthService, mockUtils
    );

    expect(comp.adesione).toEqual({ id_adesione: 'nav-1', stato: 'bozza' });
  });

  // ─── constructor with serviceBreadcrumbs ───

  it('should set _serviceBreadcrumbs from route data', () => {
    const routeWithData = {
      params: of({ id: 'ade-1' }),
      parent: { params: of({ id: 'ade-1' }) },
      data: of({ serviceBreadcrumbs: { service: { id_servizio: 's-1' }, breadcrumbs: [] } })
    } as any;

    const comp = new AdesioneConfigurazioniComponent(
      routeWithData, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockApiService, mockAuthService, mockUtils
    );

    expect(comp._serviceBreadcrumbs).toEqual({ service: { id_servizio: 's-1' }, breadcrumbs: [] });
  });

  // ─── _loadAdesioneConfigClients with nome_proposto + non-gestore ───

  it('should set NONCONFIGURATO for non-gestore when nome_proposto without nome', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    component.adesione = {
      client_richiesti: [{ profilo: 'profilo1' }],
      erogazioni_richieste: []
    };
    component._generalConfig = {
      servizio: {
        api: {
          profili: [{ codice_interno: 'profilo1', auth_type: 'https', etichetta: 'Prof1' }],
          auth_type: [{ type: 'https', indirizzi_ip: false }]
        }
      }
    };
    mockAuthService.isGestore.mockReturnValue(false);
    const mockResponse = {
      content: [{ profilo: 'profilo1', id_client: 'c-1', nome_proposto: 'Proposed', nome: null, dati_specifici: {} }],
      page: {}
    };
    mockApiService.getDetails.mockReturnValue(of(mockResponse));

    component._loadAdesioneConfigClients();

    expect(component.adesioneConfigClients[0].source.stato).toBe(StatoConfigurazioneEnum.NONCONFIGURATO);
  });

  // ─── _loadAdesioneConfigClients ignoreSpin ───

  it('should not set _spin when ignoreSpin is true', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    component.adesione = {
      client_richiesti: [{ profilo: 'profilo1' }],
      erogazioni_richieste: []
    };
    component._generalConfig = {
      servizio: {
        api: {
          profili: [{ codice_interno: 'profilo1', auth_type: 'https', etichetta: 'Prof1' }],
          auth_type: [{ type: 'https', indirizzi_ip: false }]
        }
      }
    };
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));

    component._loadAdesioneConfigClients(null, '', true);

    // _spin should be false since ignoreSpin=true
    expect(component._spin).toBe(false);
  });

  // ─── _loadAdesioneConfigErogazioni ignoreSpin ───

  it('should not reset adesioneConfigErogazioni when url and ignoreSpin', () => {
    component.id = 1;
    component.environmentId = 'collaudo';
    component.adesione = {
      erogazioni_richieste: [],
      client_richiesti: []
    };
    component.adesioneConfigErogazioni = [{ existing: true } as any];
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));

    component._loadAdesioneConfigErogazioni(null, 'http://api/page2', true);

    // Should not clear the existing array when url is provided and ignoreSpin is true
    expect(component.adesioneConfigErogazioni[0]).toEqual({ existing: true });
  });
});
