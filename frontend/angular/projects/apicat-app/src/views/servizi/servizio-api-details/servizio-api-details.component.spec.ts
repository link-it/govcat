import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, EMPTY } from 'rxjs';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators } from '@angular/forms';
import { Tools } from '@linkit/components';
import { ServizioApiDetailsComponent } from './servizio-api-details.component';
import { ServizioApiCreate } from './servizio-api-create';

// Provide global saveAs used by the component via declare const
(globalThis as any).saveAs = vi.fn();

describe('ServizioApiDetailsComponent', () => {
  let component: ServizioApiDetailsComponent;
  let savedConfigurazione: any;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1', aid: '10' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) }
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockFormBuilder = {
    group: vi.fn().mockReturnValue({
      controls: {},
      get: vi.fn(),
      patchValue: vi.fn(),
      reset: vi.fn(),
      value: {},
      addControl: vi.fn(),
      removeControl: vi.fn(),
      updateValueAndValidity: vi.fn()
    }),
    array: vi.fn().mockReturnValue({
      at: vi.fn(),
      push: vi.fn(),
      removeAt: vi.fn(),
      clear: vi.fn(),
      length: 0
    })
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockModalService = {
    show: vi.fn().mockReturnValue({
      content: { onClose: of(null) }
    })
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Services: { hideVersions: false }
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockUtilsLib = {
    getLanguage: vi.fn().mockReturnValue('it')
  } as any;

  const _safeServiceResponse = {
    dominio: { nome: 'dom', soggetto_referente: { nome: 'Sogg', organizzazione: { esterna: false } } }
  };

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of(_safeServiceResponse)),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({
      body: new Blob(),
      headers: { get: vi.fn().mockReturnValue('attachment; filename="export.json"') }
    }))
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    _confirmDelection: vi.fn()
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canJoin: vi.fn().mockReturnValue(true),
    canAdd: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
    canEditField: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    _getFieldsMandatory: vi.fn().mockReturnValue([]),
    _getClassesMandatory: vi.fn().mockReturnValue([]),
    _removeDNM: vi.fn().mockImplementation((_a: any, _b: any, body: any) => body)
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: {
        api_multiple: false,
        adesioni_multiple: false,
        api: {
          auth_type: [],
          profili: [],
          codice_asset_obbligatorio: false,
          specifica_obbligatorio: false,
          info_gateway_visualizzate: false,
          proprieta_custom: []
        }
      },
      pdnd: null
    };
    component = new ServizioApiDetailsComponent(
      mockRoute,
      mockRouter,
      mockFormBuilder,
      mockTranslate,
      mockModalService,
      mockConfigService,
      mockTools,
      mockEventsManagerService,
      mockUtilsLib,
      mockApiService,
      mockUtils,
      mockAuthenticationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiDetailsComponent.Name).toBe('ServizioApiDetailsComponent');
  });

  it('should have model set to api', () => {
    expect(component.model).toBe('api');
  });

  it('should read appConfig from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.appConfig).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component.sid).toBeNull();
    expect(component.servizioApi).toBeNull();
    expect(component._spin).toBe(0);
    expect(component._loaded).toBe(false);
    expect(component._isDetails).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._isModify).toBe(false);
    expect(component._editable).toBe(true);
    expect(component._deleteable).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._useRoute).toBe(true);
    expect(component._customAuth).toBe(false);
    expect(component._hasSpecifica).toBe(true);
    expect(component.EROGATO_SOGGETTO_DOMINIO).toBe('erogato_soggetto_dominio');
    expect(component.EROGATO_SOGGETTO_ADERENTE).toBe('erogato_soggetto_aderente');
  });

  it('should have _tipoInterfaccia with soap and rest', () => {
    expect(component._tipoInterfaccia).toEqual([
      { value: 'soap', label: 'APP.INTERFACE.soap' },
      { value: 'rest', label: 'APP.INTERFACE.rest' }
    ]);
  });

  it('should emit close event on _onClose', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');
    component.id = '10';
    component._onClose();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit save event on _onSave', () => {
    const emitSpy = vi.spyOn(component.save, 'emit');
    component.id = '10';
    component._onSave();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should navigate on onBreadcrumb when _useRoute is true', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should emit close on onBreadcrumb when _useRoute is false', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');
    component._useRoute = false;
    component.onBreadcrumb({ url: '/servizi' });
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should reset error on __resetError', () => {
    component._error = true;
    component._errorMsg = 'some error';
    component._errors = [{ msg: 'err' }];
    (component as any).__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._errors).toEqual([]);
  });

  it('should call authenticationService.canEdit on _canEditMapper', () => {
    component._canEditMapper();
    expect(mockAuthenticationService.canEdit).toHaveBeenCalled();
  });

  it('should call authenticationService.canJoin on _canJoinMapper', () => {
    component._canJoinMapper();
    expect(mockAuthenticationService.canJoin).toHaveBeenCalled();
  });

  it('should call authenticationService.canAdd on _canAddMapper', () => {
    component._canAddMapper();
    expect(mockAuthenticationService.canAdd).toHaveBeenCalled();
  });

  it('should call authenticationService.canEditField on _canEditFieldMapper', () => {
    component._canEditFieldMapper('protocollo');
    expect(mockAuthenticationService.canEditField).toHaveBeenCalledWith('servizio', 'api', '', 'protocollo', undefined);
  });

  it('should check _isGestore', () => {
    mockAuthenticationService.isGestore.mockReturnValue(true);
    expect(component._isGestore()).toBe(true);
  });

  it('should check _canJoin', () => {
    mockAuthenticationService.canJoin.mockReturnValue(true);
    expect(component._canJoin()).toBe(true);
  });

  it('should check _canAdd', () => {
    mockAuthenticationService.canAdd.mockReturnValue(true);
    expect(component._canAdd()).toBe(true);
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should handle onActionMonitor delete', () => {
    component.onActionMonitor({ action: 'delete' });
    expect(mockUtils._confirmDelection).toHaveBeenCalled();
  });

  it('should handle onActionMonitor download_service_api', () => {
    component.id = '10';
    component.onActionMonitor({ action: 'download_service_api' });
    expect(mockApiService.download).toHaveBeenCalled();
  });

  it('should handle onActionMonitor unknown action', () => {
    mockRouter.navigate.mockClear();
    mockApiService.download.mockClear();
    mockUtils._confirmDelection.mockClear();
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(mockApiService.download).not.toHaveBeenCalled();
    expect(mockUtils._confirmDelection).not.toHaveBeenCalled();
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should have _hasPDNDConfiguredMapper return false when no servizioApi', () => {
    component.servizioApi = null;
    expect(component._hasPDNDConfiguredMapper()).toBe(false);
  });

  it('should have _hasPDNDConfiguredMapper return false when no gruppi_auth_type', () => {
    component.servizioApi = {} as any;
    expect(component._hasPDNDConfiguredMapper()).toBe(false);
  });

  it('should toggle showHistory on toggleHistorical', () => {
    expect(component.showHistory).toBe(false);
    component.toggleHistorical();
    expect(component.showHistory).toBe(true);
    component.toggleHistorical();
    expect(component.showHistory).toBe(false);
  });

  it('should toggle _customAuth on _onToggleCustomAuth', () => {
    expect(component._customAuth).toBe(false);
    component._onToggleCustomAuth();
    expect(component._customAuth).toBe(true);
    component._onToggleCustomAuth();
    expect(component._customAuth).toBe(false);
  });

  it('should return false for _canShowPDNDActionsMapper when no PDND configured', () => {
    component.servizioApi = null;
    expect(component._canShowPDNDActionsMapper()).toBe(false);
  });

  it('should get profilo label from _getProfiloLabelMapper', () => {
    component._profili = [{ codice_interno: 'prof1', etichetta: 'Profile 1' }];
    expect(component._getProfiloLabelMapper('prof1')).toBe('Profile 1');
  });

  it('should return code when profilo not found in _getProfiloLabelMapper', () => {
    component._profili = [];
    expect(component._getProfiloLabelMapper('unknown')).toBe('unknown');
  });

  it('should return profilo from _getProfilo', () => {
    const profilo = { codice_interno: 'prof1', etichetta: 'Profile 1' };
    component._profili = [profilo];
    expect(component._getProfilo('prof1')).toEqual(profilo);
  });

  it('should return undefined from _getProfilo when not found', () => {
    component._profili = [];
    expect(component._getProfilo('unknown')).toBeUndefined();
  });

  it('should navigate to allegati on _showAllegati', () => {
    component._showAllegati();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['allegati'], { relativeTo: mockRoute, queryParamsHandling: 'preserve' });
  });

  it('should navigate to production configuration on _goToProductionConfiguration', () => {
    component.sid = '1';
    component.id = '10';
    component._goToProductionConfiguration();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['servizi', '1', 'api', '10', 'configuration', 'produzione'],
      { queryParamsHandling: 'preserve' }
    );
  });

  it('should navigate to testing configuration on _goToTestingConfiguration', () => {
    component.sid = '1';
    component.id = '10';
    component._goToTestingConfiguration();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['servizi', '1', 'api', '10', 'configuration', 'collaudo'],
      { queryParamsHandling: 'preserve' }
    );
  });

  it('should filter campi per ruoli correctly', () => {
    const data = {
      'Gruppo1': [
        { nome_gruppo: 'g1', nome: 'campo1', ruoli_abilitati: ['admin'] } as any,
        { nome_gruppo: 'g1', nome: 'campo2', ruoli_abilitati: ['user'] } as any,
        { nome_gruppo: 'g1', nome: 'campo3' } as any
      ]
    };
    const result = component.filtraCampiPerRuoli(data, ['admin']);
    expect(result['Gruppo1']).toHaveLength(2);
    expect(result['Gruppo1'][0].nome).toBe('campo1');
    expect(result['Gruppo1'][1].nome).toBe('campo3');
  });

  it('should include all fields when ruoli_abilitati is empty', () => {
    const data = {
      'Gruppo1': [
        { nome_gruppo: 'g1', nome: 'campo1', ruoli_abilitati: [] } as any
      ]
    };
    const result = component.filtraCampiPerRuoli(data, ['admin']);
    expect(result['Gruppo1']).toHaveLength(1);
  });

  it('should exclude entire group when no fields match', () => {
    const data = {
      'Gruppo1': [
        { nome_gruppo: 'g1', nome: 'campo1', ruoli_abilitati: ['superadmin'] } as any
      ]
    };
    const result = component.filtraCampiPerRuoli(data, ['admin']);
    expect(result['Gruppo1']).toBeUndefined();
  });

  // =========================================================================
  // _initBreadcrumb
  // =========================================================================
  describe('_initBreadcrumb', () => {
    it('should build breadcrumbs with service name and version', () => {
      component.service = { nome: 'TestService', versione: '2', stato: 'pubblicato' };
      component.servizioApi = { nome: 'MyApi', versione: 3 } as any;
      component.sid = '42';
      component.hideVersions = false;
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs).toHaveLength(4);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[1].label).toBe('TestService v. 2');
      expect(component.breadcrumbs[2].label).toBe('APP.SERVICES.TITLE.API');
      expect(component.breadcrumbs[3].label).toBe('MyApi v. 3');
    });

    it('should hide version in breadcrumb title when hideVersions is true', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.servizioApi = { nome: 'Api1', versione: 5 } as any;
      component.sid = '10';
      component.hideVersions = true;
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('Svc');
      expect(component.breadcrumbs[3].label).toBe('Api1');
    });

    it('should use id as fallback when service is null', () => {
      component.service = null;
      component.servizioApi = null;
      component.id = '99';
      component.sid = '5';
      component.hideVersions = false;
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('99');
      expect(component.breadcrumbs[3].label).toBe('99');
    });

    it('should show "New" label when no servizioApi and no id', () => {
      component.service = null;
      component.servizioApi = null;
      component.id = null;
      component.sid = '5';
      component.hideVersions = false;
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs[3].label).toBe('APP.TITLE.New');
    });

    it('should prepend componentBreadcrumbs when present', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.servizioApi = null;
      component.id = '10';
      component.sid = '20';
      component.hideVersions = false;
      component._fromDashboard = false;
      component._componentBreadcrumbs = {
        service: { id_servizio: '100' },
        breadcrumbs: [{ label: 'ParentBC', url: '/parent', type: 'link' }]
      } as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('ParentBC');
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
      expect(component.breadcrumbs[2].label).toContain('Svc');
    });

    it('should set dashboard breadcrumb when _fromDashboard is true and no componentBreadcrumbs', () => {
      component.service = { nome: 'Svc', versione: '1', stato: 'bozza' };
      component.servizioApi = null;
      component.id = '10';
      component.sid = '20';
      component.hideVersions = false;
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
    });

    it('should use ellipsis when service has no name/version and no id', () => {
      component.service = { nome: null, versione: null, stato: 'bozza' };
      component.servizioApi = null;
      component.id = null;
      component.sid = '5';
      component.hideVersions = false;
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('...');
    });
  });

  // =========================================================================
  // _prepareBodySaveApi
  // =========================================================================
  describe('_prepareBodySaveApi', () => {
    it('should build ApiCreateRequest with basic fields', () => {
      component._hasSpecifica = false;
      component._apiProprietaCustomGrouped = null;
      const body = {
        nome: 'Api1', versione: '2', id_servizio: 's1', ruolo: 'erogato_soggetto_aderente',
        protocollo: 'rest', descrizione: 'desc', codice_asset: 'asset1',
        url_collaudo: 'http://test', url_produzione: '', nome_gateway: null, versione_gateway: null,
        authTypes: []
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.nome).toBe('Api1');
      expect(result.versione).toBe('2');
      expect(result.id_servizio).toBe('s1');
      expect(result.ruolo).toBe('erogato_soggetto_aderente');
      expect(result.descrizione).toBe('desc');
      expect(result.codice_asset).toBe('asset1');
      expect(result.configurazione_collaudo.protocollo).toBe('rest');
      expect(result.gruppi_auth_type).toEqual([]);
    });

    it('should set specifica when _hasSpecifica and content/filename present', () => {
      component._hasSpecifica = true;
      component._apiProprietaCustomGrouped = null;
      const body = {
        nome: 'Api1', versione: '1', id_servizio: 's1', ruolo: 'erogato_soggetto_aderente',
        protocollo: 'soap', content: 'base64data', filename: 'spec.wsdl', estensione: 'wsdl',
        url_collaudo: null, url_produzione: null, nome_gateway: null, versione_gateway: null,
        authTypes: [], descrizione: null, codice_asset: null
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.configurazione_collaudo.specifica).toBeDefined();
      const spec: any = result.configurazione_collaudo.specifica;
      expect(spec.filename).toBe('spec.wsdl');
      expect(spec.content).toBe('base64data');
      expect(spec.content_type).toBe('wsdl');
    });

    it('should not set specifica when _hasSpecifica is false', () => {
      component._hasSpecifica = false;
      component._apiProprietaCustomGrouped = null;
      const body = {
        nome: 'Api1', versione: '1', id_servizio: 's1', ruolo: 'erogato_soggetto_aderente',
        protocollo: 'rest', content: 'data', filename: 'f.json', estensione: 'json',
        url_collaudo: null, url_produzione: null, nome_gateway: null, versione_gateway: null,
        authTypes: [], descrizione: null, codice_asset: null
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.configurazione_collaudo.specifica).toBeUndefined();
    });

    it('should set configurazione_produzione when url_produzione is provided', () => {
      component._hasSpecifica = false;
      component._apiProprietaCustomGrouped = null;
      const body = {
        nome: 'A', versione: '1', id_servizio: 's1', ruolo: 'erogato_soggetto_aderente',
        protocollo: 'rest', url_collaudo: 'http://coll', url_produzione: 'http://prod',
        nome_gateway: null, versione_gateway: null, authTypes: [],
        descrizione: null, codice_asset: null
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.configurazione_produzione).toBeDefined();
      expect(result.configurazione_produzione!.dati_erogazione.url).toBe('http://prod');
    });

    it('should map gruppi_auth_type when ruolo is EROGATO_SOGGETTO_DOMINIO', () => {
      component._hasSpecifica = false;
      component._apiProprietaCustomGrouped = null;
      const body = {
        nome: 'A', versione: '1', id_servizio: 's1', ruolo: 'erogato_soggetto_dominio',
        protocollo: 'rest', url_collaudo: null, url_produzione: null,
        nome_gateway: null, versione_gateway: null,
        authTypes: [
          { profilo: 'prof1', resources: ['/r1'], note: 'a note' },
          { profilo: 'prof2', resources: ['/r2', '/r3'], note: null }
        ],
        descrizione: null, codice_asset: null
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.gruppi_auth_type).toHaveLength(2);
      expect(result.gruppi_auth_type![0].profilo).toBe('prof1');
      expect(result.gruppi_auth_type![0].resources).toEqual(['/r1']);
      expect(result.gruppi_auth_type![0].note).toBe('a note');
      expect(result.gruppi_auth_type![1].note).toBeNull();
    });

    it('should group proprieta_custom when _apiProprietaCustomGrouped has entries', () => {
      component._hasSpecifica = false;
      component._apiProprietaCustomGrouped = {
        'GroupLabel1': [
          { nome_gruppo: 'GN1', nome: 'prop1' },
          { nome_gruppo: 'GN1', nome: 'prop2' }
        ]
      };
      const body = {
        nome: 'A', versione: '1', id_servizio: 's1', ruolo: 'erogato_soggetto_aderente',
        protocollo: 'rest', url_collaudo: null, url_produzione: null,
        nome_gateway: null, versione_gateway: null, authTypes: [],
        descrizione: null, codice_asset: null,
        proprieta_custom: { GN1: { prop1: 'val1', prop2: 'val2' } }
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.proprieta_custom).toHaveLength(1);
      expect(result.proprieta_custom![0].gruppo).toBe('GN1');
      expect(result.proprieta_custom![0].proprieta).toEqual([
        { nome: 'prop1', valore: 'val1' },
        { nome: 'prop2', valore: 'val2' }
      ]);
    });

    it('should skip empty/null/undefined proprieta_custom values', () => {
      component._hasSpecifica = false;
      component._apiProprietaCustomGrouped = {
        'GL': [
          { nome_gruppo: 'G1', nome: 'p1' },
          { nome_gruppo: 'G1', nome: 'p2' },
          { nome_gruppo: 'G1', nome: 'p3' }
        ]
      };
      const body = {
        nome: 'A', versione: '1', id_servizio: 's1', ruolo: 'erogato_soggetto_aderente',
        protocollo: 'rest', url_collaudo: null, url_produzione: null,
        nome_gateway: null, versione_gateway: null, authTypes: [],
        descrizione: null, codice_asset: null,
        proprieta_custom: { G1: { p1: 'ok', p2: null, p3: '   ' } }
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.proprieta_custom![0].proprieta).toEqual([{ nome: 'p1', valore: 'ok' }]);
    });

    it('should default versione to "1" when not provided', () => {
      component._hasSpecifica = false;
      component._apiProprietaCustomGrouped = null;
      const body = {
        nome: 'A', versione: null, id_servizio: 's1', ruolo: 'erogato_soggetto_aderente',
        protocollo: 'rest', url_collaudo: null, url_produzione: null,
        nome_gateway: null, versione_gateway: null, authTypes: [],
        descrizione: null, codice_asset: null
      };
      const result = component._prepareBodySaveApi(body);
      expect(result.versione).toBe('1');
    });
  });

  // =========================================================================
  // _prepareBodyUpdateApi
  // =========================================================================
  describe('_prepareBodyUpdateApi', () => {
    beforeEach(() => {
      component.service = { stato: 'pubblicato', dominio: { soggetto_referente: { nome: 'Sogg' } } };
      component._apiProprietaCustomGrouped = null;
      component._isPDND = false;
    });

    it('should build update body with identificativo and dati_generici', () => {
      const body = { nome: 'Api1', versione: '3', ruolo: 'erogato_soggetto_aderente', descrizione: 'desc', codice_asset: 'CA' };
      const result = component._prepareBodyUpdateApi(body);
      expect(result.identificativo.nome).toBe('Api1');
      expect(result.identificativo.versione).toBe('3');
      expect(result.identificativo.ruolo).toBe('erogato_soggetto_aderente');
      expect(result.dati_generici.descrizione).toBe('desc');
      expect(result.dati_generici.codice_asset).toBe('CA');
    });

    it('should set dati_specifica.gruppi_auth_type when ruolo is EROGATO_SOGGETTO_DOMINIO', () => {
      const body = {
        nome: 'A', versione: '1', ruolo: 'erogato_soggetto_dominio',
        descrizione: null, codice_asset: null,
        authTypes: [
          { profilo: 'p1', resources: ['/r1'], note: 'note1', customProperties: { cp1: 'v1' } }
        ]
      };
      const result = component._prepareBodyUpdateApi(body);
      expect(result.dati_specifica).toBeDefined();
      expect(result.dati_specifica!.gruppi_auth_type).toHaveLength(1);
      expect(result.dati_specifica!.gruppi_auth_type![0].profilo).toBe('p1');
      expect(result.dati_specifica!.gruppi_auth_type![0].proprieta_custom).toEqual([{ nome: 'cp1', valore: 'v1' }]);
    });

    it('should not set dati_specifica when ruolo is not EROGATO_SOGGETTO_DOMINIO', () => {
      const body = {
        nome: 'A', versione: '1', ruolo: 'erogato_soggetto_aderente',
        descrizione: null, codice_asset: null, authTypes: []
      };
      const result = component._prepareBodyUpdateApi(body);
      expect(result.dati_specifica).toBeUndefined();
    });

    it('should set dati_custom when _apiProprietaCustomGrouped and not _isPDND', () => {
      component._isPDND = false;
      component._apiProprietaCustomGrouped = {
        'Label1': [{ nome_gruppo: 'GN1', nome: 'prop1' }]
      };
      const body = {
        nome: 'A', versione: '1', ruolo: 'erogato_soggetto_aderente',
        descrizione: null, codice_asset: null,
        proprieta_custom: { GN1: { prop1: 'val1' } }
      };
      const result = component._prepareBodyUpdateApi(body);
      expect(result.dati_custom).toBeDefined();
      expect(result.dati_custom!.proprieta_custom).toHaveLength(1);
      expect(result.dati_custom!.proprieta_custom[0].gruppo).toBe('GN1');
      expect(result.dati_custom!.proprieta_custom[0].proprieta).toEqual([{ nome: 'prop1', valore: 'val1' }]);
    });

    it('should not set dati_custom when _isPDND is true', () => {
      component._isPDND = true;
      component._apiProprietaCustomGrouped = {
        'Label1': [{ nome_gruppo: 'GN1', nome: 'prop1' }]
      };
      const body = {
        nome: 'A', versione: '1', ruolo: 'erogato_soggetto_aderente',
        descrizione: null, codice_asset: null,
        proprieta_custom: { GN1: { prop1: 'val1' } }
      };
      const result = component._prepareBodyUpdateApi(body);
      expect(result.dati_custom).toBeUndefined();
    });

    it('should call _removeDNM on the result', () => {
      const body = { nome: 'A', versione: '1', ruolo: 'erogato_soggetto_aderente', descrizione: null, codice_asset: null };
      component._prepareBodyUpdateApi(body);
      expect(mockAuthenticationService._removeDNM).toHaveBeenCalledWith('servizio', 'pubblicato', expect.any(Object), undefined);
    });
  });

  // =========================================================================
  // _loadServizio
  // =========================================================================
  describe('_loadServizio', () => {
    it('should not call apiService if sid is null', () => {
      component.sid = null;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should call getDetails for grant and service when sid is set', () => {
      component.sid = '42';
      const grantResp = { ruoli: ['admin'] };
      const serviceResp = { nome: 'Svc', dominio: { soggetto_referente: { nome: 'S1', organizzazione: { esterna: false } } } };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantResp))
        .mockReturnValueOnce(of(serviceResp));
      const initBcSpy = vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      const initRuoliSpy = vi.spyOn(component, '_initRuoli').mockImplementation(() => {});
      const initMenuSpy = vi.spyOn(component, '_initOtherActionMenu').mockImplementation(() => {});

      component._loadServizio();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '42', 'grant');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '42');
      expect(component.service).toEqual(serviceResp);
      expect(component._isDominioEsterno).toBe(false);
      expect(initBcSpy).toHaveBeenCalled();
      expect(initRuoliSpy).toHaveBeenCalled();
      expect(initMenuSpy).toHaveBeenCalled();
    });

    it('should set _isDominioEsterno when organizzazione.esterna is true', () => {
      component.sid = '42';
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ dominio: { soggetto_referente: { nome: 'S', organizzazione: { esterna: true } } } }));
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      vi.spyOn(component, '_initRuoli').mockImplementation(() => {});
      vi.spyOn(component, '_initOtherActionMenu').mockImplementation(() => {});
      component._loadServizio();
      expect(component._isDominioEsterno).toBe(true);
    });

    it('should call Tools.OnError on grant error', () => {
      component.sid = '42';
      const onErrorSpy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('grant error')));
      component._loadServizio();
      expect(onErrorSpy).toHaveBeenCalled();
    });

    it('should call Tools.OnError on service detail error', () => {
      component.sid = '42';
      const onErrorSpy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(throwError(() => new Error('detail error')));
      component._loadServizio();
      expect(onErrorSpy).toHaveBeenCalled();
    });

    it('should broadcast INIT_DATA when servizioApi is already set', () => {
      component.sid = '42';
      component.servizioApi = { id_api: '1' } as any;
      mockApiService.getDetails
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(of({ dominio: { soggetto_referente: { nome: 'S', organizzazione: { esterna: false } } } }));
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      vi.spyOn(component, '_initRuoli').mockImplementation(() => {});
      vi.spyOn(component, '_initOtherActionMenu').mockImplementation(() => {});
      component._loadServizio();
      expect(mockEventsManagerService.broadcast).toHaveBeenCalledWith('INIT_DATA');
    });
  });

  // =========================================================================
  // _loadServiceApi
  // =========================================================================
  describe('_loadServiceApi', () => {
    it('should not call apiService if id is null', () => {
      component.id = null;
      mockApiService.getDetails.mockClear();
      component._loadServiceApi();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load api details and set servizioApi', () => {
      component.id = '10';
      const apiResp = { id_api: '10', nome: 'Api1', versione: 1, configurazione_collaudo: { specifica: { filename: 'f.wsdl' } } };
      mockApiService.getDetails.mockReturnValueOnce(of(apiResp));
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      vi.spyOn(component, '_initForm').mockImplementation(() => {});

      component._formGroup = new FormGroup({
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null)
      });

      component._loadServiceApi();
      expect(component.servizioApi).toEqual(apiResp);
      expect(component._servizioApi).toBeInstanceOf(ServizioApiCreate);
      expect(component._hasSpecifica).toBe(true);
      expect(component._isModify).toBe(true);
    });

    it('should set _hasSpecifica to false when no specifica in response', () => {
      component.id = '10';
      const apiResp = { id_api: '10', configurazione_collaudo: {} };
      mockApiService.getDetails.mockReturnValueOnce(of(apiResp));
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      vi.spyOn(component, '_initForm').mockImplementation(() => {});

      component._formGroup = new FormGroup({
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null)
      });

      component._loadServiceApi();
      expect(component._hasSpecifica).toBe(false);
    });

    it('should call Tools.OnError on api detail error', () => {
      component.id = '10';
      const onErrorSpy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => new Error('api error')));
      component._loadServiceApi();
      expect(onErrorSpy).toHaveBeenCalled();
      // _spin starts at 0, incremented to 1 in the method, decremented to 0 on error
      expect(component._spin).toBe(0);
    });

    it('should broadcast INIT_DATA when service is already set', () => {
      component.id = '10';
      component.service = { id_servizio: '42' };
      const apiResp = { id_api: '10', configurazione_collaudo: {} };
      mockApiService.getDetails.mockReturnValueOnce(of(apiResp));
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      vi.spyOn(component, '_initForm').mockImplementation(() => {});

      component._formGroup = new FormGroup({
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null)
      });

      component._loadServiceApi();
      expect(mockEventsManagerService.broadcast).toHaveBeenCalledWith('INIT_DATA');
    });
  });

  // =========================================================================
  // _initData
  // =========================================================================
  describe('_initData', () => {
    it('should do nothing when service or servizioApi is null', () => {
      component.service = null;
      component.servizioApi = null;
      const changeRuoloSpy = vi.spyOn(component as any, '__changeRuolo');
      component._initData(true);
      expect(changeRuoloSpy).not.toHaveBeenCalled();
    });

    it('should call __changeRuolo and __descrittoreChange when both set', () => {
      component.service = { stato: 'pubblicato' };
      component.servizioApi = {
        ruolo: 'erogato_soggetto_dominio',
        configurazione_collaudo: { specifica: { filename: 'f.wsdl' } },
        gruppi_auth_type: []
      } as any;
      component._formGroup = new FormGroup({
        ruolo: new FormControl('erogato_soggetto_dominio'),
        protocollo: new FormControl('rest'),
        descrittore: new FormControl(''),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        authTypes: new FormArray([]),
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null)
      });
      const changeRuoloSpy = vi.spyOn(component as any, '__changeRuolo').mockImplementation(() => {});
      const descChangeSpy = vi.spyOn(component as any, '__descrittoreChange').mockImplementation(() => {});

      component._initData(true);
      expect(changeRuoloSpy).toHaveBeenCalledWith({ value: 'erogato_soggetto_dominio' }, true);
      expect(descChangeSpy).toHaveBeenCalled();
      expect(component._newDescrittore).toBe(false);
    });
  });

  // =========================================================================
  // _editServizioApi
  // =========================================================================
  describe('_editServizioApi', () => {
    it('should call _initForm and _initData then set _isEdit after timeout', () => {
      vi.useFakeTimers();
      const initFormSpy = vi.spyOn(component, '_initForm').mockImplementation(() => {});
      const initDataSpy = vi.spyOn(component, '_initData').mockImplementation(() => {});
      component._formGroup = new FormGroup({
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null)
      });
      component._isEdit = false;

      component._editServizioApi();
      expect(initFormSpy).toHaveBeenCalled();
      expect(initDataSpy).toHaveBeenCalled();
      expect(component._isEdit).toBe(false);

      vi.advanceTimersByTime(100);
      expect(component._isEdit).toBe(true);
      expect(component._error).toBe(false);
      expect(component.showHistory).toBe(false);
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // _onCancelEdit
  // =========================================================================
  describe('_onCancelEdit', () => {
    it('should navigate to api list when _isNew and _useRoute (no componentBreadcrumbs)', () => {
      component._isNew = true;
      component._useRoute = true;
      component._componentBreadcrumbs = null;
      component.sid = '42';
      component._customAuthOrig = true;

      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._customAuth).toBe(true);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '42', 'api'],
        { queryParamsHandling: 'preserve' }
      );
    });

    it('should navigate to components api list when _isNew, _useRoute and componentBreadcrumbs', () => {
      component._isNew = true;
      component._useRoute = true;
      component._componentBreadcrumbs = { service: { id_servizio: '100' }, breadcrumbs: [] } as any;
      component.sid = '42';

      component._onCancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '100', 'componenti', '42', 'api'],
        { queryParamsHandling: 'preserve' }
      );
    });

    it('should emit close when _isNew and not _useRoute', () => {
      component._isNew = true;
      component._useRoute = false;
      component.id = '10';
      const emitSpy = vi.spyOn(component.close, 'emit');

      component._onCancelEdit();
      expect(emitSpy).toHaveBeenCalledWith({ id: '10', servizioApi: null });
    });

    it('should restore servizioApi from response when not _isNew', () => {
      component._isNew = false;
      component.servizioApiResponse = { id_api: '10', nome: 'Api1', configurazione_collaudo: { specifica: {} } };
      const initFormSpy = vi.spyOn(component, '_initForm').mockImplementation(() => {});
      const initDataSpy = vi.spyOn(component, '_initData').mockImplementation(() => {});

      component._onCancelEdit();
      expect(component.servizioApi).toEqual({ id_api: '10', nome: 'Api1', configurazione_collaudo: { specifica: {} } });
      expect(component._servizioApi).toBeInstanceOf(ServizioApiCreate);
      expect(component._hasSpecifica).toBe(true);
      expect(initFormSpy).toHaveBeenCalled();
      expect(initDataSpy).toHaveBeenCalled();
    });

    it('should set _hasSpecifica to false when no specifica in restored response', () => {
      component._isNew = false;
      component.servizioApiResponse = { id_api: '10', nome: 'Api1', configurazione_collaudo: {} };
      vi.spyOn(component, '_initForm').mockImplementation(() => {});
      vi.spyOn(component, '_initData').mockImplementation(() => {});

      component._onCancelEdit();
      expect(component._hasSpecifica).toBe(false);
    });
  });

  // =========================================================================
  // _onSubmit
  // =========================================================================
  describe('_onSubmit', () => {
    it('should call __onSave when _isNew and form is valid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new FormGroup({ nome: new FormControl('test') });
      const saveSpy = vi.spyOn(component as any, '__onSave').mockImplementation(() => {});

      component._onSubmit({ nome: 'test' }, true);
      expect(saveSpy).toHaveBeenCalledWith({ nome: 'test' });
      expect(component._closeEdit).toBe(true);
    });

    it('should call __onUpdate when not _isNew and form is valid', () => {
      component._isEdit = true;
      component._isNew = false;
      component.servizioApi = { id_api: '10' } as any;
      component._formGroup = new FormGroup({ nome: new FormControl('test') });
      const updateSpy = vi.spyOn(component as any, '__onUpdate').mockImplementation(() => {});

      component._onSubmit({ nome: 'test' }, false);
      expect(updateSpy).toHaveBeenCalledWith('10', { nome: 'test' });
      expect(component._closeEdit).toBe(false);
    });

    it('should not call save/update when form is invalid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new FormGroup({ nome: new FormControl('', Validators.required) });
      const saveSpy = vi.spyOn(component as any, '__onSave');
      const updateSpy = vi.spyOn(component as any, '__onUpdate');

      component._onSubmit({}, true);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should not call save/update when _isEdit is false', () => {
      component._isEdit = false;
      component._formGroup = new FormGroup({ nome: new FormControl('test') });
      const saveSpy = vi.spyOn(component as any, '__onSave');

      component._onSubmit({}, true);
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // __onSave
  // =========================================================================
  describe('__onSave', () => {
    it('should call saveElement and update state on success', () => {
      vi.spyOn(component, '_prepareBodySaveApi').mockReturnValue({ nome: 'A' } as any);
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      const saveSpy = vi.spyOn(component.save, 'emit');
      mockApiService.saveElement.mockReturnValue(of({ id_api: '50', nome: 'A' }));

      (component as any).__onSave({ nome: 'A' });
      expect(mockApiService.saveElement).toHaveBeenCalledWith('api', { nome: 'A' });
      expect(component.id).toBe('50');
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(saveSpy).toHaveBeenCalledWith({ id: '50', api: { id_api: '50', nome: 'A' }, update: false });
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should set error on saveElement failure', () => {
      vi.spyOn(component, '_prepareBodySaveApi').mockReturnValue({} as any);
      mockApiService.saveElement.mockReturnValue(throwError(() => ({ status: 500 })));

      (component as any).__onSave({});
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });
  });

  // =========================================================================
  // __onUpdate
  // =========================================================================
  describe('__onUpdate', () => {
    it('should call putElement and update state on success', () => {
      component.service = { stato: 'pubblicato' };
      vi.spyOn(component, '_prepareBodyUpdateApi').mockReturnValue({ identificativo: { nome: 'A' } } as any);
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      const saveSpy = vi.spyOn(component.save, 'emit');
      mockApiService.putElement.mockReturnValue(of({ id_api: '10', nome: 'A' }));
      component._closeEdit = true;

      (component as any).__onUpdate('10', { nome: 'A' });
      expect(mockApiService.putElement).toHaveBeenCalledWith('api', '10', { identificativo: { nome: 'A' } });
      expect(component.servizioApi).toEqual({ id_api: '10', nome: 'A' });
      expect(component._isEdit).toBe(false);
      expect(component._loaded).toBe(true);
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should keep _isEdit true when _closeEdit is false', () => {
      component.service = { stato: 'pubblicato' };
      vi.spyOn(component, '_prepareBodyUpdateApi').mockReturnValue({} as any);
      vi.spyOn(component, '_initBreadcrumb').mockImplementation(() => {});
      mockApiService.putElement.mockReturnValue(of({ id_api: '10' }));
      component._closeEdit = false;

      (component as any).__onUpdate('10', {});
      expect(component._isEdit).toBe(true);
    });

    it('should set error on putElement failure', () => {
      component.service = { stato: 'pubblicato' };
      vi.spyOn(component, '_prepareBodyUpdateApi').mockReturnValue({} as any);
      mockApiService.putElement.mockReturnValue(throwError(() => ({ error: { errori: [{ msg: 'err1' }] } })));

      (component as any).__onUpdate('10', {});
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._errors).toEqual([{ msg: 'err1' }]);
    });
  });

  // =========================================================================
  // _deleteServiceApi
  // =========================================================================
  describe('_deleteServiceApi', () => {
    it('should navigate to api list on success (no componentBreadcrumbs)', () => {
      component._componentBreadcrumbs = null;
      component.sid = '42';
      component.servizioApi = { id_api: '10' } as any;
      mockApiService.deleteElement.mockReturnValue(of({}));

      component._deleteServiceApi({});
      expect(mockApiService.deleteElement).toHaveBeenCalledWith('api', '10');
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '42', 'api'],
        { queryParamsHandling: 'preserve' }
      );
    });

    it('should navigate to components api list on success (with componentBreadcrumbs)', () => {
      component._componentBreadcrumbs = { service: { id_servizio: '100' }, breadcrumbs: [] } as any;
      component.sid = '42';
      component.servizioApi = { id_api: '10' } as any;
      mockApiService.deleteElement.mockReturnValue(of({}));

      component._deleteServiceApi({});
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '100', 'componenti', '42', 'api'],
        { queryParamsHandling: 'preserve' }
      );
    });

    it('should set error on delete failure', () => {
      component.servizioApi = { id_api: '10' } as any;
      mockApiService.deleteElement.mockReturnValue(throwError(() => ({ error: { errori: [{ msg: 'del err' }] } })));

      component._deleteServiceApi({});
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._errors).toEqual([{ msg: 'del err' }]);
    });
  });

  // =========================================================================
  // _downloadSpecifica
  // =========================================================================
  describe('_downloadSpecifica', () => {
    it('should call apiService.download with specifica/download', () => {
      component.id = '10';
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('spec.wsdl');
      const blob = new Blob(['data']);
      mockApiService.download.mockReturnValue(of({ body: blob, headers: { get: vi.fn() } }));

      component._downloadSpecifica(0);
      expect(mockApiService.download).toHaveBeenCalledWith('api', '10', 'specifica/download', undefined);
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'spec.wsdl');
      expect(component._downloading).toBe(false);
    });

    it('should pass versione as query param when versione > 0', () => {
      component.id = '10';
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('spec.wsdl');
      mockApiService.download.mockReturnValue(of({ body: new Blob(), headers: { get: vi.fn() } }));
      mockUtils._queryToHttpParams.mockReturnValue({ versione: 3 });

      component._downloadSpecifica(3);
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith({ versione: 3 });
      expect(mockApiService.download).toHaveBeenCalledWith('api', '10', 'specifica/download', { versione: 3 });
    });

    it('should set error on download failure', () => {
      component.id = '10';
      mockApiService.download.mockReturnValue(throwError(() => ({ status: 500 })));

      component._downloadSpecifica(0);
      expect(component._error).toBe(true);
      expect(component._downloading).toBe(false);
    });
  });

  // =========================================================================
  // _downloadServizioApiExport
  // =========================================================================
  describe('_downloadServizioApiExport', () => {
    it('should call apiService.download with export path', () => {
      component.id = '10';
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('export.json');
      const blob = new Blob(['data']);
      mockApiService.download.mockReturnValue(of({ body: blob, headers: { get: vi.fn() } }));

      component._downloadServizioApiExport();
      expect(mockApiService.download).toHaveBeenCalledWith('api', '10', 'export');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(blob, 'export.json');
      expect(component._downloading).toBe(false);
    });

    it('should set error on export download failure', () => {
      component.id = '10';
      mockApiService.download.mockReturnValue(throwError(() => ({ status: 500 })));

      component._downloadServizioApiExport();
      expect(component._error).toBe(true);
      expect(component._downloading).toBe(false);
    });
  });

  // =========================================================================
  // _toggleSpecifica
  // =========================================================================
  describe('_toggleSpecifica', () => {
    it('should toggle _hasSpecifica and update validators', () => {
      vi.useFakeTimers();
      component._hasSpecifica = true;
      component._specificaObbligatorio = false;
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_aderente'),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null)
      });
      component._descrittoreCtrl = new FormControl('');

      component._toggleSpecifica();
      expect(component._hasSpecifica).toBe(false);

      vi.advanceTimersByTime(100);
      expect(component._descrittoreCtrl.validator).toBeNull();
      vi.useRealTimers();
    });

    it('should set required validator when toggled back on', () => {
      vi.useFakeTimers();
      component._hasSpecifica = false;
      component._specificaObbligatorio = false;
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_aderente'),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null)
      });
      component._descrittoreCtrl = new FormControl('');

      component._toggleSpecifica();
      expect(component._hasSpecifica).toBe(true);

      vi.advanceTimersByTime(100);
      // After toggle, validator should be set since _hasSpecifica is now true
      component._descrittoreCtrl.setValue('');
      component._descrittoreCtrl.updateValueAndValidity();
      expect(component._descrittoreCtrl.valid).toBe(false);
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // __changeRuolo
  // =========================================================================
  describe('__changeRuolo', () => {
    it('should call __resetGAT and __checkAutenticazione after timeout', () => {
      vi.useFakeTimers();
      component._formGroup = new FormGroup({
        ruolo: new FormControl('erogato_soggetto_aderente'),
        protocollo: new FormControl('rest'),
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null),
        authTypes: new FormArray([])
      });
      component.service = { stato: 'bozza' };
      const resetGATSpy = vi.spyOn(component as any, '__resetGAT').mockImplementation(() => {});
      const checkAuthSpy = vi.spyOn(component as any, '__checkAutenticazione').mockImplementation(() => {});

      (component as any).__changeRuolo({ value: 'erogato_soggetto_aderente' }, false);
      vi.advanceTimersByTime(100);

      expect(resetGATSpy).toHaveBeenCalled();
      expect(checkAuthSpy).toHaveBeenCalledWith('erogato_soggetto_aderente');
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // __checkAutenticazione
  // =========================================================================
  describe('__checkAutenticazione', () => {
    it('should call __checkAmbiente when ruolo is EROGATO_SOGGETTO_DOMINIO', () => {
      component._formGroup = new FormGroup({
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null),
        authTypes: new FormArray([])
      });
      component.service = { stato: 'bozza' };
      const checkAmbSpy = vi.spyOn(component as any, '__checkAmbiente').mockImplementation(() => {});

      (component as any).__checkAutenticazione('erogato_soggetto_dominio');
      expect(checkAmbSpy).toHaveBeenCalled();
    });

    it('should call __disableAmbiente when ruolo is not EROGATO_SOGGETTO_DOMINIO', () => {
      component._formGroup = new FormGroup({
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null),
        authTypes: new FormArray([])
      });
      const disableAmbSpy = vi.spyOn(component as any, '__disableAmbiente').mockImplementation(() => {});

      (component as any).__checkAutenticazione('erogato_soggetto_aderente');
      expect(disableAmbSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // __resetGAT
  // =========================================================================
  describe('__resetGAT', () => {
    it('should reset _risorseSelected and _authSelected', () => {
      component._risorseSelected = ['/r1', '/r2'];
      component._authSelected = ['p1'];
      (component as any).__resetGAT();
      expect(component._risorseSelected).toEqual([]);
      expect(component._authSelected).toEqual([]);
    });
  });

  // =========================================================================
  // __descrittoreChange
  // =========================================================================
  describe('__descrittoreChange', () => {
    it('should patch form controls with value properties', () => {
      component._formGroup = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_aderente')
      });

      const value = { file: 'spec.wsdl', type: 'wsdl', data: 'base64data', uuid: 'uuid-1' };
      (component as any).__descrittoreChange(value);

      expect(component._formGroup.get('filename')!.value).toBe('spec.wsdl');
      expect(component._formGroup.get('estensione')!.value).toBe('wsdl');
      expect(component._formGroup.get('content')!.value).toBe('base64data');
      expect(component._formGroup.get('uuid')!.value).toBe('uuid-1');
    });

    it('should set controls to null when value is null', () => {
      component._formGroup = new FormGroup({
        filename: new FormControl('old'),
        estensione: new FormControl('old'),
        content: new FormControl('old'),
        uuid: new FormControl('old'),
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_aderente')
      });

      (component as any).__descrittoreChange(null);

      expect(component._formGroup.get('filename')!.value).toBeNull();
      expect(component._formGroup.get('estensione')!.value).toBeNull();
      expect(component._formGroup.get('content')!.value).toBeNull();
      expect(component._formGroup.get('uuid')!.value).toBeNull();
    });

    it('should call __loadRisorse when value, protocollo, and EROGATO_SOGGETTO_DOMINIO and not isInit', () => {
      component._formGroup = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_dominio')
      });
      const loadRisorseSpy = vi.spyOn(component as any, '__loadRisorse').mockImplementation(() => {});

      (component as any).__descrittoreChange({ file: 'f', type: 't', data: 'd', uuid: null }, false);
      expect(loadRisorseSpy).toHaveBeenCalled();
    });

    it('should not call __loadRisorse when isInit is true', () => {
      component._formGroup = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_dominio')
      });
      const loadRisorseSpy = vi.spyOn(component as any, '__loadRisorse').mockImplementation(() => {});

      (component as any).__descrittoreChange({ file: 'f', type: 't', data: 'd', uuid: null }, true);
      expect(loadRisorseSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _setAuthsArray
  // =========================================================================
  describe('_setAuthsArray', () => {
    it('should remove and recreate authTypes control', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([])
      });
      const realGroup = new FormGroup({
        profilo: new FormControl('p1', Validators.required),
        resources: new FormControl(['/r'], Validators.required),
        note: new FormControl('')
      });
      const createAuthSpy = vi.spyOn(component as any, '_createAuthGroup').mockReturnValue(realGroup);
      // Mock formBuilder.array to return a real FormArray
      mockFormBuilder.array.mockReturnValue(new FormArray([realGroup]));

      component._setAuthsArray([{ profilo: 'p1', resources: ['/r'], note: '' }]);
      expect(createAuthSpy).toHaveBeenCalledWith({ profilo: 'p1', resources: ['/r'], note: '' });
      expect(component.authTypesArray().length).toBe(1);
    });
  });

  // =========================================================================
  // _removeAuthGroup
  // =========================================================================
  describe('_removeAuthGroup', () => {
    it('should not remove when index < 0', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('p1'), resources: new FormControl(['/r1']) })
        ])
      });
      component._removeAuthGroup(-1);
      expect(component.authTypesArray().length).toBe(1);
    });

    it('should remove auth group at given index and update _risorseSelected', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('p1'), resources: new FormControl(['/r1', '/r2']) }),
          new FormGroup({ profilo: new FormControl('p2'), resources: new FormControl(['/r3']) })
        ])
      });
      component._risorseSelected = ['/r1', '/r2', '/r3'];

      component._removeAuthGroup(0);
      expect(component.authTypesArray().length).toBe(1);
      expect(component._risorseSelected).toEqual(['/r3']);
    });
  });

  // =========================================================================
  // _autoSelectAllResurces
  // =========================================================================
  describe('_autoSelectAllResurces', () => {
    it('should merge resources and call _setAuthsArray', () => {
      component._risorseSelected = ['/r1'];
      const setAuthsSpy = vi.spyOn(component, '_setAuthsArray').mockImplementation(() => {});

      component._autoSelectAllResurces(['/r2', '/r3']);
      expect(component._risorseSelected).toContain('/r1');
      expect(component._risorseSelected).toContain('/r2');
      expect(component._risorseSelected).toContain('/r3');
      expect(setAuthsSpy).toHaveBeenCalledWith([{ profilo: '', resources: ['/r2', '/r3'], note: '' }]);
    });

    it('should do nothing when resource array is empty', () => {
      component._risorseSelected = ['/r1'];
      const setAuthsSpy = vi.spyOn(component, '_setAuthsArray').mockImplementation(() => {});

      component._autoSelectAllResurces([]);
      expect(component._risorseSelected).toEqual(['/r1']);
      expect(setAuthsSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _canAddAuthentication
  // =========================================================================
  describe('_canAddAuthentication', () => {
    it('should return true when risorseSelected < risorseOrig', () => {
      component._risorseSelected = ['/r1'];
      component._risorseOrig = ['/r1', '/r2'];
      expect(component._canAddAuthentication()).toBe(true);
    });

    it('should return false when risorseSelected === risorseOrig length', () => {
      component._risorseSelected = ['/r1', '/r2'];
      component._risorseOrig = ['/r1', '/r2'];
      expect(component._canAddAuthentication()).toBe(false);
    });
  });

  // =========================================================================
  // _initRuoli
  // =========================================================================
  describe('_initRuoli', () => {
    it('should create _ruoli array with translated labels', () => {
      component.service = { dominio: { soggetto_referente: { nome: 'SoggettoTest' } } };
      component._initRuoli();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.ROLE.ErogatoSoggettoDominio.title', { soggetto: 'SoggettoTest' });
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.ROLE.ErogatoSoggettoAderente.title');
      expect(component._ruoli).toHaveLength(2);
      expect(component._ruoli[0].value).toBe('erogato_soggetto_dominio');
      expect(component._ruoli[1].value).toBe('erogato_soggetto_aderente');
    });
  });

  // =========================================================================
  // _initOtherActionMenu
  // =========================================================================
  describe('_initOtherActionMenu', () => {
    it('should create _otherActions array with 4 items', () => {
      component._initOtherActionMenu();
      expect(component._otherActions).toHaveLength(4);
      expect(component._otherActions[0].action).toBe('download_service_api');
      expect(component._otherActions[2].action).toBe('delete');
    });

    it('should set enabled based on canJoin and canAdd', () => {
      mockAuthenticationService.canJoin.mockReturnValue(false);
      mockAuthenticationService.canAdd.mockReturnValue(true);
      component._initOtherActionMenu();
      expect(component._otherActions[0].enabled).toBe(false);
      expect(component._otherActions[2].enabled).toBe(true);
    });
  });

  // =========================================================================
  // ngAfterContentChecked
  // =========================================================================
  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // window.innerWidth in test environment
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // =========================================================================
  // ngOnChanges
  // =========================================================================
  describe('ngOnChanges', () => {
    it('should update id and call _loadAll when id changes', () => {
      const loadAllSpy = vi.spyOn(component, '_loadAll').mockImplementation(() => {});
      component.ngOnChanges({
        id: { currentValue: '20', previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.id).toBe('20');
      expect(loadAllSpy).toHaveBeenCalled();
    });

    it('should update servizioApi and id when service changes', () => {
      component.ngOnChanges({
        service: {
          currentValue: { source: { id_api: '30', nome: 'Api30' } },
          previousValue: null, firstChange: true, isFirstChange: () => true
        }
      } as any);
      expect(component.servizioApi).toEqual({ id_api: '30', nome: 'Api30' });
      expect(component.id).toBe('30');
    });
  });

  // =========================================================================
  // getInvalidFields
  // =========================================================================
  describe('getInvalidFields', () => {
    it('should return names of invalid fields', () => {
      const fg = new FormGroup({
        nome: new FormControl('', Validators.required),
        versione: new FormControl('1'),
        desc: new FormControl(null, Validators.required)
      });
      const result = component.getInvalidFields(fg);
      expect(result).toContain('nome');
      expect(result).toContain('desc');
      expect(result).not.toContain('versione');
    });

    it('should return empty array when all fields are valid', () => {
      const fg = new FormGroup({
        nome: new FormControl('test'),
        versione: new FormControl('1')
      });
      expect(component.getInvalidFields(fg)).toEqual([]);
    });

    it('should handle nested FormGroups', () => {
      const fg = new FormGroup({
        nome: new FormControl('ok'),
        nested: new FormGroup({
          inner: new FormControl('', Validators.required)
        })
      });
      const result = component.getInvalidFields(fg);
      expect(result).toContain('inner');
    });
  });

  // =========================================================================
  // _onResetCustomAuth
  // =========================================================================
  describe('_onResetCustomAuth', () => {
    it('should clear authTypes and auto-select resources when _customAuthAdded is true', () => {
      component._customAuthAdded = true;
      component._risorseOrig = ['/r1', '/r2'];
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('p1'), resources: new FormControl(['/r1']) })
        ])
      });
      const autoSelectSpy = vi.spyOn(component, '_autoSelectAllResurces').mockImplementation(() => {});

      component._onResetCustomAuth();
      expect(component.authTypesArray().length).toBe(0);
      expect(autoSelectSpy).toHaveBeenCalledWith(['/r1', '/r2']);
      expect(component._customAuthAdded).toBe(false);
      expect(component._customAuth).toBe(false);
    });

    it('should only toggle _customAuth when _customAuthAdded is false', () => {
      component._customAuthAdded = false;
      component._customAuth = true;

      component._onResetCustomAuth();
      expect(component._customAuth).toBe(false);
    });
  });

  // =========================================================================
  // _onAddCustomAuth
  // =========================================================================
  describe('_onAddCustomAuth', () => {
    it('should push a new auth group to authTypes array', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([])
      });
      component._profili = [];
      // _createAuthGroup uses formBuilder.group, so we need it
      const mockGroup = new FormGroup({
        profilo: new FormControl('', Validators.required),
        resources: new FormControl([], Validators.required),
        note: new FormControl('')
      });
      vi.spyOn(component as any, '_createAuthGroup').mockReturnValue(mockGroup);

      component._onAddCustomAuth();
      expect(component.authTypesArray().length).toBe(1);
      expect(component._customAuthAdded).toBe(true);
    });
  });

  // =========================================================================
  // _initForm
  // =========================================================================
  describe('_initForm', () => {
    it('should do nothing when data is null', () => {
      const oldFormGroup = component._formGroup;
      component._initForm(null);
      expect(component._formGroup).toBe(oldFormGroup);
    });

    it('should create FormGroup with controls for each key in data', () => {
      component._isNew = false;
      component._codiceAssetObbligatorio = false;
      component._specificaObbligatorio = false;
      component._hasSpecifica = false;
      component.servizioApi = null;
      // Use a real FormBuilder
      (component as any).formBuilder = new FormBuilder();

      const data = {
        nome: 'TestApi',
        ruolo: 'erogato_soggetto_dominio',
        protocollo: 'rest',
        descrizione: 'A description',
        versione: 2,
        codice_asset: 'CA1',
        url_collaudo: null,
        url_produzione: null,
        filename: null,
        estensione: null,
        content: null,
        uuid: null
      };

      component._initForm(data);

      expect(component._formGroup.get('nome')).toBeTruthy();
      expect(component._formGroup.get('nome')!.value).toBe('TestApi');
      expect(component._formGroup.get('ruolo')).toBeTruthy();
      expect(component._formGroup.get('ruolo')!.value).toBe('erogato_soggetto_dominio');
      expect(component._formGroup.get('protocollo')).toBeTruthy();
      expect(component._formGroup.get('versione')).toBeTruthy();
      expect(component._formGroup.get('versione')!.value).toBe(2);
      expect(component._formGroup.get('descrizione')).toBeTruthy();
      expect(component._formGroup.get('codice_asset')).toBeTruthy();
      expect(component._formGroup.get('authTypes')).toBeTruthy();
    });

    it('should set required validator on nome', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ nome: '', ruolo: '', protocollo: '', versione: '', descrizione: '', codice_asset: '' });

      const nomeCtrl = component._formGroup.get('nome')!;
      nomeCtrl.setValue('');
      nomeCtrl.updateValueAndValidity();
      expect(nomeCtrl.valid).toBe(false);

      nomeCtrl.setValue('valid');
      nomeCtrl.updateValueAndValidity();
      expect(nomeCtrl.valid).toBe(true);
    });

    it('should set maxLength(255) on nome', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ nome: 'x' });

      const nomeCtrl = component._formGroup.get('nome')!;
      nomeCtrl.setValue('a'.repeat(256));
      nomeCtrl.updateValueAndValidity();
      expect(nomeCtrl.valid).toBe(false);
    });

    it('should set required validator on ruolo', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ ruolo: '' });

      const ctrl = component._formGroup.get('ruolo')!;
      ctrl.setValue('');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(false);
    });

    it('should set required validator on protocollo when _isNew', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = true;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ protocollo: '' });

      const ctrl = component._formGroup.get('protocollo')!;
      ctrl.setValue('');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(false);
    });

    it('should not set required on protocollo when not _isNew', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ protocollo: '' });

      const ctrl = component._formGroup.get('protocollo')!;
      ctrl.setValue('');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(true);
    });

    it('should set pattern validator on versione (only positive integers)', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ versione: '' });

      const ctrl = component._formGroup.get('versione')!;
      ctrl.setValue('0');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(false);

      ctrl.setValue('abc');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(false);

      ctrl.setValue('3');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(true);
    });

    it('should set maxLength(255) on descrizione', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ descrizione: '' });

      const ctrl = component._formGroup.get('descrizione')!;
      ctrl.setValue('a'.repeat(256));
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(false);
    });

    it('should set required on codice_asset when _codiceAssetObbligatorio is true', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._codiceAssetObbligatorio = true;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ codice_asset: '' });

      const ctrl = component._formGroup.get('codice_asset')!;
      ctrl.setValue('');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(false);
    });

    it('should not set required on codice_asset when _codiceAssetObbligatorio is false', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._codiceAssetObbligatorio = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ codice_asset: '' });

      const ctrl = component._formGroup.get('codice_asset')!;
      ctrl.setValue('');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(true);
    });

    it('should set required on descrittore when _isNew and _specificaObbligatorio', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = true;
      component._specificaObbligatorio = true;
      component._hasSpecifica = false;
      component._descrittoreCtrl = new FormControl('');
      component.servizioApi = null;

      component._initForm({ nome: 'x' });

      component._descrittoreCtrl.setValue('');
      component._descrittoreCtrl.updateValueAndValidity();
      expect(component._descrittoreCtrl.valid).toBe(false);
    });

    it('should set required on descrittore when _isNew and _hasSpecifica', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = true;
      component._specificaObbligatorio = false;
      component._hasSpecifica = true;
      component._descrittoreCtrl = new FormControl('');
      component.servizioApi = null;

      component._initForm({ nome: 'x' });

      component._descrittoreCtrl.setValue('');
      component._descrittoreCtrl.updateValueAndValidity();
      expect(component._descrittoreCtrl.valid).toBe(false);
    });

    it('should handle default case for unknown keys', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ some_unknown_key: 'val' });

      const ctrl = component._formGroup.get('some_unknown_key');
      expect(ctrl).toBeTruthy();
      expect(ctrl!.value).toBe('val');
    });

    it('should set protocollo from servizioApi.configurazione_collaudo.protocollo if present', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = {
        configurazione_collaudo: { protocollo: 'soap' }
      } as any;

      component._initForm({ protocollo: '' });

      expect(component._formGroup.get('protocollo')!.value).toBe('soap');
    });

    it('should use empty string for nome when data value is null', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ nome: null });

      expect(component._formGroup.get('nome')!.value).toBe('');
    });

    it('should use null for descrizione when data value is null', () => {
      (component as any).formBuilder = new FormBuilder();
      component._isNew = false;
      component._hasSpecifica = false;
      component.servizioApi = null;

      component._initForm({ descrizione: null });

      expect(component._formGroup.get('descrizione')!.value).toBeNull();
    });
  });

  // =========================================================================
  // _createAuthGroup
  // =========================================================================
  describe('_createAuthGroup', () => {
    it('should create a FormGroup with profilo, resources, note', () => {
      (component as any).formBuilder = new FormBuilder();
      component._profili = [];

      const result = component._createAuthGroup({
        profilo: 'prof1',
        resources: ['/r1'],
        note: 'some note',
        proprieta_custom: []
      });

      expect(result).toBeInstanceOf(FormGroup);
      expect(result.get('profilo')!.value).toBe('prof1');
      expect(result.get('resources')!.value).toEqual(['/r1']);
      expect(result.get('note')!.value).toBe('some note');
    });

    it('should add customProperties sub-group when profilo has proprieta_custom', () => {
      (component as any).formBuilder = new FormBuilder();
      component._profili = [
        {
          codice_interno: 'profPDND',
          etichetta: 'PDND',
          auth_type: 'pdnd',
          proprieta_custom: [
            { nome: 'id_eservice', required: true, regular_expression: null },
            { nome: 'id_agreement', required: false, regular_expression: '^[0-9]+$' }
          ]
        }
      ];

      const result = component._createAuthGroup({
        profilo: 'profPDND',
        resources: ['/r1'],
        note: '',
        proprieta_custom: [
          { nome: 'id_eservice', valore: 'abc' },
          { nome: 'id_agreement', valore: '123' }
        ]
      });

      const cpGroup = result.get('customProperties') as FormGroup;
      expect(cpGroup).toBeTruthy();
      expect(cpGroup.get('id_eservice')!.value).toBe('abc');
      expect(cpGroup.get('id_agreement')!.value).toBe('123');
    });

    it('should set required validator on customProperties when item.required is true', () => {
      (component as any).formBuilder = new FormBuilder();
      component._profili = [
        {
          codice_interno: 'p1',
          proprieta_custom: [
            { nome: 'field1', required: true }
          ]
        }
      ];

      const result = component._createAuthGroup({
        profilo: 'p1', resources: [], note: '',
        proprieta_custom: []
      });

      const cpGroup = result.get('customProperties') as FormGroup;
      const field1 = cpGroup.get('field1')!;
      field1.setValue('');
      field1.updateValueAndValidity();
      expect(field1.valid).toBe(false);
    });

    it('should set pattern validator when regular_expression is defined', () => {
      (component as any).formBuilder = new FormBuilder();
      component._profili = [
        {
          codice_interno: 'p1',
          proprieta_custom: [
            { nome: 'field1', required: false, regular_expression: '^[0-9]+$' }
          ]
        }
      ];

      const result = component._createAuthGroup({
        profilo: 'p1', resources: [], note: '',
        proprieta_custom: []
      });

      const cpGroup = result.get('customProperties') as FormGroup;
      const field1 = cpGroup.get('field1')!;
      field1.setValue('abc');
      field1.updateValueAndValidity();
      expect(field1.valid).toBe(false);

      field1.setValue('123');
      field1.updateValueAndValidity();
      expect(field1.valid).toBe(true);
    });

    it('should not add customProperties when profilo has no proprieta_custom', () => {
      (component as any).formBuilder = new FormBuilder();
      component._profili = [
        { codice_interno: 'p1', proprieta_custom: [] }
      ];

      const result = component._createAuthGroup({
        profilo: 'p1', resources: [], note: '',
        proprieta_custom: []
      });

      expect(result.get('customProperties')).toBeNull();
    });

    it('should use empty string when proprieta_custom value not found', () => {
      (component as any).formBuilder = new FormBuilder();
      component._profili = [
        {
          codice_interno: 'p1',
          proprieta_custom: [
            { nome: 'missing_field', required: false }
          ]
        }
      ];

      const result = component._createAuthGroup({
        profilo: 'p1', resources: [], note: '',
        proprieta_custom: []
      });

      const cpGroup = result.get('customProperties') as FormGroup;
      expect(cpGroup.get('missing_field')!.value).toBe('');
    });
  });

  // =========================================================================
  // __loadRisorse
  // =========================================================================
  describe('__loadRisorse', () => {
    it('should not call API when no apiType', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl(''),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      mockApiService.saveElement.mockClear();

      (component as any).__loadRisorse();
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });

    it('should not call API when no document and no uuid', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null)
      });
      mockApiService.saveElement.mockClear();

      (component as any).__loadRisorse();
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });

    it('should call API with inline document when content is present', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl('json'),
        content: new FormControl('base64data'),
        uuid: new FormControl(null)
      });
      component.service = { dominio: { nome: 'dom1', soggetto_referente: { nome: 'sogg1' } } };
      component._profili = [];
      component._isNew = false;
      mockApiService.saveElement.mockReturnValue(of(['/r1', '/r2']));

      (component as any).__loadRisorse();

      expect(mockApiService.saveElement).toHaveBeenCalledWith('tools/lista-risorse-api', {
        api_type: 'rest',
        document: { type: 'inline', content_type: 'json', document: 'base64data' }
      });
      expect(component._risorseOrig).toEqual(['/r1', '/r2']);
      expect(component._loadingRisorse).toBe(false);
    });

    it('should call API with uuid document when uuid is present and content is not', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('soap'),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl('uuid-123')
      });
      component.service = { dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._profili = [];
      component._isNew = false;
      mockApiService.saveElement.mockReturnValue(of([]));

      (component as any).__loadRisorse();

      expect(mockApiService.saveElement).toHaveBeenCalledWith('tools/lista-risorse-api', {
        api_type: 'soap',
        document: { type: 'uuid', uuid: 'uuid-123' }
      });
    });

    it('should call _autoSelectAllResurces when _isNew', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      component.service = { dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._profili = [];
      component._isNew = true;
      mockApiService.saveElement.mockReturnValue(of(['/r1']));
      const autoSelectSpy = vi.spyOn(component, '_autoSelectAllResurces').mockImplementation(() => {});

      (component as any).__loadRisorse();

      expect(autoSelectSpy).toHaveBeenCalledWith(['/r1']);
    });

    it('should filter profili by compatibilita', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      component.service = { dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._profili = [
        { codice_interno: 'p1', compatibilita: 'rest' },
        { codice_interno: 'p2', compatibilita: 'soap' },
        { codice_interno: 'p3' } // no compatibilita = compatible with all
      ];
      component._isNew = false;
      mockApiService.saveElement.mockReturnValue(of([]));

      (component as any).__loadRisorse();

      expect(component._profiliFiltered).toHaveLength(2);
      expect(component._profiliFiltered[0].codice_interno).toBe('p1');
      expect(component._profiliFiltered[1].codice_interno).toBe('p3');
    });

    it('should filter profili by domini', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      component.service = { dominio: { nome: 'domA', soggetto_referente: { nome: 's' } } };
      component._profili = [
        { codice_interno: 'p1', domini: ['domA', 'domB'] },
        { codice_interno: 'p2', domini: ['domC'] }
      ];
      component._isNew = false;
      mockApiService.saveElement.mockReturnValue(of([]));

      (component as any).__loadRisorse();

      expect(component._profiliFiltered).toHaveLength(1);
      expect(component._profiliFiltered[0].codice_interno).toBe('p1');
    });

    it('should filter profili by soggetti', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      component.service = { dominio: { nome: 'd', soggetto_referente: { nome: 'soggA' } } };
      component._profili = [
        { codice_interno: 'p1', soggetti: ['soggA'] },
        { codice_interno: 'p2', soggetti: ['soggB'] }
      ];
      component._isNew = false;
      mockApiService.saveElement.mockReturnValue(of([]));

      (component as any).__loadRisorse();

      expect(component._profiliFiltered).toHaveLength(1);
      expect(component._profiliFiltered[0].codice_interno).toBe('p1');
    });

    it('should filter profili by tipo_dominio (interno)', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      component.service = { dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._isDominioEsterno = false;
      component._profili = [
        { codice_interno: 'p1', tipo_dominio: 'interno' },
        { codice_interno: 'p2', tipo_dominio: 'esterno' }
      ];
      component._isNew = false;
      mockApiService.saveElement.mockReturnValue(of([]));

      (component as any).__loadRisorse();

      expect(component._profiliFiltered).toHaveLength(1);
      expect(component._profiliFiltered[0].codice_interno).toBe('p1');
    });

    it('should filter profili by tipo_dominio (esterno)', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      component.service = { dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._isDominioEsterno = true;
      component._profili = [
        { codice_interno: 'p1', tipo_dominio: 'interno' },
        { codice_interno: 'p2', tipo_dominio: 'esterno' }
      ];
      component._isNew = false;
      mockApiService.saveElement.mockReturnValue(of([]));

      (component as any).__loadRisorse();

      expect(component._profiliFiltered).toHaveLength(1);
      expect(component._profiliFiltered[0].codice_interno).toBe('p2');
    });

    it('should set error and reset risorse on API failure', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        estensione: new FormControl(null),
        content: new FormControl('data'),
        uuid: new FormControl(null)
      });
      component._descrittoreCtrl = new FormControl('some value');
      mockApiService.saveElement.mockReturnValue(throwError(() => ({ status: 500 })));

      (component as any).__loadRisorse();

      expect(component._error).toBe(true);
      expect(component._risorse).toEqual([]);
      expect(component._descrittoreCtrl.value).toBe('');
      expect(component._loadingRisorse).toBe(false);
    });
  });

  // =========================================================================
  // _resetProprietaCustom
  // =========================================================================
  describe('_resetProprietaCustom', () => {
    it('should remove proprieta_custom control and clear arrays', () => {
      component._formGroup = new FormGroup({
        proprieta_custom: new FormGroup({ g1: new FormGroup({}) })
      });
      component._apiProprietaCustom = [{ nome: 'x' }];
      component._apiProprietaCustomGrouped = { 'g': [{ nome: 'x' }] };

      component._resetProprietaCustom();

      expect(component._formGroup.get('proprieta_custom')).toBeNull();
      expect(component._apiProprietaCustom).toEqual([]);
      expect(component._apiProprietaCustomGrouped).toEqual([]);
    });
  });

  // =========================================================================
  // _hasPDNDConfiguredMapper (extended)
  // =========================================================================
  describe('_hasPDNDConfiguredMapper (extended)', () => {
    it('should return true when PDNDProduzione_identificativo group has identificativo_eservice_pdnd', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-123' }]
          }
        ]
      } as any;

      expect(component._hasPDNDConfiguredMapper()).toBe(true);
    });

    it('should return true when PDNDCollaudo_identificativo group has identificativo_eservice_pdnd', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-456' }]
          }
        ]
      } as any;

      expect(component._hasPDNDConfiguredMapper()).toBe(true);
    });

    it('should return true with fallback to PDNDProduzione (old convention)', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'val' }]
          }
        ]
      } as any;

      expect(component._hasPDNDConfiguredMapper()).toBe(true);
    });

    it('should return true with fallback to PDNDCollaudo (old convention)', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDCollaudo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'val' }]
          }
        ]
      } as any;

      expect(component._hasPDNDConfiguredMapper()).toBe(true);
    });

    it('should return false when property has empty valore', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: '' }]
          }
        ]
      } as any;

      expect(component._hasPDNDConfiguredMapper()).toBe(false);
    });

    it('should return false when auth_type does not include pdnd', () => {
      component._profili = [{ codice_interno: 'mtlsProf', auth_type: ['mtls'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'mtlsProf', resources: ['/r'], note: '' }],
        proprieta_custom: []
      } as any;

      expect(component._hasPDNDConfiguredMapper()).toBe(false);
    });

    it('should return false when proprieta_custom is empty', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: []
      } as any;

      expect(component._hasPDNDConfiguredMapper()).toBe(false);
    });
  });

  // =========================================================================
  // _canShowPDNDActionsMapper (extended)
  // =========================================================================
  describe('_canShowPDNDActionsMapper (extended)', () => {
    it('should return true when PDND is configured and soggetto matches _pdnd', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'val' }]
          }
        ]
      } as any;
      component.service = { dominio: { soggetto_referente: { nome: 'SoggettoA' } } };
      component._pdnd = [{ nome_soggetto: 'SoggettoA', collaudo: {}, produzione: {} }];

      expect(component._canShowPDNDActionsMapper()).toBe(true);
    });

    it('should return false when soggetto not in _pdnd', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'val' }]
          }
        ]
      } as any;
      component.service = { dominio: { soggetto_referente: { nome: 'SoggettoB' } } };
      component._pdnd = [{ nome_soggetto: 'SoggettoA' }];

      expect(component._canShowPDNDActionsMapper()).toBe(false);
    });

    it('should return false when _pdnd is null', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'val' }]
          }
        ]
      } as any;
      component.service = { dominio: { soggetto_referente: { nome: 'SoggettoA' } } };
      component._pdnd = null;

      expect(component._canShowPDNDActionsMapper()).toBe(false);
    });

    it('should return false when service has no soggetto_referente nome', () => {
      component._profili = [{ codice_interno: 'pdndProf', auth_type: ['pdnd'] }];
      component.servizioApi = {
        gruppi_auth_type: [{ profilo: 'pdndProf', resources: ['/r'], note: '' }],
        proprieta_custom: [
          {
            gruppo: 'PDNDProduzione_identificativo',
            proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'val' }]
          }
        ]
      } as any;
      component.service = { dominio: { soggetto_referente: { nome: '' } } };
      component._pdnd = [{ nome_soggetto: 'SoggettoA' }];

      expect(component._canShowPDNDActionsMapper()).toBe(false);
    });
  });

  // =========================================================================
  // _showPDNDConfiguration
  // =========================================================================
  describe('_showPDNDConfiguration', () => {
    it('should navigate to pdnd-configuration without componentBreadcrumbs', () => {
      component._componentBreadcrumbs = null;
      component.sid = '42';
      component.id = '10';

      component._showPDNDConfiguration();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '42', 'api', '10', 'pdnd-configuration'],
        { queryParams: {}, queryParamsHandling: 'merge' }
      );
    });

    it('should navigate to pdnd-configuration with componentBreadcrumbs', () => {
      component._componentBreadcrumbs = { service: { id_servizio: '100' }, breadcrumbs: [] } as any;
      component.sid = '42';
      component.id = '10';

      component._showPDNDConfiguration();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '100', 'componenti', '42', 'api', '10', 'pdnd-configuration'],
        { queryParams: {}, queryParamsHandling: 'merge' }
      );
    });
  });

  // =========================================================================
  // _showPDND
  // =========================================================================
  describe('_showPDND', () => {
    it('should navigate to subscribers without componentBreadcrumbs', () => {
      component._componentBreadcrumbs = null;
      component.sid = '42';
      component.id = '10';
      component.service = { dominio: { soggetto_referente: { nome: 'SoggA' } } };
      component._pdnd = [
        { nome_soggetto: 'SoggA', collaudo: { id_producer: 'c1' }, produzione: { id_producer: 'p1' } }
      ];

      component._showPDND();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '42', 'api', '10', 'subscribers'],
        { queryParams: { producerIdCollaudo: 'c1', producerIdProduzione: 'p1' }, queryParamsHandling: 'merge' }
      );
    });

    it('should navigate to subscribers with componentBreadcrumbs', () => {
      component._componentBreadcrumbs = { service: { id_servizio: '100' }, breadcrumbs: [] } as any;
      component.sid = '42';
      component.id = '10';
      component.service = { dominio: { soggetto_referente: { nome: 'SoggA' } } };
      component._pdnd = [
        { nome_soggetto: 'SoggA', collaudo: { id_producer: 'c1' }, produzione: { id_producer: 'p1' } }
      ];

      component._showPDND();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '100', 'componenti', '42', 'api', '10', 'subscribers'],
        { queryParams: { producerIdCollaudo: 'c1', producerIdProduzione: 'p1' }, queryParamsHandling: 'merge' }
      );
    });

    it('should not navigate when soggetto not found in _pdnd', () => {
      component._componentBreadcrumbs = null;
      component.sid = '42';
      component.id = '10';
      component.service = { dominio: { soggetto_referente: { nome: 'NotFound' } } };
      component._pdnd = [
        { nome_soggetto: 'SoggA', collaudo: { id_producer: 'c1' }, produzione: { id_producer: 'p1' } }
      ];

      component._showPDND();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _showGeneralInformationsPDND
  // =========================================================================
  describe('_showGeneralInformationsPDND', () => {
    it('should navigate to pdnd-informations without componentBreadcrumbs', () => {
      component._componentBreadcrumbs = null;
      component.sid = '42';
      component.id = '10';
      component.service = { dominio: { soggetto_referente: { nome: 'SoggA' } } };
      component._pdnd = [
        { nome_soggetto: 'SoggA', collaudo: { id_producer: 'c1' }, produzione: { id_producer: 'p1' } }
      ];

      component._showGeneralInformationsPDND();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '42', 'api', '10', 'pdnd-informations'],
        { queryParams: { producerIdCollaudo: 'c1', producerIdProduzione: 'p1' }, queryParamsHandling: 'merge' }
      );
    });

    it('should navigate to pdnd-informations with componentBreadcrumbs', () => {
      component._componentBreadcrumbs = { service: { id_servizio: '100' }, breadcrumbs: [] } as any;
      component.sid = '42';
      component.id = '10';
      component.service = { dominio: { soggetto_referente: { nome: 'SoggA' } } };
      component._pdnd = [
        { nome_soggetto: 'SoggA', collaudo: { id_producer: 'c1' }, produzione: { id_producer: 'p1' } }
      ];

      component._showGeneralInformationsPDND();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '100', 'componenti', '42', 'api', '10', 'pdnd-informations'],
        { queryParams: { producerIdCollaudo: 'c1', producerIdProduzione: 'p1' }, queryParamsHandling: 'merge' }
      );
    });

    it('should not navigate when soggetto not found', () => {
      component.service = { dominio: { soggetto_referente: { nome: 'Missing' } } };
      component._pdnd = [{ nome_soggetto: 'SoggA' }];

      component._showGeneralInformationsPDND();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // __protocolloChange
  // =========================================================================
  describe('__protocolloChange', () => {
    it('should call _setAuthsArrayWithoutSpecification when _hasSpecifica is false', () => {
      component._hasSpecifica = false;
      const spy = vi.spyOn(component, '_setAuthsArrayWithoutSpecification' as any).mockImplementation(() => {});
      component._descrittoreCtrl = new FormControl('');

      (component as any).__protocolloChange();

      expect(spy).toHaveBeenCalled();
    });

    it('should reset descrittore and call __resetGAT when descrittore has value', () => {
      component._hasSpecifica = true;
      component._descrittoreCtrl = new FormControl('some-value');
      component._formGroup = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_aderente')
      });
      const resetGATSpy = vi.spyOn(component as any, '__resetGAT').mockImplementation(() => {});

      (component as any).__protocolloChange();

      expect(component._descrittoreCtrl.value).toBe('');
      expect(resetGATSpy).toHaveBeenCalled();
    });

    it('should not reset descrittore when descrittore is empty', () => {
      component._hasSpecifica = true;
      component._descrittoreCtrl = new FormControl('');
      const resetGATSpy = vi.spyOn(component as any, '__resetGAT');

      (component as any).__protocolloChange();

      // __resetGAT should NOT be called from the if branch
      expect(resetGATSpy).not.toHaveBeenCalled();
    });

    it('should call des.reset when des ref exists', () => {
      component._hasSpecifica = true;
      component._descrittoreCtrl = new FormControl('value');
      component._formGroup = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_aderente')
      });
      component.des = { reset: vi.fn() } as any;

      (component as any).__protocolloChange();

      expect(component.des.reset).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _onDescrittoreChange
  // =========================================================================
  describe('_onDescrittoreChange', () => {
    it('should set _newDescrittore to true and call __descrittoreChange', () => {
      component._formGroup = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_aderente')
      });
      const descChangeSpy = vi.spyOn(component as any, '__descrittoreChange').mockImplementation(() => {});

      component._onDescrittoreChange({ file: 'f', type: 't', data: 'd' });

      expect(component._newDescrittore).toBe(true);
      expect(descChangeSpy).toHaveBeenCalledWith({ file: 'f', type: 't', data: 'd' });
    });
  });

  // =========================================================================
  // __checkAmbiente
  // =========================================================================
  describe('__checkAmbiente', () => {
    it('should set mandatory fields as required', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthenticationService._getFieldsMandatory.mockReturnValue(['url_collaudo']);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);
      component._isNew = true;
      component._formGroup = new FormGroup({
        url_collaudo: new FormControl(null),
        url_produzione: new FormControl(null)
      });

      (component as any).__checkAmbiente(component._formGroup.controls);

      const ctrl = component._formGroup.get('url_collaudo')!;
      ctrl.setValue('');
      ctrl.updateValueAndValidity();
      expect(ctrl.valid).toBe(false);
    });

    it('should disable not-modifiable fields when not _isNew', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthenticationService._getFieldsMandatory.mockReturnValue([]);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['url_collaudo']);
      component._isNew = false;
      component._formGroup = new FormGroup({
        url_collaudo: new FormControl('val'),
        url_produzione: new FormControl(null)
      });

      (component as any).__checkAmbiente(component._formGroup.controls);

      expect(component._formGroup.get('url_collaudo')!.disabled).toBe(true);
    });

    it('should not disable fields when _isNew', () => {
      component.service = { stato: 'pubblicato' };
      mockAuthenticationService._getFieldsMandatory.mockReturnValue([]);
      mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['url_collaudo']);
      component._isNew = true;
      component._formGroup = new FormGroup({
        url_collaudo: new FormControl('val'),
        url_produzione: new FormControl(null)
      });

      (component as any).__checkAmbiente(component._formGroup.controls);

      expect(component._formGroup.get('url_collaudo')!.disabled).toBe(false);
    });
  });

  // =========================================================================
  // __disableAmbiente
  // =========================================================================
  describe('__disableAmbiente', () => {
    it('should disable url fields and authTypes', () => {
      component._formGroup = new FormGroup({
        url_produzione: new FormControl('http://prod'),
        url_collaudo: new FormControl('http://coll'),
        authTypes: new FormArray([])
      });

      (component as any).__disableAmbiente(component._formGroup.controls);

      expect(component._formGroup.get('url_produzione')!.value).toBeNull();
      expect(component._formGroup.get('url_produzione')!.disabled).toBe(true);
      expect(component._formGroup.get('url_collaudo')!.value).toBeNull();
      expect(component._formGroup.get('url_collaudo')!.disabled).toBe(true);
      expect(component._formGroup.get('authTypes')!.disabled).toBe(true);
    });
  });

  // =========================================================================
  // __disableUrlFields
  // =========================================================================
  describe('__disableUrlFields', () => {
    it('should set url fields to null and disable them', () => {
      component._formGroup = new FormGroup({
        url_produzione: new FormControl('http://prod'),
        url_collaudo: new FormControl('http://coll')
      });

      (component as any).__disableUrlFields(component._formGroup.controls);

      expect(component._formGroup.get('url_produzione')!.value).toBeNull();
      expect(component._formGroup.get('url_produzione')!.disabled).toBe(true);
      expect(component._formGroup.get('url_collaudo')!.value).toBeNull();
      expect(component._formGroup.get('url_collaudo')!.disabled).toBe(true);
    });
  });

  // =========================================================================
  // _onServiceLoaded
  // =========================================================================
  describe('_onServiceLoaded', () => {
    it('should set _selectedService from event', () => {
      const event = { target: { services: [{ id: 1, nome: 'svc' }] } };
      component._onServiceLoaded(event, 'field');
      expect(component._selectedService).toEqual({ id: 1, nome: 'svc' });
    });
  });

  // =========================================================================
  // _confirmDelection
  // =========================================================================
  describe('_confirmDelection', () => {
    it('should call utils._confirmDelection', () => {
      component._confirmDelection();
      expect(mockUtils._confirmDelection).toHaveBeenCalledWith(null, expect.any(Function));
    });
  });

  // =========================================================================
  // _downloadHistory
  // =========================================================================
  describe('_downloadHistory', () => {
    it('should call _downloadSpecifica with item.versione', () => {
      const spy = vi.spyOn(component, '_downloadSpecifica').mockImplementation(() => {});
      component._downloadHistory({ versione: 5 } as any);
      expect(spy).toHaveBeenCalledWith(5);
    });
  });

  // =========================================================================
  // _loadAll
  // =========================================================================
  describe('_loadAll', () => {
    it('should call _loadServizio and _loadServiceApi', () => {
      const loadServizioSpy = vi.spyOn(component, '_loadServizio').mockImplementation(() => {});
      const loadServiceApiSpy = vi.spyOn(component, '_loadServiceApi').mockImplementation(() => {});

      component._loadAll();

      expect(loadServizioSpy).toHaveBeenCalled();
      expect(loadServiceApiSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _hasControlError
  // =========================================================================
  describe('_hasControlError', () => {
    it('should return true when control has errors and is touched', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl('', Validators.required)
      });
      component._formGroup.get('nome')!.markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl('valid', Validators.required)
      });
      component._formGroup.get('nome')!.markAsTouched();
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control is not touched', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl('', Validators.required)
      });
      expect(component._hasControlError('nome')).toBe(false);
    });
  });

  // =========================================================================
  // f getter
  // =========================================================================
  describe('f getter', () => {
    it('should return formGroup controls', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl('test')
      });
      expect(component.f['nome']).toBeTruthy();
      expect(component.f['nome'].value).toBe('test');
    });
  });

  // =========================================================================
  // __compareWith
  // =========================================================================
  describe('__compareWith', () => {
    it('should return true when el.code matches item.code', () => {
      expect((component as any).__compareWith({ code: 'A' }, { code: 'A' })).toBe(true);
    });

    it('should return false when codes differ', () => {
      expect((component as any).__compareWith({ code: 'A' }, { code: 'B' })).toBe(false);
    });

    it('should return falsy when item is null', () => {
      expect((component as any).__compareWith({ code: 'A' }, null)).toBeFalsy();
    });
  });

  // =========================================================================
  // __onRemove
  // =========================================================================
  describe('__onRemove', () => {
    it('should filter out removed resources and auth', () => {
      component._risorseSelected = ['/r1', '/r2', '/r3'];
      component._authSelected = ['p1', 'p2'];

      (component as any).__onRemove({
        target: { resources: ['/r1', '/r2'], profilo: 'p1' }
      });

      expect(component._risorseSelected).toEqual(['/r3']);
      expect(component._authSelected).toEqual(['p2']);
    });
  });

  // =========================================================================
  // _changeResources
  // =========================================================================
  describe('_changeResources', () => {
    it('should open modal with filtered resources', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({
            profilo: new FormControl('p1'),
            resources: new FormControl(['/r1', '/r2']),
            note: new FormControl('')
          })
        ])
      });
      component._risorseOrig = ['/r1', '/r2', '/r3', '/r4'];
      component._risorseSelected = ['/r1', '/r2', '/r3'];
      const openModalSpy = vi.spyOn(component as any, '_openChoiceModal').mockImplementation(() => {});

      component._changeResources(0);

      // Should include: /r1 (in current), /r2 (in current), /r4 (not selected)
      expect(openModalSpy).toHaveBeenCalledWith(
        ['/r1', '/r2', '/r4'],
        ['/r1', '/r2'],
        0
      );
    });
  });

  // =========================================================================
  // authTypesArray
  // =========================================================================
  describe('authTypesArray', () => {
    it('should return the FormArray from formGroup', () => {
      const arr = new FormArray([]);
      component._formGroup = new FormGroup({ authTypes: arr });
      expect(component.authTypesArray()).toBe(arr);
    });
  });

  // =========================================================================
  // _geControlResourcest
  // =========================================================================
  describe('_geControlResourcest', () => {
    it('should return resources at given index', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('p1'), resources: new FormControl(['/r1']) })
        ])
      });
      expect(component._geControlResourcest(0)).toEqual(['/r1']);
    });
  });

  // =========================================================================
  // _canAddAuthenticationMapper
  // =========================================================================
  describe('_canAddAuthenticationMapper', () => {
    it('should delegate to _canAddAuthentication', () => {
      component._risorseSelected = ['/r1'];
      component._risorseOrig = ['/r1', '/r2'];
      expect(component._canAddAuthenticationMapper()).toBe(true);
    });
  });

  // =========================================================================
  // _getProfiloLabelMapper for profili
  // =========================================================================
  describe('_getProfiloAuthType', () => {
    it('should return auth_type for profilo at index', () => {
      component._profili = [{ codice_interno: 'prof1', auth_type: 'pdnd' }];
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('prof1'), resources: new FormControl([]) })
        ])
      });
      expect(component._getProfiloAuthType(0)).toBe('pdnd');
    });

    it('should return empty string when profilo not found', () => {
      component._profili = [];
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('unknown'), resources: new FormControl([]) })
        ])
      });
      expect(component._getProfiloAuthType(0)).toBe('');
    });
  });

  // =========================================================================
  // _getProfiloProprietaValue
  // =========================================================================
  describe('_getProfiloProprietaValue', () => {
    it('should return profilo value at index', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('myProf'), resources: new FormControl([]) })
        ])
      });
      expect(component._getProfiloProprietaValue(0)).toBe('myProf');
    });
  });

  // =========================================================================
  // _getAllProfileValues
  // =========================================================================
  describe('_getAllProfileValues', () => {
    it('should return all profilo values from authTypes', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('p1'), resources: new FormControl([]) }),
          new FormGroup({ profilo: new FormControl('p2'), resources: new FormControl([]) })
        ])
      });
      expect(component._getAllProfileValues()).toEqual(['p1', 'p2']);
    });

    it('should return empty array when no authTypes', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([])
      });
      expect(component._getAllProfileValues()).toEqual([]);
    });
  });

  // =========================================================================
  // _onChangeProfilo
  // =========================================================================
  describe('_onChangeProfilo', () => {
    it('should call _removeCustomControls, _updateAuthTypesSelected, _initProprietaCustom', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('prof1'), resources: new FormControl([]) })
        ])
      });
      component._profili = [{ codice_interno: 'prof1', auth_type: 'pdnd' }];
      component.service = { stato: 'pubblicato' };
      component._grant = { ruoli: [] } as any;
      Tools.Configurazione = {
        servizio: { api: { profili: [{ codice_interno: 'prof1' }], proprieta_custom: [] } }
      } as any;
      const removeSpy = vi.spyOn(component as any, '_removeCustomControls').mockImplementation(() => {});
      const updateSpy = vi.spyOn(component as any, '_updateAuthTypesSelected').mockImplementation(() => {});
      const initPropSpy = vi.spyOn(component, '_initProprietaCustom' as any).mockImplementation(() => {});

      component._onChangeProfilo({}, 0);

      expect(removeSpy).toHaveBeenCalledWith(0);
      expect(updateSpy).toHaveBeenCalled();
      expect(initPropSpy).toHaveBeenCalled();
    });

    it('should set _isPDND when profilo includes PDND', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('mtls_PDND'), resources: new FormControl([]) })
        ])
      });
      component._profili = [];
      const removeSpy = vi.spyOn(component as any, '_removeCustomControls').mockImplementation(() => {});
      vi.spyOn(component as any, '_updateAuthTypesSelected').mockImplementation(() => {});
      vi.spyOn(component, '_initProprietaCustom' as any).mockImplementation(() => {});

      component._onChangeProfilo({}, 0);

      expect(component._isPDND).toBe(true);
    });

    it('should set _isPDND to false when profilo does not include PDND', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('mtls_only'), resources: new FormControl([]) })
        ])
      });
      component._profili = [];
      vi.spyOn(component as any, '_removeCustomControls').mockImplementation(() => {});
      vi.spyOn(component as any, '_updateAuthTypesSelected').mockImplementation(() => {});
      vi.spyOn(component, '_initProprietaCustom' as any).mockImplementation(() => {});

      component._onChangeProfilo({}, 0);

      expect(component._isPDND).toBe(false);
    });
  });

  // =========================================================================
  // _removeCustomControls
  // =========================================================================
  describe('_removeCustomControls', () => {
    it('should remove customProperties from auth group at index', () => {
      const authGroup = new FormGroup({
        profilo: new FormControl('p1'),
        resources: new FormControl([]),
        customProperties: new FormGroup({ f1: new FormControl('v1') })
      });
      component._formGroup = new FormGroup({
        authTypes: new FormArray([authGroup])
      });

      component._removeCustomControls(0);

      expect(authGroup.get('customProperties')).toBeNull();
    });

    it('should not do anything when index < 0', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([])
      });
      component._removeCustomControls(-1);
      // No error thrown
    });
  });

  // =========================================================================
  // _updateAuthTypesSelected
  // =========================================================================
  describe('_updateAuthTypesSelected', () => {
    it('should collect unique auth_types from selected profili', () => {
      component._profili = [
        { codice_interno: 'p1', auth_type: 'pdnd' },
        { codice_interno: 'p2', auth_type: 'mtls' },
        { codice_interno: 'p3', auth_type: 'pdnd' }
      ];
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('p1'), resources: new FormControl([]) }),
          new FormGroup({ profilo: new FormControl('p3'), resources: new FormControl([]) })
        ])
      });

      (component as any)._updateAuthTypesSelected();

      expect(component._authTypesSelected).toEqual(['pdnd']);
    });

    it('should return empty when no match', () => {
      component._profili = [{ codice_interno: 'p1', auth_type: 'pdnd' }];
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({ profilo: new FormControl('unknown'), resources: new FormControl([]) })
        ])
      });

      (component as any)._updateAuthTypesSelected();

      expect(component._authTypesSelected).toEqual([]);
    });
  });

  // =========================================================================
  // _initProfiliFilterred
  // =========================================================================
  describe('_initProfiliFilterred', () => {
    it('should filter profili based on form protocollo and service dominio', () => {
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest')
      });
      component.service = { dominio: { nome: 'dom1', soggetto_referente: { nome: 'sogg1' } } };
      component._isDominioEsterno = false;
      component._profili = [
        { codice_interno: 'p1', compatibilita: 'rest' },
        { codice_interno: 'p2', compatibilita: 'soap' },
        { codice_interno: 'p3' }
      ];

      component._initProfiliFilterred();

      expect(component._profiliFiltered).toHaveLength(2);
    });
  });

  // =========================================================================
  // _setAuthsArrayWithoutSpecification
  // =========================================================================
  describe('_setAuthsArrayWithoutSpecification', () => {
    it('should reset GAT, init profili filtered, and set auth array with dummy resource after timeout', () => {
      vi.useFakeTimers();
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        authTypes: new FormArray([])
      });
      component.service = { dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._profili = [];
      const setAuthsSpy = vi.spyOn(component, '_setAuthsArray').mockImplementation(() => {});

      component._setAuthsArrayWithoutSpecification();

      expect(component._loadingRisorse).toBe(true);
      vi.advanceTimersByTime(0);
      expect(setAuthsSpy).toHaveBeenCalledWith([{ profilo: '', resources: ['/dummy'], note: '' }]);
      expect(component._loadingRisorse).toBe(false);
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // afg, afgc, cfg, cfgc, cfgcName helper methods
  // =========================================================================
  describe('auth form group helpers', () => {
    beforeEach(() => {
      const cpGroup = new FormGroup({
        field1: new FormControl('val1'),
        field2: new FormControl('val2')
      });
      const authGroup = new FormGroup({
        profilo: new FormControl('p1'),
        resources: new FormControl(['/r1']),
        note: new FormControl(''),
        customProperties: cpGroup
      });
      component._formGroup = new FormGroup({
        authTypes: new FormArray([authGroup])
      });
    });

    it('afg should return FormGroup at index', () => {
      const result = component.afg(0);
      expect(result).toBeInstanceOf(FormGroup);
      expect(result.get('profilo')!.value).toBe('p1');
    });

    it('afgc should return controls of FormGroup at index', () => {
      const result = component.afgc(0);
      expect(result['profilo'].value).toBe('p1');
    });

    it('cfg should return customProperties FormGroup', () => {
      const result = component.cfg(0);
      expect(result).toBeInstanceOf(FormGroup);
      expect(result.get('field1')!.value).toBe('val1');
    });

    it('cfgc should return customProperties controls', () => {
      const result = component.cfgc(0);
      expect(result['field1'].value).toBe('val1');
    });

    it('cfgcName should return specific control by name', () => {
      const result = component.cfgcName(0, 'field2');
      expect(result.value).toBe('val2');
    });
  });

  // =========================================================================
  // _hasControlCustomPropertiesError / _hasControlCustomPropertiesValue
  // =========================================================================
  describe('_hasControlCustomPropertiesError and _hasControlCustomPropertiesValue', () => {
    beforeEach(() => {
      const cpGroup = new FormGroup({
        field1: new FormControl('', Validators.required),
        field2: new FormControl('has-value')
      });
      const authGroup = new FormGroup({
        profilo: new FormControl('p1'),
        resources: new FormControl([]),
        customProperties: cpGroup
      });
      component._formGroup = new FormGroup({
        authTypes: new FormArray([authGroup])
      });
    });

    it('should return true when field has errors and is touched', () => {
      const cpGroup = (component.authTypesArray().at(0) as FormGroup).get('customProperties') as FormGroup;
      cpGroup.get('field1')!.markAsTouched();
      expect(component._hasControlCustomPropertiesError('field1', 0)).toBeTruthy();
    });

    it('should return falsy when field is not touched', () => {
      expect(component._hasControlCustomPropertiesError('field1', 0)).toBeFalsy();
    });

    it('should return value for field that has value', () => {
      expect(component._hasControlCustomPropertiesValue('field2', 0)).toBe('has-value');
    });

    it('should return empty string for field with no value', () => {
      expect(component._hasControlCustomPropertiesValue('field1', 0)).toBe('');
    });
  });

  // =========================================================================
  // acfg, acfgc, _hasControlApiCustomPropertiesError, _hasControlApiCustomPropertiesValue
  // =========================================================================
  describe('API custom properties form helpers', () => {
    beforeEach(() => {
      const groupG1 = new FormGroup({
        prop1: new FormControl('', Validators.required),
        prop2: new FormControl('has-val')
      });
      component._formGroup = new FormGroup({
        proprieta_custom: new FormGroup({
          G1: groupG1
        })
      });
    });

    it('acfg should return proprieta_custom FormGroup', () => {
      expect(component.acfg()).toBeInstanceOf(FormGroup);
    });

    it('acfgc should return sub-group by name', () => {
      const result = component.acfgc('G1');
      expect(result).toBeInstanceOf(FormGroup);
      expect(result.get('prop1')).toBeTruthy();
    });

    it('_hasControlApiCustomPropertiesError returns true when error and touched', () => {
      const g1 = (component._formGroup.get('proprieta_custom') as FormGroup).get('G1') as FormGroup;
      g1.get('prop1')!.markAsTouched();
      expect(component._hasControlApiCustomPropertiesError('G1', 'prop1')).toBeTruthy();
    });

    it('_hasControlApiCustomPropertiesValue returns truthy when value present', () => {
      expect(component._hasControlApiCustomPropertiesValue('G1')).toBeTruthy();
    });
  });

  // =========================================================================
  // proprietaCustom getter
  // =========================================================================
  describe('proprietaCustom getter', () => {
    it('should return proprieta_custom FormGroup', () => {
      component._formGroup = new FormGroup({
        proprieta_custom: new FormGroup({ g: new FormGroup({}) })
      });
      expect(component.proprietaCustom).toBeInstanceOf(FormGroup);
    });
  });

  // =========================================================================
  // _hasIdentificativoeServicePDND
  // =========================================================================
  describe('_hasIdentificativoeServicePDND', () => {
    it('should return true when identificativo_eservice_pdnd has value', () => {
      component._formGroup = new FormGroup({
        proprieta_custom: new FormGroup({
          identificativo_eservice_pdnd: new FormControl('some-id')
        })
      });
      // acfg() returns FormGroup with controls including the one we check
      expect(component._hasIdentificativoeServicePDND()).toBe(true);
    });

    it('should return false when acfg returns null', () => {
      component._formGroup = new FormGroup({});
      expect(component._hasIdentificativoeServicePDND()).toBe(false);
    });
  });

  // =========================================================================
  // _hasIdentificativoeServicePDNDMapper
  // =========================================================================
  describe('_hasIdentificativoeServicePDNDMapper', () => {
    it('should delegate to _hasIdentificativoeServicePDND', () => {
      const spy = vi.spyOn(component, '_hasIdentificativoeServicePDND').mockReturnValue(true);
      expect(component._hasIdentificativoeServicePDNDMapper()).toBe(true);
      expect(spy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // _getCustomSelectLabelMapper
  // =========================================================================
  describe('_getCustomSelectLabelMapper', () => {
    it('should return etichetta from configurazione proprieta_custom', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: [
              {
                nome_gruppo: 'G1',
                proprieta: [
                  {
                    nome: 'ambiente',
                    valori: [
                      { nome: 'coll', etichetta: 'Collaudo' },
                      { nome: 'prod', etichetta: 'Produzione' }
                    ]
                  }
                ]
              }
            ]
          }
        }
      } as any;

      expect(component._getCustomSelectLabelMapper('coll', 'ambiente', 'G1')).toBe('Collaudo');
    });

    it('should return cod when etichetta not found', () => {
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: [
              {
                nome_gruppo: 'G1',
                proprieta: [
                  {
                    nome: 'campo',
                    valori: [{ nome: 'other', etichetta: 'Other' }]
                  }
                ]
              }
            ]
          }
        }
      } as any;

      expect(component._getCustomSelectLabelMapper('unknown', 'campo', 'G1')).toBe('unknown');
    });
  });

  // =========================================================================
  // _getGroupLabelMapper
  // =========================================================================
  describe('_getGroupLabelMapper', () => {
    it('should return label_gruppo by nome_gruppo', () => {
      component._isNew = false;
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: [
              { nome_gruppo: 'G1', label_gruppo: 'Group Label 1', classe_dato: 'generico' }
            ]
          }
        }
      } as any;

      expect(component._getGroupLabelMapper('G1')).toBe('Group Label 1');
    });

    it('should fallback to searching by label_gruppo', () => {
      component._isNew = false;
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: [
              { nome_gruppo: 'GN_actual', label_gruppo: 'MyLabel', classe_dato: 'generico' }
            ]
          }
        }
      } as any;

      expect(component._getGroupLabelMapper('MyLabel')).toBe('MyLabel');
    });

    it('should filter out produzione classe_dato', () => {
      component._isNew = true;
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: [
              { nome_gruppo: 'G1', label_gruppo: 'Label1', classe_dato: 'produzione' },
              { nome_gruppo: 'G2', label_gruppo: 'Label2', classe_dato: 'generico' }
            ]
          }
        }
      } as any;

      // G1 is filtered out (produzione), so searching for G1 should return undefined
      expect(component._getGroupLabelMapper('G1')).toBeUndefined();
      expect(component._getGroupLabelMapper('G2')).toBe('Label2');
    });

    it('should filter out collaudo when not _isNew', () => {
      component._isNew = false;
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: [
              { nome_gruppo: 'G1', label_gruppo: 'Label1', classe_dato: 'collaudo' },
              { nome_gruppo: 'G2', label_gruppo: 'Label2', classe_dato: 'generico' }
            ]
          }
        }
      } as any;

      expect(component._getGroupLabelMapper('G1')).toBeUndefined();
      expect(component._getGroupLabelMapper('G2')).toBe('Label2');
    });
  });

  // =========================================================================
  // _getGroupNameByLabel
  // =========================================================================
  describe('_getGroupNameByLabel', () => {
    it('should return nome_gruppo from label_gruppo', () => {
      component._isNew = false;
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: [
              { nome_gruppo: 'GN1', label_gruppo: 'Label1', classe_dato: 'generico' }
            ]
          }
        }
      } as any;

      expect(component._getGroupNameByLabel('Label1')).toBe('GN1');
    });

    it('should return group as fallback when not found', () => {
      component._isNew = false;
      Tools.Configurazione = {
        servizio: {
          api: {
            proprieta_custom: []
          }
        }
      } as any;

      expect(component._getGroupNameByLabel('NonExistent')).toBe('NonExistent');
    });
  });

  // =========================================================================
  // _showMandatoryFields
  // =========================================================================
  describe('_showMandatoryFields', () => {
    it('should not log when debugMandatoryFields is false', () => {
      component.debugMandatoryFields = false;
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      component._showMandatoryFields({});
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log when debugMandatoryFields is true', () => {
      component.debugMandatoryFields = true;
      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      component._showMandatoryFields({ nome: new FormControl('', Validators.required) });

      expect(groupSpy).toHaveBeenCalledWith('Mandatory fields');
      expect(logSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();
    });

    it('should log NESSUNO when no required fields', () => {
      component.debugMandatoryFields = true;
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      component._showMandatoryFields({ nome: new FormControl('val') });

      expect(logSpy).toHaveBeenCalledWith('NESSUN CAMPO OBBLIGATORIO');
    });
  });

  // =========================================================================
  // getFieldsStatus
  // =========================================================================
  describe('getFieldsStatus', () => {
    it('should return array of field status strings', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl('test'),
        versione: new FormControl('', Validators.required)
      });

      const result = component.getFieldsStatus();

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('nome');
      expect(result[0]).toContain('true');
      expect(result[1]).toContain('versione');
      expect(result[1]).toContain('false');
    });
  });

  // =========================================================================
  // _openChoiceModal
  // =========================================================================
  describe('_openChoiceModal', () => {
    it('should show modal and subscribe to onClose', () => {
      component._formGroup = new FormGroup({
        authTypes: new FormArray([
          new FormGroup({
            profilo: new FormControl('p1'),
            resources: new FormControl(['/r1'])
          })
        ])
      });
      component._risorseSelected = ['/r1', '/r2'];

      component._openChoiceModal(['/r1', '/r2', '/r3'], ['/r1'], 0);

      expect(mockModalService.show).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ngOnInit
  // =========================================================================
  describe('ngOnInit', () => {
    it('should register INIT_DATA event handler', () => {
      component.ngOnInit();
      expect(mockEventsManagerService.on).toHaveBeenCalledWith('INIT_DATA', expect.any(Function));
    });

    it('should register PROFILE:UPDATE event handler', () => {
      component.ngOnInit();
      expect(mockEventsManagerService.on).toHaveBeenCalledWith('PROFILE:UPDATE', expect.any(Function));
    });
  });

  // =========================================================================
  // constructor with navigation state
  // =========================================================================
  describe('constructor with navigation state', () => {
    it('should set service and grant from navigation extras state', () => {
      // Use EMPTY to avoid triggering _loadServizio subscriptions
const routeWithData = {
        data: of({}),
        params: EMPTY,
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;
      const routerWithState = {
        navigate: vi.fn(),
        getCurrentNavigation: vi.fn().mockReturnValue({
          extras: {
            state: {
              service: { nome: 'FromState', stato: 'bozza' },
              grant: { ruoli: ['admin'] }
            }
          }
        })
      } as any;

      const comp = new (ServizioApiDetailsComponent as any)(
        routeWithData, routerWithState, mockFormBuilder, mockTranslate,
        mockModalService, mockConfigService, mockTools, mockEventsManagerService,
        mockUtilsLib, mockApiService, mockUtils, mockAuthenticationService
      );

      expect(comp.service).toEqual({ nome: 'FromState', stato: 'bozza' });
      expect(comp._grant).toEqual({ ruoli: ['admin'] });
    });

    it('should set _fromDashboard when queryParam from=dashboard', () => {
const routeWithDashboard = {
        data: of({}),
        params: EMPTY,
        queryParams: of({ from: 'dashboard' }),
        parent: { params: of({}) }
      } as any;

      const comp = new (ServizioApiDetailsComponent as any)(
        routeWithDashboard, mockRouter, mockFormBuilder, mockTranslate,
        mockModalService, mockConfigService, mockTools, mockEventsManagerService,
        mockUtilsLib, mockApiService, mockUtils, mockAuthenticationService
      );

      expect(comp._fromDashboard).toBe(true);
    });

    it('should read config flags from Tools.Configurazione', () => {
      Tools.Configurazione = {
        servizio: {
          api_multiple: true,
          adesioni_multiple: true,
          api: {
            auth_type: ['pdnd'],
            profili: [{ codice_interno: 'p1' }],
            codice_asset_obbligatorio: true,
            specifica_obbligatorio: true,
            info_gateway_visualizzate: true,
            proprieta_custom: []
          }
        },
        pdnd: [{ nome_soggetto: 'S1' }]
      } as any;

const safeRoute = {
        data: of({}),
        params: EMPTY,
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;

      const comp = new (ServizioApiDetailsComponent as any)(
        safeRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockModalService, mockConfigService, mockTools, mockEventsManagerService,
        mockUtilsLib, mockApiService, mockUtils, mockAuthenticationService
      );

      expect(comp._apiMultiple).toBe(true);
      expect(comp._adesioniMultiple).toBe(true);
      expect(comp._richiesteEnabled).toBe(true);
      expect(comp._risposteEnabled).toBe(true);
      expect(comp._codiceAssetObbligatorio).toBe(true);
      expect(comp._specificaObbligatorio).toBe(true);
      expect(comp._authTypes).toEqual(['pdnd']);
      expect(comp._profili).toHaveLength(1);
      expect(comp._info_gateway_visualizzate).toBe(true);
      expect(comp._pdnd).toHaveLength(1);
    });

    it('should handle hideVersions from appConfig', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } }
      });

      const safeRoute = {
        data: of({}),
        params: EMPTY,
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;

      const comp = new (ServizioApiDetailsComponent as any)(
        safeRoute, mockRouter, mockFormBuilder, mockTranslate,
        mockModalService, mockConfigService, mockTools, mockEventsManagerService,
        mockUtilsLib, mockApiService, mockUtils, mockAuthenticationService
      );

      expect(comp.hideVersions).toBe(true);
    });

    it('should set _componentBreadcrumbs from route data', () => {
      const bcData = {
        service: { id_servizio: '99' },
        breadcrumbs: [{ label: 'BC' }]
      };
const routeWithBc = {
        data: of({ componentBreadcrumbs: bcData }),
        params: EMPTY,
        queryParams: of({}),
        parent: { params: of({}) }
      } as any;

      const comp = new (ServizioApiDetailsComponent as any)(
        routeWithBc, mockRouter, mockFormBuilder, mockTranslate,
        mockModalService, mockConfigService, mockTools, mockEventsManagerService,
        mockUtilsLib, mockApiService, mockUtils, mockAuthenticationService
      );

      expect(comp._componentBreadcrumbs).toEqual(bcData);
    });
  });

  // =========================================================================
  // _initData (extended)
  // =========================================================================
  describe('_initData (extended)', () => {
    it('should process gruppi_auth_type and set _risorseSelected and _authSelected', () => {
      component.service = { stato: 'pubblicato', dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._profili = [
        { codice_interno: 'prof1', auth_type: ['mtls'] },
        { codice_interno: 'prof2', auth_type: ['pdnd'] }
      ];
      component.servizioApi = {
        ruolo: 'erogato_soggetto_dominio',
        configurazione_collaudo: { specifica: { filename: 'f.wsdl' } },
        gruppi_auth_type: [
          { profilo: 'prof1', resources: ['/r1', '/r2'], note: '' },
          { profilo: 'prof2', resources: ['/r3'], note: '' }
        ]
      } as any;

      component._formGroup = new FormGroup({
        ruolo: new FormControl('erogato_soggetto_dominio'),
        protocollo: new FormControl('rest'),
        descrittore: new FormControl(''),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        authTypes: new FormArray([]),
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null)
      });

      vi.spyOn(component as any, '__changeRuolo').mockImplementation(() => {});
      vi.spyOn(component as any, '__descrittoreChange').mockImplementation(() => {});
      vi.spyOn(component, '_setAuthsArray').mockImplementation(() => {});
      vi.spyOn(component as any, '_updateAuthTypesSelected').mockImplementation(() => {});
      vi.spyOn(component as any, '_initProprietaCustom').mockImplementation(() => {});
      vi.spyOn(component as any, '_initProfiliFilterred').mockImplementation(() => {});

      component._initData(true);

      expect(component._risorseSelected).toContain('/r1');
      expect(component._risorseSelected).toContain('/r2');
      expect(component._risorseSelected).toContain('/r3');
      expect(component._authSelected).toContain('prof1');
      expect(component._authSelected).toContain('prof2');
      expect(component._isPDND).toBe(true); // prof2 has pdnd
    });

    it('should set _customAuthOrig to true when multiple auth groups', () => {
      component.service = { stato: 'pubblicato', dominio: { nome: 'd', soggetto_referente: { nome: 's' } } };
      component._profili = [{ codice_interno: 'p1', auth_type: ['mtls'] }];
      component.servizioApi = {
        ruolo: 'erogato_soggetto_dominio',
        configurazione_collaudo: {},
        gruppi_auth_type: [
          { profilo: 'p1', resources: ['/r1'], note: '' },
          { profilo: 'p1', resources: ['/r2'], note: '' }
        ]
      } as any;
      component._formGroup = new FormGroup({
        ruolo: new FormControl(''),
        protocollo: new FormControl(''),
        descrittore: new FormControl(''),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        authTypes: new FormArray([]),
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null)
      });
      vi.spyOn(component as any, '__changeRuolo').mockImplementation(() => {});
      vi.spyOn(component as any, '__descrittoreChange').mockImplementation(() => {});
      vi.spyOn(component, '_setAuthsArray').mockImplementation(() => {});
      vi.spyOn(component as any, '_updateAuthTypesSelected').mockImplementation(() => {});
      vi.spyOn(component as any, '_initProprietaCustom').mockImplementation(() => {});
      vi.spyOn(component as any, '_initProfiliFilterred').mockImplementation(() => {});

      component._initData(false);

      expect(component._customAuthOrig).toBe(true);
    });
  });

  // =========================================================================
  // __changeRuolo (extended)
  // =========================================================================
  describe('__changeRuolo (extended)', () => {
    it('should call __loadRisorse when protocollo set and EROGATO_SOGGETTO_DOMINIO and not isInit', () => {
      vi.useFakeTimers();
      component._formGroup = new FormGroup({
        ruolo: new FormControl('erogato_soggetto_dominio'),
        protocollo: new FormControl('rest'),
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null),
        authTypes: new FormArray([])
      });
      component.service = { stato: 'bozza' };
      vi.spyOn(component as any, '__resetGAT').mockImplementation(() => {});
      vi.spyOn(component as any, '__checkAutenticazione').mockImplementation(() => {});
      const loadSpy = vi.spyOn(component as any, '__loadRisorse').mockImplementation(() => {});

      (component as any).__changeRuolo({ value: 'erogato_soggetto_dominio' }, false);
      vi.advanceTimersByTime(100);

      expect(loadSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should call _resetProprietaCustom when ruolo is not EROGATO_SOGGETTO_DOMINIO', () => {
      vi.useFakeTimers();
      component._formGroup = new FormGroup({
        ruolo: new FormControl('erogato_soggetto_aderente'),
        protocollo: new FormControl('rest'),
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null),
        authTypes: new FormArray([])
      });
      component.service = { stato: 'bozza' };
      vi.spyOn(component as any, '__resetGAT').mockImplementation(() => {});
      vi.spyOn(component as any, '__checkAutenticazione').mockImplementation(() => {});
      const resetSpy = vi.spyOn(component, '_resetProprietaCustom').mockImplementation(() => {});

      (component as any).__changeRuolo({ value: 'erogato_soggetto_aderente' }, false);
      vi.advanceTimersByTime(100);

      expect(resetSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not call __loadRisorse when isInit is true even for EROGATO_SOGGETTO_DOMINIO', () => {
      vi.useFakeTimers();
      component._formGroup = new FormGroup({
        ruolo: new FormControl('erogato_soggetto_dominio'),
        protocollo: new FormControl('rest'),
        url_produzione: new FormControl(null),
        url_collaudo: new FormControl(null),
        authTypes: new FormArray([])
      });
      component.service = { stato: 'bozza' };
      vi.spyOn(component as any, '__resetGAT').mockImplementation(() => {});
      vi.spyOn(component as any, '__checkAutenticazione').mockImplementation(() => {});
      const loadSpy = vi.spyOn(component as any, '__loadRisorse').mockImplementation(() => {});

      (component as any).__changeRuolo({ value: 'erogato_soggetto_dominio' }, true);
      vi.advanceTimersByTime(100);

      expect(loadSpy).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // _toggleSpecifica (extended)
  // =========================================================================
  describe('_toggleSpecifica (extended)', () => {
    it('should call _setAuthsArrayWithoutSpecification when toggling off and protocollo/dominio set', () => {
      vi.useFakeTimers();
      component._hasSpecifica = true;
      component._specificaObbligatorio = false;
      component._formGroup = new FormGroup({
        protocollo: new FormControl('rest'),
        ruolo: new FormControl('erogato_soggetto_dominio'),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null)
      });
      component._descrittoreCtrl = new FormControl('');
      const spy = vi.spyOn(component, '_setAuthsArrayWithoutSpecification' as any).mockImplementation(() => {});

      component._toggleSpecifica();
      vi.advanceTimersByTime(100);

      expect(spy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // filtraCampiPerRuoli (extended)
  // =========================================================================
  describe('filtraCampiPerRuoli (extended)', () => {
    it('should handle multiple groups', () => {
      const data = {
        'Gruppo1': [
          { nome_gruppo: 'g1', nome: 'c1', ruoli_abilitati: ['admin'] } as any
        ],
        'Gruppo2': [
          { nome_gruppo: 'g2', nome: 'c2', ruoli_abilitati: ['user'] } as any
        ]
      };
      const result = component.filtraCampiPerRuoli(data, ['admin', 'user']);
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle undefined ruoli_abilitati', () => {
      const data = {
        'Gruppo1': [
          { nome_gruppo: 'g1', nome: 'c1' } as any
        ]
      };
      const result = component.filtraCampiPerRuoli(data, []);
      expect(result['Gruppo1']).toHaveLength(1);
    });
  });

  // =========================================================================
  // ServizioApiCreate model
  // =========================================================================
  describe('ServizioApiCreate', () => {
    it('should assign properties from data via hasOwnProperty loop', () => {
      const data = { nome: 'TestApi', versione: 3, id_servizio: 's1', ruolo: 'erogato_soggetto_dominio' };
      const obj = new ServizioApiCreate(data);
      expect(obj.nome).toBe('TestApi');
      expect(obj.versione).toBe(3);
      expect(obj.id_servizio).toBe('s1');
      expect(obj.ruolo).toBe('erogato_soggetto_dominio');
    });

    it('should not assign unknown properties', () => {
      const data = { nome: 'A', unknown_field: 'should be ignored' };
      const obj = new ServizioApiCreate(data);
      expect(obj.nome).toBe('A');
      expect((obj as any).unknown_field).toBeUndefined();
    });

    it('should not overwrite with null/undefined values', () => {
      const obj = new ServizioApiCreate({ nome: null, versione: undefined });
      expect(obj.nome).toBeNull(); // default is null
      expect(obj.versione).toBeNull(); // default is null
    });

    it('should have all default properties as null', () => {
      const obj = new ServizioApiCreate({});
      expect(obj.id_api).toBeNull();
      expect(obj.nome).toBeNull();
      expect(obj.versione).toBeNull();
      expect(obj.id_servizio).toBeNull();
      expect(obj.ruolo).toBeNull();
      expect(obj.protocollo).toBeNull();
      expect(obj.descrizione).toBeNull();
      expect(obj.codice_asset).toBeNull();
      expect(obj.filename).toBeNull();
      expect(obj.estensione).toBeNull();
      expect(obj.content).toBeNull();
      expect(obj.uuid).toBeNull();
      expect(obj.url_produzione).toBeNull();
      expect(obj.url_collaudo).toBeNull();
      expect(obj.proprieta_custom).toBeNull();
      expect(obj.nome_gateway).toBeNull();
      expect(obj.versione_gateway).toBeNull();
    });

    it('should assign all known properties when provided', () => {
      const data = {
        id_api: 'a1', nome: 'Api', versione: 2, id_servizio: 's1',
        ruolo: 'erogato_soggetto_dominio', protocollo: 'rest',
        descrizione: 'desc', codice_asset: 'CA', filename: 'f.json',
        estensione: 'json', content: 'data', uuid: 'u1',
        url_produzione: 'http://p', url_collaudo: 'http://c',
        proprieta_custom: [{ gruppo: 'g1', proprieta: [] }],
        nome_gateway: 'gw', versione_gateway: '1'
      };
      const obj = new ServizioApiCreate(data);
      expect(obj.id_api).toBe('a1');
      expect(obj.nome).toBe('Api');
      expect(obj.versione).toBe(2);
      expect(obj.protocollo).toBe('rest');
      expect(obj.descrizione).toBe('desc');
      expect(obj.codice_asset).toBe('CA');
      expect(obj.filename).toBe('f.json');
      expect(obj.estensione).toBe('json');
      expect(obj.content).toBe('data');
      expect(obj.uuid).toBe('u1');
      expect(obj.url_produzione).toBe('http://p');
      expect(obj.url_collaudo).toBe('http://c');
      expect(obj.proprieta_custom).toHaveLength(1);
      expect(obj.nome_gateway).toBe('gw');
      expect(obj.versione_gateway).toBe('1');
    });

    it('should handle construction without data', () => {
      const obj = new ServizioApiCreate();
      expect(obj.nome).toBeNull();
    });
  });
});
