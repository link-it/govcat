import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { AdesioneFormComponent } from './adesione-form.component';
import { Tools } from '@linkit/components';

describe('AdesioneFormComponent', () => {
  let component: AdesioneFormComponent;

  // Build a real FormGroup so that controls behave properly
  function buildFormGroup() {
    return new UntypedFormGroup({
      id_adesione: new UntypedFormControl('', [Validators.required]),
      id_servizio: new UntypedFormControl('', [Validators.required]),
      id_soggetto: new UntypedFormControl('', [Validators.required]),
      id_organizzazione: new UntypedFormControl('', [Validators.required]),
      stato: new UntypedFormControl(''),
      data_creazione: new UntypedFormControl(''),
      data_ultimo_aggiornamento: new UntypedFormControl(''),
      utente_richiedente: new UntypedFormControl(''),
      utente_ultimo_aggiornamento: new UntypedFormControl(''),
      skip_collaudo: new UntypedFormControl(false),
      id_logico: new UntypedFormControl(''),
      referente: new UntypedFormControl({ value: '', disabled: true }),
      soggetto_nome: new UntypedFormControl(''),
    });
  }

  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockFb = {
    group: vi.fn().mockImplementation(() => buildFormGroup()),
  } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getData: vi.fn().mockReturnValue(of([])),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    getUser: vi.fn().mockReturnValue({ ruolo: 'referente_servizio' }),
    canEdit: vi.fn().mockReturnValue(true),
    canDownloadSchedaAdesione: vi.fn().mockReturnValue(true),
    getCurrentSession: vi.fn().mockReturnValue(null),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    _showMandatoryFields: vi.fn(),
    _removeEmpty: vi.fn((obj: any) => obj),
  } as any;

  let savedConfigurazione: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = null;
    component = new AdesioneFormComponent(
      mockRoute, mockRouter, mockFb, mockTranslate,
      mockApiService, mockAuthService, mockUtils
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.id).toBe(0);
    expect(component.adesione).toBeNull();
    expect(component.servizio).toBeNull();
    expect(component.config).toBeNull();
    expect(component.grant).toBeNull();
    expect(component.editable).toBe(false);
  });

  // -------- Additional defaults --------

  it('should initialize internal state correctly', () => {
    expect(component.model).toBe('adesioni');
    expect(component.dataModel).toBeNull();
    expect(component.helpContext).toBe('ADESIONE.FORM.POPOVER');
    expect(component.isBozza).toBe(false);
    expect(component.isEdit).toBe(false);
    expect(component.error).toBe(false);
    expect(component.errorMsg).toBe('');
    expect(component.errors).toEqual([]);
    expect(component.saving).toBe(false);
    expect(component.isWeb).toBe(false);
    expect(component.debugMandatoryFields).toBe(false);
    expect(component.limit).toBe(500);
    expect(component.isDominioEsterno).toBe(false);
    expect(component.idDominioEsterno).toBeNull();
    expect(component.idSoggettoDominioEsterno).toBeNull();
    expect(component.scelta_libera_organizzazione).toBe(false);
    expect(component.hideSoggettoDropdown).toBe(true);
    expect(component.hideSoggettoInfo).toBe(true);
    expect(component.elencoSoggetti).toEqual([]);
  });

  // -------- initForm --------

  it('initForm should create a FormGroup with all required controls', () => {
    component.initForm();
    const fg = component.formGroup;
    expect(fg).toBeTruthy();
    expect(fg.get('id_adesione')).toBeTruthy();
    expect(fg.get('id_servizio')).toBeTruthy();
    expect(fg.get('id_soggetto')).toBeTruthy();
    expect(fg.get('id_organizzazione')).toBeTruthy();
    expect(fg.get('stato')).toBeTruthy();
    expect(fg.get('data_creazione')).toBeTruthy();
    expect(fg.get('data_ultimo_aggiornamento')).toBeTruthy();
    expect(fg.get('skip_collaudo')).toBeTruthy();
    expect(fg.get('id_logico')).toBeTruthy();
    expect(fg.get('referente')).toBeTruthy();
    expect(fg.get('soggetto_nome')).toBeTruthy();
  });

  // -------- initDataForm --------

  it('initDataForm should patch the form with adesione data', () => {
    component.initForm();
    const adesione = {
      id_adesione: 'A1',
      servizio: { id_servizio: 'S1', nome: 'TestSvc', versione: '1.0', dominio: {} },
      soggetto: { id_soggetto: 'SG1', nome: 'TestSogg', organizzazione: { id_organizzazione: 'O1', nome: 'TestOrg' } },
      stato: 'bozza',
      data_creazione: '2026-01-01',
      data_ultimo_aggiornamento: '2026-01-02',
      skip_collaudo: false,
      id_logico: 'LOG-1',
      referente: 'ref1'
    };
    component.adesione = adesione;
    component.initDataForm(adesione);

    expect(component.formGroup.get('id_adesione')?.value).toBe('A1');
    expect(component.formGroup.get('stato')?.value).toBe('bozza');
    expect(component.formGroup.get('id_logico')?.value).toBe('LOG-1');
    expect(component.initDataService).toBeTruthy();
    expect(component.initDataService.label).toBe('TestSvc v.1.0');
    expect(component.initDataOrganizzazione?.label).toBe('TestOrg');
    expect(component.initDataSoggetto?.label).toBe('TestSogg');
  });

  it('initDataForm should disable id_organizzazione and soggetto_nome controls', () => {
    component.initForm();
    const adesione = {
      id_adesione: 'A2',
      servizio: { id_servizio: 'S2', nome: 'Svc2', versione: '2.0', dominio: {} },
      soggetto: { id_soggetto: 'SG2', nome: 'Sogg2', organizzazione: { id_organizzazione: 'O2', nome: 'Org2' } },
      stato: 'bozza',
      data_creazione: null,
      data_ultimo_aggiornamento: null,
      skip_collaudo: false,
      id_logico: null,
      referente: null
    };
    component.adesione = adesione;
    component.initDataForm(adesione);
    expect(component.formGroup.get('id_organizzazione')?.disabled).toBe(true);
    expect(component.formGroup.get('soggetto_nome')?.disabled).toBe(true);
  });

  // -------- f getter --------

  it('f getter should return formGroup controls', () => {
    component.initForm();
    const controls = component.f;
    expect(controls['id_adesione']).toBeTruthy();
    expect(controls['id_servizio']).toBeTruthy();
  });

  // -------- fieldIsDisabled --------

  it('fieldIsDisabled should return true when editable but not editing', () => {
    component.initForm();
    component.editable = true;
    component.isEdit = false;
    expect(component.fieldIsDisabled('id_adesione')).toBe(true);
  });

  it('fieldIsDisabled should return false when not editable', () => {
    component.initForm();
    component.editable = false;
    component.isEdit = false;
    expect(component.fieldIsDisabled('id_adesione')).toBe(false);
  });

  it('fieldIsDisabled should return false when editable and editing', () => {
    component.initForm();
    component.editable = true;
    component.isEdit = true;
    expect(component.fieldIsDisabled('id_adesione')).toBe(false);
  });

  // -------- canEditMapper --------

  it('canEditMapper should delegate to authenticationService.canEdit', () => {
    component.adesione = { stato: 'bozza' };
    component.grant = { ruoli: ['referente'] } as any;
    mockAuthService.canEdit.mockReturnValue(true);
    expect(component.canEditMapper()).toBe(true);
    expect(mockAuthService.canEdit).toHaveBeenCalledWith('adesione', 'adesione', 'bozza', ['referente']);
  });

  // -------- canDownloadSchedaAdesioneMapper --------

  it('canDownloadSchedaAdesioneMapper should delegate to authenticationService', () => {
    component.adesione = { stato: 'pubblicato_collaudo' };
    mockAuthService.canDownloadSchedaAdesione.mockReturnValue(true);
    expect(component.canDownloadSchedaAdesioneMapper()).toBe(true);
    expect(mockAuthService.canDownloadSchedaAdesione).toHaveBeenCalledWith('pubblicato_collaudo');
  });

  it('canDownloadSchedaAdesioneMapper should return false when service says so', () => {
    component.adesione = { stato: 'bozza' };
    mockAuthService.canDownloadSchedaAdesione.mockReturnValue(false);
    expect(component.canDownloadSchedaAdesioneMapper()).toBe(false);
  });

  // -------- onEdit --------

  it('onEdit should set isEdit to true and set isBozza', () => {
    component.initForm();
    component.adesione = {
      id_adesione: 'A1',
      servizio: { id_servizio: 'S1', nome: 'Svc', versione: '1.0', dominio: {} },
      soggetto: { id_soggetto: 'SG1', nome: 'Sg', organizzazione: { id_organizzazione: 'O1', nome: 'Org' } },
      stato: 'bozza',
      data_creazione: null,
      data_ultimo_aggiornamento: null,
      skip_collaudo: false,
      id_logico: null,
      referente: null
    };
    component.error = true;
    component.errorMsg = 'old error';
    component.onEdit({});
    expect(component.isEdit).toBe(true);
    expect(component.isBozza).toBe(true);
    expect(component.error).toBe(false);
    expect(component.errorMsg).toBe('');
  });

  it('onEdit should set isBozza to false for non-bozza state', () => {
    component.initForm();
    component.adesione = {
      id_adesione: 'A1',
      servizio: { id_servizio: 'S1', nome: 'Svc', versione: '1.0', dominio: {} },
      soggetto: { id_soggetto: 'SG1', nome: 'Sg', organizzazione: { id_organizzazione: 'O1', nome: 'Org' } },
      stato: 'pubblicato_collaudo',
      data_creazione: null,
      data_ultimo_aggiornamento: null,
      skip_collaudo: false,
      id_logico: null,
      referente: null
    };
    component.onEdit({});
    expect(component.isBozza).toBe(false);
  });

  // -------- onCancelEdit --------

  it('onCancelEdit should reset edit state and restore data', () => {
    component.initForm();
    const originalAdesione = {
      id_adesione: 'A1',
      servizio: { id_servizio: 'S1', nome: 'Svc', versione: '1.0', dominio: {} },
      soggetto: { id_soggetto: 'SG1', nome: 'Sg', organizzazione: { id_organizzazione: 'O1', nome: 'Org' } },
      stato: 'bozza',
      data_creazione: null,
      data_ultimo_aggiornamento: null,
      skip_collaudo: false,
      id_logico: null,
      referente: null
    };
    component.dataModel = originalAdesione;
    component.isEdit = true;
    component.error = true;
    component.errorMsg = 'some error';
    component.onCancelEdit();
    expect(component.isEdit).toBe(false);
    expect(component.error).toBe(false);
    expect(component.errorMsg).toBe('');
    expect(component.adesione).toEqual(originalAdesione);
  });

  // -------- onSubmit --------

  it('onSubmit should call _onUpdate when isEdit and form is valid', () => {
    component.initForm();
    component.isEdit = true;
    component.adesione = { id_adesione: 'A1' };
    // Make form valid
    component.formGroup.patchValue({
      id_adesione: 'A1',
      id_servizio: 'S1',
      id_soggetto: 'SG1',
      id_organizzazione: 'O1'
    });
    // Enable all controls for validity
    Object.keys(component.formGroup.controls).forEach(key => {
      component.formGroup.get(key)?.enable();
    });
    component.formGroup.updateValueAndValidity();

    mockApiService.putElement.mockReturnValue(of({ id_adesione: 'A1-updated' }));
    component.onSubmit(component.formGroup.value);
    expect(mockApiService.putElement).toHaveBeenCalled();
  });

  it('onSubmit should not call _onUpdate when not in edit mode', () => {
    component.initForm();
    component.isEdit = false;
    component.onSubmit({});
    expect(mockApiService.putElement).not.toHaveBeenCalled();
  });

  it('onSubmit should not call _onUpdate when form is invalid', () => {
    component.initForm();
    component.isEdit = true;
    // Form is invalid because required fields are empty
    component.onSubmit({});
    expect(mockApiService.putElement).not.toHaveBeenCalled();
  });

  // -------- _onUpdate --------

  it('_onUpdate should set saving flag and call putElement', () => {
    component.initForm();
    const body = { id_logico: 'L1', id_soggetto: 'S1', id_servizio: 'SV1', skip_collaudo: false };
    mockApiService.putElement.mockReturnValue(of({ id_adesione: 'A1-updated', servizio: {}, soggetto: {} }));
    component._onUpdate('A1', body);
    expect(component.saving).toBe(false); // completed
    expect(component.isEdit).toBe(false);
  });

  it('_onUpdate should set error state on failure', () => {
    component.initForm();
    const body = { id_logico: 'L1', id_soggetto: 'S1', id_servizio: 'SV1', skip_collaudo: false };
    mockApiService.putElement.mockReturnValue(throwError(() => ({ error: 'fail' })));
    component._onUpdate('A1', body);
    expect(component.error).toBe(true);
    expect(component.saving).toBe(false);
  });

  // -------- _prepareBodyUpdateAdesione --------

  it('_prepareBodyUpdateAdesione should create proper body structure', () => {
    component.id_servizio = null;
    const body = { id_logico: 'L1', id_soggetto: 'S1', id_servizio: 'SV1', skip_collaudo: true };
    const result = component._prepareBodyUpdateAdesione(body);
    expect(result.identificativo).toBeTruthy();
    expect(result.identificativo.id_logico).toBe('L1');
    expect(result.identificativo.id_soggetto).toBe('S1');
    expect(result.identificativo.skip_collaudo).toBe(true);
  });

  it('_prepareBodyUpdateAdesione should use disabled_id_soggetto when body has no id_soggetto', () => {
    component.id_servizio = null;
    component.disabled_id_soggetto = 'DISABLED_SOG';
    const body = { id_logico: null, id_soggetto: null, id_servizio: 'SV1', skip_collaudo: false };
    const result = component._prepareBodyUpdateAdesione(body);
    expect(result.identificativo.id_soggetto).toBe('DISABLED_SOG');
  });

  it('_prepareBodyUpdateAdesione should override id_servizio when this.id_servizio is set', () => {
    component.id_servizio = 'MY_SERVICE';
    component.servizio = { id_servizio: 'FROM_SERVIZIO' };
    const body = { id_logico: null, id_soggetto: 'S1', id_servizio: 'BODY_SVC', skip_collaudo: false };
    const result = component._prepareBodyUpdateAdesione(body);
    expect(result.identificativo.id_servizio).toBe('FROM_SERVIZIO');
  });

  // -------- updateIdLogico --------

  it('updateIdLogico should add required validator when multi_adesione is true', () => {
    component.initForm();
    component.servizio = { multi_adesione: true };
    component.updateIdLogico();
    const ctrl = component.formGroup.get('id_logico');
    // Field is empty and should now be required
    expect(ctrl?.valid).toBe(false);
  });

  it('updateIdLogico should clear validators when multi_adesione is false', () => {
    component.initForm();
    component.servizio = { multi_adesione: false };
    component.updateIdLogico();
    const ctrl = component.formGroup.get('id_logico');
    // Empty value should be valid without required validator
    expect(ctrl?.valid).toBe(true);
  });

  it('updateIdLogico should do nothing when servizio is null', () => {
    component.initForm();
    component.servizio = null;
    // Should not throw
    component.updateIdLogico();
    expect(component.formGroup.get('id_logico')?.valid).toBe(true);
  });

  // -------- showMandatoryFields --------

  it('showMandatoryFields should call utils when debugMandatoryFields is true', () => {
    component.initForm();
    component.debugMandatoryFields = true;
    component.showMandatoryFields();
    expect(mockUtils._showMandatoryFields).toHaveBeenCalledWith(component.formGroup);
  });

  it('showMandatoryFields should not call utils when debugMandatoryFields is false', () => {
    component.debugMandatoryFields = false;
    component.showMandatoryFields();
    expect(mockUtils._showMandatoryFields).not.toHaveBeenCalled();
  });

  // -------- ngOnChanges --------

  it('ngOnChanges should update dataModel and reinit form on adesione change', () => {
    component.initForm();
    const adesione = {
      id_adesione: 'A1',
      servizio: { id_servizio: 'S1', nome: 'Svc', versione: '1.0', dominio: {} },
      soggetto: { id_soggetto: 'SG1', nome: 'Sg', organizzazione: { id_organizzazione: 'O1', nome: 'Org' } },
      stato: 'bozza',
      data_creazione: null,
      data_ultimo_aggiornamento: null,
      skip_collaudo: false,
      id_logico: null,
      referente: null
    };
    component.adesione = adesione;
    component.ngOnChanges({
      adesione: { currentValue: adesione, previousValue: null, firstChange: true, isFirstChange: () => true }
    } as any);
    expect(component.dataModel).toEqual(adesione);
  });

  it('ngOnChanges should update editable and reset isEdit', () => {
    component.isEdit = true;
    component.ngOnChanges({
      editable: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.editable).toBe(true);
    expect(component.isEdit).toBe(false);
  });

  // -------- onChangeIdLogico --------

  it('onChangeIdLogico should call showMandatoryFields', () => {
    component.debugMandatoryFields = true;
    component.initForm();
    component.onChangeIdLogico({});
    expect(mockUtils._showMandatoryFields).toHaveBeenCalled();
  });

  // -------- getSearchServizi / getSearchOrganizzazioni / getSearchSoggetti --------

  it('getSearchServizi should return a bound function', () => {
    const fn = component.getSearchServizi();
    expect(typeof fn).toBe('function');
  });

  it('getSearchOrganizzazioni should return a bound function', () => {
    const fn = component.getSearchOrganizzazioni();
    expect(typeof fn).toBe('function');
  });

  it('getSearchSoggetti should return a bound function', () => {
    const fn = component.getSearchSoggetti();
    expect(typeof fn).toBe('function');
  });

  it('searchSoggetti should return current elencoSoggetti mapped', () => {
    return new Promise<void>((resolve) => {
      component.elencoSoggetti = [
        { nome: 'Sogg1', id_soggetto: 'S1' },
        { nome: 'Sogg2', id_soggetto: 'S2' }
      ];
      const fn = component.getSearchSoggetti();
      fn('test').subscribe((result: any) => {
        expect(result.length).toBe(2);
        expect(result[0].label).toBe('Sogg1');
        expect(result[0].value).toBe('S1');
        resolve();
      });
    });
  });

  // -------- _getSoggetti --------

  it('_getSoggetti should call apiService.getData with org id', () => {
    component.initForm();
    component.formGroup.get('id_organizzazione')?.setValue('O1');
    mockApiService.getData.mockReturnValue(of([]));
    component._getSoggetti();
    expect(mockApiService.getData).toHaveBeenCalledWith('soggetti', { id_organizzazione: 'O1', aderente: true }, 500, 'nome');
  });

  // -------- loadSoggetti --------

  it('loadSoggetti should set hideSoggettoDropdown to true when single result', () => {
    component.initForm();
    component.formGroup.get('id_organizzazione')?.setValue('O1');
    component.adesione = { soggetto: { id_soggetto: 'SG1' } };
    mockApiService.getData.mockReturnValue(of([{ id_soggetto: 'SG1', nome: 'Sogg1' }]));
    component.loadSoggetti();
    expect(component.hideSoggettoDropdown).toBe(true);
    expect(component.elencoSoggetti.length).toBe(1);
  });

  it('loadSoggetti should set hideSoggettoDropdown to false when multiple results', () => {
    component.initForm();
    component.formGroup.get('id_organizzazione')?.setValue('O1');
    component.adesione = { soggetto: { id_soggetto: 'SG1' } };
    mockApiService.getData.mockReturnValue(of([
      { id_soggetto: 'SG1', nome: 'Sogg1' },
      { id_soggetto: 'SG2', nome: 'Sogg2' }
    ]));
    component.loadSoggetti();
    expect(component.hideSoggettoDropdown).toBe(false);
    expect(component.elencoSoggetti.length).toBe(2);
  });

  // -------- onChangeServizio --------

  it('onChangeServizio should set isDominioEsterno for external dominio', async () => {
    component.initForm();
    const event = {
      item: {
        dominio: { soggetto_referente: { organizzazione: { esterna: true, id_organizzazione: 'EXT1' }, id_soggetto: 'SE1' } },
        soggetto_interno: { organizzazione: { id_organizzazione: 'INT1', nome: 'IntOrg' }, id_soggetto: 'SI1' },
        multi_adesione: false
      }
    };
    await component.onChangeServizio(event);
    expect(component.isDominioEsterno).toBe(true);
    expect(component.hideSoggettoDropdown).toBe(true);
  });

  it('onChangeServizio should handle non-external dominio', async () => {
    component.initForm();
    component.profilo = { utente: { ruolo: 'gestore', organizzazione: null } } as any;
    const event = {
      item: {
        dominio: { soggetto_referente: { organizzazione: { esterna: false } } },
        multi_adesione: false
      }
    };
    await component.onChangeServizio(event);
    expect(component.isDominioEsterno).toBe(false);
  });

  // -------- checkSoggetto --------

  it('checkSoggetto should reset form when event is null', () => {
    component.initForm();
    component.idSoggettoDominioEsterno = 'EXT_SOG';
    component.checkSoggetto(null);
    expect(component.formGroup.get('id_soggetto')?.value).toBe('EXT_SOG');
    expect(component.elencoSoggetti).toEqual([]);
    expect(component.hideSoggettoDropdown).toBe(true);
  });

  it('checkSoggetto should handle single soggetto result', () => {
    component.initForm();
    component.formGroup.get('id_organizzazione')?.setValue('O1');
    const singleResult = [{ id_soggetto: 'SG1', nome: 'Sogg1', aderente: true, organizzazione: {}, referente: null }];
    mockApiService.getData.mockReturnValue(of(singleResult));
    component.checkSoggetto({ item: {} });
    expect(component.hideSoggettoDropdown).toBe(true);
    expect(component.disabled_id_soggetto).toBe('SG1');
  });

  it('checkSoggetto should handle multiple soggetti results', () => {
    component.initForm();
    component.formGroup.get('id_organizzazione')?.setValue('O1');
    const multiResults = [
      { id_soggetto: 'SG1', nome: 'Sogg1', aderente: true, organizzazione: {}, referente: null },
      { id_soggetto: 'SG2', nome: 'Sogg2', aderente: true, organizzazione: {}, referente: null }
    ];
    mockApiService.getData.mockReturnValue(of(multiResults));
    component.checkSoggetto({ item: {} });
    expect(component.elencoSoggetti.length).toBe(2);
    expect(component.disabled_id_soggetto).toBeNull();
  });

  it('checkSoggetto should use soggetto_default when available and multiple results', () => {
    component.initForm();
    component.formGroup.get('id_organizzazione')?.setValue('O1');
    const multiResults = [
      { id_soggetto: 'SG1', nome: 'Sogg1', aderente: true, organizzazione: {}, referente: null },
      { id_soggetto: 'SG2', nome: 'Sogg2', aderente: true, organizzazione: {}, referente: null }
    ];
    mockApiService.getData.mockReturnValue(of(multiResults));
    component.checkSoggetto({ item: { soggetto_default: { id_soggetto: 'SG2', nome: 'Sogg2' } } });
    expect(component.formGroup.get('id_soggetto')?.value).toBe('SG2');
    expect(component.formGroup.get('soggetto_nome')?.value).toBe('Sogg2');
  });

  // -------- loadProfilo --------

  it('loadProfilo should load organizzazione when profilo has org and not scelta_libera', () => {
    component.scelta_libera_organizzazione = false;
    mockAuthService.getCurrentSession.mockReturnValue({
      utente: { ruolo: 'referente', organizzazione: { id_organizzazione: 'O1' } }
    });
    mockApiService.getList.mockReturnValue(of({ content: [{ organizzazione: { id_organizzazione: 'O1', nome: 'Org' } }] }));
    component.loadProfilo();
    expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', { params: { id_organizzazione: 'O1' } });
  });

  it('loadProfilo should not load organizzazione for gestore', () => {
    component.scelta_libera_organizzazione = false;
    mockAuthService.getCurrentSession.mockReturnValue({
      utente: { ruolo: 'gestore', organizzazione: null }
    });
    component.loadProfilo();
    expect(mockApiService.getList).not.toHaveBeenCalled();
  });
});
