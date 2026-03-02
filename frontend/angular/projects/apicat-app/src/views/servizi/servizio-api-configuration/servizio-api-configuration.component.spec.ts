import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { UntypedFormGroup } from '@angular/forms';
import { ServizioApiConfigurationComponent } from './servizio-api-configuration.component';

describe('ServizioApiConfigurationComponent', () => {
  let component: ServizioApiConfigurationComponent;

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
    group: vi.fn().mockImplementation(() => new UntypedFormGroup({})),
    array: vi.fn().mockReturnValue([])
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
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

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of(new Blob()))
  } as any;

  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    sortByIndexPreservingOrder: vi.fn().mockImplementation((arr: any[]) => arr),
    sortByFieldPreservingOthers: vi.fn().mockImplementation((arr: any[], _field: string) => arr)
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    canEdit: vi.fn().mockReturnValue(true),
    canEditField: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    _getFieldsMandatory: vi.fn().mockReturnValue([]),
    _getClassesMandatory: vi.fn().mockReturnValue([])
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioApiConfigurationComponent(
      mockRoute,
      mockRouter,
      mockFormBuilder,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtils,
      mockAuthenticationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiConfigurationComponent.Name).toBe('ServizioApiConfigurationComponent');
  });

  it('should have model set to api', () => {
    expect(component.model).toBe('api');
  });

  it('should read config from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.id).toBe(0);
    expect(component.sid).toBeNull();
    expect(component.environmentId).toBe('collaudo');
    expect(component._spin).toBe(true);
    expect(component._isNew).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._downloading).toBe(false);
    expect(component.showHistory).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
    expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
    expect(component.EROGATO_SOGGETTO_DOMINIO).toBe('erogato_soggetto_dominio');
    expect(component.EROGATO_SOGGETTO_ADERENTE).toBe('erogato_soggetto_aderente');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should toggle history on toggleHistorical', () => {
    expect(component.showHistory).toBe(false);
    component.toggleHistorical();
    expect(component.showHistory).toBe(true);
    component.toggleHistorical();
    expect(component.showHistory).toBe(false);
  });

  it('should call canEditField on _canEditFieldMapper', () => {
    component._canEditFieldMapper('protocollo');
    expect(mockAuthenticationService.canEditField).toHaveBeenCalledWith('servizio', 'api', '', 'protocollo', undefined);
  });

  it('should reset edit state flags on _onCancelEdit', () => {
    // _onCancelEdit calls mapApiDetailsToFormValues which requires deep form setup;
    // we verify only the flag-reset path by providing rawData that will trigger
    // the _resetProprietaCustom path with a real FormBuilder.group return.
    // Instead we test the flags are correctly set before the chain throws.
    component._isEdit = true;
    component._error = true;
    component._errorMsg = 'some error';

    // Provide valid rawData so JSON.parse succeeds, but no servizioApi details
    component.rawData = 'null';
    component._onCancelEdit();
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should return empty string from _getEService when no proprieta_custom', () => {
    component.servizioApi = { proprieta_custom: [] } as any;
    expect(component._getEService('collaudo')).toBe('');
  });

  it('should return false from _hasPDNDConfigureddMapper when no proprieta_custom', () => {
    component.servizioApi = { proprieta_custom: [] } as any;
    expect(component._hasPDNDConfigureddMapper('collaudo')).toBe(false);
  });

  it('should have _tipoInterfaccia with soap and rest', () => {
    expect(component._tipoInterfaccia).toEqual([
      { value: 'soap', label: 'APP.INTERFACE.soap' },
      { value: 'rest', label: 'APP.INTERFACE.rest' }
    ]);
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should handle onActionMonitor unknown action', () => {
    mockRouter.navigate.mockClear();
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should check _canEditMapper with isGestore false', () => {
    component.service = { stato: 'bozza' };
    mockAuthenticationService.isGestore.mockReturnValue(false);
    mockAuthenticationService._getClassesMandatory.mockReturnValue([]);
    const result = component._canEditMapper();
    expect(result).toBe(true);
  });

  it('should check _canEditMapper with isGestore true', () => {
    component.service = { stato: 'bozza' };
    mockAuthenticationService.isGestore.mockReturnValue(true);
    const result = component._canEditMapper();
    expect(result).toBe(true);
  });

  it('should check _isGestore', () => {
    mockAuthenticationService.isGestore.mockReturnValue(true);
    expect(component._isGestore()).toBe(true);
  });

  it('should generate custom properties from flat map', () => {
    const definizioni = {
      'Gruppo Label': [
        { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any
      ]
    };
    const formValues = {
      proprieta_custom: {
        'Gruppo Label': { campo1: 'valore1' }
      }
    };
    const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
    expect(result).toEqual([
      { gruppo: 'GruppoA', proprieta: [{ nome: 'campo1', valore: 'valore1' }] }
    ]);
  });

  it('should exclude invalid values in generaApiCustomPropertiesDaFlatMap', () => {
    const definizioni = {
      'Gruppo Label': [
        { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo1' } as any,
        { nome_gruppo: 'GruppoA', label_gruppo: 'Gruppo Label', classe_dato: 'collaudo', nome: 'campo2' } as any
      ]
    };
    const formValues = {
      proprieta_custom: {
        'Gruppo Label': { campo1: '', campo2: 'valore2' }
      }
    };
    const result = component.generaApiCustomPropertiesDaFlatMap(definizioni, formValues);
    expect(result).toEqual([
      { gruppo: 'GruppoA', proprieta: [{ nome: 'campo2', valore: 'valore2' }] }
    ]);
  });

  it('should use sortByIndexPreservingOrderMapper', () => {
    const arr = [{ index: 2 }, { index: 1 }];
    component.sortByIndexPreservingOrderMapper(arr);
    expect(mockUtils.sortByIndexPreservingOrder).toHaveBeenCalledWith(arr);
  });

  it('should use sortByFieldPreservingOthersMapper', () => {
    const arr = [{ name: 'b' }, { name: 'a' }];
    component.sortByFieldPreservingOthersMapper(arr, 'name');
    expect(mockUtils.sortByFieldPreservingOthers).toHaveBeenCalledWith(arr, 'name');
  });
});
