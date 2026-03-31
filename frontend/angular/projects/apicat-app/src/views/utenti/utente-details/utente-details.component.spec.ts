import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError, EMPTY } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UtenteDetailsComponent } from './utente-details.component';
import { Utente, Ruolo, Stato } from './utente';
import { Tools } from '@linkit/components';

describe('UtenteDetailsComponent', () => {
  let component: UtenteDetailsComponent;
  let savedConfigurazione: any;

  let mockRoute: any;
  let mockRouter: any;
  let mockTranslate: any;
  let mockModalService: any;
  let mockConfigService: any;
  let mockTools: any;
  let mockEventsManagerService: any;
  let mockApiService: any;
  let mockUtils: any;

  beforeEach(() => {
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
    mockEventsManagerService = {
      on: vi.fn(),
      broadcast: vi.fn(),
      off: vi.fn()
    };
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [] })),
      getDetails: vi.fn().mockReturnValue(of({})),
      saveElement: vi.fn().mockReturnValue(of({})),
      putElement: vi.fn().mockReturnValue(of({})),
      deleteElement: vi.fn().mockReturnValue(of({}))
    };
    mockUtils = {
      GetErrorMsg: vi.fn().mockReturnValue('Error'),
      _removeEmpty: vi.fn((obj: any) => obj)
    };

    component = new UtenteDetailsComponent(
      mockRoute as any,
      mockRouter as any,
      mockTranslate as any,
      mockModalService as any,
      mockConfigService as any,
      mockTools as any,
      mockEventsManagerService as any,
      mockApiService as any,
      mockUtils as any
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(UtenteDetailsComponent.Name).toBe('UtenteDetailsComponent');
  });

  it('should have model set to utenti', () => {
    expect(component.model).toBe('utenti');
  });

  it('should set appConfig from configService', () => {
    expect(component.appConfig).toBeDefined();
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component.utente).toBeNull();
    expect(component._isDetails).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._currentTab).toBe('details');
    expect(component.hasTab).toBe(true);
    expect(component._useRoute).toBe(true);
    expect(component._fromDashboard).toBe(false);
  });

  it('should have close and save EventEmitters', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Users');
  });

  describe('ngOnInit', () => {
    it('should populate _ruoloArr on init', () => {
      component.ngOnInit();
      expect(component._ruoloArr).toEqual(Object.values(Ruolo));
    });

    it('should set _statoArr initially then filter for new mode', () => {
      // With default route params (no id), it enters the else (new) branch
      // which filters _statoArr to exclude NON_CONFIGURATO and PENDING_UPDATE
      component.ngOnInit();
      expect(component._statoArr).not.toContain(Stato.NON_CONFIGURATO);
      expect(component._statoArr).not.toContain(Stato.PENDING_UPDATE);
      expect(component._statoArr).toContain(Stato.ABILITATO);
      expect(component._statoArr).toContain(Stato.DISABILITATO);
    });

    it('should load details when route has an id', () => {
      mockRoute.params = of({ id: 42 });
      const spy = vi.spyOn(component, '_loadAll' as any).mockImplementation(() => {});
      component.ngOnInit();
      expect(component.id).toBe(42);
      expect(component._isDetails).toBe(true);
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('utenti');
      expect(spy).toHaveBeenCalled();
    });

    it('should set up new mode when route id is "new"', () => {
      mockRoute.params = of({ id: 'new' });
      component.ngOnInit();
      expect(component._isNew).toBe(true);
      expect(component._isEdit).toBe(true);
      expect(component._spin).toBe(false);
      // Should filter out NON_CONFIGURATO and PENDING_UPDATE for new users
      expect(component._statoArr).not.toContain(Stato.NON_CONFIGURATO);
      expect(component._statoArr).not.toContain(Stato.PENDING_UPDATE);
    });

    it('should set up new mode when route has no id param', () => {
      mockRoute.params = of({});
      component.ngOnInit();
      // No id param means not entering the first if, so falls to else
      expect(component._isNew).toBe(true);
      expect(component._isEdit).toBe(true);
    });

    it('should set _fromDashboard when queryParams has from=dashboard', () => {
      mockRoute.queryParams = of({ from: 'dashboard' });
      component.ngOnInit();
      expect(component._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard for other queryParams', () => {
      mockRoute.queryParams = of({ from: 'other' });
      component.ngOnInit();
      expect(component._fromDashboard).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should update id and load all when id changes', () => {
      const spy = vi.spyOn(component, '_loadAll' as any).mockImplementation(() => {});
      component.ngOnChanges({
        id: { currentValue: 5, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.id).toBe(5);
      expect(spy).toHaveBeenCalled();
    });

    it('should update utente when utente input changes', () => {
      component.ngOnChanges({
        utente: {
          currentValue: { source: { id: 10, nome: 'Mario', cognome: 'Rossi' } },
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      } as any);
      expect(component.utente).toEqual({ id: 10, nome: 'Mario', cognome: 'Rossi' });
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
    it('should call _loadUtente and _loadClassiUtente', () => {
      const spyUtente = vi.spyOn(component, '_loadUtente' as any).mockImplementation(() => {});
      const spyClassi = vi.spyOn(component, '_loadClassiUtente' as any).mockImplementation(() => {});
      component._loadAll();
      expect(spyUtente).toHaveBeenCalled();
      expect(spyClassi).toHaveBeenCalled();
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl('test'),
        cognome: new FormControl('user')
      });
      const controls = component.f;
      expect(controls['nome']).toBeDefined();
      expect(controls['cognome']).toBeDefined();
    });
  });

  describe('_hasControlError', () => {
    it('should return true when control has errors and is touched', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl(null, [Validators.required])
      });
      component._formGroup.get('nome')!.markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl('value', [Validators.required])
      });
      component._formGroup.get('nome')!.markAsTouched();
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control has errors but is not touched', () => {
      component._formGroup = new FormGroup({
        nome: new FormControl(null, [Validators.required])
      });
      expect(component._hasControlError('nome')).toBe(false);
    });
  });

  describe('_initForm', () => {
    it('should do nothing when data is null', () => {
      const originalGroup = component._formGroup;
      component._initForm(null);
      expect(component._formGroup).toBe(originalGroup);
    });

    it('should create form controls for email_aziendale with required and email validators', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ email_aziendale: 'test@example.com' });
      const ctrl = component._formGroup.get('email_aziendale');
      expect(ctrl).toBeDefined();
      expect(ctrl!.value).toBe('test@example.com');
      // required + email + maxLength
      ctrl!.setValue('');
      expect(ctrl!.valid).toBe(false);
    });

    it('should create form controls for email with email validator but not required', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ email: 'test@example.com' });
      const ctrl = component._formGroup.get('email');
      expect(ctrl).toBeDefined();
      // email is not required, so empty should be valid
      ctrl!.setValue(null);
      expect(ctrl!.valid).toBe(true);
      // but invalid email should fail
      ctrl!.setValue('notanemail');
      expect(ctrl!.valid).toBe(false);
    });

    it('should create form controls for nome/cognome/principal/telefono_aziendale with required', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({
        nome: 'Mario',
        cognome: 'Rossi',
        principal: 'mrossi',
        telefono_aziendale: '123456'
      });
      expect(component._formGroup.get('nome')!.value).toBe('Mario');
      expect(component._formGroup.get('cognome')!.value).toBe('Rossi');
      expect(component._formGroup.get('principal')!.value).toBe('mrossi');
      expect(component._formGroup.get('telefono_aziendale')!.value).toBe('123456');
      // All required
      component._formGroup.get('nome')!.setValue(null);
      expect(component._formGroup.get('nome')!.valid).toBe(false);
    });

    it('should create form controls for stato/id_organizzazione with required', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ stato: Stato.ABILITATO, id_organizzazione: 'org1' });
      expect(component._formGroup.get('stato')!.value).toBe(Stato.ABILITATO);
      expect(component._formGroup.get('id_organizzazione')!.value).toBe('org1');
      component._formGroup.get('stato')!.setValue(null);
      expect(component._formGroup.get('stato')!.valid).toBe(false);
    });

    it('should create form controls for telefono/metadati/note with maxLength only', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ telefono: '123', metadati: 'meta', note: 'a note' });
      expect(component._formGroup.get('telefono')!.value).toBe('123');
      // Not required, so null should be valid
      component._formGroup.get('telefono')!.setValue(null);
      expect(component._formGroup.get('telefono')!.valid).toBe(true);
    });

    it('should create form control for referente_tecnico as boolean', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ referente_tecnico: true });
      expect(component._formGroup.get('referente_tecnico')!.value).toBe(true);
    });

    it('should create form control for referente_tecnico defaulting to false', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ referente_tecnico: null });
      expect(component._formGroup.get('referente_tecnico')!.value).toBe(false);
    });

    it('should create default form controls for unknown keys', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ ruolo: Ruolo.GESTORE });
      expect(component._formGroup.get('ruolo')!.value).toBe(Ruolo.GESTORE);
    });

    it('should default null values properly', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ nome: null, email: null, telefono: null });
      expect(component._formGroup.get('nome')!.value).toBeNull();
      expect(component._formGroup.get('email')!.value).toBeNull();
    });

    it('should patch id_organizzazione when isEdit is true', () => {
      component._isEdit = true;
      component._utente = new Utente({
        stato: Stato.ABILITATO,
        organizzazione: { id_organizzazione: 'org123', nome: 'Test Org' }
      });
      component._initForm({ id_organizzazione: null, stato: Stato.ABILITATO });
      expect(component._formGroup.get('id_organizzazione')!.value).toBe('org123');
    });

    it('should disable stato and id_organizzazione when stato is PENDING_UPDATE', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.PENDING_UPDATE });
      component._initForm({ stato: Stato.PENDING_UPDATE, id_organizzazione: 'org1' });
      expect(component._statoArr).toEqual([Stato.PENDING_UPDATE]);
      expect(component._formGroup.get('stato')!.disabled).toBe(true);
      expect(component._formGroup.get('id_organizzazione')!.disabled).toBe(true);
    });

    it('should include NON_CONFIGURATO in statoArr when stato is NON_CONFIGURATO', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.NON_CONFIGURATO });
      component._initForm({ stato: Stato.NON_CONFIGURATO });
      expect(component._statoArr).toContain(Stato.NON_CONFIGURATO);
      expect(component._statoArr).not.toContain(Stato.PENDING_UPDATE);
    });

    it('should filter out NON_CONFIGURATO and PENDING_UPDATE for other stati', () => {
      component._isEdit = false;
      component._utente = new Utente({ stato: Stato.ABILITATO });
      component._initForm({ stato: Stato.ABILITATO });
      expect(component._statoArr).not.toContain(Stato.NON_CONFIGURATO);
      expect(component._statoArr).not.toContain(Stato.PENDING_UPDATE);
      expect(component._statoArr).toContain(Stato.ABILITATO);
      expect(component._statoArr).toContain(Stato.DISABILITATO);
    });
  });

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with utente name', () => {
      component.utente = { nome: 'Mario', cognome: 'Rossi' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[2].label).toBe('Mario Rossi');
    });

    it('should set breadcrumbs for new utente when utente is null', () => {
      component.utente = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[component.breadcrumbs.length - 1].label).toBe('APP.TITLE.New');
    });

    it('should set dashboard breadcrumbs when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component.utente = { nome: 'Mario', cognome: 'Rossi' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(2);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
    });
  });

  describe('_clickTab', () => {
    it('should change current tab', () => {
      component._clickTab('info');
      expect(component._currentTab).toBe('info');
    });
  });

  describe('_onCancelEdit', () => {
    it('should reset edit state', () => {
      component._isEdit = true;
      component._error = true;
      component._errorMsg = 'some error';
      component._isNew = false;
      component.utente = { nome: 'Test', cognome: 'User' };
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });

    it('should navigate when new and using route', () => {
      component._isNew = true;
      component._useRoute = true;
      component._onCancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['utenti']);
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
      component.onBreadcrumb({ url: '/utenti' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/utenti'], { queryParamsHandling: 'preserve' });
    });

    it('should call _onClose when not using route', () => {
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBreadcrumb({ url: '/utenti' });
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
    it('should not save if form is invalid', () => {
      component._isEdit = true;
      component._formGroup.setErrors({ invalid: true });
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });

    it('should not save if not in edit mode', () => {
      component._isEdit = false;
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });

    it('should call __onSave for new utente when form is valid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new FormGroup({
        nome: new FormControl('Mario')
      });
      const spy = vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit({}, true);
      expect(component._closeEdit).toBe(true);
      expect(spy).toHaveBeenCalledWith({ nome: 'Mario' });
    });

    it('should call __onUpdate for existing utente when form is valid', () => {
      component._isEdit = true;
      component._isNew = false;
      component.utente = { id_utente: 42 };
      component._formGroup = new FormGroup({
        nome: new FormControl('Mario')
      });
      const spy = vi.spyOn(component, '__onUpdate' as any).mockImplementation(() => {});
      component._onSubmit({}, false);
      expect(component._closeEdit).toBe(false);
      expect(spy).toHaveBeenCalledWith(42, { nome: 'Mario' });
    });
  });

  describe('__onSave', () => {
    it('should save and update state on success', () => {
      const response = {
        id_utente: 1,
        nome: 'Mario',
        cognome: 'Rossi',
        classi_utente: { id_classe_utente: 'c1', nome: 'Classe1' },
        id_organizzazione: 'org1'
      };
      mockApiService.saveElement.mockReturnValue(of(response));
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      component.__onSave({ nome: 'Mario' });

      expect(component._error).toBe(false);
      expect(component._spin).toBe(false);
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(component.id).toBe(1);
      expect(saveSpy).toHaveBeenCalledWith({ id: 1, utente: response, update: false });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['utenti', 1], { replaceUrl: true });
    });

    it('should handle save error', () => {
      const error = { status: 500, error: { detail: 'Server error' } };
      mockApiService.saveElement.mockReturnValue(throwError(() => error));

      component.__onSave({ nome: 'Mario' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._spin).toBe(false);
      expect(mockUtils.GetErrorMsg).toHaveBeenCalledWith(error);
    });

    it('should handle response without classi_utente', () => {
      const response = { id_utente: 2, nome: 'Luigi' };
      mockApiService.saveElement.mockReturnValue(of(response));
      component.__onSave({ nome: 'Luigi' });
      expect(component.id).toBe(2);
    });
  });

  describe('__onUpdate', () => {
    it('should update and set state on success', () => {
      const response = { id: 1, id_utente: 1, nome: 'Mario', cognome: 'Rossi', ruolo: Ruolo.GESTORE };
      mockApiService.putElement.mockReturnValue(of(response));
      component._closeEdit = true;
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      component.__onUpdate(1, { nome: 'Mario' });

      expect(component._isEdit).toBe(false); // _closeEdit=true => !true = false
      expect(component._spin).toBe(false);
      expect(component.utente.ruolo).toBe(Ruolo.GESTORE);
      expect(component._utente.ruolo).toBe(Ruolo.GESTORE);
      // this.id = this.utente.id which comes from new Utente({...response})
      expect(component.id).toBe(1);
      expect(saveSpy).toHaveBeenCalledWith({ id: 1, utente: response, update: true });
    });

    it('should keep edit mode when _closeEdit is false', () => {
      const response = { id_utente: 1, nome: 'Mario', cognome: 'Rossi' };
      mockApiService.putElement.mockReturnValue(of(response));
      component._closeEdit = false;

      component.__onUpdate(1, { nome: 'Mario' });

      expect(component._isEdit).toBe(true); // !false = true
    });

    it('should handle update error', () => {
      const error = { status: 400, error: { detail: 'Bad request' } };
      mockApiService.putElement.mockReturnValue(throwError(() => error));

      component.__onUpdate(1, { nome: 'Mario' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._spin).toBe(false);
    });
  });

  describe('_checkRuolo', () => {
    it('should return ruolo from data', () => {
      expect(component._checkRuolo({ ruolo: Ruolo.GESTORE })).toBe(Ruolo.GESTORE);
    });

    it('should return NESSUN_RUOLO when data has no ruolo', () => {
      expect(component._checkRuolo({})).toBe(Ruolo.NESSUN_RUOLO);
    });

    it('should return NESSUN_RUOLO for null data', () => {
      expect(component._checkRuolo(null)).toBe(Ruolo.NESSUN_RUOLO);
    });
  });

  describe('_prapareData', () => {
    it('should clean up body for API submission', () => {
      const body = {
        nome: 'Test',
        cognome: 'User',
        ruolo: Ruolo.NESSUN_RUOLO,
        classi_utente: null,
        organizzazione: { id: 1 }
      };
      const result = component._prapareData(body);
      expect(result.ruolo).toBeNull();
      expect(result.organizzazione).toBeUndefined();
      expect(mockUtils._removeEmpty).toHaveBeenCalled();
    });

    it('should keep ruolo when not NESSUN_RUOLO', () => {
      const body = {
        nome: 'Test',
        cognome: 'User',
        ruolo: Ruolo.GESTORE,
        classi_utente: null,
        organizzazione: {}
      };
      const result = component._prapareData(body);
      expect(result.ruolo).toBe(Ruolo.GESTORE);
    });

    it('should map classi_utente to id array', () => {
      const body = {
        nome: 'Test',
        ruolo: Ruolo.GESTORE,
        classi_utente: [{ id_classe_utente: 'c1' }, { id_classe_utente: 'c2' }],
        organizzazione: {}
      };
      const result = component._prapareData(body);
      expect(result.classi_utente).toEqual(['c1', 'c2']);
    });

    it('should set classi_utente to null when empty array', () => {
      const body = {
        nome: 'Test',
        ruolo: Ruolo.GESTORE,
        classi_utente: [],
        organizzazione: {}
      };
      const result = component._prapareData(body);
      expect(result.classi_utente).toBeNull();
    });
  });

  describe('_deleteUser', () => {
    it('should show confirm dialog and delete on confirm', () => {
      const onCloseSub = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() }
      });
      component.utente = { id_utente: 42 };

      component._deleteUser();

      expect(mockModalService.show).toHaveBeenCalled();
      // Simulate user confirming
      onCloseSub.next(true);

      expect(mockApiService.deleteElement).toHaveBeenCalledWith('utenti', 42);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['utenti']);
    });

    it('should not delete on cancel', () => {
      const onCloseSub = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() }
      });
      component.utente = { id_utente: 42 };

      component._deleteUser();

      // Simulate user cancelling
      onCloseSub.next(false);

      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      const onCloseSub = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() }
      });
      const error = { status: 500 };
      mockApiService.deleteElement.mockReturnValue(throwError(() => error));
      component.utente = { id_utente: 42 };

      component._deleteUser();
      onCloseSub.next(true);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
    });
  });

  describe('_loadUtente', () => {
    it('should not call API when id is null', () => {
      component.id = null;
      component._loadUtente();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load utente and set up state on success', () => {
      const response = {
        id_utente: 1,
        nome: 'Mario',
        cognome: 'Rossi',
        ruolo: Ruolo.GESTORE,
        classi_utente: { id_classe_utente: 'c1', nome: 'Classe1' },
        organizzazione: { id_organizzazione: 'org1', descrizione: 'Org One', nome: 'Org1' }
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component.id = 1;

      component._loadUtente();

      expect(component.utente).toBeDefined();
      expect(component._utente).toBeDefined();
      expect(component.utente.ruolo).toBe(Ruolo.GESTORE);
      expect(component._spin).toBe(false);
    });

    it('should call _initOrganizzazioniSelect with empty array when no organizzazione', () => {
      const response = {
        id_utente: 2,
        nome: 'Luigi',
        cognome: 'Verdi',
        classi_utente: null,
        organizzazione: null
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component.id = 2;
      const spy = vi.spyOn(component, '_initOrganizzazioniSelect' as any);

      component._loadUtente();

      // Should be called with empty array since organizzazione is null
      expect(spy).toHaveBeenCalledWith([]);
    });

    it('should call _initOrganizzazioniSelect with organizzazione data when present', () => {
      const response = {
        id_utente: 3,
        nome: 'Giulia',
        cognome: 'Bianchi',
        classi_utente: null,
        organizzazione: { id_organizzazione: 'org2', descrizione: 'Desc', nome: 'Org2' }
      };
      mockApiService.getDetails.mockReturnValue(of(response));
      component.id = 3;
      const spy = vi.spyOn(component, '_initOrganizzazioniSelect' as any);

      component._loadUtente();

      expect(spy).toHaveBeenCalledWith([{
        id_organizzazione: 'org2',
        descrizione: 'Desc',
        nome: 'Org2'
      }]);
    });

    it('should handle load error', () => {
      const error = { status: 404 };
      mockApiService.getDetails.mockReturnValue(throwError(() => error));
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      component.id = 1;

      component._loadUtente();

      expect(component._spin).toBe(false);
      expect(Tools.OnError).toHaveBeenCalledWith(error);
    });
  });

  describe('_loadClassiUtente', () => {
    it('should load classi utente successfully', () => {
      const content = [{ id_classe_utente: 'c1', nome: 'Classe1' }];
      mockApiService.getList.mockReturnValue(of({ content }));

      component._loadClassiUtente();

      expect(mockApiService.getList).toHaveBeenCalledWith('classi-utente');
      expect(component._classi_utente).toEqual(content);
    });

    it('should handle load error', () => {
      mockApiService.getList.mockReturnValue(throwError(() => ({ status: 500 })));
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

      component._loadClassiUtente();

      expect(Tools.OnError).toHaveBeenCalled();
    });
  });

  describe('_initClassiUtenteSelect', () => {
    it('should create an observable starting with default values', () => {
      const defaults = [{ id_classe_utente: 'c1', nome: 'Test' }];
      component._initClassiUtenteSelect(defaults);
      expect(component.classiUtente$).toBeDefined();

      // Subscribe and check the first emission is default values
      let emitted: any = null;
      component.classiUtente$.subscribe(val => emitted = val);
      expect(emitted).toEqual(defaults);
    });

    it('should call with empty array by default', () => {
      component._initClassiUtenteSelect();
      expect(component.classiUtente$).toBeDefined();

      let emitted: any = null;
      component.classiUtente$.subscribe(val => emitted = val);
      expect(emitted).toEqual([]);
    });

    it('should search classi utente when input is emitted via subject', () => {
      vi.useFakeTimers();
      const content = [{ id_classe_utente: 'c1', nome: 'Test' }];
      mockApiService.getList.mockReturnValue(of({ content }));

      component._initClassiUtenteSelect([]);
      const emissions: any[] = [];
      component.classiUtente$.subscribe(val => emissions.push(val));

      // First emission is the default value
      expect(emissions.length).toBe(1);
      expect(emissions[0]).toEqual([]);

      // Emit a search term through the subject
      component.classiUtenteInput$.next('test');
      vi.advanceTimersByTime(600); // past debounceTime(500)

      expect(component.classiUtenteLoading).toBe(false);
      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual(content);

      vi.useRealTimers();
    });

    it('should filter out null and short input terms', () => {
      vi.useFakeTimers();
      component._initClassiUtenteSelect([]);
      const emissions: any[] = [];
      component.classiUtente$.subscribe(val => emissions.push(val));

      // Emit null - should be filtered
      component.classiUtenteInput$.next(null as any);
      vi.advanceTimersByTime(600);
      expect(emissions.length).toBe(1); // only default

      // Emit empty string - length < minLengthTerm (1), should be filtered
      component.classiUtenteInput$.next('');
      vi.advanceTimersByTime(600);
      expect(emissions.length).toBe(1); // still only default

      vi.useRealTimers();
    });

    it('should handle API error in classi utente search with catchError', () => {
      vi.useFakeTimers();
      mockApiService.getList.mockReturnValue(throwError(() => new Error('API error')));

      component._initClassiUtenteSelect([]);
      const emissions: any[] = [];
      component.classiUtente$.subscribe(val => emissions.push(val));

      component.classiUtenteInput$.next('test');
      vi.advanceTimersByTime(600);

      // catchError should return empty array
      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual([]);

      vi.useRealTimers();
    });
  });

  describe('getClassiUtente', () => {
    it('should call API with correct params and map response', () => {
      const content = [{ id_classe_utente: 'c1', nome: 'Classe1' }];
      mockApiService.getList.mockReturnValue(of({ content }));

      let result: any = null;
      component.getClassiUtente('test').subscribe(val => result = val);

      expect(mockApiService.getList).toHaveBeenCalledWith('classi-utente', { params: { q: 'test', referente: true } });
      expect(result).toEqual(content);
    });

    it('should handle Error in response', () => {
      mockApiService.getList.mockReturnValue(of({ Error: 'Something went wrong' }));

      let result: any = null;
      component.getClassiUtente('test').subscribe(val => result = val);

      // When Error is present, throwError is called but not returned, so result is undefined
      expect(result).toBeUndefined();
    });

    it('should pass null term', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      let result: any = null;
      component.getClassiUtente(null).subscribe(val => result = val);

      expect(mockApiService.getList).toHaveBeenCalledWith('classi-utente', { params: { q: null, referente: true } });
      expect(result).toEqual([]);
    });
  });

  describe('_initOrganizzazioniSelect', () => {
    it('should create an observable starting with default values', () => {
      const defaults = [{ id_organizzazione: 'org1', nome: 'Test' }];
      component._initOrganizzazioniSelect(defaults);
      expect(component.organizzazioni$).toBeDefined();

      let emitted: any = null;
      component.organizzazioni$.subscribe(val => emitted = val);
      expect(emitted).toEqual(defaults);
    });

    it('should call with empty array by default', () => {
      component._initOrganizzazioniSelect();
      expect(component.organizzazioni$).toBeDefined();

      let emitted: any = null;
      component.organizzazioni$.subscribe(val => emitted = val);
      expect(emitted).toEqual([]);
    });

    it('should search organizzazioni when input is emitted via subject', () => {
      vi.useFakeTimers();
      const content = [{ id_organizzazione: 'org1', nome: 'Org1' }];
      mockApiService.getList.mockReturnValue(of({ content }));

      component._initOrganizzazioniSelect([]);
      const emissions: any[] = [];
      component.organizzazioni$.subscribe(val => emissions.push(val));

      expect(emissions.length).toBe(1);
      expect(emissions[0]).toEqual([]);

      component.organizzazioniInput$.next('test');
      vi.advanceTimersByTime(600);

      expect(component.organizzazioniLoading).toBe(false);
      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual(content);

      vi.useRealTimers();
    });

    it('should filter out null and short input terms', () => {
      vi.useFakeTimers();
      component._initOrganizzazioniSelect([]);
      const emissions: any[] = [];
      component.organizzazioni$.subscribe(val => emissions.push(val));

      component.organizzazioniInput$.next(null as any);
      vi.advanceTimersByTime(600);
      expect(emissions.length).toBe(1);

      component.organizzazioniInput$.next('');
      vi.advanceTimersByTime(600);
      expect(emissions.length).toBe(1);

      vi.useRealTimers();
    });

    it('should handle API error in organizzazioni search with catchError', () => {
      vi.useFakeTimers();
      mockApiService.getList.mockReturnValue(throwError(() => new Error('API error')));

      component._initOrganizzazioniSelect([]);
      const emissions: any[] = [];
      component.organizzazioni$.subscribe(val => emissions.push(val));

      component.organizzazioniInput$.next('test');
      vi.advanceTimersByTime(600);

      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual([]);

      vi.useRealTimers();
    });
  });

  describe('getOrganizzazioni', () => {
    it('should call API with correct params and map response', () => {
      const content = [{ id_organizzazione: 'org1', nome: 'Org1' }];
      mockApiService.getList.mockReturnValue(of({ content }));

      let result: any = null;
      component.getOrganizzazioni('test').subscribe(val => result = val);

      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: 'test' } });
      expect(result).toEqual(content);
    });

    it('should handle Error in response', () => {
      mockApiService.getList.mockReturnValue(of({ Error: 'Something went wrong' }));

      let result: any = null;
      component.getOrganizzazioni('test').subscribe(val => result = val);

      expect(result).toBeUndefined();
    });

    it('should pass null term', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      let result: any = null;
      component.getOrganizzazioni(null).subscribe(val => result = val);

      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: null } });
      expect(result).toEqual([]);
    });
  });

  describe('_compareClassiFn', () => {
    it('should compare by id_classe_utente', () => {
      expect(component._compareClassiFn(
        { id_classe_utente: 'a' },
        { id_classe_utente: 'a' }
      )).toBe(true);
      expect(component._compareClassiFn(
        { id_classe_utente: 'a' },
        { id_classe_utente: 'b' }
      )).toBe(false);
    });
  });

  describe('_editUser', () => {
    it('should enable edit mode and initialize form', () => {
      component._utente = new Utente({
        nome: 'Mario',
        cognome: 'Rossi',
        stato: Stato.ABILITATO,
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' }
      });
      component._formGroup = new FormGroup({
        ruolo: new FormControl('gestore'),
        id_organizzazione: new FormControl(null)
      });

      const initFormSpy = vi.spyOn(component, '_initForm' as any);
      const initOrgSpy = vi.spyOn(component, '_initOrganizzazioniSelect' as any);
      const changeRuoloSpy = vi.spyOn(component, '_changeRuolo' as any);

      component._editUser();

      expect(component._isEdit).toBe(true);
      expect(component._error).toBe(false);
      expect(initFormSpy).toHaveBeenCalled();
      expect(initOrgSpy).toHaveBeenCalledWith([component._utente.organizzazione]);
      expect(changeRuoloSpy).toHaveBeenCalled();
    });

    it('should call _initOrganizzazioniSelect with empty array when no organizzazione', () => {
      component._utente = new Utente({
        nome: 'Mario',
        cognome: 'Rossi',
        stato: Stato.ABILITATO
      });
      component._formGroup = new FormGroup({
        ruolo: new FormControl(null),
        id_organizzazione: new FormControl(null)
      });

      const initOrgSpy = vi.spyOn(component, '_initOrganizzazioniSelect' as any);
      component._editUser();

      expect(initOrgSpy).toHaveBeenCalledWith([]);
    });
  });

  describe('_changeRuolo', () => {
    it('should clear validators for Gestore role', () => {
      component._formGroup = new FormGroup({
        ruolo: new FormControl('gestore'),
        id_organizzazione: new FormControl(null, [Validators.required])
      });
      component._changeRuolo();
      expect(component._formGroup.get('id_organizzazione')?.valid).toBe(true);
    });

    it('should set required validator for non-Gestore role', () => {
      component._formGroup = new FormGroup({
        ruolo: new FormControl('referente_servizio'),
        id_organizzazione: new FormControl(null)
      });
      component._changeRuolo();
      expect(component._formGroup.get('id_organizzazione')?.valid).toBe(false);
    });

    it('should handle missing id_organizzazione control gracefully', () => {
      component._formGroup = new FormGroup({
        ruolo: new FormControl('gestore')
      });
      expect(() => component._changeRuolo()).not.toThrow();
    });

    it('should handle missing ruolo control', () => {
      component._formGroup = new FormGroup({
        id_organizzazione: new FormControl(null)
      });
      // ruolo is undefined, so role will be undefined, not 'gestore', so validators set to required
      component._changeRuolo();
      expect(component._formGroup.get('id_organizzazione')?.valid).toBe(false);
    });
  });

  describe('approveOrganizationChange', () => {
    let onCloseSub: Subject<any>;

    beforeEach(() => {
      onCloseSub = new Subject<any>();
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSub.asObservable() }
      });
      component.utente = {
        id_utente: 1,
        organizzazione: { id_organizzazione: 'org1', nome: 'Org1' },
        organizzazione_pending: { id_organizzazione: 'org2', nome: 'Org2' }
      };
      component._formGroup = new FormGroup({
        nome: new FormControl('Mario'),
        ruolo: new FormControl(Ruolo.GESTORE),
        id_organizzazione: new FormControl('org1')
      });
    });

    it('should show modal with correct state for existing org', () => {
      component.approveOrganizationChange();
      expect(mockModalService.show).toHaveBeenCalled();
      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].initialState.confirmColor).toBe('danger');
    });

    it('should show modal with confirm color for first org', () => {
      component.utente.organizzazione = null;
      component.approveOrganizationChange();
      const callArgs = mockModalService.show.mock.calls[0];
      expect(callArgs[1].initialState.confirmColor).toBe('confirm');
    });

    it('should call API and update state on confirm success', () => {
      const response = {
        id_utente: 1,
        nome: 'Mario',
        cognome: 'Rossi',
        ruolo: Ruolo.GESTORE,
        id_organizzazione: 'org2',
        organizzazione: { id_organizzazione: 'org2', nome: 'Org2' }
      };
      mockApiService.putElement.mockReturnValue(of(response));
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      component.approveOrganizationChange();
      onCloseSub.next(true);

      expect(mockApiService.putElement).toHaveBeenCalledWith('utenti', 1, expect.objectContaining({
        id_organizzazione: 'org2',
        organizzazione_pending: null
      }));
      expect(component._spin).toBe(false);
      expect(component._isEdit).toBe(false);
      expect(saveSpy).toHaveBeenCalledWith({ id: component.id, utente: response, update: true });
    });

    it('should set ruolo to null when NESSUN_RUOLO in form', () => {
      component._formGroup.get('ruolo')!.setValue(Ruolo.NESSUN_RUOLO);
      mockApiService.putElement.mockReturnValue(of({ id_utente: 1 }));

      component.approveOrganizationChange();
      onCloseSub.next(true);

      expect(mockUtils._removeEmpty).toHaveBeenCalledWith(expect.objectContaining({
        ruolo: null
      }));
    });

    it('should handle API error on confirm', () => {
      const error = { status: 500 };
      mockApiService.putElement.mockReturnValue(throwError(() => error));

      component.approveOrganizationChange();
      onCloseSub.next(true);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._spin).toBe(false);
    });

    it('should not call API on cancel', () => {
      component.approveOrganizationChange();
      onCloseSub.next(false);

      expect(mockApiService.putElement).not.toHaveBeenCalled();
    });
  });
});
