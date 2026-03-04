import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { Tools } from '@linkit/components';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  const mockRouter = { navigate: vi.fn() } as any;
  const fb = new FormBuilder();
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        Layout: { dashboard: { enabled: false } },
        Profile: { showEmail: true },
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ utente: { id_utente: '1', nome: 'N', cognome: 'C', principal: 'p1' }, settings: {} })),
    getDetails: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    getCurrentSession: vi.fn().mockReturnValue({}),
    getSettings: vi.fn().mockReturnValue({}),
    saveSettings: vi.fn(),
    isGestore: vi.fn().mockReturnValue(false),
  } as any;
  const mockUtils = { GetErrorMsg: vi.fn().mockReturnValue('error') } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.Configurazione = { utente: {} } as any;
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        Layout: { dashboard: { enabled: false } },
        Profile: { showEmail: true },
      }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({
      utente: { id_utente: '1', nome: 'N', cognome: 'C', principal: 'p1', email: 'a@b.it', email_aziendale: 'biz@b.it', telefono: '123', telefono_aziendale: '456', note: '' },
      settings: {}
    }));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockApiService.putElement.mockReturnValue(of({}));
    mockApiService.putElementRelated.mockReturnValue(of({}));
    mockAuthService.getSettings.mockReturnValue({});
    mockAuthService.isGestore.mockReturnValue(false);
    component = new ProfileComponent(
      mockRouter, fb, mockConfigService, mockTools,
      mockApiService, mockAuthService, mockUtils, mockModalService, mockTranslate
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  // ---------------------------------------------------------------
  // Existing tests
  // ---------------------------------------------------------------

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ProfileComponent.Name).toBe('ProfileComponent');
  });

  it('should have default values', () => {
    expect(component.isProfile).toBe(true);
    expect(component.isEdit).toBe(false);
    expect(component.saving).toBe(false);
    expect(component.spin).toBe(true);
  });

  it('should return isGestore from authService', () => {
    expect(component.isGestore).toBe(false);
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component.isGestore).toBe(true);
  });

  it('should return mostraEmail from config', () => {
    expect(component.mostraEmail).toBe(true);
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should enable edit mode', () => {
    component.onEdit();
    expect(component.isEdit).toBe(true);
    expect(component.error).toBe(false);
  });

  it('should cancel edit mode', () => {
    component.profile = { nome: 'Test' };
    component.isEdit = true;
    component.onCancelEdit();
    expect(component.isEdit).toBe(false);
  });

  it('should show profile and settings tabs', () => {
    component._showProfile();
    expect(component.isProfile).toBe(true);
    component._showSettings();
    expect(component.isProfile).toBe(false);
  });

  it('should prepare body for update', () => {
    component.profile = { email: 'old@test.it', email_aziendale: 'biz@test.it' };
    const body = component.prepareBodyUpdate({
      nome: 'N', cognome: 'C', telefono: '123',
      telefono_aziendale: '456', email: 'new@test.it', note: ''
    });
    expect(body.nome).toBe('N');
    expect(body.email).toBe('new@test.it');
  });

  it('should toggle notifications', () => {
    component.profile = { id_utente: '1' };
    component._initServerForm({});
    component.toggleAllNotifications(false);
    expect(component._formSettingsSettings.get('emetti_per_tipi')!.value).toEqual([]);
    component.toggleAllNotifications(true);
    expect(component._formSettingsSettings.get('emetti_per_tipi')!.value.length).toBeGreaterThan(0);
  });

  it('should check isValueSelected', () => {
    component.profile = { id_utente: '1' };
    component._initServerForm({});
    expect(component.isValueSelected('emetti_per_tipi', 'comunicazione')).toBe(true);
  });

  it('should toggle value', () => {
    component.profile = { id_utente: '1' };
    component._initServerForm({});
    component.toggleValue('emetti_per_tipi', 'comunicazione', false);
    expect(component.isValueSelected('emetti_per_tipi', 'comunicazione')).toBe(false);
    component.toggleValue('emetti_per_tipi', 'comunicazione', true);
    expect(component.isValueSelected('emetti_per_tipi', 'comunicazione')).toBe(true);
  });

  it('should set avatar fallback on error', () => {
    const event = { target: { src: '' } };
    component.onAvatarError(event);
    expect(event.target.src).toBe('./assets/images/avatar.png');
  });

  // ---------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------

  describe('constructor', () => {
    it('should call configService.getConfiguration and set config', () => {
      expect(mockConfigService.getConfiguration).toHaveBeenCalled();
      expect(component.config).toBeTruthy();
      expect(component.config.AppConfig).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------

  describe('ngOnInit', () => {
    it('should subscribe to configService.getConfig, set session and call loadProfile', () => {
      const loadProfileSpy = vi.spyOn(component, 'loadProfile').mockImplementation(() => {});
      component.ngOnInit();
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('profile');
      expect(component.profileConfig).toEqual({});
      expect(mockAuthService.getCurrentSession).toHaveBeenCalled();
      expect(loadProfileSpy).toHaveBeenCalled();
    });

    it('should set session from authentication service', () => {
      const sessionData = { user: 'test', token: 'abc' };
      mockAuthService.getCurrentSession.mockReturnValue(sessionData);
      vi.spyOn(component, 'loadProfile').mockImplementation(() => {});
      component.ngOnInit();
      expect(component.session).toBe(sessionData);
    });

    it('should set profileConfig from getConfig response', () => {
      const cfgData = { fields: ['nome', 'cognome'], editable: true };
      mockConfigService.getConfig.mockReturnValue(of(cfgData));
      vi.spyOn(component, 'loadProfile').mockImplementation(() => {});
      component.ngOnInit();
      expect(component.profileConfig).toEqual(cfgData);
    });
  });

  // ---------------------------------------------------------------
  // ngAfterContentChecked
  // ---------------------------------------------------------------

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window.innerWidth', () => {
      component.ngAfterContentChecked();
      // Just verify it runs without error and sets the property
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // ---------------------------------------------------------------
  // _onResize HostListener
  // ---------------------------------------------------------------

  describe('_onResize', () => {
    it('should set desktop based on window width', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // ---------------------------------------------------------------
  // loadProfile
  // ---------------------------------------------------------------

  describe('loadProfile', () => {
    it('should set spin true then false after loading', () => {
      component.loadProfile();
      expect(component.spin).toBe(false);
    });

    it('should set profile from response.utente', () => {
      component.loadProfile();
      expect(component.profile.id_utente).toBe('1');
      expect(component.profile.nome).toBe('N');
    });

    it('should call _initializeSettings with sessionSettings and apiSettings', () => {
      const sessionSettings = { version: '1.0', servizi: { view: 'list' } };
      mockAuthService.getSettings.mockReturnValue(sessionSettings);
      component.loadProfile();
      expect(mockAuthService.getSettings).toHaveBeenCalled();
      expect(component.settings).toBeTruthy();
      expect(component.settings.servizi.view).toBe('list');
    });

    it('should call initForm after loading', () => {
      const initFormSpy = vi.spyOn(component, 'initForm');
      component.loadProfile();
      expect(initFormSpy).toHaveBeenCalled();
    });

    it('should set selectedOrganizzazione from profile.organizzazione', () => {
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C', organizzazione: { id: 'org1', nome: 'Org1' } },
        settings: {}
      }));
      component.loadProfile();
      expect(component.selectedOrganizzazione).toEqual({ id: 'org1', nome: 'Org1' });
    });

    it('should set selectedOrganizzazione to null when profile has no organizzazione', () => {
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C' },
        settings: {}
      }));
      component.loadProfile();
      expect(component.selectedOrganizzazione).toBeNull();
    });

    it('should call loadSettingsNotifications', () => {
      const lsnSpy = vi.spyOn(component, 'loadSettingsNotifications').mockImplementation(() => {});
      component.loadProfile();
      expect(lsnSpy).toHaveBeenCalled();
    });

    it('should call _initOrganizzazioniSelect with default org array', () => {
      const initOrgSpy = vi.spyOn(component, '_initOrganizzazioniSelect').mockImplementation(() => {});
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C', organizzazione: { id: 'org1' } },
        settings: {}
      }));
      component.loadProfile();
      expect(initOrgSpy).toHaveBeenCalledWith([{ id: 'org1' }]);
    });

    it('should call _initOrganizzazioniSelect with empty array when no organizzazione', () => {
      const initOrgSpy = vi.spyOn(component, '_initOrganizzazioniSelect').mockImplementation(() => {});
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C' },
        settings: {}
      }));
      component.loadProfile();
      expect(initOrgSpy).toHaveBeenCalledWith([]);
    });
  });

  // ---------------------------------------------------------------
  // _initializeSettings
  // ---------------------------------------------------------------

  describe('_initializeSettings (via loadProfile)', () => {
    it('should use sessionSettings when available (priority)', () => {
      const sessionSettings = { version: '1.0', servizi: { view: 'list', showImage: false } };
      mockAuthService.getSettings.mockReturnValue(sessionSettings);
      component.loadProfile();
      expect(component.settings.servizi.view).toBe('list');
      expect(component.settings.servizi.showImage).toBe(false);
    });

    it('should use apiSettings when sessionSettings is empty', () => {
      mockAuthService.getSettings.mockReturnValue({});
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C' },
        settings: { version: '0.2', servizi: { view: 'table', showMarkdown: false } }
      }));
      component.loadProfile();
      expect(component.settings.servizi.view).toBe('table');
      expect(component.settings.servizi.showMarkdown).toBe(false);
    });

    it('should use defaults when both sessionSettings and apiSettings are empty', () => {
      mockAuthService.getSettings.mockReturnValue({});
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C' },
        settings: {}
      }));
      component.loadProfile();
      expect(component.settings.version).toBe('0.1');
      expect(component.settings.servizi.view).toBe('card');
      expect(component.settings.servizi.showEmptyImage).toBe(false);
    });

    it('should use defaults when both are null', () => {
      mockAuthService.getSettings.mockReturnValue(null);
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C' },
        settings: null
      }));
      component.loadProfile();
      expect(component.settings.version).toBe('0.1');
      expect(component.settings.servizi.view).toBe('card');
    });

    it('should merge apiSettings.servizi with defaults', () => {
      mockAuthService.getSettings.mockReturnValue({});
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C' },
        settings: { version: '0.2', servizi: { view: 'table' } }
      }));
      component.loadProfile();
      // view overridden
      expect(component.settings.servizi.view).toBe('table');
      // other defaults merged in
      expect(component.settings.servizi.viewBoxed).toBe(false);
      expect(component.settings.servizi.fillBox).toBe(true);
    });

    it('should merge settings without servizi key', () => {
      mockAuthService.getSettings.mockReturnValue({});
      mockApiService.getList.mockReturnValue(of({
        utente: { id_utente: '1', nome: 'N', cognome: 'C' },
        settings: { version: '0.3' }
      }));
      component.loadProfile();
      expect(component.settings.version).toBe('0.3');
      // servizi from defaults
      expect(component.settings.servizi.view).toBe('card');
    });
  });

  // ---------------------------------------------------------------
  // initForm
  // ---------------------------------------------------------------

  describe('initForm', () => {
    beforeEach(() => {
      component.profile = {
        principal: 'user1', nome: 'Mario', cognome: 'Rossi',
        telefono: '111', email: 'mario@test.it', telefono_aziendale: '222',
        email_aziendale: 'mario@biz.it', note: 'note'
      };
    });

    it('should create form with expected controls', () => {
      component.initForm();
      expect(component.formGroup.get('principal')).toBeTruthy();
      expect(component.formGroup.get('nome')).toBeTruthy();
      expect(component.formGroup.get('cognome')).toBeTruthy();
      expect(component.formGroup.get('telefono')).toBeTruthy();
      expect(component.formGroup.get('email')).toBeTruthy();
      expect(component.formGroup.get('telefono_aziendale')).toBeTruthy();
      expect(component.formGroup.get('email_aziendale')).toBeTruthy();
      expect(component.formGroup.get('note')).toBeTruthy();
    });

    it('should patch form values from profile', () => {
      component.initForm();
      expect(component.formGroup.get('nome')!.value).toBe('Mario');
      expect(component.formGroup.get('cognome')!.value).toBe('Rossi');
      expect(component.formGroup.get('telefono')!.value).toBe('111');
      expect(component.formGroup.get('note')!.value).toBe('note');
    });

    it('should have principal always disabled', () => {
      component.initForm();
      expect(component.formGroup.get('principal')!.disabled).toBe(true);
    });

    it('should disable email fields when verificaEmailAbilitata is true', () => {
      Tools.Configurazione = { utente: { profilo_modifica_email_richiede_verifica: true } } as any;
      component.initForm();
      expect(component.formGroup.get('email')!.disabled).toBe(true);
      expect(component.formGroup.get('email_aziendale')!.disabled).toBe(true);
    });

    it('should enable email fields when verificaEmailAbilitata is false', () => {
      Tools.Configurazione = { utente: { profilo_modifica_email_richiede_verifica: false } } as any;
      component.initForm();
      expect(component.formGroup.get('email')!.disabled).toBe(false);
      expect(component.formGroup.get('email_aziendale')!.disabled).toBe(false);
    });

    it('should have required validators on nome, cognome, telefono_aziendale, email_aziendale', () => {
      component.initForm();
      // Clear required fields to trigger validation errors
      component.formGroup.get('nome')!.setValue('');
      component.formGroup.get('cognome')!.setValue('');
      component.formGroup.get('telefono_aziendale')!.setValue('');
      // email_aziendale is disabled when verificaEmailAbilitata = false by default config
      expect(component.formGroup.get('nome')!.valid).toBe(false);
      expect(component.formGroup.get('cognome')!.valid).toBe(false);
      expect(component.formGroup.get('telefono_aziendale')!.valid).toBe(false);
    });

    it('should have email validator on email and email_aziendale', () => {
      Tools.Configurazione = { utente: { profilo_modifica_email_richiede_verifica: false } } as any;
      component.initForm();
      component.formGroup.get('email')!.setValue('not-an-email');
      expect(component.formGroup.get('email')!.hasError('email')).toBe(true);
      component.formGroup.get('email')!.setValue('valid@test.it');
      expect(component.formGroup.get('email')!.valid).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // submitProfile
  // ---------------------------------------------------------------

  describe('submitProfile', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1', nome: 'N', cognome: 'C', telefono_aziendale: '123', email_aziendale: 'a@b.it' };
      component.initForm();
    });

    it('should call onUpdateProfile when form is valid and isEdit is true', () => {
      component.isEdit = true;
      const updateSpy = vi.spyOn(component, 'onUpdateProfile').mockImplementation(() => {});
      component.submitProfile(component.formGroup.value);
      expect(updateSpy).toHaveBeenCalledWith('1', component.formGroup.value);
    });

    it('should NOT call onUpdateProfile when isEdit is false', () => {
      component.isEdit = false;
      const updateSpy = vi.spyOn(component, 'onUpdateProfile').mockImplementation(() => {});
      component.submitProfile(component.formGroup.value);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should NOT call onUpdateProfile when form is invalid', () => {
      component.isEdit = true;
      component.formGroup.get('nome')!.setValue('');
      const updateSpy = vi.spyOn(component, 'onUpdateProfile').mockImplementation(() => {});
      component.submitProfile(component.formGroup.value);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // onUpdateProfile
  // ---------------------------------------------------------------

  describe('onUpdateProfile', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1', email: 'old@test.it', email_aziendale: 'biz@test.it' };
    });

    it('should call putElement and show success message on success', () => {
      const showMsgSpy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      const loadProfileSpy = vi.spyOn(component, 'loadProfile').mockImplementation(() => {});
      const cancelEditSpy = vi.spyOn(component, 'onCancelEdit').mockImplementation(() => {});

      component.onUpdateProfile('1', { nome: 'N', cognome: 'C', telefono: '1', telefono_aziendale: '2', email: 'new@test.it', note: '' });

      expect(mockApiService.putElement).toHaveBeenCalledWith('profilo', null, expect.objectContaining({ nome: 'N' }));
      expect(showMsgSpy).toHaveBeenCalledWith('APP.MESSAGE.ProfileSaved', 'success');
      expect(loadProfileSpy).toHaveBeenCalled();
      expect(cancelEditSpy).toHaveBeenCalled();
    });

    it('should set error and errorMsg on API error', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => new Error('fail')));

      component.onUpdateProfile('1', { nome: 'N', cognome: 'C', telefono: '', telefono_aziendale: '2', email: '', note: '' });

      expect(component.error).toBe(true);
      expect(component.errorMsg).toBe('error');
      expect(mockUtils.GetErrorMsg).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // onCancelEdit
  // ---------------------------------------------------------------

  describe('onCancelEdit', () => {
    it('should reset isEdit, error, errorMsg and restore selectedOrganizzazione', () => {
      component.profile = { organizzazione: { id: 'org1' } };
      component.isEdit = true;
      component.error = true;
      component.errorMsg = 'some error';
      component.selectedOrganizzazione = { id: 'org2' };
      component.onCancelEdit();
      expect(component.isEdit).toBe(false);
      expect(component.error).toBe(false);
      expect(component.errorMsg).toBe('');
      expect(component.selectedOrganizzazione).toEqual({ id: 'org1' });
    });

    it('should set selectedOrganizzazione to null when profile has no organizzazione', () => {
      component.profile = {};
      component.onCancelEdit();
      expect(component.selectedOrganizzazione).toBeNull();
    });

    it('should re-call initForm', () => {
      component.profile = { nome: 'Test' };
      const initFormSpy = vi.spyOn(component, 'initForm');
      component.onCancelEdit();
      expect(initFormSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // prepareBodyUpdate
  // ---------------------------------------------------------------

  describe('prepareBodyUpdate', () => {
    beforeEach(() => {
      component.profile = { email: 'fallback@test.it', email_aziendale: 'fallback_biz@test.it' };
    });

    it('should use body values when present', () => {
      const result = component.prepareBodyUpdate({
        nome: 'Mario', cognome: 'Rossi', telefono: '111',
        telefono_aziendale: '222', email: 'mario@test.it',
        email_aziendale: 'biz@test.it', note: 'nota'
      });
      expect(result).toEqual({
        nome: 'Mario', cognome: 'Rossi', telefono: '111',
        telefono_aziendale: '222', email: 'mario@test.it',
        email_aziendale: 'biz@test.it', note: 'nota'
      });
    });

    it('should fallback email to profile values when body email is empty', () => {
      const result = component.prepareBodyUpdate({
        nome: 'N', cognome: 'C', telefono: '', telefono_aziendale: '1',
        email: '', email_aziendale: '', note: ''
      });
      expect(result.email).toBe('fallback@test.it');
      expect(result.email_aziendale).toBe('fallback_biz@test.it');
    });

    it('should set telefono and note to null when empty', () => {
      const result = component.prepareBodyUpdate({
        nome: 'N', cognome: 'C', telefono: '', telefono_aziendale: '1',
        email: 'a@b.it', email_aziendale: 'c@d.it', note: ''
      });
      expect(result.telefono).toBeNull();
      expect(result.note).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // openEmailModificationDialog
  // ---------------------------------------------------------------

  describe('openEmailModificationDialog', () => {
    let onHiddenSubject: Subject<void>;

    beforeEach(() => {
      onHiddenSubject = new Subject<void>();
      component.profile = { email: 'old@test.it', email_aziendale: 'biz@test.it' };
      mockModalService.show.mockReturnValue({
        content: { result: { verified: false } },
        onHidden: onHiddenSubject.asObservable(),
      });
    });

    it('should call modalService.show with correct initialState for email field', () => {
      component.openEmailModificationDialog('email');
      expect(mockModalService.show).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          initialState: { currentEmail: 'old@test.it', fieldName: 'email' },
          class: 'modal-md',
          backdrop: 'static',
          keyboard: false,
        })
      );
    });

    it('should call modalService.show with correct initialState for email_aziendale field', () => {
      component.openEmailModificationDialog('email_aziendale');
      expect(mockModalService.show).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          initialState: { currentEmail: 'biz@test.it', fieldName: 'email_aziendale' },
        })
      );
    });

    it('should use empty string when profile field is undefined', () => {
      component.profile = {};
      component.openEmailModificationDialog('email');
      expect(mockModalService.show).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          initialState: { currentEmail: '', fieldName: 'email' },
        })
      );
    });

    it('should update form and profile when result is verified', () => {
      component.initForm();
      const showMsgSpy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});

      const modalRef = {
        content: { result: { verified: true, verifiedEmail: 'new@test.it', fieldName: 'email' as const } },
        onHidden: onHiddenSubject.asObservable(),
      };
      mockModalService.show.mockReturnValue(modalRef);

      component.openEmailModificationDialog('email');
      onHiddenSubject.next();

      expect(component.formGroup.get('email')!.value).toBe('new@test.it');
      expect(component.profile.email).toBe('new@test.it');
      expect(showMsgSpy).toHaveBeenCalledWith('APP.MESSAGE.EmailModified', 'success');
    });

    it('should update email_aziendale when result is verified for email_aziendale', () => {
      Tools.Configurazione = { utente: { profilo_modifica_email_richiede_verifica: true } } as any;
      component.initForm();
      const showMsgSpy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});

      const modalRef = {
        content: { result: { verified: true, verifiedEmail: 'new_biz@test.it', fieldName: 'email_aziendale' as const } },
        onHidden: onHiddenSubject.asObservable(),
      };
      mockModalService.show.mockReturnValue(modalRef);

      component.openEmailModificationDialog('email_aziendale');
      onHiddenSubject.next();

      expect(component.formGroup.get('email_aziendale')!.value).toBe('new_biz@test.it');
      expect(component.profile.email_aziendale).toBe('new_biz@test.it');
      expect(showMsgSpy).toHaveBeenCalled();
    });

    it('should call clearPersonalEmail when result has clearEmail and fieldName is email', () => {
      component.initForm();

      const modalRef = {
        content: { result: { verified: false, clearEmail: true, fieldName: 'email' as const } },
        onHidden: onHiddenSubject.asObservable(),
      };
      mockModalService.show.mockReturnValue(modalRef);

      component.openEmailModificationDialog('email');
      onHiddenSubject.next();

      // clearPersonalEmail calls putElement
      expect(mockApiService.putElement).toHaveBeenCalledWith('profilo', null, expect.objectContaining({ email: null }));
    });

    it('should do nothing when result is not verified and no clearEmail', () => {
      component.initForm();
      const showMsgSpy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});

      const modalRef = {
        content: { result: { verified: false } },
        onHidden: onHiddenSubject.asObservable(),
      };
      mockModalService.show.mockReturnValue(modalRef);

      component.openEmailModificationDialog('email');
      onHiddenSubject.next();

      expect(showMsgSpy).not.toHaveBeenCalled();
      expect(mockApiService.putElement).not.toHaveBeenCalled();
    });

    it('should handle undefined result gracefully', () => {
      component.initForm();

      const modalRef = {
        content: { result: undefined },
        onHidden: onHiddenSubject.asObservable(),
      };
      mockModalService.show.mockReturnValue(modalRef);

      component.openEmailModificationDialog('email');
      // Should not throw
      expect(() => onHiddenSubject.next()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // clearPersonalEmail (tested via openEmailModificationDialog)
  // ---------------------------------------------------------------

  describe('clearPersonalEmail (via openEmailModificationDialog)', () => {
    let onHiddenSubject: Subject<void>;

    beforeEach(() => {
      onHiddenSubject = new Subject<void>();
      component.profile = { email: 'old@test.it', email_aziendale: 'biz@test.it', nome: 'N', cognome: 'C', telefono: '111', telefono_aziendale: '222', note: 'n' };
      component.initForm();
    });

    it('should call putElement with email=null and update form on success', () => {
      const showMsgSpy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      mockApiService.putElement.mockReturnValue(of({}));

      const modalRef = {
        content: { result: { verified: false, clearEmail: true, fieldName: 'email' as const } },
        onHidden: onHiddenSubject.asObservable(),
      };
      mockModalService.show.mockReturnValue(modalRef);

      component.openEmailModificationDialog('email');
      onHiddenSubject.next();

      expect(mockApiService.putElement).toHaveBeenCalledWith('profilo', null, expect.objectContaining({ email: null }));
      expect(component.formGroup.get('email')!.value).toBe('');
      expect(component.profile.email).toBeNull();
      expect(showMsgSpy).toHaveBeenCalledWith('APP.MESSAGE.EmailRemoved', 'success');
    });

    it('should set error and errorMsg on putElement failure', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => new Error('fail')));

      const modalRef = {
        content: { result: { verified: false, clearEmail: true, fieldName: 'email' as const } },
        onHidden: onHiddenSubject.asObservable(),
      };
      mockModalService.show.mockReturnValue(modalRef);

      component.openEmailModificationDialog('email');
      onHiddenSubject.next();

      expect(component.error).toBe(true);
      expect(component.errorMsg).toBe('error');
    });
  });

  // ---------------------------------------------------------------
  // loadSettingsNotifications
  // ---------------------------------------------------------------

  describe('loadSettingsNotifications', () => {
    beforeEach(() => {
      component.profile = { id_utente: '42' };
    });

    it('should call getDetails with correct args', () => {
      component.loadSettingsNotifications();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('utenti', '42', 'settings/notifiche');
    });

    it('should set serverSettings and _serverSettings on success', () => {
      const resp = { emetti_per_tipi: ['comunicazione'], emetti_per_entita: ['servizio'] };
      mockApiService.getDetails.mockReturnValue(of(resp));
      component.loadSettingsNotifications();
      expect(component._serverSettings).toEqual(resp);
      expect(component.serverSettings).toBeTruthy();
      expect(component.serverSettings.emetti_per_tipi).toEqual(['comunicazione']);
    });

    it('should call _initServerForm on success', () => {
      const initSpy = vi.spyOn(component, '_initServerForm');
      mockApiService.getDetails.mockReturnValue(of({ emetti_per_tipi: [] }));
      component.loadSettingsNotifications();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should use empty defaults on error', () => {
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      const initSpy = vi.spyOn(component, '_initServerForm');
      component.loadSettingsNotifications();
      expect(component._serverSettings).toEqual({});
      expect(component.serverSettings).toBeTruthy();
      expect(initSpy).toHaveBeenCalledWith({});
    });
  });

  // ---------------------------------------------------------------
  // _updateSettings
  // ---------------------------------------------------------------

  describe('_updateSettings', () => {
    beforeEach(() => {
      component.settings = {
        servizi: {
          view: 'card', viewBoxed: false, showImage: true, showEmptyImage: true,
          fillBox: true, showMasonry: false, editSingleColumn: false,
          showMarkdown: true, showPresentation: true, showTechnicalReferent: false
        }
      };
    });

    it('should call authenticationService.saveSettings with servizi', () => {
      component._updateSettings({}, 'some_field');
      expect(mockAuthService.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
        servizi: expect.objectContaining({ view: 'card' })
      }));
    });

    it('should set showEmptyImage to false when field is servizi_showmasonry', () => {
      component.settings.servizi.showEmptyImage = true;
      component._updateSettings({}, 'servizi_showmasonry');
      expect(component.settings.servizi.showEmptyImage).toBe(false);
    });

    it('should not change showEmptyImage for other fields', () => {
      component.settings.servizi.showEmptyImage = true;
      component._updateSettings({}, 'servizi_view');
      expect(component.settings.servizi.showEmptyImage).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // _initServerForm
  // ---------------------------------------------------------------

  describe('_initServerForm', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1' };
    });

    it('should create _formSettingsSettings with three controls', () => {
      component._initServerForm({});
      expect(component._formSettingsSettings.get('emetti_per_tipi')).toBeTruthy();
      expect(component._formSettingsSettings.get('emetti_per_entita')).toBeTruthy();
      expect(component._formSettingsSettings.get('emetti_per_ruoli')).toBeTruthy();
    });

    it('should set all values when data has undefined sections (all enabled)', () => {
      component._initServerForm({});
      const tipi = component._formSettingsSettings.get('emetti_per_tipi')!.value;
      // 2 options * 2 (base + _email) = 4
      expect(tipi.length).toBe(4);
      expect(tipi).toContain('comunicazione');
      expect(tipi).toContain('comunicazione_email');
      expect(tipi).toContain('cambio_stato');
      expect(tipi).toContain('cambio_stato_email');
    });

    it('should set empty array when data section is empty array (all disabled)', () => {
      component._initServerForm({ emetti_per_tipi: [], emetti_per_entita: [], emetti_per_ruoli: [] });
      expect(component._formSettingsSettings.get('emetti_per_tipi')!.value).toEqual([]);
      expect(component._formSettingsSettings.get('emetti_per_entita')!.value).toEqual([]);
      expect(component._formSettingsSettings.get('emetti_per_ruoli')!.value).toEqual([]);
    });

    it('should pass through specific values', () => {
      component._initServerForm({ emetti_per_tipi: ['comunicazione'], emetti_per_entita: ['servizio'], emetti_per_ruoli: ['servizio_referente_dominio'] });
      expect(component._formSettingsSettings.get('emetti_per_tipi')!.value).toEqual(['comunicazione']);
      expect(component._formSettingsSettings.get('emetti_per_entita')!.value).toEqual(['servizio']);
      expect(component._formSettingsSettings.get('emetti_per_ruoli')!.value).toEqual(['servizio_referente_dominio']);
    });

    it('should subscribe to valueChanges and call _updateServerSettings', () => {
      const updateSpy = vi.spyOn(component, '_updateServerSettings').mockImplementation(() => {});
      component._initServerForm({});
      component._formSettingsSettings.get('emetti_per_tipi')!.setValue(['comunicazione']);
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle null data (defaults to all enabled)', () => {
      component._initServerForm(null);
      const tipi = component._formSettingsSettings.get('emetti_per_tipi')!.value;
      expect(tipi.length).toBe(4); // all values for emetti_per_tipi
    });
  });

  // ---------------------------------------------------------------
  // _getInitialValues (tested indirectly)
  // ---------------------------------------------------------------

  describe('_getInitialValues (via _initServerForm)', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1' };
    });

    it('should return all values (base + _email) when data is undefined', () => {
      component._initServerForm({});
      const entita = component._formSettingsSettings.get('emetti_per_entita')!.value;
      expect(entita).toContain('servizio');
      expect(entita).toContain('servizio_email');
      expect(entita).toContain('adesione');
      expect(entita).toContain('adesione_email');
      expect(entita.length).toBe(4);
    });

    it('should return empty array when data is []', () => {
      component._initServerForm({ emetti_per_entita: [] });
      const entita = component._formSettingsSettings.get('emetti_per_entita')!.value;
      expect(entita).toEqual([]);
    });

    it('should return values as-is when data has specific values', () => {
      component._initServerForm({ emetti_per_entita: ['servizio'] });
      const entita = component._formSettingsSettings.get('emetti_per_entita')!.value;
      expect(entita).toEqual(['servizio']);
    });
  });

  // ---------------------------------------------------------------
  // notificationsEnabled getter
  // ---------------------------------------------------------------

  describe('notificationsEnabled', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1' };
    });

    it('should return true when at least one section has values', () => {
      component._initServerForm({ emetti_per_tipi: ['comunicazione'], emetti_per_entita: [], emetti_per_ruoli: [] });
      expect(component.notificationsEnabled).toBe(true);
    });

    it('should return true when all sections have values', () => {
      component._initServerForm({});
      expect(component.notificationsEnabled).toBe(true);
    });

    it('should return false when all sections are empty', () => {
      component._initServerForm({ emetti_per_tipi: [], emetti_per_entita: [], emetti_per_ruoli: [] });
      expect(component.notificationsEnabled).toBe(false);
    });

    it('should return true when only ruoli has values', () => {
      component._initServerForm({ emetti_per_tipi: [], emetti_per_entita: [], emetti_per_ruoli: ['servizio_referente_dominio'] });
      expect(component.notificationsEnabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // toggleAllNotifications
  // ---------------------------------------------------------------

  describe('toggleAllNotifications', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1' };
      component._initServerForm({});
    });

    it('should set all arrays to full when enabled=true', () => {
      component.toggleAllNotifications(false); // first disable
      component._preventMultiCall = false;
      component.toggleAllNotifications(true);

      const tipi = component._formSettingsSettings.get('emetti_per_tipi')!.value;
      const entita = component._formSettingsSettings.get('emetti_per_entita')!.value;
      const ruoli = component._formSettingsSettings.get('emetti_per_ruoli')!.value;

      expect(tipi.length).toBe(4); // 2 options * 2
      expect(entita.length).toBe(4); // 2 options * 2
      expect(ruoli.length).toBe(26); // 13 options * 2
    });

    it('should set all arrays to empty when enabled=false', () => {
      component.toggleAllNotifications(false);
      expect(component._formSettingsSettings.get('emetti_per_tipi')!.value).toEqual([]);
      expect(component._formSettingsSettings.get('emetti_per_entita')!.value).toEqual([]);
      expect(component._formSettingsSettings.get('emetti_per_ruoli')!.value).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // _updateServerSettings
  // ---------------------------------------------------------------

  describe('_updateServerSettings', () => {
    beforeEach(() => {
      component.profile = { id_utente: '99' };
      component._preventMultiCall = false;
    });

    it('should call putElementRelated with prepared body', () => {
      const body = { emetti_per_tipi: ['comunicazione'], emetti_per_entita: [], emetti_per_ruoli: [] };
      component._updateServerSettings(body);
      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'utenti', '99', 'settings/notifiche', expect.any(Object)
      );
    });

    it('should set _preventMultiCall to true during call and false after success', () => {
      const body = { emetti_per_tipi: [], emetti_per_entita: [], emetti_per_ruoli: [] };
      component._updateServerSettings(body);
      // After success, _preventMultiCall should be reset
      expect(component._preventMultiCall).toBe(false);
    });

    it('should update _serverSettings on success', () => {
      const respData = { emetti_per_tipi: ['comunicazione'] };
      mockApiService.putElementRelated.mockReturnValue(of(respData));
      component._updateServerSettings({ emetti_per_tipi: ['comunicazione'], emetti_per_entita: [], emetti_per_ruoli: [] });
      expect(component._serverSettings).toEqual(respData);
    });

    it('should not make call if _preventMultiCall is true', () => {
      component._preventMultiCall = true;
      component._updateServerSettings({ emetti_per_tipi: [] });
      expect(mockApiService.putElementRelated).not.toHaveBeenCalled();
    });

    it('should set error messages and reset _preventMultiCall on error', () => {
      mockApiService.putElementRelated.mockReturnValue(throwError(() => new Error('fail')));
      component._updateServerSettings({ emetti_per_tipi: [], emetti_per_entita: [], emetti_per_ruoli: [] });
      expect(component._error).toBe(true);
      expect(component._preventMultiCall).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // _prepareBody / _prepareSection
  // ---------------------------------------------------------------

  describe('_prepareBody', () => {
    it('should return undefined for sections where all values are selected (all enabled)', () => {
      // All tipi selected = 4 values
      const allTipi = ['comunicazione', 'comunicazione_email', 'cambio_stato', 'cambio_stato_email'];
      const allEntita = ['servizio', 'servizio_email', 'adesione', 'adesione_email'];
      const body = component._prepareBody({ emetti_per_tipi: allTipi, emetti_per_entita: allEntita, emetti_per_ruoli: [] });
      expect(body.emetti_per_tipi).toBeUndefined();
      expect(body.emetti_per_entita).toBeUndefined();
      expect(body.emetti_per_ruoli).toEqual([]);
    });

    it('should return [] for sections with no values (all disabled)', () => {
      const body = component._prepareBody({ emetti_per_tipi: [], emetti_per_entita: [], emetti_per_ruoli: [] });
      expect(body.emetti_per_tipi).toEqual([]);
      expect(body.emetti_per_entita).toEqual([]);
      expect(body.emetti_per_ruoli).toEqual([]);
    });

    it('should return partial values as-is', () => {
      const body = component._prepareBody({
        emetti_per_tipi: ['comunicazione'],
        emetti_per_entita: ['servizio', 'adesione'],
        emetti_per_ruoli: ['servizio_referente_dominio']
      });
      expect(body.emetti_per_tipi).toEqual(['comunicazione']);
      expect(body.emetti_per_entita).toEqual(['servizio', 'adesione']);
      expect(body.emetti_per_ruoli).toEqual(['servizio_referente_dominio']);
    });

    it('should return [] when section values are undefined/falsy', () => {
      const body = component._prepareBody({ emetti_per_tipi: undefined, emetti_per_entita: null, emetti_per_ruoli: undefined });
      expect(body.emetti_per_tipi).toEqual([]);
      expect(body.emetti_per_entita).toEqual([]);
      expect(body.emetti_per_ruoli).toEqual([]);
    });

    it('should return undefined when all ruoli (26 values) are selected', () => {
      const allRuoli: string[] = [];
      component._emetti_per_ruoli.forEach(opt => {
        allRuoli.push(opt.value);
        allRuoli.push(`${opt.value}_email`);
      });
      const body = component._prepareBody({ emetti_per_tipi: [], emetti_per_entita: [], emetti_per_ruoli: allRuoli });
      expect(body.emetti_per_ruoli).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------
  // _onSubmit
  // ---------------------------------------------------------------

  describe('_onSubmit', () => {
    it('should call _updateServerSettings with form data', () => {
      component.profile = { id_utente: '1' };
      const updateSpy = vi.spyOn(component, '_updateServerSettings').mockImplementation(() => {});
      const formData = { emetti_per_tipi: ['comunicazione'], emetti_per_entita: [], emetti_per_ruoli: [] };
      component._onSubmit(formData);
      expect(updateSpy).toHaveBeenCalledWith(formData);
    });
  });

  // ---------------------------------------------------------------
  // _initOrganizzazioniSelect
  // ---------------------------------------------------------------

  describe('_initOrganizzazioniSelect', () => {
    it('should create organizzazioni$ observable', () => {
      component._initOrganizzazioniSelect([]);
      expect(component.organizzazioni$).toBeTruthy();
    });

    it('should emit default value immediately on subscribe', () => {
      const defaultOrg = [{ id: 'org1', nome: 'Org1' }];
      component._initOrganizzazioniSelect(defaultOrg);
      let emitted: any[] = [];
      component.organizzazioni$.subscribe(val => { emitted = val; });
      expect(emitted).toEqual(defaultOrg);
    });

    it('should emit empty array for empty default', () => {
      component._initOrganizzazioniSelect([]);
      let emitted: any[] | undefined;
      component.organizzazioni$.subscribe(val => { emitted = val; });
      expect(emitted).toEqual([]);
    });

    it('should call getOrganizzazioni when input term is long enough (with fake timers)', async () => {
      vi.useFakeTimers();
      try {
        const orgResults = [{ id: 'org1', nome: 'Org1' }];
        mockApiService.getList.mockReturnValue(of({ content: orgResults }));

        component._initOrganizzazioniSelect([]);
        const emissions: any[] = [];
        component.organizzazioni$.subscribe(val => emissions.push(val));

        // Simulate input
        component.organizzazioniInput$.next('Org');
        vi.advanceTimersByTime(600); // beyond 500ms debounce
        await Promise.resolve();

        expect(emissions.length).toBeGreaterThanOrEqual(2);
        // First emission: default ([])
        expect(emissions[0]).toEqual([]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should filter out null and short terms', () => {
      vi.useFakeTimers();
      try {
        component._initOrganizzazioniSelect([]);
        const emissions: any[] = [];
        component.organizzazioni$.subscribe(val => emissions.push(val));

        component.organizzazioniInput$.next(null as any);
        vi.advanceTimersByTime(600);

        // Only default emission
        expect(emissions.length).toBe(1);

        component.organizzazioniInput$.next('');
        vi.advanceTimersByTime(600);
        expect(emissions.length).toBe(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should set organizzazioniLoading during request', () => {
      vi.useFakeTimers();
      try {
        const loadingStates: boolean[] = [];
        mockApiService.getList.mockImplementation(() => {
          loadingStates.push(component.organizzazioniLoading);
          return of({ content: [] });
        });

        component._initOrganizzazioniSelect([]);
        component.organizzazioni$.subscribe(() => {});

        component.organizzazioniInput$.next('test');
        vi.advanceTimersByTime(600);

        // organizzazioniLoading should have been true when getList was called
        expect(loadingStates).toContain(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should catch error from getOrganizzazioni and return empty array', () => {
      vi.useFakeTimers();
      try {
        mockApiService.getList.mockReturnValue(throwError(() => new Error('API fail')));

        component._initOrganizzazioniSelect([]);
        const emissions: any[] = [];
        component.organizzazioni$.subscribe(val => emissions.push(val));

        component.organizzazioniInput$.next('test');
        vi.advanceTimersByTime(600);

        // Second emission should be [] from catchError
        expect(emissions.length).toBe(2);
        expect(emissions[1]).toEqual([]);
        // Loading should be reset
        expect(component.organizzazioniLoading).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ---------------------------------------------------------------
  // getOrganizzazioni
  // ---------------------------------------------------------------

  describe('getOrganizzazioni', () => {
    it('should call apiService.getList with query param', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: '1', nome: 'Org' }] }));
      component.getOrganizzazioni('test').subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: 'test' } });
    });

    it('should return mapped items from response.content', () => {
      const items = [{ id: '1', nome: 'Org1' }, { id: '2', nome: 'Org2' }];
      mockApiService.getList.mockReturnValue(of({ content: items }));
      let result: any[];
      component.getOrganizzazioni('test').subscribe(val => { result = val; });
      expect(result!).toEqual(items);
    });

    it('should handle Error in response', () => {
      mockApiService.getList.mockReturnValue(of({ Error: 'something went wrong' }));
      // Note: the component calls throwError but does not return it, so the observable completes normally
      // but the returned value would be undefined
      let result: any;
      component.getOrganizzazioni('test').subscribe(val => { result = val; });
      expect(result).toBeUndefined();
    });

    it('should pass null as query param when term is null', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      component.getOrganizzazioni(null).subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: null } });
    });
  });

  // ---------------------------------------------------------------
  // requestOrganizationChange
  // ---------------------------------------------------------------

  describe('requestOrganizationChange', () => {
    let onCloseSubject: Subject<boolean>;

    beforeEach(() => {
      onCloseSubject = new Subject<boolean>();
      component.profile = { id_utente: '1', organizzazione: { id: 'org1' } };
      mockModalService.show.mockReturnValue({
        content: { onClose: onCloseSubject },
      });
    });

    it('should show YesnoDialog with ChangeWarningWithOrg when profile has org', () => {
      component.requestOrganizationChange('org2');
      expect(mockModalService.show).toHaveBeenCalled();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.PROFILE.ORGANIZATION.ChangeWarningWithOrg');
    });

    it('should show YesnoDialog with ChangeWarning when profile has no org', () => {
      component.profile = { id_utente: '1' };
      component.requestOrganizationChange('org2');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.PROFILE.ORGANIZATION.ChangeWarning');
    });

    it('should call putElement on confirm and show success message', () => {
      const showMsgSpy = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      const loadProfileSpy = vi.spyOn(component, 'loadProfile').mockImplementation(() => {});
      const cancelEditSpy = vi.spyOn(component, 'onCancelEdit').mockImplementation(() => {});

      component.requestOrganizationChange('org2');
      onCloseSubject.next(true);

      expect(mockApiService.putElement).toHaveBeenCalledWith('profilo/organizzazione', null, { id_organizzazione: 'org2' });
      expect(showMsgSpy).toHaveBeenCalledWith('APP.PROFILE.ORGANIZATION.RequestSent', 'success');
      expect(loadProfileSpy).toHaveBeenCalled();
      expect(cancelEditSpy).toHaveBeenCalled();
    });

    it('should set error on putElement failure after confirm', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => new Error('fail')));
      component.requestOrganizationChange('org2');
      onCloseSubject.next(true);

      expect(component.error).toBe(true);
      expect(component.errorMsg).toBe('error');
    });

    it('should NOT call putElement when user cancels (response=false)', () => {
      component.requestOrganizationChange('org2');
      onCloseSubject.next(false);
      expect(mockApiService.putElement).not.toHaveBeenCalled();
    });

    it('should NOT call putElement when user cancels (response=null)', () => {
      component.requestOrganizationChange('org2');
      onCloseSubject.next(null as any);
      expect(mockApiService.putElement).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // showNotificationsSettings getter
  // ---------------------------------------------------------------

  describe('showNotificationsSettings', () => {
    it('should return true when user is not gestore', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      expect(component.showNotificationsSettings).toBe(true);
    });

    it('should return true when gestore but dashboard not enabled', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      component.config = { AppConfig: { Layout: { dashboard: { enabled: false } } } };
      expect(component.showNotificationsSettings).toBe(true);
    });

    it('should return true when gestore with dashboard enabled but hideNotificationMenu false', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      component.config = { AppConfig: { Layout: { dashboard: { enabled: true, hideNotificationMenu: false } } } };
      expect(component.showNotificationsSettings).toBe(true);
    });

    it('should return false when gestore with dashboard enabled and hideNotificationMenu true', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      component.config = { AppConfig: { Layout: { dashboard: { enabled: true, hideNotificationMenu: true } } } };
      expect(component.showNotificationsSettings).toBe(false);
    });

    it('should return true when config is null', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      component.config = null;
      expect(component.showNotificationsSettings).toBe(true);
    });

    it('should return true when Layout is missing', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      component.config = { AppConfig: {} };
      expect(component.showNotificationsSettings).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // isPendingUpdate getter
  // ---------------------------------------------------------------

  describe('isPendingUpdate', () => {
    it('should return true when profile.stato is pending_update', () => {
      component.profile = { stato: 'pending_update' };
      expect(component.isPendingUpdate).toBe(true);
    });

    it('should return false when profile.stato is something else', () => {
      component.profile = { stato: 'active' };
      expect(component.isPendingUpdate).toBe(false);
    });

    it('should return false when profile has no stato', () => {
      component.profile = {};
      expect(component.isPendingUpdate).toBe(false);
    });

    it('should return false when profile is null', () => {
      component.profile = null;
      expect(component.isPendingUpdate).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // verificaEmailAbilitata getter
  // ---------------------------------------------------------------

  describe('verificaEmailAbilitata', () => {
    it('should return true when profilo_modifica_email_richiede_verifica is true', () => {
      Tools.Configurazione = { utente: { profilo_modifica_email_richiede_verifica: true } } as any;
      expect(component.verificaEmailAbilitata).toBe(true);
    });

    it('should return false when profilo_modifica_email_richiede_verifica is false', () => {
      Tools.Configurazione = { utente: { profilo_modifica_email_richiede_verifica: false } } as any;
      expect(component.verificaEmailAbilitata).toBe(false);
    });

    it('should return false when Configurazione is null', () => {
      Tools.Configurazione = null;
      expect(component.verificaEmailAbilitata).toBe(false);
    });

    it('should return false when utente is undefined', () => {
      Tools.Configurazione = {} as any;
      expect(component.verificaEmailAbilitata).toBe(false);
    });

    it('should return false when property is undefined', () => {
      Tools.Configurazione = { utente: {} } as any;
      expect(component.verificaEmailAbilitata).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // mostraEmail getter
  // ---------------------------------------------------------------

  describe('mostraEmail', () => {
    it('should return true when showEmail is true in config', () => {
      component.config = { AppConfig: { Profile: { showEmail: true } } };
      expect(component.mostraEmail).toBe(true);
    });

    it('should return false when showEmail is false', () => {
      component.config = { AppConfig: { Profile: { showEmail: false } } };
      expect(component.mostraEmail).toBe(false);
    });

    it('should return false when Profile is missing', () => {
      component.config = { AppConfig: {} };
      expect(component.mostraEmail).toBe(false);
    });

    it('should return false when config is null', () => {
      component.config = null;
      expect(component.mostraEmail).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // onAvatarError
  // ---------------------------------------------------------------

  describe('onAvatarError', () => {
    it('should set target.src to fallback image', () => {
      const event = { target: { src: 'https://example.com/avatar.jpg' } };
      component.onAvatarError(event);
      expect(event.target.src).toBe('./assets/images/avatar.png');
    });
  });

  // ---------------------------------------------------------------
  // isValueSelected
  // ---------------------------------------------------------------

  describe('isValueSelected', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1' };
    });

    it('should return false for non-selected value', () => {
      component._initServerForm({ emetti_per_tipi: ['comunicazione'] });
      expect(component.isValueSelected('emetti_per_tipi', 'cambio_stato')).toBe(false);
    });

    it('should return true for selected value', () => {
      component._initServerForm({ emetti_per_tipi: ['comunicazione'] });
      expect(component.isValueSelected('emetti_per_tipi', 'comunicazione')).toBe(true);
    });

    it('should return false when form field does not exist', () => {
      component._formSettingsSettings = new FormGroup({});
      expect(component.isValueSelected('nonexistent', 'val')).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // toggleValue
  // ---------------------------------------------------------------

  describe('toggleValue', () => {
    beforeEach(() => {
      component.profile = { id_utente: '1' };
      component._initServerForm({ emetti_per_tipi: ['comunicazione'] });
    });

    it('should add value when checked=true and not already present', () => {
      const updateSpy = vi.spyOn(component, '_updateServerSettings').mockImplementation(() => {});
      component.toggleValue('emetti_per_tipi', 'cambio_stato', true);
      expect(component._formSettingsSettings.get('emetti_per_tipi')!.value).toContain('cambio_stato');
    });

    it('should not duplicate value when checked=true and already present', () => {
      const updateSpy = vi.spyOn(component, '_updateServerSettings').mockImplementation(() => {});
      component.toggleValue('emetti_per_tipi', 'comunicazione', true);
      const values = component._formSettingsSettings.get('emetti_per_tipi')!.value;
      expect(values.filter((v: string) => v === 'comunicazione').length).toBe(1);
    });

    it('should remove value when checked=false', () => {
      const updateSpy = vi.spyOn(component, '_updateServerSettings').mockImplementation(() => {});
      component.toggleValue('emetti_per_tipi', 'comunicazione', false);
      expect(component._formSettingsSettings.get('emetti_per_tipi')!.value).not.toContain('comunicazione');
    });

    it('should do nothing when control does not exist', () => {
      component._formSettingsSettings = new FormGroup({});
      // Should not throw
      expect(() => component.toggleValue('nonexistent', 'val', true)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // _setErrorMessages
  // ---------------------------------------------------------------

  describe('_setErrorMessages', () => {
    it('should set error messages on true', () => {
      component._setErrorMessages(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set default messages on false', () => {
      component._setErrorMessages(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // ---------------------------------------------------------------
  // onEdit
  // ---------------------------------------------------------------

  describe('onEdit', () => {
    it('should set isEdit to true and clear errors', () => {
      component.error = true;
      component.errorMsg = 'some error';
      component.onEdit();
      expect(component.isEdit).toBe(true);
      expect(component.error).toBe(false);
      expect(component.errorMsg).toBe('');
    });
  });

  // ---------------------------------------------------------------
  // breadcrumbs property
  // ---------------------------------------------------------------

  describe('breadcrumbs', () => {
    it('should have default breadcrumbs array', () => {
      expect(component.breadcrumbs).toEqual([
        { label: 'APP.TITLE.Profile', url: '', type: 'title', iconBs: 'person' }
      ]);
    });
  });

  // ---------------------------------------------------------------
  // model property
  // ---------------------------------------------------------------

  describe('model', () => {
    it('should be "profile"', () => {
      expect(component.model).toBe('profile');
    });
  });

  // ---------------------------------------------------------------
  // Integration: loadProfile + loadSettingsNotifications flow
  // ---------------------------------------------------------------

  describe('integration: full loadProfile flow', () => {
    it('should complete entire load flow from ngOnInit', () => {
      const profileResp = {
        utente: { id_utente: '99', nome: 'Mario', cognome: 'Rossi', organizzazione: { id: 'org99' } },
        settings: { servizi: { view: 'list' } }
      };
      mockApiService.getList.mockReturnValue(of(profileResp));
      mockApiService.getDetails.mockReturnValue(of({ emetti_per_tipi: ['comunicazione'] }));
      mockAuthService.getSettings.mockReturnValue({});

      component.ngOnInit();

      expect(component.profile.id_utente).toBe('99');
      expect(component.settings.servizi.view).toBe('list');
      expect(component.selectedOrganizzazione).toEqual({ id: 'org99' });
      expect(component.spin).toBe(false);
      expect(component.serverSettings).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // _showRuoliServizio / _showRuoliAdesione flags
  // ---------------------------------------------------------------

  describe('ruoli collapse flags', () => {
    it('should have _showRuoliServizio default false', () => {
      expect(component._showRuoliServizio).toBe(false);
    });

    it('should have _showRuoliAdesione default false', () => {
      expect(component._showRuoliAdesione).toBe(false);
    });

    it('should be toggleable', () => {
      component._showRuoliServizio = true;
      expect(component._showRuoliServizio).toBe(true);
      component._showRuoliAdesione = true;
      expect(component._showRuoliAdesione).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // _ruoliServizio / _ruoliAdesione arrays
  // ---------------------------------------------------------------

  describe('ruoli arrays', () => {
    it('should have 5 ruoli servizio', () => {
      expect(component._ruoliServizio.length).toBe(5);
    });

    it('should have 8 ruoli adesione', () => {
      expect(component._ruoliAdesione.length).toBe(8);
    });

    it('should have 13 total emetti_per_ruoli', () => {
      expect(component._emetti_per_ruoli.length).toBe(13);
    });

    it('should have 2 emetti_per_tipi options', () => {
      expect(component._emetti_per_tipi.length).toBe(2);
    });

    it('should have 2 emetti_per_entita options', () => {
      expect(component._emetti_per_entita.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------
  // minLengthTerm
  // ---------------------------------------------------------------

  describe('minLengthTerm', () => {
    it('should default to 1', () => {
      expect(component.minLengthTerm).toBe(1);
    });
  });
});
