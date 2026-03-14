import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError, EMPTY } from 'rxjs';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { DominioDetailsComponent } from './dominio-details.component';
import { Dominio } from './dominio';
import { Tools } from '@linkit/components';

describe('DominioDetailsComponent', () => {
  let component: DominioDetailsComponent;
  let paramsSubject: Subject<any>;

  const createMockRoute = () => {
    paramsSubject = new Subject<any>();
    return { params: paramsSubject.asObservable() } as any;
  };

  let mockRoute: any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
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

  let savedConfigurazione: any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});

    mockApiService.getDetails.mockReturnValue(of({ soggetto_referente: { id_soggetto: 0, nome: '' } }));
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });

    mockRoute = createMockRoute();
    component = new DominioDetailsComponent(
      mockRoute, mockRouter,
      mockConfigService, mockTools,
      mockApiService, mockUtils,
      mockTranslate, mockModalService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
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
    expect(component.hasTab).toBe(true);
    expect(component._editable).toBe(false);
    expect(component._deleteable).toBe(false);
    expect(component._closeEdit).toBe(true);
    expect(component._useRoute).toBe(true);
    expect(component.minLengthTerm).toBe(1);
  });

  describe('ngOnInit', () => {
    it('should initialize for new dominio (id=new)', () => {
      component.ngOnInit();
      paramsSubject.next({ id: 'new' });

      expect(mockConfigService.getConfiguration).toHaveBeenCalled();
      expect(mockUtils.getAnagrafiche).toHaveBeenCalledWith(['classi-utente']);
      expect(component._isNew).toBe(true);
      expect(component._isEdit).toBe(true);
      expect(component._spin).toBe(false);
      expect(component._visibilitaEnum).toEqual(['privato', 'pubblico', 'riservato']);
    });

    it('should initialize for existing dominio (id=42)', () => {
      component.ngOnInit();
      paramsSubject.next({ id: 42 });

      expect(component.id).toBe(42);
      expect(component._isDetails).toBe(true);
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('domini');
    });

    it('should load dominio when config is received for existing id', () => {
      const mockResponse = {
        id_dominio: 42,
        nome: 'Test',
        visibilita: 'pubblico',
        descrizione: 'Desc',
        classi: [],
        soggetto_referente: { id_soggetto: 1, nome: 'Sogg1' },
        deprecato: false,
        skip_collaudo: false,
      };
      mockApiService.getDetails.mockReturnValue(of(mockResponse));
      mockConfigService.getConfig.mockReturnValue(of({ test: true }));

      component.ngOnInit();
      paramsSubject.next({ id: 42 });

      expect(mockApiService.getDetails).toHaveBeenCalledWith('domini', 42);
      expect(component.dominio).toEqual(mockResponse);
      expect(component._spin).toBe(false);
    });

    it('should handle no id param (defaults to new)', () => {
      component.ngOnInit();
      paramsSubject.next({});

      expect(component._isNew).toBe(true);
      expect(component._isEdit).toBe(true);
      expect(component._spin).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should update id and reload when id changes', () => {
      vi.spyOn(component, '_loadAll' as any).mockImplementation(() => {});
      component.ngOnChanges({
        id: { currentValue: 99, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.id).toBe(99);
    });

    it('should update dominio when dominio changes', () => {
      const newDominio = { source: { id: 55, nome: 'Changed' } };
      component.ngOnChanges({
        dominio: { currentValue: newDominio, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.dominio).toEqual({ id: 55, nome: 'Changed' });
      expect(component.id).toBe(55);
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(true);

      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(false);
    });
  });

  describe('_loadAll', () => {
    it('should call _loadDominio', () => {
      const spy = vi.spyOn(component, '_loadDominio' as any).mockImplementation(() => {});
      component._loadAll();
      expect(spy).toHaveBeenCalled();
    });
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

    it('should set default descrizione to empty string when missing', () => {
      const data = { nome: 'N', visibilita: 'pubblico', classi: [], soggetto_referente: null, deprecato: false, skip_collaudo: false } as any;
      component.dominio = {};
      component._initForm(data);
      expect(data.descrizione).toBe('');
    });

    it('should handle classi with id_classe_utente mapping', () => {
      const data = {
        nome: 'N',
        visibilita: 'riservato',
        descrizione: '',
        classi: [{ id_classe_utente: 'c1' }, { id_classe_utente: 'c2' }],
        soggetto_referente: { id_soggetto: 's1' },
        deprecato: true,
        skip_collaudo: true,
      };
      component.dominio = {};
      component._initForm(data);
      expect(component._formGroup.get('classi')?.value).toEqual(['c1', 'c2']);
      expect(component._formGroup.get('soggetto_referente')?.value).toBe('s1');
      expect(component._formGroup.get('deprecato')?.value).toBe(true);
      expect(component._formGroup.get('skip_collaudo')?.value).toBe(true);
    });

    it('should react to visibilita valueChanges and update classi validators', () => {
      const data = {
        nome: 'N',
        visibilita: 'pubblico',
        descrizione: '',
        classi: [],
        soggetto_referente: null,
        deprecato: false,
        skip_collaudo: false,
      };
      component.dominio = {};
      component._initForm(data);

      // Change visibilita to riservato - should make classi required
      component._formGroup.get('visibilita')?.setValue('riservato');
      expect(component._formGroup.get('classi')?.hasError('required')).toBe(true);
      // classi should be reset to []
      expect(component._formGroup.get('classi')?.value).toEqual([]);

      // Change to pubblico - should clear validators
      component._formGroup.get('visibilita')?.setValue('pubblico');
      expect(component._formGroup.get('classi')?.hasError('required')).toBeFalsy();
    });

    it('should call _enableDisableSkipCollaudo with soggetto_referente', () => {
      const spy = vi.spyOn(component as any, '_enableDisableSkipCollaudo').mockImplementation(() => {});
      const data = { nome: 'N', visibilita: 'pubblico', descrizione: '', classi: [], soggetto_referente: { id_soggetto: 's1' }, deprecato: false, skip_collaudo: false };
      component.dominio = {};
      component._initForm(data);
      expect(spy).toHaveBeenCalledWith({ id_soggetto: 's1' });
    });
  });

  describe('_hasControlError', () => {
    it('should return false when control has no errors', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('test'),
      });
      expect(component._hasControlError('nome')).toBeFalsy();
    });

    it('should return true when control has errors and is touched', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl(null, Validators.required),
      });
      component._formGroup.get('nome')?.markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has errors but is not touched', () => {
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl(null, Validators.required),
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
    it('should enable edit mode and reset error', () => {
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
      expect(closeSpy).toHaveBeenCalledWith({ id: component.id, dominio: null });
    });

    it('should create new Dominio from dominio for existing', () => {
      component._isNew = false;
      component.dominio = { nome: 'Original', visibilita: 'pubblico' };
      component._onCancelEdit();
      expect(component._dominio.nome).toBe('Original');
      expect(component._dominio.visibilita).toBe('pubblico');
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
      expect(mockApiService.putElement).not.toHaveBeenCalled();
    });

    it('should not save when not in edit mode', () => {
      component._isEdit = false;
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('valid'),
      });
      component._onSubmit(component._formGroup.value);
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });

    it('should call __onSave for new dominio', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('valid'),
      });
      const spy = vi.spyOn(component as any, '__onSave').mockImplementation(() => {});
      component._onSubmit({ nome: 'valid' });
      expect(spy).toHaveBeenCalledWith({ nome: 'valid' });
    });

    it('should call __onUpdate for existing dominio', () => {
      component._isEdit = true;
      component._isNew = false;
      component.dominio = { id_dominio: 42 };
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('valid'),
      });
      const spy = vi.spyOn(component as any, '__onUpdate').mockImplementation(() => {});
      component._onSubmit({ nome: 'valid' });
      expect(spy).toHaveBeenCalledWith(42, { nome: 'valid' });
    });

    it('should set _closeEdit from close parameter', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new UntypedFormGroup({
        nome: new UntypedFormControl('valid'),
      });
      vi.spyOn(component as any, '__onSave').mockImplementation(() => {});
      component._onSubmit({ nome: 'valid' }, false);
      expect(component._closeEdit).toBe(false);
    });
  });

  describe('__onSave', () => {
    it('should save element and update state on success', () => {
      const response = {
        id_dominio: 10,
        nome: 'Saved',
        visibilita: 'pubblico',
        soggetto_referente: { id_soggetto: 's1', nome: 'Sogg' },
        descrizione: '',
        classi: [],
        deprecato: false,
        skip_collaudo: false,
      };
      mockApiService.saveElement.mockReturnValue(of(response));

      component.__onSave({ nome: 'Saved', soggetto_referente: 's1', nullProp: null });

      expect(mockApiService.saveElement).toHaveBeenCalledWith('domini', expect.objectContaining({
        nome: 'Saved',
        id_soggetto_referente: 's1',
      }));
      expect(component.id).toBe(10);
      expect(component._spin).toBe(false);
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['domini', 10], { replaceUrl: true });
    });

    it('should remove null properties from body before saving', () => {
      mockApiService.saveElement.mockReturnValue(of({ id_dominio: 1, soggetto_referente: null }));
      component.__onSave({ nome: 'Test', soggetto_referente: 'ref1', nullField: null, emptyField: undefined });

      const calledBody = mockApiService.saveElement.mock.calls[0][1];
      expect(calledBody).not.toHaveProperty('nullField');
      // soggetto_referente is deleted and replaced by id_soggetto_referente
      expect(calledBody).not.toHaveProperty('soggetto_referente');
      expect(calledBody.id_soggetto_referente).toBe('ref1');
    });

    it('should handle save error', () => {
      mockApiService.saveElement.mockReturnValue(throwError(() => new Error('Save failed')));

      component.__onSave({ nome: 'Fail', soggetto_referente: 'ref1' });

      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
      expect(mockUtils.GetErrorMsg).toHaveBeenCalled();
      expect(component._errorMsg).toBe('Error');
    });
  });

  describe('__onUpdate', () => {
    it('should update element and emit save on success', () => {
      const response = {
        id_dominio: 42,
        nome: 'Updated',
        visibilita: 'pubblico',
        soggetto_referente: null,
        descrizione: '',
        classi: [],
        deprecato: false,
        skip_collaudo: false,
      };
      mockApiService.putElement.mockReturnValue(of(response));
      const saveSpy = vi.spyOn(component.save, 'emit');
      component._closeEdit = true;

      component.__onUpdate(42, {
        nome: 'Updated',
        visibilita: 'pubblico',
        classi: [],
        soggetto_referente: 'ref1',
        descrizione: '',
        tag: null,
        deprecato: false,
        url_invocazione: null,
        url_prefix_collaudo: null,
        url_prefix_produzione: null,
        skip_collaudo: false,
      });

      expect(mockApiService.putElement).toHaveBeenCalledWith('domini', 42, expect.objectContaining({
        nome: 'Updated',
        id_soggetto_referente: 'ref1',
      }));
      expect(component._isEdit).toBe(false); // _closeEdit is true, so !true = false
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ update: true }));
    });

    it('should keep edit mode when _closeEdit is false', () => {
      const response = { id_dominio: 42, nome: 'U' };
      mockApiService.putElement.mockReturnValue(of(response));
      component._closeEdit = false;

      component.__onUpdate(42, {
        nome: 'U', visibilita: 'p', classi: [], soggetto_referente: 'r',
        descrizione: '', tag: null, deprecato: false,
        url_invocazione: null, url_prefix_collaudo: null, url_prefix_produzione: null,
        skip_collaudo: false,
      });

      expect(component._isEdit).toBe(true); // !false = true
    });

    it('should handle update error', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => new Error('Update failed')));

      component.__onUpdate(42, {
        nome: 'Fail', visibilita: 'p', classi: [], soggetto_referente: 'r',
        descrizione: '', tag: null, deprecato: false,
        url_invocazione: null, url_prefix_collaudo: null, url_prefix_produzione: null,
        skip_collaudo: false,
      });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });
  });

  describe('_deleteDominio', () => {
    it('should show confirmation dialog and delete on confirm', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() },
      });
      component.dominio = { id_dominio: 42 };
      mockApiService.deleteElement.mockReturnValue(of({}));

      component._deleteDominio();

      expect(mockModalService.show).toHaveBeenCalled();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.Attention');

      // Simulate user confirming
      onCloseSubject.next(true);

      expect(mockApiService.deleteElement).toHaveBeenCalledWith('domini', 42);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['domini']);
    });

    it('should not delete on cancel', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() },
      });
      component.dominio = { id_dominio: 42 };

      component._deleteDominio();
      onCloseSubject.next(false);

      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      const onCloseSubject = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() },
      });
      component.dominio = { id_dominio: 42 };
      mockApiService.deleteElement.mockReturnValue(throwError(() => new Error('Delete failed')));

      component._deleteDominio();
      onCloseSubject.next(true);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });
  });

  describe('_downloadAction', () => {
    it('should be a no-op (dummy)', () => {
      expect(() => component._downloadAction({})).not.toThrow();
    });
  });

  describe('_loadDominio', () => {
    it('should load dominio details when id is set', () => {
      const response = {
        id_dominio: 42,
        nome: 'Loaded',
        visibilita: 'pubblico',
        descrizione: 'Desc',
        classi: [],
        soggetto_referente: { id_soggetto: 's1', nome: 'SoggName' },
        deprecato: false,
        skip_collaudo: false,
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component.id = 42;

      component._loadDominio();

      expect(component._spin).toBe(false);
      expect(component.dominio).toEqual(response);
      expect(component._dominio.nome).toBe('Loaded');
    });

    it('should not load when id is null', () => {
      component.id = null;
      mockApiService.getDetails.mockClear();

      component._loadDominio();

      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should handle load error', () => {
      component.id = 99;
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('Load failed')));

      component._loadDominio();

      expect(Tools.OnError).toHaveBeenCalled();
      expect(component._spin).toBe(false);
    });
  });

  describe('_initSoggettiSelect', () => {
    it('should initialize soggetti$ observable with default values', () => {
      component._initSoggettiSelect([{ id_soggetto: 's1', nome: 'Sogg1' }]);
      expect(component.soggetti$).toBeDefined();

      // Subscribe and verify the first emission is the default value
      let result: any[] = [];
      component.soggetti$.subscribe(val => { result = val; });
      expect(result).toEqual([{ id_soggetto: 's1', nome: 'Sogg1' }]);
    });

    it('should initialize with empty default', () => {
      component._initSoggettiSelect([]);
      let result: any[] | undefined;
      component.soggetti$.subscribe(val => { result = val; });
      expect(result).toEqual([]);
    });
  });

  describe('getSoggetti', () => {
    it('should call apiService.getList and map results', () => {
      const mockContent = [{ id_soggetto: 's1', nome: 'Sogg1' }, { id_soggetto: 's2', nome: 'Sogg2' }];
      mockApiService.getList.mockReturnValue(of({ content: mockContent }));

      let result: any[] = [];
      component.getSoggetti('test').subscribe(val => { result = val; });

      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', { params: { q: 'test', referente: true } });
      expect(result).toEqual(mockContent);
    });

    it('should handle error response with Error property', () => {
      mockApiService.getList.mockReturnValue(of({ Error: 'Something failed' }));

      let result: any;
      component.getSoggetti('fail').subscribe(val => { result = val; });

      // When Error is truthy, throwError is called but not returned (it's a bug in the component)
      // The observable completes without emitting in the else branch
      expect(result).toBeUndefined();
    });

    it('should pass null term', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      component.getSoggetti(null).subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', { params: { q: null, referente: true } });
    });
  });

  describe('_enableDisableSkipCollaudo', () => {
    beforeEach(() => {
      component._formGroup = new UntypedFormGroup({
        skip_collaudo: new UntypedFormControl(false),
      });
    });

    it('should enable skip_collaudo when soggetto has skip_collaudo and dominio does not vincola', () => {
      component.dominio = { vincola_skip_collaudo: false };
      component._enableDisableSkipCollaudo({ skip_collaudo: true });
      expect(component._formGroup.get('skip_collaudo')?.enabled).toBe(true);
    });

    it('should disable skip_collaudo when soggetto has skip_collaudo but dominio vincola', () => {
      component.dominio = { vincola_skip_collaudo: true };
      component._enableDisableSkipCollaudo({ skip_collaudo: true });
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
    });

    it('should disable skip_collaudo when soggetto does not have skip_collaudo', () => {
      component.dominio = {};
      component._enableDisableSkipCollaudo({ skip_collaudo: false });
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
    });

    it('should disable skip_collaudo when soggetto is null', () => {
      component.dominio = {};
      component._enableDisableSkipCollaudo(null);
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
    });
  });

  describe('onChangeSoggetto', () => {
    it('should call _enableDisableSkipCollaudo with the event', () => {
      const spy = vi.spyOn(component as any, '_enableDisableSkipCollaudo').mockImplementation(() => {});
      const event = { skip_collaudo: true };
      component.onChangeSoggetto(event);
      expect(spy).toHaveBeenCalledWith(event);
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

    it('should use translate for new when no dominio and no id', () => {
      component.dominio = null;
      component.id = null;
      component._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.New');
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
    });

    it('should have correct breadcrumb structure', () => {
      component.dominio = { nome: 'Dom' };
      component._initBreadcrumb();
      expect(component.breadcrumbs[0]).toEqual({ label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' });
      expect(component.breadcrumbs[1]).toEqual({ label: 'APP.LABEL.Domain', url: '/domini', type: 'link' });
      expect(component.breadcrumbs[2]).toEqual({ label: 'Dom', url: '', type: 'title' });
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

  describe('_onSave', () => {
    it('should emit save event', () => {
      const saveSpy = vi.spyOn(component.save, 'emit');
      component.id = 5;
      component._dominio = new Dominio({ nome: 'SaveTest' });
      component._onSave();
      expect(saveSpy).toHaveBeenCalledWith({ id: 5, dominio: component._dominio });
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate to url when using route', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/domini' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/domini']);
    });

    it('should emit close when not using route', () => {
      component._useRoute = false;
      const closeSpy = vi.spyOn(component.close, 'emit');
      component.id = 1;
      component._dominio = new Dominio({ nome: 'Test' });
      component.onBreadcrumb({ url: '/domini' });
      expect(closeSpy).toHaveBeenCalledWith({ id: 1, dominio: component._dominio });
    });
  });

  describe('_removeNullProperties', () => {
    it('should remove null properties from object', () => {
      const obj = { a: 1, b: null, c: 'test', d: null };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1, c: 'test' });
    });

    it('should remove undefined properties too (== null)', () => {
      const obj: any = { a: 1, b: undefined };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1 });
    });

    it('should keep falsy non-null values', () => {
      const obj = { a: 0, b: '', c: false, d: null };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 0, b: '', c: false });
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

    it('should return false when visibilita control does not exist', () => {
      component._formGroup = new UntypedFormGroup({});
      expect(component._isVisibilita('pubblico')).toBeFalsy();
    });
  });

  describe('_onServiceLoaded', () => {
    it('should set selectedDominio from event', () => {
      const event = { target: { dominios: [{ id: 1, nome: 'Dom1' }] } };
      component._onServiceLoaded(event, 'field');
      expect(component._selectedDominio).toEqual({ id: 1, nome: 'Dom1' });
    });
  });

  describe('_dummyAction', () => {
    it('should log to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._dummyAction('ev', 'param');
      expect(consoleSpy).toHaveBeenCalledWith('ev', 'param');
      consoleSpy.mockRestore();
    });
  });

  describe('checkClassiState (via _initForm + valueChanges)', () => {
    it('should clear validators for non-riservato and set required for riservato', () => {
      const data = {
        nome: 'N', visibilita: 'privato', descrizione: '', classi: [],
        soggetto_referente: null, deprecato: false, skip_collaudo: false,
      };
      component.dominio = {};
      component._initForm(data);

      // privato => classi should not be required
      const classiCtrl = component._formGroup.get('classi')!;
      expect(classiCtrl.hasError('required')).toBeFalsy();

      // switch to riservato
      component._formGroup.get('visibilita')?.setValue('riservato');
      expect(classiCtrl.hasError('required')).toBe(true);

      // switch to pubblico
      component._formGroup.get('visibilita')?.setValue('pubblico');
      expect(classiCtrl.hasError('required')).toBeFalsy();
    });
  });

  describe('full integration: ngOnInit with existing id loads and inits form', () => {
    it('should fully initialize component for existing dominio', () => {
      const response = {
        id_dominio: 42,
        nome: 'IntegrationTest',
        visibilita: 'riservato',
        descrizione: 'Integration desc',
        classi: [{ id_classe_utente: 'c1' }],
        soggetto_referente: { id_soggetto: 's1', nome: 'Sogg1', skip_collaudo: true },
        deprecato: false,
        skip_collaudo: false,
        vincola_skip_collaudo: false,
        tag: 'tag1',
        url_invocazione: 'http://test',
        url_prefix_collaudo: null,
        url_prefix_produzione: null,
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      mockConfigService.getConfig.mockReturnValue(of({ test: true }));

      component.ngOnInit();
      paramsSubject.next({ id: 42 });

      expect(component.id).toBe(42);
      expect(component.dominio).toEqual(response);
      expect(component._formGroup.get('nome')?.value).toBe('IntegrationTest');
      expect(component._formGroup.get('visibilita')?.value).toBe('riservato');
      expect(component._formGroup.get('classi')?.value).toEqual(['c1']);
      expect(component._spin).toBe(false);
    });
  });
});
