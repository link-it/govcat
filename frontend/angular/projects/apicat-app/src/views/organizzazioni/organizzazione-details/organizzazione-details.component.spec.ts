import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { OrganizzazioneDetailsComponent } from './organizzazione-details.component';
import { Tools } from '@linkit/components';
import { Organizzazione } from './organizzazione';

describe('OrganizzazioneDetailsComponent', () => {
  let component: OrganizzazioneDetailsComponent;
  let savedConfigurazione: any;

  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k), onLangChange: of() } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn() } as any;
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
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    mockTranslate.instant.mockImplementation((k: string) => k);
    mockRoute.params = of({ id: '1' });

    Tools.Configurazione = {
      organizzazione: {
        codice_ente_abilitato: false,
        codice_fiscale_ente_abilitato: false,
        id_tipo_utente_abilitato: false,
      }
    };

    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'simpleItemFormatter').mockImplementation((_fmt: any, _data: any) => 'formatted-title');

    component = new OrganizzazioneDetailsComponent(
      mockRoute, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockTools, mockEventsManager, mockApiService, mockUtils
    );
    component.config = {};
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(OrganizzazioneDetailsComponent.Name).toBe('OrganizzazioneDetailsComponent');
  });

  it('should have model set to organizzazioni', () => {
    expect(component.model).toBe('organizzazioni');
  });

  it('should have default values', () => {
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._isDetails).toBe(true);
    expect(component._useRoute).toBe(true);
  });

  it('should have null id by default', () => {
    expect(component.id).toBeNull();
  });

  it('should have null organizzazione by default', () => {
    expect(component.organizzazione).toBeNull();
  });

  it('should have config set to empty object from beforeEach', () => {
    expect(component.config).toEqual({});
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

  it('should enter edit mode on _editOrganization', () => {
    component._editOrganization();
    expect(component._isEdit).toBe(true);
    expect(component._error).toBe(false);
  });

  it('should cancel edit and reset state on _onCancelEdit when not new', () => {
    component._isNew = false;
    component._isEdit = true;
    component._error = true;
    component._errorMsg = 'some error';
    component.organizzazione = { nome: 'Test', id_organizzazione: 1 };
    component._onCancelEdit();
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should navigate to model on _onCancelEdit when new and useRoute', () => {
    component._isNew = true;
    component._isEdit = true;
    component._useRoute = true;
    component._onCancelEdit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['organizzazioni']);
  });

  it('should emit close on _onCancelEdit when new and not useRoute', () => {
    component._isNew = true;
    component._useRoute = false;
    const spy = vi.fn();
    component.close.subscribe(spy);
    component._onCancelEdit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit close on _onClose', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component._onClose();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit save on _onSave', () => {
    const spy = vi.fn();
    component.save.subscribe(spy);
    component._onSave();
    expect(spy).toHaveBeenCalled();
  });

  it('should navigate on onBreadcrumb when useRoute', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should call _onClose on onBreadcrumb when not useRoute', () => {
    component._useRoute = false;
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.onBreadcrumb({ url: '/test' });
    expect(spy).toHaveBeenCalled();
  });

  it('should init breadcrumb with correct entries', () => {
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Organizations');
  });

  it('should init form with data', () => {
    const data = { nome: 'Test', descrizione: 'desc' };
    component._initForm(data);
    expect(component._formGroup).toBeDefined();
    expect(component._formGroup.get('nome')).toBeTruthy();
    expect(component._formGroup.get('descrizione')).toBeTruthy();
  });

  it('should not init form without data', () => {
    const originalGroup = component._formGroup;
    component._initForm(null);
    expect(component._formGroup).toBe(originalGroup);
  });

  it('should toggle referente in form', () => {
    component._initForm({ referente: false, vincola_referente: false });
    component._toggleReferente();
    expect(component._formGroup.controls['referente'].value).toBe(true);
  });

  it('should toggle aderente in form and manage soggetto dropdown visibility', () => {
    component._initForm({ aderente: false, vincola_aderente: false, id_soggetto_default: null });
    component._toggleAderente();
    expect(component._formGroup.controls['aderente'].value).toBe(true);
    expect(component._hideSoggettoDropdown).toBe(false);
  });

  it('should toggle esterna in form', () => {
    component._isNew = true;
    component._initForm({
      esterna: false, cambio_esterna_consentito: true,
      referente: false, vincola_referente: false,
      aderente: false, vincola_aderente: false,
    });
    component._toggleEsterna();
    expect(component._formGroup.controls['esterna'].value).toBe(true);
  });

  it('should have image placeholder path', () => {
    expect(component._imagePlaceHolder).toBe('./assets/images/logo-placeholder.png');
  });

  it('should have empty soggetti by default', () => {
    expect(component.soggetti).toEqual([]);
  });

  // ======== NEW TESTS FOR COVERAGE ========

  describe('ngOnInit', () => {
    it('should load organization when route has an existing id', () => {
      const routeSubject = new Subject<any>();
      mockRoute.params = routeSubject.asObservable();
      mockConfigService.getConfig.mockReturnValue(of({ detailsTitle: '{nome}' }));
      mockApiService.getDetails.mockReturnValue(of({
        id_organizzazione: 1, nome: 'Org1', aderente: true
      }));
      mockApiService.getList.mockReturnValue(of({ content: [{ id_soggetto: 1 }] }));

      const comp = new OrganizzazioneDetailsComponent(
        mockRoute, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManager, mockApiService, mockUtils
      );
      comp.ngOnInit();
      routeSubject.next({ id: '5' });

      expect(comp.id).toBe('5');
      expect(comp._isDetails).toBe(true);
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('organizzazioni');
    });

    it('should set _isNew and _isEdit when route has id=new', () => {
      mockRoute.params = of({ id: 'new' });

      const comp = new OrganizzazioneDetailsComponent(
        mockRoute, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManager, mockApiService, mockUtils
      );
      comp.ngOnInit();

      expect(comp._isNew).toBe(true);
      expect(comp._isEdit).toBe(true);
      expect(comp._spin).toBe(false);
    });

    it('should set _isNew and _isEdit when route has no id', () => {
      mockRoute.params = of({});

      const comp = new OrganizzazioneDetailsComponent(
        mockRoute, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManager, mockApiService, mockUtils
      );
      comp.ngOnInit();

      expect(comp._isNew).toBe(true);
      expect(comp._isEdit).toBe(true);
      expect(comp._spin).toBe(false);
    });

    it('should init form for new organization', () => {
      mockRoute.params = of({ id: 'new' });

      const comp = new OrganizzazioneDetailsComponent(
        mockRoute, mockRouter, mockTranslate, mockModalService,
        mockConfigService, mockTools, mockEventsManager, mockApiService, mockUtils
      );
      comp.ngOnInit();

      // Form should be initialized with _organizzazione defaults
      expect(comp._formGroup).toBeDefined();
      expect(comp.breadcrumbs.length).toBe(3);
    });
  });

  describe('ngOnChanges', () => {
    it('should update id and loadAll when id changes', () => {
      mockApiService.getDetails.mockReturnValue(of({ id_organizzazione: 10, nome: 'ChangedOrg' }));
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      component.ngOnChanges({
        id: { currentValue: 10, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);

      expect(component.id).toBe(10);
      expect(mockApiService.getDetails).toHaveBeenCalled();
    });

    it('should update organizzazione and id when organizzazione changes', () => {
      const orgData = { source: { id: 5, nome: 'ChangedOrg' } };

      component.ngOnChanges({
        organizzazione: {
          currentValue: orgData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      } as any);

      expect(component.organizzazione).toEqual({ id: 5, nome: 'ChangedOrg' });
      expect(component.id).toBe(5);
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngOnDestroy', () => {
    it('should be callable without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('_loadAll', () => {
    it('should call both _loadOrganization and _loadSoggetti', () => {
      component.id = 5;
      mockApiService.getDetails.mockReturnValue(of({ id_organizzazione: 5, nome: 'Org' }));
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      component._loadAll();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('organizzazioni', 5);
      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', expect.anything());
    });
  });

  describe('_hasControlError', () => {
    it('should return true when control has errors and is touched', () => {
      component._initForm({ nome: '' });
      const control = component._formGroup.get('nome');
      control?.markAsTouched();
      // nome has Validators.required, so empty string or null should error
      control?.setValue(null);
      control?.updateValueAndValidity();

      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._initForm({ nome: 'ValidName' });
      const control = component._formGroup.get('nome');
      control?.markAsTouched();

      expect(component._hasControlError('nome')).toBe(false);
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      component._initForm({ nome: 'Test' });
      expect(component.f['nome']).toBeDefined();
    });
  });

  describe('_initForm', () => {
    it('should create form controls for all Organizzazione fields', () => {
      const data = {
        nome: 'OrgName',
        codice_ente: 'CE001',
        codice_fiscale_soggetto: 'CF123',
        id_tipo_utente: 'TU1',
        aderente: true,
        vincola_aderente: false,
        referente: false,
        vincola_referente: true,
        esterna: false,
        cambio_esterna_consentito: true,
        descrizione: 'A description',
        id_soggetto_default: null
      };

      component._initForm(data);

      expect(component._formGroup.get('nome')?.value).toBe('OrgName');
      expect(component._formGroup.get('codice_ente')?.value).toBe('CE001');
      expect(component._formGroup.get('codice_fiscale_soggetto')?.value).toBe('CF123');
      expect(component._formGroup.get('id_tipo_utente')?.value).toBe('TU1');
      expect(component._formGroup.get('descrizione')?.value).toBe('A description');
    });

    it('should make codice_ente required when codice_ente_abilitato is true', () => {
      Tools.Configurazione = {
        organizzazione: {
          codice_ente_abilitato: true,
          codice_fiscale_ente_abilitato: false,
          id_tipo_utente_abilitato: false,
        }
      };

      component._initForm({ codice_ente: null });
      const control = component._formGroup.get('codice_ente');
      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('should make codice_fiscale_soggetto required when codice_fiscale_ente_abilitato is true', () => {
      Tools.Configurazione = {
        organizzazione: {
          codice_ente_abilitato: false,
          codice_fiscale_ente_abilitato: true,
          id_tipo_utente_abilitato: false,
        }
      };

      component._initForm({ codice_fiscale_soggetto: null });
      const control = component._formGroup.get('codice_fiscale_soggetto');
      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('should make id_tipo_utente required when id_tipo_utente_abilitato is true', () => {
      Tools.Configurazione = {
        organizzazione: {
          codice_ente_abilitato: false,
          codice_fiscale_ente_abilitato: false,
          id_tipo_utente_abilitato: true,
        }
      };

      component._initForm({ id_tipo_utente: null });
      const control = component._formGroup.get('id_tipo_utente');
      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('should disable aderente control when vincola_aderente is true', () => {
      component._initForm({ aderente: true, vincola_aderente: true });
      expect(component._formGroup.get('aderente')?.disabled).toBe(true);
    });

    it('should disable referente control when vincola_referente is true', () => {
      component._initForm({ referente: true, vincola_referente: true });
      expect(component._formGroup.get('referente')?.disabled).toBe(true);
    });

    it('should disable esterna control when not new and cambio_esterna_consentito is false', () => {
      component._isNew = false;
      component._initForm({ esterna: false, cambio_esterna_consentito: false });
      expect(component._formGroup.get('esterna')?.disabled).toBe(true);
    });

    it('should enable esterna control when isNew', () => {
      component._isNew = true;
      component._initForm({ esterna: false, cambio_esterna_consentito: false, referente: false, vincola_referente: false, aderente: false, vincola_aderente: false });
      expect(component._formGroup.get('esterna')?.disabled).toBe(false);
    });

    it('should set id_soggetto_default from organizzazione.soggetto_default', () => {
      component.organizzazione = { soggetto_default: { id_soggetto: 42 } };
      component._initForm({ id_soggetto_default: null });
      expect(component._formGroup.get('id_soggetto_default')?.value).toBe(42);
    });

    it('should set referente and aderente to false for new organizations', () => {
      component._isNew = true;
      component._initForm({
        nome: 'NewOrg',
        referente: true,
        vincola_referente: false,
        aderente: true,
        vincola_aderente: false
      });

      expect(component._formGroup.get('referente')?.value).toBe(false);
      expect(component._formGroup.get('aderente')?.value).toBe(false);
    });

    it('should handle default case for unknown keys', () => {
      component._initForm({ unknown_field: 'test_value' });
      expect(component._formGroup.get('unknown_field')?.value).toBe('test_value');
    });

    it('should set null for falsy values in default case', () => {
      component._initForm({ unknown_field: '' });
      expect(component._formGroup.get('unknown_field')?.value).toBeNull();
    });
  });

  describe('_onImageLoaded', () => {
    it('should set base64 encoded value on field', () => {
      component._initForm({ logo: null });
      const mockBtoa = vi.fn().mockReturnValue('base64encoded');
      const originalBtoa = window.btoa;
      window.btoa = mockBtoa;

      component._onImageLoaded('imagedata', 'logo');

      expect(mockBtoa).toHaveBeenCalledWith('imagedata');
      expect(component._formGroup.get('logo')?.value).toBe('base64encoded');

      window.btoa = originalBtoa;
    });

    it('should set null when event is falsy', () => {
      component._initForm({ logo: 'existing' });

      component._onImageLoaded(null, 'logo');

      expect(component._formGroup.get('logo')?.value).toBeNull();
    });
  });

  describe('_decodeImage', () => {
    it('should decode base64 data', () => {
      const originalAtob = window.atob;
      window.atob = vi.fn().mockReturnValue('decoded-image');

      const result = component._decodeImage('base64data');
      expect(result).toBe('decoded-image');

      window.atob = originalAtob;
    });

    it('should return placeholder when data is falsy', () => {
      const result = component._decodeImage('');
      expect(result).toBe('./assets/images/logo-placeholder.png');
    });

    it('should return placeholder when data is null', () => {
      const result = component._decodeImage(null as any);
      expect(result).toBe('./assets/images/logo-placeholder.png');
    });
  });

  describe('__onSave', () => {
    it('should save new organization and update state on success', () => {
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      const savedResponse = { id_organizzazione: 10, nome: 'SavedOrg' };
      mockApiService.saveElement.mockReturnValue(of(savedResponse));

      component.__onSave({ nome: 'NewOrg', id_organizzazione: 99, descrizione: null });

      expect(mockApiService.saveElement).toHaveBeenCalledWith('organizzazioni', expect.objectContaining({ nome: 'NewOrg' }));
      expect(component.organizzazione).toBeInstanceOf(Organizzazione);
      expect(component.id).toBe(10);
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(component._spin).toBe(false);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 10, update: false }));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['organizzazioni', 10], { replaceUrl: true });
    });

    it('should handle error on save', () => {
      mockApiService.saveElement.mockReturnValue(throwError(() => new Error('Save failed')));

      component.__onSave({ nome: 'FailOrg' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('error');
      expect(component._spin).toBe(false);
    });

    it('should remove id_organizzazione from the body before saving', () => {
      mockApiService.saveElement.mockReturnValue(of({ id_organizzazione: 1 }));

      component.__onSave({ nome: 'Test', id_organizzazione: 999, descrizione: null });

      const calledBody = mockApiService.saveElement.mock.calls[0][1];
      expect(calledBody.id_organizzazione).toBeUndefined();
    });
  });

  describe('_prepareBodySaveOrganizzazione', () => {
    it('should set null for empty optional fields', () => {
      const result = component._prepareBodySaveOrganizzazione({
        nome: 'Test',
        descrizione: '',
        codice_ente: '',
        codice_fiscale_soggetto: '',
        id_tipo_utente: ''
      });

      expect(result.nome).toBe('Test');
      expect(result.descrizione).toBeNull();
      expect(result.codice_ente).toBeNull();
      expect(result.codice_fiscale_soggetto).toBeNull();
      expect(result.id_tipo_utente).toBeNull();
    });

    it('should keep values when fields are populated', () => {
      const result = component._prepareBodySaveOrganizzazione({
        nome: 'Test',
        descrizione: 'Desc',
        codice_ente: 'CE1',
        codice_fiscale_soggetto: 'CF1',
        id_tipo_utente: 'TU1'
      });

      expect(result.descrizione).toBe('Desc');
      expect(result.codice_ente).toBe('CE1');
      expect(result.codice_fiscale_soggetto).toBe('CF1');
      expect(result.id_tipo_utente).toBe('TU1');
    });
  });

  describe('__onUpdate', () => {
    it('should update organization and emit save event on success', () => {
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);
      component._closeEdit = true;

      const updateResponse = { id: 10, nome: 'UpdatedOrg', id_organizzazione: 10 };
      mockApiService.putElement.mockReturnValue(of(updateResponse));

      component.__onUpdate(10, { nome: 'UpdatedOrg' });

      expect(mockApiService.putElement).toHaveBeenCalledWith('organizzazioni', 10, expect.anything());
      expect(component._isEdit).toBe(false); // _closeEdit is true, so !true = false
      expect(component.organizzazione).toEqual(updateResponse);
      expect(component._spin).toBe(false);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ update: true }));
    });

    it('should keep edit mode open when _closeEdit is false', () => {
      component._closeEdit = false;
      mockApiService.putElement.mockReturnValue(of({ id: 10 }));

      component.__onUpdate(10, { nome: 'Test' });

      expect(component._isEdit).toBe(true); // !false = true
    });

    it('should handle error on update', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => new Error('Update failed')));

      component.__onUpdate(10, { nome: 'FailOrg' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('error');
      expect(component._spin).toBe(false);
    });
  });

  describe('_prepareBodyUpdateOrganizzazione', () => {
    it('should set null for empty optional fields', () => {
      const result = component._prepareBodyUpdateOrganizzazione({
        nome: 'Test',
        descrizione: '',
        codice_ente: '',
        codice_fiscale_soggetto: '',
        id_tipo_utente: ''
      });

      expect(result.descrizione).toBeNull();
      expect(result.codice_ente).toBeNull();
      expect(result.codice_fiscale_soggetto).toBeNull();
      expect(result.id_tipo_utente).toBeNull();
    });
  });

  describe('_onSubmit', () => {
    it('should call __onSave when form is valid and isNew', () => {
      component._isEdit = true;
      component._isNew = true;
      component._initForm({ nome: 'NewOrg', referente: false, vincola_referente: false, aderente: false, vincola_aderente: false });
      component._formGroup.get('nome')?.setValue('ValidName');

      mockApiService.saveElement.mockReturnValue(of({ id_organizzazione: 1, nome: 'ValidName' }));

      component._onSubmit(component._formGroup.value, true);

      expect(component._closeEdit).toBe(true);
      expect(mockApiService.saveElement).toHaveBeenCalled();
    });

    it('should call __onUpdate when form is valid and not new', () => {
      component._isEdit = true;
      component._isNew = false;
      component.organizzazione = { id_organizzazione: 5 };
      component._initForm({ nome: 'ExistingOrg' });
      component._formGroup.get('nome')?.setValue('UpdatedName');

      mockApiService.putElement.mockReturnValue(of({ id: 5 }));

      component._onSubmit(component._formGroup.value, false);

      expect(component._closeEdit).toBe(false);
      expect(mockApiService.putElement).toHaveBeenCalledWith('organizzazioni', 5, expect.anything());
    });

    it('should not submit when form is invalid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._initForm({ nome: '', referente: false, vincola_referente: false, aderente: false, vincola_aderente: false });
      component._formGroup.get('nome')?.setValue(null);
      component._formGroup.get('nome')?.updateValueAndValidity();

      component._onSubmit(component._formGroup.value);

      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });

    it('should not submit when not in edit mode', () => {
      component._isEdit = false;
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
      expect(mockApiService.putElement).not.toHaveBeenCalled();
    });
  });

  describe('_deleteOrganization', () => {
    it('should show confirmation dialog and delete on confirm', () => {
      component.organizzazione = { id_organizzazione: 5 };
      const onCloseSubject = new Subject<any>();

      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() }
      });

      component._deleteOrganization();

      expect(mockModalService.show).toHaveBeenCalled();

      // Simulate user confirming deletion
      mockApiService.deleteElement.mockReturnValue(of({}));
      onCloseSubject.next(true);

      expect(mockApiService.deleteElement).toHaveBeenCalledWith('organizzazioni', 5);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['organizzazioni']);
    });

    it('should not delete on cancel', () => {
      component.organizzazione = { id_organizzazione: 5 };
      const onCloseSubject = new Subject<any>();

      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() }
      });

      component._deleteOrganization();

      // Simulate user cancelling
      onCloseSubject.next(false);

      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should handle error on delete', () => {
      component.organizzazione = { id_organizzazione: 5 };
      const onCloseSubject = new Subject<any>();

      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject.asObservable() }
      });

      component._deleteOrganization();

      mockApiService.deleteElement.mockReturnValue(throwError(() => new Error('Delete failed')));
      onCloseSubject.next(true);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('error');
    });
  });

  describe('_loadOrganization', () => {
    it('should load organization details and set up state', () => {
      component.id = 5;
      component.config = { detailsTitle: '{nome}' };
      mockApiService.getDetails.mockReturnValue(of({
        id_organizzazione: 5,
        nome: 'LoadedOrg',
        aderente: true
      }));

      component._loadOrganization();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('organizzazioni', 5);
      expect(component.organizzazione).toBeInstanceOf(Organizzazione);
      expect(component._organizzazione).toBeInstanceOf(Organizzazione);
      expect(component._hideSoggettoDropdown).toBe(false); // aderente is true
      expect(component._spin).toBe(false);
      expect(Tools.simpleItemFormatter).toHaveBeenCalled();
    });

    it('should hide soggetto dropdown when aderente is false', () => {
      component.id = 5;
      component.config = {};
      mockApiService.getDetails.mockReturnValue(of({
        id_organizzazione: 5,
        nome: 'NonAdherent',
        aderente: false
      }));

      component._loadOrganization();

      expect(component._hideSoggettoDropdown).toBe(true);
    });

    it('should not use simpleItemFormatter when detailsTitle is not in config', () => {
      component.id = 5;
      component.config = {};
      (Tools.simpleItemFormatter as any).mockClear();
      mockApiService.getDetails.mockReturnValue(of({
        id_organizzazione: 5,
        nome: 'Test'
      }));

      component._loadOrganization();

      expect(Tools.simpleItemFormatter).not.toHaveBeenCalled();
    });

    it('should call Tools.OnError on failure', () => {
      component.id = 5;
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('Load failed')));

      component._loadOrganization();

      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should not load when id is null', () => {
      component.id = null;
      component._loadOrganization();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  describe('_loadSoggetti', () => {
    it('should load soggetti list for the organization', () => {
      component.id = 5;
      const soggettiContent = [{ id_soggetto: 1, nome: 'Sogg1' }, { id_soggetto: 2, nome: 'Sogg2' }];
      mockApiService.getList.mockReturnValue(of({ content: soggettiContent }));

      component._loadSoggetti();

      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', expect.anything());
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith({ id_organizzazione: 5 });
      expect(component.soggetti).toEqual(soggettiContent);
    });

    it('should call Tools.OnError on failure', () => {
      component.id = 5;
      mockApiService.getList.mockReturnValue(throwError(() => new Error('Soggetti error')));

      component._loadSoggetti();

      expect(Tools.OnError).toHaveBeenCalled();
    });

    it('should not load when id is null', () => {
      component.id = null;
      component._loadSoggetti();
      expect(mockApiService.getList).not.toHaveBeenCalled();
    });
  });

  describe('_onChangeSoggetto', () => {
    it('should be callable without error', () => {
      expect(() => component._onChangeSoggetto({ value: 1 })).not.toThrow();
    });
  });

  describe('_initBreadcrumb', () => {
    it('should use organizzazione nome when available', () => {
      component.organizzazione = { nome: 'MyOrg' };
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('MyOrg');
    });

    it('should use id when organizzazione is null but id exists', () => {
      component.organizzazione = null;
      component.id = 42;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('42');
    });

    it('should use translated New when no organizzazione and no id', () => {
      component.organizzazione = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
    });
  });

  describe('_editOrganization', () => {
    it('should initialize form with current _organizzazione data', () => {
      component._organizzazione = new Organizzazione({ nome: 'EditOrg', descrizione: 'Desc' });
      component._editOrganization();

      expect(component._isEdit).toBe(true);
      expect(component._error).toBe(false);
      expect(component._formGroup.get('nome')?.value).toBe('EditOrg');
    });
  });

  describe('_onCancelEdit when not new', () => {
    it('should recreate _organizzazione from organizzazione', () => {
      component._isNew = false;
      component._isEdit = true;
      component.organizzazione = { nome: 'Original', id_organizzazione: 1 };

      component._onCancelEdit();

      expect(component._organizzazione).toBeInstanceOf(Organizzazione);
      expect(component._organizzazione.nome).toBe('Original');
    });
  });

  describe('_toggleAderente', () => {
    it('should clear id_soggetto_default when aderente is toggled off', () => {
      component._initForm({
        aderente: true,
        vincola_aderente: false,
        id_soggetto_default: 42
      });
      // Currently aderente is true -> toggle makes it false
      // But UntypedFormControl with {value, disabled} stores inner value
      // Let's set it to true first, then toggle
      component._formGroup.controls['aderente'].setValue(true);
      component._formGroup.controls['id_soggetto_default'].setValue(42);

      component._toggleAderente();

      // After toggle: aderente becomes false
      expect(component._formGroup.controls['aderente'].value).toBe(false);
      expect(component._hideSoggettoDropdown).toBe(true);
      expect(component._formGroup.controls['id_soggetto_default'].value).toBeNull();
    });
  });

  describe('_toggleReferente toggle back', () => {
    it('should toggle referente back to false', () => {
      component._initForm({ referente: true, vincola_referente: false });
      // value starts as {value: true, disabled: false} in disabled form
      // After init, actual value depends on UntypedFormControl behavior
      component._formGroup.controls['referente'].setValue(true);

      component._toggleReferente();

      expect(component._formGroup.controls['referente'].value).toBe(false);
    });
  });

  describe('_toggleEsterna toggle back', () => {
    it('should toggle esterna back to false', () => {
      component._isNew = true;
      component._initForm({ esterna: true, cambio_esterna_consentito: true, referente: false, vincola_referente: false, aderente: false, vincola_aderente: false });
      component._formGroup.controls['esterna'].setValue(true);

      component._toggleEsterna();

      expect(component._formGroup.controls['esterna'].value).toBe(false);
    });
  });

  describe('_initForm with null/falsy values', () => {
    it('should default nome to null when value is empty', () => {
      component._initForm({ nome: '' });
      expect(component._formGroup.get('nome')?.value).toBeNull();
    });

    it('should default descrizione to null when value is empty', () => {
      component._initForm({ descrizione: '' });
      expect(component._formGroup.get('descrizione')?.value).toBeNull();
    });

    it('should default aderente to false when value is falsy', () => {
      component._initForm({ aderente: null, vincola_aderente: false });
      expect(component._formGroup.get('aderente')?.value).toBe(false);
    });

    it('should default referente to false when value is falsy', () => {
      component._initForm({ referente: null, vincola_referente: false });
      expect(component._formGroup.get('referente')?.value).toBe(false);
    });

    it('should default esterna to false when value is falsy', () => {
      component._isNew = true;
      component._initForm({ esterna: null, cambio_esterna_consentito: true, referente: false, vincola_referente: false, aderente: false, vincola_aderente: false });
      expect(component._formGroup.get('esterna')?.value).toBe(false);
    });
  });
});
