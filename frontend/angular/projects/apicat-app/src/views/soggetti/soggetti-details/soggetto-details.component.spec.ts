import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject } from 'rxjs';
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

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      soggetto: {
        profilo_gateway_abilitato: false,
        lista_profili_gateway: ['APIGateway']
      },
      monitoraggio: { abilitato: false, verifiche_abilitate: false }
    };

    mockRoute = {
      params: of({}),
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
      expect(spy).toHaveBeenCalled();
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
    it('should not call save when form is invalid', () => {
      component._isEdit = true;
      component._formGroup.setErrors({ invalid: true });
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });
  });

  describe('_removeNullProperties', () => {
    it('should remove null, undefined and empty string properties', () => {
      const obj = { a: 1, b: null, c: 'test', d: undefined, e: '' };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1, c: 'test' });
    });
  });

  describe('_changeAderente', () => {
    it('should toggle aderente value when form has aderente control', () => {
      component._formGroup = new UntypedFormGroup({
        aderente: new UntypedFormControl(false)
      });
      component._changeAderente({});
      expect(component._formGroup.controls.aderente.value).toBe(true);
    });
  });

  describe('_changeReferente', () => {
    it('should toggle referente value when form has referente control', () => {
      component._formGroup = new UntypedFormGroup({
        referente: new UntypedFormControl(true)
      });
      component._changeReferente({});
      expect(component._formGroup.controls.referente.value).toBe(false);
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

  describe('_downloadAction', () => {
    it('should not throw (dummy method)', () => {
      expect(() => component._downloadAction({})).not.toThrow();
    });
  });

  describe('_editSoggetto', () => {
    it('should set _isEdit to true and _error to false', () => {
      // Need soggetto and _soggetto with proper structure for _initForm
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
  });
});
