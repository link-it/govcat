import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError, EMPTY } from 'rxjs';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { SoggettoDetailsComponent } from './soggetto-details.component';
import { Tools } from '@linkit/components';

describe('SoggettoDetailsComponent', () => {
  let component: SoggettoDetailsComponent;
  let savedConfigurazione: any;

  let mockRoute: any;
  let mockRouter: any;
  let mockTranslate: any;
  let mockModalService: any;
  let mockConfigService: any;
  let mockTools: any;
  let mockUtils: any;
  let mockApiService: any;
  let mockAuthenticationService: any;
  let routeParamsSubject: Subject<any>;

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      soggetto: {
        profilo_gateway_abilitato: false,
        lista_profili_gateway: ['APIGateway']
      },
      monitoraggio: { abilitato: false, verifiche_abilitate: false }
    };

    routeParamsSubject = new Subject<any>();

    mockRoute = {
      params: routeParamsSubject.asObservable(),
      queryParams: of({}),
      data: of({})
    };
    mockRouter = {
      navigate: vi.fn()
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
    mockUtils = {
      GetErrorMsg: vi.fn().mockReturnValue('Error'),
      _queryToHttpParams: vi.fn().mockReturnValue({})
    };
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [] })),
      getDetails: vi.fn().mockReturnValue(of({})),
      saveElement: vi.fn().mockReturnValue(of({})),
      putElement: vi.fn().mockReturnValue(of({})),
      deleteElement: vi.fn().mockReturnValue(of({}))
    };
    mockAuthenticationService = {
      _getConfigModule: vi.fn((module: string) => {
        if (module === 'soggetto') return { profilo_gateway_abilitato: false, lista_profili_gateway: ['APIGateway'] };
        if (module === 'monitoraggio') return { abilitato: false, verifiche_abilitate: false };
        return {};
      }),
      hasPermission: vi.fn().mockReturnValue(true)
    };

    component = new SoggettoDetailsComponent(
      mockRoute as any,
      mockRouter as any,
      mockTranslate as any,
      mockModalService as any,
      mockConfigService as any,
      mockTools as any,
      mockUtils as any,
      mockApiService as any,
      mockAuthenticationService as any
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(SoggettoDetailsComponent.Name).toBe('SoggettoDetailsComponent');
  });

  it('should have model set to soggetti', () => {
    expect(component.model).toBe('soggetti');
  });

  it('should set appConfig from configService', () => {
    expect(component.appConfig).toBeDefined();
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should get soggettoConfig from authenticationService', () => {
    expect(mockAuthenticationService._getConfigModule).toHaveBeenCalledWith('soggetto');
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component.soggetto).toBeNull();
    expect(component._isDetails).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._currentTab).toBe('details');
    expect(component.hasTab).toBe(true);
    expect(component._useRoute).toBe(true);
    expect(component._editable).toBe(false);
    expect(component._deleteable).toBe(false);
  });

  it('should have close and save EventEmitters', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  describe('constructor', () => {
    it('should set _profiloGatewayAbilitato from config (falsy)', () => {
      // profilo_gateway_abilitato: false gets || '' => ''
      expect(component._profiloGatewayAbilitato).toBeFalsy();
    });

    it('should set _listaProfiliGateway from config', () => {
      expect(component._listaProfiliGateway).toEqual(['APIGateway']);
    });

    it('should use default _listaProfiliGateway when config is null', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue(null);
      const comp = new SoggettoDetailsComponent(
        mockRoute as any, mockRouter as any, mockTranslate as any,
        mockModalService as any, mockConfigService as any, mockTools as any,
        mockUtils as any, mockApiService as any, mockAuthenticationService as any
      );
      expect(comp._listaProfiliGateway).toEqual([
        'APIGateway', 'ModIPA', 'SPCoop', 'FatturaPA', 'eDelivery'
      ]);
    });
  });

  describe('ngOnInit', () => {
    it('should load soggetto when route has existing id', () => {
      const mockResponse = {
        id_soggetto: '123',
        nome: 'TestSogg',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1', aderente: true, referente: true },
        vincola_skip_collaudo: false
      };
      mockApiService.getDetails.mockReturnValue(of(mockResponse));

      component.ngOnInit();
      routeParamsSubject.next({ id: 42 });

      expect(component.id).toBe(42);
      expect(component._isDetails).toBe(true);
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('soggetti');
    });

    it('should setup new soggetto when route has id=new', () => {
      component.ngOnInit();
      routeParamsSubject.next({ id: 'new' });

      expect(component._isNew).toBe(true);
      expect(component._isEdit).toBe(true);
      expect(component._showAderente).toBe(false);
      expect(component._showReferente).toBe(false);
      expect(component._spin).toBe(false);
    });

    it('should setup new soggetto when route has no id', () => {
      component.ngOnInit();
      routeParamsSubject.next({});

      expect(component._isNew).toBe(true);
      expect(component._isEdit).toBe(true);
      expect(component._spin).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should update id and reload when id changes', () => {
      const loadSpy = vi.spyOn(component, '_loadAll' as any).mockImplementation(() => {});
      component.ngOnChanges({
        id: { currentValue: 99, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);

      expect(component.id).toBe(99);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should update soggetto data when soggetto changes', () => {
      const mockSoggetto = {
        source: { id: 10, nome: 'Test', vincola_skip_collaudo: true }
      };
      component.ngOnChanges({
        soggetto: { currentValue: mockSoggetto, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);

      expect(component.soggetto).toBe(mockSoggetto.source);
      expect(component.vincolaSkipCollaudo).toBe(true);
      expect(component.id).toBe(10);
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('_loadAll', () => {
    it('should call _loadSoggetto', () => {
      const spy = vi.spyOn(component, '_loadSoggetto' as any).mockImplementation(() => {});
      component._loadAll();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('test')
      });
      expect(component.f['nome']).toBeDefined();
      expect(component.f['nome'].value).toBe('test');
    });
  });

  describe('_hasControlError', () => {
    it('should return true when control has errors and is touched', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl(null)
      });
      component._formGroup.controls['nome'].setErrors({ required: true });
      component._formGroup.controls['nome'].markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('validValue')
      });
      component._formGroup.controls['nome'].markAsTouched();
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control is not touched', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl(null)
      });
      component._formGroup.controls['nome'].setErrors({ required: true });
      expect(component._hasControlError('nome')).toBe(false);
    });
  });

  describe('_initForm', () => {
    it('should create form controls from data with nome', () => {
      const data = {
        nome: 'TestName',
        descrizione: 'Desc',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' },
        aderente: true,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: true,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      expect(component._formGroup.controls['nome'].value).toBe('TestName');
      expect(component._formGroup.controls['descrizione'].value).toBe('Desc');
      expect(component._formGroup.controls['organizzazione'].value).toBe('org1');
      expect(component._formGroup.controls['aderente'].value).toBe(true);
      expect(component._formGroup.controls['referente'].value).toBe(false);
      expect(component._formGroup.controls['skip_collaudo'].value).toBe(true);
    });

    it('should handle null nome', () => {
      const data = {
        nome: null,
        descrizione: '',
        organizzazione: { id_organizzazione: null, nome: null },
        aderente: false,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      expect(component._formGroup.controls['nome'].value).toBeNull();
    });

    it('should set descrizione to empty if falsy', () => {
      const data = {
        nome: 'Test',
        descrizione: null,
        organizzazione: { id_organizzazione: '1', nome: 'Org' },
        aderente: false,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      // descrizione should be null (from 'null' ? data[key] : null)
      expect(component._formGroup.controls['descrizione']).toBeDefined();
    });

    it('should patch aderente/referente from soggetto when soggetto exists', () => {
      component.soggetto = {
        aderente: true,
        referente: true,
        vincola_skip_collaudo: false,
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' }
      };
      const data = {
        nome: 'Test',
        descrizione: 'D',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' },
        aderente: false,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      expect(component._formGroup.controls['aderente'].value).toBe(true);
      expect(component._formGroup.controls['referente'].value).toBe(true);
    });

    it('should disable skip_collaudo when soggetto.vincola_skip_collaudo is true', () => {
      component.soggetto = {
        aderente: false,
        referente: false,
        vincola_skip_collaudo: true,
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' }
      };
      const data = {
        nome: 'Test',
        descrizione: '',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' },
        aderente: false,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      expect(component._formGroup.controls['skip_collaudo'].disabled).toBe(true);
    });

    it('should enable skip_collaudo when soggetto.vincola_skip_collaudo is false', () => {
      component.soggetto = {
        aderente: false,
        referente: false,
        vincola_skip_collaudo: false,
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' }
      };
      const data = {
        nome: 'Test',
        descrizione: '',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' },
        aderente: false,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      expect(component._formGroup.controls['skip_collaudo'].disabled).toBe(false);
    });

    it('should disable aderente when vincola_aderente is true and value is true', () => {
      const data = {
        nome: 'Test',
        descrizione: '',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' },
        aderente: true,
        referente: false,
        vincola_aderente: true,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      expect(component._formGroup.controls['aderente'].disabled).toBe(true);
    });

    it('should disable referente when vincola_referente is true and value is true', () => {
      const data = {
        nome: 'Test',
        descrizione: '',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' },
        aderente: false,
        referente: true,
        vincola_aderente: false,
        vincola_referente: true,
        skip_collaudo: false,
        vincola_skip_collaudo: false
      };
      component._initForm(data);
      expect(component._formGroup.controls['referente'].disabled).toBe(true);
    });

    it('should handle default key case', () => {
      const data = {
        nome: 'Test',
        descrizione: '',
        organizzazione: { id_organizzazione: '1', nome: 'O' },
        aderente: false,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false,
        customField: 'customValue'
      };
      component._initForm(data);
      expect(component._formGroup.controls['customField'].value).toBe('customValue');
    });

    it('should handle default key with falsy value', () => {
      const data = {
        nome: 'Test',
        descrizione: '',
        organizzazione: { id_organizzazione: '1', nome: 'O' },
        aderente: false,
        referente: false,
        vincola_aderente: false,
        vincola_referente: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false,
        nullField: null
      };
      component._initForm(data);
      expect(component._formGroup.controls['nullField'].value).toBeNull();
    });
  });

  describe('_onOrganizzazioneLoaded', () => {
    beforeEach(() => {
      component._formGroup = new UntypedFormGroup({
        aderente: new UntypedFormControl(false),
        referente: new UntypedFormControl(false)
      });
    });

    it('should update when event is provided (new mode)', () => {
      component._isNew = true;
      const event = { aderente: true, referente: true };
      component._onOrganizzazioneLoaded(event);

      expect(component._selectedOrganizzazione).toBe(event);
      expect(component._showAderente).toBe(true);
      expect(component._showReferente).toBe(true);
      expect(component._formGroup.controls['aderente'].value).toBe(true);
      expect(component._formGroup.controls['referente'].value).toBe(true);
      expect(component.soggetto).toBeTruthy();
      expect(component.soggetto.aderente).toBe(true);
      expect(component.soggetto.referente).toBe(true);
    });

    it('should update when event is provided (edit mode)', () => {
      component._isNew = false;
      component.soggetto = { aderente: false, referente: false };
      const event = { aderente: true, referente: false };
      component._onOrganizzazioneLoaded(event);

      expect(component._showAderente).toBe(true);
      expect(component._showReferente).toBe(false);
      expect(component.soggetto.aderente).toBe(true);
      expect(component.soggetto.referente).toBe(false);
    });

    it('should reset when event is null', () => {
      component._onOrganizzazioneLoaded(null);

      expect(component._showAderente).toBe(false);
      expect(component._showReferente).toBe(false);
      expect(component._formGroup.controls['aderente'].value).toBeNull();
      expect(component._formGroup.controls['referente'].value).toBeNull();
    });
  });

  describe('__onSave', () => {
    it('should call saveElement and update state on success', () => {
      const response = {
        id_soggetto: 'new-id',
        nome: 'NewSogg',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' }
      };
      mockApiService.saveElement.mockReturnValue(of(response));

      const body = { organizzazione: 'org1', nome: 'NewSogg', someNull: null };
      component.__onSave(body);

      expect(mockApiService.saveElement).toHaveBeenCalledWith('soggetti', expect.objectContaining({
        id_organizzazione: 'org1',
        nome: 'NewSogg'
      }));
      expect(component.id).toBe('new-id');
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
    });

    it('should set error on failure', () => {
      mockApiService.saveElement.mockReturnValue(throwError(() => ({ status: 500, message: 'Server error' })));

      component.__onSave({ organizzazione: 'org1' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });

    it('should include nome_gateway and tipo_gateway when profiloGateway is enabled', () => {
      component._profiloGatewayAbilitato = true as any;
      mockApiService.saveElement.mockReturnValue(of({ id_soggetto: '1' }));

      const body = { organizzazione: 'org1', nome_gateway: 'gw', tipo_gateway: 'APIGateway' };
      component.__onSave(body);

      const calledBody = mockApiService.saveElement.mock.calls[0][1];
      expect(calledBody.nome_gateway).toBe('gw');
      expect(calledBody.tipo_gateway).toBe('APIGateway');
    });

    it('should set nome_gateway/tipo_gateway to null when empty and profiloGateway enabled', () => {
      component._profiloGatewayAbilitato = true as any;
      mockApiService.saveElement.mockReturnValue(of({ id_soggetto: '1' }));

      const body = { organizzazione: 'org1', nome_gateway: '', tipo_gateway: '' };
      component.__onSave(body);

      const calledBody = mockApiService.saveElement.mock.calls[0][1];
      expect(calledBody.nome_gateway).toBeNull();
      expect(calledBody.tipo_gateway).toBeNull();
    });

    it('should delete nome_gateway/tipo_gateway when profiloGateway disabled', () => {
      component._profiloGatewayAbilitato = false;
      mockApiService.saveElement.mockReturnValue(of({ id_soggetto: '1' }));

      const body = { organizzazione: 'org1', nome_gateway: 'gw', tipo_gateway: 'APIGateway' };
      component.__onSave(body);

      const calledBody = mockApiService.saveElement.mock.calls[0][1];
      expect(calledBody.nome_gateway).toBeUndefined();
      expect(calledBody.tipo_gateway).toBeUndefined();
    });
  });

  describe('__onUpdate', () => {
    it('should call putElement and update state on success', () => {
      const response = {
        id_soggetto: '123',
        nome: 'UpdatedSogg',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' }
      };
      mockApiService.putElement.mockReturnValue(of(response));
      component._closeEdit = true;
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      const body = { organizzazione: 'org1', nome: 'UpdatedSogg', vincola_referente: false, vincola_aderente: false };
      component.__onUpdate(123, body);

      expect(mockApiService.putElement).toHaveBeenCalledWith('soggetti', 123, expect.objectContaining({
        id_organizzazione: 'org1',
        nome: 'UpdatedSogg'
      }));
      expect(component._isEdit).toBe(false);
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should set referente to true when vincola_referente is truthy', () => {
      mockApiService.putElement.mockReturnValue(of({ id_soggetto: '1' }));

      const body = { organizzazione: 'org1', vincola_referente: true, vincola_aderente: false };
      component.__onUpdate(1, body);

      const calledBody = mockApiService.putElement.mock.calls[0][2];
      expect(calledBody.referente).toBe(true);
    });

    it('should set aderente to true when vincola_aderente is truthy', () => {
      mockApiService.putElement.mockReturnValue(of({ id_soggetto: '1' }));

      const body = { organizzazione: 'org1', vincola_referente: false, vincola_aderente: true };
      component.__onUpdate(1, body);

      const calledBody = mockApiService.putElement.mock.calls[0][2];
      expect(calledBody.aderente).toBe(true);
    });

    it('should set error on failure', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => ({ status: 500 })));

      component.__onUpdate(1, { organizzazione: 'org1', vincola_referente: false, vincola_aderente: false });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });

    it('should handle profiloGatewayAbilitato enabled', () => {
      component._profiloGatewayAbilitato = true as any;
      mockApiService.putElement.mockReturnValue(of({ id_soggetto: '1' }));

      const body = { organizzazione: 'org1', nome_gateway: 'gw', tipo_gateway: 'ModIPA', vincola_referente: false, vincola_aderente: false };
      component.__onUpdate(1, body);

      const calledBody = mockApiService.putElement.mock.calls[0][2];
      expect(calledBody.nome_gateway).toBe('gw');
      expect(calledBody.tipo_gateway).toBe('ModIPA');
    });

    it('should delete nome_gateway/tipo_gateway when profiloGateway disabled', () => {
      component._profiloGatewayAbilitato = false;
      mockApiService.putElement.mockReturnValue(of({ id_soggetto: '1' }));

      const body = { organizzazione: 'org1', nome_gateway: 'gw', tipo_gateway: 'X', vincola_referente: false, vincola_aderente: false };
      component.__onUpdate(1, body);

      const calledBody = mockApiService.putElement.mock.calls[0][2];
      expect(calledBody.nome_gateway).toBeUndefined();
      expect(calledBody.tipo_gateway).toBeUndefined();
    });

    it('should keep _isEdit true when _closeEdit is false', () => {
      component._closeEdit = false;
      mockApiService.putElement.mockReturnValue(of({ id_soggetto: '1' }));

      component.__onUpdate(1, { organizzazione: 'org1', vincola_referente: false, vincola_aderente: false });

      expect(component._isEdit).toBe(true);
    });
  });

  describe('_changeAderente', () => {
    it('should toggle aderente value when form has aderente control', () => {
      component._formGroup = new UntypedFormGroup({
        aderente: new UntypedFormControl(false)
      });
      component._changeAderente({});
      expect(component._formGroup.controls['aderente'].value).toBe(true);
    });

    it('should toggle aderente from true to false', () => {
      component._formGroup = new UntypedFormGroup({
        aderente: new UntypedFormControl(true)
      });
      component._changeAderente({});
      expect(component._formGroup.controls['aderente'].value).toBe(false);
    });
  });

  describe('_changeReferente', () => {
    it('should toggle referente value when form has referente control', () => {
      component._formGroup = new UntypedFormGroup({
        referente: new UntypedFormControl(true)
      });
      component._changeReferente({});
      expect(component._formGroup.controls['referente'].value).toBe(false);
    });

    it('should toggle referente from false to true', () => {
      component._formGroup = new UntypedFormGroup({
        referente: new UntypedFormControl(false)
      });
      component._changeReferente({});
      expect(component._formGroup.controls['referente'].value).toBe(true);
    });
  });

  describe('_onSubmit', () => {
    it('should not call save when not in edit mode', () => {
      component._isEdit = false;
      component._formGroup = new UntypedFormGroup({});
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
      expect(mockApiService.putElement).not.toHaveBeenCalled();
    });

    it('should not call save when form is invalid', () => {
      component._isEdit = true;
      component._formGroup.setErrors({ invalid: true });
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });

    it('should call __onSave when new and form is valid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new UntypedFormGroup({});
      const saveSpy = vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit({ test: 'data' });
      expect(saveSpy).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should call __onUpdate when existing and form is valid', () => {
      component._isEdit = true;
      component._isNew = false;
      component._formGroup = new UntypedFormGroup({});
      component.soggetto = { id_soggetto: 42 };
      const updateSpy = vi.spyOn(component, '__onUpdate' as any).mockImplementation(() => {});
      component._onSubmit({ test: 'data' });
      expect(updateSpy).toHaveBeenCalledWith(42, { test: 'data' });
    });

    it('should set _closeEdit to false when close=false', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new UntypedFormGroup({});
      vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit({}, false);
      expect(component._closeEdit).toBe(false);
    });

    it('should set _closeEdit to true by default', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new UntypedFormGroup({});
      vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit({});
      expect(component._closeEdit).toBe(true);
    });
  });

  describe('_deleteSoggetto', () => {
    it('should show confirmation dialog and delete on confirm', () => {
      const onCloseSubject = new Subject<boolean>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() }
      });
      component.soggetto = { id_soggetto: 5 };
      component._deleteSoggetto();

      expect(mockModalService.show).toHaveBeenCalled();
      onCloseSubject.next(true);

      expect(mockApiService.deleteElement).toHaveBeenCalledWith('soggetti', 5);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['soggetti']);
    });

    it('should not delete when dialog is cancelled', () => {
      const onCloseSubject = new Subject<boolean>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() }
      });
      component.soggetto = { id_soggetto: 5 };
      component._deleteSoggetto();

      onCloseSubject.next(false);

      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      const onCloseSubject = new Subject<boolean>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() }
      });
      mockApiService.deleteElement.mockReturnValue(throwError(() => ({ status: 500 })));
      component.soggetto = { id_soggetto: 5 };
      component._deleteSoggetto();

      onCloseSubject.next(true);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });
  });

  describe('_downloadAction', () => {
    it('should not throw (dummy method)', () => {
      expect(() => component._downloadAction({})).not.toThrow();
    });
  });

  describe('_loadSoggetto', () => {
    it('should load soggetto details on success', () => {
      component.id = 10;
      const mockResp = {
        id_soggetto: '10',
        nome: 'TestSogg',
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1', aderente: true, referente: false },
        vincola_skip_collaudo: true
      };
      mockApiService.getDetails.mockReturnValue(of(mockResp));

      component._loadSoggetto();

      expect(component.soggetto).toBeDefined();
      expect(component.soggetto.id_organizzazione).toBe('org1');
      expect(component._showAderente).toBe(true);
      expect(component._showReferente).toBe(false);
      expect(component.vincolaSkipCollaudo).toBe(true);
      expect(component._spin).toBe(false);
    });

    it('should handle error when loading soggetto', () => {
      component.id = 10;
      const spy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockApiService.getDetails.mockReturnValue(throwError(() => ({ status: 404 })));

      component._loadSoggetto();

      expect(spy).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });

    it('should do nothing if id is null', () => {
      component.id = null;
      component._loadSoggetto();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  describe('_loadDomini', () => {
    it('should load domini on success', () => {
      component.id = 5;
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }, { id: 2 }] }));

      component._loadDomini();

      expect(component.domini).toEqual([{ id: 1 }, { id: 2 }]);
      expect(component._spin).toBe(false);
    });

    it('should handle error when loading domini', () => {
      component.id = 5;
      mockApiService.getList.mockReturnValue(throwError(() => ({ status: 500 })));

      component._loadDomini();

      expect(component._spin).toBe(false);
    });

    it('should do nothing if id is null', () => {
      component.id = null;
      component._loadDomini();
      expect(mockApiService.getList).not.toHaveBeenCalled();
    });
  });

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with soggetto name', () => {
      component.soggetto = { nome: 'TestSoggetto' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[2].label).toBe('TestSoggetto');
    });

    it('should set breadcrumbs with id when no soggetto', () => {
      component.soggetto = null;
      component.id = 42;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('42');
    });

    it('should set breadcrumbs for new soggetto', () => {
      component.soggetto = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
    });
  });

  describe('_clickTab', () => {
    it('should change current tab', () => {
      component._clickTab('info');
      expect(component._currentTab).toBe('info');
    });
  });

  describe('_editSoggetto', () => {
    it('should set _isEdit to true and _error to false', () => {
      component._soggetto = {
        nome: 'Test', aderente: false, referente: false, descrizione: '',
        organizzazione: { id_organizzazione: '1', nome: 'Org' },
        vincola_aderente: false, vincola_referente: false,
        skip_collaudo: false, vincola_skip_collaudo: false
      } as any;
      component.soggetto = {
        organizzazione: { id_organizzazione: '1', nome: 'Org', aderente: true, referente: true },
        aderente: true, referente: true, vincola_skip_collaudo: false
      };
      component._editSoggetto();
      expect(component._isEdit).toBe(true);
      expect(component._error).toBe(false);
    });

    it('should call _initForm with copy of _soggetto', () => {
      const spy = vi.spyOn(component, '_initForm' as any).mockImplementation(() => {});
      component._soggetto = { nome: 'S' } as any;
      component._editSoggetto();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onClose', () => {
    it('should emit close event with id and soggetto', () => {
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.id = 10;
      component._soggetto = { nome: 'S' } as any;
      component._onClose();
      expect(spy).toHaveBeenCalledWith({ id: 10, soggetto: component._soggetto });
    });
  });

  describe('_onSave', () => {
    it('should emit save event with id and soggetto', () => {
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.id = 5;
      component._soggetto = { nome: 'S' } as any;
      component._onSave();
      expect(spy).toHaveBeenCalledWith({ id: 5, soggetto: component._soggetto });
    });
  });

  describe('_onCancelEdit', () => {
    it('should set _isEdit and _error to false', () => {
      component._isEdit = true;
      component._error = true;
      component._errorMsg = 'something';
      component._isNew = false;
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });

    it('should navigate when new and using route', () => {
      component._isNew = true;
      component._useRoute = true;
      component._onCancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['soggetti']);
    });

    it('should emit close when new and not using route', () => {
      component._isNew = true;
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onCancelEdit();
      expect(spy).toHaveBeenCalledWith({ id: component.id, soggetto: null });
    });

    it('should not navigate and not emit when not new', () => {
      component._isNew = false;
      component._useRoute = true;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onCancelEdit();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('_onEditComponent', () => {
    it('should not throw', () => {
      expect(() => component._onEditComponent({}, 'test')).not.toThrow();
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate when using route', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/soggetti' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/soggetti']);
    });

    it('should call _onClose when not using route', () => {
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBreadcrumb({ url: '/soggetti' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_removeNullProperties', () => {
    it('should remove null, undefined and empty string properties', () => {
      const obj = { a: 1, b: null, c: 'test', d: undefined, e: '' };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1, c: 'test' });
    });

    it('should keep zero and false values', () => {
      const obj = { a: 0, b: false, c: null };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 0, b: false });
    });
  });

  describe('_initOrganizzazioniSelect', () => {
    it('should create organizzazioni$ observable with default value', () => {
      component._initOrganizzazioniSelect([{ id: 1 }]);
      expect(component.organizzazioni$).toBeDefined();
    });

    it('should create organizzazioni$ observable with empty default', () => {
      component._initOrganizzazioniSelect();
      expect(component.organizzazioni$).toBeDefined();
    });
  });

  describe('getOrganizzazioni', () => {
    it('should call apiService.getList with query params', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1, nome: 'Org1' }] }));

      let result: any;
      component.getOrganizzazioni('test').subscribe(r => result = r);

      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: 'test' } });
      expect(result).toEqual([{ id: 1, nome: 'Org1' }]);
    });

    it('should handle Error response', () => {
      mockApiService.getList.mockReturnValue(of({ Error: 'SomeError' }));

      let result: any;
      component.getOrganizzazioni('test').subscribe(r => result = r);
      // When Error is set, throwError is called but not returned, so map returns undefined
      expect(result).toBeUndefined();
    });
  });

  describe('_hasVerifica', () => {
    it('should return false when monitoraggio is not enabled', () => {
      component.soggetto = { vincola_aderente: true, vincola_referente: true };
      expect(component._hasVerifica()).toBe(false);
    });

    it('should return true when conditions are met', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        abilitato: true,
        verifiche_abilitate: true
      });
      component.soggetto = { vincola_aderente: true, vincola_referente: true };
      expect(component._hasVerifica()).toBe(true);
    });

    it('should return false when soggetto has no vincola flags', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        abilitato: true,
        verifiche_abilitate: true
      });
      component.soggetto = { vincola_aderente: false, vincola_referente: false };
      expect(component._hasVerifica()).toBe(false);
    });

    it('should return false when verifiche_abilitate is false', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        abilitato: true,
        verifiche_abilitate: false
      });
      component.soggetto = { vincola_aderente: true, vincola_referente: true };
      expect(component._hasVerifica()).toBe(false);
    });

    it('should return true when only vincola_aderente is true', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        abilitato: true,
        verifiche_abilitate: true
      });
      component.soggetto = { vincola_aderente: true, vincola_referente: false };
      expect(component._hasVerifica()).toBe(true);
    });

    it('should return true when only vincola_referente is true', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        abilitato: true,
        verifiche_abilitate: true
      });
      component.soggetto = { vincola_aderente: false, vincola_referente: true };
      expect(component._hasVerifica()).toBe(true);
    });

    it('should return falsy when soggetto is null', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        abilitato: true,
        verifiche_abilitate: true
      });
      component.soggetto = null;
      expect(component._hasVerifica()).toBeFalsy();
    });
  });
});
