import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError, EMPTY } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Tools } from '@linkit/components';
import { AdesioneDetailsComponent } from './adesione-details.component';
import { Adesione } from './adesione';
import { AdesioneCreate } from './adesioneCreate';
import { AdesioneUpdate } from './adesioneUpdate';

describe('AdesioneDetailsComponent', () => {
  let component: AdesioneDetailsComponent;

  const mockRoute = {
    params: of({ id: 'new' }),
    queryParams: of({}),
    data: of({}),
    parent: { params: of({}) },
  } as any;
  const mockRouter = { navigate: vi.fn(), navigateByUrl: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Services: { hideVersions: false }, GOVAPI: { HOST: 'http://localhost' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({ body: new Blob() })),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    __confirmCambioStatoServizio: vi.fn(),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    isGestore: vi.fn().mockReturnValue(false),
    isCoordinatore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    hasPermission: vi.fn().mockReturnValue(true),
    getUser: vi.fn().mockReturnValue({ ruolo: 'referente_servizio' }),
    _getConfigModule: vi.fn().mockReturnValue({}),
    getCurrentSession: vi.fn().mockReturnValue(null),
    canJoin: vi.fn().mockReturnValue(true),
    canDownloadSchedaAdesione: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
  } as any;
  const mockLocation = { back: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.OnError = vi.fn();
    Tools.showMessage = vi.fn();
    Tools.WorkflowErrorMsg = vi.fn().mockReturnValue('workflow error');
    Tools.Configurazione = null;
    component = new AdesioneDetailsComponent(
      mockRoute, mockRouter, mockTranslate,
      mockModalService, mockConfigService, mockTools,
      mockEventsManager, mockApiService, mockUtils,
      mockAuthService, mockLocation
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  // ─── Creation and defaults ───

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneDetailsComponent.Name).toBe('AdesioneDetailsComponent');
  });

  it('should have model set to adesioni', () => {
    expect(component.model).toBe('adesioni');
  });

  it('should have default state', () => {
    expect(component.id).toBeNull();
    expect(component.adesione).toBeNull();
    expect(component.config).toBeNull();
  });

  it('should have close and save outputs', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  it('should initialize appConfig from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should set apiUrl from appConfig', () => {
    expect(component.apiUrl).toBe('http://localhost');
  });

  it('should have default tabs with details', () => {
    expect(component.tabs.length).toBe(1);
    expect(component.tabs[0].link).toBe('details');
  });

  it('should have _isDetails true by default', () => {
    expect(component._isDetails).toBe(true);
  });

  it('should have _editable true by default', () => {
    expect(component._editable).toBe(true);
  });

  it('should have _deleteable false by default', () => {
    expect(component._deleteable).toBe(false);
  });

  it('should have _isNew false by default', () => {
    expect(component._isNew).toBe(false);
  });

  it('should have _useRoute true by default', () => {
    expect(component._useRoute).toBe(true);
  });

  it('should have _downloading true by default', () => {
    expect(component._downloading).toBe(true);
  });

  it('should have _changingStatus false by default', () => {
    expect(component._changingStatus).toBe(false);
  });

  it('should have _error false by default', () => {
    expect(component._error).toBe(false);
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
  });

  it('should have _otherActions with download_scheda', () => {
    const downloadAction = component._otherActions.find((a: any) => a.action === 'download_scheda');
    expect(downloadAction).toBeTruthy();
    expect(downloadAction!.enabled).toBe(true);
  });

  it('should have minLengthTerm set to 1', () => {
    expect(component.minLengthTerm).toBe(1);
  });

  it('should have placeholder paths defined', () => {
    expect(component._subscriptionPlaceHolder).toContain('logo-placeholder');
    expect(component._organizationLogoPlaceholder).toContain('organization-placeholder');
    expect(component._subscriptionLogoPlaceholder).toContain('subscription-placeholder');
  });

  // ─── _initForm ───

  describe('_initForm', () => {
    it('should do nothing if data is null', () => {
      const prevGroup = component._formGroup;
      component._initForm(null);
      expect(component._formGroup).toBe(prevGroup);
    });

    it('should create form controls from AdesioneCreate data', () => {
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      expect(component._formGroup.get('id_servizio')).toBeTruthy();
      expect(component._formGroup.get('id_soggetto')).toBeTruthy();
      expect(component._formGroup.get('id_organizzazione')).toBeTruthy();
      expect(component._formGroup.get('referente')).toBeTruthy();
      expect(component._formGroup.get('referente_tecnico')).toBeTruthy();
    });

    it('should set id_servizio as required', () => {
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const ctrl = component._formGroup.get('id_servizio')!;
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should disable id_servizio when _isWeb is true', () => {
      component._isWeb = true;
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      expect(component._formGroup.get('id_servizio')!.disabled).toBe(true);
    });

    it('should not disable id_servizio when _isWeb is false', () => {
      component._isWeb = false;
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      expect(component._formGroup.get('id_servizio')!.disabled).toBe(false);
    });

    it('should set id_soggetto as required', () => {
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const ctrl = component._formGroup.get('id_soggetto')!;
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should set id_organizzazione as required', () => {
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const ctrl = component._formGroup.get('id_organizzazione')!;
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should disable id_organizzazione when value is already set', () => {
      const data = { ...new AdesioneCreate(), id_organizzazione: 'org-123' };
      component._initForm(data);
      expect(component._formGroup.get('id_organizzazione')!.disabled).toBe(true);
    });

    it('should not disable id_organizzazione when value is null', () => {
      const data = { ...new AdesioneCreate(), id_organizzazione: null };
      component._initForm(data);
      expect(component._formGroup.get('id_organizzazione')!.disabled).toBe(false);
    });

    it('should set referente_tecnico without required validator', () => {
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const ctrl = component._formGroup.get('referente_tecnico')!;
      expect(ctrl.hasValidator(Validators.required)).toBe(false);
    });

    it('should set referente as required when _isNew and referente_obbligatorio', () => {
      component._isNew = true;
      component.generalConfig = { adesione: { referente_obbligatorio: true, scelta_libera_organizzazione: false } };
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const ctrl = component._formGroup.get('referente')!;
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should not set referente as required when referente_obbligatorio is false', () => {
      component._isNew = true;
      component.generalConfig = { adesione: { referente_obbligatorio: false, scelta_libera_organizzazione: false } };
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const ctrl = component._formGroup.get('referente')!;
      expect(ctrl.hasValidator(Validators.required)).toBe(false);
    });

    it('should disable servizio_nome and soggetto_nome', () => {
      const data = { ...new AdesioneCreate(), servizio_nome: 'Srv1', soggetto_nome: 'Sog1' };
      component._initForm(data);
      expect(component._formGroup.get('servizio_nome')!.disabled).toBe(true);
      expect(component._formGroup.get('soggetto_nome')!.disabled).toBe(true);
    });

    it('should handle id_logico with required validator by default', () => {
      const data = { ...new AdesioneCreate(), id_logico: 'logico-1' };
      component._initForm(data);
      const ctrl = component._formGroup.get('id_logico')!;
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should handle data_creazione and data_ultimo_aggiornamento as disabled', () => {
      const data = { ...new AdesioneUpdate(), data_creazione: '2025-01-01T00:00:00', data_ultimo_aggiornamento: '2025-06-01T12:00:00' };
      component._initForm(data);
      expect(component._formGroup.get('data_creazione')!.disabled).toBe(true);
      expect(component._formGroup.get('data_ultimo_aggiornamento')!.disabled).toBe(true);
    });
  });

  // ─── f getter ───

  describe('f getter', () => {
    it('should return formGroup controls', () => {
      component._formGroup = new FormGroup({ test: new FormControl('val') });
      expect(component.f['test']).toBeDefined();
      expect(component.f['test'].value).toBe('val');
    });
  });

  // ─── _hasControlError ───

  describe('_hasControlError', () => {
    it('should return false when control has no errors', () => {
      component._formGroup = new FormGroup({ name: new FormControl('ok') });
      expect(component._hasControlError('name')).toBe(false);
    });

    it('should return true when control has errors and is touched', () => {
      component._formGroup = new FormGroup({ name: new FormControl('', [Validators.required]) });
      const ctrl = component._formGroup.get('name')!;
      ctrl.markAsTouched();
      expect(component._hasControlError('name')).toBe(true);
    });

    it('should return false when control does not exist', () => {
      component._formGroup = new FormGroup({});
      expect(component._hasControlError('nonexistent')).toBe(false);
    });
  });

  // ─── _isVisibilita ───

  describe('_isVisibilita', () => {
    it('should return true when visibilita matches', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl('pubblica') });
      expect(component._isVisibilita('pubblica')).toBe(true);
    });

    it('should return false when visibilita does not match', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl('privata') });
      expect(component._isVisibilita('pubblica')).toBe(false);
    });

    it('should return false when visibilita control does not exist', () => {
      component._formGroup = new FormGroup({});
      expect(component._isVisibilita('pubblica')).toBeFalsy();
    });
  });

  // ─── _prepareBodySaveAdesione ───

  describe('_prepareBodySaveAdesione', () => {
    it('should build body with id_soggetto and id_servizio', () => {
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: null };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.id_soggetto).toBe('sog-1');
      expect(result.id_servizio).toBe('srv-1');
    });

    it('should use _id_servizio when _isWeb is true', () => {
      component._isWeb = true;
      component._id_servizio = 'web-srv-1';
      const body = { id_soggetto: 'sog-1', id_servizio: null, id_logico: null, referente: null, referente_tecnico: null };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.id_servizio).toBe('web-srv-1');
    });

    it('should use _disabled_id_soggetto as fallback for id_soggetto', () => {
      component._disabled_id_soggetto = 'disabled-sog';
      const body = { id_soggetto: null, id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: null };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.id_soggetto).toBe('disabled-sog');
    });

    it('should include referenti array with current user when _isSelfReferente is true', () => {
      component._isSelfReferente = true;
      mockAuthService.getUser.mockReturnValueOnce({ id_utente: 'current-user', ruolo: 'referente_servizio' });
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: 'user-1', referente_tecnico: null };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.referenti).toEqual([{ id_utente: 'current-user', tipo: 'referente' }]);
    });

    it('should include referenti array with referente when _isSelfReferente is false', () => {
      component._isSelfReferente = false;
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: 'user-1', referente_tecnico: null };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.referenti).toEqual([{ id_utente: 'user-1', tipo: 'referente' }]);
    });

    it('should include referenti array with referente_tecnico', () => {
      component._isSelfReferente = false;
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: 'user-2' };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.referenti).toEqual([{ id_utente: 'user-2', tipo: 'referente_tecnico' }]);
    });

    it('should include both referente and referente_tecnico when _isSelfReferente is false', () => {
      component._isSelfReferente = false;
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: 'user-1', referente_tecnico: 'user-2' };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.referenti.length).toBe(2);
      expect(result.referenti[0]).toEqual({ id_utente: 'user-1', tipo: 'referente' });
      expect(result.referenti[1]).toEqual({ id_utente: 'user-2', tipo: 'referente_tecnico' });
    });

    it('should include current user as referente and referente_tecnico when _isSelfReferente is true', () => {
      component._isSelfReferente = true;
      mockAuthService.getUser.mockReturnValueOnce({ id_utente: 'current-user', ruolo: 'referente_servizio' });
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: 'user-1', referente_tecnico: 'user-2' };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.referenti.length).toBe(2);
      expect(result.referenti[0]).toEqual({ id_utente: 'current-user', tipo: 'referente' });
      expect(result.referenti[1]).toEqual({ id_utente: 'user-2', tipo: 'referente_tecnico' });
    });

    it('should set referenti to null when no referente or referente_tecnico', () => {
      component._isSelfReferente = false;
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: null };
      const result = component._prepareBodySaveAdesione(body);
      // referenti is null so _removeNullProperties removes it
      expect(result.referenti).toBeUndefined();
    });

    it('should include id_logico when provided', () => {
      const body = { id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: 'logico-1', referente: null, referente_tecnico: null };
      const result = component._prepareBodySaveAdesione(body);
      expect(result.id_logico).toBe('logico-1');
    });
  });

  // ─── _prepareBodyUpdateAdesione ───

  describe('_prepareBodyUpdateAdesione', () => {
    it('should build body with identificativo and stato', () => {
      const body = { id_logico: 'log-1', id_soggetto: 'sog-1', id_servizio: 'srv-1', stato: 'bozza' };
      const result = component._prepareBodyUpdateAdesione(body);
      expect(result.identificativo.id_logico).toBe('log-1');
      expect(result.identificativo.id_soggetto).toBe('sog-1');
      expect(result.identificativo.id_servizio).toBe('srv-1');
      expect(result.stato).toBe('bozza');
    });

    it('should use _disabled_id_soggetto as fallback', () => {
      component._disabled_id_soggetto = 'fallback-sog';
      const body = { id_logico: null, id_soggetto: null, id_servizio: 'srv-1', stato: 'bozza' };
      const result = component._prepareBodyUpdateAdesione(body);
      expect(result.identificativo.id_soggetto).toBe('fallback-sog');
    });

    it('should override id_servizio when _id_servizio is set', () => {
      component._id_servizio = 'override-srv';
      const body = { id_logico: null, id_soggetto: 'sog-1', id_servizio: 'srv-1', stato: 'bozza' };
      const result = component._prepareBodyUpdateAdesione(body);
      expect(result.identificativo.id_servizio).toBe('override-srv');
    });

    it('should remove null properties from identificativo', () => {
      const body = { id_logico: null, id_soggetto: 'sog-1', id_servizio: null, stato: 'pubblicato' };
      const result = component._prepareBodyUpdateAdesione(body);
      expect(result.identificativo.hasOwnProperty('id_logico')).toBe(false);
      expect(result.identificativo.hasOwnProperty('id_servizio')).toBe(false);
      expect(result.stato).toBe('pubblicato');
    });
  });

  // ─── _removeNullProperties ───

  describe('_removeNullProperties', () => {
    it('should remove null properties', () => {
      const obj = { a: 1, b: null, c: 'hello' };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1, c: 'hello' });
    });

    it('should remove undefined properties', () => {
      const obj: any = { a: 1, b: undefined };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1 });
    });

    it('should keep zero and empty string', () => {
      const obj = { a: 0, b: '', c: false };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 0, b: '', c: false });
    });

    it('should handle empty object', () => {
      const obj = {};
      component._removeNullProperties(obj);
      expect(obj).toEqual({});
    });
  });

  // ─── _onSubmit ───

  describe('_onSubmit', () => {
    it('should call __onSave when _isNew and form is valid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new FormGroup({ id_servizio: new FormControl('srv-1') });
      const spy = vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit({ id_servizio: 'srv-1' });
      expect(spy).toHaveBeenCalledWith({ id_servizio: 'srv-1' });
    });

    it('should call __onUpdate when not _isNew and form is valid', () => {
      component._isEdit = true;
      component._isNew = false;
      component.adesione = { id_adesione: 'ade-1' };
      component._formGroup = new FormGroup({ id_servizio: new FormControl('srv-1') });
      const spy = vi.spyOn(component, '__onUpdate' as any).mockImplementation(() => {});
      component._onSubmit({ id_servizio: 'srv-1' });
      expect(spy).toHaveBeenCalledWith('ade-1', { id_servizio: 'srv-1' });
    });

    it('should not call __onSave or __onUpdate when not _isEdit', () => {
      component._isEdit = false;
      component._isNew = true;
      component._formGroup = new FormGroup({ id_servizio: new FormControl('srv-1') });
      const saveSpy = vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      const updateSpy = vi.spyOn(component, '__onUpdate' as any).mockImplementation(() => {});
      component._onSubmit({ id_servizio: 'srv-1' });
      expect(saveSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should not call __onSave when form is invalid', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new FormGroup({ id_servizio: new FormControl('', [Validators.required]) });
      const spy = vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit({ id_servizio: '' });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set _closeEdit from parameter', () => {
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = new FormGroup({ id_servizio: new FormControl('srv-1') });
      vi.spyOn(component, '__onSave' as any).mockImplementation(() => {});
      component._onSubmit({ id_servizio: 'srv-1' }, false);
      expect(component._closeEdit).toBe(false);
    });
  });

  // ─── __onSave ───

  describe('__onSave', () => {
    it('should call apiService.saveElement and update state on success', () => {
      const response = {
        id_adesione: 'ade-new',
        soggetto: { organizzazione: { nome: 'Org' } },
        servizio: { nome: 'Srv', versione: '1' },
        id_logico: null
      };
      mockApiService.saveElement.mockReturnValue(of(response));
      component.__onSave({ id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: null });
      expect(mockApiService.saveElement).toHaveBeenCalled();
      expect(component.id).toBe('ade-new');
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(component._spin).toBe(false);
    });

    it('should navigate to new id after save', () => {
      const response = {
        id_adesione: 'ade-new',
        soggetto: { organizzazione: { nome: 'Org' } },
        servizio: { nome: 'Srv', versione: '1' },
        id_logico: null
      };
      mockApiService.saveElement.mockReturnValue(of(response));
      component.__onSave({ id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: null });
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should set _error on failure', () => {
      mockApiService.saveElement.mockReturnValue(throwError(() => ({ status: 400 })));
      component.__onSave({ id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: null });
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._spin).toBe(false);
    });

    it('should set _spin to true during save', () => {
      let capturedSpin = false;
      mockApiService.saveElement.mockImplementation(() => {
        capturedSpin = component._spin;
        return of({
          id_adesione: 'ade-new',
          soggetto: { organizzazione: { nome: 'Org' } },
          servizio: { nome: 'Srv', versione: '1' },
          id_logico: null
        });
      });
      component.__onSave({ id_soggetto: 'sog-1', id_servizio: 'srv-1', id_logico: null, referente: null, referente_tecnico: null });
      expect(capturedSpin).toBe(true);
    });
  });

  // ─── __onUpdate ───

  describe('__onUpdate', () => {
    it('should call apiService.putElement on update', () => {
      const response = { id_adesione: 'ade-1', stato: 'bozza' };
      mockApiService.putElement.mockReturnValue(of(response));
      component._closeEdit = true;
      component.__onUpdate('ade-1', { id_logico: null, id_soggetto: 'sog-1', id_servizio: 'srv-1', stato: 'bozza' });
      expect(mockApiService.putElement).toHaveBeenCalledWith('adesioni', 'ade-1', expect.any(Object));
      expect(component._spin).toBe(false);
    });

    it('should emit save event on successful update', () => {
      const response = { id_adesione: 'ade-1', stato: 'bozza' };
      mockApiService.putElement.mockReturnValue(of(response));
      const saveSpy = vi.spyOn(component.save, 'emit');
      component._closeEdit = true;
      component.__onUpdate('ade-1', { id_logico: null, id_soggetto: 'sog-1', id_servizio: 'srv-1', stato: 'bozza' });
      expect(saveSpy).toHaveBeenCalledWith({ id: 'ade-1', payment: response, update: true });
    });

    it('should set _isEdit based on _closeEdit', () => {
      mockApiService.putElement.mockReturnValue(of({ id_adesione: 'ade-1' }));
      component._closeEdit = false;
      component.__onUpdate('ade-1', { id_logico: null, id_soggetto: 'sog-1', id_servizio: 'srv-1', stato: 'bozza' });
      expect(component._isEdit).toBe(true);
    });

    it('should set _error on update failure', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => ({ status: 500 })));
      component.__onUpdate('ade-1', { id_logico: null, id_soggetto: 'sog-1', id_servizio: 'srv-1', stato: 'bozza' });
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._spin).toBe(false);
    });
  });

  // ─── _initBreadcrumb ───

  describe('_initBreadcrumb', () => {
    it('should set New title when adesione is null and id is null', () => {
      component.adesione = null;
      component.id = null;
      component._initBreadcrumb();
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.New');
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
    });

    it('should set id as title when adesione is null and id is set', () => {
      component.adesione = null;
      component.id = 42;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('42');
    });

    it('should set full title when adesione is present', () => {
      component.adesione = {
        soggetto: { organizzazione: { nome: 'OrgA' } },
        servizio: { nome: 'ServizioX', versione: '2' },
        id_logico: null
      };
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('OrgA - ServizioX v. 2');
    });

    it('should use id_logico in title when present', () => {
      component.adesione = {
        soggetto: { organizzazione: { nome: 'OrgA' } },
        servizio: { nome: 'ServizioX', versione: '2' },
        id_logico: 'MY-LOGICO'
      };
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('MY-LOGICO (OrgA)');
    });

    it('should use dashboard breadcrumbs when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component._serviceBreadcrumbs = null;
      component.adesione = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
    });

    it('should prepend serviceBreadcrumbs when present', () => {
      component._serviceBreadcrumbs = {
        breadcrumbs: [{ label: 'SrvBC', url: '/servizi/1', type: 'link' }],
        service: { id_servizio: 'srv-1' }
      } as any;
      component.adesione = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('SrvBC');
      expect(component.breadcrumbs.length).toBe(3);
    });

    it('should use service-based baseUrl when _serviceBreadcrumbs is present', () => {
      component._serviceBreadcrumbs = {
        breadcrumbs: [],
        service: { id_servizio: 'srv-99' }
      } as any;
      component.adesione = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].url).toBe('/servizi/srv-99/adesioni/');
    });
  });

  // ─── _clickTab ───

  describe('_clickTab', () => {
    it('should set _currentTab', () => {
      component._clickTab('clients');
      expect(component._currentTab).toBe('clients');
    });
  });

  // ─── _onClose ───

  describe('_onClose', () => {
    it('should emit close event with id and subscription', () => {
      const spy = vi.spyOn(component.close, 'emit');
      component.id = 5;
      component._adesione = new Adesione({ id_adesione: 'ade-5' });
      component._onClose();
      expect(spy).toHaveBeenCalledWith({ id: 5, subscription: component._adesione });
    });
  });

  // ─── _onSave (output) ───

  describe('_onSave (output)', () => {
    it('should emit save event with id and subscription', () => {
      const spy = vi.spyOn(component.save, 'emit');
      component.id = 7;
      component._adesione = new Adesione({ id_adesione: 'ade-7' });
      component._onSave();
      expect(spy).toHaveBeenCalledWith({ id: 7, subscription: component._adesione });
    });
  });

  // ─── _onCancelEdit ───

  describe('_onCancelEdit', () => {
    it('should reset _isEdit and error state', () => {
      component._isEdit = true;
      component._error = true;
      component._errorMsg = 'some error';
      component._isNew = false;
      component.adesione = { id_adesione: 'ade-1' };
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });

    it('should call location.back when _isNew and _useRoute', () => {
      component._isNew = true;
      component._useRoute = true;
      component._onCancelEdit();
      expect(mockLocation.back).toHaveBeenCalled();
    });

    it('should emit close when _isNew and not _useRoute', () => {
      component._isNew = true;
      component._useRoute = false;
      const spy = vi.spyOn(component.close, 'emit');
      component._onCancelEdit();
      expect(spy).toHaveBeenCalledWith({ id: component.id, subscription: null });
    });

    it('should recreate _adesione from adesione when not _isNew', () => {
      component._isNew = false;
      component.adesione = { id_adesione: 'ade-1', stato: 'bozza' };
      component._onCancelEdit();
      expect(component._adesione.id_adesione).toBe('ade-1');
    });
  });

  // ─── onBreadcrumb ───

  describe('onBreadcrumb', () => {
    it('should navigate to event url when _useRoute is true', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/adesioni' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni'], { queryParamsHandling: 'preserve' });
    });

    it('should call _onClose when _useRoute is false', () => {
      component._useRoute = false;
      const spy = vi.spyOn(component, '_onClose');
      component.onBreadcrumb({ url: '/adesioni' });
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── onActionMonitor ───

  describe('onActionMonitor', () => {
    it('should navigate to /adesioni on backview action', () => {
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni'], expect.any(Object));
    });

    it('should call _downloadSchedaAdesione on download_scheda action', () => {
      const spy = vi.spyOn(component, '_downloadSchedaAdesione').mockImplementation(() => {});
      component.onActionMonitor({ action: 'download_scheda' });
      expect(spy).toHaveBeenCalled();
    });

    it('should navigate to comunicazioni on comunicazioni action', () => {
      component.onActionMonitor({ action: 'comunicazioni' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['comunicazioni'], expect.any(Object));
    });
  });

  // ─── onWorkflowAction ───

  describe('onWorkflowAction', () => {
    it('should call utils.__confirmCambioStatoServizio', () => {
      component.adesione = { stato: 'bozza' };
      const event = { status: { nome: 'pubblicato' } };
      component.onWorkflowAction(event);
      expect(mockUtils.__confirmCambioStatoServizio).toHaveBeenCalledWith(event, component.adesione, expect.any(Function));
    });
  });

  // ─── _changeStatus ───

  describe('_changeStatus', () => {
    it('should call apiService.saveElement with correct url and body', () => {
      component.id = 10;
      mockApiService.saveElement.mockReturnValue(of({
        stato: 'pubblicato',
        servizio: { nome: 'Srv' },
        soggetto: { nome: 'Sog' }
      }));
      component._changeStatus({ status: { nome: 'pubblicato' } }, {});
      expect(mockApiService.saveElement).toHaveBeenCalledWith('adesioni/10/stato', { stato: 'pubblicato' });
    });

    it('should update adesione and show success message on success', () => {
      component.id = 10;
      const response = { stato: 'pubblicato', servizio: { nome: 'Srv' }, soggetto: { nome: 'Sog' } };
      mockApiService.saveElement.mockReturnValue(of(response));
      component._changeStatus({ status: { nome: 'pubblicato' } }, {});
      expect(component.adesione).toBe(response);
      expect(component._changingStatus).toBe(false);
      expect(Tools.showMessage).toHaveBeenCalledWith(expect.any(String), 'success', true);
    });

    it('should set error state and show danger message on failure', () => {
      component.id = 10;
      component.adesione = { stato: 'bozza' };
      mockApiService.saveElement.mockReturnValue(throwError(() => ({
        error: { errori: [{ campo: 'x', messaggio: 'err' }] }
      })));
      component._changeStatus({ status: { nome: 'pubblicato' } }, {});
      expect(component._error).toBe(true);
      expect(component._changingStatus).toBe(false);
      expect(Tools.showMessage).toHaveBeenCalledWith(expect.any(String), 'danger', true);
    });

    it('should set _changingStatus to true during call', () => {
      component.id = 10;
      let capturedChanging = false;
      mockApiService.saveElement.mockImplementation(() => {
        capturedChanging = component._changingStatus;
        return of({ stato: 'pubblicato', servizio: { nome: 'S' }, soggetto: { nome: 'S' } });
      });
      component._changeStatus({ status: { nome: 'pubblicato' } }, {});
      expect(capturedChanging).toBe(true);
    });
  });

  // ─── _editAdesione ───

  describe('_editAdesione', () => {
    it('should populate _adesioneUpdate from adesione', () => {
      component.adesione = {
        id_logico: 'logico-1',
        stato: 'bozza',
        servizio: { id_servizio: 'srv-1', nome: 'Srv', versione: '1' },
        soggetto: { id_soggetto: 'sog-1', organizzazione: { id_organizzazione: 'org-1' } },
      };
      component._editAdesione();
      expect(component._adesioneUpdate.id_logico).toBe('logico-1');
      expect(component._adesioneUpdate.stato).toBe('bozza');
      expect(component._adesioneUpdate.id_servizio).toBe('srv-1');
      expect(component._adesioneUpdate.id_soggetto).toBe('sog-1');
      expect(component._adesioneUpdate.id_organizzazione).toBe('org-1');
    });

    it('should set _isEdit to true and _error to false', () => {
      component.adesione = {
        id_logico: null, stato: 'bozza',
        servizio: { id_servizio: 'srv-1', nome: 'Srv', versione: '1' },
        soggetto: { id_soggetto: 'sog-1', organizzazione: { id_organizzazione: 'org-1' } },
      };
      component._editAdesione();
      expect(component._isEdit).toBe(true);
      expect(component._error).toBe(false);
    });

    it('should set _isBozza true when stato is bozza', () => {
      component.adesione = {
        id_logico: null, stato: 'bozza',
        servizio: { id_servizio: 'srv-1', nome: 'S', versione: '1' },
        soggetto: { id_soggetto: 'sog-1', organizzazione: { id_organizzazione: 'org-1' } },
      };
      component._editAdesione();
      expect(component._isBozza).toBe(true);
    });

    it('should set _isBozza false when stato is not bozza', () => {
      component.adesione = {
        id_logico: null, stato: 'pubblicato',
        servizio: { id_servizio: 'srv-1', nome: 'S', versione: '1' },
        soggetto: { id_soggetto: 'sog-1', organizzazione: { id_organizzazione: 'org-1' } },
      };
      component._editAdesione();
      expect(component._isBozza).toBe(false);
    });
  });

  // ─── _updateOtherActions ───

  describe('_updateOtherActions', () => {
    it('should enable download_scheda when canJoin returns true', () => {
      mockAuthService.canJoin.mockReturnValue(true);
      component.adesione = { stato: 'pubblicato' };
      component._updateOtherActions();
      const downloadAction = component._otherActions.find((a: any) => a.action === 'download_scheda');
      expect(downloadAction?.enabled).toBe(true);
    });

    it('should disable download_scheda when canJoin returns false', () => {
      mockAuthService.canJoin.mockReturnValue(false);
      component.adesione = { stato: 'bozza' };
      component._updateOtherActions();
      const downloadAction = component._otherActions.find((a: any) => a.action === 'download_scheda');
      expect(downloadAction?.enabled).toBe(false);
    });

    it('should disable divider actions when canJoin returns false', () => {
      mockAuthService.canJoin.mockReturnValue(false);
      component.adesione = { stato: 'bozza' };
      component._updateOtherActions();
      const divider = component._otherActions.find((a: any) => a.type === 'divider');
      expect(divider?.enabled).toBe(false);
    });
  });

  // ─── _downloadSchedaAdesione ───

  describe('_downloadSchedaAdesione', () => {
    it('should not download when id is null', () => {
      component.id = null;
      component._downloadSchedaAdesione();
      expect(mockApiService.download).not.toHaveBeenCalled();
    });

    it('should call apiService.download when id is set', () => {
      component.id = 10;
      (globalThis as any).saveAs = vi.fn();
      mockApiService.download.mockReturnValue(of({ body: new Blob() }));
      component._downloadSchedaAdesione();
      expect(mockApiService.download).toHaveBeenCalledWith('adesioni', 10, 'export');
      delete (globalThis as any).saveAs;
    });

    it('should set _downloading to false on success', () => {
      component.id = 10;
      (globalThis as any).saveAs = vi.fn();
      mockApiService.download.mockReturnValue(of({ body: new Blob() }));
      component._downloadSchedaAdesione();
      expect(component._downloading).toBe(false);
      expect((globalThis as any).saveAs).toHaveBeenCalled();
      delete (globalThis as any).saveAs;
    });

    it('should set _error on download failure', () => {
      component.id = 10;
      mockApiService.download.mockReturnValue(throwError(() => ({ status: 500 })));
      component._downloadSchedaAdesione();
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._downloading).toBe(false);
    });
  });

  // ─── _loadProfilo ───

  describe('_loadProfilo', () => {
    it('should set _profilo from authenticationService', () => {
      const profilo = { utente: { ruolo: 'gestore', organizzazione: null } };
      mockAuthService.getCurrentSession.mockReturnValue(profilo);
      component._loadProfilo();
      expect(component._profilo).toBe(profilo);
    });

    it('should init organizzazioni select when scelta_libera_organizzazione is true', () => {
      component._scelta_libera_organizzazione = true;
      mockAuthService.getCurrentSession.mockReturnValue({ utente: { ruolo: 'referente_servizio', organizzazione: { id_organizzazione: 'org-1' } } });
      const spy = vi.spyOn(component, '_initOrganizzazioniSelect' as any);
      component._loadProfilo();
      expect(spy).toHaveBeenCalledWith([]);
    });

    it('should init organizzazioni select for gestore role', () => {
      component._scelta_libera_organizzazione = false;
      mockAuthService.getCurrentSession.mockReturnValue({ utente: { ruolo: 'gestore', organizzazione: { id_organizzazione: 'org-1' } } });
      const spy = vi.spyOn(component, '_initOrganizzazioniSelect' as any);
      component._loadProfilo();
      expect(spy).toHaveBeenCalledWith([]);
    });

    it('should load organizzazione when ruolo is not gestore and organizzazione exists', () => {
      component._scelta_libera_organizzazione = false;
      mockAuthService.getCurrentSession.mockReturnValue({ utente: { ruolo: 'referente_servizio', organizzazione: { id_organizzazione: 'org-99' } } });
      const spy = vi.spyOn(component, '_loadOrganizzazione' as any).mockImplementation(() => {});
      component._loadProfilo();
      expect(spy).toHaveBeenCalledWith('org-99');
    });

    it('should init organizzazioni select when profilo has no organizzazione', () => {
      component._scelta_libera_organizzazione = false;
      mockAuthService.getCurrentSession.mockReturnValue({ utente: { ruolo: 'referente_servizio', organizzazione: null } });
      const spy = vi.spyOn(component, '_initOrganizzazioniSelect' as any);
      component._loadProfilo();
      expect(spy).toHaveBeenCalledWith([]);
    });
  });

  // ─── updateIdLogico ───

  describe('updateIdLogico', () => {
    beforeEach(() => {
      const data = { ...new AdesioneCreate(), id_logico: null };
      component._initForm(data);
    });

    it('should set required on id_logico when servizio has multi_adesione', () => {
      component._servizio = { multi_adesione: true };
      component.updateIdLogico(component._servizio);
      expect(component._formGroup.get('id_logico')!.hasValidator(Validators.required)).toBe(true);
    });

    it('should clear required on id_logico when servizio does not have multi_adesione', () => {
      component._servizio = { multi_adesione: false };
      component.updateIdLogico(component._servizio);
      expect(component._formGroup.get('id_logico')!.hasValidator(Validators.required)).toBe(false);
    });

    it('should do nothing when _servizio is null', () => {
      component._servizio = null;
      component._formGroup.get('id_logico')?.setValidators([Validators.required]);
      component.updateIdLogico(null);
      // validators should remain unchanged since the if-block is skipped
      expect(component._formGroup.get('id_logico')!.hasValidator(Validators.required)).toBe(true);
    });
  });

  // ─── _loadAll ───

  describe('_loadAll', () => {
    it('should call _loadAdesione', () => {
      const spy = vi.spyOn(component, '_loadAdesione').mockImplementation(() => {});
      component._loadAll();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── _checkOrganizzazione ───

  describe('_checkOrganizzazione', () => {
    beforeEach(() => {
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
    });

    it('should enable id_organizzazione when event is truthy', () => {
      component._formGroup.get('id_organizzazione')?.disable();
      component._checkOrganizzazione({ id_organizzazione: 'org-1' });
      expect(component._formGroup.get('id_organizzazione')!.enabled).toBe(true);
    });

    it('should clear id_organizzazione and id_soggetto when event is falsy', () => {
      component._formGroup.get('id_organizzazione')?.setValue('org-1');
      component._formGroup.get('id_soggetto')?.setValue('sog-1');
      component._checkOrganizzazione(null);
      expect(component._formGroup.get('id_organizzazione')?.value).toBeNull();
      expect(component._formGroup.get('id_soggetto')?.value).toBeNull();
    });
  });

  // ─── ngAfterContentChecked ───

  describe('ngAfterContentChecked', () => {
    it('should set desktop to true when window width >= 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop to false when window width < 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(false);
    });
  });

  // ─── ngOnChanges ───

  describe('ngOnChanges', () => {
    it('should update id and call _loadAll when id changes', () => {
      const spy = vi.spyOn(component, '_loadAll').mockImplementation(() => {});
      component.ngOnChanges({ id: { currentValue: 42, previousValue: null, firstChange: true, isFirstChange: () => true } } as any);
      expect(component.id).toBe(42);
      expect(spy).toHaveBeenCalled();
    });

    it('should update adesione when subscription changes', () => {
      component.ngOnChanges({
        subscription: {
          currentValue: { source: { id: 99, nome: 'test' } },
          previousValue: null, firstChange: true, isFirstChange: () => true
        }
      } as any);
      expect(component.adesione).toEqual({ id: 99, nome: 'test' });
      expect(component.id).toBe(99);
    });
  });

  // ─── _onCloseNotificationBar ───

  describe('_onCloseNotificationBar', () => {
    it('should navigate to model/id', () => {
      component.id = 15;
      component._onCloseNotificationBar({});
      expect(mockRouter.navigate).toHaveBeenCalledWith(['adesioni', 15]);
    });
  });

  // ─── _canEditMapper / _canDownloadSchedaAdesioneMapper ───

  describe('mapper functions', () => {
    it('_canEditMapper should call authenticationService.canEdit', () => {
      component.adesione = { stato: 'bozza' };
      component._grant = { ruoli: ['referente'] } as any;
      component._canEditMapper();
      expect(mockAuthService.canEdit).toHaveBeenCalledWith('adesione', 'adesione', 'bozza', ['referente']);
    });

    it('_canDownloadSchedaAdesioneMapper should call authenticationService.canDownloadSchedaAdesione', () => {
      component.adesione = { stato: 'pubblicato' };
      component._canDownloadSchedaAdesioneMapper();
      expect(mockAuthService.canDownloadSchedaAdesione).toHaveBeenCalledWith('pubblicato');
    });

    it('_canEditMapper should handle null adesione', () => {
      component.adesione = null;
      component._grant = null;
      component._canEditMapper();
      expect(mockAuthService.canEdit).toHaveBeenCalledWith('adesione', 'adesione', undefined, undefined);
    });

    it('_canDownloadSchedaAdesioneMapper should handle null adesione', () => {
      component.adesione = null;
      component._canDownloadSchedaAdesioneMapper();
      expect(mockAuthService.canDownloadSchedaAdesione).toHaveBeenCalledWith(undefined);
    });
  });

  // ─── _onServiceLoaded ───

  describe('_onServiceLoaded', () => {
    it('should set _selectedSubscription from event target', () => {
      const event = { target: { subscriptions: [{ id: 'sub-1' }, { id: 'sub-2' }] } };
      component._onServiceLoaded(event, 'field');
      expect(component._selectedSubscription).toEqual({ id: 'sub-1' });
    });
  });

  // ─── _onChangeSoggetto ───

  describe('_onChangeSoggetto', () => {
    it('should not throw', () => {
      expect(() => component._onChangeSoggetto({ id_soggetto: 'sog-1' })).not.toThrow();
    });
  });

  // ─── _onChangeIdLogico ───

  describe('_onChangeIdLogico', () => {
    it('should call _showMandatoryFields', () => {
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const spy = vi.spyOn(component, '_showMandatoryFields');
      component._onChangeIdLogico({});
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── _initServiziSelect ───

  describe('_initServiziSelect', () => {
    it('should set servizi$ observable', () => {
      component._initServiziSelect([{ id_servizio: 'srv-1', nome: 'S1' }]);
      expect(component.servizi$).toBeDefined();
    });

    it('should emit default values first from servizi$', async () => {
      const defaults = [{ id_servizio: 'srv-1', nome: 'Test' }];
      component._initServiziSelect(defaults);
      // First emission should be the defaults
      const result = await new Promise<any>((resolve) => {
        component.servizi$.subscribe({ next: (val: any) => resolve(val) });
      });
      expect(result).toEqual(defaults);
    });
  });

  // ─── _initSoggettiSelect ───

  describe('_initSoggettiSelect', () => {
    it('should set soggetti$ observable', () => {
      component._initSoggettiSelect([]);
      expect(component.soggetti$).toBeDefined();
    });
  });

  // ─── _initOrganizzazioniSelect ───

  describe('_initOrganizzazioniSelect', () => {
    it('should set organizzazioni$ observable', () => {
      component._initOrganizzazioniSelect([]);
      expect(component.organizzazioni$).toBeDefined();
    });
  });

  // ─── _initReferentiSelect / _initReferentiTecniciSelect ───

  describe('_initReferentiSelect', () => {
    it('should set referenti$ observable', () => {
      component._formGroup = new FormGroup({ id_organizzazione: new FormControl('org-1') });
      component._initReferentiSelect([]);
      expect(component.referenti$).toBeDefined();
    });
  });

  describe('_initReferentiTecniciSelect', () => {
    it('should set referentiTecnici$ observable', () => {
      component._initReferentiTecniciSelect([]);
      expect(component.referentiTecnici$).toBeDefined();
    });
  });

  // ─── _showMandatoryFields ───

  describe('_showMandatoryFields', () => {
    it('should not throw when debugMandatoryFields is false', () => {
      component.debugMandatoryFields = false;
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      expect(() => component._showMandatoryFields(data)).not.toThrow();
    });

    it('should log when debugMandatoryFields is true', () => {
      component.debugMandatoryFields = true;
      const data = { ...new AdesioneCreate() };
      component._initForm(data);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      component._showMandatoryFields(data);
      expect(groupSpy).toHaveBeenCalledWith('_showMandatoryFields');
      expect(groupEndSpy).toHaveBeenCalled();
    });
  });

  // ─── _loadServizio ───

  describe('_loadServizio', () => {
    it('should call apiService.getDetails for servizi', () => {
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 'srv-1', nome: 'S1', versione: '1', multi_adesione: false }));
      component._initForm({ ...new AdesioneCreate() });
      component._loadServizio('srv-1');
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'srv-1');
    });

    it('should disable id_servizio control when disable param is true', () => {
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 'srv-1', nome: 'S1', versione: '1', multi_adesione: false }));
      component._initForm({ ...new AdesioneCreate() });
      component._loadServizio('srv-1', true);
      expect(component._formGroup.get('id_servizio')!.disabled).toBe(true);
    });

    it('should set id_logico required when servizio has multi_adesione', () => {
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 'srv-1', nome: 'S1', versione: '1', multi_adesione: true }));
      component._initForm({ ...new AdesioneCreate() });
      component._loadServizio('srv-1');
      expect(component._formGroup.get('id_logico')!.hasValidator(Validators.required)).toBe(true);
    });

    it('should clear id_logico validators when servizio does not have multi_adesione', () => {
      mockApiService.getDetails.mockReturnValue(of({ id_servizio: 'srv-1', nome: 'S1', versione: '1', multi_adesione: false }));
      component._initForm({ ...new AdesioneCreate() });
      component._formGroup.get('id_logico')?.setValidators([Validators.required]);
      component._loadServizio('srv-1');
      expect(component._formGroup.get('id_logico')!.hasValidator(Validators.required)).toBe(false);
    });

    it('should set _isDominioEsterno from servizio data', () => {
      mockApiService.getDetails.mockReturnValue(of({
        id_servizio: 'srv-1', nome: 'S1', versione: '1', multi_adesione: false,
        dominio: { soggetto_referente: { organizzazione: { esterna: true, id_organizzazione: 'org-ext' }, id_soggetto: 'sog-ext' } }
      }));
      component._initForm({ ...new AdesioneCreate() });
      component._loadServizio('srv-1');
      expect(component._isDominioEsterno).toBe(true);
      expect(component._idDominioEsterno).toBe('org-ext');
      expect(component._idSoggettoDominioEsterno).toBe('sog-ext');
    });
  });

  // ─── _dummyAction ───

  describe('_dummyAction', () => {
    it('should not throw', () => {
      expect(() => component._dummyAction('event', 'param')).not.toThrow();
    });
  });

  // ─── _deleteService ───

  describe('_deleteService', () => {
    it('should open confirmation modal', () => {
      const mockModalRef = { content: { onClose: of(false) } };
      mockModalService.show.mockReturnValue(mockModalRef);
      component.adesione = { id: 5 };
      component._deleteService();
      expect(mockModalService.show).toHaveBeenCalled();
    });

    it('should call apiService.deleteElement when user confirms', () => {
      const mockModalRef = { content: { onClose: of(true) } };
      mockModalService.show.mockReturnValue(mockModalRef);
      mockApiService.deleteElement.mockReturnValue(of({}));
      component.adesione = { id: 5 };
      const saveSpy = vi.spyOn(component.save, 'emit');
      component._deleteService();
      expect(mockApiService.deleteElement).toHaveBeenCalledWith('adesioni', 5);
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should not call apiService.deleteElement when user cancels', () => {
      const mockModalRef = { content: { onClose: of(false) } };
      mockModalService.show.mockReturnValue(mockModalRef);
      component.adesione = { id: 5 };
      component._deleteService();
      expect(mockApiService.deleteElement).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      const mockModalRef = { content: { onClose: of(true) } };
      mockModalService.show.mockReturnValue(mockModalRef);
      mockApiService.deleteElement.mockReturnValue(throwError(() => ({ status: 500 })));
      component.adesione = { id: 5 };
      component._deleteService();
      expect(component._error).toBe(true);
    });
  });
});
