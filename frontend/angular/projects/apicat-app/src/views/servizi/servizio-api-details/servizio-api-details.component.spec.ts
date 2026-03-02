import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioApiDetailsComponent } from './servizio-api-details.component';

// Provide global saveAs used by the component via declare const
(globalThis as any).saveAs = vi.fn();

describe('ServizioApiDetailsComponent', () => {
  let component: ServizioApiDetailsComponent;

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
});
