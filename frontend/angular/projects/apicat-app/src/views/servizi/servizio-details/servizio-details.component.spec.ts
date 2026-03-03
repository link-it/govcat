import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Tools } from '@linkit/components';
import { ServizioDetailsComponent } from './servizio-details.component';
import { Servizio } from './servizio';

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
});
