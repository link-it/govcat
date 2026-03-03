import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
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

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
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
