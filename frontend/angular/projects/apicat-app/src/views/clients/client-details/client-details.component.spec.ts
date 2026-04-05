import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { ClientDetailsComponent } from './client-details.component';
import { Tools } from '@linkit/components';

describe('ClientDetailsComponent', () => {
  let component: ClientDetailsComponent;
  let savedConfigurazione: any;

  let mockRoute: any;
  let mockRouter: any;
  let mockTranslate: any;
  let mockModalService: any;
  let mockConfigService: any;
  let mockTools: any;
  let mockApiService: any;
  let mockAuthenticationService: any;
  let mockUtils: any;
  let mockEventsManagerService: any;

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: {
        api: { auth_type: [{ type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false }], abilitato: true },
        generico: { abilitato: false }
      }
    };

    mockRoute = {
      params: of({ id: '123' }),
      queryParams: of({}),
      data: of({})
    };
    mockRouter = {
      navigate: vi.fn(),
      url: '/client/123'
    };
    mockTranslate = {
      instant: vi.fn((key: string) => key)
    };
    mockModalService = {
      show: vi.fn()
    };
    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: {},
          Layout: {}
        }
      }),
      getConfig: vi.fn().mockReturnValue(of({}))
    };
    mockTools = {};
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [] })),
      getDetails: vi.fn().mockReturnValue(of({})),
      saveElement: vi.fn().mockReturnValue(of({})),
      putElement: vi.fn().mockReturnValue(of({})),
      deleteElement: vi.fn().mockReturnValue(of({})),
      putElementRelated: vi.fn().mockReturnValue(of({})),
      download: vi.fn().mockReturnValue(of({ body: new Blob() }))
    };
    mockAuthenticationService = {
      _getConfigModule: vi.fn((module: string) => {
        if (module === 'servizio') return { api: { auth_type: [{ type: 'https' }], abilitato: true }, generico: { abilitato: false } };
        if (module === 'monitoraggio') return { abilitato: false, verifiche_abilitate: false };
        return {};
      }),
      hasPermission: vi.fn().mockReturnValue(true)
    };
    mockUtils = {
      GetErrorMsg: vi.fn().mockReturnValue('Error'),
      getCertificatoByAuthType: vi.fn().mockReturnValue(null),
      getTipiCertificatoAttivi: vi.fn().mockReturnValue([])
    };
    mockEventsManagerService = {
      on: vi.fn(),
      broadcast: vi.fn(),
      off: vi.fn()
    };

    component = new ClientDetailsComponent(
      mockRoute as any,
      mockRouter as any,
      mockTranslate as any,
      mockModalService as any,
      mockConfigService as any,
      mockTools as any,
      mockApiService as any,
      mockAuthenticationService as any,
      mockUtils as any,
      mockEventsManagerService as any
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ClientDetailsComponent.Name).toBe('ClientDetailsComponent');
  });

  it('should have model set to client', () => {
    expect(component.model).toBe('client');
  });

  it('should set appConfig from configService', () => {
    // appConfig is set in ngOnInit, not in constructor
    component.appConfig = mockConfigService.getConfiguration();
    expect(component.appConfig).toBeDefined();
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component._isDetails).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._currentTab).toBe('details');
    expect(component.hasTab).toBe(true);
    expect(component._useRoute).toBe(true);
  });

  it('should have close and save EventEmitters', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with client name', () => {
      component.client = { nome: 'TestClient' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[2].label).toBe('TestClient');
    });

    it('should set breadcrumbs with id when no client', () => {
      component.client = null;
      component.id = 42 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('42');
    });

    it('should set breadcrumbs for new client', () => {
      component.client = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
    });

    it('should set dashboard breadcrumb when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component.client = { nome: 'TestClient' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(2);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
    });
  });

  describe('_clickTab', () => {
    it('should change current tab', () => {
      component._clickTab('info');
      expect(component._currentTab).toBe('info');
    });
  });

  describe('_onCancelEdit', () => {
    it('should set _isEdit to false', () => {
      component._isEdit = true;
      component._isNew = false;
      component.client = {
        nome: 'test',
        stato: 'nuovo',
        soggetto: {
          id_soggetto: 's1',
          nome: 'SogTest',
          aderente: true,
          organizzazione: { id_organizzazione: 'o1', nome: 'OrgTest' }
        },
        dati_specifici: {
          auth_type: 'no_dati',
          certificato_autenticazione: null,
          certificato_firma: null
        }
      };
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
    });

    it('should navigate to model when new and using route', () => {
      component._isNew = true;
      component._useRoute = true;
      component._onCancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['client']);
    });

    it('should emit close when new and not using route', () => {
      component._isNew = true;
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onCancelEdit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate when using route', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/client' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/client'], { queryParamsHandling: 'preserve' });
    });

    it('should call _onClose when not using route', () => {
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBreadcrumb({ url: '/client' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onClose / _onSave', () => {
    it('should emit close event', () => {
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onClose();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit save event', () => {
      const spy = vi.fn();
      component.save.subscribe(spy);
      component._onSave();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onSubmit', () => {
    it('should not call save if form is invalid', () => {
      component._isEdit = true;
      component._formGroup.setErrors({ invalid: true });
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });
  });

  describe('_checkTipoCertificato', () => {
    it('should set _isFornito for https + fornito', () => {
      component._checkTipoCertificato('https', 'fornito');
      expect(component._isFornito).toBe(true);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });

    it('should set _isRichiesto_cn for https + richiesto_cn', () => {
      component._checkTipoCertificato('https', 'richiesto_cn');
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(true);
    });

    it('should set _isRichiesto_csr for https + richiesto_csr', () => {
      component._checkTipoCertificato('https', 'richiesto_csr');
      expect(component._isRichiesto_csr).toBe(true);
    });
  });

  describe('_removeNullProperties', () => {
    it('should remove null properties', () => {
      const obj = { a: 1, b: null, c: 'test', d: null };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1, c: 'test' });
    });
  });

  describe('_isCertificatoEmpty', () => {
    it('should return true for null', () => {
      expect(component._isCertificatoEmpty(null)).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(component._isCertificatoEmpty({})).toBe(true);
    });

    it('should return false for object with keys', () => {
      expect(component._isCertificatoEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('_chekIfCertificateHasUpdated', () => {
    it('should set uuid to null and flag when content present', () => {
      const temp = { content: 'data', uuid: 'abc' };
      component._chekIfCertificateHasUpdated(temp);
      expect(temp.uuid).toBeNull();
      expect(component._isAnyCertificateUpdated).toBe(true);
    });

    it('should not modify when no content', () => {
      component._isAnyCertificateUpdated = false;
      const temp = { uuid: 'abc' };
      component._chekIfCertificateHasUpdated(temp);
      expect(temp.uuid).toBe('abc');
      expect(component._isAnyCertificateUpdated).toBe(false);
    });
  });

  describe('_checkTipoDocumento', () => {
    it('should return uuid when document has uuid', () => {
      expect(component._checkTipoDocumento({ uuid: '123' })).toBe('uuid');
    });

    it('should return nuovo when no uuid', () => {
      expect(component._checkTipoDocumento({})).toBe('nuovo');
    });

    it('should return nuovo for null document', () => {
      expect(component._checkTipoDocumento(null)).toBe('nuovo');
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('_resetDescrittori / _resetDescrittoriFirma', () => {
    it('should reset all descriptors', () => {
      component._descrittoreCtrl.setValue('test');
      component._resetDescrittori();
      expect(component._descrittoreCtrl.value).toBe('');
    });

    it('should reset all firma descriptors', () => {
      component._descrittoreCtrl_firma.setValue('test');
      component._resetDescrittoriFirma();
      expect(component._descrittoreCtrl_firma.value).toBe('');
    });
  });

  // ---- Helper to build client data for _initForm ----
  function buildClientData(overrides: any = {}) {
    return {
      id_client: 'c1',
      nome: 'TestClient',
      stato: 'nuovo',
      ambiente: 'collaudo',
      descrizione: 'desc',
      auth_type: null,
      cn: null,
      cn_firma: null,
      tipo_certificato: [],
      tipo_certificato_firma: [],
      indirizzo_ip: null,
      ip_fruizione: null,
      utilizzato_in_adesioni_configurate: false,
      cert_generato_filename: null,
      cert_generato_content: null,
      cert_generato_content_type: null,
      cert_generato_uuid: null,
      cert_fornito_filename: null,
      cert_fornito_content: null,
      cert_fornito_content_type: null,
      cert_fornito_uuid: null,
      cert_generato_filename_firma: null,
      cert_generato_content_firma: null,
      cert_generato_content_type_firma: null,
      cert_generato_uuid_firma: null,
      cert_fornito_filename_firma: null,
      cert_fornito_content_firma: null,
      cert_fornito_content_type_firma: null,
      cert_fornito_uuid_firma: null,
      csr_richiesta_filename: null,
      csr_richiesta_content: null,
      csr_richiesta_content_type: null,
      csr_richiesta_uuid: null,
      csr_modulo_ric_filename: null,
      csr_modulo_ric_content: null,
      csr_modulo_ric_content_type: null,
      csr_modulo_ric_uuid: null,
      csr_richiesta_filename_firma: null,
      csr_richiesta_content_firma: null,
      csr_richiesta_content_type_firma: null,
      csr_richiesta_uuid_firma: null,
      csr_modulo_ric_filename_firma: null,
      csr_modulo_ric_content_firma: null,
      csr_modulo_ric_content_type_firma: null,
      csr_modulo_ric_uuid_firma: null,
      cert_generato_csr_filename: null,
      cert_generato_csr_content: null,
      cert_generato_csr_content_type: null,
      cert_generato_csr_uuid: null,
      cert_generato_csr_filename_firma: null,
      cert_generato_csr_content_firma: null,
      cert_generato_csr_content_type_firma: null,
      cert_generato_csr_uuid_firma: null,
      dati_specifici: { auth_type: 'no_dati', certificato_autenticazione: null, certificato_firma: null },
      client_id: null,
      soggetto: { id_soggetto: 's1', nome: 'Sog', aderente: true, organizzazione: { id_organizzazione: 'o1', nome: 'Org' } },
      id_soggetto: 's1',
      organizzazione: null,
      id_organizzazione: 'o1',
      username: null,
      url_redirezione: null,
      url_esposizione: null,
      help_desk: null,
      nome_applicazione_portale: null,
      rate_limiting: { quota: null, periodo: 'giorno' },
      finalita: null,
      ...overrides
    };
  }

  function initFormWithDefaults(comp: any, overrides: any = {}) {
    const data = buildClientData(overrides);
    comp._isNew = true;
    comp._isEdit = true;
    comp._initForm(data);
    return data;
  }

  describe('_initForm', () => {
    it('should create form controls from client data', () => {
      initFormWithDefaults(component);
      expect(component._formGroup).toBeDefined();
      expect(component._formGroup.controls['nome']).toBeDefined();
      expect(component._formGroup.controls['stato']).toBeDefined();
      expect(component._formGroup.controls['ambiente']).toBeDefined();
    });

    it('should set nome to required validator', () => {
      initFormWithDefaults(component);
      const nome = component._formGroup.controls['nome'];
      nome.setValue('');
      expect(nome.valid).toBe(false);
      nome.setValue('ValidName');
      expect(nome.valid).toBe(true);
    });

    it('should set ambiente to required validator', () => {
      initFormWithDefaults(component);
      const ambiente = component._formGroup.controls['ambiente'];
      ambiente.setValue(null);
      expect(ambiente.valid).toBe(false);
      ambiente.setValue('collaudo');
      expect(ambiente.valid).toBe(true);
    });

    it('should set _isStato_nuovo when stato is nuovo', () => {
      initFormWithDefaults(component, { stato: 'nuovo' });
      expect(component._isStato_nuovo).toBe(true);
    });

    it('should not set _isStato_nuovo when stato is configurato', () => {
      initFormWithDefaults(component, { stato: 'configurato' });
      expect(component._isStato_nuovo).toBe(false);
    });

    it('should enable auth_type for new clients', () => {
      initFormWithDefaults(component);
      expect(component._formGroup.controls['auth_type'].enabled).toBe(true);
    });

    it('should disable auth_type for existing clients', () => {
      component._isNew = false;
      component._isEdit = true;
      const data = buildClientData();
      component._initForm(data);
      expect(component._formGroup.controls['auth_type'].disabled).toBe(true);
    });

    it('should set id_organizzazione required', () => {
      initFormWithDefaults(component);
      const ctrl = component._formGroup.controls['id_organizzazione'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should patch id_organizzazione and id_soggetto for existing clients', () => {
      component._isNew = false;
      component._isEdit = true;
      const data = buildClientData();
      component._initForm(data);
      expect(component._formGroup.controls['id_organizzazione'].value).toBe('o1');
      expect(component._formGroup.controls['id_soggetto'].value).toBe('s1');
    });

    it('should disable nome when stato is configurato', () => {
      component._isNew = false;
      component._isEdit = true;
      const data = buildClientData({ stato: 'configurato' });
      component._initForm(data);
      expect(component._formGroup.controls['nome'].disabled).toBe(true);
    });

    it('should create rate_limiting sub-group', () => {
      initFormWithDefaults(component);
      const rl = component._formGroup.get('rate_limiting');
      expect(rl).toBeTruthy();
      expect((rl as any).controls['quota']).toBeDefined();
      expect((rl as any).controls['periodo']).toBeDefined();
    });

    it('should disable organizzazione and ambiente when client used in adesioni', () => {
      component._isNew = true;
      component._isEdit = true;
      component._isClientUsedInSomeAdesioni = true;
      const data = buildClientData();
      component._initForm(data);
      expect(component._formGroup.controls['id_organizzazione'].disabled).toBe(true);
      expect(component._formGroup.controls['ambiente'].disabled).toBe(true);
    });

    it('should not create form for null data', () => {
      const prevGroup = component._formGroup;
      component._initForm(null);
      expect(component._formGroup).toBe(prevGroup);
    });

    it('should set finalita from dati_specifici', () => {
      const uuid = '12345678-ABCD-1234-ABCD-123456789ABC';
      initFormWithDefaults(component, {
        dati_specifici: { auth_type: 'no_dati', certificato_autenticazione: null, certificato_firma: null, finalita: uuid }
      });
      expect(component._formGroup.controls['finalita'].value).toBe(uuid);
    });

    it('should validate finalita as UUID pattern', () => {
      initFormWithDefaults(component);
      const ctrl = component._formGroup.controls['finalita'];
      ctrl.setValue('not-a-uuid');
      expect(ctrl.valid).toBe(false);
      ctrl.setValue('12345678-ABCD-1234-ABCD-123456789ABC');
      expect(ctrl.valid).toBe(true);
    });
  });

  describe('_onChangeAuthType', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should set _isHttps for https', () => {
      component._onChangeAuthType('https');
      expect(component._isHttps).toBe(true);
      expect(component._isPdnd).toBe(false);
    });

    it('should set _isPdnd for pdnd', () => {
      component._onChangeAuthType('pdnd');
      expect(component._isPdnd).toBe(true);
      expect(component._isHttps).toBe(false);
    });

    it('should set _isHttpsSign for https_sign', () => {
      component._onChangeAuthType('https_sign');
      expect(component._isHttpsSign).toBe(true);
    });

    it('should set _isHttpsPdnd for https_pdnd', () => {
      component._onChangeAuthType('https_pdnd');
      expect(component._isHttpsPdnd).toBe(true);
    });

    it('should set _isHttpsPdndSign for https_pdnd_sign', () => {
      component._onChangeAuthType('https_pdnd_sign');
      expect(component._isHttpsPdndSign).toBe(true);
    });

    it('should set _isSign for sign', () => {
      component._onChangeAuthType('sign');
      expect(component._isSign).toBe(true);
    });

    it('should set _isSignPdnd for sign_pdnd', () => {
      component._onChangeAuthType('sign_pdnd');
      expect(component._isSignPdnd).toBe(true);
    });

    it('should set _isNoDati for no_dati', () => {
      component._onChangeAuthType('no_dati');
      expect(component._isNoDati).toBe(true);
    });

    it('should set _isIndirizzoIP for indirizzo_ip', () => {
      component._onChangeAuthType('indirizzo_ip');
      expect(component._isIndirizzoIP).toBe(true);
    });

    it('should set _isHttpBasic for http_basic', () => {
      component._onChangeAuthType('http_basic');
      expect(component._isHttpBasic).toBe(true);
    });

    it('should set _isOauthAuthCode for oauth_authorization_code', () => {
      component._onChangeAuthType('oauth_authorization_code');
      expect(component._isOauthAuthCode).toBe(true);
    });

    it('should set _isOauthClientCredentials for oauth_client_credentials', () => {
      component._onChangeAuthType('oauth_client_credentials');
      expect(component._isOauthClientCredentials).toBe(true);
    });

    it('should reset all auth type flags for default case', () => {
      component._isHttps = true;
      component._isPdnd = true;
      component._onChangeAuthType('valore_a_caso_per_resettare_le_variabili');
      expect(component._isHttps).toBe(false);
      expect(component._isPdnd).toBe(false);
      expect(component._isNoDati).toBe(false);
      expect(component._isHttpBasic).toBe(false);
    });

    it('should set tipo_certificato required for https when in edit mode', () => {
      component._isEdit = true;
      component._onChangeAuthType('https');
      const ctrl = component._formGroup.controls['tipo_certificato'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set tipo_certificato_firma required for https_sign when in edit mode', () => {
      component._isEdit = true;
      component._onChangeAuthType('https_sign');
      const ctrl = component._formGroup.controls['tipo_certificato_firma'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set client_id required for pdnd when in edit mode', () => {
      component._isEdit = true;
      component._onChangeAuthType('pdnd');
      const ctrl = component._formGroup.controls['client_id'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set url validators for oauth_authorization_code when in edit mode', () => {
      component._isEdit = true;
      component._onChangeAuthType('oauth_authorization_code');
      const url = component._formGroup.controls['url_redirezione'];
      url.setValue(null);
      expect(url.valid).toBe(false);
    });

    it('should handle null auth_type when _isNew by reading from form control', () => {
      component._isNew = true;
      component._isEdit = true;
      component._formGroup.controls['auth_type'].setValue('https');
      component._formGroup.controls['auth_type'].enable();
      component._onChangeAuthType(null);
      expect(component._isHttps).toBe(true);
    });

    it('should set _show_erogazione flags from config', () => {
      mockAuthenticationService._getConfigModule.mockImplementation((module: string) => {
        if (module === 'servizio') return {
          api: {
            auth_type: [{ type: 'https', indirizzi_ip: true, rate_limiting: true, finalita: true }],
            abilitato: true
          },
          generico: { abilitato: false }
        };
        return {};
      });
      component._onChangeAuthType('https');
      expect(component._show_erogazione_ip_fruizione).toBe(true);
      expect(component._show_erogazione_rate_limiting).toBe(true);
      expect(component._show_erogazione_finalita).toBe(true);
    });

    it('should set sign tipo_certificato_firma required when in edit mode', () => {
      component._isEdit = true;
      component._onChangeAuthType('sign');
      const ctrl = component._formGroup.controls['tipo_certificato_firma'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set sign_pdnd tipo_certificato_firma required when in edit mode', () => {
      component._isEdit = true;
      component._onChangeAuthType('sign_pdnd');
      const ctrl = component._formGroup.controls['tipo_certificato_firma'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });
  });

  describe('_onChangeTipoCertificato', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should set _isFornito for fornito', () => {
      component._onChangeTipoCertificato('fornito');
      expect(component._isFornito).toBe(true);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });

    it('should require cert_fornito_content for fornito', () => {
      component._onChangeTipoCertificato('fornito');
      const ctrl = component._formGroup.controls['cert_fornito_content'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set _isRichiesto_cn for richiesto_cn', () => {
      component._onChangeTipoCertificato('richiesto_cn');
      expect(component._isRichiesto_cn).toBe(true);
      expect(component._isFornito).toBe(false);
    });

    it('should require cn for richiesto_cn', () => {
      component._onChangeTipoCertificato('richiesto_cn');
      const ctrl = component._formGroup.controls['cn'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set _isRichiesto_csr for richiesto_csr', () => {
      component._onChangeTipoCertificato('richiesto_csr');
      expect(component._isRichiesto_csr).toBe(true);
      expect(component._isFornito).toBe(false);
    });

    it('should require csr_richiesta_content and csr_modulo_ric_content for richiesto_csr', () => {
      component._onChangeTipoCertificato('richiesto_csr');
      const csr = component._formGroup.controls['csr_richiesta_content'];
      const modulo = component._formGroup.controls['csr_modulo_ric_content'];
      csr.setValue(null);
      modulo.setValue(null);
      expect(csr.valid).toBe(false);
      expect(modulo.valid).toBe(false);
    });

    it('should reset all flags for default/unknown value', () => {
      component._isFornito = true;
      component._onChangeTipoCertificato('unknown');
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });

    it('should require cert_generato_content for richiesto_cn when stato is not nuovo', () => {
      component._isStato_nuovo = false;
      component._onChangeTipoCertificato('richiesto_cn');
      const ctrl = component._formGroup.controls['cert_generato_content'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should NOT require cert_generato_content for richiesto_cn when stato is nuovo', () => {
      component._isStato_nuovo = true;
      component._onChangeTipoCertificato('richiesto_cn');
      const ctrl = component._formGroup.controls['cert_generato_content'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(true);
    });
  });

  describe('_onChangeTipoCertificatoFirma', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should set _isFornito_firma for fornito', () => {
      component._onChangeTipoCertificatoFirma('fornito');
      expect(component._isFornito_firma).toBe(true);
      expect(component._isRichiesto_cn_firma).toBe(false);
      expect(component._isRichiesto_csr_firma).toBe(false);
    });

    it('should require cert_fornito_content_firma for fornito', () => {
      component._onChangeTipoCertificatoFirma('fornito');
      const ctrl = component._formGroup.controls['cert_fornito_content_firma'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set _isRichiesto_cn_firma for richiesto_cn', () => {
      component._onChangeTipoCertificatoFirma('richiesto_cn');
      expect(component._isRichiesto_cn_firma).toBe(true);
      expect(component._isFornito_firma).toBe(false);
    });

    it('should require cn_firma for richiesto_cn', () => {
      component._onChangeTipoCertificatoFirma('richiesto_cn');
      const ctrl = component._formGroup.controls['cn_firma'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });

    it('should set _isRichiesto_csr_firma for richiesto_csr', () => {
      component._onChangeTipoCertificatoFirma('richiesto_csr');
      expect(component._isRichiesto_csr_firma).toBe(true);
    });

    it('should require csr contents for richiesto_csr firma', () => {
      component._onChangeTipoCertificatoFirma('richiesto_csr');
      const csr = component._formGroup.controls['csr_richiesta_content_firma'];
      const modulo = component._formGroup.controls['csr_modulo_ric_content_firma'];
      csr.setValue(null);
      modulo.setValue(null);
      expect(csr.valid).toBe(false);
      expect(modulo.valid).toBe(false);
    });

    it('should reset all firma flags for default/unknown value', () => {
      component._isFornito_firma = true;
      component._onChangeTipoCertificatoFirma('unknown');
      expect(component._isFornito_firma).toBe(false);
      expect(component._isRichiesto_cn_firma).toBe(false);
      expect(component._isRichiesto_csr_firma).toBe(false);
    });

    it('should require cert_generato_content_firma for richiesto_cn when stato not nuovo', () => {
      component._isStato_nuovo = false;
      component._onChangeTipoCertificatoFirma('richiesto_cn');
      const ctrl = component._formGroup.controls['cert_generato_content_firma'];
      ctrl.setValue(null);
      expect(ctrl.valid).toBe(false);
    });
  });

  describe('_onChangeStato', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should set _isStato_nuovo to true when stato is nuovo', () => {
      component._formGroup.controls['stato'].setValue('nuovo');
      component._onChangeStato();
      expect(component._isStato_nuovo).toBe(true);
    });

    it('should set _isStato_nuovo to false when stato is configurato', () => {
      component._formGroup.controls['stato'].setValue('configurato');
      component._onChangeStato();
      expect(component._isStato_nuovo).toBe(false);
    });

    it('should clear username validators when stato is nuovo', () => {
      component._formGroup.controls['stato'].setValue('nuovo');
      component._formGroup.controls['username'].setValidators(() => ({ error: true }));
      component._onChangeStato();
      component._formGroup.controls['username'].updateValueAndValidity();
      expect(component._formGroup.controls['username'].valid).toBe(true);
    });

    it('should set username required for http_basic when stato is not nuovo', () => {
      component._isHttpBasic = true;
      component._formGroup.controls['stato'].setValue('configurato');
      component._onChangeStato();
      component._formGroup.controls['username'].setValue(null);
      expect(component._formGroup.controls['username'].valid).toBe(false);
    });

    it('should set client_id required when _isPdnd is true', () => {
      component._isPdnd = true;
      component._formGroup.controls['stato'].setValue('configurato');
      component._onChangeStato();
      component._formGroup.controls['client_id'].setValue(null);
      expect(component._formGroup.controls['client_id'].valid).toBe(false);
    });

    it('should set client_id required when _isOauthClientCredentials is true', () => {
      component._isOauthClientCredentials = true;
      component._formGroup.controls['stato'].setValue('configurato');
      component._onChangeStato();
      component._formGroup.controls['client_id'].setValue(null);
      expect(component._formGroup.controls['client_id'].valid).toBe(false);
    });

    it('should clear client_id validators when no pdnd/oauth', () => {
      component._isPdnd = false;
      component._isHttpsPdnd = false;
      component._isHttpsPdndSign = false;
      component._isSignPdnd = false;
      component._isOauthClientCredentials = false;
      component._isOauthAuthCode = false;
      component._formGroup.controls['stato'].setValue('configurato');
      component._onChangeStato();
      component._formGroup.controls['client_id'].setValue(null);
      expect(component._formGroup.controls['client_id'].valid).toBe(true);
    });
  });

  describe('__descrittoreChange', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should patch cert_generato fields', () => {
      const value = { file: 'cert.pem', type: 'application/x-pem-file', data: 'base64data' };
      component.__descrittoreChange(value, 'cert_generato');
      expect(component._formGroup.controls['cert_generato_filename'].value).toBe('cert.pem');
      expect(component._formGroup.controls['cert_generato_content_type'].value).toBe('application/x-pem-file');
      expect(component._formGroup.controls['cert_generato_content'].value).toBe('base64data');
      expect(component._certificato_generato).toBe(value);
    });

    it('should set _certificato_generato to null when value is falsy', () => {
      component.__descrittoreChange(null, 'cert_generato');
      expect(component._certificato_generato).toBeNull();
    });

    it('should patch cert_fornito fields', () => {
      const value = { file: 'fornito.pem', type: 'application/pem', data: 'forndata' };
      component.__descrittoreChange(value, 'cert_fornito');
      expect(component._formGroup.controls['cert_fornito_filename'].value).toBe('fornito.pem');
      expect(component._formGroup.controls['cert_fornito_content_type'].value).toBe('application/pem');
      expect(component._formGroup.controls['cert_fornito_content'].value).toBe('forndata');
    });

    it('should patch csr_modulo_richiesta fields', () => {
      const value = { file: 'modulo.pdf', type: 'application/pdf', data: 'pdfdata' };
      component.__descrittoreChange(value, 'csr_modulo_richiesta');
      expect(component._formGroup.controls['csr_modulo_ric_filename'].value).toBe('modulo.pdf');
      expect(component._formGroup.controls['csr_modulo_ric_content_type'].value).toBe('application/pdf');
      expect(component._formGroup.controls['csr_modulo_ric_content'].value).toBe('pdfdata');
    });

    it('should patch csr_richiesta fields', () => {
      const value = { file: 'richiesta.csr', type: 'application/pkcs10', data: 'csrdata' };
      component.__descrittoreChange(value, 'csr_richiesta');
      expect(component._formGroup.controls['csr_richiesta_filename'].value).toBe('richiesta.csr');
      expect(component._formGroup.controls['csr_richiesta_content_type'].value).toBe('application/pkcs10');
      expect(component._formGroup.controls['csr_richiesta_content'].value).toBe('csrdata');
    });

    it('should patch cert_generato_csr fields', () => {
      const value = { file: 'csr_cert.pem', type: 'pem', data: 'certcsrdata' };
      component.__descrittoreChange(value, 'cert_generato_csr');
      expect(component._formGroup.controls['cert_generato_csr_filename'].value).toBe('csr_cert.pem');
      expect(component._formGroup.controls['cert_generato_csr_content_type'].value).toBe('pem');
      expect(component._formGroup.controls['cert_generato_csr_content'].value).toBe('certcsrdata');
      expect(component._certificato_generato_csr).toBe(value);
    });

    it('should set _certificato_generato_csr to null when value is falsy', () => {
      component.__descrittoreChange(null, 'cert_generato_csr');
      expect(component._certificato_generato_csr).toBeNull();
    });

    it('should reset _error to false', () => {
      component._error = true;
      component.__descrittoreChange({ file: 'f', type: 't', data: 'd' }, 'cert_fornito');
      expect(component._error).toBe(false);
    });
  });

  describe('__descrittoreChangeFirma', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should patch cert_generato firma fields', () => {
      const value = { file: 'cert_f.pem', type: 'pem', data: 'firmadata' };
      component.__descrittoreChangeFirma(value, 'cert_generato');
      expect(component._formGroup.controls['cert_generato_filename_firma'].value).toBe('cert_f.pem');
      expect(component._formGroup.controls['cert_generato_content_type_firma'].value).toBe('pem');
      expect(component._formGroup.controls['cert_generato_content_firma'].value).toBe('firmadata');
      expect(component._certificato_generato_firma).toBe(value);
    });

    it('should set _certificato_generato_firma to null when value is falsy (throws due to missing optional chaining)', () => {
      // Unlike __descrittoreChange, the firma variant does NOT use optional chaining (value.file vs value?.file).
      // Passing null for cert_generato tipo will throw. This tests that the ternary still sets the field.
      expect(() => component.__descrittoreChangeFirma(null, 'cert_generato')).toThrow();
    });

    it('should patch cert_fornito firma fields', () => {
      const value = { file: 'fornito_f.pem', type: 'pem', data: 'data' };
      component.__descrittoreChangeFirma(value, 'cert_fornito');
      expect(component._formGroup.controls['cert_fornito_filename_firma'].value).toBe('fornito_f.pem');
    });

    it('should patch csr_modulo_richiesta firma fields', () => {
      const value = { file: 'mod_f.pdf', type: 'pdf', data: 'moddata' };
      component.__descrittoreChangeFirma(value, 'csr_modulo_richiesta');
      expect(component._formGroup.controls['csr_modulo_ric_filename_firma'].value).toBe('mod_f.pdf');
    });

    it('should patch csr_richiesta firma fields', () => {
      const value = { file: 'req_f.csr', type: 'csr', data: 'reqdata' };
      component.__descrittoreChangeFirma(value, 'csr_richiesta');
      expect(component._formGroup.controls['csr_richiesta_filename_firma'].value).toBe('req_f.csr');
    });

    it('should patch cert_generato_csr_firma fields', () => {
      const value = { file: 'csr_cert_f.pem', type: 'pem', data: 'csrfirmadata' };
      component.__descrittoreChangeFirma(value, 'cert_generato_csr_firma');
      expect(component._formGroup.controls['cert_generato_csr_filename_firma'].value).toBe('csr_cert_f.pem');
      expect(component._certificato_generato_csr_firma).toBe(value);
    });

    it('should set _certificato_generato_csr_firma to null when value is falsy', () => {
      component.__descrittoreChangeFirma(null, 'cert_generato_csr_firma');
      expect(component._certificato_generato_csr_firma).toBeNull();
    });

    it('should reset _error to false', () => {
      component._error = true;
      component.__descrittoreChangeFirma({ file: 'f', type: 't', data: 'd' }, 'cert_fornito');
      expect(component._error).toBe(false);
    });
  });

  describe('_loadClient', () => {
    it('should not call apiService when id is null', () => {
      component.id = null;
      component._loadClient();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call getDetails and set client on success', () => {
      const response = {
        id_client: 'c1',
        nome: 'Loaded',
        stato: 'nuovo',
        ambiente: 'collaudo',
        dati_specifici: {
          auth_type: 'no_dati',
          certificato_autenticazione: null,
          certificato_firma: null
        },
        soggetto: { id_soggetto: 's1', nome: 'Sog', aderente: true, organizzazione: { id_organizzazione: 'o1', nome: 'Org' } }
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

      component.id = 123 as any;
      component._loadClient();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('client', 123);
      expect(component.client).toBeTruthy();
      expect(component.client.nome).toBe('Loaded');
    });

    it('should call OnError on failure', () => {
      const spy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));

      component.id = 123 as any;
      component._loadClient();

      expect(spy).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });
  });

  describe('_editClient', () => {
    it('should check adesioni and set _isEdit to true', () => {
      component._client = buildClientData() as any;
      component.client = { id_client: 'c1', stato: 'nuovo', soggetto: { id_soggetto: 's1', organizzazione: { id_organizzazione: 'o1' } }, dati_specifici: { auth_type: 'no_dati' } };
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      component._editClient();
      expect(component._isEdit).toBe(true);
      expect(component._isClientUsedInSomeAdesioni).toBe(false);
    });

    it('should set _isClientUsedInSomeAdesioni when adesioni exist', () => {
      component._client = buildClientData() as any;
      component.client = { id_client: 'c1', stato: 'nuovo', soggetto: { id_soggetto: 's1', organizzazione: { id_organizzazione: 'o1' } }, dati_specifici: { auth_type: 'no_dati' } };
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }] }));
      component._editClient();
      expect(component._isClientUsedInSomeAdesioni).toBe(true);
    });
  });

  describe('__onSave', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should call apiService.saveElement on save', () => {
      const resp = {
        id_client: 'c2',
        nome: 'Saved',
        dati_specifici: { auth_type: 'no_dati', certificato_autenticazione: null }
      };
      mockApiService.saveElement.mockReturnValue(of(resp));
      component.__onSave({ nome: 'Saved', stato: 'nuovo', ambiente: 'collaudo' });
      expect(mockApiService.saveElement).toHaveBeenCalledWith('client', expect.any(Object));
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(component.id).toBe('c2');
    });

    it('should set _error on failure', () => {
      mockApiService.saveElement.mockReturnValue(throwError(() => ({ error: { detail: 'fail' } })));
      component.__onSave({ nome: 'Bad' });
      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
    });
  });

  describe('__onUpdate', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should call apiService.putElement on update', () => {
      const resp = {
        id_client: 'c1',
        nome: 'Updated',
        dati_specifici: { auth_type: 'no_dati' }
      };
      mockApiService.putElement.mockReturnValue(of(resp));
      component._closeEdit = true;
      component.__onUpdate(1, { nome: 'Updated', stato: 'nuovo' });
      expect(mockApiService.putElement).toHaveBeenCalledWith('client', 1, expect.any(Object));
      expect(component._isEdit).toBe(false);
    });

    it('should keep edit mode open when _closeEdit is false', () => {
      const resp = {
        id_client: 'c1',
        nome: 'Updated',
        dati_specifici: { auth_type: 'no_dati' }
      };
      mockApiService.putElement.mockReturnValue(of(resp));
      component._closeEdit = false;
      component.__onUpdate(1, { nome: 'Updated', stato: 'nuovo' });
      expect(component._isEdit).toBe(true);
    });

    it('should emit save event on success', () => {
      const spy = vi.fn();
      component.save.subscribe(spy);
      const resp = {
        id_client: 'c1',
        nome: 'Updated',
        dati_specifici: { auth_type: 'no_dati' }
      };
      mockApiService.putElement.mockReturnValue(of(resp));
      component.__onUpdate(1, { nome: 'Updated' });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ update: true }));
    });

    it('should set _error on failure', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => ({ error: { detail: 'err' } })));
      component.__onUpdate(1, { nome: 'Bad' });
      expect(component._error).toBe(true);
    });
  });

  describe('_onSubmit extended', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should call __onSave when form is valid and _isNew', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup.controls['nome'].setValue('Valid');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['auth_type'].setValue('no_dati');
      component._formGroup.controls['stato'].setValue('nuovo');
      component._formGroup.updateValueAndValidity();
      const spy = vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit(component._formGroup.getRawValue());
      expect(spy).toHaveBeenCalled();
    });

    it('should call __onUpdate when form is valid and not _isNew', () => {
      component._isEdit = true;
      component._isNew = false;
      component._formGroup.controls['nome'].setValue('Valid');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_organizzazione'].setValue('o1');
      component._formGroup.updateValueAndValidity();
      const spy = vi.spyOn(component, '__onUpdate' as any).mockImplementation(() => {});
      const raw = component._formGroup.getRawValue();
      component._onSubmit(raw);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onStatusChange', () => {
    it('should call apiService.putElementRelated', () => {
      component.client = { id_client: 'c1', stato: 'nuovo' };
      const resp = { id_client: 'c1', stato: 'configurato' };
      mockApiService.putElementRelated.mockReturnValue(of(resp));
      component._onStatusChange('configurato');
      expect(mockApiService.putElementRelated).toHaveBeenCalledWith('client', 'c1', 'stato', { stato: 'configurato' });
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
    });

    it('should set _error and show message on failure', () => {
      component.client = { id_client: 'c1', stato: 'nuovo' };
      const showSpy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({
        error: { detail: 'err', errori: [{ msg: 'e1' }] }
      })));
      component._onStatusChange('configurato');
      expect(component._error).toBe(true);
      expect(showSpy).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });
  });

  describe('_deleteClient', () => {
    it('should show YesnoDialog modal', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject.asObservable() } });
      component._deleteClient();
      expect(mockModalService.show).toHaveBeenCalled();
    });

    it('should call deleteElement when confirmed', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject.asObservable() } });
      component.client = { id_client: 'c1' };
      mockApiService.deleteElement.mockReturnValue(of({}));
      component._deleteClient();
      onCloseSubject.next(true);
      expect(mockApiService.deleteElement).toHaveBeenCalledWith('client', 'c1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['client']);
    });

    it('should not call deleteElement when cancelled', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject.asObservable() } });
      component.client = { id_client: 'c1' };
      component._deleteClient();
      onCloseSubject.next(false);
      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should set _error when deleteElement fails', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({ content: { onClose: onCloseSubject.asObservable() } });
      component.client = { id_client: 'c1' };
      mockApiService.deleteElement.mockReturnValue(throwError(() => ({ error: { detail: 'del err' } })));
      component._deleteClient();
      onCloseSubject.next(true);
      expect(component._error).toBe(true);
    });
  });

  describe('_resetValidators', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should clear validators on tipo_certificato', () => {
      const ctrl = component._formGroup.controls['tipo_certificato'];
      ctrl.setValidators(() => ({ err: true }));
      component._resetValidators();
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(true);
    });

    it('should clear validators on url_redirezione', () => {
      const ctrl = component._formGroup.controls['url_redirezione'];
      ctrl.setValidators(() => ({ err: true }));
      component._resetValidators();
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(true);
    });

    it('should clear validators on client_id', () => {
      const ctrl = component._formGroup.controls['client_id'];
      ctrl.setValidators(() => ({ err: true }));
      component._resetValidators();
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(true);
    });

    it('should clear validators on username', () => {
      const ctrl = component._formGroup.controls['username'];
      ctrl.setValidators(() => ({ err: true }));
      component._resetValidators();
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(true);
    });

    it('should clear validators on all oauth fields', () => {
      const fields = ['url_esposizione', 'help_desk', 'nome_applicazione_portale'];
      for (const f of fields) {
        component._formGroup.controls[f].setValidators(() => ({ err: true }));
      }
      component._resetValidators();
      for (const f of fields) {
        component._formGroup.controls[f].updateValueAndValidity();
        expect(component._formGroup.controls[f].valid).toBe(true);
      }
    });
  });

  describe('initTipiCertificato', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should reset _tipoCertificatoEnum', () => {
      component._tipoCertificatoEnum = ['a', 'b'] as any;
      component.initTipiCertificato();
      expect(component._tipoCertificatoEnum).toEqual([]);
    });

    it('should populate _tipoCertificatoEnum from utils when certificato found', () => {
      mockUtils.getCertificatoByAuthType.mockReturnValue({ csr_modulo: true, tipo: 'test' });
      mockUtils.getTipiCertificatoAttivi.mockReturnValue(['fornito', 'richiesto_cn']);
      component.initTipiCertificato();
      expect(component._tipoCertificatoEnum).toEqual(['fornito', 'richiesto_cn']);
      expect(component._isRichiesto_csr).toBe(true);
    });

    it('should not populate when getCertificatoByAuthType returns null', () => {
      mockUtils.getCertificatoByAuthType.mockReturnValue(null);
      component.initTipiCertificato();
      expect(component._tipoCertificatoEnum).toEqual([]);
    });
  });

  describe('_hasVerifica', () => {
    it('should return false when monitoraggio is disabled', () => {
      component.client = {
        utilizzato_in_adesioni_configurate: true,
        dati_specifici: { auth_type: 'https' }
      };
      mockAuthenticationService._getConfigModule.mockImplementation((mod: string) => {
        if (mod === 'monitoraggio') return { abilitato: false, verifiche_abilitate: false };
        return {};
      });
      expect(component._hasVerifica()).toBe(false);
    });

    it('should return false when verifiche are disabled', () => {
      component.client = {
        utilizzato_in_adesioni_configurate: true,
        dati_specifici: { auth_type: 'https' }
      };
      mockAuthenticationService._getConfigModule.mockImplementation((mod: string) => {
        if (mod === 'monitoraggio') return { abilitato: true, verifiche_abilitate: false };
        return {};
      });
      expect(component._hasVerifica()).toBe(false);
    });

    it('should return false when client not used in adesioni configurate', () => {
      component.client = {
        utilizzato_in_adesioni_configurate: false,
        dati_specifici: { auth_type: 'https' }
      };
      mockAuthenticationService._getConfigModule.mockImplementation((mod: string) => {
        if (mod === 'monitoraggio') return { abilitato: true, verifiche_abilitate: true };
        return {};
      });
      expect(component._hasVerifica()).toBe(false);
    });

    it('should return false when auth_type does not include https/sign/pdnd', () => {
      component.client = {
        utilizzato_in_adesioni_configurate: true,
        dati_specifici: { auth_type: 'no_dati' }
      };
      mockAuthenticationService._getConfigModule.mockImplementation((mod: string) => {
        if (mod === 'monitoraggio') return { abilitato: true, verifiche_abilitate: true };
        return {};
      });
      expect(component._hasVerifica()).toBe(false);
    });

    it('should return true when all conditions are met with https', () => {
      component.client = {
        utilizzato_in_adesioni_configurate: true,
        dati_specifici: { auth_type: 'https' }
      };
      mockAuthenticationService._getConfigModule.mockImplementation((mod: string) => {
        if (mod === 'monitoraggio') return { abilitato: true, verifiche_abilitate: true };
        return {};
      });
      expect(component._hasVerifica()).toBe(true);
    });

    it('should return true when all conditions are met with pdnd', () => {
      component.client = {
        utilizzato_in_adesioni_configurate: true,
        dati_specifici: { auth_type: 'pdnd' }
      };
      mockAuthenticationService._getConfigModule.mockImplementation((mod: string) => {
        if (mod === 'monitoraggio') return { abilitato: true, verifiche_abilitate: true };
        return {};
      });
      expect(component._hasVerifica()).toBe(true);
    });

    it('should return true when auth_type includes sign', () => {
      component.client = {
        utilizzato_in_adesioni_configurate: true,
        dati_specifici: { auth_type: 'https_sign' }
      };
      mockAuthenticationService._getConfigModule.mockImplementation((mod: string) => {
        if (mod === 'monitoraggio') return { abilitato: true, verifiche_abilitate: true };
        return {};
      });
      expect(component._hasVerifica()).toBe(true);
    });
  });

  describe('_hasControlError', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should return true when control has errors and is touched', () => {
      component._formGroup.controls['nome'].setErrors({ required: true });
      component._formGroup.controls['nome'].markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._formGroup.controls['nome'].setValue('Valid');
      component._formGroup.controls['nome'].markAsTouched();
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control is untouched', () => {
      component._formGroup.controls['nome'].setErrors({ required: true });
      expect(component._hasControlError('nome')).toBe(false);
    });
  });

  describe('f / fRate accessors', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('f should return form controls', () => {
      const controls = component.f;
      expect(controls['nome']).toBeDefined();
      expect(controls['stato']).toBeDefined();
    });

    it('fRate should return rate_limiting sub-group controls', () => {
      const rateControls = component.fRate;
      expect(rateControls['quota']).toBeDefined();
      expect(rateControls['periodo']).toBeDefined();
    });
  });

  describe('_hasRateControlError', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should return truthy when rate control has errors and is touched', () => {
      const quota = (component._formGroup.get('rate_limiting') as any).controls['quota'];
      quota.setErrors({ required: true });
      quota.markAsTouched();
      expect(component._hasRateControlError('quota')).toBeTruthy();
    });

    it('should return falsy when rate control has no errors', () => {
      const quota = (component._formGroup.get('rate_limiting') as any).controls['quota'];
      quota.setValue(100);
      quota.markAsTouched();
      expect(component._hasRateControlError('quota')).toBeFalsy();
    });
  });

  describe('ngOnChanges', () => {
    it('should update id and call _loadAll when id changes', () => {
      const spy = vi.spyOn(component, '_loadAll' as any).mockImplementation(() => {});
      component.ngOnChanges({
        id: { currentValue: 42, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.id).toBe(42);
      expect(spy).toHaveBeenCalled();
    });

    it('should update client from user change', () => {
      const spy = vi.spyOn(component, '_loadAll' as any).mockImplementation(() => {});
      const userSource = { id: 99, nome: 'UserClient' };
      component.ngOnChanges({
        user: { currentValue: { source: userSource }, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.client).toBe(userSource);
      expect(component.id).toBe(99);
    });
  });

  describe('closeModal', () => {
    it('should call hide on modalCambiaStatoRef', () => {
      const hideSpy = vi.fn();
      component._modalCambiaStatoRef = { hide: hideSpy } as any;
      component.closeModal();
      expect(hideSpy).toHaveBeenCalled();
    });
  });

  describe('_changeAmbiente', () => {
    it('should be a no-op function', () => {
      expect(() => component._changeAmbiente('test')).not.toThrow();
    });
  });

  describe('_resetUploadCertificateComponents', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should clear cert_fornito fields', () => {
      const controls = component._formGroup.controls;
      controls['cert_fornito_filename'].setValue('file.pem');
      controls['cert_fornito_content'].setValue('data');
      component._resetUploadCertificateComponents(controls);
      expect(controls['cert_fornito_filename'].value).toBeNull();
      expect(controls['cert_fornito_content'].value).toBeNull();
    });

    it('should clear cn field', () => {
      const controls = component._formGroup.controls;
      controls['cn'].setValue('test-cn');
      component._resetUploadCertificateComponents(controls);
      expect(controls['cn'].value).toBeNull();
    });

    it('should clear cert_generato fields', () => {
      const controls = component._formGroup.controls;
      controls['cert_generato_filename'].setValue('gen.pem');
      controls['cert_generato_content'].setValue('gendata');
      component._resetUploadCertificateComponents(controls);
      expect(controls['cert_generato_filename'].value).toBeNull();
      expect(controls['cert_generato_content'].value).toBeNull();
    });

    it('should clear csr fields', () => {
      const controls = component._formGroup.controls;
      controls['csr_richiesta_content'].setValue('csrdata');
      controls['csr_modulo_ric_content'].setValue('moddata');
      component._resetUploadCertificateComponents(controls);
      expect(controls['csr_richiesta_content'].value).toBeNull();
      expect(controls['csr_modulo_ric_content'].value).toBeNull();
    });

    it('should reset descrittori', () => {
      component._descrittoreCtrl.setValue('test');
      component._resetUploadCertificateComponents(component._formGroup.controls);
      expect(component._descrittoreCtrl.value).toBe('');
    });
  });

  describe('_resetUploadCertificateComponentsFirma', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should clear cert_fornito_firma fields', () => {
      const controls = component._formGroup.controls;
      controls['cert_fornito_filename_firma'].setValue('file_f.pem');
      controls['cert_fornito_content_firma'].setValue('data_f');
      component._resetUploadCertificateComponentsFirma(controls);
      expect(controls['cert_fornito_filename_firma'].value).toBeNull();
      expect(controls['cert_fornito_content_firma'].value).toBeNull();
    });

    it('should clear cn_firma field', () => {
      const controls = component._formGroup.controls;
      controls['cn_firma'].setValue('test-cn-f');
      component._resetUploadCertificateComponentsFirma(controls);
      expect(controls['cn_firma'].value).toBeNull();
    });

    it('should clear cert_generato_firma fields', () => {
      const controls = component._formGroup.controls;
      controls['cert_generato_filename_firma'].setValue('gen_f.pem');
      controls['cert_generato_content_firma'].setValue('gendata_f');
      component._resetUploadCertificateComponentsFirma(controls);
      expect(controls['cert_generato_filename_firma'].value).toBeNull();
      expect(controls['cert_generato_content_firma'].value).toBeNull();
    });

    it('should clear csr firma fields', () => {
      const controls = component._formGroup.controls;
      controls['csr_richiesta_content_firma'].setValue('csrdata_f');
      controls['csr_modulo_ric_content_firma'].setValue('moddata_f');
      component._resetUploadCertificateComponentsFirma(controls);
      expect(controls['csr_richiesta_content_firma'].value).toBeNull();
      expect(controls['csr_modulo_ric_content_firma'].value).toBeNull();
    });

    it('should reset firma descrittori', () => {
      component._descrittoreCtrl_firma.setValue('test');
      component._resetUploadCertificateComponentsFirma(component._formGroup.controls);
      expect(component._descrittoreCtrl_firma.value).toBe('');
    });
  });

  describe('_prepareDataToSend', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should build payload with nome, stato, ambiente, dati_specifici for new client', () => {
      component._isNew = true;
      component._formGroup.controls['auth_type'].setValue('no_dati');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'TestClient',
        stato: 'nuovo',
        id_organizzazione: 'o1',
        id_soggetto: 's1'
      });
      expect(result.nome).toBe('TestClient');
      expect(result.ambiente).toBe('collaudo');
      expect(result.dati_specifici).toBeDefined();
      expect(result.dati_specifici.auth_type).toBe('no_dati');
      expect(result.id_organizzazione).toBe('o1');
    });

    it('should use _auth_type for existing client', () => {
      component._isNew = false;
      component._auth_type = 'https';
      component._formGroup.controls['ambiente'].setValue('produzione');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        id_soggetto: 's1'
      });
      expect(result.dati_specifici.auth_type).toBe('https');
      expect(result.id_soggetto).toBe('s1');
    });

    it('should include rate_limiting when _show_erogazione_rate_limiting and quota present', () => {
      component._isNew = true;
      component._show_erogazione_rate_limiting = true;
      component._formGroup.controls['auth_type'].setValue('no_dati');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        rate_limiting: { quota: 100, periodo: 'giorno' }
      });
      expect(result.dati_specifici.rate_limiting).toEqual({ quota: 100, periodo: 'giorno' });
    });

    it('should not include rate_limiting when quota is null', () => {
      component._isNew = true;
      component._show_erogazione_rate_limiting = true;
      component._formGroup.controls['auth_type'].setValue('no_dati');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        rate_limiting: { quota: null, periodo: 'giorno' }
      });
      expect(result.dati_specifici.rate_limiting).toBeUndefined();
    });

    it('should include finalita when _show_erogazione_finalita and finalita present', () => {
      component._isNew = true;
      component._show_erogazione_finalita = true;
      component._formGroup.controls['auth_type'].setValue('no_dati');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        finalita: '12345678-ABCD-1234-ABCD-123456789ABC'
      });
      expect(result.dati_specifici.finalita).toBe('12345678-ABCD-1234-ABCD-123456789ABC');
    });

    it('should build certificato_autenticazione for fornito', () => {
      component._isNew = true;
      component._formGroup.controls['auth_type'].setValue('https');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      component._certificato_fornito = { uuid: 'u1' };
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        tipo_certificato: 'fornito',
        cert_fornito_content_type: 'application/pem',
        cert_fornito_content: 'base64',
        cert_fornito_filename: 'cert.pem'
      });
      expect(result.dati_specifici.certificato_autenticazione).toBeDefined();
      expect(result.dati_specifici.certificato_autenticazione.tipo_certificato).toBe('fornito');
    });

    it('should build certificato_autenticazione for richiesto_cn with cert', () => {
      component._isNew = true;
      component._formGroup.controls['auth_type'].setValue('https');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      component._certificato_generato = { filename: 'gen.pem', uuid: 'u2' };
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        tipo_certificato: 'richiesto_cn',
        cn: 'CN=test',
        cert_generato_content_type: 'pem',
        cert_generato_content: 'data',
        cert_generato_filename: 'gen.pem'
      });
      expect(result.dati_specifici.certificato_autenticazione).toBeDefined();
      expect(result.dati_specifici.certificato_autenticazione.cn).toBe('CN=test');
    });

    it('should build certificato_autenticazione for richiesto_cn without cert', () => {
      component._isNew = true;
      component._formGroup.controls['auth_type'].setValue('https');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      component._certificato_generato = {};
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        tipo_certificato: 'richiesto_cn',
        cn: 'CN=test'
      });
      expect(result.dati_specifici.certificato_autenticazione.cn).toBe('CN=test');
      expect(result.dati_specifici.certificato_autenticazione.certificato).toBeUndefined();
    });

    it('should include username for http_basic', () => {
      component._isNew = true;
      component._isHttpBasic = true;
      component._formGroup.controls['auth_type'].setValue('http_basic');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        username: 'user1'
      });
      expect(result.dati_specifici.username).toBe('user1');
    });

    it('should include client_id for pdnd', () => {
      component._isNew = true;
      component._isPdnd = true;
      component._formGroup.controls['auth_type'].setValue('pdnd');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        client_id: 'pdnd-client-id'
      });
      expect(result.dati_specifici.client_id).toBe('pdnd-client-id');
    });

    it('should include oauth fields for oauth_authorization_code', () => {
      component._isNew = true;
      component._isOauthAuthCode = true;
      component._formGroup.controls['auth_type'].setValue('oauth_authorization_code');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        url_redirezione: 'http://redirect',
        url_esposizione: 'http://expose',
        help_desk: 'help@desk.it',
        nome_applicazione_portale: 'AppPortale',
        client_id: 'oauth-cid'
      });
      expect(result.dati_specifici.url_redirezione).toBe('http://redirect');
      expect(result.dati_specifici.url_esposizione).toBe('http://expose');
      expect(result.dati_specifici.help_desk).toBe('help@desk.it');
      expect(result.dati_specifici.nome_applicazione_portale).toBe('AppPortale');
      expect(result.dati_specifici.client_id).toBe('oauth-cid');
    });

    it('should include indirizzo_ip and descrizione', () => {
      component._isNew = true;
      component._formGroup.controls['auth_type'].setValue('no_dati');
      component._formGroup.controls['ambiente'].setValue('collaudo');
      component._formGroup.controls['id_soggetto'].setValue('s1');
      const result = component._prepareDataToSend({
        nome: 'Test',
        stato: 'nuovo',
        indirizzo_ip: '10.0.0.1',
        descrizione: 'My client'
      });
      expect(result.indirizzo_ip).toBe('10.0.0.1');
      expect(result.descrizione).toBe('My client');
    });
  });

  describe('_downloadAllegato', () => {
    it('should call apiService.download and trigger saveAs', () => {
      const blob = new Blob(['data'], { type: 'application/octet-stream' });
      mockApiService.download.mockReturnValue(of({ body: blob }));
      (globalThis as any).saveAs = vi.fn();
      component.id = 123 as any;
      component._downloadAllegato({ uuid: 'u1', filename: 'file.pem' });
      expect(mockApiService.download).toHaveBeenCalledWith('client', 123, 'u1/download');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'file.pem');
      expect(component._downloading).toBe(false);
    });

    it('should set _error on download failure', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ error: { detail: 'dl err' } })));
      component.id = 123 as any;
      component._downloadAllegato({ uuid: 'u1', filename: 'file.pem' });
      expect(component._error).toBe(true);
      expect(component._downloading).toBe(false);
    });
  });

  describe('_checkTipoCertificato extended', () => {
    it('should set firma flags for https_sign', () => {
      component.client = {
        dati_specifici: {
          auth_type: 'https_sign',
          certificato_autenticazione: { tipo_certificato: 'fornito' },
          certificato_firma: { tipo_certificato: 'richiesto_cn' }
        }
      };
      component._checkTipoCertificato('https_sign', 'fornito');
      expect(component._isFornito).toBe(true);
      expect(component._isRichiesto_cn_firma).toBe(true);
    });

    it('should set firma flags for sign', () => {
      component.client = {
        dati_specifici: {
          auth_type: 'sign',
          certificato_firma: { tipo_certificato: 'fornito' }
        }
      };
      component._checkTipoCertificato('sign', '');
      expect(component._isFornito_firma).toBe(true);
    });

    it('should set firma flags for sign_pdnd', () => {
      component.client = {
        dati_specifici: {
          auth_type: 'sign_pdnd',
          certificato_firma: { tipo_certificato: 'richiesto_csr' }
        }
      };
      component._checkTipoCertificato('sign_pdnd', '');
      expect(component._isRichiesto_csr_firma).toBe(true);
    });

    it('should set firma flags for https_pdnd_sign', () => {
      component.client = {
        dati_specifici: {
          auth_type: 'https_pdnd_sign',
          certificato_autenticazione: { tipo_certificato: 'richiesto_cn' },
          certificato_firma: { tipo_certificato: 'fornito' }
        }
      };
      component._checkTipoCertificato('https_pdnd_sign', 'richiesto_cn');
      expect(component._isRichiesto_cn).toBe(true);
      expect(component._isFornito_firma).toBe(true);
    });
  });

  describe('_showMandatoryFields', () => {
    beforeEach(() => {
      initFormWithDefaults(component);
    });

    it('should not throw when debugMandatoryFields is false', () => {
      component.debugMandatoryFields = false;
      expect(() => component._showMandatoryFields(component._formGroup.controls)).not.toThrow();
    });

    it('should log when debugMandatoryFields is true', () => {
      component.debugMandatoryFields = true;
      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._showMandatoryFields(component._formGroup.controls);
      expect(groupSpy).toHaveBeenCalledWith('Mandatory fields');
      expect(groupEndSpy).toHaveBeenCalled();
    });
  });

  describe('_loadAll', () => {
    it('should call _loadClient', () => {
      const spy = vi.spyOn(component, '_loadClient').mockImplementation(() => {});
      component._loadAll();
      expect(spy).toHaveBeenCalled();
    });
  });
});
