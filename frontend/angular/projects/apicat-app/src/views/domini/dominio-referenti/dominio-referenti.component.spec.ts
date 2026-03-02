import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { DominioReferentiComponent } from './dominio-referenti.component';
import { Tools } from '@linkit/components';

describe('DominioReferentiComponent', () => {
  let component: DominioReferentiComponent;
  let savedConfigurazione: any;

  let mockRoute: any;
  let mockRouter: any;
  let mockModalService: any;
  let mockTranslate: any;
  let mockConfigService: any;
  let mockTools: any;
  let mockEventsManagerService: any;
  let mockApiService: any;
  let mockUtilService: any;

  beforeEach(() => {
    vi.useFakeTimers();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = null;

    mockRoute = {
      params: of({}),
      queryParams: of({}),
      data: of({})
    };
    mockRouter = {
      navigate: vi.fn()
    };
    mockModalService = {
      show: vi.fn()
    };
    mockTranslate = {
      instant: vi.fn((key: string) => key)
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
    mockEventsManagerService = {
      on: vi.fn(),
      broadcast: vi.fn(),
      off: vi.fn()
    };
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [] })),
      getDetails: vi.fn().mockReturnValue(of({})),
      postElementRelated: vi.fn().mockReturnValue(of({})),
      deleteElementRelated: vi.fn().mockReturnValue(of({}))
    };
    mockUtilService = {
      getUtenti: vi.fn().mockReturnValue(of([]))
    };

    component = new DominioReferentiComponent(
      mockRoute as any,
      mockRouter as any,
      mockModalService as any,
      mockTranslate as any,
      mockConfigService as any,
      mockTools as any,
      mockEventsManagerService as any,
      mockApiService as any,
      mockUtilService as any
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(DominioReferentiComponent.Name).toBe('DominioReferentiComponent');
  });

  it('should have model set to domini', () => {
    expect(component.model).toBe('domini');
  });

  it('should set config from configService', () => {
    expect(component.config).toBeDefined();
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have default values', () => {
    expect(component.id).toBe(0);
    expect(component.dominio).toBeNull();
    expect(component.dominioreferenti).toEqual([]);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(false);
    expect(component._spin).toBe(false);
    expect(component._error).toBe(false);
    expect(component._useRoute).toBe(false);
    expect(component._useDialog).toBe(true);
  });

  it('should have initialized _formGroup from _initSearchForm', () => {
    expect(component._formGroup).toBeDefined();
    expect(component._formGroup.controls).toBeDefined();
  });

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with dominio name', () => {
      component.dominio = { nome: 'TestDominio' };
      component.id = 5;
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(4);
      expect(component.breadcrumbs[2].label).toBe('TestDominio');
    });

    it('should set breadcrumbs with id when no dominio', () => {
      component.dominio = null;
      component.id = 5;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('5');
    });

    it('should set breadcrumbs for new when no id or dominio', () => {
      component.dominio = null;
      component.id = 0;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
    });
  });

  describe('_setErrorMessages', () => {
    it('should set error messages when error is true', () => {
      component._setErrorMessages(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set default messages when error is false', () => {
      component._setErrorMessages(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate to the breadcrumb url', () => {
      component.onBreadcrumb({ url: '/domini' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/domini']);
    });
  });

  describe('_onCloseEdit', () => {
    it('should set _isEdit to false', () => {
      component._isEdit = true;
      component._onCloseEdit({});
      expect(component._isEdit).toBe(false);
    });
  });

  describe('_onNew', () => {
    it('should call _addReferente when using dialog', () => {
      component._useDialog = true;
      // _addReferente calls loadAnagrafiche, _initReferentiSelect, _initEditForm, modalService.show
      // Since editTemplate is not set, we just verify it doesn't throw when show is called
      mockModalService.show.mockReturnValue({ content: { onClose: of(null) } });
      // We need editTemplate to be defined
      (component as any).editTemplate = {};
      component._onNew();
      expect(mockModalService.show).toHaveBeenCalled();
    });

    it('should set edit mode when not using dialog', () => {
      component._useDialog = false;
      component._onNew();
      expect(component._editCurrent).toBeNull();
      expect(component._isEdit).toBe(true);
    });
  });

  describe('_onSearch', () => {
    it('should set filter data', () => {
      component.id = 1;
      component._onSearch({ q: 'test' });
      expect(component._filterData).toEqual({ q: 'test' });
    });
  });

  describe('_resetForm', () => {
    it('should reset filter data', () => {
      component.id = 1;
      component._filterData = [{ key: 'val' }] as any;
      component._resetForm();
      expect(component._filterData).toEqual([]);
    });
  });

  describe('_timestampToMoment', () => {
    it('should return Date for truthy value', () => {
      const result = component._timestampToMoment(1000);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for falsy value', () => {
      expect(component._timestampToMoment(0)).toBeNull();
    });
  });

  describe('loadAnagrafiche', () => {
    it('should populate anagrafiche tipo-referente', () => {
      component.loadAnagrafiche();
      expect(component.anagrafiche['tipo-referente']).toBeDefined();
      expect(component.anagrafiche['tipo-referente'].length).toBe(2);
    });
  });

  describe('onChangeTipo', () => {
    it('should set referentiFilter and enable id_utente', () => {
      component._initEditForm();
      component.onChangeTipo({ nome: 'referente', filter: 'referente_servizio,gestore,coordinatore' });
      expect(component.referentiFilter).toBe('referente_servizio,gestore,coordinatore');
      expect(component.referentiTipo).toBe('referente');
      expect(component._editFormGroup.controls.id_utente.enabled).toBe(true);
    });

    it('should handle null event', () => {
      component._initEditForm();
      component.onChangeTipo(null);
      expect(component.referentiFilter).toBeNull();
      expect(component.referentiTipo).toBeNull();
    });
  });

  describe('_initEditForm', () => {
    it('should create form with tipo and id_utente controls', () => {
      component._initEditForm();
      expect(component._editFormGroup.controls.tipo).toBeDefined();
      expect(component._editFormGroup.controls.id_utente).toBeDefined();
      expect(component._editFormGroup.controls.id_utente.disabled).toBe(true);
    });
  });

  describe('_hasControlError', () => {
    it('should return falsy for untouched controls', () => {
      component._initEditForm();
      expect(component._hasControlError('tipo')).toBeFalsy();
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

  describe('__loadMoreData', () => {
    it('should not load when no links.next', () => {
      component._links = null;
      component.__loadMoreData();
      expect(component._preventMultiCall).toBe(false);
    });

    it('should not load when preventMultiCall is true', () => {
      component._links = { next: { href: '/next' } };
      component._preventMultiCall = true;
      const callCount = mockApiService.getDetails.mock.calls.length;
      component.__loadMoreData();
      expect(mockApiService.getDetails.mock.calls.length).toBe(callCount);
    });
  });

  describe('closeModal', () => {
    it('should call hide on modalEditRef', () => {
      (component as any)._modalEditRef = { hide: vi.fn() };
      component.closeModal();
      expect((component as any)._modalEditRef.hide).toHaveBeenCalled();
    });
  });
});
