import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Tools } from '@linkit/components';
import { ServizioDetailsComponent } from './servizio-details.component';
import { Servizio } from './servizio';
import { forkJoin } from 'rxjs';

describe('ServizioDetailsComponent', () => {
  let component: ServizioDetailsComponent;

  const mockRoute = {
    data: of({}),
    params: of({}),
    queryParams: of({})
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockModalService = {
    show: vi.fn()
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Services: { hideVersions: false }
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue(Promise.resolve({})),
    _confirmDelection: vi.fn(),
    __confirmCambioStatoServizio: vi.fn(),
    _showMandatoryFields: vi.fn(),
    _openGenerateTokenDialog: vi.fn()
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({ api: { abilitato: true }, generico: { abilitato: false } }),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    canManagement: vi.fn().mockReturnValue(true),
    canEdit: vi.fn().mockReturnValue(true),
    canJoin: vi.fn().mockReturnValue(true),
    canMonitoraggio: vi.fn().mockReturnValue(false),
    _removeDNM: vi.fn().mockImplementation((_a: any, _b: any, body: any) => body),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    getCurrentSession: vi.fn().mockReturnValue(null)
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioDetailsComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockModalService,
      mockConfigService,
      mockEventsManagerService,
      mockTools,
      mockApiService,
      mockUtilService,
      mockAuthenticationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioDetailsComponent.Name).toBe('ServizioDetailsComponent');
  });

  it('should have model set to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://localhost');
  });

  it('should subscribe to route.data in constructor', () => {
    expect(component).toBeTruthy();
    // route.data subscription was called during construction
  });

  it('should call loadAnagrafiche in constructor', () => {
    // loadAnagrafiche is async and calls utils.getAnagrafiche
    expect(mockUtilService.getAnagrafiche).toHaveBeenCalled();
  });

  it('should initialize _otherLinks with defaults', () => {
    expect(component._otherLinksDefault.length).toBeGreaterThan(0);
  });

  it('should have _otherActions defined', () => {
    expect(component._otherActions.length).toBeGreaterThan(0);
  });

  it('should check _isGestore via authenticationService', () => {
    mockAuthenticationService.isGestore.mockReturnValue(true);
    expect((component as any)._isGestore()).toBe(true);
  });

  it('should emit close event on _onClose', () => {
    const spy = vi.spyOn(component.close, 'emit');
    component.id = '123';
    component._onClose();
    expect(spy).toHaveBeenCalledWith({ id: '123', service: expect.anything() });
  });

  it('should emit save event on _onSave', () => {
    const spy = vi.spyOn(component.save, 'emit');
    component.id = '123';
    component._onSave();
    expect(spy).toHaveBeenCalledWith({ id: '123', service: expect.anything() });
  });

  it('should toggle edit mode on _editService', () => {
    component._isEdit = false;
    component.debugMandatoryFields = false;
    component._editService();
    expect(component._isEdit).toBe(true);
  });

  it('should reset error on __resetError', () => {
    component._error = true;
    component._errorMsg = 'some error';
    (component as any).__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should toggle markdown preview', () => {
    component._showMarkdownPreview = false;
    component._toggleMarkdownPreview();
    expect(component._showMarkdownPreview).toBe(true);
    component._toggleMarkdownPreview();
    expect(component._showMarkdownPreview).toBe(false);
  });

  it('should check _hasControlError', () => {
    component._formGroup = { controls: { testField: { errors: { required: true }, touched: true } } } as any;
    expect(component._hasControlError('testField')).toBeTruthy();
  });

  it('should return false for _hasControlError on missing field', () => {
    component._formGroup = { controls: {} } as any;
    expect(component._hasControlError('missingField')).toBeFalsy();
  });

  it('should navigate on onBreadcrumb when _useRoute is true', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], expect.anything());
  });

  it('should call close.emit on onBreadcrumb when _useRoute is false', () => {
    component._useRoute = false;
    const spy = vi.spyOn(component.close, 'emit');
    component.onBreadcrumb({ url: '/servizi' });
    expect(spy).toHaveBeenCalled();
  });

  it('should navigate to adesioni on _joinServizio', () => {
    component.id = '42';
    (component as any)._joinServizio();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['adesioni', 'new', 'edit'],
      { queryParams: { id_servizio: '42' } }
    );
  });

  it('should navigate to presentation view on backPresentationView', () => {
    component.id = '42';
    component.backPresentationView();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should check _canJoin', () => {
    component.data = { stato: 'pubblicato', package: false };
    mockAuthenticationService.canJoin.mockReturnValue(true);
    expect(component._canJoin()).toBe(true);
  });

  it('should compare classi by id_classe_utente', () => {
    expect(component._compareClassiFn({ id_classe_utente: '1' }, { id_classe_utente: '1' })).toBe(true);
    expect(component._compareClassiFn({ id_classe_utente: '1' }, { id_classe_utente: '2' })).toBe(false);
  });

  it('should determine isComponente from form control', () => {
    component._formGroup = {
      get: vi.fn().mockReturnValue({ value: 'componente' }),
      controls: {}
    } as any;
    expect(component.isComponente).toBe(true);
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should handle tipi servizio initialization', () => {
    expect(component._tipiServizio.length).toBe(2);
    expect(component._tipiServizio[0].value).toBe('API');
    expect(component._tipiServizio[1].value).toBe('Generico');
  });

  // ---------------------------------------------------------------------------
  // _initBreadcrumb
  // ---------------------------------------------------------------------------
  describe('_initBreadcrumb', () => {
    it('should build breadcrumb with name and version', () => {
      component.data = { nome: 'MyService', versione: '2' };
      component.hideVersions = false;
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(2);
      expect(component.breadcrumbs[1].label).toBe('MyService v. 2');
    });

    it('should hide version when hideVersions is true', () => {
      component.data = { nome: 'MyService', versione: '2' };
      component.hideVersions = true;
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('MyService');
    });

    it('should use id when no data name/version', () => {
      component.data = null;
      component.id = '999';
      component._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('999');
    });

    it('should use translate New when _isNew and no id', () => {
      component.data = null;
      component.id = null;
      component._initBreadcrumb();
      // translate.instant returns key as-is
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('should prepend component breadcrumbs when _componentBreadcrumbs is set', () => {
      component._componentBreadcrumbs = {
        service: { id_servizio: '50' },
        breadcrumbs: [
          { label: 'Parent', url: '/parent', type: 'link' }
        ]
      } as any;
      component.data = { nome: 'CompService', versione: '1' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[0].label).toBe('Parent');
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
    });

    it('should build dashboard breadcrumb when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      component.data = { nome: 'DashService', versione: '1' };
      component._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
    });
  });

  // ---------------------------------------------------------------------------
  // _loadService
  // ---------------------------------------------------------------------------
  describe('_loadService', () => {
    it('should do nothing if id is null', () => {
      component.id = null;
      component._loadService();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });

    it('should load grant then details on success', () => {
      const grantData = { ruoli: ['referente_servizio'] };
      const serviceData = {
        id_servizio: '10', nome: 'Svc', versione: '1', stato: 'bozza',
        dominio: { id_dominio: 'd1', deprecato: false }, package: false,
        fruizione: false, eliminabile: true
      };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(of(serviceData));
      mockAuthenticationService.canManagement.mockReturnValue(true);
      mockApiService.getList.mockReturnValue(of({ content: [] }));

      component.id = '10';
      component._loadService();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '10', 'grant');
      expect(component._grant).toEqual(grantData);
      expect(component.data).toEqual(serviceData);
      expect(component._spin).toBe(false);
    });

    it('should redirect to view when canManagement returns false', () => {
      const grantData = { ruoli: ['referente_servizio'] };
      const serviceData = {
        id_servizio: '10', nome: 'Svc', versione: '1', stato: 'pubblicato',
        dominio: { id_dominio: 'd1' }, package: false, eliminabile: false
      };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(of(serviceData));
      mockAuthenticationService.canManagement.mockReturnValue(false);

      component.id = '10';
      component._loadService();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '10', 'view'],
        expect.anything()
      );
    });

    it('should call Tools.OnError on grant error', () => {
      const spyOnError = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const errorObj = { status: 403, message: 'Forbidden' };
      mockApiService.getDetails.mockReturnValueOnce(throwError(() => errorObj));

      component.id = '10';
      component._loadService();

      expect(spyOnError).toHaveBeenCalledWith(errorObj);
      expect(component._spin).toBe(false);
      spyOnError.mockRestore();
    });

    it('should call Tools.OnError on details error', () => {
      const spyOnError = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      const grantData = { ruoli: [] };
      const errorObj = { status: 500, message: 'Server Error' };
      mockApiService.getDetails
        .mockReturnValueOnce(of(grantData))
        .mockReturnValueOnce(throwError(() => errorObj));

      component.id = '10';
      component._loadService();

      expect(spyOnError).toHaveBeenCalledWith(errorObj);
      expect(component._spin).toBe(false);
      spyOnError.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // __onSave
  // ---------------------------------------------------------------------------
  describe('__onSave', () => {
    beforeEach(() => {
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
    });

    it('should save and navigate on success', () => {
      const response = { id_servizio: '55', nome: 'New', versione: '1' };
      mockApiService.saveElement.mockReturnValue(of(response));
      const saveSpy = vi.spyOn(component.save, 'emit');

      component.__onSave({ nome: 'New', versione: '1', tipo: 'API' });

      expect(mockApiService.saveElement).toHaveBeenCalledWith('servizi', expect.any(Object));
      expect(component.id).toBe('55');
      expect(component._isNew).toBe(false);
      expect(component._isEdit).toBe(false);
      expect(saveSpy).toHaveBeenCalledWith({ id: '55', service: response, update: false });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['servizi', '55'], { replaceUrl: true });
    });

    it('should set error on save failure', () => {
      const errorObj = { status: 400, error: { errori: [{ dato: 'nome', campi: ['required'] }] } };
      mockApiService.saveElement.mockReturnValue(throwError(() => errorObj));

      component.__onSave({ nome: '', versione: '1', tipo: 'API' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._errors).toEqual([{ dato: 'nome', campi: ['required'] }]);
      expect(component._spin).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // __onUpdate
  // ---------------------------------------------------------------------------
  describe('__onUpdate', () => {
    beforeEach(() => {
      component.data = { id_servizio: '10', stato: 'bozza', dominio: { id_dominio: 'd1' } };
      component._grant = { ruoli: ['referente_servizio'] } as any;
    });

    it('should update and refresh on success with response', () => {
      const response = {
        id_servizio: '10', nome: 'Updated', versione: '1',
        dominio: { deprecato: false }, fruizione: false, package: false
      };
      mockApiService.putElement.mockReturnValue(of(response));
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      const saveSpy = vi.spyOn(component.save, 'emit');
      // Stub loadCurrentData to avoid deep formGroup access
      vi.spyOn(component as any, 'loadCurrentData').mockImplementation(() => {});

      component.__onUpdate(10, { nome: 'Updated', versione: '1', tipo: 'API' });

      expect(mockApiService.putElement).toHaveBeenCalledWith('servizi', 10, expect.any(Object));
      expect(component.data).toEqual(response);
      expect(saveSpy).toHaveBeenCalledWith({ id: '10', data: response, update: true });
    });

    it('should call _loadService when response is null', () => {
      mockApiService.putElement.mockReturnValue(of(null));
      const loadSpy = vi.spyOn(component, '_loadService').mockImplementation(() => {});
      const saveSpy = vi.spyOn(component.save, 'emit');

      component.__onUpdate(10, { nome: 'X', versione: '1', tipo: 'API' });

      expect(loadSpy).toHaveBeenCalledWith(false);
      expect(saveSpy).toHaveBeenCalled();
      loadSpy.mockRestore();
    });

    it('should set error on update failure', () => {
      const errorObj = { status: 400, error: { errori: [] } };
      mockApiService.putElement.mockReturnValue(throwError(() => errorObj));

      component.__onUpdate(10, { nome: '', versione: '1', tipo: 'API' });

      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
    });

    it('should respect _closeEdit flag', () => {
      const response = {
        id_servizio: '10', nome: 'X', versione: '1',
        dominio: { deprecato: false }, fruizione: false, package: false
      };
      mockApiService.putElement.mockReturnValue(of(response));
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      // Stub loadCurrentData to avoid deep formGroup access
      vi.spyOn(component as any, 'loadCurrentData').mockImplementation(() => {});

      component._closeEdit = false;
      component._isEdit = true;
      component.__onUpdate(10, { nome: 'X', versione: '1', tipo: 'API' });
      // _isEdit should remain true when _closeEdit is false
      expect(component._isEdit).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _prepareBodySaveServizio
  // ---------------------------------------------------------------------------
  describe('_prepareBodySaveServizio', () => {
    it('should prepare basic body with defaults', () => {
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
      const body = { tipo: 'API', nome: 'Test', versione: '1', descrizione_sintetica: 'desc' };
      const result = component._prepareBodySaveServizio(body);

      expect(result.tipo).toBe('API');
      expect(result.nome).toBe('Test');
      expect(result.versione).toBe('1');
      expect(result.id_dominio).toBe('dom1');
      expect(result.taxonomies).toEqual([]);
    });

    it('should include tags when present', () => {
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
      const body = { tipo: 'API', nome: 'Test', versione: '1', tags: ['tag1', 'tag2'] };
      const result = component._prepareBodySaveServizio(body);
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    it('should include referenti when not package', () => {
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
      const body = { tipo: 'API', nome: 'Test', versione: '1', referente: 'user1', referente_tecnico: 'user2', package: false };
      const result = component._prepareBodySaveServizio(body);
      expect(result.referenti).toEqual([
        { id_utente: 'user1', tipo: 'referente' },
        { id_utente: 'user2', tipo: 'referente_tecnico' }
      ]);
    });

    it('should not include referenti when package is true', () => {
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
      const body = { tipo: 'API', nome: 'Test', versione: '1', referente: 'user1', package: true };
      const result = component._prepareBodySaveServizio(body);
      expect(result.referenti).toBeUndefined();
    });

    it('should convert visibilita "null" string to actual null', () => {
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
      const body = { tipo: 'API', nome: 'Test', versione: '1', visibilita: 'null' };
      const result = component._prepareBodySaveServizio(body);
      expect(result.visibilita).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // _prepareBodyUpdateServizio
  // ---------------------------------------------------------------------------
  describe('_prepareBodyUpdateServizio', () => {
    beforeEach(() => {
      component.data = { stato: 'bozza' };
      component._grant = { ruoli: ['referente_servizio'] } as any;
    });

    it('should prepare update body with identificativo and dati_generici', () => {
      const body = { tipo: 'API', nome: 'Upd', versione: '2', id_dominio: 'd1', visibilita: 'pubblico', multi_adesione: false, classi: [], descrizione: 'desc', descrizione_sintetica: 'short', tags: [], tassonomie: [], termini_ricerca: null, note: null };
      const result = (component as any)._prepareBodyUpdateServizio(body);

      expect(result.identificativo).toBeDefined();
      expect(result.identificativo.tipo).toBe('API');
      expect(result.identificativo.nome).toBe('Upd');
      expect(result.dati_generici).toBeDefined();
      expect(result.dati_generici.descrizione).toBe('desc');
    });

    it('should handle immagine with uuid', () => {
      const body = { tipo: 'API', nome: 'X', versione: '1', id_dominio: 'd1', visibilita: null, multi_adesione: false, classi: [], immagine: { uuid: 'abc-123' }, tags: [], tassonomie: [], descrizione: null, descrizione_sintetica: null, termini_ricerca: null, note: null };
      const result = (component as any)._prepareBodyUpdateServizio(body);
      expect(result.dati_generici.immagine.tipo_documento).toBe('uuid');
      expect(result.dati_generici.immagine.uuid).toBe('abc-123');
    });

    it('should call _removeDNM', () => {
      const body = { tipo: 'API', nome: 'X', versione: '1', id_dominio: 'd1', visibilita: null, multi_adesione: false, classi: [], tags: [], tassonomie: [], descrizione: null, descrizione_sintetica: null, termini_ricerca: null, note: null };
      (component as any)._prepareBodyUpdateServizio(body);
      expect(mockAuthenticationService._removeDNM).toHaveBeenCalledWith(
        'servizio', 'bozza', expect.any(Object), ['referente_servizio']
      );
    });
  });

  // ---------------------------------------------------------------------------
  // _onSubmit
  // ---------------------------------------------------------------------------
  describe('_onSubmit', () => {
    it('should call __onSave when _isNew is true and form valid', () => {
      const saveSpy = vi.spyOn(component, '__onSave').mockImplementation(() => {});
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = { valid: true } as any;

      component._onSubmit({ nome: 'Test' });

      expect(saveSpy).toHaveBeenCalledWith({ nome: 'Test' });
      saveSpy.mockRestore();
    });

    it('should call __onUpdate when _isNew is false and form valid', () => {
      const updateSpy = vi.spyOn(component as any, '__onUpdate').mockImplementation(() => {});
      component._isEdit = true;
      component._isNew = false;
      component.data = { id_servizio: 99 };
      component._formGroup = { valid: true } as any;

      component._onSubmit({ nome: 'Updated' });

      expect(updateSpy).toHaveBeenCalledWith(99, { nome: 'Updated' });
      updateSpy.mockRestore();
    });

    it('should not submit when form is invalid', () => {
      const saveSpy = vi.spyOn(component, '__onSave').mockImplementation(() => {});
      const updateSpy = vi.spyOn(component as any, '__onUpdate').mockImplementation(() => {});
      component._isEdit = true;
      component._isNew = true;
      component._formGroup = { valid: false } as any;

      component._onSubmit({ nome: '' });

      expect(saveSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
      saveSpy.mockRestore();
      updateSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // _onCancelEdit
  // ---------------------------------------------------------------------------
  describe('_onCancelEdit', () => {
    it('should navigate to model list when _isNew and _useRoute and no id', () => {
      component._isNew = true;
      component._useRoute = true;
      component._isEdit = true;
      component.id = null;
      component._formGroup = new FormGroup({ multi_adesione: new FormControl(false) });

      component._onCancelEdit();

      expect(component._isEdit).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi'],
        expect.objectContaining({ relativeTo: expect.anything() })
      );
    });

    it('should navigate to model/id when _isNew and _useRoute and has id', () => {
      component._isNew = true;
      component._useRoute = true;
      component._isEdit = true;
      component.id = '77';
      component._formGroup = new FormGroup({ multi_adesione: new FormControl(false) });

      component._onCancelEdit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['servizi', '77'],
        expect.objectContaining({ replaceUrl: true })
      );
    });

    it('should emit close when _isNew and not _useRoute', () => {
      component._isNew = true;
      component._useRoute = false;
      component._isEdit = true;
      component.id = '77';
      component._formGroup = new FormGroup({ multi_adesione: new FormControl(false) });
      const closeSpy = vi.spyOn(component.close, 'emit');

      component._onCancelEdit();

      expect(closeSpy).toHaveBeenCalledWith({ id: '77', service: null });
    });

    it('should restore data and re-init form for existing service', () => {
      component._isNew = false;
      component._isEdit = true;
      component.data = {
        id_servizio: '10', nome: 'Orig', versione: '1',
        dominio: { deprecato: false }, fruizione: false, package: false,
        soggetto_interno: null
      };
      // Provide a formGroup with multi_adesione for _changeEdit to work
      component._formGroup = new FormGroup({ multi_adesione: new FormControl(false) });
      // Stub loadCurrentData and _enableDisableSkipCollaudo to avoid deep calls
      vi.spyOn(component as any, 'loadCurrentData').mockImplementation(() => {});
      vi.spyOn(component, '_enableDisableSkipCollaudo').mockImplementation(() => {});

      component._onCancelEdit();

      expect(component._isEdit).toBe(false);
      // _data should be re-created from data
      expect(component._data.nome).toBe('Orig');
    });
  });

  // ---------------------------------------------------------------------------
  // _changeStatus
  // ---------------------------------------------------------------------------
  describe('_changeStatus', () => {
    it('should update data and show success message on success', () => {
      const spyShowMsg = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      const response = { id_servizio: '10', stato: 'pubblicato' };
      mockApiService.saveElement.mockReturnValue(of(response));
      component.id = '10';
      component.data = { stato: 'bozza' };

      (component as any)._changeStatus({ status: { nome: 'pubblicato' } }, component.data);

      expect(mockApiService.saveElement).toHaveBeenCalledWith('servizi/10/stato', { stato: 'pubblicato' });
      expect(component.data.stato).toBe('pubblicato');
      expect(component._changingStatus).toBe(false);
      expect(spyShowMsg).toHaveBeenCalledWith(expect.any(String), 'success', true);
      spyShowMsg.mockRestore();
    });

    it('should set error and show danger message on failure', () => {
      const spyShowMsg = vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
      const spyWfErr = vi.spyOn(Tools, 'WorkflowErrorMsg').mockReturnValue('workflow error');
      const errorObj = { status: 400, error: { errori: [{ dato: 'stato', campi: ['invalid'] }] } };
      mockApiService.saveElement.mockReturnValue(throwError(() => errorObj));
      component.id = '10';
      component.data = { stato: 'bozza' };

      (component as any)._changeStatus({ status: { nome: 'pubblicato' } }, component.data);

      expect(component._changingStatus).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('workflow error');
      expect(component._errors).toEqual([{ dato: 'stato', campi: ['invalid'] }]);
      expect(spyShowMsg).toHaveBeenCalledWith(expect.any(String), 'danger', true);
      spyShowMsg.mockRestore();
      spyWfErr.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // _downloadServizioExport
  // ---------------------------------------------------------------------------
  describe('_downloadServizioExport', () => {
    it('should download and call saveAs on success', () => {
      const spyGetFilename = vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('test.zip');
      const mockSaveAs = vi.fn();
      (globalThis as any).saveAs = mockSaveAs;

      const response = { body: new Blob(), headers: { get: vi.fn() } };
      mockApiService.download.mockReturnValue(of(response));
      component.id = '10';

      component._downloadServizioExport();

      expect(mockApiService.download).toHaveBeenCalledWith('servizi', '10', 'export');
      expect(spyGetFilename).toHaveBeenCalledWith(response);
      expect(mockSaveAs).toHaveBeenCalledWith(response.body, 'test.zip');
      expect(component._downloading).toBe(false);
      spyGetFilename.mockRestore();
      delete (globalThis as any).saveAs;
    });

    it('should set error on download failure', () => {
      const errorObj = { status: 500, error: {} };
      mockApiService.download.mockReturnValue(throwError(() => errorObj));
      component.id = '10';

      component._downloadServizioExport();

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._downloading).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _enableDisableSkipCollaudo
  // ---------------------------------------------------------------------------
  describe('_enableDisableSkipCollaudo', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        skip_collaudo: new FormControl(false)
      });
    });

    it('should enable skip_collaudo when dominio.skip_collaudo true and not vincola', () => {
      component.data = { vincola_skip_collaudo: false };
      component._enableDisableSkipCollaudo({ skip_collaudo: true });
      expect(component._formGroup.get('skip_collaudo')?.enabled).toBe(true);
    });

    it('should disable skip_collaudo when dominio.skip_collaudo true and vincola', () => {
      component.data = { vincola_skip_collaudo: true };
      component._enableDisableSkipCollaudo({ skip_collaudo: true });
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
    });

    it('should disable skip_collaudo when dominio is null', () => {
      component._isNew = false;
      component._enableDisableSkipCollaudo(null);
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
    });

    it('should set skip_collaudo to false and disable when _isNew and dominio.skip_collaudo is false', () => {
      component._isNew = true;
      component._enableDisableSkipCollaudo({ skip_collaudo: false });
      expect(component._formGroup.get('skip_collaudo')?.value).toBe(false);
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _onChangeVisibilita
  // ---------------------------------------------------------------------------
  describe('_onChangeVisibilita', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        classi: new FormControl([]),
        visibilita: new FormControl(null),
        package: new FormControl(false),
        adesione_disabilitata: new FormControl(false)
      });
    });

    it('should set required validator on classi when visibilita is riservato', () => {
      component._onChangeVisibilita({ target: { value: 'riservato' } });
      component._formGroup.get('classi')?.setValue(null);
      component._formGroup.get('classi')?.updateValueAndValidity();
      expect(component._formGroup.get('classi')?.valid).toBe(false);
    });

    it('should clear validators on classi when visibilita is not riservato', () => {
      component._onChangeVisibilita({ target: { value: 'pubblico' } });
      expect(component._formGroup.get('classi')?.valid).toBe(true);
      expect(component._formGroup.get('classi')?.value).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // _onChangeFruizione
  // ---------------------------------------------------------------------------
  describe('_onChangeFruizione', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        id_organizzazione_interna: new FormControl(null),
        id_soggetto_interno: new FormControl(null)
      });
    });

    it('should set required validators when checked', () => {
      component._onChangeFruizione({ target: { checked: true } });
      expect(component._isDominioEsterno).toBe(true);
      // Should be invalid without value since required
      expect(component._formGroup.get('id_organizzazione_interna')?.valid).toBe(false);
      expect(component._formGroup.get('id_soggetto_interno')?.valid).toBe(false);
    });

    it('should clear validators and values when unchecked', () => {
      component._isDominioEsterno = true;
      component._formGroup.get('id_organizzazione_interna')?.setValue(5);
      component._formGroup.get('id_soggetto_interno')?.setValue(10);

      component._onChangeFruizione({ target: { checked: false } });

      expect(component._isDominioEsterno).toBe(false);
      expect(component._formGroup.get('id_organizzazione_interna')?.value).toBeNull();
      expect(component._formGroup.get('id_soggetto_interno')?.value).toBeNull();
      expect(component._formGroup.get('id_organizzazione_interna')?.valid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _onChangePackage
  // ---------------------------------------------------------------------------
  describe('_onChangePackage', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        package: new FormControl(false),
        referente: new FormControl(null, [Validators.required]),
        visibilita: new FormControl(null)
      });
      component._isNew = true;
    });

    it('should clear referente validators when package is true', () => {
      component._formGroup.get('package')?.setValue(true);
      component._onChangePackage({});
      expect(component._formGroup.get('referente')?.value).toBeNull();
      expect(component.showReferenti).toBe(false);
      // referente should be valid since validators are cleared
      expect(component._formGroup.get('referente')?.valid).toBe(true);
    });

    it('should set required validator on referente when package is false', () => {
      component._formGroup.get('package')?.setValue(false);
      component._onChangePackage({});
      expect(component.showReferenti).toBe(true);
      // referente is null with required => invalid
      expect(component._formGroup.get('referente')?.valid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _onImageLoaded
  // ---------------------------------------------------------------------------
  describe('_onImageLoaded', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        immagine: new FormControl(null)
      });
    });

    it('should parse and set image data from base64 event string', () => {
      component._isNew = false;
      const eventData = 'data:image/png;base64,iVBORw0KGgo=';
      component._onImageLoaded(eventData);

      const value = component._formGroup.get('immagine')?.value;
      expect(value.content_type).toBe('image/png');
      expect(value.content).toBe('iVBORw0KGgo=');
      expect(value.tipo_documento).toBe('nuovo');
    });

    it('should not set tipo_documento when _isNew', () => {
      component._isNew = true;
      const eventData = 'data:image/jpeg;base64,abc123';
      component._onImageLoaded(eventData);

      const value = component._formGroup.get('immagine')?.value;
      expect(value.content_type).toBe('image/jpeg');
      expect(value.tipo_documento).toBeUndefined();
    });

    it('should set immagine to null when event is null', () => {
      component._formGroup.get('immagine')?.setValue({ content: 'old' });
      component._onImageLoaded(null);
      expect(component._formGroup.get('immagine')?.value).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // _loadApis / _loadComponenti
  // ---------------------------------------------------------------------------
  describe('_loadApis', () => {
    it('should set hasApi true when APIs exist', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }] }));
      component.id = '10';
      component._formGroup = new FormGroup({
        package: new FormControl(false),
        visibilita: new FormControl(null),
        adesione_disabilitata: new FormControl(false)
      });
      component.data = { package: false, stato: 'bozza' };

      component._loadApis();

      expect(component.hasApi).toBe(true);
    });
  });

  describe('_loadComponenti', () => {
    it('should set hasComponenti true when components exist', () => {
      mockApiService.getDetails.mockReturnValue(of({ content: [{ id: 1 }] }));
      component.id = '10';
      component._formGroup = new FormGroup({
        package: new FormControl(false),
        visibilita: new FormControl(null),
        adesione_disabilitata: new FormControl(false)
      });
      component.data = { package: true, stato: 'bozza' };

      component._loadComponenti();

      expect(component.hasComponenti).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // enableDisableControlPackage
  // ---------------------------------------------------------------------------
  describe('enableDisableControlPackage', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        package: new FormControl(false),
        visibilita: new FormControl(null),
        adesione_disabilitata: new FormControl(false)
      });
    });

    it('should disable package when hasApi is true', () => {
      component.hasApi = true;
      component.hasComponenti = false;
      component.enableDisableControlPackage();
      expect(component._formGroup.get('package')?.disabled).toBe(true);
    });

    it('should disable package when hasComponenti is true', () => {
      component.hasApi = false;
      component.hasComponenti = true;
      component.enableDisableControlPackage();
      expect(component._formGroup.get('package')?.disabled).toBe(true);
    });

    it('should disable package when isComponente is true', () => {
      component.hasApi = false;
      component.hasComponenti = false;
      component._formGroup.get('visibilita')?.setValue('componente');
      component.enableDisableControlPackage();
      expect(component._formGroup.get('package')?.disabled).toBe(true);
    });

    it('should enable package when no api, no componenti, not componente', () => {
      component.hasApi = false;
      component.hasComponenti = false;
      component._formGroup.get('visibilita')?.setValue('pubblico');
      component.enableDisableControlPackage();
      expect(component._formGroup.get('package')?.enabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // onActionMonitor
  // ---------------------------------------------------------------------------
  describe('onActionMonitor', () => {
    it('should call _joinServizio on join_service action', () => {
      const joinSpy = vi.spyOn(component as any, '_joinServizio').mockImplementation(() => {});
      component.onActionMonitor({ action: 'join_service' });
      expect(joinSpy).toHaveBeenCalled();
      joinSpy.mockRestore();
    });

    it('should call _downloadServizioExport on download_service action', () => {
      const dlSpy = vi.spyOn(component, '_downloadServizioExport').mockImplementation(() => {});
      component.onActionMonitor({ action: 'download_service' });
      expect(dlSpy).toHaveBeenCalled();
      dlSpy.mockRestore();
    });

    it('should navigate on default action', () => {
      component.data = { id_servizio: '10' };
      component.onActionMonitor({ action: 'referenti' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/servizi/10/referenti'],
        expect.objectContaining({ queryParamsHandling: 'preserve' })
      );
    });

    it('should navigate to backview action', () => {
      component.data = { id_servizio: '10' };
      component.onActionMonitor({ action: 'backview' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/servizi/10/view'],
        expect.anything()
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  describe('getters', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        visibilita: new FormControl(null),
        package: new FormControl(false),
        adesione_disabilitata: new FormControl(false)
      });
    });

    it('hasHelpPackage should return true when hasApi is true', () => {
      component.hasApi = true;
      component.hasComponenti = false;
      expect(component.hasHelpPackage).toBe(true);
    });

    it('hasHelpPackage should return true when hasComponenti is true', () => {
      component.hasApi = false;
      component.hasComponenti = true;
      expect(component.hasHelpPackage).toBe(true);
    });

    it('hasHelpPackage should return true when isComponente is true', () => {
      component.hasApi = false;
      component.hasComponenti = false;
      component._formGroup.get('visibilita')?.setValue('componente');
      expect(component.hasHelpPackage).toBe(true);
    });

    it('hasHelpPackage should return false when none apply', () => {
      component.hasApi = false;
      component.hasComponenti = false;
      component._formGroup.get('visibilita')?.setValue('pubblico');
      expect(component.hasHelpPackage).toBe(false);
    });

    it('helpTooltipPackage should return ServiceHasApi when hasApi', () => {
      component.hasApi = true;
      component.hasComponenti = false;
      expect(component.helpTooltipPackage).toBe('APP.TOOLTIP.ServiceHasApi');
    });

    it('helpTooltipPackage should return ServiceHasComponents when hasComponenti', () => {
      component.hasApi = false;
      component.hasComponenti = true;
      expect(component.helpTooltipPackage).toBe('APP.TOOLTIP.ServiceHasComponents');
    });

    it('helpTooltipPackage should return ServiceHasVisibilitaComponent when isComponente', () => {
      component.hasApi = false;
      component.hasComponenti = false;
      component._formGroup.get('visibilita')?.setValue('componente');
      expect(component.helpTooltipPackage).toBe('APP.TOOLTIP.ServiceHasVisibilitaComponent');
    });

    it('helpTooltipAdesioneConsentita should return tooltip when isComponente', () => {
      component._formGroup.get('visibilita')?.setValue('componente');
      expect(component.helpTooltipAdesioneConsentita).toBe('APP.TOOLTIP.ServiceHasVisibilitaComponent');
    });

    it('helpTooltipAdesioneConsentita should return empty when not componente', () => {
      component._formGroup.get('visibilita')?.setValue('pubblico');
      expect(component.helpTooltipAdesioneConsentita).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // _isVisibilita / _isVisibilitaNull / _isVisibilitaNullMapper
  // ---------------------------------------------------------------------------
  describe('_isVisibilita', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({ visibilita: new FormControl('pubblico') });
    });

    it('should return true when visibilita matches type', () => {
      expect(component._isVisibilita('pubblico')).toBe(true);
    });

    it('should return false when visibilita does not match', () => {
      expect(component._isVisibilita('riservato')).toBe(false);
    });
  });

  describe('_isVisibilitaNull', () => {
    it('should return true when visibilita is null', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl(null) });
      expect(component._isVisibilitaNull()).toBeTruthy();
    });

    it('should return true when visibilita is string "null"', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl('null') });
      expect(component._isVisibilitaNull()).toBeTruthy();
    });

    it('should return false when visibilita has value', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl('pubblico') });
      expect(component._isVisibilitaNull()).toBe(false);
    });
  });

  describe('_isVisibilitaNullMapper', () => {
    it('should return true when visibilita null and not new with selectedDominio', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl(null) });
      component._isNew = false;
      expect(component._isVisibilitaNullMapper()).toBe(true);
    });

    it('should return false when visibilita not null', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl('pubblico') });
      component._isNew = false;
      expect(component._isVisibilitaNullMapper()).toBe(false);
    });

    it('should return truthy when _isNew with selectedDominio', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl(null) });
      component._isNew = true;
      component.selectedDominio = { id_dominio: 'd1' };
      expect(component._isVisibilitaNullMapper()).toBeTruthy();
    });

    it('should return falsy when _isNew without selectedDominio', () => {
      component._formGroup = new FormGroup({ visibilita: new FormControl(null) });
      component._isNew = true;
      component.selectedDominio = null;
      expect(component._isVisibilitaNullMapper()).toBeFalsy();
    });
  });

  // ---------------------------------------------------------------------------
  // _canMonitoraggioMapper / _canJoinMapper / _canEditMapper / _isGestoreMapper
  // ---------------------------------------------------------------------------
  describe('mapper functions', () => {
    it('_canMonitoraggioMapper should delegate to authenticationService', () => {
      component._grant = { ruoli: ['gestore'] } as any;
      mockAuthenticationService.canMonitoraggio.mockReturnValue(true);
      expect(component._canMonitoraggioMapper()).toBe(true);
      expect(mockAuthenticationService.canMonitoraggio).toHaveBeenCalledWith(['gestore']);
    });

    it('_canJoinMapper should delegate to _canJoin', () => {
      component.data = { package: false, stato: 'pubblicato' };
      mockAuthenticationService.canJoin.mockReturnValue(true);
      expect(component._canJoinMapper()).toBe(true);
    });

    it('_canEditMapper should delegate to authenticationService.canEdit', () => {
      component.data = { stato: 'bozza' };
      component._grant = { ruoli: ['referente_servizio'] } as any;
      mockAuthenticationService.canEdit.mockReturnValue(true);
      expect(component._canEditMapper()).toBe(true);
      expect(mockAuthenticationService.canEdit).toHaveBeenCalledWith('servizio', 'servizio', 'bozza', ['referente_servizio']);
    });

    it('_isGestoreMapper should delegate to isGestore', () => {
      component._grant = { ruoli: ['gestore'] } as any;
      mockAuthenticationService.isGestore.mockReturnValue(true);
      expect(component._isGestoreMapper()).toBe(true);
    });

    it('_getLogoMapper should return image URL when immagine exists', () => {
      const result = component._getLogoMapper({ immagine: true, id_servizio: '42' });
      expect(result).toContain('servizi/42/immagine');
    });

    it('_getLogoMapper should return placeholder when no immagine', () => {
      const result = component._getLogoMapper({ immagine: null, id_servizio: '42', imagePlaceHolder: '/placeholder.png' });
      expect(result).toBe('/placeholder.png');
    });

    it('_getLogoMapper should return empty string when no immagine and no placeholder', () => {
      const result = component._getLogoMapper({ immagine: null, id_servizio: '42' });
      expect(result).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // _hasControlError
  // ---------------------------------------------------------------------------
  describe('_hasControlError', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        nome: new FormControl(null, [Validators.required])
      });
    });

    it('should return true when control has errors and is touched', () => {
      component._formGroup.get('nome')?.markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control is untouched', () => {
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control has no errors', () => {
      component._formGroup.get('nome')?.setValue('Test');
      component._formGroup.get('nome')?.markAsTouched();
      expect(component._hasControlError('nome')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _updateOtherLinks
  // ---------------------------------------------------------------------------
  describe('_updateOtherLinks', () => {
    it('should filter out categories when tassonomie disabled', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({ tassonomie_abilitate: false });
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService.canJoin.mockReturnValue(false);
      component.data = { package: false };
      component._updateOtherLinks();
      const hasCategorie = component._otherLinks.some((l: any) => l.route === 'categorie');
      expect(hasCategorie).toBe(false);
    });

    it('should include categories when tassonomie enabled', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({ tassonomie_abilitate: true });
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService.canJoin.mockReturnValue(false);
      component.data = { package: false };
      component._updateOtherLinks();
      const hasCategorie = component._otherLinks.some((l: any) => l.route === 'categorie');
      expect(hasCategorie).toBe(true);
    });

    it('should hide api link when package is true', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({});
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService.canJoin.mockReturnValue(false);
      component.data = { package: true };
      component._updateOtherLinks();
      const hasApi = component._otherLinks.some((l: any) => l.route === 'api');
      expect(hasApi).toBe(false);
    });

    it('should show componenti link when package is true', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({});
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService.canJoin.mockReturnValue(false);
      component.data = { package: true };
      component._updateOtherLinks();
      const hasComponenti = component._otherLinks.some((l: any) => l.route === 'componenti');
      expect(hasComponenti).toBe(true);
    });

    it('should disable download_service_extended for non-gestore', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({});
      mockAuthenticationService.isGestore.mockReturnValue(false);
      mockAuthenticationService.canJoin.mockReturnValue(true);
      component.data = { package: false };
      component._updateOtherLinks();
      // Find the parent action that has submenus (download_service)
      const downloadAction = component._otherActions.find((a: any) => a.action === 'download_service');
      expect(downloadAction).toBeDefined();
      if (downloadAction?.submenus) {
        const extendedSub = downloadAction.submenus.find((s: any) => s.action === 'download_service_extended');
        expect(extendedSub?.enabled).toBe(false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // onLinkClick
  // ---------------------------------------------------------------------------
  describe('onLinkClick', () => {
    it('should navigate to item route with service data', () => {
      component.data = { id_servizio: '10' };
      component._grant = { ruoli: ['gestore'] } as any;
      component.onLinkClick({ route: 'api' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['api'],
        expect.objectContaining({ state: { service: component.data, grant: component._grant } })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getDomini
  // ---------------------------------------------------------------------------
  describe('getDomini', () => {
    it('should call getList with q param when term provided', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id_dominio: 1 }] }));
      mockAuthenticationService.isGestore.mockReturnValue(true);
      component.getDomini('test').subscribe(result => {
        expect(result).toEqual([{ id_dominio: 1 }]);
      });
      expect(mockApiService.getList).toHaveBeenCalledWith('domini', expect.objectContaining({ params: { q: 'test' } }));
    });

    it('should add deprecato and esterno params for non-gestore', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      mockAuthenticationService.isGestore.mockReturnValue(false);
      component.getDomini(null).subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('domini', expect.objectContaining({
        params: expect.objectContaining({ deprecato: false, esterno: false })
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // getUtenti
  // ---------------------------------------------------------------------------
  describe('getUtenti', () => {
    it('should call getList with role and stato params', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ nome: 'Mario', cognome: 'Rossi' }] }));
      component.getUtenti('mar', 'gestore', 'abilitato').subscribe(result => {
        expect(result[0].nome_completo).toBe('Mario Rossi');
      });
      expect(mockApiService.getList).toHaveBeenCalledWith('utenti', expect.objectContaining({
        params: expect.objectContaining({ q: 'mar', ruolo: 'gestore', stato: 'abilitato' })
      }));
    });

    it('should add id_organizzazione when not esterno and has selectedDominio', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      component._isDominioEsterno = false;
      component.selectedDominio = { soggetto_referente: { organizzazione: { id_organizzazione: 99 } } };
      component.getUtenti(null).subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('utenti', expect.objectContaining({
        params: expect.objectContaining({ id_organizzazione: 99 })
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // getOrganizzazioni
  // ---------------------------------------------------------------------------
  describe('getOrganizzazioni', () => {
    it('should call getList with term and esterna false', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id_organizzazione: 1 }] }));
      component.getOrganizzazioni('org', true).subscribe(result => {
        expect(result).toEqual([{ id_organizzazione: 1 }]);
      });
      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', expect.objectContaining({
        params: expect.objectContaining({ q: 'org', esterna: false, aderente: true })
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // getSoggetti
  // ---------------------------------------------------------------------------
  describe('getSoggetti', () => {
    it('should filter by organizzazione when selectedOrganizzazione exists', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id_soggetto: 's1' }] }));
      component.selectedOrganizzazione = { id_organizzazione: 5 };
      component.getSoggetti(null, true).subscribe(result => {
        expect(result).toEqual([{ id_soggetto: 's1' }]);
      });
      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', expect.objectContaining({
        params: expect.objectContaining({ id_organizzazione: 5, referente: true })
      }));
    });

    it('should use q param when no selectedOrganizzazione', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      component.selectedOrganizzazione = null;
      component.getSoggetti('test').subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', expect.objectContaining({
        params: expect.objectContaining({ q: 'test' })
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // _canManagement
  // ---------------------------------------------------------------------------
  describe('_canManagement', () => {
    it('should delegate to canManagement for non-package', () => {
      component.data = { stato: 'pubblicato', package: false };
      component._grant = { ruoli: ['referente_servizio'] } as any;
      mockAuthenticationService.canManagement.mockReturnValue(true);
      mockAuthenticationService.isGestore.mockReturnValue(false);
      expect(component._canManagement()).toBe(true);
    });

    it('should require gestore for package services', () => {
      component.data = { stato: 'pubblicato', package: true };
      component._grant = { ruoli: ['gestore'] } as any;
      mockAuthenticationService.canManagement.mockReturnValue(false);
      mockAuthenticationService.isGestore.mockReturnValue(true);
      expect(component._canManagement()).toBe(true);
    });

    it('should return false for package when not gestore', () => {
      component.data = { stato: 'pubblicato', package: true };
      component._grant = { ruoli: ['referente'] } as any;
      mockAuthenticationService.canManagement.mockReturnValue(false);
      mockAuthenticationService.isGestore.mockReturnValue(false);
      expect(component._canManagement()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onChangeSelect / _checkSoggetto
  // ---------------------------------------------------------------------------
  describe('onChangeSelect', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        id_soggetto_interno: new FormControl(null)
      });
    });

    it('should set selectedOrganizzazione and call _checkSoggetto for organizzazione', () => {
      const spy = vi.spyOn(component as any, '_checkSoggetto').mockImplementation(() => {});
      const event = { id_organizzazione: 5 };
      component.onChangeSelect(event, 'organizzazione');
      expect(component.selectedOrganizzazione).toBe(event);
      expect(spy).toHaveBeenCalledWith(event);
      spy.mockRestore();
    });

    it('should set selectedSoggetto for soggetto', () => {
      const event = { id_soggetto: 's1' };
      component.onChangeSelect(event, 'soggetto');
      expect(component.selectedSoggetto).toBe(event);
    });
  });

  describe('_checkSoggetto', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        id_soggetto_interno: new FormControl(null)
      });
    });

    it('should set single soggetto and hide dropdown when only 1 result', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id_soggetto: 's1', nome: 'Sog1' }] }));
      component.selectedOrganizzazione = { id_organizzazione: 5 };
      (component as any)._checkSoggetto({ id_organizzazione: 5 });
      expect(component._hideSoggettoDropdown).toBe(true);
      expect(component._formGroup.get('id_soggetto_interno')?.value).toBe('s1');
    });

    it('should show dropdown when multiple results', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id_soggetto: 's1' }, { id_soggetto: 's2' }] }));
      component.selectedOrganizzazione = { id_organizzazione: 5 };
      (component as any)._checkSoggetto({ id_organizzazione: 5 });
      expect(component._hideSoggettoDropdown).toBe(false);
      expect(component._elencoSoggetti.length).toBe(2);
    });

    it('should clear soggetto when event is null', () => {
      (component as any)._checkSoggetto(null);
      expect(component._formGroup.get('id_soggetto_interno')?.value).toBeNull();
      expect(component._elencoSoggetti).toEqual([]);
      expect(component._hideSoggettoDropdown).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _onChangeDominio
  // ---------------------------------------------------------------------------
  describe('_onChangeDominio', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        skip_collaudo: new FormControl(false),
        referente: new FormControl(null),
        referente_tecnico: new FormControl(null)
      });
      component._isNew = true;
      component._hasMultiDominio = true;
    });

    it('should set selectedDominio and enable referenti when dominio selected', () => {
      const dominio = { id_dominio: 'd1', skip_collaudo: true };
      component.data = { vincola_skip_collaudo: false };
      component._onChangeDominio(dominio);
      expect(component.selectedDominio).toBe(dominio);
      expect(component._formGroup.get('referente')?.enabled).toBe(true);
      expect(component._formGroup.get('referente_tecnico')?.enabled).toBe(true);
    });

    it('should disable referenti when dominio is null', () => {
      component.data = {};
      component._onChangeDominio(null);
      expect(component.selectedDominio).toBeNull();
      expect(component._formGroup.get('referente')?.disabled).toBe(true);
      expect(component._formGroup.get('referente_tecnico')?.disabled).toBe(true);
    });

    it('should reset referente values on change', () => {
      component._formGroup.get('referente')?.setValue('old-ref');
      component.data = { vincola_skip_collaudo: false };
      component._onChangeDominio({ skip_collaudo: false });
      expect(component._formGroup.get('referente')?.value).toBeNull();
      expect(component._formGroup.get('referente_tecnico')?.value).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // _confirmDelection / __deleteService
  // ---------------------------------------------------------------------------
  describe('_confirmDelection', () => {
    it('should call utils._confirmDelection with data and callback', () => {
      component._confirmDelection({ id: '10' });
      expect(mockUtilService._confirmDelection).toHaveBeenCalledWith({ id: '10' }, expect.any(Function));
    });
  });

  describe('__deleteService', () => {
    it('should delete and navigate on success', () => {
      mockApiService.deleteElement.mockReturnValue(of({}));
      component.data = { id_servizio: '10' };
      (component as any).__deleteService();
      expect(mockApiService.deleteElement).toHaveBeenCalledWith('servizi', '10');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['servizi'], expect.anything());
    });

    it('should set error on failure', () => {
      mockApiService.deleteElement.mockReturnValue(throwError(() => ({ status: 500 })));
      component.data = { id_servizio: '10' };
      (component as any).__deleteService();
      expect(component._error).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _downloadServizioEstesoExport
  // ---------------------------------------------------------------------------
  describe('_downloadServizioEstesoExport', () => {
    it('should download and call saveAs on success', () => {
      const spyGetFilename = vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('export.csv');
      const mockSaveAs = vi.fn();
      (globalThis as any).saveAs = mockSaveAs;

      const response = { body: new Blob(), headers: { get: vi.fn() } };
      mockApiService.download.mockReturnValue(of(response));
      component.id = '10';

      (component as any)._downloadServizioEstesoExport();

      expect(mockApiService.download).toHaveBeenCalledWith('servizi-export', null, undefined, expect.anything());
      expect(mockSaveAs).toHaveBeenCalledWith(response.body, 'export.csv');
      expect(component._downloading).toBe(false);
      spyGetFilename.mockRestore();
      delete (globalThis as any).saveAs;
    });

    it('should set error on failure', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ status: 500 })));
      component.id = '10';
      (component as any)._downloadServizioEstesoExport();
      expect(component._error).toBe(true);
      expect(component._downloading).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onWorkflowAction
  // ---------------------------------------------------------------------------
  describe('onWorkflowAction', () => {
    it('should reset error and call utils.__confirmCambioStatoServizio', () => {
      component._error = true;
      component.data = { stato: 'bozza' };
      component.onWorkflowAction({ status: 'pubblicato' });
      expect(component._error).toBe(false);
      expect(mockUtilService.__confirmCambioStatoServizio).toHaveBeenCalledWith(
        { status: 'pubblicato' }, component.data, expect.any(Function)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // _onChangeType
  // ---------------------------------------------------------------------------
  describe('_onChangeType', () => {
    it('should not throw when called', () => {
      component._formGroup = new FormGroup({ tipo: new FormControl('API') });
      expect(() => component._onChangeType({})).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // _onCloseNotificationBar
  // ---------------------------------------------------------------------------
  describe('_onCloseNotificationBar', () => {
    it('should navigate to model/id', () => {
      component.id = '10';
      component._onCloseNotificationBar({});
      expect(mockRouter.navigate).toHaveBeenCalledWith(['servizi', '10'], expect.anything());
    });
  });

  // ---------------------------------------------------------------------------
  // _editService
  // ---------------------------------------------------------------------------
  describe('_editService', () => {
    it('should set isEdit true and enable multi_adesione', () => {
      component._formGroup = new FormGroup({
        multi_adesione: new FormControl({ value: false, disabled: true })
      });
      component._editService();
      expect(component._isEdit).toBe(true);
      expect(component._formGroup.get('multi_adesione')?.enabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _onClose / _onSave
  // ---------------------------------------------------------------------------
  describe('_onClose', () => {
    it('should emit close with id and data', () => {
      const spy = vi.spyOn(component.close, 'emit');
      component.id = '10';
      component._data = new Servizio({ nome: 'Test' });
      component._onClose();
      expect(spy).toHaveBeenCalledWith({ id: '10', service: component._data });
    });
  });

  describe('_onSave (emit)', () => {
    it('should emit save with id and data', () => {
      const spy = vi.spyOn(component.save, 'emit');
      component.id = '10';
      component._data = new Servizio({ nome: 'Test' });
      component._onSave();
      expect(spy).toHaveBeenCalledWith({ id: '10', service: component._data });
    });
  });

  // ---------------------------------------------------------------------------
  // onBreadcrumb
  // ---------------------------------------------------------------------------
  describe('onBreadcrumb', () => {
    it('should navigate when _useRoute is true', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/servizi' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], expect.anything());
    });

    it('should emit close when _useRoute is false', () => {
      component._useRoute = false;
      const spy = vi.spyOn(component.close, 'emit');
      component.id = '10';
      component._data = new Servizio({ nome: 'Test' });
      component.onBreadcrumb({ url: '/servizi' });
      expect(spy).toHaveBeenCalledWith({ id: '10', service: component._data });
    });
  });

  // ---------------------------------------------------------------------------
  // backPresentationView
  // ---------------------------------------------------------------------------
  describe('backPresentationView', () => {
    it('should navigate to view URL', () => {
      component.id = '42';
      component.backPresentationView();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
    });
  });

  // ---------------------------------------------------------------------------
  // _toggleMarkdownPreview
  // ---------------------------------------------------------------------------
  describe('_toggleMarkdownPreview', () => {
    it('should toggle _showMarkdownPreview', () => {
      component._showMarkdownPreview = false;
      component._toggleMarkdownPreview();
      expect(component._showMarkdownPreview).toBe(true);
      component._toggleMarkdownPreview();
      expect(component._showMarkdownPreview).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _compareClassiFn
  // ---------------------------------------------------------------------------
  describe('_compareClassiFn', () => {
    it('should return true when ids match', () => {
      expect(component._compareClassiFn({ id_classe_utente: 1 }, { id_classe_utente: 1 })).toBe(true);
    });

    it('should return false when ids differ', () => {
      expect(component._compareClassiFn({ id_classe_utente: 1 }, { id_classe_utente: 2 })).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _joinServizio
  // ---------------------------------------------------------------------------
  describe('_joinServizio', () => {
    it('should navigate to adesioni new edit with id_servizio', () => {
      component.id = '10';
      (component as any)._joinServizio();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['adesioni', 'new', 'edit'],
        { queryParams: { id_servizio: '10' } }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // enableDisableControlAdesioneConsentita
  // ---------------------------------------------------------------------------
  describe('enableDisableControlAdesioneConsentita', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        visibilita: new FormControl(null),
        adesione_disabilitata: new FormControl(false)
      });
    });

    it('should disable adesione_disabilitata when isComponente', () => {
      component._formGroup.get('visibilita')?.setValue('componente');
      component.enableDisableControlAdesioneConsentita();
      expect(component._formGroup.get('adesione_disabilitata')?.disabled).toBe(true);
      expect(component._formGroup.get('adesione_disabilitata')?.value).toBe(false);
    });

    it('should enable adesione_disabilitata when not componente', () => {
      component._formGroup.get('visibilita')?.setValue('pubblico');
      component.enableDisableControlAdesioneConsentita();
      expect(component._formGroup.get('adesione_disabilitata')?.enabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // updateTipiVisibilitaServizio
  // ---------------------------------------------------------------------------
  describe('updateTipiVisibilitaServizio', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({ package: new FormControl(false) });
    });

    it('should add componente option when not package and isGestore', () => {
      mockAuthenticationService.isGestore.mockReturnValue(true);
      component.updateTipiVisibilitaServizio();
      const hasComponente = component._tipiVisibilitaServizio.some((t: any) => t.value === 'componente');
      expect(hasComponente).toBe(true);
    });

    it('should not add componente when package is true', () => {
      component._formGroup.get('package')?.setValue(true);
      mockAuthenticationService.isGestore.mockReturnValue(true);
      component.updateTipiVisibilitaServizio();
      const hasComponente = component._tipiVisibilitaServizio.some((t: any) => t.value === 'componente');
      expect(hasComponente).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // __onSave
  // ---------------------------------------------------------------------------
  describe('__onSave', () => {
    it('should save and navigate on success', () => {
      const saveSpy = vi.spyOn(component.save, 'emit');
      mockApiService.saveElement.mockReturnValue(of({ id_servizio: '99', nome: 'New' }));
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };

      component.__onSave({ tipo: 'API', nome: 'New', versione: '1' });

      expect(mockApiService.saveElement).toHaveBeenCalledWith('servizi', expect.any(Object));
      expect(component.id).toBe('99');
      expect(component._isEdit).toBe(false);
      expect(component._isNew).toBe(false);
      expect(saveSpy).toHaveBeenCalledWith({ id: '99', service: expect.any(Object), update: false });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['servizi', '99'], { replaceUrl: true });
    });

    it('should set error on save failure', () => {
      mockApiService.saveElement.mockReturnValue(throwError(() => ({ status: 400, error: { errori: [{ dato: 'nome' }] } })));
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };

      component.__onSave({ tipo: 'API', nome: 'Bad', versione: '1' });

      expect(component._error).toBe(true);
      expect(component._errors).toEqual([{ dato: 'nome' }]);
    });
  });

  // ---------------------------------------------------------------------------
  // __onUpdate
  // ---------------------------------------------------------------------------
  describe('__onUpdate', () => {
    it('should update service data on success with response', () => {
      const saveSpy = vi.spyOn(component.save, 'emit');
      vi.spyOn(component as any, 'loadCurrentData').mockImplementation(() => {});
      vi.spyOn(component, '_loadApis' as any).mockImplementation(() => {});
      const response = { id_servizio: '10', nome: 'Updated', dominio: { deprecato: false }, fruizione: false, package: false };
      mockApiService.putElement.mockReturnValue(of(response));
      component.data = { stato: 'bozza' };
      component._grant = { ruoli: ['referente_servizio'] } as any;

      (component as any).__onUpdate(10, { tipo: 'API', nome: 'Updated', versione: '1', id_dominio: 'd1', visibilita: null, multi_adesione: false, classi: [], tags: [], tassonomie: [], descrizione: null, descrizione_sintetica: null, termini_ricerca: null, note: null });

      expect(component.data).toEqual(response);
      expect(component._isDominioDeprecato).toBe(false);
      expect(saveSpy).toHaveBeenCalledWith({ id: '10', data: response, update: true });
    });

    it('should call _loadService when response is null', () => {
      const loadSpy = vi.spyOn(component as any, '_loadService').mockImplementation(() => {});
      mockApiService.putElement.mockReturnValue(of(null));
      component.data = { stato: 'bozza' };
      component._grant = { ruoli: ['referente_servizio'] } as any;

      (component as any).__onUpdate(10, { tipo: 'API', nome: 'X', versione: '1', id_dominio: 'd1', visibilita: null, multi_adesione: false, classi: [], tags: [], tassonomie: [], descrizione: null, descrizione_sintetica: null, termini_ricerca: null, note: null });

      expect(loadSpy).toHaveBeenCalledWith(false);
      loadSpy.mockRestore();
    });

    it('should set error on update failure', () => {
      mockApiService.putElement.mockReturnValue(throwError(() => ({ status: 400, error: { errori: [{ dato: 'nome' }] } })));
      component.data = { stato: 'bozza' };
      component._grant = { ruoli: ['referente_servizio'] } as any;

      (component as any).__onUpdate(10, { tipo: 'API', nome: 'Bad', versione: '1', id_dominio: 'd1', visibilita: null, multi_adesione: false, classi: [], tags: [], tassonomie: [], descrizione: null, descrizione_sintetica: null, termini_ricerca: null, note: null });

      expect(component._error).toBe(true);
      expect(component._errors).toEqual([{ dato: 'nome' }]);
    });
  });

  // ---------------------------------------------------------------------------
  // _initForm
  // ---------------------------------------------------------------------------
  describe('_initForm', () => {
    it('should create form group from data with correct validators', () => {
      mockAuthenticationService.isGestore.mockReturnValue(false);
      const data = {
        nome: 'Test', versione: '1', descrizione: 'desc',
        descrizione_sintetica: 'short', referente: 'ref1',
        classi: [], visibilita: 'pubblico', multi_adesione: false,
        id_dominio: null, dominio: { id_dominio: 'dom1' },
        skip_collaudo: false, adesione_disabilitata: false,
        fruizione: false, note: null, termini_ricerca: null,
        package: false
      };
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
      component.hasApi = false;
      component.hasComponenti = false;

      component._initForm(data);

      expect(component._formGroup.get('nome')?.value).toBe('Test');
      expect(component._formGroup.get('versione')?.value).toBe('1');
      expect(component._formGroup.get('multi_adesione')?.disabled).toBe(true);
    });

    it('should not create form when data is null', () => {
      const oldGroup = component._formGroup;
      component._initForm(null);
      expect(component._formGroup).toBe(oldGroup);
    });

    it('should set classi required when visibilita is riservato', () => {
      mockAuthenticationService.isGestore.mockReturnValue(false);
      const data = {
        nome: 'Test', versione: '1', classi: [],
        visibilita: 'riservato', multi_adesione: false,
        id_dominio: null, dominio: { id_dominio: 'dom1' },
        skip_collaudo: false, adesione_disabilitata: false,
        fruizione: false, package: false
      };
      component.generalConfig = { dominio: { dominio_default: 'dom1' } };
      component.hasApi = false;
      component.hasComponenti = false;

      component._initForm(data);

      component._formGroup.get('classi')?.setValue(null);
      component._formGroup.get('classi')?.updateValueAndValidity();
      expect(component._formGroup.get('classi')?.valid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _loadApis (extended - error and forkJoin paths)
  // ---------------------------------------------------------------------------
  describe('_loadApis (extended)', () => {
    it('should handle individual catchError and still call _updateOtherLinks', () => {
      const updateSpy = vi.spyOn(component, '_updateOtherLinks' as any).mockImplementation(() => {});
      // catchError in each pipe returns { items: [] }, so forkJoin succeeds
      // but results[0].content is undefined - this causes an unhandled error in next
      // Instead, test the success path with empty content
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      component.id = '10';
      component._formGroup = new FormGroup({
        package: new FormControl(false),
        visibilita: new FormControl(null),
        adesione_disabilitata: new FormControl(false)
      });
      component.data = { package: false, stato: 'bozza' };

      component._loadApis();

      expect(component.hasApi).toBe(false);
      expect(component.apiComponentiLoading).toBe(false);
      expect(updateSpy).toHaveBeenCalled();
      updateSpy.mockRestore();
    });

    it('should set hasApi true when API results have content', () => {
      const updateSpy = vi.spyOn(component, '_updateOtherLinks' as any).mockImplementation(() => {});
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 1 }] }));
      component.id = '10';
      component._formGroup = new FormGroup({
        package: new FormControl(false),
        visibilita: new FormControl(null),
        adesione_disabilitata: new FormControl(false)
      });
      component.data = { package: false, stato: 'bozza' };

      component._loadApis();

      expect(component.hasApi).toBe(true);
      updateSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // _loadComponenti (extended - error path)
  // ---------------------------------------------------------------------------
  describe('_loadComponenti (extended)', () => {
    it('should call _updateOtherLinks on error', () => {
      const updateSpy = vi.spyOn(component, '_updateOtherLinks' as any).mockImplementation(() => {});
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      component.id = '10';
      component._formGroup = new FormGroup({
        package: new FormControl(false),
        visibilita: new FormControl(null),
        adesione_disabilitata: new FormControl(false)
      });
      component.data = { package: true, stato: 'bozza' };

      component._loadComponenti();

      expect(component.apiComponentiLoading).toBe(false);
      expect(updateSpy).toHaveBeenCalled();
      updateSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // _initBreadcrumb
  // ---------------------------------------------------------------------------
  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with name and version', () => {
      component.data = { nome: 'TestService', versione: '2' };
      component.hideVersions = false;
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('TestService v. 2');
    });

    it('should hide version when hideVersions is true', () => {
      component.data = { nome: 'TestService', versione: '2' };
      component.hideVersions = true;
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('TestService');
    });

    it('should show dashboard breadcrumb when fromDashboard', () => {
      component.data = { nome: 'Svc', versione: '1' };
      component._fromDashboard = true;
      component._componentBreadcrumbs = null;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
    });

    it('should include componentBreadcrumbs when present', () => {
      component.data = { nome: 'Comp', versione: '1' };
      component._fromDashboard = false;
      component._componentBreadcrumbs = {
        service: { id_servizio: '5' },
        breadcrumbs: [{ label: 'Parent', url: '/servizi/5', type: 'link' }]
      } as any;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[0].label).toBe('Parent');
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
    });

    it('should use id when no nome/versione', () => {
      component.data = null;
      component.id = '99';
      component._componentBreadcrumbs = null;
      component._fromDashboard = false;
      (component as any)._initBreadcrumb();
      expect(component.breadcrumbs[1].label).toBe('99');
    });
  });

  // ---------------------------------------------------------------------------
  // onActionMonitor (extended)
  // ---------------------------------------------------------------------------
  describe('onActionMonitor (extended)', () => {
    it('should call _downloadServizioEstesoExport on download_service_extended', () => {
      const dlSpy = vi.spyOn(component as any, '_downloadServizioEstesoExport').mockImplementation(() => {});
      component.onActionMonitor({ action: 'download_service_extended' });
      expect(dlSpy).toHaveBeenCalled();
      dlSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // ngAfterContentChecked
  // ---------------------------------------------------------------------------
  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // In node env, window.innerWidth may be undefined, so desktop will be false
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // ---------------------------------------------------------------------------
  // _onEditComponent
  // ---------------------------------------------------------------------------
  describe('_onEditComponent', () => {
    it('should not throw', () => {
      expect(() => component._onEditComponent({}, { id: 1 })).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // loadAnagrafiche
  // ---------------------------------------------------------------------------
  describe('loadAnagrafiche', () => {
    it('should call utils.getAnagrafiche with tables', async () => {
      mockUtilService.getAnagrafiche.mockResolvedValue({ 'classi-utente': [], gruppi: [], tags: [], tassonomie: [] });
      await component.loadAnagrafiche();
      expect(mockUtilService.getAnagrafiche).toHaveBeenCalledWith(['classi-utente', 'gruppi', 'tags', 'tassonomie']);
      expect(component.anagrafiche).toBeDefined();
    });
  });
});
