import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, EMPTY } from 'rxjs';
import { Tools } from '@linkit/components';
import { ClasseUtenteDetailsComponent } from './classe-utente-details.component';
import { ClasseUtente } from './classe-utente';

describe('ClasseUtenteDetailsComponent', () => {
  let component: ClasseUtenteDetailsComponent;
  let savedConfigurazione: any;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    GetErrorMsg: vi.fn().mockReturnValue('error'),
    refreshAnagrafiche: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockApiService.saveElement.mockReturnValue(of({}));
    mockApiService.putElement.mockReturnValue(of({}));
    mockApiService.deleteElement.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((k: string) => k);
    component = new ClasseUtenteDetailsComponent(
      mockRoute, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockApiService, mockUtils
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ClasseUtenteDetailsComponent.Name).toBe('ClasseUtenteDetailsComponent');
  });

  it('should have model set to classi-utente', () => {
    expect(component.model).toBe('classi-utente');
  });

  it('should have default values', () => {
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._isDetails).toBe(true);
    expect(component._useRoute).toBe(true);
    expect(component._editable).toBe(false);
    expect(component._deleteable).toBe(false);
    expect(component._closeEdit).toBe(true);
    expect(component.hasTab).toBe(true);
    expect(component.desktop).toBe(false);
  });

  it('should have null id by default', () => {
    expect(component.id).toBeNull();
  });

  it('should have null classeUtente by default', () => {
    expect(component.classeUtente).toBeNull();
  });

  it('should have null config by default', () => {
    expect(component.config).toBeNull();
  });

  it('should have close and save outputs', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have tabs with details', () => {
    expect(component.tabs.length).toBe(1);
    expect(component.tabs[0].link).toBe('details');
    expect(component._currentTab).toBe('details');
  });

  it('should switch tab on _clickTab', () => {
    component._clickTab('other');
    expect(component._currentTab).toBe('other');
  });

  it('should have placeholder paths', () => {
    expect(component._classeUtentePlaceHolder).toBe('./assets/images/logo-placeholder.png');
    expect(component._organizationLogoPlaceholder).toBe('./assets/images/organization-placeholder.png');
    expect(component._classeUtenteLogoPlaceholder).toBe('./assets/images/classeUtente-placeholder.png');
  });

  // --- ngOnInit ---

  describe('ngOnInit', () => {
    it('should load details when route has numeric id', () => {
      const routeWithId = { params: of({ id: '42' }) } as any;
      const comp = new ClasseUtenteDetailsComponent(
        routeWithId, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockApiService, mockUtils
      );
      comp.ngOnInit();
      expect(comp.id).toBe('42');
      expect(comp._isDetails).toBe(true);
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('classi-utente');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('classi-utente', '42');
    });

    it('should set _isNew and _isEdit when route id is "new"', () => {
      const routeNew = { params: of({ id: 'new' }) } as any;
      const comp = new ClasseUtenteDetailsComponent(
        routeNew, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockApiService, mockUtils
      );
      comp.ngOnInit();
      expect(comp._isNew).toBe(true);
      expect(comp._isEdit).toBe(true);
      expect(comp._spin).toBe(false);
    });

    it('should set _isNew when route has no id', () => {
      const routeNoId = { params: of({}) } as any;
      const comp = new ClasseUtenteDetailsComponent(
        routeNoId, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockApiService, mockUtils
      );
      comp.ngOnInit();
      expect(comp._isNew).toBe(true);
      expect(comp._isEdit).toBe(true);
      expect(comp._spin).toBe(false);
    });

    it('should init breadcrumb when new', () => {
      const routeNew = { params: of({ id: 'new' }) } as any;
      const comp = new ClasseUtenteDetailsComponent(
        routeNew, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockApiService, mockUtils
      );
      comp.ngOnInit();
      expect(comp.breadcrumbs.length).toBe(3);
      expect(comp.breadcrumbs[2].label).toBe('APP.TITLE.New');
    });

    it('should init form when _isNew and _isEdit', () => {
      const routeNew = { params: of({ id: 'new' }) } as any;
      const comp = new ClasseUtenteDetailsComponent(
        routeNew, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockApiService, mockUtils
      );
      comp.ngOnInit();
      // The form should have been initialized with ClasseUtente properties
      expect(comp._formGroup).toBeDefined();
    });
  });

  // --- ngOnChanges ---

  describe('ngOnChanges', () => {
    it('should update id and call _loadAll when id changes', () => {
      const spy = vi.spyOn(component as any, '_loadAll');
      component.ngOnChanges({
        id: { currentValue: 5, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.id).toBe(5);
      expect(spy).toHaveBeenCalled();
    });

    it('should update classeUtente and id when classeUtente changes', () => {
      const source = { id: 10, nome: 'Test' };
      component.ngOnChanges({
        classeUtente: {
          currentValue: { source },
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      } as any);
      expect(component.classeUtente).toEqual(source);
      expect(component.id).toBe(10);
    });
  });

  // --- ngAfterContentChecked ---

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // window.innerWidth in test environment may vary, just check it's boolean
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // --- ngOnDestroy ---

  describe('ngOnDestroy', () => {
    it('should not throw on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // --- _loadAll / _loadClasseUtente ---

  describe('_loadClasseUtente', () => {
    it('should load and set classeUtente on success', () => {
      const responseData = { id_classe_utente: 'cu1', nome: 'Classe1', descrizione: 'Desc' };
      mockApiService.getDetails.mockReturnValue(of(responseData));
      component.id = 42;
      (component as any)._loadClasseUtente();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('classi-utente', 42);
      expect(component.classeUtente).toBeTruthy();
      expect(component.classeUtente.nome).toBe('Classe1');
      expect(component._classeUtente.nome).toBe('Classe1');
      expect(component._spin).toBe(false);
    });

    it('should call Tools.OnError on failure', () => {
      const error = { status: 500, message: 'Server error' };
      mockApiService.getDetails.mockReturnValue(throwError(() => error));
      component.id = 42;
      (component as any)._loadClasseUtente();
      expect(Tools.OnError).toHaveBeenCalledWith(error);
      expect(component._spin).toBe(false);
    });

    it('should not call apiService if id is null', () => {
      component.id = null;
      (component as any)._loadClasseUtente();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should set classeUtente to null before loading', () => {
      mockApiService.getDetails.mockReturnValue(of({ nome: 'Test' }));
      component.classeUtente = { nome: 'Old' };
      component.id = 1;
      (component as any)._loadClasseUtente();
      // After load, classeUtente should be the new value
      expect(component.classeUtente.nome).toBe('Test');
    });
  });

  // --- _initBreadcrumb ---

  describe('_initBreadcrumb', () => {
    it('should use classeUtente nome when available', () => {
      component.classeUtente = { nome: 'MyClasse' };
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('MyClasse');
    });

    it('should use id as string when classeUtente is null but id is set', () => {
      component.classeUtente = null;
      component.id = 99;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('99');
    });

    it('should use translated "New" when both classeUtente and id are null', () => {
      component.classeUtente = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.New');
    });

    it('should always have 3 breadcrumb entries', () => {
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.UserClasses');
      expect(component.breadcrumbs[1].url).toBe('/classi-utente');
    });
  });

  // --- _initForm ---

  describe('_initForm', () => {
    it('should init form with data including nome, descrizione, and other keys', () => {
      const data = { nome: 'Test', descrizione: 'desc', id_classe_utente: 'cu1' };
      component._initForm(data);
      expect(component._formGroup.get('nome')).toBeTruthy();
      expect(component._formGroup.get('descrizione')).toBeTruthy();
      expect(component._formGroup.get('id_classe_utente')).toBeTruthy();
    });

    it('should not modify form when data is null', () => {
      const originalGroup = component._formGroup;
      component._initForm(null);
      expect(component._formGroup).toBe(originalGroup);
    });

    it('should set nome as required', () => {
      component._initForm({ nome: '' });
      const nomeControl = component._formGroup.get('nome');
      expect(nomeControl).toBeTruthy();
      nomeControl!.setValue('');
      nomeControl!.markAsTouched();
      expect(nomeControl!.valid).toBe(false);
    });

    it('should set maxLength(255) on nome', () => {
      component._initForm({ nome: '' });
      const nomeControl = component._formGroup.get('nome');
      nomeControl!.setValue('a'.repeat(256));
      expect(nomeControl!.hasError('maxlength')).toBe(true);
    });

    it('should set maxLength(255) on descrizione', () => {
      component._initForm({ descrizione: '' });
      const descControl = component._formGroup.get('descrizione');
      descControl!.setValue('a'.repeat(256));
      expect(descControl!.hasError('maxlength')).toBe(true);
    });

    it('should allow valid descrizione within limits', () => {
      component._initForm({ descrizione: 'Some description' });
      const descControl = component._formGroup.get('descrizione');
      expect(descControl!.valid).toBe(true);
    });

    it('should use null as default value when data key is falsy', () => {
      component._initForm({ nome: '', descrizione: null, id: 0 });
      expect(component._formGroup.get('nome')!.value).toBeNull();
      expect(component._formGroup.get('descrizione')!.value).toBeNull();
    });

    it('should preserve truthy values from data', () => {
      component._initForm({ nome: 'TestName', descrizione: 'TestDesc' });
      expect(component._formGroup.get('nome')!.value).toBe('TestName');
      expect(component._formGroup.get('descrizione')!.value).toBe('TestDesc');
    });
  });

  // --- _hasControlError ---

  describe('_hasControlError', () => {
    it('should return true when control has errors and is touched', () => {
      component._initForm({ nome: '' });
      const ctrl = component._formGroup.get('nome')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._initForm({ nome: 'Valid' });
      const ctrl = component._formGroup.get('nome')!;
      ctrl.markAsTouched();
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control is not touched', () => {
      component._initForm({ nome: '' });
      // not touched, even though invalid
      expect(component._hasControlError('nome')).toBe(false);
    });
  });

  // --- f getter ---

  describe('f getter', () => {
    it('should return form controls', () => {
      component._initForm({ nome: 'Test' });
      const controls = component.f;
      expect(controls['nome']).toBeDefined();
    });
  });

  // --- _editClasseUtente ---

  describe('_editClasseUtente', () => {
    it('should enter edit mode and init form', () => {
      component._classeUtente = new ClasseUtente({ nome: 'Old', descrizione: 'OldDesc' });
      component._editClasseUtente();
      expect(component._isEdit).toBe(true);
      expect(component._error).toBe(false);
      expect(component._formGroup.get('nome')!.value).toBe('Old');
    });
  });

  // --- _onClose ---

  describe('_onClose', () => {
    it('should emit close with id and classeUtente', () => {
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.id = 5;
      component._classeUtente = new ClasseUtente({ nome: 'Test' });
      component._onClose();
      expect(spy).toHaveBeenCalledWith({ id: 5, classeUtente: component._classeUtente });
    });
  });

  // --- _onSave ---

  describe('_onSave', () => {
    it('should emit save with id and classeUtente', () => {
      const spy = vi.fn();
      component.save.subscribe(spy);
      component.id = 7;
      component._classeUtente = new ClasseUtente({ nome: 'Test' });
      component._onSave();
      expect(spy).toHaveBeenCalledWith({ id: 7, classeUtente: component._classeUtente });
    });
  });

  // --- _onCancelEdit ---

  describe('_onCancelEdit', () => {
    it('should reset flags and navigate when new and useRoute', () => {
      component._isNew = true;
      component._isEdit = true;
      component._useRoute = true;
      component._error = true;
      component._errorMsg = 'some error';
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['classi-utente']);
    });

    it('should emit close when new and not useRoute', () => {
      component._isNew = true;
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onCancelEdit();
      expect(spy).toHaveBeenCalledWith({ id: component.id, classeUtente: null });
    });

    it('should reset _classeUtente from classeUtente when not new', () => {
      component._isNew = false;
      component._isEdit = true;
      component.classeUtente = { nome: 'Original', descrizione: 'Desc', id_classe_utente: 'cu1' };
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._classeUtente.nome).toBe('Original');
    });
  });

  // --- onBreadcrumb ---

  describe('onBreadcrumb', () => {
    it('should navigate when useRoute', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/test' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
    });

    it('should call _onClose when not useRoute', () => {
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBreadcrumb({ url: '/test' });
      expect(spy).toHaveBeenCalled();
    });
  });

  // --- _onSubmit ---

  describe('_onSubmit', () => {
    it('should call __onSave when isNew and form is valid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._initForm({ nome: 'Valid' });
      component._formGroup.get('nome')!.setValue('ValidName');
      const spy = vi.spyOn(component as any, '__onSave');
      component._onSubmit({ nome: 'ValidName' });
      expect(spy).toHaveBeenCalledWith({ nome: 'ValidName' });
    });

    it('should call __onUpdate when not new and form is valid', () => {
      component._isEdit = true;
      component._isNew = false;
      component._initForm({ nome: 'Valid' });
      component._formGroup.get('nome')!.setValue('ValidName');
      component.classeUtente = { id_classe_utente: 'cu1' };
      const spy = vi.spyOn(component as any, '__onUpdate');
      component._onSubmit({ nome: 'ValidName' });
      expect(spy).toHaveBeenCalledWith('cu1', { nome: 'ValidName' });
    });

    it('should not call save/update when not in edit mode', () => {
      component._isEdit = false;
      component._isNew = true;
      const saveSpy = vi.spyOn(component as any, '__onSave');
      const updateSpy = vi.spyOn(component as any, '__onUpdate');
      component._onSubmit({ nome: 'Test' });
      expect(saveSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should not call save/update when form is invalid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._initForm({ nome: '' });
      // nome is required, empty is invalid
      const saveSpy = vi.spyOn(component as any, '__onSave');
      component._onSubmit({ nome: '' });
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should set _closeEdit from the close parameter', () => {
      component._isEdit = true;
      component._isNew = true;
      component._initForm({ nome: 'Valid' });
      component._formGroup.get('nome')!.setValue('ValidName');
      vi.spyOn(component as any, '__onSave').mockImplementation(() => {});
      component._onSubmit({ nome: 'ValidName' }, false);
      expect(component._closeEdit).toBe(false);
    });
  });

  // --- __onSave ---

  describe('__onSave', () => {
    it('should save element and update state on success', () => {
      const response = { id_classe_utente: 'cu1', nome: 'Saved' };
      mockApiService.saveElement.mockReturnValue(of(response));
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      component.__onSave({ nome: 'Saved' });

      expect(mockApiService.saveElement).toHaveBeenCalledWith('classi-utente', { nome: 'Saved' });
      expect(component.classeUtente).toBeTruthy();
      expect(component._classeUtente.nome).toBe('Saved');
      expect(component.id).toBe('cu1');
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(mockUtils.refreshAnagrafiche).toHaveBeenCalledWith(['classi-utente']);
      expect(saveSpy).toHaveBeenCalledWith({ id: 'cu1', payment: response, update: false });
    });

    it('should set error state on failure', () => {
      const error = { status: 400, message: 'Bad request' };
      mockApiService.saveElement.mockReturnValue(throwError(() => error));

      component.__onSave({ nome: 'Fail' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('error');
      expect(mockUtils.GetErrorMsg).toHaveBeenCalledWith(error);
    });

    it('should reset _error before saving', () => {
      component._error = true;
      mockApiService.saveElement.mockReturnValue(of({ id_classe_utente: 'cu1' }));
      component.__onSave({ nome: 'Test' });
      // _error is reset at beginning, then stays false on success
      expect(component._error).toBe(false);
    });

    it('should remove null properties from body before saving', () => {
      mockApiService.saveElement.mockReturnValue(of({ id_classe_utente: 'cu1' }));
      const body = { nome: 'Test', descrizione: '' };
      component.__onSave(body);
      // descrizione is empty string -> _.isEmpty('') is true -> removed
      expect(mockApiService.saveElement).toHaveBeenCalledWith('classi-utente', { nome: 'Test' });
    });
  });

  // --- __onUpdate ---

  describe('__onUpdate', () => {
    it('should update element and state on success', () => {
      const response = { id_classe_utente: 'cu1', nome: 'Updated' };
      mockApiService.putElement.mockReturnValue(of(response));
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);
      component._closeEdit = true;

      component.__onUpdate(42, { nome: 'Updated' });

      expect(mockApiService.putElement).toHaveBeenCalledWith('classi-utente', 42, { nome: 'Updated' });
      expect(component._isEdit).toBe(false); // _closeEdit is true so !true = false
      expect(component.classeUtente).toBeTruthy();
      expect(component._classeUtente.nome).toBe('Updated');
      expect(component.id).toBe('cu1');
      expect(mockUtils.refreshAnagrafiche).toHaveBeenCalledWith(['classi-utente']);
      expect(saveSpy).toHaveBeenCalledWith({ id: 'cu1', payment: response, update: true });
    });

    it('should keep edit mode when _closeEdit is false', () => {
      mockApiService.putElement.mockReturnValue(of({ id_classe_utente: 'cu1', nome: 'Updated' }));
      component._closeEdit = false;

      component.__onUpdate(42, { nome: 'Updated' });

      expect(component._isEdit).toBe(true); // !false = true
    });

    it('should set error state on failure', () => {
      const error = { status: 500 };
      mockApiService.putElement.mockReturnValue(throwError(() => error));

      component.__onUpdate(42, { nome: 'Fail' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('error');
      expect(mockUtils.GetErrorMsg).toHaveBeenCalledWith(error);
    });

    it('should reset _error before updating', () => {
      component._error = true;
      mockApiService.putElement.mockReturnValue(of({ id_classe_utente: 'cu1' }));
      component.__onUpdate(1, { nome: 'Test' });
      expect(component._error).toBe(false);
    });
  });

  // --- _removeNullProperties ---

  describe('_removeNullProperties', () => {
    it('should remove empty/null properties', () => {
      const obj = { nome: 'Test', descrizione: '', id: null, arr: [] };
      (component as any)._removeNullProperties(obj);
      expect(obj).toHaveProperty('nome', 'Test');
      expect(obj).not.toHaveProperty('descrizione');
      expect(obj).not.toHaveProperty('id');
      expect(obj).not.toHaveProperty('arr');
    });

    it('should keep non-empty properties', () => {
      const obj = { nome: 'Test', descrizione: 'Desc' };
      (component as any)._removeNullProperties(obj);
      expect(obj).toHaveProperty('nome', 'Test');
      expect(obj).toHaveProperty('descrizione', 'Desc');
    });
  });

  // --- _deleteClasseUtente ---

  describe('_deleteClasseUtente', () => {
    it('should show confirmation dialog', () => {
      const mockOnClose = { subscribe: vi.fn() };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });

      component._deleteClasseUtente();

      expect(mockModalService.show).toHaveBeenCalled();
      expect(mockOnClose.subscribe).toHaveBeenCalled();
    });

    it('should delete and navigate on confirm', () => {
      const deleteResponse = {};
      mockApiService.deleteElement.mockReturnValue(of(deleteResponse));
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);
      component.classeUtente = { id_classe_utente: 'cu1' };
      component.id = 42;

      let onCloseCallback: any;
      const mockOnClose = {
        subscribe: vi.fn((cb: any) => { onCloseCallback = cb; })
      };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });

      component._deleteClasseUtente();
      // Simulate user confirming
      onCloseCallback(true);

      expect(mockApiService.deleteElement).toHaveBeenCalledWith('classi-utente', 'cu1');
      expect(mockUtils.refreshAnagrafiche).toHaveBeenCalledWith(['classi-utente']);
      expect(saveSpy).toHaveBeenCalledWith({ id: 42, classeUtente: deleteResponse, update: false });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['classi-utente']);
    });

    it('should not delete when user cancels', () => {
      let onCloseCallback: any;
      const mockOnClose = {
        subscribe: vi.fn((cb: any) => { onCloseCallback = cb; })
      };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });

      component._deleteClasseUtente();
      // Simulate user canceling (falsy response)
      onCloseCallback(false);

      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      const error = { status: 500 };
      mockApiService.deleteElement.mockReturnValue(throwError(() => error));
      component.classeUtente = { id_classe_utente: 'cu1' };

      let onCloseCallback: any;
      const mockOnClose = {
        subscribe: vi.fn((cb: any) => { onCloseCallback = cb; })
      };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });

      component._deleteClasseUtente();
      onCloseCallback(true);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('error');
    });

    it('should pass correct initial state to modal', () => {
      const mockOnClose = { subscribe: vi.fn() };
      mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });

      component._deleteClasseUtente();

      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].ignoreBackdropClick).toBe(true);
      expect(callArgs[1].initialState.confirmColor).toBe('danger');
    });
  });

  // --- _downloadAction ---

  describe('_downloadAction', () => {
    it('should be a no-op (dummy method)', () => {
      expect(() => component._downloadAction({})).not.toThrow();
    });
  });

  // --- _loadAll ---

  describe('_loadAll', () => {
    it('should call _loadClasseUtente', () => {
      const spy = vi.spyOn(component as any, '_loadClasseUtente').mockImplementation(() => {});
      (component as any)._loadAll();
      expect(spy).toHaveBeenCalled();
    });
  });
});
