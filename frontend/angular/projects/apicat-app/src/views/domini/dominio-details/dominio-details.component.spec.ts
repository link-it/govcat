import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { DominioDetailsComponent } from './dominio-details.component';
import { Dominio } from './dominio';

describe('DominioDetailsComponent', () => {
  let component: DominioDetailsComponent;

  const mockRoute = { params: of({ id: 'new' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockFb = {} as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {} as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getAnagrafiche: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new DominioDetailsComponent(
      mockRoute, mockRouter, mockFb, mockTranslate,
      mockModalService, mockConfigService, mockTools,
      mockEventsManager, mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(DominioDetailsComponent.Name).toBe('DominioDetailsComponent');
  });

  it('should have model set to domini', () => {
    expect(component.model).toBe('domini');
  });

  it('should have default state', () => {
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._currentTab).toBe('details');
  });

  it('should initialize config from configService', () => {
    expect(component.appConfig).toEqual({ AppConfig: {} });
  });

  describe('_initForm', () => {
    it('should create form with controls from data', () => {
      const data = {
        nome: 'Test',
        visibilita: 'pubblico',
        descrizione: 'Desc',
        classi: [],
        soggetto_referente: null,
        deprecato: false,
        skip_collaudo: false,
        tag: null,
      };
      component.dominio = data;
      component._initForm(data);
      expect(component._formGroup.get('nome')?.value).toBe('Test');
      expect(component._formGroup.get('visibilita')?.value).toBe('pubblico');
      expect(component._formGroup.get('descrizione')?.value).toBe('Desc');
    });

    it('should set required validators on nome and visibilita', () => {
      const data = { nome: '', visibilita: null, descrizione: '', classi: [], soggetto_referente: null, deprecato: false, skip_collaudo: false };
      component.dominio = {};
      component._initForm(data);
      expect(component._formGroup.get('nome')?.hasError('required')).toBe(true);
      expect(component._formGroup.get('visibilita')?.hasError('required')).toBe(true);
    });

    it('should make classi required when visibilita is riservato', () => {
      const data = { nome: 'N', visibilita: 'riservato', descrizione: '', classi: [], soggetto_referente: null, deprecato: false, skip_collaudo: false };
      component.dominio = {};
      component._initForm(data);
      expect(component._formGroup.get('classi')?.hasError('required')).toBe(true);
    });

    it('should not require classi when visibilita is pubblico', () => {
      const data = { nome: 'N', visibilita: 'pubblico', descrizione: '', classi: [], soggetto_referente: null, deprecato: false, skip_collaudo: false };
      component.dominio = {};
      component._initForm(data);
      expect(component._formGroup.get('classi')?.hasError('required')).toBeFalsy();
    });
  });

  describe('_hasControlError', () => {
    it('should return false when control has no errors', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('test'),
      });
      expect(component._hasControlError('nome')).toBeFalsy();
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('val'),
      });
      expect(component.f['nome'].value).toBe('val');
    });
  });

  describe('_clickTab', () => {
    it('should set current tab', () => {
      component._clickTab('api');
      expect(component._currentTab).toBe('api');
    });
  });

  describe('_editDominio', () => {
    it('should enable edit mode', () => {
      component._dominio = new Dominio({ nome: 'Test', visibilita: 'pubblico', descrizione: '', classi: [], soggetto_referente: null, deprecato: false, skip_collaudo: false });
      component.dominio = {};
      component._editDominio();
      expect(component._isEdit).toBe(true);
      expect(component._error).toBe(false);
    });
  });

  describe('_onCancelEdit', () => {
    it('should reset edit mode for existing dominio', () => {
      component._isNew = false;
      component.dominio = { nome: 'Original' };
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });

    it('should navigate away when cancelling new dominio', () => {
      component._isNew = true;
      component._useRoute = true;
      component._onCancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['domini']);
    });

    it('should emit close when not using route for new dominio', () => {
      component._isNew = true;
      component._useRoute = false;
      const closeSpy = vi.spyOn(component.close, 'emit');
      component._onCancelEdit();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('_onSubmit', () => {
    it('should not save when form is invalid', () => {
      component._isEdit = true;
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl(null, Validators.required),
      });
      component._onSubmit(component._formGroup.value);
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });
  });

  describe('_removeNullProperties', () => {
    it('should remove null properties from object', () => {
      const obj = { a: 1, b: null, c: 'test', d: null };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1, c: 'test' });
    });
  });

  describe('_isVisibilita', () => {
    it('should return true when visibilita matches', () => {
      component._formGroup = new UntypedFormGroup({
        visibilita: new UntypedFormControl('pubblico'),
      });
      expect(component._isVisibilita('pubblico')).toBe(true);
      expect(component._isVisibilita('privato')).toBe(false);
    });
  });

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with dominio name', () => {
      component.dominio = { nome: 'Test Dom' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[2].label).toBe('Test Dom');
    });

    it('should use id when dominio is null', () => {
      component.dominio = null;
      component.id = 42;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('42');
    });
  });

  describe('_onClose', () => {
    it('should emit close event', () => {
      const closeSpy = vi.spyOn(component.close, 'emit');
      component.id = 1;
      component._dominio = new Dominio({ nome: 'Test' });
      component._onClose();
      expect(closeSpy).toHaveBeenCalledWith({ id: 1, dominio: component._dominio });
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate to url when using route', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/domini' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/domini']);
    });
  });

});
